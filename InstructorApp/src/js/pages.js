// ═══ Pages V3 — Full overhaul ═══
const PAGES = {};
const WEAPONS = [
  {id:'HK-416',type:'突击步枪',cat:'rifle'},{id:'M16',type:'突击步枪',cat:'rifle'},{id:'AK-74',type:'突击步枪',cat:'rifle'},
  {id:'AKS-74U',type:'短突击步枪',cat:'rifle'},{id:'Scar-L',type:'突击步枪',cat:'rifle'},{id:'HK MP5',type:'冲锋枪',cat:'smg'},
  {id:'Mosin Nagant',type:'狙击步枪',cat:'sniper'},{id:'M17 9MM',type:'手枪',cat:'pistol'},{id:'Model 1897',type:'霰弹枪',cat:'shotgun'}
];

// ─────── 1. DASHBOARD (30 student icons + stats) ───────
PAGES.dashboard = () => `
<div class="page-header">
  <div><div class="page-title" data-i18n="dashboard_title">系统总览</div><div class="page-subtitle" data-i18n="dashboard_sub">全局状态监控 · 射击训练场</div></div>
  <div class="flex-row"><button class="btn-back" onclick="backToModeSelect()" data-i18n="btn_back">◀ 返回选择模式</button><span class="badge badge-blue ml-8" id="dashModeBadge">--</span></div>
</div>
<div class="stats-bar mb-16">
  <div class="sb-item"><span class="sb-val text-cyan" id="dTotal">${selectedMode||0}</span><span class="sb-label" data-i18n="total_trainees">总参训</span></div>
  <div class="sb-item"><span class="sb-val text-green" id="dOnline">0</span><span class="sb-label" data-i18n="online_count">在线</span></div>
  <div class="sb-item"><span class="sb-val text-red" id="dOffline">0</span><span class="sb-label" data-i18n="offline_count">未参训</span></div>
  <div class="sb-item"><span class="sb-val text-yellow" id="dLevel">L2</span><span class="sb-label" data-i18n="current_level">当前难度</span></div>
  <div class="sb-item"><span class="sb-val" id="dWs">--</span><span class="sb-label">WebSocket</span></div>
  <div class="sb-item" style="margin-left:auto"><span class="badge badge-cyan" id="dashTime">--:--:--</span></div>
</div>
<div class="card mb-16"><div class="card-title" data-i18n="filter_title">🔍 学员筛选</div>
  <div class="flex-row gap-8"><input class="form-input" style="width:180px;padding:6px 10px" placeholder="姓名/学号" id="dashFilter" oninput="filterDashIcons()">
    <button class="btn btn-sm" onclick="filterDashByLevel('all')" data-i18n="all">全部</button>
    <button class="btn btn-sm" onclick="filterDashByLevel(1)">L1</button>
    <button class="btn btn-sm" onclick="filterDashByLevel(2)">L2</button>
    <button class="btn btn-sm" onclick="filterDashByLevel(3)">L3</button>
  </div>
</div>
<div class="range-bg mb-16"><div class="card-title" data-i18n="trainee_status">👥 学员体征状态 (30人)</div><div class="stu-icon-grid" id="dashIconGrid"></div></div>
<div class="grid-2">
  <div class="card"><div class="card-title" data-i18n="quick_ops">📋 快捷操作</div>
    <div class="flex-row gap-8" style="flex-wrap:wrap">
      <button class="btn btn-primary" onclick="navigate('training')" data-i18n="go_training">🎯 训练控制</button>
      <button class="btn" onclick="navigate('tasks')" data-i18n="go_tasks">📝 训练任务</button>
      <button class="btn" onclick="navigate('adaptive')" data-i18n="go_bio">🧬 体征监测</button>
      <button class="btn" onclick="navigate('students')" data-i18n="go_students">👥 学员管理</button>
      <button class="btn" onclick="navigate('archives')" data-i18n="go_archives">📁 学员档案</button>
    </div>
  </div>
  <div class="card"><div class="card-title" data-i18n="comm_log">📡 通信日志</div><div id="dashLog" style="height:100px;overflow-y:auto;font-family:var(--font-mono);font-size:11px;color:var(--text-2)"></div></div>
</div>`;

