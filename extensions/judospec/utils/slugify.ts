export function slugify(description: string): string {
  const trimmed = description.trim();
  if (!trimmed) {
    return "unnamed-change";
  }

  let slug = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!slug) {
    return "unnamed-change";
  }

  if (slug.length > 50) {
    slug = slug.substring(0, 50);
    const lastHyphen = slug.lastIndexOf("-");
    if (lastHyphen > 0) {
      slug = slug.substring(0, lastHyphen);
    }
    slug = slug.replace(/-+$/, "");
  }

  return slug || "unnamed-change";
}
