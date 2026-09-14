import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import {
  Oswald_400Regular,
  Oswald_600SemiBold,
  Oswald_700Bold,
} from '@expo-google-fonts/oswald';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types/navigation';
import { auth } from '../../FirebaseConfig';
import {
  getWorkouts,
  calculateWorkoutStats,
  type WorkoutSession,
  type WorkoutExercise,
  type WorkoutSet,
  type WorkoutSetType,
} from '../../lib/userStorage';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutHistory'>;

const SET_TYPE_LABELS: Record<WorkoutSetType, { label: string; bg: string; text: string }> = {
  normal: { label: 'Normal', bg: '#E5E7EB', text: '#374151' },
  warmup: { label: 'Warmup', bg: '#FEF3C7', text: '#B45309' },
  drop: { label: 'Drop', bg: '#EDE9FE', text: '#6D28D9' },
  failure: { label: 'Failure', bg: '#FEE2E2', text: '#B91C1C' },
};

function formatLocalDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    // If dateStr is YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatLocalTime(isoStr?: string): string {
  if (!isoStr) return '—';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '—';
  }
}

function formatDuration(minutes?: number): string {
  if (!minutes || minutes <= 0) return '—';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0 && mins > 0) {
    return `${hrs}h ${mins}m`;
  }
  if (hrs > 0) {
    return `${hrs}h`;
  }
  return `${mins}m`;
}

function getWorkoutVolumeUnit(workout: WorkoutSession): 'LBS' | 'KG' | 'MIXED' {
  const units = new Set<string>();

  if (workout.exercises && workout.exercises.length > 0) {
    for (const ex of workout.exercises) {
      if (ex.sets && ex.sets.length > 0) {
        for (const set of ex.sets) {
          if (set.isCompleted && set.weight > 0 && set.reps > 0) {
            units.add(set.unit || 'lbs');
          }
        }
      }
    }

    // Fallback: if no completed sets contributed to volume, inspect all sets
    if (units.size === 0) {
      for (const ex of workout.exercises) {
        if (ex.sets && ex.sets.length > 0) {
          for (const set of ex.sets) {
            units.add(set.unit || 'lbs');
          }
        }
      }
    }
  }

  if (units.size === 0) return 'LBS';
  if (units.size > 1) return 'MIXED';
  return units.has('kg') ? 'KG' : 'LBS';
}

