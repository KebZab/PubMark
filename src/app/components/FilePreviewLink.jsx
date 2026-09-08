import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { ImageViewerModal } from "./ImageViewerModal";

/**
 * Drop-in replacement for `<a href target="_blank">` — opens images and PDFs
 * in the same in-app modal viewer used elsewhere (stall photos, permit
 * files via AttachmentLink) instead of a new browser tab. Anything else
 * still opens in a new tab, since there's no reliable in-browser preview
 * for it. Renders its own trigger via `children`, so callers keep whatever
 * link/button styling they already have.
 */
export function FilePreviewLink({ url, name, mimeType, className, children }) {
  const [showViewer, setShowViewer] = useState(false);
  const fileName = name || url || "";
  const isImage = String(mimeType || "").startsWith("image") || /\.(jpe?g|png|webp|heic|heif)$/i.test(fileName);
  const isPdf = String(mimeType || "").startsWith("application/pdf") || /\.pdf$/i.test(fileName);
  const previewable = isImage || isPdf;

  useEffect(() => {
    if (!isPdf || !showViewer) return;
    function handleKey(e) {
      if (e.key === "Escape") setShowViewer(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isPdf, showViewer]);

  if (!url) return null;

  if (!previewable) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className={className}>
        {children}
      </a>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setShowViewer(true)} className={className}>
        {children}
      </button>
      {isImage && showViewer && (
        <ImageViewerModal images={[{ url }]} startIndex={0} onClose={() => setShowViewer(false)} />
      )}
      {isPdf && showViewer && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 p-6"
          onClick={() => setShowViewer(false)}
        >
          <div
            className="w-full h-full max-w-4xl bg-white rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe src={url} title={fileName} className="w-full h-full" />
          </div>
          <button
            onClick={() => setShowViewer(false)}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      )}
    </>
  );
}
