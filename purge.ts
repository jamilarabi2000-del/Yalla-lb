import { initializeApp } from 'firebase/app';
import { getFirestore, doc, deleteDoc, getDocs, collection } from 'firebase/firestore';

const firebaseConfig = {
  "projectId": "yalla-lb-2026",
  "appId": "1:878326922370:web:8abd543edb90484ba9889b",
  "apiKey": "AIzaSyDQI42LOpzqKckcTDsY4dBIW3scC2PaGAI",
  "authDomain": "yalla-lb-2026.firebaseapp.com",
  "firestoreDatabaseId": "ai-studio-yallalb-1415b490-9de7-4a31-acee-0f9c6439c18c",
  "storageBucket": "yalla-lb-2026.firebasestorage.app",
  "messagingSenderId": "878326922370",
  "measurementId": "",
  "oAuthClientId": "878326922370-ml6v8ck0uljja62vd5qg6341o6f82hrp.apps.googleusercontent.com",
  "recaptchaSiteKey": ""
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  console.log("Purging guest_profile, guest_session carts & wishlists, and fabricated orders...");
  
  try {
    await deleteDoc(doc(db, 'users', 'guest_profile'));
  } catch (e) { console.log(e.message); }

  try {
    await deleteDoc(doc(db, 'carts', 'guest_session'));
  } catch (e) { console.log(e.message); }

  try {
    await deleteDoc(doc(db, 'wishlists', 'guest_session'));
  } catch (e) { console.log(e.message); }
  
  try {
    const orders = await getDocs(collection(db, 'orders'));
    for (const d of orders.docs) {
      if (d.id === 'YLB-98421' || d.id === 'YLB-91120') {
        console.log('Deleting fabricated order: ' + d.id);
        await deleteDoc(doc(db, 'orders', d.id));
      }
    }
  } catch(e) { console.log(e.message); }
  
  console.log("Purge complete.");
}

run();
