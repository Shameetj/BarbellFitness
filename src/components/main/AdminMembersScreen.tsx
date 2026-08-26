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
  Platform,
  Image,
  Linking,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useFonts, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { Oswald_400Regular, Oswald_600SemiBold, Oswald_700Bold } from '@expo-google-fonts/oswald';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import {
  getAllMembers,
  saveProfile,
  saveMembership,
  saveProfileImage,
  deleteMember,
  localDateString,
  type AdminMember,
  type Membership,
  type UserProfile,
} from '../../lib/userStorage';

type FilterType = 'All' | 'Active' | 'Expiring' | 'Expired';

export default function AdminMembersScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

  const [fontsLoaded] = useFonts({
    BebasNeue_400Regular,
    Oswald_400Regular,
    Oswald_600SemiBold,
    Oswald_700Bold,
  });

  const [members, setMembers] = useState<AdminMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<AdminMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedMember, setSelectedMember] = useState<AdminMember | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Form states (Add / Edit)
  const [formName, setFormName] = useState('');
  const [formAge, setFormAge] = useState('');
  const [formGender, setFormGender] = useState('Male');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formDOB, setFormDOB] = useState('');
  const [formPhoto, setFormPhoto] = useState<string | null>(null);
  const [formPlan, setFormPlan] = useState<'Basic' | 'Standard' | 'Wellness' | 'Platinum'>('Standard');
  const [formStartDate, setFormStartDate] = useState(new Date());

  // Date Pickers
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showRenewDatePicker, setShowRenewDatePicker] = useState(false);
  const [renewDate, setRenewDate] = useState(new Date());
  const [renewPlan, setRenewPlan] = useState<'Basic' | 'Standard' | 'Wellness' | 'Platinum'>('Standard');
  const [renewing, setRenewing] = useState(false);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const data = await getAllMembers();
      // Sort members by subscription start date descending (latest joined first)
      const sorted = data.sort((a, b) => {
        const dateA = a.membership?.startDate || '1970-01-01';
        const dateB = b.membership?.startDate || '1970-01-01';
        return dateB.localeCompare(dateA);
      });
      setMembers(sorted);
      applyFilters(sorted, searchQuery, activeFilter);
    } catch (error) {
      console.error('Failed to load members', error);
      Alert.alert('Error', 'Failed to fetch gym members list.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchMembers();
    }
  }, [isFocused]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMembers();
  };

  const getMemberStatus = (member: AdminMember) => {
    if (!member.membership || member.membership.status === 'inactive') {
      return 'Expired';
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(member.membership.endDate + 'T00:00:00');
    
    if (today > end) {
      return 'Expired';
    }
    
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7) {
      return 'Expiring Soon';
    }
    
    return 'Active';
  };

  const getDaysRemaining = (member: AdminMember) => {
    if (!member.membership || member.membership.status === 'inactive') {
      return 0;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(member.membership.endDate + 'T00:00:00');
    if (today > end) return 0;
    const diffTime = end.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const applyFilters = (dataList: AdminMember[], query: string, filter: FilterType) => {
    let list = [...dataList];

    // Query filter
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        m =>
          m.fullName?.toLowerCase().includes(q) ||
          m.phoneNumber?.includes(q) ||
          m.email?.toLowerCase().includes(q)
      );
    }

    // Tab filter
    if (filter === 'Active') {
      list = list.filter(m => getMemberStatus(m) === 'Active');
    } else if (filter === 'Expiring') {
      list = list.filter(m => getMemberStatus(m) === 'Expiring Soon');
    } else if (filter === 'Expired') {
      list = list.filter(m => getMemberStatus(m) === 'Expired');
    }

    setFilteredMembers(list);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    applyFilters(members, text, activeFilter);
  };

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    applyFilters(members, searchQuery, filter);
  };

  const handleContactAction = (type: 'call' | 'whatsapp', phone: string) => {
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const url = type === 'call' ? `tel:${cleanPhone}` : `whatsapp://send?phone=${cleanPhone}`;
    Linking.canOpenURL(url)
      .then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Error', `This action is not supported on your device.`);
        }
      })
      .catch(() => Alert.alert('Error', 'An error occurred.'));
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Denied', 'Camera access is required to take a profile photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setFormPhoto(result.assets[0].uri);
    }
  };

  const handleAddMember = async () => {
    if (!formName.trim() || !formPhone.trim() || !formDOB.trim() || !formAddress.trim()) {
      Alert.alert('Validation Error', 'Please fill in Name, Phone, Date of Birth, and Address.');
      return;
    }

    const tempUid = `member_${Date.now()}`;
    const profile: UserProfile = {
      fullName: formName.trim(),
      phoneNumber: formPhone.trim(),
      dateOfBirth: formDOB.trim(),
      address: formAddress.trim(),
      age: formAge.trim() || undefined,
      gender: formGender,
      email: formEmail.trim() || undefined,
    };

    // calculate end date (1 month by default)
    const end = new Date(formStartDate);
    end.setMonth(end.getMonth() + 1);

    const membership: Membership = {
      plan: formPlan,
      startDate: localDateString(formStartDate),
      endDate: localDateString(end),
      createdAt: new Date().toISOString(),
      status: 'active',
    };

    try {
      await saveProfile(tempUid, profile);
      await saveMembership(tempUid, membership);
      if (formPhoto) {
        await saveProfileImage(tempUid, formPhoto);
      }
      Alert.alert('Success', 'New member successfully registered.');
      setAddModalVisible(false);
      resetForm();
      fetchMembers();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not save new member.');
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedMember) return;
    if (!formName.trim() || !formPhone.trim() || !formDOB.trim() || !formAddress.trim()) {
      Alert.alert('Validation Error', 'Please fill in Name, Phone, Date of Birth, and Address.');
      return;
    }

    const profile: UserProfile = {
      fullName: formName.trim(),
      phoneNumber: formPhone.trim(),
      dateOfBirth: formDOB.trim(),
      address: formAddress.trim(),
      age: formAge.trim() || undefined,
      gender: formGender,
      email: formEmail.trim() || undefined,
    };

    try {
      await saveProfile(selectedMember.uid, profile);
      if (formPhoto && formPhoto !== selectedMember.profileImage) {
        await saveProfileImage(selectedMember.uid, formPhoto);
      }
      
      // Update local object representation in detail view
      const updatedMember = {
        ...selectedMember,
        ...profile,
        profileImage: formPhoto,
      };
      setSelectedMember(updatedMember);
      setEditMode(false);
      Alert.alert('Success', 'Member details updated successfully.');
      fetchMembers();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not update member details.');
    }
  };

  const handleMarkInactive = async (member: AdminMember) => {
    Alert.alert(
      'Confirm Action',
      `Are you sure you want to mark ${member.fullName} as INACTIVE? This will expire their membership immediately.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            if (!member.membership) return;
            const updated: Membership = {
              ...member.membership,
              status: 'inactive',
            };
            try {
              await saveMembership(member.uid, updated);
              setSelectedMember({ ...member, membership: updated });
              fetchMembers();
              Alert.alert('Success', 'Member marked as inactive.');
            } catch (e) {
              console.error(e);
              Alert.alert('Error', 'Failed to update membership.');
            }
          },
        },
      ]
    );
  };

  const handleRenewPlan = async () => {
    if (!selectedMember) return;
    const start = new Date(renewDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1); // Extend plan by 1 month

    const updated: Membership = {
      plan: renewPlan,
      startDate: localDateString(start),
      endDate: localDateString(end),
      createdAt: new Date().toISOString(),
      status: 'active',
    };

    try {
      await saveMembership(selectedMember.uid, updated);
      setSelectedMember({ ...selectedMember, membership: updated });
      setRenewing(false);
      fetchMembers();
      Alert.alert('Success', `Plan successfully renewed/extended for 1 month.`);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to renew plan.');
    }
  };

  const handleDeleteMember = async (member: AdminMember) => {
    Alert.alert(
      'Delete Member',
      `Are you sure you want to permanently delete ${member.fullName} from the registry?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMember(member.uid);
              setDetailModalVisible(false);
              fetchMembers();
              Alert.alert('Deleted', 'Member has been deleted.');
            } catch (e) {
              console.error(e);
              Alert.alert('Error', 'Failed to delete member.');
            }
          },
        },
      ]
    );
  };

  const startEditMode = (member: AdminMember) => {
    setFormName(member.fullName || '');
    setFormAge(member.age || '');
    setFormGender(member.gender || 'Male');
    setFormPhone(member.phoneNumber || '');
    setFormEmail(member.email || '');
    setFormAddress(member.address || '');
    setFormDOB(member.dateOfBirth || '');
    setFormPhoto(member.profileImage || null);
    setEditMode(true);
  };

  const resetForm = () => {
    setFormName('');
    setFormAge('');
    setFormGender('Male');
    setFormPhone('');
    setFormEmail('');
    setFormAddress('');
    setFormDOB('');
    setFormPhoto(null);
    setFormPlan('Standard');
    setFormStartDate(new Date());
  };

  if (!fontsLoaded) return null;

  const renderMemberCard = ({ item }: { item: AdminMember }) => {
    const status = getMemberStatus(item);
    const initials = item.fullName
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'M';

    const statusColor =
      status === 'Active' ? '#4CAF50' : status === 'Expiring Soon' ? '#FF9800' : '#E53935';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          setSelectedMember(item);
          setRenewPlan(item.membership?.plan || 'Standard');
          setDetailModalVisible(true);
          setEditMode(false);
        }}
        activeOpacity={0.85}
      >
        <View style={styles.cardHeader}>
          {item.profileImage ? (
            <Image source={{ uri: item.profileImage }} style={styles.avatar} />
          ) : (
            <View style={styles.initialsContainer}>
              <Text style={styles.initialsText}>{initials}</Text>
            </View>
          )}
          <View style={styles.cardDetails}>
            <Text style={styles.cardName}>{item.fullName}</Text>
            <Text style={styles.cardMeta}>
              {item.gender || 'Not Specified'} • {item.age ? `${item.age} years` : 'Age N/A'}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.planInfo}>
            <Text style={styles.planLabel}>ACTIVE PLAN</Text>
            <Text style={styles.planValue}>{item.membership?.plan || 'No Active Plan'}</Text>
          </View>

          <View style={styles.statusSection}>
            <View style={[styles.statusPill, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>{status.toUpperCase()}</Text>
            </View>
            {item.membership && (
              <Text style={styles.expDate}>Exp: {item.membership.endDate}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 15) }]}>
      <View style={styles.header}>
        <Text style={styles.title}>GYM OWNER</Text>
        <Text style={styles.subtitle}>MEMBER REGISTRY & SUB-TRACKER</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#777" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, phone or email..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={18} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {(['All', 'Active', 'Expiring', 'Expired'] as FilterType[]).map(filter => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              activeFilter === filter && styles.activeFilterTab,
            ]}
            onPress={() => handleFilterChange(filter)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterTabText,
                activeFilter === filter && styles.activeFilterTabText,
              ]}
            >
              {filter === 'Expiring' ? 'EXPIRING (7d)' : filter.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Member List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="black" />
          <Text style={styles.loadingText}>Fetching registry data...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredMembers}
          keyExtractor={item => item.uid}
          renderItem={renderMemberCard}
          contentContainerStyle={styles.listContent}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="black" />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#AAA" />
              <Text style={styles.emptyText}>No members found</Text>
              <Text style={styles.emptySubtext}>Try refining your query or filters</Text>
            </View>
          }
        />
      )}

      {/* FAB to Add Member */}
      <TouchableOpacity
        style={[styles.fab, { bottom: Math.max(insets.bottom + 105, 120) }]}
        onPress={() => {
          resetForm();
          setAddModalVisible(true);
        }}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      {/* Member Detail Modal */}
      {selectedMember && (
        <Modal
          visible={detailModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setDetailModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxHeight: '90%' }]}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  style={styles.closeModalButton}
                  onPress={() => setDetailModalVisible(false)}
                >
                  <Ionicons name="close-outline" size={26} color="black" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>{editMode ? 'EDIT MEMBER' : 'MEMBER RECORD'}</Text>
                <TouchableOpacity
                  style={styles.editModalButton}
                  onPress={() => {
                    if (editMode) {
                      handleSaveEdit();
                    } else {
                      startEditMode(selectedMember);
                    }
                  }}
                >
                  <Text style={styles.editModalButtonText}>{editMode ? 'SAVE' : 'EDIT'}</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
                {editMode ? (
                  // Edit Form Mode
                  <View style={styles.modalForm}>
                    <TouchableOpacity style={styles.formPhotoPicker} onPress={pickImage}>
                      {formPhoto ? (
                        <Image source={{ uri: formPhoto }} style={styles.formPhoto} />
                      ) : (
                        <View style={styles.formPhotoPlaceholder}>
                          <Ionicons name="camera" size={32} color="#888" />
                          <Text style={styles.formPhotoText}>TAKE PROFILE PHOTO</Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    <Text style={styles.fieldLabel}>FULL NAME *</Text>
                    <TextInput
                      style={styles.formInput}
                      value={formName}
                      onChangeText={setFormName}
                      placeholder="e.g. John Doe"
                      placeholderTextColor="#999"
                    />

                    <View style={styles.rowInputs}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={styles.fieldLabel}>AGE</Text>
                        <TextInput
                          style={styles.formInput}
                          value={formAge}
                          onChangeText={setFormAge}
                          placeholder="e.g. 25"
                          placeholderTextColor="#999"
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.fieldLabel}>GENDER</Text>
                        <View style={styles.genderRow}>
                          {['Male', 'Female'].map(g => (
                            <TouchableOpacity
                              key={g}
                              style={[
                                styles.genderOption,
                                formGender === g && styles.genderOptionSelected,
                              ]}
                              onPress={() => setFormGender(g)}
                            >
                              <Text
                                style={[
                                  styles.genderOptionText,
                                  formGender === g && styles.genderOptionTextSelected,
                                ]}
                              >
                                {g.toUpperCase()}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    </View>

                    <Text style={styles.fieldLabel}>DATE OF BIRTH *</Text>
                    <TouchableOpacity
                      style={styles.datePickerSelector}
                      onPress={() => setShowDobPicker(true)}
                    >
                      <Text style={styles.datePickerText}>
                        {formDOB || 'Select Birth Date'}
                      </Text>
                      <Ionicons name="calendar-outline" size={20} color="#666" />
                    </TouchableOpacity>

                    {showDobPicker && (
                      <DateTimePicker
                        value={formDOB ? new Date(`${formDOB}T00:00:00`) : new Date()}
                        mode="date"
                        display="default"
                        onChange={(_event, date) => {
                          setShowDobPicker(false);
                          if (date) setFormDOB(localDateString(date));
                        }}
                      />
                    )}

                    <Text style={styles.fieldLabel}>PHONE NUMBER *</Text>
                    <TextInput
                      style={styles.formInput}
                      value={formPhone}
                      onChangeText={setFormPhone}
                      placeholder="e.g. +1234567890"
                      placeholderTextColor="#999"
                      keyboardType="phone-pad"
                    />

                    <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
                    <TextInput
                      style={styles.formInput}
                      value={formEmail}
                      onChangeText={setFormEmail}
                      placeholder="e.g. member@barbell.com"
                      placeholderTextColor="#999"
                      keyboardType="email-address"
                    />

                    <Text style={styles.fieldLabel}>ADDRESS *</Text>
                    <TextInput
                      style={[styles.formInput, { height: 75 }]}
                      value={formAddress}
                      onChangeText={setFormAddress}
                      placeholder="e.g. Street, City"
                      placeholderTextColor="#999"
                      multiline
                    />
                  </View>
                ) : (
                  // Detail Information View Mode
                  <View style={styles.modalDetailContainer}>
                    <View style={styles.detailAvatarRow}>
                      {selectedMember.profileImage ? (
                        <Image source={{ uri: selectedMember.profileImage }} style={styles.largeAvatar} />
                      ) : (
                        <View style={styles.largeInitials}>
                          <Text style={styles.largeInitialsText}>
                            {selectedMember.fullName
                              ?.split(' ')
                              .map(n => n[0])
                              .join('')
                              .substring(0, 2)
                              .toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <Text style={styles.detailName}>{selectedMember.fullName}</Text>
                      <Text style={styles.detailMeta}>
                        {selectedMember.gender} • {selectedMember.age ? `${selectedMember.age} years old` : 'Age N/A'}
                      </Text>
                    </View>

                    {/* Quick Contacts */}
                    <View style={styles.contactsBar}>
                      <TouchableOpacity
                        style={styles.contactBtn}
                        onPress={() => handleContactAction('call', selectedMember.phoneNumber)}
                      >
                        <Ionicons name="call" size={18} color="white" />
                        <Text style={styles.contactBtnText}>CALL MEMBER</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.contactBtn, { backgroundColor: '#25D366' }]}
                        onPress={() => handleContactAction('whatsapp', selectedMember.phoneNumber)}
                      >
                        <Ionicons name="logo-whatsapp" size={18} color="white" />
                        <Text style={styles.contactBtnText}>WHATSAPP</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Subscription Timeline */}
                    <Text style={styles.subDetailSectionTitle}>MEMBERSHIP STATUS</Text>
                    <View style={styles.timelineCard}>
                      <View style={styles.timelineRow}>
                        <View>
                          <Text style={styles.timelineLabel}>PLAN NAME</Text>
                          <Text style={styles.timelineVal}>{selectedMember.membership?.plan || 'No active plan'}</Text>
                        </View>
                        <View style={[styles.statusPill, { backgroundColor: getMemberStatus(selectedMember) === 'Active' ? '#4CAF50' : getMemberStatus(selectedMember) === 'Expiring Soon' ? '#FF9800' : '#E53935' }]}>
                          <Text style={styles.statusText}>{getMemberStatus(selectedMember).toUpperCase()}</Text>
                        </View>
                      </View>
                      <View style={styles.timelineDivider} />
                      <View style={styles.timelineRow}>
                        <View>
                          <Text style={styles.timelineLabel}>START DATE</Text>
                          <Text style={styles.timelineVal}>{selectedMember.membership?.startDate || '-'}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.timelineLabel}>EXPIRATION DATE</Text>
                          <Text style={styles.timelineVal}>{selectedMember.membership?.endDate || '-'}</Text>
                        </View>
                      </View>
                      <View style={styles.timelineDivider} />
                      <View style={styles.timelineRow}>
                        <Text style={styles.timelineLabel}>TOTAL DAYS REMAINING</Text>
                        <Text style={styles.daysCounter}>{getDaysRemaining(selectedMember)} DAYS</Text>
                      </View>
                    </View>

                    {/* User Metadata */}
                    <Text style={styles.subDetailSectionTitle}>ADDITIONAL PROFILE INFO</Text>
                    <View style={styles.infoFields}>
                      <View style={styles.infoFieldRow}>
                        <Text style={styles.infoFieldLabel}>EMAIL</Text>
                        <Text style={styles.infoFieldVal}>{selectedMember.email || 'N/A'}</Text>
                      </View>
                      <View style={styles.infoFieldRow}>
                        <Text style={styles.infoFieldLabel}>DATE OF BIRTH</Text>
                        <Text style={styles.infoFieldVal}>{selectedMember.dateOfBirth || '-'}</Text>
                      </View>
                      <View style={styles.infoFieldRow}>
                        <Text style={styles.infoFieldLabel}>PHONE</Text>
                        <Text style={styles.infoFieldVal}>{selectedMember.phoneNumber || '-'}</Text>
                      </View>
                      <View style={styles.infoFieldRow}>
                        <Text style={styles.infoFieldLabel}>ADDRESS</Text>
                        <Text style={styles.infoFieldVal}>{selectedMember.address || '-'}</Text>
                      </View>
                    </View>

                    {/* Plan Renewal / Actions Area */}
                    {renewing ? (
                      <View style={styles.renewalArea}>
                        <Text style={styles.subDetailSectionTitle}>RENEW OR CHANGE SUBSCRIPTION</Text>
                        <View style={styles.formInputLabelRow}>
                          <Text style={styles.fieldLabel}>SELECT PLAN</Text>
                          <View style={styles.planSelectorRow}>
                            {(['Basic', 'Standard', 'Wellness', 'Platinum'] as const).map(p => (
                              <TouchableOpacity
                                key={p}
                                style={[
                                  styles.planPill,
                                  renewPlan === p && styles.planPillSelected,
                                ]}
                                onPress={() => setRenewPlan(p)}
                              >
                                <Text
                                  style={[
                                    styles.planPillText,
                                    renewPlan === p && styles.planPillTextSelected,
                                  ]}
                                >
                                  {p.toUpperCase()}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>

                        <Text style={styles.fieldLabel}>START DATE</Text>
                        <TouchableOpacity
                          style={styles.datePickerSelector}
                          onPress={() => setShowRenewDatePicker(true)}
                        >
                          <Text style={styles.datePickerText}>
                            {localDateString(renewDate)}
                          </Text>
                          <Ionicons name="calendar-outline" size={20} color="#666" />
                        </TouchableOpacity>

                        {showRenewDatePicker && (
                          <DateTimePicker
                            value={renewDate}
                            mode="date"
                            display="default"
                            onChange={(_event, date) => {
                              setShowRenewDatePicker(false);
                              if (date) setRenewDate(date);
                            }}
                          />
                        )}

                        <View style={styles.renewalActions}>
                          <TouchableOpacity
                            style={[styles.renewSubmitBtn, { backgroundColor: '#666' }]}
                            onPress={() => setRenewing(false)}
                          >
                            <Text style={styles.renewSubmitBtnText}>CANCEL</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.renewSubmitBtn}
                            onPress={handleRenewPlan}
                          >
                            <Text style={styles.renewSubmitBtnText}>CONFIRM EXTENSION</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.actionButtonsRow}>
                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={() => setRenewing(true)}
                        >
                          <Ionicons name="refresh-circle-outline" size={22} color="black" />
                          <Text style={styles.actionBtnTxt}>RENEW PLAN</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={() => handleMarkInactive(selectedMember)}
                        >
                          <Ionicons name="ban-outline" size={20} color="black" />
                          <Text style={styles.actionBtnTxt}>MARK INACTIVE</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.deleteBtn]}
                          onPress={() => handleDeleteMember(selectedMember)}
                        >
                          <Ionicons name="trash-outline" size={20} color="red" />
                          <Text style={[styles.actionBtnTxt, { color: 'red' }]}>DELETE</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Add New Member Modal */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setAddModalVisible(false)}
              >
                <Ionicons name="close-outline" size={26} color="black" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>ADD NEW MEMBER</Text>
              <View style={{ width: 44 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              <View style={styles.modalForm}>
                <TouchableOpacity style={styles.formPhotoPicker} onPress={pickImage}>
                  {formPhoto ? (
                    <Image source={{ uri: formPhoto }} style={styles.formPhoto} />
                  ) : (
                    <View style={styles.formPhotoPlaceholder}>
                      <Ionicons name="camera" size={32} color="#888" />
                      <Text style={styles.formPhotoText}>TAKE MEMBER PHOTO</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <Text style={styles.fieldLabel}>FULL NAME *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formName}
                  onChangeText={setFormName}
                  placeholder="e.g. John Doe"
                  placeholderTextColor="#999"
                />

                <View style={styles.rowInputs}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.fieldLabel}>AGE</Text>
                    <TextInput
                      style={styles.formInput}
                      value={formAge}
                      onChangeText={setFormAge}
                      placeholder="e.g. 25"
                      placeholderTextColor="#999"
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.fieldLabel}>GENDER</Text>
                    <View style={styles.genderRow}>
                      {['Male', 'Female'].map(g => (
                        <TouchableOpacity
                          key={g}
                          style={[
                            styles.genderOption,
                            formGender === g && styles.genderOptionSelected,
                          ]}
                          onPress={() => setFormGender(g)}
                        >
                          <Text
                            style={[
                              styles.genderOptionText,
                              formGender === g && styles.genderOptionTextSelected,
                            ]}
                          >
                            {g.toUpperCase()}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                <Text style={styles.fieldLabel}>DATE OF BIRTH *</Text>
                <TouchableOpacity
                  style={styles.datePickerSelector}
                  onPress={() => setShowDobPicker(true)}
                >
                  <Text style={styles.datePickerText}>
                    {formDOB || 'Select Birth Date'}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#666" />
                </TouchableOpacity>

                {showDobPicker && (
                  <DateTimePicker
                    value={new Date()}
                    mode="date"
                    display="default"
                    onChange={(_event, date) => {
                      setShowDobPicker(false);
                      if (date) setFormDOB(localDateString(date));
                    }}
                  />
                )}

                <Text style={styles.fieldLabel}>PHONE NUMBER *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formPhone}
                  onChangeText={setFormPhone}
                  placeholder="e.g. +1234567890"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                />

                <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
                <TextInput
                  style={styles.formInput}
                  value={formEmail}
                  onChangeText={setFormEmail}
                  placeholder="e.g. member@barbell.com"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                />

                <Text style={styles.fieldLabel}>ADDRESS *</Text>
                <TextInput
                  style={[styles.formInput, { height: 75 }]}
                  value={formAddress}
                  onChangeText={setFormAddress}
                  placeholder="e.g. Street address"
                  placeholderTextColor="#999"
                  multiline
                />

                <View style={styles.formInputLabelRow}>
                  <Text style={styles.fieldLabel}>SELECT PLAN</Text>
                  <View style={styles.planSelectorRow}>
                    {(['Basic', 'Standard', 'Wellness', 'Platinum'] as const).map(p => (
                      <TouchableOpacity
                        key={p}
                        style={[
                          styles.planPill,
                          formPlan === p && styles.planPillSelected,
                        ]}
                        onPress={() => setFormPlan(p)}
                      >
                        <Text
                          style={[
                            styles.planPillText,
                            formPlan === p && styles.planPillTextSelected,
                          ]}
                        >
                          {p.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <Text style={styles.fieldLabel}>START DATE</Text>
                <TouchableOpacity
                  style={styles.datePickerSelector}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Text style={styles.datePickerText}>
                    {localDateString(formStartDate)}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#666" />
                </TouchableOpacity>

                {showStartDatePicker && (
                  <DateTimePicker
                    value={formStartDate}
                    mode="date"
                    display="default"
                    onChange={(_event, date) => {
                      setShowStartDatePicker(false);
                      if (date) setFormStartDate(date);
                    }}
                  />
                )}

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleAddMember}
                  activeOpacity={0.8}
                >
                  <Text style={styles.submitBtnText}>REGISTER MEMBER</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  title: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 42,
    letterSpacing: 2,
    color: '#000000',
    lineHeight: 46,
  },
  subtitle: {
    fontFamily: 'Oswald_600SemiBold',
    fontSize: 12,
    letterSpacing: 2,
    color: '#777777',
    marginTop: -2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EAEAEA',
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Oswald_400Regular',
    fontSize: 15,
    color: '#111111',
  },
  clearButton: {
    padding: 4,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginVertical: 5,
    justifyContent: 'space-between',
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#EAEAEA',
    backgroundColor: '#FFFFFF',
  },
  activeFilterTab: {
    backgroundColor: '#111111',
    borderColor: '#111111',
  },
  filterTabText: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 10,
    letterSpacing: 1,
    color: '#666',
  },
  activeFilterTabText: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 110,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#EAEAEA',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEE',
  },
  initialsContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#111111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: 'white',
    fontFamily: 'Oswald_700Bold',
    fontSize: 18,
  },
  cardDetails: {
    marginLeft: 12,
    flex: 1,
  },
  cardName: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 17,
    color: '#111111',
  },
  cardMeta: {
    fontFamily: 'Oswald_400Regular',
    fontSize: 13,
    color: '#666666',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1.5,
    borderColor: '#F5F5F5',
    paddingTop: 12,
  },
  planInfo: {
    flex: 1,
  },
  planLabel: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 9,
    color: '#999999',
    letterSpacing: 1,
  },
  planValue: {
    fontFamily: 'Oswald_600SemiBold',
    fontSize: 15,
    color: '#111111',
    marginTop: 2,
  },
  statusSection: {
    alignItems: 'flex-end',
  },
  statusPill: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  statusText: {
    color: 'white',
    fontFamily: 'Oswald_700Bold',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  expDate: {
    fontFamily: 'Oswald_400Regular',
    fontSize: 11,
    color: '#666666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Oswald_600SemiBold',
    fontSize: 14,
    color: '#333333',
    marginTop: 10,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 24,
    color: '#666',
    marginTop: 12,
  },
  emptySubtext: {
    fontFamily: 'Oswald_400Regular',
    fontSize: 13,
    color: '#999',
  },
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 18,
    paddingHorizontal: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderColor: '#EAEAEA',
    paddingBottom: 12,
    marginBottom: 16,
  },
  closeModalButton: {
    padding: 4,
  },
  editModalButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  editModalButtonText: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 13,
    color: 'black',
  },
  modalTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 26,
    letterSpacing: 1.5,
    color: 'black',
  },
  modalForm: {
    width: '100%',
  },
  formPhotoPicker: {
    width: '100%',
    height: 140,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#CCC',
    borderStyle: 'dashed',
    backgroundColor: '#F9F9F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  formPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  formPhotoPlaceholder: {
    alignItems: 'center',
  },
  formPhotoText: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 12,
    color: '#888',
    marginTop: 6,
  },
  fieldLabel: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 12,
    color: 'black',
    letterSpacing: 1,
    marginBottom: 6,
  },
  formInput: {
    borderWidth: 1.5,
    borderColor: '#E2E2E2',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    fontFamily: 'Oswald_400Regular',
    fontSize: 15,
    color: 'black',
    marginBottom: 14,
    backgroundColor: '#FAFAFA',
  },
  rowInputs: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  genderRow: {
    flexDirection: 'row',
    height: 46,
    borderWidth: 1.5,
    borderColor: '#E2E2E2',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#FAFAFA',
  },
  genderOption: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  genderOptionSelected: {
    backgroundColor: 'black',
  },
  genderOptionText: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 11,
    color: '#777',
  },
  genderOptionTextSelected: {
    color: 'white',
  },
  datePickerSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E2E2',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 14,
    backgroundColor: '#FAFAFA',
  },
  datePickerText: {
    fontFamily: 'Oswald_400Regular',
    fontSize: 15,
    color: 'black',
  },
  formInputLabelRow: {
    marginVertical: 4,
  },
  planSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  planPill: {
    flex: 1,
    marginHorizontal: 3,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E2E2E2',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  planPillSelected: {
    backgroundColor: 'black',
    borderColor: 'black',
  },
  planPillText: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 10,
    color: '#666',
  },
  planPillTextSelected: {
    color: 'white',
  },
  submitBtn: {
    backgroundColor: 'black',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  submitBtnText: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 22,
    letterSpacing: 2,
    color: 'white',
  },
  modalDetailContainer: {
    width: '100%',
  },
  detailAvatarRow: {
    alignItems: 'center',
    marginVertical: 10,
  },
  largeAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#EEE',
  },
  largeInitials: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  largeInitialsText: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 32,
    color: 'white',
  },
  detailName: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 22,
    color: 'black',
    marginTop: 8,
  },
  detailMeta: {
    fontFamily: 'Oswald_400Regular',
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  contactsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 14,
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'black',
    marginHorizontal: 5,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactBtnText: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 11,
    color: 'white',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  subDetailSectionTitle: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 12,
    letterSpacing: 1.5,
    color: '#888',
    marginTop: 16,
    marginBottom: 8,
  },
  timelineCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#EAEAEA',
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineLabel: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 9,
    color: '#999',
    letterSpacing: 0.5,
  },
  timelineVal: {
    fontFamily: 'Oswald_600SemiBold',
    fontSize: 15,
    color: 'black',
    marginTop: 2,
  },
  timelineDivider: {
    height: 1.5,
    backgroundColor: '#EAEAEA',
    marginVertical: 10,
  },
  daysCounter: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 18,
    color: 'black',
  },
  infoFields: {
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#EAEAEA',
    borderRadius: 14,
    paddingVertical: 6,
  },
  infoFieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  infoFieldLabel: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 11,
    color: '#666',
  },
  infoFieldVal: {
    fontFamily: 'Oswald_400Regular',
    fontSize: 14,
    color: 'black',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  actionBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: 'black',
    marginHorizontal: 4,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  actionBtnTxt: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 11,
    color: 'black',
    marginLeft: 4,
  },
  deleteBtn: {
    borderColor: 'red',
  },
  renewalArea: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1.5,
    borderColor: '#EAEAEA',
  },
  renewalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  renewSubmitBtn: {
    flex: 1,
    backgroundColor: 'black',
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  renewSubmitBtnText: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 12,
    color: 'white',
  },
});
