import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { Oswald_400Regular, Oswald_600SemiBold, Oswald_700Bold } from '@expo-google-fonts/oswald';
import LoginScreen from '../components/auth/LoginScreen';
import SignUpScreen from '../components/auth/SignUpScreen';
import DetailScreen from '../components/details/DetailScreen';
import PlanScreen from '../components/main/PlanScreen';
import BasicScreen from '../components/main/BasicScreen';
import StandardScreen from '../components/main/StandardScreen';
import WellnessScreen from '../components/main/WellnessScreen';
import PlatinumScreen from '../components/main/PlatinumScreen';
import MainScreen from '../components/main/MainScreen';
import AdminMainScreen from '../components/main/AdminMainScreen';
import ActiveWorkoutScreen from '../components/main/ActiveWorkoutScreen';
import WorkoutHistoryScreen from '../components/main/WorkoutHistoryScreen';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../FirebaseConfig';
import { resolveUserRoute } from '../lib/userStorage';
import type { RootStackParamList } from '../types/navigation';


const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);
  const [fontsLoaded] = useFonts({
    BebasNeue_400Regular,
    Oswald_400Regular,
    Oswald_600SemiBold,
    Oswald_700Bold,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (!user) {
        setInitialRoute('Login');
        return;
      }
      try {
        const route = await resolveUserRoute(user.uid);
        setInitialRoute(route);
      } catch (err) {
        console.error('Failed to verify profile', err);
        setInitialRoute('Detail');
      }
    });
    return unsubscribe;
  }, []);

  if (!fontsLoaded || !initialRoute) {
    return (
      <View style={styles.container}>
        <View style={styles.borderBox}>
          <Text style={styles.logoText}>BARBELL FITNESS</Text>
          <ActivityIndicator size="large" color="black" />
          <Text style={styles.loadingText}>LOADING YOUR EXPERIENCE...</Text>
        </View>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator key={initialRoute} initialRouteName={initialRoute}>
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Detail" component={DetailScreen} options={{ headerShown: false }} />
        <Stack.Screen name="MemberPlan" component={PlanScreen} options={{ headerShown: false }} />
        <Stack.Screen name="BasicPlan" component={BasicScreen} options={{ headerShown: false }} />
        <Stack.Screen name="StandardPlan" component={StandardScreen} options={{ headerShown: false }} />
        <Stack.Screen name="WellnessPlan" component={WellnessScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PlatinumPlan" component={PlatinumScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Main" component={MainScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AdminMain" component={AdminMainScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ActiveWorkout" component={ActiveWorkoutScreen} options={{ headerShown: false }} />
        <Stack.Screen name="WorkoutHistory" component={WorkoutHistoryScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 48,
    color: 'black',
    letterSpacing: 6,
    textAlign: 'center',
    marginBottom: 40,
  },
  loadingText: {
    fontFamily: 'Oswald_600SemiBold',
    fontSize: 16,
    color: 'black',
    letterSpacing: 3,
    textAlign: 'center',
    marginTop: 40,
    textTransform: 'uppercase',
  },
});
