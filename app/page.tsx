import { FileCode2, FileText, Users } from "lucide-react";
import { DeleteDocumentButton } from "@/components/DeleteDocumentButton";
import { DocumentLink } from "@/components/DocumentLink";
import { DashboardGreeting } from "@/components/DashboardGreeting";
import { NewDocumentButton } from "@/components/NewDocumentButton";
import { UploadButton } from "@/components/UploadButton";
import { getUserById, listOwnedDocuments, listSharedDocuments } from "@/lib/queries";
import { getCurrentUserId } from "@/lib/session";
import { formatRelativeTime } from "@/lib/time";
import type { Document, DocumentContent, SharedDocument } from "@/lib/types";

export const dynamic = "force-dynamic";

function looksLikeImportedMarkdown(content: DocumentContent): boolean {
  return content.content.some((node) => {
    const type = node.type;
    return (
      type === "heading" || type === "bulletList" || type === "orderedList"
    );
  });
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="mb-1 flex items-center gap-2.5">
      <span className="text-[12px] font-medium tracking-[0.06em] text-section">
        {label}
      </span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

function OwnedRow({
  doc,
  featured,
}: {
  doc: Document;
  featured: boolean;
}) {
  const imported = looksLikeImportedMarkdown(doc.content);
  const Icon = imported ? FileCode2 : FileText;
  const relative = formatRelativeTime(doc.updated_at);
  const meta = imported ? `Imported · ${relative}` : `Edited ${relative}`;

  return (
    <li
      className={`group relative flex items-center gap-3.5 px-3.5 py-[15px] transition-colors duration-fast hover:bg-surface ${
        featured
          ? "my-0 -mx-3.5 rounded-row border border-line bg-surface"
          : "-mx-3.5 border-b border-rowLine last:border-b-0"
      }`}
    >
      <DocumentLink
        href={`/documents/${doc.id}`}
        className="absolute inset-0 rounded-row focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine"
      >
        <span className="sr-only">Open {doc.title}</span>
      </DocumentLink>

      <span
        className={`relative z-[1] flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg ${
          featured ? "bg-pineSoft text-pineMid" : "bg-pill text-section"
        }`}
      >
        <Icon className="h-[17px] w-[17px]" aria-hidden="true" />
      </span>

      <div className="relative z-[1] min-w-0 flex-1 pointer-events-none">
        <div
          className={`truncate text-[14px] text-ink ${
            featured ? "font-medium" : "font-normal"
          }`}
        >
          {doc.title}
        </div>
        <div className="mt-px text-[12px] text-muted">{meta}</div>
      </div>

      <div className="relative z-[2]">
        <DeleteDocumentButton documentId={doc.id} title={doc.title} />
      </div>
    </li>
  );
}

function SharedRow({ doc }: { doc: SharedDocument }) {
  const relative = formatRelativeTime(doc.updated_at);
  const initial = doc.owner_name.charAt(0).toUpperCase() || "?";

  return (
    <li className="group relative -mx-3.5 flex items-center gap-3.5 border-b border-rowLine px-3.5 py-[15px] transition-colors duration-fast last:border-b-0 hover:bg-surface">
      <DocumentLink
        href={`/documents/${doc.id}`}
        className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine"
      >
        <span className="sr-only">Open {doc.title}</span>
      </DocumentLink>

      <span className="relative z-[1] flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg bg-pill text-section">
        <Users className="h-[17px] w-[17px]" aria-hidden="true" />
      </span>

      <div className="relative z-[1] min-w-0 flex-1 pointer-events-none">
        <div className="truncate text-[14px] text-ink">{doc.title}</div>
        <div className="mt-px text-[12px] text-muted">
          Shared by {doc.owner_name} · {relative}
        </div>
      </div>

      <span className="relative z-[1] flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-ownerDot text-[10px] text-surface">
        {initial}
      </span>
    </li>
  );
}

export default async function DashboardPage() {
  const userId = getCurrentUserId();
  const [owned, shared, currentUser] = await Promise.all([
    listOwnedDocuments(userId),
    listSharedDocuments(userId),
    getUserById(userId),
  ]);

  const name = currentUser?.name ?? "there";

  return (
    <main className="mx-auto max-w-[760px] px-8 pb-14 pt-12">
      <div className="mb-2 flex items-end justify-between gap-6">
        <DashboardGreeting
          name={name}
          ownedCount={owned.length}
          sharedCount={shared.length}
        />
        <div className="flex shrink-0 gap-2">
          <NewDocumentButton />
          <UploadButton />
        </div>
      </div>
      <p className="mb-9 text-right text-[12px] text-faint">
        Supports .txt and .md up to 1MB
      </p>

      <section className="mb-9">
        <SectionHeader label="MY DOCUMENTS" />
        {owned.length === 0 ? (
          <p className="py-10 text-center text-[14px] text-muted">
            No documents yet. Create one to get started.
          </p>
        ) : (
          <ul>
            {owned.map((doc, index) => (
              <OwnedRow key={doc.id} doc={doc} featured={index === 0} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <SectionHeader label="SHARED WITH ME" />
        {shared.length === 0 ? (
          <p className="py-10 text-center text-[14px] text-muted">
            Nothing shared with you yet.
          </p>
        ) : (
          <ul>
            {shared.map((doc) => (
              <SharedRow key={doc.id} doc={doc} />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
