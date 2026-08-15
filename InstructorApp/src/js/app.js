// ═══ App V3 ═══
let currentPage='dashboard',selectedMode=0,adaptiveMode='auto',adaptiveLevel=2,adaptiveHR=75;
let isVRFlipped = localStorage.getItem('isVRFlipped') === 'true';
let ecgData=[],eegData=[],currentLang='en',selectedWeapon='',traineeWeapons={},targetType='fixed',dashFilterLevel='all';
const LEVELS={1:{en:'STRESS RELIEF',dist:15,move:false,breath:true,scale:1.2,moveMode:'none',color:'var(--red)'},2:{en:'STANDARD',dist:50,move:false,breath:false,scale:1.0,moveMode:'none',color:'var(--green)'},3:{en:'ADVANCED',dist:50,move:true,breath:false,scale:0.85,moveMode:'burst',color:'var(--blue)'}};

// ═══ 统一心率管理器 ═══
const HeartRateManager = {
  source: 'simulated',
  currentHR: 75,
  polarConnected: false,
  simulationInterval: null,

  init() {
    this.startSimulation();
    console.log('[HeartRateManager] 初始化 - 使用模拟数据');
  },

  startSimulation() {
    if (this.simulationInterval) return;
    this.simulationInterval = setInterval(() => {
      if (!this.polarConnected) {
        const hr = Math.max(45, Math.min(130, Math.round(55 + Math.sin(Date.now() / 8000) * 30 + 20 + (Math.random() - 0.5) * 6)));
        this.updateHeartRate(hr, 'simulated');
      }
    }, 1000);
  },

  onPolarConnected() {
    this.polarConnected = true;
    this.source = 'polar';
    console.log('[HeartRateManager] ✅ 切换到 Polar P10 真实数据');
  },

  onPolarDisconnected() {
    this.polarConnected = false;
    this.source = 'simulated';
    console.log('[HeartRateManager] ⚠️ Polar 断开，切换到模拟数据');
  },

  updatePolarHR(hr) {
    if (!this.polarConnected) return;
    this.updateHeartRate(hr, 'polar');
  },

  updateHeartRate(hr, source) {
    this.currentHR = hr;
    this.source = source;
    adaptiveHR = hr;

    // 唯一的 Unity 数据出口
    if (window.api?.ble) {
      window.api.ble.notifyHeartRate(hr);
    }

    // 更新 UI
    const dashHR = document.getElementById('dashHR');
    if (dashHR) {
      dashHR.textContent = Math.round(hr);
      dashHR.style.color = hr > 100 ? 'var(--red)' : hr < 60 ? 'var(--blue)' : 'var(--green)';
    }

    const bleHR = document.getElementById('bleHR');
    if (bleHR) {
      bleHR.textContent = Math.round(hr);
      bleHR.style.color = hr > 100 ? 'var(--red)' : hr < 60 ? 'var(--blue)' : 'var(--green)';
    }

    const monHR = document.getElementById('monHR');
    if (monHR) {
      monHR.textContent = Math.round(hr);
      monHR.style.color = hr > 90 ? 'var(--red)' : hr < 60 ? 'var(--blue)' : 'var(--green)';
    }

    // 自适应难度
    if (adaptiveMode === 'auto') {
      const newLevel = hr > 90 ? 1 : hr < 60 ? 3 : 2;
      if (newLevel !== adaptiveLevel) {
        adaptiveLevel = newLevel;
        sendCmd();
      }
    }
  },

  getHeartRate() {
    return this.currentHR;
  }
};

// ═══ LOGIN ═══
// 自动登录 - 页面加载后立即执行
(function() {
  console.log('[Auto Login] 初始化...');

  function autoLogin() {
    console.log('[Auto Login] 3秒后自动进入系统...');
    setTimeout(() => {
      const loginPage = document.getElementById('loginPage');
      const connModePage = document.getElementById('connModePage');

      if (loginPage && connModePage) {
        console.log('[Auto Login] 执行跳转');
        loginPage.classList.add('hidden');
        connModePage.style.display = 'flex';
      } else {
        console.error('[Auto Login] 找不到页面元素');
      }
    }, 3000);
  }

  // 确保 DOM 加载完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoLogin);
  } else {
    autoLogin();
  }
})();

// ═══ CONNECTION MODE ═══
function selectConnMode(mode){
  console.log('[selectConnMode] Clicked! Mode:', mode);

  try {
    const connModePage = document.getElementById('connModePage');
    const modeSelectPage = document.getElementById('modeSelectPage');

    console.log('[selectConnMode] connModePage found:', !!connModePage);
    console.log('[selectConnMode] modeSelectPage found:', !!modeSelectPage);

    if (connModePage) {
      connModePage.style.display = 'none';
      console.log('[selectConnMode] Hidden connModePage');
    }

    if (modeSelectPage) {
      modeSelectPage.style.display = 'flex';
      console.log('[selectConnMode] Showed modeSelectPage');
    }

    // Set WebSocket mode (non-blocking)
    if (window.api && window.api.ws) {
      console.log('[selectConnMode] Setting ws mode...');
      window.api.ws.setMode(mode).then(() => {
        console.log('[selectConnMode] ws mode set successfully');
      }).catch(e => {
        console.warn('[selectConnMode] ws:set-mode error', e);
      });
    } else {
      console.warn('[selectConnMode] window.api.ws not available');
    }
  } catch (error) {
    console.error('[selectConnMode] Error:', error);
  }
}

// ═══ MODE ═══
function confirmMode(n){selectedMode=Math.max(1,Math.min(60,n));document.getElementById('modeSelectPage').style.display='none';document.getElementById('app').classList.add('active');navigate('dashboard');startTimers();initWSListeners();}
function confirmCustomMode(){const v=+document.getElementById('customModeInput').value;if(v>=1)confirmMode(v);}
function backToModeSelect(){document.getElementById('app').classList.remove('active');document.getElementById('modeSelectPage').style.display='flex';}

// ═══ NAV ═══
document.querySelectorAll('.nav-item').forEach(el=>{el.onclick=()=>navigate(el.dataset.page);});
function navigate(page){
  // Cleanup previous page
  if (currentPage === 'training') {
    cleanupTrainingPage();
  }

  currentPage=page;document.querySelectorAll('.nav-item').forEach(n=>n.classList.toggle('active',n.dataset.page===page));const c=document.getElementById('contentArea');if(!PAGES[page])return;c.innerHTML=`<div class="page active">${PAGES[page]()}</div>`;setLanguage(currentLang);const init={dashboard:initDashboard,tasks:initTasks,training:initTrainingPage,adaptive:initAdaptive,devices:updateDeviceUI,students:loadStudentTable,archives:loadArchives,settings:initSettings,report:initReportPage,results:loadResults};if(init[page])init[page]();}

// ═══ DASHBOARD ═══
function startTimers(){
  // 时钟更新
  setInterval(()=>{
    const el=document.getElementById('dashTime');
    if(el)el.textContent=new Date().toLocaleTimeString('zh-CN',{hour12:false});
  },1000);

  // ECG/EEG 数据更新
  setInterval(()=>{
    ecgData.push(adaptiveHR/80*Math.sin(Date.now()/200)+(Math.random()-0.5)*0.3+(Date.now()%600<30?-1.5:0));
    eegData.push(Math.sin(Date.now()/150)*0.5+(Math.random()-0.5)*0.4);
    if(ecgData.length>300)ecgData.shift();
    if(eegData.length>300)eegData.shift();
    drawCanvas('ecgCanvas',ecgData,'rgba(255,23,68,0.7)');
    drawCanvas('eegCanvas',eegData,'rgba(68,138,255,0.7)');
    updateBioReadings();
  },50);

  // ❌ 移除原有模拟心率代码，使用 HeartRateManager
  // 自适应 UI 更新
  setInterval(()=>{
    updateAdaptiveUI();
  },1000);

  // ✅ 初始化心率管理器
  HeartRateManager.init();
}
async function initDashboard(){const mb=document.getElementById('dashModeBadge');if(mb)mb.textContent=selectedMode<=1?'1人':selectedMode===6?'6人':selectedMode===30?'30人':`${selectedMode}人`;document.getElementById('dTotal').textContent=selectedMode;const all=await api.students.list();const reg=all.filter(s=>s.name).slice(0,selectedMode);document.getElementById('dOnline').textContent=reg.length;document.getElementById('dOffline').textContent=Math.max(0,selectedMode-reg.length);document.getElementById('dLevel').textContent=`L${adaptiveLevel}`;api.ws.status().then(s=>{const el=document.getElementById('dWs');if(el){el.textContent=s.clients>0?`${s.clients}`:'--';el.style.color=s.clients>0?'var(--green)':'var(--text-2)';}});renderDashIcons(reg);}
function renderDashIcons(list){const g=document.getElementById('dashIconGrid');if(!g)return;g.innerHTML=list.map((s,i)=>{const hr=s.lastTrainingHR||(55+Math.random()*60);const lv=hr>90?1:hr<60?3:2;const co=lv===1?'var(--red)':lv===3?'var(--blue)':'var(--green)';return`<div class="stu-icon" data-lv="${lv}" data-name="${(s.name||'').toLowerCase()}"><div class="si-dot ${Math.random()>0.3?'online':'offline'}"></div><div class="si-name">${s.name}</div><div class="si-hr" style="color:${co}">${Math.round(hr)}</div><div class="text-sm text-dim">BPM</div></div>`;}).join('');}
function filterDashIcons(){const q=(document.getElementById('dashFilter')?.value||'').toLowerCase();document.querySelectorAll('.stu-icon').forEach(el=>{const n=el.dataset.name||'';const show=n.includes(q)&&(dashFilterLevel==='all'||el.dataset.lv==dashFilterLevel);el.classList.toggle('filtered-out',!show);});}
function filterDashByLevel(lv){dashFilterLevel=lv;filterDashIcons();}
function addDashLog(msg){const el=document.getElementById('dashLog');if(!el)return;el.innerHTML+=`<div>[${new Date().toLocaleTimeString('zh-CN',{hour12:false})}] ${msg}</div>`;el.scrollTop=el.scrollHeight;}

// ═══ TASKS ═══
async function initTasks(){renderWeaponGrid();await renderWeaponTable();}
function renderWeaponGrid(){const g=document.getElementById('weaponGrid');if(!g)return;g.innerHTML=WEAPONS.map(w=>`<div class="weapon-card ${selectedWeapon===w.id?'selected':''}" onclick="selectWeapon('${w.id}')"><div style="font-size:24px">🔫</div><div class="wc-name">${w.id}</div><div class="wc-type">${w.type}</div></div>`).join('');}
function selectWeapon(id){selectedWeapon=id;renderWeaponGrid();api.ws.send({type:'WEAPON_SELECT',data:{weaponName:id,scope:'all'}});addDashLog(`🔫 已选择武器: ${id}`);}
async function renderWeaponTable(){const all=await api.students.list();const reg=all.filter(s=>s.name).slice(0,selectedMode);const tb=document.getElementById('weaponTable');if(!tb)return;tb.innerHTML=reg.map(s=>`<tr><td><input type="checkbox" class="wt-check" data-sid="${s.id}"></td><td class="fw-bold">${s.name}</td><td>${s.studentId||''}</td><td>${s.className||''}</td><td>${traineeWeapons[s.id]||'--'}</td><td><select class="form-input" style="padding:4px 8px;font-size:11px" onchange="assignSingleWeapon('${s.id}',this.value)"><option value="">--</option>${WEAPONS.map(w=>`<option value="${w.id}" ${traineeWeapons[s.id]===w.id?'selected':''}>${w.id}</option>`).join('')}</select></td></tr>`).join('');}
function selectAllTrainees(){document.querySelectorAll('.wt-check').forEach(c=>c.checked=true);}
async function assignSelectedWeapon(){if(!selectedWeapon)return;document.querySelectorAll('.wt-check:checked').forEach(c=>{traineeWeapons[c.dataset.sid]=selectedWeapon;});api.ws.send({type:'WEAPON_SELECT',data:{weaponName:selectedWeapon,scope:'selected'}});addDashLog(`🔫 ${selectedWeapon} → selected`);renderWeaponTable();}
async function batchAssignWeapon(){const w=document.getElementById('batchWeaponSel')?.value;if(!w)return;const all=await api.students.list();all.filter(s=>s.name).slice(0,selectedMode).forEach(s=>{traineeWeapons[s.id]=w;});api.ws.send({type:'WEAPON_SELECT',data:{weaponName:w,scope:'all'}});addDashLog(`🔫 ${w} → 全员`);renderWeaponTable();}
function assignSingleWeapon(sid,w){traineeWeapons[sid]=w;api.ws.send({type:'WEAPON_SELECT',data:{weaponName:w,studentId:sid,scope:'single'}});addDashLog(`🔫 ${w} → ${sid}`);}
function setTargetType(t){targetType=t;document.getElementById('tgtFixed')?.classList.toggle('btn-primary',t==='fixed');document.getElementById('tgtMoving')?.classList.toggle('btn-primary',t==='moving');document.getElementById('tgtFixed')?.classList.toggle('btn',t!=='fixed');document.getElementById('tgtMoving')?.classList.toggle('btn',t!=='moving');api.ws.send({type:'TARGET_TYPE',data:{mode:t}});addDashLog(`🎯 靶型→${t}`);}

// ═══ TRAINING PAGE ═══
let trainingUpdateInterval = null;
let trainingEcgData = [];
let trainingEcgInterval = null;

function togglePanel(panelId) {
  const panel = document.getElementById(panelId);
  if (!panel) return;
  panel.classList.toggle('collapsed');
}

function initTrainingPage() {
  // Initialize training page elements
  drawRealTarget(monCurrentStudent);
  updateLevelStats();
  updateTrainingStats();

  // Start continuous updates for training page (NO monStartSim - that's for old monitor panel)
  if (trainingUpdateInterval) clearInterval(trainingUpdateInterval);
  trainingUpdateInterval = setInterval(() => {
    updateTrainingStats();
  }, 1000);

  // Start ECG waveform updates
  if (trainingEcgInterval) clearInterval(trainingEcgInterval);
  trainingEcgInterval = setInterval(() => {
    trainingEcgData.push(adaptiveHR / 80 * Math.sin(Date.now() / 200) + (Math.random() - 0.5) * 0.3 + (Date.now() % 600 < 30 ? -1.5 : 0));
    if (trainingEcgData.length > 200) trainingEcgData.shift();
    drawTrainECG();
  }, 50);
}

function cleanupTrainingPage() {
  if (trainingUpdateInterval) {
    clearInterval(trainingUpdateInterval);
    trainingUpdateInterval = null;
  }
  if (trainingEcgInterval) {
    clearInterval(trainingEcgInterval);
    trainingEcgInterval = null;
  }
  trainingEcgData = [];
}

