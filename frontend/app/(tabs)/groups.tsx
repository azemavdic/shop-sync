import { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useChannelStore } from '../../stores/channelStore';
import { useGroupStore } from '../../stores/groupStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import * as groupsService from '../../services/groups.service';
import { useTranslation } from '../../i18n';

export default function GroupsTabScreen() {
  const { t, tWithParams } = useTranslation();
  const { currentChannel, channels, setCurrentChannel } = useChannelStore();
  const {
    groups,
    setGroups,
    setCurrentGroup,
    addGroup,
    removeGroup,
    updateGroup,
  } = useGroupStore();
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState<{ id: string; name: string } | null>(null);
  const [createName, setCreateName] = useState('');
  const [editName, setEditName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const channelId = currentChannel?.id;

  useEffect(() => {
    if (channels.length === 1 && !currentChannel) {
      setCurrentChannel(channels[0]);
    }
  }, [channels, currentChannel]);

  async function fetchGroups() {
    if (!channelId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await groupsService.getGroups(channelId);
      setGroups(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failed'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchGroups();
  }, [channelId]);

  useFocusEffect(
    useCallback(() => {
      if (channelId) fetchGroups();
    }, [channelId])
  );

  async function handleCreate() {
    setError('');
    if (!channelId || !createName.trim()) return;
    setSubmitting(true);
    try {
      const group = await groupsService.createGroup(channelId, createName.trim());
      addGroup(group);
      setCreateModal(false);
      setCreateName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failed'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLeave(groupId: string, groupName: string) {
    const { Alert } = await import('react-native');
    Alert.alert(
      t('leaveGroup'),
      tWithParams('leaveGroupConfirm', { name: groupName }),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('leave'),
          style: 'destructive',
          onPress: async () => {
            try {
              await groupsService.leaveGroup(groupId);
              removeGroup(groupId);
            } catch (err) {
              Alert.alert(t('error'), err instanceof Error ? err.message : t('failed'));
            }
          },
        },
      ]
    );
  }

  function openEdit(group: { id: string; name: string }) {
    setEditModal(group);
    setEditName(group.name);
    setError('');
  }

  async function handleUpdate() {
    if (!editModal || !editName.trim()) return;
    setSubmitting(true);
    try {
      const group = await groupsService.updateGroup(editModal.id, editName.trim());
      updateGroup(editModal.id, group);
      setEditModal(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failed'));
    } finally {
      setSubmitting(false);
    }
  }

  function handleGroupPress(group: {
    id: string;
    name: string;
    inviteCode: string;
    channelId?: string;
  }) {
    setCurrentGroup({
      id: group.id,
      name: group.name,
      inviteCode: group.inviteCode,
      channelId: group.channelId,
    });
    router.push('/(tabs)/list');
  }

  if (!channelId) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.selectChannel}>
          <Ionicons name="people-outline" size={64} color="#4b5563" />
          <Text style={styles.selectChannelText}>
            {channels.length === 0
              ? t('noChannelsSub')
              : t('selectChannelFirst')}
          </Text>
          <Text style={styles.selectChannelSub}>
            {channels.length === 0
              ? t('noChannels')
              : t('selectChannelFromChannelsTab')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{currentChannel?.name}</Text>
        <Text style={styles.subtitle}>{t('myGroups')}</Text>
      </View>
      <View style={styles.headerActions}>
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
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#60a5fa" />
        </View>
      ) : groups.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="people-outline" size={64} color="#4b5563" />
          <Text style={styles.emptyText}>{t('noGroups')}</Text>
          <Text style={styles.emptySub}>{t('noGroupsSub')}</Text>
        </View>
      ) : (
        <FlatList
          data={[...groups].sort((a, b) => {
            const aDone = (a.itemCount ?? 0) > 0 && (a.checkedItemCount ?? 0) >= (a.itemCount ?? 0);
            const bDone = (b.itemCount ?? 0) > 0 && (b.checkedItemCount ?? 0) >= (b.itemCount ?? 0);
            return aDone === bDone ? 0 : aDone ? 1 : -1;
          })}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.card,
                (item.itemCount ?? 0) > 0 && (item.checkedItemCount ?? 0) >= (item.itemCount ?? 0)
                  ? styles.cardFinished
                  : styles.cardInProgress,
              ]}
              onPress={() => handleGroupPress(item)}
              onLongPress={() => openEdit(item)}
              activeOpacity={0.7}
            >
              <View style={styles.cardContent}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardMeta}>
                  {item.checkedItemCount ?? 0}/{item.itemCount ?? 0}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#6b7280" />
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={createModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t('createGroup')}</Text>
            <Input
              label={t('groupName')}
              placeholder={t('groupNamePlaceholder')}
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

      <Modal visible={!!editModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t('editGroup')}</Text>
            <Input
              label={t('groupName')}
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
  selectChannel: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  selectChannelText: { fontSize: 18, color: '#9ca3af', marginTop: 16, textAlign: 'center' },
  selectChannelSub: { fontSize: 14, color: '#6b7280', marginTop: 4, textAlign: 'center' },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#f9fafb' },
  subtitle: { fontSize: 14, color: '#9ca3af', marginTop: 2 },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  iconBtn: { padding: 4, marginLeft: 8 },
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
    borderLeftWidth: 4,
  },
  cardInProgress: {
    borderLeftColor: '#ef4444',
  },
  cardFinished: {
    borderLeftColor: '#22c55e',
  },
  cardContent: { flex: 1 },
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
  modalError: { fontSize: 14, color: '#ef4444', marginBottom: 12 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1 },
});
