import { Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// The native version renders Leaflet inside a WebView. In a plain browser we're
// already in a web page, so rather than nest one, the web build shows the same
// stalls as a tappable list with matching status colors.

function labelFor(input) {
  if (input.userAppStatus === "approved") return { text: "Yours", dot: "#6366f1" };
  if (input.userAppStatus === "pending") return { text: "Pending", dot: "#f59e0b" };
  // Matches the admin map's occupied color (AdminMapView.jsx's stallColor()).
  if (input.occupied) return { text: "Occupied", dot: input.occupiedColor ?? "#ef4444" };
  // Someone else has an undecided application — reads the same as "pending"
  // since there's no separate visual state for "pending, but not yours".
  if (input.pending) return { text: "Pending", dot: "#f59e0b" };
  return { text: "Available", dot: "#14B8A6" };
}

export default function StallMap({
  stalls,
  facilities = [],
  selectedId,
  selectedIds,
  multiSelectMode = false,
  onSelect,
  styleInputs = {},
  onFacilitySelect,
}) {
  return (
    <View className="flex-1">
      <View className="border-b border-amber-200 bg-amber-50 px-4 py-2.5">
        <Text className="text-[11px] leading-4 text-amber-800">
          The map renders on a phone — showing a stall list here instead.
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 10 }}>
        {facilities.map((facility) => {
          const meta = facility.type === "cr"
            ? { label: "CR", color: "#db2777", icon: "male-female-outline" }
            : facility.type === "stairs"
              ? { label: "Stairs", color: "#7c3aed", icon: "git-compare-outline" }
              : facility.type === "office"
                ? { label: "Office", color: "#ea580c", icon: "business-outline" }
                : { label: "Entrance", color: "#16a34a", icon: "enter-outline" };
          return (
            <Pressable key={`facility-${facility.id}`} onPress={() => onFacilitySelect?.(facility)} className="flex-row items-center rounded-2xl border border-gray-200 bg-white p-4">
              <View className="mr-3 h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: meta.color }}><Ionicons name={meta.icon} size={17} color="white" /></View>
              <View className="flex-1"><Text className="text-sm font-semibold text-gray-900">{meta.label}</Text><Text className="mt-0.5 text-xs text-gray-500">{facility.floor}F{facility.connectedFloors?.length ? ` · connects ${facility.connectedFloors.join(", ")}F` : ""}</Text><Text className="mt-1 text-[11px] text-gray-400">{facility.isAccessible ? "Accessible" : "Not marked accessible"}{facility.notes ? ` · ${facility.notes}` : ""}</Text></View>
            </Pressable>
          );
        })}
        {stalls.map((stall) => {
          const l = labelFor(styleInputs[stall.id] ?? {});
          const selected = multiSelectMode ? (selectedIds?.has(stall.id) ?? false) : stall.id === selectedId;
          return (
            <Pressable
              key={stall.id}
              onPress={() => onSelect(stall.id)}
              className={`flex-row items-center rounded-2xl border bg-white p-4 ${
                selected ? "border-blue-500" : "border-gray-200"
              }`}
            >
              <View style={{ backgroundColor: l.dot }} className="mr-3 h-2.5 w-2.5 rounded-full" />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-900">{stall.stall_name}</Text>
                <Text className="mt-0.5 text-xs text-gray-500">
                  Section {stall.section} · {stall.business_type}
                </Text>
              </View>
              <Text className="text-[10px] font-semibold" style={{ color: l.dot }}>
                {l.text}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
