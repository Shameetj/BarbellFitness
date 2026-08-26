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
  Switch,
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
  getAnnouncements,
  saveAnnouncement,
  deleteAnnouncement,
  localDateString,
  type GymAnnouncement,
} from '../../lib/userStorage';

export default function AdminAnnouncementsScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

  const [fontsLoaded] = useFonts({
    BebasNeue_400Regular,
    Oswald_400Regular,
    Oswald_600SemiBold,
    Oswald_700Bold,
  });

  const [announcements, setAnnouncements] = useState<GymAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<GymAnnouncement | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formIsUrgent, setFormIsUrgent] = useState(false);
  const [formIsClosure, setFormIsClosure] = useState(false);
  const [formStartDate, setFormStartDate] = useState(new Date());
  const [formEndDate, setFormEndDate] = useState(new Date());

  // Date Pickers
  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const list = await getAnnouncements();
      setAnnouncements(list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch announcements.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchAnnouncements();
    }
  }, [isFocused]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnnouncements();
  };

  const handleOpenAdd = () => {
    setEditingAnnouncement(null);
    setFormTitle('');
    setFormContent('');
    setFormIsUrgent(false);
    setFormIsClosure(false);
    setFormStartDate(new Date());
    setFormEndDate(new Date());
    setModalVisible(true);
  };

  const handleOpenEdit = (ann: GymAnnouncement) => {
    setEditingAnnouncement(ann);
    setFormTitle(ann.title);
    setFormContent(ann.content);
    setFormIsUrgent(ann.isUrgent);
    setFormIsClosure(!!(ann.startDate && ann.endDate));
    setFormStartDate(ann.startDate ? new Date(ann.startDate + 'T00:00:00') : new Date());
    setFormEndDate(ann.endDate ? new Date(ann.endDate + 'T00:00:00') : new Date());
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim() || !formContent.trim()) {
      Alert.alert('Validation Error', 'Please enter both Title and Content.');
      return;
    }

    const ann: GymAnnouncement = {
      id: editingAnnouncement ? editingAnnouncement.id : `ann_${Date.now()}`,
      title: formTitle.trim(),
      content: formContent.trim(),
      isUrgent: formIsUrgent,
      startDate: formIsClosure ? localDateString(formStartDate) : undefined,
      endDate: formIsClosure ? localDateString(formEndDate) : undefined,
      createdAt: editingAnnouncement ? editingAnnouncement.createdAt : new Date().toISOString(),
    };

    try {
      await saveAnnouncement(ann);
      Alert.alert('Success', 'Announcement posted successfully.');
      setModalVisible(false);
      fetchAnnouncements();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not save announcement.');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this announcement?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAnnouncement(id);
              fetchAnnouncements();
              Alert.alert('Deleted', 'Announcement removed.');
            } catch (error) {
              console.error(error);
              Alert.alert('Error', 'Could not delete announcement.');
            }
          },
        },
      ]
    );
  };

  if (!fontsLoaded) return null;

  const renderItem = ({ item }: { item: GymAnnouncement }) => {
    const isClosure = item.startDate && item.endDate;
    return (
      <View style={[styles.card, item.isUrgent && styles.urgentCard]}>
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            {item.isUrgent && (
              <View style={styles.urgentBadge}>
                <Text style={styles.urgentBadgeText}>URGENT</Text>
              </View>
            )}
            {isClosure && (
              <View style={styles.closureBadge}>
                <Text style={styles.closureBadgeText}>CLOSURE</Text>
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

        <Text style={styles.cardContent}>{item.content}</Text>

        {isClosure && (
          <View style={styles.closureDatesContainer}>
            <Ionicons name="calendar-outline" size={14} color="#555" />
            <Text style={styles.closureDatesText}>
              Closed: {item.startDate} to {item.endDate}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 15) }]}>
      <View style={styles.header}>
        <Text style={styles.title}>ANNOUNCEMENTS</Text>
        <Text style={styles.subtitle}>MANAGE GYM UPDATES & CLOSURES</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="black" />
        </View>
      ) : (
        <FlatList
          data={announcements}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="black" />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="megaphone-outline" size={48} color="#AAA" />
              <Text style={styles.emptyText}>No Announcements Yet</Text>
              <Text style={styles.emptySubtext}>Tap '+' to post a gym update.</Text>
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
              <Text style={styles.modalTitle}>{editingAnnouncement ? 'EDIT ANNOUNCEMENT' : 'NEW ANNOUNCEMENT'}</Text>
              <View style={{ width: 30 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              <Text style={styles.fieldLabel}>ANNOUNCEMENT TITLE *</Text>
              <TextInput
                style={styles.input}
                value={formTitle}
                onChangeText={setFormTitle}
                placeholder="e.g. Schedule Maintenance"
                placeholderTextColor="#999"
              />

              <Text style={styles.fieldLabel}>CONTENT / DESCRIPTION *</Text>
              <TextInput
                style={[styles.input, { height: 100 }]}
                value={formContent}
                onChangeText={setFormContent}
                placeholder="Write announcement details here..."
                placeholderTextColor="#999"
                multiline
                textAlignVertical="top"
              />

              {/* Switches */}
              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.switchLabel}>URGENT UPLOAD</Text>
                  <Text style={styles.switchDesc}>Show red alert badge on member home feeds</Text>
                </View>
                <Switch
                  value={formIsUrgent}
                  onValueChange={setFormIsUrgent}
                  trackColor={{ false: '#DDD', true: '#FF6B6B' }}
                  thumbColor={formIsUrgent ? '#E53935' : '#FFF'}
                />
              </View>

              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.switchLabel}>SCHEDULE GYM CLOSURE</Text>
                  <Text style={styles.switchDesc}>Set start/end date range for app closure indicators</Text>
                </View>
                <Switch
                  value={formIsClosure}
                  onValueChange={setFormIsClosure}
                  trackColor={{ false: '#DDD', true: '#000' }}
                  thumbColor={formIsClosure ? '#000' : '#FFF'}
                />
              </View>

              {formIsClosure && (
                <View style={styles.dateRangeContainer}>
                  <Text style={styles.fieldLabel}>CLOSURE START DATE</Text>
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

                  <Text style={styles.fieldLabel}>CLOSURE END DATE</Text>
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
                </View>
              )}

              <TouchableOpacity style={styles.submitBtn} onPress={handleSave}>
                <Text style={styles.submitBtnText}>PUBLISH ANNOUNCEMENT</Text>
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
  urgentCard: { borderColor: '#FFD2D2', backgroundColor: '#FFF5F5' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  titleRow: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  cardTitle: { fontFamily: 'Oswald_700Bold', fontSize: 18, color: 'black', flex: 1, minWidth: 150 },
  actionRow: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { padding: 6, marginLeft: 8 },
  cardContent: { fontFamily: 'Oswald_400Regular', fontSize: 14, color: '#444', lineHeight: 20 },
  urgentBadge: {
    backgroundColor: '#E53935',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  urgentBadgeText: { color: 'white', fontFamily: 'Oswald_700Bold', fontSize: 9 },
  closureBadge: {
    backgroundColor: '#000000',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  closureBadgeText: { color: 'white', fontFamily: 'Oswald_700Bold', fontSize: 9 },
  closureDatesContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 10, backgroundColor: '#FAFAFA', padding: 8, borderRadius: 8 },
  closureDatesText: { fontFamily: 'Oswald_600SemiBold', fontSize: 12, color: '#555', marginLeft: 6 },
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
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#EEE', paddingVertical: 12 },
  switchLabel: { fontFamily: 'Oswald_700Bold', fontSize: 13, color: 'black' },
  switchDesc: { fontFamily: 'Oswald_400Regular', fontSize: 11, color: '#777', marginTop: 2, marginRight: 20 },
  dateRangeContainer: { backgroundColor: '#F9F9F9', padding: 12, borderRadius: 12, marginTop: 10, borderWidth: 1, borderColor: '#EEE' },
  datePickerSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1.5, borderColor: '#E2E2E2', borderRadius: 10, paddingHorizontal: 12, height: 46, marginBottom: 10, backgroundColor: '#FAFAFA' },
  datePickerText: { fontFamily: 'Oswald_400Regular', fontSize: 15, color: 'black' },
  submitBtn: { backgroundColor: 'black', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  submitBtnText: { color: 'white', fontFamily: 'BebasNeue_400Regular', fontSize: 22, letterSpacing: 2 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyText: { fontFamily: 'BebasNeue_400Regular', fontSize: 24, color: '#666', marginTop: 12 },
  emptySubtext: { fontFamily: 'Oswald_400Regular', fontSize: 13, color: '#999' },
});
