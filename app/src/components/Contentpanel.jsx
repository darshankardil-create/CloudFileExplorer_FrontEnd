import { CldUploadWidget } from "next-cloudinary";
import { useState, useRef, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import useFetch from "../lib/fetch.jsx";
import FolderRow from "./FolderRow";
import FileCard from "./FileCard";
import DC from "./../DC";
import {
  IconFolder,
  IconTrash,
  IconBack,
  IconSelectAll,
  IconPlus,
  IconUpload,
} from "./Icons";
import { ConfirmModal, Btn, CreateFolderModal, FileNameModal } from "./Input";

// ════════════════════════════════════════════════════════════════════════════════
// ContentPanel
// ════════════════════════════════════════════════════════════════════════════════
function ContentPanel({
  user,
  selectedFolder,
  onSelectFolder,
  onRefreshTree,
  reloadKey,
}) {
  const { Fetchapi } = useFetch();

  const STORAGE_PATH_KEY = "cloudfileexplorer_current_path";

  const [navStack, setNavStack] = useState(() => {
    try {
      const s = localStorage.getItem(STORAGE_PATH_KEY);
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });

  const [createFolderModal, setCreateFolderModal] = useState(false);
  const [deletingFiles, setDeletingFiles] = useState([]);
  const [dragOverId, setDragOverId] = useState(null);
  const [dragOverPanel, setDragOverPanel] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [pendingUploadName, setPendingUploadName] = useState(false);
  const [uploadWidgetOpen, setUploadWidgetOpen] = useState(null);
  const pendingFileNameRef = useRef("");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const prevSelectedIdRef = useRef(null);
  useEffect(() => {
    if (!selectedFolder) return;
    if (prevSelectedIdRef.current === selectedFolder.id) return;
    prevSelectedIdRef.current = selectedFolder.id;
    if (selectedFolder.id === "__top__") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNavStack([]);
      localStorage.setItem(STORAGE_PATH_KEY, JSON.stringify([]));
    } else {
      setNavStack((prev) => {
        if (prev.length > 0 && prev[prev.length - 1].id === selectedFolder.id)
          return prev;
        const next = [{ id: selectedFolder.id, name: selectedFolder.name }];
        localStorage.setItem(STORAGE_PATH_KEY, JSON.stringify(next));
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFolder?.id]);

  const currentView =
    navStack.length > 0 ? navStack[navStack.length - 1] : null;
  const isTop = currentView === null;
  const currentId = currentView?.id ?? null;

  // Refs to always hold the latest isTop and currentId for use in stale closures
  const isTopRef = useRef(isTop);
  const currentIdRef = useRef(currentId);
  useEffect(() => {
    isTopRef.current = isTop;
    currentIdRef.current = currentId;
  }, [isTop, currentId]);

  const loadItems = useCallback(
    async (id, top) => {
      setLoading(true);
      setSelectedIds(new Set());
      try {
        if (top) {
          const res = await Fetchapi(`/initiallevelfolders/${user.id}`);
          const raw = res.rootfolderdata || [];
          const normalized = raw
            .map((i) => {
              if (i?.file_ids?.publicid) return { file_ids: i.file_ids };
              // Folder: has a real ObjectId
              if (i?.folderid?.folderid) return { folderid: i.folderid };

              return null;
            })
            .filter(Boolean);

          setItems(normalized);
        } else {
          const res = await Fetchapi(`/getfolderdatasbyid/${id}`);
          setItems(res.folderdata?.files_and_nested_folders_ids || []);
        }
      } catch {
        toast.error("Failed to load contents");
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [user.id],
  );

  const loadKey = `${currentId}|${isTop}|${reloadKey}`;
  const prevLoadKeyRef = useRef(null);
  useEffect(() => {
    if (prevLoadKeyRef.current === loadKey) return;
    prevLoadKeyRef.current = loadKey;
    loadItems(currentId, isTop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadKey, loadItems]);

  // Parse items into folders and files
  const folders = isTop
    ? items
        .filter((i) => i?.folderid?.folderid)
        .map((i) => ({ id: String(i.folderid.folderid) }))
    : items
        .filter((i) => i?.folderids?.folderid)
        .map((i) => ({ id: String(i.folderids.folderid) }));

  const files = isTop
    ? items.filter((i) => i?.file_ids?.publicid).map((i) => i.file_ids)
    : items.filter((i) => i?.file_ids?.publicid).map((i) => i.file_ids);

  const allIds = [...folders.map((f) => f.id), ...files.map((f) => f.publicid)];
  const allSelected =
    allIds.length > 0 && allIds.every((id) => selectedIds.has(id));
  const someSelected = selectedIds.size > 0;

  function toggleSelectAll() {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(allIds));
  }

  // Navigation
  function navigateInto(folderId, folderName) {
    const next = [...navStack, { id: folderId, name: folderName }];
    setNavStack(next);
    localStorage.setItem(STORAGE_PATH_KEY, JSON.stringify(next));
    onSelectFolder(folderId, folderName);
  }
  function navigateTo(idx) {
    if (idx < 0) {
      setNavStack([]);
      localStorage.setItem(STORAGE_PATH_KEY, JSON.stringify([]));
      onSelectFolder("__top__", "My Storage");
      return;
    }
    const next = navStack.slice(0, idx + 1);
    setNavStack(next);
    localStorage.setItem(STORAGE_PATH_KEY, JSON.stringify(next));
    onSelectFolder(next[next.length - 1].id, next[next.length - 1].name);
  }

  // Create folder
  async function handleCreateFolder(name) {
    try {
      if (isTop)
        await Fetchapi(`/createtoplevelfolder/${user.id}`, {
          method: "POST",
          body: JSON.stringify({ type: "folder", foldername: name }),
        });
      else
        await Fetchapi(`/createnestedfolder/${currentId}`, {
          method: "POST",
          body: JSON.stringify({ type: "folder", foldername: name }),
        });
      setCreateFolderModal(false);
      toast.success("Folder created");
      loadItems(currentId, isTop);
      onRefreshTree();
    } catch {
      toast.error("Failed to create folder");
    }
  }

  // Delete
  async function confirmDeleteFiles(ids) {
    try {
      const level = isTop ? "top" : "nested";
      const folderParam = isTop ? "none" : currentId;
      await Fetchapi(
        `/deleteonlyfiles/${user.id}/${folderParam}?level=${level}`,
        { method: "DELETE", body: JSON.stringify({ idsoffiletodelete: ids }) },
      );
      toast.success(
        `${ids.length > 1 ? `${ids.length} files` : "File"} deleted`,
      );
      setDeletingFiles([]);
      setSelectedIds(new Set());
      loadItems(currentId, isTop);
    } catch {
      toast.error("Delete failed");
    }
  }

  async function deleteSelected() {
    const folderIds = [],
      fileIds = [];
    for (const id of selectedIds) {
      if (folders.some((f) => f.id === id)) folderIds.push(id);
      else fileIds.push(id);
    }
    try {
      if (folderIds.length > 0) {
        const rootParam = isTop ? "root" : "nested";
        await Fetchapi(`/deletenestedfolder/${user.id}/${rootParam}/nodelete`, {
          method: "DELETE",
          body: JSON.stringify({ arrayoffoldersids: folderIds }),
        });
      }
      if (fileIds.length > 0) {
        await confirmDeleteFiles(fileIds);
        return;
      }
      toast.success("Selected items deleted");
      setSelectedIds(new Set());
      loadItems(currentId, isTop);
      onRefreshTree();
    } catch (e) {
      toast.error(e.message || "Delete failed");
    }
  }

  function toggleSelect(id, e) {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const n = new Set(prev);
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  // Drag helpers
  function startDrag(item, type) {
    DC.item = item;
    DC.type = type;
    DC.sourceParentId = isTop ? user.id : currentId;
    DC.sourceIsTop = isTop;
  }
  async function executeMove(targetParentId, targetIsTop) {
    const { item, type, sourceParentId, sourceIsTop } = DC;
    if (!item) return;
    const itemId = type === "file" ? item.publicid : item.folderid;
    if (
      !itemId ||
      targetParentId === sourceParentId ||
      String(itemId) === String(targetParentId)
    ) {
      DC.item = null;
      return;
    }
    let apiType, route;
    try {
      if (type === "folder") {
        apiType = "folder";
        if (sourceIsTop && !targetIsTop) route = "toptobottom";
        if (!sourceIsTop && targetIsTop) route = "bottomtotop";
      } else {
        if (sourceIsTop && !targetIsTop) {
          apiType = "toplevel";
          route = "toptobottom";
        } else if (!sourceIsTop && targetIsTop) {
          apiType = "toplevel";
          route = "bottomtotop";
        } else {
          apiType = "file";
        }
      }
      let url = `/handledraganddrop/${sourceParentId}/${targetParentId}/${itemId}?type=${apiType}`;
      if (route) url += `&route=${route}`;
      await Fetchapi(url, { method: "PUT" });
      toast.success("Moved successfully");
      loadItems(currentId, isTop);
      onRefreshTree();
    } catch (e) {
      toast.error(e.message || "Move failed");
    } finally {
      DC.item = null;
    }
  }
  function handlePanelDrop(e) {
    e.preventDefault();
    setDragOverPanel(false);
    if (!DC.item) return;
    const itemId = DC.type === "file" ? DC.item.publicid : DC.item.folderid;
    const targetId = isTop ? user.id : currentId;
    if (String(itemId) === String(targetId) || DC.sourceParentId === targetId) {
      DC.item = null;
      return;
    }
    executeMove(isTop ? user.id : currentId, isTop);
  }
  function handleDropOnFolderRow(e, targetFolderId) {
    e.preventDefault();
    e.stopPropagation();
    setDragOverId(null);
    if (!DC.item) return;
    const itemId = DC.type === "file" ? DC.item.publicid : DC.item.folderid;
    if (String(itemId) === String(targetFolderId)) {
      DC.item = null;
      return;
    }
    executeMove(targetFolderId, false);
  }

  // Upload — reads from refs to avoid stale closure
  async function handleUploadSuccess(result) {
    const uploadIsTop = isTopRef.current;
    const uploadCurrentId = currentIdRef.current;

    const { public_id, secure_url, bytes, original_filename } = result.info;
    const displayName =
      pendingFileNameRef.current || original_filename || public_id;
    const file_ids = {
      publicid: encodeURIComponent(public_id),
      url: secure_url,
      name: displayName,
      bytes,
    };
    try {
      if (uploadIsTop)
        await Fetchapi(`/createtoplevelfolder/${user.id}`, {
          method: "POST",
          body: JSON.stringify({ type: "file", file_ids }),
        });
      else
        await Fetchapi(`/createnestedfolder/${uploadCurrentId}`, {
          method: "POST",
          body: JSON.stringify({ type: "file", file_ids }),
        });
      toast.success(`Uploaded: ${displayName}`);
      pendingFileNameRef.current = "";
      loadItems(uploadCurrentId, uploadIsTop);
    } catch {
      toast.error("Failed to save file info");
    }
  }

  const breadcrumb = [{ id: "__top__", name: "My Storage" }, ...navStack];

  return (
    <div
      className={`flex flex-col h-full transition-colors ${dragOverPanel ? "bg-blue-950/10" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOverPanel(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setDragOverPanel(false);
      }}
      onDrop={handlePanelDrop}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-700/40 px-3 sm:px-6 py-3 sm:py-3.5 shrink-0 gap-2 sm:gap-4 flex-wrap">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {navStack.length > 0 && (
            <button
              onClick={() => navigateTo(navStack.length - 2)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 transition-colors shrink-0"
            >
              <IconBack className="h-4 w-4" />
            </button>
          )}
          <nav className="flex items-center gap-1 text-xs min-w-0 flex-wrap">
            {breadcrumb.map((crumb, idx) => (
              <span key={crumb.id} className="flex items-center gap-1">
                {idx > 0 && <span className="text-slate-600">/</span>}
                <button
                  onClick={() => navigateTo(idx - 1)}
                  className={`truncate max-w-20 sm:max-w-30 transition-colors rounded px-1 py-0.5 ${
                    idx === breadcrumb.length - 1
                      ? "text-slate-200 font-semibold cursor-default"
                      : "text-slate-500 hover:text-blue-300 hover:bg-slate-700/40"
                  }`}
                >
                  {crumb.name}
                </button>
              </span>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap justify-end">
          {someSelected && (
            <Btn
              variant="danger"
              onClick={() => {
                const fileIds = [...selectedIds].filter((id) =>
                  files.some((f) => f.publicid === id),
                );
                const folderIds = [...selectedIds].filter((id) =>
                  folders.some((f) => f.id === id),
                );
                if (folderIds.length > 0) deleteSelected();
                else setDeletingFiles(fileIds);
              }}
              className="text-xs px-2.5 py-1.5"
            >
              <IconTrash className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                Delete {selectedIds.size} selected
              </span>
              <span className="sm:hidden">{selectedIds.size}</span>
            </Btn>
          )}
          <span className="text-xs text-slate-600 hidden lg:inline">
            {folders.length}f · {files.length}f
          </span>
          {allIds.length > 0 && (
            <Btn
              variant="secondary"
              onClick={toggleSelectAll}
              className={`text-xs px-2.5 py-1.5 ${allSelected ? "border-blue-500/50 text-blue-300" : ""}`}
            >
              <IconSelectAll className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {allSelected ? "Deselect All" : "Select All"}
              </span>
            </Btn>
          )}
          <Btn
            variant="secondary"
            onClick={() => setCreateFolderModal(true)}
            className="text-xs px-2.5 py-1.5"
          >
            <IconPlus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New Folder</span>
          </Btn>
          <CldUploadWidget
            uploadPreset="ml_default"
            options={{ multiple: false }}
            onSuccess={handleUploadSuccess}
          >
            {({ open }) => (
              <Btn
                onClick={() => {
                  setUploadWidgetOpen(() => open);
                  setPendingUploadName(true);
                }}
                className="text-xs px-2.5 py-1.5"
              >
                <IconUpload className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Upload</span>
              </Btn>
            )}
          </CldUploadWidget>
        </div>
      </div>

      {dragOverPanel && DC.item && (
        <div className="mx-5 mt-3 rounded-xl border border-dashed border-blue-500/60 bg-blue-600/10 px-4 py-2 text-xs text-blue-400 text-center shrink-0">
          Drag and drop the currently selected item into your desired folder to
          move it there.
        </div>
      )}

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5">
        {loading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 rounded-xl bg-slate-800/40 animate-pulse"
              />
            ))}
          </div>
        ) : folders.length === 0 && files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <div className="h-14 w-14 rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center">
              <IconFolder open={false} className="h-7 w-7 opacity-40" />
            </div>
            <p className="text-sm text-slate-500">This location is empty</p>
            <p className="text-xs text-slate-600">
              Create a folder or upload files to get started
            </p>
          </div>
        ) : (
          <>
            {folders.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2.5">
                  Folders
                </p>
                <div className="flex flex-col gap-1.5">
                  {folders.map((folder) => (
                    <FolderRow
                      key={folder.id}
                      folderId={folder.id}
                      dragOverId={dragOverId}
                      selectedIds={selectedIds}
                      isTop={isTop}
                      currentId={currentId}
                      user={user}
                      navigateInto={navigateInto}
                      toggleSelect={toggleSelect}
                      setDragOverId={setDragOverId}
                      handleDropOnFolderRow={handleDropOnFolderRow}
                      onRefreshTree={onRefreshTree}
                      loadItems={loadItems}
                      startDrag={startDrag}
                    />
                  ))}
                </div>
              </div>
            )}
            {files.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2.5">
                  Files
                </p>
                <div className="flex flex-col gap-1.5">
                  {files.map(
                    (f, idx) =>
                      f?.publicid && (
                        <FileCard
                          key={f.publicid || idx}
                          file={f}
                          selectedIds={selectedIds}
                          toggleSelect={toggleSelect}
                          setDeletingFiles={setDeletingFiles}
                          startDrag={startDrag}
                        />
                      ),
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {createFolderModal && (
        <CreateFolderModal
          onClose={() => setCreateFolderModal(false)}
          onConfirm={handleCreateFolder}
        />
      )}
      {pendingUploadName && (
        <FileNameModal
          onClose={() => {
            setPendingUploadName(false);
            pendingFileNameRef.current = "";
          }}
          onConfirm={(name) => {
            pendingFileNameRef.current = name;
            setPendingUploadName(false);
            if (uploadWidgetOpen) uploadWidgetOpen();
          }}
        />
      )}
      {deletingFiles.length > 0 && (
        <ConfirmModal
          title="Delete File(s)"
          message={`Delete ${deletingFiles.length > 1 ? `${deletingFiles.length} files` : "this file"} permanently?`}
          danger
          confirmLabel="Delete"
          onClose={() => setDeletingFiles([])}
          onConfirm={() => confirmDeleteFiles(deletingFiles)}
        />
      )}
    </div>
  );
}

export default ContentPanel;
