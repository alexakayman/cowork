use tauri::Manager;
use tracing::{info, debug};
use tracing_subscriber::EnvFilter;

mod activity;
mod commands;
mod tray;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialise structured logging
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::new("info,cowork_lib=debug"))
        .init();

    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(
            tauri_plugin_window_state::Builder::default()
                .with_denylist(&["overlay"])
                .build(),
        )
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            // If a second instance is launched, focus the existing main window
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .setup(|app| {
            tray::setup_tray(app)?;

            // Log overlay window state at startup
            if let Some(overlay) = app.get_webview_window("overlay") {
                let visible = overlay.is_visible().unwrap_or(false);
                info!(visible = visible, "Overlay window state at startup");
                if visible {
                    info!("Overlay was visible at startup — hiding it");
                    let _ = overlay.hide();
                }
            } else {
                debug!("No overlay window found at startup");
            }

            // Start the background activity polling loop
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                activity::detector::start_polling(app_handle).await;
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::window::show_overlay,
            commands::window::hide_overlay,
            commands::window::set_overlay_position,
            commands::window::fit_overlay,
            commands::window::clamp_overlay,
            commands::activity::get_current_activity,
            commands::activity::set_blocklist,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
