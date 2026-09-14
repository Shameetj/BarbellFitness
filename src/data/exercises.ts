export type ExerciseCategory =
  | 'Chest'
  | 'Back'
  | 'Legs'
  | 'Shoulders'
  | 'Arms'
  | 'Core';

export type ExerciseEquipment =
  | 'Barbell'
  | 'Dumbbell'
  | 'Machine'
  | 'Cable'
  | 'Bodyweight'
  | 'Other';

export type Exercise = {
  id: string;
  name: string;
  category: ExerciseCategory;
  equipment: ExerciseEquipment;
};

export const EXERCISE_CATEGORIES: readonly ExerciseCategory[] = [
  'Chest',
  'Back',
  'Legs',
  'Shoulders',
  'Arms',
  'Core',
] as const;

export const EXERCISE_EQUIPMENT: readonly ExerciseEquipment[] = [
  'Barbell',
  'Dumbbell',
  'Machine',
  'Cable',
  'Bodyweight',
  'Other',
] as const;

export const EXERCISES: readonly Exercise[] = [
  // ==========================================
  // CHEST (11 exercises)
  // ==========================================
  {
    id: 'barbell_bench_press',
    name: 'Barbell Bench Press',
    category: 'Chest',
    equipment: 'Barbell',
  },
  {
    id: 'incline_barbell_bench_press',
    name: 'Incline Barbell Bench Press',
    category: 'Chest',
    equipment: 'Barbell',
  },
  {
    id: 'decline_barbell_bench_press',
    name: 'Decline Barbell Bench Press',
    category: 'Chest',
    equipment: 'Barbell',
  },
  {
    id: 'dumbbell_bench_press',
    name: 'Dumbbell Bench Press',
    category: 'Chest',
    equipment: 'Dumbbell',
  },
  {
    id: 'incline_dumbbell_bench_press',
    name: 'Incline Dumbbell Bench Press',
    category: 'Chest',
    equipment: 'Dumbbell',
  },
  {
    id: 'dumbbell_fly',
    name: 'Dumbbell Fly',
    category: 'Chest',
    equipment: 'Dumbbell',
  },
  {
    id: 'cable_crossover',
    name: 'Cable Crossover',
    category: 'Chest',
    equipment: 'Cable',
  },
  {
    id: 'chest_dip',
    name: 'Chest Dip',
    category: 'Chest',
    equipment: 'Bodyweight',
  },
  {
    id: 'push_up',
    name: 'Push-Up',
    category: 'Chest',
    equipment: 'Bodyweight',
  },
  {
    id: 'chest_press_machine',
    name: 'Chest Press Machine',
    category: 'Chest',
    equipment: 'Machine',
  },
  {
    id: 'pec_deck_fly',
    name: 'Pec Deck Fly',
    category: 'Chest',
    equipment: 'Machine',
  },

  // ==========================================
  // BACK (11 exercises)
  // ==========================================
  {
    id: 'conventional_deadlift',
    name: 'Conventional Deadlift',
    category: 'Back',
    equipment: 'Barbell',
  },
  {
    id: 'barbell_bent_over_row',
    name: 'Barbell Bent-Over Row',
    category: 'Back',
    equipment: 'Barbell',
  },
  {
    id: 'dumbbell_row',
    name: 'Single-Arm Dumbbell Row',
    category: 'Back',
    equipment: 'Dumbbell',
  },
  {
    id: 'lat_pulldown',
    name: 'Lat Pulldown',
    category: 'Back',
    equipment: 'Cable',
  },
  {
    id: 'seated_cable_row',
    name: 'Seated Cable Row',
    category: 'Back',
    equipment: 'Cable',
  },
  {
    id: 'pull_up',
    name: 'Pull-Up',
    category: 'Back',
    equipment: 'Bodyweight',
  },
  {
    id: 'chin_up',
    name: 'Chin-Up',
    category: 'Back',
    equipment: 'Bodyweight',
  },
  {
    id: 't_bar_row',
    name: 'T-Bar Row',
    category: 'Back',
    equipment: 'Barbell',
  },
  {
    id: 'face_pull',
    name: 'Face Pull',
    category: 'Back',
    equipment: 'Cable',
  },
  {
    id: 'straight_arm_lat_pulldown',
    name: 'Straight-Arm Lat Pulldown',
    category: 'Back',
    equipment: 'Cable',
  },
  {
    id: 'hyperextension',
    name: 'Back Extension / Hyperextension',
    category: 'Back',
    equipment: 'Bodyweight',
  },

  // ==========================================
  // LEGS (14 exercises)
  // ==========================================
  {
    id: 'barbell_back_squat',
    name: 'Barbell Back Squat',
    category: 'Legs',
    equipment: 'Barbell',
  },
  {
    id: 'barbell_front_squat',
    name: 'Barbell Front Squat',
    category: 'Legs',
    equipment: 'Barbell',
  },
  {
    id: 'romanian_deadlift',
    name: 'Romanian Deadlift',
    category: 'Legs',
    equipment: 'Barbell',
  },
  {
    id: 'sumo_deadlift',
    name: 'Sumo Deadlift',
    category: 'Legs',
    equipment: 'Barbell',
  },
  {
    id: 'leg_press',
    name: 'Leg Press',
    category: 'Legs',
    equipment: 'Machine',
  },
  {
    id: 'goblet_squat',
    name: 'Goblet Squat',
    category: 'Legs',
    equipment: 'Dumbbell',
  },
  {
    id: 'bulgarian_split_squat',
    name: 'Bulgarian Split Squat',
    category: 'Legs',
    equipment: 'Dumbbell',
  },
  {
    id: 'walking_lunge',
    name: 'Walking Lunge',
    category: 'Legs',
    equipment: 'Dumbbell',
  },
  {
    id: 'leg_extension',
    name: 'Leg Extension',
    category: 'Legs',
    equipment: 'Machine',
  },
  {
    id: 'seated_leg_curl',
    name: 'Seated Leg Curl',
    category: 'Legs',
    equipment: 'Machine',
  },
  {
    id: 'lying_leg_curl',
    name: 'Lying Leg Curl',
    category: 'Legs',
    equipment: 'Machine',
  },
  {
    id: 'standing_calf_raise',
    name: 'Standing Calf Raise',
    category: 'Legs',
    equipment: 'Machine',
  },
  {
    id: 'seated_calf_raise',
    name: 'Seated Calf Raise',
    category: 'Legs',
    equipment: 'Machine',
  },
  {
    id: 'hip_thrust',
    name: 'Barbell Hip Thrust',
    category: 'Legs',
    equipment: 'Barbell',
  },

  // ==========================================
  // SHOULDERS (10 exercises)
  // ==========================================
  {
    id: 'overhead_press',
    name: 'Overhead Press (OHP)',
    category: 'Shoulders',
    equipment: 'Barbell',
  },
  {
    id: 'seated_dumbbell_shoulder_press',
    name: 'Seated Dumbbell Shoulder Press',
    category: 'Shoulders',
    equipment: 'Dumbbell',
  },
  {
    id: 'arnold_press',
    name: 'Arnold Press',
    category: 'Shoulders',
    equipment: 'Dumbbell',
  },
  {
    id: 'dumbbell_lateral_raise',
    name: 'Dumbbell Lateral Raise',
    category: 'Shoulders',
    equipment: 'Dumbbell',
  },
  {
    id: 'cable_lateral_raise',
    name: 'Cable Lateral Raise',
    category: 'Shoulders',
    equipment: 'Cable',
  },
  {
    id: 'dumbbell_front_raise',
    name: 'Dumbbell Front Raise',
    category: 'Shoulders',
    equipment: 'Dumbbell',
  },
  {
    id: 'rear_delt_fly_machine',
    name: 'Rear Delt Fly (Reverse Pec Deck)',
    category: 'Shoulders',
    equipment: 'Machine',
  },
  {
    id: 'dumbbell_rear_delt_raise',
    name: 'Dumbbell Rear Delt Raise',
    category: 'Shoulders',
    equipment: 'Dumbbell',
  },
  {
    id: 'upright_row',
    name: 'Upright Row',
    category: 'Shoulders',
    equipment: 'Barbell',
  },
  {
    id: 'barbell_shrug',
    name: 'Barbell Shrug',
    category: 'Shoulders',
    equipment: 'Barbell',
  },

  // ==========================================
  // ARMS (11 exercises)
  // ==========================================
  {
    id: 'barbell_biceps_curl',
    name: 'Barbell Biceps Curl',
    category: 'Arms',
    equipment: 'Barbell',
  },
  {
    id: 'dumbbell_biceps_curl',
    name: 'Dumbbell Biceps Curl',
    category: 'Arms',
    equipment: 'Dumbbell',
  },
  {
    id: 'hammer_curl',
    name: 'Hammer Curl',
    category: 'Arms',
    equipment: 'Dumbbell',
  },
  {
    id: 'incline_dumbbell_curl',
    name: 'Incline Dumbbell Curl',
    category: 'Arms',
    equipment: 'Dumbbell',
  },
  {
    id: 'preacher_curl',
    name: 'Preacher Curl',
    category: 'Arms',
    equipment: 'Machine',
  },
  {
    id: 'cable_biceps_curl',
    name: 'Cable Biceps Curl',
    category: 'Arms',
    equipment: 'Cable',
  },
  {
    id: 'triceps_rope_pushdown',
    name: 'Triceps Rope Pushdown',
    category: 'Arms',
    equipment: 'Cable',
  },
  {
    id: 'barbell_skull_crusher',
    name: 'Barbell Skull Crusher',
    category: 'Arms',
    equipment: 'Barbell',
  },
  {
    id: 'overhead_dumbbell_triceps_extension',
    name: 'Overhead Dumbbell Triceps Extension',
    category: 'Arms',
    equipment: 'Dumbbell',
  },
  {
    id: 'close_grip_bench_press',
    name: 'Close-Grip Bench Press',
    category: 'Arms',
    equipment: 'Barbell',
  },
  {
    id: 'bench_dip',
    name: 'Triceps Bench Dip',
    category: 'Arms',
    equipment: 'Bodyweight',
  },

  // ==========================================
  // CORE (7 exercises)
  // ==========================================
  {
    id: 'plank',
    name: 'Plank',
    category: 'Core',
    equipment: 'Bodyweight',
  },
  {
    id: 'hanging_leg_raise',
    name: 'Hanging Leg Raise',
    category: 'Core',
    equipment: 'Bodyweight',
  },
  {
    id: 'ab_wheel_rollout',
    name: 'Ab Wheel Rollout',
    category: 'Core',
    equipment: 'Other',
  },
  {
    id: 'cable_woodchopper',
    name: 'Cable Woodchopper',
    category: 'Core',
    equipment: 'Cable',
  },
  {
    id: 'cable_crunch',
    name: 'Cable Crunch',
    category: 'Core',
    equipment: 'Cable',
  },
  {
    id: 'russian_twist',
    name: 'Russian Twist',
    category: 'Core',
    equipment: 'Bodyweight',
  },
  {
    id: 'decline_sit_up',
    name: 'Decline Sit-Up',
    category: 'Core',
    equipment: 'Bodyweight',
  },
] as const;

