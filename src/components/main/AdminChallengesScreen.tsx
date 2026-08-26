import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
  Modal,
  Alert,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useFonts, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { Oswald_400Regular, Oswald_600SemiBold, Oswald_700Bold } from '@expo-google-fonts/oswald';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import {
  getChallenges,
  saveChallenge,
  deleteChallenge,
  localDateString,
  type WorkoutChallenge,
} from '../../lib/userStorage';

export default function AdminChallengesScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

  const [fontsLoaded] = useFonts({
    BebasNeue_400Regular,
    Oswald_400Regular,
    Oswald_600SemiBold,
    Oswald_700Bold,
  });

  const [challenges, setChallenges] = useState<WorkoutChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<WorkoutChallenge | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formGoal, setFormGoal] = useState('');
  const [formStartDate, setFormStartDate] = useState(new Date());
  const [formEndDate, setFormEndDate] = useState(new Date());

  // Date Pickers
  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const list = await getChallenges();
      setChallenges(list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch challenges.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchChallenges();
    }
  }, [isFocused]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchChallenges();
  };

  const handleOpenAdd = () => {
    setEditingChallenge(null);
    setFormTitle('');
    setFormDescription('');
    setFormGoal('');
    setFormStartDate(new Date());
    const weekLater = new Date();
    weekLater.setDate(weekLater.getDate() + 7);
    setFormEndDate(weekLater);
    setModalVisible(true);
  };

  const handleOpenEdit = (chal: WorkoutChallenge) => {
    setEditingChallenge(chal);
    setFormTitle(chal.title);
    setFormDescription(chal.description);
    setFormGoal(chal.targetGoal);
    setFormStartDate(new Date(chal.startDate + 'T00:00:00'));
    setFormEndDate(new Date(chal.endDate + 'T00:00:00'));
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim() || !formDescription.trim() || !formGoal.trim()) {
      Alert.alert('Validation Error', 'Please fill in Title, Description, and Goal.');
      return;
    }

    const chal: WorkoutChallenge = {
      id: editingChallenge ? editingChallenge.id : `chal_${Date.now()}`,
      title: formTitle.trim(),
      description: formDescription.trim(),
      targetGoal: formGoal.trim(),
      startDate: localDateString(formStartDate),
      endDate: localDateString(formEndDate),
      createdAt: editingChallenge ? editingChallenge.createdAt : new Date().toISOString(),
    };

    try {
      await saveChallenge(chal);
      Alert.alert('Success', 'Workout challenge posted.');
      setModalVisible(false);
      fetchChallenges();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not save challenge.');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to remove this challenge?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteChallenge(id);
              fetchChallenges();
              Alert.alert('Deleted', 'Challenge removed.');
            } catch (error) {
              console.error(error);
              Alert.alert('Error', 'Could not delete challenge.');
            }
          },
        },
      ]
    );
  };

  if (!fontsLoaded) return null;

  const renderItem = ({ item }: { item: WorkoutChallenge }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(item.endDate + 'T00:00:00');
    const isExpired = today > end;

    return (
      <View style={[styles.card, isExpired && styles.expiredCard]}>
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            {isExpired ? (
              <View style={[styles.badge, styles.expiredBadge]}>
                <Text style={styles.badgeText}>ENDED</Text>
              </View>
            ) : (
              <View style={[styles.badge, styles.activeBadge]}>
                <Text style={styles.badgeText}>ACTIVE</Text>
              </View>
            )}
            <Text style={styles.cardTitle}>{item.title}</Text>
          </View>
          <View style={styles.actionRow}>
            <TouchableOpacity onPress={() => handleOpenEdit(item)} style={styles.iconBtn}>
              <Ionicons name="create-outline" size={20} color="black" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.iconBtn}>
              <Ionicons name="trash-outline" size={20} color="red" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.cardDesc}>{item.description}</Text>

        <View style={styles.cardFooter}>
          <View style={styles.goalContainer}>
            <Text style={styles.label}>GOAL</Text>
            <Text style={styles.goalVal}>{item.targetGoal}</Text>
          </View>
          <View style={styles.dateContainer}>
            <Text style={styles.label}>DURATION</Text>
            <Text style={styles.dateVal}>
              {item.startDate} to {item.endDate}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 15) }]}>
      <View style={styles.header}>
        <Text style={styles.title}>CHALLENGES</Text>
        <Text style={styles.subtitle}>MANAGE ACTIVE FITNESS CHALLENGES</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="black" />
        </View>
      ) : (
        <FlatList
          data={challenges}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="black" />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="trophy-outline" size={48} color="#AAA" />
              <Text style={styles.emptyText}>No Workout Challenges</Text>
              <Text style={styles.emptySubtext}>Tap '+' to post a weekly or monthly challenge.</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity style={[styles.fab, { bottom: Math.max(insets.bottom + 105, 120) }]} onPress={handleOpenAdd}>
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close-outline" size={26} color="black" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{editingChallenge ? 'EDIT CHALLENGE' : 'NEW CHALLENGE'}</Text>
              <View style={{ width: 30 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              <Text style={styles.fieldLabel}>CHALLENGE TITLE *</Text>
              <TextInput
                style={styles.input}
                value={formTitle}
                onChangeText={setFormTitle}
                placeholder="e.g. Max Deadlift Challenge"
                placeholderTextColor="#999"
              />

              <Text style={styles.fieldLabel}>DESCRIPTION *</Text>
              <TextInput
                style={[styles.input, { height: 80 }]}
                value={formDescription}
                onChangeText={setFormDescription}
                placeholder="Describe details and restrictions..."
                placeholderTextColor="#999"
                multiline
                textAlignVertical="top"
              />

              <Text style={styles.fieldLabel}>TARGET GOAL *</Text>
              <TextInput
                style={styles.input}
                value={formGoal}
                onChangeText={setFormGoal}
                placeholder="e.g. Lift 2x Bodyweight or Run 5K < 20 mins"
                placeholderTextColor="#999"
              />

              <Text style={styles.fieldLabel}>START DATE *</Text>
              <TouchableOpacity style={styles.datePickerSelector} onPress={() => setShowStartDate(true)}>
                <Text style={styles.datePickerText}>{localDateString(formStartDate)}</Text>
                <Ionicons name="calendar-outline" size={20} color="#666" />
              </TouchableOpacity>

              {showStartDate && (
                <DateTimePicker
                  value={formStartDate}
                  mode="date"
                  display="default"
                  onChange={(_event, date) => {
                    setShowStartDate(false);
                    if (date) setFormStartDate(date);
                  }}
                />
              )}

              <Text style={styles.fieldLabel}>EXPIRATION DATE *</Text>
              <TouchableOpacity style={styles.datePickerSelector} onPress={() => setShowEndDate(true)}>
                <Text style={styles.datePickerText}>{localDateString(formEndDate)}</Text>
                <Ionicons name="calendar-outline" size={20} color="#666" />
              </TouchableOpacity>

              {showEndDate && (
                <DateTimePicker
                  value={formEndDate}
                  mode="date"
                  display="default"
                  onChange={(_event, date) => {
                    setShowEndDate(false);
                    if (date) setFormEndDate(date);
                  }}
                />
              )}

              <TouchableOpacity style={styles.submitBtn} onPress={handleSave}>
                <Text style={styles.submitBtnText}>PUBLISH CHALLENGE</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  header: { paddingHorizontal: 20, marginBottom: 15 },
  title: { fontFamily: 'BebasNeue_400Regular', fontSize: 40, letterSpacing: 2, color: 'black' },
  subtitle: { fontFamily: 'Oswald_600SemiBold', fontSize: 11, letterSpacing: 2, color: '#777' },
  listContent: { paddingHorizontal: 20, paddingBottom: 110 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EAEAEA',
    padding: 16,
    marginBottom: 14,
  },
  expiredCard: { borderColor: '#E5E5E5', opacity: 0.75 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  titleRow: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  cardTitle: { fontFamily: 'Oswald_700Bold', fontSize: 18, color: 'black', flex: 1, minWidth: 150 },
  actionRow: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { padding: 6, marginLeft: 8 },
  cardDesc: { fontFamily: 'Oswald_400Regular', fontSize: 14, color: '#444', lineHeight: 20, marginBottom: 14 },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  activeBadge: { backgroundColor: '#4CAF50' },
  expiredBadge: { backgroundColor: '#777' },
  badgeText: { color: 'white', fontFamily: 'Oswald_700Bold', fontSize: 9 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1.5,
    borderColor: '#F5F5F5',
    paddingTop: 10,
  },
  goalContainer: { flex: 1 },
  dateContainer: { alignItems: 'flex-end', flex: 1 },
  label: { fontFamily: 'Oswald_700Bold', fontSize: 9, color: '#999', letterSpacing: 0.5 },
  goalVal: { fontFamily: 'Oswald_600SemiBold', fontSize: 13, color: '#111', marginTop: 2 },
  dateVal: { fontFamily: 'Oswald_400Regular', fontSize: 12, color: '#555', marginTop: 2 },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 18, paddingHorizontal: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1.5, borderColor: '#EAEAEA', paddingBottom: 12, marginBottom: 16 },
  closeBtn: { padding: 4 },
  modalTitle: { fontFamily: 'BebasNeue_400Regular', fontSize: 26, letterSpacing: 1.5 },
  fieldLabel: { fontFamily: 'Oswald_700Bold', fontSize: 11, color: 'black', letterSpacing: 1, marginBottom: 6, marginTop: 10 },
  input: { borderWidth: 1.5, borderColor: '#E2E2E2', borderRadius: 10, paddingHorizontal: 12, height: 46, fontFamily: 'Oswald_400Regular', fontSize: 15, color: 'black', marginBottom: 14, backgroundColor: '#FAFAFA' },
  datePickerSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1.5, borderColor: '#E2E2E2', borderRadius: 10, paddingHorizontal: 12, height: 46, marginBottom: 14, backgroundColor: '#FAFAFA' },
  datePickerText: { fontFamily: 'Oswald_400Regular', fontSize: 15, color: 'black' },
  submitBtn: { backgroundColor: 'black', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  submitBtnText: { color: 'white', fontFamily: 'BebasNeue_400Regular', fontSize: 22, letterSpacing: 2 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyText: { fontFamily: 'BebasNeue_400Regular', fontSize: 24, color: '#666', marginTop: 12 },
  emptySubtext: { fontFamily: 'Oswald_400Regular', fontSize: 13, color: '#999' },
});
