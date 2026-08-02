import { describe, expect, it } from "vitest";
import { validateContent, validateTitle } from "@/lib/validation";

describe("validateTitle", () => {
  it("rejects empty titles", () => {
    expect(validateTitle("")).toEqual({
      ok: false,
      error: "Title must not be empty",
    });
  });

  it("rejects whitespace-only titles", () => {
    expect(validateTitle("   \t  ")).toEqual({
      ok: false,
      error: "Title must not be empty",
    });
  });

  it("rejects titles over 200 characters", () => {
    const title = "a".repeat(201);
    expect(validateTitle(title)).toEqual({
      ok: false,
      error: "Title must be at most 200 characters",
    });
  });

  it("accepts a normal title", () => {
    expect(validateTitle("Welcome")).toEqual({ ok: true });
  });
});

describe("validateContent", () => {
  it('rejects content missing type "doc"', () => {
    expect(validateContent({ type: "paragraph" })).toEqual({
      ok: false,
      error: 'Content type must be "doc"',
    });
  });

  it("rejects non-object content", () => {
    expect(validateContent(null).ok).toBe(false);
    expect(validateContent("doc").ok).toBe(false);
    expect(validateContent([]).ok).toBe(false);
  });

  it("accepts a doc-shaped object", () => {
    expect(validateContent({ type: "doc", content: [] })).toEqual({ ok: true });
  });
});
