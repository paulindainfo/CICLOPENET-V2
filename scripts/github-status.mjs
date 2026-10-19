import {spawnSync} from 'node:child_process';
const result=spawnSync('git',['credential','fill'],{input:'protocol=https\nhost=github.com\nusername=paulindainfo\n\n',encoding:'utf8',windowsHide:true});
if(result.status)throw new Error('Nenhuma credencial GitHub disponível. Autorize o GitHub pelo gerenciador de credenciais.');
const values=Object.fromEntries(result.stdout.trim().split(/\r?\n/).map(line=>{const i=line.indexOf('=');return [line.slice(0,i),line.slice(i+1).trim()];}));
const headers={Authorization:`Bearer ${values.password}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
const userResponse=await fetch('https://api.github.com/user',{headers});if(!userResponse.ok){const failure=await userResponse.json();throw new Error(`GitHub ${userResponse.status}: ${failure.message}`);}const user=await userResponse.json();
const response=await fetch('https://api.github.com/repos/paulindainfo/CICLOPENET',{headers}),repo=await response.json();
const target=await fetch(`https://api.github.com/repos/${user.login}/CICLOPENET-V2`,{headers});
console.log(JSON.stringify({connectedAccount:user.login,originalRepository:repo.full_name,canPushOriginal:repo.permissions?.push===true,canAdministerOriginal:repo.permissions?.admin===true,newRepositoryExists:target.status===200}));
