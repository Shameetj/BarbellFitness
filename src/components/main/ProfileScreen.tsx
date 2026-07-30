import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFonts, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { Oswald_400Regular, Oswald_600SemiBold, Oswald_700Bold } from '@expo-google-fonts/oswald';
import { useRoute, RouteProp, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOut } from 'firebase/auth';
import { auth } from '../../FirebaseConfig';

type ProfileParams = {
  Profile: {
    fullName?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    address?: string;
  };
};

export default function ProfileScreen({ navigation }: any) {
  const [fontsLoaded] = useFonts({ BebasNeue_400Regular, Oswald_400Regular, Oswald_600SemiBold, Oswald_700Bold });
  const route = useRoute<RouteProp<ProfileParams, 'Profile'>>();
  const isFocused = useIsFocused();
  const params = route.params ?? {};

  const [profile, setProfile] = useState({
    fullName: params.fullName ?? '-',
    phoneNumber: params.phoneNumber ?? '-',
    dateOfBirth: params.dateOfBirth ?? '-',
    address: params.address ?? '-',
  });

  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (params && Object.keys(params).length) {
        if (mounted) setProfile({
          fullName: params.fullName ?? '-',
          phoneNumber: params.phoneNumber ?? '-',
          dateOfBirth: params.dateOfBirth ?? '-',
          address: params.address ?? '-',
        });
        return;
      }

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
        const rawImage = await AsyncStorage.getItem('user_profile_image');
        if (rawImage && mounted) {
          setProfileImage(rawImage);
        }
      } catch (e) {
        console.warn('Failed loading profile from storage', e);
      }
    };

    if (isFocused) load();

    return () => { mounted = false; };
  }, [isFocused, route.params]);

  if (!fontsLoaded) return null;

  const handleSelectPhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permission Denied', 'You need to allow camera access to take a photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setProfileImage(result.assets[0].uri);
      await AsyncStorage.setItem('user_profile_image', result.assets[0].uri);
    }
  };

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

        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>BACK</Text>
        </TouchableOpacity>

        <Text style={styles.heading}>PROFILE DETAILS</Text>

        <TouchableOpacity style={styles.profileImageContainer} onPress={handleSelectPhoto}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <Text style={styles.photoText}>Tap to add photo</Text>
          )}
        </TouchableOpacity>

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
        </View>

        <TouchableOpacity style={styles.button} onPress={handleLogout}>
          <Text style={styles.buttonText}>LOGOUT</Text>
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
    borderWidth: 4,
    borderColor: 'black',
    width: 380,
    padding: 20,
    paddingBottom: 40,
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
  },
  mainBox: {
    borderWidth: 3,
    borderColor: 'black',
    backgroundColor: 'white',
    width: 340,
    height: 50,
    alignSelf: 'center',
    marginTop: 5,
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  heading: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 3,
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 8,
    fontFamily: 'BebasNeue_400Regular',
    lineHeight: 42,
  },
  profileImageContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: 'black',
    alignSelf: 'center',
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: 'white',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  photoText: {
    fontFamily: 'Oswald_600SemiBold',
    color: 'gray',
    textAlign: 'center',
    padding: 10,
  },
  infoBox: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
    marginTop: 20,
    fontFamily: 'Oswald_600SemiBold',
    letterSpacing: 1,
  },
  value: {
    fontSize: 16,
    color: 'gray',
    fontFamily: 'Oswald_400Regular',
  },
  button: {
    backgroundColor: 'black',
    padding: 15,
    marginVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    borderRadius: 14,
  },
  buttonText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'BebasNeue_400Regular',
    letterSpacing: 6,
  },
  backButton: {
    position: 'absolute',
    top: 25,
    left: 20,
    zIndex: 10,
    borderBottomWidth: 2,
    borderColor: 'black',
  },
  backButtonText: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 16,
    color: 'black',
  },
});
