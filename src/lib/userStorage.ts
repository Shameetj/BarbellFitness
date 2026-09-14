import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { db } from '../FirebaseConfig';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  writeBatch,
  addDoc,
  updateDoc,
  deleteField,
  type FieldValue,
} from 'firebase/firestore';

export { deleteField };

export type UserProfile = {
  fullName: string;
  phoneNumber: string;
  dateOfBirth: string;
  address: string;
  age?: string;
  gender?: string;
  email?: string;
  role?: 'admin' | 'owner' | 'member';
};

export type Membership = { plan: 'Basic' | 'Standard' | 'Wellness' | 'Platinum'; startDate: string; endDate: string; createdAt: string; status?: 'active' | 'inactive' };

export type AttendanceRecord = {
  id: string;
  date: string;              // YYYY-MM-DD
  checkInTime: string;       // ISO timestamp
  checkOutTime?: string;    // ISO timestamp
  status: 'present' | 'completed';
  verifiedBy?: string;      // staff/admin UID or scanner identifier
  createdAt: string;        // ISO timestamp
};

export type GymAnnouncement = {
  id: string;
  title: string;
  content: string;
  isUrgent: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
};

export type WorkoutChallenge = {
  id: string;
  title: string;
  description: string;
  targetGoal: string;
  startDate: string;
  endDate: string;
  createdAt: string;
};

const keyFor = (uid: string, name: string) => `barbellfitness:${uid}:${name}`;
const profileKey = (uid: string) => keyFor(uid, 'profile'); const imageKey = (uid: string) => keyFor(uid, 'profile-image');
const membershipKey = (uid: string) => keyFor(uid, 'membership'); const prsKey = (uid: string) => keyFor(uid, 'prs');
export const localDateString = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const readJson = async <T>(key: string): Promise<T | null> => { const raw = await AsyncStorage.getItem(key); if (!raw) return null; try { return JSON.parse(raw) as T; } catch { await AsyncStorage.removeItem(key); return null; } };

// Fetch profile directly from Firestore /users/{uid} as authoritative source
export const getProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const remoteData = userDoc.data() as UserProfile;
      await AsyncStorage.setItem(profileKey(uid), JSON.stringify(remoteData));
      return remoteData;
    }
    return null;
  } catch (error) {
    console.error(`Failed to fetch profile from Firestore for user ${uid}:`, error);
    return null;
  }
};

// Fetch profile directly from Firestore to ensure fresh/authoritative role verification
export const fetchUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const remoteData = userDoc.data() as UserProfile;
      await AsyncStorage.setItem(profileKey(uid), JSON.stringify(remoteData));
      return remoteData;
    }
    return null;
  } catch (error) {
    console.error(`Direct Firestore profile fetch failed for user ${uid}:`, error);
    return null;
  }
};

// Authoritative role & route resolution with strict fail-closed behavior
export const resolveUserRoute = async (uid: string): Promise<'AdminMain' | 'Main' | 'Detail'> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const remoteData = userDoc.data() as UserProfile;
      await AsyncStorage.setItem(profileKey(uid), JSON.stringify(remoteData));
      if (remoteData.role === 'owner' || remoteData.role === 'admin') {
        return 'AdminMain';
      }
      return 'Main';
    }
    return 'Detail';
  } catch (error) {
    console.warn('Authoritative Firestore profile verification failed (defaulting to Detail):', error);
    // Strict fail-closed: do NOT use local cache to authorize routes or grant access
    return 'Detail';
  }
};

// Write profile directly to Firestore /users/{uid} as authoritative source
export const saveProfile = async (uid: string, profile: UserProfile): Promise<void> => {
  try {
    await setDoc(doc(db, 'users', uid), profile, { merge: true });
    // Update local cache only after successful Firestore write
    const local = await readJson<UserProfile>(profileKey(uid));
    const merged = { ...(local || {}), ...profile };
    await AsyncStorage.setItem(profileKey(uid), JSON.stringify(merged));
  } catch (error) {
    console.error(`Failed to save profile to Firestore for user ${uid}:`, error);
    throw error;
  }
};

// Fetch membership directly from Firestore subcollection: /users/{uid}/membership/current
export const getMembership = async (uid: string): Promise<Membership | null> => {
  try {
    const memDoc = await getDoc(doc(db, 'users', uid, 'membership', 'current'));
    if (memDoc.exists()) {
      const remoteData = memDoc.data() as Membership;
      await AsyncStorage.setItem(membershipKey(uid), JSON.stringify(remoteData));
      return remoteData;
    }
    return null;
  } catch (error) {
    console.error(`Failed to fetch membership from Firestore for user ${uid}:`, error);
    return null;
  }
};

