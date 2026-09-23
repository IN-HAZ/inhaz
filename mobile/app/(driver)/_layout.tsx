import { Tabs } from 'expo-router';
import { Home, Store, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RoleGuard from '@/components/auth/RoleGuard';

/**
 * Driver area (W5 §5.2). Route group `(driver)` strips its segment from
 * URLs, so screens are always pushed with the explicit `/(driver)` prefix
 * (e.g. `/(driver)/profile`); the bare `/` path is the RoleGuard home.
 */
export default function DriverLayout() {
  // Edge-to-edge (Android 15+): the tab bar must extend over the system
  // navigation-bar inset, or the system bar overlaps the app's nav bar.
  const insets = useSafeAreaInsets();
  return (
    <RoleGuard role="driver">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#4B2861',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 0,
            elevation: 0,
            height: 60 + insets.bottom,
            paddingBottom: 8 + insets.bottom,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            fontFamily: 'Inter_600SemiBold',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Accueil',
            tabBarIcon: ({ color }) => <Home size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="marketplace/index"
          options={{
            title: 'Marketplace',
            tabBarIcon: ({ color }) => <Store size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color }) => <User size={22} color={color} />,
          }}
        />
        <Tabs.Screen name="marketplace/[id]" options={{ href: null }} />
        <Tabs.Screen name="documents/index" options={{ href: null }} />
        <Tabs.Screen name="documents/upload" options={{ href: null }} />
        <Tabs.Screen name="dashboard" options={{ href: null }} />
      </Tabs>
    </RoleGuard>
  );
}