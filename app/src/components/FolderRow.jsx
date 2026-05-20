import { IconCheck, IconFolder, IconSize, IconEdit, IconTrash } from "./Icons";
import { useState, useEffect } from "react";
import useFetch from "./../lib/fetch";
import { formatBytes } from "../formatter";
import setDragGhost from "./Dragghost";
import toast from "react-hot-toast";
import DC from "./../DC";
import {
  ActionBtn,
  RenameFolderModal,
  ConfirmModal,
  FolderSizeModal,
} from "./Input";

// FolderRow — also extracted outside render to keep identity stable

export default function FolderRow({
  folderId: fid,
  dragOverId,
  selectedIds,
  isTop,
  currentId,
  user,
  navigateInto,
  toggleSelect,
  setDragOverId,
  handleDropOnFolderRow,
  onRefreshTree,
  loadItems,
  startDrag,
}) {
  const [folderName, setFolderName] = useState(null);
  const [folderSize, setFolderSize] = useState(null);
  const [renameModal, setRenameModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [sizeModal, setSizeModal] = useState(false);
  const isDragTarget = dragOverId === fid;
  const isSelected = selectedIds.has(fid);

  const { Fetchapi } = useFetch();

  useEffect(() => {
    Fetchapi(`/getfolderdatasbyid/${fid}`)
      .then((r) => setFolderName(r.folderdata?.foldername || fid))
      .catch(() => {});
    Fetchapi(`/getfoldersize/${fid}`)
      .then((r) => setFolderSize(r.size))
      .catch(() => {});
  }, [fid]);

  async function doRename(newName) {
    await Fetchapi(`/renamefolder/${fid}/${encodeURIComponent(newName)}`, {
      method: "PUT",
    });
    setFolderName(newName);
    setRenameModal(false);
    toast.success("Renamed");
    onRefreshTree();
  }
  async function doDelete() {
    try {
      const rootParam = isTop ? "root" : "nested";
      await Fetchapi(`/deletenestedfolder/${user.id}/${rootParam}/nodelete`, {
        method: "DELETE",
        body: JSON.stringify({ arrayoffoldersids: [fid] }),
      });
      setDeleteModal(false);
      toast.success("Folder deleted");
      loadItems(currentId, isTop);
      onRefreshTree();
    } catch (e) {
      toast.error(e.message || "Delete failed");
    }
  }

  const displayName = folderName || "Loading…";

  return (
    <>
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = "move";
          setDragGhost(e, displayName);
          startDrag({ folderid: fid, foldername: displayName }, "folder");
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (DC.item && String(DC.item.folderid || DC.item.publicid) === fid)
            return;
          e.dataTransfer.dropEffect = "move";
          setDragOverId(fid);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setDragOverId(null);
        }}
        onDrop={(e) => handleDropOnFolderRow(e, fid)}
        onClick={() => navigateInto(fid, displayName)}
        className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all cursor-pointer select-none ${
          isDragTarget
            ? "border-blue-500/60 bg-blue-600/20 scale-[1.01]"
            : isSelected
              ? "border-blue-500/40 bg-blue-900/20"
              : "border-slate-700/30 bg-slate-800/30 hover:bg-slate-800/60 hover:border-slate-600/50"
        }`}
      >
        <div
          onClick={(e) => toggleSelect(fid, e)}
          className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center cursor-pointer transition-colors ${isSelected ? "bg-blue-600 border-blue-500" : "border-slate-600 hover:border-blue-400"}`}
        >
          {isSelected && <IconCheck className="h-3 w-3 text-white" />}
        </div>
        <IconFolder open={false} className="h-8 w-8 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-200 truncate">
            {displayName}
          </p>
          {folderSize != null && (
            <p className="text-xs text-slate-500 mt-0.5">
              {formatBytes(folderSize)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <ActionBtn
            onClick={() => setSizeModal(true)}
            title="Size"
            colorClass="text-slate-400 hover:text-blue-300 hover:bg-slate-700"
          >
            <IconSize className="h-3.5 w-3.5" />
          </ActionBtn>
          <ActionBtn
            onClick={() => setRenameModal(true)}
            title="Rename"
            colorClass="text-slate-400 hover:text-blue-400 hover:bg-slate-700"
          >
            <IconEdit className="h-3.5 w-3.5" />
          </ActionBtn>
          <ActionBtn
            onClick={() => setDeleteModal(true)}
            title="Delete"
            colorClass="text-slate-400 hover:text-red-400 hover:bg-slate-700"
          >
            <IconTrash className="h-3.5 w-3.5" />
          </ActionBtn>
        </div>
      </div>
      {renameModal && (
        <RenameFolderModal
          current={displayName}
          onClose={() => setRenameModal(false)}
          onConfirm={doRename}
        />
      )}
      {deleteModal && (
        <ConfirmModal
          title="Delete Folder"
          message={`Delete "${displayName}" and all its contents? This cannot be undone.`}
          danger
          confirmLabel="Delete"
          onClose={() => setDeleteModal(false)}
          onConfirm={doDelete}
        />
      )}
      {sizeModal && (
        <FolderSizeModal
          folderId={fid}
          folderName={displayName}
          onClose={() => setSizeModal(false)}
        />
      )}
    </>
  );
}
