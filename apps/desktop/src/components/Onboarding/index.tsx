import { useState } from "react";
import { useAppStore } from "../../stores/app";
import { AVATARS } from "../../lib/avatars";

export function Onboarding() {
  const setProfile = useAppStore((s) => s.setProfile);
  const [name, setName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0].id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      setProfile(name.trim(), selectedAvatar);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-5">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md flex flex-col gap-5 animate-bounce-in"
      >
        {/* Welcome header */}
        <div className="text-center">
          <p className="text-4xl mb-2">{"\u{1F343}"}</p>
          <h1 className="text-2xl font-extrabold text-cocoa mb-1">
            Welcome to Cowork
          </h1>
          <p className="text-cocoa-light text-sm font-medium">
            Set up your profile to get started
          </p>
        </div>

        {/* Name input */}
        <div>
          <label className="block text-sm font-semibold text-cocoa-light mb-1">
            Display Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full bg-white border-2 border-tan rounded-xl px-4 py-2.5 text-sm text-cocoa placeholder:text-sand focus:outline-none focus:border-leaf transition-colors duration-200"
            autoFocus
            maxLength={20}
          />
        </div>

        {/* Avatar picker — full 3:4 standing characters */}
        <div>
          <label className="block text-sm font-semibold text-cocoa-light mb-2">
            Pick your buddy
          </label>
          <div className="grid grid-cols-4 gap-2 stagger-children">
            {AVATARS.map((avatar) => (
              <button
                key={avatar.id}
                type="button"
                onClick={() => setSelectedAvatar(avatar.id)}
                className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-1.5 pb-1 transition-all duration-200 hover:scale-105 ${
                  selectedAvatar === avatar.id
                    ? "border-leaf bg-butter/40 shadow-[0_0_0_2px_rgba(86,186,90,0.2)]"
                    : "border-tan bg-white hover:border-leaf-light"
                }`}
              >
                {/* 3:4 character art */}
                <div className="w-full aspect-[3/4] relative">
                  <img
                    src={`/avatars/${avatar.id}.png`}
                    alt={avatar.label}
                    className="w-full h-full object-contain"
                    draggable={false}
                  />
                </div>
                <span
                  className={`text-[10px] font-bold leading-tight ${
                    selectedAvatar === avatar.id
                      ? "text-cocoa"
                      : "text-cocoa-light"
                  }`}
                >
                  {avatar.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!name.trim()}
          className="bg-leaf hover:bg-leaf-dark disabled:bg-tan disabled:text-sand text-white rounded-full px-4 py-3 text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-cozy"
        >
          Let's Go! {"\u{1F331}"}
        </button>
      </form>
    </div>
  );
}
