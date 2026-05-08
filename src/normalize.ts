export function normalizePath(input: string): string {
  let p = input.replace(/\\/g, "/");
  const queryIndex = p.search(/[?#]/);
  if (queryIndex !== -1) p = p.slice(0, queryIndex);
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p;
}

export function getBasename(p: string): string {
  const slash = p.lastIndexOf("/");
  return slash === -1 ? p : p.slice(slash + 1);
}

export function getParentName(p: string): string {
  const slash = p.lastIndexOf("/");
  if (slash === -1) return "";
  const upTo = p.slice(0, slash);
  const prevSlash = upTo.lastIndexOf("/");
  return prevSlash === -1 ? upTo : upTo.slice(prevSlash + 1);
}

/**
 * Returns extension candidates from longest to shortest, lowercase, no leading dot.
 * `page.test.tsx` → ["test.tsx", "tsx"]
 * `.gitignore` → []
 */
export function getExtensionCandidates(basename: string): string[] {
  const lower = basename.toLowerCase();
  const parts = lower.split(".");
  const candidates: string[] = [];
  for (let i = 1; i < parts.length; i++) {
    const piece = parts.slice(i).join(".");
    if (piece.length > 0) candidates.push(piece);
  }
  return candidates;
}
