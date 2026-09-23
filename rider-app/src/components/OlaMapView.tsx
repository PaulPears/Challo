import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, ViewStyle, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

export interface OlaMarker {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  type?: 'user' | 'driver' | 'pickup' | 'dropoff';
  vehicleType?: string;
}

interface OlaMapViewProps {
  center?: { latitude: number; longitude: number };
  zoom?: number;
  markers?: OlaMarker[];
  routeCoordinates?: Array<[number, number] | { latitude: number; longitude: number }>;
  onMapClick?: (coords: { latitude: number; longitude: number }) => void;
  style?: ViewStyle;
  apiKey?: string;
}

const DEFAULT_API_KEY = '6IW2TPoUXEP4gvTf1R3qxhrx5FxdqE1yRTEpwPYj';

export const OlaMapView: React.FC<OlaMapViewProps> = ({
  center = { latitude: 14.6824, longitude: 77.6017 },
  zoom = 14,
  markers = [],
  routeCoordinates,
  onMapClick,
  style,
  apiKey = DEFAULT_API_KEY,
}) => {
  const webViewRef = useRef<WebView>(null);

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Ola Maps</title>
  <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css" />
  <script src="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js"></script>
  <style>
    body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
    .user-marker {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #2563EB;
      border: 3px solid #FFFFFF;
      box-shadow: 0 0 10px rgba(37, 99, 235, 0.6);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7); }
      70% { box-shadow: 0 0 0 14px rgba(37, 99, 235, 0); }
      100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
    }
    .custom-marker {
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
      cursor: pointer;
    }
    .pin-pickup {
      width: 28px;
      height: 28px;
      background: #16A34A;
      border: 2px solid #FFFFFF;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }
    .pin-dropoff {
      width: 28px;
      height: 28px;
      background: #DC2626;
      border: 2px solid #FFFFFF;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }
    .vehicle-marker {
      width: 36px;
      height: 36px;
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const OLA_KEY = '${apiKey}';
    let map;
    let currentMarkers = {};

    function initMap() {
      map = new maplibregl.Map({
        container: 'map',
        style: 'https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json',
        center: [${center.longitude}, ${center.latitude}],
        zoom: ${zoom},
        transformRequest: function(url, resourceType) {
          const sep = url.indexOf('?') !== -1 ? '&' : '?';
          return { url: url + sep + 'api_key=' + OLA_KEY };
        }
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: false }), 'bottom-right');

      map.on('click', function(e) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'MAP_CLICK',
            latitude: e.lngLat.lat,
            longitude: e.lngLat.lng
          }));
        }
      });

      map.on('load', function() {
        updateMarkers(${JSON.stringify(markers)});
        ${routeCoordinates ? `updateRoute(${JSON.stringify(routeCoordinates)});` : ''}
      });
    }

    function updateMarkers(markers) {
      if (!map) return;
      // Remove old markers
      Object.keys(currentMarkers).forEach(function(id) {
        currentMarkers[id].remove();
        delete currentMarkers[id];
      });

      markers.forEach(function(m) {
        const el = document.createElement('div');
        if (m.type === 'user') {
          el.className = 'user-marker';
        } else if (m.type === 'pickup') {
          el.className = 'pin-pickup';
        } else if (m.type === 'dropoff') {
          el.className = 'pin-dropoff';
        } else {
          el.className = 'vehicle-marker';
          el.style.backgroundColor = '#E5A915';
          el.style.borderRadius = '50%';
          el.style.border = '2px solid white';
        }

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([m.longitude, m.latitude])
          .addTo(map);

        currentMarkers[m.id || Math.random().toString()] = marker;
      });
    }

    function setCenter(lat, lng, zoomLevel) {
      if (map) {
        map.flyTo({ center: [lng, lat], zoom: zoomLevel || map.getZoom() });
      }
    }

    function updateRoute(coords) {
      if (!map) return;
      const formatted = coords.map(function(c) {
        if (Array.isArray(c)) return [c[1], c[0]]; // [lng, lat]
        return [c.longitude, c.latitude];
      });

      const geojson = {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: formatted
        }
      };

      if (map.getSource('route')) {
        map.getSource('route').setData(geojson);
      } else {
        map.addSource('route', { type: 'geojson', data: geojson });
        map.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#E5A915', 'line-width': 5 }
        });
      }

      if (formatted.length > 1) {
        const bounds = formatted.reduce(function(b, c) {
          return b.extend(c);
        }, new maplibregl.LngLatBounds(formatted[0], formatted[0]));
        map.fitBounds(bounds, { padding: 40 });
      }
    }

    window.addEventListener('message', function(event) {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'SET_CENTER') {
          setCenter(data.latitude, data.longitude, data.zoom);
        } else if (data.type === 'UPDATE_MARKERS') {
          updateMarkers(data.markers);
        } else if (data.type === 'UPDATE_ROUTE') {
          updateRoute(data.route);
        }
      } catch (err) {}
    });

    initMap();
  </script>
</body>
</html>
  `;

  // Dynamically update map center without reloading webview
  useEffect(() => {
    if (webViewRef.current && center) {
      const script = `if (typeof setCenter === 'function') { setCenter(${center.latitude}, ${center.longitude}, ${zoom}); } true;`;
      webViewRef.current.injectJavaScript(script);
    }
  }, [center.latitude, center.longitude, zoom]);

  // Dynamically update markers
  useEffect(() => {
    if (webViewRef.current && markers) {
      const script = `if (typeof updateMarkers === 'function') { updateMarkers(${JSON.stringify(markers)}); } true;`;
      webViewRef.current.injectJavaScript(script);
    }
  }, [markers]);

  // Dynamically update route
  useEffect(() => {
    if (webViewRef.current && routeCoordinates) {
      const script = `if (typeof updateRoute === 'function') { updateRoute(${JSON.stringify(routeCoordinates)}); } true;`;
      webViewRef.current.injectJavaScript(script);
    }
  }, [routeCoordinates]);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'MAP_CLICK' && onMapClick) {
        onMapClick({ latitude: data.latitude, longitude: data.longitude });
      }
    } catch (err) {}
  };

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#E5A915" />
          </View>
        )}
        style={styles.webView}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
});

export default OlaMapView;
