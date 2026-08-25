import { auth } from '../FirebaseConfig';
import { saveMembership, localDateString, type Membership } from './userStorage';

export const purchaseMembership = async (
  plan: 'Basic' | 'Standard' | 'Wellness' | 'Platinum'
): Promise<Membership> => {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error('No user is currently logged in.');
  }

  const startDate = new Date();
  const endDate = new Date();

  // Dynamic plan durations
  if (plan === 'Basic') {
    endDate.setDate(startDate.getDate() + 30); // 30 days
  } else if (plan === 'Standard') {
    endDate.setMonth(startDate.getMonth() + 3); // 3 months
  } else if (plan === 'Wellness') {
    endDate.setMonth(startDate.getMonth() + 1); // 1 month
  } else if (plan === 'Platinum') {
    endDate.setFullYear(startDate.getFullYear() + 1); // 1 year
  }

  const membership: Membership = {
    plan,
    startDate: localDateString(startDate),
    endDate: localDateString(endDate),
    createdAt: startDate.toISOString(),
  };

  await saveMembership(uid, membership);
  return membership;
};
