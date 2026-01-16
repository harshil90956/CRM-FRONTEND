import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason: any = (event as any).reason;
    const message = typeof reason?.message === 'string' ? reason.message : typeof reason === 'string' ? reason : '';
    if (message.includes('No checkout popup config found')) {
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
