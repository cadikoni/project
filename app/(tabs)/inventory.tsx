import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { Plus, Search, Trash2, Edit, Calendar, Camera, AlertCircle } from 'lucide-react-native';
import { useFoodStore } from '@/store/useFoodStore';
import { useWasteStore } from '@/store/useWasteStore';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import { FoodItem, FoodItemStatus } from '@/types/database';
import { differenceInDays, format } from 'date-fns';
import * as Haptics from 'expo-haptics';

export default function InventoryScreen() {
  const { items, categories, loading, error, fetchItems, fetchCategories, addItem, updateItem, deleteItem } = useFoodStore();
  const { addWasteItem } = useWasteStore();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);

  useEffect(() => {
    fetchCategories();
    fetchItems();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchItems(), fetchCategories()]);
    setRefreshing(false);
  };

  const filteredItems = items.filter(
    (item) =>
      (item.status === 'fresh' || item.status === 'expiring_soon') &&
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMarkAsWasted = async (item: FoodItem) => {
    Alert.alert(
      'Mark as Wasted',
      `Are you sure you want to mark "${item.name}" as wasted?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Wasted',
          style: 'destructive',
          onPress: async () => {
            try {
              await addWasteItem({
                food_item_id: item.id,
                item_name: item.name,
                category_id: item.category_id,
                quantity: item.quantity,
                unit: item.unit,
                reason: 'expired',
                wasted_date: new Date().toISOString().split('T')[0],
                estimated_value: 0,
              });
              await updateItem(item.id, { status: 'wasted' });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              Alert.alert('Error', 'Failed to mark item as wasted');
            }
          },
        },
      ]
    );
  };

  const handleMarkAsConsumed = async (item: FoodItem) => {
    try {
      await updateItem(item.id, { status: 'consumed' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('Error', 'Failed to mark item as consumed');
    }
  };

  const handleDelete = async (item: FoodItem) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteItem(item.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete item');
            }
          },
        },
      ]
    );
  };

  const getStatusBadge = (item: FoodItem) => {
    const daysUntilExpiry = differenceInDays(
      new Date(item.expiration_date),
      new Date()
    );

    if (daysUntilExpiry < 0) {
      return <Badge label="Expired" variant="danger" size="sm" />;
    } else if (daysUntilExpiry <= 2) {
      return <Badge label="Urgent" variant="danger" size="sm" />;
    } else if (daysUntilExpiry <= 7) {
      return <Badge label="Soon" variant="warning" size="sm" />;
    }
    return <Badge label="Fresh" variant="success" size="sm" />;
  };

  if (loading && items.length === 0) {
    return <Loading fullScreen message="Loading inventory..." />;
  }

  if (error && items.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={48} color="#ef4444" />
        <Text style={styles.errorTitle}>Failed to load inventory</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Retry" onPress={onRefresh} size="md" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Inventory</Text>
        <Text style={styles.subtitle}>{filteredItems.length} items in stock</Text>
      </View>

      <View style={styles.searchContainer}>
        <Input
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search items..."
          icon={<Search size={20} color="#6b7280" />}
        />
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredItems.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'No items found matching your search'
                : 'No items in your inventory. Add your first item!'}
            </Text>
          </Card>
        ) : (
          filteredItems.map((item) => {
            const daysUntilExpiry = differenceInDays(
              new Date(item.expiration_date),
              new Date()
            );

            return (
              <Card key={item.id} style={styles.itemCard} variant="elevated">
                <View style={styles.itemHeader}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemCategory}>
                      {item.category?.name || 'Uncategorized'}
                    </Text>
                    <Text style={styles.itemDetails}>
                      {item.quantity} {item.unit} • {item.storage_location}
                    </Text>
                    <Text style={styles.itemExpiry}>
                      Expires: {format(new Date(item.expiration_date), 'MMM dd, yyyy')}
                      {daysUntilExpiry >= 0 && ` (${daysUntilExpiry}d left)`}
                    </Text>
                  </View>
                  {getStatusBadge(item)}
                </View>

                <View style={styles.itemActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleMarkAsConsumed(item)}
                  >
                    <Text style={styles.actionButtonText}>Consumed</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.wasteButton]}
                    onPress={() => handleMarkAsWasted(item)}
                  >
                    <Text style={[styles.actionButtonText, styles.wasteButtonText]}>
                      Wasted
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => handleDelete(item)}
                  >
                    <Trash2 size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
      >
        <Plus size={28} color="#ffffff" />
      </TouchableOpacity>

      <AddItemModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        categories={categories}
        onAdd={addItem}
      />
    </View>
  );
}

interface AddItemModalProps {
  visible: boolean;
  onClose: () => void;
  categories: any[];
  onAdd: (item: any) => Promise<void>;
}

function AddItemModal({ visible, onClose, categories, onAdd }: AddItemModalProps) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pieces');
  const [categoryId, setCategoryId] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [storageLocation, setStorageLocation] = useState('Pantry');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [categories]);

  const handleAdd = async () => {
    if (!name.trim() || !expirationDate) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await onAdd({
        name: name.trim(),
        quantity: parseInt(quantity) || 1,
        unit,
        category_id: categoryId,
        expiration_date: expirationDate,
        storage_location: storageLocation,
        purchase_date: new Date().toISOString().split('T')[0],
        status: 'fresh' as FoodItemStatus,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setName('');
      setQuantity('1');
      setExpirationDate('');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to add item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Add Food Item</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalClose}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <Input
            label="Item Name"
            value={name}
            onChangeText={setName}
            placeholder="e.g., Milk, Bread, Apples"
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Input
                label="Quantity"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                placeholder="1"
              />
            </View>
            <View style={styles.halfWidth}>
              <Input
                label="Unit"
                value={unit}
                onChangeText={setUnit}
                placeholder="pieces"
              />
            </View>
          </View>

          <Input
            label="Expiration Date (YYYY-MM-DD)"
            value={expirationDate}
            onChangeText={setExpirationDate}
            placeholder="2024-12-31"
            icon={<Calendar size={20} color="#6b7280" />}
          />

          <Input
            label="Storage Location"
            value={storageLocation}
            onChangeText={setStorageLocation}
            placeholder="Fridge, Pantry, Freezer"
          />

          <Button
            title="Add Item"
            onPress={handleAdd}
            loading={loading}
            fullWidth
            size="lg"
          />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 14,
  },
  itemCard: {
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 12,
    color: '#8b5cf6',
    fontWeight: '600',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  itemExpiry: {
    fontSize: 12,
    color: '#9ca3af',
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#22c55e',
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  wasteButton: {
    backgroundColor: '#f3f4f6',
  },
  wasteButtonText: {
    color: '#ef4444',
  },
  iconButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalClose: {
    fontSize: 16,
    color: '#22c55e',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f9fafb',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
});
