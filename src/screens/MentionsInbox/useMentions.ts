import { useState, useEffect } from "react";
import { appEvents } from "@/lib/app-events";
import { cacheMentions, getAllMentionsLocal, markMentionDismissed, markMentionRead } from "@/lib/local-db/mentions";
import type { LocalMention } from "@/lib/local-db/mentions";
import { apiFetch } from "@/lib/api-client";

type ServerMention = {
  id: string;
  state: string;
  created_at: number;
  author_id: string;
  author_username: string | null;
  channel_id: string;
  message_preview: string | null;
  deep_link: string | null;
  guild_id: string | null;
  guild_name: string | null;
};

function toLocalMention(mention: ServerMention): LocalMention {
  return {
    id: mention.id,
    author_name: mention.author_username ?? mention.author_id,
    channel_name: mention.channel_id,
    message_preview: mention.message_preview,
    deep_link: mention.deep_link,
    guild_id: mention.guild_id,
    guild_name: mention.guild_name,
    state: mention.state,
    created_at: new Date(mention.created_at).toISOString(),
    delivered_at: null,
    read_at: null
  };
}

async function hydrate(): Promise<void> {
  try {
    const { mentions } = await apiFetch<{ mentions: ServerMention[] }>("/api/member/mentions/all");
    if (mentions.length > 0) await cacheMentions(mentions.map(toLocalMention));
  } catch {}
}

export function useMentions() {
  const [mentions, setMentions] = useState<LocalMention[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = async () => {
    const rows = await getAllMentionsLocal();
    setMentions(rows);
  };

  useEffect(() => {
    hydrate()
      .then(reload)
      .finally(() => setIsLoading(false));

    const unsub = appEvents.on("mentionsUpdated", reload);
    return unsub;
  }, []);

  const ack = async (id: string, state: "read" | "dismissed") => {
    setMentions((prev) =>
      state === "dismissed" ? prev.filter((m) => m.id !== id) : prev.map((m) => (m.id === id ? { ...m, state } : m))
    );

    try {
      await apiFetch(`/api/member/mentions/${id}/ack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state })
      });
      if (state === "read") await markMentionRead(id);
      else await markMentionDismissed(id);
    } catch {
      await reload();
    }
  };

  return { mentions, isLoading, ack };
}
