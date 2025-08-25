export function formatLinkUrl(platform: string, url: string): string {
  if (platform === "phone") {
    return `tel:${url.replace(/[^\d+]/g, "")}`;
  }
  if (platform === "whatsapp") {
    return `https://wa.me/${url.replace(/[^\d+]/g, "")}`;
  }
  if (platform === "email") {
    return `mailto:${url.replace(/^mailto:/i, "")}`;
  }
  if (platform === "telegram") {
    const username = url
      .replace(/^https?:\/\/t\.me\//i, "")
      .replace(/^@/, "");
    return `https://t.me/${username}`;
  }
  if (!/^https?:\/\//i.test(url)) {
    return `https://${url}`;
  }
  return url;
}

export function stripLinkUrl(platform: string, url: string): string {
  if (platform === "phone") {
    return url.replace(/^tel:/, "");
  }
  if (platform === "whatsapp") {
    return url.replace(/^https?:\/\/(?:wa\.me\/|api\.whatsapp\.com\/send\?phone=)/, "");
  }
  if (platform === "email") {
    return url.replace(/^mailto:/i, "");
  }
  if (platform === "telegram") {
    return url.replace(/^https?:\/\/t\.me\//i, "").replace(/^@/, "");
  }
  return url;
}
