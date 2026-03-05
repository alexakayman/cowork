import { ActivityType } from "@cowork/shared";

export const ACTIVITY_ICONS: Record<ActivityType, string> = {
  [ActivityType.CODING]: "\u{1F4BB}",
  [ActivityType.WRITING]: "\u{270D}\u{FE0F}",
  [ActivityType.EMAIL]: "\u{1F4E7}",
  [ActivityType.BROWSING]: "\u{1F310}",
  [ActivityType.DESIGNING]: "\u{1F3A8}",
  [ActivityType.COMMUNICATING]: "\u{1F4AC}",
  [ActivityType.SPREADSHEET]: "\u{1F4CA}",
  [ActivityType.MEETING]: "\u{1F4F9}",
  [ActivityType.TERMINAL]: "\u{2328}\u{FE0F}",
  [ActivityType.MEDIA]: "\u{1F3B5}",
  [ActivityType.FOCUS]: "\u{1F3AF}",
  [ActivityType.IDLE]: "\u{1F634}",
};

/**
 * Animal Crossing–inspired soft pastel activity colors.
 * Warm, low-saturation tones — no pure primaries.
 */
export const ACTIVITY_COLORS: Record<ActivityType, string> = {
  [ActivityType.CODING]: "#7EB5E8",      // sky
  [ActivityType.WRITING]: "#B4A0D6",     // lavender
  [ActivityType.EMAIL]: "#F0AD70",       // peach
  [ActivityType.BROWSING]: "#7ED6A8",    // mint
  [ActivityType.DESIGNING]: "#F2A5B8",   // blush
  [ActivityType.COMMUNICATING]: "#929ADB", // periwinkle
  [ActivityType.SPREADSHEET]: "#A8D8A0", // sage
  [ActivityType.MEETING]: "#F5C96A",     // butter
  [ActivityType.TERMINAL]: "#7ECFDB",    // aqua
  [ActivityType.MEDIA]: "#C9A5E8",       // wisteria
  [ActivityType.FOCUS]: "#6ABFB5",       // teal
  [ActivityType.IDLE]: "#C4B9A8",        // sand
};

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  [ActivityType.CODING]: "Coding",
  [ActivityType.WRITING]: "Writing",
  [ActivityType.EMAIL]: "Email",
  [ActivityType.BROWSING]: "Browsing",
  [ActivityType.DESIGNING]: "Designing",
  [ActivityType.COMMUNICATING]: "Chatting",
  [ActivityType.SPREADSHEET]: "Spreadsheet",
  [ActivityType.MEETING]: "In a meeting",
  [ActivityType.TERMINAL]: "Terminal",
  [ActivityType.MEDIA]: "Media",
  [ActivityType.FOCUS]: "Focused",
  [ActivityType.IDLE]: "Idle",
};
