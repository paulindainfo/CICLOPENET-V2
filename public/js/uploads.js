import {doc,setDoc,getDoc,Bytes,serverTimestamp} from '../vendor/firebase.js';
import {db} from './firebase.js';
import {state} from './state.js';
const MAX=900*1024,allowed=['image/jpeg','image/png','image/webp','image/gif','application/pdf','text/plain'],urls=new Map();
async function compress(file){
  const image=await createImageBitmap(file),ratio=Math.min(1,1600/Math.max(image.width,image.height)),canvas=document.createElement('canvas');canvas.width=Math.round(image.width*ratio);canvas.height=Math.round(image.height*ratio);canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);image.close();
  let quality=.85,blob;do{blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',quality));quality-=.15;}while(blob.size>220*1024&&quality>.2);
  return new File([blob],file.name.replace(/\.[^.]+$/,'')+'.jpg',{type:'image/jpeg'});
}
export async function upload(file,imageOnly=false){
  if(!allowed.includes(file.type)||imageOnly&&!file.type.startsWith('image/'))throw new Error('Use imagem JPG, PNG, WebP, GIF, PDF ou TXT. SVG e HTML não são aceitos.');
  if(file.type.startsWith('image/')){try{file=await compress(file);}catch{throw new Error('Não foi possível ler a imagem. Use um arquivo JPG, PNG ou WebP válido.');}}
  if(!file.size||file.size>MAX)throw new Error('No plano gratuito, anexos podem ter até 900 KB. Imagens são comprimidas automaticamente.');
  const id=crypto.randomUUID(),path=`networks/principal/files/${id}`,meta={path,name:file.name.slice(0,180),type:file.type,size:file.size};
  await setDoc(doc(db,path),{...meta,data:Bytes.fromUint8Array(new Uint8Array(await file.arrayBuffer())),uploadedBy:state.uid,createdAt:serverTimestamp()});return meta;
}
export async function assetUrl(asset){
  if(!asset)return '';if(!urls.has(asset.path))urls.set(asset.path,(async()=>{const snap=await getDoc(doc(db,asset.path));if(!snap.exists())throw new Error('Anexo não encontrado.');const value=snap.data();return URL.createObjectURL(new Blob([value.data.toUint8Array()],{type:value.type}));})().catch(e=>{urls.delete(asset.path);throw e;}));return urls.get(asset.path);
}
export async function hydrateImages(root=document){for(const el of root.querySelectorAll('[data-color]'))if(/^#[0-9a-f]{6}$/i.test(el.dataset.color)){el.style.borderColor=el.dataset.color;el.style.color=el.dataset.color;}await Promise.all([...root.querySelectorAll('[data-image]')].map(async el=>{try{el.src=await assetUrl({path:el.dataset.image});el.removeAttribute('data-image');}catch{el.remove();}}));}
export async function downloadAsset(asset){const link=document.createElement('a');link.href=await assetUrl(asset);link.download=asset.name;link.click();}
addEventListener('pagehide',()=>{for(const value of urls.values())value.then(URL.revokeObjectURL);});
