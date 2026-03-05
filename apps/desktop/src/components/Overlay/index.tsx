import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import type { UserState } from "@cowork/shared";
import { AvatarChip } from "./AvatarChip";

interface OverlaySyncPayload {
  selfUser: UserState;
  others: UserState[];
  sessionCode: string | null;
}

/**
 * Overlay window — a separate Tauri webview with its own JS runtime.
 *
 * It cannot read Zustand stores from the main window, so it receives
 * all state via `overlay-sync` Tauri events emitted by the Dashboard's
 * useOverlayBridge hook.
 *
 * Always renders the local user (even if alone in the session) plus
 * any other session members. Content is right-aligned so the characters
 * cluster in the bottom-right corner of the screen.
 */
export function Overlay() {
  const [selfUser, setSelfUser] = useState<UserState | null>(null);
  const [others, setOthers] = useState<UserState[]>([]);

  useEffect(() => {
    // Force transparent background for the overlay window
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";
    console.log("[Overlay] mounted, listening for overlay-sync events");

    const unlisten = listen<OverlaySyncPayload>("overlay-sync", (event) => {
      const { selfUser: self, others: otherUsers } = event.payload;
      console.log(
        "[Overlay] sync received — self:",
        self.displayName,
        "activity:",
        self.activity,
        "others:",
        otherUsers.length,
      );
      setSelfUser(self);
      setOthers(otherUsers);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  // Don't render until we receive initial state from the main window
  if (!selfUser) return null;

  // Self first, then others sorted alphabetically
  const allUsers = [
    selfUser,
    ...others.sort((a, b) => a.displayName.localeCompare(b.displayName)),
  ];

  return (
    <div className="w-full h-full flex flex-row items-end justify-end gap-2 p-2 pointer-events-none select-none">
      {allUsers.map((user) => (
        <AvatarChip
          key={user.userId}
          user={user}
          isSelf={user.userId === selfUser.userId}
        />
      ))}
    </div>
  );
}
