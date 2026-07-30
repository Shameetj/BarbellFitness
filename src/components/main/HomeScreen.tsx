// src/screens/HomeScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useFonts, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { Oswald_400Regular, Oswald_600SemiBold, Oswald_700Bold } from '@expo-google-fonts/oswald';
import { Calendar } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';

// Helpers
const toISODate = (d: Date) => d.toISOString().slice(0, 10);
const parseISODate = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 24 * 60 * 60 * 1000);

const makeMarkedRange = (startISO: string, endISO: string) => {
  const start = parseISODate(startISO);
  const end = parseISODate(endISO);
  const marked: Record<string, any> = {};

  for (let dt = new Date(start.getTime()); dt <= end; dt = addDays(dt, 1)) {
    const key = toISODate(dt);
    const isStart = key === startISO;
    const isEnd = key === endISO;
    marked[key] = {
      color: '#000000',
      textColor: '#ffffff',
      startingDay: isStart,
      endingDay: isEnd,
    };
  }

  if (marked[endISO]) {
    marked[endISO].endingDay = true;
  }

  return marked;
};

export default function HomeScreen({ navigation }: any) {
  const [fontsLoaded] = useFonts({ BebasNeue_400Regular, Oswald_400Regular, Oswald_600SemiBold, Oswald_700Bold });
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [markedDates, setMarkedDates] = useState<Record<string, any>>({});
  const [daysLeftText, setDaysLeftText] = useState<string | null>(null);
  const [prs, setPrs] = useState({ deadlift: '315', squat: '225', bench: '135' });
  const [isEditingPrs, setIsEditingPrs] = useState(false);
  const [activeTab, setActiveTab] = useState<'Deadlift' | 'Squats' | 'Bench'>('Deadlift');
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) return;
    loadMembership();
    loadPrs();
  }, [isFocused]);

  const loadPrs = async () => {
    try {
      const raw = await AsyncStorage.getItem('user_prs');
      if (raw) setPrs(JSON.parse(raw));
    } catch {}
  };

  const loadMembership = async () => {
    try {
      const raw = await AsyncStorage.getItem('membership');
      if (!raw) {
        setMarkedDates({});
        setDaysLeftText(null);
        return;
      }

      const membership = JSON.parse(raw) as { plan?: string; startDate?: string; endDate?: string };
      if (!membership?.startDate || !membership?.endDate) {
        setMarkedDates({});
        setDaysLeftText(null);
        return;
      }

      const marked = makeMarkedRange(membership.startDate, membership.endDate);
      setMarkedDates(marked);

      const today = new Date();
      const end = parseISODate(membership.endDate);
      const diffMs = end.getTime() - today.getTime();
      const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
      if (diffDays <= 0) {
        setDaysLeftText('Membership expired');
      } else {
        setDaysLeftText(`${diffDays} day${diffDays > 1 ? 's' : ''} left (${membership.plan ?? 'Plan'})`);
      }
    } catch (e) {
      console.warn('Failed loading membership', e);
      setMarkedDates({});
      setDaysLeftText(null);
    }
  };

  if (!fontsLoaded) return null;

  const toggleEditPrs = async () => {
    if (isEditingPrs) {
      try {
        await AsyncStorage.setItem('user_prs', JSON.stringify(prs));
      } catch (e) {
        console.warn('Failed saving PRs');
      }
    }
    setIsEditingPrs(!isEditingPrs);
  };

  const onDayPress = (day: any) => {
    setSelectedDate(day.dateString);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.borderBox}>
          <Text style={styles.heading}>YOUR SCHEDULE</Text>

          {daysLeftText ? (
            <View style={styles.countdownBox}>
              <Text style={styles.countdownText}>{daysLeftText}</Text>
            </View>
          ) : null}

          <View style={styles.calendarWrap}>
            <Calendar
              onDayPress={onDayPress}
              markedDates={markedDates}
              markingType={'period'}
              theme={{
                calendarBackground: '#ffffff',
                textSectionTitleColor: '#000000',
                selectedDayBackgroundColor: '#000000',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#e63946',
                dayTextColor: '#333333',
                arrowColor: '#000000',
                monthTextColor: '#000000',
                textDayFontFamily: 'Oswald_400Regular',
                textMonthFontFamily: 'BebasNeue_400Regular',
                textDayHeaderFontFamily: 'Oswald_700Bold',
              }}
              style={styles.calendar}
            />
          </View>

          <View style={styles.widgetsContainer}>
            <View style={styles.widget}>
              <Text style={styles.widgetTitle}>GYM LOGS (TODAY)</Text>
              <View style={styles.widgetRow}>
                <Text style={styles.widgetTextBold}>Check-in:</Text>
                <Text style={styles.widgetText}> 08:30 AM</Text>
              </View>
              <View style={styles.widgetRow}>
                <Text style={styles.widgetTextBold}>Check-out:</Text>
                <Text style={styles.widgetText}> 10:15 AM</Text>
              </View>
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
                      <TextInput style={styles.prInput} keyboardType="numeric" value={prs.deadlift} onChangeText={(val) => setPrs({...prs, deadlift: val})} />
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
                    <Text style={styles.widgetTextBold}>2. Sarah M.</Text>
                    {isEditingPrs ? (
                      <TextInput style={styles.prInput} keyboardType="numeric" value={prs.squat} onChangeText={(val) => setPrs({...prs, squat: val})} />
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
                      <TextInput style={styles.prInput} keyboardType="numeric" value={prs.bench} onChangeText={(val) => setPrs({...prs, bench: val})} />
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
  scrollContainer: { alignItems: 'center', paddingTop: 20, paddingBottom: 40 },
  borderBox: { borderWidth: 4, borderColor: 'black', backgroundColor: 'white', width: 380, padding: 15, borderRadius: 20, overflow: 'hidden' },
  heading: { padding: 6, fontSize: 32, fontWeight: '700', color: 'black', letterSpacing: 3, textAlign: 'center', marginBottom: 6, fontFamily: 'BebasNeue_400Regular' },
  countdownBox: { alignSelf: 'center', marginBottom: 12, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: 'black' },
  countdownText: { color: 'white', fontWeight: '700', fontFamily: 'Oswald_600SemiBold', letterSpacing: 1 },
  calendarWrap: { borderWidth: 2, borderColor: '#e0e0e0', overflow: 'hidden', backgroundColor: '#fff', alignSelf: 'center', width: '100%', borderRadius: 14, paddingBottom: 10 },
  calendar: { width: '100%' },
  widgetsContainer: { marginTop: 20 },
  widget: {
    backgroundColor: '#fafafa',
    borderWidth: 2,
    borderColor: '#e0e0e0',
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
  },
  editButton: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 12,
    color: 'white',
    letterSpacing: 1,
  },
  prInput: {
    borderBottomWidth: 2,
    borderColor: '#e63946',
    fontFamily: 'Oswald_600SemiBold',
    fontSize: 15,
    color: '#000',
    padding: 0,
    width: 60,
    marginLeft: 6,
    textAlign: 'center',
  },
  widgetSubtitle: {
    fontSize: 16, fontFamily: 'Oswald_600SemiBold', color: '#555', marginBottom: 6, letterSpacing: 1
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
    fontFamily: 'Oswald_600SemiBold',
    fontSize: 14,
    color: '#999',
    letterSpacing: 1,
  },
  tabButtonTextActive: {
    color: 'black',
  },
  widgetRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  widgetTextBold: {
    fontFamily: 'Oswald_600SemiBold', fontSize: 15, color: '#000'
  },
  widgetText: {
    fontFamily: 'Oswald_400Regular', fontSize: 15, color: '#555', flex: 1, flexWrap: 'wrap'
  }
});
