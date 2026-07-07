import { Routes, Route } from "react-router-dom";
import { TopBar } from "./components/layout/TopBar.js";
import { Home } from "./routes/Home.js";
import { Settings } from "./routes/Settings.js";

export default function App() {
  return (
    <div className="flex h-screen w-screen flex-col bg-background">
      <TopBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </div>
  );
}
