import { DeleteDocumentButton } from "@/components/DeleteDocumentButton";
import { DocumentLink } from "@/components/DocumentLink";
import { NewDocumentButton } from "@/components/NewDocumentButton";
import { UploadButton } from "@/components/UploadButton";
import { listOwnedDocuments, listSharedDocuments } from "@/lib/queries";
import { getCurrentUserId } from "@/lib/session";
import { formatRelativeTime } from "@/lib/time";
import type { Document, SharedDocument } from "@/lib/types";

export const dynamic = "force-dynamic";

function OwnedRow({ doc }: { doc: Document }) {
  return (
    <li className="flex items-center gap-3 border-b border-neutral-200 py-3 last:border-b-0">
      <DocumentLink
        href={`/documents/${doc.id}`}
        className="min-w-0 flex-1 hover:bg-neutral-100/80"
      >
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-medium text-neutral-900">{doc.title}</span>
          <span className="rounded border border-neutral-300 px-1.5 py-0.5 text-[11px] uppercase tracking-wide text-neutral-600">
            Owner
          </span>
        </div>
        <p className="mt-0.5 text-sm text-neutral-500">
          Updated {formatRelativeTime(doc.updated_at)}
        </p>
      </DocumentLink>
      <DeleteDocumentButton documentId={doc.id} title={doc.title} />
    </li>
  );
}

function SharedRow({ doc }: { doc: SharedDocument }) {
  return (
    <li className="border-b border-neutral-200 py-3 last:border-b-0">
      <DocumentLink
        href={`/documents/${doc.id}`}
        className="block min-w-0 hover:bg-neutral-100/80"
      >
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-medium text-neutral-900">{doc.title}</span>
          <span className="text-sm text-neutral-600">
            Shared by {doc.owner_name}
          </span>
        </div>
        <p className="mt-0.5 text-sm text-neutral-500">
          Updated {formatRelativeTime(doc.updated_at)}
        </p>
      </DocumentLink>
    </li>
  );
}

export default async function DashboardPage() {
  const userId = getCurrentUserId();
  const [owned, shared] = await Promise.all([
    listOwnedDocuments(userId),
    listSharedDocuments(userId),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
        <div className="flex flex-wrap items-start justify-end gap-3">
          <NewDocumentButton />
          <UploadButton />
        </div>
      </div>

      <section className="mb-10">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          My documents
        </h2>
        {owned.length === 0 ? (
          <p className="border-t border-neutral-200 py-6 text-sm text-neutral-600">
            No documents yet. Create one to get started.
          </p>
        ) : (
          <ul className="border-t border-neutral-200">
            {owned.map((doc) => (
              <OwnedRow key={doc.id} doc={doc} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Shared with me
        </h2>
        {shared.length === 0 ? (
          <p className="border-t border-neutral-200 py-6 text-sm text-neutral-600">
            Nothing shared with you yet.
          </p>
        ) : (
          <ul className="border-t border-neutral-200">
            {shared.map((doc) => (
              <SharedRow key={doc.id} doc={doc} />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
