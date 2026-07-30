import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import { useFonts, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { Oswald_400Regular, Oswald_600SemiBold, Oswald_700Bold } from '@expo-google-fonts/oswald';

export default function WellnessScreen({ navigation }: any) {

  const [fontsLoaded] = useFonts({
    BebasNeue_400Regular,
    Oswald_400Regular,
    Oswald_600SemiBold,
    Oswald_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.borderBox}>
        <Text style={styles.heading}>MEMBERSHIP PLANS</Text>
        <Text style={styles.heading}>🧘‍♀️ Zumba, Yoga, Cardio & Dance Plan Includes:</Text>

        <Text style={styles.text}>• Unlimited access to Zumba, yoga, cardio, and dance classes</Text>
        <Text style={styles.text}>• Certified instructors for each class style</Text>
        <Text style={styles.text}>• Dedicated studio space with mirrors and sound system</Text>
        <Text style={styles.text}>• Free monthly wellness workshop (stretching, breathing, posture)</Text>
        <Text style={styles.text}>• Locker access</Text>
        <Text style={styles.text}>• Priority booking for popular class slots</Text>
        <Text style={styles.text}>• Access to recovery zone with mats and foam rollers</Text>

        <TouchableOpacity style={styles.blackBox} onPress={() => navigation.navigate('WellnessPlan')}>
          <Text style={styles.buttonText}>BUY NOW!</Text>
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