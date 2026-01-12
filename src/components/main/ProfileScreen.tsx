import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRoute, RouteProp, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOut } from 'firebase/auth';
import { auth } from '../../FirebaseConfig'; // adjust path if you use firebase

type ProfileParams = {
  Profile: {
    fullName?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    address?: string;
  };
};

export default function ProfileScreen({ navigation }: any) {
  const route = useRoute<RouteProp<ProfileParams, 'Profile'>>();
  const isFocused = useIsFocused(); // reload when tab becomes active
  const params = route.params ?? {};

  const [profile, setProfile] = useState({
    fullName: params.fullName ?? '-',
    phoneNumber: params.phoneNumber ?? '-',
    dateOfBirth: params.dateOfBirth ?? '-',
    address: params.address ?? '-',
  });

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      // If params provided, use them (immediate)
      if (params && Object.keys(params).length) {
        if (mounted) setProfile({
          fullName: params.fullName ?? '-',
          phoneNumber: params.phoneNumber ?? '-',
          dateOfBirth: params.dateOfBirth ?? '-',
          address: params.address ?? '-',
        });
        return;
      }

      // otherwise try to read from AsyncStorage
      try {
        const raw = await AsyncStorage.getItem('user_profile');
        if (raw) {
          const stored = JSON.parse(raw);
          if (mounted) setProfile({
            fullName: stored.fullName ?? '-',
            phoneNumber: stored.phoneNumber ?? '-',
            dateOfBirth: stored.dateOfBirth ?? '-',
            address: stored.address ?? '-',
          });
        }
      } catch (e) {
        console.warn('Failed loading profile from storage', e);
      }
    };

    if (isFocused) load();

    return () => { mounted = false; };
  }, [isFocused, route.params]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      Alert.alert('Logged out', 'You have been successfully logged out.');
      navigation.replace('Login');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to log out. Try again.');
      console.error(error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.borderBox}>
      
        <Text style={styles.heading}>PROFILE DETAILS</Text>

        <View style={styles.infoBox}>
          <Text style={styles.label}>Full Name:</Text>
          <View style={styles.mainBox}>
          <Text style={styles.value}>{profile.fullName}</Text>
          </View>
          <Text style={styles.label}>Phone Number:</Text>
          <View style={styles.mainBox}>
          <Text style={styles.value}>{profile.phoneNumber}</Text>
          </View>
          <Text style={styles.label}>Date of Birth:</Text>
          <View style={styles.mainBox}>
          <Text style={styles.value}>{profile.dateOfBirth}</Text>
          </View>
          <Text style={styles.label}>Address:</Text>
          <View style={styles.mainBox}>
          <Text style={styles.value}>{profile.address}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleLogout}>
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
        
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  borderBox: {
    borderWidth: 5,
    borderColor: 'black',
    width: 380,
    height: 780,
    padding: 20,
    backgroundColor: 'white',
  },
  
  mainBox:{
    borderWidth: 5,
    borderColor: 'black',
    backgroundColor: 'white',
    width: 350,
    height: 60,
    alignSelf: 'center',
    marginTop : 5,
  },

  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 8,
  },
  email: {
    textAlign: 'center',
    color: 'gray',
    marginBottom: 10,
    fontSize: 14,
  },
  infoBox: {
    marginBottom: 30,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
    marginTop: 30,
  },
  value: {
    fontSize: 18,
    color: 'gray',
    alignContent: 'center',
    marginTop: 10,
  },

  button: {
    backgroundColor: 'black',
    padding: 15,
    marginVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },

  buttonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
