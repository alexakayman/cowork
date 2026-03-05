use tauri::{AppHandle, Manager, PhysicalPosition, PhysicalSize};
use tracing::{info, error};

#[tauri::command]
pub fn show_overlay(app: AppHandle) -> Result<(), String> {
    info!("show_overlay command invoked");
    let overlay = app
        .get_webview_window("overlay")
        .ok_or_else(|| {
            error!("Overlay window not found");
            "Overlay window not found".to_string()
        })?;

    // Position overlay at bottom-right of the primary monitor
    let overlay_width = 800u32;
    let overlay_height = 120u32;

    if let Some(monitor) = app
        .primary_monitor()
        .map_err(|e| {
            error!("Failed to get primary monitor: {}", e);
            e.to_string()
        })?
    {
        let screen = monitor.size();
        let pos = monitor.position();
        let scale = monitor.scale_factor();

        // Margins in logical pixels, converted to physical
        let margin_bottom = (60.0 * scale) as i32; // above macOS dock
        let margin_right = (16.0 * scale) as i32;

        let x = pos.x + screen.width as i32 - overlay_width as i32 - margin_right;
        let y = pos.y + screen.height as i32 - overlay_height as i32 - margin_bottom;

        info!(
            screen_w = screen.width,
            screen_h = screen.height,
            scale = scale,
            overlay_x = x,
            overlay_y = y,
            "Positioning overlay at bottom-right"
        );

        overlay
            .set_size(PhysicalSize {
                width: overlay_width,
                height: overlay_height,
            })
            .map_err(|e| {
                error!("Failed to set overlay size: {}", e);
                e.to_string()
            })?;

        overlay
            .set_position(PhysicalPosition { x, y })
            .map_err(|e| {
                error!("Failed to set overlay position: {}", e);
                e.to_string()
            })?;
    } else {
        info!("No primary monitor found, using default position");
    }

    overlay.show().map_err(|e| {
        error!("Failed to show overlay: {}", e);
        e.to_string()
    })?;

    overlay
        .set_ignore_cursor_events(true)
        .map_err(|e| {
            error!("Failed to set ignore cursor events: {}", e);
            e.to_string()
        })?;

    info!("Overlay shown successfully at bottom-right");
    Ok(())
}

#[tauri::command]
pub fn hide_overlay(app: AppHandle) -> Result<(), String> {
    info!("hide_overlay command invoked");
    let overlay = app
        .get_webview_window("overlay")
        .ok_or_else(|| {
            error!("Overlay window not found");
            "Overlay window not found".to_string()
        })?;
    overlay.hide().map_err(|e| {
        error!("Failed to hide overlay: {}", e);
        e.to_string()
    })?;
    info!("Overlay hidden successfully");
    Ok(())
}

#[tauri::command]
pub fn set_overlay_position(app: AppHandle, x: i32, y: i32, width: u32) -> Result<(), String> {
    let overlay = app
        .get_webview_window("overlay")
        .ok_or("Overlay window not found")?;
    overlay
        .set_position(PhysicalPosition { x, y })
        .map_err(|e| e.to_string())?;
    overlay
        .set_size(PhysicalSize {
            width,
            height: 120u32,
        })
        .map_err(|e| e.to_string())?;
    Ok(())
}
