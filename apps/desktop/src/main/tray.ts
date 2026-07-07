import { app, Tray, Menu, nativeImage, BrowserWindow } from "electron";

let tray: Tray | null = null;

export function createTray(getWindow: () => BrowserWindow | null, showWindow: () => void) {
  // No bundled icon asset yet; an empty image + text title is a common, low-effort menu bar item on macOS.
  tray = new Tray(nativeImage.createEmpty());
  tray.setTitle("₿");
  tray.setToolTip("Crypto & NFT Tracker");

  const menu = Menu.buildFromTemplate([
    {
      label: "Show Dashboard",
      click: showWindow,
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => app.quit(),
    },
  ]);
  tray.setContextMenu(menu);

  tray.on("click", () => {
    const win = getWindow();
    if (win?.isVisible()) {
      win.hide();
    } else {
      showWindow();
    }
  });

  return tray;
}
