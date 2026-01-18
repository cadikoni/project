import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useAuthStore } from '@/store/useAuthStore';
import { Loading } from '@/components/ui/Loading';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import '../global.css';

function RootLayoutNav() {
  const segments = useSegments();
  const router = useRouter();
  const { user, loading, initialize } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initialize().then(() => setIsReady(true));
  }, []);

  useEffect(() => {
    if (!isReady || loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, segments, isReady, loading]);

  if (!isReady || loading) {
    return <Loading fullScreen message="Loading..." />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <ErrorBoundary>
      <RootLayoutNav />
      <StatusBar style="auto" />
    </ErrorBoundary>
  );
}
