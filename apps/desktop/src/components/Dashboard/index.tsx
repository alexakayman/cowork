import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore } from "../../stores/app";
import { useSessionStore } from "../../stores/session";
import { usePresenceSocket } from "../../hooks/usePresenceSocket";
import { useActivityListener } from "../../hooks/useActivityListener";
import { useElapsedTime } from "../../hooks/useElapsedTime";
import { resolveAvatarId } from "../../lib/avatars";
import { ThoughtBubble } from "../ThoughtBubble";
import { BlocklistSettings } from "./BlocklistSettings";
import { CharacterSelect } from "./CharacterSelect";
import { useOverlayBridge } from "../../hooks/useOverlayBridge";
import { ActivityType } from "@cowork/shared";

/** Tiny wrapper so we can call useElapsedTime per-user inside a list */
function MemberDuration({ sinceMs }: { sinceMs: number }) {
  const elapsed = useElapsedTime(sinceMs);
  return (
    <p className="text-[8px] font-semibold text-cocoa-light truncate max-w-full">
      {elapsed}
    </p>
  );
}

export function Dashboard() {
  const { displayName, avatarId, currentActivity, currentAppName, activityStartedAt } = useAppStore();
  const selfElapsed = useElapsedTime(activityStartedAt);
  const { sessionCode, connected, users, clearSession } = useSessionStore();
  const { send } = usePresenceSocket();
  const [joinCode, setJoinCode] = useState("");
  const [showCharacterSelect, setShowCharacterSelect] = useState(false);

  useActivityListener();
  useOverlayBridge(); // Sync state to overlay webview via Tauri events

  const handleCreateSession = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    useSessionStore.getState().setSession(code, []);
  };

  const handleJoinSession = () => {
    if (joinCode.trim()) {
      useSessionStore.getState().setSession(joinCode.trim().toUpperCase(), []);
    }
  };

  const handleLeaveSession = () => {
    send({
      type: "LEAVE",
      payload: { userId: useAppStore.getState().userId },
    });
    invoke("hide_overlay").catch(() => {});
    clearSession();
  };

  const handleShowOverlay = () => {
    invoke("show_overlay").catch(console.error);
  };

  // ── Full-page character select ──
  if (showCharacterSelect) {
    return <CharacterSelect onClose={() => setShowCharacterSelect(false)} />;
  }

  const usersArray = Array.from(users.values());
  const activity = currentActivity ?? ActivityType.IDLE;
  const resolvedAvatar = resolveAvatarId(avatarId);

  return (
    <div className="min-h-screen bg-cream text-cocoa p-5 flex flex-col gap-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-1.5">
          {"\u{1F343}"} Cowork
        </h1>
        <span className="text-sm font-semibold text-cocoa-light">
          Hi, {displayName} {"\u{1F44B}"}
        </span>
      </div>

      {/* Your Activity — character + thought bubble */}
      <div className="bg-white rounded-2xl p-4 shadow-cozy animate-bounce-in">
        <p className="text-xs font-bold text-cocoa-light uppercase tracking-wider mb-3">
          Your Activity
        </p>
        <div className="flex items-end gap-4">
          {/* Character with thought bubble — click to open full-page picker */}
          <button
            onClick={() => setShowCharacterSelect(true)}
            className="flex flex-col items-center shrink-0 group cursor-pointer"
            title="Change character"
          >
            <ThoughtBubble activity={activity} size="md" />
            <div className="w-16 aspect-[3/4] mt-0.5 relative">
              <img
                src={`/avatars/${resolvedAvatar}.png`}
                alt={displayName}
                className="w-full h-full object-contain"
                draggable={false}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 rounded-xl transition-colors">
                <span className="text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md">
                  {"\u{270F}\u{FE0F}"}
                </span>
              </div>
            </div>
            {/* Activity duration — Discord-style rich presence */}
            <div className="text-xs font-semibold text-cocoa-light mt-1 text-center">
              {currentAppName || "Idle"} · {selfElapsed}
            </div>
          </button>
        </div>
      </div>

      {/* Session */}
      {sessionCode ? (
        <div className="bg-white rounded-2xl p-4 shadow-cozy flex flex-col gap-3 animate-bounce-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-cocoa-light uppercase tracking-wider">
                Session
              </p>
              <p className="font-mono text-lg font-extrabold text-cocoa">
                {sessionCode}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  connected ? "bg-leaf animate-pulse-soft" : "bg-rose"
                }`}
              />
              <span className="text-xs font-semibold text-cocoa-light">
                {connected ? "Connected" : "Reconnecting..."}
              </span>
            </div>
          </div>

          <button
            onClick={() => navigator.clipboard.writeText(sessionCode)}
            className="text-sm font-semibold text-leaf hover:text-leaf-dark text-left transition-colors duration-150"
          >
            Copy session code {"\u{1F4CB}"}
          </button>

          <button
            onClick={handleShowOverlay}
            className="bg-leaf hover:bg-leaf-dark text-white rounded-full px-4 py-2.5 text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-cozy"
          >
            Show Overlay {"\u{1F440}"}
          </button>

          {/* Members — standing characters with thought bubbles */}
          <div>
            <p className="text-xs font-bold text-cocoa-light uppercase tracking-wider mb-3">
              Friends ({usersArray.length}) {"\u{1F465}"}
            </p>
            <div className="flex flex-wrap gap-3 stagger-children">
              {usersArray.map((user) => {
                const avatar = resolveAvatarId(user.avatarId);
                return (
                  <div
                    key={user.userId}
                    className="flex flex-col items-center bg-cream rounded-2xl p-2 pt-1.5 transition-all duration-200 hover:shadow-cozy"
                    style={{ width: 72 }}
                  >
                    {/* Thought bubble */}
                    <ThoughtBubble activity={user.activity} size="sm" />
                    {/* Character */}
                    <div className="w-12 aspect-[3/4] mt-px">
                      <img
                        src={`/avatars/${avatar}.png`}
                        alt={user.displayName}
                        className="w-full h-full object-contain"
                        draggable={false}
                      />
                    </div>
                    {/* Name */}
                    <p className="text-[10px] font-bold text-cocoa truncate max-w-full mt-0.5">
                      {user.displayName}
                    </p>
                    {/* Duration — Discord-style */}
                    <MemberDuration sinceMs={user.activityStartedAt} />
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleLeaveSession}
            className="text-sm font-semibold text-rose hover:text-rose/70 mt-1 transition-colors duration-150"
          >
            Leave Session
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-4 shadow-cozy flex flex-col gap-3 animate-bounce-in">
          <p className="text-xs font-bold text-cocoa-light uppercase tracking-wider">
            Start a Session {"\u{2728}"}
          </p>
          <button
            onClick={handleCreateSession}
            className="bg-leaf hover:bg-leaf-dark text-white rounded-full px-4 py-3 text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-cozy"
          >
            Create Session {"\u{1F3E0}"}
          </button>
          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Enter session code"
              className="flex-1 bg-cream border-2 border-tan rounded-xl px-3 py-2.5 text-sm text-cocoa placeholder:text-sand focus:outline-none focus:border-leaf transition-colors duration-200"
              onKeyDown={(e) => e.key === "Enter" && handleJoinSession()}
            />
            <button
              onClick={handleJoinSession}
              className="bg-orange hover:bg-orange-light text-white rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              Join
            </button>
          </div>
        </div>
      )}

      {/* Blocklist */}
      <BlocklistSettings />
    </div>
  );
}
