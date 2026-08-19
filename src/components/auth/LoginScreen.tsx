import React, { useEffect, useState } from 'react';
import {
  StyleSheet, Text, TextInput, TouchableOpacity, View, Image, ActivityIndicator
} from 'react-native';
import { useFonts, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { Oswald_400Regular, Oswald_600SemiBold, Oswald_700Bold } from '@expo-google-fonts/oswald';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../FirebaseConfig'; // adjust path if needed
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen({ navigation }: any) {
  const [fontsLoaded] = useFonts({ BebasNeue_400Regular, Oswald_400Regular, Oswald_600SemiBold, Oswald_700Bold });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      if (user) {
        navigation.replace('Detail');
      }
    });
    return unsub;
  }, [navigation]);

  if (!fontsLoaded) return null;

  const handleLogin = async () => {
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // navigation.replace('Detail'); // optional, since onAuthStateChanged handles it
    } catch (err: any) {
      const code = err.code ?? err.message;
      if (code.includes('auth/user-not-found')) setError('No account found for that email.');
      else if (code.includes('auth/wrong-password')) setError('Incorrect password.');
      else if (code.includes('auth/invalid-email')) setError('Invalid email address.');
      else setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.borderBox}>
        <Text style={styles.heading}>HELLO!{"\n"}LOGIN TO GET STARTED</Text>

        <View style={styles.blackBox}>
          <TextInput
            style={styles.BoxText}
            placeholder="ENTER EMAIL"
            placeholderTextColor="black"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail} />
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              placeholder="ENTER PASSWORD"
              placeholderTextColor="black"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
              <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={22} color="black" />
            </TouchableOpacity>
          </View>
        </View>

        {error ? (
          <Text style={{ color: 'red', textAlign: 'center', marginVertical: 8 }}>{error}</Text>
        ) : null}

        <TouchableOpacity style={styles.loginBox} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator /> : <Text style={styles.text}>LOGIN</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('SignUp')}>
          <Text style={styles.link}>Don't have an account?{'\n'}Click to sign up</Text>
        </TouchableOpacity>

        <View style={styles.line} />

        <Text style={styles.orText}>or login with</Text>

        <View style={styles.socialContainer}>
          <TouchableOpacity style={styles.iconBox}>
            <Image source={require('./assets/google.png')} style={styles.icon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBox}>
            <Image source={require('./assets/facebook.png')} style={styles.icon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBox}>
            <Image source={require('./assets/apple.png')} style={styles.icon} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },

  borderBox: {
    borderWidth: 4,
    borderColor: 'black',
    backgroundColor: 'white',
    width: 380,
    height: 840,
    borderRadius: 20,
    overflow: 'hidden',
  },

  mainBox: {
    borderWidth: 3,
    borderColor: 'black',
    backgroundColor: 'white',
    width: 340,
    height: 58,
    marginTop: 30,
    marginBottom: 30,
    alignSelf: 'center',
    borderRadius: 14,
  },

  loginBox: {
    borderWidth: 3,
    borderColor: 'black',
    backgroundColor: 'black',
    fontFamily: 'BebasNeue_400Regular',
    width: 340,
    height: 58,
    marginBottom: 10,
    marginTop: 10,
    justifyContent: 'center',
    alignSelf: 'center',
    alignItems: 'center',
    borderRadius: 14,
  },

  iconBox: {
    borderWidth: 4,
    borderColor: 'black',
    backgroundColor: 'white',
    width: 55,
    height: 55,
    resizeMode: 'contain',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    borderRadius: 14,
  },

  icon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },

  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: -10,
  },

  BoxText: {
    padding: 14,
    fontSize: 15,
    fontWeight: 'bold',
    color: 'black',
    letterSpacing: 2,
    fontFamily: 'Oswald_600SemiBold',
    textAlign: 'left',
    width: 310,
    height: 50,
    backgroundColor: 'white',
    borderWidth: 3,
    borderColor: 'black',
    borderRadius: 14,
    alignSelf: 'center',
    marginTop: 15,
    marginBottom: 15,
  },

  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    width: 310,
    marginTop: 15,
    marginBottom: 15,
  },

  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 15,
    fontWeight: 'bold',
    color: 'black',
    letterSpacing: 2,
    fontFamily: 'Oswald_600SemiBold',
    textAlign: 'left',
    height: 50,
    backgroundColor: 'white',
    borderWidth: 3,
    borderColor: 'black',
    borderRadius: 14,
  },

  eyeButton: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },

  eyeIcon: {
    fontSize: 20,
  },

  text: {
    padding: 12,
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 6,
    fontFamily: 'BebasNeue_400Regular',
    textAlign: 'center',
    justifyContent: 'center',
    width: '100%',
    textTransform: 'uppercase',
  },

  orText: {
    padding: 10,
    fontSize: 14,
    fontWeight: '600',
    color: 'black',
    letterSpacing: 2,
    fontFamily: 'Oswald_400Regular',
    textAlign: 'center',
    textTransform: 'uppercase',
  },

  link: {
    padding: 12,
    fontSize: 13,
    fontWeight: '600',
    color: 'black',
    letterSpacing: 1.5,
    fontFamily: 'Oswald_400Regular',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },


  heading: {
    padding: 16,
    fontSize: 32,
    fontWeight: 'bold',
    color: 'black',
    letterSpacing: 3,
    fontFamily: 'BebasNeue_400Regular',
    textAlign: 'left',
    marginBottom: 30,
    lineHeight: 42,
  },

  blackBox: {
    width: 340,
    height: 300,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignSelf: 'center',
    borderRadius: 16,
  },
  line: {
    alignContent: 'flex-end',
    height: 4,
    backgroundColor: 'black',
    marginTop: 15,
    marginHorizontal: 16,
    borderRadius: 2,
  },

});

