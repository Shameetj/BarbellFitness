import React from 'react';
import {StyleSheet, Text, TextInput, TouchableOpacity, View, Image} from 'react-native';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';


export default function PlanScreen({ navigation }: any) {

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

        <TouchableOpacity style={styles.blackBox} onPress ={() => navigation.navigate('BasicPlan')}>
          <Text style={styles.text}>BASIC PLAN{'\n'}
          ₹900/month</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.blackBox} onPress ={() => navigation.navigate('StandardPlan')}>
          <Text style={styles.text}>STANDARD PLAN{'\n'}
          ₹1500/month</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.blackBox} onPress ={() => navigation.navigate('WellnessPlan')}>
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

  borderBox:{
    borderWidth: 5,
    borderColor: 'black',
    backgroundColor: 'white',
    width: 380,
    height: 840,
   
  },

  blackBox: {
    width: 350,
    height: 150,
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
    color: 'white',
    letterSpacing: 4,
    lineHeight: 35,
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
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },

});