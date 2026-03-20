use tauri::Manager;
use tracing::{info, debug};
use tracing_subscriber::EnvFilter;

mod activity;
mod commands;
mod tray;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tracing_subscriber::fmt()
        // Reduce noisy polling logs; keep tray/window logs high-signal.
        .with_env_filter(EnvFilter::new(
            "info,cowork_lib::tray=debug,cowork_lib::activity::detector=info",
        ))
        .init();

    info!("========== {} starting ==========", tray::APP_DISPLAY_NAME);
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
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "main" {
                    api.prevent_close();
                    let _ = window.hide();
                    info!("Main window close intercepted — hidden to tray");
                }
            }
        })
        .setup(|app| {
            // keep setup logs minimal (startup issues only)
            info!("setup: begin");

            #[cfg(target_os = "macos")]
            {
                // In dev, we want a standard Dock presence so clicking the app brings
                // the window forward. In production we keep it dockless (tray-only).
                let is_debug = cfg!(debug_assertions);
                let policy = if is_debug {
                    tauri::ActivationPolicy::Regular
                } else {
                    tauri::ActivationPolicy::Accessory
                };
                app.set_activation_policy(policy);
                info!(
                    "setup: activation policy set to {}",
                    if is_debug { "Regular" } else { "Accessory" }
                );
            }

            tray::setup_tray(app)?;
            info!("setup: tray created");

            if let Some(main_win) = app.get_webview_window("main") {
                let _ = main_win.set_title(tray::APP_DISPLAY_NAME);
                if cfg!(debug_assertions) {
                    // Ensure the UI is visible and focusable when running `pnpm dev`.
                    // (In production we rely on tray to bring the window up.)
                    let _ = main_win.show();
                    let _ = main_win.set_focus();
                }
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
                debug!("setup: no overlay window found");
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
