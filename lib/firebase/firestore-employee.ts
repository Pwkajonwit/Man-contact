import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from './config';

export const getAssignedCustomers = async (uid: string) => {
  const q = query(
    collection(db, 'customers'), 
    where('handled_by_uid', '==', uid),
    orderBy('created_at', 'desc'),
    limit(20)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getCategoryChildren = async (parentId: string | null) => {
  const q = query(collection(db, 'categories'), where('parent_id', '==', parentId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
