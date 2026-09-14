import React, { useState } from 'react';
import {
  StyleSheet, Text, TextInput, TouchableOpacity, View, Image, ActivityIndicator
} from 'react-native';
import { useFonts, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { Oswald_400Regular, Oswald_600SemiBold, Oswald_700Bold } from '@expo-google-fonts/oswald';
import { createUserWithEmailAndPassword, updateProfile, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../../FirebaseConfig';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types/navigation';

import { resolveUserRoute } from '../../lib/userStorage';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '552125531713-ii8l769urh188qhhdqv14hsjklqk0bje.apps.googleusercontent.com',
});

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;
export default function SignUpScreen({ navigation }: Props) {
  const [fontsLoaded] = useFonts({ BebasNeue_400Regular, Oswald_400Regular, Oswald_600SemiBold, Oswald_700Bold });
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    if (loading) return;
    try {
      setError(null);
      setLoading(true);
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      const idToken = response.data?.idToken;
      if (!idToken) { setError('Google did not return an ID token.'); return; }
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
      const uid = auth.currentUser!.uid;
      const targetRoute = await resolveUserRoute(uid);
      navigation.replace(targetRoute);
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      setError('Google sign-in failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded) return null;

  const handleSignUp = async () => {
    setError(null);
    if (!username.trim()) { setError('Please enter a username.'); return; }
    if (!email.trim()) { setError('Please enter an email.'); return; }
    if (!password) { setError('Please enter a password.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (userCredential.user && username.trim()) {
        await updateProfile(userCredential.user, { displayName: username.trim() });
      }
      navigation.replace('Detail');
    } catch (err: any) {
      const code = err.code ?? err.message ?? '';
      if (code.includes('auth/email-already-in-use')) setError('This email is already in use.');
      else if (code.includes('auth/invalid-email')) setError('Invalid email address.');
      else if (code.includes('auth/weak-password')) setError('Password is too weak (min 6 characters).');
      else setError('Failed to create account. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.borderBox}>
        <Text style={styles.heading}>WELCOME TO{"\n"}BARBELL FITNESS</Text>

        <View style={styles.blackBox}>
            <TextInput
              style={styles.BoxText}
              placeholder="ENTER USERNAME"
              placeholderTextColor="black"
              autoCapitalize="words"
              value={username}
              onChangeText={setUsername}/>
            <TextInput
              style={styles.BoxText}
              placeholder="ENTER EMAIL"
              placeholderTextColor="black"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}/>
            <TextInput
              style={styles.BoxText}
              placeholder="ENTER PASSWORD"
              placeholderTextColor="black"
              secureTextEntry={true}
              value={password}
              onChangeText={setPassword}/>
            <TextInput
              style={styles.BoxText}
              placeholder="CONFIRM PASSWORD"
              placeholderTextColor="black"
              secureTextEntry={true}
              value={confirmPassword}
              onChangeText={setConfirmPassword}/>
        </View>

        {error ? (
          <Text style={{ color: 'red', textAlign: 'center', marginVertical: 8 }}>{error}</Text>
        ) : null}

        <TouchableOpacity style={styles.loginBox} onPress={handleSignUp} disabled={loading}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>SIGN UP</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Already have an account?{'\n'}Click to login</Text>
        </TouchableOpacity>

        <View style={styles.line} />

        <Text style={styles.orText}>or login with</Text>

        <View style={styles.socialContainer}>
          <TouchableOpacity style={styles.iconBox} onPress={handleGoogleSignIn}>
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
  blackBox: {
    width: 340,
    height: 400,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 10,
    borderRadius: 16,
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
  buttonText: {
    padding: 12,
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 6,
    fontFamily: 'BebasNeue_400Regular',
    textAlign: 'center',
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
    padding: 8,
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
    marginBottom: 10,
    lineHeight: 42,
  },
  line: {
    alignContent: 'flex-end',
    height: 4,
    backgroundColor: 'black',
    marginTop: 10,
    marginHorizontal: 16,
    borderRadius: 2,
  },
});
