import styles from './feature-home.module.css';

export interface ServirFeatureHomeProps {
  healthStatus: string;
  details: string;
}

export function ServirFeatureHome({ healthStatus, details }: ServirFeatureHomeProps) {
  return (
    <div className={styles['container']}>
      <h1>Servir Enterprise Bootstrap</h1>
      <p>API health status: {healthStatus}</p>
      <p>{details}</p>
    </div>
  );
}

export default ServirFeatureHome;
