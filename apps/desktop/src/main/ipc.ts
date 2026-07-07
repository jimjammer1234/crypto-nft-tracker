import { ipcMain, shell } from "electron";

export function registerIpcHandlers() {
  ipcMain.handle("open-external", (_event, url: string) => {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return;
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return;
    shell.openExternal(parsed.toString());
  });
}
