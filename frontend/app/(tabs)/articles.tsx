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
  RefreshControl,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SwipeableRow } from '../../components/ui/SwipeableRow';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useChannelStore } from '../../stores/channelStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import * as articlesService from '../../services/articles.service';
import { useTranslation } from '../../i18n';
import { formatPrice } from '../../utils/format';

export default function ArticlesTabScreen() {
  const { t } = useTranslation();
  const { currentChannel } = useChannelStore();
  const [articles, setArticles] = useState<articlesService.Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState<articlesService.Article | null>(null);
  const [createName, setCreateName] = useState('');
  const [createPrice, setCreatePrice] = useState('');
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const channelId = currentChannel?.id;

  async function fetchArticles(silent = false) {
    if (!channelId) {
      setArticles([]);
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    try {
      const data = await articlesService.getArticles(channelId);
      setArticles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failed'));
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    fetchArticles();
  }, [channelId]);

  useFocusEffect(
    useCallback(() => {
      if (channelId) fetchArticles();
    }, [channelId])
  );

  async function handleCreate() {
    setError('');
    if (!channelId || !createName.trim()) return;
    setSubmitting(true);
    try {
      const price = createPrice ? parseFloat(createPrice) : 0;
      const article = await articlesService.createArticle(
        channelId,
        createName.trim(),
        !isNaN(price) ? price : 0
      );
      setArticles((prev) => [...prev, article].sort((a, b) => a.name.localeCompare(b.name)));
      setCreateModal(false);
      setCreateName('');
      setCreatePrice('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failed'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate() {
    setError('');
    if (!channelId || !editModal) return;
    const name = editName.trim();
    if (!name) return;
    setSubmitting(true);
    try {
      const price = editPrice ? parseFloat(editPrice) : 0;
      const updated = await articlesService.updateArticle(
        channelId,
        editModal.id,
        { name, price: !isNaN(price) ? price : 0 }
      );
      setArticles((prev) =>
        prev
          .map((a) => (a.id === editModal.id ? updated : a))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditModal(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failed'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(article: articlesService.Article) {
    if (!channelId) return;
    Alert.alert(
      t('deleteArticle'),
      t('deleteArticleConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await articlesService.deleteArticle(channelId, article.id);
              setArticles((prev) => prev.filter((a) => a.id !== article.id));
            } catch (err) {
              Alert.alert(t('error'), err instanceof Error ? err.message : t('failed'));
            }
          },
        },
      ]
    );
  }

  function openEdit(article: articlesService.Article) {
    setEditModal(article);
    setEditName(article.name);
    setEditPrice(article.price > 0 ? String(article.price) : '');
    setError('');
  }

  if (!currentChannel) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.empty}>
          <Ionicons name="pricetag-outline" size={64} color="#4b5563" />
          <Text style={styles.emptyText}>{t('selectChannelFirst')}</Text>
          <Text style={styles.emptySub}>{t('selectChannelFromChannelsTab')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('articles')}</Text>
        <Text style={styles.subtitle}>
          {currentChannel.name} · {t('articlesSub')}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => {
              setCreateModal(true);
              setError('');
              setCreateName('');
              setCreatePrice('');
            }}
          >
            <Ionicons name="add-circle" size={28} color="#60a5fa" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#60a5fa" />
        </View>
      ) : articles.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="pricetag-outline" size={48} color="#4b5563" />
          <Text style={styles.emptyText}>{t('noArticles')}</Text>
          <Text style={styles.emptySub}>{t('noArticlesSub')}</Text>
        </View>
      ) : (
        <FlatList
          data={articles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await fetchArticles(true);
                setRefreshing(false);
              }}
              tintColor="#60a5fa"
            />
          }
          renderItem={({ item }) => (
            <SwipeableRow
              onDelete={() => handleDelete(item)}
              deleteLabel={t('delete')}
            >
              <TouchableOpacity
                style={styles.card}
                onPress={() => openEdit(item)}
                onLongPress={() => openEdit(item)}
                activeOpacity={0.7}
              >
                <View style={styles.cardContent}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <Text style={styles.cardMeta}>
                    {item.price > 0 ? formatPrice(item.price) : t('noPrice')}
                  </Text>
                </View>
                <Ionicons name="pencil-outline" size={22} color="#60a5fa" />
              </TouchableOpacity>
            </SwipeableRow>
          )}
        />
      )}

      <Modal visible={createModal} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            contentContainerStyle={styles.modalScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>{t('createArticle')}</Text>
              <Input
                label={t('articleName')}
                value={createName}
                onChangeText={setCreateName}
                placeholder={t('articleNamePlaceholder')}
              />
              <Input
                label={t('price')}
                value={createPrice}
                onChangeText={setCreatePrice}
                placeholder={t('pricePlaceholder')}
                keyboardType="decimal-pad"
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
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={!!editModal} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            contentContainerStyle={styles.modalScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>{t('editArticle')}</Text>
              <Input
                label={t('articleName')}
                value={editName}
                onChangeText={setEditName}
                placeholder={t('articleNamePlaceholder')}
              />
              <Input
                label={t('price')}
                value={editPrice}
                onChangeText={setEditPrice}
                placeholder={t('pricePlaceholder')}
                keyboardType="decimal-pad"
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
          </ScrollView>
        </KeyboardAvoidingView>
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
  title: { fontSize: 22, fontWeight: 'bold', color: '#f9fafb' },
  subtitle: { fontSize: 14, color: '#9ca3af', marginTop: 2 },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  iconBtn: { padding: 4 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  cardContent: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '600', color: '#f9fafb' },
  cardMeta: { fontSize: 13, color: '#9ca3af', marginTop: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalScroll: {
    flexGrow: 1,
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
