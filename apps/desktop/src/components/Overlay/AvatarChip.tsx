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
 * Shows: thought-bubble → avatar → name → activity / app label
 */
export function AvatarChip({ user, isSelf }: Props) {
  const color = ACTIVITY_COLORS[user.activity] ?? "#C4B9A8";
  const avatar = resolveAvatarId(user.avatarId);
  const activityLabel = ACTIVITY_LABELS[user.activity] ?? "";
  const elapsed = useElapsedTime(user.activityStartedAt);

  // Show app name if available, otherwise fall back to activity label
  const appOrLabel = user.appName || activityLabel;
  // Discord-style: "VS Code · 1h 23m"
  const subtitle = appOrLabel ? `${appOrLabel} · ${elapsed}` : elapsed;

  return (
    <div
      className={`flex flex-col items-center ${isSelf ? "opacity-100" : "opacity-90"}`}
      style={{
        animation: "bounce-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
      }}
    >
      {/* Thought bubble — use md size for visibility */}
      <ThoughtBubble activity={user.activity} size="md" />

      {/* Standing character — 3:4 ratio, ~1.5x of previous w-10 */}
      <div className="w-16 aspect-[3/4] mt-0.5">
        <img
          src={`/avatars/${avatar}.png`}
          alt={user.displayName}
          className="w-full h-full object-contain drop-shadow-[0_1px_4px_rgba(0,0,0,0.12)]"
          draggable={false}
        />
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
