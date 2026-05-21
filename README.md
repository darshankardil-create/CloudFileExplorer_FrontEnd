# CloudFileExplorer

**🌐 Live Hosted Website on Vercel: https://cloudfileexplorerfrontend.vercel.app**

**Backend Repository: https://github.com/darshankardil-create/CloudFileExplorer_Backend**

> A full-stack cloud file management system with AI-powered natural-language storage commands, infinite nested folder hierarchies, drag-and-drop organization, and real-time feedback — built with Next.js, Express, MongoDB, Cloudinary, Socket.IO, and a Hugging Face LLM.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router), React, Tailwind CSS |
| **Backend** | Node.js, Express.js (hosted on Render) |
| **Database** | MongoDB + Mongoose |
| **File Storage** | Cloudinary |
| **Realtime** | Socket.IO |
| **AI / LLM** | Hugging Face Inference API — `Qwen/Qwen3.6-27B` via Featherless AI |
| **Auth** | JWT + bcrypt |

---

## What It Does

CloudFileExplorer is a personal cloud storage manager where users organize files and folders in an infinitely deep nested hierarchy — upload, rename, delete, and drag-and-drop to move items across any level — all from a clean dark-mode UI. The standout feature is an **AI Command terminal** that accepts plain English instructions and automatically executes the correct storage operation on the backend, with real-time status feedback per command.

---

## Key Features

### AI Command Terminal
- A floating drawer lets users type natural-language commands like *"create a folder called Reports inside Finance"* or *"delete the file named invoice from Q1"*
- On send, the frontend fetches the user's full storage snapshot via `GET /getallmydataforai`, then sends it alongside the command to the backend over **Socket.IO**
- The backend passes the data to **Qwen3.6-27B** on Hugging Face with a strict system prompt that instructs the model to return only a JSON object describing which API endpoint to call and with what parameters — no natural-language response
- The frontend reads the JSON, calls the matching REST endpoint, and updates the command log entry from `running → done / error` with a descriptive label — all without a page reload
- Supports file attachment: users can upload a file via Cloudinary first, then pair it with a command (e.g. *"save this to the Finance folder"*) or just send it to root directly

### Infinite Nested Folder Hierarchy
- Folders can be nested to any depth. Each folder is its own document in MongoDB (`nested_folders_data` collection), storing only references (ObjectIds) to its children — not the children themselves
- The root user document (`auth_and_toplevel_folders_ids`) stores only top-level references, keeping the schema flat and scalable
- Deep subtree operations (delete, size calculation, AI data fetch) use MongoDB's **`$graphLookup`** aggregation to traverse the entire folder graph in a single query rather than recursive round-trips

### Drag-and-Drop Movement
- Files and folders can be dragged from any location and dropped onto any folder in both the sidebar tree and the content panel
- Four movement routes are handled explicitly: `nested → nested`, `top → nested` (toptobottom), `nested → top` (bottomtotop), and `top → top`
- A shared mutable singleton (`DC.js`) acts as a drag clipboard — holds the dragged item, its type, source parent ID, and whether the source is top-level — making it available across unrelated components without prop-drilling
- Custom drag ghost images are created programmatically, appended to the DOM at drag start, and immediately removed via `requestAnimationFrame`

- https://github.com/user-attachments/assets/461a2cd6-9372-4ae9-97c7-6a5d26f22f0c

### File Management
- Upload via Cloudinary widget with a custom pre-upload naming modal — the user names the file before it reaches Cloudinary
- File deletion calls Cloudinary's `uploader.destroy` first, then removes the reference from MongoDB only on confirmed deletion
- Image files render a live thumbnail preview; all other file types fall back to a styled file icon with extension label

### Sidebar Tree View
- Recursive `FolderNode` component renders the full folder tree from root, collapsible per node, with inline rename, delete, and size buttons
- Supports drag-and-drop targets in the sidebar including a dedicated "drop to root" zone
- The tree is loaded once at Dashboard mount using `fetchFolderRecursive` — a client-side recursive function that enriches each folder node with its full nested data for the sidebar

### Auth & Session
- JWT-based login / signup; tokens are 30-day lived and stored in `localStorage`
- On every load, the app re-validates the token via `GET /me` before rendering the dashboard
- Delete account re-authenticates credentials in a modal before calling the backend, which uses the same `deletenestedfolder` route with a `deleteac` flag to cascade-delete all storage data and then remove the user document
- The last-visited folder path is persisted in `localStorage` and restored on reload via breadcrumb reconstruction

### UX Details
- Global API loading indicator (animated top progress bar + centered spinner overlay) driven by a React Context flag (`apitrace`) that wraps every `Fetchapi` call
- Breadcrumb navigation with back button; full path is synced to `localStorage`
- Bulk select with Select All / Deselect All; supports mixed folder + file deletion in a single action
- Mobile-responsive: collapsible sidebar with backdrop overlay, hamburger menu, full touch support

---

## System Architecture

