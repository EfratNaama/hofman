import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const contactsCollection = collection(db, 'contacts');

export async function submitContactMessage({ name, email, subject, message }) {
  const payload = {
    name: name.trim(),
    email: email.trim(),
    subject: subject.trim(),
    message: message.trim(),
    submittedAt: serverTimestamp(),
    isRead: false,
  };
  const docRef = await addDoc(contactsCollection, payload);
  return { id: docRef.id, ...payload };
}
