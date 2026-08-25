import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image, useWindowDimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFonts, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { Oswald_400Regular, Oswald_600SemiBold, Oswald_700Bold } from '@expo-google-fonts/oswald';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signOut } from 'firebase/auth';
import { auth } from '../../FirebaseConfig';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../../types/navigation';
import { getProfile, getProfileImage, saveProfileImage, getMembership, type Membership } from '../../lib/userStorage';
import { Ionicons } from '@expo/vector-icons';

type Props = BottomTabScreenProps<MainTabParamList, 'Profile'>;

export default function ProfileScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const contentWidth = Math.min(width - 24, 380);

  const [fontsLoaded] = useFonts({ BebasNeue_400Regular, Oswald_400Regular, Oswald_600SemiBold, Oswald_700Bold });
  const isFocused = useIsFocused();

  const [profile, setProfile] = useState({
    fullName: '-', phoneNumber: '-', dateOfBirth: '-', address: '-',
  });
  const [membership, setMembership] = useState<Membership | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        
        // Load Profile details
        const stored = await getProfile(uid);
        if (stored && mounted) {
          setProfile({
            fullName: stored.fullName ?? '-',
            phoneNumber: stored.phoneNumber ?? '-',
            dateOfBirth: stored.dateOfBirth ?? '-',
            address: stored.address ?? '-',
          });
        }

        // Load Membership status
        const storedMembership = await getMembership(uid);
        if (storedMembership && mounted) {
          setMembership(storedMembership);
        }

        // Load profile photo
        const rawImage = await getProfileImage(uid);
        if (rawImage && mounted) {
          setProfileImage(rawImage);
        }
      } catch (e) {
        console.warn('Failed loading profile details from storage', e);
      }
    };

    if (isFocused) load();

    return () => { mounted = false; };
  }, [isFocused]);

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
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('You must be signed in to save a photo.');
      setProfileImage(await saveProfileImage(uid, result.assets[0].uri));
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      Alert.alert('Logged out', 'You have been successfully logged out.');
      navigation.getParent()?.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (error: any) {
      Alert.alert('Error', 'Failed to log out. Try again.');
      console.error(error);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 15) }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={[styles.borderBox, { width: contentWidth }]}>

          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Home')}>
              <Ionicons name="arrow-back-outline" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.heading}>MY PROFILE</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.avatarSection}>
            <TouchableOpacity style={styles.profileImageContainer} onPress={handleSelectPhoto}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <Ionicons name="person" size={54} color="#888888" />
              )}
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={16} color="white" />
              </View>
            </TouchableOpacity>
            <Text style={styles.userName}>{profile.fullName !== '-' ? profile.fullName : 'Gym Member'}</Text>
          </View>

          {/* Active Membership Status Card */}
          <Text style={styles.sectionTitle}>MEMBERSHIP STATUS</Text>
          {membership ? (
            <View style={styles.membershipCard}>
              <View style={styles.membershipHeader}>
                <Ionicons name="card" size={24} color="black" />
                <Text style={styles.membershipTitle}>{membership.plan} Plan</Text>
              </View>
              <View style={styles.membershipBody}>
                <View style={styles.membershipRow}>
                  <Text style={styles.membershipLabel}>STARTED ON</Text>
                  <Text style={styles.membershipValue}>{membership.startDate}</Text>
                </View>
                <View style={styles.membershipRow}>
                  <Text style={styles.membershipLabel}>EXPIRES ON</Text>
                  <Text style={styles.membershipValue}>{membership.endDate}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.membershipCardEmpty}>
              <Text style={styles.membershipEmptyText}>No Active Gym Membership Plan</Text>
              <TouchableOpacity 
                style={styles.membershipCta}
                onPress={() => navigation.getParent()?.navigate('MemberPlan')}
              >
                <Text style={styles.membershipCtaText}>CHOOSE A PLAN</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Profile Fields List */}
          <Text style={styles.sectionTitle}>ACCOUNT DETAILS</Text>
          <View style={styles.infoSection}>
            <View style={styles.detailRow}>
              <Ionicons name="person-outline" size={20} color="black" style={styles.detailIcon} />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>FULL NAME</Text>
                <Text style={styles.detailValue}>{profile.fullName}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="call-outline" size={20} color="black" style={styles.detailIcon} />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>PHONE NUMBER</Text>
                <Text style={styles.detailValue}>{profile.phoneNumber}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={20} color="black" style={styles.detailIcon} />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>DATE OF BIRTH</Text>
                <Text style={styles.detailValue}>{profile.dateOfBirth}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="map-outline" size={20} color="black" style={styles.detailIcon} />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>ADDRESS</Text>
                <Text style={styles.detailValue}>{profile.address}</Text>
              </View>
            </View>
          </View>

          {/* Logout Action Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>LOGOUT</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContainer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  borderBox: {
    borderWidth: 4,
    borderColor: 'black',
    padding: 18,
    paddingBottom: 30,
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  backButton: {
    padding: 4,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 2,
    textAlign: 'center',
    fontFamily: 'BebasNeue_400Regular',
    color: 'black',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
    backgroundColor: '#F5F5F5',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: 'black',
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
    marginTop: 12,
    fontFamily: 'System',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666666',
    letterSpacing: 1.5,
    fontFamily: 'System',
    marginBottom: 10,
    marginTop: 10,
  },
  
  // Membership Card Styling
  membershipCard: {
    borderWidth: 2,
    borderColor: 'black',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#FAFAFA',
    marginBottom: 20,
    width: '100%',
  },
  membershipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  membershipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
    fontFamily: 'System',
  },
  membershipBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  membershipRow: {
    flex: 1,
  },
  membershipLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#888888',
    letterSpacing: 1,
    fontFamily: 'System',
  },
  membershipValue: {
    fontSize: 14,
    fontWeight: '600',
    color: 'black',
    fontFamily: 'System',
    marginTop: 2,
  },
  membershipCardEmpty: {
    borderWidth: 2,
    borderColor: 'black',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    backgroundColor: '#FCFCFC',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  membershipEmptyText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: 'System',
  },
  membershipCta: {
    backgroundColor: 'black',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  membershipCtaText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    fontFamily: 'System',
  },
  
  // Details List Styling
  infoSection: {
    backgroundColor: '#FAFAFA',
    borderWidth: 2,
    borderColor: 'black',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 20,
    width: '100%',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  detailIcon: {
    marginRight: 14,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#888888',
    letterSpacing: 1,
    fontFamily: 'System',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: 'black',
    fontFamily: 'System',
    marginTop: 2,
  },
  
  // Logout Button
  logoutButton: {
    backgroundColor: 'black',
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    width: '100%',
    marginTop: 10,
    borderWidth: 2,
    borderColor: 'black',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'System',
    letterSpacing: 3,
  },
});
