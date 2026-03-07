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
          boxShadow: `0 1px 6px ${color}30`,
        }}
      >
        {/* Emoji icon */}
        <span
          className="select-none"
          style={{ fontSize: isSm ? 12 : 16, lineHeight: 1 }}
        >
          {icon}
        </span>

        {/* Activity label */}
        <span
          className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap font-bold rounded-full px-1.5 py-px ${
            isSm ? "text-[7px] -bottom-2.5" : "text-[9px] -bottom-3.5"
          }`}
          style={{
            backgroundColor: "#fff",
            color: "#1a1a1a",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          }}
        >
          {label}
        </span>
      </div>

      {/* ── Trail dots (leading down to the character's head) ── */}
      <div
        className="rounded-full bg-white"
        style={{
          width: isSm ? 5 : 7,
          height: isSm ? 5 : 7,
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        }}
      />
      <div
        className="rounded-full bg-white"
        style={{
          width: isSm ? 3 : 4,
          height: isSm ? 3 : 4,
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        }}
      />
    </div>
  );
}
