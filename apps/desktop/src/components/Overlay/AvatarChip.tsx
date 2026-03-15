import { useState } from "react";
import type { UserState } from "@cowork/shared";
import { ACTIVITY_COLORS, ACTIVITY_LABELS } from "../../lib/activityMeta";
import { resolveAvatarId } from "../../lib/avatars";
import { ThoughtBubble } from "../ThoughtBubble";
import { useElapsedTime } from "../../hooks/useElapsedTime";

interface Props {
  user: UserState;
  isSelf: boolean;
}

/**
 * Overlay chip: standing 3:4 character with a thought bubble above its head.
 * Designed for the always-on-top transparent overlay window.
 *
 * Shows: thought-bubble → avatar → name → activity / app label.
 * When user has a session goal (✓ on avatar), hovering only the checkmark
 * shows a white pill with the goal text. Hover is limited to the checkmark.
 */
export function AvatarChip({ user, isSelf }: Props) {
  const [hovered, setHovered] = useState(false);
  const color = ACTIVITY_COLORS[user.activity] ?? "#C4B9A8";
  const avatar = resolveAvatarId(user.avatarId);
  const activityLabel = ACTIVITY_LABELS[user.activity] ?? "";
  const elapsed = useElapsedTime(user.activityStartedAt);

  // Show app name if available, otherwise fall back to activity label
  const appOrLabel = user.appName || activityLabel;
  // Discord-style: "VS Code · 1h 23m"
  const subtitle = appOrLabel ? `${appOrLabel} · ${elapsed}` : elapsed;

  const hasGoal = Boolean(user.sessionTodo?.trim());
  const goalText = hasGoal ? user.sessionTodo!.trim() : "";

  return (
    <div
      className={`relative flex flex-col items-center min-w-0 ${isSelf ? "opacity-100" : "opacity-90"}`}
      style={{
        animation: "bounce-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
      }}
    >
      {/* Fixed-height slot so swapping thought bubble ↔ goal pill never changes layout (prevents reflow/flashing).
          ThoughtBubble md = 34px bubble + 2px gap + 7px dot + 2px gap + 4px dot = 49px. */}
      <div className="relative flex flex-col items-center justify-center w-full min-h-[49px]">
        {hasGoal && goalText && hovered ? (
          /* Session goal pill — same slot as thought bubble, no height change */
          <div
            className="rounded-full bg-white px-2.5 py-1 shadow-md border border-black/8 max-w-[120px]"
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.12)" }}
          >
            <p className="text-[9px] font-semibold text-gray-800 truncate block text-center leading-tight">
              {goalText}
            </p>
          </div>
        ) : (
          /* Thought bubble — activity (Idle, Coding, etc.) when not showing goal */
          <ThoughtBubble activity={user.activity} size="md" />
        )}
      </div>

      {/* Standing character — 3:4 ratio, with optional goal checkmark badge */}
      <div className="relative w-16 aspect-[3/4] mt-0.5 shrink-0">
        <img
          src={`/avatars/${avatar}.png`}
          alt={user.displayName}
          className="w-full h-full object-contain drop-shadow-[0_1px_4px_rgba(0,0,0,0.12)]"
          draggable={false}
        />
        {hasGoal && (
          <div
            className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-leaf flex items-center justify-center shadow-md border-2 border-white/90 cursor-default"
            aria-label={goalText ? `Session goal: ${goalText}` : "Session goal"}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <span className="text-white text-[10px] font-bold leading-none pointer-events-none" style={{ marginTop: "-1px" }}>✓</span>
          </div>
        )}
      </div>

      {/* Name label */}
      <span
        className="text-white text-[11px] font-bold rounded-full px-2 max-w-[80px] truncate mt-0.5"
        style={{
          backgroundColor: `${color}CC`,
          textShadow: "0 1px 2px rgba(0,0,0,0.2)",
        }}
      >
        {isSelf ? "You" : user.displayName}
      </span>

      {/* Activity / app name */}
      {subtitle && (
        <span
          className="text-[9px] font-semibold max-w-[80px] truncate mt-px"
          style={{ color: color }}
        >
          {subtitle}
        </span>
      )}
    </div>
  );
}
