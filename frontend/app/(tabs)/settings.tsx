import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { clearToken } from '../../hooks/useAuth';
import { useChannelStore } from '../../stores/channelStore';
import { useGroupStore } from '../../stores/groupStore';
import { useListStore } from '../../stores/listStore';
import { useTranslation } from '../../i18n';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { updateProfile } from '../../services/auth.service';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { user, logout, updateUser } = useAuthStore();
  const [editModal, setEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { setChannels, setCurrentChannel } = useChannelStore();
  const { setCurrentGroup, setGroups } = useGroupStore();
  const { setItems } = useListStore();

  function openEditModal() {
    setEditName(user?.name ?? '');
    setEditUsername(user?.username ?? '');
    setError('');
    setEditModal(true);
  }

  async function handleSaveProfile() {
    if (!editName.trim()) {
      setError(t('errorNameRequired'));
      return;
    }
    if (!editUsername.trim() || editUsername.trim().length < 3) {
      setError(t('errorUsernameRequired'));
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const updated = await updateProfile({
        name: editName.trim(),
        username: editUsername.trim(),
      });
      updateUser(updated);
      setEditModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failed'));
    } finally {
      setSubmitting(false);
    }
  }

  function handleLogout() {
    Alert.alert(t('signOut'), t('signOutConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('signOut'),
        style: 'destructive',
        onPress: async () => {
          await clearToken();
          logout();
          setCurrentGroup(null);
          setGroups([]);
          setItems([]);
          setChannels([]);
          setCurrentChannel(null);
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.profile}
          onPress={openEditModal}
          activeOpacity={0.7}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name ?? 'User'}</Text>
            <Text style={styles.profileEmail}>
              {user?.username ? `@${user.username}` : user?.email ?? ''}
            </Text>
          </View>
          <Ionicons name="create-outline" size={22} color="#60a5fa" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={22} color="#ef4444" />
          <Text style={styles.menuItemTextDanger}>{t('signOut')}</Text>
          <Ionicons name="chevron-forward" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.version}>ShopSyncX v1.0.0</Text>
      </View>

      <Modal visible={editModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t('editProfile')}</Text>
            <Input
              label={t('name')}
              placeholder={t('namePlaceholder')}
              value={editName}
              onChangeText={setEditName}
            />
            <Input
              label={t('username')}
              placeholder={t('usernamePlaceholder')}
              value={editUsername}
              onChangeText={setEditUsername}
              autoCapitalize="none"
            />
            {error ? <Text style={styles.modalError}>{error}</Text> : null}
            <View style={styles.modalActions}>
              <Button
                title={t('cancel')}
                variant="secondary"
                onPress={() => setEditModal(false)}
                style={styles.modalBtn}
              />
              <Button
                title={t('save')}
                onPress={handleSaveProfile}
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
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#f9fafb' },
  sectionTitle: { fontSize: 14, color: '#9ca3af', marginBottom: 12 },
  langRow: { flexDirection: 'row', gap: 12 },
  langBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#1f2937',
    alignItems: 'center',
  },
  langBtnActive: { backgroundColor: '#60a5fa' },
  langBtnText: { fontSize: 16, color: '#9ca3af' },
  langBtnTextActive: { color: '#111827', fontWeight: '600' },
  section: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#60a5fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  profileInfo: { marginLeft: 16, flex: 1 },
  profileName: { fontSize: 16, fontWeight: '600', color: '#f9fafb' },
  profileEmail: { fontSize: 14, color: '#9ca3af', marginTop: 2 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  menuItemTextDanger: { flex: 1, fontSize: 16, color: '#ef4444', fontWeight: '500' },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 32,
  },
  version: { fontSize: 13, color: '#6b7280' },
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
