import {cliCredential} from './admin-auth.mjs';
const credential=cliCredential();
export const project='schrecknet-e40df';
export const documents=`https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents`;
export async function adminRequest(url,method='GET',body){
  const token=await credential.getAccessToken(),response=await fetch(url,{method,headers:{Authorization:`Bearer ${token.access_token}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
  const raw=await response.text(),result=raw?JSON.parse(raw):{};
  if(!response.ok){const e=new Error(`${response.status}: ${result.error?.message||response.statusText}`);e.status=response.status;throw e;}
  return result;
}
export function value(data){if(data===null)return {nullValue:null};if(data instanceof Date)return {timestampValue:data.toISOString()};if(typeof data==='string')return {stringValue:data};if(typeof data==='boolean')return {booleanValue:data};if(typeof data==='number')return Number.isInteger(data)?{integerValue:String(data)}:{doubleValue:data};if(Array.isArray(data))return {arrayValue:{values:data.map(value)}};return {mapValue:{fields:fields(data)}};}
export const fields=data=>Object.fromEntries(Object.entries(data).map(([k,v])=>[k,value(v)]));
export function decode(v){if('nullValue'in v)return null;if('stringValue'in v)return v.stringValue;if('booleanValue'in v)return v.booleanValue;if('integerValue'in v)return Number(v.integerValue);if('doubleValue'in v)return v.doubleValue;if('timestampValue'in v)return Date.parse(v.timestampValue);if('bytesValue'in v)return Buffer.from(v.bytesValue,'base64');if('arrayValue'in v)return (v.arrayValue.values||[]).map(decode);return Object.fromEntries(Object.entries(v.mapValue?.fields||{}).map(([k,val])=>[k,decode(val)]));}
export const decodeDocument=doc=>doc?{id:doc.name.split('/').at(-1),...Object.fromEntries(Object.entries(doc.fields||{}).map(([k,v])=>[k,decode(v)]))}:null;
export async function getAdminDocument(path){try{return decodeDocument(await adminRequest(`${documents}/${path}`));}catch(e){if(e.status===404)return null;throw e;}}
export async function adminCommit(writes){return adminRequest(`${documents}:commit`,'POST',{writes});}
export const createWrite=(path,data)=>({update:{name:`projects/${project}/databases/(default)/documents/${path}`,fields:fields(data)},currentDocument:{exists:false}});
export const deleteWrite=path=>({delete:`projects/${project}/databases/(default)/documents/${path}`});