function drawTrainECG() {
  const c = document.getElementById('trainECG');
  if (!c) return;
  const ctx = c.getContext('2d');
  const r = c.getBoundingClientRect();
  c.width = r.width * 2;
  c.height = r.height * 2;
  ctx.scale(2, 2);
  const w = r.width, h = r.height;
  ctx.clearRect(0, 0, w, h);
  if (trainingEcgData.length < 2) return;
  ctx.beginPath();
  const sl = trainingEcgData.slice(-Math.floor(w));
  sl.forEach((v, i) => {
    const x = (i / sl.length) * w, y = h / 2 - v * 15;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.strokeStyle = 'rgba(0,229,255,0.6)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function updateTrainingStats() {
  const stu = monCurrentStudent || (cachedStudents.length > 0 ? cachedStudents[0] : null);

  // Update heart rate (use adaptiveHR directly - it's updated by HeartRateManager)
  const hrEl = document.getElementById('trainHR');
  if (hrEl) {
    const hr = adaptiveHR;
    hrEl.textContent = Math.round(hr);
    hrEl.className = `hr-big ${hr > 90 ? 'text-red' : hr < 60 ? 'text-blue' : 'text-green'}`;
  }

  // Update stress level
  if (stu) {
    evaluateStress(stu);
    // Update scoring
    updateScoreDisplay(stu);
  }
}

function addTrainLog(msg) {
  const el = document.getElementById('trainLog');
  if (!el) return;
  el.innerHTML += `<div>[${new Date().toLocaleTimeString('zh-CN', {hour12: false})}] ${msg}</div>`;
  el.scrollTop = el.scrollHeight;
}

// ═══ TRAINING ═══
let monEcgData=[],monInterval=null,monCurrentStudent=null,cachedStudents=[];
async function renderTraineeGrid(){const grid=document.getElementById('traineeGrid'),hint=document.getElementById('noStudentHint'),badge=document.getElementById('trainCountBadge'),mb=document.getElementById('trainModeBadge');if(!grid)return;const all=await api.students.list();cachedStudents=all.filter(s=>s.name).slice(0,selectedMode);if(mb)mb.textContent=selectedMode<=1?'1人':`${selectedMode}人`;if(badge)badge.textContent=`${cachedStudents.length}/${selectedMode}`;if(!cachedStudents.length){grid.innerHTML='';if(hint)hint.style.display='block';return;}if(hint)hint.style.display='none';let c=cachedStudents.length<=1?1:cachedStudents.length<=4?2:cachedStudents.length<=9?3:cachedStudents.length<=16?4:6;grid.style.cssText=`display:grid;grid-template-columns:repeat(${c},1fr);gap:12px;`;grid.innerHTML=cachedStudents.map((s,i)=>{const hr=s.lastTrainingHR||(55+Math.random()*60);const lv=hr>90?1:hr<60?3:2;const co=lv===1?'var(--red)':lv===3?'var(--blue)':'var(--green)';return`<div class="trainee-card${lv===1?' alert':lv===3?' warning':''}" style="cursor:pointer" onclick="openMonitor('${s.id}',${i})"><div class="flex-between"><span class="tc-name">${s.name}</span><span class="badge badge-${lv===1?'red':lv===3?'blue':'green'}">L${lv}</span></div><div class="tc-id text-sm text-dim">${s.studentId||s.id}</div><div class="flex-row mt-8"><span class="tc-hr" style="color:${co}">${Math.round(hr)}</span><span class="tc-hr-unit">BPM</span></div><canvas class="tc-ecg" width="200" height="30"></canvas></div>`;}).join('');grid.querySelectorAll('.tc-ecg').forEach(c=>{const ctx=c.getContext('2d'),w=c.width,h=c.height;ctx.beginPath();for(let x=0;x<w;x++){const y=h/2+Math.sin(x*0.15)*5+(Math.random()-0.5)*3+(x%30<3?-12:0);x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.strokeStyle='rgba(0,229,255,0.4)';ctx.stroke();});drawTarget();}
function drawTarget(){
  drawRealTarget(monCurrentStudent);
}

function drawRealTarget(stu) {
  const c = document.getElementById('targetCanvas');
  if (!c) return;
  const ctx = c.getContext('2d'), s = c.width, cx = s / 2, cy = s / 2;
  
  // Clear
  ctx.fillStyle = '#0a0e14';
  ctx.fillRect(0, 0, s, s);
  
  // Ring radii proportions — matching ShootingTarget.cs
  // ring10=0.024, ring9=0.056, ring8=0.112, ring7=0.200 (maxRadius)
  // Normalized: 10=12%, 9=28%, 8=56%, 7=100%
  const maxR = s * 0.43;  // max ring pixel radius
  const rings = [
    { ratio: 1.00, label: '7', color: 'rgba(0,180,220,0.08)', stroke: 'rgba(0,180,220,0.20)' },
    { ratio: 0.56, label: '8', color: 'rgba(0,180,220,0.10)', stroke: 'rgba(0,180,220,0.25)' },
    { ratio: 0.28, label: '9', color: 'rgba(0,180,220,0.12)', stroke: 'rgba(0,180,220,0.35)' },
    { ratio: 0.12, label: '10', color: 'rgba(180,30,30,0.15)', stroke: 'rgba(200,40,40,0.50)' },
  ];
  
  // Draw human silhouette outline (subtle)
  ctx.save();
  ctx.strokeStyle = 'rgba(0,180,220,0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  // Head
  ctx.arc(cx, cy - maxR * 0.72, maxR * 0.18, 0, Math.PI * 2);
  ctx.stroke();
  // Shoulders to torso
  ctx.beginPath();
  ctx.moveTo(cx - maxR * 0.50, cy - maxR * 0.45);
  ctx.lineTo(cx - maxR * 0.40, cy - maxR * 0.52);
  ctx.lineTo(cx - maxR * 0.15, cy - maxR * 0.55);
  ctx.lineTo(cx + maxR * 0.15, cy - maxR * 0.55);
  ctx.lineTo(cx + maxR * 0.40, cy - maxR * 0.52);
  ctx.lineTo(cx + maxR * 0.50, cy - maxR * 0.45);
  ctx.lineTo(cx + maxR * 0.45, cy + maxR * 0.85);
  ctx.lineTo(cx - maxR * 0.45, cy + maxR * 0.85);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
  
  // Draw concentric ring zones (outer to inner)
  for (const ring of rings) {
    const r = maxR * ring.ratio;
    
    // Filled zone
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = ring.color;
    ctx.fill();
    
    // Ring border
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = ring.stroke;
    ctx.lineWidth = ring.label === '10' ? 1.5 : 1;
    ctx.stroke();
    
    // Ring label
    ctx.fillStyle = ring.label === '10' ? 'rgba(200,60,60,0.6)' : 'rgba(0,180,220,0.35)';
    ctx.font = `bold ${ring.label === '10' ? 10 : 11}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    // Position labels on right side of ring
    const labelR = r - (ring.label === '10' ? 5 : 8);
    ctx.fillText(ring.label, cx + labelR * 0.7, cy + 4);
    // Also left side
    ctx.fillText(ring.label, cx - labelR * 0.7, cy + 4);
    // Top
    ctx.fillText(ring.label, cx, cy - labelR * 0.7 + 4);
    // Bottom
    ctx.fillText(ring.label, cx, cy + labelR * 0.7 + 4);
  }
  
  // Crosshairs (very subtle)
  ctx.fillStyle = 'rgba(0,180,220,0.04)';
  ctx.fillRect(cx - 0.5, 0, 1, s);
  ctx.fillRect(0, cy - 0.5, s, 1);
  
  // No hit data — show placeholder
  if (!stu || !stu.shootHits || stu.shootHits.length === 0) return;
  
  // Render bullet impacts
  stu.shootHits.forEach((h, idx) => {
    // Map normalized coordinates to canvas (ring7 = maxRadius = 1.0)
    const bulletX = cx + h.x * maxR;
    const bulletY = cy - h.y * maxR;
    
    // Color by ring score
    let dotColor, glowColor;
    if (h.score >= 10.0) {
      dotColor = 'rgba(200,60,60,0.90)';   // 10环 — 暗红
      glowColor = 'rgba(200,60,60,0.25)';
    } else if (h.score >= 9.0) {
      dotColor = 'rgba(0,200,130,0.85)';    // 9环 — 绿
      glowColor = 'rgba(0,200,130,0.20)';
    } else if (h.score >= 8.0) {
      dotColor = 'rgba(200,170,0,0.85)';    // 8环 — 黄
      glowColor = 'rgba(200,170,0,0.20)';
    } else if (h.score >= 7.0) {
      dotColor = 'rgba(0,160,200,0.80)';    // 7环 — 青
      glowColor = 'rgba(0,160,200,0.18)';
    } else {
      dotColor = 'rgba(100,100,100,0.60)';  // 脱靶 — 灰
      glowColor = 'rgba(100,100,100,0.12)';
    }
    
    // Glow ring
    ctx.beginPath();
    ctx.arc(bulletX, bulletY, 7, 0, Math.PI * 2);
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Bullet dot
    ctx.beginPath();
    ctx.arc(bulletX, bulletY, 4, 0, Math.PI * 2);
    ctx.fillStyle = dotColor;
    ctx.fill();
    
    // Score label
    ctx.fillStyle = 'rgba(220,225,230,0.65)';
    ctx.font = 'bold 8px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${idx + 1}:${h.score.toFixed(1)}`, bulletX + 7, bulletY + 3);
  });
}

function updateLevelStats() {
  const container = document.getElementById('levelStatsContainer');
  if (!container) return;

  const stu = monCurrentStudent || (cachedStudents.length > 0 ? cachedStudents[0] : null);
  if (!stu || !stu.levelStats) {
    container.innerHTML = '<div class="text-sm text-dim" style="padding:20px;text-align:center">暂无关卡统计数据</div>';
    return;
  }

  let html = '';
  const levels = Object.keys(stu.levelStats).sort();

  levels.forEach(levelId => {
    const stats = stu.levelStats[levelId];
    const accuracy = (stats.avgScore / 10.0) * 100;
    const ring10Count = stats.hits.filter(h => h.score >= 10.0).length;
    const ring9Count = stats.hits.filter(h => h.score >= 9.0 && h.score < 10.0).length;

    // Color based on level
    let levelColor = 'var(--green)';
    if (levelId === 'L1') levelColor = 'var(--red)';
    else if (levelId === 'L2') levelColor = 'var(--green)';
    else if (levelId === 'L3') levelColor = 'var(--blue)';

    html += `
      <div style="padding:16px;border:1px solid var(--border);border-radius:8px;background:rgba(0,229,255,0.02)">
        <div class="flex-between mb-8">
          <span class="fw-bold" style="font-size:16px;color:${levelColor};font-family:var(--font-display)">${levelId}</span>
          <span class="badge badge-blue">${stats.count}发</span>
        </div>
        <div class="text-sm mb-4">
          <div class="flex-between mb-2">
            <span class="text-dim">平均环数</span>
            <span class="fw-bold" style="color:var(--cyan)">${stats.avgScore.toFixed(1)}环</span>
          </div>
          <div class="flex-between mb-2">
            <span class="text-dim">精准度</span>
            <span class="fw-bold" style="color:var(--green)">${accuracy.toFixed(0)}%</span>
          </div>
          <div class="flex-between mb-2">
            <span class="text-dim">10环数</span>
            <span style="color:var(--red)">${ring10Count}发</span>
          </div>
          <div class="flex-between">
            <span class="text-dim">9环数</span>
            <span style="color:var(--orange)">${ring9Count}发</span>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function evaluateStress(stu) {
  if (!stu) return;

  const bpm = stu.currentBPM || adaptiveHR || 75;
  const hits = stu.shootHits || [];
  
  // Calculate average accuracy (0 to 100%) — only from real hits
  let accuracy = 0;
  if (hits.length > 0) {
    const totalScore = hits.reduce((sum, h) => sum + h.score, 0);
    const avgScore = totalScore / hits.length;
    accuracy = (avgScore / 10.0) * 100;
  }
  
  // Stress / Anxiety calculation models
  let heartStress = 0;
  if (bpm > 80) {
    heartStress = Math.min(100, (bpm - 80) * 1.6);
  }
  
  let accuracyStress = 0;
  if (accuracy < 90) {
    accuracyStress = Math.min(100, (90 - accuracy) * 1.5);
  }
  
  const stressIndex = Math.round(heartStress * 0.6 + accuracyStress * 0.4);
  
  // Map index to UI states
  let levelStr = "🟢 冷静";
  let descStr = "呼吸均匀 · 情绪冷静";
  let badgeClass = "badge-green";
  let barColor = "var(--green)";
  
  if (stressIndex > 85) {
    levelStr = "🔴 恐慌";
    descStr = "呼吸急促 · 据枪严重晃动";
    badgeClass = "badge-red";
    barColor = "var(--red)";
  } else if (stressIndex > 60) {
    levelStr = "🟠 压力";
    descStr = "心率过快 · 瞄准存在抖动";
    badgeClass = "badge-orange";
    barColor = "var(--red)";
  } else if (stressIndex > 30) {
    levelStr = "🟡 紧张";
    descStr = "肌肉微颤 · 节奏开始被打乱";
    badgeClass = "badge-blue";
    barColor = "var(--blue)";
  }
  
  // Update UI DOM elements (old monitor panel)
  const elLevel = document.getElementById('monStressLevel');
  const elVal = document.getElementById('monStressVal');
  const elDesc = document.getElementById('monStressDesc');
  const elBar = document.getElementById('monStressBar');

  if (elLevel) {
    elLevel.textContent = levelStr;
    elLevel.className = `badge ${badgeClass}`;
  }
  if (elVal) elVal.textContent = `${stressIndex}%`;
  if (elDesc) elDesc.textContent = descStr;
  if (elBar) {
    elBar.style.width = `${stressIndex}%`;
    elBar.style.backgroundColor = barColor;
  }

  // Update new training page elements
  const trainStressLevel = document.getElementById('trainStressLevel');
  const trainStressBar = document.getElementById('trainStressBar');

  if (trainStressLevel) {
    trainStressLevel.textContent = levelStr;
    trainStressLevel.className = `badge ${badgeClass}`;
  }
  if (trainStressBar) {
    trainStressBar.style.width = `${stressIndex}%`;
    trainStressBar.style.backgroundColor = barColor;
  }
  
  // Update Comprehensive Scoreboard below
  const elAcc = document.getElementById('scoreAcc');
  const elBR = document.getElementById('scoreBR');
  const elTotal = document.getElementById('scoreTotal');
  const elTime = document.getElementById('scoreTime');
  
  const breathingStability = Math.round(Math.max(100 - (bpm - 70) * 1.2 - (stressIndex * 0.2), 30));
  const totalScore = Math.round(accuracy * 0.6 + breathingStability * 0.4);
  
  if (elAcc) elAcc.textContent = hits.length > 0 ? `${Math.round(accuracy)}%` : '--';
  if (elBR) elBR.textContent = hits.length > 0 ? `${breathingStability}%` : '--';
  if (elTotal) elTotal.textContent = hits.length > 0 ? totalScore : '--';
  if (elTime) {
    // Use real elapsed time from training timer start
    const elapsed = stu.timerStarted ? Math.round((Date.now() - stu.timerStarted) / 1000) : 0;
    const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const secs = String(elapsed % 60).padStart(2, '0');
    elTime.textContent = `${mins}:${secs}`;
  }
}

async function saveTrainingScore(){
  const all=await api.students.list();
  const reg=all.filter(s=>s.name).slice(0,selectedMode);
  for(const s of reg) {
    const hits = s.shootHits || [];
    const avgScore = hits.length > 0 ? (hits.reduce((sum, h) => sum + h.score, 0) / hits.length) : (7.5 + Math.random() * 2);
    const accuracy = (avgScore / 10.0) * 100;
    const bpm = s.currentBPM || s.lastTrainingHR || 75;
    const breathStability = Math.round(Math.max(100 - (bpm - 70) * 1.2, 30));
    
    await api.training.save({
      studentId:s.id,
      avgHR:Math.round(bpm),
      level:adaptiveLevel,
      score:Math.round(accuracy * 0.6 + breathStability * 0.4),
      accuracy:Math.round(accuracy),
      breathStability:breathStability,
      duration:Math.round(hits.length * 4.5 + 120)
    });
  }
  addDashLog(`💾 ${reg.length}人评分归档`);
  alert(`已保存 ${reg.length} 人`);
}

// ═══ MONITOR PANEL ═══
let monIntervalsList = [];

function openMonitor(studentId,idx){
  monCurrentStudent=cachedStudents.find(s=>s.id===studentId)||cachedStudents[idx]||cachedStudents[0];
  if(!monCurrentStudent)return;
  const panel=document.getElementById('monitorPanel');panel.style.display='block';
  document.getElementById('monStudentName').textContent=`#${idx+1} ${monCurrentStudent.name}`;
  document.getElementById('monVRName').textContent=`#${idx+1} ${monCurrentStudent.name}`;
  const hr=monCurrentStudent.lastTrainingHR||adaptiveHR;
  document.getElementById('monHR').textContent=Math.round(hr);
  document.getElementById('monHR').style.color=hr>90?'var(--red)':hr<60?'var(--blue)':'var(--green)';
  // Render student list in left panel
  const sl=document.getElementById('monStudentList');
  sl.innerHTML=cachedStudents.map((s,i)=>{const h=s.lastTrainingHR||(55+Math.random()*60);const lv=h>90?1:h<60?3:2;const co=lv===1?'var(--red)':lv===3?'var(--blue)':'var(--green)';return`<div class="stu-list-card ${s.id===studentId?'active':''}" onclick="openMonitor('${s.id}',${i})"><span class="slc-name">#${i+1} ${s.name}</span><span class="slc-hr" style="color:${co}">${Math.round(h)}</span></div>`;}).join('');

  // Render real bullet hits of this student
  drawRealTarget(monCurrentStudent);
  evaluateStress(monCurrentStudent);
  updateLevelStats(); // 更新关卡统计

  // Scroll to panel
  panel.scrollIntoView({behavior:'smooth',block:'start'});
  monStartSim();
  monAddLog(`📡 打开 ${monCurrentStudent.name} 监控`);
  updateVRFlipButtonUI();
}

function closeMonitor(){
  document.getElementById('monitorPanel').style.display='none';
  monStopSim();
}

function monStartSim(){
  monStopSim();
  monEcgData=[];
  
  if (monCurrentStudent) {
    monCurrentStudent.shootHits = monCurrentStudent.shootHits || [];
    drawRealTarget(monCurrentStudent);
    evaluateStress(monCurrentStudent);
  }
  
  // Simulated heart rates
  const monInterval = setInterval(()=>{
    const hr = adaptiveHR;
    if (monCurrentStudent) {
      monCurrentStudent.currentBPM = hr;
    }
    document.getElementById('monHR').textContent = Math.round(hr);
    document.getElementById('monHR').style.color = hr > 90 ? 'var(--red)' : hr < 60 ? 'var(--blue)' : 'var(--green)';
    
    if (monCurrentStudent) {
      evaluateStress(monCurrentStudent);
    }
    
    const d = LEVELS[adaptiveLevel];
    monAddLog(`[AUTO] HR ${Math.round(hr)} → L${adaptiveLevel} ${d.en}`);
  }, 2000);
  
  // Simulated ECG waves
  const waveInt = setInterval(()=>{
    monEcgData.push(adaptiveHR/80*Math.sin(Date.now()/200)+(Math.random()-0.5)*0.3+(Date.now()%600<30?-1.5:0));
    if(monEcgData.length>200)monEcgData.shift();
    drawMonECG();
  }, 50);
  
  // NOTE: Simulated shooting DISABLED — only real hits from VR headset are shown.
  // Real hits arrive via WebSocket 'shoot_hit' messages from TelemetryBridge.
  // Uncomment below for offline testing without VR headset.
  /*
  const monSimShotTimer = setInterval(()=>{
    if (monCurrentStudent) {
      const isPanic = (monCurrentStudent.currentBPM || adaptiveHR) > 100;
      
      let score = 9.0 + Math.random() * 1.0;
      let x = (Math.random() - 0.5) * 0.15;
      let y = (Math.random() - 0.5) * 0.15;
      
      if (isPanic) {
        score = 6.0 + Math.random() * 3.0;
        x = (Math.random() - 0.5) * 0.45;
        y = (Math.random() - 0.5) * 0.45;
      }
      
      monCurrentStudent.shootHits = monCurrentStudent.shootHits || [];
      if (monCurrentStudent.shootHits.length >= 15) {
        monCurrentStudent.shootHits.shift();
      }
      monCurrentStudent.shootHits.push({ score, x, y });
      
      monAddLog(`🔫 击发完成: ${score.toFixed(1)}环 坐标:(${x.toFixed(2)}, ${y.toFixed(2)})`);
      
      drawRealTarget(monCurrentStudent);
      evaluateStress(monCurrentStudent);
    }
  }, 4500);
  */
  const monSimShotTimer = null; // No simulated shots
  
  monIntervalsList = [monInterval, waveInt, monSimShotTimer];
}

function monStopSim(){
  if (monIntervalsList && monIntervalsList.length > 0) {
    monIntervalsList.forEach(t => clearInterval(t));
    monIntervalsList = [];
  }
}
function drawMonECG(){const c=document.getElementById('monECG');if(!c)return;const ctx=c.getContext('2d');const r=c.getBoundingClientRect();c.width=r.width*2;c.height=r.height*2;ctx.scale(2,2);const w=r.width,h=r.height;ctx.clearRect(0,0,w,h);if(monEcgData.length<2)return;ctx.beginPath();const sl=monEcgData.slice(-Math.floor(w));sl.forEach((v,i)=>{const x=(i/sl.length)*w,y=h/2-v*15;i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);});ctx.strokeStyle='rgba(0,229,255,0.6)';ctx.lineWidth=1.5;ctx.stroke();}
function monAddLog(msg){const el=document.getElementById('monLog');if(!el)return;const t=new Date().toLocaleTimeString('zh-CN',{hour12:false});el.innerHTML+=`<div>[${t}] ${msg}</div>`;el.scrollTop=el.scrollHeight;if(el.children.length>50)el.removeChild(el.firstChild);}


function initAdaptive(){const sl=document.getElementById('adpSlider');if(sl){sl.value=adaptiveHR;sl.oninput=()=>{adaptiveHR=+sl.value;updateAdaptiveUI();};}updateAdaptiveUI();}
function updateAdaptiveUI(){const d=LEVELS[adaptiveLevel],el=id=>document.getElementById(id);if(!el('adpHR'))return;el('adpHR').textContent=Math.round(adaptiveHR);el('adpHR').style.color=adaptiveHR>90?'var(--red)':adaptiveHR<60?'var(--blue)':'var(--green)';el('adpLevelNum').textContent=adaptiveLevel;el('adpLevelNum').style.color=d.color;el('adpLevelName').textContent=`L${adaptiveLevel} — ${d.en}`;const sl=el('adpSlider');if(sl)sl.value=adaptiveHR;el('adpChips').innerHTML=`<span class="badge badge-cyan">${d.dist}m</span><span class="badge badge-${d.move?'yellow':'green'}">${d.move?'移动靶':'固定靶'}</span><span class="badge badge-cyan">靶面${d.scale}x</span><span class="badge badge-${d.breath?'green':'red'}">呼吸${d.breath?'ON':'OFF'}</span>`;el('adpJson').textContent=JSON.stringify(buildCmd(),null,2);}
function updateBioReadings(){const pe=document.getElementById('bioPosture');if(pe)pe.textContent=['稳定','微动','稳定','良好'][Math.floor(Date.now()/3000)%4];const pb=document.getElementById('postureBar');if(pb)pb.style.width=`${65+Math.sin(Date.now()/2000)*15}%`;const ee=document.getElementById('bioEEG');if(ee)ee.textContent=`α ${(10+Math.sin(Date.now()/4000)*3).toFixed(1)}Hz`;}
function buildCmd(){const d=LEVELS[adaptiveLevel];return{type:'DIFFICULTY_CMD',timestamp:Date.now(),data:{level:adaptiveLevel,targetDistance:d.dist,targetMoving:d.move,targetScale:d.scale,moveMode:d.moveMode,showBreathRing:d.breath,currentHR:Math.round(adaptiveHR),mode:adaptiveMode}};}
function sendCmd(){api.ws.send(buildCmd());addDashLog(`→ DIFFICULTY L${adaptiveLevel}`);}
function setAdaptiveMode(m){adaptiveMode=m;document.getElementById('adpAutoBtn')?.classList.toggle('btn-primary',m==='auto');document.getElementById('adpManualBtn')?.classList.toggle('btn-primary',m==='manual');if(m==='auto'){adaptiveLevel=adaptiveHR>90?1:adaptiveHR<60?3:2;sendCmd();}updateAdaptiveUI();}
function forceLevel(l){adaptiveMode='manual';adaptiveLevel=l;setAdaptiveMode('manual');sendCmd();api.ws.send(JSON.stringify({type:'LEVEL_SELECT',data:{level:l}}));addDashLog(`→ LEVEL_SELECT L${l}`);highlightActiveLevel(l);}
function highlightActiveLevel(l){
  [1,2,3].forEach(n=>{
    const btn=document.getElementById('lvlBtn'+n);
    if(btn){
      btn.classList.toggle('btn-primary',n===l);
      btn.classList.toggle('btn',n!==l);
      btn.style.boxShadow=n===l?'0 0 12px '+LEVELS[n].color:'none';
      btn.style.borderColor=n===l?LEVELS[n].color:'var(--border)';
    }
    const btnAdp=document.getElementById('lvlBtnAdp'+n);
    if(btnAdp){
      btnAdp.classList.toggle('btn-primary',n===l);
      btnAdp.classList.toggle('btn',n!==l);
      btnAdp.style.boxShadow=n===l?'0 0 12px '+LEVELS[n].color:'none';
      btnAdp.style.borderColor=n===l?LEVELS[n].color:'var(--border)';
    }
  });
}
function drawCanvas(id,data,color){const c=document.getElementById(id);if(!c)return;const ctx=c.getContext('2d');const r=c.getBoundingClientRect();c.width=r.width*2;c.height=160;ctx.scale(2,2);const w=r.width,h=80;ctx.clearRect(0,0,w,h);if(data.length<2)return;ctx.beginPath();data.slice(-Math.floor(w)).forEach((v,i,a)=>{const x=(i/a.length)*w,y=h/2-v*25;i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);});ctx.strokeStyle=color;ctx.lineWidth=1.5;ctx.stroke();}

// ═══ POLAR BLE DEVICES ═══
const HR_SERVICE = 0x180D;
const HR_MEASUREMENT = 0x2A37;
const BATTERY_SERVICE = 0x180F;
const BATTERY_LEVEL_CHAR = 0x2A19;

let polarDevice = null;
let polarServer = null;
let polarConnected = false;
let polarHR = 0;
let polarBattery = -1;
let polarDeviceName = '';
let bleEcgData = [];
let bleEcgInterval = null;

function parseHRMeasurement(dataView) {
  const flags = dataView.getUint8(0);
  const is16bit = (flags & 0x01) !== 0;
  const contactDetected = (flags & 0x04) !== 0;
  const hasRR = (flags & 0x10) !== 0;
  let offset = 1;
  let bpm;
  if (is16bit) { bpm = dataView.getUint16(offset, true); offset += 2; }
  else { bpm = dataView.getUint8(offset); offset += 1; }
  if (flags & 0x08) offset += 2; // energy expended
  const rrIntervals = [];
  if (hasRR) {
    while (offset + 1 < dataView.byteLength) {
      rrIntervals.push(Math.round((dataView.getUint16(offset, true) / 1024) * 1000));
      offset += 2;
    }
  }
  return { bpm, sensorContact: contactDetected, rrIntervals };
}

async function bleScanDevices() {
  const btn = document.getElementById('bleScanBtn');
  if (btn) { btn.disabled = true; btn.textContent = '🔍 扫描中...'; }
  bleLog('开始扫描 Polar Verity Sense...');

  if (!navigator.bluetooth) {
    bleLog('❌ 浏览器/环境不支持 Web Bluetooth');
    if (btn) { btn.disabled = false; btn.textContent = '🔍 扫描 Polar 设备'; }
    return;
  }

  try {
    // Clear previous devices
    if (window.api?.ble) await window.api.ble.clearDevices();

    const device = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: 'Polar' }],
      optionalServices: [HR_SERVICE, BATTERY_SERVICE]
    });

    polarDevice = device;
    bleLog(`✅ 发现设备: ${device.name || 'Unknown'}`);

    // Show in found devices list
    const listEl = document.getElementById('bleFoundDevices');
    if (listEl) {
      listEl.innerHTML = `
        <div class="flex-between" style="padding:8px 12px;border:1px solid var(--border);border-radius:4px;background:rgba(0,229,255,0.05)">
          <div class="flex-row gap-8">
            <span style="font-size:20px">❤️</span>
            <div>
              <div class="fw-bold">${device.name || 'Polar Device'}</div>
              <div class="text-sm text-dim">Polar Verity Sense · BLE Heart Rate</div>
            </div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="bleConnect()">连接</button>
        </div>`;
    }

    // Auto-connect
    await bleConnect();

  } catch (err) {
    const msg = err.message || '扫描失败';
    if (msg.includes('cancel')) {
      bleLog('⚠️ 用户取消扫描');
    } else {
      bleLog(`❌ 扫描错误: ${msg}`);
    }
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '🔍 扫描 Polar 设备'; }
  }
}

