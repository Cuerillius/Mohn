// Single source of truth for platform detection. Everything in the player
// module asks here — no ad-hoc `"__TAURI__" in window` checks elsewhere.

export type Platform = "tauri" | "web" | "mobileweb";

function detectTauri(): boolean {
  return "__TAURI_INTERNALS__" in window || "__TAURI__" in window;
}

function detectMobileBrowser(): boolean {
  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    /Android/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

let cached: Platform | null = null;

export function getPlatform(): Platform {
  if (cached) return cached;
  cached = detectTauri()
    ? "tauri"
    : detectMobileBrowser()
      ? "mobileweb"
      : "web";
  return cached;
}

export interface PlatformCapabilities {
  usesMpv: boolean;
  usesHls: boolean;
  requiresPro: boolean;
  usesExternal: boolean;
}

export function capabilities(
  platform: Platform = getPlatform(),
): PlatformCapabilities {
  switch (platform) {
    case "tauri":
      return {
        usesMpv: true,
        usesHls: false,
        requiresPro: false,
        usesExternal: false,
      };
    /*   case "mobileweb":
      return { usesMpv: false, usesHls: false, requiresPro: true, usesExternal: true }; */
    case "web":
    default:
      return {
        usesMpv: false,
        usesHls: true,
        requiresPro: true,
        usesExternal: false,
      };
  }
}
