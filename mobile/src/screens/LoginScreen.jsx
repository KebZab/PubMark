import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
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
import {
  isGoogleSignInInProgress,
  isGoogleSuccess,
  nativeGoogleSignInAvailable,
  signOutGoogle,
  startGoogleSignIn,
} from "../services/googleSignIn";
import { useAuth } from "../context/AuthContext";
import GoogleSignupFillUpForm from "./GoogleSignupFillUpForm";

const googleEnabled = Boolean(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) && nativeGoogleSignInAvailable;

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  // The card's own y-position within the ScrollView's content -- Fields
  // inside GoogleSignupFillUpForm report their onLayout position relative to
  // this card (their direct parent), so this needs to be added back on to
  // get a scroll-content-relative offset.
  const cardOffsetRef = useRef(0);
  const { signIn, signInWithGoogle, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // "login" = normal form; "needs_signup" = Google-verified email has no
  // account yet, showing the fill-up form; "signup_sent" = fill-up form
  // submitted, confirmation email on its way. Mirrors web's Login.jsx.
  const [googleStep, setGoogleStep] = useState("login");
  const [googleCredential, setGoogleCredential] = useState(null); // raw ID token, in-memory only
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleName, setGoogleName] = useState("");

  function resetGoogleFlow() {
    // The native SDK caches whichever account was last picked and will
    // silently reuse it on the next signIn() call — without this, going
    // back to try a different Google account would keep landing right back
    // on the fill-up form for the previous email instead of showing the
    // account picker again.
    if (googleEnabled) {
      signOutGoogle().catch(() => {});
    }
    setGoogleStep("login");
    setGoogleCredential(null);
    setGoogleEmail("");
    setGoogleName("");
    setError("");
  }

  async function afterAuth(profile) {
    // Admin/super-admin run on the web app, not here. Sign back out so we
    // don't leave a logged-in state the navigator has no screens for.
    if (profile.role !== "vendor" && profile.role !== "officer") {
      await signOut();
      setError("This app is for vendors and officers. Please use the web app to sign in as an admin.");
      return false;
    }
    return true;
  }

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError("Enter both your email and password.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const profile = await signIn(email.trim(), password);
      await afterAuth(profile);
      // On success the navigator swaps automatically — no navigation call needed.
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      const response = await startGoogleSignIn();
      if (!isGoogleSuccess(response)) {
        // user cancelled the picker — nothing to show
        return;
      }
      const credential = response.data.idToken;
      const result = await signInWithGoogle(credential);
      if (result?.needsSignup) {
        setGoogleCredential(credential);
        setGoogleEmail(result.email);
        setGoogleName(result.name || "");
        setGoogleStep("needs_signup");
        return;
      }
      await afterAuth(result);
    } catch (e) {
      if (isGoogleSignInInProgress(e)) {
        // already mid sign-in, ignore the duplicate tap
        return;
      }
      setError(e instanceof Error ? e.message : "Unable to sign in with Google.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-primary-surface"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={20}
    >
      <StatusBar style="dark" />
      <ScrollView
        ref={scrollRef}
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
          style={{
            maxWidth: 448,
            shadowColor: "#0f766e",
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.12,
            shadowRadius: 24,
            elevation: 6,
          }}
          onLayout={(e) => {
            cardOffsetRef.current = e.nativeEvent.layout.y;
          }}
        >
          {/* Kept visible across every step (plain login, Google fill-up
              form, confirmation message) so branding never disappears
              mid-flow — matches web's Login.jsx, which keeps its logo
              fixed in the left panel while only the form swaps. */}
          <View className="mb-6 flex-row items-center gap-2">
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Ionicons name="location-outline" size={20} color="#ffffff" />
            </View>
            <Text className="text-base font-bold text-gray-900">PubMark</Text>
          </View>

          {googleStep === "login" && (
            <>
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
                style={{ shadowColor: "#14B8A6", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 3 }}
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

              {googleEnabled && (
                <View className="mt-4">
                  <View className="mb-3 flex-row items-center gap-3">
                    <View className="h-px flex-1 bg-gray-200" />
                    <Text className="text-xs font-medium text-gray-400">or continue with</Text>
                    <View className="h-px flex-1 bg-gray-200" />
                  </View>
                  <Pressable
                    onPress={handleGoogleSignIn}
                    disabled={googleLoading}
                    accessibilityRole="button"
                    accessibilityLabel="Continue with Google"
                    accessibilityState={{ disabled: googleLoading, busy: googleLoading }}
                    className={`flex-row items-center justify-center gap-2 rounded-full border border-gray-300 py-3 ${
                      googleLoading ? "bg-gray-50" : "bg-white"
                    }`}
                  >
                    {googleLoading ? (
                      <ActivityIndicator color="#374151" />
                    ) : (
                      <Image
                        source={require("../../assets/google-logo.png")}
                        style={{ width: 18, height: 18 }}
                        resizeMode="contain"
                      />
                    )}
                    <Text className="text-sm font-semibold text-gray-700">
                      {googleLoading ? "Signing in…" : "Continue with Google"}
                    </Text>
                  </Pressable>
                </View>
              )}

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
            </>
          )}

          {googleStep === "needs_signup" && (
            <>
              <Text className="text-2xl font-bold text-gray-900">Complete Your Profile</Text>
              <Text className="mt-1 text-sm text-gray-500">
                Just a few more details to finish creating your account
              </Text>
              <GoogleSignupFillUpForm
                email={googleEmail}
                name={googleName}
                credential={googleCredential}
                onDone={() => setGoogleStep("signup_sent")}
                onCancel={resetGoogleFlow}
                scrollViewRef={scrollRef}
                cardOffsetRef={cardOffsetRef}
              />
            </>
          )}

          {googleStep === "signup_sent" && (
            <View className="items-center py-8">
              <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-teal-100">
                <Ionicons name="mail-outline" size={28} color="#0f766e" />
              </View>
              <Text className="text-xl font-bold text-gray-900">Confirmation Email Sent</Text>
              <Text className="mt-2 px-2 text-center text-sm leading-6 text-gray-500">
                A confirmation link was sent to{" "}
                <Text className="font-medium text-gray-700">{googleEmail}</Text>. Tap it to
                activate your account, then come back and sign in.
              </Text>
              <Pressable onPress={resetGoogleFlow} className="mt-6">
                <Text className="text-sm font-medium text-primary-dark">Back to sign in</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
