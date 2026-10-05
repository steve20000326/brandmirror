"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="mx-auto mt-16 max-w-sm space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        const res = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });
        if (!res.ok) {
          setError("无法进入后台");
          return;
        }
        router.push("/admin");
        router.refresh();
      }}
    >
      <h1 className="text-xl font-semibold">工作室后台</h1>
      <input
        type="password"
        name="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="h-11 w-full rounded-lg border border-slate-300 px-3"
        placeholder="后台密码"
      />
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      <button type="submit" className="h-11 w-full rounded-lg bg-slate-900 text-white">
        进入
      </button>
    </form>
  );
}
