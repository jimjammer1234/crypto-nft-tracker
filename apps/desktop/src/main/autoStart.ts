import { app } from "electron";

export function configureAutoStart(enabled: boolean) {
  app.setLoginItemSettings({
    openAtLogin: enabled,
    openAsHidden: true, // start minimized to the tray, not with the dashboard window popping up
  });
}
