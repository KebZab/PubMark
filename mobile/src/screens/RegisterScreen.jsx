import { useRef, useState } from "react";
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
import { useAuth } from "../context/AuthContext";
import { tenantTermsIntro, tenantTermsSections, tenantTermsTitle } from "../content/tenantTerms";

// Mirrors the web Register page (src/app/pages/Register.jsx): the same fields,
// the same validation rules, and the same tenant policies that must be
// accepted before an account is created. Only vendors register here — officers
// and admins are created by an admin.

function Field({ label, hint, error, children, innerRef }) {
  return (
    <View className="mt-4" ref={innerRef} collapsable={false}>
      <View className="mb-2 flex-row items-baseline">
        <Text className="text-sm font-medium text-gray-700">{label}</Text>
        {hint ? <Text className="ml-2 text-[11px] text-gray-400">{hint}</Text> : null}
      </View>
      {children}
      {error ? <Text className="mt-1.5 text-xs text-red-600">{error}</Text> : null}
    </View>
  );
}

const inputClass = "rounded-xl border bg-gray-50 px-4 py-3.5 text-base text-gray-900";

export default function RegisterScreen({ navigation }) {
  const { signUp } = useAuth();
  const scrollRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
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

  // Same rule as the web form: 11 digits, starting 09.
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
    if (!form.email.trim()) errs.email = "Email address is required.";
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

  // Digits only, capped at 11, so the field cannot hold an invalid number.
  function handlePhoneChange(value) {
    handleChange("phone", value.replace(/[^\d]/g, "").slice(0, 11));
  }

  const handleSubmit = async () => {
    setSubmitError("");
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      // There is no focus-scrolling on a phone the way there is on the web, so
      // send the user to the top where the first error will be visible.
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    setSubmitting(true);
    try {
      // signUp stores the session, so the navigator swaps to the vendor tabs
      // on its own — no navigation call needed here.
      await signUp({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone,
        address: form.address.trim(),
      });
    } catch (e) {
      setSubmitting(false);
      const message = e instanceof Error ? e.message : "Unable to create the account.";
      setSubmitError(message);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style="light" />
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="bg-primary-dark px-6 pb-8 pt-14">
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={12}
            className="mb-4 flex-row items-center"
          >
            <Ionicons name="chevron-back" size={18} color="#99f6e4" />
            <Text className="ml-1 text-sm font-medium text-primary-light">Back to sign in</Text>
          </Pressable>
          <Text className="text-2xl font-bold text-white">Create your account</Text>
          <Text className="mt-1 text-sm text-primary-light">
            Register as a vendor to apply for a market stall
          </Text>
        </View>

        <View className="px-6 pt-6">
          {submitError ? (
            <View className="mb-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <Text className="text-sm leading-5 text-red-700">{submitError}</Text>
            </View>
          ) : null}

          <Field label="Full Name" error={errors.name}>
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

          <Field label="Email Address" error={errors.email}>
            <TextInput
              className={`${inputClass} ${errors.email ? "border-red-300" : "border-gray-200"}`}
              placeholder="you@example.com"
              placeholderTextColor="#9ca3af"
              value={form.email}
              onChangeText={(v) => handleChange("email", v)}
              onBlur={() => handleBlur("email")}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              editable={!submitting}
            />
          </Field>

          <Field
            label="Phone Number"
            hint="PH mobile (e.g. 09171234567)"
            error={errors.phone}
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

          <Field label="Address" error={errors.address}>
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

          <Field label="Password" error={errors.password}>
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
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="#0d9488"
                />
              </Pressable>
            </View>
          </Field>

          <Field label="Confirm Password" error={errors.confirmPassword}>
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
                <Ionicons
                  name={showConfirm ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="#0d9488"
                />
              </Pressable>
            </View>
          </Field>

          {/* Terms and Agreement — the same policies shown on the web form. */}
          <View className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white">
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
              {/* Its own scroll area, as on the web, so the page stays manageable. */}
              <View className="h-64 rounded-xl border border-gray-200 bg-gray-50">
                <ScrollView
                  className="px-4 py-4"
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
                    <Text className="mt-4 text-center text-sm font-bold text-gray-900">
                      {tenantTermsTitle}
                    </Text>
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

              {/* React Native has no checkbox, so this is a tap target that
                  behaves like one — including the label, as on the web. */}
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
            className={`mt-6 flex-row items-center justify-center rounded-xl py-4 ${
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

          <Pressable onPress={() => navigation.goBack()} disabled={submitting} className="mt-5">
            <Text className="text-center text-sm text-gray-500">
              Already have an account? <Text className="font-semibold text-primary-dark">Sign in</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