// ─────── 2. TASKS (weapon + target type selection) ───────
PAGES.tasks = () => `
<div class="page-header">
  <div><div class="page-title" data-i18n="tasks_title">TRAINING TASKS</div><div class="page-subtitle" data-i18n="tasks_sub">训练任务分配 · 枪械选择 · 靶型设置</div></div>
  <div class="flex-row gap-8"><button class="btn-back" onclick="backToModeSelect()" data-i18n="btn_back">◀ 返回</button></div>
</div>
<div class="grid-2 mb-16">
  <div class="card"><div class="card-title" data-i18n="target_type">🎯 训练靶型</div>
    <div class="flex-row gap-8">
      <button class="btn btn-primary" id="tgtFixed" onclick="setTargetType('fixed')" data-i18n="fixed_target">固定靶射击训练</button>
      <button class="btn" id="tgtMoving" onclick="setTargetType('moving')" data-i18n="moving_target">移动靶射击训练</button>
    </div>
  </div>
  <div class="card"><div class="card-title" data-i18n="batch_weapon">🔫 批量分配枪械</div>
    <div class="flex-row gap-8"><select class="form-input" id="batchWeaponSel" style="flex:1;padding:8px">${WEAPONS.map(w=>`<option value="${w.id}">${w.id} (${w.type})</option>`).join('')}</select>
    <button class="btn btn-sm btn-primary" onclick="batchAssignWeapon()" data-i18n="assign_all">全员分配</button></div>
  </div>
</div>
<div class="card mb-16"><div class="card-title" data-i18n="weapon_select">🔫 枪械选择 (Unity VR武器库)</div><div class="weapon-select" id="weaponGrid"></div></div>
<div class="card"><div class="card-title" data-i18n="trainee_weapon_table">📋 学员枪械分配表</div>
  <div class="table-wrap"><table><thead><tr><th data-i18n="th_select">选择</th><th data-i18n="th_name">姓名</th><th data-i18n="th_sid">学号</th><th data-i18n="th_class">班级</th><th data-i18n="th_weapon">当前枪械</th><th data-i18n="th_action">操作</th></tr></thead><tbody id="weaponTable"></tbody></table></div>
  <div class="flex-row gap-8 mt-8"><button class="btn btn-sm" onclick="selectAllTrainees()" data-i18n="select_all">全选</button><button class="btn btn-sm btn-primary" onclick="assignSelectedWeapon()" data-i18n="assign_selected">分配选中枪械</button></div>
  <div class="flex-row mt-16" style="justify-content:center;border-top:1px dashed var(--border);padding-top:16px">
    <button class="btn btn-primary" style="font-size:16px;padding:10px 32px;box-shadow:0 0 15px rgba(0,229,255,0.3);letter-spacing:1px" onclick="startTrainingSession()">🚀 开始进入实训 / START TRAINING</button>
  </div>
</div>`;

