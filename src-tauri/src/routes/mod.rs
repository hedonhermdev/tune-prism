pub mod project;
pub mod split;

use serde::Serialize;
use snafu::Snafu;

use crate::demucs;

#[derive(Debug, Snafu)]
#[snafu(visibility(pub))]
pub enum Error {
    #[snafu(whatever, display("Unexpected Error: {message}: {source:?}"))]
    UnexpectedError {
        message: String,
        #[snafu(source(from(Box<dyn std::error::Error + Sync + Send>, Some)))]
        source: Option<Box<dyn std::error::Error + Sync + Send>>,
    },

    #[snafu(display("Failed to create project"))]
    ProjectCreationError,

    #[snafu(display("Failed to fetch projects"))]
    GetProjectsError,

    #[snafu(display("Failed to split track: {source}"))]
    StemSplitError { source: demucs::Error },

    #[snafu(display("Failed to save stems"))]
    StemSaveError,
}

#[derive(Serialize)]
struct ErrorWrapper {
    status: &'static str,
    message: String,
}

impl Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let wrapper = ErrorWrapper {
            status: "error",
            message: self.to_string(),
        };

        wrapper.serialize(serializer)
    }
}

type Result<T> = std::result::Result<T, Error>;
