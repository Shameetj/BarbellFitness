import React from 'react';
import {StyleSheet, Text, TextInput, TouchableOpacity, View, Image} from 'react-native';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';

export default function StandardScreen({ navigation }: any) {

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
        <View style={styles.container}>
      <Text style={styles.heading}>💎 Standard Gym Membership Includes:</Text>
      <Text style={styles.text}>• All Basic Membership equipment access</Text>
      <Text style={styles.text}>• Advanced strength machines and cable stations</Text>
      <Text style={styles.text}>• 2 free personal training sessions per month</Text>    
      <Text style={styles.text}>• Free monthly progress check with a trainer</Text>
      <Text style={styles.text}>• Priority locker access and towel service</Text>
      <Text style={styles.text}>• Extended hours access including early mornings and late evenings</Text>
      <Text style={styles.text}>• 10% off supplements and gear at our gym shop</Text>

      <TouchableOpacity style={styles.blackBox} onPress ={() => navigation.navigate('StandardPlan')}>
        <Text style={styles.text2}>BUY NOW!</Text>
        </TouchableOpacity>
    </View>
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