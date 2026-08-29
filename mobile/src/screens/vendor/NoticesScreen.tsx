import { RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApiData } from "../../hooks/useApiData";
import { getAnnouncements } from "../../services/api";
import { Card, EmptyState, ErrorState, LoadingState, ScreenHeader, formatDate } from "../../components/ui";
import type { AnnouncementType } from "../../services/types";

// Same four announcement types and color language as the web app.
const TYPE_STYLES: Record<AnnouncementType, { bar: string; chip: string; chipText: string }> = {
  info: { bar: "bg-blue-400", chip: "bg-blue-100", chipText: "text-blue-700" },
  success: { bar: "bg-emerald-400", chip: "bg-emerald-100", chipText: "text-emerald-700" },
  warning: { bar: "bg-amber-400", chip: "bg-amber-100", chipText: "text-amber-700" },
  urgent: { bar: "bg-red-400", chip: "bg-red-100", chipText: "text-red-700" },
};

export default function NoticesScreen() {
  const { data, loading, error, refetch } = useApiData(getAnnouncements);
  const announcements = data?.announcements ?? [];

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <ScreenHeader title="Notices" subtitle="Announcements from market administration" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor="#14B8A6" />}
      >
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : announcements.length === 0 ? (
          <EmptyState title="No notices yet" note="Announcements from the market office will appear here." />
        ) : (
          <View className="gap-3 px-4 pt-4">
            {announcements.map((a) => {
              const style = TYPE_STYLES[a.type] ?? TYPE_STYLES.info;
              return (
                <Card key={a.id} className="overflow-hidden">
                  <View className="flex-row">
                    <View className={`w-1 ${style.bar}`} />
                    <View className="flex-1 p-4">
                      <View className="flex-row items-start justify-between">
                        <Text className="flex-1 pr-3 text-sm font-semibold text-gray-900">{a.title}</Text>
                        <View className={`rounded-full px-2.5 py-1 ${style.chip}`}>
                          <Text className={`text-[10px] font-semibold capitalize ${style.chipText}`}>{a.type}</Text>
                        </View>
                      </View>
                      <Text className="mt-2 text-xs leading-5 text-gray-600">{a.message}</Text>
                      <Text className="mt-3 text-[11px] text-gray-400">
                        {a.author} · {formatDate(a.createdAt)}
                      </Text>
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
