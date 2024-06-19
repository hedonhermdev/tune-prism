use std::path::PathBuf;
use tokio::sync::Mutex;

use serde::{self, Deserialize, Serialize};
use tauri::State;

use crate::data::{AppDb, Project};

use super::{Error, Result};

#[derive(Serialize, Deserialize)]
#[serde(tag = "status")]
pub enum CreateProjectResponse {
    #[serde(alias = "success")]
    Success { project: Project },
}

#[derive(Serialize, Deserialize)]
#[serde(tag = "status")]
pub enum GetAllProjectsResponse {
    #[serde(alias = "success")]
    Success { projects: Vec<Project> },
}

#[tauri::command]
pub async fn create_project(
    audio_filepath: &str,
    app_db_mutex: State<'_, Mutex<AppDb>>,
) -> Result<CreateProjectResponse> {
    let app_db = app_db_mutex.lock().await;

    app_db
        .create_project(PathBuf::from(audio_filepath))
        .map_or(Err(Error::ProjectCreationError), |project| {
            Ok(CreateProjectResponse::Success { project })
        })
}

#[tauri::command]
pub async fn get_all_projects(
    app_db_mutex: State<'_, Mutex<AppDb>>,
) -> Result<GetAllProjectsResponse> {
    let app_db = app_db_mutex.lock().await;
    app_db
        .get_projects()
        .map_or(Err(Error::ProjectCreationError), |projects| {
            Ok(GetAllProjectsResponse::Success { projects })
        })
}
