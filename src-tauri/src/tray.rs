use tauri::{
    AppHandle, Emitter, Manager,
    menu::{Menu, MenuBuilder, MenuItemBuilder, PredefinedMenuItem},
    tray::{TrayIcon, TrayIconBuilder},
};

pub fn setup_tray(app: &AppHandle) -> Result<TrayIcon, tauri::Error> {
    let menu = build_menu(app, false, false, "Active", "No task selected")?;

    TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| {
            on_menu_event(app, event.id.as_ref());
        })
        .on_tray_icon_event(|tray, event| {
            use tauri::tray::{MouseButton, MouseButtonState, TrayIconEvent};
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main_window(tray.app_handle());
            }
        })
        .build(app)
}

fn build_menu(
    app: &AppHandle,
    is_on_break: bool,
    is_tracking_paused: bool,
    status_label: &str,
    task_label: &str,
) -> Result<Menu<tauri::Wry>, tauri::Error> {
    let status_item = MenuItemBuilder::with_id("status_label", format!("Status: {}", status_label))
        .enabled(false)
        .build(app)?;
    let task_item = MenuItemBuilder::with_id("task_label", format!("Current task: {}", task_label))
        .enabled(false)
        .build(app)?;
    let sep1 = PredefinedMenuItem::separator(app)?;

    let mut builder = MenuBuilder::new(app).items(&[&status_item, &task_item, &sep1]);

    if is_on_break {
        let end_break = MenuItemBuilder::with_id("end_break", "End Break").build(app)?;
        builder = builder.item(&end_break);
    } else if !is_tracking_paused {
        let start_break = MenuItemBuilder::with_id("start_break", "Start Break").build(app)?;
        builder = builder.item(&start_break);
    }

    let sep2 = PredefinedMenuItem::separator(app)?;
    let select_task = MenuItemBuilder::with_id("select_task", "Select Task").build(app)?;
    let open_mentions = MenuItemBuilder::with_id("open_mentions", "Open Mentions").build(app)?;
    let sep3 = PredefinedMenuItem::separator(app)?;

    builder = builder.items(&[&sep2, &select_task, &open_mentions, &sep3]);

    if is_tracking_paused {
        let resume = MenuItemBuilder::with_id("resume_tracking", "Resume Tracking").build(app)?;
        builder = builder.item(&resume);
    } else {
        let pause = MenuItemBuilder::with_id("pause_tracking", "Pause Tracking").build(app)?;
        builder = builder.item(&pause);
    }

    let sep4 = PredefinedMenuItem::separator(app)?;
    let open_app = MenuItemBuilder::with_id("open_app", "Open App").build(app)?;
    let quit = MenuItemBuilder::with_id("quit", "Quit").build(app)?;

    builder.items(&[&sep4, &open_app, &quit]).build()
}

fn on_menu_event(app: &AppHandle, id: &str) {
    match id {
        "open_app" => show_main_window(app),
        "quit" => app.exit(0),
        "start_break" => { let _ = app.emit("tray:start-break", ()); }
        "end_break" => { let _ = app.emit("tray:end-break", ()); }
        "select_task" => { let _ = app.emit("tray:select-task", ()); }
        "open_mentions" => { let _ = app.emit("tray:open-mentions", ()); }
        "pause_tracking" => { let _ = app.emit("tray:pause-tracking", ()); }
        "resume_tracking" => { let _ = app.emit("tray:resume-tracking", ()); }
        _ => (),
    }
}

pub fn show_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}

#[tauri::command]
pub fn update_tray_menu(
    app: AppHandle,
    is_on_break: bool,
    is_tracking_paused: bool,
    status_label: String,
    task_label: String,
) -> Result<(), String> {
    let tray = app.tray_by_id("0").or_else(|| app.tray_by_id("main"));
    let Some(tray) = tray else {
        return Err("Tray not found".to_string());
    };
    let menu = build_menu(&app, is_on_break, is_tracking_paused, &status_label, &task_label)
        .map_err(|e| e.to_string())?;
    tray.set_menu(Some(menu)).map_err(|e| e.to_string())
}
