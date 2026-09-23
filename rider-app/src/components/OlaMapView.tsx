import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, ViewStyle, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import axios from 'axios';

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
}

const OLA_CLIENT_ID = '62a94778-18eb-4d86-bd0f-38c0530e8498';
const OLA_CLIENT_SECRET = '643e5601fd314e27bf1d1b81150214a9';

export const OlaMapView: React.FC<OlaMapViewProps> = ({
  center = { latitude: 14.6824, longitude: 77.6017 },
  zoom = 14,
  markers = [],
  routeCoordinates,
  onMapClick,
  style,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isTokenLoaded, setIsTokenLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchToken = async () => {
      try {
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('scope', 'openid');
        params.append('client_id', OLA_CLIENT_ID);
        params.append('client_secret', OLA_CLIENT_SECRET);

        const res = await axios.post('https://api.olamaps.io/auth/v1/token', params.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 8000,
        });

        if (isMounted && res.data?.access_token) {
          setToken(res.data.access_token);
        }
      } catch (err) {
        console.log('[OlaMapView] Token fetch error, using fallback layer:', err);
      } finally {
        if (isMounted) setIsTokenLoaded(true);
      }
    };

    fetchToken();
    return () => { isMounted = false; };
  }, []);

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
    body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #e5e7eb; }
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
    .pin-pickup {
      width: 26px;
      height: 26px;
      background: #16A34A;
      border: 2px solid #FFFFFF;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }
    .pin-dropoff {
      width: 26px;
      height: 26px;
      background: #DC2626;
      border: 2px solid #FFFFFF;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }
    .vehicle-marker {
      width: 34px;
      height: 34px;
      background: #E5A915;
      border-radius: 50%;
      border: 2.5px solid #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const OLA_TOKEN = '${token || ''}';
    let map;
    let currentMarkers = {};

    function initMap() {
      const styleUrl = OLA_TOKEN 
        ? 'https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json'
        : {
            version: 8,
            sources: {
              'voyager': {
                type: 'raster',
                tiles: ['https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png'],
                tileSize: 256
              }
            },
            layers: [{ id: 'voyager-layer', type: 'raster', source: 'voyager', minzoom: 0, maxzoom: 19 }]
          };

      map = new maplibregl.Map({
        container: 'map',
        style: styleUrl,
        center: [${center.longitude}, ${center.latitude}],
        zoom: ${zoom},
        transformRequest: function(url, resourceType) {
          if (OLA_TOKEN && url.indexOf('api.olamaps.io') !== -1) {
            return {
              url: url,
              headers: {
                'Authorization': 'Bearer ' + OLA_TOKEN
              }
            };
          }
          return { url: url };
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

      map.on('error', function(err) {
        console.log('MapLibre internal error:', err);
      });
    }

    function updateMarkers(markers) {
      if (!map) return;
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
          const type = (m.vehicleType || '').toLowerCase();
          el.innerText = type.includes('auto') ? '🛺' : (type.includes('ambulance') ? '🚑' : (type.includes('bike') ? '🏍️' : '🚗'));
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
        if (Array.isArray(c)) return [c[1], c[0]];
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

  useEffect(() => {
    if (webViewRef.current && center) {
      const script = `if (typeof setCenter === 'function') { setCenter(${center.latitude}, ${center.longitude}, ${zoom}); } true;`;
      webViewRef.current.injectJavaScript(script);
    }
  }, [center.latitude, center.longitude, zoom]);

  useEffect(() => {
    if (webViewRef.current && markers) {
      const script = `if (typeof updateMarkers === 'function') { updateMarkers(${JSON.stringify(markers)}); } true;`;
      webViewRef.current.injectJavaScript(script);
    }
  }, [markers]);

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

  if (!isTokenLoaded) {
    return (
      <View style={[styles.container, styles.loading, style]}>
        <ActivityIndicator size="large" color="#E5A915" />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent, baseUrl: 'https://api.olamaps.io' }}
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
