import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { useTheme } from '@/hooks/use-theme';
import type { HealthKitRoute } from '@/types/healthkit';

interface RunMapProps {
  route: HealthKitRoute[];
}

export function RunMap({ route }: RunMapProps) {
  const colors = useTheme();

  const coordinates = useMemo(
    () => route.map((p) => ({ latitude: p.latitude, longitude: p.longitude })),
    [route],
  );

  const region = useMemo(() => {
    if (coordinates.length === 0) return undefined;

    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;

    for (const c of coordinates) {
      if (c.latitude < minLat) minLat = c.latitude;
      if (c.latitude > maxLat) maxLat = c.latitude;
      if (c.longitude < minLng) minLng = c.longitude;
      if (c.longitude > maxLng) maxLng = c.longitude;
    }

    const latDelta = (maxLat - minLat) * 1.3 || 0.01;
    const lngDelta = (maxLng - minLng) * 1.3 || 0.01;

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    };
  }, [coordinates]);

  if (coordinates.length < 2 || !region) return null;

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={region}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        userInterfaceStyle="dark"
      >
        <Polyline
          coordinates={coordinates}
          strokeColor={colors.accent}
          strokeWidth={3}
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    overflow: 'hidden',
    height: 220,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});
