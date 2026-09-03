import { useEffect, useRef, useState } from "react";
import { Image, Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";

/**
 * Full-screen preview for a tapped stall-photo thumbnail — centered over a
 * dark backdrop, dismissed by the close button or tapping the photo. When
 * the gallery has more than one photo, a native paged horizontal scroll lets
 * you swipe to the next/previous one.
 */
export default function ImageViewerModal({ images = [], startIndex = 0, onClose }) {
  const { width, height } = useWindowDimensions();
  const scrollRef = useRef(null);
  const [page, setPage] = useState(startIndex);
  const open = images.length > 0;

  // Jump to the tapped photo only when a *new* gallery opens — the Modal
  // keeps its children mounted while hidden, so without this the scroll
  // position from the last time it was open would still be showing.
  useEffect(() => {
    if (open) {
      setPage(startIndex);
      scrollRef.current?.scrollTo({ x: startIndex * width, animated: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black">
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: startIndex * width, y: 0 }}
          onMomentumScrollEnd={(e) => {
            setPage(Math.round(e.nativeEvent.contentOffset.x / width));
          }}
        >
          {images.map((img) => (
            <Pressable
              key={img.id}
              onPress={onClose}
              style={{ width, height }}
              className="items-center justify-center"
            >
              <Image source={{ uri: img.url }} style={{ width, height }} resizeMode="contain" />
            </Pressable>
          ))}
        </ScrollView>

        {images.length > 1 ? (
          <View className="absolute bottom-10 self-center rounded-full bg-black/60 px-3 py-1">
            <Text className="text-xs font-medium text-white">
              {page + 1} / {images.length}
            </Text>
          </View>
        ) : null}

        <Pressable
          onPress={onClose}
          hitSlop={12}
          className="absolute right-5 top-14 h-9 w-9 items-center justify-center rounded-full bg-black/60"
        >
          <Ionicons name="close" size={22} color="#ffffff" />
        </Pressable>
      </View>
    </Modal>
  );
}
