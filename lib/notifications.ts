import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'web') {
    return null;
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#22c55e',
    });
  }

  return token;
}

export async function scheduleFoodExpirationNotification(
  foodName: string,
  expirationDate: Date,
  daysBeforeExpiry: number = 1
) {
  if (Platform.OS === 'web') {
    return;
  }

  const notificationDate = new Date(expirationDate);
  notificationDate.setDate(notificationDate.getDate() - daysBeforeExpiry);

  const now = new Date();
  if (notificationDate <= now) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Food Expiring Soon!',
      body: `${foodName} will expire in ${daysBeforeExpiry} day${daysBeforeExpiry > 1 ? 's' : ''}`,
      data: { type: 'expiration_warning', foodName },
      sound: true,
    },
    trigger: {
      date: notificationDate,
    },
  });
}

export async function sendImmediateNotification(title: string, body: string) {
  if (Platform.OS === 'web') {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { type: 'immediate' },
      sound: true,
    },
    trigger: null,
  });
}

export async function cancelAllNotifications() {
  if (Platform.OS === 'web') {
    return;
  }

  await Notifications.cancelAllScheduledNotificationsAsync();
}

export function addNotificationReceivedListener(
  listener: (notification: Notifications.Notification) => void
) {
  if (Platform.OS === 'web') {
    return { remove: () => {} };
  }

  return Notifications.addNotificationReceivedListener(listener);
}

export function addNotificationResponseReceivedListener(
  listener: (response: Notifications.NotificationResponse) => void
) {
  if (Platform.OS === 'web') {
    return { remove: () => {} };
  }

  return Notifications.addNotificationResponseReceivedListener(listener);
}
