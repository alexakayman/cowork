import { useState } from "react";
import { AVATARS, PUBLIC_AVATARS, resolveAvatarId } from "../../lib/avatars";
import { useAppStore } from "../../stores/app";

interface Props {
  onClose: () => void;
}

/**
 * Full-page character select screen.
 * Replaces the Dashboard while open — much easier to browse than a tiny popover.
 */
export function CharacterSelect({ onClose }: Props) {
  const avatarId = useAppStore((s) => s.avatarId);
  const setAvatar = useAppStore((s) => s.setAvatar);
  const unlockedSpecialAvatarIds = useAppStore((s) => s.unlockedSpecialAvatarIds);
  const redeemSpecialCode = useAppStore((s) => s.redeemSpecialCode);
  const resolvedAvatar = resolveAvatarId(avatarId);

  const [redeemCode, setRedeemCode] = useState("");
  const [redeemMessage, setRedeemMessage] = useState<"success" | "invalid" | null>(null);

  const selectableAvatars = [
    ...PUBLIC_AVATARS,
    ...AVATARS.filter((a) => unlockedSpecialAvatarIds.includes(a.id)),
  ].filter(
    (a, i, arr) => arr.findIndex((b) => b.id === a.id) === i
  );

  const handleSelect = (id: string) => {
    setAvatar(id);
    onClose();
  };

  const handleRedeem = (e: React.FormEvent) => {
    e.preventDefault();
    setRedeemMessage(null);
    if (!redeemCode.trim()) return;
    const ok = redeemSpecialCode(redeemCode.trim());
    setRedeemMessage(ok ? "success" : "invalid");
    if (ok) setRedeemCode("");
  };

  return (
    <div className="min-h-screen bg-cream text-cocoa p-5 flex flex-col gap-4 animate-fade-in">
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onClose}
          className="text-cocoa-light hover:text-cocoa transition-colors text-lg font-bold"
          title="Back"
        >
          {"\u{2190}"}
        </button>
        <h1 className="text-xl font-extrabold tracking-tight">
          Choose your buddy
        </h1>
      </div>

      {/* Redeem special character */}
      <div className="rounded-2xl border-2 border-tan bg-white p-3">
        <label className="block text-sm font-semibold text-cocoa-light mb-2">
          Redeem special character
        </label>
        <form onSubmit={handleRedeem} className="flex gap-2">
          <input
            type="text"
            value={redeemCode}
            onChange={(e) => {
              setRedeemCode(e.target.value);
              setRedeemMessage(null);
            }}
            placeholder="Enter code"
            className="flex-1 min-w-0 bg-cream border-2 border-tan rounded-xl px-3 py-2 text-sm text-cocoa placeholder:text-sand focus:outline-none focus:border-leaf transition-colors uppercase"
            maxLength={20}
          />
          <button
            type="submit"
            className="bg-leaf hover:bg-leaf-dark text-white rounded-xl px-4 py-2 text-sm font-bold transition-colors"
          >
            Redeem
          </button>
        </form>
        {redeemMessage === "success" && (
          <p className="text-xs text-leaf font-semibold mt-2">Code accepted! You can now select the character below.</p>
        )}
        {redeemMessage === "invalid" && (
          <p className="text-xs text-rose font-semibold mt-2">Invalid code.</p>
        )}
      </div>

      {/* Character grid — 3 columns for nice big previews */}
      <div className="grid grid-cols-3 gap-3 stagger-children">
        {selectableAvatars.map((avatar) => (
          <button
            key={avatar.id}
            onClick={() => handleSelect(avatar.id)}
            className={`flex flex-col items-center gap-1.5 rounded-2xl border-3 p-3 pb-2 transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] ${
              resolvedAvatar === avatar.id
                ? "border-leaf bg-butter/40 shadow-[0_0_0_3px_rgba(86,186,90,0.2)]"
                : "border-tan bg-white hover:border-leaf-light hover:shadow-cozy"
            }`}
          >
            {/* Character art — nice and big */}
            <div className="w-full aspect-[3/4]">
              <img
                src={`/avatars/${avatar.id}.png`}
                alt={avatar.label}
                className="w-full h-full object-contain drop-shadow-[0_1px_4px_rgba(0,0,0,0.12)]"
                draggable={false}
              />
            </div>
            <span
              className={`text-xs font-bold ${
                resolvedAvatar === avatar.id ? "text-cocoa" : "text-cocoa-light"
              }`}
            >
              {avatar.label}
            </span>
            {resolvedAvatar === avatar.id && (
              <span className="text-[10px] font-semibold text-leaf -mt-1">
                Current
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
