import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { isTauri } from "./platform";

export async function downloadUpdate(): Promise<Update | null> {
  if (!isTauri) return null;

  try {
    const update = await check();
    if (!update) return null;

    await update.downloadAndInstall();
    return update;
  } catch (err) {
    console.error("Update check/download failed:", err);
    return null;
  }
}

export async function restartToUpdate(): Promise<void> {
  await relaunch();
}
