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
import { useAuth } from "../context/AuthContext";

export default function LoginScreen({ navigation }) {
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
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {/* Branding header — mirrors the web login's teal panel */}
        <View className="bg-primary-dark px-6 pb-10 pt-16">
          <Text className="text-3xl font-bold text-white">PubMark</Text>
          <Text className="mt-1 text-sm text-primary-light">Smart Market Management</Text>
        </View>

        <View className="flex-1 px-6 pt-8">
          <Text className="text-2xl font-bold text-gray-900">Welcome back</Text>
          <Text className="mt-1 text-sm text-gray-500">Sign in to your PubMark account</Text>

          <View className="mt-7">
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
                editable={!loading}
              />
              <Pressable onPress={() => setShowPassword((s) => !s)} hitSlop={10} className="px-2 py-2">
                <Text className="text-xs font-medium text-primary-dark">
                  {showPassword ? "Hide" : "Show"}
                </Text>
              </Pressable>
            </View>
          </View>

          {error ? (
            <View className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <Text className="text-sm leading-5 text-red-700">{error}</Text>
            </View>
          ) : null}

          <Pressable
            onPress={handleLogin}
            disabled={loading}
            className={`mt-6 flex-row items-center justify-center rounded-xl py-4 ${
              loading ? "bg-primary/60" : "bg-primary"
            }`}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-base font-semibold text-white">Sign In</Text>
            )}
          </Pressable>

          {/* Vendors can self-register, exactly as on the web. Officers and
              admins are created by an admin, so no sign-up link for them. */}
          <View className="mt-6 flex-row items-center">
            <View className="h-px flex-1 bg-gray-200" />
            <Text className="mx-3 text-xs text-gray-400">New vendor?</Text>
            <View className="h-px flex-1 bg-gray-200" />
          </View>

          <Pressable
            onPress={() => navigation.navigate("Register")}
            disabled={loading}
            className="mt-4 items-center justify-center rounded-xl border border-primary bg-white py-3.5"
          >
            <Text className="text-base font-semibold text-primary-dark">Create an Account</Text>
          </Pressable>

          <Text className="mt-8 text-center text-xs leading-5 text-gray-400">
            Admins and super-admins sign in on the web app.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
