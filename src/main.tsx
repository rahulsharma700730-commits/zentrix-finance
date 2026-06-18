import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

const restoreSpaPath = () => {
  const params = new URLSearchParams(window.location.search);
  const spaPath = params.get("__spa_path");

  if (!spaPath || !spaPath.startsWith("/")) return;

  const cleanPath = `${spaPath}${window.location.hash}`;
  window.history.replaceState(null, "", cleanPath);
};

restoreSpaPath();

createRoot(document.getElementById("root")!).render(<App />);
