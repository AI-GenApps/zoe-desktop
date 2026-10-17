#[tauri::command]
pub fn get_idle_seconds() -> u64 {
    #[cfg(target_os = "macos")]
    return get_idle_seconds_macos();

    #[cfg(target_os = "windows")]
    return get_idle_seconds_windows();

    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        eprintln!("[idle] idle detection not supported on this platform, returning 0");
        return 0;
    }
}

#[cfg(target_os = "macos")]
fn get_idle_seconds_macos() -> u64 {
    use core_graphics::event_source::CGEventSourceStateID;

    #[link(name = "CoreGraphics", kind = "framework")]
    unsafe extern "C" {
        fn CGEventSourceSecondsSinceLastEventType(
            state_id: CGEventSourceStateID,
            event_type: u32,
        ) -> f64;
    }

    let secs = unsafe {
        CGEventSourceSecondsSinceLastEventType(CGEventSourceStateID::CombinedSessionState, u32::MAX)
    };
    secs as u64
}

#[cfg(target_os = "windows")]
fn get_idle_seconds_windows() -> u64 {
    use windows_sys::Win32::System::SystemInformation::GetTickCount;
    use windows_sys::Win32::UI::Input::KeyboardAndMouse::{GetLastInputInfo, LASTINPUTINFO};

    let mut lii = LASTINPUTINFO {
        cbSize: std::mem::size_of::<LASTINPUTINFO>() as u32,
        dwTime: 0,
    };
    unsafe {
        GetLastInputInfo(&mut lii);
        let now = GetTickCount();
        let idle_ms = now.wrapping_sub(lii.dwTime);
        (idle_ms / 1000) as u64
    }
}
