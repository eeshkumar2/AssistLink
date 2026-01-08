// Mock react-native-maps for web platform
import React from 'react';
import { View, Text } from 'react-native';

// Mock MapView component
const MapView = React.forwardRef(({ children, style, ...props }, ref) => (
  <View style={[style, { backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
    <Text style={{ color: '#6B7280', fontSize: 16, textAlign: 'center' }}>Map view not available on web</Text>
    <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 8, textAlign: 'center' }}>Please use mobile app for map features</Text>
    {children}
  </View>
));

MapView.displayName = 'MapView';

// Mock Marker component
const Marker = ({ children, ...props }) => <View>{children}</View>;

// Mock Polyline component
const Polyline = () => null;

// Mock PROVIDER_DEFAULT
const PROVIDER_DEFAULT = undefined;

// Export as default and named exports
const Maps = {
  default: MapView,
  MapView,
  Marker,
  Polyline,
  PROVIDER_DEFAULT,
};

export default Maps;
export { MapView, Marker, Polyline, PROVIDER_DEFAULT };


