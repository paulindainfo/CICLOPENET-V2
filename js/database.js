import {collection,doc,query,where,orderBy,limit,startAfter,onSnapshot,getDoc,getDocs} from '../vendor/firebase.js';
import {db,api} from './firebase.js';
import {onCleanup} from './state.js';
export const collectionRef=name=>collection(db,'networks','principal',name);
export const documentRef=(name,id)=>doc(collectionRef(name),id);
export const unpack=s=>{const value=s.data();for(const k of ['createdAt','updatedAt'])if(value[k]?.toMillis)value[k]=value[k].toMillis();return {id:s.id,...value};};
export function live(name,constraints,callback,onError,scoped=true){const unsub=onSnapshot(query(collectionRef(name),...constraints),{includeMetadataChanges:true},s=>callback(s.docs.map(unpack),s),onError);return scoped?onCleanup(unsub):unsub;}
export const listConstraints=(type,deleted=false)=>[where('deleted','==',deleted),...(type?[where('type','==',type)]:[]),orderBy('updatedAt','desc')];
export const getRecord=async id=>{const s=await getDoc(documentRef('records',id));return s.exists()?unpack(s):null;};
export async function pageRecords(constraints,cursor=null,size=40){const s=await getDocs(query(collectionRef('records'),...constraints,...(cursor?[startAfter(cursor)]:[]),limit(size)));return {rows:s.docs.map(unpack),cursor:s.docs.at(-1),more:s.size===size};}
export function watchRecord(id,callback,error){return onCleanup(onSnapshot(documentRef('records',id),s=>callback(s.exists()?unpack(s):null),error));}
export async function revisions(id){const s=await getDocs(query(collection(documentRef('records',id),'versions'),orderBy('revision','desc'),limit(50)));return s.docs.map(unpack);}
export async function all(name){let out=[],cursor=null;for(;;){const s=await getDocs(query(collectionRef(name),orderBy('__name__'),...(cursor?[startAfter(cursor)]:[]),limit(200)));out.push(...s.docs.map(unpack));if(s.size<200)break;cursor=s.docs.at(-1);}return out;}
export const saveRecord=(record,expectedRevision=0,id=crypto.randomUUID(),deleted=false)=>api('saveRecord',{record,expectedRevision,id,deleted});
export {where,orderBy,limit,query,getDocs,getDoc,onSnapshot};