async function bleConnect(retryCount = 0) {
  if (!polarDevice) { bleLog('❌ 没有可连接的设备'); return; }

  const MAX_RETRIES = 3;
  bleLog(`连接 ${polarDevice.name}...${retryCount > 0 ? ` (重试 ${retryCount}/${MAX_RETRIES})` : ''}`);
  updateBLEStatus('connecting');

  try {
    polarServer = await polarDevice.gatt.connect();
    polarDeviceName = polarDevice.name || 'Polar Verity Sense';
    polarConnected = true;
    bleLog(`✅ GATT已连接: ${polarDeviceName}`);

    // Wait for connection to stabilize before service discovery
    await new Promise(r => setTimeout(r, 1000));

    // Check if still connected after delay
    if (!polarServer.connected) {
      throw new Error('GATT connection dropped during stabilization');
    }

    // Notify main process
    if (window.api?.ble) {
      window.api.ble.notifyConnected({ name: polarDeviceName });
    }

    // Subscribe to Heart Rate
    bleLog('正在发现服务...');
    const hrService = await polarServer.getPrimaryService(HR_SERVICE);
    const hrChar = await hrService.getCharacteristic(HR_MEASUREMENT);
    hrChar.addEventListener('characteristicvaluechanged', onHRData);
    await hrChar.startNotifications();
    bleLog('📡 心率数据订阅成功');

    // Read Battery
    try {
      const batService = await polarServer.getPrimaryService(BATTERY_SERVICE);
      const batChar = await batService.getCharacteristic(BATTERY_LEVEL_CHAR);
      const batVal = await batChar.readValue();
      polarBattery = batVal.getUint8(0);
      bleLog(`🔋 电量: ${polarBattery}%`);
      if (window.api?.ble) window.api.ble.notifyBattery(polarBattery);
    } catch (e) {
      bleLog('⚠️ 无法读取电量 (不影响心率)');
    }

    // Disconnect listener
    polarDevice.addEventListener('gattserverdisconnected', onBLEDisconnected);

    // Update UI
    updateBLEStatus('connected');
    startBLEEcg();

    // ✅ 通知心率管理器 Polar 已连接
    HeartRateManager.onPolarConnected();

    bleLog(`🎉 ${polarDeviceName} 连接完成！实时心率传输中...`);

  } catch (err) {
    bleLog(`❌ 连接错误: ${err.message}`);
    polarConnected = false;

    // Retry logic
    if (retryCount < MAX_RETRIES) {
      const delay = (retryCount + 1) * 2000;
      bleLog(`⏳ ${delay / 1000}秒后重试...`);
      await new Promise(r => setTimeout(r, delay));
      return bleConnect(retryCount + 1);
    }

    bleLog('❌ 多次重试失败。请确保 Polar 已开机且在范围内，然后重新扫描。');
    updateBLEStatus('disconnected');
  }
}

