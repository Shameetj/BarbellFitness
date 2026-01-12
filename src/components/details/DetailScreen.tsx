import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DetailScreen({ navigation }: any) {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_700Bold });

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');

  if (!fontsLoaded) return null;

  const handleProfilePhoto = () => {
    Alert.alert('Profile Photo', 'Feature to upload a profile photo is under development.');
  };

  const persistProfile = async (profile: object) => {
    try {
      await AsyncStorage.setItem('user_profile', JSON.stringify(profile));
    } catch (e) {
      console.warn('Failed saving profile to storage', e);
    }
  };

  const handleNewMembership = async () => {
    if (!fullName.trim() || !phoneNumber.trim() || !dateOfBirth.trim() || !address.trim()) {
      Alert.alert('Error', 'Please fill out all fields before proceeding.');
      return;
    }

    const profile = {
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      dateOfBirth: dateOfBirth.trim(),
      address: address.trim(),
    };

    // Save to AsyncStorage so Profile tab can read later
    await persistProfile(profile);

    // Navigate to Main -> Profile tab and pass params so Profile shows immediately
    navigation.navigate('MemberPlan', {
      screen: 'Profile',
      params: profile,
    });
  };

  const handleOldMembership = () => {
    Alert.alert('Old Membership', 'Feature for old gym members is under development.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.borderBox}>
        <Text style={styles.heading}>PROFILE INFORMATION</Text>

        <View style={styles.mainBox}>
          <TextInput
            style={styles.BoxText}
            placeholder="FULL NAME"
            placeholderTextColor="black"
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        <View style={styles.mainBox}>
          <TextInput
            style={styles.BoxText}
            placeholder="PHONE NUMBER"
            placeholderTextColor="black"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
        </View>

        <View style={styles.mainBox}>
          <TextInput
            style={styles.BoxText}
            placeholder="DATE OF BIRTH"
            placeholderTextColor="black"
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
          />
        </View>

        <View style={styles.mainBox}>
          <TextInput
            style={styles.BoxText}
            placeholder="ADDRESS"
            placeholderTextColor="black"
            value={address}
            onChangeText={setAddress}
          />
        </View>

        <TouchableOpacity style={styles.loginBox} onPress={handleProfilePhoto}>
          <Text style={styles.BoxText}>PROFILE PHOTO</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.blackBox} onPress={handleNewMembership}>
          <Text style={styles.text2}>NEW GYM MEMBERSHIP</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.blackBox} onPress={handleOldMembership}>
          <Text style={styles.text2}>OLD GYM MEMBER</Text>
        </TouchableOpacity>
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
    borderWidth: 5,
    borderColor: 'black',
    backgroundColor: 'white',
    width: 380,
    height: 840,
  },
  mainBox: {
    borderWidth: 5,
    borderColor: 'black',
    backgroundColor: 'white',
    width: 350,
    height: 60,
    marginBottom: 50,
    alignSelf: 'center',
  },
  loginBox: {
    borderWidth: 5,
    borderColor: 'black',
    backgroundColor: 'white',
    width: 350,
    height: 60,
    marginBottom: 15,
    alignSelf: 'center',
  },
  BoxText: {
    padding: 12,
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
    letterSpacing: 4,
    fontFamily: 'Inter_700Bold',
    textAlign: 'left',
    width: '100%',
  },
  text: {
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
  text2: {
    padding: 12,
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 4,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  heading: {
    padding: 12,
    fontSize: 22,
    fontWeight: 'bold',
    color: 'black',
    letterSpacing: 4,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  blackBox: {
    width: 350,
    height: 60,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 30,
  },
});