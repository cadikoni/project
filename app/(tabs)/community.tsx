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
import { Plus, MapPin, Clock, User as UserIcon, AlertCircle } from 'lucide-react-native';
import { useCommunityStore } from '@/store/useCommunityStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import { format, formatDistanceToNow } from 'date-fns';
import * as Haptics from 'expo-haptics';

export default function CommunityScreen() {
  const { shares, myShares, claimedShares, loading, error, fetchShares, fetchMyShares, fetchClaimedShares, claimShare } = useCommunityStore();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'available' | 'my-shares' | 'claimed'>('available');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchShares();
    fetchMyShares();
    fetchClaimedShares();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchShares(), fetchMyShares(), fetchClaimedShares()]);
    setRefreshing(false);
  };

  const handleClaim = async (shareId: string) => {
    Alert.alert(
      'Claim Share',
      'Are you sure you want to claim this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Claim',
          onPress: async () => {
            try {
              await claimShare(shareId);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Success', 'You have claimed this item!');
            } catch (error) {
              Alert.alert('Error', 'Failed to claim item');
            }
          },
        },
      ]
    );
  };

  const renderShares = () => {
    let displayShares = [];

    switch (activeTab) {
      case 'available':
        displayShares = shares;
        break;
      case 'my-shares':
        displayShares = myShares;
        break;
      case 'claimed':
        displayShares = claimedShares;
        break;
    }

    if (displayShares.length === 0) {
      return (
        <Card>
          <Text style={styles.emptyText}>
            {activeTab === 'available'
              ? 'No items available for sharing at the moment'
              : activeTab === 'my-shares'
                ? 'You haven\'t shared any items yet'
                : 'You haven\'t claimed any items yet'}
          </Text>
        </Card>
      );
    }

    return displayShares.map((share) => (
      <Card key={share.id} style={styles.shareCard} variant="elevated">
        <View style={styles.shareHeader}>
          <View style={styles.shareInfo}>
            <Text style={styles.shareTitle}>{share.title}</Text>
            <View style={styles.userInfo}>
              <UserIcon size={14} color="#6b7280" />
              <Text style={styles.userName}>
                {share.profile?.full_name || 'Anonymous'}
              </Text>
            </View>
          </View>
          <Badge
            label={share.status}
            variant={
              share.status === 'available'
                ? 'success'
                : share.status === 'claimed'
                  ? 'warning'
                  : 'info'
            }
            size="sm"
          />
        </View>

        <Text style={styles.shareDescription}>{share.description}</Text>

        <View style={styles.shareDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Quantity:</Text>
            <Text style={styles.detailValue}>
              {share.quantity} {share.unit}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <MapPin size={14} color="#6b7280" />
            <Text style={styles.detailValue}>{share.pickup_location}</Text>
          </View>
          <View style={styles.detailRow}>
            <Clock size={14} color="#6b7280" />
            <Text style={styles.detailValue}>
              Available until {format(new Date(share.available_until), 'MMM dd, HH:mm')}
            </Text>
          </View>
        </View>

        {activeTab === 'available' && share.user_id !== user?.id && (
          <Button
            title="Claim This Item"
            onPress={() => handleClaim(share.id)}
            size="sm"
            fullWidth
          />
        )}
      </Card>
    ));
  };

  if (loading && shares.length === 0) {
    return <Loading fullScreen message="Loading community shares..." />;
  }

  if (error && shares.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={48} color="#ef4444" />
        <Text style={styles.errorTitle}>Failed to load community</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Retry" onPress={onRefresh} size="md" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Community Sharing</Text>
        <Text style={styles.subtitle}>Share surplus food, reduce waste</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'available' && styles.activeTab]}
          onPress={() => setActiveTab('available')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'available' && styles.activeTabText,
            ]}
          >
            Available
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my-shares' && styles.activeTab]}
          onPress={() => setActiveTab('my-shares')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'my-shares' && styles.activeTabText,
            ]}
          >
            My Shares
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'claimed' && styles.activeTab]}
          onPress={() => setActiveTab('claimed')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'claimed' && styles.activeTabText,
            ]}
          >
            Claimed
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderShares()}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
      >
        <Plus size={28} color="#ffffff" />
      </TouchableOpacity>

      <ShareItemModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </View>
  );
}

interface ShareItemModalProps {
  visible: boolean;
  onClose: () => void;
}

function ShareItemModal({ visible, onClose }: ShareItemModalProps) {
  const { createShare } = useCommunityStore();
  const { profile } = useAuthStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pieces');
  const [pickupLocation, setPickupLocation] = useState(profile?.location || '');
  const [availableUntil, setAvailableUntil] = useState('');
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    if (!title.trim() || !description.trim() || !pickupLocation.trim() || !availableUntil) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await createShare({
        title: title.trim(),
        description: description.trim(),
        quantity: parseInt(quantity) || 1,
        unit,
        pickup_location: pickupLocation.trim(),
        available_until: new Date(availableUntil).toISOString(),
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Your item has been shared with the community!');
      setTitle('');
      setDescription('');
      setQuantity('1');
      setAvailableUntil('');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to share item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Share Food Item</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalClose}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <Input
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Fresh Vegetables, Homemade Bread"
          />

          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the item in detail"
            multiline
            numberOfLines={3}
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
            label="Pickup Location"
            value={pickupLocation}
            onChangeText={setPickupLocation}
            placeholder="e.g., 123 Main St, City"
            icon={<MapPin size={20} color="#6b7280" />}
          />

          <Input
            label="Available Until (YYYY-MM-DD HH:MM)"
            value={availableUntil}
            onChangeText={setAvailableUntil}
            placeholder="2024-12-31 18:00"
            icon={<Clock size={20} color="#6b7280" />}
          />

          <Button
            title="Share Item"
            onPress={handleShare}
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#22c55e',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#22c55e',
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
  shareCard: {
    marginBottom: 12,
  },
  shareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  shareInfo: {
    flex: 1,
    marginRight: 12,
  },
  shareTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userName: {
    fontSize: 12,
    color: '#6b7280',
  },
  shareDescription: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
  },
  shareDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    color: '#374151',
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
