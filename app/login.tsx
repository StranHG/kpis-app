import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa tu email y contraseña');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      if (email === 'didifood@gmail.com' && password === 'didi123') {
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', 'Credenciales incorrectas');
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🛵</Text>
      <Text style={styles.title}>DiDi Food</Text>
      <Text style={styles.subtitle}>Panel gerencial</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Correo"
          placeholderTextColor="#475569"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor="#475569"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Iniciar sesión</Text>
          }
        </TouchableOpacity>

        <Text style={styles.hint}>Usuario: didifood@gmail.com{'\n'}Contraseña: didi123</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 30, justifyContent: 'center' },
  logo: { fontSize: 60, textAlign: 'center', marginBottom: 16 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#FF6B35', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#94a3b8', textAlign: 'center', marginBottom: 48 },
  form: { backgroundColor: '#1e293b', borderRadius: 20, padding: 24 },
  label: { fontSize: 13, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase' },
  input: { backgroundColor: '#0f172a', borderRadius: 10, padding: 14, color: '#fff', marginBottom: 20, fontSize: 15 },
  button: { backgroundColor: '#FF6B35', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  hint: { fontSize: 11, color: '#475569', textAlign: 'center', marginTop: 20, lineHeight: 18 },
});