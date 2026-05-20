import { formatBytes, formatTime } from "./../formatter";
import setDragGhost from "./Dragghost";
import Image from "next/image";
import { IconCheck, IconTrash, IconFile } from "./Icons";
import { ActionBtn } from "./Input";

export default function FileCard({
  file,
  selectedIds,
  toggleSelect,
  setDeletingFiles,
  startDrag,
}) {
  const isImage =
    file.url &&
    (/\/image\/upload\//i.test(file.url) ||
      /\.(jpg|jpeg|png|gif|webp|svg|avif)(\?|$)/i.test(file.url));
  const isSelected = selectedIds.has(file.publicid);

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        setDragGhost(e, file.name || file.publicid, true);
        startDrag(file, "file");
      }}
      onClick={() => window.open(file.url, "_blank", "noopener,noreferrer")}
      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all cursor-pointer select-none ${
        isSelected
          ? "border-blue-500/40 bg-blue-900/20"
          : "border-slate-700/40 bg-slate-800/40 hover:bg-slate-800/70 hover:border-slate-600/60"
      }`}
    >
      <div
        onClick={(e) => toggleSelect(file.publicid, e)}
        className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center cursor-pointer transition-colors ${isSelected ? "bg-blue-600 border-blue-500" : "border-slate-600 hover:border-blue-400"}`}
      >
        {isSelected && <IconCheck className="h-3 w-3 text-white" />}
      </div>
      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
        {isImage ? (
          <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-slate-600/50">
            <Image
              src={file.url}
              alt={file.name || "file"}
              fill
              className="object-cover hover:scale-110 transition-transform duration-300"
              sizes="40px"
            />
          </div>
        ) : (
          <IconFile className="h-8 w-8" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200 truncate">
          {file.name || file.publicid}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-slate-500">
            {formatBytes(file.bytes)}
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-xs text-slate-500">
            {formatTime(file.time)}
          </span>
        </div>
      </div>
      <div
        className="flex items-center gap-0.5 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <ActionBtn
          onClick={() => setDeletingFiles([file.publicid])}
          title="Delete"
          colorClass="text-slate-400 hover:text-red-400 hover:bg-slate-700"
        >
          <IconTrash className="h-3.5 w-3.5" />
        </ActionBtn>
      </div>
    </div>
  );
}
