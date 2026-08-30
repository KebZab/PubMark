import { Layers } from "lucide-react";

export function FloorSwitcher({ floor, onChange, counts, className = "" }) {
  return (
    <div
      className={`flex items-center gap-1.5 bg-white/96 backdrop-blur-md rounded-2xl shadow-lg border border-gray-100/80 px-2 py-1.5 ${className}`}
    >
      <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
        <Layers className="w-3.5 h-3.5 text-gray-400" />
      </div>
      {["1", "2"].map((f) => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={`relative px-3 py-1 rounded-xl text-xs font-bold transition-all ${
            floor === f
              ? "bg-gradient-to-r from-[#14B8A6] to-[#0d9488] text-white shadow-md shadow-teal-500/30"
              : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
          }`}
        >
          {f === "1" ? "1F" : "2F"}
          {counts && (
            <span className={`ml-1 ${floor === f ? "text-teal-100" : "text-gray-400"}`}>
              {counts[f]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
