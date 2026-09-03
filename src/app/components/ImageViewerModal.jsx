import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Full-screen preview for a tapped stall photo — centered over a dark
 * backdrop, dismissed by the close button, Escape, or clicking outside the
 * image. When the gallery has more than one photo, Left/Right arrow keys and
 * on-screen chevrons step through it.
 */
export function ImageViewerModal({ images = [], startIndex = 0, onClose }) {
  const open = images.length > 0;
  const [index, setIndex] = useState(startIndex);

  // Jump to the clicked photo only when a *new* gallery opens — not on every
  // re-render while already browsing, which would snap navigation back to
  // the start each time the page's own state changes underneath the modal.
  useEffect(() => {
    if (open) setIndex(startIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const goPrev = () => setIndex((i) => (i - 1 + images.length) % images.length);
  const goNext = () => setIndex((i) => (i + 1) % images.length);

  useEffect(() => {
    if (!open) return;
    function handleKey(e) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && images.length > 1) goPrev();
      else if (e.key === "ArrowRight" && images.length > 1) goNext();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, images.length]);

  if (!open) return null;
  const current = images[index];

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 p-6"
      onClick={onClose}
    >
      <img
        src={current.url}
        alt=""
        className="max-h-full max-w-full rounded-lg object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 text-white text-xs font-medium">
            {index + 1} / {images.length}
          </div>
        </>
      )}

      <button
        onClick={onClose}
        className="absolute top-5 right-5 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
      >
        <X className="w-5 h-5 text-white" />
      </button>
    </div>
  );
}