// Write membership directly to Firestore subcollection: /users/{uid}/membership/current
export const saveMembership = async (uid: string, membership: Membership): Promise<void> => {
  try {
    await setDoc(doc(db, 'users', uid, 'membership', 'current'), membership);
    await AsyncStorage.setItem(membershipKey(uid), JSON.stringify(membership));
  } catch (error) {
    console.error(`Failed to save membership to Firestore for user ${uid}:`, error);
    throw error;
  }
};

// Fetch personal records directly from Firestore subcollection: /users/{uid}/prs/current
export const getPrs = async (uid: string): Promise<Record<string, string> | null> => {
  try {
    const prDoc = await getDoc(doc(db, 'users', uid, 'prs', 'current'));
    if (prDoc.exists()) {
      const remoteData = prDoc.data() as Record<string, string>;
      await AsyncStorage.setItem(prsKey(uid), JSON.stringify(remoteData));
      return remoteData;
    }
    return null;
  } catch (error) {
    console.error(`Failed to fetch PRs from Firestore for user ${uid}:`, error);
    return null;
  }
};

// Write personal records directly to Firestore subcollection: /users/{uid}/prs/current
export const savePrs = async (uid: string, prs: Record<string, string>): Promise<void> => {
  try {
    await setDoc(doc(db, 'users', uid, 'prs', 'current'), prs);
    await AsyncStorage.setItem(prsKey(uid), JSON.stringify(prs));
  } catch (error) {
    console.error(`Failed to save PRs to Firestore for user ${uid}:`, error);
    throw error;
  }
};

export const getProfileImage = (uid: string) => AsyncStorage.getItem(imageKey(uid));
export const saveProfileImage = async (uid: string, sourceUri: string) => { if (!FileSystem.documentDirectory) throw new Error('App documents directory is unavailable.'); const extension = sourceUri.split('.').pop()?.split('?')[0] || 'jpg'; const destination = `${FileSystem.documentDirectory}profile-${uid}.${extension}`; await FileSystem.copyAsync({ from: sourceUri, to: destination }); await AsyncStorage.setItem(imageKey(uid), destination); return destination; };

export type AdminMember = {
  uid: string;
  fullName: string;
  phoneNumber: string;
  dateOfBirth: string;
  address: string;
  age?: string;
  gender?: string;
  email?: string;
  role?: 'admin' | 'owner' | 'member';
  profileImage?: string | null;
  membership?: Membership | null;
};

// Retrieve all members from Firestore users collection
export const getAllMembers = async (): Promise<AdminMember[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    const members: AdminMember[] = [];

    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data() as UserProfile;
      const uid = docSnap.id;
      const membership = await getMembership(uid);
      const profileImage = await getProfileImage(uid);

      members.push({
        uid,
        fullName: data.fullName || '',
        phoneNumber: data.phoneNumber || '',
        dateOfBirth: data.dateOfBirth || '',
        address: data.address || '',
        age: data.age,
        gender: data.gender,
        email: data.email,
        role: data.role,
        profileImage,
        membership,
      });
    }
    return members;
  } catch (error) {
    console.error('Failed to get all members from Firestore:', error);
    return [];
  }
};

// Delete/Remove member (Firestore first, clean up local cache only on success)
export const deleteMember = async (uid: string): Promise<void> => {
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'users', uid));
    batch.delete(doc(db, 'users', uid, 'membership', 'current'));
    batch.delete(doc(db, 'users', uid, 'prs', 'current'));
    await batch.commit();
  } catch (error) {
    console.error('Firestore member delete failed:', error);
    throw error;
  }

  const keys = [profileKey(uid), membershipKey(uid), imageKey(uid), prsKey(uid)];
  await AsyncStorage.multiRemove(keys);
};

// Fetch all attendance records directly from Firestore subcollection: /users/{uid}/attendance
export const getAttendance = async (uid: string): Promise<AttendanceRecord[]> => {
  try {
    const qSnap = await getDocs(collection(db, 'users', uid, 'attendance'));
    const records: AttendanceRecord[] = [];
    qSnap.forEach(docSnap => {
      records.push({ id: docSnap.id, ...docSnap.data() } as AttendanceRecord);
    });
    return records;
  } catch (error) {
    console.error(`Failed to fetch attendance from Firestore for user ${uid}:`, error);
    return [];
  }
};

