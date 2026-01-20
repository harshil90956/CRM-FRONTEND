import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { pushWarLog } from "@/core/war/warTelemetry";

if (typeof window !== 'undefined') {
  try {
    const flag = String((import.meta as any)?.env?.VITE_WAR_MODE || '').toLowerCase();
    if (flag === 'true') {
      (window as any).WAR_MODE = true;
    }
  } catch {
  }

  try {
    if (typeof PerformanceObserver !== 'undefined') {
      const paintObs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          pushWarLog({
            ts: new Date().toISOString(),
            type: 'ui',
            message: 'paint',
            latencyMs: Math.round((entry as any).startTime * 100) / 100,
            meta: {
              name: entry.name,
            },
          });
        }
      });
      try {
        paintObs.observe({ type: 'paint', buffered: true } as any);
      } catch {
      }

      const inputObs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          const delay = Math.max(0, (entry.processingStart || 0) - (entry.startTime || 0));
          pushWarLog({
            ts: new Date().toISOString(),
            type: 'ui',
            message: 'first_input',
            latencyMs: Math.round(delay * 100) / 100,
            meta: {
              name: entry.name,
              duration: entry.duration,
            },
          });
        }
      });
      try {
        inputObs.observe({ type: 'first-input', buffered: true } as any);
      } catch {
      }
    }
  } catch {
  }

  window.addEventListener('unhandledrejection', (event) => {
    const reason: any = (event as any).reason;
    const message = typeof reason?.message === 'string' ? reason.message : typeof reason === 'string' ? reason : '';
    if (message.includes('No checkout popup config found')) {
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
