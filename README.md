# Tune Prism

Split a track into 4 stems: vocals, drums, bass and others. Based on Facebook's HTDemucs model ([repo](https://www.google.com/search?q=demucs+facebook&oq=demucs+fac&sourceid=chrome&ie=UTF-8)).


Built with Rust, Tauri, PyTorch and React. 

## Demo
Simply drag a track in, extract stems and drag your stems out. 

https://github.com/user-attachments/assets/584cf59e-ef4b-4f24-913d-dc52d7549609


## Try it Out
For M1 macs running MacOS, there's a prebuilt binary available on the releases page. Currently, that's the only platform I have built and tested the app on. Porting to other platforms is a bit of work and I only own a MacBook. If you can make the app run on Linux or Windows machines, I will happily accept your PR. 

## Building Locally

These instructions have been tested to work on an M1 Macbook Pro running MacOS 

### Requirements

#### Rust and Cargo
You can install Rust using [rustup](rustup.rs). I don't know what the MSRV is but I used `v1.79.0` while building the app. 

```bash
$ rustc --version
rustc 1.79.0 (129f3b996 2024-06-10)

$ cargo --version
cargo 1.79.0 (ffa9cf99a 2024-06-03)
```
#### Node and NPM
```bash
$ brew install node@20

$ node --version 
v20.14.0

$ npm --version
10.7.0
```

#### PyTorch

You can either use `libtorch` or provide the path to a PYTORCH installation. I found it easier to use `libtorch` directly. 

```bash
$ wget https://download.pytorch.org/libtorch/cpu/libtorch-macos-arm64-2.2.0.zip
$ unzip libtorch-macos-arm64-2.2.0.zip
```

#### Misc Dependencies

```bash
$ brew install libomp
```

### Building the app

- Clone the repo
```bash
$ git clone https://github.com/hedonhermdev/tune-prism && cd tune-prism
```

- Install npm dependencies
```bash
$ npm install
```

- Download the models
You can use the ``get_models.sh`` script to download the models
```bash
$ ./get_models.sh
```

- Copy `libtorch` to the repo. 
```
$ cp PATH_TO_LIBTORCH ./libtorch
$ export LIBTORCH=$(realpath ./libtorch) 
```

After this you're all set to start building the app. 

```bash
$ npm run tauri build
$ npm run tauri dev # for development
```

# Contributing

Just open a PR :)
