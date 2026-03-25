function isPrivateHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "localhost" || h === "0.0.0.0" || h.startsWith("127.")) return true;
  if (h === "::1") return true;
  if (h.startsWith("10.") || h.startsWith("192.168.")) return true;
  if (h.startsWith("172.")) {
    const octet = parseInt(h.split(".")[1], 10);
    if (octet >= 16 && octet <= 31) return true;
  }
  if (h.startsWith("169.254.")) return true;
  const isIPv6 = h.includes(":");
  if (isIPv6 && (h.startsWith("fe80") || h.startsWith("fc") || h.startsWith("fd"))) return true;
  if (h.endsWith(".local")) return true;
  return false;
}

/**
 * Returns true if the URL is safe to use as a custom API endpoint.
 *
 * Allows:
 *   - https:// (any host)
 *   - http:// on private/local hosts (localhost, 192.168.x.x, etc.)
 *   - http:// on known deployment ingress patterns:
 *       *.akash.pub   — Akash Network provider ingress
 *       *.aksh.pw     — Akash testnet ingress
 *       *.onrender.com, *.railway.app, *.fly.dev, *.ngrok.io, *.ngrok-free.app
 *       — common self-hosted / tunnel deployment patterns
 *
 * Everything else (plain http:// to unknown public hosts) is rejected so we
 * don't accidentally send API keys over unencrypted connections.
 */
export function isSecureEndpoint(url: string): boolean {
  try {
    const parsed = new URL(url);

    // HTTPS is always fine
    if (parsed.protocol === "https:") return true;

    // HTTP is fine on private/local network hosts
    if (parsed.protocol === "http:" && isPrivateHost(parsed.hostname)) return true;

    // HTTP is fine on known deployment ingress patterns where the provider
    // controls the domain and we trust the deployment environment.
    if (parsed.protocol === "http:") {
      const h = parsed.hostname.toLowerCase();
      const allowedHttpSuffixes = [
        // Akash Network mainnet + testnet ingress
        ".akash.pub",
        ".aksh.pw",
        // Common self-hosted / cloud deployment patterns
        ".onrender.com",
        ".railway.app",
        ".fly.dev",
        ".ngrok.io",
        ".ngrok-free.app",
        ".loca.lt",
        ".trycloudflare.com",
      ];
      if (allowedHttpSuffixes.some((suffix) => h.endsWith(suffix))) return true;
    }

    return false;
  } catch {
    return false;
  }
}
