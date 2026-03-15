use crate::activity::detector::BLOCKLIST;
use crate::activity::ActivityState;

#[tauri::command]
pub fn get_current_activity() -> ActivityState {
    // Return a snapshot of the current activity
    // The actual polling happens in the background task
    ActivityState {
        activity: "idle".into(),
        app_name: "Unknown".into(),
        process: "".into(),
        bundle_id: String::new(),
    }
}

#[tauri::command]
pub fn set_blocklist(blocklist: Vec<String>) -> Result<(), String> {
    let mut bl = BLOCKLIST.lock().map_err(|e| e.to_string())?;
    *bl = blocklist;
    Ok(())
}
