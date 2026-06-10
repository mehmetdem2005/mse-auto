module.exports = (api) => {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }], "nativewind/babel"],
    // Reanimated worklet derlemesi — LİSTENİN SONUNDA olmalı (resmi kural).
    plugins: ["react-native-reanimated/plugin"],
  };
};
