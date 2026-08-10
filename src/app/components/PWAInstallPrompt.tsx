import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function PWAInstallPrompt() {
  const [event, setEvent] = useState<InstallEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    const handler = (value: Event) => { value.preventDefault(); setEvent(value as InstallEvent); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  if (!event || dismissed) return null;
  return <div className="fixed bottom-5 left-5 z-[9998] max-w-sm rounded-2xl border border-teal-100 bg-white p-4 shadow-xl">
    <button aria-label="Dismiss install prompt" onClick={() => setDismissed(true)} className="absolute right-2 top-2 p-1 text-gray-400"><X className="h-4 w-4" /></button>
    <p className="pr-5 text-sm font-semibold text-gray-900">Install PubMark</p>
    <p className="mt-1 text-xs text-gray-600">Add PubMark to your device for faster access.</p>
    <button onClick={async () => { await event.prompt(); setDismissed(true); }} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal-600 px-3 text-sm font-medium text-white"><Download className="h-4 w-4" />Install app</button>
  </div>;
}
