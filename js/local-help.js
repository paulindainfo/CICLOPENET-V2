// Classic script so the file:// explanation can appear even when modules are blocked.
if(location.protocol==='file:'){
  const main=document.getElementById('main');
  if(main){main.className='boot';main.innerHTML='<img src="assets/sigil.svg" alt="" width="64" height="64"><p class="eyebrow">CICLOPE NET / ACESSO PELO NAVEGADOR</p><h1>Abra pelo endereço da rede.</h1><p class="muted">O navegador bloqueia os módulos ao abrir o HTML por duplo clique.</p><p><a class="button primary" href="https://paulindainfo.github.io/CICLOPENET-V2/">Abrir o CICLOPE NET publicado</a></p><p class="muted small">Para usar os arquivos locais, execute <code>npm start</code> na pasta do projeto<br>e abra o endereço HTTP apresentado no terminal.</p>';}
}
