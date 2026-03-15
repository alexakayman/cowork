pub enum ActivityType {
    Coding,
    Writing,
    Email,
    Browsing,
    Designing,
    Communicating,
    Spreadsheet,
    Meeting,
    Terminal,
    Media,
    Idle,
}

impl std::fmt::Display for ActivityType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let s = match self {
            ActivityType::Coding => "coding",
            ActivityType::Writing => "writing",
            ActivityType::Email => "email",
            ActivityType::Browsing => "browsing",
            ActivityType::Designing => "designing",
            ActivityType::Communicating => "communicating",
            ActivityType::Spreadsheet => "spreadsheet",
            ActivityType::Meeting => "meeting",
            ActivityType::Terminal => "terminal",
            ActivityType::Media => "media",
            ActivityType::Idle => "idle",
        };
        write!(f, "{}", s)
    }
}

/// Determine activity from available process identifiers.
///
/// On macOS the "process" key is the last segment of the bundle ID (e.g.
/// `company.thebrowser.Browser` → `browser`) which is often too generic.
/// We therefore accept **all** identifiers we have — the bundle suffix,
/// the full bundle ID, and the human-readable app name — and check each
/// against known patterns.  The first match wins.
///
/// On Windows / Linux `bundle_id` will be empty and only the process name
/// and app_name are relevant, so the function gracefully degrades.
pub fn classify(process: &str, bundle_id: &str, app_name: &str) -> ActivityType {
    // Build a list of lowercase tokens to check against.
    // Order matters: more specific identifiers first.
    let tokens: Vec<String> = [bundle_id, app_name, process]
        .iter()
        .map(|s| s.trim().to_lowercase())
        .filter(|s| !s.is_empty())
        .collect();

    for t in &tokens {

        // --- Code editors ---
        if t.contains("vscode") || t.contains("visual-studio-code") || t.contains("visual studio code") {
            return ActivityType::Coding;
        }
        if t.contains("cursor") && !t.contains("cursoreffects") {
            return ActivityType::Coding;
        }
        if t.contains("xcode") {
            return ActivityType::Coding;
        }
        if t.contains("jetbrains")
            || t.contains("intellij")
            || t.contains("webstorm")
            || t.contains("pycharm")
            || t.contains("goland")
            || t.contains("rider")
            || t.contains("clion")
            || t.contains("rustrover")
            || t.contains("phpstorm")
            || t.contains("datagrip")
        {
            return ActivityType::Coding;
        }
        if t.contains("sublime") || t.contains("atom") || t.contains("nova") {
            return ActivityType::Coding;
        }
        if t == "zed" || t.contains("zed.dev") {
            return ActivityType::Coding;
        }
        if t.contains("neovim") || t.contains("nvim") || t == "vim" {
            return ActivityType::Coding;
        }
        if t.contains("android studio") || t.contains("androidstudio") {
            return ActivityType::Coding;
        }
        if t.contains("invoker") {
            return ActivityType::Coding;
        }

        // --- Terminals → Coding (if you're in a terminal, you're dev'ing) ---
        if t == "terminal"
            || t.contains("iterm")
            || t.contains("alacritty")
            || t.contains("wezterm")
            || t.contains("kitty")
            || t.contains("warp")
            || t.contains("hyper")
            || t.contains("ghostty")
            || t.contains("rio")
            || t == "foot"
            || t == "cmd"
            || t.contains("powershell")
            || t.contains("windowsterminal")
            || t.contains("tmux")
            || t.contains("cmux")
            || t.contains("screen")
        {
            return ActivityType::Coding;
        }

        // --- Email ---
        if t.contains("mail") && !t.contains("mailspring") {
            return ActivityType::Email;
        }
        if t.contains("outlook") || t.contains("thunderbird") || t.contains("spark") {
            return ActivityType::Email;
        }

        // --- Communication ---
        if t.contains("slack") {
            return ActivityType::Communicating;
        }
        if t.contains("discord") {
            return ActivityType::Communicating;
        }
        if t.contains("teams") && t.contains("microsoft") {
            return ActivityType::Communicating;
        }
        if t == "teams" {
            return ActivityType::Communicating;
        }
        if t.contains("telegram") || t.contains("signal") || t.contains("whatsapp") {
            return ActivityType::Communicating;
        }
        // Apple Messages: bundle = com.apple.MobileSMS, app_name = Messages
        if t.contains("mobilesms") || t.contains("imessage") {
            return ActivityType::Communicating;
        }
        if t == "messages" {
            return ActivityType::Communicating;
        }

        // --- Design ---
        if t.contains("figma") {
            return ActivityType::Designing;
        }
        if t.contains("sketch") {
            return ActivityType::Designing;
        }
        if t.contains("photoshop") || t.contains("illustrator") || t.contains("adobe xd") {
            return ActivityType::Designing;
        }
        if t.contains("affinity") || t.contains("pixelmator") {
            return ActivityType::Designing;
        }

        // --- Writing / Docs ---
        if t.contains("notion") {
            return ActivityType::Writing;
        }
        if t.contains("obsidian") || t.contains("typora") || t.contains("bear") {
            return ActivityType::Writing;
        }
        if t.contains("pages") && t.contains("apple") {
            return ActivityType::Writing;
        }
        if t == "pages" {
            return ActivityType::Writing;
        }
        if t.contains("word") && (t.contains("microsoft") || t == "word" || t.contains("winword")) {
            return ActivityType::Writing;
        }
        if t.contains("google docs") {
            return ActivityType::Writing;
        }

        // --- Spreadsheets ---
        if t.contains("excel") || t == "numbers" || t.contains("google sheets") {
            return ActivityType::Spreadsheet;
        }

        // --- Meetings ---
        if t.contains("zoom") && !t.contains("zoomfinder") {
            return ActivityType::Meeting;
        }
        if t.contains("webex") || t.contains("whereby") {
            return ActivityType::Meeting;
        }
        if t.contains("google meet") || t.contains("facetime") {
            return ActivityType::Meeting;
        }

        // --- Browsers (check after more specific matches) ---
        if t.contains("chrome") || t.contains("chromium") {
            return ActivityType::Browsing;
        }
        if t.contains("firefox") {
            return ActivityType::Browsing;
        }
        if t.contains("safari") && !t.contains("technology") {
            return ActivityType::Browsing;
        }
        if t == "arc" || t.contains("thebrowser") {
            return ActivityType::Browsing;
        }
        if t.contains("brave") {
            return ActivityType::Browsing;
        }
        if t.contains("edge") && t.contains("microsoft") {
            return ActivityType::Browsing;
        }
        if t == "msedge" || t == "edge" {
            return ActivityType::Browsing;
        }
        if t.contains("orion") || t.contains("vivaldi") || t.contains("opera") {
            return ActivityType::Browsing;
        }
        // Generic fallback: if the bundle-id suffix is literally "browser"
        if t == "browser" {
            return ActivityType::Browsing;
        }

        // --- Media ---
        if t.contains("spotify") || t.contains("music") {
            return ActivityType::Media;
        }
        if t.contains("vlc") || t.contains("mpv") || t.contains("iina") {
            return ActivityType::Media;
        }
        if t == "tv" || t.contains("apple tv") || t.contains("netflix") || t.contains("youtube") {
            return ActivityType::Media;
        }
    }

    ActivityType::Idle
}

// Keep backward-compat alias for Windows/Linux code paths that only have a process name
pub fn process_to_activity(process: &str) -> ActivityType {
    classify(process, "", "")
}
