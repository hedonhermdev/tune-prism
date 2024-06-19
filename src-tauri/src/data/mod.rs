use crate::util::{current_unix_timestamp, generate_random_string, get_base_directory};
use polodb_core::{bson::doc, Collection, Database};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

use self::fsio::{copy_song_to_project, delete_project_data};

mod fsio;

#[derive(Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum AppMetadata {
    #[serde(alias = "activation")]
    Activation { key: String },

    #[serde(alias = "num_songs_processed")]
    Error { value: u32 },
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Project {
    pub _id: String,
    pub name: String,
    pub created_at: i64,
    pub base_dir: PathBuf,
    pub stem_paths: Vec<String>,
}

pub struct AppDb {
    pub path: PathBuf,
    polo_instance: Database,
}

// TODO: Implement non-monkey error handling
impl AppDb {
    pub fn new(path: PathBuf) -> Self {
        let db = Database::open_file(path.clone()).unwrap();
        Self {
            path: path.clone(),
            polo_instance: db,
        }
    }

    pub fn create_project(&self, audio_filepath: PathBuf) -> Result<Project, String> {
        let name = audio_filepath
            .file_name()
            .ok_or_else(String::new)?
            .to_string_lossy()
            .to_string();

        let created_at = current_unix_timestamp();
        let projects = self.polo_instance.collection("projects");
        let base_dir = get_base_directory();
        let id = generate_random_string();
        let stem_paths: Vec<String> = vec![];

        let proj = Project {
            _id: id.clone(), // Not sure if polo_db will work if this is an Option<T>
            name,
            created_at,
            base_dir,
            stem_paths,
        };

        projects
            .insert_one(proj.clone())
            .map_err(|_| String::new())?;
        copy_song_to_project(audio_filepath, id.clone()).expect("Failed to copy song");

        Ok(proj)
    }

    pub fn add_stems_to_project(
        &self,
        project_id: String,
        stem_paths: Vec<PathBuf>,
    ) -> Result<(), String> {
        let paths: Vec<String> = stem_paths
            .into_iter()
            .map(|p| p.to_string_lossy().to_string())
            .collect();
        let projects: Collection<Project> = self.polo_instance.collection("projects");
        let result = projects.update_one(
            doc! { "_id": project_id.clone() },
            doc! {
                "$set": doc! {
                    // "stem_paths": paths.into_iter().map(Bson::String).collect(),
                    "stem_paths": paths.clone(),
                }
            },
        );

        result.map_err(|_| String::new())?;

        Ok(())
    }

    pub fn get_projects(&self) -> Result<Vec<Project>, String> {
        let projects_collection: Collection<Project> = self.polo_instance.collection("projects");
        let result = projects_collection.find(None);
        match result {
            Ok(res) => {
                let mut all_projects: Vec<Project> = vec![];
                for proj_res in res {
                    let project = proj_res.expect("Couldn't read the project.");
                    all_projects.push(project);
                }
                Ok(dbg!(all_projects))
            }
            Err(_) => Err(String::from("bruh")),
        }
    }

    pub fn get_project_by_id(&self, id: String) -> Result<Option<Project>, String> {
        let projects_collection: Collection<Project> = self.polo_instance.collection("projects");
        let find_result = projects_collection.find_one(doc! {
            "_id": id
        });

        match find_result {
            Ok(result) => Ok(result),
            Err(_e) => Err(String::from("Error finding project by ID")),
        }
    }

    pub fn delete_project_by_id(&self, project_id: String) -> Result<(), String> {
        let projects_collection: Collection<Project> = self.polo_instance.collection("projects");
        let deleted_result = projects_collection.delete_many(doc! {
            "_id": project_id.clone(),
        });

        match deleted_result {
            Ok(_) => {
                delete_project_data(project_id.clone()).expect("Failed to delete project data.");
                Ok(())
            }
            Err(_) => Err(String::from("Error deleting, whoops.")),
        }
    }
}
