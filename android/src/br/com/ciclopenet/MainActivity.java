package br.com.ciclopenet;

import android.Manifest;
import android.app.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.*;
import android.webkit.*;
import android.widget.*;
import android.view.*;
import android.util.Base64;
import java.io.OutputStream;

public final class MainActivity extends Activity {
  static final String SITE="https://paulindainfo.github.io/CICLOPENET-V2/";
  static volatile boolean foreground=false;
  private WebView web;
  private ValueCallback<Uri[]> chooser;
  private byte[] pendingFile;
  private android.content.SharedPreferences prefs;

  static boolean trusted(String url){
    if(url==null)return false;
    Uri uri=Uri.parse(url);
    return "https".equals(uri.getScheme()) && "paulindainfo.github.io".equals(uri.getHost()) && uri.getPath()!=null && uri.getPath().startsWith("/CICLOPENET-V2/");
  }
  @Override public void onCreate(Bundle saved){
    super.onCreate(saved);prefs=getSharedPreferences("network",MODE_PRIVATE);NetworkJob.channel(this);
    getWindow().setStatusBarColor(Color.rgb(17,17,18));getWindow().setNavigationBarColor(Color.rgb(17,17,18));
    LinearLayout root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setFitsSystemWindows(true);root.setBackgroundColor(Color.rgb(17,17,18));
    LinearLayout bar=new LinearLayout(this);bar.setGravity(Gravity.CENTER_VERTICAL);bar.setPadding(dp(12),0,dp(4),0);
    TextView title=new TextView(this);title.setText("CICLOPE NET");title.setTextColor(Color.rgb(205,65,73));title.setTextSize(14);bar.addView(title,new LinearLayout.LayoutParams(0,dp(44),1));title.setGravity(Gravity.CENTER_VERTICAL);
    Button bell=new Button(this);bell.setText("Avisos");bell.setContentDescription("Configurar notificações");bell.setOnClickListener(v->notifications());bar.addView(bell);
    Button reload=new Button(this);reload.setText("↻");reload.setContentDescription("Atualizar a rede");reload.setOnClickListener(v->web.reload());bar.addView(reload,new LinearLayout.LayoutParams(dp(52),dp(44)));
    root.addView(bar);web=new WebView(this);root.addView(web,new LinearLayout.LayoutParams(-1,0,1));setContentView(root);
    WebSettings settings=web.getSettings();settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);settings.setAllowFileAccess(false);settings.setAllowContentAccess(true);settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);settings.setSupportMultipleWindows(false);
    CookieManager.getInstance().setAcceptThirdPartyCookies(web,false);
    web.addJavascriptInterface(new Bridge(),"CiclopeAndroid");
    web.setWebViewClient(new WebViewClient(){
      @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){
        String url=request.getUrl().toString();if(trusted(url))return false;
        if(request.isForMainFrame() && (url.startsWith("https://")||url.startsWith("http://")))external(url);return true;
      }
      @Override public void onPageFinished(WebView view,String url){
        if(!trusted(url))return;
        // The public module contains no credentials. Only the installed app exposes this interface.
        view.evaluateJavascript("import('"+SITE+"js/android.js').catch(()=>{})",null);
      }
      @Override public void onReceivedError(WebView view,WebResourceRequest request,WebResourceError error){
        if(request.isForMainFrame())Toast.makeText(MainActivity.this,"Sem conexão. Confira a internet e toque em atualizar.",Toast.LENGTH_LONG).show();
      }
    });
    web.setWebChromeClient(new WebChromeClient(){
      @Override public boolean onShowFileChooser(WebView view,ValueCallback<Uri[]> callback,FileChooserParams params){
        if(chooser!=null)chooser.onReceiveValue(null);chooser=callback;
        try{startActivityForResult(params.createIntent(),10);return true;}catch(Exception e){chooser=null;return false;}
      }
      @Override public boolean onJsConfirm(WebView view,String url,String message,JsResult result){
        new AlertDialog.Builder(MainActivity.this).setMessage(message).setPositiveButton("Confirmar",(d,w)->result.confirm()).setNegativeButton("Cancelar",(d,w)->result.cancel()).setOnCancelListener(d->result.cancel()).show();return true;
      }
      @Override public boolean onJsAlert(WebView view,String url,String message,JsResult result){
        new AlertDialog.Builder(MainActivity.this).setMessage(message).setPositiveButton("OK",(d,w)->result.confirm()).setOnCancelListener(d->result.confirm()).show();return true;
      }
    });
    web.setDownloadListener((url,agent,disposition,mime,length)->{if(url.startsWith("https://"))external(url);});
    web.loadUrl(SITE+route(getIntent()));
  }
  private int dp(int n){return Math.round(n*getResources().getDisplayMetrics().density);}
  private static String route(Intent intent){return "chat".equals(intent.getStringExtra("route"))?"#/chat":"";}
  private void external(String url){try{startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse(url)));}catch(Exception e){Toast.makeText(this,"Não foi possível abrir o link.",Toast.LENGTH_SHORT).show();}}
  @Override protected void onNewIntent(Intent intent){super.onNewIntent(intent);setIntent(intent);web.loadUrl(SITE+route(intent));}
  @Override protected void onResume(){super.onResume();foreground=true;if(web!=null)web.onResume();}
  @Override protected void onPause(){foreground=false;if(web!=null)web.onPause();super.onPause();}
  @Override public void onBackPressed(){if(web.canGoBack())web.goBack();else super.onBackPressed();}
  private void notifications(){
    new AlertDialog.Builder(this).setTitle("Avisos da rede").setMessage("Receba avisos de mensagens e atualizações após autorizar este aplicativo com seu convite. A verificação ocorre a cada 15 minutos ou mais, conforme a bateria e o Android. Os avisos não são instantâneos.\n\nStatus: "+(prefs.getBoolean("enabled",true)&&getSystemService(NotificationManager.class).areNotificationsEnabled()?"ativados":"desativados"))
      .setPositiveButton("Ativar",(d,w)->enableNotifications())
      .setNeutralButton("Testar aviso",(d,w)->{if(getSystemService(NotificationManager.class).areNotificationsEnabled())NetworkJob.notify(this,"Avisos do CICLOPE NET","O aplicativo está pronto para exibir notificações.","",3);else enableNotifications();})
      .setNegativeButton("Desativar",(d,w)->{prefs.edit().putBoolean("enabled",false).apply();NetworkJob.cancel(this);}).show();
  }
  private void enableNotifications(){
    prefs.edit().putBoolean("enabled",true).apply();
    if(Build.VERSION.SDK_INT>=33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},20);
    else if(!getSystemService(NotificationManager.class).areNotificationsEnabled())startActivity(new Intent(android.provider.Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(android.provider.Settings.EXTRA_APP_PACKAGE,getPackageName()));
    NetworkJob.schedule(this);
  }
  public final class Bridge {
    @JavascriptInterface public void syncSession(String refreshToken,String uid){
      // Executed only by our HTTPS origin, which blocks frames and external navigations.
      if(refreshToken==null||refreshToken.length()<20||refreshToken.length()>8192||uid==null||!uid.matches("[A-Za-z0-9_-]{1,128}"))return;
      runOnUiThread(()->{
        if(!trusted(web.getUrl()))return;
        boolean changed=!uid.equals(prefs.getString("uid",""));
        SharedPreferences.Editor edit=prefs.edit().putString("refreshToken",refreshToken).putString("uid",uid);
        if(changed){long now=System.currentTimeMillis();edit.putLong("seen_messages",now).putLong("seen_activity",now);}
        edit.apply();
        if(!prefs.getBoolean("asked",false)){prefs.edit().putBoolean("asked",true).apply();enableNotifications();}
        NetworkJob.schedule(MainActivity.this);
      });
    }
    @JavascriptInterface public void saveFile(String name,String mime,String encoded){
      if(encoded==null||encoded.length()>24*1024*1024)return;
      runOnUiThread(()->{
        if(!trusted(web.getUrl()))return;
        if(pendingFile!=null){Toast.makeText(MainActivity.this,"Conclua o salvamento anterior.",Toast.LENGTH_SHORT).show();return;}
        try{
          pendingFile=Base64.decode(encoded,Base64.DEFAULT);
          Intent save=new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType(mime==null||!mime.matches("[a-zA-Z0-9.+-]+/[a-zA-Z0-9.+-]+")?"application/octet-stream":mime).putExtra(Intent.EXTRA_TITLE,name==null?"arquivo":name.replaceAll("[\\\\/:*?\"<>|]","_"));
          startActivityForResult(save,11);
        }catch(Exception e){pendingFile=null;Toast.makeText(MainActivity.this,"Não foi possível salvar o arquivo.",Toast.LENGTH_LONG).show();}
      });
    }
  }
  @Override protected void onActivityResult(int request,int result,Intent data){
    super.onActivityResult(request,result,data);
    if(request==10 && chooser!=null){chooser.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result,data));chooser=null;}
    if(request==11){
      final byte[] bytes=pendingFile;pendingFile=null;
      if(result==RESULT_OK&&data!=null&&data.getData()!=null&&bytes!=null){
        Uri uri=data.getData();new Thread(()->{try(OutputStream out=getContentResolver().openOutputStream(uri)){out.write(bytes);runOnUiThread(()->Toast.makeText(this,"Arquivo salvo.",Toast.LENGTH_SHORT).show());}catch(Exception e){runOnUiThread(()->Toast.makeText(this,"Falha ao salvar o arquivo.",Toast.LENGTH_LONG).show());}}).start();
      }
    }
  }
}
