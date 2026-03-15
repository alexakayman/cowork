use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, TrayIconBuilder, TrayIconEvent},
    App, Emitter, Manager,
};

use crate::commands::window;

fn show_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }
}

pub fn setup_tray(app: &App) -> Result<(), Box<dyn std::error::Error>> {
    let show = MenuItem::with_id(app, "show", "Show Cowork", true, None::<&str>)?;
    let overlay = MenuItem::with_id(app, "overlay", "Show Overlay", true, None::<&str>)?;
    let leave = MenuItem::with_id(app, "leave", "Leave Session", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit Completely", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show, &overlay, &leave, &quit])?;

    let app_handle = app.handle().clone();

    TrayIconBuilder::new()
        .menu(&menu)
        .tooltip("Cowork")
        .show_menu_on_left_click(false)
        .on_tray_icon_event(move |_tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                ..
            } = event
            {
                show_main_window(&app_handle);
            }
        })
        .on_menu_event(move |app, event| match event.id.as_ref() {
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
        })
        .build(app)?;

    Ok(())
}
