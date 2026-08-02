import type { JSONContent } from "@tiptap/core";
import type { DocumentContent } from "@/lib/types";

type TextMark = { type: "bold" } | { type: "italic" };

type TextNode = {
  type: "text";
  text: string;
  marks?: TextMark[];
};

type ParagraphNode = {
  type: "paragraph";
  content?: TextNode[];
};

type HeadingNode = {
  type: "heading";
  attrs: { level: 1 | 2 };
  content?: TextNode[];
};

type ListItemNode = {
  type: "listItem";
  content: ParagraphNode[];
};

type BulletListNode = {
  type: "bulletList";
  content: ListItemNode[];
};

type OrderedListNode = {
  type: "orderedList";
  content: ListItemNode[];
};

type BlockNode =
  | ParagraphNode
  | HeadingNode
  | BulletListNode
  | OrderedListNode;

function asDoc(content: BlockNode[]): DocumentContent {
  return {
    type: "doc",
    content: (content.length > 0 ? content : [{ type: "paragraph" }]) as JSONContent[],
  };
}

function paragraphFromText(text: string): ParagraphNode {
  const content = parseInline(text);
  if (content.length === 0) {
    return { type: "paragraph" };
  }
  return { type: "paragraph", content };
}

function listItemFromText(text: string): ListItemNode {
  return {
    type: "listItem",
    content: [paragraphFromText(text)],
  };
}

export function parseInline(text: string): TextNode[] {
  const nodes: TextNode[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    const boldIndex = remaining.indexOf("**");
    const italicIndex = findSingleAsterisk(remaining);

    const nextSpecial =
      boldIndex === -1
        ? italicIndex
        : italicIndex === -1
          ? boldIndex
          : Math.min(boldIndex, italicIndex);

    if (nextSpecial === -1) {
      nodes.push({ type: "text", text: remaining });
      break;
    }

    if (nextSpecial > 0) {
      nodes.push({ type: "text", text: remaining.slice(0, nextSpecial) });
      remaining = remaining.slice(nextSpecial);
      continue;
    }

    if (remaining.startsWith("**")) {
      const close = remaining.indexOf("**", 2);
      if (close === -1) {
        nodes.push({ type: "text", text: remaining });
        break;
      }
      const inner = remaining.slice(2, close);
      if (inner.length > 0) {
        nodes.push({ type: "text", text: inner, marks: [{ type: "bold" }] });
      }
      remaining = remaining.slice(close + 2);
      continue;
    }

    // Single-asterisk italic
    const close = remaining.indexOf("*", 1);
    if (close === -1) {
      nodes.push({ type: "text", text: remaining });
      break;
    }
    const inner = remaining.slice(1, close);
    if (inner.length > 0) {
      nodes.push({ type: "text", text: inner, marks: [{ type: "italic" }] });
    }
    remaining = remaining.slice(close + 1);
  }

  return nodes;
}

function findSingleAsterisk(text: string): number {
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] !== "*") continue;
    if (text[i + 1] === "*") {
      i += 1;
      continue;
    }
    return i;
  }
  return -1;
}

export function parseTextToDoc(text: string): DocumentContent {
  const lines = text.split(/\r?\n/);
  const content: BlockNode[] = [];

  for (const line of lines) {
    if (line.trim().length === 0) {
      continue;
    }
    content.push(paragraphFromText(line));
  }

  return asDoc(content);
}

export function parseMarkdownToDoc(text: string): DocumentContent {
  const lines = text.split(/\r?\n/);
  const content: BlockNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? "";
    const trimmed = line.trim();

    if (trimmed.length === 0) {
      index += 1;
      continue;
    }

    const headingMatch = /^(#{1,2})\s+(.*)$/.exec(trimmed);
    if (headingMatch) {
      const level = headingMatch[1].length === 1 ? 1 : 2;
      const headingText = headingMatch[2].trim();
      const inline = parseInline(headingText);
      content.push({
        type: "heading",
        attrs: { level },
        ...(inline.length > 0 ? { content: inline } : {}),
      });
      index += 1;
      continue;
    }

    const bulletMatch = /^[-*]\s+(.*)$/.exec(trimmed);
    if (bulletMatch) {
      const items: ListItemNode[] = [];
      while (index < lines.length) {
        const current = (lines[index] ?? "").trim();
        if (current.length === 0) break;
        const match = /^[-*]\s+(.*)$/.exec(current);
        if (!match) break;
        items.push(listItemFromText(match[1]));
        index += 1;
      }
      content.push({ type: "bulletList", content: items });
      continue;
    }

    const orderedMatch = /^\d+\.\s+(.*)$/.exec(trimmed);
    if (orderedMatch) {
      const items: ListItemNode[] = [];
      while (index < lines.length) {
        const current = (lines[index] ?? "").trim();
        if (current.length === 0) break;
        const match = /^\d+\.\s+(.*)$/.exec(current);
        if (!match) break;
        items.push(listItemFromText(match[1]));
        index += 1;
      }
      content.push({ type: "orderedList", content: items });
      continue;
    }

    content.push(paragraphFromText(trimmed));
    index += 1;
  }

  return asDoc(content);
}
