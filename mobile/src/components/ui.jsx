import { ActivityIndicator, Alert, Image, Linking, Platform, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

// Shared bits so every screen looks like the same app — and like the web app.

export function ScreenHeader({ title, subtitle }) {
  return (
    <View className="border-b border-gray-200 bg-white px-5 py-4">
      <Text className="text-lg font-semibold text-gray-900">{title}</Text>
      {subtitle ? <Text className="mt-0.5 text-xs text-gray-500">{subtitle}</Text> : null}
    </View>
  );
}

export function LoadingState() {
  return (
    <View className="flex-1 items-center justify-center py-16">
      <ActivityIndicator size="large" color="#14B8A6" />
    </View>
  );
}

export function ErrorState({ message }) {
  return (
    <View className="mx-4 mt-4 rounded-2xl border border-red-200 bg-red-50 p-5">
      <Text className="text-sm font-semibold text-red-900">Couldn't load this</Text>
      <Text className="mt-1.5 text-xs leading-5 text-red-700">{message}</Text>
      <Text className="mt-2 text-xs text-red-600">Pull down to try again.</Text>
    </View>
  );
}

export function EmptyState({ title, note }) {
  return (
    <View className="mx-4 mt-4 items-center rounded-2xl border border-gray-200 bg-white px-5 py-12">
      <Text className="text-sm font-semibold text-gray-700">{title}</Text>
      {note ? <Text className="mt-1.5 text-center text-xs leading-5 text-gray-400">{note}</Text> : null}
    </View>
  );
}

// Status pill — same color language as the web app.
const STATUS_STYLES = {
  pending: { bg: "bg-amber-100", text: "text-amber-700", label: "Pending" },
  approved: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Approved" },
  rejected: { bg: "bg-red-100", text: "text-red-700", label: "Rejected" },
  terminated: { bg: "bg-gray-200", text: "text-gray-600", label: "Terminated" },
};

export function StatusPill({ status }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
  return (
    <View className={`self-start rounded-full px-2.5 py-1 ${s.bg}`}>
      <Text className={`text-[10px] font-semibold ${s.text}`}>{s.label}</Text>
    </View>
  );
}

export function Card({ children, className = "" }) {
  return <View className={`rounded-2xl border border-gray-200 bg-white ${className}`}>{children}</View>;
}

export function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Header used across the officer screens. Shows who's signed in and gives them
 * a way out from any tab, rather than hiding sign-out on a single screen.
 */
export function OfficerHeader({ title, subtitle, right }) {
  const { user, signOut } = useAuth();

  const confirmSignOut = () => {
    if (Platform.OS === "web") {
      signOut();
      return;
    }
    Alert.alert("Sign out?", `You're signed in as ${user?.name}.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => signOut() },
    ]);
  };

  return (
    <View className="border-b border-gray-200 bg-white px-5 py-4">
      <View className="mb-2 flex-row items-center">
        <Text className="flex-1 text-[11px] text-gray-400" numberOfLines={1}>
          {user?.name} · Officer
        </Text>
        <Pressable
          onPress={confirmSignOut}
          hitSlop={10}
          className="flex-row items-center rounded-lg bg-gray-100 px-2.5 py-1.5"
        >
          <Ionicons name="log-out-outline" size={13} color="#4b5563" />
          <Text className="ml-1 text-[11px] font-semibold text-gray-600">Sign out</Text>
        </Pressable>
      </View>

      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-lg font-semibold text-gray-900">{title}</Text>
          {subtitle ? <Text className="mt-0.5 text-xs text-gray-500">{subtitle}</Text> : null}
        </View>
        {right}
      </View>
    </View>
  );
}

/**
 * Attachments on a record — evidence photos, inspection shots, permits.
 *
 * `url` is a short-lived signed link the server produces only for people
 * allowed to see the record, so anything rendered here is already permitted.
 * Older records kept a file name with no file behind it; those show as a
 * plain dimmed chip rather than a thumbnail that cannot load.
 */
export function Attachments({ files = [], emptyLabel }) {
  if (!files.length) {
    return emptyLabel ? <Text className="mt-3 text-[11px] italic text-gray-400">{emptyLabel}</Text> : null;
  }
  return (
    <View className="mt-3 flex-row flex-wrap gap-2">
      {files.map((file, index) => {
        const isImage = String(file.type || "").startsWith("image");
        if (file.url && isImage) {
          return (
            <Pressable
              key={file.id ?? index}
              onPress={() => Linking.openURL(file.url)}
              className="h-16 w-16 overflow-hidden rounded-lg border border-gray-200"
            >
              <Image source={{ uri: file.url }} className="h-full w-full" resizeMode="cover" />
            </Pressable>
          );
        }
        return (
          <Pressable
            key={file.id ?? index}
            onPress={() => (file.url ? Linking.openURL(file.url) : null)}
            disabled={!file.url}
            className={`flex-row items-center rounded-lg px-2 py-1.5 ${file.url ? "bg-gray-100" : "bg-gray-50"}`}
          >
            <Ionicons
              name={file.url ? "document-outline" : "close-circle-outline"}
              size={11}
              color={file.url ? "#6b7280" : "#9ca3af"}
            />
            <Text
              className={`ml-1 max-w-[9rem] text-[10px] ${file.url ? "text-gray-600" : "text-gray-400"}`}
              numberOfLines={1}
            >
              {file.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
