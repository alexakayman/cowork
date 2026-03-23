use tauri::Manager;
use tracing::info;
use tracing_subscriber::EnvFilter;

mod activity;
mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tracing_subscriber::fmt()
        // Reduce noisy polling logs; keep tray/window logs high-signal.
        .with_env_filter(EnvFilter::new(
            "info,cowork_lib::tray=debug,cowork_lib::activity::detector=info",
        ))
        .init();

    const APP_NAME: &str = "Copaw";
    info!("========== {APP_NAME} starting ==========");
    info!("debug_assertions = {}", cfg!(debug_assertions));

    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(
            tauri_plugin_window_state::Builder::default()
                .with_denylist(&["overlay"])
                .build(),
        );

    if !cfg!(debug_assertions) {
        builder = builder.plugin(tauri_plugin_single_instance::init(
            |app, _args, _cwd| {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            },
        ));
    }

    builder
        .setup(|app| {
            info!("setup: begin");

            #[cfg(target_os = "macos")]
            {
                // Always use Regular activation policy so the app appears in the
                // Dock and behaves like a normal macOS application.
                app.set_activation_policy(tauri::ActivationPolicy::Regular);
                info!("setup: activation policy set to Regular");
            }

            if let Some(main_win) = app.get_webview_window("main") {
                let _ = main_win.set_title(APP_NAME);
                let _ = main_win.show();
                let _ = main_win.set_focus();
                let visible = main_win.is_visible().unwrap_or(false);
                let position = main_win.outer_position().ok();
                let size = main_win.outer_size().ok();
                info!(
                    visible = visible,
                    ?position,
                    ?size,
                    "setup: main window exists"
                );
            } else {
                info!("setup: main window NOT found — this is a problem");
            }

            if let Some(overlay) = app.get_webview_window("overlay") {
                let visible = overlay.is_visible().unwrap_or(false);
                info!(visible = visible, "setup: overlay window state");
                if visible {
                    let _ = overlay.hide();
                    info!("setup: overlay was visible — hid it");
                }
            } else {
                info!("setup: no overlay window found");
            }

            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                activity::detector::start_polling(app_handle).await;
            });

            info!("setup: complete ✓");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::window::show_overlay,
            commands::window::hide_overlay,
            commands::window::fit_overlay,
            commands::window::clamp_overlay,
            commands::activity::set_blocklist,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
