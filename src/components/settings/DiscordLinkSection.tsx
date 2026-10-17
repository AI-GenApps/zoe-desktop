import { useState } from "react";
import { apiFetch, ApiError } from "@/lib/api-client";

export function DiscordLinkSection() {
  const [discordUserId, setDiscordUserId] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [linkedUsername, setLinkedUsername] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      const data = await apiFetch<{ ok?: boolean; discord_username?: string }>("/api/member/discord-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discord_user_id: discordUserId })
      });
      setLinkedUsername(data.discord_username ?? discordUserId);
      setStatus("success");
    } catch (error) {
      setErrorMsg(error instanceof ApiError ? error.message : "Network error");
      setStatus("error");
    }
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Discord Account</h3>
      {status === "success" && linkedUsername ? (
        <p className="text-sm text-green-600">Linked as @{linkedUsername}</p>
      ) : (
        <form onSubmit={handleVerify} className="space-y-2">
          <div>
            <label className="text-xs font-medium block mb-1">Your Discord User ID</label>
            <input
              className="border rounded px-2 py-1 text-sm w-full bg-background"
              value={discordUserId}
              onChange={(e) => setDiscordUserId(e.target.value)}
              placeholder="123456789012345678"
              required
            />
          </div>
          <button
            type="submit"
            disabled={status === "loading"}
            className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded disabled:opacity-50"
          >
            {status === "loading" ? "Verifying…" : "Verify & Link"}
          </button>
          {status === "error" && <p className="text-xs text-red-500">{errorMsg}</p>}
        </form>
      )}
    </div>
  );
}
