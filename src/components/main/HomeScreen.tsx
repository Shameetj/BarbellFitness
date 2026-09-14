// src/screens/HomeScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { Oswald_400Regular, Oswald_600SemiBold, Oswald_700Bold } from '@expo-google-fonts/oswald';
import { Calendar } from 'react-native-calendars';
import { useIsFocused } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../../types/navigation';
import { auth } from '../../FirebaseConfig';
import {
  getAttendance,
  getMembership,
  getPrs,
  localDateString,
  savePrs,
  type AttendanceRecord,
  type Membership,
} from '../../lib/userStorage';

// Helpers
const parseISODate = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const formatTime = (isoString?: string) => {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return isoString;
  }
};

type Props = BottomTabScreenProps<MainTabParamList, 'Home'>;
export default function HomeScreen(_props: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const contentWidth = Math.min(width - 24, 380);

  const [fontsLoaded] = useFonts({ BebasNeue_400Regular, Oswald_400Regular, Oswald_600SemiBold, Oswald_700Bold });
  const [, setSelectedDate] = useState<string>('');
  const [prs, setPrs] = useState({ deadlift: '315', squat: '225', bench: '135' });
  const [isEditingPrs, setIsEditingPrs] = useState(false);
  const [activeTab, setActiveTab] = useState<'Deadlift' | 'Squats' | 'Bench'>('Deadlift');
  const [membership, setMembership] = useState<Membership | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) return;
    loadMembership();
    loadPrs();
    loadAttendance();
  }, [isFocused]);

  const loadPrs = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const stored = await getPrs(uid);
      if (stored) setPrs({ deadlift: stored.deadlift ?? '', squat: stored.squat ?? '', bench: stored.bench ?? '' });
    } catch { }
  };

  const loadMembership = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const stored = await getMembership(uid);
      setMembership(stored);
    } catch {
      console.warn('Failed loading membership');
    }
  };

  const loadAttendance = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const stored = await getAttendance(uid);
      setAttendance(stored || []);
    } catch {
      console.warn('Failed loading attendance');
      setAttendance([]);
    }
  };

  if (!fontsLoaded) return null;

  // Helper to get membership details
  const getMembershipDetails = () => {
    if (!membership || !membership.startDate || !membership.endDate) {
      return {
        planName: 'No Active Plan',
        daysRemaining: 0,
        expiryDate: 'N/A',
        progress: 0,
        isExpired: true,
        isNearExpiry: true,
      };
    }

    const today = parseISODate(localDateString(new Date()));
    const start = parseISODate(membership.startDate);
    const end = parseISODate(membership.endDate);

    const totalDurationMs = end.getTime() - start.getTime();
    const elapsedMs = today.getTime() - start.getTime();
    let progress = totalDurationMs > 0 ? elapsedMs / totalDurationMs : 0;
    progress = Math.max(0, Math.min(1, progress)); // Clamp progress between 0 and 1

    const diffMs = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));

    return {
      planName: `${membership.plan} Plan`,
      daysRemaining: Math.max(0, diffDays),
      expiryDate: membership.endDate,
      progress,
      isExpired: diffDays <= 0,
      isNearExpiry: diffDays <= 3,
    };
  };

  const details = getMembershipDetails();

  const getMarkedDates = () => {
    const marked: Record<string, { color: string; textColor: string; startingDay: boolean; endingDay: boolean }> = {};
    for (const record of attendance) {
      if (record.date) {
        marked[record.date] = {
          color: '#000000',
          textColor: '#ffffff',
          startingDay: true,
          endingDay: true,
        };
      }
    }
    return marked;
  };

  const todayDateStr = localDateString(new Date());
  const todayRecords = attendance.filter((a) => a.date === todayDateStr);
  const latestTodayRecord = todayRecords.length > 0
    ? [...todayRecords].sort((a, b) => (b.checkInTime || b.createdAt || '').localeCompare(a.checkInTime || a.createdAt || ''))[0]
    : null;

  const toggleEditPrs = async () => {
    if (isEditingPrs) {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) throw new Error('No signed-in user');
        await savePrs(uid, prs);
      } catch {
        console.warn('Failed saving PRs');
      }
    }
    setIsEditingPrs(!isEditingPrs);
  };

  const onDayPress = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 15) }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={[styles.borderBox, { width: contentWidth }]}>
          <Text style={styles.heading}>YOUR SCHEDULE</Text>

          {/* Membership Hero Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <View>
                <Text style={styles.heroPlanName}>{details.planName}</Text>
                <Text style={styles.heroExpiryDate}>Expires: {details.expiryDate}</Text>
              </View>
              <View style={[
                styles.heroStatusBadge,
                { backgroundColor: details.isNearExpiry ? '#EF4444' : '#000000' }
              ]}>
                <Text style={styles.heroStatusText}>
                  {details.isExpired ? 'EXPIRED' : details.isNearExpiry ? 'EXPIRING' : 'ACTIVE'}
                </Text>
              </View>
            </View>

            <View style={styles.heroBody}>
              <Text style={styles.heroDaysLeft}>
                {details.isExpired ? 'Membership Expired' : `${details.daysRemaining} days remaining`}
              </Text>

              {/* Visual Progress Bar */}
              <View style={styles.progressBarTrack}>
                <View style={[
                  styles.progressBarFill,
                  {
                    width: `${details.progress * 100}%`,
                    backgroundColor: details.isNearExpiry ? '#EF4444' : '#000000'
                  }
                ]} />
              </View>
            </View>

            {/* Dynamic CTA Button */}
            <TouchableOpacity
              style={[
                styles.heroCtaButton,
                { backgroundColor: details.isNearExpiry ? '#EF4444' : '#000000' }
              ]}
              onPress={() => _props.navigation.getParent()?.navigate('MemberPlan')}
            >
              <Text style={styles.heroCtaButtonText}>
                {membership ? (details.isNearExpiry ? 'RENEW PLAN NOW' : 'EXTEND MEMBERSHIP') : 'GET A MEMBERSHIP'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Attendance Calendar */}
          <View style={styles.calendarWrap}>
            <Calendar
              onDayPress={onDayPress}
              markedDates={getMarkedDates()}
              markingType={'period'}
              hideExtraDays={false}
              theme={{
                calendarBackground: '#ffffff',
                textSectionTitleColor: '#000000',
                todayTextColor: '#e63946',
                dayTextColor: '#333333',
                textDisabledColor: '#CCCCCC',
                arrowColor: '#000000',
                monthTextColor: '#000000',
                textDayFontFamily: 'System',
                textMonthFontFamily: 'BebasNeue_400Regular',
                textDayHeaderFontFamily: 'System',
                textDayHeaderFontWeight: 'bold',
              }}
              style={styles.calendar}
            />
          </View>

          {/* Cards & Content layout */}
          <View style={styles.widgetsContainer}>
            <View style={styles.widget}>
              <Text style={styles.widgetTitle}>GYM LOGS (TODAY)</Text>
              {latestTodayRecord ? (
                <>
                  <View style={styles.widgetRow}>
                    <Text style={styles.widgetTextBold}>Check-in:</Text>
                    <Text style={styles.widgetText}> {formatTime(latestTodayRecord.checkInTime)}</Text>
                  </View>
                  <View style={styles.widgetRow}>
                    <Text style={styles.widgetTextBold}>Check-out:</Text>
                    <Text style={styles.widgetText}>
                      {' '}{latestTodayRecord.checkOutTime ? formatTime(latestTodayRecord.checkOutTime) : 'In progress'}
                    </Text>
                  </View>
                </>
              ) : (
                <Text style={styles.widgetText}>No check-in recorded today</Text>
              )}
            </View>

            <View style={styles.widget}>
              <Text style={styles.widgetTitle}>GYM NEWS</Text>
              <Text style={styles.widgetText}>
                🔥 New Rogue barbells have arrived! They are placed at the main squat racks. Try them out today.
              </Text>
            </View>

            <View style={styles.widget}>
              <View style={styles.widgetHeaderRow}>
                <Text style={styles.widgetTitle}>WORKOUT CHALLENGES</Text>
                <TouchableOpacity onPress={toggleEditPrs} style={styles.editButtonContainer}>
                  <Text style={styles.editButton}>{isEditingPrs ? 'SAVE' : 'EDIT PRs'}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.tabsRow}>
                <TouchableOpacity onPress={() => setActiveTab('Deadlift')} style={[styles.tabButton, activeTab === 'Deadlift' && styles.tabButtonActive]}>
                  <Text style={[styles.tabButtonText, activeTab === 'Deadlift' && styles.tabButtonTextActive]}>DEADLIFT</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveTab('Squats')} style={[styles.tabButton, activeTab === 'Squats' && styles.tabButtonActive]}>
                  <Text style={[styles.tabButtonText, activeTab === 'Squats' && styles.tabButtonTextActive]}>SQUATS</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveTab('Bench')} style={[styles.tabButton, activeTab === 'Bench' && styles.tabButtonActive]}>
                  <Text style={[styles.tabButtonText, activeTab === 'Bench' && styles.tabButtonTextActive]}>BENCH</Text>
                </TouchableOpacity>
              </View>

              {activeTab === 'Deadlift' && (
                <View>
                  <Text style={styles.widgetSubtitle}>TOP LIFTS - DEADLIFT</Text>
                  <View style={styles.widgetRow}>
                    <Text style={styles.widgetTextBold}>1. Alex T.</Text>
                    <Text style={styles.widgetText}> 495 lbs</Text>
                  </View>
                  <View style={[styles.widgetRow, { alignItems: 'center' }]}>
                    <Text style={styles.widgetTextBold}>2. You</Text>
                    {isEditingPrs ? (
                      <TextInput style={styles.prInput} keyboardType="numeric" value={prs.deadlift} onChangeText={(val) => setPrs({ ...prs, deadlift: val })} />
                    ) : (
                      <Text style={styles.widgetText}> {prs.deadlift} lbs</Text>
                    )}
                  </View>
                </View>
              )}

              {activeTab === 'Squats' && (
                <View>
                  <Text style={styles.widgetSubtitle}>TOP LIFTS - SQUATS</Text>
                  <View style={styles.widgetRow}>
                    <Text style={styles.widgetTextBold}>1. Mike R.</Text>
                    <Text style={styles.widgetText}> 405 lbs</Text>
                  </View>
                  <View style={[styles.widgetRow, { alignItems: 'center' }]}>
                    <Text style={styles.widgetTextBold}>2. Your</Text>
                    {isEditingPrs ? (
                      <TextInput style={styles.prInput} keyboardType="numeric" value={prs.squat} onChangeText={(val) => setPrs({ ...prs, squat: val })} />
                    ) : (
                      <Text style={styles.widgetText}> {prs.squat} lbs</Text>
                    )}
                  </View>
                </View>
              )}

              {activeTab === 'Bench' && (
                <View>
                  <Text style={styles.widgetSubtitle}>TOP LIFTS - BENCH PRESS</Text>
                  <View style={styles.widgetRow}>
                    <Text style={styles.widgetTextBold}>1. Chris J.</Text>
                    <Text style={styles.widgetText}> 315 lbs</Text>
                  </View>
                  <View style={[styles.widgetRow, { alignItems: 'center' }]}>
                    <Text style={styles.widgetTextBold}>2. You</Text>
                    {isEditingPrs ? (
                      <TextInput style={styles.prInput} keyboardType="numeric" value={prs.bench} onChangeText={(val) => setPrs({ ...prs, bench: val })} />
                    ) : (
                      <Text style={styles.widgetText}> {prs.bench} lbs</Text>
                    )}
                  </View>
                </View>
              )}
            </View>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  scrollContainer: { alignItems: 'center', paddingTop: 20, paddingBottom: 120 },
  borderBox: { borderWidth: 4, borderColor: 'black', backgroundColor: 'white', width: 380, padding: 15, borderRadius: 20, overflow: 'hidden' },
  heading: { padding: 6, fontSize: 32, fontWeight: '700', color: 'black', letterSpacing: 3, textAlign: 'center', marginBottom: 6, fontFamily: 'BebasNeue_400Regular' },

  // Membership Hero Card styling
  heroCard: {
    borderWidth: 2,
    borderColor: 'black',
    borderRadius: 16,
    padding: 16,
    marginVertical: 15,
    backgroundColor: '#FAFAFA',
    width: '100%',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroPlanName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
    fontFamily: 'System',
  },
  heroExpiryDate: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
    fontFamily: 'System',
  },
  heroStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  heroStatusText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    fontFamily: 'System',
  },
  heroBody: {
    marginBottom: 16,
  },
  heroDaysLeft: {
    fontSize: 16,
    fontWeight: '600',
    color: 'black',
    fontFamily: 'System',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginTop: 10,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  heroCtaButton: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'black',
  },
  heroCtaButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    fontFamily: 'System',
  },

  // Calendar styling
  calendarWrap: { borderWidth: 2, borderColor: 'black', overflow: 'hidden', backgroundColor: '#fff', alignSelf: 'center', width: '100%', borderRadius: 14, paddingBottom: 10, marginVertical: 10 },
  calendar: { width: '100%' },

  // Widgets/Cards layout
  widgetsContainer: { marginTop: 15 },
  widget: {
    backgroundColor: '#fafafa',
    borderWidth: 2,
    borderColor: 'black',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    width: '100%'
  },
  widgetTitle: {
    fontSize: 20, fontFamily: 'BebasNeue_400Regular', color: 'black', letterSpacing: 2, marginBottom: 8
  },
  widgetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  editButtonContainer: {
    backgroundColor: 'black',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'black',
  },
  editButton: {
    fontSize: 12,
    color: 'white',
    letterSpacing: 1,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  prInput: {
    borderBottomWidth: 2,
    borderColor: '#e63946',
    fontSize: 15,
    color: '#000',
    padding: 0,
    width: 60,
    marginLeft: 6,
    textAlign: 'center',
    fontWeight: '600',
    fontFamily: 'System',
  },
  widgetSubtitle: {
    fontSize: 14, color: '#555', marginBottom: 6, letterSpacing: 1, fontWeight: '600', fontFamily: 'System'
  },
  tabsRow: {
    flexDirection: 'row',
    marginBottom: 12,
    borderBottomWidth: 2,
    borderColor: '#e0e0e0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderColor: 'transparent',
    marginBottom: -2,
  },
  tabButtonActive: {
    borderColor: 'black',
  },
  tabButtonText: {
    fontSize: 14,
    color: '#999',
    letterSpacing: 1,
    fontWeight: '600',
    fontFamily: 'System',
  },
  tabButtonTextActive: {
    color: 'black',
  },
  widgetRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  widgetTextBold: {
    fontSize: 15, color: '#000', fontWeight: '600', fontFamily: 'System'
  },
  widgetText: {
    fontSize: 15, color: '#555', flex: 1, flexWrap: 'wrap', fontFamily: 'System'
  }
});
