import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Platform,
  Image,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  useWindowDimensions,
} from 'react-native';
import { useFonts, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { Oswald_400Regular, Oswald_600SemiBold, Oswald_700Bold } from '@expo-google-fonts/oswald';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { auth } from '../../FirebaseConfig';
import { localDateString, saveProfile, saveProfileImage, saveMembership, getProfile, getMembership, type UserProfile } from '../../lib/userStorage';
import type { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Detail'>;

export default function DetailScreen({ navigation }: Props) {
  const [fontsLoaded] = useFonts({
    BebasNeue_400Regular,
    Oswald_400Regular,
    Oswald_600SemiBold,
    Oswald_700Bold,
  });

  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 32, 420);

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [address, setAddress] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');

  if (!fontsLoaded) return null;

  const onDateChange = (_event: unknown, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDateOfBirth(localDateString(selectedDate));
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
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('You must be signed in to save a photo.');
      setProfileImage(await saveProfileImage(uid, result.assets[0].uri));
    }
  };

  const handleNewMembership = async () => {
    if (!fullName.trim() || !phoneNumber.trim() || !dateOfBirth.trim() || !address.trim() || !age.trim()) {
      Alert.alert('Error', 'Please fill out all fields before proceeding.');
      return;
    }

    const profile: UserProfile = {
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      dateOfBirth: dateOfBirth.trim(),
      address: address.trim(),
      age: age.trim(),
      gender: gender,
      role: 'member',
    };

    const uid = auth.currentUser?.uid;
    if (!uid) {
      Alert.alert('Session expired', 'Please sign in again.');
      navigation.replace('Login');
      return;
    }
    try {
      await saveProfile(uid, profile);
      navigation.navigate('MemberPlan');
    } catch (error) {
      console.warn('Failed saving profile', error);
      Alert.alert('Could not save profile', 'Your details were not saved. Please try again.');
    }
  };

  const handleOldMembership = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      Alert.alert('Session expired', 'Please sign in again.');
      navigation.replace('Login');
      return;
    }

    try {
      // Check if an existing profile already exists for this user
      const existingProfile = await getProfile(uid);
      const existingMembership = await getMembership(uid);

      if (existingProfile && existingMembership) {
        // Old account found — go straight to home
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
        return;
      }

      // No existing data found — require form fields
      if (!fullName.trim() || !phoneNumber.trim() || !dateOfBirth.trim() || !address.trim() || !age.trim()) {
        Alert.alert('Error', 'No existing account found. Please fill out all fields to continue.');
        return;
      }

      const profile: UserProfile = {
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        dateOfBirth: dateOfBirth.trim(),
        address: address.trim(),
        age: age.trim(),
        gender: gender,
        role: 'member',
      };

      await saveProfile(uid, profile);

      // Create a default membership active for 1 year for old gym members
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);

      const membership = {
        plan: 'Standard' as const,
        startDate: localDateString(startDate),
        endDate: localDateString(endDate),
        createdAt: startDate.toISOString(),
      };

      await saveMembership(uid, membership);

      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (error) {
      console.warn('Failed saving profile/membership', error);
      Alert.alert('Error', 'Could not retrieve old membership details. Please try again.');
    }
  };

  return (
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
            style={styles.keyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
              contentContainerStyle={[styles.scrollContent, { width: contentWidth }]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              <View style={styles.header}>
                <Text style={styles.heading}>PROFILE</Text>
                <Text style={styles.subHeading}>MEMBER INFORMATION</Text>
              </View>

              <View style={styles.form}>
                <Text style={styles.label}>FULL NAME</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter full name"
                    placeholderTextColor="#8A8A8A"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                />

                <Text style={styles.label}>PHONE NUMBER</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter phone number"
                    placeholderTextColor="#8A8A8A"
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                />

                <Text style={styles.label}>DATE OF BIRTH</Text>
                {Platform.OS === 'web' ? (
                    <TextInput
                        style={styles.input}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#8A8A8A"
                        value={dateOfBirth}
                        onChangeText={setDateOfBirth}
                    />
                ) : (
                    <>
                      <TouchableOpacity
                          style={styles.input}
                          onPress={() => setShowDatePicker(true)}
                          activeOpacity={0.75}
                      >
                        <Text style={dateOfBirth ? styles.inputText : styles.placeholderText}>
                          {dateOfBirth || 'Select date of birth'}
                        </Text>
                      </TouchableOpacity>

                      {showDatePicker && (
                          <DateTimePicker
                              value={dateOfBirth ? new Date(`${dateOfBirth}T00:00:00`) : new Date()}
                              mode="date"
                              display="default"
                              onChange={onDateChange}
                              maximumDate={new Date()}
                          />
                      )}
                    </>
                )}

                <View style={{ flexDirection: 'row', marginBottom: 15, marginTop: 15 }}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.label}>AGE</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. 25"
                        placeholderTextColor="#8A8A8A"
                        keyboardType="numeric"
                        value={age}
                        onChangeText={setAge}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.label}>GENDER</Text>
                    <View style={styles.genderRow}>
                      {['Male', 'Female'].map(g => (
                        <TouchableOpacity
                          key={g}
                          style={[
                            styles.genderOption,
                            gender === g && styles.genderOptionSelected,
                          ]}
                          onPress={() => setGender(g)}
                        >
                          <Text
                            style={[
                              styles.genderOptionText,
                              gender === g && styles.genderOptionTextSelected,
                            ]}
                          >
                            {g.toUpperCase()}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                <Text style={styles.label}>ADDRESS</Text>
                <TextInput
                    style={[styles.input, styles.addressInput]}
                    placeholder="Enter address"
                    placeholderTextColor="#8A8A8A"
                    value={address}
                    onChangeText={setAddress}
                    multiline
                    textAlignVertical="top"
                />

                <Text style={styles.label}>PROFILE PHOTO</Text>
                <TouchableOpacity
                    style={styles.photoButton}
                    onPress={handleProfilePhoto}
                    activeOpacity={0.8}
                >
                  {profileImage ? (
                      <Image source={{ uri: profileImage }} style={styles.photoPreview} />
                  ) : (
                      <>
                        <Text style={styles.cameraIcon}>+</Text>
                        <Text style={styles.photoButtonText}>ADD PHOTO</Text>
                        <Text style={styles.photoHint}>Tap to open camera</Text>
                      </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleNewMembership}
                    activeOpacity={0.8}
                >
                  <Text style={styles.primaryButtonText}>NEW MEMBERSHIP</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={handleOldMembership}
                    activeOpacity={0.8}
                >
                  <Text style={styles.secondaryButtonText}>OLD GYM MEMBER</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F2F2',
  },
  keyboardView: {
    flex: 1,
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: 16,
    paddingBottom: 32,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  heading: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 38,
    letterSpacing: 3,
    color: '#111111',
    lineHeight: 42,
  },
  subHeading: {
    marginTop: 2,
    fontFamily: 'Oswald_600SemiBold',
    fontSize: 13,
    letterSpacing: 2.5,
    color: '#777777',
  },
  form: {
    width: '100%',
  },
  label: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 13,
    letterSpacing: 1.8,
    color: '#222222',
    marginBottom: 7,
    marginLeft: 3,
  },
  input: {
    width: '100%',
    minHeight: 52,
    backgroundColor: '#F8F8F8',
    borderWidth: 1.5,
    borderColor: '#D0D0D0',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 15,
    fontFamily: 'Oswald_400Regular',
    fontSize: 16,
    color: '#111111',
    justifyContent: 'center',
  },
  inputText: {
    fontFamily: 'Oswald_400Regular',
    fontSize: 16,
    color: '#111111',
  },
  placeholderText: {
    fontFamily: 'Oswald_400Regular',
    fontSize: 16,
    color: '#8A8A8A',
  },
  addressInput: {
    height: 78,
    paddingTop: 13,
    paddingBottom: 13,
  },
  photoButton: {
    width: '100%',
    height: 120,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#D0D0D0',
    borderStyle: 'dashed',
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 20,
  },
  cameraIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#111111',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 32,
    fontSize: 28,
    fontFamily: 'Oswald_400Regular',
    marginBottom: 5,
  },
  photoButtonText: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 20,
    letterSpacing: 2,
    color: '#111111',
  },
  photoHint: {
    fontFamily: 'Oswald_400Regular',
    fontSize: 12,
    color: '#888888',
    marginTop: 1,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  primaryButton: {
    width: '100%',
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 11,
  },
  primaryButtonText: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 25,
    letterSpacing: 3,
    color: '#FFFFFF',
  },
  secondaryButton: {
    width: '100%',
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 23,
    letterSpacing: 2.5,
    color: '#111111',
  },
  genderRow: {
    flexDirection: 'row',
    height: 52,
    borderWidth: 1.5,
    borderColor: '#D0D0D0',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F8F8F8',
  },
  genderOption: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  genderOptionSelected: {
    backgroundColor: '#111111',
  },
  genderOptionText: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 12,
    color: '#8A8A8A',
  },
  genderOptionTextSelected: {
    color: 'white',
  },
});