import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import {
  User,
  MapPin,
  Bell,
  LogOut,
  ChevronRight,
  Mail,
  Info,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import * as Haptics from 'expo-haptics';

export default function ProfileScreen() {
  const { user, profile, signOut, updateProfile } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [location, setLocation] = useState(profile?.location || '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    profile?.notification_enabled ?? true
  );

  const handleSaveProfile = async () => {
    try {
      await updateProfile({
        full_name: fullName,
        location: location || undefined,
        notification_enabled: notificationsEnabled,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            router.replace('/(auth)/login');
          } catch (error) {
            Alert.alert('Error', 'Failed to sign out');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <Card style={styles.profileCard} variant="elevated">
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <User size={40} color="#22c55e" />
          </View>
        </View>

        {isEditing ? (
          <View style={styles.editForm}>
            <Input
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your name"
              icon={<User size={20} color="#6b7280" />}
            />

            <Input
              label="Email"
              value={user?.email || ''}
              editable={false}
              icon={<Mail size={20} color="#6b7280" />}
            />

            <Input
              label="Location (Optional)"
              value={location}
              onChangeText={setLocation}
              placeholder="City, Country"
              icon={<MapPin size={20} color="#6b7280" />}
            />

            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Bell size={20} color="#6b7280" />
                <Text style={styles.switchText}>Enable Notifications</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#d1d5db', true: '#86efac' }}
                thumbColor={notificationsEnabled ? '#22c55e' : '#f3f4f6'}
              />
            </View>

            <View style={styles.buttonGroup}>
              <Button
                title="Cancel"
                onPress={() => {
                  setIsEditing(false);
                  setFullName(profile?.full_name || '');
                  setLocation(profile?.location || '');
                  setNotificationsEnabled(profile?.notification_enabled ?? true);
                }}
                variant="outline"
                size="md"
              />
              <Button
                title="Save Changes"
                onPress={handleSaveProfile}
                size="md"
              />
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.profileName}>{profile?.full_name}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            {profile?.location && (
              <View style={styles.locationRow}>
                <MapPin size={16} color="#6b7280" />
                <Text style={styles.locationText}>{profile.location}</Text>
              </View>
            )}

            <Button
              title="Edit Profile"
              onPress={() => setIsEditing(true)}
              variant="outline"
              size="sm"
            />
          </>
        )}
      </Card>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>

        <Card variant="elevated">
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Bell size={20} color="#6b7280" />
              <Text style={styles.menuItemText}>Notifications</Text>
            </View>
            <ChevronRight size={20} color="#9ca3af" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Info size={20} color="#6b7280" />
              <Text style={styles.menuItemText}>About</Text>
            </View>
            <ChevronRight size={20} color="#9ca3af" />
          </TouchableOpacity>
        </Card>
      </View>

      <View style={styles.section}>
        <Card variant="elevated">
          <TouchableOpacity
            style={[styles.menuItem, styles.signOutItem]}
            onPress={handleSignOut}
          >
            <View style={styles.menuItemLeft}>
              <LogOut size={20} color="#ef4444" />
              <Text style={[styles.menuItemText, styles.signOutText]}>
                Sign Out
              </Text>
            </View>
          </TouchableOpacity>
        </Card>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>FoodSaver v1.0.0</Text>
        <Text style={styles.footerSubtext}>
          Reducing food waste, one meal at a time
        </Text>
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
  profileCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#22c55e',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  locationText: {
    fontSize: 14,
    color: '#6b7280',
  },
  editForm: {
    width: '100%',
    gap: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switchText: {
    fontSize: 16,
    color: '#374151',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#374151',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  signOutItem: {
    paddingVertical: 16,
  },
  signOutText: {
    color: '#ef4444',
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
});
