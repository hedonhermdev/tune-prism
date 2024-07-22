// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{error::Error, fs, io::stdout, sync::Arc};
use tauri::Manager;
use tokio::sync::Mutex;
use tracing::Level;
use tracing_subscriber::fmt::format::FmtSpan;

use stem_split::{
    data::AppDb,
    demucs::{self, get_available_device, Demucs},
    routes::{
        project::{
            __cmd__create_project, __cmd__get_all_projects, create_project, get_all_projects,
        },
        split::{__cmd__split_stems, split_stems},
    },
    util::get_base_directory,
};


#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    // setup_global_subscriber();

    fs::create_dir_all(get_base_directory().join("project_data"))
        .expect("Unable to ensure base_directory exists");

    tauri::Builder::default()
        .plugin(tauri_plugin_drag::init())
        .setup(|app| {
            println!("running setup");
            let models_path = app
                .path_resolver()
                .resolve_resource("models/models.json")
                .expect("failed to resolve resource");

            let models = demucs::models(&models_path)?;

            let model_info =
                demucs::find_model(models, "htdemucs").expect("model htdemucs is not available");

            let device = get_available_device();

            let model_path = app
                .path_resolver()
                .resolve_resource("models/htdemucs.pt")
                .expect("failed to resolve resource");

            let model = Demucs::init(&model_path, &model_info, device)?;

            app.manage::<Demucs>(model);

            Ok(())
        })
        .manage(Mutex::from(AppDb::new(get_base_directory().join("db"))))
        .invoke_handler(tauri::generate_handler![
            create_project,
            get_all_projects,
            split_stems,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    Ok(())
}

fn setup_global_subscriber() {
    let file = std::fs::File::create("debug.log");
    let _file = match file {
        Ok(file) => file,
        Err(error) => panic!("Error: {:?}", error),
    };
    tracing_subscriber::fmt()
        .with_writer(Arc::new(stdout()))
        .with_span_events(FmtSpan::ENTER | FmtSpan::CLOSE)
        .with_max_level(Level::INFO)
        .init();
}
