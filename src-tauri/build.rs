fn main() {
    println!("cargo:rustc-link-arg=-std=c++17");
    tauri_build::build()
}