// Fast lookup map by ID
const exerciseMap = new Map<string, Exercise>(
  EXERCISES.map(exercise => [exercise.id, exercise])
);

/**
 * Validates the internal catalog integrity at module load in dev/test environments.
 * Throws if duplicate IDs, empty fields, or unsupported enum values exist.
 */
export const validateExerciseCatalog = (exercises: readonly Exercise[] = EXERCISES): void => {
  const seenIds = new Set<string>();
  const validCategories = new Set(EXERCISE_CATEGORIES);
  const validEquipment = new Set(EXERCISE_EQUIPMENT);

  for (const item of exercises) {
    if (!item.id || typeof item.id !== 'string' || item.id.trim() === '') {
      throw new Error('Exercise item has an empty or invalid id.');
    }
    if (item.id !== item.id.toLowerCase() || item.id.includes(' ') || !/^[a-z0-9_]+$/.test(item.id)) {
      throw new Error(`Exercise id "${item.id}" is not valid snake_case.`);
    }
    if (seenIds.has(item.id)) {
      throw new Error(`Duplicate exercise id detected: "${item.id}".`);
    }
    seenIds.add(item.id);

    if (!item.name || typeof item.name !== 'string' || item.name.trim() === '') {
      throw new Error(`Exercise "${item.id}" has an empty name.`);
    }
    if (!validCategories.has(item.category)) {
      throw new Error(`Exercise "${item.id}" has invalid category "${item.category}".`);
    }
    if (!validEquipment.has(item.equipment)) {
      throw new Error(`Exercise "${item.id}" has invalid equipment "${item.equipment}".`);
    }
  }
};

