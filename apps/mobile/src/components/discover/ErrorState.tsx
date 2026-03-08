import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface ErrorStateProps {
  message?: string;
  onRetry: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ 
  message = "We can't reach our servers", 
  onRetry 
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.title}>Connection Issues</Text>
      <Text style={styles.subtitle}>{message}</Text>
      
      <TouchableOpacity style={styles.button} onPress={onRetry}>
        <Text style={styles.buttonText}>Retry Connection</Text>
      </TouchableOpacity>
      
      <Text style={styles.offlineText}>
        You'll see more profiles when you're back online.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#f9f9f9',
  },
  icon: {
    fontSize: 60,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#333',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  offlineText: {
    marginTop: 20,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  }
});

export default ErrorState;
