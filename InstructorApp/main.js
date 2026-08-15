const { app, BrowserWindow, ipcMain, dialog, session } = require('electron');
const path = require('path');
const fs = require('fs');
const { WebSocketServer } = require('ws');
let XLSX;
try { XLSX = require('xlsx'); } catch(e) { console.warn('[XLSX] xlsx module not available, Excel import disabled'); }

// ═══ Enable Web Bluetooth in Electron ═══
app.commandLine.appendSwitch('enable-experimental-web-platform-features');
app.commandLine.appendSwitch('enable-web-bluetooth', 'true');

// ═══════════════════════════════════════════════════
//  Paths
// ═══════════════════════════════════════════════════
const IS_DEV = !app.isPackaged;
const APP_ROOT = IS_DEV ? __dirname : path.dirname(app.getPath('exe'));
const DATA_DIR = path.join(APP_ROOT, 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const STUDENTS_FILE = path.join(DATA_DIR, 'students.json');
const TRAINING_FILE = path.join(DATA_DIR, 'training_history.json');
const EXPORT_DIR = path.join(DATA_DIR, 'exports');
const PHOTOS_DIR = path.join(DATA_DIR, 'photos');
const RESULTS_DIR = path.join(DATA_DIR, 'results');

// Ensure data directories exist
[DATA_DIR, EXPORT_DIR, PHOTOS_DIR, RESULTS_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

// ═══════════════════════════════════════════════════
//  Settings
// ═══════════════════════════════════════════════════
let settings = {
  wsPort: 5180,
  unityAutoConnect: true,
  theme: 'dark',
  brightness: 100,
  dataPath: DATA_DIR,
  language: 'zh-CN'
};

function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      settings = { ...settings, ...JSON.parse(raw) };
    }
  } catch (e) { console.error('[Settings] Load failed:', e.message); }
}

