import type { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = { Home: undefined; Profile: undefined };
export type AdminTabParamList = { Registry: undefined; Announcements: undefined; Challenges: undefined; Profile: undefined };

export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  Detail: undefined;
  MemberPlan: undefined;
  BasicPlan: undefined;
  StandardPlan: undefined;
  WellnessPlan: undefined;
  PlatinumPlan: undefined;
  Main: undefined;
  AdminMain: undefined;
};
