// ─── ICONS ──────────────────────────────────────────────────────────────

export const IconChevron = ({ open, className = "" }) => (
  <svg
    className={`transition-transform duration-200 ${open ? "rotate-90" : "rotate-0"} ${className}`}
    viewBox="0 0 24 24"
    fill="none"
  >
    <path
      d="M9 18L15 12L9 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export const IconPlus = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M12 5V19M5 12H19"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);
export const IconTrash = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M3 6H21M8 6V4H16V6M19 6L18 20H6L5 6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export const IconEdit = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M11 4H4C2.9 4 2 4.9 2 6V20C2 21.1 2.9 22 4 22H18C19.1 22 20 21.1 20 20V13M18.5 2.5C19.3 1.7 20.7 1.7 21.5 2.5C22.3 3.3 22.3 4.7 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export const IconUpload = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M21 15V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V15M17 8L12 3L7 8M12 3V15"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export const IconLogout = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M9 21H5C3.9 21 3 20.1 3 19V5C3 3.9 3.9 3 5 3H9M16 17L21 12L16 7M21 12H9"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export const IconClose = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M18 6L6 18M6 6L18 18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export const IconSize = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <rect
      x="3"
      y="3"
      width="18"
      height="18"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M9 9H15M9 12H15M9 15H12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);
export const IconSpinner = ({ className = "" }) => (
  <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="3"
      strokeDasharray="32"
      strokeDashoffset="12"
      strokeLinecap="round"
    />
  </svg>
);
export const IconBack = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M15 18L9 12L15 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export const IconCheck = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M20 6L9 17L4 12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export const IconSelectAll = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <rect
      x="3"
      y="3"
      width="7"
      height="7"
      rx="1"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <rect
      x="14"
      y="3"
      width="7"
      height="7"
      rx="1"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <rect
      x="3"
      y="14"
      width="7"
      height="7"
      rx="1"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <rect
      x="14"
      y="14"
      width="7"
      height="7"
      rx="1"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
);
export const IconMenu = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M3 12H21M3 6H21M3 18H21"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export const IconFolder = ({ open, className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    {open ? (
      <path
        d="M2 6C2 4.9 2.9 4 4 4H9L11 6H20C21.1 6 22 6.9 22 8V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6Z"
        fill="#3b82f6"
        stroke="#60a5fa"
        strokeWidth="0.5"
      />
    ) : (
      <path
        d="M2 6C2 4.9 2.9 4 4 4H9L11 6H20C21.1 6 22 6.9 22 8V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6Z"
        fill="#1e3a5f"
        stroke="#3b82f6"
        strokeWidth="1"
      />
    )}
  </svg>
);
export const IconFile = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M13 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V9L13 2Z"
      fill="#0f2744"
      stroke="#3b82f6"
      strokeWidth="1"
    />
    <path d="M13 2V9H20" stroke="#3b82f6" strokeWidth="1" fill="none" />
  </svg>
);

export const IconStorage = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <ellipse
      cx="12"
      cy="5"
      rx="9"
      ry="3"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M21 12C21 13.66 16.97 15 12 15C7.03 15 3 13.66 3 12"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M3 5V19C3 20.66 7.03 22 12 22C16.97 22 21 20.66 21 19V5"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
);

export const IconSend = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconSparkle = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M19 16L19.75 18.25L22 19L19.75 19.75L19 22L18.25 19.75L16 19L18.25 18.25L19 16Z"
      fill="currentColor"
      opacity="0.5"
    />
  </svg>
);

export const IconXSmall = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M18 6L6 18M6 6L18 18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);
export const IconLoader = ({ className = "" }) => (
  <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeDasharray="32"
      strokeDashoffset="12"
      strokeLinecap="round"
    />
  </svg>
);
export const IconChevronDown = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M6 9L12 15L18 9"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export const IconPaperclip = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M21.44 11.05L12.25 20.24C11.12 21.37 9.59 22 7.99 22C6.39 22 4.86 21.37 3.73 20.24C2.6 19.11 1.97 17.58 1.97 15.98C1.97 14.38 2.6 12.85 3.73 11.72L12.92 2.53C13.68 1.77 14.71 1.34 15.79 1.34C16.87 1.34 17.9 1.77 18.66 2.53C19.42 3.29 19.85 4.32 19.85 5.4C19.85 6.48 19.42 7.51 18.66 8.27L9.46 17.46C9.08 17.84 8.57 18.06 8.03 18.06C7.49 18.06 6.98 17.84 6.6 17.46C6.22 17.08 6 16.57 6 16.03C6 15.49 6.22 14.98 6.6 14.6L15.07 6.14"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
