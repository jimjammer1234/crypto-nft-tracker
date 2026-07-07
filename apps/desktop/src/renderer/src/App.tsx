import { Routes, Route } from "react-router-dom";
import { TopBar } from "./components/layout/TopBar.js";
import { Home } from "./routes/Home.js";
import { Alerts } from "./routes/Alerts.js";
import { Settings } from "./routes/Settings.js";
import { useWebSocket } from "./hooks/useWebSocket.js";

export default function App() {
  useWebSocket();

  return (
    <div className="flex h-screen w-screen flex-col bg-background">
      <TopBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </div>
  );
}
