import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, useWindowDimensions, ScrollView } from 'react-native';
import { useFonts, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { Oswald_400Regular, Oswald_600SemiBold, Oswald_700Bold } from '@expo-google-fonts/oswald';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signOut } from 'firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../../FirebaseConfig';
import { getAllMembers, getAnnouncements, getChallenges } from '../../lib/userStorage';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { AdminTabParamList } from '../../types/navigation';

type Props = BottomTabScreenProps<AdminTabParamList, 'Profile'>;

export default function AdminProfileScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const contentWidth = Math.min(width - 24, 380);
  const isFocused = useIsFocused();

  const [fontsLoaded] = useFonts({ BebasNeue_400Regular, Oswald_400Regular, Oswald_600SemiBold, Oswald_700Bold });

  // Stats
  const [totalMembers, setTotalMembers] = useState(0);
  const [activeMembers, setActiveMembers] = useState(0);
  const [announcementsCount, setAnnouncementsCount] = useState(0);
  const [challengesCount, setChallengesCount] = useState(0);

  useEffect(() => {
    if (isFocused) {
      const loadStats = async () => {
        try {
          const membersList = await getAllMembers();
          setTotalMembers(membersList.length);
          
          const active = membersList.filter(m => {
            if (!m.membership || m.membership.status === 'inactive') return false;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const end = new Date(m.membership.endDate + 'T00:00:00');
            return today <= end;
          }).length;
          
          setActiveMembers(active);

          const anns = await getAnnouncements();
          setAnnouncementsCount(anns.length);

          const chals = await getChallenges();
          setChallengesCount(chals.length);
        } catch (e) {
          console.warn(e);
        }
      };
      loadStats();
    }
  }, [isFocused]);

  const handleLogout = async () => {
    try {
      await GoogleSignin.signOut().catch(() => {});
      await signOut(auth);
      Alert.alert('Logged out', 'Successfully logged out.');
      navigation.getParent()?.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (error: any) {
      Alert.alert('Error', 'Failed to log out.');
      console.error(error);
    }
  };

  if (!fontsLoaded) return null;

  const email = auth.currentUser?.email || 'admin@barbellfitness.com';
  const name = email.split('@')[0].toUpperCase();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 15) }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={[styles.borderBox, { width: contentWidth }]}>
          <Text style={styles.heading}>ADMIN PROFILE</Text>

          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <Ionicons name="shield-checkmark" size={54} color="white" />
            </View>
            <Text style={styles.userName}>{name}</Text>
            <Text style={styles.userRole}>GYM OWNER / ADMINISTRATOR</Text>
          </View>

          {/* Quick Statistics Dashboard */}
          <Text style={styles.sectionTitle}>REGISTRY STATISTICS</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{totalMembers}</Text>
              <Text style={styles.statLabel}>TOTAL MEMBERS</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{activeMembers}</Text>
              <Text style={styles.statLabel}>ACTIVE MEMBERS</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{announcementsCount}</Text>
              <Text style={styles.statLabel}>ANNOUNCEMENTS</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{challengesCount}</Text>
              <Text style={styles.statLabel}>CHALLENGES</Text>
            </View>
          </View>

          {/* Info Area */}
          <Text style={styles.sectionTitle}>ADMINISTRATOR CREDENTIALS</Text>
          <View style={styles.infoSection}>
            <View style={styles.detailRow}>
              <Ionicons name="mail-outline" size={20} color="black" style={styles.detailIcon} />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>EMAIL ADDRESS</Text>
                <Text style={styles.detailValue}>{email}</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="key-outline" size={20} color="black" style={styles.detailIcon} />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>ACCESS LEVEL</Text>
                <Text style={styles.detailValue}>FULL CONTROL (OWNER)</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="white" style={{ marginRight: 8 }} />
            <Text style={styles.logoutBtnText}>LOGOUT SESSION</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F2' },
  scrollContainer: { paddingBottom: 40, alignItems: 'center' },
  borderBox: {
    borderWidth: 4,
    borderColor: 'black',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginTop: 15,
  },
  heading: { fontFamily: 'BebasNeue_400Regular', fontSize: 36, letterSpacing: 2, color: 'black', textAlign: 'center', marginBottom: 15 },
  avatarSection: { alignItems: 'center', marginBottom: 20 },
  avatarContainer: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  userName: { fontFamily: 'Oswald_700Bold', fontSize: 20, color: 'black' },
  userRole: { fontFamily: 'Oswald_600SemiBold', fontSize: 12, color: '#666', letterSpacing: 1.5, marginTop: 2 },
  sectionTitle: { fontFamily: 'BebasNeue_400Regular', fontSize: 20, letterSpacing: 1.5, color: 'black', marginTop: 15, marginBottom: 8, alignSelf: 'flex-start' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statBox: { width: '47%', backgroundColor: '#F9F9F9', borderWidth: 1.5, borderColor: '#EEE', borderRadius: 12, padding: 12, alignItems: 'center', marginBottom: 10 },
  statNum: { fontFamily: 'Oswald_700Bold', fontSize: 22, color: 'black' },
  statLabel: { fontFamily: 'Oswald_700Bold', fontSize: 9, color: '#777', letterSpacing: 0.5, marginTop: 4 },
  infoSection: { borderWidth: 1.5, borderColor: '#EEE', borderRadius: 14, paddingVertical: 6, marginBottom: 20 },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14 },
  detailIcon: { marginRight: 12 },
  detailTextContainer: { flex: 1 },
  detailLabel: { fontFamily: 'Oswald_700Bold', fontSize: 10, color: '#888', letterSpacing: 1 },
  detailValue: { fontFamily: 'Oswald_400Regular', fontSize: 14, color: 'black', marginTop: 2 },
  logoutBtn: { backgroundColor: 'black', height: 50, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  logoutBtnText: { color: 'white', fontFamily: 'BebasNeue_400Regular', fontSize: 20, letterSpacing: 2 },
});
