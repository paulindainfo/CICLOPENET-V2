export {initializeApp,deleteApp} from 'firebase/app';
export {getAuth,signInAnonymously,setPersistence,browserLocalPersistence,connectAuthEmulator} from 'firebase/auth';
export {getFirestore,connectFirestoreEmulator,collection,doc,query,where,orderBy,limit,startAfter,onSnapshot,getDoc,getDocs,setDoc,updateDoc,deleteDoc,runTransaction,serverTimestamp,Bytes,terminate} from 'firebase/firestore';