function onHRData(event) {
  const char = event.target;
  if (!char.value) return;
  const parsed = parseHRMeasurement(char.value);
  polarHR = parsed.bpm;

  // ✅ 使用统一管理器更新心率（唯一数据出口）
  HeartRateManager.updatePolarHR(parsed.bpm);

  // Push to ECG waveform
  bleEcgData.push(polarHR / 80 * Math.sin(Date.now() / 200) + (Math.random() - 0.5) * 0.3 + (Date.now() % 600 < 30 ? -1.5 : 0));
  if (bleEcgData.length > 200) bleEcgData.shift();

  // Update battery display
  if (polarBattery >= 0) {
    const batEl = document.getElementById('bleBattery');
    if (batEl) batEl.textContent = `${polarBattery}%`;
    const barEl = document.getElementById('bleBatBar');
    if (barEl) barEl.style.width = `${polarBattery}%`;
  }

  // ❌ 删除重复的更新代码（已由 HeartRateManager 统一处理）
  // if (window.api?.ble) window.api.ble.notifyHeartRate(polarHR);
  // adaptiveHR = polarHR;
  // UI 更新也已在 HeartRateManager 中处理
}

function onBLEDisconnected() {
  bleLog('⚠️ 设备断开连接');
  polarConnected = false;
  polarHR = 0;
  updateBLEStatus('disconnected');

  // ✅ 通知心率管理器 Polar 已断开
  HeartRateManager.onPolarDisconnected();

  if (window.api?.ble) window.api.ble.notifyDisconnected();
  stopBLEEcg();
}

function bleDisconnect() {
  if (polarServer && polarServer.connected) {
    polarServer.disconnect();
  }
  polarDevice = null;
  polarServer = null;
  polarConnected = false;
  polarHR = 0;
  polarBattery = -1;
  polarDeviceName = '';
  updateBLEStatus('disconnected');
  stopBLEEcg();
  bleLog('⏏ 已手动断开连接');

  // ✅ 通知心率管理器 Polar 已断开
  HeartRateManager.onPolarDisconnected();

  if (window.api?.ble) window.api.ble.notifyDisconnected();
}

function updateBLEStatus(status) {
  const banner = document.getElementById('bleStatusBanner');
  const icon = document.getElementById('bleStatusIcon');
  const text = document.getElementById('bleStatusText');
  const sub = document.getElementById('bleStatusSub');
  const scanBtn = document.getElementById('bleScanBtn');
  const discBtn = document.getElementById('bleDisconnBtn');
  const live = document.getElementById('bleLivePanel');
  const devName = document.getElementById('bleDevName');

  if (status === 'connected') {
    if (banner) banner.style.borderLeftColor = 'var(--green)';
    if (icon) icon.textContent = '💚';
    if (text) text.textContent = `已连接: ${polarDeviceName}`;
    if (sub) sub.textContent = '实时心率数据传输中';
    if (scanBtn) scanBtn.style.display = 'none';
    if (discBtn) discBtn.style.display = '';
    if (live) live.style.display = '';
    if (devName) devName.textContent = polarDeviceName;
  } else if (status === 'connecting') {
    if (banner) banner.style.borderLeftColor = 'var(--yellow)';
    if (icon) icon.textContent = '🔄';
    if (text) text.textContent = '正在连接...';
    if (sub) sub.textContent = '建立 BLE 连接中';
  } else {
    if (banner) banner.style.borderLeftColor = 'var(--red)';
    if (icon) icon.textContent = '📡';
    if (text) text.textContent = '未连接设备';
    if (sub) sub.textContent = '点击扫描按钮搜索附近 Polar 心率设备';
    if (scanBtn) scanBtn.style.display = '';
    if (discBtn) discBtn.style.display = 'none';
    if (live) live.style.display = 'none';
  }
}

