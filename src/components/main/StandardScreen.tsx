import React, { useState } from 'react';
import {StyleSheet, Text, TouchableOpacity, View, Alert, ActivityIndicator} from 'react-native';
import { useFonts, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { Oswald_400Regular, Oswald_600SemiBold, Oswald_700Bold } from '@expo-google-fonts/oswald';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types/navigation';
import { purchaseMembership } from '../../lib/membership';

type Props = NativeStackScreenProps<RootStackParamList, 'StandardPlan'>;
export default function StandardScreen({ navigation }: Props) {
  const [saving, setSaving] = useState(false);

  const [fontsLoaded] = useFonts({
    BebasNeue_400Regular,
    Oswald_400Regular,
    Oswald_600SemiBold,
    Oswald_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }
  const handleBuyNow = async () => {
    if (saving) return; setSaving(true);
    try { const membership = await purchaseMembership('Standard'); Alert.alert('Purchased', `Standard plan active until ${membership.endDate}`, [{ text: 'OK', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Main', params: { screen: 'Home' } }] }) }]); }
    catch { Alert.alert('Error', 'Failed to complete purchase. Please try again.'); }
    finally { setSaving(false); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.borderBox}>
        <Text style={styles.heading}>MEMBERSHIP PLANS</Text>
        <Text style={styles.heading}>💎 Standard Gym Membership Includes:</Text>

        <Text style={styles.text}>• All Basic Membership equipment access</Text>
        <Text style={styles.text}>• Advanced strength machines and cable stations</Text>
        <Text style={styles.text}>• 2 free personal training sessions per month</Text>
        <Text style={styles.text}>• Free monthly progress check with a trainer</Text>
        <Text style={styles.text}>• Priority locker access and towel service</Text>
        <Text style={styles.text}>• Extended hours access including early mornings and late evenings</Text>
        <Text style={styles.text}>• 10% off supplements and gear at our gym shop</Text>

        <TouchableOpacity style={styles.blackBox} onPress={handleBuyNow} disabled={saving}>
          {saving ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>BUY NOW!</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
};

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
});
