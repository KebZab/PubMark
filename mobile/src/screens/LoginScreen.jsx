import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { signIn, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError("Enter both your email and password.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const profile = await signIn(email.trim(), password);
      // Admin/super-admin run on the web app, not here. Sign back out so we
      // don't leave a logged-in state the navigator has no screens for.
      if (profile.role !== "vendor" && profile.role !== "officer") {
        await signOut();
        setError("This app is for vendors and officers. Please use the web app to sign in as an admin.");
        setLoading(false);
        return;
      }
      // On success the navigator swaps automatically — no navigation call needed.
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to sign in.");
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-primary-surface"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
          paddingLeft: insets.left + 16,
          paddingRight: insets.right + 16,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          className="w-full self-center rounded-3xl bg-white px-6 py-8"
          style={Platform.select({
            web: { maxWidth: 448, boxShadow: "0 12px 24px rgba(15, 118, 110, 0.12)" },
            ios: { maxWidth: 448, shadowColor: "#0f766e", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.12, shadowRadius: 24 },
            default: { maxWidth: 448, elevation: 6 },
          })}
        >
          <View className="mb-6 flex-row items-center gap-2">
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Ionicons name="location-outline" size={20} color="#ffffff" />
            </View>
            <Text className="text-base font-bold text-gray-900">PubMark</Text>
          </View>
          <Text className="text-2xl font-bold text-gray-900">Welcome Back</Text>
          <Text className="mt-1 text-sm text-gray-500">Sign in to your PubMark account</Text>

          <View className="mt-6">
            <Text className="mb-2 text-sm font-medium text-gray-700">Email Address</Text>
            <TextInput
              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-base text-gray-900"
              placeholder="you@example.com"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                setError("");
              }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              accessibilityLabel="Email Address"
              autoComplete="email"
              editable={!loading}
            />
          </View>

          <View className="mt-4">
            <Text className="mb-2 text-sm font-medium text-gray-700">Password</Text>
            <View className="flex-row items-center rounded-xl border border-gray-200 bg-gray-50 pr-2">
              <TextInput
                className="flex-1 px-4 py-3.5 text-base text-gray-900"
                placeholder="••••••••"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  setError("");
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Password"
                autoComplete="current-password"
                editable={!loading}
              />
              <Pressable
                onPress={() => setShowPassword((s) => !s)}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                className="h-11 w-11 items-center justify-center"
              >
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#9ca3af" />
              </Pressable>
            </View>
          </View>

          {error ? (
            <View className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <Text accessibilityRole="alert" accessibilityLiveRegion="polite" className="text-sm leading-5 text-red-700">{error}</Text>
            </View>
          ) : null}

          <Pressable
            onPress={handleLogin}
            disabled={loading}
            accessibilityRole="button"
            accessibilityState={{ disabled: loading, busy: loading }}
            style={Platform.select({
              web: { boxShadow: "0 4px 8px rgba(20, 184, 166, 0.25)" },
              ios: { shadowColor: "#14B8A6", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8 },
              default: { elevation: 3 },
            })}
            className={`mt-4 flex-row items-center justify-center gap-2 rounded-xl py-3.5 ${
              loading ? "bg-primary/60" : "bg-primary"
            }`}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Ionicons name="log-in-outline" size={20} color="#ffffff" />
            )}
            <Text className="text-base font-semibold text-white">{loading ? "Signing in…" : "Sign In"}</Text>
          </Pressable>

          <View className="mt-5 flex-row flex-wrap items-center justify-between gap-x-2">
            <Pressable accessibilityRole="link" disabled={loading} onPress={() => navigation.navigate("GuestMap")} className="min-h-11 flex-row items-center gap-1">
              <Ionicons name="search-outline" size={14} color="#0d9488" />
              <Text className="text-xs font-medium text-primary-dark">Browse as Guest</Text>
            </Pressable>
            <View className="flex-row items-center">
            <Text className="text-xs text-gray-500">No account? </Text>
            <Pressable
              onPress={() => navigation.navigate("Register")}
              disabled={loading}
              accessibilityRole="link"
              accessibilityState={{ disabled: loading }}
              className="min-h-11 justify-center px-1"
            >
              <Text className="text-xs font-medium text-primary-dark">Register</Text>
            </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
