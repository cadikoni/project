import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { TrendingDown, DollarSign, Package, AlertCircle, AlertTriangle } from 'lucide-react-native';
import { useWasteStore } from '@/store/useWasteStore';
import { useFoodStore } from '@/store/useFoodStore';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { format } from 'date-fns';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen() {
  const { wasteItems, stats, loading, error, fetchWasteItems, fetchStats } = useWasteStore();
  const { categories } = useFoodStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchWasteItems();
    fetchStats();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchWasteItems(), fetchStats()]);
    setRefreshing(false);
  };

  if (loading && !stats) {
    return <Loading fullScreen message="Calculating insights..." />;
  }

  if (error && !stats) {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={48} color="#ef4444" />
        <Text style={styles.errorTitle}>Failed to load analytics</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || 'Unknown';
  };

  const topWastedCategories = stats?.itemsByCategory
    ? Object.entries(stats.itemsByCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
    : [];

  const wasteByReason = stats?.itemsByReason
    ? Object.entries(stats.itemsByReason).map(([reason, count]) => ({
      reason: reason.charAt(0).toUpperCase() + reason.slice(1),
      count,
    }))
    : [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Waste Analytics</Text>
        <Text style={styles.subtitle}>Track your progress and insights</Text>
      </View>

      <View style={styles.statsGrid}>
        <Card style={styles.statCard} variant="elevated">
          <Package size={24} color="#ef4444" />
          <Text style={styles.statValue}>{stats?.totalItems || 0}</Text>
          <Text style={styles.statLabel}>Items Wasted</Text>
        </Card>

        <Card style={styles.statCard} variant="elevated">
          <DollarSign size={24} color="#f59e0b" />
          <Text style={styles.statValue}>
            ${(stats?.totalValue || 0).toFixed(2)}
          </Text>
          <Text style={styles.statLabel}>Value Lost</Text>
        </Card>
      </View>

      {stats && stats.totalItems > 0 ? (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Monthly Trend</Text>
            <Card variant="elevated">
              {stats.monthlyTrend.length > 0 ? (
                <View style={styles.chartContainer}>
                  {stats.monthlyTrend.map((month, index) => {
                    const maxCount = Math.max(...stats.monthlyTrend.map((m) => m.count));
                    const barHeight = (month.count / maxCount) * 120;

                    return (
                      <View key={index} style={styles.barContainer}>
                        <View style={styles.barWrapper}>
                          <View
                            style={[
                              styles.bar,
                              { height: barHeight || 10 },
                            ]}
                          />
                          <Text style={styles.barValue}>{month.count}</Text>
                        </View>
                        <Text style={styles.barLabel}>{month.month}</Text>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.emptyText}>No data available</Text>
              )}
            </Card>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Wasted Categories</Text>
            {topWastedCategories.length > 0 ? (
              topWastedCategories.map(([categoryId, count], index) => (
                <Card key={categoryId} style={styles.listItem} variant="elevated">
                  <View style={styles.listItemContent}>
                    <View style={styles.listItemRank}>
                      <Text style={styles.rankNumber}>{index + 1}</Text>
                    </View>
                    <Text style={styles.listItemText}>
                      {getCategoryName(categoryId)}
                    </Text>
                    <Badge
                      label={`${count} items`}
                      variant="danger"
                      size="sm"
                    />
                  </View>
                </Card>
              ))
            ) : (
              <Card>
                <Text style={styles.emptyText}>No data available</Text>
              </Card>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Waste Reasons</Text>
            <Card variant="elevated">
              {wasteByReason.map(({ reason, count }) => (
                <View key={reason} style={styles.reasonRow}>
                  <Text style={styles.reasonLabel}>{reason}</Text>
                  <Text style={styles.reasonValue}>{count} items</Text>
                </View>
              ))}
            </Card>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Waste History</Text>
            {wasteItems.slice(0, 10).map((item) => (
              <Card key={item.id} style={styles.historyCard} variant="elevated">
                <View style={styles.historyHeader}>
                  <Text style={styles.historyTitle}>{item.item_name}</Text>
                  <Badge
                    label={item.reason}
                    variant="danger"
                    size="sm"
                  />
                </View>
                <Text style={styles.historyDetails}>
                  {item.quantity} {item.unit} • {format(new Date(item.wasted_date), 'MMM dd, yyyy')}
                </Text>
                {item.estimated_value > 0 && (
                  <Text style={styles.historyValue}>
                    Estimated value: ${item.estimated_value.toFixed(2)}
                  </Text>
                )}
              </Card>
            ))}
          </View>
        </>
      ) : (
        <Card>
          <View style={styles.emptyState}>
            <TrendingDown size={48} color="#6b7280" />
            <Text style={styles.emptyStateTitle}>No Waste Data Yet</Text>
            <Text style={styles.emptyStateText}>
              Start tracking your food waste to see insights and analytics here.
            </Text>
          </View>
        </Card>
      )}

      <View style={styles.tipSection}>
        <Card style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <AlertCircle size={20} color="#22c55e" />
            <Text style={styles.tipTitle}>Waste Reduction Tip</Text>
          </View>
          <Text style={styles.tipText}>
            Plan your meals for the week and make a shopping list. This helps you buy only what you need and reduces impulse purchases that may go to waste.
          </Text>
        </Card>
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
    paddingBottom: 32,
  },
  header: {
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 16,
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
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 180,
    paddingTop: 20,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 140,
  },
  bar: {
    width: 40,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minHeight: 10,
  },
  barValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    marginTop: 4,
  },
  barLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 8,
  },
  listItem: {
    marginBottom: 8,
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listItemRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  listItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  reasonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  reasonLabel: {
    fontSize: 16,
    color: '#374151',
  },
  reasonValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  historyCard: {
    marginBottom: 8,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  historyDetails: {
    fontSize: 14,
    color: '#6b7280',
  },
  historyValue: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 14,
    paddingVertical: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  tipSection: {
    paddingHorizontal: 16,
  },
  tipCard: {
    backgroundColor: '#f0fdf4',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
  },
  tipText: {
    fontSize: 14,
    color: '#15803d',
    lineHeight: 20,
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
