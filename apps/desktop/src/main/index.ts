import { app, BrowserWindow, shell } from "electron";
import { join } from "node:path";
import { createTray } from "./tray.js";
import { configureAutoStart } from "./autoStart.js";
import { startWsBridge } from "./wsBridge.js";

const isDev = !app.isPackaged;
let mainWindow: BrowserWindow | null = null;
let isQuitting = false;

function createWindow(showOnCreate: boolean) {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    show: showOnCreate,
    backgroundColor: "#0d0b14",
    titleBarStyle: "hiddenInset",
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
    },
  });

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  // Tray app: closing the window just hides it, it doesn't quit the background poller/notifier.
  win.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      win.hide();
    }
  });

  if (isDev && process.env["ELECTRON_RENDERER_URL"]) {
    win.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    win.loadFile(join(__dirname, "../renderer/index.html"));
  }

  mainWindow = win;
  return win;
}

function showWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createWindow(true);
  } else {
    mainWindow.show();
  }
}

app.whenReady().then(() => {
  const loginSettings = app.getLoginItemSettings();
  const openedHiddenAtLogin = loginSettings.wasOpenedAsHidden;

  createWindow(!openedHiddenAtLogin);
  createTray(() => mainWindow, showWindow);
  configureAutoStart(true);
  startWsBridge(() => mainWindow);

  app.on("activate", () => {
    showWindow();
  });
});

app.on("before-quit", () => {
  isQuitting = true;
});

app.on("window-all-closed", () => {
  // No-op: this is a tray app, it should keep running with no windows open until Quit is chosen.
});
