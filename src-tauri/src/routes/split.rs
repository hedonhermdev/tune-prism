use snafu::ResultExt;
use tokio::sync::Mutex;

use serde::{self, Deserialize, Serialize};
use tauri::State;

use crate::{
    data::AppDb,
    demucs::{split_track, Demucs},
    routes::StemSplitSnafu,
    util::get_base_directory,
};

use super::{Error, Result};

#[derive(Serialize, Deserialize)]
#[serde(tag = "status")]
pub enum SplitStemsResponse {
    #[serde(alias = "success")]
    Success { stems: Vec<String> },
}

#[tauri::command]
#[tracing::instrument(skip(app_db_mutex, model))]
pub async fn split_stems(
    project_id: &str,
    app_db_mutex: State<'_, Mutex<AppDb>>,
    model: State<'_, Demucs>,
) -> Result<SplitStemsResponse> {
    let project_dir = get_base_directory().join("project_data").join(project_id);

    let song_path = project_dir.join("main.mp3"); // We're dealing with just MP3 for now.

    let stem_paths = split_track(&model, &song_path, &project_dir).context(StemSplitSnafu)?;

    let stems = stem_paths
        .clone()
        .into_iter()
        .map(|p| p.to_string_lossy().to_string())
        .collect();

    let app_db = app_db_mutex.lock().await;

    app_db
        .add_stems_to_project(String::from(project_id), stem_paths)
        .map_or(Err(Error::StemSaveError), |_| {
            Ok(SplitStemsResponse::Success { stems })
        })
}
