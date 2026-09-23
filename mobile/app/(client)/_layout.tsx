import { Tabs } from 'expo-router';
import { Home, Package, User } from 'lucide-react-native';
import RoleGuard from '@/components/auth/RoleGuard';

/**
 * Client area (W5 §5.2). The `(client)` group strips its segment from URLs
 * (`/requests/*`, `/profile`). Note `(driver)` and `(client)` both strip to
 * `/profile`, so cross-group jumps use the explicit `/(driver)`/`/(client)`
 * prefix. Detail screens are pushed, not tabs.
 */
export default function ClientLayout() {
  return (
    <RoleGuard role="client">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#4B2861',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 0,
            elevation: 0,
            height: 60,
            paddingBottom: 8,
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
          name="requests/index"
          options={{
            title: 'Demandes',
            tabBarIcon: ({ color }) => <Package size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color }) => <User size={22} color={color} />,
          }}
        />
        <Tabs.Screen name="requests/[id]" options={{ href: null }} />
        <Tabs.Screen name="requests/offers/[id]" options={{ href: null }} />
      </Tabs>
    </RoleGuard>
  );
}