// ─────── 3. TRAINING (VR view + collapsible control panels) ───────
PAGES.training = () => `
<div class="training-container">
  <!-- VR Feed Background (always visible) -->
  <div class="training-vr-main">
    <div class="vr-header">
      <div class="vr-info">
        <span class="badge badge-cyan" id="trainModeBadge">Solo Training</span>
        <span class="badge badge-blue" id="trainCountBadge">1人</span>
        <span class="badge badge-red" id="vrStatus">● OFFLINE</span>
        <span class="text-sm text-dim ml-8" id="vrFPS">0FPS</span>
      </div>
      <div class="vr-actions">
        <button class="btn btn-sm" onclick="toggleVRFlip()" style="padding:4px 12px">🔁 翻转</button>
        <button class="btn btn-sm btn-back" onclick="backToModeSelect()">◀ 返回</button>
      </div>
    </div>

    <div class="vr-canvas-container">
      <div class="vr-placeholder" id="vrPlaceholder">
        <div class="vr-icon">🎯</div>
        <h3>等待 VR 画面接入</h3>
        <p>AWAITING VR FEED</p>
        <p style="margin-top:12px;font-size:10px;color:var(--text-3)">Unity 运行后自动显示</p>
      </div>
      <canvas id="vrCanvas" style="display:none;width:100%;height:100%"></canvas>
    </div>
  </div>

  <!-- LEFT: Collapsible Control Panel -->
  <div class="training-panel training-panel-left" id="controlPanel">
    <div class="panel-toggle" onclick="togglePanel('controlPanel')">
      <span class="panel-toggle-icon">◀</span>
    </div>
    <div class="panel-content">
      <div class="panel-header">⚙ 控制中心</div>

      <!-- Heart Rate -->
      <div class="panel-section">
        <div class="text-xs text-dim mb-4">实时心率 / HEART RATE</div>
        <div class="flex-row" style="align-items:baseline;gap:4px">
          <span class="hr-big text-green" id="trainHR">76</span>
          <span class="text-sm text-dim">BPM</span>
        </div>
        <canvas id="trainECG" style="width:100%;height:40px;margin-top:8px;border:1px solid var(--border);border-radius:4px"></canvas>
      </div>

      <!-- Stress Level -->
      <div class="panel-section">
        <div class="flex-between mb-4">
          <span class="text-xs text-dim">🧠 紧张度</span>
          <span class="badge badge-green" id="trainStressLevel">冷静</span>
        </div>
        <div class="progress" style="height:4px">
          <div class="progress-fill green" id="trainStressBar" style="width:15%"></div>
        </div>
      </div>

      <!-- Mode Control -->
      <div class="panel-section">
        <div class="text-xs text-dim mb-4">训练模式</div>
        <div class="flex-row gap-4 mb-8">
          <button class="btn btn-sm btn-primary" style="flex:1;font-size:11px" id="autoBtn" onclick="setAdaptiveMode('auto')">🤖 自动</button>
          <button class="btn btn-sm" style="flex:1;font-size:11px" id="manualBtn" onclick="setAdaptiveMode('manual')">🎯 手动</button>
        </div>
        <button class="btn btn-sm mode-btn mb-4" style="width:100%;font-size:11px" id="lvl1Btn" onclick="forceLevel(1)">🔴 L1 放松</button>
        <button class="btn btn-sm mode-btn mb-4" style="width:100%;font-size:11px" id="lvl2Btn" onclick="forceLevel(2)">🟢 L2 标准</button>
        <button class="btn btn-sm mode-btn mb-4" style="width:100%;font-size:11px" id="lvl3Btn" onclick="forceLevel(3)">🔵 L3 高级</button>
      </div>

      <!-- Actions -->
      <div class="panel-section">
        <button class="btn btn-sm btn-primary" style="width:100%;margin-bottom:8px" onclick="sendCmd()">⚡ 下发指令</button>
        <button class="btn btn-sm btn-danger" style="width:100%" onclick="forceStopTraining()">■ 结束训练</button>
      </div>

      <!-- Log -->
      <div class="panel-section" style="flex:1;display:flex;flex-direction:column">
        <div class="text-xs text-dim mb-4">📡 通信日志</div>
        <div class="comm-log" id="trainLog" style="flex:1;min-height:80px"></div>
      </div>
    </div>
  </div>

  <!-- RIGHT: Collapsible Stats Panel -->
  <div class="training-panel training-panel-right" id="statsPanel">
    <div class="panel-toggle" onclick="togglePanel('statsPanel')">
      <span class="panel-toggle-icon">▶</span>
    </div>
    <div class="panel-content">
      <div class="panel-header">📊 实时统计</div>

      <!-- Target Board -->
      <div class="panel-section">
        <div class="text-xs text-dim mb-4">🎯 弹着分布</div>
        <div class="target-canvas-wrap" style="width:100%;aspect-ratio:1">
          <canvas id="targetCanvas" width="300" height="300"></canvas>
        </div>
      </div>

      <!-- Scoring -->
      <div class="panel-section">
        <div class="text-xs text-dim mb-4">综合评分</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
          <div style="text-align:center;padding:8px;border:1px solid var(--border);border-radius:4px">
            <div class="text-xs text-dim">精准度</div>
            <div class="fw-bold" style="color:var(--cyan);font-size:18px" id="scoreAcc">0%</div>
          </div>
          <div style="text-align:center;padding:8px;border:1px solid var(--border);border-radius:4px">
            <div class="text-xs text-dim">呼吸</div>
            <div class="fw-bold" style="color:var(--green);font-size:18px" id="scoreBR">0%</div>
          </div>
          <div style="text-align:center;padding:8px;border:1px solid var(--border);border-radius:4px">
            <div class="text-xs text-dim">用时</div>
            <div class="fw-bold" style="color:var(--text-1);font-size:18px" id="scoreTime">00:00</div>
          </div>
          <div style="text-align:center;padding:8px;border:1px solid var(--border);border-radius:4px">
            <div class="text-xs text-dim">得分</div>
            <div class="fw-bold" style="color:var(--cyan);font-size:18px" id="scoreTotal">0</div>
          </div>
        </div>
        <button class="btn btn-sm btn-primary" style="width:100%" onclick="saveTrainingScore()">💾 保存成绩</button>
      </div>

      <!-- Level Stats -->
      <div class="panel-section" style="flex:1">
        <div class="text-xs text-dim mb-4">📊 关卡统计</div>
        <div id="levelStatsContainer" style="max-height:300px;overflow-y:auto"></div>
      </div>
    </div>
  </div>
</div>
`;

