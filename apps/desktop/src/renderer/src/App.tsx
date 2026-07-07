import { Routes, Route } from "react-router-dom";
import { Sidebar } from "./components/layout/Sidebar.js";
import { Dashboard } from "./routes/Dashboard.js";
import { Mining } from "./routes/Mining.js";
import { Nft } from "./routes/Nft.js";
import { Settings } from "./routes/Settings.js";

export default function App() {
  return (
    <div className="flex h-screen w-screen bg-background">
      <Sidebar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/mining" element={<Mining />} />
        <Route path="/nft" element={<Nft />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </div>
  );
}
