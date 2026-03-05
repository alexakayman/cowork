import { useState } from "react";
import { useAppStore } from "../../stores/app";

export function BlocklistSettings() {
  const { blocklist, addToBlocklist, removeFromBlocklist } = useAppStore();
  const [newProcess, setNewProcess] = useState("");

  const handleAdd = () => {
    const trimmed = newProcess.trim().toLowerCase();
    if (trimmed && !blocklist.includes(trimmed)) {
      addToBlocklist(trimmed);
      setNewProcess("");
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-cozy flex flex-col gap-3 animate-fade-in">
      <p className="text-xs font-bold text-cocoa-light uppercase tracking-wider">
        Blocked Apps {"\u{1F6AB}"}
      </p>
      <p className="text-xs text-cocoa-light">
        These apps will show as &quot;Idle&quot; to your coworkers.
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          value={newProcess}
          onChange={(e) => setNewProcess(e.target.value)}
          placeholder="e.g. chrome, slack"
          className="flex-1 bg-cream border-2 border-tan rounded-xl px-3 py-2.5 text-sm text-cocoa placeholder:text-sand focus:outline-none focus:border-leaf transition-colors duration-200"
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <button
          onClick={handleAdd}
          disabled={!newProcess.trim()}
          className="bg-orange hover:bg-orange-light disabled:bg-tan disabled:text-sand text-white rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          Block
        </button>
      </div>

      {blocklist.length > 0 ? (
        <div className="flex flex-wrap gap-2 stagger-children">
          {blocklist.map((process) => (
            <span
              key={process}
              className="inline-flex items-center gap-1.5 bg-cream border border-tan rounded-full px-3 py-1 text-sm font-semibold text-cocoa"
            >
              {process}
              <button
                onClick={() => removeFromBlocklist(process)}
                className="text-cocoa-light hover:text-rose transition-colors duration-150 ml-0.5 font-bold"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-cocoa-light italic">No apps blocked yet.</p>
      )}
    </div>
  );
}
