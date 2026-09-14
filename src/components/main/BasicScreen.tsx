import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native';
import { useFonts, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { Oswald_400Regular, Oswald_600SemiBold, Oswald_700Bold } from '@expo-google-fonts/oswald';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types/navigation';
import { auth } from '../../FirebaseConfig';
import {
  createMembershipRequest,
  getPendingMembershipRequest,
  type MembershipRequest,
} from '../../lib/userStorage';

type Props = NativeStackScreenProps<RootStackParamList, 'BasicPlan'>;
export default function BasicScreen({ navigation }: Props) {
  const [saving, setSaving] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<MembershipRequest | null>(null);

  const [fontsLoaded] = useFonts({
    BebasNeue_400Regular,
    Oswald_400Regular,
    Oswald_600SemiBold,
    Oswald_700Bold,
  });

  const checkPending = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const req = await getPendingMembershipRequest(uid);
    setPendingRequest(req);
  }, []);

  useEffect(() => {
    checkPending();
  }, [checkPending]);

  if (!fontsLoaded) return null;

  const handleRequestPlan = async () => {
    if (saving) return;
    const uid = auth.currentUser?.uid;
    if (!uid) {
      Alert.alert('Session Expired', 'Please log in to request a membership plan.');
      return;
    }

    setSaving(true);
    try {
      const existing = await getPendingMembershipRequest(uid);
      if (existing) {
        setPendingRequest(existing);
        Alert.alert(
          'Request Pending',
          `You already have a pending request for the ${existing.plan} Plan. Please complete payment at the gym reception to activate your membership.`
        );
        return;
      }

      const created = await createMembershipRequest(uid, 'Basic');
      setPendingRequest(created);

      Alert.alert(
        'Request Submitted',
        'Your membership request for the Basic Plan has been submitted. Please complete payment at the gym reception. Your membership will be activated after staff approval.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.reset({ index: 0, routes: [{ name: 'Main', params: { screen: 'Home' } }] });
            },
          },
        ]
      );
    } catch (err: any) {
      console.error('Failed to submit membership request:', err);
      Alert.alert('Request Failed', err.message || 'Failed to submit membership request. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.borderBox}>
        <Text style={styles.heading}>MEMBERSHIP PLANS</Text>
        <Text style={styles.heading}>✅ Basic Gym Membership Includes:</Text>

        <Text style={styles.text}>• Access to treadmills, bikes, and ellipticals</Text>
        <Text style={styles.text}>• Use of dumbbells, benches, and resistance machines</Text>
        <Text style={styles.text}>• Free fitness orientation with a trainer</Text>
        <Text style={styles.text}>• Clean locker rooms and showers</Text>
        <Text style={styles.text}>• Entry during staffed hours</Text>
        <Text style={styles.text}>• Member app for workout tracking</Text>
        <Text style={styles.text}>• Discounts on personal training and upgrades</Text>

        {pendingRequest && (
          <View style={styles.pendingNotice}>
            <Text style={styles.pendingNoticeText}>
              ⏳ PENDING REQUEST: {pendingRequest.plan.toUpperCase()} PLAN
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.blackBox, pendingRequest && styles.disabledButton]}
          onPress={handleRequestPlan}
          disabled={saving || !!pendingRequest}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>
              {pendingRequest ? 'REQUEST PENDING' : 'REQUEST PLAN'}
            </Text>
          )}
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
  blackBox: {
    width: 340,
    height: 75,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 40,
    marginBottom: 40,
    flexDirection: 'column',
    borderRadius: 16,
  },
  text: {
    padding: 12,
    fontSize: 15,
    fontWeight: 'bold',
    color: 'black',
    letterSpacing: 1,
    lineHeight: 20,
    fontFamily: 'Oswald_400Regular',
    textAlign: 'left',
  },
  buttonText: {
    padding: 12,
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 6,
    fontFamily: 'BebasNeue_400Regular',
    textAlign: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  heading: {
    padding: 12,
    fontSize: 28,
    fontWeight: 'bold',
    color: 'black',
    letterSpacing: 3,
    fontFamily: 'BebasNeue_400Regular',
    textAlign: 'left',
    marginTop: 20,
    marginBottom: 10,
    lineHeight: 36,
  },
  pendingNotice: {
    backgroundColor: '#FFF3CD',
    borderColor: '#FFEEBA',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 16,
    marginTop: 15,
    alignItems: 'center',
  },
  pendingNoticeText: {
    fontFamily: 'Oswald_600SemiBold',
    fontSize: 13,
    color: '#856404',
    letterSpacing: 1,
  },
  disabledButton: {
    backgroundColor: '#555555',
  },
});