function saveSettings() {
  try { fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8'); }
  catch (e) { console.error('[Settings] Save failed:', e.message); }
}

loadSettings();

// ═══════════════════════════════════════════════════
//  Students Database (JSON file-based)
// ═══════════════════════════════════════════════════
let students = [];

function loadStudents() {
  try {
    if (fs.existsSync(STUDENTS_FILE)) {
      students = JSON.parse(fs.readFileSync(STUDENTS_FILE, 'utf-8'));
    }
  } catch (e) { console.error('[DB] Load students failed:', e.message); students = []; }
}

function saveStudents() {
  try { fs.writeFileSync(STUDENTS_FILE, JSON.stringify(students, null, 2), 'utf-8'); }
  catch (e) { console.error('[DB] Save students failed:', e.message); }
}

loadStudents();

// Auto-generate 30 student templates on first run
if (students.length === 0) {
  const surnames = ['王','李','张','刘','陈','杨','赵','黄','周','吴','徐','孙','胡','朱','高','林','何','郭','马','罗'];
  const names = ['明','华','强','伟','军','磊','涛','杰','鹏','飞','超','博','宇','浩','志','国','建','文','辉','亮','龙','威','刚','勇','鑫'];
  for (let i = 0; i < 30; i++) {
    students.push({
      id: `S${2026010001 + i}`,
      name: surnames[i % surnames.length] + names[Math.floor(i / surnames.length)] + names[(i * 3 + 7) % names.length],
      studentId: `${2026010001 + i}`,
      age: `${18 + Math.floor(Math.random() * 4)}`,
      className: `${Math.floor(i / 10) + 1}班`,
      group: `${(i % 5) + 1}组`,
      sensorId: `SEN-${String(i + 1).padStart(3, '0')}`,
      profile: '',
      photo: '',
      createdAt: new Date().toISOString(),
      trainingRecords: [],
      lastTrainingHR: null,
      lastTrainingLevel: null,
      lastTrainingScore: null
    });
  }
  saveStudents();
  console.log('[DB] Auto-generated 30 student templates');
}

// Training history
let trainingHistory = [];
function loadTrainingHistory() {
  try { if (fs.existsSync(TRAINING_FILE)) trainingHistory = JSON.parse(fs.readFileSync(TRAINING_FILE, 'utf-8')); }
  catch(e) { trainingHistory = []; }
}
function saveTrainingHistory() {
  try { fs.writeFileSync(TRAINING_FILE, JSON.stringify(trainingHistory, null, 2), 'utf-8'); } catch(e) {}
}
loadTrainingHistory();

// ═══════════════════════════════════════════════════
//  WebSocket Server (Unity Bridge)
// ═══════════════════════════════════════════════════
let wss = null;
let unityClients = new Set();
let mainWindow = null;
let currentWSHost = '127.0.0.1'; // Default to localhost (no firewall)

function startWSServer(retryPort, host) {
  const port = retryPort || settings.wsPort || 5180;
  const bindHost = host || currentWSHost || '127.0.0.1';
  try {
    wss = new WebSocketServer({ port, host: bindHost });

    wss.on('listening', () => {
      console.log(`[WS] Server listening on ws://${bindHost}:${port}`);
      settings.wsPort = port;
      currentWSHost = bindHost;
      notifyRenderer('ws:server-started', { port, host: bindHost });
    });

    wss.on('connection', (ws, req) => {
      const ip = req.socket.remoteAddress;
      console.log(`[WS] Client connected: ${ip}`);
      unityClients.add(ws);
      notifyRenderer('ws:client-connected', { ip, count: unityClients.size });

      ws.on('message', (data) => {
        const msg = data.toString();
        try {
          const parsed = JSON.parse(msg);

          // Handle login request from Unity
          if (parsed.type === 'LOGIN_REQUEST') {
            const { studentId, name } = parsed;
            const student = students.find(s =>
              s.studentId === studentId && s.name === name
            );

            if (student) {
              const response = {
                type: 'LOGIN_RESPONSE',
                success: true,
                student: {
                  id: student.id,
                  name: student.name,
                  studentId: student.studentId,
                  className: student.className,
                  group: student.group,
                  sensorId: student.sensorId
                }
              };
              ws.send(JSON.stringify(response));
              console.log(`[Auth] Login success: ${student.name} (${student.studentId})`);
            } else {
              const response = {
                type: 'LOGIN_RESPONSE',
                success: false,
                message: '学号或姓名错误，请重新输入'
              };
              ws.send(JSON.stringify(response));
              console.log(`[Auth] Login failed: ${studentId} / ${name}`);
            }
            return;
          }

          notifyRenderer('ws:message', parsed);
        } catch (e) {
          notifyRenderer('ws:message', { type: 'RAW', data: msg });
        }
      });

      ws.on('close', () => {
        unityClients.delete(ws);
        notifyRenderer('ws:client-disconnected', { count: unityClients.size });
      });

      ws.on('error', (err) => console.error(`[WS] Client error:`, err.message));
    });

    wss.on('error', (err) => {
      if (err.code === 'EADDRINUSE' && port < 5190) {
        console.log(`[WS] Port ${port} busy, trying ${port+1}...`);
        wss = null;
        startWSServer(port + 1, bindHost);
      } else {
        console.error(`[WS] Server error:`, err.message);
        notifyRenderer('ws:error', { message: err.message });
      }
    });
  } catch (e) {
    console.error(`[WS] Failed to start server:`, e.message);
  }
}

function broadcastToUnity(message) {
  const json = typeof message === 'string' ? message : JSON.stringify(message);
  let sent = 0;
  unityClients.forEach(ws => {
    if (ws.readyState === 1) { // WebSocket.OPEN
      ws.send(json);
      sent++;
    }
  });
  return sent;
}

function notifyRenderer(channel, data) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, data);
  }
}

