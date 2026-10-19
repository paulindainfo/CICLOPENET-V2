// Android-only integration. No effect in normal browsers.
import {auth} from './firebase.js';
import {state} from './state.js';
if(globalThis.CiclopeAndroid && !globalThis.ciclopeAndroidReady){
  globalThis.ciclopeAndroidReady=true;
  let previous='';
  const sync=()=>{
    const user=auth.currentUser;
    if(!state.ready||!user?.refreshToken)return;
    const key=user.uid+user.refreshToken;
    if(key!==previous){globalThis.CiclopeAndroid.syncSession(user.refreshToken,user.uid);previous=key;}
  };
  setInterval(sync,5000);sync();
  // Save attachments and exported backups through Android's native file picker.
  const click=HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click=function(){
    if(this.download&&this.href.startsWith('blob:')){
      const name=this.download;
      fetch(this.href).then(r=>r.blob()).then(blob=>{
        if(blob.size>16*1024*1024)throw new Error('Arquivo grande demais para salvar pelo aplicativo. Use o site.');
        const reader=new FileReader();reader.onload=()=>globalThis.CiclopeAndroid.saveFile(name,blob.type||'application/octet-stream',String(reader.result).split(',')[1]);reader.readAsDataURL(blob);
      }).catch(error=>alert(error.message));
      return;
    }
    return click.call(this);
  };
}
