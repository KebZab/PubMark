import { FileText, Image as ImageIcon, Eye, Ban } from "lucide-react";

const TONES = {
  teal: { wrap: "bg-teal-50 border-teal-200", chip: "bg-teal-100", icon: "text-[#14B8A6]", link: "text-[#0d9488] hover:bg-teal-100" },
  blue: { wrap: "bg-blue-50 border-blue-200", chip: "bg-blue-100", icon: "text-blue-500", link: "text-blue-600 hover:bg-blue-100" },
  gray: { wrap: "bg-gray-50 border-gray-200", chip: "bg-gray-100", icon: "text-gray-500", link: "text-gray-600 hover:bg-gray-100" },
};

/**
 * One attachment row: name, a short caption, and a View action.
 *
 * `url` is a short-lived signed link the server generates only for people
 * allowed to see the record. When it is absent the file was never stored
 * (older records kept a filename only), so we say so plainly instead of
 * offering a link that cannot open.
 */
export function AttachmentLink({ name, url, caption, mimeType, tone = "teal", badge }) {
  if (!name) return null;
  const t = TONES[tone] ?? TONES.teal;
  // Attachments arrive either with a real MIME type ("image/jpeg") or the
  // server's display kind ("image"), so accept both, then fall back to the
  // file extension.
  const isImage =
    String(mimeType || "").startsWith("image") || /\.(jpe?g|png|webp|heic|heif)$/i.test(name);
  const Icon = isImage ? ImageIcon : FileText;

  return (
    <div className={`flex items-center gap-3 border rounded-xl p-3 ${t.wrap}`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${t.chip}`}>
        <Icon className={`w-4 h-4 ${t.icon}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{name}</p>
        {caption && <p className="text-xs text-gray-500">{caption}</p>}
      </div>
      {badge && (
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${t.chip} ${t.icon}`}>
          {badge}
        </span>
      )}
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg flex-shrink-0 transition-colors ${t.link}`}
        >
          <Eye className="w-3.5 h-3.5" />
          View
        </a>
      ) : (
        <span
          title="This record kept only the file name — no file was stored."
          className="flex items-center gap-1 text-xs text-gray-400 px-2.5 py-1.5 flex-shrink-0"
        >
          <Ban className="w-3.5 h-3.5" />
          No file
        </span>
      )}
    </div>
  );
}
