use std::{fs, path::PathBuf};

use crate::{demucs, util::get_base_directory};

pub fn copy_song_to_project(song_path: PathBuf, project_id: String) -> Result<(), String> {
    let base_dir_path = get_base_directory();
    let project_dir_path = base_dir_path.join("project_data").join(project_id.clone());
    fs::create_dir_all(&project_dir_path).expect("Unable to ensure parent directory exists");
    let dest_path = song_path
        .extension()
        .map(|extension| {
            base_dir_path
                .join("project_data")
                .join(project_id)
                .join(format!("main.{}", extension.to_string_lossy()))
        })
        .ok_or(String::from("That's not a file, dumbass."))?;

    // println!("{}, {}", song_path.to_string_lossy().to_string(), dest_path.to_string_lossy().to_string());
    fs::copy(song_path, &dest_path).map_err(|_| String::from("Error copying song"))?;

    let _cover_image = demucs::get_cover_image(&dest_path, &project_dir_path)
        .map_err(|e| format!("failed to fetch cover image: {e}"))?;

    Ok(())
}

pub fn delete_project_data(project_id: String) -> Result<(), String> {
    let base_dir_path = get_base_directory();
    let proj_dir_path = base_dir_path.join("projects").join(project_id);

    match fs::remove_dir_all(proj_dir_path) {
        Ok(_) => Ok(()),
        Err(_) => Err(String::from("Error deleting project.")),
    }
}