```
┌──────────────────────────────────────────────────────┐
│                  Next.js Frontend                    │
│                                                      │
│   page.jsx                                           │
│     └─ Dashboard (auth gate, tree load, layout)      │
│           ├─ Sidebar  ──► FolderNode (recursive)     │
│           ├─ ContentPanel ──► FolderRow / FileCard   │
│           └─ AIAssistant (Socket.IO + command log)   │
│                                                      │
│   useFetch (auth header injection, apitrace flag)    │
│   Context  (global apitrace → Loading overlay)       │
│   DC.js    (drag-and-drop mutable singleton)         │
└──────────┬───────────────────────────┬───────────────┘
           │ REST / axios              │ Socket.IO
           ▼                           ▼
┌──────────────────────────────────────────────────────┐
│              Express Backend (Render)                │
│                                                      │
│  POST   /api/signIn                                  │
│  POST   /api/logIn                                   │
│  GET    /api/me                                      │
│  POST   /api/createtoplevelfolder/:meid              │
│  POST   /api/createnestedfolder/:idoffolderdoc       │
│  GET    /api/initiallevelfolders/:meid               │
│  GET    /api/getfolderdatasbyid/:folderid            │
│  GET    /api/getfoldersize/:folderid  ($graphLookup) │
│  GET    /api/getallmydataforai/:meid  ($graphLookup) │
│  DELETE /api/deletenestedfolder/:meid/:root/:deleteac│
│  DELETE /api/deleteonlyfiles/:meid/:folderid         │
│  PUT    /api/renamefolder/:id/:chgname               │
│  PUT    /api/handledraganddrop/:cur/:shift/:folderid │
│                                                      │
│  Socket "send" event                                 │
│    → Hugging Face Inference API (Qwen3.6-27B)        │
│    → Socket "success" / "errorinai" event            │
└──────────┬───────────────────────────────────────────┘
           │                          │
           ▼                          ▼
      MongoDB Atlas              Cloudinary
  (two collections)           (binary file storage)
```

---

## Database Design

Two MongoDB collections power the entire hierarchy:

**`auth_and_toplevel_folders_ids`** — one document per user
```
{
  username, password (bcrypt),
  toplevel_folders_and_toplevel_files_ids: [
    { folderids: { folderid: ObjectId } },   // ref to a top-level folder
    { file_ids: { publicid, url, name, bytes, time } }  // top-level file
  ]
}
```

**`nested_folders_data`** — one document per folder (top-level and nested alike)
```
{
  foldername,
  parentid,   // string _id of parent, used to clean up references on delete
  files_and_nested_folders_ids: [
    { folderids: { folderid: ObjectId } },   // ref to a child folder
    { file_ids: { publicid, url, name, bytes, time } }  // file in this folder
  ]
}
```

All folders live in the same collection regardless of depth. The root document holds only top-level IDs; every other relationship is a reference stored inside the parent's `files_and_nested_folders_ids` array. This keeps documents small and allows **`$graphLookup`** to traverse the full tree in one aggregation pipeline.

---

## AI Pipeline — How It Works End to End

```
User types: "create a folder called Reports inside Finance"
         │
         ▼
Frontend: GET /getallmydataforai/:meid
  → Returns flat list of ALL folders via $graphLookup
         │
         ▼
Frontend: socket.emit("send", { dataforai: [{ role:"user", content: cmd + mydata }] })
         │
         ▼
Backend socketconnection.js:
  → Calls Hugging Face InferenceClient (Qwen3.6-27B)
  → System prompt instructs model: return ONLY valid JSON, never invent IDs,
    resolve names → _id values from mydata, default to top-level if no location given
         │
         ▼
Model returns:
  { "endpoint": "createnestedfolder",
    "idoffolderdoc": "<Finance folder _id>",
    "type": "folder",
    "body": { "foldername": "Reports" } }
         │
         ▼
socket.emit("success", { myai: <json string> })
         │
         ▼
Frontend runAICommand():
  → Parses JSON, switches on endpoint
  → POST /api/createnestedfolder/<Finance _id>
  → Patches command log entry: status "done", label "Nested folder 'Reports' created"
```

The system prompt is the critical piece — it defines every supported endpoint, the exact JSON shape to return, how to resolve folder names to IDs using the provided `mydata`, when to use `root` vs `notroot`, and when to return `{ "error": "unsupported_action" }` for greetings or unrecognized requests.

---

## Notable Implementation Decisions

