import React, { useState } from 'react';
import {
  StyleSheet, Text, TextInput, TouchableOpacity, View, Image, ActivityIndicator
} from 'react-native';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../../FirebaseConfig'; // ← adjust this path if needed

export default function SignUpScreen({ navigation }: any) {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_700Bold });
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!fontsLoaded) return null;

  const handleSignUp = async () => {
    setError(null);

    // Basic validation
    if (!username.trim()) {
      setError('Please enter a username.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter an email.');
      return;
    }
    if (!password) {
      setError('Please enter a password.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      // Create account
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      // Optionally set displayName
      if (userCredential.user && username.trim()) {
        await updateProfile(userCredential.user, { displayName: username.trim() });
      }
      // Replace navigation to Detail so user can't go back to signup/login
      navigation.replace('Detail');
    } catch (err: any) {
      // Map common firebase errors to friendly messages
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
          <View style={styles.mainBox}>
            <TextInput
              style={styles.BoxText}
              placeholder="ENTER USERNAME"
              placeholderTextColor="black"
              autoCapitalize="words"
              value={username}
              onChangeText={setUsername}
            />
          </View>

          <View style={styles.mainBox}>
            <TextInput
              style={styles.BoxText}
              placeholder="ENTER EMAIL"
              placeholderTextColor="black"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.mainBox}>
            <TextInput
              style={styles.BoxText}
              placeholder="ENTER PASSWORD"
              placeholderTextColor="black"
              secureTextEntry={true}
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <View style={styles.mainBox}>
            <TextInput
              style={styles.BoxText}
              placeholder="CONFIRM PASSWORD"
              placeholderTextColor="black"
              secureTextEntry={true}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>
        </View>

        {error ? (
          <Text style={{ color: 'red', textAlign: 'center', marginVertical: 8 }}>{error}</Text>
        ) : null}

        <TouchableOpacity style={styles.mainBox} onPress={handleSignUp} disabled={loading}>
          {loading ? <ActivityIndicator /> : <Text style={styles.text}>SIGN UP</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.mainBox} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.text}>LOGIN</Text>
        </TouchableOpacity>

        <View style={styles.line} />

        <Text style={styles.text}>or login with</Text>

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

  borderBox:{
    borderWidth: 5,
    borderColor: 'black',
    backgroundColor: 'white',
    width: 380,
    height: 840,
   
  },

  mainBox:{
    borderWidth: 5,
    borderColor: 'black',
    backgroundColor: 'white',
    width: 350,
    height: 60,
  marginTop: 10,
  alignSelf: 'center',
  },

  iconBox:{
    borderWidth: 5,
    borderColor: 'black',
    backgroundColor: 'white',
    width: 75,
    height: 75,
  marginTop: 10,
  resizeMode: 'contain',
  alignSelf: 'center',
  justifyContent: 'center',
  alignItems: 'center',
  },

  icon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },

  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  BoxText:{
    padding: 12,
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
    letterSpacing: 4,
    fontFamily: 'Inter_700Bold',
    textAlign: 'left',
    width: '100%',
  },

  text:{
    padding: 12,
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
    letterSpacing: 4,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    justifyContent: 'flex-start',
    width: '100%',
  },

  heading:{
    padding: 12,
    fontSize: 22,
    fontWeight: 'bold',
    color: 'black',
    letterSpacing: 4,
    fontFamily: 'Inter_700Bold',
    textAlign: 'left',
   
  },

  blackBox: {
    width: 350,
    height: 400,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignSelf: 'center',
  marginTop: 10,

  },
  line: {
    height: 6,
    backgroundColor: 'black', 
    marginVertical: 10,
  },
});

