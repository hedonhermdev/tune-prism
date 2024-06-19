use std::{fs::File, path::Path};

use dasp::Signal as _;

use snafu::{whatever, ResultExt};
use symphonia::core::audio::Signal as _;
use symphonia::core::codecs::{DecoderOptions, CODEC_TYPE_NULL};
use symphonia::core::formats::FormatOptions;
use symphonia::core::meta::MetadataOptions;
use symphonia::core::{errors::Error, io::MediaSourceStream, probe::Hint};

use super::Result;

use super::error::HoundSnafu;

#[derive(Clone)]
pub struct PcmAudioData {
    pub samples: Vec<Vec<f32>>,
    pub sample_rate: usize,
    pub nb_channels: usize,
    pub length: usize,
}

impl PcmAudioData {
    pub fn as_interleaved(&self) -> Vec<f32> {
        let mut buffer = Vec::with_capacity(self.length * self.nb_channels);

        for i in 0..self.length {
            for channel in self.samples.iter() {
                buffer.push(channel[i]);
            }
        }

        buffer
    }
}

impl std::fmt::Debug for PcmAudioData {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("PcmAudioData")
            .field("samples", &self.samples.len())
            .field("sample_rate", &self.sample_rate)
            .field("nb_channels", &self.nb_channels)
            .finish()
    }
}

pub fn decode_file(path: &Path) -> Result<PcmAudioData> {
    let ext = path.extension();

    let src = File::open(path).unwrap();

    let mss = MediaSourceStream::new(Box::new(src), Default::default());
    let mut hint = Hint::new();

    if let Some(ext) = ext {
        hint.with_extension(&ext.to_string_lossy());
    }

    let meta_opts: MetadataOptions = Default::default();
    let mut fmt_opts: FormatOptions = Default::default();
    fmt_opts.enable_gapless = true;
    let probed = symphonia::default::get_probe()
        .format(&hint, mss, &fmt_opts, &meta_opts)
        .expect("unsupported format");

    let mut format = probed.format;

    // Find the first audio track with a known (decodeable) codec.
    let track = format
        .tracks()
        .iter()
        .find(|t| t.codec_params.codec != CODEC_TYPE_NULL)
        .expect("no supported audio tracks");

    let track_id = track.id;

    let dec_opts: DecoderOptions = Default::default();

    dbg!(track);

    let mut decoder = symphonia::default::get_codecs()
        .make(&track.codec_params, &dec_opts)
        .expect("unsupported codec");

    let nb_channels = track.codec_params.channels.unwrap().count();
    let sample_rate = track.codec_params.sample_rate.unwrap() as usize;

    let mut buffer: Vec<Vec<f32>> = (0..nb_channels).map(|_| Vec::new()).collect();
    'decode: loop {
        // Get the next packet from the media format.
        let packet = match format.next_packet() {
            Ok(packet) => packet,
            Err(Error::ResetRequired) => {
                unimplemented!();
            }
            Err(err) => {
                if let Error::IoError(_) = err {
                    break 'decode;
                } else {
                    return Err(super::Error::SymphoniaError { source: err });
                }
            }
        };

        while !format.metadata().is_latest() {
            format.metadata().pop();

            dbg!(format.metadata());
        }

        if packet.track_id() != track_id {
            continue;
        }

        match decoder.decode(&packet) {
            Ok(decoded) => match decoded {
                symphonia::core::audio::AudioBufferRef::F32(buf) => {
                    for ch in 0..nb_channels {
                        buffer[ch].extend_from_slice(buf.chan(ch));
                    }
                }
                _ => {
                    unimplemented!()
                }
            },
            Err(Error::IoError(_)) => {
                continue;
            }
            Err(Error::DecodeError(_)) => {
                continue;
            }
            Err(err) => {
                return Err(super::Error::SymphoniaError { source: err });
            }
        }
    }

    let samples = buffer;

    let length = samples[0].len();

    Ok(PcmAudioData {
        samples,
        sample_rate,
        nb_channels,
        length,
    })
}

pub fn encode_pcm_to_wav(audio: PcmAudioData, path: &Path) -> Result<()> {
    let wav_spec = hound::WavSpec {
        channels: audio.nb_channels as u16,
        sample_rate: audio.sample_rate as u32,
        bits_per_sample: 32,
        sample_format: hound::SampleFormat::Float,
    };

    let mut writer = hound::WavWriter::create(path, wav_spec).unwrap();

    for i in 0..audio.length {
        for channel in audio.samples.iter() {
            writer.write_sample(channel[i]).context(HoundSnafu)?;
        }
    }

    writer.finalize().context(HoundSnafu)?;

    Ok(())
}

pub fn resample(input: PcmAudioData, to_sample_rate: usize) -> Result<PcmAudioData> {
    if input.nb_channels != 2 {
        whatever!("resampling is currently implemented for stereo audio only.")
    }

    let samples = input.as_interleaved();
    let mut signal = dasp::signal::from_interleaved_samples_iter::<_, [f32; 2]>(samples);

    let linear = dasp::interpolate::linear::Linear::new(signal.next(), signal.next());
    let new_signal = signal.from_hz_to_hz(linear, input.sample_rate as f64, to_sample_rate as f64);

    let mut pcm_buffer = vec![vec![]; input.nb_channels];

    for frame in new_signal.until_exhausted() {
        pcm_buffer[0].push(frame[0]);
        pcm_buffer[1].push(frame[1]);
    }
    let length = pcm_buffer[0].len();

    Ok(PcmAudioData {
        samples: pcm_buffer,
        sample_rate: to_sample_rate,
        nb_channels: 2,
        length,
    })
}