function startBLEEcg() {
  stopBLEEcg();
  bleEcgInterval = setInterval(() => {
    const c = document.getElementById('bleECG');
    if (!c) return;
    const ctx = c.getContext('2d');
    const r = c.getBoundingClientRect();
    c.width = r.width * 2; c.height = r.height * 2;
    ctx.scale(2, 2);
    const w = r.width, h = r.height;
    ctx.clearRect(0, 0, w, h);
    if (bleEcgData.length < 2) return;
    ctx.beginPath();
    const sl = bleEcgData.slice(-Math.floor(w));
    sl.forEach((v, i) => {
      const x = (i / sl.length) * w, y = h / 2 - v * 15;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = 'rgba(255,23,68,0.7)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, 50);
}

function stopBLEEcg() {
  if (bleEcgInterval) { clearInterval(bleEcgInterval); bleEcgInterval = null; }
}

function bleLog(msg) {
  const el = document.getElementById('bleLog');
  if (!el) { console.log(`[BLE] ${msg}`); return; }
  const t = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  el.innerHTML += `<div>[${t}] ${msg}</div>`;
  el.scrollTop = el.scrollHeight;
  if (el.children.length > 100) el.removeChild(el.firstChild);
  addDashLog(`[BLE] ${msg}`);
}

// Legacy compat
function scanDevices() { bleScanDevices(); }
function updateDeviceUI() {
  // Check if already connected
  if (polarConnected) updateBLEStatus('connected');
}

// ═══ STUDENTS ═══
// Device assignments stored per student: { studentId: { hr: 'deviceName', eeg: '', tracking: '' } }
let deviceAssignments = {};

function buildDeviceSlot(studentId, slotType, currentVal) {
  const id = `dev_${slotType}_${studentId}`;
  let options = '<option value="">--</option>';
  
  if (slotType === 'hr') {
    // Show connected Polar device
    if (polarConnected && polarDeviceName) {
      const sel = currentVal === polarDeviceName ? 'selected' : '';
      options += `<option value="${polarDeviceName}" ${sel}>${polarDeviceName}</option>`;
    }
  } else if (slotType === 'eeg') {
    options += '<option value="NeuroSky MindWave">NeuroSky MindWave</option>';
    options += '<option value="Muse 2">Muse 2</option>';
  } else if (slotType === 'tracking') {
    options += '<option value="Pico Motion Tracker">Pico Motion Tracker</option>';
    options += '<option value="VIVE Tracker 3.0">VIVE Tracker 3.0</option>';
  }
  
  const color = slotType === 'hr' ? 'var(--red)' : slotType === 'eeg' ? 'var(--blue)' : 'var(--green)';
  const hasDev = currentVal ? `border-color:${color};background:rgba(0,229,255,0.05)` : '';
  return `<select class="form-input" id="${id}" style="padding:3px 4px;font-size:10px;width:100%;min-width:90px;${hasDev}" onchange="assignDevice('${studentId}','${slotType}',this.value)">${options}</select>`;
}

function assignDevice(studentId, slotType, deviceName) {
  if (!deviceAssignments[studentId]) deviceAssignments[studentId] = { hr: '', eeg: '', tracking: '' };
  deviceAssignments[studentId][slotType] = deviceName;
  addDashLog(`📎 Device assigned: ${slotType.toUpperCase()} → ${deviceName || 'none'} (${studentId})`);
}

async function loadStudentTable(){
  const list=await api.students.list();
  const tb=document.getElementById('stuTable'),ct=document.getElementById('stuCount');
  if(!tb)return;
  tb.innerHTML=list.map(s=>{
    const da = deviceAssignments[s.id] || { hr: '', eeg: '', tracking: '' };
    return `<tr>
      <td>${s.photo?`<img src="file://${s.photo.replace(/\\\\/g,'/')}" style="width:32px;height:32px;border-radius:50%;object-fit:cover">`:'👤'}</td>
      <td class="fw-bold">${s.name||''}</td>
      <td>${s.studentId||''}</td>
      <td>${s.age||''}</td>
      <td>${s.className||''}</td>
      <td>${s.group||''}</td>
      <td>${buildDeviceSlot(s.id, 'hr', da.hr)}</td>
      <td>${buildDeviceSlot(s.id, 'eeg', da.eeg)}</td>
      <td>${buildDeviceSlot(s.id, 'tracking', da.tracking)}</td>
      <td>${s.lastTrainingHR?Math.round(s.lastTrainingHR)+'BPM':'--'}</td>
      <td><button class="btn btn-sm" onclick="editStudent('${s.id}')">✏️</button> <button class="btn btn-sm" onclick="uploadPhoto('${s.id}')">📷</button> <button class="btn btn-sm btn-danger" onclick="deleteStudent('${s.id}')">🗑️</button></td>
    </tr>`;
  }).join('');
  if(ct)ct.textContent=`${list.length}`;
}
function showAddStudent(){document.getElementById('stuModalTitle').textContent=I18N[currentLang]?.add_student||'添加学员';document.getElementById('stuEditId').value='';['stuName','stuId','stuAge','stuClass','stuGroup','stuDevice','stuProfile'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});document.getElementById('stuModal').classList.add('active');}
function closeStuModal(){document.getElementById('stuModal').classList.remove('active');}
async function editStudent(id){const list=await api.students.list();const s=list.find(x=>x.id===id);if(!s)return;document.getElementById('stuEditId').value=s.id;document.getElementById('stuName').value=s.name||'';document.getElementById('stuId').value=s.studentId||'';document.getElementById('stuAge').value=s.age||'';document.getElementById('stuClass').value=s.className||'';document.getElementById('stuGroup').value=s.group||'';document.getElementById('stuDevice').value=s.sensorId||'';document.getElementById('stuProfile').value=s.profile||'';document.getElementById('stuModal').classList.add('active');}
async function saveStudent(){const d={name:document.getElementById('stuName').value,studentId:document.getElementById('stuId').value,age:document.getElementById('stuAge').value,className:document.getElementById('stuClass').value,group:document.getElementById('stuGroup').value,sensorId:document.getElementById('stuDevice').value,profile:document.getElementById('stuProfile').value};const eid=document.getElementById('stuEditId').value;if(eid){d.id=eid;await api.students.update(d);}else await api.students.add(d);closeStuModal();loadStudentTable();}
async function deleteStudent(id){await api.students.delete(id);loadStudentTable();}
async function uploadPhoto(id){const r=await api.students.setPhoto(id);if(r.success)loadStudentTable();}
async function exportStudents(){await api.data.downloadAll();}
async function importExcel(){const r=await api.data.importExcel();if(r.success)loadStudentTable();}
async function searchStudents(){const q=document.getElementById('stuSearch')?.value;const list=q?await api.students.search(q):await api.students.list();const tb=document.getElementById('stuTable');if(tb)tb.innerHTML=list.map(s=>`<tr><td>👤</td><td class="fw-bold">${s.name||''}</td><td>${s.studentId||''}</td><td>${s.age||''}</td><td>${s.className||''}</td><td>${s.group||''}</td><td>${s.sensorId||''}</td><td>--</td><td><button class="btn btn-sm" onclick="editStudent('${s.id}')">✏️</button></td></tr>`).join('');}

// ═══ ARCHIVES ═══
async function loadArchives(){const list=await api.students.list();const el=document.getElementById('archList');if(!el)return;el.innerHTML=list.filter(s=>s.name).map(s=>`<div class="card" style="cursor:pointer" onclick="showArchDetail('${s.id}')"><div class="flex-row gap-8"><div style="width:40px;height:40px;border-radius:50%;background:var(--bg-3);display:flex;align-items:center;justify-content:center">👤</div><div><div class="fw-bold">${s.name}</div><div class="text-sm text-dim">${s.studentId||''} · ${s.className||''}</div></div></div></div>`).join('');}
async function showArchDetail(id){const list=await api.students.list();const s=list.find(x=>x.id===id);if(!s)return;document.getElementById('archDetail').style.display='block';document.getElementById('archDetailTitle').textContent=`📋 ${s.name}`;document.getElementById('archInfo').innerHTML=`<div class="mb-8"><b>${s.name}</b></div><div class="mb-8 text-dim">${s.studentId||''}</div><div class="mb-8 text-dim">${s.className||''} ${s.group||''}</div>`;const h=document.getElementById('archHistory');const r=s.trainingRecords||[];h.innerHTML=r.length?r.map(x=>`<tr><td>${(x.timestamp||'').slice(0,10)}</td><td>${x.avgHR||'--'}</td><td>L${x.level||'?'}</td><td>${x.score||'--'}</td></tr>`).join(''):'<tr><td colspan="4" class="text-center text-dim">--</td></tr>';}
async function searchArchives(){const q=(document.getElementById('archSearch')?.value||'').toLowerCase();const list=await api.students.list();const f=list.filter(s=>s.name&&(s.name.toLowerCase().includes(q)||(s.studentId||'').includes(q)));document.getElementById('archList').innerHTML=f.map(s=>`<div class="card" style="cursor:pointer" onclick="showArchDetail('${s.id}')"><div class="flex-row gap-8"><div style="width:40px;height:40px;border-radius:50%;background:var(--bg-3);display:flex;align-items:center;justify-content:center">👤</div><div><div class="fw-bold">${s.name}</div><div class="text-sm text-dim">${s.studentId||''}</div></div></div></div>`).join('');}

// ═══ SETTINGS ═══
async function initSettings(){const s=await api.settings.get();const el=id=>document.getElementById(id);if(el('setPort'))el('setPort').value=s.wsPort||5180;if(el('setAutoConnect'))el('setAutoConnect').checked=s.unityAutoConnect!==false;if(el('setBright')){el('setBright').value=s.brightness||100;el('setBrightVal').textContent=s.brightness||100;}const dp=await api.system.dataPath();if(el('setDataPath'))el('setDataPath').textContent=dp;setLanguage(currentLang);}
async function saveSettingsUI(){await api.settings.set({wsPort:+document.getElementById('setPort').value,unityAutoConnect:document.getElementById('setAutoConnect').checked,brightness:+document.getElementById('setBright').value});}

// ═══ WS ═══
function initWSListeners(){
  api.ws.onMessage(async msg=>{
    if (msg.type !== 'VR_FRAME') {
      addDashLog(`← ${msg.type||'RAW'}`);
    }
    if(msg.type==='HR_UPDATE'&&msg.data) {
      const studentId = msg.data.studentId;
      const bpm = msg.data.bpm || msg.data.heartRate;

      const student = cachedStudents.find(s => s.id === studentId);
      if (student) {
        student.currentBPM = bpm;
        student.lastTrainingHR = bpm;
      }
      adaptiveHR = bpm;

      // Update old monitor panel (monHR)
      if (monCurrentStudent && (monCurrentStudent.id === studentId || !studentId)) {
        const hrEl = document.getElementById('monHR');
        if (hrEl) {
          hrEl.textContent = Math.round(bpm);
          hrEl.style.color = bpm > 90 ? 'var(--red)' : bpm < 60 ? 'var(--blue)' : 'var(--green)';
        }
        evaluateStress(monCurrentStudent);
      }

      // Update new training page (trainHR)
      const trainHrEl = document.getElementById('trainHR');
      if (trainHrEl) {
        trainHrEl.textContent = Math.round(bpm);
        trainHrEl.className = `hr-big ${bpm > 90 ? 'text-red' : bpm < 60 ? 'text-blue' : 'text-green'}`;
      }

      // Update stress level for training page
      if (currentPage === 'training') {
        updateTrainingStats();
      }
    } else if(msg.type==='SHOOT_SCORE'&&msg.data) {
      const studentId = msg.data.studentId;
      const score = msg.data.score;
      const x = msg.data.x;
      const y = msg.data.y;
      const bpm = msg.data.bpm || adaptiveHR;
      const targetId = msg.data.targetId || 'Target_1';
      const levelId = msg.data.levelId || 'L1';
      const targetName = msg.data.targetName || '默认靶';
      const timestamp = msg.data.timestamp || Date.now();

      // Find target student: by ID, or fallback to currently monitored student, or first student
      let student = studentId ? cachedStudents.find(s => s.id === studentId) : null;
      if (!student && monCurrentStudent) student = monCurrentStudent;
      if (!student && cachedStudents.length > 0) student = cachedStudents[0];

      if (student) {
        student.shootHits = student.shootHits || [];
        if (student.shootHits.length >= 30) {
          student.shootHits.shift();
        }
        student.shootHits.push({ score, x, y, targetId, levelId, targetName, timestamp });
        student.currentBPM = bpm;
        student.lastTrainingHR = bpm;

        // 按关卡统计
        student.levelStats = student.levelStats || {};
        if (!student.levelStats[levelId]) {
          student.levelStats[levelId] = {
            hits: [],
            totalScore: 0,
            avgScore: 0,
            count: 0
          };
        }
        student.levelStats[levelId].hits.push({ score, targetId, targetName, timestamp });
        student.levelStats[levelId].totalScore += score;
        student.levelStats[levelId].count++;
        student.levelStats[levelId].avgScore = student.levelStats[levelId].totalScore / student.levelStats[levelId].count;

        addDashLog(`🎯 学员 ${student.name} 击中 ${targetName} (${levelId}) ${score.toFixed(1)}环`);
        addTrainLog(`🎯 击中 ${targetName} (${levelId}) ${score.toFixed(1)}环`);

        // Always update monitor panel if it's showing this student
        if (monCurrentStudent && (monCurrentStudent.id === student.id)) {
          monAddLog(`🔫 击中 ${targetName} (${levelId}): ${score.toFixed(1)}环`);
          drawRealTarget(student);
          evaluateStress(student);
          updateLevelStats(); // 更新关卡统计
        }
      }
    } else if(msg.type==='TIMER_START'&&msg.data) {
      addDashLog(`⏱ 训练计时开始 (第${msg.data.round||1}轮, ${msg.data.shotsPerRound||10}发/轮)`);
      if (monCurrentStudent) {
        monCurrentStudent.shootHits = [];
        monCurrentStudent.timerStarted = Date.now();
        drawRealTarget(monCurrentStudent);
      }
    } else if(msg.type==='TIMER_STOP'&&msg.data) {
      addDashLog(`⏱ 训练计时结束 — ${msg.data.totalShots}发, 用时${Number(msg.data.elapsedTime).toFixed(1)}秒`);
      if (monCurrentStudent) {
        monCurrentStudent.timerStopped = Date.now();
        monAddLog(`⏱ 本轮结束: ${msg.data.totalShots}发 用时${Number(msg.data.elapsedTime).toFixed(1)}秒`);
      }
    } else if(msg.type==='TRAINING_CONFIRMED'&&msg.data) {
      addDashLog(`✅ 训练确认: ${msg.data.grade} 平均${msg.data.averageScore}环`);
      // Auto-save training record with detailed shot data
      try {
        const stu = monCurrentStudent || cachedStudents[0];
        if (stu) {
          await api.training.save({
            studentId: stu.id,
            avgHR: Math.round(stu.currentBPM || adaptiveHR || 75),
            level: adaptiveLevel,
            score: Math.round(Number(msg.data.averageScore) * 10),
            accuracy: Math.round(Number(msg.data.hitRate) * 100),
            breathStability: 80,
            duration: Math.round(Number(msg.data.elapsedTime)),
            totalRingScore: Number(msg.data.totalScore),
            averageRing: Number(msg.data.averageScore),
            grade: msg.data.grade,
            shotDetails: stu.shootHits || []
          });
          addDashLog(`💾 训练成绩已自动存档`);
        }
      } catch(e) {
        console.error('Auto save confirmed training failed', e);
      }
      showReportPage({
        traineeId: monCurrentStudent?.id || 'unknown',
        traineeName: monCurrentStudent?.name || '学员',
        timestamp: Date.now(),
        weapon: selectedWeapon || 'HK-416',
        subject: 'shooting_range',
        duration: Number(msg.data.elapsedTime),
        totalShots: Number(msg.data.totalShots),
        totalHits: Math.round(Number(msg.data.hitRate) * Number(msg.data.totalShots)),
        averageHR: monCurrentStudent?.currentBPM || adaptiveHR || 75,
        breathAlignedCount: 8,
        metrics: {
          accuracy: Number(msg.data.hitRate) * 100,
          breathing: 75,
          heartRate: 80,
          speed: Math.max(50, 100 - Number(msg.data.elapsedTime) * 0.5),
          tactical: Number(msg.data.averageScore) * 10
        }
      });
    } else if(msg.type==='TRAINING_COMPLETE'&&msg.data) {
      showReportPage(msg.data);
    } else if(msg.type==='LEVEL_CHANGED'&&msg.data) {
      const newLevel = msg.data.level || msg.data.newLevel;
      if(newLevel) {
        adaptiveLevel = newLevel;
        addDashLog(`🔄 难度已切换 → L${newLevel} ${LEVELS[newLevel]?.en||''}`);
        monAddLog(`🔄 LEVEL_CHANGED → L${newLevel}`);
        highlightActiveLevel(newLevel);
        updateAdaptiveUI();
        const dLv=document.getElementById('dLevel');
        if(dLv)dLv.textContent=`L${newLevel}`;
        const scoreLvBadge=document.getElementById('scoreLevelBadge');
        if(scoreLvBadge)scoreLvBadge.textContent=`L${newLevel}`;
      }
    } else if(msg.type==='TRAINING_REPORT'&&msg.data) {
      addDashLog(`📋 收到训练报告: ${msg.data.grade||'--'}级 总环数${msg.data.totalRingScore||0}`);
      monAddLog(`📋 TRAINING_REPORT → 评级: ${msg.data.grade||'--'}`);
      showTrainingReportModal(msg.data);
    } else if(msg.type==='TASK_COMPLETED'&&msg.data) {
      addDashLog(`✅ 训练任务完成!`);
      monAddLog(`✅ TASK_COMPLETED`);
      // Update monitor VR status to show completion
      const statusEl=document.getElementById('monVRStatus');
      if(statusEl){
        statusEl.textContent='✅ 训练完成';
        statusEl.className='badge badge-green';
      }
      // Highlight the student card as completed
      if(monCurrentStudent){
        const cards=document.querySelectorAll('.trainee-card');
        cards.forEach(card=>{
          const nameEl=card.querySelector('.tc-name');
          if(nameEl&&nameEl.textContent===monCurrentStudent.name){
            card.style.borderColor='var(--green)';
            card.style.boxShadow='0 0 15px rgba(0,200,83,0.3)';
            const badge=card.querySelector('.badge');
            if(badge){badge.textContent='✅ 完成';badge.className='badge badge-green';}
          }
        });
      }
    } else if(msg.type==='VR_FRAME'&&msg.data) {
      updateVRFeed(msg.data);
    }
  });
  api.ws.onClientConnected(d=>{
    addDashLog(`✅ Unity(${d.count})`);
    document.getElementById('sidebarWsDot')?.classList.add('on');
    const lb=document.getElementById('sidebarWsLabel');
    if(lb)lb.textContent=`${d.count}`;
    
    // Update monitor panel VR status to ONLINE
    const statusEl = document.getElementById('monVRStatus');
    if (statusEl) {
      statusEl.textContent = '● ONLINE';
      statusEl.className = 'badge badge-green';
    }
  });
  api.ws.onClientDisconnected(d=>{
    if(d.count===0){
      document.getElementById('sidebarWsDot')?.classList.remove('on');
      const lb = document.getElementById('sidebarWsLabel');
      if (lb) lb.textContent=I18N[currentLang]?.ws_waiting||'等待连接';

      // Update VR status to OFFLINE (support both old and new interface)
      const statusEl = document.getElementById('vrStatus') || document.getElementById('monVRStatus');
      if (statusEl) {
        statusEl.textContent = '● OFFLINE';
        statusEl.className = 'badge badge-red';
      }
      const fpsEl = document.getElementById('vrFPS') || document.getElementById('monVRFPS');
      if (fpsEl) fpsEl.textContent = '0FPS';

      const canvas = document.getElementById('vrCanvas') || document.getElementById('monVRCanvas');
      const placeholder = document.getElementById('vrPlaceholder') || document.getElementById('monVRPlaceholder');
      if (canvas) canvas.style.display = 'none';
      if (placeholder) placeholder.style.display = 'flex';
    }
  });
}

function updateVRFeed(data) {
  // Support both old (monVRCanvas) and new (vrCanvas) training interface
  const canvas = document.getElementById('vrCanvas') || document.getElementById('monVRCanvas');
  const placeholder = document.getElementById('vrPlaceholder') || document.getElementById('monVRPlaceholder');
  const statusEl = document.getElementById('vrStatus') || document.getElementById('monVRStatus');
  const fpsEl = document.getElementById('vrFPS') || document.getElementById('monVRFPS');

  if (statusEl && statusEl.textContent !== '● ONLINE') {
    statusEl.textContent = '● ONLINE';
    statusEl.className = 'badge badge-green';
  }
  if (fpsEl && data.fps) {
    fpsEl.textContent = `${data.fps}FPS`;
  }

  if (canvas && data.image) {
    if (placeholder && placeholder.style.display !== 'none') placeholder.style.display = 'none';
    if (canvas.style.display !== 'block') canvas.style.display = 'block';

    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'medium';

      if (isVRFlipped) {
        // Vertical flip (fix upside-down camera render feed on some platforms)
        ctx.save();
        ctx.translate(0, canvas.height);
        ctx.scale(1, -1);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.restore();
      } else {
        // Render normally (no flip)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
    };
    img.src = data.image;

  }
}

function toggleVRFlip() {
  isVRFlipped = !isVRFlipped;
  localStorage.setItem('isVRFlipped', isVRFlipped);
  addDashLog(`🔁 VR画面翻转状态: ${isVRFlipped ? '已开启(上下颠倒修正)' : '已关闭(正常渲染)'}`);
  updateVRFlipButtonUI();
}

function updateVRFlipButtonUI() {
  const btn = document.getElementById('btnFlipVR');
  if (btn) {
    btn.style.borderColor = isVRFlipped ? 'var(--cyan)' : 'rgba(0,229,255,0.3)';
    btn.style.background = isVRFlipped ? 'rgba(0,229,255,0.2)' : 'rgba(0,229,255,0.1)';
    btn.style.color = isVRFlipped ? '#ffffff' : 'var(--cyan)';
    btn.style.boxShadow = isVRFlipped ? '0 0 8px rgba(0,229,255,0.3)' : 'none';
  }
}

// ═══ REPORT & SIMULATION OVERRIDE ═══
let currentReportData = null;

function startTrainingSession() {
  // Resolve weapon from multiple sources:
  // 1. selectedWeapon (clicked in weapon card grid)
  // 2. First trainee's assigned weapon (per-student dropdown)
  // 3. Batch weapon selector dropdown
  // 4. Default fallback
  let weapon = selectedWeapon;
  if (!weapon) {
    // Try trainee assignments
    const assigned = Object.values(traineeWeapons).find(w => w && w.length > 0);
    if (assigned) weapon = assigned;
  }
  if (!weapon) {
    // Try batch dropdown
    const batchSel = document.getElementById('batchWeaponSel');
    if (batchSel && batchSel.value) weapon = batchSel.value;
  }
  if (!weapon) weapon = "HK-416";
  
  const count = selectedMode || 1;
  const cmd = {
    type: "TRAINING_START",
    timestamp: Date.now(),
    weapon: weapon,
    subject: "shooting_range",
    traineeCount: count
  };
  
  // 1. 发送 WebSocket 协议包给 Unity 端
  api.ws.send(cmd);
  addDashLog(`🚀 发送指令: TRAINING_START (武器: ${weapon}, 人数: ${count})`);
  
  // 2. 自动跳转到训练监视页面
  navigate('training');
  
  // 3. 延迟拉起首个学员的监控面板，进入实训控制
  setTimeout(() => {
    openMonitor(null, 0);
  }, 500);
}

function forceStopTraining(){
  // 1. 向 WebSocket 发送 Stop 命令
  api.ws.send({type:'TRAINING_STOP', timestamp:Date.now()});
  addDashLog("→ TRAINING_STOP");
  monAddLog("■ 手动结束实训");
  
  // 2. 提供本地仿真演示回退：如果在1秒内没有收到Unity真的发来TRAINING_COMPLETE（例如没有运行Unity端），则由前端直接计算并渲染虚拟成绩报告进行演示
  setTimeout(()=>{
    if (currentPage !== 'report') {
      const dummyData = {
        traineeId: monCurrentStudent ? monCurrentStudent.id : "2026010042",
        traineeName: monCurrentStudent ? monCurrentStudent.name : "张同学",
        timestamp: Date.now(),
        weapon: selectedWeapon || "HK-416",
        subject: "shooting_range",
        duration: 35.8,
        totalShots: 12,
        totalHits: 10,
        averageHR: 76.5,
        breathAlignedCount: 9,
        metrics: {
          accuracy: 83.3,
          breathing: 75.0,
          heartRate: 86.4,
          speed: 88.0,
          tactical: 80.0
        }
      };
      showReportPage(dummyData);
    }
  }, 1000);
}

// ═══ TRAINING REPORT MODAL ═══
function showTrainingReportModal(data) {
  let modal = document.getElementById('trainingReportModal');
  if (!modal) return;

  const totalRing = data.totalRingScore ?? data.totalScore ?? 0;
  const avgScore = data.averageScore ?? data.averageRing ?? 0;
  const hitRate = data.hitRate != null ? (Number(data.hitRate) * 100).toFixed(1) : (data.hitRatePercent ?? '--');
  const elapsed = data.elapsedTime ?? data.duration ?? 0;
  const grade = data.grade || '--';
  const level = data.level ?? adaptiveLevel ?? '--';

  // Grade color mapping
  const gradeColors = { S: 'var(--cyan)', A: 'var(--green)', B: 'var(--yellow)', C: 'var(--red)' };
  const gradeColor = gradeColors[grade] || 'var(--text-1)';

  document.getElementById('trm-totalRing').textContent = Number(totalRing).toFixed(1);
  document.getElementById('trm-avgScore').textContent = Number(avgScore).toFixed(1);
  document.getElementById('trm-hitRate').textContent = typeof hitRate === 'number' ? hitRate.toFixed(1) + '%' : hitRate + '%';
  document.getElementById('trm-elapsed').textContent = Number(elapsed).toFixed(1) + 's';
  document.getElementById('trm-grade').textContent = grade;
  document.getElementById('trm-grade').style.color = gradeColor;
  document.getElementById('trm-grade').style.textShadow = `0 0 20px ${gradeColor}`;
  document.getElementById('trm-level').textContent = `L${level} ${LEVELS[level]?.en || ''}`;

  modal.classList.add('active');
}

function closeTrainingReportModal() {
  const modal = document.getElementById('trainingReportModal');
  if (modal) modal.classList.remove('active');
}

async function showReportPage(data) {
  currentReportData = data;
  
  // 自动存入本地归档系统
  try {
    await api.training.save({
      studentId: data.traineeId,
      avgHR: Math.round(data.averageHR),
      level: data.metrics.accuracy > 80 ? 3 : (data.metrics.accuracy > 50 ? 2 : 1),
      score: Math.round(data.metrics.tactical),
      accuracy: Math.round(data.metrics.accuracy),
      breathStability: Math.round(data.metrics.breathing),
      duration: Math.round(data.duration)
    });
    addDashLog(`💾 学员 ${data.traineeName} 的实训数据已自动存档`);
  } catch(e) {
    console.error("Auto save record failed", e);
  }
  
  // 跳转到 report 页面
  navigate('report');
}

function initReportPage() {
  const data = currentReportData || {
    traineeId: "2026010042",
    traineeName: "张同学",
    timestamp: Date.now(),
    weapon: "HK-416",
    subject: "shooting_range",
    duration: 45.5,
    totalShots: 15,
    totalHits: 12,
    averageHR: 74.2,
    breathAlignedCount: 11,
    metrics: {
      accuracy: 80.0,
      breathing: 73.3,
      heartRate: 88.6,
      speed: 92.0,
      tactical: 82.5
    }
  };

  // 1. 填充 DOM
  const fill = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  fill("repName", data.traineeName);
  fill("repId", data.traineeId);
  fill("repSubject", data.subject === "shooting_range" ? "射击场自适应实训" : "户外实训");
  fill("repWeapon", data.weapon);
  fill("repDuration", data.duration.toFixed(1) + "s");
  fill("repTime", new Date(data.timestamp).toLocaleString("zh-CN", { hour12: false }));
  fill("repShots", data.totalShots);
  fill("repHits", data.totalHits);
  fill("repHR", data.averageHR.toFixed(1));
  fill("repAligned", data.breathAlignedCount);

  // 动态评语生成
  const evalEl = document.getElementById("repEvaluationText");
  if (evalEl) {
    let evalText = `学员【${data.traineeName}】在本次实训中表现良好。`;
    const m = data.metrics;
    if (m.accuracy >= 80 && m.breathing >= 75) {
      evalText += `该学员射击精准度极高（${m.accuracy.toFixed(1)}%），且完美掌握了呼吸对齐屏息击发的要领，在 Level 1 心率升高的紧张状态下，依然能将准星浮动降为0进行平稳射击。表现非常优秀，极具射击潜质。`;
    } else if (m.accuracy < 60) {
      evalText += `精准度较低（${m.accuracy.toFixed(1)}%），脱靶或偏出高环区次数偏多。在实训中，该学员对枪械的抖动控制和稳定性尚有欠缺，需继续加强静态据枪与击发无力矩训练。`;
    } else if (m.breathing < 65) {
      evalText += `精准度尚可，但在紧张状态下的呼吸平稳度与屏息控制（${m.breathing.toFixed(1)}%）偏弱。学员有明显的“抢发”现象，未能在呼吸引导环完全收缩对齐时实施击发，导致部分子弹在据枪晃动时打出，建议加强吸气/呼气/持枪节奏训练。`;
    } else {
      evalText += `整体素质均衡。精准度为 ${m.accuracy.toFixed(1)}%，平均心率为 ${data.averageHR.toFixed(1)} BPM。心率自调节能力及据枪稳定度联动正常，对中近距离及移动靶有不错的控制力，建议后续加强远距离复杂靶的射击实战演练。`;
    }
    evalEl.textContent = evalText;
  }

  // 2. 填充五维指标卡片
  const listEl = document.getElementById("repMetricsList");
  if (listEl) {
    const metricNames = {
      accuracy: { n: "射击精准度 (Accuracy)", c: "cyan" },
      breathing: { n: "呼吸控制度 (Breathing)", c: "magenta" },
      heartRate: { n: "心率调控力 (Biometrics)", c: "yellow" },
      speed: { n: "击发节奏力 (Tempo)", c: "green" },
      tactical: { n: "综合战术分 (Tactical)", c: "blue" }
    };
    listEl.innerHTML = Object.entries(data.metrics).map(([key, val]) => {
      const info = metricNames[key] || { n: key, c: "cyan" };
      return `
        <div class="metric-row">
          <div class="mr-info"><span>${info.n}</span><span class="mr-val font-mono">${val.toFixed(1)}</span></div>
          <div class="mr-bar"><div class="mr-bar-fill ${info.c}" style="width:${val}%"></div></div>
        </div>
      `;
    }).join("");
  }

  // 3. 绘制 Canvas 雷达图
  const canvas = document.getElementById("radarCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const s = canvas.width, cx = s / 2, cy = s / 2, R = 110;
  
  // 清除
  ctx.clearRect(0, 0, s, s);

  // 维度定义
  const axes = [
    { name: "精准度", key: "accuracy" },
    { name: "呼吸控制", key: "breathing" },
    { name: "心率调控", key: "heartRate" },
    { name: "击发节奏", key: "speed" },
    { name: "综合战术", key: "tactical" }
  ];
  const numAxes = axes.length;

  // A. 绘制 5 层正五边形背景刻度网
  ctx.strokeStyle = "rgba(0, 229, 255, 0.15)";
  ctx.lineWidth = 1;
  ctx.shadowBlur = 0; // 重置发光
  for (let level = 1; level <= 5; level++) {
    const r = (level / 5) * R;
    ctx.beginPath();
    for (let i = 0; i < numAxes; i++) {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI / numAxes);
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // B. 绘制五条轴线及文字标题
  axes.forEach((axis, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI / numAxes);
    
    // 轴线
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * R, cy + Math.sin(angle) * R);
    ctx.strokeStyle = "rgba(0, 229, 255, 0.15)";
    ctx.stroke();

    // 标签文字
    const val = data.metrics[axis.key];
    const labelX = cx + Math.cos(angle) * (R + 25);
    const labelY = cy + Math.sin(angle) * (R + 15);
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.font = "bold 11px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${axis.name} ${val.toFixed(0)}`, labelX, labelY);
  });

  // C. 绘制数据遮罩多边形（未来感发光霓虹）
  ctx.beginPath();
  axes.forEach((axis, i) => {
    const val = data.metrics[axis.key];
    const r = (Math.max(10, val) / 100) * R;
    const angle = -Math.PI / 2 + (i * 2 * Math.PI / numAxes);
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();

  // 数据填充渐变
  const fillGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, R);
  fillGrad.addColorStop(0, "rgba(186, 104, 200, 0.2)"); // 霓虹紫
  fillGrad.addColorStop(0.7, "rgba(0, 229, 255, 0.3)"); // 霓虹青
  fillGrad.addColorStop(1, "rgba(0, 229, 255, 0.45)");
  ctx.fillStyle = fillGrad;
  ctx.fill();

  // 霓虹发光描边
  ctx.shadowColor = "rgba(0, 229, 255, 0.9)";
  ctx.shadowBlur = 12;
  ctx.strokeStyle = "rgba(0, 229, 255, 0.95)";
  ctx.lineWidth = 3.5;
  ctx.stroke();

  // D. 绘制数据节点高亮圈
  axes.forEach((axis, i) => {
    const val = data.metrics[axis.key];
    const r = (Math.max(10, val) / 100) * R;
    const angle = -Math.PI / 2 + (i * 2 * Math.PI / numAxes);
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;

    ctx.beginPath();
    ctx.arc(x, y, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0, 229, 255, 1)";
    ctx.shadowBlur = 10;
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(x, y, 4.5, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0, 229, 255, 1)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
}

// ═══ RESULTS MODULE ═══
let resultsData = null;
let currentProject = null;

async function loadResults() {
  resultsData = await api.results.load();
  const sel = document.getElementById('resProjectSelect');
  if (!sel) return;
  sel.innerHTML = resultsData.projects.map((p, i) =>
    `<option value="${i}">${p.name} (${p.date || ''})</option>`
  ).join('');
  if (resultsData.projects.length > 0) loadResultsProject();
}

function loadResultsProject() {
  const sel = document.getElementById('resProjectSelect');
  if (!sel || !resultsData) return;
  const idx = parseInt(sel.value) || 0;
  currentProject = resultsData.projects[idx];
  if (!currentProject) return;
  const students = currentProject.students;
  const n = students.length;

  const el = (id) => document.getElementById(id);
  const set = (id, v) => { const e = el(id); if (e) e.textContent = v; };

  set('resTotalStudents', n);

  if (n === 0) {
    set('resAvgTotal', '0'); set('resPassRate', '0%'); set('resTopGrade', '--');
    set('resAvgSTAI', '--'); set('resAvgUEQ', '--'); set('resAvgSSQ', '--');
    set('resAvgAcc', '--%'); set('resAvgBreath', '--%'); set('resAvgPosture', '--%');
    const tb = document.getElementById('resStatsTable'); if (tb) tb.innerHTML = '<tr><td colspan="7" class="text-dim text-center">No students yet. Click "+ Add Score" or "Import Excel" to add data.</td></tr>';
    const tb2 = document.getElementById('resTranscriptTable'); if (tb2) tb2.innerHTML = '<tr><td colspan="13" class="text-dim text-center">No data</td></tr>';
    return;
  }

  const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const totals = students.map(s => s.total);
  const passed = students.filter(s => s.total >= 60).length;

  set('resAvgTotal', avg(totals).toFixed(1));
  set('resPassRate', Math.round(passed / n * 100) + '%');
  set('resTopGrade', students.reduce((best, s) => s.total > best.total ? s : best, students[0]).grade);
  set('resAvgSTAI', avg(students.map(s => s.written.stai)).toFixed(1));
  set('resAvgUEQ', avg(students.map(s => s.written.ueq)).toFixed(2));
  set('resAvgSSQ', avg(students.map(s => s.written.ssq)).toFixed(1));
  set('resAvgAcc', Math.round(avg(students.map(s => s.vr.accuracy))) + '%');
  set('resAvgBreath', Math.round(avg(students.map(s => s.vr.breathSync))) + '%');
  set('resAvgPosture', Math.round(avg(students.map(s => s.vr.posture))) + '%');

  renderResStatsTable(students);
  renderResDistChart(totals);
  renderResGradeChart(students);
  renderResTranscript(students);
}

function calcStats(arr) {
  const n = arr.length;
  const sorted = [...arr].sort((a, b) => a - b);
  const mean = arr.reduce((a, b) => a + b, 0) / n;
  const median = n % 2 === 0 ? (sorted[n/2-1]+sorted[n/2])/2 : sorted[Math.floor(n/2)];
  const stdDev = Math.sqrt(arr.reduce((sum, v) => sum + (v - mean) ** 2, 0) / n);
  return { mean, median, stdDev, min: sorted[0], max: sorted[n-1], range: sorted[n-1]-sorted[0] };
}

function renderResStatsTable(stu) {
  const tb = document.getElementById('resStatsTable'); if (!tb) return;
  const metrics = [
    {name:'Total Score',vals:stu.map(s=>s.total)},{name:'Written',vals:stu.map(s=>s.written.score)},
    {name:'VR Score',vals:stu.map(s=>s.vr.score)},{name:'STAI-S',vals:stu.map(s=>s.written.stai)},
    {name:'UEQ',vals:stu.map(s=>s.written.ueq)},{name:'SSQ',vals:stu.map(s=>s.written.ssq)},
    {name:'Accuracy',vals:stu.map(s=>s.vr.accuracy)},{name:'Avg HR',vals:stu.map(s=>s.vr.avgHR)}
  ];
  tb.innerHTML = metrics.map(m => {
    const s = calcStats(m.vals);
    return `<tr><td class="fw-bold">${m.name}</td><td>${s.mean.toFixed(1)}</td><td>${s.median.toFixed(1)}</td><td>${s.stdDev.toFixed(2)}</td><td>${s.min}</td><td>${s.max}</td><td>${s.range}</td></tr>`;
  }).join('');
}

function renderResDistChart(totals) {
  const c = document.getElementById('resDistChart'); if (!c) return;
  const ctx = c.getContext('2d'); const w = c.width = c.offsetWidth; const h = c.height = 200;
  ctx.clearRect(0,0,w,h);
  const bins=[0,0,0,0,0,0]; const labels=['<50','50-59','60-69','70-79','80-89','90+'];
  const colors=['#ff4757','#ff6b6b','#ffa502','#2ed573','#1e90ff','#a855f7'];
  totals.forEach(t=>{if(t<50)bins[0]++;else if(t<60)bins[1]++;else if(t<70)bins[2]++;else if(t<80)bins[3]++;else if(t<90)bins[4]++;else bins[5]++;});
  const mx=Math.max(...bins,1); const pad=40; const bw=(w-pad*2)/bins.length-8;
  bins.forEach((count,i)=>{const bh=(count/mx)*(h-pad-20);const x=pad+i*(bw+8);const y=h-pad-bh;
    ctx.fillStyle=colors[i];ctx.fillRect(x,y,bw,bh);
    ctx.fillStyle='#8892b0';ctx.font='10px monospace';ctx.textAlign='center';ctx.fillText(labels[i],x+bw/2,h-pad+14);
    ctx.fillStyle='#e6f1ff';ctx.fillText(count,x+bw/2,y-4);
  });
}

function renderResGradeChart(students) {
  const c = document.getElementById('resGradeChart'); if (!c) return;
  const ctx = c.getContext('2d'); const w = c.width = c.offsetWidth; const h = c.height = 200;
  ctx.clearRect(0,0,w,h);
  const grades={'A':0,'B+':0,'B':0,'C+':0,'C':0,'D':0};
  students.forEach(s=>{if(grades[s.grade]!==undefined)grades[s.grade]++;});
  const entries=Object.entries(grades);
  const colors=['#a855f7','#1e90ff','#2ed573','#ffa502','#ff6b6b','#ff4757'];
  const mx=Math.max(...entries.map(e=>e[1]),1);const pad=40;const bw=(w-pad*2)/entries.length-8;
  entries.forEach(([g,count],i)=>{const bh=(count/mx)*(h-pad-20);const x=pad+i*(bw+8);const y=h-pad-bh;
    ctx.fillStyle=colors[i];ctx.fillRect(x,y,bw,bh);
    ctx.fillStyle='#8892b0';ctx.font='11px monospace';ctx.textAlign='center';ctx.fillText(g,x+bw/2,h-pad+14);
    ctx.fillStyle='#e6f1ff';ctx.font='bold 12px monospace';ctx.fillText(count,x+bw/2,y-4);
  });
}

function renderResTranscript(students, filter='') {
  const tb = document.getElementById('resTranscriptTable'); if (!tb) return;
  const list = filter ? students.filter(s=>s.name.includes(filter)||s.sid.toLowerCase().includes(filter.toLowerCase())) : students;
  tb.innerHTML = list.map((s,i)=>{
    const bc = s.grade==='A'?'magenta':s.grade.startsWith('B')?'green':s.grade.startsWith('C')?'yellow':'red';
    return `<tr><td>${i+1}</td><td>${s.sid}</td><td class="fw-bold text-cyan" style="cursor:pointer;text-decoration:underline" onclick="showResDetail('${s.sid}')">${s.name}</td><td>${s.written.stai}</td><td>${s.written.ueq}</td><td>${s.written.ssq}</td><td>${s.written.score}</td><td>${s.vr.accuracy}%</td><td>${s.vr.breathSync}%</td><td>${s.vr.score}</td><td class="fw-bold">${s.total}</td><td><span class="badge badge-${bc}">${s.grade}</span></td><td><button class="btn btn-sm" onclick="exportSinglePDF('${s.sid}')" style="padding:2px 6px" title="Export PDF">📄</button> <button class="btn btn-sm" onclick="showResEntryModal('${s.sid}')" style="padding:2px 6px">✏️</button> <button class="btn btn-sm btn-danger" onclick="deleteResStudent('${s.sid}')" style="padding:2px 6px">🗑️</button></td></tr>`;
  }).join('');
}

function filterResultsTable() {
  const q = document.getElementById('resSearch')?.value||'';
  if (currentProject) renderResTranscript(currentProject.students, q);
}

function showResDetail(sid) {
  if (!currentProject) return;
  const s = currentProject.students.find(x=>x.sid===sid); if (!s) return;
  _currentDetailSid = sid;
  document.getElementById('resDetailCard').style.display='block';
  document.getElementById('resDetailTitle').textContent=`📄 ${s.name} (${s.sid})`;
  document.getElementById('resDetailInfo').innerHTML=`
    <div class="flex-between"><span class="text-dim">Student ID:</span><span class="fw-bold">${s.sid}</span></div>
    <div class="flex-between"><span class="text-dim">Name:</span><span class="fw-bold">${s.name}</span></div>
    <div class="flex-between"><span class="text-dim">STAI-S:</span><span>${s.written.stai} (norm: ${s.written.staiNorm})</span></div>
    <div class="flex-between"><span class="text-dim">UEQ:</span><span>${s.written.ueq} (norm: ${s.written.ueqNorm})</span></div>
    <div class="flex-between"><span class="text-dim">SSQ:</span><span>${s.written.ssq} (norm: ${s.written.ssqNorm})</span></div>
    <div class="flex-between"><span class="text-dim">Written:</span><span class="fw-bold text-cyan">${s.written.score}</span></div>
    <div style="border-top:1px dashed var(--border);margin:4px 0"></div>
    <div class="flex-between"><span class="text-dim">Accuracy:</span><span>${s.vr.accuracy}%</span></div>
    <div class="flex-between"><span class="text-dim">Breath Sync:</span><span>${s.vr.breathSync}%</span></div>
    <div class="flex-between"><span class="text-dim">Posture:</span><span>${s.vr.posture}%</span></div>
    <div class="flex-between"><span class="text-dim">Level:</span><span>L${s.vr.levelReached}</span></div>
    <div class="flex-between"><span class="text-dim">Sessions:</span><span>${s.vr.sessions}</span></div>
    <div class="flex-between"><span class="text-dim">VR Score:</span><span class="fw-bold text-green">${s.vr.score}</span></div>
    <div style="border-top:1px dashed var(--border);margin:4px 0"></div>
    <div class="flex-between"><span class="text-dim">Total (40/60):</span><span class="fw-bold" style="font-size:18px;color:var(--cyan)">${s.total}</span></div>
    <div class="flex-between"><span class="text-dim">Grade:</span><span class="badge badge-${s.grade==='A'?'magenta':'green'}" style="font-size:16px">${s.grade}</span></div>`;
  const cv = document.getElementById('resDetailRadar');
  if (cv) drawResRadar(cv, s);
  document.getElementById('resDetailCard').scrollIntoView({behavior:'smooth'});
}

function drawResRadar(canvas, s) {
  const ctx=canvas.getContext('2d');const w=260,h=260;canvas.width=w;canvas.height=h;
  const cx=w/2,cy=h/2,r=90;
  const dims=[{l:'Accuracy',v:s.vr.accuracy},{l:'Breath',v:s.vr.breathSync},{l:'Posture',v:s.vr.posture},{l:'Written',v:s.written.score},{l:'Anti-Anxiety',v:s.written.staiNorm}];
  const n=dims.length;
  [0.25,0.5,0.75,1].forEach(sc=>{ctx.beginPath();for(let i=0;i<=n;i++){const a=(Math.PI*2/n)*i-Math.PI/2;const x=cx+Math.cos(a)*r*sc;const y=cy+Math.sin(a)*r*sc;i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.strokeStyle='rgba(100,120,180,0.2)';ctx.stroke();});
  dims.forEach((d,i)=>{const a=(Math.PI*2/n)*i-Math.PI/2;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);ctx.strokeStyle='rgba(100,120,180,0.3)';ctx.stroke();const lx=cx+Math.cos(a)*(r+18);const ly=cy+Math.sin(a)*(r+18);ctx.fillStyle='#8892b0';ctx.font='10px sans-serif';ctx.textAlign='center';ctx.fillText(d.l,lx,ly+4);});
  ctx.beginPath();dims.forEach((d,i)=>{const a=(Math.PI*2/n)*i-Math.PI/2;const v=Math.min(d.v,100)/100;const x=cx+Math.cos(a)*r*v;const y=cy+Math.sin(a)*r*v;i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);});ctx.closePath();ctx.fillStyle='rgba(0,229,255,0.15)';ctx.fill();ctx.strokeStyle='rgba(0,229,255,0.8)';ctx.lineWidth=2;ctx.stroke();
  dims.forEach((d,i)=>{const a=(Math.PI*2/n)*i-Math.PI/2;const v=Math.min(d.v,100)/100;ctx.beginPath();ctx.arc(cx+Math.cos(a)*r*v,cy+Math.sin(a)*r*v,4,0,Math.PI*2);ctx.fillStyle='#00e5ff';ctx.fill();});
}

function exportResultsCSV() {
  if (!currentProject) return;
  const h='SID,Name,STAI,UEQ,SSQ,Written,Accuracy,BreathSync,Posture,VRScore,Total,Grade';
  const rows=currentProject.students.map(s=>`${s.sid},${s.name},${s.written.stai},${s.written.ueq},${s.written.ssq},${s.written.score},${s.vr.accuracy},${s.vr.breathSync},${s.vr.posture},${s.vr.score},${s.total},${s.grade}`);
  const csv=[h,...rows].join('\n');
  const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`results_${currentProject.id}_${Date.now()}.csv`;a.click();
}

// ═══ RESULTS DATA ENTRY ═══
function gradeFromScore(s) {
  if (s >= 90) return 'A';
  if (s >= 80) return 'B+';
  if (s >= 70) return 'B';
  if (s >= 60) return 'C+';
  if (s >= 50) return 'C';
  return 'D';
}

function calcStudentScores(stai, ueq, ssq, accuracy, breathSync, posture, levelReached) {
  const staiNorm = Math.round(Math.max(0, (80 - stai) / 60 * 100));
  const ueqNorm = Math.round(Math.max(0, (ueq + 3) / 6 * 100));
  const ssqNorm = Math.round(Math.max(0, (235 - ssq) / 235 * 100));
  const writtenScore = Math.round((staiNorm + ueqNorm + ssqNorm) / 3);
  const vrScore = Math.round((accuracy * 0.35 + breathSync * 0.25 + posture * 0.25 + (levelReached / 3 * 100) * 0.15));
  const total = Math.round(writtenScore * 0.4 + vrScore * 0.6);
  return { staiNorm, ueqNorm, ssqNorm, writtenScore, vrScore, total, grade: gradeFromScore(total) };
}

function showResEntryModal(editSid) {
  if (!currentProject) { alert('Please select or create a project first.'); return; }
  const modal = document.getElementById('resEntryModal');
  if (editSid) {
    const s = currentProject.students.find(x => x.sid === editSid);
    if (s) {
      document.getElementById('resEntryTitle').textContent = '✏️ Edit: ' + s.name;
      document.getElementById('resEditSid').value = editSid;
      document.getElementById('resSid').value = s.sid;
      document.getElementById('resName').value = s.name;
      document.getElementById('resSTAI').value = s.written.stai;
      document.getElementById('resUEQ').value = s.written.ueq;
      document.getElementById('resSSQ').value = s.written.ssq;
      document.getElementById('resAcc').value = s.vr.accuracy;
      document.getElementById('resBreath').value = s.vr.breathSync;
      document.getElementById('resPosture').value = s.vr.posture;
      document.getElementById('resHR').value = s.vr.avgHR;
      document.getElementById('resLevel').value = s.vr.levelReached;
      document.getElementById('resSessions').value = s.vr.sessions;
    }
  } else {
    document.getElementById('resEntryTitle').textContent = '＋ Add Student Score';
    document.getElementById('resEditSid').value = '';
    ['resSid','resName','resSTAI','resUEQ','resSSQ','resAcc','resBreath','resPosture','resHR'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
    });
    document.getElementById('resLevel').value = '2';
    document.getElementById('resSessions').value = '1';
  }
  modal.classList.add('active');
}

function closeResEntryModal() { document.getElementById('resEntryModal').classList.remove('active'); }

async function saveResEntry() {
  const sid = document.getElementById('resSid').value.trim();
  const name = document.getElementById('resName').value.trim();
  if (!sid || !name) { alert('Student ID and Name are required.'); return; }

  const stai = parseFloat(document.getElementById('resSTAI').value) || 40;
  const ueq = parseFloat(document.getElementById('resUEQ').value) || 1.0;
  const ssq = parseFloat(document.getElementById('resSSQ').value) || 20;
  const accuracy = parseInt(document.getElementById('resAcc').value) || 70;
  const breathSync = parseInt(document.getElementById('resBreath').value) || 60;
  const posture = parseInt(document.getElementById('resPosture').value) || 65;
  const avgHR = parseInt(document.getElementById('resHR').value) || 78;
  const levelReached = parseInt(document.getElementById('resLevel').value) || 2;
  const sessions = parseInt(document.getElementById('resSessions').value) || 1;

  const calc = calcStudentScores(stai, ueq, ssq, accuracy, breathSync, posture, levelReached);
  const entry = {
    sid, name,
    written: { stai, ueq, ssq, staiNorm: calc.staiNorm, ueqNorm: calc.ueqNorm, ssqNorm: calc.ssqNorm, score: calc.writtenScore },
    vr: { accuracy, avgHR, breathSync, posture, levelReached, sessions, duration: 0, score: calc.vrScore },
    total: calc.total, grade: calc.grade
  };

  const editSid = document.getElementById('resEditSid').value;
  if (editSid) {
    const idx = currentProject.students.findIndex(s => s.sid === editSid);
    if (idx >= 0) currentProject.students[idx] = entry;
  } else {
    currentProject.students.push(entry);
  }

  await api.results.save(resultsData);
  closeResEntryModal();
  loadResultsProject();
}

function showNewProjectModal() {
  document.getElementById('newProjName').value = '';
  document.getElementById('newProjDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('resNewProjectModal').classList.add('active');
}

async function createNewProject() {
  const name = document.getElementById('newProjName').value.trim();
  if (!name) { alert('Project name is required.'); return; }
  const date = document.getElementById('newProjDate').value || new Date().toISOString().split('T')[0];
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30) + '-' + Date.now();
  
  if (!resultsData) resultsData = { projects: [] };
  resultsData.projects.push({
    id, name, date,
    questionnaires: [
      { id: 'stai', name: 'STAI-S', fullName: 'State-Trait Anxiety Inventory', scale: '20-80' },
      { id: 'ueq', name: 'UEQ', fullName: 'User Experience Questionnaire', scale: '-3 to 3' },
      { id: 'ssq', name: 'SSQ', fullName: 'Simulator Sickness Questionnaire', scale: '0-235' }
    ],
    weightWritten: 0.4, weightVR: 0.6,
    students: []
  });

  await api.results.save(resultsData);
  document.getElementById('resNewProjectModal').classList.remove('active');
  // Refresh project list and select new project
  const sel = document.getElementById('resProjectSelect');
  sel.innerHTML = resultsData.projects.map((p, i) =>
    `<option value="${i}">${p.name} (${p.date || ''})</option>`
  ).join('');
  sel.value = resultsData.projects.length - 1;
  loadResultsProject();
}

async function deleteCurrentProject() {
  if (!currentProject || !resultsData) return;
  if (!confirm(`Delete project "${currentProject.name}"? This cannot be undone.`)) return;
  const idx = resultsData.projects.indexOf(currentProject);
  if (idx >= 0) resultsData.projects.splice(idx, 1);
  await api.results.save(resultsData);
  currentProject = null;
  loadResults();
}

async function importResultsExcel() {
  if (!currentProject) { alert('Please select or create a project first.'); return; }
  try {
    const r = await api.results.importData();
    if (!r.success) { if (r.error) alert('Import error: ' + r.error); return; }

    if (r.type === 'json') {
      // JSON: merge projects
      const imported = r.data;
      if (imported.projects && Array.isArray(imported.projects)) {
        imported.projects.forEach(p => {
          const existing = resultsData.projects.find(x => x.id === p.id);
          if (existing) {
            // Merge students into existing project
            p.students.forEach(s => {
              const idx = existing.students.findIndex(x => x.sid === s.sid);
              if (idx >= 0) existing.students[idx] = s;
              else existing.students.push(s);
            });
          } else {
            resultsData.projects.push(p);
          }
        });
        await api.results.save(resultsData);
        alert(`JSON imported: ${imported.projects.length} project(s) merged.`);
      } else if (Array.isArray(imported)) {
        // Plain array of students
        imported.forEach(s => {
          const idx = currentProject.students.findIndex(x => x.sid === s.sid);
          if (idx >= 0) currentProject.students[idx] = s;
          else currentProject.students.push(s);
        });
        await api.results.save(resultsData);
        alert(`JSON imported: ${imported.length} student(s) added to current project.`);
      }
    } else if (r.type === 'excel') {
      // Excel: parse rows
      const rows = r.rows;
      let count = 0;
      rows.forEach(row => {
        const sid = String(row.SID || row.sid || row['Student ID'] || row['学号'] || '').trim();
        const name = String(row.Name || row.name || row['姓名'] || '').trim();
        if (!sid || !name) return;
        const stai = parseFloat(row.STAI || row.stai || row['STAI-S'] || 40);
        const ueq = parseFloat(row.UEQ || row.ueq || 1.0);
        const ssq = parseFloat(row.SSQ || row.ssq || 20);
        const accuracy = parseInt(row.Accuracy || row.accuracy || row['准确率'] || 70);
        const breathSync = parseInt(row.BreathSync || row.breathSync || row.Breath || 60);
        const posture = parseInt(row.Posture || row.posture || 65);
        const avgHR = parseInt(row.AvgHR || row.avgHR || row.HR || 78);
        const levelReached = parseInt(row.Level || row.level || 2);
        const sessions = parseInt(row.Sessions || row.sessions || 1);

        const calc = calcStudentScores(stai, ueq, ssq, accuracy, breathSync, posture, levelReached);
        const entry = {
          sid, name,
          written: { stai, ueq, ssq, staiNorm: calc.staiNorm, ueqNorm: calc.ueqNorm, ssqNorm: calc.ssqNorm, score: calc.writtenScore },
          vr: { accuracy, avgHR, breathSync, posture, levelReached, sessions, duration: 0, score: calc.vrScore },
          total: calc.total, grade: calc.grade
        };
        const idx = currentProject.students.findIndex(x => x.sid === sid);
        if (idx >= 0) currentProject.students[idx] = entry;
        else currentProject.students.push(entry);
        count++;
      });
      await api.results.save(resultsData);
      alert(`Excel imported: ${count} student(s) added/updated.`);
    }
    loadResults();
  } catch (e) {
    console.error('Import error:', e);
    alert('Import failed: ' + e.message);
  }
}

function deleteResStudent(sid) {
  if (!currentProject) return;
  const idx = currentProject.students.findIndex(s => s.sid === sid);
  if (idx < 0) return;
  if (!confirm(`Delete ${currentProject.students[idx].name}?`)) return;
  currentProject.students.splice(idx, 1);
  api.results.save(resultsData);
  loadResultsProject();
}

// ═══ PDF TRANSCRIPT GENERATION ═══
let _currentDetailSid = null;

function generateStudentPDFHtml(s, projName) {
  const gc = s.grade==='A'?'#e040fb':s.grade.startsWith('B')?'#00e676':s.grade.startsWith('C')?'#ffab00':'#ff1744';
  const date = new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
  
  // SVG radar chart
  const dims = ['Accuracy','BreathSync','Posture','Written','AntiAnxiety'];
  const vals = [s.vr.accuracy, s.vr.breathSync, s.vr.posture, s.written.score, s.written.staiNorm||50];
  const cx=130, cy=130, r=100;
  const angles = dims.map((_,i) => (i * 2 * Math.PI / 5) - Math.PI/2);
  const gridLines = [0.2,0.4,0.6,0.8,1].map(f => {
    const pts = angles.map(a => `${cx+r*f*Math.cos(a)},${cy+r*f*Math.sin(a)}`).join(' ');
    return `<polygon points="${pts}" fill="none" stroke="#334" stroke-width="0.5"/>`;
  }).join('');
  const axisLines = angles.map(a => `<line x1="${cx}" y1="${cy}" x2="${cx+r*Math.cos(a)}" y2="${cy+r*Math.sin(a)}" stroke="#334" stroke-width="0.5"/>`).join('');
  const dataPts = angles.map((a,i) => `${cx+r*(vals[i]/100)*Math.cos(a)},${cy+r*(vals[i]/100)*Math.sin(a)}`).join(' ');
  const labels = dims.map((d,i) => {
    const lx = cx + (r+18)*Math.cos(angles[i]);
    const ly = cy + (r+18)*Math.sin(angles[i]);
    return `<text x="${lx}" y="${ly}" text-anchor="middle" fill="#aaa" font-size="9">${d} ${vals[i]}%</text>`;
  }).join('');
  const radarSVG = `<svg width="260" height="260" viewBox="0 0 260 260" xmlns="http://www.w3.org/2000/svg">
    ${gridLines}${axisLines}
    <polygon points="${dataPts}" fill="rgba(0,229,255,0.15)" stroke="#00e5ff" stroke-width="1.5"/>
    ${labels}
  </svg>`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',sans-serif; background:#fff; color:#222; padding:40px; }
  .header { text-align:center; border-bottom:2px solid #0a1a30; padding-bottom:16px; margin-bottom:20px; }
  .header h1 { font-size:20px; color:#0a1a30; letter-spacing:2px; }
  .header .sub { font-size:11px; color:#888; letter-spacing:1px; margin-top:4px; }
  .header .project { font-size:12px; color:#555; margin-top:6px; }
  .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px; }
  .info-box { background:#f8f9fa; border:1px solid #e0e0e0; border-radius:8px; padding:14px; }
  .info-box .label { font-size:10px; color:#888; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px; }
  .info-box .val { font-size:15px; font-weight:700; color:#222; }
  .section-title { font-size:12px; font-weight:700; color:#0a1a30; letter-spacing:2px; border-left:3px solid #00b8d4; padding-left:8px; margin:20px 0 12px; text-transform:uppercase; }
  table { width:100%; border-collapse:collapse; margin-bottom:16px; }
  th { background:#f0f2f5; padding:8px 12px; text-align:left; font-size:10px; font-weight:700; color:#555; letter-spacing:1px; text-transform:uppercase; border-bottom:2px solid #ddd; }
  td { padding:8px 12px; border-bottom:1px solid #eee; font-size:13px; }
  .grade-badge { display:inline-block; padding:6px 20px; border-radius:20px; font-size:24px; font-weight:900; color:#fff; background:${gc}; text-align:center; }
  .total-score { font-size:36px; font-weight:900; color:#0a1a30; }
  .radar-wrap { display:flex; justify-content:center; margin:12px 0; }
  .footer { text-align:center; margin-top:30px; padding-top:16px; border-top:1px solid #ddd; font-size:10px; color:#999; }
  .flex-center { display:flex; align-items:center; justify-content:center; gap:24px; margin:16px 0; }
  .score-card { text-align:center; padding:12px 20px; background:#f8f9fa; border-radius:8px; border:1px solid #e0e0e0; }
  .score-card .sv { font-size:28px; font-weight:900; color:#0a1a30; }
  .score-card .sl { font-size:10px; color:#888; margin-top:2px; }
  .page-break { page-break-after:always; }
</style></head><body>
<div class="header">
  <h1>📋 TRAINING TRANSCRIPT</h1>
  <div class="sub">VR Training Assessment Report</div>
  <div class="project">${projName} · ${date}</div>
</div>

<div class="info-grid">
  <div class="info-box"><div class="label">Student ID</div><div class="val">${s.sid}</div></div>
  <div class="info-box"><div class="label">Name</div><div class="val">${s.name}</div></div>
  <div class="info-box"><div class="label">Sessions Completed</div><div class="val">${s.vr.sessions || 1}</div></div>
  <div class="info-box"><div class="label">Level Reached</div><div class="val">${s.vr.levelReached || '-'} / 3</div></div>
</div>

<div class="flex-center">
  <div class="score-card"><div class="sv">${s.written.score}</div><div class="sl">Written (40%)</div></div>
  <div class="score-card"><div class="sv">${s.vr.score}</div><div class="sl">VR Training (60%)</div></div>
  <div class="score-card"><div class="total-score">${s.total}</div><div class="sl">Total Score</div></div>
  <div><div class="grade-badge">${s.grade}</div></div>
</div>

<div class="section-title">📝 Written Assessment (Questionnaires)</div>
<table>
  <tr><th>Questionnaire</th><th>Raw Score</th><th>Normalized</th></tr>
  <tr><td>STAI-S (State Anxiety)</td><td>${s.written.stai}</td><td>${s.written.staiNorm || '-'}%</td></tr>
  <tr><td>UEQ (User Experience)</td><td>${s.written.ueq}</td><td>${s.written.ueqNorm || '-'}%</td></tr>
  <tr><td>SSQ (Simulator Sickness)</td><td>${s.written.ssq}</td><td>${s.written.ssqNorm || '-'}%</td></tr>
</table>

<div class="section-title">🎯 VR Training Performance</div>
<table>
  <tr><th>Metric</th><th>Score</th></tr>
  <tr><td>Shooting Accuracy</td><td>${s.vr.accuracy}%</td></tr>
  <tr><td>Breath Synchronization</td><td>${s.vr.breathSync}%</td></tr>
  <tr><td>Posture Stability</td><td>${s.vr.posture}%</td></tr>
  <tr><td>Average Heart Rate</td><td>${s.vr.avgHR} BPM</td></tr>
</table>

<div class="section-title">📊 Performance Radar</div>
<div class="radar-wrap">${radarSVG}</div>

<div class="footer">
  Generated by Military VR Instructor Dashboard · ${date}
</div>
</body></html>`;
}

// Store current detail SID
const _origShowResDetail = typeof showResDetail === 'function' ? showResDetail : null;

function exportStudentPDF() {
  if (!_currentDetailSid || !currentProject) return;
  exportSinglePDF(_currentDetailSid);
}

async function exportSinglePDF(sid) {
  if (!currentProject) return;
  const s = currentProject.students.find(x => x.sid === sid);
  if (!s) return;
  const html = generateStudentPDFHtml(s, currentProject.name);
  const filename = `transcript_${s.sid}_${Date.now()}.pdf`;
  const r = await api.results.exportPDF({ html, filename });
  if (r.success) {
    alert(`✅ PDF exported!\n${r.path}`);
  } else {
    alert('❌ Export failed: ' + (r.error || 'Unknown error'));
  }
}

async function batchExportPDF(mode) {
  if (!currentProject || !currentProject.students.length) { alert('No students to export.'); return; }
  const students = currentProject.students;

  if (mode === 'combined') {
    // All students in one PDF with page breaks
    const pages = students.map((s, i) => {
      let html = generateStudentPDFHtml(s, currentProject.name);
      // Extract body content and wrap with page break
      const bodyMatch = html.match(/<body>([\s\S]*)<\/body>/);
      const bodyContent = bodyMatch ? bodyMatch[1] : '';
      return i < students.length - 1 
        ? bodyContent + '<div class="page-break"></div>' 
        : bodyContent;
    });
    
    // Build combined HTML
    const first = generateStudentPDFHtml(students[0], currentProject.name);
    const headMatch = first.match(/<head>([\s\S]*)<\/head>/);
    const head = headMatch ? headMatch[1] : '';
    const combinedHtml = `<!DOCTYPE html><html><head>${head}</head><body>${pages.join('')}</body></html>`;
    
    const filename = `transcript_all_${currentProject.id}_${Date.now()}.pdf`;
    const r = await api.results.exportPDF({ html: combinedHtml, filename });
    if (r.success) {
      alert(`✅ Combined PDF (${students.length} students) exported!\n${r.path}`);
    } else {
      alert('❌ Export failed: ' + (r.error || 'Unknown error'));
    }
  } else {
    // Individual PDFs
    let success = 0, fail = 0;
    for (const s of students) {
      const html = generateStudentPDFHtml(s, currentProject.name);
      const filename = `transcript_${s.sid}.pdf`;
      const r = await api.results.exportPDF({ html, filename });
      if (r.success) success++; else fail++;
    }
    alert(`✅ Exported ${success} individual PDFs${fail ? ` (${fail} failed)` : ''}.\nSaved to data/results/exports/`);
    api.results.openExportDir();
  }
}
