import type { ActivityType } from "@cowork/shared";
import { ACTIVITY_ICONS, ACTIVITY_LABELS } from "../lib/activityMeta";

interface Props {
  activity: ActivityType;
  /** "sm" for overlay chips, "md" for dashboard cards */
  size?: "sm" | "md";
  /** Optional second line (e.g. session goal). When set, label shows two lines: description + goal or "no goal". */
  goalText?: string | null;
}

/**
 * Animal Crossing–style thought bubble.
 * A cloud shape with a trail of shrinking circles leading down to
 * the character's head. Shows the activity icon inside.
 */
export function ThoughtBubble({ activity, size = "md", goalText }: Props) {
  const icon = ACTIVITY_ICONS[activity] ?? "\u{2753}";
  const label = ACTIVITY_LABELS[activity] ?? "?";
  const showGoalLine = goalText !== undefined;

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
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}
      >
        {/* Emoji icon */}
        <span
          className="select-none"
          style={{ fontSize: isSm ? 12 : 16, lineHeight: 1 }}
        >
          {icon}
        </span>

        {/* Description: fixed width so goal text length doesn't shift layout; text truncates */}
        <div
          className={`absolute left-1/2 -translate-x-1/2 font-bold px-1.5 py-0.5 text-center min-w-[88px] max-w-[88px] ${
            showGoalLine ? "rounded-lg" : "rounded-full"
          } ${isSm ? "text-[7px]" : "text-[9px]"} ${
            showGoalLine ? (isSm ? "-bottom-5 space-y-0.5" : "-bottom-6 space-y-0.5") : isSm ? "-bottom-2.5" : "-bottom-3.5"
          }`}
          style={{
            backgroundColor: "#fff",
            color: "#1a1a1a",
          }}
        >
          <span className="block truncate">
            {label}
          </span>
          {showGoalLine && (
            <span className="block truncate font-normal opacity-90">
              {goalText?.trim() || "no goal"}
            </span>
          )}
        </div>
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
