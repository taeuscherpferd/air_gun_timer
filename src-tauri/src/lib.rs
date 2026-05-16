mod session;

use session::{pick_option, resolve_duration, SelectionOption, SelectionResult, TimerStep};

#[tauri::command]
fn resolve_timer_duration(timer: TimerStep) -> Result<u64, String> {
    resolve_duration(&timer)
}

#[tauri::command]
fn choose_option(options: Vec<SelectionOption>) -> Result<SelectionResult, String> {
    pick_option(&options)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            resolve_timer_duration,
            choose_option
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
