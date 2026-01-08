// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Block react-native-maps native components from web builds
config.resolver.blockList = [
  ...(config.resolver.blockList || []),
  // Block native map components on web
  /react-native-maps\/lib\/.*NativeComponent/,
];

// Configure resolver to handle native-only modules on web
const defaultResolver = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Replace react-native-maps with web mock on web platform
  if (platform === 'web' && moduleName === 'react-native-maps') {
    return {
      type: 'sourceFile',
      filePath: require.resolve('./src/mocks/react-native-maps.web.js'),
    };
  }
  
  // Use default resolution for everything else
  if (defaultResolver) {
    return defaultResolver(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
