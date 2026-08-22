const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

if (process.env.EXPO_PUBLIC_WEB_PROXY === "1") {
  config.server = {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  };
}

module.exports = withNativeWind(config, { input: "./global.css" });
