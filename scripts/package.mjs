import {mkdir,readdir,copyFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {createWriteStream} from 'node:fs';
import {createRequire} from 'node:module';
const root=path.resolve('.'),out=path.join(root,'artifacts','CICLOPE-NET-V2');
await mkdir(out,{recursive:true});
const included=['public','android','scripts','tests','docs','package.json','package-lock.json','firebase.json','firebase.test.json','.firebaserc','firestore.rules','firestore.indexes.json','README.md','.gitignore'];
async function copy(source,destination){const s=await stat(source);if(s.isDirectory()){await mkdir(destination,{recursive:true});for(const name of await readdir(source)){if(name==='node_modules'||name==='build'||name.includes('.private.'))continue;await copy(path.join(source,name),path.join(destination,name));}}else await copyFile(source,destination);}
for(const name of included)await copy(path.join(root,name),path.join(out,name));
const zip=path.join(root,'CICLOPE-NET-V2.zip');
const require=createRequire(import.meta.url),archiver=require('archiver');
await new Promise((resolve,reject)=>{const output=createWriteStream(zip),archive=archiver('zip',{zlib:{level:9}});output.on('close',resolve);output.on('error',reject);archive.on('error',reject);archive.pipe(output);archive.directory(out,'CICLOPE-NET-V2');archive.finalize();});
console.log(zip);
