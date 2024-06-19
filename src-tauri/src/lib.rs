#![warn(
 clippy::all,
 clippy::pedantic,
 clippy::nursery,
 clippy::cargo,
)]
#![
    allow(clippy::single_call_fn)
]


pub mod data;
pub mod demucs;
pub mod routes;
pub mod util;

pub use demucs::*;
