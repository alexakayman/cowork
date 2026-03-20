use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, TrayIconBuilder, TrayIconEvent},
    App, Emitter, Manager,
};

use crate::commands::window;

pub const APP_DISPLAY_NAME: &str = if cfg!(debug_assertions) {
    "Cowork (Dev)"
} else {
    "Cowork"
};

fn tray_tooltip() -> String {
    if cfg!(debug_assertions) {
        format!("{APP_DISPLAY_NAME} • pid {}", std::process::id())
    } else {
        APP_DISPLAY_NAME.to_string()
    }
}

fn activate_macos_app() {
    #[cfg(target_os = "macos")]
    {
        use tracing::info;
        // Accessory apps must explicitly activate to bring windows to front
        use objc2_app_kit::NSApplication;
        use objc2_foundation::MainThreadMarker;

        // We don't enable objc2-foundation's NSThread feature, so we can't safely check.
        // Tauri tray callbacks are expected to run on the main thread.
        unsafe {
            let mtm = MainThreadMarker::new_unchecked();
            let ns_app = NSApplication::sharedApplication(mtm);
            #[allow(deprecated)]
            ns_app.activateIgnoringOtherApps(true);
        }
        info!("tray: macOS NSApp activated (activateIgnoringOtherApps)");
    }
}

fn show_main_window(app: &tauri::AppHandle) {
    use tracing::{info, warn};

    activate_macos_app();

    match app.get_webview_window("main") {
        Some(window) => {
            let was_visible = window.is_visible().unwrap_or(false);
            let position = window.outer_position().ok();
            let size = window.outer_size().ok();
            info!(
                was_visible,
                ?position,
                ?size,
                "tray: show_main_window — window found"
            );

            let show_result = window.show();
            let focus_result = window.set_focus();
            info!(
                show_ok = show_result.is_ok(),
                focus_ok = focus_result.is_ok(),
                "tray: show/focus results"
            );
            if let Err(e) = show_result {
                warn!("tray: window.show() failed: {e}");
            }
            if let Err(e) = focus_result {
                warn!("tray: window.set_focus() failed: {e}");
            }

            let is_visible_after = window.is_visible().unwrap_or(false);
            info!(is_visible_after, "tray: window state after show");
        }
        None => {
            warn!("tray: show_main_window — main window NOT found!");
        }
    }
}

pub fn setup_tray(app: &App) -> Result<(), Box<dyn std::error::Error>> {
    tracing::info!(
        pid = std::process::id(),
        "tray: setup_tray begin (building status item)"
    );
    let show_label = format!("Show {}", APP_DISPLAY_NAME);
    let show = MenuItem::with_id(app, "show", &show_label, true, None::<&str>)?;
    let overlay = MenuItem::with_id(app, "overlay", "Show Overlay", true, None::<&str>)?;
    let leave = MenuItem::with_id(app, "leave", "Leave Session", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit Completely", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show, &overlay, &leave, &quit])?;

    let app_handle = app.handle().clone();
    let tooltip = tray_tooltip();

    let tray = TrayIconBuilder::new()
        .menu(&menu)
        .tooltip(&tooltip)
        .show_menu_on_left_click(false)
        .on_tray_icon_event(move |_tray, event| match event {
            TrayIconEvent::Click { button, .. } => {
                tracing::info!(?button, "tray: icon click");
                if matches!(button, MouseButton::Left) {
                    show_main_window(&app_handle);
                }
            }
            TrayIconEvent::DoubleClick { button, .. } => {
                tracing::info!(?button, "tray: icon double-click");
                if matches!(button, MouseButton::Left) {
                    show_main_window(&app_handle);
                }
            }
            _ => {
                tracing::debug!("tray: other icon event (enter/leave/move)");
            }
        })
        .on_menu_event(move |app, event| {
            tracing::info!(id = event.id.as_ref(), "tray: menu item clicked");
            match event.id.as_ref() {
            "show" => show_main_window(app),
            "overlay" => {
                let _ = window::show_overlay(app.clone());
            }
            "leave" => {
                if let Some(win) = app.get_webview_window("main") {
                    let _ = win.emit("tray:leave-session", ());
                }
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        }})
        .build(app)?;

    tracing::info!(
        pid = std::process::id(),
        tooltip = %tooltip,
        "tray: status item built ✓"
    );

    // IMPORTANT: keep the tray icon alive. If it's dropped, macOS can keep showing the
    // status item but we can stop receiving click events.
    std::mem::forget(tray);

    Ok(())
}
