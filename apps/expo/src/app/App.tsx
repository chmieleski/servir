import { HealthResponseSchema } from '@servir/contracts';
import { loadExpoEnv } from '@servir/config';
import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native';

type HealthStatus = 'loading' | 'ok' | 'error';

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

export function App() {
  const [status, setStatus] = useState<HealthStatus>('loading');
  const [details, setDetails] = useState('Checking API health...');
  const [endpoint, setEndpoint] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    const loadHealth = async () => {
      try {
        const env = loadExpoEnv(process.env);
        const healthUrl = `${env.EXPO_PUBLIC_API_BASE_URL}/health`;

        if (!cancelled) {
          setEndpoint(healthUrl);
        }

        const response = await fetch(healthUrl);

        if (!response.ok) {
          throw new Error(`Health endpoint returned status ${response.status}`);
        }

        const json = await response.json();
        const parsed = HealthResponseSchema.safeParse(json);

        if (!parsed.success) {
          throw new Error('Health response did not match @servir/contracts');
        }

        if (cancelled) return;

        setStatus('ok');
        setDetails(
          `Service ${parsed.data.service} is ${parsed.data.status} at ${parsed.data.timestamp}`,
        );
      } catch (error) {
        if (cancelled) return;

        setStatus('error');
        setDetails(toErrorMessage(error));
      }
    };

    void loadHealth();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Servir Expo</Text>
        <Text style={styles.subtitle}>Linked with API + shared contracts</Text>

        {status === 'loading' ? (
          <View style={styles.statusRow}>
            <ActivityIndicator />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : null}

        <Text style={[styles.status, status === 'ok' ? styles.ok : styles.error]}>
          {status === 'ok' ? 'Status: connected' : status === 'error' ? 'Status: failed' : 'Status: loading'}
        </Text>

        <Text style={styles.details}>{details}</Text>

        {endpoint ? <Text style={styles.endpoint}>Endpoint: {endpoint}</Text> : null}
      </View>
    </SafeAreaView>
  );
}

export default App;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f6fb',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0b1f38',
  },
  subtitle: {
    fontSize: 16,
    color: '#304a6a',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 15,
    color: '#3c4f67',
  },
  status: {
    fontSize: 18,
    fontWeight: '600',
  },
  ok: {
    color: '#0a8f4b',
  },
  error: {
    color: '#b23a2f',
  },
  details: {
    fontSize: 15,
    color: '#1c2f45',
  },
  endpoint: {
    fontSize: 13,
    color: '#49617f',
  },
});
