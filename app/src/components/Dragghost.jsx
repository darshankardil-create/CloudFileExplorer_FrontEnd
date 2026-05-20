export default function setDragGhost(e, label, isFile = false) {
  const el = document.createElement("div");
  el.style.cssText = [
    "position:fixed;top:-999px;left:-999px",
    "display:flex;align-items:center;gap:6px",
    "padding:6px 14px;border-radius:999px",
    "background:linear-gradient(135deg,#1e40af,#3b82f6)",
    "color:#e0f2fe;font-size:12px;font-weight:600",
    "box-shadow:0 4px 20px rgba(59,130,246,.5)",
    "border:1px solid rgba(147,197,253,.3)",
    "white-space:nowrap;pointer-events:none",
  ].join(";");
  el.innerHTML = `<span style="font-size:14px">${isFile ? "📄" : "📁"}</span><span>${label}</span>`;
  document.body.appendChild(el);
  e.dataTransfer.setDragImage(el, 20, 14);
  requestAnimationFrame(() => el.remove());
}
