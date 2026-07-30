import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useFonts, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { Oswald_400Regular, Oswald_600SemiBold, Oswald_700Bold } from '@expo-google-fonts/oswald';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ProfileScreen from './ProfileScreen';
import HomeScreen from './HomeScreen';

export default function MainScreen() {
  const Tab = createBottomTabNavigator();
  const insets = useSafeAreaInsets();

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
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: 'black',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: [styles.tabBar, { marginBottom: Math.max(insets.bottom, 15) }],
          tabBarItemStyle: styles.tabBarItem,
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarIcon: ({ focused, color }) => {
            let iconName: any = 'barbell';
            if (route.name === 'Home') iconName = focused ? 'barbell' : 'barbell-outline';
            if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
            return <Ionicons name={iconName} size={28} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  tabBar: {
    backgroundColor: 'white',
    height: 70,
    borderWidth: 4,
    borderColor: 'black',
    borderTopWidth: 4,
    borderRadius: 20,
    marginHorizontal: 15,
    paddingBottom: 5,
    shadowColor: 'transparent',
    elevation: 0,
  },
  tabBarItem: {
    borderRadius: 14,
    padding: 2,
  },
  tabBarLabel: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 12,
    letterSpacing: 1,
  },
});
