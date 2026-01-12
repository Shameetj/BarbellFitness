// src/app/index.tsx  (or your app entry)
import React from 'react';
import { StyleSheet } from 'react-native';
import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../components/auth/LoginScreen';
import SignUpScreen from '../components/auth/SignUpScreen';
import DetailScreen from '../components/details/DetailScreen';
import PlanScreen from '../components/main/PlanScreen';
import BasicScreen from '../components/main/BasicScreen';
import StandardScreen from '../components/main/StandardScreen';
import WellnessScreen from '../components/main/WellnessScreen';
import MainScreen from '../components/main/MainScreen';



// 1) Define the param list for your stack (add or change params as needed)
export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  Detail: undefined;
  MemberPlan: undefined;
  BasicPlan: undefined;
  StandardPlan: undefined;
  WellnessPlan: undefined;
  Main: undefined;
};

// 2) Create typed stack
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationIndependentTree>
      <Stack.Navigator id={undefined} initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Detail" component={DetailScreen} options={{ headerShown: false }} />
        <Stack.Screen name="MemberPlan" component={PlanScreen} options={{ headerShown: false }} />
        <Stack.Screen name="BasicPlan" component={BasicScreen} options={{ headerShown: false }} />
        <Stack.Screen name="StandardPlan" component={StandardScreen} options={{ headerShown: false }} />
        <Stack.Screen name="WellnessPlan" component={WellnessScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Main" component={MainScreen} options={{ headerShown: false }} />

      </Stack.Navigator>
    </NavigationIndependentTree>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
