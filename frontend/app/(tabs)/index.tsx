import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useChannelStore } from '../../stores/channelStore';
import { useAuthStore } from '../../stores/authStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import * as channelsService from '../../services/channels.service';
import type { ChannelMember } from '../../services/channels.service';
import { clearToken } from '../../hooks/useAuth';
import { useTranslation } from '../../i18n';

export default function ChannelsScreen() {
  const { t, tWithParams } = useTranslation();
  const token = useAuthStore((s) => s.token);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const {
    channels,
    currentChannel,
    setChannels,
    setCurrentChannel,
    addChannel,
    removeChannel,
    updateChannel,
  } = useChannelStore();
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [joinModal, setJoinModal] = useState(false);
  const [editModal, setEditModal] = useState<{ id: string; name: string } | null>(null);
  const [createName, setCreateName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [editName, setEditName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [membersModal, setMembersModal] = useState<{ id: string; name: string } | null>(null);
  const [inviteModal, setInviteModal] = useState<{ id: string; name: string } | null>(null);
  const [members, setMembers] = useState<ChannelMember[]>([]);
  const [inviteEmailOrUsername, setInviteEmailOrUsername] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  async function fetchChannels(silent = false) {
    if (!token) return;
    if (!silent) setLoading(true);
    try {
      const data = await channelsService.getChannels();
      setChannels(data);
      if (data.length === 1 && !currentChannel) {
        setCurrentChannel(data[0]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('failed');
      if (msg.toLowerCase().includes('unauthorized')) {
        await clearToken();
        logout();
        router.replace('/(auth)/login');
        return;
      }
      if (!silent) setError(msg);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      router.replace('/(auth)/login');
      return;
    }
    fetchChannels();
  }, [token, isAuthenticated]);

  async function handleCreate() {
    setError('');
    if (!createName.trim()) return;
    setSubmitting(true);
    try {
      const channel = await channelsService.createChannel(createName.trim());
      addChannel(channel);
      setCreateModal(false);
      setCreateName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failed'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleJoin() {
    setError('');
    if (!joinCode.trim() || joinCode.length !== 6) {
      setError(t('errorInviteCodeLength'));
      return;
    }
    setSubmitting(true);
    try {
      const channel = await channelsService.joinChannel(joinCode.trim());
      addChannel(channel);
      setJoinModal(false);
      setJoinCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failed'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteChannel(channelId: string, channelName: string) {
    Alert.alert(
      t('deleteChannel'),
      tWithParams('deleteChannelConfirm', { name: channelName }),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await channelsService.deleteChannel(channelId);
              removeChannel(channelId);
            } catch (err) {
              Alert.alert(t('error'), err instanceof Error ? err.message : t('failed'));
            }
          },
        },
      ]
    );
  }

  async function handleLeave(channelId: string, channelName: string) {
    Alert.alert(
      t('leaveChannel'),
      tWithParams('leaveChannelConfirm', { name: channelName }),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('leave'),
          style: 'destructive',
          onPress: async () => {
            try {
              await channelsService.leaveChannel(channelId);
              removeChannel(channelId);
            } catch (err) {
              Alert.alert(t('error'), err instanceof Error ? err.message : t('failed'));
            }
          },
        },
      ]
    );
  }

  function openEdit(channel: { id: string; name: string }) {
    setEditModal(channel);
    setEditName(channel.name);
    setError('');
  }

  async function handleUpdate() {
    if (!editModal || !editName.trim()) return;
    setSubmitting(true);
    try {
      const channel = await channelsService.updateChannel(
        editModal.id,
        editName.trim()
      );
      updateChannel(editModal.id, channel);
      setEditModal(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failed'));
    } finally {
      setSubmitting(false);
    }
  }

  function handleChannelPress(channel: { id: string; name: string }) {
    setCurrentChannel(channel);
    router.push('/(tabs)/groups');
  }

  async function handleCopyInviteCode(inviteCode: string) {
    await Clipboard.setStringAsync(inviteCode);
    Alert.alert(t('copied'), t('inviteCodeCopied'));
  }

  async function openMembersModal(channel: { id: string; name: string }) {
    setMembersModal(channel);
    setError('');
    try {
      const data = await channelsService.getChannelMembers(channel.id);
      setMembers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failed'));
    }
  }

  function openInviteModal(channel: { id: string; name: string }) {
    setInviteModal(channel);
    setInviteEmailOrUsername('');
    setError('');
  }

  async function handleInvite() {
    if (!inviteModal || !inviteEmailOrUsername.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await channelsService.inviteToChannel(inviteModal.id, inviteEmailOrUsername.trim());
      setInviteModal(null);
      setInviteEmailOrUsername('');
      fetchChannels(true);
      Alert.alert(t('success'), t('userInvited'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failed'));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#60a5fa" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('myChannels')}</Text>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => {
              setCreateModal(true);
              setError('');
              setCreateName('');
            }}
          >
            <Ionicons name="add-circle" size={28} color="#60a5fa" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => {
              setJoinModal(true);
              setError('');
              setJoinCode('');
            }}
          >
            <Ionicons name="person-add" size={26} color="#60a5fa" />
          </TouchableOpacity>
        </View>
      </View>

      {channels.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="people-outline" size={64} color="#4b5563" />
          <Text style={styles.emptyText}>{t('noChannels')}</Text>
          <Text style={styles.emptySub}>{t('noChannelsSub')}</Text>
        </View>
      ) : (
        <FlatList
          data={channels}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await fetchChannels(true);
                setRefreshing(false);
              }}
              tintColor="#60a5fa"
            />
          }
          renderItem={({ item }) => {
            const isCreator = user?.id && item.createdById === user.id;
            return (
              <View
                style={[
                  styles.card,
                  currentChannel?.id === item.id && styles.cardSelected,
                ]}
              >
                <TouchableOpacity
                  style={styles.cardPressable}
                  onPress={() => handleChannelPress(item)}
                  onLongPress={() => isCreator && openEdit(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardContent}>
                    <Text style={styles.cardName}>{item.name}</Text>
                    <View style={styles.cardMetaRow}>
                      <Text style={styles.cardMeta}>
                        {item.memberCount ?? 0} {t('members')} · {item.inviteCode}
                      </Text>
                      <TouchableOpacity
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        onPress={() => handleCopyInviteCode(item.inviteCode)}
                      >
                        <Ionicons name="copy-outline" size={18} color="#60a5fa" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPress={() => openMembersModal(item)}
                  >
                    <Ionicons name="people-outline" size={22} color="#60a5fa" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPress={() => openInviteModal(item)}
                  >
                    <Ionicons name="person-add-outline" size={22} color="#60a5fa" />
                  </TouchableOpacity>
                  {isCreator && (
                    <TouchableOpacity
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      onPress={() => handleDeleteChannel(item.id, item.name)}
                    >
                      <Ionicons name="trash-outline" size={22} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPress={() => handleLeave(item.id, item.name)}
                  >
                    <Ionicons name="exit-outline" size={22} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Create Modal */}
      <Modal visible={createModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t('createChannel')}</Text>
            <Input
              label={t('channelName')}
              placeholder={t('channelNamePlaceholder')}
              value={createName}
              onChangeText={setCreateName}
            />
            {error ? <Text style={styles.modalError}>{error}</Text> : null}
            <View style={styles.modalActions}>
              <Button
                title={t('cancel')}
                variant="secondary"
                onPress={() => setCreateModal(false)}
                style={styles.modalBtn}
              />
              <Button
                title={t('create')}
                onPress={handleCreate}
                loading={submitting}
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Join Modal */}
      <Modal visible={joinModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t('joinChannel')}</Text>
            <Input
              label={t('inviteCode')}
              placeholder={t('inviteCodePlaceholder')}
              value={joinCode}
              onChangeText={(t) => setJoinCode(t.toUpperCase().slice(0, 6))}
              maxLength={6}
              autoCapitalize="characters"
            />
            {error ? <Text style={styles.modalError}>{error}</Text> : null}
            <View style={styles.modalActions}>
              <Button
                title={t('cancel')}
                variant="secondary"
                onPress={() => setJoinModal(false)}
                style={styles.modalBtn}
              />
              <Button
                title={t('join')}
                onPress={handleJoin}
                loading={submitting}
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Members Modal */}
      <Modal visible={!!membersModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, styles.modalTall]}>
            <Text style={styles.modalTitle}>
              {membersModal ? t('channelMembers') + ': ' + membersModal.name : ''}
            </Text>
            {error ? <Text style={styles.modalError}>{error}</Text> : null}
            <FlatList
              data={members}
              keyExtractor={(m) => m.id}
              style={styles.membersList}
              renderItem={({ item }) => (
                <View style={styles.memberRow}>
                  <View>
                    <Text style={styles.memberName}>{item.name}</Text>
                    <Text style={styles.memberMeta}>
                      {item.username ? `@${item.username}` : item.email} · {item.role}
                    </Text>
                  </View>
                </View>
              )}
            />
            <Button
              title={t('close')}
              variant="secondary"
              onPress={() => setMembersModal(null)}
              style={styles.modalBtn}
            />
          </View>
        </View>
      </Modal>

      {/* Invite Modal */}
      <Modal visible={!!inviteModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              {inviteModal ? t('inviteToChannel') + ': ' + inviteModal.name : ''}
            </Text>
            <Input
              label={t('emailOrUsername')}
              placeholder={t('emailOrUsernamePlaceholder')}
              value={inviteEmailOrUsername}
              onChangeText={setInviteEmailOrUsername}
              autoCapitalize="none"
            />
            {error ? <Text style={styles.modalError}>{error}</Text> : null}
            <View style={styles.modalActions}>
              <Button
                title={t('cancel')}
                variant="secondary"
                onPress={() => setInviteModal(null)}
                style={styles.modalBtn}
              />
              <Button
                title={t('invite')}
                onPress={handleInvite}
                loading={submitting}
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={!!editModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t('editChannel')}</Text>
            <Input
              label={t('channelName')}
              value={editName}
              onChangeText={setEditName}
            />
            {error ? <Text style={styles.modalError}>{error}</Text> : null}
            <View style={styles.modalActions}>
              <Button
                title={t('cancel')}
                variant="secondary"
                onPress={() => setEditModal(null)}
                style={styles.modalBtn}
              />
              <Button
                title={t('save')}
                onPress={handleUpdate}
                loading={submitting}
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#f9fafb' },
  actions: { flexDirection: 'row', gap: 12 },
  iconBtn: { padding: 4 },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: { fontSize: 18, color: '#9ca3af', marginTop: 16 },
  emptySub: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  list: { padding: 16, paddingBottom: 32 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardSelected: { borderWidth: 2, borderColor: '#60a5fa' },
  cardPressable: { flex: 1 },
  cardContent: { flex: 1 },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  cardActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  cardName: { fontSize: 16, fontWeight: '600', color: '#f9fafb' },
  cardMeta: { fontSize: 13, color: '#9ca3af', marginTop: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#1f2937',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#f9fafb', marginBottom: 20 },
  modalTall: { maxHeight: '80%' },
  membersList: { maxHeight: 300, marginBottom: 16 },
  memberRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#374151' },
  memberName: { fontSize: 16, fontWeight: '600', color: '#f9fafb' },
  memberMeta: { fontSize: 13, color: '#9ca3af', marginTop: 2 },
  modalError: { fontSize: 14, color: '#ef4444', marginBottom: 12 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1 },
});
