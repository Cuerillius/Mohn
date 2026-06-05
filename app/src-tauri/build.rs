use std::path::PathBuf;

fn main() {
    tauri_build::build();

    // Copy libmpv DLLs to the cargo output directory so the plugin can find them at runtime.
    // The plugin searches <exe_dir> and <exe_dir>/lib/ for libmpv-wrapper.dll.
    let out_dir = PathBuf::from(std::env::var("OUT_DIR").unwrap());
    // OUT_DIR is something like target/debug/build/<pkg>/out — go up 3 levels to get target/debug/
    let target_dir = out_dir
        .ancestors()
        .nth(3)
        .expect("unexpected OUT_DIR depth")
        .to_path_buf();

    let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").unwrap();
    let lib_src = PathBuf::from(manifest_dir).join("lib");
    let lib_dst = target_dir.join("lib");
    std::fs::create_dir_all(&lib_dst).ok();

    for dll in &["libmpv-2.dll", "libmpv-wrapper.dll"] {
        let src = lib_src.join(dll);
        if src.exists() {
            // Copy to both <target_dir>/lib/ and <target_dir>/ as fallback
            std::fs::copy(&src, lib_dst.join(dll)).ok();
            std::fs::copy(&src, target_dir.join(dll)).ok();
        }
    }

    println!("cargo:rerun-if-changed=lib/libmpv-2.dll");
    println!("cargo:rerun-if-changed=lib/libmpv-wrapper.dll");
}
