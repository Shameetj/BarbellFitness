import React, { useEffect, useState } from 'react';
import {
  StyleSheet, Text, TextInput, TouchableOpacity, View, Image, ActivityIndicator
} from 'react-native';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../FirebaseConfig'; // adjust path if needed

export default function LoginScreen({ navigation }: any) {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_700Bold });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🔄 Auto redirect if already logged in
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
    marginTop: 30,
    marginBottom: 30,
  alignSelf: 'center',
  },

  loginBox:{
    borderWidth: 5,
    borderColor: 'black',
    backgroundColor: 'white',
    fontFamily: 'Inter_700Bold',
    width: 350,
    height: 60,
    marginBottom: 15,
    justifyContent: 'center',
    alignSelf: 'center',
    alignItems: 'center',
  },

  iconBox:{
    borderWidth: 5,
    borderColor: 'black',
    backgroundColor: 'white',
    width: 75,
    height: 75,
  resizeMode: 'contain',
  alignSelf: 'center',
  justifyContent: 'center',
  alignItems: 'center',
  marginTop: 20,
  },

  icon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },

  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: -10, 
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
    justifyContent: 'center',
    width: '100%',
  },

  link:{
    padding: 12,
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
    letterSpacing: 4,
    fontFamily: 'Inter_700Bold',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },


  heading:{
    padding: 12,
    fontSize: 22,
    fontWeight: 'bold',
    color: 'black',
    letterSpacing: 4,
    fontFamily: 'Inter_700Bold',
    textAlign: 'left',
    marginBottom: 30,
   
  },

  blackBox: {
    width: 350,
    height: 300,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignSelf: 'center',
  marginBottom: 50,
  

  },
  line: {
   alignContent:'flex-end',
    height: 6,
    backgroundColor: 'black', 
    marginTop:15,
  },

});

