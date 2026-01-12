import React from 'react';
import {StyleSheet, Text, TextInput, TouchableOpacity, View, Image} from 'react-native';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';

export default function WellnessScreen({ navigation }: any) {

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
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
      
      <TouchableOpacity style={styles.blackBox} onPress ={() => navigation.navigate('WellnessPlan')}>
        <Text style={styles.text2}>BUY NOW!</Text>
        </TouchableOpacity>
    </View>
    </View>

          )
        };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },

  borderBox:{
    borderWidth: 5,
    borderColor: 'black',
    backgroundColor: 'white',
    width: 380,
    height: 840,
   
  },

  blackBox: {
    width: 350,
    height: 75,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 40,
    marginBottom: 40,
    flexDirection: 'column',
  },

  text:{
    padding: 12,
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
    letterSpacing: 2,
    lineHeight: 20,
    fontFamily: 'Inter_700Bold',
    textAlign: 'left',
  },

  text2:{
    padding: 12,
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 4,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    justifyContent: 'center',
    width: '100%',
  },

  heading:{
    padding: 12,
    fontSize: 22,
    fontWeight: 'bold',
    color: 'black',
    letterSpacing: 4,
    fontFamily: 'Inter_700Bold',
    textAlign: 'left',
    marginTop: 20,
    marginBottom: 20,
  },

});