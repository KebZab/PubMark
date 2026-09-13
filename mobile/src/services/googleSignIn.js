import { isRunningInExpoGo } from "expo";

export const nativeGoogleSignInAvailable = !isRunningInExpoGo();

function nativeModule() {
  if (!nativeGoogleSignInAvailable) return null;
  return require("@react-native-google-signin/google-signin");
}

export function configureGoogleSignIn(options) {
  nativeModule()?.GoogleSignin.configure(options);
}

export async function signOutGoogle() {
  return nativeModule()?.GoogleSignin.signOut();
}

export async function startGoogleSignIn() {
  const module = nativeModule();
  if (!module) throw new Error("Google Sign-In requires the PubMark development app.");
  await module.GoogleSignin.hasPlayServices();
  return module.GoogleSignin.signIn();
}

export function isGoogleSuccess(response) {
  return nativeModule()?.isSuccessResponse(response) ?? false;
}

export function isGoogleSignInInProgress(error) {
  const module = nativeModule();
  return Boolean(module?.isErrorWithCode(error) && error.code === module.statusCodes.IN_PROGRESS);
}
