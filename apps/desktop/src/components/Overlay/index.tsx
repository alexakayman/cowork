import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
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
 * The window auto-resizes to fit its content and can be dragged via
 * a grip handle that appears on hover. After each drag the position
 * is clamped to screen safe-areas so it never goes off-screen.
 */
export function Overlay() {
  const [selfUser, setSelfUser] = useState<UserState | null>(null);
  const [others, setOthers] = useState<UserState[]>([]);
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // ── Listen for state syncs from main window ───────────────────────
  useEffect(() => {
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";

    const unlisten = listen<OverlaySyncPayload>("overlay-sync", (event) => {
      const { selfUser: self, others: otherUsers } = event.payload;
      setSelfUser(self);
      setOthers(otherUsers);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  // ── Auto-resize window to fit content ─────────────────────────────
  useEffect(() => {
    if (!contentRef.current || !selfUser) return;

    const el = contentRef.current;
    const observer = new ResizeObserver(() => {
      const w = el.scrollWidth;
      const h = el.scrollHeight;
      invoke("fit_overlay", { width: w + 16, height: h + 16 }).catch(
        console.error,
      );
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [selfUser, others.length]);

  // ── Drag via native Tauri window dragging ─────────────────────────
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    const appWindow = getCurrentWebviewWindow();
    appWindow.startDragging().finally(() => {
      // startDragging resolves when the drag ends (mouse released)
      setDragging(false);
      setHovered(false);
      // Clamp to safe screen boundaries
      invoke("clamp_overlay").catch(console.error);
    });
  }, []);

  // Don't render until we receive initial state from the main window
  if (!selfUser) return null;

  // Self first, then others sorted alphabetically
  const allUsers = [
    selfUser,
    ...others.sort((a, b) => a.displayName.localeCompare(b.displayName)),
  ];

  return (
    <div className="w-full h-full flex items-end justify-end select-none">
      <div
        ref={contentRef}
        className="relative flex flex-row items-end gap-3 pt-7 px-3 pb-3"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          if (!dragging) setHovered(false);
        }}
      >
        {/* Drag handle — appears on hover */}
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-white/90 rounded-full px-2 py-1 shadow-md cursor-grab active:cursor-grabbing transition-all duration-150 ${
            hovered || dragging
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-1 pointer-events-none"
          }`}
          onMouseDown={handleDragStart}
        >
          {/* Grip dots */}
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            className="text-gray-400"
          >
            <circle cx="2" cy="2" r="1.2" fill="currentColor" />
            <circle cx="8" cy="2" r="1.2" fill="currentColor" />
            <circle cx="2" cy="5" r="1.2" fill="currentColor" />
            <circle cx="8" cy="5" r="1.2" fill="currentColor" />
            <circle cx="2" cy="8" r="1.2" fill="currentColor" />
            <circle cx="8" cy="8" r="1.2" fill="currentColor" />
          </svg>
          <span className="text-[9px] font-semibold text-gray-400">drag</span>
        </div>

        {allUsers.map((user) => (
          <AvatarChip
            key={user.userId}
            user={user}
            isSelf={user.userId === selfUser.userId}
          />
        ))}
      </div>
    </div>
  );
}
