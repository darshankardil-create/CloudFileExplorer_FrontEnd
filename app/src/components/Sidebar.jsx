"use client";
import { IconStorage, IconSpinner } from "./Icons";
import FolderNode from "./foldernode";
import DC from "./../DC";
import { useState } from "react";

// ════════════════════════════════════════════════════════════════════════════════
// Sidebar
// ════════════════════════════════════════════════════════════════════════════════

function Sidebar({
  user,
  selectedFolder,
  onSelectFolder,
  treeData,
  treeLoading,
  onDropToTop,
  onDropToFolder,
}) {
  const [dragOverId, setDragOverId] = useState(null);
  const [dragOverTop, setDragOverTop] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!DC.item) return;
          setDragOverTop(true);
        }}
        onDragLeave={() => setDragOverTop(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOverTop(false);
          if (!DC.item) return;
          onDropToTop();
        }}
        onClick={() => onSelectFolder("__top__", "My Storage")}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all mx-2 mb-1 ${
          dragOverTop
            ? "bg-blue-600/30 border border-blue-500/50"
            : selectedFolder?.id === "__top__"
              ? "bg-blue-600/20 text-blue-300"
              : "hover:bg-slate-700/30 text-slate-300"
        }`}
      >
        <IconStorage className="h-4 w-4 shrink-0" />
        <span className="text-xs font-semibold flex-1">Home page (root)</span>
        {dragOverTop && (
          <span className="text-[10px] text-blue-400">Drop here</span>
        )}
      </div>
      <div className="mx-2 my-1 h-px bg-slate-700/30" />
      <div className="flex-1 overflow-y-auto px-1.5 pb-4">
        {treeLoading ? (
          <div className="flex flex-col gap-2 mt-2 px-2">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <IconSpinner className="h-3.5 w-3.5 text-blue-400" />
              <span>Loading…</span>
            </div>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-6 rounded-lg bg-slate-800/40 animate-pulse"
              />
            ))}
          </div>
        ) : treeData.length === 0 ? (
          <p className="text-xs text-slate-600 px-3 py-2">No folders yet</p>
        ) : (
          treeData.map((item) => {
            const fid = String(item.folderid.folderid);
            const data = item.folderData || { folderid: fid, foldername: "…" };
            return (
              <FolderNode
                key={fid}
                folderData={data}
                depth={0}
                parentId={user.id}
                parentIsTop={true}
                user={user}
                selectedFolder={selectedFolder}
                onSelectFolder={onSelectFolder}
                dragOverId={dragOverId}
                setDragOverId={setDragOverId}
                onDropToFolder={onDropToFolder}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

export default Sidebar;
