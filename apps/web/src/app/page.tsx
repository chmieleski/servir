import { ServirFeatureHome, fetchHealth } from '@servir/feature-home';

export default async function Index() {
  const healthResult = await fetchHealth();

  if (!healthResult.ok) {
    return (
      <ServirFeatureHome
        healthStatus="unavailable"
        details={`Health check failed: ${healthResult.error}`}
      />
    );
  }

  return (
    <ServirFeatureHome
      healthStatus={healthResult.data.status}
      details={`Service ${healthResult.data.service} at ${healthResult.data.timestamp}`}
    />
  );
}
