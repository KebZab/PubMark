import { Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "./ui";

export default function NotifyVendorChoice({
  notifyVendor,
  vendorNoticeMessage,
  onChange,
  disabled = false,
}) {
  const choose = (next) => {
    onChange({
      notifyVendor: next,
      vendorNoticeMessage: next ? vendorNoticeMessage : "",
    });
  };

  return (
    <Card className="mt-4 p-4">
      <Text className="text-sm font-medium text-gray-700">
        Notify vendor? <Text className="text-red-500">*</Text>
      </Text>
      <View className="mt-3 flex-row gap-2">
        {[true, false].map((choice) => {
          const selected = notifyVendor === choice;
          return (
            <Pressable
              key={String(choice)}
              onPress={() => choose(choice)}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityLabel={choice ? "Notify vendor" : "Do not notify vendor"}
              accessibilityState={{ selected, disabled }}
              className={`flex-1 items-center justify-center rounded-xl border py-2 ${
                selected ? "border-amber-500 bg-amber-500" : "border-gray-200 bg-white"
              } ${disabled ? "opacity-50" : ""}`}
            >
              <Ionicons
                name={choice ? "checkmark" : "close"}
                size={22}
                color={selected ? "#ffffff" : "#4b5563"}
              />
            </Pressable>
          );
        })}
      </View>
      {notifyVendor === true ? (
        <View className="mt-4">
          <Text className="mb-2 text-sm font-medium text-gray-700">Message to vendor (optional)</Text>
          <TextInput
            className="min-h-[88px] rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900"
            placeholder="Optional message to the vendor — you may leave this blank."
            placeholderTextColor="#9ca3af"
            value={vendorNoticeMessage}
            onChangeText={(value) => onChange({ vendorNoticeMessage: value })}
            editable={!disabled}
            multiline
            textAlignVertical="top"
          />
        </View>
      ) : null}
    </Card>
  );
}
