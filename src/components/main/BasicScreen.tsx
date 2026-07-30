import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { useFonts, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { Oswald_400Regular, Oswald_600SemiBold, Oswald_700Bold } from '@expo-google-fonts/oswald';
import AsyncStorage from '@react-native-async-storage/async-storage';

const toISODate = (d: Date) => d.toISOString().slice(0, 10);

const addMonths = (date: Date, months: number) => {
  const d = new Date(date.getTime());
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
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
    BebasNeue_400Regular,
    Oswald_400Regular,
    Oswald_600SemiBold,
    Oswald_700Bold,
  });

  if (!fontsLoaded) return null;

  const handleBuyNow = async () => {
    try {
      const start = new Date();
      const end = addMonths(start, 1);
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
          <Text style={styles.buttonText}>BUY NOW!</Text>
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
});