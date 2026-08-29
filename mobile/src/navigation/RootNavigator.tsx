import { ActivityIndicator, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuth } from "../context/AuthContext";
import LoginScreen from "../screens/LoginScreen";
import PlaceholderScreen from "../screens/PlaceholderScreen";
import VendorHomeScreen from "../screens/vendor/HomeScreen";
import VendorApplicationsScreen from "../screens/vendor/ApplicationsScreen";
import VendorNoticesScreen from "../screens/vendor/NoticesScreen";
import VendorMapScreen from "../screens/vendor/MapScreen";

const Tab = createBottomTabNavigator();

// Tab bar styling shared by both roles, so vendor and officer look consistent
// with each other and with the web app's teal accent.
const tabScreenOptions = {
  headerShown: false,
  tabBarActiveTintColor: "#14B8A6",
  tabBarInactiveTintColor: "#9ca3af",
  tabBarStyle: { borderTopColor: "#e5e7eb" },
  tabBarLabelStyle: { fontSize: 11, fontWeight: "600" as const },
};

// Each tab needs an explicit icon; without one the tab bar renders an empty box.
function tabIcon(name: keyof typeof Ionicons.glyphMap) {
  return ({ color, size }: { color: string; size: number }) => (
    <Ionicons name={name} color={color} size={size} />
  );
}

// Vendor tabs mirror the web vendor dashboard: home / applications / notices / map
function VendorTabs() {
  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen name="Home" component={VendorHomeScreen} options={{ tabBarIcon: tabIcon("home-outline") }} />
      <Tab.Screen name="Applications" component={VendorApplicationsScreen} options={{ tabBarIcon: tabIcon("document-text-outline") }} />
      <Tab.Screen name="Notices" component={VendorNoticesScreen} options={{ tabBarIcon: tabIcon("megaphone-outline") }} />
      <Tab.Screen name="Map" component={VendorMapScreen} options={{ tabBarIcon: tabIcon("map-outline") }} />
    </Tab.Navigator>
  );
}

// Officer tabs mirror the web officer dashboard: violations / checks / log / receipts
function OfficerTabs() {
  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen name="Violations" options={{ tabBarIcon: tabIcon("warning-outline") }}>
        {() => <PlaceholderScreen title="Violations" note="Violation reporting — built in Phase 4." />}
      </Tab.Screen>
      <Tab.Screen name="Checks" options={{ tabBarIcon: tabIcon("checkmark-circle-outline") }}>
        {() => <PlaceholderScreen title="Check Requests" note="Inspection requests — built in Phase 4." />}
      </Tab.Screen>
      <Tab.Screen name="Map" options={{ tabBarIcon: tabIcon("map-outline") }}>
        {() => <PlaceholderScreen title="Stall Map" note="Inspection map — built in Phase 4." />}
      </Tab.Screen>
      <Tab.Screen name="Receipts" options={{ tabBarIcon: tabIcon("receipt-outline") }}>
        {() => <PlaceholderScreen title="Receipts" note="Payment receipts — built in Phase 4." />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { user, loading } = useAuth();

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
      {!user ? <LoginScreen /> : user.role === "officer" ? <OfficerTabs /> : <VendorTabs />}
    </NavigationContainer>
  );
}
