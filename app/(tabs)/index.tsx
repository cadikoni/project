import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { AlertTriangle, TrendingUp, Package, Users } from 'lucide-react-native';
import { useAuthStore } from '@/store/useAuthStore';
import { useFoodStore } from '@/store/useFoodStore';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { differenceInDays, format } from 'date-fns';

export default function HomeScreen() {
  const { profile } = useAuthStore();
  const { items, loading, error, fetchItems, fetchCategories } = useFoodStore();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    fetchCategories();
    fetchItems();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchItems(), fetchCategories()]);
    setRefreshing(false);
  };

  const expiringItems = items.filter((item) => {
    const daysUntilExpiry = differenceInDays(
      new Date(item.expiration_date),
      new Date()
    );
    return daysUntilExpiry >= 0 && daysUntilExpiry <= 7 && item.status === 'fresh';
  });

  const expiredItems = items.filter(
    (item) => differenceInDays(new Date(item.expiration_date), new Date()) < 0 &&
      item.status === 'fresh'
  );

  const totalItems = items.filter(
    (item) => item.status === 'fresh' || item.status === 'expiring_soon'
  ).length;

  if (loading && items.length === 0) {
    return <Loading fullScreen message="Fetching food items..." />;
  }

  if (error && items.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <AlertTriangle size={48} color="#ef4444" />
        <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {profile?.full_name || 'there'}!</Text>
          <Text style={styles.subtitle}>Let's reduce food waste together</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Package size={24} color="#22c55e" />
          <Text style={styles.statValue}>{totalItems}</Text>
          <Text style={styles.statLabel}>Total Items</Text>
        </Card>

        <Card style={styles.statCard}>
          <AlertTriangle size={24} color="#f59e0b" />
          <Text style={styles.statValue}>{expiringItems.length}</Text>
          <Text style={styles.statLabel}>Expiring Soon</Text>
        </Card>
      </View>

      {expiredItems.length > 0 && (
        <Card style={styles.alertCard} variant="elevated">
          <View style={styles.alertHeader}>
            <AlertTriangle size={20} color="#ef4444" />
            <Text style={styles.alertTitle}>
              {expiredItems.length} item{expiredItems.length > 1 ? 's' : ''} expired
            </Text>
          </View>
          <Text style={styles.alertText}>
            Check your inventory and mark them as consumed or wasted.
          </Text>
          <TouchableOpacity
            style={styles.alertButton}
            onPress={() => router.push('/(tabs)/inventory')}
          >
            <Text style={styles.alertButtonText}>View Inventory</Text>
          </TouchableOpacity>
        </Card>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Expiring Soon</Text>
          {expiringItems.length > 0 && (
            <TouchableOpacity onPress={() => router.push('/(tabs)/inventory')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          )}
        </View>

        {expiringItems.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>
              No items expiring soon. Great job!
            </Text>
          </Card>
        ) : (
          expiringItems.slice(0, 5).map((item) => {
            const daysUntilExpiry = differenceInDays(
              new Date(item.expiration_date),
              new Date()
            );

            return (
              <Card key={item.id} style={styles.itemCard} variant="elevated">
                <View style={styles.itemHeader}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemDetails}>
                      {item.quantity} {item.unit} • {item.storage_location}
                    </Text>
                  </View>
                  <Badge
                    label={
                      daysUntilExpiry === 0
                        ? 'Today'
                        : `${daysUntilExpiry}d left`
                    }
                    variant={daysUntilExpiry <= 2 ? 'danger' : 'warning'}
                    size="sm"
                  />
                </View>
                <Text style={styles.itemExpiry}>
                  Expires: {format(new Date(item.expiration_date), 'MMM dd, yyyy')}
                </Text>
              </Card>
            );
          })
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/inventory')}
          >
            <Package size={32} color="#22c55e" />
            <Text style={styles.actionText}>Add Item</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/community')}
          >
            <Users size={32} color="#3b82f6" />
            <Text style={styles.actionText}>Share Food</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/analytics')}
          >
            <TrendingUp size={32} color="#8b5cf6" />
            <Text style={styles.actionText}>View Stats</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 48,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  alertCard: {
    backgroundColor: '#fef2f2',
    marginBottom: 16,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#991b1b',
  },
  alertText: {
    fontSize: 14,
    color: '#7f1d1d',
    marginBottom: 12,
  },
  alertButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  alertButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  seeAll: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '600',
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
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 14,
    color: '#6b7280',
  },
  itemExpiry: {
    fontSize: 12,
    color: '#9ca3af',
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
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
  retryButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
});
