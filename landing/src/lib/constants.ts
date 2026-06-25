export const GITHUB = "https://github.com/Cuerillius/Mohn";
export const RELEASES = `${GITHUB}/releases/latest`;
export const APP_URL = import.meta.env.VITE_APP_URL;

export function openApp() {
  window.location.href = APP_URL;
}
