import type { UserState } from "@cowork/shared";
import { ACTIVITY_COLORS, ACTIVITY_ICONS, ACTIVITY_LABELS } from "../../lib/activityMeta";
import { resolveAvatarId } from "../../lib/avatars";
import { useElapsedTime } from "../../hooks/useElapsedTime";

interface Props {
  user: UserState;
  isSelf: boolean;
}

/**
 * Overlay chip: character → focus chip → user label → emoji + app · time → goal (colored text, no bubbles).
 */
export function AvatarChip({ user, isSelf }: Props) {
  const color = ACTIVITY_COLORS[user.activity] ?? "#C4B9A8";
  const avatar = resolveAvatarId(user.avatarId);
  const activityLabel = ACTIVITY_LABELS[user.activity] ?? "";
  const activityIcon = ACTIVITY_ICONS[user.activity] ?? "\u{2753}";
  const elapsed = useElapsedTime(user.activityStartedAt);

  const appOrLabel = user.appName || activityLabel;
  const appLine = appOrLabel ? `${appOrLabel} · ${elapsed}` : elapsed;
  const goalLine = user.sessionTodo?.trim() || "no goal";

  return (
    <div
      className={`relative flex flex-col items-center min-w-0 ${isSelf ? "opacity-100" : "opacity-90"}`}
      style={{
        animation: "bounce-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
      }}
    >
      {/* Character; focus chip bottom-right */}
      <div className="relative w-16 aspect-[3/4] shrink-0">
        <img
          src={`/avatars/${avatar}.png`}
          alt={user.displayName}
          className="w-full h-full object-contain drop-shadow-[0_1px_4px_rgba(0,0,0,0.12)]"
          draggable={false}
        />
        <div
          className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white/90 shadow-md ${
            user.isFocused ? "bg-rose" : "bg-leaf"
          }`}
          title={user.isFocused ? "Locked in" : "Can chat"}
          aria-hidden
        />
      </div>

      {/* User label */}
      <span
        className="text-white text-[11px] font-bold rounded-full px-2 max-w-[80px] truncate mt-0.5"
        style={{
          backgroundColor: `${color}CC`,
          textShadow: "0 1px 2px rgba(0,0,0,0.2)",
        }}
      >
        {isSelf ? "You" : user.displayName}
      </span>

      {/* Emoji + app name · timestamp (colored) */}
      <span
        className="text-[9px] font-semibold max-w-[80px] mt-px flex items-center justify-center gap-0.5 min-w-0"
        style={{ color }}
      >
        <span className="shrink-0">{activityIcon}</span>
        <span className="truncate min-w-0">{appLine}</span>
      </span>

      {/* Goal under app line, same color */}
      <span
        className="text-[9px] font-normal max-w-[80px] truncate mt-px block text-center"
        style={{ color }}
      >
        {goalLine}
      </span>
    </div>
  );
}
