import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import { useFonts, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { Oswald_400Regular, Oswald_600SemiBold, Oswald_700Bold } from '@expo-google-fonts/oswald';


export default function PlanScreen({ navigation }: any) {

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

        <TouchableOpacity style={styles.blackBox} onPress={() => navigation.navigate('BasicPlan')}>
          <Text style={styles.text}>BASIC PLAN{'\n'}
          ₹900/month</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.blackBox} onPress={() => navigation.navigate('StandardPlan')}>
          <Text style={styles.text}>STANDARD PLAN{'\n'}
          ₹1500/month</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.blackBox} onPress={() => navigation.navigate('WellnessPlan')}>
          <Text style={styles.text}>WELLNESS PLAN{'\n'}
          ₹2000/month</Text>
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
    height: 150,
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
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 4,
    lineHeight: 38,
    fontFamily: 'BebasNeue_400Regular',
    textAlign: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  heading: {
    padding: 16,
    fontSize: 32,
    fontWeight: 'bold',
    color: 'black',
    letterSpacing: 3,
    fontFamily: 'BebasNeue_400Regular',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
    lineHeight: 42,
  },
});