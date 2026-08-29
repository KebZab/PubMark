import { SafeAreaView, ScrollView, Text, View, Pressable } from "react-native";
import { useAuth } from "../context/AuthContext";

// Temporary stand-in used by every tab until Phases 3 and 4 build the real
// screens. Shows who's logged in, which proves auth + role routing work.
export default function PlaceholderScreen({ title, note }: { title: string; note?: string }) {
  const { user, signOut } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="border-b border-gray-200 bg-white px-5 py-4">
        <Text className="text-lg font-semibold text-gray-900">{title}</Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-5">
        <View className="rounded-2xl border border-gray-200 bg-white p-5">
          <Text className="text-xs font-semibold uppercase tracking-wide text-gray-400">Signed in as</Text>
          <Text className="mt-1.5 text-base font-semibold text-gray-900">{user?.name}</Text>
          <Text className="text-sm text-gray-500">{user?.email}</Text>
          <View className="mt-3 self-start rounded-full bg-primary-surface px-3 py-1">
            <Text className="text-xs font-semibold text-primary-darker">{user?.role}</Text>
          </View>
        </View>

        <View className="mt-4 rounded-2xl border border-gray-200 bg-white p-5">
          <Text className="text-sm leading-5 text-gray-500">
            {note ?? "This screen gets built in a later phase."}
          </Text>
        </View>

        <Pressable
          onPress={signOut}
          className="mt-6 items-center rounded-xl border border-gray-200 bg-white py-3.5"
        >
          <Text className="text-sm font-semibold text-status-rejected">Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
