import { useEffect, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { useGroupStore } from '../../stores/groupStore';
import { useListStore, ListItem } from '../../stores/listStore';
import * as itemsService from '../../services/items.service';
import { useTranslation } from '../../i18n';
import { useListSocket } from '../../hooks/useSocket';

export default function ListScreen() {
  const { t, tWithParams } = useTranslation();
  const { user } = useAuthStore();
  const { currentGroup, updateGroup } = useGroupStore();
  const { items, setItems, addItem, updateItem, removeItem, getOrderedItems } =
    useListStore();
  useListSocket(currentGroup?.id);

  // Sync group item counts when list changes (for green/red line and X/Y display)
  useEffect(() => {
    if (!currentGroup) return;
    const itemCount = items.length;
    const checkedItemCount = items.filter((i) => i.checked).length;
    updateGroup(currentGroup.id, { itemCount, checkedItemCount });
  }, [items, currentGroup?.id]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('');
  const [adding, setAdding] = useState(false);

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

  async function handleAdd() {
    if (!currentGroup || !newItemName.trim()) return;
    setAdding(true);
    try {
      const qty = newItemQty ? parseInt(newItemQty, 10) : undefined;
      const item = await itemsService.addItem(
        currentGroup.id,
        newItemName.trim(),
        qty && !isNaN(qty) ? qty : undefined
      );
      addItem(item);
      setNewItemName('');
      setNewItemQty('');
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
        <Text style={styles.subtitle}>{t('shoppingList')}</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.addRow}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TextInput
          style={styles.input}
          placeholder={t('addItem')}
          placeholderTextColor="#6b7280"
          value={newItemName}
          onChangeText={setNewItemName}
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
          renderItem={({ item }) => (
            <View style={[styles.item, item.checked && styles.itemChecked]}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => handleToggle(item)}
              >
                <Ionicons
                  name={item.checked ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={item.checked ? '#60a5fa' : '#6b7280'}
                />
              </TouchableOpacity>
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
                  {(item.quantity || item.addedByName) && (
                  <Text style={styles.itemMeta}>
                    {item.quantity ? `${t('qtyLabel')} ${item.quantity}` : ''}
                    {item.quantity && item.addedByName ? ' · ' : ''}
                    {item.addedByName ? `${t('by')} ${item.addedByName}` : ''}
                  </Text>
                )}
              </View>
              {item.addedById === user?.id && (
                <TouchableOpacity
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  onPress={() => handleDelete(item)}
                >
                  <Ionicons name="trash-outline" size={20} color="#6b7280" />
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}
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
});
