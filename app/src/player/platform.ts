import { isTauri } from "@/lib/platform";

export type Platform = "tauri" | "web" | "mobileweb";

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
  cached = isTauri
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
