import { open } from "@tauri-apps/plugin-shell";
import { ExternalLinkIcon, CheckIcon, XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LocalMention } from "@/lib/local-db/mentions";

interface Props {
  mention: LocalMention;
  onAck: (id: string, state: "read" | "dismissed") => void;
}

function relativeTime(isoOrEpoch: string): string {
  const ms = isNaN(Number(isoOrEpoch)) ? Date.parse(isoOrEpoch) : Number(isoOrEpoch) * 1000;
  const diff = Date.now() - ms;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export function MentionCard({ mention, onAck }: Props) {
  const handleOpen = async () => {
    if (mention.deep_link) await open(mention.deep_link);
  };

  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-lg border border-border bg-card hover:bg-accent/30 transition-colors">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium text-foreground truncate">@{mention.author_name}</span>
          <span className="text-xs text-muted-foreground truncate">#{mention.channel_name}</span>
          {mention.state === "queued" && (
            <Badge variant="secondary" className="text-xs shrink-0">
              queued
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground shrink-0">{relativeTime(mention.created_at)}</span>
      </div>

      <p className="text-xs text-muted-foreground">
        {mention.guild_name ?? (mention.guild_id ? `Discord server ${mention.guild_id}` : "Direct message")}
      </p>

      {mention.message_preview && (
        <p className="text-sm text-muted-foreground line-clamp-2">{mention.message_preview}</p>
      )}

      <div className="flex items-center gap-1 mt-0.5">
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1" onClick={handleOpen}>
          <ExternalLinkIcon className="w-3 h-3" />
          Open in Discord
        </Button>
        {mention.state !== "read" && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs gap-1"
            onClick={() => onAck(mention.id, "read")}
          >
            <CheckIcon className="w-3 h-3" />
            Mark as read
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs gap-1 text-muted-foreground"
          onClick={() => onAck(mention.id, "dismissed")}
        >
          <XIcon className="w-3 h-3" />
          Dismiss
        </Button>
      </div>
    </div>
  );
}
