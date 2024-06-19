use std::env;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

pub fn current_unix_timestamp() -> i64 {
    match SystemTime::now().duration_since(UNIX_EPOCH) {
        Ok(duration) => duration.as_secs() as i64,
        Err(_) => 0, // should not happen
    }
}

fn get_home_directory() -> PathBuf {
    let homedir_path_result = match env::consts::OS {
        "windows" => env::var("USERPROFILE").or_else(|_| {
            let home_drive = env::var("HOMEDRIVE").unwrap_or_default();
            let home_path = env::var("HOMEPATH").unwrap_or_default();
            if home_drive.is_empty() && home_path.is_empty() {
                Err(env::VarError::NotPresent)
            } else {
                Ok(home_drive + &home_path)
            }
        }),
        _ => env::var("HOME"),
    };

    PathBuf::from(homedir_path_result.expect("No home directory found.")) // No way to recover from this.
}

pub fn get_base_directory() -> PathBuf {
    let homedir = get_home_directory();
    homedir.join("stemsplit")
}

pub fn generate_random_string() -> String {
    let now = SystemTime::now();
    let since_the_epoch = now.duration_since(UNIX_EPOCH).expect("Time went backwards"); // Handle this more gracefully in a real app
    let timestamp = since_the_epoch.as_secs(); // Get the current UNIX timestamp as seconds

    // Convert the timestamp to a hexadecimal string
    let hex_string = format!("{:x}", timestamp);

    // Take the last 8 characters to ensure the string is of the desired length
    // This is a simplistic approach and might need adjustment based on your needs
    hex_string
        .chars()
        .rev()
        .take(8)
        .collect::<String>()
        .chars()
        .rev()
        .collect()
}
