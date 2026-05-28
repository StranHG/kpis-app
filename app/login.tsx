import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import { router } from 'expo-router';
import { Brand } from '@/constants/theme';

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
      <Image source={require('@/assets/images/repartidor.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>DiDi Food</Text>
      <Text style={styles.subtitle}>Panel gerencial</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Correo"
          placeholderTextColor={Brand.subtext}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor={Brand.subtext}
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
  container: { flex: 1, backgroundColor: Brand.bg, padding: 30, justifyContent: 'center' },

  logo: { width: 120, height: 120, alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 32, fontWeight: 'bold', color: Brand.accent, textAlign: 'center' },
  subtitle: { fontSize: 16, color: Brand.subtext, textAlign: 'center', marginBottom: 48 },
  form: { backgroundColor: Brand.card, borderRadius: 20, padding: 24, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  label: { fontSize: 13, color: Brand.subtext, marginBottom: 8, textTransform: 'uppercase' },
  input: { backgroundColor: Brand.bg, borderRadius: 10, padding: 14, color: Brand.text, marginBottom: 20, fontSize: 15, borderWidth: 1, borderColor: Brand.border },
  button: { backgroundColor: Brand.accent, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  hint: { fontSize: 11, color: Brand.subtext, textAlign: 'center', marginTop: 20, lineHeight: 18 },
});
