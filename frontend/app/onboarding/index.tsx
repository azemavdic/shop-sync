import { View, Text, StyleSheet } from 'react-native';

export default function OnboardingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to ShopSyncX</Text>
      <Text style={styles.subtitle}>Onboarding slides - TODO</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});