// Save a new attendance record directly to Firestore subcollection: /users/{uid}/attendance
export const saveAttendance = async (
  uid: string,
  attendance: Omit<AttendanceRecord, 'id'>
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'users', uid, 'attendance'), attendance);
    return docRef.id;
  } catch (error) {
    console.error(`Failed to save attendance to Firestore for user ${uid}:`, error);
    throw error;
  }
};

// Update an existing attendance record directly in Firestore: /users/{uid}/attendance/{attendanceId}
export const updateAttendance = async (
  uid: string,
  attendanceId: string,
  attendance: Partial<Omit<AttendanceRecord, 'id'>> & { checkOutTime?: string | FieldValue }
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', uid, 'attendance', attendanceId), attendance);
  } catch (error) {
    console.error(`Failed to update attendance in Firestore for user ${uid}, record ${attendanceId}:`, error);
    throw error;
  }
};

// Delete an attendance record directly from Firestore: /users/{uid}/attendance/{attendanceId}
export const deleteAttendance = async (uid: string, attendanceId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'users', uid, 'attendance', attendanceId));
  } catch (error) {
    console.error(`Failed to delete attendance from Firestore for user ${uid}, record ${attendanceId}:`, error);
    throw error;
  }
};

// Announcements local key
const announcementsKey = 'barbellfitness:announcements';

export const getAnnouncements = async (): Promise<GymAnnouncement[]> => {
  try {
    const qSnap = await getDocs(collection(db, 'announcements'));
    const remoteList: GymAnnouncement[] = [];
    qSnap.forEach(docSnap => {
      remoteList.push({ id: docSnap.id, ...docSnap.data() } as GymAnnouncement);
    });
    await AsyncStorage.setItem(announcementsKey, JSON.stringify(remoteList));
    return remoteList;
  } catch (error) {
    console.warn('Firestore announcements fetch failed, falling back to local:', error);
    const local = await readJson<GymAnnouncement[]>(announcementsKey);
    return local || [];
  }
};

export const saveAnnouncement = async (announcement: GymAnnouncement): Promise<void> => {
  const current = await getAnnouncements();
  const idx = current.findIndex(a => a.id === announcement.id);
  if (idx > -1) {
    current[idx] = announcement;
  } else {
    current.push(announcement);
  }
  await AsyncStorage.setItem(announcementsKey, JSON.stringify(current));

  try {
    await setDoc(doc(db, 'announcements', announcement.id), announcement);
  } catch (error) {
    console.warn('Firestore announcements save failed:', error);
  }
};

export const deleteAnnouncement = async (id: string): Promise<void> => {
  const current = await getAnnouncements();
  const filtered = current.filter(a => a.id !== id);
  await AsyncStorage.setItem(announcementsKey, JSON.stringify(filtered));

  try {
    await deleteDoc(doc(db, 'announcements', id));
  } catch (error) {
    console.warn('Firestore announcements delete failed:', error);
  }
};

// Challenges local key
const challengesKey = 'barbellfitness:challenges';

export const getChallenges = async (): Promise<WorkoutChallenge[]> => {
  try {
    const qSnap = await getDocs(collection(db, 'challenges'));
    const remoteList: WorkoutChallenge[] = [];
    qSnap.forEach(docSnap => {
      remoteList.push({ id: docSnap.id, ...docSnap.data() } as WorkoutChallenge);
    });
    await AsyncStorage.setItem(challengesKey, JSON.stringify(remoteList));
    return remoteList;
  } catch (error) {
    console.warn('Firestore challenges fetch failed, falling back to local:', error);
    const local = await readJson<WorkoutChallenge[]>(challengesKey);
    return local || [];
  }
};

export const saveChallenge = async (challenge: WorkoutChallenge): Promise<void> => {
  const current = await getChallenges();
  const idx = current.findIndex(c => c.id === challenge.id);
  if (idx > -1) {
    current[idx] = challenge;
  } else {
    current.push(challenge);
  }
  await AsyncStorage.setItem(challengesKey, JSON.stringify(current));

  try {
    await setDoc(doc(db, 'challenges', challenge.id), challenge);
  } catch (error) {
    console.warn('Firestore challenges save failed:', error);
  }
};

export const deleteChallenge = async (id: string): Promise<void> => {
  const current = await getChallenges();
  const filtered = current.filter(c => c.id !== id);
  await AsyncStorage.setItem(challengesKey, JSON.stringify(filtered));

  try {
    await deleteDoc(doc(db, 'challenges', id));
  } catch (error) {
    console.warn('Firestore challenges delete failed:', error);
  }
};