| Decision | Rationale |
|---|---|
| `$graphLookup` for delete / size / AI data | Traverses arbitrarily deep folder trees in a single DB round-trip; avoids N+1 recursive API calls from the server |
| `parentid` field on every folder document | Allows the delete controller to cleanly pull the folder's reference from its parent without needing to know the parent upfront |
| Socket.IO for AI commands instead of REST | Keeps the HTTP layer stateless; the socket channel is ready for future streaming LLM responses without any architectural change |
| LLM returns JSON only, never prose | System prompt strictly forbids markdown or explanation — the frontend can `JSON.parse` the response directly without any cleanup step |
| `useRef` for `isTop` / `currentId` in the upload callback | The Cloudinary `onSuccess` callback closes over the values at widget-open time; refs ensure the actual current navigation state is read at upload-complete time |
| `loadKey` string to gate `useEffect` re-runs | Combines `currentId`, `isTop`, and `reloadKey` into one string comparison — prevents duplicate fetches when multiple state values change in the same render cycle |
| `pendingNameRef` instead of state for the file name | The naming modal unmounts before the Cloudinary widget opens; a ref persists the value across the render gap where state would be reset |
| `encodeURIComponent` on Cloudinary public IDs | Cloudinary public IDs can contain forward slashes — encoding prevents them from being interpreted as URL path separators by Express |
| `DC.js` mutable singleton for drag state | Drag events fire across components that share no common parent; a module-level object is the simplest zero-overhead solution. Acknowledged limitation: it's not React-aware and won't trigger re-renders |
| Two-collection MongoDB schema | Keeps the user document small (only top-level refs) while allowing `$graphLookup` to traverse the full `nested_folders_data` collection graph from any starting node |

---

## Component Breakdown — Frontend

| Component | Responsibility |
|---|---|
| `Dashboard` | Root layout, auth gate, recursive tree load, sidebar/main split, all top-level modals |
| `Sidebar` | Drag-to-root drop zone + recursive folder tree via `FolderNode` |
| `FolderNode` | Recursive sidebar tree node — expand/collapse, drag source + target, inline rename/delete/size |
| `ContentPanel` | Main file browser — breadcrumb nav, folder/file lists, toolbar, drag-over panel highlight |
| `FolderRow` | Folder card in content panel with lazy name/size fetch, drag source + drop target, inline actions |
| `FileCard` | File card — image thumbnail or file icon, drag source, single-file delete |
| `AIAssistant` | Floating AI drawer — command log, attachment upload flow, Socket.IO send/receive |
| `Input` | All shared UI primitives: `Modal`, `Btn`, `Input`, `ActionBtn`, `ConfirmModal`, `CreateFolderModal`, `FileNameModal`, `RenameFolderModal`, `DeleteAccountModal`, `FolderSizeModal` |
| `Icons` | Pure SVG icon library — zero external icon dependency |
| `Dragghost` | Programmatically creates a styled pill drag ghost, sets it as `dataTransfer` image, removes it immediately via `requestAnimationFrame` |
| `Loading` | Full-screen overlay (progress bar + spinner) shown whenever `apitrace` context flag is true |
| `useFetch` | Auth-aware fetch wrapper — injects Bearer token, sets/clears `apitrace`, throws on non-2xx |

## Module Breakdown — Backend

| Module | Responsibility |
|---|---|
| `app.js` | Express app setup, CORS, `http.createServer`, mounts router and socket server |
| `routes.js` | All route definitions — maps HTTP method + path to controller function |
| `controller.js` | All business logic — auth, CRUD, drag-and-drop move, `$graphLookup` aggregations |
| `socketconnection.js` | Socket.IO server — listens for `"send"`, calls Hugging Face, emits `"success"` or `"errorinai"` |
| `prompt.js` | The complete LLM system prompt — endpoint catalogue, JSON shape rules, ID resolution instructions, error cases |
| `authAndTopLevelFoldersIdsModel.js` | User schema with bcrypt pre-save hook and `comparehash` method |
| `NestedFoldersDataModel.js` | Folder document schema — `foldername`, `parentid`, `files_and_nested_folders_ids` |
| `SchemaOfFilesAndNestedFoldersIds.js` | Shared sub-document schema used in both collections for folder refs and file metadata |

---

## Running Locally

**Frontend**
```bash
npm install
# .env.local
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
npm run dev
```

**Backend**
```bash
npm install
# .env
MONGODBURL=your_mongodb_connection_string
CLOUDINARY_KEY=your_key
CLOUDINARY_SECRET=your_secret
CLOUDINARY_NAME=your_cloud_name
JWTSECRET=your_jwt_secret
HF_TOKEN=your_huggingface_token
PORT=3000
node app.js
```

The hosted backend on Render is shared and public — no local backend setup is needed to run the frontend against it.

---

## What I'd Improve Next

- **Optimistic UI updates** — every mutation currently triggers a full re-fetch; updating local state immediately would make interactions feel instant
- **Streaming AI responses** — the Socket.IO channel is already in place; switching to a streaming Hugging Face call would allow word-by-word output in the command log
- **File search** — the `/getallmydataforai` endpoint already returns the full flat folder+file graph; a search UI on top of it would need no new backend work
- **Folder share links** — generate a public read-only URL for any folder using a short token stored on the folder document
- **Move drag state to Zustand** — replace `DC.js` singleton with a proper React-aware store so drag state can trigger re-renders when needed
- **Rate-limit the AI endpoint** — currently any authenticated user can call the LLM endpoint at will; per-user request throttling on the socket would prevent abuse









