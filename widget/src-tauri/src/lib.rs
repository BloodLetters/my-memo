use std::fs;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use tauri::{Manager, PhysicalPosition, Position, Window};

#[derive(Serialize, Deserialize, Default, Clone, Copy, Debug)]
pub struct SavedWindowState {
    pub x: i32,
    pub y: i32,
    #[serde(default)]
    pub pinned: bool,
}

fn get_state_file_path(app: &tauri::AppHandle) -> Option<PathBuf> {
    if let Ok(mut dir) = app.path().app_data_dir() {
        let _ = fs::create_dir_all(&dir);
        dir.push("widget-position.json");
        Some(dir)
    } else {
        None
    }
}

fn load_saved_position(app: &tauri::AppHandle) -> Option<SavedWindowState> {
    let path = get_state_file_path(app)?;
    let content = fs::read_to_string(path).ok()?;
    serde_json::from_str(&content).ok()
}

fn save_position_to_disk(app: &tauri::AppHandle, x: i32, y: i32, pinned: Option<bool>) {
    if x <= -10000 || y <= -10000 {
        return;
    }
    if let Some(path) = get_state_file_path(app) {
        let current_pinned = load_saved_position(app).map(|s| s.pinned).unwrap_or(false);
        let state = SavedWindowState {
            x,
            y,
            pinned: pinned.unwrap_or(current_pinned),
        };
        if let Ok(json) = serde_json::to_string_pretty(&state) {
            let _ = fs::write(path, json);
        }
    }
}

#[tauri::command]
fn close_widget(window: Window) {
    if let Ok(pos) = window.outer_position() {
        save_position_to_disk(window.app_handle(), pos.x, pos.y, None);
    }
    let _ = window.close();
}

#[tauri::command]
fn start_drag(window: Window) -> Result<(), String> {
    window.start_dragging().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_window_position(window: Window) -> Result<(i32, i32), String> {
    let pos = window.outer_position().map_err(|e| e.to_string())?;
    Ok((pos.x, pos.y))
}

#[tauri::command]
fn set_window_position(window: Window, x: i32, y: i32) -> Result<(), String> {
    window
        .set_position(Position::Physical(PhysicalPosition { x, y }))
        .map_err(|e| e.to_string())?;
    save_position_to_disk(window.app_handle(), x, y, None);
    Ok(())
}

#[tauri::command]
fn save_window_position(window: Window) -> Result<(i32, i32), String> {
    let pos = window.outer_position().map_err(|e| e.to_string())?;
    save_position_to_disk(window.app_handle(), pos.x, pos.y, None);
    Ok((pos.x, pos.y))
}

#[tauri::command]
fn get_saved_window_state(window: Window) -> Result<Option<SavedWindowState>, String> {
    Ok(load_saved_position(window.app_handle()))
}

#[tauri::command]
fn set_desktop_pinned(window: Window, pinned: bool) -> Result<(), String> {
    if pinned {
        window.set_always_on_top(false).map_err(|e| e.to_string())?;
        window.set_always_on_bottom(true).map_err(|e| e.to_string())?;
    } else {
        window.set_always_on_bottom(false).map_err(|e| e.to_string())?;
        window.set_always_on_top(true).map_err(|e| e.to_string())?;
    }
    if let Ok(pos) = window.outer_position() {
        save_position_to_disk(window.app_handle(), pos.x, pos.y, Some(pinned));
    }
    Ok(())
}

#[tauri::command]
fn set_widget_size(window: Window, width: f64, height: f64) -> Result<(), String> {
    window
        .set_size(tauri::Size::Logical(tauri::LogicalSize { width, height }))
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn is_autostart_enabled() -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        // 1. Check Windows Registry Run key
        let output = std::process::Command::new("reg")
            .args(["query", "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run", "/v", "Pixel Memo Widget"])
            .output();
        if let Ok(out) = output {
            if out.status.success() {
                return Ok(true);
            }
        }

        // 2. Check Windows Startup folder shortcut
        if let Ok(appdata) = std::env::var("APPDATA") {
            let lnk = std::path::PathBuf::from(appdata)
                .join("Microsoft\\Windows\\Start Menu\\Programs\\Startup\\Pixel Memo Widget.lnk");
            if lnk.exists() {
                return Ok(true);
            }
        }
        Ok(false)
    }
    #[cfg(not(target_os = "windows"))]
    {
        Ok(false)
    }
}

#[tauri::command]
fn set_autostart(enabled: bool) -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        if enabled {
            let current_exe = std::env::current_exe().map_err(|e| e.to_string())?;
            let exe_str = current_exe.to_string_lossy();
            let quoted_exe = format!("\"{}\"", exe_str);

            let _ = std::process::Command::new("reg")
                .args([
                    "add",
                    "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
                    "/v",
                    "Pixel Memo Widget",
                    "/t",
                    "REG_SZ",
                    "/d",
                    &quoted_exe,
                    "/f",
                ])
                .output()
                .map_err(|e| e.to_string())?;

            Ok(true)
        } else {
            let _ = std::process::Command::new("reg")
                .args([
                    "delete",
                    "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
                    "/v",
                    "Pixel Memo Widget",
                    "/f",
                ])
                .output();

            if let Ok(appdata) = std::env::var("APPDATA") {
                let lnk = std::path::PathBuf::from(appdata)
                    .join("Microsoft\\Windows\\Start Menu\\Programs\\Startup\\Pixel Memo Widget.lnk");
                if lnk.exists() {
                    let _ = std::fs::remove_file(lnk);
                }
            }

            Ok(false)
        }
    }
    #[cfg(not(target_os = "windows"))]
    {
        Ok(false)
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                // Restore saved window position & pin state
                if let Some(state) = load_saved_position(app.handle()) {
                    let _ = window.set_position(Position::Physical(PhysicalPosition { x: state.x, y: state.y }));
                    if state.pinned {
                        let _ = window.set_always_on_bottom(true);
                    } else {
                        let _ = window.set_always_on_top(true);
                    }
                } else {
                    let _ = window.set_always_on_top(true);
                }
            }
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::Moved(pos) = event {
                if pos.x > -10000 && pos.y > -10000 {
                    save_position_to_disk(window.app_handle(), pos.x, pos.y, None);
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            close_widget,
            start_drag,
            get_window_position,
            set_window_position,
            save_window_position,
            get_saved_window_state,
            set_desktop_pinned,
            set_widget_size,
            is_autostart_enabled,
            set_autostart
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
