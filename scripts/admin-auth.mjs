import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
export function cliCredential(){
  const auth=require('firebase-tools/lib/auth');
  return {async getAccessToken(){const account=auth.getGlobalDefaultAccount();if(!account)throw new Error('Execute firebase login.');const token=await auth.getAccessToken(account.tokens.refresh_token,['email','openid','https://www.googleapis.com/auth/cloudplatformprojects.readonly','https://www.googleapis.com/auth/firebase','https://www.googleapis.com/auth/cloud-platform']);return {access_token:token.access_token,expires_in:3600};}};
}
