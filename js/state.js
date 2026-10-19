export const state={profile:localStorage.getItem('ciclope.profile')||'',profiles:[],campaign:{},role:'member',uid:'',ready:false,unread:0};
export function setProfile(id) { state.profile=id; if(id)localStorage.setItem('ciclope.profile',id);else localStorage.removeItem('ciclope.profile'); }
export const currentProfile=()=>state.profiles.find(p=>p.id===state.profile);
export let routeCleanups=[];
export function cleanupRoute(){for(const fn of routeCleanups)fn();routeCleanups=[];}
export function onCleanup(fn){routeCleanups.push(fn);return fn;}
