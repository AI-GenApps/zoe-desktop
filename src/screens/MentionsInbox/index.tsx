import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "./EmptyState";
import { MentionCard } from "./MentionCard";
import { useMentions } from "./useMentions";
import type { LocalMention } from "@/lib/local-db/mentions";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">{title}</h3>
      {children}
    </section>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex flex-col gap-3 p-4">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-20 w-full rounded-lg" />
      ))}
    </div>
  );
}

export default function MentionsInbox() {
  const { mentions, isLoading, ack } = useMentions();

  if (isLoading) return <LoadingSpinner />;
  if (mentions.length === 0) return <EmptyState />;

  const queued = mentions.filter((m: LocalMention) => m.state === "queued");
  const unread = mentions.filter((m: LocalMention) => m.state === "delivered" || m.state === "pending");
  const read = mentions.filter((m: LocalMention) => m.state === "read");

  return (
    <div className="flex flex-col gap-6 p-4 overflow-y-auto h-full">
      {queued.length > 0 && (
        <Section title={`Queued while on break (${queued.length})`}>
          {queued.map((m: LocalMention) => (
            <MentionCard key={m.id} mention={m} onAck={ack} />
          ))}
        </Section>
      )}
      {unread.length > 0 && (
        <Section title="Unread">
          {unread.map((m: LocalMention) => (
            <MentionCard key={m.id} mention={m} onAck={ack} />
          ))}
        </Section>
      )}
      {read.length > 0 && (
        <Section title="Read">
          {read.map((m: LocalMention) => (
            <MentionCard key={m.id} mention={m} onAck={ack} />
          ))}
        </Section>
      )}
    </div>
  );
}
