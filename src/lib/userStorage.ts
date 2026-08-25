import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

export type UserProfile = { fullName: string; phoneNumber: string; dateOfBirth: string; address: string };
export type Membership = { plan: 'Basic' | 'Standard' | 'Wellness' | 'Platinum'; startDate: string; endDate: string; createdAt: string };
const keyFor = (uid: string, name: string) => `barbellfitness:${uid}:${name}`;
const profileKey = (uid: string) => keyFor(uid, 'profile'); const imageKey = (uid: string) => keyFor(uid, 'profile-image');
const membershipKey = (uid: string) => keyFor(uid, 'membership'); const prsKey = (uid: string) => keyFor(uid, 'prs');
export const localDateString = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const readJson = async <T>(key: string): Promise<T | null> => { const raw = await AsyncStorage.getItem(key); if (!raw) return null; try { return JSON.parse(raw) as T; } catch { await AsyncStorage.removeItem(key); return null; } };
export const getProfile = (uid: string) => readJson<UserProfile>(profileKey(uid));
export const saveProfile = (uid: string, profile: UserProfile) => AsyncStorage.setItem(profileKey(uid), JSON.stringify(profile));
export const getMembership = (uid: string) => readJson<Membership>(membershipKey(uid));
export const saveMembership = (uid: string, membership: Membership) => AsyncStorage.setItem(membershipKey(uid), JSON.stringify(membership));
export const getPrs = (uid: string) => readJson<Record<string, string>>(prsKey(uid));
export const savePrs = (uid: string, prs: Record<string, string>) => AsyncStorage.setItem(prsKey(uid), JSON.stringify(prs));
export const getProfileImage = (uid: string) => AsyncStorage.getItem(imageKey(uid));
export const saveProfileImage = async (uid: string, sourceUri: string) => { if (!FileSystem.documentDirectory) throw new Error('App documents directory is unavailable.'); const extension = sourceUri.split('.').pop()?.split('?')[0] || 'jpg'; const destination = `${FileSystem.documentDirectory}profile-${uid}.${extension}`; await FileSystem.copyAsync({ from: sourceUri, to: destination }); await AsyncStorage.setItem(imageKey(uid), destination); return destination; };
