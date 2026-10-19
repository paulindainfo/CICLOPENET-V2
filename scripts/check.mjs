import {readdir,readFile,stat} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
async function walk(dir){return(await Promise.all((await readdir(dir)).map(async name=>{const p=path.join(dir,name);if(['node_modules','reference','.git','artifacts'].includes(name))return [];return (await stat(p)).isDirectory()?walk(p):[p];}))).flat();}
const files=await walk('.');let errors=0;
for(const file of files){
  if(/\.(mjs|js)$/.test(file)){
    const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(result.status){console.error(result.stderr);errors++;}
    const source=await readFile(file,'utf8');for(const match of source.matchAll(/from\s*['"](\.[^'"]+)['"]/g)){try{await stat(path.resolve(path.dirname(file),match[1]));}catch{console.error(`Importação ausente: ${file} → ${match[1]}`);errors++;}}
  }
  if(file.endsWith('.json'))try{JSON.parse(await readFile(file,'utf8'));}catch(e){console.error(`${file}: ${e.message}`);errors++;}
}
if(errors)process.exitCode=1;else console.log(`Verificação concluída: sintaxe, importações locais e JSON (${files.length} arquivos).`);
