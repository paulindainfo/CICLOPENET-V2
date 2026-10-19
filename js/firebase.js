import {initializeApp} from '../vendor/firebase.js';
import {getAuth,signInAnonymously,setPersistence,browserLocalPersistence,connectAuthEmulator} from '../vendor/firebase.js';
import {getFirestore,connectFirestoreEmulator} from '../vendor/firebase.js';
import {config} from './config.js';
import {state} from './state.js';
export const emulator=['localhost','127.0.0.1'].includes(location.hostname)&&new URLSearchParams(location.search).get('emulator')==='1';
const settings=emulator?{...config.firebase,projectId:'demo-ciclope',apiKey:'demo-api-key',authDomain:'demo-ciclope.firebaseapp.com'}:config.firebase;
const app=initializeApp(settings);
export const auth=getAuth(app),db=getFirestore(app,config.database);
if(emulator){connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});connectFirestoreEmulator(db,'127.0.0.1',8180);}
export async function api(action,payload={}){if(!navigator.onLine)throw new Error('Sem conexão. Reconecte para salvar.');const {operate}=await import('./operations.js');return operate(db,auth,state.profile,action,payload);}
export async function identify(){await setPersistence(auth,browserLocalPersistence);await auth.authStateReady();if(!auth.currentUser)await signInAnonymously(auth);state.uid=auth.currentUser.uid;}
