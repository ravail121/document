import { Editor } from "@/components/Editor";
import { canRead, isOwner } from "@/lib/permissions";
import { getDocumentById, getUserById } from "@/lib/queries";
import { getCurrentUserId } from "@/lib/session";
import type { DocumentContent } from "@/lib/types";
import Link from "next/link";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { id: string };
};

export default async function DocumentPage({ params }: PageProps) {
  const userId = getCurrentUserId();
  const doc = await getDocumentById(params.id);

  if (!doc) {
    return (
      <main className="mx-auto max-w-[800px] p-8 text-neutral-900">
        <p className="text-lg">404 — Document not found</p>
        <Link href="/" className="mt-4 inline-block text-sm text-neutral-600 underline">
          ← Back to dashboard
        </Link>
      </main>
    );
  }

  if (!(await canRead(doc.id, userId))) {
    return (
      <main className="mx-auto max-w-[800px] p-8 text-neutral-900">
        <p className="text-lg">You do not have access to this document</p>
        <Link href="/" className="mt-4 inline-block text-sm text-neutral-600 underline">
          ← Back to dashboard
        </Link>
      </main>
    );
  }

  const owner = isOwner(doc, userId);
  const ownerUser = await getUserById(doc.owner_id);
  const content: DocumentContent = {
    type: "doc",
    content: Array.isArray(doc.content.content) ? doc.content.content : [],
  };

  return (
    <main className="px-4 py-8 text-neutral-900">
      <Editor
        documentId={doc.id}
        initialTitle={doc.title}
        initialContent={content}
        initialVersion={doc.version}
        readOnly={false}
        isOwner={owner}
        ownerName={ownerUser?.name ?? "Unknown"}
      />
    </main>
  );
}
