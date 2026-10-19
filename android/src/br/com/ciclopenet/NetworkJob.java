package br.com.ciclopenet;

import android.app.*;
import android.app.job.*;
import android.content.*;
import android.graphics.Color;
import java.net.*;
import java.io.*;
import java.time.Instant;
import org.json.*;

public final class NetworkJob extends JobService {
  private static final int JOB=2401;
  private static final String CHANNEL="coterie",API_KEY="AIzaSyB2ubFLINYTxYJ1clW3JCkZozm1sI9Ipzc";
  private static final String ROOT="https://firestore.googleapis.com/v1/projects/schrecknet-e40df/databases/(default)/documents/networks/principal";
  static void channel(Context c){NotificationChannel ch=new NotificationChannel(CHANNEL,"Mensagens e atualizações da rede",NotificationManager.IMPORTANCE_DEFAULT);ch.setDescription("Avisos periódicos do chat e dos arquivos da coterie.");c.getSystemService(NotificationManager.class).createNotificationChannel(ch);}
  static void schedule(Context c){
    SharedPreferences p=c.getSharedPreferences("network",0);JobScheduler scheduler=c.getSystemService(JobScheduler.class);
    if(!p.getBoolean("enabled",true)||p.getString("uid","").isEmpty())return;
    if(scheduler.getPendingJob(JOB)!=null)return;
    scheduler.schedule(new JobInfo.Builder(JOB,new ComponentName(c,NetworkJob.class)).setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY).setPeriodic(15*60*1000L).setPersisted(true).build());
  }
  static void cancel(Context c){c.getSystemService(JobScheduler.class).cancel(JOB);}
  static void notify(Context c,String title,String text,String route,int id){
    if(!c.getSystemService(NotificationManager.class).areNotificationsEnabled())return;
    Intent open=new Intent(c,MainActivity.class).putExtra("route",route).addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP);
    PendingIntent pending=PendingIntent.getActivity(c,id,open,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
    c.getSystemService(NotificationManager.class).notify(id,new Notification.Builder(c,CHANNEL).setSmallIcon(R.drawable.notification).setColor(Color.rgb(205,65,73)).setContentTitle(title).setContentText(text).setContentIntent(pending).setAutoCancel(true).setVisibility(Notification.VISIBILITY_PRIVATE).build());
  }
  @Override public boolean onStartJob(JobParameters params){
    if(MainActivity.foreground)return false;
    new Thread(()->{try{check();}catch(Exception ignored){/* Retry at the next scheduled interval; never log session tokens. */}finally{jobFinished(params,false);}},"ciclope-notifications").start();return true;
  }
  @Override public boolean onStopJob(JobParameters params){return false;}
  private void check()throws Exception{
    SharedPreferences p=getSharedPreferences("network",0);
    String uid=p.getString("uid",""),refresh=p.getString("refreshToken","");
    if(!p.getBoolean("enabled",true)||refresh.isEmpty()||!getSystemService(NotificationManager.class).areNotificationsEnabled())return;
    JSONObject token=new JSONObject(request("https://securetoken.googleapis.com/v1/token?key="+API_KEY,"POST","application/x-www-form-urlencoded","grant_type=refresh_token&refresh_token="+URLEncoder.encode(refresh,"UTF-8"),""));
    if(!uid.equals(token.optString("user_id")))return;
    String idToken=token.getString("id_token");
    for(String collection:new String[]{"messages","activity"}){
      JSONObject query=new JSONObject().put("structuredQuery",new JSONObject().put("from",new JSONArray().put(new JSONObject().put("collectionId",collection))).put("orderBy",new JSONArray().put(new JSONObject().put("field",new JSONObject().put("fieldPath","createdAt")).put("direction","DESCENDING"))).put("limit",10));
      JSONArray results=new JSONArray(request(ROOT+":runQuery","POST","application/json",query.toString(),idToken));
      long seen=p.getLong("seen_"+collection,System.currentTimeMillis()),newest=seen;boolean incoming=false;
      for(int i=0;i<results.length();i++){
        JSONObject document=results.getJSONObject(i).optJSONObject("document");if(document==null)continue;
        JSONObject f=document.getJSONObject("fields");JSONObject timestamp=f.optJSONObject("createdAt");if(timestamp==null)continue;
        long when=Instant.parse(timestamp.getString("timestampValue")).toEpochMilli();newest=Math.max(newest,when);
        JSONObject author=f.optJSONObject("uid");if(when>seen&&author!=null&&!uid.equals(author.optString("stringValue")))incoming=true;
      }
      if(!uid.equals(p.getString("uid",""))||!p.getBoolean("enabled",true))return;
      if(incoming&&!MainActivity.foreground)notify(this,"CICLOPE NET",collection.equals("messages")?"Há novas mensagens no canal da coterie.":"Os arquivos da coterie foram atualizados.",collection.equals("messages")?"chat":"",collection.equals("messages")?1:2);
      p.edit().putLong("seen_"+collection,Math.max(newest,p.getLong("seen_"+collection,0))).apply();
    }
  }
  private static String request(String address,String method,String contentType,String body,String token)throws Exception{
    HttpURLConnection connection=(HttpURLConnection)new URL(address).openConnection();
    try{
      connection.setConnectTimeout(15000);connection.setReadTimeout(20000);connection.setRequestMethod(method);connection.setRequestProperty("Content-Type",contentType);
      if(!token.isEmpty())connection.setRequestProperty("Authorization","Bearer "+token);
      connection.setDoOutput(true);try(OutputStream out=connection.getOutputStream()){out.write(body.getBytes("UTF-8"));}
      int code=connection.getResponseCode();if(code<200||code>=300)throw new IOException("Request denied: "+code);
      try(InputStream in=connection.getInputStream();ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] buffer=new byte[4096];int n;while((n=in.read(buffer))!=-1)out.write(buffer,0,n);return out.toString("UTF-8");}
    }finally{connection.disconnect();}
  }
}