// ─────── 4. BIOMETRIC (Adaptive Training Settings) ───────
PAGES.adaptive = () => `
<div class="page-header">
  <div><div class="page-title" data-i18n="bio_title">BIOMETRIC ADAPTIVE</div><div class="page-subtitle" data-i18n="bio_sub">身体体征自适应调控</div></div>
  <div class="flex-row gap-8"><button class="btn-back" onclick="backToModeSelect()" data-i18n="btn_back">◀ 返回</button>
    <button class="btn btn-sm btn-primary" id="adpAutoBtn" onclick="setAdaptiveMode('auto')" data-i18n="auto_mode">🤖 自动</button>
    <button class="btn btn-sm" id="adpManualBtn" onclick="setAdaptiveMode('manual')" data-i18n="manual_mode">🎯 手动</button></div>
</div>
<div style="display:grid;grid-template-columns:1fr 280px 1fr;gap:16px">
  <div>
    <div class="bio-section mb-16"><div class="flex-between mb-8"><span class="bio-icon">❤️</span><span class="bio-title" data-i18n="hr_title">HEART RATE</span></div><div class="bio-val text-red" id="adpHR">75</div><div class="text-sm text-dim">BPM</div><canvas class="ecg-realtime mt-8" id="ecgCanvas"></canvas><input type="range" min="40" max="140" value="75" id="adpSlider" style="width:100%;margin-top:8px;accent-color:var(--cyan)"></div>
    <div class="bio-section"><div class="flex-between mb-8"><span class="bio-icon">🧠</span><span class="bio-title" data-i18n="eeg_title">EEG BRAINWAVE</span></div><div class="bio-val text-blue" id="bioEEG">α 12Hz</div><div class="text-sm text-dim">Alpha Wave</div><canvas class="ecg-realtime mt-8" id="eegCanvas"></canvas></div>
  </div>
  <div style="display:flex;flex-direction:column;align-items:center;justify-content:center">
    <div class="body-orb-wrap"><div class="body-orb"><div class="body-figure">🧍</div></div></div>
    <div style="text-align:center;margin-top:12px"><div class="stat-val" id="adpLevelNum" style="font-size:48px;color:var(--green)">2</div><div id="adpLevelName" style="font-family:var(--font-display);font-size:11px;color:var(--text-2);letter-spacing:2px">STANDARD</div></div>
    <div class="flex-row gap-8 mt-8" style="flex-wrap:wrap;justify-content:center" id="adpChips"></div>
  </div>
  <div>
    <div class="bio-section mb-16"><div class="flex-between mb-8"><span class="bio-icon">🏃</span><span class="bio-title" data-i18n="posture_title">POSTURE</span></div><div class="bio-val text-green" id="bioPosture">稳定</div><div class="text-sm text-dim" data-i18n="body_posture">身体姿态</div><div class="progress mt-8"><div class="progress-fill green" id="postureBar" style="width:75%"></div></div></div>
    <div class="bio-section"><div class="card-title" data-i18n="level_ctrl">🎯 难度等级控制</div><div id="adpLevelDesc" class="text-sm text-dim mb-8"></div>
      <button class="btn btn-sm mb-8" id="lvlBtnAdp1" onclick="forceLevel(1)" style="width:100%" data-i18n="level1">🔴 1级·放松引导</button>
      <button class="btn btn-sm mb-8" id="lvlBtnAdp2" onclick="forceLevel(2)" style="width:100%" data-i18n="level2">🟢 2级·标准训练</button>
      <button class="btn btn-sm" id="lvlBtnAdp3" onclick="forceLevel(3)" style="width:100%" data-i18n="level3">🔵 3级·高级挑战</button></div>
  </div>
</div>
<div class="card mt-16"><div class="card-title" data-i18n="json_cmd">📋 当前指令 JSON</div><pre id="adpJson" style="font-size:11px;color:var(--cyan);white-space:pre-wrap"></pre></div>`;

