import { auth } from '../FirebaseConfig';
import {
  createMembershipRequest,
  localDateString,
  type Membership,
  type MembershipPlanType,
  type MembershipRequest,
} from './userStorage';

// Helper to calculate plan start and end dates based on gym business rules
export const calculatePlanDates = (
  plan: MembershipPlanType,
  startDate: Date = new Date()
): Membership => {
  const endDate = new Date(startDate);

  if (plan === 'Basic') {
    endDate.setDate(startDate.getDate() + 30); // 30 days
  } else if (plan === 'Standard') {
    endDate.setMonth(startDate.getMonth() + 3); // 3 months
  } else if (plan === 'Wellness') {
    endDate.setMonth(startDate.getMonth() + 1); // 1 month
  } else if (plan === 'Platinum') {
    endDate.setFullYear(startDate.getFullYear() + 1); // 1 year
  }

  return {
    plan,
    startDate: localDateString(startDate),
    endDate: localDateString(endDate),
    createdAt: startDate.toISOString(),
    status: 'active',
  };
};

// Member submits a request to staff for plan activation
export const requestMembershipPlan = async (
  plan: MembershipPlanType,
  requestType: 'new' | 'renewal' = 'new'
): Promise<MembershipRequest> => {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error('No user is currently logged in.');
  }
  return createMembershipRequest(uid, plan, requestType);
};
