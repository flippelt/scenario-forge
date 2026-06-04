// All real file I/O goes through the official fs + dialog plugins, driven from
// the React front-end (see src/fs/adapter.ts). No custom commands needed yet;
// Phase 2 (live preview) and Phase 3 (commit/PR) will add them here.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .run(tauri::generate_context!())
        .expect("error while running scenario-forge");
}
