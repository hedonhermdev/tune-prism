use fraction::{Fraction, ToPrimitive};

use rand::Rng;
use serde::Deserialize;
use snafu::{whatever, ResultExt};
use tch::{nn::ModuleT, CModule, Device, IndexOp, Tensor};

use std::{
    cmp::{max, min},
    fs::File,
    ops::AddAssign,
    path::Path,
};

use super::error::{Result, TorchSnafu};

#[derive(Debug, Clone, Deserialize)]
pub struct ModelConfig {
    pub sample_rate: usize,
    pub sources: Vec<String>,
    pub channels: usize,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ModelInfo {
    pub(crate) name: String,
    pub(crate) config: ModelConfig,
}

#[derive(Debug)]
pub struct Demucs {
    pub module: CModule,
    pub config: ModelConfig,
    pub device: Device,
}

pub fn models(path: &Path) -> Result<Vec<ModelInfo>> {
    let models_json = whatever!(File::open(path), "failed to read models.json");

    let models: Vec<ModelInfo> = whatever!(
        serde_json::from_reader(models_json),
        "failed to read models.json"
    );

    Ok(models)
}

pub fn find_model(models: Vec<ModelInfo>, name: &str) -> Option<ModelInfo> {
    models.iter().find(|m| m.name == name).cloned()
}

impl Demucs {
    pub fn init(path: &Path, info: &ModelInfo, device: Device) -> Result<Self> {
        let config = info.config.clone();

        let mut module = CModule::load(path).context(TorchSnafu)?;

        module.to(device, tch::Kind::Float, false);

        Ok(Self {
            config,
            module,
            device,
        })
    }

    pub fn apply(&self, input: Tensor) -> Tensor {
        assert_eq!(
            input.dim(),
            3,
            "expected input to be a 3 dimensional tensor"
        );

        let input = input.to(self.device);

        self._apply(
            TensorChunk::new(&input, 0, None),
            ApplyArgs {
                shifts: 1,
                split: true,
                overlap: 0.25,
                transition_power: 1.0,
                device: self.device,
                segment: Fraction::new(39u64, 5u64),
            },
        )
    }

    fn _apply(&self, input: TensorChunk, mut args: ApplyArgs) -> Tensor {
        let shape = input.size();
        let batch = shape[0];
        let channels = shape[1];
        let length = shape[2];
        let kind = input.tensor.kind();
        let device = input.tensor.device();

        assert_eq!(channels, self.config.channels as i64);

        if args.shifts > 0 {
            let _out = Tensor::zeros(input.size(), (kind, device));
            let shifts = args.shifts;

            args.shifts = 0;

            let max_shift = (self.config.sample_rate / 2) as i64;

            let padded = input.padded(length + 2 * max_shift);

            let mut out = Tensor::zeros(
                [batch, self.config.sources.len() as i64, channels, length],
                (kind, device),
            );
            for _ in 0..shifts {
                let offset = rand::thread_rng().gen_range(0..max_shift);
                let shifted = TensorChunk::new(&padded, offset, Some(length + max_shift - offset));
                let shifted_out = self._apply(shifted, args.clone());

                out += shifted_out.i((.., .., .., (max_shift - offset)..));
            }

            out /= shifts as f32;

            out
        } else if args.split {
            args.split = false;

            let mut out = Tensor::zeros(
                [batch, self.config.sources.len() as i64, channels, length],
                (kind, device),
            );
            let sum_weight = Tensor::zeros(length, (kind, device));
            let segment_length = (Fraction::new(self.config.sample_rate as u64, 1u64)
                * args.segment)
                .to_f32()
                .unwrap()
                .round() as i64;

            let stride = ((1.0 - args.overlap) * segment_length as f32) as usize;
            let offsets = (0..length).step_by(stride);
            let _scale = stride as f32 / self.config.sample_rate as f32;
            let weight = Tensor::cat(
                &[
                    Tensor::arange_start(1, segment_length / 2 + 1, (kind, device)),
                    Tensor::arange_start_step(
                        segment_length - segment_length / 2,
                        0,
                        -1,
                        (kind, device),
                    ),
                ],
                0,
            );

            assert_eq!(weight.size1().unwrap(), segment_length);

            let weight_max = weight.max();
            let weight = (weight / weight_max).pow_tensor_scalar(args.transition_power);

            for offset in offsets {
                let chunk = TensorChunk::from_chunk(input, offset, Some(segment_length));
                let chunk_out = self._apply(chunk, args.clone());
                let chunk_length = chunk_out.size().pop().unwrap();

                out.i((.., .., .., offset..offset + chunk_length))
                    .add_assign(weight.i(..chunk_length) * chunk_out);

                sum_weight
                    .i(offset..offset + chunk_length)
                    .add_assign(weight.i(..chunk_length));
            }

            let sum_weight_min: f32 = sum_weight.min().try_into().unwrap();

            assert!(sum_weight_min > 0.0);

            out /= sum_weight;
            out
        } else {
            let valid_length =
                (args.segment.to_f32().unwrap() * self.config.sample_rate as f32).round() as i64;

            let input = input.padded(valid_length);

            let out = tch::no_grad(|| self.module.forward_t(&input, false));

            let out = center_trim(out, length);
            dbg!(out.size());

            out
        }
    }
}

#[derive(Debug, Clone)]
pub struct ApplyArgs {
    pub shifts: usize,
    pub split: bool,
    pub overlap: f32,
    pub transition_power: f64,
    pub device: Device,
    pub segment: Fraction,
}

#[derive(Clone, Copy, Debug)]
struct TensorChunk<'a> {
    tensor: &'a Tensor,
    offset: i64,
    length: i64,
}

