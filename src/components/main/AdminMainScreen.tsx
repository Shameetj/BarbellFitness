import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useFonts, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { Oswald_400Regular, Oswald_600SemiBold, Oswald_700Bold } from '@expo-google-fonts/oswald';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AdminMembersScreen from './AdminMembersScreen';
import AdminAnnouncementsScreen from './AdminAnnouncementsScreen';
import AdminChallengesScreen from './AdminChallengesScreen';
import AdminProfileScreen from './AdminProfileScreen';
import type { AdminTabParamList } from '../../types/navigation';

export default function AdminMainScreen() {
  const Tab = createBottomTabNavigator<AdminTabParamList>();
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
        initialRouteName="Registry"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: 'black',
          tabBarInactiveTintColor: '#7A7A7A',
          tabBarStyle: [styles.tabBar, { marginBottom: Math.max(insets.bottom, 15) }],
          tabBarItemStyle: styles.tabBarItem,
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarIcon: ({ color }) => {
            let iconName: any = 'people-outline';
            if (route.name === 'Announcements') {
              iconName = 'megaphone-outline';
            } else if (route.name === 'Challenges') {
              iconName = 'trophy-outline';
            } else if (route.name === 'Profile') {
              iconName = 'shield-checkmark-outline';
            }
            return <Ionicons name={iconName} size={26} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Registry" component={AdminMembersScreen} options={{ title: 'REGISTRY' }} />
        <Tab.Screen name="Announcements" component={AdminAnnouncementsScreen} options={{ title: 'ANNOUNCEMENTS' }} />
        <Tab.Screen name="Challenges" component={AdminChallengesScreen} options={{ title: 'CHALLENGES' }} />
        <Tab.Screen name="Profile" component={AdminProfileScreen} options={{ title: 'PROFILE' }} />
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
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
