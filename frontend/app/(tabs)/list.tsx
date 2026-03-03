import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Modal,
  ScrollView,
} from 'react-native';
import { SwipeableRow } from '../../components/ui/SwipeableRow';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { useGroupStore } from '../../stores/groupStore';
import { useListStore, ListItem } from '../../stores/listStore';
import * as itemsService from '../../services/items.service';
import * as articlesService from '../../services/articles.service';
import { formatPrice } from '../../utils/format';
import { useTranslation } from '../../i18n';
import { useListSocket } from '../../hooks/useSocket';

export default function ListScreen() {
  const { t, tWithParams } = useTranslation();
  const { user } = useAuthStore();
  const { currentGroup, updateGroup } = useGroupStore();
  const { items, setItems, addItem, updateItem, removeItem, getOrderedItems } =
    useListStore();
  useListSocket(currentGroup?.id);

  // Sync group item counts and prices when list changes
  useEffect(() => {
    if (!currentGroup) return;
    const itemCount = items.length;
    const checkedItemCount = items.filter((i) => i.checked).length;
    const totalPrice = items.reduce(
      (sum, i) => sum + (i.price ?? 0) * (i.quantity ?? 1),
      0
    );
    const checkedPrice = items
      .filter((i) => i.checked)
      .reduce((sum, i) => sum + (i.price ?? 0) * (i.quantity ?? 1), 0);
    updateGroup(currentGroup.id, {
      itemCount,
      checkedItemCount,
      totalPrice,
      checkedPrice,
    });
  }, [items, currentGroup?.id]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('1');
  const [adding, setAdding] = useState(false);
  const [editModal, setEditModal] = useState<ListItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editQty, setEditQty] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [articleSuggestions, setArticleSuggestions] = useState<articlesService.Article[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const itemNameInputRef = useRef<TextInput>(null);

  async function fetchItems(silent = false) {
    if (!currentGroup) {
      setItems([]);
      return;
    }
    if (!silent) setLoading(true);
    try {
      const data = await itemsService.getItems(currentGroup.id);
      setItems(data);
    } catch (err) {
      Alert.alert(t('error'), err instanceof Error ? err.message : t('failed'));
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    fetchItems();
  }, [currentGroup?.id]);

  // Fetch article suggestions for autocomplete
  useEffect(() => {
    if (!currentGroup?.channelId || !newItemName.trim()) {
      setArticleSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const articles = await articlesService.getArticles(
          currentGroup.channelId!,
          newItemName.trim()
        );
        setArticleSuggestions(articles);
        setShowSuggestions(articles.length > 0);
      } catch {
        setArticleSuggestions([]);
        setShowSuggestions(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [currentGroup?.channelId, newItemName]);

  async function handleAdd() {
    if (!currentGroup || !newItemName.trim()) return;
    setAdding(true);
    try {
      const qty = newItemQty ? parseInt(newItemQty, 10) : 1;
      const item = await itemsService.addItem(
        currentGroup.id,
        newItemName.trim(),
        qty && !isNaN(qty) ? qty : 1
      );
      addItem(item);
      setNewItemName('');
      setNewItemQty('1');
      setTimeout(() => itemNameInputRef.current?.focus(), 0);
    } catch (err) {
      Alert.alert(t('error'), err instanceof Error ? err.message : t('failed'));
    } finally {
      setAdding(false);
    }
  }

  async function handleToggle(item: ListItem) {
    if (!currentGroup) return;
    const prev = item.checked;
    updateItem(item.id, { checked: !prev });
    try {
      await itemsService.updateItem(currentGroup.id, item.id, {
        checked: !prev,
      });
    } catch {
      updateItem(item.id, { checked: prev });
    }
  }

  function openEditModal(item: ListItem) {
    setEditModal(item);
    setEditName(item.name);
    setEditQty(item.quantity ? String(item.quantity) : '1');
    setEditPrice(item.price != null ? String(item.price) : '');
  }

  async function handleEditSave() {
    if (!currentGroup || !editModal) return;
    const name = editName.trim();
    if (!name) return;
    setEditSubmitting(true);
    try {
      const qty = editQty ? parseInt(editQty, 10) : 1;
      const price = editPrice ? parseFloat(editPrice) : undefined;
      const updated = await itemsService.updateItem(currentGroup.id, editModal.id, {
        name,
        quantity: qty && !isNaN(qty) ? qty : 1,
        price: price != null && !isNaN(price) ? price : null,
      });
      updateItem(editModal.id, {
        name: updated.name,
        quantity: updated.quantity,
        price: updated.price,
      });
      setEditModal(null);
    } catch (err) {
      Alert.alert(t('error'), err instanceof Error ? err.message : t('failed'));
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleDelete(item: ListItem) {
    if (!currentGroup) return;
    Alert.alert(t('deleteItem'), tWithParams('deleteItemConfirm', { name: item.name }), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          const prev = [...items];
          removeItem(item.id);
          try {
            await itemsService.deleteItem(currentGroup.id, item.id);
          } catch {
            setItems(prev);
          }
        },
      },
    ]);
  }

  if (!currentGroup) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.empty}>
          <Ionicons name="cart-outline" size={64} color="#4b5563" />
          <Text style={styles.emptyText}>{t('selectGroup')}</Text>
          <Text style={styles.emptySub}>{t('selectGroupSub')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const orderedItems = getOrderedItems();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{currentGroup.name}</Text>
        <Text style={styles.subtitle}>
          {t('shoppingList')}
          {(() => {
            const total = items.reduce(
              (sum, i) => sum + (i.price ?? 0) * (i.quantity ?? 1),
              0
            );
            const checked = items
              .filter((i) => i.checked)
              .reduce((sum, i) => sum + (i.price ?? 0) * (i.quantity ?? 1), 0);
            if (total > 0) {
              return ` · ${formatPrice(total)}${checked > 0 ? ` (${t('checked')}: ${formatPrice(checked)})` : ''}`;
            }
            return '';
          })()}
        </Text>
      </View>

      <View>
        <KeyboardAvoidingView
          style={styles.addRow}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TextInput
            ref={itemNameInputRef}
            style={styles.input}
            placeholder={t('addItem')}
            placeholderTextColor="#6b7280"
            value={newItemName}
            onChangeText={(v) => {
              setNewItemName(v);
              setShowSuggestions(true);
            }}
            onFocus={() => articleSuggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onSubmitEditing={handleAdd}
          />
          <TextInput
            style={styles.qtyInput}
            placeholder={t('qty')}
            placeholderTextColor="#6b7280"
            value={newItemQty}
            onChangeText={setNewItemQty}
            keyboardType="number-pad"
          />
          <TouchableOpacity
            style={styles.addBtn}
            onPress={handleAdd}
            disabled={adding || !newItemName.trim()}
          >
            {adding ? (
              <ActivityIndicator size="small" color="#111827" />
            ) : (
              <Ionicons name="add" size={24} color="#111827" />
            )}
          </TouchableOpacity>
        </KeyboardAvoidingView>
        {showSuggestions && articleSuggestions.length > 0 && (
          <View style={styles.suggestions}>
            {articleSuggestions.slice(0, 5).map((a) => (
              <TouchableOpacity
                key={a.id}
                style={styles.suggestionItem}
                onPress={() => {
                  setNewItemName(a.name);
                  setShowSuggestions(false);
                }}
              >
                <Text style={styles.suggestionName}>{a.name}</Text>
                {a.price > 0 && (
                  <Text style={styles.suggestionPrice}>
                    {a.price.toFixed(2)}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#60a5fa" />
        </View>
      ) : orderedItems.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="list-outline" size={48} color="#4b5563" />
          <Text style={styles.emptyText}>{t('noItems')}</Text>
          <Text style={styles.emptySub}>{t('noItemsSub')}</Text>
        </View>
      ) : (
        <FlatList
          data={orderedItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await fetchItems(true);
                setRefreshing(false);
              }}
              tintColor="#60a5fa"
            />
          }
          renderItem={({ item }) => {
            const canDelete =
              item.addedById === user?.id || currentGroup?.isAdmin;
            return (
              <SwipeableRow
                onDelete={() => handleDelete(item)}
                disabled={!canDelete}
                deleteLabel={t('delete')}
              >
                <TouchableOpacity
                  style={[styles.item, item.checked && styles.itemChecked]}
                  onPress={() => handleToggle(item)}
                  onLongPress={() => openEditModal(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.checkbox}>
                    <Ionicons
                      name={item.checked ? 'checkbox' : 'square-outline'}
                      size={24}
                      color={item.checked ? '#60a5fa' : '#6b7280'}
                    />
                  </View>
                  <View style={styles.itemContent}>
                    <Text
                      style={[
                        styles.itemName,
                        item.checked && styles.itemNameChecked,
                      ]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    {[
                      item.quantity ? `${t('qtyLabel')} ${item.quantity}` : '',
                      item.price != null && item.price > 0
                        ? formatPrice(item.price * (item.quantity ?? 1))
                        : '',
                      item.addedByName ? `${t('by')} ${item.addedByName}` : '',
                    ].filter(Boolean).length > 0 && (
                      <Text style={styles.itemMeta}>
                        {[
                          item.quantity ? `${t('qtyLabel')} ${item.quantity}` : '',
                          item.price != null && item.price > 0
                            ? formatPrice(item.price * (item.quantity ?? 1))
                            : '',
                          item.addedByName ? `${t('by')} ${item.addedByName}` : '',
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              </SwipeableRow>
            );
          }}
        />
      )}

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
              <Text style={styles.modalTitle}>{t('editItem')}</Text>
              <Input
                label={t('itemName')}
                value={editName}
                onChangeText={setEditName}
                placeholder={t('addItem')}
              />
              <Input
                label={t('qty')}
                value={editQty}
                onChangeText={setEditQty}
                placeholder={t('qty')}
                keyboardType="number-pad"
              />
              <Input
                label={t('price')}
                value={editPrice}
                onChangeText={setEditPrice}
                placeholder={t('pricePlaceholder')}
                keyboardType="decimal-pad"
              />
              <View style={styles.modalActions}>
                <Button
                  title={t('cancel')}
                  variant="secondary"
                  onPress={() => setEditModal(null)}
                  style={styles.modalBtn}
                />
                <Button
                  title={t('save')}
                  onPress={handleEditSave}
                  loading={editSubmitting}
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
  addRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  input: {
    flex: 1,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#f9fafb',
  },
  qtyInput: {
    width: 56,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#f9fafb',
    textAlign: 'center',
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#60a5fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  itemChecked: { opacity: 0.7 },
  checkbox: { marginRight: 12 },
  itemContent: { flex: 1 },
  itemName: { fontSize: 16, color: '#f9fafb' },
  itemNameChecked: { textDecorationLine: 'line-through', color: '#9ca3af' },
  itemMeta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  suggestions: {
    backgroundColor: '#1f2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    maxHeight: 180,
  },
  suggestionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  suggestionName: { fontSize: 16, color: '#f9fafb' },
  suggestionPrice: { fontSize: 14, color: '#60a5fa' },
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
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1 },
});
