use std::{
    fs::File,
    io::Write,
    path::{Path, PathBuf},
};

pub mod audio;
pub mod error;
pub mod model;

use mime::{Mime, IMAGE, JPEG};
use ndarray::{Array2, ArrayD};

use rayon::prelude::*;
use snafu::{whatever, ResultExt};
use tch::{Device, IndexOp, Kind, Tensor};

use crate::demucs::{
    audio::{decode_file, encode_pcm_to_wav, resample, PcmAudioData},
    error::TorchSnafu,
};

pub use error::{Error, Result};
pub use model::{find_model, models, Demucs};

use self::error::{Id3Snafu, MimeParseSnafu};

pub fn get_available_device() -> Device {
    if tch::utils::has_mps() {
        Device::Mps
    } else if tch::utils::has_cuda() {
        Device::Cuda(0)
    } else {
        Device::Cpu
    }
}

pub fn split_track(model: &Demucs, input_path: &Path, output_dir: &Path) -> Result<Vec<PathBuf>> {
    // let model = &MODEL;
    let track = decode_file(input_path)?;
    let track = resample(track, model.config.sample_rate)?;

    let input_arr: ArrayD<f32> = Array2::from_shape_vec(
        (track.nb_channels, track.length),
        track.samples.into_iter().flatten().collect(),
    )
    .unwrap()
    .into_dyn();

    let mut input_tensor: Tensor = (&input_arr).try_into().context(TorchSnafu)?;

    let r = input_tensor.mean_dim(0, false, Kind::Float);

    input_tensor -= r.mean(Kind::Float);
    input_tensor /= r.std(true);

    let length = input_tensor.size().pop().unwrap();
    let input = input_tensor.reshape([1, 2, length]);

    let mut output = model.apply(input);

    output *= r.std(true);
    output += r.mean(None);

    // let output = Arc::new(output);

    model
        .config
        .sources
        .iter()
        .enumerate()
        .map(|(i, source)| {
            let mut buffer: Vec<Vec<f32>> = vec![vec![0.0; track.length]; model.config.channels];

            let out = output.i((0, i as i64));

            for i in 0..model.config.channels {
                out.i(i as i64).copy_data(&mut buffer[i], track.length);
            }
            (source, buffer)
        })
        .collect::<Vec<_>>()
        .into_par_iter()
        .map(|(source, buffer)| {
            let audio_data = PcmAudioData {
                samples: buffer,
                sample_rate: model.config.sample_rate,
                nb_channels: model.config.channels,
                length: track.length,
            };

            let mut stem = source.clone();
            stem.push_str(".wav");
            let path = output_dir.join(stem);

            encode_pcm_to_wav(audio_data, &path)?;

            Ok(path)
        })
        .collect::<Result<Vec<_>>>()
}

pub fn get_cover_image(path: &Path, output_dir: &Path) -> Result<Option<PathBuf>> {
    let tags = id3::Tag::read_from_path(path).context(Id3Snafu)?;

    let output = if let Some(image) = tags.pictures().next() {
        let mime: Mime = image.mime_type.parse().context(MimeParseSnafu)?;
        if mime.type_() == IMAGE && mime.subtype() == JPEG {
            let path = output_dir.join("cover.jpg");
            let mut output = whatever!(
                File::options()
                    .create(true)
                    .write(true)
                    .truncate(true)
                    .open(&path),
                "failed to open file"
            );

            whatever!(output.write_all(&image.data), "failed to write to file");
            Ok(Some(path))
        } else {
            Ok(None)
        }
    } else {
        Ok(None)
    };

    dbg!(&output);

    output
}
