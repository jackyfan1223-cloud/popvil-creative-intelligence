const allCases=window.CREATIVE_CASES||[];
// 硬规则：没有可播放媒体标识的案例，程序层面自动排除。
const cases=allCases.filter(x=>x.instagramCode||x.videoId);
const metaBrands=window.META_BRANDS||[];
const trends=window.TREND_INSIGHTS||[];
const $=s=>document.querySelector(s); const $$=s=>[...document.querySelectorAll(s)];

function viewsNum(v){if(!v)return 0;const s=String(v).toUpperCase().replace(/,/g,'');if(s.includes('M'))return parseFloat(s)*1e6;if(s.includes('K'))return parseFloat(s)*1e3;return parseFloat(s)||0}
function metaUrl(q){return `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&media_type=video&q=${encodeURIComponent(q)}&search_type=keyword_unordered`}
function officialPlayer(x){
  if(x.videoId) return `https://www.tiktok.com/player/v1/${x.videoId}?autoplay=0&loop=1&controls=1`;
  if(x.instagramCode) return `https://www.instagram.com/p/${x.instagramCode}/embed/captioned/`;
  return '';
}
function mirrorPlayer(x){return x.mirrorUrl||x.evidenceUrl||''}
function mountFrame(wrap,url,title){wrap.innerHTML=`<iframe src="${url}" allow="fullscreen; encrypted-media; autoplay; picture-in-picture" allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin" title="${title}"></iframe>`}
function makePlayer(x,wrap,status,switcher){
  const official=officialPlayer(x); const mirror=mirrorPlayer(x);
  mountFrame(wrap,official,`${x.brand} video`);
  status.innerHTML='<i class="dot green"></i><b>视频已嵌入。</b> 默认使用官方播放器；若你的网络拦截官方嵌入，可在下方切换备用镜像。';
  const buttons=[];
  buttons.push('<button class="player-btn active" data-mode="official">官方播放器</button>');
  if(mirror) buttons.push('<button class="player-btn" data-mode="mirror">备用镜像</button>');
  switcher.innerHTML=buttons.join('');
  switcher.querySelectorAll('.player-btn').forEach(btn=>btn.addEventListener('click',()=>{
    switcher.querySelectorAll('.player-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
    if(btn.dataset.mode==='official') mountFrame(wrap,official,`${x.brand} official video`);
    else mountFrame(wrap,mirror,`${x.brand} mirror video`);
  }));
}

function initFilters(){
  const brands=[...new Set(cases.map(x=>x.brand))].sort();
  $('#brandFilter').innerHTML+=brands.map(x=>`<option>${x}</option>`).join('');
  const tags=[...new Set(cases.flatMap(x=>x.tags||[]))].sort();
  $('#tagFilter').innerHTML+=tags.map(x=>`<option>${x}</option>`).join('');
  ['search','brandFilter','metricFilter','tagFilter','freshnessFilter','sortFilter'].forEach(id=>document.getElementById(id).addEventListener(id==='search'?'input':'change',render));
}
function renderKpis(){
  const todayNew=cases.filter(x=>x.todayNew).length; const brands=new Set(cases.map(x=>x.brand)).size;
  $('#kpis').innerHTML=`
    <div class="kpi"><b>${cases.length}</b><span>精选剪辑案例</span></div>
    <div class="kpi"><b>100%</b><span>主库案例带播放器</span></div>
    <div class="kpi"><b>${todayNew}</b><span>今日新增可播放案例</span></div>
    <div class="kpi"><b>${brands}</b><span>已进入主库品牌</span></div>`;
}
function render(){
  const q=$('#search').value.trim().toLowerCase(),brand=$('#brandFilter').value,metric=$('#metricFilter').value,tag=$('#tagFilter').value;
  const days=parseInt($('#freshnessFilter').value||'30',10); const cutoff=new Date('2026-09-28T23:59:59Z'); cutoff.setUTCDate(cutoff.getUTCDate()-days); let arr=cases.filter(x=>{const hay=[x.brand,x.title,x.hook,x.learn,x.editing,(x.tags||[]).join(' '),(x.metrics||[]).join(' ')].join(' ').toLowerCase(); const d=x.publishDate?new Date(x.publishDate+'T00:00:00Z'):null; const fresh=d && d>=cutoff; return fresh&&(!q||hay.includes(q))&&(!brand||x.brand===brand)&&(!metric||x.metrics.includes(metric))&&(!tag||(x.tags||[]).includes(tag))});
  if($('#sortFilter').value==='views')arr=[...arr].sort((a,b)=>viewsNum(b.views)-viewsNum(a.views)); if($('#sortFilter').value==='newest')arr=[...arr].sort((a,b)=>String(b.publishDate).localeCompare(String(a.publishDate)));
  const host=$('#cards');host.innerHTML=''; if(!arr.length){host.innerHTML='<div class="empty">没有匹配的可播放案例。</div>';return}
  const t=$('#cardTemplate');
  arr.forEach(x=>{
    const node=t.content.cloneNode(true);
    node.querySelector('.identity').textContent=`${x.brand} · ${x.sourceType} · ${x.platform}`;
    node.querySelector('.views').textContent=`${x.publishDate||'日期待核实'} · 公开播放 ${x.views||'未披露'}`;
    node.querySelector('.case-title').innerHTML=(x.todayNew?'<span class="new-badge">今日新增</span> ':'')+x.title;
    node.querySelector('.hook').textContent=x.hook; node.querySelector('.learn').textContent=x.learn; node.querySelector('.editing').textContent=x.editing; node.querySelector('.why').textContent=x.why;
    node.querySelector('.metric-row').innerHTML=x.metrics.map(m=>`<span class="metric">可能影响 ${m}</span>`).join('')+`<span class="metric confidence">证据强度：${x.confidence}</span>`;
    node.querySelector('.adapt ul').innerHTML=x.adapt.map(i=>`<li>${i}</li>`).join(''); node.querySelector('.testline span').textContent=x.test; node.querySelector('.source-note').textContent=`来源说明：${x.sourceNote}`;
    const origin=node.querySelector('.origin-btn');origin.href=x.originUrl;origin.textContent=x.platform==='Instagram'?'▶ 打开 Instagram 原帖':'▶ 打开 TikTok 原视频';
    const ev=node.querySelector('.evidence-btn');ev.href=x.evidenceUrl;ev.style.display=x.evidenceUrl?'block':'none'; node.querySelector('.meta-btn').href=metaUrl(x.brand);
    makePlayer(x,node.querySelector('.video-frame'),node.querySelector('.video-status'),node.querySelector('.player-switch'));
    host.appendChild(node);
  });
}
function renderMeta(){
  $('#metaGrid').innerHTML=metaBrands.map(x=>`<article class="meta-card"><h3>${x.brand}</h3><p>${x.note}</p><div class="meta-tags"><span class="meta-tag">美国</span><span class="meta-tag">Active Ads</span><span class="meta-tag">Video</span></div><a href="${metaUrl(x.q)}" target="_blank" rel="noopener">打开 Meta Ads Library 视频 ↗</a></article>`).join('');
}
function renderTrends(){ $('#trendGrid').innerHTML=trends.map(x=>`<div class="trend-card"><span class="signal">信号 ${x.signal}</span><h3>${x.name}</h3><dl><dt>案例</dt><dd>${x.examples}</dd><dt>可能影响</dt><dd>${x.metric}</dd><dt>下一步</dt><dd>${x.action}</dd></dl></div>`).join(''); }
$$('.nav').forEach(btn=>btn.addEventListener('click',()=>{$$('.nav').forEach(b=>b.classList.remove('active'));btn.classList.add('active');$$('.tab').forEach(t=>t.classList.remove('active-tab'));document.getElementById(btn.dataset.tab).classList.add('active-tab');window.scrollTo({top:0,behavior:'smooth'})}));
renderKpis();initFilters();renderMeta();renderTrends();render();
