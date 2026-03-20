use crate::activity::detector::BLOCKLIST;

#[tauri::command]
pub fn set_blocklist(blocklist: Vec<String>) -> Result<(), String> {
    let mut bl = BLOCKLIST.lock().map_err(|e| e.to_string())?;
    *bl = blocklist;
    Ok(())
}