impl<'a> TensorChunk<'a> {
    fn new(tensor: &'a Tensor, offset: i64, length: Option<i64>) -> Self {
        let total_length = tensor.size().pop().expect("got tensor with 0 dimension");

        assert!(
            offset < total_length,
            "offset cannot be greater than the length of the tensor"
        );

        let length = length.map_or_else(
            || total_length - offset,
            |length| min(total_length - offset, length),
        );

        Self {
            tensor,
            length,
            offset,
        }
    }

    fn from_chunk(chunk: TensorChunk<'a>, offset: i64, length: Option<i64>) -> Self {
        let total_length = chunk
            .size()
            .pop()
            .expect("got TensorChunk with 0 dimension");

        assert!(
            offset < total_length,
            "offset cannot be greater than the length of the tensor"
        );

        let length = match length {
            Some(length) => min(total_length - offset, length),
            None => total_length - offset,
        };

        let tensor = chunk.tensor;
        let offset = chunk.offset + offset;

        Self {
            tensor,
            length,
            offset,
        }
    }

    fn size(&self) -> Vec<i64> {
        let mut size = self.tensor.size();
        let length = size.last_mut().unwrap();

        *length = self.length;

        size
    }

    fn padded(&self, target_length: i64) -> Tensor {
        let delta = target_length - self.length;
        let total_length = self.tensor.size().pop().unwrap();

        assert!(delta >= 0);

        let start = self.offset - delta / 2;
        let end = start + target_length;

        let correct_start = max(0, start);
        let correct_end = min(total_length, end);

        let pad_left = correct_start - start;
        let pad_right = end - correct_end;

        

        self
            .tensor
            .i((.., .., correct_start..correct_end))
            .f_pad([pad_left, pad_right], "constant", None)
            .unwrap()
            .to(Device::Mps)
    }
}

impl<'a> From<&'a Tensor> for TensorChunk<'a> {
    fn from(value: &'a Tensor) -> Self {
        Self::new(value, 0, None)
    }
}

fn center_trim(t: Tensor, length: i64) -> Tensor {
    let size = t.size().pop().unwrap();

    let delta = size - length;

    assert!(delta >= 0);

    let start = delta / 2;
    let mut end = size - delta / 2;

    if (end - start) > length {
        end -= 1;
    }

    t.i((.., .., .., start..end))
}
