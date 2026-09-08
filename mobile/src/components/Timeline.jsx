import { Text, View } from "react-native";
import { Card, formatDate } from "./ui";

// Same amber/emerald/red/gray families StatusPill (ui.jsx) already uses,
// one shade darker (500 vs 100) since these are solid dots, not pill
// backgrounds. "submitted" isn't an admin-assigned status, so it gets the
// app's own primary teal instead of borrowing a status color.
const TONE_STYLES = {
  submitted: { dot: "bg-primary", label: "text-primary-dark" },
  pending: { dot: "bg-amber-500", label: "text-amber-700" },
  approved: { dot: "bg-emerald-500", label: "text-emerald-700" },
  rejected: { dot: "bg-red-500", label: "text-red-700" },
  terminated: { dot: "bg-gray-500", label: "text-gray-600" },
};

// Vertical "tracking" timeline — most recent entry on top and highlighted,
// older entries below in grey, like a package-delivery tracker. Generic:
// renders whatever entries it's given (see utils/applicationTimeline.js for
// the application-specific builder).
export function Timeline({ entries, title = "Tracking" }) {
  if (!entries?.length) return null;

  return (
    <Card className="mt-4 p-4">
      <Text className="mb-3 text-sm font-semibold text-gray-800">{title}</Text>
      {entries.map((entry, index) => {
        const active = index === 0;
        const isLast = index === entries.length - 1;
        const tone = TONE_STYLES[entry.tone] ?? TONE_STYLES.submitted;
        return (
          <View key={entry.key} className="flex-row">
            <View className="w-6 items-center">
              <View className={`h-3 w-3 rounded-full ${active ? tone.dot : "bg-gray-300"}`} />
              {!isLast ? <View className="mt-1 w-0.5 flex-1 bg-gray-200" /> : null}
            </View>
            <View className={`flex-1 pl-3 ${isLast ? "pb-0.5" : "pb-5"}`}>
              <Text className={`text-xs font-semibold ${active ? tone.label : "text-gray-400"}`}>
                {entry.label}
              </Text>
              <Text className="mt-0.5 text-[10px] text-gray-400">
                {entry.date ? formatDate(entry.date) : "In progress"}
              </Text>
              {entry.detail ? (
                <Text className="mt-1 text-[10px] leading-4 text-gray-500">{entry.detail}</Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </Card>
  );
}
