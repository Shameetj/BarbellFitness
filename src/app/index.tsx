import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, TouchableOpacity } from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { Oswald_400Regular, Oswald_600SemiBold, Oswald_700Bold } from '@expo-google-fonts/oswald';
import { Ionicons } from '@expo/vector-icons';
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
  const [startupError, setStartupError] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState<boolean>(true);

  // Generation counter to protect against stale asynchronous auth/profile resolutions
  const authResolutionGeneration = useRef(0);

  const [fontsLoaded] = useFonts({
    BebasNeue_400Regular,
    Oswald_400Regular,
    Oswald_600SemiBold,
    Oswald_700Bold,
  });

  const resolveProfileForUser = useCallback(async (uid: string, generation: number) => {
    setIsResolving(true);
    setStartupError(null);
    try {
      const route = await resolveUserRoute(uid);
      if (generation !== authResolutionGeneration.current) {
        console.log(`[AUTH] ignoring stale route result for gen ${generation} (current: ${authResolutionGeneration.current})`);
        return;
      }
      console.log(`[NAV] initialRoute: ${route}`);
      setInitialRoute(route);
      setStartupError(null);
    } catch (err) {
      if (generation !== authResolutionGeneration.current) return;
      console.error('[AUTH] Failed to verify profile on startup:', err);
      // Explicit error state: do NOT route to Detail on network/connection failure
      setStartupError('Unable to load your profile. Please check your internet connection and try again.');
    } finally {
      if (generation === authResolutionGeneration.current) {
        setIsResolving(false);
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      console.log(`[AUTH] onAuthStateChanged: ${user ? user.uid : 'null (unauthenticated)'}`);
      const gen = ++authResolutionGeneration.current;
      if (!user) {
        setStartupError(null);
        console.log('[NAV] initialRoute: Login');
        setInitialRoute('Login');
        setIsResolving(false);
        return;
      }
      await resolveProfileForUser(user.uid, gen);
    });
    return unsubscribe;
  }, [resolveProfileForUser]);

  const handleRetry = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setStartupError(null);
      setInitialRoute('Login');
      return;
    }
    const gen = ++authResolutionGeneration.current;
    await resolveProfileForUser(currentUser.uid, gen);
  }, [resolveProfileForUser]);

  if (!fontsLoaded || !initialRoute || startupError) {
    return (
      <View style={styles.container}>
        <View style={styles.borderBox}>
          <Text style={styles.logoText}>BARBELL FITNESS</Text>

          {startupError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="cloud-offline-outline" size={52} color="#EF4444" style={{ marginBottom: 16 }} />
              <Text style={styles.errorHeading}>UNABLE TO LOAD PROFILE</Text>
              <Text style={styles.errorSubtext}>
                Please check your internet connection and try again.
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleRetry}
                disabled={isResolving}
                activeOpacity={0.8}
              >
                {isResolving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="reload" size={16} color="white" style={{ marginRight: 8 }} />
                    <Text style={styles.retryButtonText}>RETRY CONNECTION</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <ActivityIndicator size="large" color="black" />
              <Text style={styles.loadingText}>LOADING YOUR EXPERIENCE...</Text>
            </>
          )}
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
    paddingHorizontal: 20,
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
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginTop: 10,
  },
  errorHeading: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 24,
    color: 'black',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontFamily: 'System',
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderWidth: 2,
    borderColor: 'black',
    minWidth: 180,
  },
  retryButtonText: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 13,
    color: 'white',
    letterSpacing: 1.5,
  },
});
