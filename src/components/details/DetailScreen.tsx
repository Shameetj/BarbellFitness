import React, { useState } from 'react';
import {
  StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, Platform, Image
} from 'react-native';
import { useFonts, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { Oswald_400Regular, Oswald_600SemiBold, Oswald_700Bold } from '@expo-google-fonts/oswald';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';

export default function DetailScreen({ navigation }: any) {
  const [fontsLoaded] = useFonts({ BebasNeue_400Regular, Oswald_400Regular, Oswald_600SemiBold, Oswald_700Bold });

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [address, setAddress] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  if (!fontsLoaded) return null;

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      // Format as YYYY-MM-DD or DD/MM/YYYY
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setDateOfBirth(formattedDate);
    }
  };

  const handleProfilePhoto = async () => {
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
      const uri = result.assets[0].uri;
      setProfileImage(uri);
      await AsyncStorage.setItem('user_profile_image', uri);
    }
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

    await persistProfile(profile);

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

        <TextInput style={styles.BoxText} placeholder="FULL NAME" placeholderTextColor="black" value={fullName} onChangeText={setFullName} />
        <TextInput style={styles.BoxText} placeholder="PHONE NUMBER" placeholderTextColor="black" keyboardType="phone-pad" value={phoneNumber} onChangeText={setPhoneNumber} />
        {Platform.OS === 'web' ? (
          <TextInput 
            style={styles.BoxText} 
            placeholder="DATE OF BIRTH (YYYY-MM-DD)" 
            placeholderTextColor="black" 
            value={dateOfBirth} 
            onChangeText={setDateOfBirth} 
          />
        ) : (
          <>
            <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowDatePicker(true)}>
              <Text style={[styles.datePickerText, !dateOfBirth && styles.datePickerPlaceholder]}>
                {dateOfBirth || "DATE OF BIRTH"}
              </Text>
            </TouchableOpacity>
            
            {showDatePicker && (
              <DateTimePicker
                value={dateOfBirth ? new Date(dateOfBirth) : new Date()}
                mode="date"
                display="default"
                onChange={onDateChange}
                maximumDate={new Date()} // Can't be born in the future
              />
            )}
          </>
        )}
        <TextInput style={styles.BoxText} placeholder="ADDRESS" placeholderTextColor="black" value={address} onChangeText={setAddress} />

        <TouchableOpacity style={profileImage ? styles.imageBox : styles.loginBox} onPress={handleProfilePhoto}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.photoPreview} />
          ) : (
            <Text style={styles.loginBoxText}>PROFILE PHOTO</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.blackBox} onPress={handleNewMembership}>
          <Text style={styles.buttonText}>NEW GYM MEMBERSHIP</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.blackBox} onPress={handleOldMembership}>
          <Text style={styles.buttonText}>OLD GYM MEMBER</Text>
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
    borderWidth: 4,
    borderColor: 'black',
    backgroundColor: 'white',
    width: 380,
    height: 840,
    borderRadius: 20,
    overflow: 'hidden',
  },
  BoxText: {
    padding: 14,
    fontSize: 15,
    fontWeight: 'bold',
    color: 'black',
    letterSpacing: 2,
    fontFamily: 'Oswald_600SemiBold',
    textAlign: 'left',
    width: 340,
    height: 58,
    backgroundColor: 'white',
    borderWidth: 3,
    borderColor: 'black',
    borderRadius: 14,
    alignSelf: 'center',
    marginBottom: 30,
  },
  datePickerButton: {
    padding: 14,
    width: 340,
    height: 58,
    backgroundColor: 'white',
    borderWidth: 3,
    borderColor: 'black',
    borderRadius: 14,
    alignSelf: 'center',
    marginBottom: 30,
    justifyContent: 'center',
  },
  datePickerText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: 'black',
    letterSpacing: 2,
    fontFamily: 'Oswald_600SemiBold',
  },
  datePickerPlaceholder: {
    color: 'gray',
  },
  loginBox: {
    borderWidth: 3,
    borderColor: 'black',
    backgroundColor: 'white',
    width: 340,
    height: 58,
    marginBottom: 15,
    justifyContent: 'center',
    alignSelf: 'center',
    alignItems: 'center',
    borderRadius: 14,
  },
  loginBoxText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
    letterSpacing: 3,
    fontFamily: 'BebasNeue_400Regular',
    textTransform: 'uppercase',
  },
  imageBox: {
    width: 140,
    height: 140,
    marginBottom: 15,
    justifyContent: 'center',
    alignSelf: 'center',
    alignItems: 'center',
    borderRadius: 70,
    borderWidth: 3,
    borderColor: 'black',
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  blackBox: {
    width: 340,
    height: 58,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 20,
    borderRadius: 16,
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
  heading: {
    padding: 16,
    fontSize: 32,
    fontWeight: 'bold',
    color: 'black',
    letterSpacing: 3,
    fontFamily: 'BebasNeue_400Regular',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 42,
  },
});