import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types/navigation';
import { auth } from '../../FirebaseConfig';
import {
  createWorkout,
  saveActiveWorkout,
  getActiveWorkout,
  clearActiveWorkout,
  calculateWorkoutStats,
  localDateString,
  validateWorkout,
  type WorkoutSession,
  type WorkoutExercise,
  type WorkoutSet,
  type WorkoutSetType,
} from '../../lib/userStorage';
import {
  EXERCISES,
  EXERCISE_CATEGORIES,
  type Exercise,
} from '../../data/exercises';

type Props = NativeStackScreenProps<RootStackParamList, 'ActiveWorkout'>;

const SET_TYPES: { label: string; value: WorkoutSetType; color: string }[] = [
  { label: 'Normal', value: 'normal', color: '#000000' },
  { label: 'Warmup', value: 'warmup', color: '#F59E0B' },
  { label: 'Drop', value: 'drop', color: '#8B5CF6' },
  { label: 'Failure', value: 'failure', color: '#EF4444' },
];

export default function ActiveWorkoutScreen({ navigation }: Props) {
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

  // Active workout state
  const [workoutTitle, setWorkoutTitle] = useState('Workout');
  const [workoutDate, setWorkoutDate] = useState(localDateString(new Date()));
  const [startTime, setStartTime] = useState(new Date().toISOString());
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingDraft, setIsLoadingDraft] = useState(true);

  // Elapsed timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Exercise Picker Modal State
  const [showPicker, setShowPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Set Type Picker Modal State
  const [typePickerVisible, setTypePickerVisible] = useState(false);
  const [activeSetTarget, setActiveSetTarget] = useState<{ exerciseIndex: number; setIndex: number } | null>(null);

  // Confirmation / Finish Modal State
  const [showFinishModal, setShowFinishModal] = useState(false);

  // Track active session lifecycle and save generations to prevent race conditions
  const isInitialized = useRef(false);
  const isSessionActiveRef = useRef(true);
  const saveGenerationRef = useRef(0);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Snapshot ref of latest workout values to avoid stale closures in debounced saves
  const stateSnapshotRef = useRef({
    workoutTitle,
    workoutDate,
    startTime,
    exercises,
    notes,
    uid,
  });

  useEffect(() => {
    stateSnapshotRef.current = {
      workoutTitle,
      workoutDate,
      startTime,
      exercises,
      notes,
      uid,
    };
  }, [workoutTitle, workoutDate, startTime, exercises, notes, uid]);

  // Cancel any pending debounced draft save and invalidate in-flight saves
  const cancelAndInvalidateDraftSaves = useCallback(() => {
    saveGenerationRef.current += 1;
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isSessionActiveRef.current = false;
      cancelAndInvalidateDraftSaves();
    };
  }, [cancelAndInvalidateDraftSaves]);

  // -------------------------------------------------------------
  // 1. Initial Load & Local Draft Recovery
  // -------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    const checkDraft = async () => {
      if (!uid) {
        setIsLoadingDraft(false);
        return;
      }

      try {
        const draft = await getActiveWorkout(uid);
        if (!isMounted) return;

        if (draft && draft.exercises && draft.exercises.length > 0) {
          Alert.alert(
            'Resume Workout?',
            'You have an unfinished active workout draft. Would you like to resume it?',
            [
              {
                text: 'Discard',
                style: 'destructive',
                onPress: async () => {
                  cancelAndInvalidateDraftSaves();

                  try {
                    await clearActiveWorkout(uid);

                    initFreshWorkout();

                    isSessionActiveRef.current = true;
                    setIsLoadingDraft(false);
                  } catch (err: unknown) {
                    const message =
                      err instanceof Error
                        ? err.message
                        : 'Unknown error occurred';

                    console.warn(
                      'Failed to clear active workout during draft recovery:',
                      err
                    );

                    // Keep the existing draft available to the user.
                    setWorkoutTitle(draft.title || 'Workout');
                    setWorkoutDate(
                      draft.date || localDateString(new Date())
                    );
                    setStartTime(
                      draft.startTime || new Date().toISOString()
                    );
                    setExercises(draft.exercises || []);
                    setNotes(draft.notes || '');

                    isSessionActiveRef.current = true;
                    setIsLoadingDraft(false);

                    Alert.alert(
                      'Discard Failed',
                      `The unfinished workout draft could not be discarded (${message}). Your draft is preserved so you can try again.`
                    );
                  }
                },
              },
              {
                text: 'Resume',
                onPress: () => {
                  setWorkoutTitle(draft.title || 'Workout');
                  setWorkoutDate(draft.date || localDateString(new Date()));
                  setStartTime(draft.startTime || new Date().toISOString());
                  setExercises(draft.exercises || []);
                  setNotes(draft.notes || '');
                  isSessionActiveRef.current = true;
                  setIsLoadingDraft(false);
                },
              },
            ],
            { cancelable: false }
          );
        } else {
          initFreshWorkout();
          isSessionActiveRef.current = true;
          setIsLoadingDraft(false);
        }
      } catch (err) {
        console.warn('Failed to check active draft:', err);
        initFreshWorkout();
        isSessionActiveRef.current = true;
        setIsLoadingDraft(false);
      }
    };

    checkDraft();

    return () => {
      isMounted = false;
    };
  }, [uid, cancelAndInvalidateDraftSaves]);

  const initFreshWorkout = () => {
    const now = new Date();
    setWorkoutTitle('Workout');
    setWorkoutDate(localDateString(now));
    setStartTime(now.toISOString());
    setExercises([]);
    setNotes('');
  };

  // -------------------------------------------------------------
  // 2. Debounced Local Draft Persistence
  // -------------------------------------------------------------
