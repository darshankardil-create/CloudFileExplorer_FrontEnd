"use client";
import { IconFolder, IconClose } from "./Icons";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { formatBytes } from "./../formatter";
import useFetch from "./../lib/fetch";

// ─── Modals ────────────────────────────────────────────────────────────────────

function Modal({ children, onClose, title }) {
  useEffect(() => {
    const fn = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-md rounded-2xl border border-slate-700/60 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-700/50 px-6 py-4">
          <h2 className="font-semibold text-slate-100 tracking-tight">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 transition-colors"
          >
            <IconClose className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function CreateFolderModal({ onClose, onConfirm }) {
  const [name, setName] = useState("");
  return (
    <Modal title="New Folder" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) {
            toast.error("Folder name required");
            return;
          }
          onConfirm(name.trim());
        }}
        className="flex flex-col gap-4"
      >
        <Input
          label="Folder Name"
          value={name}
          onChange={setName}
          placeholder="My Folder"
          autoFocus
        />
        <div className="flex justify-end gap-2 mt-2">
          <Btn variant="secondary" onClick={onClose}>
            Cancel
          </Btn>
          <Btn type="submit">Create</Btn>
        </div>
      </form>
    </Modal>
  );
}

export function FileNameModal({ onClose, onConfirm }) {
  const [name, setName] = useState("");
  return (
    <Modal title="Name Your File" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) {
            toast.error("File name required");
            return;
          }
          onConfirm(name.trim());
        }}
        className="flex flex-col gap-4"
      >
        <Input
          label="File Name"
          value={name}
          onChange={setName}
          placeholder="my-document"
          autoFocus
        />
        <div className="flex justify-end gap-2 mt-2">
          <Btn variant="secondary" onClick={onClose}>
            Cancel
          </Btn>
          <Btn type="submit">Upload</Btn>
        </div>
      </form>
    </Modal>
  );
}

export function DeleteAccountModal({ onClose, onConfirm }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { Fetchapi } = useFetch();

  async function handleConfirm() {
    if (!username.trim() || !password.trim()) {
      toast.error("Enter credentials to confirm");
      return;
    }

    setLoading(true);
    try {
      await Fetchapi("/logIn", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      onConfirm();
    } catch {
      toast.error("Invalid credentials — account deletion cancelled");
    } finally {
      setLoading(false);
    }
  }
  return (
    <Modal title="Delete Account" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="rounded-xl bg-red-950/40 border border-red-700/40 p-4">
          <p className="text-sm font-semibold text-red-400 mb-1">
            ⚠ This will delete your account and all data permanently.
          </p>
          <p className="text-xs text-red-300/70">
            This action cannot be undone.
          </p>
        </div>
        <p className="text-xs text-slate-400">
          Re-enter your credentials to confirm:
        </p>
        <Input
          label="Username"
          value={username}
          onChange={setUsername}
          autoFocus
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
        />
        <div className="flex justify-end gap-2 mt-2">
          <Btn variant="secondary" onClick={onClose}>
            Cancel
          </Btn>
          <Btn variant="danger" disabled={loading} onClick={handleConfirm}>
            {loading ? "Verifying…" : "Delete Forever"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

export function RenameFolderModal({ current, onClose, onConfirm }) {
  const [name, setName] = useState(current || "");
  return (
    <Modal title="Rename Folder" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) {
            toast.error("Name required");
            return;
          }
          onConfirm(name.trim());
        }}
        className="flex flex-col gap-4"
      >
        <Input label="New Name" value={name} onChange={setName} autoFocus />
        <div className="flex justify-end gap-2 mt-2">
          <Btn variant="secondary" onClick={onClose}>
            Cancel
          </Btn>
          <Btn type="submit">Rename</Btn>
        </div>
      </form>
    </Modal>
  );
}

export function Input({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoFocus,
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/20"
      />
    </div>
  );
}

export function Btn({
  children,
  onClick,
  variant = "primary",
  disabled,
  className = "",
  type = "button",
}) {
  const base =
    "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed";
  const v = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700 shadow-lg shadow-blue-900/30",
    secondary:
      "bg-slate-700/70 text-slate-200 hover:bg-slate-700 border border-slate-600/50",
    danger:
      "bg-red-600/90 text-white hover:bg-red-500 active:bg-red-700 shadow-lg shadow-red-900/30",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${v[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function ActionBtn({
  onClick,
  title,
  children,
  colorClass = "text-slate-400 hover:text-slate-200 hover:bg-slate-700",
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={title}
      className={`rounded-lg p-1.5 transition-colors shrink-0 ${colorClass}`}
    >
      {children}
    </button>
  );
}

export function ConfirmModal({
  title,
  message,
  danger,
  onClose,
  onConfirm,
  confirmLabel = "Confirm",
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-sm text-slate-300 mb-6 leading-relaxed">{message}</p>
      <div className="flex justify-end gap-2">
        <Btn variant="secondary" onClick={onClose}>
          Cancel
        </Btn>
        <Btn variant={danger ? "danger" : "primary"} onClick={onConfirm}>
          {confirmLabel}
        </Btn>
      </div>
    </Modal>
  );
}

export function FolderSizeModal({ folderId, folderName, onClose }) {
  const [size, setSize] = useState(null);
  const [loading, setLoading] = useState(true);
  const { Fetchapi } = useFetch();

  useEffect(() => {
    Fetchapi(`/getfoldersize/${folderId}`)
      .then((d) => setSize(d.size))
      .catch(() => toast.error("Failed to get folder size"))
      .finally(() => setLoading(false));
  }, [folderId]);
  return (
    <Modal title="Folder Size" onClose={onClose}>
      <div className="flex flex-col items-center gap-3 py-4">
        <IconFolder open className="h-12 w-12" />
        <p className="text-slate-300 text-sm font-medium">{folderName}</p>
        {loading ? (
          <div className="h-8 w-24 rounded-lg bg-slate-700 animate-pulse" />
        ) : (
          <p className="text-3xl font-bold text-blue-400 tracking-tight">
            {formatBytes(size)}
          </p>
        )}
        <p className="text-xs text-slate-500">
          Total size including all nested content
        </p>
      </div>
      <div className="flex justify-end mt-2">
        <Btn variant="secondary" onClick={onClose}>
          Close
        </Btn>
      </div>
    </Modal>
  );
}
