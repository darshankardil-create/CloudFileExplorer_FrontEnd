"use client";
import React from "react";

const Loading = () => {
  React.useEffect(() => {
    function blockKeys(e) {
      e.preventDefault();
    }

    window.addEventListener("keydown", blockKeys);

    return () => {
      window.removeEventListener("keydown", blockKeys);
    };
  }, []);

  return (
    <div
      className="absolute inset-0 z-50 pointer-events-none"
      aria-hidden="true"
    >
      {/* Dim wash */}
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] rounded-inherit" />
      {/* Animated top progress bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 overflow-hidden">
        <div
          className="h-full bg-blue-400/80 animate-fetch-progress"
          style={{
            animation: "fetchProgress 1.4s ease-in-out infinite",
          }}
        />
      </div>
      {/* Centered spinner + label */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex items-center gap-2.5 rounded-xl bg-slate-900/80 border border-slate-700/50 px-4 py-2.5 shadow-xl">
          <svg
            className="h-4 w-4 text-blue-400 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-90"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          <span className="text-xs font-medium text-slate-300 tracking-wide">
            Loading…
          </span>
        </div>
      </div>
    </div>
  );
};

export default Loading;
