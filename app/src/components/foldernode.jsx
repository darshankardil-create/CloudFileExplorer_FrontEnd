"use client";
import { FolderSizeModal } from "./Input";
import { useState } from "react";
import setDragGhost from "./Dragghost";
import useFetch from "../lib/fetch.jsx";
import DC from "./../DC";
import toast from "react-hot-toast";
import {
  IconChevron,
  IconFolder,
  IconSize,
  IconEdit,
  IconTrash,
} from "./Icons";
import { ConfirmModal, RenameFolderModal } from "./Input";

function FolderNode({
  folderData,
  depth,
  parentId,
  parentIsTop,
  user,
  selectedFolder,
  onSelectFolder,
  dragOverId,
  setDragOverId,
  onDropToFolder,
  onRefreshTree,
}) {
  const { Fetchapi } = useFetch();

  const [open, setOpen] = useState(false);
  const [renameModal, setRenameModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [sizeModal, setSizeModal] = useState(false);

  const folderId = String(folderData?.folderid || folderData?._id || "");
  const folderName = folderData?.foldername || "…";
  const isSelected = selectedFolder?.id === folderId;
  const isDragOver = dragOverId === folderId;
  const nestedFolders = (folderData?.files_and_nested_folders_ids || []).filter(
    (i) => i?.folderids?.folderid,
  );
  const hasChildren = nestedFolders.length > 0;
  const indent = depth * 14;

  function handleChevronClick(e) {
    e.stopPropagation();
    setOpen((o) => !o);
  }

  async function handleRename(newName) {
    try {
      await Fetchapi(
        `/renamefolder/${folderId}/${encodeURIComponent(newName)}`,
        { method: "PUT" },
      );
      setRenameModal(false);
      toast.success("Folder renamed");
      onRefreshTree();
    } catch {
      toast.error("Rename failed");
    }
  }
  async function handleDelete() {
    try {
      const rootParam = parentIsTop ? "root" : "nested";
      await Fetchapi(`/deletenestedfolder/${user.id}/${rootParam}/nodelete`, {
        method: "DELETE",
        body: JSON.stringify({ arrayoffoldersids: [folderId] }),
      });
      setDeleteModal(false);
      toast.success("Folder deleted");
      onRefreshTree();
    } catch (e) {
      toast.error(e.message || "Delete failed");
    }
  }

  return (
    <div>
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = "move";
          setDragGhost(e, folderName);
          DC.item = { folderid: folderId, foldername: folderName };
          DC.type = "folder";
          DC.sourceParentId = parentId;
          DC.sourceIsTop = parentIsTop;
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (DC.item && String(DC.item.folderid) === folderId) return;
          e.dataTransfer.dropEffect = "move";
          setDragOverId(folderId);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setDragOverId(null);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOverId(null);
          if (
            !DC.item ||
            String(DC.item.folderid || DC.item.publicid) === folderId
          )
            return;
          onDropToFolder(folderId);
        }}
        onClick={() => onSelectFolder(folderId, folderName)}
        style={{ paddingLeft: `${8 + indent}px` }}
        className={`group flex items-center gap-1.5 py-1 px-2 rounded-lg cursor-pointer transition-all select-none ${
          isDragOver
            ? "bg-blue-600/30 border border-blue-500/50 scale-[1.01]"
            : isSelected
              ? "bg-blue-600/20 text-blue-300"
              : "hover:bg-slate-700/40 text-slate-300"
        }`}
      >
        {hasChildren ? (
          <span
            onClick={handleChevronClick}
            className="shrink-0 w-3 flex items-center justify-center"
          >
            <IconChevron
              open={open}
              className={`h-3 w-3 ${isSelected ? "text-blue-400" : "text-slate-500"}`}
            />
          </span>
        ) : (
          <span className="w-3 shrink-0" />
        )}
        <IconFolder open={open} className="h-4 w-4 shrink-0" />
        <span className="text-xs font-medium truncate flex-1">
          {folderName}
        </span>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSizeModal(true);
            }}
            className="rounded p-0.5 text-slate-500 hover:bg-slate-600/60 hover:text-blue-300 transition-colors"
          >
            <IconSize className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setRenameModal(true);
            }}
            className="rounded p-0.5 text-slate-500 hover:bg-slate-600/60 hover:text-blue-300 transition-colors"
          >
            <IconEdit className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteModal(true);
            }}
            className="rounded p-0.5 text-slate-500 hover:bg-slate-600/60 hover:text-red-400 transition-colors"
          >
            <IconTrash className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Children — only rendered when open */}
      {open && hasChildren && (
        <div className="relative">
          <div
            className="absolute top-0 bottom-0 w-px bg-slate-700/40"
            style={{ left: `${16 + indent}px` }}
          />
          {nestedFolders.map((item) => (
            <FolderNode
              key={item._id || String(item.folderids.folderid)}
              folderData={
                item?.folderids?.folderData || {
                  folderid: item.folderids.folderid,
                  foldername: item?.folderids?.foldername || "…",
                }
              }
              depth={depth + 1}
              parentId={folderId}
              parentIsTop={false}
              user={user}
              selectedFolder={selectedFolder}
              onSelectFolder={onSelectFolder}
              dragOverId={dragOverId}
              setDragOverId={setDragOverId}
              onDropToFolder={onDropToFolder}
              onRefreshTree={onRefreshTree}
            />
          ))}
        </div>
      )}

      {renameModal && (
        <RenameFolderModal
          current={folderName}
          onClose={() => setRenameModal(false)}
          onConfirm={handleRename}
        />
      )}
      {deleteModal && (
        <ConfirmModal
          title="Delete Folder"
          message={`Delete "${folderName}" and all its contents? This cannot be undone.`}
          danger
          confirmLabel="Delete"
          onClose={() => setDeleteModal(false)}
          onConfirm={handleDelete}
        />
      )}
      {sizeModal && (
        <FolderSizeModal
          folderId={folderId}
          folderName={folderName}
          onClose={() => setSizeModal(false)}
        />
      )}
    </div>
  );
}

export default FolderNode;
