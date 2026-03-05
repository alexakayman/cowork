import type { ActivityType } from "@cowork/shared";
import { ACTIVITY_ICONS, ACTIVITY_LABELS, ACTIVITY_COLORS } from "../lib/activityMeta";

interface Props {
  activity: ActivityType;
  /** "sm" for overlay chips, "md" for dashboard cards */
  size?: "sm" | "md";
}

/**
 * Animal Crossing–style thought bubble.
 * A cloud shape with a trail of shrinking circles leading down to
 * the character's head. Shows the activity icon inside.
 */
export function ThoughtBubble({ activity, size = "md" }: Props) {
  const icon = ACTIVITY_ICONS[activity] ?? "\u{2753}";
  const label = ACTIVITY_LABELS[activity] ?? "?";
  const color = ACTIVITY_COLORS[activity] ?? "#C4B9A8";

  const isSm = size === "sm";

  return (
    <div className="flex flex-col items-center" style={{ gap: isSm ? 1 : 2 }}>
      {/* ── Main bubble ── */}
      <div
        className="relative flex items-center justify-center bg-white border-2 border-white/80"
        style={{
          width: isSm ? 36 : 52,
          height: isSm ? 24 : 34,
          borderRadius: "50%",
          boxShadow: `0 2px 8px ${color}30, 0 1px 3px rgba(0,0,0,0.06)`,
        }}
      >
        {/* Emoji icon */}
        <span
          className="select-none"
          style={{ fontSize: isSm ? 12 : 16, lineHeight: 1 }}
        >
          {icon}
        </span>

        {/* Label — only in md size */}
        {!isSm && (
          <span
            className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold rounded-full px-1.5 py-px"
            style={{
              backgroundColor: color + "25",
              color: "#5C4433",
            }}
          >
            {label}
          </span>
        )}
      </div>

      {/* ── Trail dots (leading down to the character's head) ── */}
      <div
        className="rounded-full bg-white"
        style={{
          width: isSm ? 5 : 7,
          height: isSm ? 5 : 7,
          boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
        }}
      />
      <div
        className="rounded-full bg-white"
        style={{
          width: isSm ? 3 : 4,
          height: isSm ? 3 : 4,
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        }}
      />
    </div>
  );
}
