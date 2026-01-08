// Mock react-native-maps for Expo Go (it requires native builds and doesn't work in Expo Go)
// This mock prevents the setCustomSourceTransformer error

// CRITICAL: Patch setCustomSourceTransformer IMMEDIATELY - this MUST run first
// This patches resolveAssetSource before ANY module can require react-native-maps
// NOTE: Metro requires static require() calls, not dynamic ones
(function patchResolveAssetSourceImmediately() {
  'use strict';
  
  let resolveAssetSource = null;
  
  // Try primary path (static require for Metro compatibility)
  try {
    resolveAssetSource = require('react-native/Libraries/Image/resolveAssetSource');
  } catch (e1) {
    // Try alternative path
    try {
      resolveAssetSource = require('react-native/src/Libraries/Image/resolveAssetSource');
    } catch (e2) {
      // Both paths failed - polyfill will handle it
      return;
    }
  }
  
  if (resolveAssetSource) {
    // CRITICAL: Define setCustomSourceTransformer BEFORE any code can call it
    if (typeof resolveAssetSource.setCustomSourceTransformer === 'undefined') {
      // Use Object.defineProperty for immediate patching
      Object.defineProperty(resolveAssetSource, 'setCustomSourceTransformer', {
        value: function() {
          // No-op: This API is deprecated and not needed in Expo Go
          // Prevents "is not a function (it is undefined)" errors
        },
        writable: true,
        enumerable: true,
        configurable: true,
      });
    } else if (typeof resolveAssetSource.setCustomSourceTransformer !== 'function') {
      // If it exists but isn't a function, replace it
      resolveAssetSource.setCustomSourceTransformer = function() {
        // No-op
      };
    }
  }
})();

// Lazy load React to avoid require cycle and ensure it's available
const getReact = () => require('react');
const getReactNative = () => require('react-native');

// Mock MapView component - use function component instead of forwardRef to avoid React loading issues
const MapView = function MapView({ children, style, ...props }) {
  const React = getReact();
  const { View, Text } = getReactNative();
  
  // Handle ref if provided
  if (props.ref) {
    const refMethods = { 
      animateToRegion: () => {}, 
      fitToCoordinates: () => {},
      animateToCoordinate: () => {},
      getCamera: () => Promise.resolve({}),
    };
    
    if (typeof props.ref === 'function') {
      props.ref(refMethods);
    } else if (props.ref && typeof props.ref === 'object' && 'current' in props.ref) {
      props.ref.current = refMethods;
    }
  }
  
  // Remove ref from props before passing to View
  const { ref, ...viewProps } = props;

  return React.createElement(View, { 
    ...viewProps,
    style: [style, { backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', padding: 20, minHeight: 200 }] 
  }, [
    React.createElement(Text, { 
      key: 'text1',
      style: { color: '#6B7280', fontSize: 16, textAlign: 'center', fontWeight: '600' } 
    }, '🗺️ Map features unavailable'),
    React.createElement(Text, { 
      key: 'text2',
      style: { color: '#9CA3AF', fontSize: 12, marginTop: 8, textAlign: 'center' } 
    }, 'Map features require a development build\nand are not available in Expo Go'),
    children
  ].filter(Boolean));
};

MapView.displayName = 'MapView';

// Mock Marker component - use function without JSX to avoid React loading issues
const Marker = function Marker({ children, ...props }) {
  const React = getReact();
  const { View } = getReactNative();
  return React.createElement(View, props, children);
};

// Mock Polyline component  
const Polyline = function Polyline() {
  return null;
};

// Mock PROVIDER_DEFAULT
const PROVIDER_DEFAULT = undefined;

// Mock AnimatedMapView (used as Animated)
const AnimatedMapView = MapView;

// Mock MAP_TYPES
const MAP_TYPES = {
  STANDARD: 'standard',
  SATELLITE: 'satellite',
  HYBRID: 'hybrid',
  TERRAIN: 'terrain',
  MUTEDSTANDARD: 'mutedStandard',
};

// Create module exports object matching react-native-maps structure
const MapsModule = {
  default: MapView,
  MapView,
  Marker,
  Polyline,
  PROVIDER_DEFAULT,
  Animated: AnimatedMapView,
  AnimatedMapView,
  MAP_TYPES,
  // Additional exports that react-native-maps might export
  Circle: () => null,
  Polygon: () => null,
  Heatmap: () => null,
  Overlay: () => null,
  Callout: () => null,
  CalloutSubview: () => null,
  UrlTile: () => null,
  WMSTile: () => null,
  LocalTile: () => null,
};

// Export using both CommonJS and ES module style for compatibility
module.exports = MapsModule;
module.exports.default = MapView;
module.exports.MapView = MapView;
module.exports.Marker = Marker;
module.exports.Polyline = Polyline;
module.exports.PROVIDER_DEFAULT = PROVIDER_DEFAULT;
module.exports.Animated = AnimatedMapView;
module.exports.AnimatedMapView = AnimatedMapView;
module.exports.MAP_TYPES = MAP_TYPES;
