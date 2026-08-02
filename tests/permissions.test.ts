import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Document } from "@/lib/types";

vi.mock("@/lib/queries", () => ({
  getDocumentById: vi.fn(),
  hasDocumentShare: vi.fn(),
}));

import { getDocumentById, hasDocumentShare } from "@/lib/queries";
import { canRead, canWrite, isOwner } from "@/lib/permissions";

const getDocumentByIdMock = vi.mocked(getDocumentById);
const hasDocumentShareMock = vi.mocked(hasDocumentShare);

const OWNER_ID = "11111111-1111-1111-1111-111111111111";
const SHARED_USER_ID = "22222222-2222-2222-2222-222222222222";
const STRANGER_ID = "33333333-3333-3333-3333-333333333333";
const DOC_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

function makeDoc(overrides: Partial<Document> = {}): Document {
  return {
    id: DOC_ID,
    owner_id: OWNER_ID,
    title: "Test",
    content: { type: "doc", content: [] },
    version: 1,
    created_at: new Date("2026-01-01T00:00:00.000Z"),
    updated_at: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("permissions", () => {
  beforeEach(() => {
    getDocumentByIdMock.mockReset();
    hasDocumentShareMock.mockReset();
  });

  it("identifies the document owner", () => {
    const doc = makeDoc();
    expect(isOwner(doc, OWNER_ID)).toBe(true);
    expect(isOwner(doc, SHARED_USER_ID)).toBe(false);
  });

  it("allows the owner to read and write their own document", async () => {
    getDocumentByIdMock.mockResolvedValue(makeDoc());

    await expect(canRead(DOC_ID, OWNER_ID)).resolves.toBe(true);
    await expect(canWrite(DOC_ID, OWNER_ID)).resolves.toBe(true);
    expect(hasDocumentShareMock).not.toHaveBeenCalled();
  });

  it("allows a user with a share row to read and write", async () => {
    getDocumentByIdMock.mockResolvedValue(makeDoc());
    hasDocumentShareMock.mockResolvedValue(true);

    await expect(canRead(DOC_ID, SHARED_USER_ID)).resolves.toBe(true);
    await expect(canWrite(DOC_ID, SHARED_USER_ID)).resolves.toBe(true);
    expect(hasDocumentShareMock).toHaveBeenCalledWith(DOC_ID, SHARED_USER_ID);
  });

  it("denies a user with no relationship to the document", async () => {
    getDocumentByIdMock.mockResolvedValue(makeDoc());
    hasDocumentShareMock.mockResolvedValue(false);

    await expect(canRead(DOC_ID, STRANGER_ID)).resolves.toBe(false);
    await expect(canWrite(DOC_ID, STRANGER_ID)).resolves.toBe(false);
  });

  it("denies access for a non-existent document instead of throwing", async () => {
    getDocumentByIdMock.mockResolvedValue(null);

    await expect(canRead(DOC_ID, OWNER_ID)).resolves.toBe(false);
    await expect(canWrite(DOC_ID, OWNER_ID)).resolves.toBe(false);
    expect(hasDocumentShareMock).not.toHaveBeenCalled();
  });
});
