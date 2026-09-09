import { useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { completeGoogleSignup } from "../services/api";
import { tenantTermsIntro, tenantTermsSections, tenantTermsTitle } from "../content/tenantTerms";

// Shown after a brand-new Google email — mirrors RegisterScreen.jsx's fields
// and validation, minus email (already known/verified by Google, shown
// read-only instead of asked again). Also mirrors the web equivalent
// (src/app/pages/GoogleSignupFillUpForm.jsx). Submitting this does not log
// the user in; it creates a pending_user_creations row and sends a
// confirmation email, exactly like an admin-created account.
//
// This renders as a Fragment, not its own ScrollView or View — it's already
// shown inside LoginScreen's ScrollView, as a direct child of its card, so
// (a) nesting a 3rd ScrollView level here (on top of that one and the Terms
// box's own inner one below) doesn't happen -- that's what made the Terms
// box's internal scrolling stop working reliably on Android -- and (b) each
// field's onLayout position comes back relative to that one shared parent,
// which keeps the "scroll to first error" math simple (see
// scrollToFirstError below) instead of needing native-ref measureLayout
// (which broke going through a styled/wrapped View, hard to make reliable).

function Field({ label, hint, error, children, onLayout }) {
  return (
    <View className="mt-4" onLayout={onLayout}>
      <View className="mb-2 flex-row items-baseline">
        <Text className="text-sm font-medium text-gray-700">{label}</Text>
        {hint ? <Text className="ml-2 text-[11px] text-gray-400">{hint}</Text> : null}
      </View>
      {children}
      {error ? <Text className="mt-1.5 text-xs text-red-600">{error}</Text> : null}
    </View>
  );
}

// Order matters here -- it's the order we scroll to on a validation error.
const FIELD_ORDER = ["name", "phone", "address", "password", "confirmPassword", "acceptedTerms"];

const inputClass = "rounded-xl border bg-gray-50 px-4 py-3.5 text-base text-gray-900";

export default function GoogleSignupFillUpForm({
  email,
  name: initialName,
  credential,
  onDone,
  onCancel,
  scrollViewRef,
  cardOffsetRef,
}) {
  // y-offset of each field relative to the card (their shared direct
  // parent in LoginScreen), captured via onLayout, so a validation error
  // can scroll straight to the actual problem field instead of always
  // jumping to the top (misleading when e.g. only the Terms checkbox near
  // the bottom is unchecked). cardOffsetRef adds back the card's own
  // position within the ScrollView to get an absolute scroll target.
  const fieldOffsets = useRef({});
  const registerOffset = (name) => (e) => {
    fieldOffsets.current[name] = e.nativeEvent.layout.y;
  };

  const [form, setForm] = useState({
    name: initialName || "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  function validatePhone(value) {
    const digits = value.replace(/\D/g, "");
    if (!digits) return "Phone number is required.";
    if (digits.length !== 11) return "Phone number must be exactly 11 digits.";
    if (!digits.startsWith("09")) return "Phone number must start with 09 (e.g. 09171234567).";
    return "";
  }

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = "Full name is required.";
    const phoneErr = validatePhone(form.phone);
    if (phoneErr) errs.phone = phoneErr;
    if (!form.address.trim()) errs.address = "Address is required.";
    if (!form.password) errs.password = "Password is required.";
    else if (form.password.length < 6) errs.password = "Password must be at least 6 characters.";
    if (!form.confirmPassword) errs.confirmPassword = "Please confirm your password.";
    else if (form.password !== form.confirmPassword)
      errs.confirmPassword = "Passwords do not match.";
    if (!acceptedTerms)
      errs.acceptedTerms = "You must agree to the Terms and Agreement before creating an account.";
    return errs;
  }

  function handleBlur(field) {
    const errs = validate();
    setErrors((prev) => ({ ...prev, [field]: errs[field] ?? "" }));
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSubmitError("");
  }

  function handlePhoneChange(value) {
    handleChange("phone", value.replace(/[^\d]/g, "").slice(0, 11));
  }

  function scrollToFirstError(errs) {
    const firstInvalidField = FIELD_ORDER.find((field) => errs[field]);
    const fieldOffset = firstInvalidField ? fieldOffsets.current[firstInvalidField] : undefined;
    const target =
      fieldOffset !== undefined ? (cardOffsetRef?.current ?? 0) + fieldOffset : 0;
    // A little padding above the field so it isn't flush against the top edge.
    scrollViewRef?.current?.scrollTo({ y: Math.max(target - 16, 0), animated: true });
  }

  async function handleSubmit() {
    setSubmitError("");
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      scrollToFirstError(errs);
      return;
    }
    setSubmitting(true);
    try {
      await completeGoogleSignup(credential, {
        name: form.name.trim(),
        phone: form.phone,
        address: form.address.trim(),
        password: form.password,
      });
      onDone();
    } catch (e) {
      setSubmitting(false);
      if (e?.code === "google_token_invalid") {
        setSubmitError("Your Google sign-in has expired. Please go back and tap Continue with Google again.");
      } else {
        setSubmitError(e instanceof Error ? e.message : "Unable to create the account.");
      }
      scrollViewRef?.current?.scrollTo({ y: 0, animated: true });
    }
  }

  return (
    <>
      <Pressable
        onPress={onCancel}
        hitSlop={8}
        className="mt-6 flex-row items-center gap-1.5 self-start rounded-full bg-gray-100 px-3.5 py-2"
      >
        <Ionicons name="arrow-back" size={16} color="#0d9488" />
        <Text className="text-sm font-semibold text-primary-dark">Use a different account</Text>
      </Pressable>

      <View className="mt-4 rounded-xl border border-teal-100 bg-teal-50 px-4 py-3">
        <Text className="text-xs text-teal-700">Continuing as</Text>
        <Text className="text-sm font-semibold text-teal-900">{email}</Text>
      </View>

      {submitError ? (
        <View className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <Text className="text-sm leading-5 text-red-700">{submitError}</Text>
        </View>
      ) : null}

      <Field label="Full Name" error={errors.name} onLayout={registerOffset("name")}>
        <TextInput
          className={`${inputClass} ${errors.name ? "border-red-300" : "border-gray-200"}`}
          placeholder="Juan dela Cruz"
          placeholderTextColor="#9ca3af"
          value={form.name}
          onChangeText={(v) => handleChange("name", v)}
          onBlur={() => handleBlur("name")}
          editable={!submitting}
        />
      </Field>

      <Field
        label="Phone Number"
        hint="PH mobile (e.g. 09171234567)"
        error={errors.phone}
        onLayout={registerOffset("phone")}
      >
        <TextInput
          className={`${inputClass} ${errors.phone ? "border-red-300" : "border-gray-200"}`}
          placeholder="09XXXXXXXXX"
          placeholderTextColor="#9ca3af"
          value={form.phone}
          onChangeText={handlePhoneChange}
          onBlur={() => handleBlur("phone")}
          keyboardType="number-pad"
          maxLength={11}
          editable={!submitting}
        />
        <Text className="mt-1 text-right text-[11px] text-gray-400">{form.phone.length}/11</Text>
      </Field>

      <Field label="Address" error={errors.address} onLayout={registerOffset("address")}>
        <TextInput
          className={`${inputClass} min-h-[80px] ${errors.address ? "border-red-300" : "border-gray-200"}`}
          placeholder="Street, Barangay, City, Province"
          placeholderTextColor="#9ca3af"
          value={form.address}
          onChangeText={(v) => handleChange("address", v)}
          onBlur={() => handleBlur("address")}
          multiline
          textAlignVertical="top"
          editable={!submitting}
        />
      </Field>

      <Field label="Password" error={errors.password} onLayout={registerOffset("password")}>
        <View
          className={`flex-row items-center rounded-xl border bg-gray-50 pr-2 ${errors.password ? "border-red-300" : "border-gray-200"}`}
        >
          <TextInput
            className="flex-1 px-4 py-3.5 text-base text-gray-900"
            placeholder="At least 6 characters"
            placeholderTextColor="#9ca3af"
            value={form.password}
            onChangeText={(v) => handleChange("password", v)}
            onBlur={() => handleBlur("password")}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            editable={!submitting}
          />
          <Pressable onPress={() => setShowPassword((s) => !s)} hitSlop={10} className="px-2 py-2">
            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color="#0d9488" />
          </Pressable>
        </View>
      </Field>

      <Field
        label="Confirm Password"
        error={errors.confirmPassword}
        onLayout={registerOffset("confirmPassword")}
      >
        <View
          className={`flex-row items-center rounded-xl border bg-gray-50 pr-2 ${errors.confirmPassword ? "border-red-300" : "border-gray-200"}`}
        >
          <TextInput
            className="flex-1 px-4 py-3.5 text-base text-gray-900"
            placeholder="Re-enter your password"
            placeholderTextColor="#9ca3af"
            value={form.confirmPassword}
            onChangeText={(v) => handleChange("confirmPassword", v)}
            onBlur={() => handleBlur("confirmPassword")}
            secureTextEntry={!showConfirm}
            autoCapitalize="none"
            editable={!submitting}
          />
          <Pressable onPress={() => setShowConfirm((s) => !s)} hitSlop={10} className="px-2 py-2">
            <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={18} color="#0d9488" />
          </Pressable>
        </View>
      </Field>

      {/* Terms and Agreement — same policies shown on RegisterScreen and web. */}
      <View
        className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white"
        onLayout={registerOffset("acceptedTerms")}
      >
        <View className="flex-row items-start gap-3 border-b border-gray-200 bg-primary-surface px-4 py-4">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-teal-100">
            <Ionicons name="document-text-outline" size={20} color="#0f766e" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-gray-900">Terms and Agreement</Text>
            <Text className="mt-1 text-xs leading-5 text-gray-500">
              Please read and accept the rules below before creating your account.
            </Text>
          </View>
        </View>

        <View className="px-4 py-4">
          <View className="h-64 rounded-xl border border-gray-200 bg-gray-50">
            <ScrollView
              className="px-4 pt-4"
              contentContainerStyle={{ paddingBottom: 24 }}
              nestedScrollEnabled
              showsVerticalScrollIndicator
            >
              <View className="items-center border-b border-dashed border-gray-300 pb-4">
                {tenantTermsIntro.map((line, index) => (
                  <Text
                    key={line}
                    className={`text-center leading-6 text-gray-700 ${index === 0 ? "font-semibold" : ""}`}
                  >
                    {line}
                  </Text>
                ))}
                <Text className="mt-4 text-center text-sm font-bold text-gray-900">{tenantTermsTitle}</Text>
              </View>

              {tenantTermsSections.map((section) => (
                <View key={section.number} className="mt-4">
                  <Text className="text-sm leading-6 text-gray-700">
                    <Text className="font-semibold text-gray-900">{section.number} </Text>
                    {section.text}
                  </Text>
                  {section.bullets
                    ? section.bullets.map((bullet) => (
                        <View key={bullet} className="mt-2 flex-row pl-4">
                          <Text className="mr-2 text-gray-500">{"•"}</Text>
                          <Text className="flex-1 text-sm leading-6 text-gray-700">{bullet}</Text>
                        </View>
                      ))
                    : null}
                </View>
              ))}
            </ScrollView>
          </View>

          <Pressable
            onPress={() => {
              setAcceptedTerms((v) => !v);
              setSubmitError("");
              setErrors((prev) => ({ ...prev, acceptedTerms: "" }));
            }}
            disabled={submitting}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: acceptedTerms }}
            className="mt-4 flex-row items-start"
          >
            <View
              className={`mt-0.5 h-5 w-5 items-center justify-center rounded border ${
                acceptedTerms ? "border-primary bg-primary" : "border-gray-300 bg-white"
              }`}
            >
              {acceptedTerms ? <Ionicons name="checkmark" size={14} color="#ffffff" /> : null}
            </View>
            <Text className="ml-3 flex-1 text-sm leading-6 text-gray-700">
              I have read and agree to the Terms and Agreement, including all policies, rules,
              and regulations for tenants to comply.
            </Text>
          </Pressable>

          {errors.acceptedTerms ? (
            <View className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
              <Text className="text-xs leading-5 text-red-700">{errors.acceptedTerms}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <Pressable
        onPress={handleSubmit}
        disabled={submitting}
        className={`mt-6 mb-6 flex-row items-center justify-center rounded-xl py-4 ${
          submitting ? "bg-primary/60" : "bg-primary"
        }`}
      >
        {submitting ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <>
            <Ionicons name="person-add-outline" size={18} color="#ffffff" />
            <Text className="ml-2 text-base font-semibold text-white">Create Account</Text>
          </>
        )}
      </Pressable>
    </>
  );
}
