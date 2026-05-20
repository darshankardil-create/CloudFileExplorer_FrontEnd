"use client";
import toast from "react-hot-toast";
import axios from "axios";
import API from "./../lib/apibasepath";
import { CldUploadWidget } from "next-cloudinary";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";

import {
  IconSend,
  IconSparkle,
  IconClose,
  IconCheck,
  IconXSmall,
  IconLoader,
  IconChevronDown,
  IconPaperclip,
  IconFile,
} from "./Icons";

// ─── uid ──────────────────────────────────────────────────────────────────────
let _id = 0;
const uid = () => ++_id;

// ─── helpers ──────────────────────────────────────────────────────────────────
function fmt(ts) {
  return new Date(ts).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
function fmtBytes(b) {
  if (!b) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(2)} MB`;
}

// ─── localStorage helpers (safe) ──────────────────────────────────────────────
const LS_KEY = "ai_attachment";
function lsGet() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function lsSet(val) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(val));
  } catch {}
}
function lsClear() {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {}
}

// ─── FileNameModal ─────────────────────────────────────────────────────────────
// Shown before opening the Cloudinary widget so the user can set a custom name.
function FileNameModal({ onConfirm, onCancel }) {
  const [name, setName] = useState("");
  const inputRef = useRef(null);

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Please enter a file name");
      return;
    }
    onConfirm(trimmed);
  }

  return (
    // Backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-80 rounded-2xl border border-slate-700/60 bg-slate-900 shadow-2xl shadow-black/60 p-5">
        <p className="text-sm font-semibold text-slate-200 mb-1 tracking-tight">
          Name your file
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. project-brief, invoice-jan"
            className="w-full rounded-xl border border-slate-700/60 bg-slate-800 px-3 py-2 text-[12px] text-slate-200 placeholder-slate-600 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 font-mono tracking-wide"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-xl border border-slate-700/50 bg-slate-800 py-2 text-[11px] font-semibold text-slate-400 hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-blue-600 py-2 text-[11px] font-semibold text-white hover:bg-blue-500 transition-colors"
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
const AIAssistant = ({ user }) => {
  const [log, setLog] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [socket, setsocket] = useState(null);

  // Attachment: { publicid, url, name, bytes, time, isImage }
  const [attachment, setAttachment] = useState(null);
  const [attachLoading, setAttachLoading] = useState(false);

  // Controls the filename modal visibility + stores the pending custom name
  const [showNameModal, setShowNameModal] = useState(false);
  const pendingNameRef = useRef(""); // holds the name entered in the modal

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const widgetOpenRef = useRef(null);

  const meid = user?.id ?? "";

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);

    const soc = io("https://cloudfileexplorer-backend-1.onrender.com");

    soc.on("connect", () => {
      setsocket(soc);
    });

    return () => {
      soc.disconnect();
    };
  }, []);

  // ── Restore attachment from localStorage on mount ──────────────────────────
  useEffect(() => {
    const saved = lsGet();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved?.publicid) setAttachment(saved);
  }, []);

  // ── Persist attachment to localStorage whenever it changes ─────────────────
  useEffect(() => {
    if (attachment?.publicid) {
      lsSet(attachment);
    } else {
      lsClear();
    }
  }, [attachment]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  // ── patch a log entry ───────────────────────────────────────────────────────
  const patch = useCallback((id, status, label) => {
    setLog((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status, label } : e)),
    );
  }, []);

  // ── Step 1: user clicks paperclip → show name modal ────────────────────────
  function handleAttachClick() {
    if (loading || attachment) return;
    setShowNameModal(true);
  }

  // ── Step 2: user confirms name → open Cloudinary widget ────────────────────
  function handleNameConfirm(name) {
    pendingNameRef.current = name;
    setShowNameModal(false);
    setAttachLoading(true);
    // Small delay so the modal unmounts cleanly before the widget opens
    setTimeout(() => widgetOpenRef.current?.(), 100);
  }

  function handleNameCancel() {
    setShowNameModal(false);
    pendingNameRef.current = "";
  }

  // ── Step 3: Cloudinary upload success ──────────────────────────────────────
  // We override the name with the one the user typed; public_id comes from
  // Cloudinary but we surface pendingNameRef.current as the display name.
  function handleUploadSuccess(result) {
    const { public_id, secure_url, bytes, resource_type } = result.info;
    const isImage =
      resource_type === "image" ||
      /\.(jpg|jpeg|png|gif|webp|svg|avif)$/i.test(secure_url);

    const customName = pendingNameRef.current || public_id;

    setAttachment({
      publicid: public_id, // real Cloudinary public_id (used for deletion)
      url: secure_url,
      name: customName, // user-defined display / storage name
      bytes: bytes ?? 0,
      time: Date.now(),
      isImage,
    });
    pendingNameRef.current = "";
    setAttachLoading(false);
    toast.success("File attached — send your command");
  }

  // ── Remove attachment ───────────────────────────────────────────────────────
  async function handleRemoveAttachment() {
    if (!attachment) return;
    setAttachLoading(true);
    try {
      const res = await axios.delete(
        `${API}/deleteonlyfiles/noneed1/noneed2?level=aichat`,
        { data: { idsoffiletodelete: [attachment.publicid] } },
      );
      toast.success(res.data.message);
      setAttachment(null);
    } catch (error) {
      toast.error(error?.response?.data?.message ?? "Failed to remove file");
      console.error(error);
    } finally {
      setAttachLoading(false);
    }
  }

  // ── runAICommand ────────────────────────────────────────────────────────────
  // file_ids is passed in when an attachment is present so nested/root
  // placements use the real file data, never n/a dummies.
  function runAICommand(cmd, mydata, id, file_ids = null) {
    const noFile = { publicid: "n/a", url: "n/a", name: "n/a", bytes: 0 };

    try {
      const messages = [
        { role: "user", content: `${cmd} MyData:${JSON.stringify(mydata)}` },
      ];

      socket.emit("send", { dataforai: messages });

      socket.on("errorinai", (data) => {
        throw new Error(data.message);
      });

      socket.on("success", async (data) => {
        //await axios.post(`${API}/ai`, );
        const obj =
          typeof data?.myai === "string" ? JSON.parse(data.myai) : "failed";

        if (obj === "failed" || !obj || obj?.error) {
          patch(id, "error", obj?.error ?? "Operation failed");
          return;
        }

        switch (obj.endpoint) {
          case "createtoplevelfolder":
            await axios.post(`${API}/createtoplevelfolder/${meid}`, {
              // If a file is attached and AI decided root placement, use real data
              type: file_ids ? "file" : (obj?.type ?? "folder"),
              foldername: file_ids
                ? file_ids.name
                : (obj?.foldername ?? "Untitled"),
              file_ids: file_ids ?? noFile,
            });
            patch(
              id,
              "done",
              file_ids
                ? `File "${file_ids.name}" saved at root`
                : `Folder "${obj?.foldername ?? "Untitled"}" created at root`,
            );
            break;

          case "createnestedfolder":
            await axios.post(`${API}/createnestedfolder/${obj.idoffolderdoc}`, {
              // If a file is attached and AI decided nested placement, use real data
              type: file_ids ? "file" : (obj.type ?? "folder"),
              foldername: file_ids
                ? file_ids.name
                : (obj?.body?.foldername ?? "Untitled"),
              file_ids: file_ids ?? noFile,
            });
            patch(
              id,
              "done",
              file_ids
                ? `File "${file_ids.name}" saved in nested folder`
                : `Nested folder "${obj?.body?.foldername ?? "Untitled"}" created`,
            );
            break;

          case "deletenestedfolder":
            await axios.delete(
              `${API}/deletenestedfolder/${meid}/${obj.root}/nodelete`,
              { data: { arrayoffoldersids: obj?.body?.arrayoffoldersids } },
            );
            patch(id, "done", "Folder deleted");
            break;

          case "deleteonlyfiles":
            await axios.delete(
              `${API}/deleteonlyfiles/${meid}/${obj?.folderid}${obj?.level ? `?level=${obj.level}` : ""}`,
              { data: { idsoffiletodelete: obj?.body?.idsoffiletodelete } },
            );
            patch(id, "done", "File(s) deleted");
            break;

          case "renamefolder":
            await axios.put(`${API}/renamefolder/${obj?.id}/${obj?.chgname}`);
            patch(id, "done", `Renamed to "${obj?.chgname}"`);
            break;

          default:
            patch(id, "error", obj?.error ?? "Unknown operation");
            break;
        }
      });
    } catch (err) {
      patch(id, "error", err?.response?.data?.message ?? "Request failed");
    }
  }

  // ── handleSend ──────────────────────────────────────────────────────────────
  async function handleSend() {
    if (loading) return;
    const cmd = input.trim();
    if (!cmd && !attachment) {
      toast.error("Type a command or attach a file");
      return;
    }

    const id = uid();
    const cmdLabel = cmd || `upload "${attachment?.name}"`;

    setLog((prev) => [
      ...prev,
      {
        id,
        command: cmdLabel,
        status: "running",
        label: "processing…",
        ts: Date.now(),
      },
    ]);
    setInput("");
    setLoading(true);

    try {
      // Snapshot attachment before clearing it
      const currentAttachment = attachment;
      const file_ids = currentAttachment
        ? {
            publicid: currentAttachment.publicid,
            url: currentAttachment.url,
            name: currentAttachment.name,
            bytes: currentAttachment.bytes ?? 0,
            time: currentAttachment.time ?? Date.now(),
          }
        : null;

      // Clear attachment state early so UI updates immediately
      if (currentAttachment) setAttachment(null);

      if (!cmd && file_ids) {
        // ── No command: just save to root ──────────────────────────────────
        await axios.post(`${API}/createtoplevelfolder/${meid}`, {
          type: "file",
          foldername: file_ids.name,
          file_ids,
        });
        patch(
          id,
          "done",
          `Saved "${file_ids.name}" (${fmtBytes(file_ids.bytes)}) at root`,
        );
        toast.success(`Uploaded: ${file_ids.name}`);
        return;
      }

      // ── There is a command (with or without attachment) ────────────────
      if (file_ids) {
        patch(id, "running", "file ready — fetching storage data…");
      }

      const res = await axios.get(`${API}/getallmydataforai/${meid}`);
      const mydata = res.data.mydata;

      // Pass file_ids into runAICommand so it can use real data
      await runAICommand(cmd, mydata, id, file_ids);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed");
      patch(id, "error", err?.response?.data?.message ?? "failed");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      {/* ── Filename modal (shown before Cloudinary widget opens) ────────────── */}
      {showNameModal && (
        <FileNameModal
          onConfirm={handleNameConfirm}
          onCancel={handleNameCancel}
        />
      )}

      {/* ── CldUploadWidget — invisible, triggered programmatically ─────────── */}
      <CldUploadWidget
        uploadPreset="ml_default"
        options={{
          multiple: false,
          // Use the pending name as the Cloudinary public_id folder prefix
          // so the file is identifiable in the Cloudinary dashboard too.
          folder: `ai_uploads`,
          // eslint-disable-next-line react-hooks/refs
          publicId: pendingNameRef.current || undefined,
        }}
        onSuccess={handleUploadSuccess}
        onOpen={() => setAttachLoading(true)}
        onClose={() => setAttachLoading(false)}
      >
        {({ open }) => {
          widgetOpenRef.current = open;
          return <span style={{ display: "none" }} />;
        }}
      </CldUploadWidget>

      {/* ── Floating trigger button ─────────────────────────────────────────── */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`
          fixed bottom-6 right-6 z-40
          flex items-center gap-2
          rounded-2xl border px-4 py-2.5
          shadow-2xl shadow-black/40
          transition-all duration-300 ease-in-out
          ${
            open
              ? "bg-slate-800 border-slate-600/60 text-slate-300 hover:bg-slate-700"
              : "bg-blue-600 border-blue-500/50 text-white hover:bg-blue-500 shadow-blue-900/40"
          }
        `}
      >
        {loading && (
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-300 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-200" />
          </span>
        )}
        {open ? (
          <IconChevronDown className="h-4 w-4" />
        ) : (
          <IconSparkle className="h-4 w-4" />
        )}
        <span className="text-sm font-semibold tracking-tight">
          {open ? "Close" : "AI Command"}
        </span>
        {!open && log.length > 0 && (
          <span className="h-5 min-w-5 px-1 rounded-full bg-blue-400/30 border border-blue-300/30 flex items-center justify-center text-[10px] font-bold text-blue-200">
            {log.length}
          </span>
        )}
      </button>

      {/* ── Backdrop ───────────────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px]"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Sliding drawer ─────────────────────────────────────────────────── */}
      <div
        className={`
          fixed bottom-0 right-0 z-40
          w-full sm:w-110
          flex flex-col
          bg-slate-900 border border-slate-700/50 border-b-0
          rounded-t-2xl sm:rounded-tl-2xl sm:rounded-tr-none
          shadow-2xl shadow-black/60
          transition-transform duration-300 ease-in-out
          ${open ? "translate-y-0" : "translate-y-full"}
        `}
        style={{ maxHeight: "72vh" }}
      >
        {/* drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="h-1 w-10 rounded-full bg-slate-700/80" />
        </div>

        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-800/80 shrink-0">
          <div className="h-7 w-7 rounded-xl bg-blue-600/15 border border-blue-500/25 flex items-center justify-center shrink-0">
            <IconSparkle className="h-3.5 w-3.5 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-200 tracking-tight">
              AI Command
            </p>
            <p className="text-[10px] font-mono">
              {loading ? (
                <span className="text-blue-500 animate-pulse">executing…</span>
              ) : log.length === 0 ? (
                <span className="text-slate-700">no commands run yet</span>
              ) : (
                <span className="text-slate-600">
                  {log.length} command{log.length !== 1 ? "s" : ""} executed
                </span>
              )}
            </p>
          </div>
          <span className="relative flex h-2 w-2 shrink-0">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${loading ? "bg-blue-400" : "bg-slate-700"}`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${loading ? "bg-blue-500" : "bg-slate-700"}`}
            />
          </span>
          <button
            onClick={() => setOpen(false)}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors shrink-0"
          >
            <IconClose className="h-4 w-4" />
          </button>
        </div>

        {/* ── Log list ── */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2 font-mono min-h-0">
          {log.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <p className="text-[11px] text-slate-700 tracking-widest">
                — awaiting command —
              </p>
            </div>
          ) : (
            <>
              {log.map((entry) => (
                <div
                  key={entry.id}
                  className={`rounded-xl border px-3.5 py-2.5 transition-colors ${
                    entry.status === "running"
                      ? "border-blue-500/20 bg-blue-950/20"
                      : entry.status === "done"
                        ? "border-emerald-800/30 bg-emerald-950/15"
                        : "border-red-800/30 bg-red-950/15"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="shrink-0">
                      {entry.status === "running" && (
                        <IconLoader className="h-3 w-3 text-blue-400" />
                      )}
                      {entry.status === "done" && (
                        <IconCheck className="h-3 w-3 text-emerald-400" />
                      )}
                      {entry.status === "error" && (
                        <IconXSmall className="h-3 w-3 text-red-400" />
                      )}
                    </span>
                    <span className="text-[11px] text-slate-300 flex-1 truncate">
                      <span className="text-blue-500/40 mr-1.5 select-none">
                        $
                      </span>
                      {entry.command}
                    </span>
                    <span className="text-[9px] text-slate-700 shrink-0 tabular-nums">
                      {fmt(entry.ts)}
                    </span>
                  </div>
                  <p
                    className={`text-[10px] pl-5 mt-1 leading-relaxed ${
                      entry.status === "running"
                        ? "text-slate-600 animate-pulse"
                        : entry.status === "done"
                          ? "text-emerald-600/80"
                          : "text-red-500/70"
                    }`}
                  >
                    {entry.label}
                  </p>
                </div>
              ))}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* ── Input area ── */}
        <div className="shrink-0 border-t border-slate-800 px-4 py-3">
          <div
            className={`rounded-2xl border transition-all duration-200 ${
              loading
                ? "border-blue-500/25 bg-slate-900 ring-1 ring-blue-500/10"
                : "border-slate-700/60 bg-slate-900 focus-within:border-blue-500/40 focus-within:ring-1 focus-within:ring-blue-500/15"
            }`}
          >
            {/* Attachment preview */}
            {attachment && (
              <div className="px-3 pt-3 pb-1">
                <div className="relative inline-flex group">
                  {attachment.isImage ? (
                    <div className="relative h-16 w-16 rounded-xl overflow-hidden border border-slate-600/50 shadow-lg">
                      <Image
                        src={attachment.url}
                        alt={attachment.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded-xl border border-slate-600/50 bg-slate-800 flex flex-col items-center justify-center gap-1 shadow-lg">
                      <IconFile className="h-7 w-7" />
                      <span className="text-[9px] text-slate-500 truncate max-w-12 px-1">
                        {attachment.name.split(".").pop()?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="ml-2.5 flex flex-col justify-center min-w-0 max-w-40">
                    <p className="text-[11px] text-slate-300 font-medium truncate leading-tight">
                      {attachment.name}
                    </p>
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      {fmtBytes(attachment.bytes)}
                    </p>
                  </div>
                  {/* Remove button */}
                  <button
                    onClick={handleRemoveAttachment}
                    disabled={attachLoading}
                    className="absolute -top-1.5 -left-1.5 h-5 w-5 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-300 hover:bg-red-600 hover:border-red-500 hover:text-white transition-colors shadow-md disabled:opacity-50"
                  >
                    {attachLoading ? (
                      <IconLoader className="h-2.5 w-2.5" />
                    ) : (
                      <IconXSmall className="h-2.5 w-2.5" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Text + action row */}
            <div className="flex items-center gap-2 px-3 py-2.5 font-mono">
              {/* Paperclip / attach button — now opens name modal first */}
              <button
                onClick={handleAttachClick}
                disabled={loading || !!attachment}
                title="Attach a file"
                className={`h-6 w-6 rounded-lg flex items-center justify-center transition-all shrink-0 ${
                  attachment
                    ? "text-blue-400/40 cursor-not-allowed"
                    : loading
                      ? "text-slate-700 cursor-not-allowed"
                      : "text-slate-500 hover:text-blue-400 hover:bg-blue-500/10"
                }`}
              >
                {attachLoading ? (
                  <IconLoader className="h-3.5 w-3.5 text-blue-400" />
                ) : (
                  <IconPaperclip className="h-3.5 w-3.5" />
                )}
              </button>

              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  loading
                    ? "executing…"
                    : attachment
                      ? "add a command or just send the file…"
                      : "describe what to do with your storage"
                }
                disabled={loading}
                className="flex-1 bg-transparent text-[12px] text-slate-300 placeholder-slate-600 outline-none disabled:opacity-40 tracking-wide"
              />

              {/* Send button */}
              <button
                onClick={handleSend}
                disabled={loading || (!input.trim() && !attachment)}
                className={`h-6 w-6 rounded-lg flex items-center justify-center transition-all shrink-0 ${
                  loading || (!input.trim() && !attachment)
                    ? "text-slate-800 cursor-not-allowed"
                    : "text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                }`}
              >
                {loading ? (
                  <IconLoader className="h-3.5 w-3.5 text-blue-500" />
                ) : (
                  <IconSend className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          <p className="text-[9px]  mt-1.5 text-center font-mono tracking-wide text-amber-50">
            ENTER to execute · attach files with the paperclip
          </p>
        </div>
      </div>
    </>
  );
};

export default AIAssistant;
