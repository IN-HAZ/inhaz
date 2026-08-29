import { View, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

export default function PdfRenderer({ uri, onError }: { uri: string; onError?: () => void }) {
  return (
    <WebView
      source={{ uri }}
      originWhitelist={['file://*', 'http://*', 'https://*']}
      javaScriptEnabled
      onError={onError}
      startInLoadingState
      renderLoading={() => (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4B2861" />
        </View>
      )}
    />
  );
}