// ─────── 5. DEVICES (Polar BLE Integration) ───────
PAGES.devices = () => `
<div class="page-header"><div><div class="page-title" data-i18n="dev_title">DEVICE CONNECTION</div><div class="page-subtitle" data-i18n="dev_sub">Polar 心率设备蓝牙连接 · 无需系统配对</div></div>
  <div class="flex-row gap-8"><button class="btn-back" onclick="backToModeSelect()" data-i18n="btn_back">◀ 返回</button></div></div>

<!-- Connection Status Banner -->
<div class="card mb-16" id="bleStatusBanner" style="border-left:3px solid var(--red);padding:12px 16px">
  <div class="flex-between">
    <div class="flex-row gap-8">
      <span style="font-size:24px" id="bleStatusIcon">📡</span>
      <div>
        <div class="fw-bold" id="bleStatusText">未连接设备</div>
        <div class="text-sm text-dim" id="bleStatusSub">点击扫描按钮搜索附近 Polar 心率设备</div>
      </div>
    </div>
    <div class="flex-row gap-8">
      <button class="btn btn-primary" id="bleScanBtn" onclick="bleScanDevices()">🔍 扫描 Polar 设备</button>
      <button class="btn btn-danger" id="bleDisconnBtn" onclick="bleDisconnect()" style="display:none">⏏ 断开连接</button>
    </div>
  </div>
</div>

<!-- Live Heart Rate (shown when connected) -->
<div id="bleLivePanel" style="display:none" class="mb-16">
  <div class="grid-3">
    <div class="card" style="text-align:center">
      <div style="font-size:14px;color:var(--text-2);margin-bottom:8px">❤️ 实时心率 / HEART RATE</div>
      <div id="bleHR" style="font-size:72px;font-weight:bold;color:var(--red);font-family:var(--font-mono)">--</div>
      <div class="text-sm text-dim">BPM</div>
      <canvas id="bleECG" style="width:100%;height:60px;margin-top:12px;border:1px solid var(--border);border-radius:4px;background:rgba(5,8,15,0.6)"></canvas>
    </div>
    <div class="card" style="text-align:center">
      <div style="font-size:14px;color:var(--text-2);margin-bottom:8px">🔋 设备电量</div>
      <div id="bleBattery" style="font-size:48px;font-weight:bold;color:var(--green);font-family:var(--font-mono)">--%</div>
      <div class="progress mt-8"><div class="progress-fill green" id="bleBatBar" style="width:0%"></div></div>
    </div>
    <div class="card">
      <div style="font-size:14px;color:var(--text-2);margin-bottom:8px">📋 设备属性</div>
      <div class="text-sm" style="line-height:2">
        <div class="flex-between"><span class="text-dim">设备名称：</span><span id="bleDevName" class="fw-bold">--</span></div>
        <div class="flex-between"><span class="text-dim">设备类型：</span><span id="bleDevType">心率传感器</span></div>
        <div class="flex-between"><span class="text-dim">连接状态：</span><span class="badge badge-green" id="bleConnBadge">● 已连接</span></div>
        <div class="flex-between"><span class="text-dim">信号强度：</span><span id="bleRSSI">良好</span></div>
        <div class="flex-between"><span class="text-dim">协议：</span><span>BLE (Bluetooth Low Energy)</span></div>
        <div class="flex-between"><span class="text-dim">服务UUID：</span><span style="font-family:var(--font-mono);font-size:10px">0x180D (Heart Rate)</span></div>
      </div>
    </div>
  </div>
</div>

<!-- Discovered Devices List -->
<div class="card mb-16" id="bleDeviceList">
  <div class="card-title">📱 发现的设备</div>
  <div id="bleFoundDevices" style="min-height:60px">
    <div class="text-sm text-dim" style="text-align:center;padding:20px">点击上方"扫描"按钮开始搜索...</div>
  </div>
</div>

<!-- Scan Log -->
<div class="card"><div class="card-title">📡 蓝牙日志</div><div id="bleLog" style="height:150px;overflow-y:auto;font-family:var(--font-mono);font-size:11px;color:var(--text-2)"></div></div>`;

// ─────── 6. STUDENTS ───────
PAGES.students = () => `
<div class="page-header"><div><div class="page-title" data-i18n="stu_title">TRAINEE DATABASE</div><div class="page-subtitle" data-i18n="stu_sub">学员信息录入管理</div></div>
  <div class="flex-row gap-8"><input class="form-input" style="width:160px;padding:6px 10px" id="stuSearch" oninput="searchStudents()" data-i18n-ph="search_ph">
    <button class="btn btn-sm btn-primary" onclick="showAddStudent()" data-i18n="add_manual">＋ 手动录入</button>
    <button class="btn btn-sm btn-success" onclick="importExcel()" data-i18n="excel_import">📊 Excel导入</button>
    <button class="btn btn-sm" onclick="exportStudents()" data-i18n="export">📤 导出</button></div></div>
<div class="card"><div class="table-wrap"><table><thead><tr><th data-i18n="th_photo">Photo</th><th data-i18n="th_name">Name</th><th data-i18n="th_sid">Student ID</th><th data-i18n="th_age">Age</th><th data-i18n="th_class">Class</th><th data-i18n="th_group">Group</th><th>❤️ HR</th><th>🧠 EEG</th><th>👟 Track</th><th data-i18n="th_last_hr">Last HR</th><th data-i18n="th_action">Actions</th></tr></thead><tbody id="stuTable"></tbody></table></div><div class="mt-8"><span class="text-sm text-dim" id="stuCount"></span></div></div>
<div class="modal-overlay" id="stuModal"><div class="modal" style="max-width:600px"><div class="modal-title" id="stuModalTitle" data-i18n="add_student">添加学员</div><input type="hidden" id="stuEditId">
  <div class="grid-2 gap-8"><div class="form-group"><label class="form-label" data-i18n="f_name">姓名*</label><input class="form-input" id="stuName"></div><div class="form-group"><label class="form-label" data-i18n="f_sid">学号</label><input class="form-input" id="stuId"></div><div class="form-group"><label class="form-label" data-i18n="f_age">年龄</label><input class="form-input" id="stuAge" type="number"></div><div class="form-group"><label class="form-label" data-i18n="f_class">班级</label><input class="form-input" id="stuClass"></div><div class="form-group"><label class="form-label" data-i18n="f_group">小组</label><input class="form-input" id="stuGroup"></div><div class="form-group"><label class="form-label" data-i18n="f_device">设备编号</label><input class="form-input" id="stuDevice"></div></div>
  <div class="form-group mt-8"><label class="form-label" data-i18n="f_note">备注</label><input class="form-input" id="stuProfile"></div>
  <div class="flex-row gap-8 mt-16" style="justify-content:flex-end"><button class="btn btn-sm" onclick="closeStuModal()" data-i18n="cancel">取消</button><button class="btn btn-sm btn-primary" onclick="saveStudent()" data-i18n="save">保存</button></div></div></div>`;

