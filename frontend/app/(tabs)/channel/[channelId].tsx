import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useChannelStore } from '../../../stores/channelStore';
import * as channelsService from '../../../services/channels.service';

export default function ChannelRedirectScreen() {
  const { channelId } = useLocalSearchParams<{ channelId: string }>();
  const { channels, setChannels, setCurrentChannel } = useChannelStore();

  useEffect(() => {
    if (!channelId) return;
    const channel = channels.find((c) => c.id === channelId);
    if (channel) {
      setCurrentChannel(channel);
      router.replace('/(tabs)/groups');
    } else {
      channelsService.getChannels().then((data) => {
        setChannels(data);
        const ch = data.find((c) => c.id === channelId);
        if (ch) {
          setCurrentChannel(ch);
          router.replace('/(tabs)/groups');
        }
      });
    }
  }, [channelId, channels]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#60a5fa" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#9ca3af' },
});
