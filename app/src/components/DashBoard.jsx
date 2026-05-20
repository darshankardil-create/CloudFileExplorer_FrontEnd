"use client";
import AIAssistant from "./Ai";
import {
  IconStorage,
  IconClose,
  IconLogout,
  IconTrash,
  IconMenu,
} from "./Icons";
import AuthScreen from "./../components/Authscreen";
import { ConfirmModal, DeleteAccountModal } from "./Input";
import Sidebar from "./Sidebar";
import ContentPanel from "./Contentpanel";
import useFetch from "../lib/fetch.jsx";
import { getToken, removeToken } from "./../token";
import { useState, useEffect } from "react";
import DC from "./../DC";
import toast from "react-hot-toast";
import io from "socket.io-client";

// ════════════════════════════════════════════════════════════════════════════════
// Dashboard
// ════════════════════════════════════════════════════════════════════════════════
export default function Dashboard() {
  const { Fetchapi } = useFetch();

  const [user, setUser] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const STORAGE_PATH_KEY = "cloudfileexplorer_current_path";

  useEffect(() => {
    const token = getToken();

    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBootstrapping(false);
      return;
    }
    Fetchapi("/me")
      .then((d) =>
        setUser({
          token,
          id: d.payloadwithotherinfo.docid,
          username: d.payloadwithotherinfo.username,
        }),
      )
      .catch(() => removeToken())
      .finally(() => setBootstrapping(false));
  }, []);

  const [treeData, setTreeData] = useState([]);
  const [treeLoading, setTreeLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedFolder, setSelectedFolder] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PATH_KEY);
      if (saved) {
        const s = JSON.parse(saved);
        if (s.length > 0)
          return { id: s[s.length - 1].id, name: s[s.length - 1].name };
      }
    } catch {}
    return { id: "__top__", name: "My Storage" };
  });
  const [logoutModal, setLogoutModal] = useState(false);
  const [deleteAccModal, setDeleteAccModal] = useState(false);

  async function loadTree(userId) {
    if (!userId) return;
    setTreeLoading(true);
    try {
      const res = await Fetchapi(`/initiallevelfolders/${userId}`);
      const root = res.rootfolderdata || [];
      const folderItems = root.filter((i) => i?.folderid?.folderid);
      const enriched = await Promise.all(
        folderItems.map(async (item) => {
          const fid = String(item.folderid.folderid);
          try {
            const data = await fetchFolderRecursive(fid);
            return { ...item, folderData: data };
          } catch {
            return { ...item, folderData: { folderid: fid, foldername: "…" } };
          }
        }),
      );
      setTreeData(enriched);
    } catch {
      toast.error("Failed to load storage tree");
    } finally {
      setTreeLoading(false);
    }
  }

  async function fetchFolderRecursive(folderId) {
    try {
      const res = await Fetchapi(`/getfolderdatasbyid/${folderId}`);
      const fd = res.folderdata;
      if (!fd) return null;
      const enriched = await Promise.all(
        (fd.files_and_nested_folders_ids || []).map(async (item) => {
          if (item?.folderids?.folderid) {
            const child = await fetchFolderRecursive(
              String(item.folderids.folderid),
            );
            return {
              ...item,
              folderids: { ...item.folderids, folderData: child },
            };
          }
          return item;
        }),
      );
      return {
        ...fd,
        folderid: String(fd._id),
        files_and_nested_folders_ids: enriched,
      };
    } catch {
      return null;
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (user) loadTree(user.id);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
  function refreshTree() {
    if (user) loadTree(user.id);
    setReloadKey((k) => k + 1);
  }

  function handleSelectFolder(id, name) {
    setSelectedFolder({ id, name });
    setSidebarOpen(false);
  }

  async function executeMoveFromSidebar(targetParentId, targetIsTop) {
    const { item, type, sourceParentId, sourceIsTop } = DC;
    if (!item) return;
    const itemId = type === "file" ? item.publicid : item.folderid;
    if (
      !itemId ||
      String(itemId) === String(targetParentId) ||
      targetParentId === sourceParentId
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
      toast.success("Moved");
      refreshTree();
    } catch (e) {
      toast.error(e.message || "Move failed");
    } finally {
      DC.item = null;
    }
  }

  const handleDropToFolder = (folderId) =>
    executeMoveFromSidebar(folderId, false);
  const handleDropToTop = () => executeMoveFromSidebar(user?.id, true);

  async function handleDeleteAccount() {
    try {
      await Fetchapi(`/deletenestedfolder/${user.id}/root/deleteac`, {
        method: "DELETE",
        body: JSON.stringify({
          arrayoffoldersids: [user.id], //1 route handles both
        }),
      });
      removeToken();
      localStorage.removeItem(STORAGE_PATH_KEY);
      toast.success("Account deleted");
      setUser(null);
    } catch (e) {
      toast.error(e.message || "Account deletion failed");
    }
  }

  if (bootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center animate-pulse">
            <IconStorage className="h-5 w-5 text-blue-400" />
          </div>
          <p className="text-sm text-slate-500">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onAuth={setUser} />;
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <AIAssistant user={user} />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
        fixed lg:relative z-30 lg:z-auto
        flex flex-col h-full
        w-64 lg:w-60
        border-r border-slate-700/40 bg-slate-900
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        shrink-0
      `}
      >
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-slate-700/30">
          <div className="h-7 w-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
            <IconStorage className="h-3.5 w-3.5 text-blue-400" />
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-100 flex-1">
            CloudFileExplorer
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 transition-colors"
          >
            <IconClose className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden py-3">
          <Sidebar
            user={user}
            selectedFolder={selectedFolder}
            onSelectFolder={handleSelectFolder}
            treeData={treeData}
            treeLoading={treeLoading}
            onDropToTop={handleDropToTop}
            onDropToFolder={handleDropToFolder}
          />
        </div>
        <div className="border-t border-slate-700/30 p-3 flex flex-col gap-1">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="h-6 w-6 rounded-full bg-blue-600/40 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-300 shrink-0">
              {user.username[0].toUpperCase()}
            </div>
            <span className="text-xs text-slate-300 truncate flex-1">
              {user.username}
            </span>
          </div>
          <button
            onClick={() => setLogoutModal(true)}
            className="flex items-center gap-2 w-full px-2.5 py-1.5 text-xs text-slate-400 hover:bg-slate-700/40 hover:text-slate-200 rounded-lg transition-colors"
          >
            <IconLogout className="h-3.5 w-3.5" /> Sign Out
          </button>
          <button
            onClick={() => setDeleteAccModal(true)}
            className="flex items-center gap-2 w-full px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-950/30 hover:text-red-300 rounded-lg transition-colors"
          >
            <IconTrash className="h-3.5 w-3.5" /> Delete Account
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-950 min-w-0">
        {/* Mobile top bar with hamburger */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700/40 lg:hidden shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 transition-colors"
          >
            <IconMenu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <IconStorage className="h-3 w-3 text-blue-400" />
            </div>
            <span className="font-bold text-sm tracking-tight text-slate-100">
              CloudFileExplorer
            </span>
          </div>
          <div className="flex-1" />
          <div className="h-6 w-6 rounded-full bg-blue-600/40 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-300">
            {user.username?.[0]?.toUpperCase()}
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <ContentPanel
            user={user}
            selectedFolder={selectedFolder}
            onSelectFolder={handleSelectFolder}
            onRefreshTree={refreshTree}
            reloadKey={reloadKey}
          />
        </div>
      </main>

      {logoutModal && (
        <ConfirmModal
          title="Sign Out"
          message="Are you sure you want to sign out of CloudFileExplorer?"
          confirmLabel="Sign Out"
          onClose={() => setLogoutModal(false)}
          onConfirm={() => {
            removeToken();
            setUser(null);
            toast.success("Signed out");
          }}
        />
      )}
      {deleteAccModal && (
        <DeleteAccountModal
          onClose={() => setDeleteAccModal(false)}
          onConfirm={handleDeleteAccount}
        />
      )}
    </div>
  );
}