// ─────── 7. ARCHIVES ───────
PAGES.archives = () => `
<div class="page-header"><div><div class="page-title" data-i18n="arch_title">TRAINEE ARCHIVES</div><div class="page-subtitle" data-i18n="arch_sub">学员档案检索 · 历史数据回溯</div></div>
  <input class="form-input" style="width:220px;padding:6px 10px" id="archSearch" oninput="searchArchives()" data-i18n-ph="search_ph"></div>
<div class="grid-2" id="archList"></div>
<div class="card mt-16" id="archDetail" style="display:none"><div class="card-title" id="archDetailTitle"></div><div class="grid-2"><div id="archInfo"></div><div><div class="card-title" data-i18n="train_history">📊 历史训练记录</div><div class="table-wrap"><table><thead><tr><th data-i18n="th_date">日期</th><th data-i18n="th_hr">心率</th><th data-i18n="th_level">难度</th><th data-i18n="th_score">成绩</th></tr></thead><tbody id="archHistory"></tbody></table></div></div></div></div>`;

// ─────── 8. SETTINGS ───────
PAGES.settings = () => `
<div class="page-header"><div><div class="page-title" data-i18n="set_title">SYSTEM SETTINGS</div><div class="page-subtitle" data-i18n="set_sub">系统基础设置</div></div>
  <button class="btn btn-sm btn-primary" onclick="saveSettingsUI()" data-i18n="save_settings">💾 保存设置</button></div>
<div class="grid-2">
  <div class="card"><div class="card-title" data-i18n="comm_config">📡 通信配置</div>
    <div class="form-group"><label class="form-label">WebSocket</label><input class="form-input" id="setPort" type="number" value="5180"></div>
    <div class="form-group flex-between"><label class="form-label" data-i18n="auto_connect">Unity 自动连接</label><label class="toggle"><input type="checkbox" id="setAutoConnect" checked><span class="toggle-slider"></span></label></div></div>
  <div class="card"><div class="card-title" data-i18n="ui_config">🎨 界面配置</div>
    <div class="form-group"><label class="form-label" data-i18n="brightness">亮度 <span id="setBrightVal">100</span>%</label><input type="range" min="50" max="150" value="100" id="setBright" style="width:100%;accent-color:var(--cyan)" oninput="document.getElementById('setBrightVal').textContent=this.value;document.body.style.filter='brightness('+this.value/100+')'"></div>
    <div class="form-group"><label class="form-label" data-i18n="lang_label">语言 Language</label><div class="flex-row gap-8">
      <button class="btn btn-sm btn-primary" id="langZH" onclick="setLanguage('zh')">🇨🇳 中文</button>
      <button class="btn btn-sm" id="langEN" onclick="setLanguage('en')">🇺🇸 English</button>
      <button class="btn btn-sm" id="langTH" onclick="setLanguage('th')">🇹🇭 ไทย</button></div></div>
</div>`;

