import { useEffect, useRef } from "react";
import { ActivityIndicator, View } from "react-native";
import GuestMapScreen from "../screens/GuestMapScreen";
import { Ionicons } from "@expo/vector-icons";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import VendorHomeScreen from "../screens/vendor/HomeScreen";
import VendorApplicationsScreen from "../screens/vendor/ApplicationsScreen";
import VendorNoticesScreen from "../screens/vendor/NoticesScreen";
import VendorMapScreen from "../screens/vendor/MapScreen";
import ApplicationFormScreen from "../screens/vendor/ApplicationFormScreen";
import ApplicationDetailScreen from "../screens/vendor/ApplicationDetailScreen";
import VendorTransfersScreen from "../screens/vendor/TransfersScreen";

import OfficerViolationsScreen from "../screens/officer/ViolationsScreen";
import OfficerChecksScreen from "../screens/officer/ChecksScreen";
import OfficerMapScreen from "../screens/officer/OfficerMapScreen";
import OfficerReceiptsScreen from "../screens/officer/ReceiptsScreen";
import OfficerNoticesScreen from "../screens/officer/NoticesScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Screens reachable from anywhere in the vendor area. Declared once so both
// the type and the navigator agree on what can be pushed.

// Tab bar styling shared by both roles, so vendor and officer look consistent
// with each other and with the web app's teal accent.
const tabScreenOptions = {
  headerShown: false,
  tabBarActiveTintColor: "#14B8A6",
  tabBarInactiveTintColor: "#9ca3af",
  tabBarStyle: { borderTopColor: "#e5e7eb" },
  tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
};

// The web app gives officers an amber accent rather than the vendor teal, so
// the two roles stay visually distinct here too.
const officerTabScreenOptions = {
  ...tabScreenOptions,
  tabBarActiveTintColor: "#f59e0b",
};

// Each tab needs an explicit icon; without one the tab bar renders an empty box.
function tabIcon(name) {
  return ({ color, size }) => <Ionicons name={name} color={color} size={size} />;
}

// Vendor tabs mirror the web vendor dashboard: home / applications / notices / map
function VendorTabs() {
  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen
        name="Home"
        component={VendorHomeScreen}
        options={{ tabBarIcon: tabIcon("home-outline") }}
      />
      <Tab.Screen
        name="Applications"
        component={VendorApplicationsScreen}
        options={{ tabBarIcon: tabIcon("document-text-outline") }}
      />
      <Tab.Screen
        name="Transfers"
        component={VendorTransfersScreen}
        options={{ tabBarIcon: tabIcon("swap-horizontal-outline") }}
      />
      <Tab.Screen
        name="Notices"
        component={VendorNoticesScreen}
        options={{ tabBarIcon: tabIcon("megaphone-outline") }}
      />
      <Tab.Screen name="Map" component={VendorMapScreen} options={{ tabBarIcon: tabIcon("map-outline") }} />
    </Tab.Navigator>
  );
}

// The tabs sit inside a stack so screens like the application form can be
// pushed over them with a back button, instead of becoming another tab.
function VendorEntry({ navigation, pendingApplication }) {
  useEffect(() => {
    const stalls = pendingApplication.current;
    if (!stalls?.length) return;
    pendingApplication.current = null;
    navigation.navigate("ApplyForStall", { stalls });
  }, [navigation, pendingApplication]);
  return <VendorTabs />;
}

function VendorNavigator({ pendingApplication }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs">
        {(props) => <VendorEntry {...props} pendingApplication={pendingApplication} />}
      </Stack.Screen>
      <Stack.Screen
        name="ApplicationDetail"
        component={ApplicationDetailScreen}
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="ApplyForStall"
        component={ApplicationFormScreen}
        options={{ presentation: "card", animation: "slide_from_right" }}
      />
    </Stack.Navigator>
  );
}

// Officer tabs mirror the web officer dashboard: violations / checks / map / receipts / notices
function OfficerTabs() {
  return (
    <Tab.Navigator screenOptions={officerTabScreenOptions}>
      <Tab.Screen
        name="Violations"
        component={OfficerViolationsScreen}
        options={{ tabBarIcon: tabIcon("warning-outline") }}
      />
      <Tab.Screen
        name="Checks"
        component={OfficerChecksScreen}
        options={{ tabBarIcon: tabIcon("checkmark-circle-outline") }}
      />
      <Tab.Screen name="Map" component={OfficerMapScreen} options={{ tabBarIcon: tabIcon("map-outline") }} />
      <Tab.Screen
        name="Receipts"
        component={OfficerReceiptsScreen}
        options={{ tabBarIcon: tabIcon("receipt-outline") }}
      />
      <Tab.Screen
        name="Notices"
        component={OfficerNoticesScreen}
        options={{ tabBarIcon: tabIcon("megaphone-outline") }}
      />
    </Tab.Navigator>
  );
}

// Signed-out flow. A stack rather than a bare screen so vendors can reach
// registration and come back. On success the session appears and RootNavigator
// swaps this whole stack out for the role's tabs.
function AuthNavigator({ pendingApplication }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="GuestMap">
        {(props) => <GuestMapScreen {...props} pendingApplication={pendingApplication} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { user, loading } = useAuth();
  const pendingApplication = useRef(null);
  useEffect(() => {
    if (user && user.role !== "vendor") pendingApplication.current = null;
  }, [user]);

  // Restoring a saved session — avoid flashing the login screen at someone
  // who is already signed in.
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#14B8A6" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user ? <AuthNavigator pendingApplication={pendingApplication} /> : user.role === "officer" ? <OfficerTabs /> : <VendorNavigator pendingApplication={pendingApplication} />}
    </NavigationContainer>
  );
}
