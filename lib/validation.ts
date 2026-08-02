type ValidationResult = { ok: true } | { ok: false; error: string };

export function validateTitle(title: string): ValidationResult {
  const trimmed = title.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: "Title must not be empty" };
  }
  if (trimmed.length > 200) {
    return { ok: false, error: "Title must be at most 200 characters" };
  }
  return { ok: true };
}

export function validateContent(content: unknown): ValidationResult {
  if (
    content === null ||
    typeof content !== "object" ||
    Array.isArray(content)
  ) {
    return { ok: false, error: "Content must be an object" };
  }

  const candidate = content as { type?: unknown };
  if (candidate.type !== "doc") {
    return { ok: false, error: 'Content type must be "doc"' };
  }

  return { ok: true };
}
