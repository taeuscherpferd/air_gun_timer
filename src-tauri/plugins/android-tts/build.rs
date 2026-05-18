const COMMANDS: &[&str] = &["speak", "stop"];

fn main() {
    tauri_plugin::Builder::new(COMMANDS)
        .android_path("android")
        .build();

    let target_os = std::env::var("CARGO_CFG_TARGET_OS").unwrap();
    let android = target_os == "android";

    println!("cargo:rustc-check-cfg=cfg(android)");
    if android {
        println!("cargo:rustc-cfg=android");
    }
}
