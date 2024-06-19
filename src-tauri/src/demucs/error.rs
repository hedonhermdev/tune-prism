use snafu::prelude::*;

#[derive(Debug, Snafu)]
#[snafu(visibility(pub))]
pub enum Error {
    #[snafu(whatever, display("Unexpected Error: {message}: {source:?}"))]
    UnexpectedError {
        message: String,
        #[snafu(source(from(Box<dyn std::error::Error + Sync + Send>, Some)))]
        source: Option<Box<dyn std::error::Error + Sync + Send>>,
    },

    #[snafu(display("Model not found. Check if it is available in the right place."))]
    ModelNotFoundError { name: String },

    #[snafu(display("Symphonia Error: {source:?}"))]
    SymphoniaError {
        source: symphonia::core::errors::Error,
    },

    #[snafu(display("Hound Error: {source:?}"))]
    HoundError { source: hound::Error },

    #[snafu(display("Torch Error: {source:?}"))]
    TorchError { source: tch::TchError },

    #[snafu(display("ID3 Error: {source:?}"))]
    Id3Error { source: id3::Error },

    #[snafu(display("Mime parse error: {source:?}"))]
    MimeParseError { source: mime::FromStrError },
}

pub type Result<T> = std::result::Result<T, Error>;
