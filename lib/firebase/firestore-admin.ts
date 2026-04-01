import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from './config';

export const getAllCustomers = async (pSize = 50) => {
  const q = query(collection(db, 'customers'), orderBy('created_at', 'desc'), limit(pSize));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getDepartments = async (parentId = null) => {
  const q = query(collection(db, 'departments'), where('parent_id', '==', parentId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
