// Polyfill to prevent setCustomSourceTransformer error
// This MUST run before any other modules load, especially react-native-maps
// AGGRESSIVE PATCH: Patch resolveAssetSource IMMEDIATELY when this module loads

(function patchResolveAssetSourceImmediately() {
  'use strict';
  
  // Patch function - patches resolveAssetSource.setCustomSourceTransformer
  const patchResolveAssetSource = function(resolveAssetSource) {
    if (!resolveAssetSource) return false;
    
    // CRITICAL: Patch BEFORE anything can call it
    if (typeof resolveAssetSource.setCustomSourceTransformer === 'undefined') {
      // Use Object.defineProperty for immediate definition
      Object.defineProperty(resolveAssetSource, 'setCustomSourceTransformer', {
        value: function() {
          // No-op: This API is deprecated and not needed in Expo Go
          // Prevents "is not a function (it is undefined)" errors
        },
        writable: true,
        enumerable: true,
        configurable: true,
      });
      return true;
    } else if (typeof resolveAssetSource.setCustomSourceTransformer !== 'function') {
      // If it exists but isn't a function, replace it
      resolveAssetSource.setCustomSourceTransformer = function() {
        // No-op
      };
      return true;
    }
    return true; // Already a function
  };
  
  // Try to patch resolveAssetSource IMMEDIATELY (primary path)
  try {
    const resolveAssetSource = require('react-native/Libraries/Image/resolveAssetSource');
    if (resolveAssetSource) {
      patchResolveAssetSource(resolveAssetSource);
    }
  } catch (e1) {
    // Try alternative path
    try {
      const resolveAssetSource = require('react-native/src/Libraries/Image/resolveAssetSource');
      if (resolveAssetSource) {
        patchResolveAssetSource(resolveAssetSource);
      }
    } catch (e2) {
      // Both paths failed - will try again when react-native loads
      // This is OK, the mock file also patches it
    }
  }
})();
