import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../store/authSlice';
import { api } from '../../services/api';
import { colors } from '../../theme/colors';

export const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();

  const handleLogin = async () => {
    console.log('Login button pressed! Email:', email, 'Password length:', password.length);
    try {
      const res = await api.post('/auth/login', { email, password });
      console.log('Login success:', res.data);
      dispatch(setCredentials({ 
        user: res.data.data.user, 
        token: res.data.data.accessToken 
      }));
    } catch (err: any) {
      console.error('Login error:', err, 'Response:', err.response?.data);
      Alert.alert('Login Failed', err.response?.data?.message || err.message || 'Check your credentials.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>IEM Dating App</Text>
      
      <TextInput 
        style={styles.input} 
        placeholder="Email (@iemkolkata.edu.in)" 
        value={email} 
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholderTextColor={colors.textLight}
      />
      
      <TextInput 
        style={styles.input} 
        placeholder="Password" 
        value={password} 
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor={colors.textLight}
      />
      
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    justifyContent: 'center', 
    backgroundColor: colors.background 
  },
  title: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    color: colors.primary, 
    textAlign: 'center', 
    marginBottom: 40 
  },
  input: { 
    height: 55, 
    backgroundColor: colors.inputBackground, 
    borderRadius: 10, 
    paddingHorizontal: 15, 
    marginBottom: 15, 
    fontSize: 16 
  },
  button: { 
    backgroundColor: colors.primary, 
    height: 55, 
    borderRadius: 10, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginTop: 10
  },
  buttonText: { 
    color: colors.background, 
    fontSize: 18, 
    fontWeight: 'bold' 
  }
});
