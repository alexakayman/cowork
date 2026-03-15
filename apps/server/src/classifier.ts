/**
 * Server-side activity classifier. Single source of truth for app → activity mapping.
 * Add new apps (e.g. browsers) here; no desktop app update required.
 *
 * Mirrors apps/desktop/src-tauri/src/activity/mapper.rs — keep in sync when
 * adding platform-specific rules that must work offline; prefer extending this.
 */
import { ActivityType } from "@cowork/shared";

export function classifyActivity(
  process: string,
  bundleId: string,
  appName: string
): ActivityType {
  const tokens = [bundleId, appName, process]
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);

  for (const t of tokens) {
    // --- Code editors ---
    if (
      t.includes("vscode") ||
      t.includes("visual-studio-code") ||
      t.includes("visual studio code")
    )
      return ActivityType.CODING;
    if (t.includes("cursor") && !t.includes("cursoreffects"))
      return ActivityType.CODING;
    if (t.includes("xcode")) return ActivityType.CODING;
    if (
      t.includes("jetbrains") ||
      t.includes("intellij") ||
      t.includes("webstorm") ||
      t.includes("pycharm") ||
      t.includes("goland") ||
      t.includes("rider") ||
      t.includes("clion") ||
      t.includes("rustrover") ||
      t.includes("phpstorm") ||
      t.includes("datagrip")
    )
      return ActivityType.CODING;
    if (t.includes("sublime") || t.includes("atom") || t.includes("nova"))
      return ActivityType.CODING;
    if (t === "zed" || t.includes("zed.dev")) return ActivityType.CODING;
    if (t.includes("neovim") || t.includes("nvim") || t === "vim")
      return ActivityType.CODING;
    if (t.includes("android studio") || t.includes("androidstudio"))
      return ActivityType.CODING;
    if (t.includes("invoker")) return ActivityType.CODING;

    // --- Terminals ---
    if (
      t === "terminal" ||
      t.includes("iterm") ||
      t.includes("alacritty") ||
      t.includes("wezterm") ||
      t.includes("kitty") ||
      t.includes("warp") ||
      t.includes("hyper") ||
      t.includes("ghostty") ||
      t.includes("rio") ||
      t === "foot" ||
      t === "cmd" ||
      t.includes("powershell") ||
      t.includes("windowsterminal") ||
      t.includes("tmux") ||
      t.includes("cmux") ||
      t.includes("screen")
    )
      return ActivityType.CODING;

    // --- Email ---
    if (t.includes("mail") && !t.includes("mailspring"))
      return ActivityType.EMAIL;
    if (
      t.includes("outlook") ||
      t.includes("thunderbird") ||
      t.includes("spark")
    )
      return ActivityType.EMAIL;

    // --- Communication ---
    if (t.includes("slack")) return ActivityType.COMMUNICATING;
    if (t.includes("discord")) return ActivityType.COMMUNICATING;
    if (t.includes("teams") && t.includes("microsoft"))
      return ActivityType.COMMUNICATING;
    if (t === "teams") return ActivityType.COMMUNICATING;
    if (
      t.includes("telegram") ||
      t.includes("signal") ||
      t.includes("whatsapp")
    )
      return ActivityType.COMMUNICATING;
    if (t.includes("mobilesms") || t.includes("imessage"))
      return ActivityType.COMMUNICATING;
    if (t === "messages") return ActivityType.COMMUNICATING;

    // --- Design ---
    if (t.includes("figma")) return ActivityType.DESIGNING;
    if (t.includes("sketch")) return ActivityType.DESIGNING;
    if (
      t.includes("photoshop") ||
      t.includes("illustrator") ||
      t.includes("adobe xd")
    )
      return ActivityType.DESIGNING;
    if (t.includes("affinity") || t.includes("pixelmator"))
      return ActivityType.DESIGNING;

    // --- Writing / Docs ---
    if (t.includes("notion")) return ActivityType.WRITING;
    if (
      t.includes("obsidian") ||
      t.includes("typora") ||
      t.includes("bear")
    )
      return ActivityType.WRITING;
    if (t.includes("pages") && t.includes("apple"))
      return ActivityType.WRITING;
    if (t === "pages") return ActivityType.WRITING;
    if (
      t.includes("word") &&
      (t.includes("microsoft") || t === "word" || t.includes("winword"))
    )
      return ActivityType.WRITING;
    if (t.includes("google docs")) return ActivityType.WRITING;

    // --- Spreadsheets ---
    if (
      t.includes("excel") ||
      t === "numbers" ||
      t.includes("google sheets")
    )
      return ActivityType.SPREADSHEET;

    // --- Meetings ---
    if (t.includes("zoom") && !t.includes("zoomfinder"))
      return ActivityType.MEETING;
    if (t.includes("webex") || t.includes("whereby"))
      return ActivityType.MEETING;
    if (t.includes("google meet") || t.includes("facetime"))
      return ActivityType.MEETING;

    // --- Browsers ---
    if (t.includes("chrome") || t.includes("chromium"))
      return ActivityType.BROWSING;
    if (t.includes("firefox")) return ActivityType.BROWSING;
    if (t.includes("safari") && !t.includes("technology"))
      return ActivityType.BROWSING;
    if (t === "arc" || t.includes("thebrowser"))
      return ActivityType.BROWSING;
    if (t.includes("helium")) return ActivityType.BROWSING;
    if (t.includes("brave")) return ActivityType.BROWSING;
    if (t.includes("edge") && t.includes("microsoft"))
      return ActivityType.BROWSING;
    if (t === "msedge" || t === "edge") return ActivityType.BROWSING;
    if (
      t.includes("orion") ||
      t.includes("vivaldi") ||
      t.includes("opera")
    )
      return ActivityType.BROWSING;
    if (t === "browser") return ActivityType.BROWSING;

    // --- Media ---
    if (t.includes("spotify") || t.includes("music"))
      return ActivityType.MEDIA;
    if (t.includes("vlc") || t.includes("mpv") || t.includes("iina"))
      return ActivityType.MEDIA;
    if (
      t === "tv" ||
      t.includes("apple tv") ||
      t.includes("netflix") ||
      t.includes("youtube")
    )
      return ActivityType.MEDIA;
  }

  return ActivityType.IDLE;
}
