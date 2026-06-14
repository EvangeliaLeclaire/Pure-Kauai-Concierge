import { useState } from "react";
import { PureKauaiLogo } from "@/components/PureKauaiLogo";

const SESSION_KEY = "pk_authed";

export default function PasswordGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState<boolean>(
    () => sessionStorage.getItem(SESSION_KEY) === "1"
  );
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        sessionStorage.setItem(SESSION_KEY, "1");
        setAuthed(true);
      } else {
        setError("Incorrect password. Please try again.");
        setPassword("");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (authed) return <>{children}</>;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#FAF8F6" }}
    >
      <div className="w-full max-w-xs">
        <div className="text-center mb-10">
          <PureKauaiLogo variant="dark" size="xl" className="mx-auto mb-5" />
          <p className="text-xs tracking-[0.26em] uppercase" style={{ color: "#937C66" }}>
            Concierge Portal
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-sm px-8 py-9"
          style={{
            background: "#fff",
            boxShadow: "0 1px 18px rgba(5,62,80,0.08)",
          }}
        >
          <label
            className="block text-xs tracking-[0.12em] uppercase mb-2"
            style={{ color: "#6B7280" }}
          >
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2.5 border text-sm mb-1 outline-none transition-colors"
            style={{
              borderColor: error ? "#B45309" : "#E8E0DB",
              background: "#FDFCFB",
              borderRadius: "2px",
            }}
            autoFocus
            autoComplete="current-password"
          />
          {error && (
            <p className="text-xs mb-3 mt-1" style={{ color: "#B45309" }}>
              {error}
            </p>
          )}
          {!error && <div className="mb-5" />}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 text-xs tracking-[0.16em] uppercase text-white transition-opacity disabled:opacity-50"
            style={{ background: "#053E50", borderRadius: "2px" }}
          >
            {loading ? "Verifying…" : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}
