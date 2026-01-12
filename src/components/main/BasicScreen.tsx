import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import AsyncStorage from '@react-native-async-storage/async-storage';

// helper: format Date -> YYYY-MM-DD
const toISODate = (d: Date) => d.toISOString().slice(0, 10);

// helper: add months safely (handles month overflow like Jan 31 -> Feb 28/29)
const addMonths = (date: Date, months: number) => {
  const d = new Date(date.getTime());
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);

  // if month overflowed (e.g., Feb doesn't have 31), set to last day of previous month
  if (d.getDate() < day) {
    d.setDate(0);
  }
  return d;
};

const persistMembership = async (membership: object) => {
  try {
    await AsyncStorage.setItem('membership', JSON.stringify(membership));
  } catch (e) {
    console.warn('Failed saving membership', e);
    throw e;
  }
};

export default function BasicScreen({ navigation }: any) {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
  });

  if (!fontsLoaded) return null;

  const handleBuyNow = async () => {
    try {
      const start = new Date();
      const end = addMonths(start, 1); // 1 month duration
      const membership = {
        plan: 'Basic',
        startDate: toISODate(start),
        endDate: toISODate(end),
        createdAt: new Date().toISOString(),
      };

      await persistMembership(membership);

      Alert.alert('Purchased', `Basic plan active until ${membership.endDate}`, [
        {
          text: 'OK',
          onPress: () => {
            // navigate to Main -> Home so the calendar reloads and shows membership
            navigation.navigate('Main', { screen: 'Home' });
          },
        },
      ]);
    } catch (err) {
      Alert.alert('Error', 'Failed to complete purchase. Please try again.');
      console.error(err);
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

        <TouchableOpacity style={styles.blackBox} onPress={handleBuyNow}>
          <Text style={styles.text2}>BUY NOW!</Text>
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