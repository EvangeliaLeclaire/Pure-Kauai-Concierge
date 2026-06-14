import { useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { PureKauaiLogo } from "@/components/PureKauaiLogo";

export default function Access() {
  const [, setLocation] = useLocation();
  const search = useSearch();

  useEffect(() => {
    const p = new URLSearchParams(search).get("p");
    if (!p) { setLocation("/"); return; }

    let decoded: string;
    try { decoded = atob(p); } catch { setLocation("/"); return; }

    fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: decoded }),
    })
      .then((r) => r.json())
      .then((data: { ok?: boolean }) => {
        if (data.ok) sessionStorage.setItem("pk_authed", "1");
        setLocation("/");
      })
      .catch(() => setLocation("/"));
  }, []);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ background: "#FAF8F6" }}
    >
      <PureKauaiLogo variant="dark" size="xl" className="mb-8 opacity-60" />
      <div
        className="h-4 w-4 rounded-full border-t-2 animate-spin"
        style={{ borderColor: "#053E50" }}
      />
    </div>
  );
}
