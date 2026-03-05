import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../../i18n';
import { useSocketConnection, useListSocket } from '../../hooks/useSocket';
import { useGroupStore } from '../../stores/groupStore';

export default function TabsLayout() {
  const { t } = useTranslation();
  const currentGroup = useGroupStore((s) => s.currentGroup);
  useSocketConnection();
  useListSocket(currentGroup?.id); // Stay in group room when group selected (any tab)
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#111827', borderTopColor: '#1f2937' },
        tabBarActiveTintColor: '#60a5fa',
        tabBarInactiveTintColor: '#6b7280',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabChannels'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: t('tabGroups'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="folder-open" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="channel/[channelId]"
        options={{
          href: null,
          title: t('tabGroups'),
        }}
      />
      <Tabs.Screen
        name="articles"
        options={{
          title: t('articles'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pricetag" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="list"
        options={{
          title: 'List',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabSettings'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