// ─────── 9. REPORT (Cyberpunk霓虹成绩雷达图评估报告) ───────
PAGES.report = () => `
<div class="page-header print-hide">
  <div>
    <div class="page-title" data-i18n="report_title">评估报告 / EVALUATION REPORT</div>
    <div class="page-subtitle" data-i18n="report_sub">射击实训档案 · 五维雷达评估</div>
  </div>
  <div class="flex-row gap-8">
    <button class="btn-back" onclick="navigate('training')" data-i18n="btn_back">◀ 返回训练控制</button>
    <button class="btn btn-primary" onclick="window.print()">🖨️ 打印 / 导出 PDF</button>
  </div>
</div>

<div class="report-container">
  <div class="report-header">
    <div class="report-logo">VR MILITARY SHOT TRAINING SYSTEM</div>
    <h1 class="report-title">学员射击科目自适应训练综合评估报告</h1>
    <p class="report-sub">VR MILITARY TACTICAL SHOOTING ADAPTIVE ASSESSMENT REPORT</p>
  </div>
  
  <div class="report-grid">
    <!-- 左边：学员信息与成绩卡片 -->
    <div class="report-card">
      <div class="report-card-title">👤 学员基本档案 / STUDENT DOSSIER</div>
      <div class="report-info-grid">
        <div class="info-item"><span class="info-label">学员姓名：</span><span class="info-val" id="repName">张同学</span></div>
        <div class="info-item"><span class="info-label">学员学号：</span><span class="info-val" id="repId">2026010042</span></div>
        <div class="info-item"><span class="info-label">实训科目：</span><span class="info-val" id="repSubject">射击场自适应训练</span></div>
        <div class="info-item"><span class="info-label">训练枪械：</span><span class="info-val" id="repWeapon">HK-416</span></div>
        <div class="info-item"><span class="info-label">训练时长：</span><span class="info-val" id="repDuration">0.0s</span></div>
        <div class="info-item"><span class="info-label">评估时间：</span><span class="info-val" id="repTime">2026-05-21 18:35</span></div>
      </div>
      
      <div class="report-card-title" style="margin-top:20px">📊 射击数据统计 / STATISTICAL DATA</div>
      <div class="report-stats-grid">
        <div class="rep-stat-box"><span class="val text-cyan" id="repShots">0</span><span class="lbl">总击发数 (Shots)</span></div>
        <div class="rep-stat-box"><span class="val text-green" id="repHits">0</span><span class="lbl">命中次数 (Hits)</span></div>
        <div class="rep-stat-box"><span class="val text-yellow" id="repHR">0</span><span class="lbl">平均心率 (BPM)</span></div>
        <div class="rep-stat-box"><span class="val text-magenta" id="repAligned">0</span><span class="lbl">屏息击发 (Breath-Aligned)</span></div>
      </div>
    </div>

    <!-- 右边：五维霓虹雷达图 -->
    <div class="report-card flex-center-col" style="position:relative">
      <div class="report-card-title" style="align-self:flex-start">🧬 技战术水平评估 / RADAR ASSESSMENT</div>
      <div class="radar-canvas-wrap">
        <canvas id="radarCanvas" width="360" height="360"></canvas>
      </div>
      <div class="metrics-list" id="repMetricsList">
        <!-- 五个维度的分数 -->
      </div>
    </div>
  </div>

  <div class="report-evaluation mt-16">
    <div class="report-card-title">📝 教官评语与提升建议 / EVALUATION &amp; SUGGESTIONS</div>
    <div class="eval-text" id="repEvaluationText">
      该学员在实训期间能够较好地配合心率自适应调整。在呼吸引导开启时，能掌握在呼气屏息的瞬间进行击发，据枪平稳度提升明显。建议后续进一步加强对于中远距离移动靶节奏的把握，并在心率升高状态下保持心率调控的主动性，以实现更平滑的据枪控制。
    </div>
  </div>

  <!-- 签字盖章区 -->
  <div class="report-signatures">
    <div class="sig-col">
      <div class="sig-line"></div>
      <p>学员手写签字 (Signature)</p>
    </div>
    <div class="sig-col">
      <div class="sig-line"></div>
      <p>教官签字审核 (Instructor)</p>
    </div>
    <div class="sig-col stamp-col">
      <div class="stamp-circle">
        <span>军训教研室</span>
        <span class="stamp-date">2026.05.21</span>
        <span>合 格</span>
      </div>
      <p>实训鉴定专用章 (Seal)</p>
    </div>
  </div>
</div>
`;

