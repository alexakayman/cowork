use tauri::{AppHandle, Manager, LogicalPosition, LogicalSize};
use tracing::{info, error};

/// Safe margins (logical px) to keep the overlay inside the usable screen area.
const SAFE_TOP: f64 = 38.0;    // macOS menu bar / notch
const SAFE_BOTTOM: f64 = 60.0; // macOS dock

/// Helper: get primary monitor dimensions in logical pixels.
fn logical_screen(app: &AppHandle) -> Option<(f64, f64, f64, f64, f64)> {
    let monitor = app.primary_monitor().ok()??;
    let screen = monitor.size();
    let pos = monitor.position();
    let scale = monitor.scale_factor();
    let w = screen.width as f64 / scale;
    let h = screen.height as f64 / scale;
    let ox = pos.x as f64 / scale;
    let oy = pos.y as f64 / scale;
    Some((w, h, ox, oy, scale))
}

#[tauri::command]
pub fn show_overlay(app: AppHandle) -> Result<(), String> {
    info!("show_overlay command invoked");
    let overlay = app
        .get_webview_window("overlay")
        .ok_or_else(|| {
            error!("Overlay window not found");
            "Overlay window not found".to_string()
        })?;

    // Start with a small default; the React side will call fit_overlay
    // once it measures its content.
    if let Some((sw, sh, ox, oy, _)) = logical_screen(&app) {
        let w = 200.0;
        let h = 200.0;
        let x = ox + sw - w - 16.0;
        let y = oy + sh - h - SAFE_BOTTOM;

        overlay
            .set_size(LogicalSize { width: w, height: h })
            .map_err(|e| { error!("set_size: {}", e); e.to_string() })?;
        overlay
            .set_position(LogicalPosition { x, y })
            .map_err(|e| { error!("set_position: {}", e); e.to_string() })?;
    }

    overlay.show().map_err(|e| {
        error!("Failed to show overlay: {}", e);
        e.to_string()
    })?;

    // Don't ignore cursor events — let the user interact with the drag handle.
    // The overlay window is sized tightly around its content via fit_overlay,
    // so the interactive area is small.

    info!("Overlay shown successfully");
    Ok(())
}

/// Resize the overlay window to exactly fit its content.
/// Does not change position — the user may have dragged the overlay elsewhere,
/// and we must not reset it when overlay-sync triggers a content resize.
#[tauri::command]
pub fn fit_overlay(app: AppHandle, width: f64, height: f64) -> Result<(), String> {
    let overlay = app
        .get_webview_window("overlay")
        .ok_or("Overlay window not found")?;

    overlay
        .set_size(LogicalSize { width, height })
        .map_err(|e| e.to_string())?;

    Ok(())
}

/// After a drag, clamp the overlay position so it stays fully on-screen
/// within safe boundaries (menu bar at top, dock at bottom).
#[tauri::command]
pub fn clamp_overlay(app: AppHandle) -> Result<(), String> {
    let overlay = app
        .get_webview_window("overlay")
        .ok_or("Overlay window not found")?;

    let (sw, sh, ox, oy, scale) = logical_screen(&app)
        .ok_or("No primary monitor")?;

    // Read current position and size in physical pixels, convert to logical
    let pos = overlay.outer_position().map_err(|e| e.to_string())?;
    let size = overlay.outer_size().map_err(|e| e.to_string())?;

    let mut x = pos.x as f64 / scale;
    let mut y = pos.y as f64 / scale;
    let w = size.width as f64 / scale;
    let h = size.height as f64 / scale;

    // Usable screen rect (logical px)
    let min_x = ox;
    let min_y = oy + SAFE_TOP;
    let max_x = ox + sw - w;
    let max_y = oy + sh - SAFE_BOTTOM - h;

    x = x.clamp(min_x, max_x);
    y = y.clamp(min_y, max_y);

    overlay
        .set_position(LogicalPosition { x, y })
        .map_err(|e| e.to_string())?;

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