// ═══════════════════════════════════════════════════
//  IPC Handlers
// ═══════════════════════════════════════════════════
function setupIPC() {
  // --- Settings ---
  ipcMain.handle('settings:get', () => settings);
  ipcMain.handle('settings:set', (_, newSettings) => {
    settings = { ...settings, ...newSettings };
    saveSettings();
    return settings;
  });

  // --- Students ---
  ipcMain.handle('students:list', () => students);
  ipcMain.handle('students:add', (_, student) => {
    student.id = student.id || `S${Date.now()}`;
    student.createdAt = new Date().toISOString();
    students.push(student);
    saveStudents();
    return student;
  });
  ipcMain.handle('students:update', (_, student) => {
    const idx = students.findIndex(s => s.id === student.id);
    if (idx >= 0) { students[idx] = { ...students[idx], ...student }; saveStudents(); }
    return students[idx];
  });
  ipcMain.handle('students:delete', (_, id) => {
    students = students.filter(s => s.id !== id);
    saveStudents();
    return true;
  });
  ipcMain.handle('students:search', (_, query) => {
    const q = query.toLowerCase();
    return students.filter(s =>
      (s.name || '').toLowerCase().includes(q) ||
      (s.studentId || '').toLowerCase().includes(q) ||
      (s.className || '').toLowerCase().includes(q)
    );
  });

  // --- Data Export/Import (local files) ---
  ipcMain.handle('data:export', async () => {
    const filePath = path.join(EXPORT_DIR, `students_backup_${Date.now()}.json`);
    fs.writeFileSync(filePath, JSON.stringify(students, null, 2), 'utf-8');
    return { success: true, path: filePath, count: students.length };
  });
  ipcMain.handle('data:import', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '导入学员数据',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile']
    });
    if (result.canceled) return { success: false };
    try {
      const raw = fs.readFileSync(result.filePaths[0], 'utf-8');
      const imported = JSON.parse(raw);
      if (Array.isArray(imported)) {
        students = imported;
        saveStudents();
        return { success: true, count: imported.length };
      }
      return { success: false, error: '数据格式错误' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
  ipcMain.handle('data:download-all', async () => {
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: '导出全部学员数据',
      defaultPath: `students_${new Date().toISOString().slice(0,10)}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    });
    if (canceled) return { success: false };
    fs.writeFileSync(filePath, JSON.stringify(students, null, 2), 'utf-8');
    return { success: true, path: filePath, count: students.length };
  });

  // --- Excel Import ---
  ipcMain.handle('data:import-excel', async () => {
    if (!XLSX) return { success: false, error: 'xlsx模块未安装' };
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '导入Excel学员数据',
      filters: [{ name: 'Excel', extensions: ['xlsx','xls','csv'] }],
      properties: ['openFile']
    });
    if (result.canceled) return { success: false };
    try {
      const wb = XLSX.readFile(result.filePaths[0]);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws);
      const fieldMap = { '姓名':'name','学号':'studentId','年龄':'age','班级':'className','小组':'group','组别':'group','设备编号':'sensorId','备注':'profile' };
      const imported = rows.map(r => {
        const s = { id:`S${Date.now()}_${Math.random().toString(36).slice(2,6)}`, createdAt:new Date().toISOString(), trainingRecords:[] };
        for (const [cn, en] of Object.entries(fieldMap)) { if (r[cn] !== undefined) s[en] = String(r[cn]); }
        // fallback: use English column names too
        for (const [k,v] of Object.entries(r)) { if (!s[k] && typeof v !== 'object') s[k.toLowerCase()] = String(v); }
        return s;
      }).filter(s => s.name);
      students.push(...imported);
      saveStudents();
      return { success: true, count: imported.length };
    } catch(e) { return { success: false, error: e.message }; }
  });

  // --- Training History ---
  ipcMain.handle('training:save', (_, record) => {
    record.timestamp = new Date().toISOString();
    trainingHistory.push(record);
    saveTrainingHistory();
    // Also update student's last training data
    const idx = students.findIndex(s => s.id === record.studentId);
    if (idx >= 0) {
      students[idx].lastTrainingHR = record.avgHR;
      students[idx].lastTrainingLevel = record.level;
      students[idx].lastTrainingScore = record.score;
      students[idx].lastTrainingDate = record.timestamp;
      if (!students[idx].trainingRecords) students[idx].trainingRecords = [];
      students[idx].trainingRecords.push(record);
      saveStudents();
    }
    return true;
  });
  ipcMain.handle('training:history', (_, studentId) => {
    if (studentId) return trainingHistory.filter(r => r.studentId === studentId);
    return trainingHistory;
  });

  // --- Photo ---
  ipcMain.handle('students:set-photo', async (_, studentId) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '选择学员照片',
      filters: [{ name: 'Images', extensions: ['jpg','jpeg','png','webp'] }],
      properties: ['openFile']
    });
    if (result.canceled) return { success: false };
    const ext = path.extname(result.filePaths[0]);
    const dest = path.join(PHOTOS_DIR, `${studentId}${ext}`);
    fs.copyFileSync(result.filePaths[0], dest);
    const idx = students.findIndex(s => s.id === studentId);
    if (idx >= 0) { students[idx].photo = dest; saveStudents(); }
    return { success: true, path: dest };
  });

  // --- WebSocket ---
  ipcMain.handle('ws:send', (_, message) => {
    const sent = broadcastToUnity(message);
    return { sent, total: unityClients.size };
  });
  ipcMain.handle('ws:status', () => ({
    running: !!wss,
    port: settings.wsPort,
    host: currentWSHost,
    clients: unityClients.size
  }));
  ipcMain.handle('ws:restart', () => {
    if (wss) { wss.close(); unityClients.clear(); }
    startWSServer(null, currentWSHost);
    return true;
  });
  ipcMain.handle('ws:set-mode', (_, mode) => {
    // mode: 'network' = 0.0.0.0 (WiFi/LAN), 'localhost' = 127.0.0.1 (Unity Editor)
    const newHost = mode === 'network' ? '0.0.0.0' : '127.0.0.1';
    console.log(`[WS] Switching mode to ${mode} (${newHost})`);
    if (wss) { wss.close(); unityClients.clear(); }
    currentWSHost = newHost;
    startWSServer(null, newHost);
    return { mode, host: newHost, port: settings.wsPort };
  });
  ipcMain.handle('ws:get-mode', () => ({
    mode: currentWSHost === '0.0.0.0' ? 'network' : 'localhost',
    host: currentWSHost,
    port: settings.wsPort
  }));

  // --- System ---
  ipcMain.handle('system:dataPath', () => DATA_DIR);
  ipcMain.handle('system:appVersion', () => app.getVersion());

  // --- Results ---
  const RESULTS_PATH = path.join(RESULTS_DIR, 'results.json');
  ipcMain.handle('results:load', () => {
    try {
      // Migrate: if old location exists, move it
      const oldPath = path.join(DATA_DIR, 'results.json');
      if (!fs.existsSync(RESULTS_PATH) && fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, RESULTS_PATH);
        console.log('[Results] Migrated results.json to results/ folder');
      }
      if (fs.existsSync(RESULTS_PATH)) {
        return JSON.parse(fs.readFileSync(RESULTS_PATH, 'utf8'));
      }
    } catch (e) { console.error('[Results] Load error:', e.message); }
    return { projects: [] };
  });
  ipcMain.handle('results:save', (_, data) => {
    fs.writeFileSync(RESULTS_PATH, JSON.stringify(data, null, 2), 'utf8');
    return { success: true };
  });
  ipcMain.handle('results:path', () => RESULTS_DIR);
  ipcMain.handle('results:import', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Import Results Data',
      defaultPath: RESULTS_DIR,
      filters: [
        { name: 'All Supported', extensions: ['json','xlsx','xls','csv'] },
        { name: 'JSON', extensions: ['json'] },
        { name: 'Excel', extensions: ['xlsx','xls','csv'] }
      ],
      properties: ['openFile']
    });
    if (result.canceled) return { success: false };
    const filePath = result.filePaths[0];
    const ext = path.extname(filePath).toLowerCase();
    try {
      if (ext === '.json') {
        const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return { success: true, type: 'json', data: raw };
      } else {
        // Excel/CSV
        if (!XLSX) return { success: false, error: 'xlsx module not available' };
        const wb = XLSX.readFile(filePath);
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws);
        return { success: true, type: 'excel', rows };
      }
    } catch(e) { return { success: false, error: e.message }; }
  });

  // --- PDF Export ---
  const PDF_EXPORT_DIR = path.join(RESULTS_DIR, 'exports');
  if (!fs.existsSync(PDF_EXPORT_DIR)) fs.mkdirSync(PDF_EXPORT_DIR, { recursive: true });

  ipcMain.handle('results:exportPDF', async (_, { html, filename }) => {
    try {
      const pdfWin = new BrowserWindow({ show: false, width: 800, height: 1130, webPreferences: { offscreen: true } });
      await pdfWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
      await new Promise(r => setTimeout(r, 500)); // wait for render
      const pdfData = await pdfWin.webContents.printToPDF({ 
        marginsType: 0, printBackground: true, 
        pageSize: 'A4', landscape: false 
      });
      const outPath = path.join(PDF_EXPORT_DIR, filename);
      fs.writeFileSync(outPath, pdfData);
      pdfWin.close();
      return { success: true, path: outPath };
    } catch (e) { return { success: false, error: e.message }; }
  });

  ipcMain.handle('results:openExportDir', () => {
    if (!fs.existsSync(PDF_EXPORT_DIR)) fs.mkdirSync(PDF_EXPORT_DIR, { recursive: true });
    require('electron').shell.openPath(PDF_EXPORT_DIR);
    return { success: true };
  });
}

// ═══════════════════════════════════════════════════
//  Window
// ═══════════════════════════════════════════════════
// ═══════════════════════════════════════════════════
//  BLE State (for Polar device tracking)
// ═══════════════════════════════════════════════════
let bleState = {
  scanning: false,
  foundDevices: [],
  connectedDevice: null,
  heartRate: 0,
  battery: -1
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    frame: false,           // Custom titlebar
    transparent: false,
    backgroundColor: '#0a0e1a',
    icon: path.join(__dirname, 'src', 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // ── Grant Bluetooth permissions automatically ──
  mainWindow.webContents.session.setPermissionCheckHandler((webContents, permission) => {
    if (permission === 'bluetooth') return true;
    return true;
  });
  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'bluetooth') {
      callback(true);
      return;
    }
    callback(true);
  });

  // ── Web Bluetooth: Auto-select Polar devices (no system dialog) ──
  mainWindow.webContents.on('select-bluetooth-device', (event, devices, callback) => {
    event.preventDefault();
    console.log('[BLE] Scan update, devices:', devices.map(d => `${d.deviceName}(${d.deviceId})`));

    // Notify renderer of found devices
    devices.forEach(d => {
      const exists = bleState.foundDevices.find(fd => fd.deviceId === d.deviceId);
      if (!exists && d.deviceName) {
        bleState.foundDevices.push({
          deviceId: d.deviceId,
          deviceName: d.deviceName || 'Unknown',
          rssi: -60
        });
      }
    });
    notifyRenderer('ble:devices-found', bleState.foundDevices);

    // Auto-select first Polar device if found
    const polar = devices.find(d => d.deviceName && d.deviceName.toLowerCase().includes('polar'));
    if (polar) {
      console.log(`[BLE] Auto-selecting Polar: ${polar.deviceName}`);
      callback(polar.deviceId);
    }
    // IMPORTANT: Do NOT call callback('') — that cancels the scan!
    // If no Polar found yet, just return without calling callback.
    // Electron will keep scanning and fire this event again.
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  if (IS_DEV) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ═══════════════════════════════════════════════════
//  App Lifecycle
// ═══════════════════════════════════════════════════
app.whenReady().then(() => {
  setupIPC();
  setupBLEIPC();
  createWindow();
  startWSServer();
});

// ═══════════════════════════════════════════════════
//  BLE IPC Handlers
// ═══════════════════════════════════════════════════
function setupBLEIPC() {
  ipcMain.handle('ble:status', () => bleState);
  ipcMain.handle('ble:clear-devices', () => {
    bleState.foundDevices = [];
    return true;
  });
  ipcMain.on('ble:heart-rate-update', (_, hr) => {
    bleState.heartRate = hr;
    bleState.connectedDevice = true;

    // 广播心率数据到所有连接的 Unity 客户端 (使用 Unity 识别的 HR_DATA 格式)
    const hrData = {
      type: 'HR_DATA',
      data: {
        hr: hr,
        hrv: bleState.battery || 45,
        timestamp: Date.now()
      }
    };
    broadcastToUnity(hrData);
    console.log(`[HeartRate] Broadcast to Unity: HR=${hr}`);
  });
  ipcMain.on('ble:device-connected', (_, info) => {
    bleState.connectedDevice = info;
    console.log(`[BLE] Device connected: ${info.name}`);
  });
  ipcMain.on('ble:device-disconnected', () => {
    bleState.connectedDevice = null;
    bleState.heartRate = 0;
    console.log('[BLE] Device disconnected');
  });
  ipcMain.on('ble:battery-update', (_, level) => {
    bleState.battery = level;
  });
}

app.on('window-all-closed', () => {
  if (wss) wss.close();
  app.quit();
});

// IPC for frameless window controls
ipcMain.on('win:minimize', () => mainWindow?.minimize());
ipcMain.on('win:maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.on('win:close', () => mainWindow?.close());
