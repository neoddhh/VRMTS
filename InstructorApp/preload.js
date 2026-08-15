const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // ─── Settings ───
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    set: (s) => ipcRenderer.invoke('settings:set', s),
  },

  // ─── Students ───
  students: {
    list: () => ipcRenderer.invoke('students:list'),
    add: (s) => ipcRenderer.invoke('students:add', s),
    update: (s) => ipcRenderer.invoke('students:update', s),
    delete: (id) => ipcRenderer.invoke('students:delete', id),
    search: (q) => ipcRenderer.invoke('students:search', q),
    setPhoto: (id) => ipcRenderer.invoke('students:set-photo', id),
  },

  // ─── Data Sync ───
  data: {
    exportAll: () => ipcRenderer.invoke('data:export'),
    importFile: () => ipcRenderer.invoke('data:import'),
    importExcel: () => ipcRenderer.invoke('data:import-excel'),
    downloadAll: () => ipcRenderer.invoke('data:download-all'),
  },

  // ─── Training ───
  training: {
    save: (record) => ipcRenderer.invoke('training:save', record),
    history: (studentId) => ipcRenderer.invoke('training:history', studentId),
  },

  // ─── WebSocket ───
  ws: {
    send: (msg) => ipcRenderer.invoke('ws:send', msg),
    status: () => ipcRenderer.invoke('ws:status'),
    restart: () => ipcRenderer.invoke('ws:restart'),
    setMode: (mode) => ipcRenderer.invoke('ws:set-mode', mode),
    getMode: () => ipcRenderer.invoke('ws:get-mode'),
    onMessage: (cb) => ipcRenderer.on('ws:message', (_, data) => cb(data)),
    onClientConnected: (cb) => ipcRenderer.on('ws:client-connected', (_, d) => cb(d)),
    onClientDisconnected: (cb) => ipcRenderer.on('ws:client-disconnected', (_, d) => cb(d)),
    onServerStarted: (cb) => ipcRenderer.on('ws:server-started', (_, d) => cb(d)),
    onError: (cb) => ipcRenderer.on('ws:error', (_, d) => cb(d)),
  },

  // ─── Window Controls ───
  win: {
    minimize: () => ipcRenderer.send('win:minimize'),
    maximize: () => ipcRenderer.send('win:maximize'),
    close: () => ipcRenderer.send('win:close'),
  },

  // ─── System ───
  system: {
    dataPath: () => ipcRenderer.invoke('system:dataPath'),
    appVersion: () => ipcRenderer.invoke('system:appVersion'),
  },

  // ─── Results ───
  results: {
    load: () => ipcRenderer.invoke('results:load'),
    save: (data) => ipcRenderer.invoke('results:save', data),
    importData: () => ipcRenderer.invoke('results:import'),
    getPath: () => ipcRenderer.invoke('results:path'),
    exportPDF: (opts) => ipcRenderer.invoke('results:exportPDF', opts),
    openExportDir: () => ipcRenderer.invoke('results:openExportDir'),
  },

  // ─── BLE / Polar ───
  ble: {
    status: () => ipcRenderer.invoke('ble:status'),
    clearDevices: () => ipcRenderer.invoke('ble:clear-devices'),
    onDevicesFound: (cb) => ipcRenderer.on('ble:devices-found', (_, d) => cb(d)),
    notifyHeartRate: (hr) => ipcRenderer.send('ble:heart-rate-update', hr),
    notifyConnected: (info) => ipcRenderer.send('ble:device-connected', info),
    notifyDisconnected: () => ipcRenderer.send('ble:device-disconnected'),
    notifyBattery: (level) => ipcRenderer.send('ble:battery-update', level),
  }
});
