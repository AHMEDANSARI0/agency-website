export interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

export type MarkdownBlock =
  | { type: "h2"; id: string; text: string }
  | { type: "h3"; id: string; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "blockquote"; text: string };

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

export function stripUnsafeTags(text: string): string {
  return text.replace(/<[^>]*>/g, "").trim();
}

export function extractTableOfContents(markdown: string): TocHeading[] {
  const headings: TocHeading[] = [];
  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.startsWith("### ")) {
      const text = stripUnsafeTags(line.slice(4));
      if (text) headings.push({ id: slugifyHeading(text), text, level: 3 });
    } else if (line.startsWith("## ")) {
      const text = stripUnsafeTags(line.slice(3));
      if (text) headings.push({ id: slugifyHeading(text), text, level: 2 });
    }
  }
  return headings;
}

export function parseSafeMarkdown(markdown: string): MarkdownBlock[] {
  const lines = markdown.split(/\r?\n/);
  const blocks: MarkdownBlock[] = [];
  let listBuffer: string[] = [];
  let paragraphBuffer: string[] = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length > 0) {
      const joined = stripUnsafeTags(paragraphBuffer.join(" "));
      if (joined) blocks.push({ type: "p", text: joined });
      paragraphBuffer = [];
    }
  };

  const flushList = () => {
    if (listBuffer.length > 0) {
      blocks.push({ type: "ul", items: [...listBuffer] });
      listBuffer = [];
    }
  };

  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    if (trimmed.startsWith("### ")) {
      flushParagraph();
      flushList();
      const text = stripUnsafeTags(trimmed.slice(4));
      if (text) blocks.push({ type: "h3", id: slugifyHeading(text), text });
      continue;
    }

    if (trimmed.startsWith("## ")) {
      flushParagraph();
      flushList();
      const text = stripUnsafeTags(trimmed.slice(3));
      if (text) blocks.push({ type: "h2", id: slugifyHeading(text), text });
      continue;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      flushParagraph();
      const itemText = stripUnsafeTags(trimmed.slice(2));
      if (itemText) listBuffer.push(itemText);
      continue;
    }

    if (trimmed.startsWith("> ")) {
      flushParagraph();
      flushList();
      const quote = stripUnsafeTags(trimmed.slice(2));
      if (quote) blocks.push({ type: "blockquote", text: quote });
      continue;
    }

    flushList();
    paragraphBuffer.push(trimmed);
  }

  flushParagraph();
  flushList();
  return blocks;
}

export interface InlineToken {
  kind: "text" | "strong" | "code";
  value: string;
}

export function tokenizeInlineFormatting(text: string): InlineToken[] {
  const safe = stripUnsafeTags(text);
  const tokens: InlineToken[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(safe)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ kind: "text", value: safe.slice(lastIndex, match.index) });
    }
    const tokenStr = match[0];
    if (tokenStr.startsWith("**") && tokenStr.endsWith("**")) {
      tokens.push({ kind: "strong", value: tokenStr.slice(2, -2) });
    } else if (tokenStr.startsWith("`") && tokenStr.endsWith("`")) {
      tokens.push({ kind: "code", value: tokenStr.slice(1, -1) });
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < safe.length) {
    tokens.push({ kind: "text", value: safe.slice(lastIndex) });
  }
  return tokens;
}