export default function WorkoutHistoryScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 24, 420);

  const [fontsLoaded] = useFonts({
    BebasNeue_400Regular,
    Oswald_400Regular,
    Oswald_600SemiBold,
    Oswald_700Bold,
  });

  const currentUser = auth.currentUser;
  const uid = currentUser?.uid;

  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutSession | null>(null);

  const fetchWorkoutHistory = useCallback(async () => {
    if (!uid) {
      setIsLoading(false);
      setError('Please sign in to view your workout history.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getWorkouts(uid);
      setWorkouts(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Failed to load workout history:', err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [uid]);

  useFocusEffect(
    useCallback(() => {
      fetchWorkoutHistory();
    }, [fetchWorkoutHistory])
  );

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="black" />
        <Text style={styles.loadingText}>LOADING...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 15) }]}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitleText}>WORKOUT HISTORY</Text>
          <Text style={styles.headerSubtitleText}>
            {workouts.length} {workouts.length === 1 ? 'SESSION' : 'SESSIONS'} RECORDED
          </Text>
        </View>

        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={fetchWorkoutHistory}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="refresh" size={22} color="black" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.mainCard, { width: contentWidth }]}>
          {/* Loading State */}
          {isLoading ? (
            <View style={styles.centerStateWrap}>
              <ActivityIndicator size="large" color="black" />
              <Text style={styles.stateTitle}>FETCHING WORKOUT RECORDS...</Text>
            </View>
          ) : error ? (
            /* Error State */
            <View style={styles.centerStateWrap}>
              <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
              <Text style={styles.errorTitle}>COULD NOT LOAD HISTORY</Text>
              <Text style={styles.errorSubtitle}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchWorkoutHistory}>
                <Ionicons name="reload" size={16} color="white" style={{ marginRight: 6 }} />
                <Text style={styles.retryButtonText}>TRY AGAIN</Text>
              </TouchableOpacity>
            </View>
          ) : !uid ? (
            /* Auth Required State */
            <View style={styles.centerStateWrap}>
              <Ionicons name="lock-closed-outline" size={48} color="#777" />
              <Text style={styles.stateTitle}>AUTHENTICATION REQUIRED</Text>
              <Text style={styles.stateSubtitle}>Please sign in to view your saved workouts.</Text>
            </View>
          ) : workouts.length === 0 ? (
            /* Empty State */
            <View style={styles.centerStateWrap}>
              <Ionicons name="barbell-outline" size={56} color="#BBB" />
              <Text style={styles.emptyTitle}>NO WORKOUTS RECORDED YET</Text>
              <Text style={styles.emptySubtitle}>
                You haven&apos;t logged any completed workouts. Start an active session today and track your progress!
              </Text>
              <TouchableOpacity
                style={styles.startWorkoutButton}
                onPress={() => navigation.navigate('ActiveWorkout')}
              >
                <Ionicons name="add-circle" size={20} color="white" style={{ marginRight: 8 }} />
                <Text style={styles.startWorkoutButtonText}>START A WORKOUT</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Workouts List */
            workouts.map(item => {
              const fallbackStats = calculateWorkoutStats(item.exercises || []);
              const totalVolume = item.totalVolume !== undefined ? item.totalVolume : fallbackStats.totalVolume;
              const totalSets = item.totalSets !== undefined ? item.totalSets : fallbackStats.totalSets;
              const exerciseCount = item.exercises ? item.exercises.length : 0;
              const volumeUnit = getWorkoutVolumeUnit(item);

              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.workoutCard}
                  onPress={() => setSelectedWorkout(item)}
                  activeOpacity={0.75}
                >
                  {/* Top: Title & Date */}
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <Text style={styles.workoutTitleText} numberOfLines={1} ellipsizeMode="tail">
                        {item.title || 'Workout'}
                      </Text>
                      <Text style={styles.workoutDateText}>
                        {formatLocalDate(item.date || item.startTime)}
                      </Text>
                    </View>
                    <View style={styles.viewBadge}>
                      <Text style={styles.viewBadgeText}>DETAILS</Text>
                      <Ionicons name="chevron-forward" size={14} color="black" />
                    </View>
                  </View>

                  {/* Summary Metrics Bar */}
                  <View style={styles.cardMetricsGrid}>
                    <View style={styles.metricItem}>
                      <Ionicons name="time-outline" size={15} color="#555" />
                      <Text style={styles.metricValueText}>{formatDuration(item.durationMinutes)}</Text>
                      <Text style={styles.metricLabelText}>DURATION</Text>
                    </View>

                    <View style={styles.metricDivider} />

                    <View style={styles.metricItem}>
                      <Ionicons name="layers-outline" size={15} color="#555" />
                      <Text style={styles.metricValueText}>{exerciseCount}</Text>
                      <Text style={styles.metricLabelText}>EXERCISES</Text>
                    </View>

                    <View style={styles.metricDivider} />

                    <View style={styles.metricItem}>
                      <Ionicons name="checkmark-done-circle-outline" size={15} color="#16A34A" />
                      <Text style={styles.metricValueText}>{totalSets}</Text>
                      <Text style={styles.metricLabelText}>SETS</Text>
                    </View>

                    <View style={styles.metricDivider} />

                    <View style={styles.metricItem}>
                      <Ionicons name="barbell-outline" size={15} color="#000" />
                      <Text style={styles.metricValueText}>{totalVolume.toLocaleString()}</Text>
                      <Text style={styles.metricLabelText}>{volumeUnit}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* ========================================================= */}
      {/* WORKOUT DETAIL MODAL */}
      {/* ========================================================= */}
      <Modal
        visible={selectedWorkout !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedWorkout(null)}
      >
        {selectedWorkout && (
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Text style={styles.modalHeaderTitle} numberOfLines={1} ellipsizeMode="tail">
                  {selectedWorkout.title || 'Workout Details'}
                </Text>
                <Text style={styles.modalHeaderSubtitle}>
                  {formatLocalDate(selectedWorkout.date || selectedWorkout.startTime)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setSelectedWorkout(null)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={26} color="black" />
              </TouchableOpacity>
            </View>

            {/* Modal Scroll Content */}
            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Stat Summary Row */}
              <View style={styles.detailStatsBanner}>
                <View style={styles.detailStatBox}>
                  <Text style={styles.detailStatValue}>
                    {formatDuration(selectedWorkout.durationMinutes)}
                  </Text>
                  <Text style={styles.detailStatLabel}>DURATION</Text>
                </View>
                <View style={styles.detailStatDivider} />
                <View style={styles.detailStatBox}>
                  <Text style={styles.detailStatValue}>
                    {(
                      selectedWorkout.totalVolume !== undefined
                        ? selectedWorkout.totalVolume
                        : calculateWorkoutStats(selectedWorkout.exercises || []).totalVolume
                    ).toLocaleString()}{' '}
                    {getWorkoutVolumeUnit(selectedWorkout) === 'MIXED'
                      ? 'MIXED'
                      : getWorkoutVolumeUnit(selectedWorkout).toLowerCase()}
                  </Text>
                  <Text style={styles.detailStatLabel}>TOTAL VOLUME</Text>
                </View>
                <View style={styles.detailStatDivider} />
                <View style={styles.detailStatBox}>
                  <Text style={styles.detailStatValue}>
                    {selectedWorkout.totalSets !== undefined
                      ? selectedWorkout.totalSets
                      : calculateWorkoutStats(selectedWorkout.exercises || []).totalSets}
                  </Text>
                  <Text style={styles.detailStatLabel}>COMPLETED SETS</Text>
                </View>
              </View>

              {/* Time Details Pill Box */}
              <View style={styles.timeDetailsCard}>
                <View style={styles.timeDetailItem}>
                  <Text style={styles.timeDetailLabel}>STARTED</Text>
                  <Text style={styles.timeDetailValue}>
                    {formatLocalTime(selectedWorkout.startTime)}
                  </Text>
                </View>
                {selectedWorkout.endTime && (
                  <View style={styles.timeDetailItem}>
                    <Text style={styles.timeDetailLabel}>COMPLETED</Text>
                    <Text style={styles.timeDetailValue}>
                      {formatLocalTime(selectedWorkout.endTime)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Session Notes if available */}
              {Boolean(selectedWorkout.notes && selectedWorkout.notes.trim()) && (
                <View style={styles.notesSection}>
                  <Text style={styles.notesSectionTitle}>SESSION NOTES</Text>
                  <View style={styles.notesCard}>
                    <Text style={styles.notesBodyText}>{selectedWorkout.notes}</Text>
                  </View>
                </View>
              )}

              {/* Exercise List */}
              <View style={styles.exercisesSectionHeader}>
                <Text style={styles.exercisesSectionTitle}>
                  EXERCISES ({selectedWorkout.exercises?.length || 0})
                </Text>
              </View>

              {!selectedWorkout.exercises || selectedWorkout.exercises.length === 0 ? (
                <View style={styles.emptyExercisesCard}>
                  <Text style={styles.emptyExercisesText}>No exercises recorded in this session.</Text>
                </View>
              ) : (
                selectedWorkout.exercises.map((ex: WorkoutExercise, exIdx: number) => (
                  <View key={ex.id || exIdx} style={styles.detailExerciseCard}>
                    {/* Exercise Header */}
                    <View style={styles.detailExHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.detailExName}>{ex.name}</Text>
                        <View style={styles.detailExBadgesRow}>
                          <View style={styles.categoryBadge}>
                            <Text style={styles.categoryBadgeText}>
                              {ex.category.toUpperCase()}
                            </Text>
                          </View>
                          {ex.equipment ? (
                            <View style={styles.equipmentBadge}>
                              <Text style={styles.equipmentBadgeText}>
                                {ex.equipment.toUpperCase()}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    </View>

                    {/* Sets Table Header */}
                    <View style={styles.tableHeaderRow}>
                      <Text style={[styles.thCell, { width: 36 }]}>SET</Text>
                      <Text style={[styles.thCell, { width: 70 }]}>TYPE</Text>
                      <Text style={[styles.thCell, { flex: 1 }]}>WEIGHT</Text>
                      <Text style={[styles.thCell, { width: 50 }]}>REPS</Text>
                      <Text style={[styles.thCell, { width: 44 }]}>RPE</Text>
                      <Text style={[styles.thCell, { width: 40, textAlign: 'center' }]}>DONE</Text>
                    </View>

                    {/* Sets Rows */}
                    {ex.sets.map((set: WorkoutSet, sIdx: number) => {
                      const typeConfig = SET_TYPE_LABELS[set.type] || SET_TYPE_LABELS.normal;
                      return (
                        <View
                          key={set.id || sIdx}
                          style={[
                            styles.tableRow,
                            set.isCompleted && styles.tableRowCompleted,
                          ]}
                        >
                          <View style={[styles.tableCell, { width: 36 }]}>
                            <Text style={styles.setNumberText}>{set.setNumber}</Text>
                          </View>

                          <View style={[styles.tableCell, { width: 70 }]}>
                            <View style={[styles.typePill, { backgroundColor: typeConfig.bg }]}>
                              <Text style={[styles.typePillText, { color: typeConfig.text }]}>
                                {typeConfig.label}
                              </Text>
                            </View>
                          </View>

                          <View style={[styles.tableCell, { flex: 1 }]}>
                            <Text style={styles.metricCellText}>
                              {set.weight} {set.unit || 'lbs'}
                            </Text>
                          </View>

                          <View style={[styles.tableCell, { width: 50 }]}>
                            <Text style={styles.metricCellText}>{set.reps}</Text>
                          </View>

                          <View style={[styles.tableCell, { width: 44 }]}>
                            <Text style={styles.rpeCellText}>
                              {set.rpe !== undefined ? set.rpe : '—'}
                            </Text>
                          </View>

                          <View style={[styles.tableCell, { width: 40, alignItems: 'center' }]}>
                            {set.isCompleted ? (
                              <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                            ) : (
                              <Ionicons name="ellipse-outline" size={18} color="#BBB" />
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  loadingContainer: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Oswald_600SemiBold',
    fontSize: 14,
    color: 'black',
    letterSpacing: 2,
    marginTop: 15,
  },

  // Header Bar
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderColor: '#E5E5E5',
    backgroundColor: 'white',
  },
  headerIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  headerCenter: { alignItems: 'center' },
  headerTitleText: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 24,
    color: 'black',
    letterSpacing: 2,
  },
  headerSubtitleText: {
    fontFamily: 'Oswald_600SemiBold',
    fontSize: 11,
    color: '#888',
    letterSpacing: 1,
    marginTop: 1,
  },

  // Scroll Content & Main Card
  scrollContent: { alignItems: 'center', paddingTop: 16, paddingBottom: 60 },
  mainCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: 'black',
    padding: 16,
  },

  // Center State Wrappers (Empty, Error, Loading)
  centerStateWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  stateTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 22,
    color: 'black',
    letterSpacing: 1.5,
    marginTop: 12,
  },
  stateSubtitle: {
    fontFamily: 'System',
    fontSize: 13,
    color: '#777',
    textAlign: 'center',
    marginTop: 6,
  },
  emptyTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 24,
    color: 'black',
    letterSpacing: 1.5,
    marginTop: 14,
  },
  emptySubtitle: {
    fontFamily: 'System',
    fontSize: 13,
    color: '#777',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    marginBottom: 20,
  },
  startWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'black',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  startWorkoutButtonText: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 13,
    color: 'white',
    letterSpacing: 1.5,
  },
  errorTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 22,
    color: '#EF4444',
    letterSpacing: 1.5,
    marginTop: 10,
  },
  errorSubtitle: {
    fontFamily: 'System',
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'black',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryButtonText: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 12,
    color: 'white',
    letterSpacing: 1,
  },

  // Workout Card
  workoutCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'black',
    padding: 14,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: { flex: 1, paddingRight: 8 },
  workoutTitleText: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 18,
    color: 'black',
    letterSpacing: 0.5,
  },
  workoutDateText: {
    fontFamily: 'Oswald_400Regular',
    fontSize: 12,
    color: '#777',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  viewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E5E5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  viewBadgeText: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 10,
    color: 'black',
    letterSpacing: 1,
    marginRight: 2,
  },
  cardMetricsGrid: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  metricItem: { alignItems: 'center', flex: 1 },
  metricValueText: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 14,
    color: 'black',
    marginTop: 2,
  },
  metricLabelText: {
    fontFamily: 'Oswald_600SemiBold',
    fontSize: 9,
    color: '#888',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E5E5',
  },

  // Detail Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 2,
    borderColor: 'black',
  },
  modalHeaderLeft: { flex: 1, paddingRight: 10 },
  modalHeaderTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 24,
    color: 'black',
    letterSpacing: 1.5,
  },
  modalHeaderSubtitle: {
    fontFamily: 'Oswald_400Regular',
    fontSize: 12,
    color: '#777',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  modalCloseButton: { padding: 4 },
  modalScroll: { padding: 16, paddingBottom: 60 },

  detailStatsBanner: {
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'black',
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  detailStatBox: { alignItems: 'center', flex: 1 },
  detailStatValue: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 16,
    color: 'black',
  },
  detailStatLabel: {
    fontFamily: 'Oswald_600SemiBold',
    fontSize: 10,
    color: '#666',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  detailStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#D1D5DB',
  },

  timeDetailsCard: {
    flexDirection: 'row',
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: 10,
    marginBottom: 16,
    justifyContent: 'space-around',
  },
  timeDetailItem: { alignItems: 'center' },
  timeDetailLabel: {
    fontFamily: 'Oswald_600SemiBold',
    fontSize: 10,
    color: '#888',
    letterSpacing: 1,
  },
  timeDetailValue: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 13,
    color: 'black',
    marginTop: 2,
  },

  notesSection: { marginBottom: 16 },
  notesSectionTitle: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 12,
    color: '#555',
    letterSpacing: 1,
    marginBottom: 6,
  },
  notesCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 10,
  },
  notesBodyText: {
    fontFamily: 'System',
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },

  exercisesSectionHeader: { marginBottom: 10 },
  exercisesSectionTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 20,
    color: 'black',
    letterSpacing: 1.5,
  },
  emptyExercisesCard: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
  },
  emptyExercisesText: {
    fontFamily: 'System',
    fontSize: 13,
    color: '#888',
  },

  detailExerciseCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'black',
    padding: 12,
    marginBottom: 14,
  },
  detailExHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  detailExName: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 16,
    color: 'black',
    letterSpacing: 0.5,
  },
  detailExBadgesRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  categoryBadge: {
    backgroundColor: 'black',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 6,
  },
  categoryBadgeText: {
    color: 'white',
    fontSize: 9,
    fontFamily: 'Oswald_700Bold',
    letterSpacing: 0.5,
  },
  equipmentBadge: {
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  equipmentBadgeText: {
    color: '#444',
    fontSize: 9,
    fontFamily: 'Oswald_600SemiBold',
    letterSpacing: 0.5,
  },

  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#DDD',
    paddingBottom: 6,
    marginBottom: 4,
  },
  thCell: {
    fontFamily: 'Oswald_600SemiBold',
    fontSize: 10,
    color: '#777',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: '#EEE',
  },
  tableRowCompleted: {
    backgroundColor: '#F0FDF4',
    borderRadius: 6,
  },
  tableCell: { justifyContent: 'center' },
  setNumberText: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 13,
    color: 'black',
    textAlign: 'center',
  },
  typePill: {
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    alignItems: 'center',
    marginRight: 4,
  },
  typePillText: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 10,
  },
  metricCellText: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '600',
    color: 'black',
  },
  rpeCellText: {
    fontFamily: 'System',
    fontSize: 13,
    color: '#666',
  },
});