const persistDraft = useCallback(() => {
  if (!uid || !isInitialized.current || !isSessionActiveRef.current) return;

  if (saveTimeoutRef.current) {
    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = null;
  }

  const currentGeneration = ++saveGenerationRef.current;

  saveTimeoutRef.current = setTimeout(async () => {
    if (
      !isSessionActiveRef.current ||
      saveGenerationRef.current !== currentGeneration
    ) {
      return;
    }

    try {
      const {
        workoutTitle: curTitle,
        workoutDate: curDate,
        startTime: curStart,
        exercises: curExercises,
        notes: curNotes,
        uid: curUid,
      } = stateSnapshotRef.current;

      if (
        !curUid ||
        !isSessionActiveRef.current ||
        saveGenerationRef.current !== currentGeneration
      ) {
        return;
      }

      const stats = calculateWorkoutStats(curExercises);

      const draftPayload: Omit<WorkoutSession, 'id'> = {
        userId: curUid,
        title: curTitle.trim() || 'Workout',
        date: curDate,
        startTime: curStart,
        status: 'in_progress',
        exerciseIds: curExercises.map((e) => e.exerciseId),
        exercises: curExercises,
        totalVolume: stats.totalVolume,
        totalSets: stats.totalSets,
        notes: curNotes,
        createdAt: curStart,
        updatedAt: new Date().toISOString(),
      };

      // Guard immediately before saving.
      if (
        !isSessionActiveRef.current ||
        saveGenerationRef.current !== currentGeneration
      ) {
        return;
      }

      await saveActiveWorkout(curUid, draftPayload);

      // If this save became stale while awaiting AsyncStorage,
      // only clear it if the currently stored draft still belongs
      // to this same workout session.
      if (
        !isSessionActiveRef.current ||
        saveGenerationRef.current !== currentGeneration
      ) {
        try {
          const currentDraft = await getActiveWorkout(curUid);

          if (currentDraft && currentDraft.startTime === curStart) {
            await clearActiveWorkout(curUid);
          }
        } catch {
          // Ignore stale-draft cleanup errors.
        }
      }
    } catch (err) {
      console.warn(
        'Failed to auto-save active workout draft:',
        err
      );
    }
  }, 500);
}, [uid]);

  // Trigger persistence when workout state updates
  useEffect(() => {
    if (!isLoadingDraft) {
      if (!isInitialized.current) {
        isInitialized.current = true;
        return;
      }
      persistDraft();
    }
  }, [exercises, workoutTitle, notes, workoutDate, startTime, isLoadingDraft, persistDraft]);

  // -------------------------------------------------------------
  // 3. Live Elapsed Workout Timer (Derived from startTime)
  // -------------------------------------------------------------
  useEffect(() => {
    const updateElapsed = () => {
      try {
        const startMs = new Date(startTime).getTime();
        const nowMs = Date.now();
        const diffSecs = Math.max(0, Math.floor((nowMs - startMs) / 1000));
        setElapsedSeconds(diffSecs);
      } catch {
        setElapsedSeconds(0);
      }
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const formattedTimer = useMemo(() => {
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [elapsedSeconds]);

  // -------------------------------------------------------------
  // 4. Live Stats
  // -------------------------------------------------------------
  const liveStats = useMemo(() => {
    return calculateWorkoutStats(exercises);
  }, [exercises]);

  // -------------------------------------------------------------
  // 5. Exercise Management
  // -------------------------------------------------------------
  const handleAddExercise = (catalogItem: Exercise) => {
    // Check if already in workout
    const exists = exercises.some(e => e.exerciseId === catalogItem.id);
    if (exists) {
      Alert.alert('Already Added', `"${catalogItem.name}" is already in this workout.`);
      return;
    }

    const firstSet: WorkoutSet = {
      id: Math.random().toString(36).substring(2, 9),
      setNumber: 1,
      type: 'normal',
      weight: 0,
      reps: 1,
      unit: 'lbs',
      isCompleted: false,
    };

    const newExercise: WorkoutExercise = {
      id: Math.random().toString(36).substring(2, 9),
      exerciseId: catalogItem.id,
      name: catalogItem.name,
      category: catalogItem.category,
      equipment: catalogItem.equipment,
      sets: [firstSet],
    };

    setExercises(prev => [...prev, newExercise]);
    setShowPicker(false);
    setSearchQuery('');
  };

  const handleRemoveExercise = (exerciseIndex: number) => {
    const target = exercises[exerciseIndex];
    Alert.alert(
      'Remove Exercise',
      `Are you sure you want to remove ${target.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setExercises(prev => prev.filter((_, idx) => idx !== exerciseIndex));
          },
        },
      ]
    );
  };

  // -------------------------------------------------------------
  // 6. Set Management
  // -------------------------------------------------------------
  const handleAddSet = (exerciseIndex: number) => {
    setExercises(prev => {
      const updated = [...prev];
      const targetExercise = { ...updated[exerciseIndex] };
      const currentSets = [...targetExercise.sets];
      const lastSet = currentSets[currentSets.length - 1];

      const newSet: WorkoutSet = {
        id: Math.random().toString(36).substring(2, 9),
        setNumber: currentSets.length + 1,
        type: lastSet ? lastSet.type : 'normal',
        weight: lastSet ? lastSet.weight : 0,
        reps: lastSet ? lastSet.reps : 1,
        unit: 'lbs',
        rpe: lastSet?.rpe,
        isCompleted: false,
      };

      targetExercise.sets = [...currentSets, newSet];
      updated[exerciseIndex] = targetExercise;
      return updated;
    });
  };

  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    setExercises(prev => {
      const updated = [...prev];
      const targetExercise = { ...updated[exerciseIndex] };
      const remainingSets = targetExercise.sets.filter((_, sIdx) => sIdx !== setIndex);

      // Renumber sets
      targetExercise.sets = remainingSets.map((s, idx) => ({
        ...s,
        setNumber: idx + 1,
      }));

      updated[exerciseIndex] = targetExercise;
      return updated;
    });
  };

  const handleUpdateSet = (
    exerciseIndex: number,
    setIndex: number,
    field: keyof WorkoutSet,
    value: string | number | boolean | WorkoutSetType | undefined
  ) => {
    setExercises(prev => {
      const updated = [...prev];
      const targetExercise = { ...updated[exerciseIndex] };
      const sets = [...targetExercise.sets];
      const targetSet = { ...sets[setIndex] };

      if (field === 'weight') {
        const num = parseFloat(value as string);
        targetSet.weight = isNaN(num) ? 0 : Math.min(1500, Math.max(0, num));
      } else if (field === 'reps') {
        const num = parseInt(value as string, 10);
        targetSet.reps = isNaN(num) ? 1 : Math.min(100, Math.max(1, num));
      } else if (field === 'rpe') {
        if (value === '' || value === undefined) {
          targetSet.rpe = undefined;
        } else {
          const num = parseFloat(value as string);
          targetSet.rpe = isNaN(num) ? undefined : Math.min(10, Math.max(1, num));
        }
      } else if (field === 'isCompleted') {
        targetSet.isCompleted = Boolean(value);
        targetSet.completedAt = Boolean(value) ? new Date().toISOString() : undefined;
      } else if (field === 'type') {
        targetSet.type = value as WorkoutSetType;
      }

      sets[setIndex] = targetSet;
      targetExercise.sets = sets;
      updated[exerciseIndex] = targetExercise;
      return updated;
    });
  };

  // -------------------------------------------------------------
  // 7. Finish Workout (Firestore Save)
  // -------------------------------------------------------------
  const handleFinishPress = () => {
    if (exercises.length === 0) {
      Alert.alert('Empty Workout', 'Please add at least one exercise before finishing.');
      return;
    }

    if (liveStats.totalSets === 0) {
      Alert.alert(
        'No Completed Sets',
        'Please mark at least one set as completed (check the checkmark) before finishing the workout.'
      );
      return;
    }

    setShowFinishModal(true);
  };

const confirmFinishWorkout = async () => {
  if (!uid) {
    Alert.alert(
      'Authentication Required',
      'Please sign in to save your workout.'
    );
    return;
  }

  setIsSaving(true);

  try {
    const endTime = new Date().toISOString();

    const startMs = new Date(startTime).getTime();
    const endMs = new Date(endTime).getTime();

    const durationMinutes = Math.max(
      1,
      Math.round((endMs - startMs) / 60000)
    );

    const stats = calculateWorkoutStats(exercises);

    const payload: Omit<
      WorkoutSession,
      'id' | 'createdAt' | 'updatedAt'
    > = {
      userId: uid,
      title: workoutTitle.trim() || 'Workout',
      date: workoutDate,
      startTime,
      endTime,
      durationMinutes,
      status: 'completed',
      exerciseIds: exercises.map((e) => e.exerciseId),
      exercises,
      totalVolume: stats.totalVolume,
      totalSets: stats.totalSets,
      notes: notes.trim() || undefined,
    };

    validateWorkout(payload);

    // --------------------------------------------------
    // STEP 1 — Firestore is authoritative
    // --------------------------------------------------

    await createWorkout(uid, payload);

    // Firestore save succeeded.
    // Stop all future/in-flight draft saves.
    isSessionActiveRef.current = false;
    cancelAndInvalidateDraftSaves();

    // --------------------------------------------------
    // STEP 2 — Clear local draft separately
    // --------------------------------------------------

    try {
      await clearActiveWorkout(uid);

      setIsSaving(false);
      setShowFinishModal(false);

      Alert.alert(
        'Workout Saved!',
        'Great job on your workout session!',
        [
          {
            text: 'Awesome',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (cleanupError: unknown) {
      const cleanupMessage =
        cleanupError instanceof Error
          ? cleanupError.message
          : 'Unknown error occurred';

      console.warn(
        'Workout was saved, but local draft cleanup failed:',
        cleanupError
      );

      setIsSaving(false);
      setShowFinishModal(false);

      // IMPORTANT:
      // Do not tell the user the workout failed.
      // Do not allow another Firestore save.
      Alert.alert(
        'Workout Saved',
        `Your workout was saved successfully to the cloud, but the local device draft could not be cleared. (${cleanupMessage})`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  } catch (err: unknown) {
    // Firestore save failed.
    // Keep the local draft so the user can retry.
    setIsSaving(false);

    const message =
      err instanceof Error
        ? err.message
        : 'Unknown error occurred';

    console.error(
      'Failed to save workout to Firestore:',
      err
    );

    Alert.alert(
      'Save Failed',
      `Failed to save your workout to the cloud (${message}). Your draft is preserved on this device. Please try again.`
    );
  }
};

  // -------------------------------------------------------------
  // 8. Discard Workout
  // -------------------------------------------------------------
const handleDiscardPress = () => {
  Alert.alert(
    'Discard Workout',
    'Are you sure you want to discard this workout? All progress will be deleted.',
    [
      {
        text: 'Keep Working',
        style: 'cancel',
      },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: async () => {
          // Stop new draft saves and invalidate any pending saves.
          isSessionActiveRef.current = false;
          cancelAndInvalidateDraftSaves();

          if (!uid) {
            navigation.goBack();
            return;
          }

          try {
            await clearActiveWorkout(uid);

            // Only leave the screen after the draft was actually cleared.
            navigation.goBack();
          } catch (err: unknown) {
            // Allow the user to continue working and retry.
            isSessionActiveRef.current = true;

            const message =
              err instanceof Error
                ? err.message
                : 'Unknown error occurred';

            console.warn(
              'Failed to clear active workout on discard:',
              err
            );

            Alert.alert(
              'Discard Failed',
              `Could not discard the workout draft (${message}). Please try again.`
            );
          }
        },
      },
    ]
  );
};

  // -------------------------------------------------------------
  // 9. Filtered Exercises for Picker Modal
  // -------------------------------------------------------------
  const filteredCatalog = useMemo(() => {
    let list = EXERCISES;
    if (selectedCategory !== 'All') {
      list = list.filter(e => e.category.toLowerCase() === selectedCategory.toLowerCase());
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        e =>
          e.name.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          e.equipment.toLowerCase().includes(q)
      );
    }
    return list;
  }, [searchQuery, selectedCategory]);

  if (!fontsLoaded || isLoadingDraft) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="black" />
        <Text style={styles.loadingText}>PREPARING WORKOUT...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screenContainer}
    >
      <View style={[styles.container, { paddingTop: Math.max(insets.top, 15) }]}>
        {/* Top Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={handleDiscardPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={26} color="black" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitleText}>ACTIVE SESSION</Text>
            <View style={styles.timerBadge}>
              <Ionicons name="time-outline" size={14} color="#EF4444" style={{ marginRight: 4 }} />
              <Text style={styles.timerText}>{formattedTimer}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.finishHeaderButton}
            onPress={handleFinishPress}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.finishHeaderButtonText}>FINISH</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.mainCard, { width: contentWidth }]}>
            {/* Workout Title & Date */}
            <View style={styles.titleSection}>
              <TextInput
                style={styles.titleInput}
                value={workoutTitle}
                onChangeText={setWorkoutTitle}
                placeholder="Workout Title"
                placeholderTextColor="#999"
                maxLength={40}
              />
              <Text style={styles.dateLabel}>{workoutDate}</Text>
            </View>

            {/* Live Stats Bar */}
            <View style={styles.statsBar}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{liveStats.totalSets}</Text>
                <Text style={styles.statLabel}>COMPLETED SETS</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{liveStats.totalVolume.toLocaleString()} lbs</Text>
                <Text style={styles.statLabel}>TOTAL VOLUME</Text>
              </View>
            </View>

            {/* Exercises List */}
            {exercises.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="barbell-outline" size={48} color="#BBB" />
                <Text style={styles.emptyStateTitle}>NO EXERCISES ADDED</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Tap below to add exercises from the library and start logging your sets.
                </Text>
              </View>
            ) : (
              exercises.map((exercise, exerciseIdx) => (
                <View key={exercise.id || exerciseIdx} style={styles.exerciseCard}>
                  {/* Exercise Header */}
                  <View style={styles.exerciseHeader}>
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      <View style={styles.badgesRow}>
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryBadgeText}>{exercise.category.toUpperCase()}</Text>
                        </View>
                        {exercise.equipment && (
                          <View style={styles.equipmentBadge}>
                            <Text style={styles.equipmentBadgeText}>{exercise.equipment.toUpperCase()}</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleRemoveExercise(exerciseIdx)}
                      style={styles.deleteExerciseBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>

                  {/* Sets Table Header */}
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.thCell, { width: 36 }]}>SET</Text>
                    <Text style={[styles.thCell, { width: 64 }]}>TYPE</Text>
                    <Text style={[styles.thCell, { flex: 1 }]}>LBS</Text>
                    <Text style={[styles.thCell, { flex: 1 }]}>REPS</Text>
                    <Text style={[styles.thCell, { width: 44 }]}>RPE</Text>
                    <Text style={[styles.thCell, { width: 42, textAlign: 'center' }]}>DONE</Text>
                    <Text style={[styles.thCell, { width: 32, textAlign: 'center' }]}></Text>
                  </View>

                  {/* Sets Rows */}
                  {exercise.sets.map((set, setIdx) => (
                    <View
                      key={set.id || setIdx}
                      style={[
                        styles.setRow,
                        set.isCompleted && styles.setRowCompleted,
                      ]}
                    >
                      {/* Set Number */}
                      <View style={[styles.setCell, { width: 36 }]}>
                        <Text style={styles.setNumberText}>{set.setNumber}</Text>
                      </View>

                      {/* Set Type Selector */}
                      <TouchableOpacity
                        style={[styles.setCell, { width: 64 }]}
                        onPress={() => {
                          setActiveSetTarget({ exerciseIndex: exerciseIdx, setIndex: setIdx });
                          setTypePickerVisible(true);
                        }}
                      >
                        <View
                          style={[
                            styles.setTypeBadge,
                            set.type === 'warmup' && { backgroundColor: '#FEF3C7' },
                            set.type === 'drop' && { backgroundColor: '#EDE9FE' },
                            set.type === 'failure' && { backgroundColor: '#FEE2E2' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.setTypeBadgeText,
                              set.type === 'warmup' && { color: '#B45309' },
                              set.type === 'drop' && { color: '#6D28D9' },
                              set.type === 'failure' && { color: '#B91C1C' },
                            ]}
                          >
                            {set.type.charAt(0).toUpperCase() + set.type.slice(1, 4)}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      {/* Weight Input */}
                      <View style={[styles.setCell, { flex: 1 }]}>
                        <TextInput
                          style={styles.numericInput}
                          keyboardType="numeric"
                          value={set.weight === 0 ? '0' : String(set.weight)}
                          onChangeText={val => handleUpdateSet(exerciseIdx, setIdx, 'weight', val)}
                          selectTextOnFocus
                        />
                      </View>

                      {/* Reps Input */}
                      <View style={[styles.setCell, { flex: 1 }]}>
                        <TextInput
                          style={styles.numericInput}
                          keyboardType="number-pad"
                          value={String(set.reps)}
                          onChangeText={val => handleUpdateSet(exerciseIdx, setIdx, 'reps', val)}
                          selectTextOnFocus
                        />
                      </View>

                      {/* RPE Input */}
                      <View style={[styles.setCell, { width: 44 }]}>
                        <TextInput
                          style={[styles.numericInput, { color: '#666' }]}
                          keyboardType="numeric"
                          placeholder="—"
                          placeholderTextColor="#CCC"
                          value={set.rpe !== undefined ? String(set.rpe) : ''}
                          onChangeText={val => handleUpdateSet(exerciseIdx, setIdx, 'rpe', val)}
                          selectTextOnFocus
                        />
                      </View>

                      {/* Completion Checkmark Button */}
                      <TouchableOpacity
                        style={[
                          styles.checkButton,
                          set.isCompleted && styles.checkButtonActive,
                        ]}
                        onPress={() =>
                          handleUpdateSet(exerciseIdx, setIdx, 'isCompleted', !set.isCompleted)
                        }
                      >
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color={set.isCompleted ? 'white' : '#999'}
                        />
                      </TouchableOpacity>

                      {/* Delete Set Button */}
                      <TouchableOpacity
                        style={[styles.setCell, { width: 32, alignItems: 'center' }]}
                        onPress={() => handleRemoveSet(exerciseIdx, setIdx)}
                      >
                        <Ionicons name="close-circle-outline" size={18} color="#CCC" />
                      </TouchableOpacity>
                    </View>
                  ))}

                  {/* Add Set Button */}
                  <TouchableOpacity
                    style={styles.addSetButton}
                    onPress={() => handleAddSet(exerciseIdx)}
                  >
                    <Ionicons name="add" size={16} color="black" style={{ marginRight: 4 }} />
                    <Text style={styles.addSetButtonText}>ADD SET</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}

            {/* Add Exercise CTA Button */}
            <TouchableOpacity
              style={styles.addExerciseCTA}
              onPress={() => setShowPicker(true)}
            >
              <Ionicons name="add-circle" size={22} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.addExerciseCTAText}>ADD EXERCISE</Text>
            </TouchableOpacity>

            {/* Workout Notes */}
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>SESSION NOTES (OPTIONAL)</Text>
              <TextInput
                style={styles.notesInput}
                multiline
                numberOfLines={3}
                placeholder="How did this session feel? Notes, pumps, energy levels..."
                placeholderTextColor="#999"
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            {/* Bottom Discard Link */}
            <TouchableOpacity
              style={styles.discardBottomLink}
              onPress={handleDiscardPress}
            >
              <Text style={styles.discardBottomLinkText}>DISCARD WORKOUT</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* ========================================================= */}
      {/* EXERCISE PICKER MODAL */}
      {/* ========================================================= */}
      <Modal
        visible={showPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={styles.modalContainer}>
          {/* Picker Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>SELECT EXERCISE</Text>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowPicker(false)}
            >
              <Ionicons name="close" size={24} color="black" />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color="#777" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search exercise, muscle, equipment..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
          </View>

          {/* Category Filter Pills */}
          <View style={styles.categoryPillsWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryPillsScroll}>
              <TouchableOpacity
                style={[
                  styles.categoryPill,
                  selectedCategory === 'All' && styles.categoryPillActive,
                ]}
                onPress={() => setSelectedCategory('All')}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    selectedCategory === 'All' && styles.categoryPillTextActive,
                  ]}
                >
                  ALL
                </Text>
              </TouchableOpacity>
              {EXERCISE_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryPill,
                    selectedCategory === cat && styles.categoryPillActive,
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryPillText,
                      selectedCategory === cat && styles.categoryPillTextActive,
                    ]}
                  >
                    {cat.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Exercise Results List */}
          <ScrollView contentContainerStyle={styles.catalogList} showsVerticalScrollIndicator={false}>
            {filteredCatalog.length === 0 ? (
              <View style={styles.emptyCatalog}>
                <Text style={styles.emptyCatalogText}>No matching exercises found.</Text>
              </View>
            ) : (
              filteredCatalog.map(item => {
                const alreadyAdded = exercises.some(e => e.exerciseId === item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.catalogItem,
                      alreadyAdded && styles.catalogItemDisabled,
                    ]}
                    onPress={() => handleAddExercise(item)}
                    disabled={alreadyAdded}
                  >
                    <View style={styles.catalogItemLeft}>
                      <Text style={[styles.catalogItemName, alreadyAdded && { color: '#999' }]}>
                        {item.name}
                      </Text>
                      <Text style={styles.catalogItemSubtitle}>
                        {item.category} • {item.equipment}
                      </Text>
                    </View>
                    {alreadyAdded ? (
                      <View style={styles.addedBadge}>
                        <Text style={styles.addedBadgeText}>ADDED</Text>
                      </View>
                    ) : (
                      <Ionicons name="add-circle-outline" size={24} color="black" />
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* SET TYPE PICKER MODAL */}
      {/* ========================================================= */}
      <Modal
        visible={typePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTypePickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setTypePickerVisible(false)}
        >
          <View style={styles.setTypeDialog}>
            <Text style={styles.setTypeDialogTitle}>SELECT SET TYPE</Text>
            {SET_TYPES.map(typeItem => (
              <TouchableOpacity
                key={typeItem.value}
                style={styles.setTypeDialogRow}
                onPress={() => {
                  if (activeSetTarget) {
                    handleUpdateSet(
                      activeSetTarget.exerciseIndex,
                      activeSetTarget.setIndex,
                      'type',
                      typeItem.value
                    );
                  }
                  setTypePickerVisible(false);
                }}
              >
                <View style={[styles.typeColorDot, { backgroundColor: typeItem.color }]} />
                <Text style={styles.setTypeDialogText}>{typeItem.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ========================================================= */}
      {/* FINISH WORKOUT SUMMARY MODAL */}
      {/* ========================================================= */}
      <Modal
        visible={showFinishModal}
        transparent
        animationType="slide"
        onRequestClose={() => !isSaving && setShowFinishModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.summaryDialog}>
            <Text style={styles.summaryTitle}>COMPLETE WORKOUT</Text>
            <Text style={styles.summarySubtitle}>Ready to save this workout session to your cloud records?</Text>

            <View style={styles.summaryStatsBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>TITLE</Text>
                <Text style={styles.summaryValue}>{workoutTitle || 'Workout'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>DURATION</Text>
                <Text style={styles.summaryValue}>{formattedTimer}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>EXERCISES</Text>
                <Text style={styles.summaryValue}>{exercises.length}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>COMPLETED SETS</Text>
                <Text style={styles.summaryValue}>{liveStats.totalSets}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>TOTAL VOLUME</Text>
                <Text style={styles.summaryValue}>{liveStats.totalVolume.toLocaleString()} lbs</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.confirmSaveButton}
              onPress={confirmFinishWorkout}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.confirmSaveButtonText}>SAVE & FINISH</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelModalButton}
              onPress={() => setShowFinishModal(false)}
              disabled={isSaving}
            >
              <Text style={styles.cancelModalButtonText}>KEEP EDITING</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: 'white' },
  container: { flex: 1, backgroundColor: 'white' },
  loadingContainer: { flex: 1, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
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
    fontSize: 22,
    color: 'black',
    letterSpacing: 2,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  timerText: {
    fontFamily: 'Oswald_600SemiBold',
    fontSize: 14,
    color: '#EF4444',
    letterSpacing: 1,
  },
  finishHeaderButton: {
    backgroundColor: 'black',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'black',
    minWidth: 70,
    alignItems: 'center',
  },
  finishHeaderButtonText: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 13,
    color: 'white',
    letterSpacing: 1.5,
  },

  // Scroll Content & Main Card
  scrollContent: { alignItems: 'center', paddingTop: 16, paddingBottom: 80 },
  mainCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: 'black',
    padding: 16,
  },

  // Title Section
  titleSection: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#E5E5E5',
    paddingBottom: 10,
  },
  titleInput: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 24,
    color: 'black',
    padding: 0,
    letterSpacing: 0.5,
  },
  dateLabel: {
    fontFamily: 'Oswald_400Regular',
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    letterSpacing: 1,
  },

  // Live Stats Bar
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#F7F7F7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 18,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statBox: { alignItems: 'center', flex: 1 },
  statValue: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 18,
    color: 'black',
  },
  statLabel: {
    fontFamily: 'Oswald_600SemiBold',
    fontSize: 10,
    color: '#777',
    letterSpacing: 1,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#D1D5DB',
  },

  // Empty State
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 16,
  },
  emptyStateTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 20,
    color: '#555',
    letterSpacing: 1.5,
    marginTop: 10,
  },
  emptyStateSubtitle: {
    fontFamily: 'System',
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },

  // Exercise Card
  exerciseCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'black',
    padding: 12,
    marginBottom: 16,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  exerciseInfo: { flex: 1 },
  exerciseName: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 17,
    color: 'black',
    letterSpacing: 0.5,
  },
  badgesRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  categoryBadge: {
    backgroundColor: '#000',
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
  deleteExerciseBtn: {
    padding: 4,
  },

  // Table Styles
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#DDD',
    paddingBottom: 6,
    marginBottom: 6,
  },
  thCell: {
    fontFamily: 'Oswald_600SemiBold',
    fontSize: 10,
    color: '#777',
    letterSpacing: 0.5,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: '#EEE',
  },
  setRowCompleted: {
    backgroundColor: '#F0FDF4',
    borderRadius: 6,
  },
  setCell: {
    justifyContent: 'center',
  },
  setNumberText: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 13,
    color: 'black',
    textAlign: 'center',
  },
  setTypeBadge: {
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 3,
    alignItems: 'center',
    marginRight: 4,
  },
  setTypeBadgeText: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 10,
    color: '#374151',
  },
  numericInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 4,
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '600',
    color: 'black',
    marginRight: 4,
  },
  checkButton: {
    width: 34,
    height: 30,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  checkButtonActive: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#000',
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 10,
  },
  addSetButtonText: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 12,
    color: 'black',
    letterSpacing: 1,
  },

  // Add Exercise CTA
  addExerciseCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 8,
    marginBottom: 18,
  },
  addExerciseCTAText: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 14,
    color: 'white',
    letterSpacing: 1.5,
  },

  // Notes
  notesContainer: {
    borderTopWidth: 1,
    borderColor: '#E5E5E5',
    paddingTop: 14,
    marginBottom: 16,
  },
  notesLabel: {
    fontFamily: 'Oswald_600SemiBold',
    fontSize: 11,
    color: '#666',
    letterSpacing: 1,
    marginBottom: 6,
  },
  notesInput: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 10,
    fontFamily: 'System',
    fontSize: 13,
    color: 'black',
    minHeight: 60,
    backgroundColor: '#FAFAFA',
  },
  discardBottomLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  discardBottomLinkText: {
    fontFamily: 'Oswald_600SemiBold',
    fontSize: 12,
    color: '#EF4444',
    letterSpacing: 1,
  },

  // Exercise Picker Modal
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
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderColor: 'black',
  },
  modalTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 24,
    color: 'black',
    letterSpacing: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: 'black',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FAFAFA',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'System',
    color: 'black',
    padding: 0,
  },
  categoryPillsWrap: {
    marginTop: 10,
    marginBottom: 6,
  },
  categoryPillsScroll: {
    paddingHorizontal: 16,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'black',
    backgroundColor: 'white',
    marginRight: 8,
  },
  categoryPillActive: {
    backgroundColor: 'black',
  },
  categoryPillText: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 11,
    color: 'black',
    letterSpacing: 1,
  },
  categoryPillTextActive: {
    color: 'white',
  },
  catalogList: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 40,
  },
  catalogItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#EEE',
  },
  catalogItemDisabled: {
    opacity: 0.5,
  },
  catalogItemLeft: { flex: 1, paddingRight: 10 },
  catalogItemName: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 15,
    color: 'black',
    letterSpacing: 0.5,
  },
  catalogItemSubtitle: {
    fontFamily: 'System',
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  addedBadge: {
    backgroundColor: '#E5E5E5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  addedBadgeText: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 10,
    color: '#666',
    letterSpacing: 1,
  },
  emptyCatalog: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyCatalogText: {
    fontFamily: 'System',
    fontSize: 14,
    color: '#888',
  },

  // Modal Overlays
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  setTypeDialog: {
    width: 280,
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: 'black',
    padding: 16,
  },
  setTypeDialogTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 20,
    color: 'black',
    letterSpacing: 1.5,
    marginBottom: 12,
    textAlign: 'center',
  },
  setTypeDialogRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
  },
  typeColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  setTypeDialogText: {
    fontFamily: 'Oswald_600SemiBold',
    fontSize: 14,
    color: 'black',
  },

  // Summary / Finish Dialog
  summaryDialog: {
    width: 320,
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 4,
    borderColor: 'black',
    padding: 20,
    alignItems: 'center',
  },
  summaryTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 28,
    color: 'black',
    letterSpacing: 2,
    marginBottom: 4,
  },
  summarySubtitle: {
    fontFamily: 'System',
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  summaryStatsBox: {
    width: '100%',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: 12,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontFamily: 'Oswald_600SemiBold',
    fontSize: 12,
    color: '#777',
    letterSpacing: 1,
  },
  summaryValue: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 13,
    color: 'black',
  },
  confirmSaveButton: {
    width: '100%',
    backgroundColor: 'black',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  confirmSaveButtonText: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 14,
    color: 'white',
    letterSpacing: 1.5,
  },
  cancelModalButton: {
    paddingVertical: 6,
  },
  cancelModalButtonText: {
    fontFamily: 'Oswald_600SemiBold',
    fontSize: 12,
    color: '#888',
    letterSpacing: 1,
  },
});
