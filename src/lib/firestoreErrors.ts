import { auth } from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function isQuotaOrNetworkError(error: unknown): boolean {
  if (!error) return false;
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes('Quota limit exceeded') ||
    msg.includes('Quota exceeded') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('quota metric') ||
    msg.includes('the client is offline') ||
    msg.includes('unavailable') ||
    msg.includes('Failed to get document because the client is offline')
  );
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMessage = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };

  // Gracefully block quota and offline errors to prevent Preview and app crashing
  if (isQuotaOrNetworkError(error)) {
    console.warn('[Firestore Safe Shield] Quota exceeded or offline. Safe fallback activated for path:', path, errMessage);
    return;
  }

  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // Only throw for security permission inspection as mandated by Firebase rules audit
  if (errMessage.includes('insufficient permissions') || errMessage.includes('permission-denied') || errMessage.includes('PERMISSION_DENIED')) {
    throw new Error(JSON.stringify(errInfo));
  }
}
