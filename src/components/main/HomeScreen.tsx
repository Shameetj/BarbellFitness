// src/screens/HomeScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
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

// Build marked object for react-native-calendars 'period' marking
const makeMarkedRange = (startISO: string, endISO: string) => {
  const start = parseISODate(startISO);
  const end = parseISODate(endISO);
  const marked: Record<string, any> = {};

  for (let dt = new Date(start.getTime()); dt <= end; dt = addDays(dt, 1)) {
    const key = toISODate(dt);
    const isStart = key === startISO;
    const isEnd = key === endISO;
    marked[key] = {
      color: '#000000',      // main fill color for the membership period
      textColor: '#ffffff',  // text inside period
      startingDay: isStart,
      endingDay: isEnd,
    };
  }

  // Optionally highlight the last day more strongly (e.g., darker border)
  if (marked[endISO]) {
    marked[endISO].endingDay = true;
    // You can tweak appearance on the end date by adding a custom dot (not all themes support)
  }

  return marked;
};

export default function HomeScreen({ navigation }: any) {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_700Bold });
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [markedDates, setMarkedDates] = useState<Record<string, any>>({});
  const [daysLeftText, setDaysLeftText] = useState<string | null>(null);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) return;
    loadMembership();
  }, [isFocused]);

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

      // build the marked date range for the calendar
      const marked = makeMarkedRange(membership.startDate, membership.endDate);
      setMarkedDates(marked);

      // compute days remaining
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

  const onDayPress = (day: any) => {
    setSelectedDate(day.dateString);
  };

  return (
    <View style={styles.container}>
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
              todayTextColor: '#000000',
              dayTextColor: '#000000',
              arrowColor: '#000000',
              monthTextColor: '#000000',
              textDayFontFamily: 'Inter_400Regular',
              textMonthFontFamily: 'Inter_700Bold',
              textDayHeaderFontFamily: 'Inter_700Bold',
            }}
            style={styles.calendar}
          />
        </View>

        <View style={styles.selectedRow}>
          <Text style={styles.selectedLabel}>Selected date:</Text>
          <Text style={styles.selectedValue}>{selectedDate || 'None'}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
  borderBox: { borderWidth: 5, borderColor: 'black', backgroundColor: 'white', width: 380, height: 720, padding: 12 },
  heading: { padding: 6, fontSize: 20, fontWeight: '700', color: 'black', letterSpacing: 3, textAlign: 'center', marginBottom: 6 },
  countdownBox: { alignSelf: 'center', marginBottom: 8, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: '#f2f2f2' },
  countdownText: { color: 'black', fontWeight: '700' },
  calendarWrap: { borderWidth: 5, borderColor: 'black', overflow: 'hidden', backgroundColor: '#fff', alignSelf: 'center', width: '100%' },
  calendar: { width: '100%' },
  selectedRow: { marginTop: 12, alignItems: 'center' },
  selectedLabel: { fontSize: 14, color: 'black', fontWeight: '700' },
  selectedValue: { fontSize: 16, color: 'gray', marginTop: 6 },
});
