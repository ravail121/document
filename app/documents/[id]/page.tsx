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

function StatusPage({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-canvas px-6">
      <div className="max-w-md text-center">
        <p className="text-[15px] text-ink">{title}</p>
        <p className="mt-2 text-[13px] text-muted">{detail}</p>
        <Link
          href="/"
          className="mt-5 inline-block text-[13px] text-pineMid underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine"
        >
          Back to documents
        </Link>
      </div>
    </main>
  );
}

export default async function DocumentPage({ params }: PageProps) {
  const userId = getCurrentUserId();
  const doc = await getDocumentById(params.id);

  if (!doc) {
    return (
      <StatusPage
        title="Document not found"
        detail="This document may have been deleted or the link is incorrect."
      />
    );
  }

  if (!(await canRead(doc.id, userId))) {
    return (
      <StatusPage
        title="You do not have access to this document"
        detail="Ask the owner to share it with you, or return to your documents."
      />
    );
  }

  const owner = isOwner(doc, userId);
  const ownerUser = await getUserById(doc.owner_id);
  const content: DocumentContent = {
    type: "doc",
    content: Array.isArray(doc.content.content) ? doc.content.content : [],
  };

  return (
    <main>
      <Editor
        documentId={doc.id}
        initialTitle={doc.title}
        initialContent={content}
        initialVersion={doc.version}
        readOnly={false}
        isOwner={owner}
        ownerId={doc.owner_id}
        ownerName={ownerUser?.name ?? "Unknown"}
        ownerEmail={ownerUser?.email ?? ""}
      />
    </main>
  );
}
