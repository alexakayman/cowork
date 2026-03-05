import type { UserState } from "@cowork/shared";
import { ACTIVITY_COLORS } from "../../lib/activityMeta";
import { resolveAvatarId } from "../../lib/avatars";
import { ThoughtBubble } from "../ThoughtBubble";

interface Props {
  user: UserState;
  isSelf: boolean;
}

/**
 * Overlay chip: standing 3:4 character with a thought bubble above its head.
 * Designed for the always-on-top transparent overlay window.
 */
export function AvatarChip({ user, isSelf }: Props) {
  const color = ACTIVITY_COLORS[user.activity] ?? "#C4B9A8";
  const avatar = resolveAvatarId(user.avatarId);

  return (
    <div
      className={`flex flex-col items-center ${isSelf ? "opacity-100" : "opacity-90"}`}
      style={{ animation: "bounce-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both" }}
    >
      {/* Thought bubble */}
      <ThoughtBubble activity={user.activity} size="sm" />

      {/* Standing character — 3:4 ratio */}
      <div className="w-10 aspect-[3/4] mt-px">
        <img
          src={`/avatars/${avatar}.png`}
          alt={user.displayName}
          className="w-full h-full object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]"
          draggable={false}
        />
      </div>

      {/* Name label */}
      <span
        className="text-white text-[9px] font-bold rounded-full px-1.5 max-w-[52px] truncate mt-0.5"
        style={{
          backgroundColor: `${color}CC`,
          textShadow: "0 1px 2px rgba(0,0,0,0.2)",
        }}
      >
        {isSelf ? "You" : user.displayName}
      </span>
    </div>
  );
}
