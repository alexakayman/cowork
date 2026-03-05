use std::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, Emitter};
use tracing::{debug, error, info, warn};

use super::{mapper, ActivityState};

// In-memory blocklist — populated by the frontend via set_blocklist command
pub static BLOCKLIST: Mutex<Vec<String>> = Mutex::new(Vec::new());

/// Info returned by platform-specific detection
struct ForegroundApp {
    /// Lowercase key for blocklist matching (bundle suffix on macOS, exe name on Windows)
    process: String,
    /// Human-readable name shown in the UI
    app_name: String,
    /// Full bundle identifier (macOS only, empty on other platforms)
    bundle_id: String,
}

pub async fn start_polling(app: AppHandle) {
    info!("Activity polling started");

    let mut last_state: Option<ActivityState> = None;
    let mut interval = tokio::time::interval(Duration::from_secs(2));

    loop {
        interval.tick().await;
        let state = get_active_window_state();

        debug!(
            process = %state.process,
            app_name = %state.app_name,
            activity = %state.activity,
            "Polled active window"
        );

        // Emit on every change to activity OR app_name
        let changed = match &last_state {
            None => true,
            Some(prev) => prev.activity != state.activity || prev.app_name != state.app_name,
        };

        if changed {
            info!(
                activity = %state.activity,
                app_name = %state.app_name,
                process = %state.process,
                "Activity changed, emitting event"
            );
            match app.emit("activity-changed", &state) {
                Ok(_) => debug!("Emitted activity-changed event successfully"),
                Err(e) => error!("Failed to emit activity-changed event: {}", e),
            }
            last_state = Some(state);
        }
    }
}

fn get_active_window_state() -> ActivityState {
    let fg = get_foreground_app();

    if fg.process.is_empty() && fg.app_name.is_empty() {
        debug!("No foreground process detected");
    }

    // Check blocklist against process key, app name, or bundle id
    let blocked = BLOCKLIST
        .lock()
        .map(|bl| {
            bl.iter().any(|blocked| {
                fg.process.contains(blocked)
                    || fg.app_name.to_lowercase().contains(blocked)
                    || fg.bundle_id.to_lowercase().contains(blocked)
            })
        })
        .unwrap_or(false);

    if blocked {
        debug!(process = %fg.process, "Process is in blocklist, returning idle");
        return ActivityState {
            activity: "idle".into(),
            app_name: "Blocked".into(),
            process: fg.process,
        };
    }

    let activity = mapper::classify(&fg.process, &fg.bundle_id, &fg.app_name);

    ActivityState {
        activity: activity.to_string(),
        app_name: fg.app_name,
        process: fg.process,
    }
}

// Platform implementation — macOS
#[cfg(target_os = "macos")]
fn get_foreground_app() -> ForegroundApp {
    use objc2_app_kit::NSWorkspace;

    let result = std::panic::catch_unwind(|| {
        unsafe {
            let workspace = NSWorkspace::sharedWorkspace();
            let app = workspace.frontmostApplication();
            match app {
                Some(app) => {
                    let bundle_id = app
                        .bundleIdentifier()
                        .map(|s| s.to_string())
                        .unwrap_or_default();
                    let app_name = app
                        .localizedName()
                        .map(|s| s.to_string())
                        .unwrap_or_else(|| "Unknown".into());
                    let process = bundle_id
                        .split('.')
                        .last()
                        .unwrap_or(&bundle_id)
                        .to_lowercase();
                    debug!(
                        bundle_id = %bundle_id,
                        app_name = %app_name,
                        process_key = %process,
                        "macOS foreground app detected"
                    );
                    ForegroundApp { process, app_name, bundle_id }
                }
                None => {
                    warn!("frontmostApplication() returned None");
                    ForegroundApp {
                        process: String::new(),
                        app_name: "Desktop".into(),
                        bundle_id: String::new(),
                    }
                }
            }
        }
    });

    match result {
        Ok(val) => val,
        Err(e) => {
            error!("Panic in get_foreground_app: {:?}", e);
            ForegroundApp {
                process: String::new(),
                app_name: "Unknown".into(),
                bundle_id: String::new(),
            }
        }
    }
}

// Platform implementation — Windows
#[cfg(target_os = "windows")]
fn get_foreground_app() -> ForegroundApp {
    use windows::Win32::System::ProcessStatus::GetModuleFileNameExW;
    use windows::Win32::System::Threading::{OpenProcess, PROCESS_QUERY_LIMITED_INFORMATION};
    use windows::Win32::UI::WindowsAndMessaging::{GetForegroundWindow, GetWindowThreadProcessId};

    unsafe {
        let hwnd = GetForegroundWindow();
        if hwnd.0.is_null() {
            warn!("GetForegroundWindow returned null");
            return ForegroundApp {
                process: String::new(),
                app_name: "Desktop".into(),
                bundle_id: String::new(),
            };
        }
        let mut pid = 0u32;
        GetWindowThreadProcessId(hwnd, Some(&mut pid));
        let handle =
            OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid).unwrap_or_default();
        let mut buf = [0u16; 260];
        let len = GetModuleFileNameExW(handle, None, &mut buf) as usize;
        let path = String::from_utf16_lossy(&buf[..len]);
        let process = std::path::Path::new(&path)
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("")
            .to_lowercase();
        let app_name = process
            .trim_end_matches(".exe")
            .replace('-', " ")
            .replace('_', " ");
        debug!(path = %path, process = %process, app_name = %app_name, "Windows foreground app");
        ForegroundApp { process, app_name, bundle_id: String::new() }
    }
}

// Fallback for Linux (X11)
#[cfg(target_os = "linux")]
fn get_foreground_app() -> ForegroundApp {
    use std::process::Command;
    let output = Command::new("xdotool")
        .args(["getactivewindow", "getwindowpid"])
        .output();
    match output {
        Ok(out) => {
            let pid = String::from_utf8_lossy(&out.stdout).trim().to_string();
            let comm_path = format!("/proc/{}/comm", pid);
            let process = std::fs::read_to_string(&comm_path)
                .unwrap_or_default()
                .trim()
                .to_lowercase();
            let app_name = process.clone();
            debug!(pid = %pid, process = %process, "Linux foreground app");
            ForegroundApp { process, app_name, bundle_id: String::new() }
        }
        Err(e) => {
            error!("xdotool failed: {}", e);
            ForegroundApp {
                process: String::new(),
                app_name: "Unknown".into(),
                bundle_id: String::new(),
            }
        }
    }
}