// ─────── 10. RESULTS (Training Assessment + Statistics) ───────
PAGES.results = () => `
<div class="page-header">
  <div><div class="page-title" data-i18n="res_title">TRAINING RESULTS</div><div class="page-subtitle" data-i18n="res_sub">VR Training Assessment · Statistical Analysis</div></div>
  <div class="flex-row gap-8">
    <button class="btn-back" onclick="backToModeSelect()" data-i18n="btn_back">◀ Back</button>
    <button class="btn btn-sm btn-primary" onclick="showResEntryModal()">＋ Add Score</button>
    <button class="btn btn-sm btn-success" onclick="importResultsExcel()">📊 Import Excel</button>
    <button class="btn btn-sm" onclick="showNewProjectModal()">📁 New Project</button>
    <button class="btn btn-sm" onclick="exportResultsCSV()">📤 Export CSV</button>
  </div>
</div>

<!-- Project Selector -->
<div class="card mb-16">
  <div class="flex-row gap-8" style="align-items:center">
    <span class="fw-bold" data-i18n="res_project">Project:</span>
    <select class="form-input" id="resProjectSelect" style="flex:1;padding:8px" onchange="loadResultsProject()"></select>
    <button class="btn btn-sm" onclick="deleteCurrentProject()" style="color:var(--red)">🗑️</button>
  </div>

</div>

<!-- Overview Stats -->
<div class="stats-bar mb-16">
  <div class="sb-item"><span class="sb-val text-cyan" id="resTotalStudents">0</span><span class="sb-label" data-i18n="res_total_students">Students</span></div>
  <div class="sb-item"><span class="sb-val text-green" id="resAvgTotal">0</span><span class="sb-label" data-i18n="res_avg_score">Avg Score</span></div>
  <div class="sb-item"><span class="sb-val text-yellow" id="resPassRate">0%</span><span class="sb-label" data-i18n="res_pass_rate">Pass Rate</span></div>
  <div class="sb-item"><span class="sb-val text-magenta" id="resTopGrade">--</span><span class="sb-label" data-i18n="res_top_grade">Top Grade</span></div>
</div>

<!-- Score Breakdown: Written vs VR -->
<div class="grid-2 mb-16">
  <div class="card">
    <div class="card-title">📝 Written Tests (40%)</div>
    <div class="grid-3" style="gap:8px">
      <div style="text-align:center;padding:8px;border:1px solid var(--border);border-radius:4px">
        <div class="text-sm text-dim">STAI-S</div>
        <div class="fw-bold text-cyan" id="resAvgSTAI" style="font-size:20px">--</div>
        <div class="text-xs text-dim">Anxiety (20-80)</div>
      </div>
      <div style="text-align:center;padding:8px;border:1px solid var(--border);border-radius:4px">
        <div class="text-sm text-dim">UEQ</div>
        <div class="fw-bold text-green" id="resAvgUEQ" style="font-size:20px">--</div>
        <div class="text-xs text-dim">UX (-3~3)</div>
      </div>
      <div style="text-align:center;padding:8px;border:1px solid var(--border);border-radius:4px">
        <div class="text-sm text-dim">SSQ</div>
        <div class="fw-bold text-yellow" id="resAvgSSQ" style="font-size:20px">--</div>
        <div class="text-xs text-dim">Sickness (0-235)</div>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="card-title">🎯 VR Training Data (60%)</div>
    <div class="grid-3" style="gap:8px">
      <div style="text-align:center;padding:8px;border:1px solid var(--border);border-radius:4px">
        <div class="text-sm text-dim">Accuracy</div>
        <div class="fw-bold text-green" id="resAvgAcc" style="font-size:20px">--%</div>
      </div>
      <div style="text-align:center;padding:8px;border:1px solid var(--border);border-radius:4px">
        <div class="text-sm text-dim">Breath Sync</div>
        <div class="fw-bold text-blue" id="resAvgBreath" style="font-size:20px">--%</div>
      </div>
      <div style="text-align:center;padding:8px;border:1px solid var(--border);border-radius:4px">
        <div class="text-sm text-dim">Posture</div>
        <div class="fw-bold text-magenta" id="resAvgPosture" style="font-size:20px">--%</div>
      </div>
    </div>
  </div>
</div>

<!-- Statistical Analysis Charts -->
<div class="grid-2 mb-16">
  <div class="card"><div class="card-title">📈 Score Distribution</div><canvas id="resDistChart" height="200"></canvas></div>
  <div class="card"><div class="card-title">📊 Grade Distribution</div><canvas id="resGradeChart" height="200"></canvas></div>
</div>

<!-- Descriptive Statistics -->
<div class="card mb-16">
  <div class="card-title">📐 Descriptive Statistics</div>
  <div class="table-wrap"><table>
    <thead><tr><th>Metric</th><th>Mean</th><th>Median</th><th>Std Dev</th><th>Min</th><th>Max</th><th>Range</th></tr></thead>
    <tbody id="resStatsTable"></tbody>
  </table></div>
</div>

<!-- Transcript Table -->
<div class="card mb-16">
  <div class="flex-between mb-8">
    <div class="card-title" data-i18n="res_transcript">📋 Student Transcripts</div>
    <div class="flex-row gap-8">
      <button class="btn btn-sm" onclick="batchExportPDF('combined')" title="All students in one PDF">📄 Batch PDF (Combined)</button>
      <button class="btn btn-sm" onclick="batchExportPDF('individual')" title="One PDF per student">📑 Batch PDF (Individual)</button>
      <button class="btn btn-sm" onclick="api.results.openExportDir()">📂 Open Folder</button>
      <input class="form-input" style="width:160px;padding:6px 10px" placeholder="Search..." id="resSearch" oninput="filterResultsTable()">
    </div>
  </div>
  <div class="table-wrap"><table>
    <thead><tr>
      <th>#</th><th data-i18n="th_sid">ID</th><th data-i18n="th_name">Name</th>
      <th>STAI</th><th>UEQ</th><th>SSQ</th><th>Written</th>
      <th>Accuracy</th><th>Breath</th><th>VR Score</th>
      <th>Total</th><th>Grade</th><th>Actions</th>
    </tr></thead>
    <tbody id="resTranscriptTable"></tbody>
  </table></div>
</div>

<!-- Individual Detail (shown on click) -->
<div class="card" id="resDetailCard" style="display:none">
  <div class="flex-between mb-8">
    <div class="card-title" id="resDetailTitle">📄 Student Detail</div>
    <div class="flex-row gap-8">
      <button class="btn btn-sm btn-primary" id="resDetailPdfBtn" onclick="exportStudentPDF()">📄 Export PDF</button>
      <button class="btn btn-sm" onclick="document.getElementById('resDetailCard').style.display='none'">✕ Close</button>
    </div>
  </div>
  <div class="grid-2">
    <div>
      <div class="text-sm" style="line-height:2.2" id="resDetailInfo"></div>
    </div>
    <div style="display:flex;justify-content:center;align-items:center">
      <canvas id="resDetailRadar" width="260" height="260"></canvas>
    </div>
  </div>
</div>
`;
