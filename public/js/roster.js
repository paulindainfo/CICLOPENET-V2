// Profile labels identify the table participants; access roles belong to invited devices.
export const ROSTER = [
  {id:'user1',name:'Paulo',designation:'DONO DO SITE',role:'admin',color:'#b3444b'},
  {id:'user2',name:'Flavia',designation:'',role:'member',color:'#9d8968'},
  {id:'user3',name:'Duda',designation:'',role:'member',color:'#68899d'},
  {id:'user4',name:'Sofia',designation:'',role:'member',color:'#9280ab'},
  {id:'user5',name:'Felipe',designation:'MESTRE DA MESA',role:'admin',color:'#639b85'},
];
export const PROFILE_IDS = ROSTER.map(p=>p.id);
export const designation = id=>ROSTER.find(p=>p.id===id)?.designation||'';
export const initialProfile = p=>({name:p.name,clan:'',sect:'',player:p.name,signature:'',avatar:null,color:p.color,revision:1,updatedAt:Date.now()});
