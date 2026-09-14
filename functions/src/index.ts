import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK using application default credentials
initializeApp();

const db = getFirestore();
const auth = getAuth();

export interface DeleteMemberRequest {
  targetUid: string;
}

export interface DeleteMemberResponse {
  success: boolean;
  message: string;
  deletedUid: string;
  authDeleted: boolean;
}

/**
 * Callable Cloud Function: deleteMember
 * 
 * Secure backend function for administrative member deletion.
 * Enforces authentication, verifies admin/owner privileges strictly via Firestore profile,
 * prevents self-deletion, recursively removes all Firestore data (profile, subcollections, requests),
 * and deletes the Firebase Authentication record.
 */
export const deleteMember = onCall(
  { region: 'asia-south1' },
  async (request: CallableRequest<DeleteMemberRequest>): Promise<DeleteMemberResponse> => {
    // 1. Enforce Authentication
    if (!request.auth || !request.auth.uid) {
      logger.warn('[deleteMember] Rejected: Unauthenticated request');
      throw new HttpsError(
        'unauthenticated',
        'Authentication required. You must be signed in to perform this operation.'
      );
    }

    const callerUid = request.auth.uid;

    // 2. Validate Target UID
    const targetUid = request.data?.targetUid;
    if (!targetUid || typeof targetUid !== 'string' || targetUid.trim() === '') {
      logger.warn(`[deleteMember] Rejected: Invalid targetUid provided by caller ${callerUid}`);
      throw new HttpsError(
        'invalid-argument',
        'Invalid target member UID. A non-empty string targetUid must be provided.'
      );
    }

    const cleanTargetUid = targetUid.trim();

    // 3. Prevent Self-Deletion
    if (callerUid === cleanTargetUid) {
      logger.warn(`[deleteMember] Rejected: Self-deletion attempt by caller ${callerUid}`);
      throw new HttpsError(
        'invalid-argument',
        'Self-deletion is not permitted. An administrator cannot delete their own account.'
      );
    }

    // 4. Verify Authorization via Caller's Firestore Profile (Never rely on email or client claims)
    const callerDoc = await db.collection('users').doc(callerUid).get();
    if (!callerDoc.exists) {
      logger.warn(`[deleteMember] Rejected: Caller profile /users/${callerUid} not found`);
      throw new HttpsError(
        'permission-denied',
        'Access denied. Caller profile does not exist.'
      );
    }

    const callerData = callerDoc.data();
    const callerRole = callerData?.role;

    if (callerRole !== 'admin' && callerRole !== 'owner') {
      logger.warn(
        `[deleteMember] Rejected: Caller ${callerUid} has insufficient role (${callerRole || 'none'})`
      );
      throw new HttpsError(
        'permission-denied',
        'Access denied. Only administrators or gym owners can delete member accounts.'
      );
    }

    logger.info(
      `[deleteMember] Authorized deletion initiated by caller ${callerUid} (role: ${callerRole}) for target ${cleanTargetUid}`
    );

    // 5. Delete Associated Membership Requests (/membershipRequests where userId == targetUid)
    // Safely handles arbitrary document counts (>500) using bulkWriter to avoid Firestore 500-op batch limits
    try {
      const requestsSnap = await db
        .collection('membershipRequests')
        .where('userId', '==', cleanTargetUid)
        .get();

      if (!requestsSnap.empty) {
        const bulkWriter = db.bulkWriter();
        bulkWriter.onWriteError((err) => {
          logger.error(
            `[deleteMember] Error deleting request document ${err.documentRef.path}:`,
            err
          );
          return false;
        });

        requestsSnap.docs.forEach((docSnap) => {
          bulkWriter.delete(docSnap.ref);
        });

        await bulkWriter.close();
        logger.info(
          `[deleteMember] Deleted ${requestsSnap.size} membership request(s) for user ${cleanTargetUid}`
        );
      }
    } catch (requestDeletionError) {
      logger.error(
        `[deleteMember] Failed to delete membership requests for user ${cleanTargetUid}:`,
        requestDeletionError
      );
      throw new HttpsError(
        'internal',
        'Failed to clean up associated membership requests.'
      );
    }

    // 6. Recursively Delete Firestore User Document and All Subcollections
    // Covers: /users/{targetUid}, /users/{targetUid}/membership/*, /users/{targetUid}/prs/*,
    //         /users/{targetUid}/attendance/*, /users/{targetUid}/workouts/*, etc.
    try {
      const userRef = db.collection('users').doc(cleanTargetUid);
      await db.recursiveDelete(userRef);
      logger.info(
        `[deleteMember] Successfully recursively deleted Firestore data for user ${cleanTargetUid}`
      );
    } catch (firestoreError) {
      logger.error(
        `[deleteMember] Failed to recursively delete Firestore document /users/${cleanTargetUid}:`,
        firestoreError
      );
      throw new HttpsError(
        'internal',
        'Failed to delete member data from database.'
      );
    }

    // 7. Delete Target User from Firebase Authentication
    let authDeleted = false;
    try {
      await auth.deleteUser(cleanTargetUid);
      authDeleted = true;
      logger.info(
        `[deleteMember] Successfully deleted Firebase Auth account for user ${cleanTargetUid}`
      );
    } catch (authError: any) {
      if (authError.code === 'auth/user-not-found') {
        logger.warn(
          `[deleteMember] Target user ${cleanTargetUid} was not found in Firebase Auth; skipping auth deletion.`
        );
      } else {
        logger.error(
          `[deleteMember] Failed to delete user ${cleanTargetUid} from Firebase Auth:`,
          authError
        );
        throw new HttpsError(
          'internal',
          `Failed to delete member authentication account: ${authError.message || 'Unknown auth error'}`
        );
      }
    }

    logger.info(`[deleteMember] Complete member deletion finished for ${cleanTargetUid}`);

    return {
      success: true,
      message: 'Member and all associated data deleted successfully.',
      deletedUid: cleanTargetUid,
      authDeleted,
    };
  }
);
