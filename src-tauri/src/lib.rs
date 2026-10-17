mod tray;
mod commands;

const APP_SALT: &str = "zybernetix-desktop-v1";
const KEYRING_SERVICE: &str = "zybernetix-desktop";

fn derive_stronghold_password() -> Vec<u8> {
    let machine_id = machine_uid::get().unwrap_or_else(|_| "unknown-machine".to_string());
    let input = format!("{}-{}", machine_id, APP_SALT);
    blake3::hash(input.as_bytes()).as_bytes().to_vec()
}

#[tauri::command]
fn save_keychain(key: String, value: String) -> Result<(), String> {
    let entry = keyring::Entry::new(KEYRING_SERVICE, &key).map_err(|e| e.to_string())?;
    entry.set_password(&value).map_err(|e| e.to_string())
}

#[tauri::command]
fn load_keychain(key: String) -> Result<Option<String>, String> {
    let entry = keyring::Entry::new(KEYRING_SERVICE, &key).map_err(|e| e.to_string())?;
    match entry.get_password() {
        Ok(val) => Ok(Some(val)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
fn delete_keychain(key: String) -> Result<(), String> {
    let entry = keyring::Entry::new(KEYRING_SERVICE, &key).map_err(|e| e.to_string())?;
    match entry.delete_credential() {
        Ok(()) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let password = derive_stronghold_password();

    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_autostart::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_os::init())
        .plugin(
            tauri_plugin_stronghold::Builder::new(move |_path| password.clone()).build(),
        )
        .invoke_handler(tauri::generate_handler![
            save_keychain,
            load_keychain,
            delete_keychain,
            tray::update_tray_menu,
            commands::idle::get_idle_seconds,
            commands::heartbeat_beacon::send_quit_heartbeat,
        ])
        .setup(|app| {
            tray::setup_tray(app.handle())?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
