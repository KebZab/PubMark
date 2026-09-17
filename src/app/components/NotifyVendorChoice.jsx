import { Check, X } from "lucide-react";

export function NotifyVendorChoice({ notifyVendor, vendorNoticeMessage, onChange }) {
  function choose(next) {
    onChange({
      notifyVendor: next,
      vendorNoticeMessage: next ? vendorNoticeMessage : "",
    });
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
      <p className="text-xs font-medium text-gray-700">
        Notify vendor? <span className="text-red-500">*</span>
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {[true, false].map((choice) => {
          const selected = notifyVendor === choice;
          const Icon = choice ? Check : X;
          return (
            <button
              key={String(choice)}
              type="button"
              onClick={() => choose(choice)}
              aria-pressed={selected}
              aria-label={choice ? "Notify vendor" : "Do not notify vendor"}
              title={choice ? "Notify vendor" : "Do not notify vendor"}
              className={`flex h-8 items-center justify-center rounded-lg border transition-colors ${
                selected
                  ? "border-amber-500 bg-amber-500 text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-amber-300"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </button>
          );
        })}
      </div>
      {notifyVendor === true && (
        <div className="mt-3">
          <label className="mb-1.5 block text-xs font-medium text-gray-700">
            Message to vendor (optional)
          </label>
          <textarea
            rows={3}
            value={vendorNoticeMessage}
            onChange={(event) => onChange({ vendorNoticeMessage: event.target.value })}
            placeholder="Optional message to the vendor — you may leave this blank."
            className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
      )}
    </div>
  );
}
