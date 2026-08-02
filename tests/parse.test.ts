import { describe, expect, it } from "vitest";
import { parseMarkdownToDoc, parseTextToDoc } from "@/lib/parse";

type Node = {
  type: string;
  attrs?: { level?: number };
  content?: Array<{
    type: string;
    text?: string;
    marks?: Array<{ type: string }>;
    content?: Node[];
  }>;
};

function asNodes(doc: { content: unknown[] }): Node[] {
  return doc.content as Node[];
}

describe("parseTextToDoc", () => {
  it("creates one paragraph node per non-empty line", () => {
    const doc = parseTextToDoc("One\nTwo\nThree");
    const nodes = asNodes(doc);
    expect(nodes).toHaveLength(3);
    expect(nodes.every((node) => node.type === "paragraph")).toBe(true);
    expect(nodes.map((node) => node.content?.[0]?.text)).toEqual([
      "One",
      "Two",
      "Three",
    ]);
  });

  it("drops blank lines", () => {
    const doc = parseTextToDoc("One\n\n\nTwo\n");
    const nodes = asNodes(doc);
    expect(nodes).toHaveLength(2);
    expect(nodes.map((node) => node.content?.[0]?.text)).toEqual(["One", "Two"]);
  });

  it("produces a valid empty doc for empty input", () => {
    const doc = parseTextToDoc("");
    expect(doc.type).toBe("doc");
    expect(asNodes(doc)).toEqual([{ type: "paragraph" }]);
  });
});

describe("parseMarkdownToDoc", () => {
  it("parses headings at the correct level", () => {
    const doc = parseMarkdownToDoc("# Title\n## Subtitle");
    const nodes = asNodes(doc);
    expect(nodes[0]).toMatchObject({
      type: "heading",
      attrs: { level: 1 },
      content: [{ type: "text", text: "Title" }],
    });
    expect(nodes[1]).toMatchObject({
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Subtitle" }],
    });
  });

  it("parses bulleted and numbered lists into the right list types", () => {
    const doc = parseMarkdownToDoc("- Alpha\n- Beta\n\n1. One\n2. Two");
    const nodes = asNodes(doc);
    expect(nodes[0]?.type).toBe("bulletList");
    expect(nodes[0]?.content).toHaveLength(2);
    expect(nodes[1]?.type).toBe("orderedList");
    expect(nodes[1]?.content).toHaveLength(2);
  });

  it("parses bold and italic markers into marks", () => {
    const doc = parseMarkdownToDoc("Say **bold** and *italic*.");
    const paragraph = asNodes(doc)[0];
    const texts = paragraph?.content ?? [];
    expect(texts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: "bold",
          marks: [{ type: "bold" }],
        }),
        expect.objectContaining({
          text: "italic",
          marks: [{ type: "italic" }],
        }),
      ])
    );
  });

  it("produces a valid empty doc for empty input", () => {
    const doc = parseMarkdownToDoc("   \n\n");
    expect(doc.type).toBe("doc");
    expect(asNodes(doc)).toEqual([{ type: "paragraph" }]);
  });
});
