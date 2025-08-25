export function formatLinkUrl(platform: string, url: string): string {
  if (platform === "phone") {
    return `tel:${url.replace(/[^\d+]/g, "")}`;
  }
  if (platform === "whatsapp") {
    return `https://wa.me/${url.replace(/[^\d+]/g, "")}`;
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
  return url;
}
