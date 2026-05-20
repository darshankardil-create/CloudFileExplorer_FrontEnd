import { IconStorage } from "./Icons.jsx";
import { Input, Btn } from "./Input.jsx";
import { useState } from "react";
import toast from "react-hot-toast";
import useFetch from "../lib/fetch.jsx";
import { setToken } from "./../token.js";

// ════════════════════════════════════════════════════════════════════════════════
// AuthScreen
// ════════════════════════════════════════════════════════════════════════════════
function AuthScreen({ onAuth }) {
  const { Fetchapi } = useFetch();

  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("Username and password required");
      return;
    }
    setLoading(true);
    try {
      const data = await Fetchapi(mode === "login" ? "/logIn" : "/signIn", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      setToken(data.token);
      const me = await Fetchapi("/me");
      onAuth({
        token: data.token,
        id: me.payloadwithotherinfo.docid,
        username: me.payloadwithotherinfo.username,
      });
      toast.success(mode === "login" ? "Welcome back!" : "Account created!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-900/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-indigo-900/20 blur-3xl" />
      </div>
      <div className="relative z-10 w-full max-w-sm mx-4">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
            <IconStorage className="h-6 w-6 text-blue-400" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
              CloudFileExplorer
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Your files, organized forever
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-700/50 bg-slate-900/80 backdrop-blur-xl shadow-2xl p-6">
          <div className="flex rounded-lg bg-slate-800/60 p-1 mb-6 border border-slate-700/30">
            {["login", "signup"].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${mode === m ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
              >
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Username"
              value={username}
              onChange={setUsername}
              placeholder="your_username"
              autoFocus
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
            />
            <Btn
              type="submit"
              disabled={loading}
              className="w-full justify-center mt-1"
            >
              {loading
                ? "Please wait…"
                : mode === "login"
                  ? "Sign In"
                  : "Create Account"}
            </Btn>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AuthScreen;