// Validate catalog integrity in development
if (__DEV__) {
  validateExerciseCatalog();
}

/**
 * Returns a single exercise by canonical ID, or undefined if not found.
 */
export const getExerciseById = (id: string): Exercise | undefined => {
  if (!id) return undefined;
  return exerciseMap.get(id);
};

/**
 * Searches exercises by query against exercise name, category, or equipment.
 * - Case-insensitive.
 * - Trims whitespace.
 * - Empty query returns the complete catalog.
 * - Deterministic ordering based on catalog definition.
 */
export const searchExercises = (query: string): Exercise[] => {
  const trimmed = query ? query.trim().toLowerCase() : '';
  if (!trimmed) {
    return [...EXERCISES];
  }

  return EXERCISES.filter(exercise =>
    exercise.name.toLowerCase().includes(trimmed) ||
    exercise.category.toLowerCase().includes(trimmed) ||
    exercise.equipment.toLowerCase().includes(trimmed)
  );
};

/**
 * Filters exercises by muscle group category.
 * Returns a new array to prevent mutation.
 */
export const filterExercisesByCategory = (category: ExerciseCategory | string): Exercise[] => {
  if (!category) return [...EXERCISES];
  return EXERCISES.filter(
    exercise => exercise.category.toLowerCase() === category.trim().toLowerCase()
  );
};

/**
 * Alias for filterExercisesByCategory.
 */
export const getExercisesByCategory = filterExercisesByCategory;
