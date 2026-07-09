import { Routes, Route } from "react-router-dom";
import { TopBar } from "./components/layout/TopBar.js";
import { Home } from "./routes/Home.js";
import { Alerts } from "./routes/Alerts.js";
import { Settings } from "./routes/Settings.js";
import { useWebSocket } from "./hooks/useWebSocket.js";

// -webkit-app-region is inherited, so setting "drag" here makes any empty background
// space draggable; interactive elements (nav links, cards, buttons) opt back out to "no-drag".
const dragStyle = { WebkitAppRegion: "drag" } as React.CSSProperties;

export default function App() {
  useWebSocket();

  return (
    <div className="flex h-screen w-screen flex-col bg-background" style={dragStyle}>
      <TopBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </div>
  );
}
