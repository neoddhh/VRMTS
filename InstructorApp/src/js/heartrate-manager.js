// ═══════════════════════════════════════════════════
//  统一心率数据管理器
//  在文件开头添加此代码
// ═══════════════════════════════════════════════════

// 全局心率管理器
const HeartRateManager = {
  // 当前心率数据源
  source: 'simulated', // 'simulated' | 'polar'
  currentHR: 75,
  polarHR: 0,
  polarConnected: false,
  lastUpdateTime: Date.now(),

  // 模拟心率生成器
  simulatedHR: 75,
  simulationInterval: null,

  // 初始化
  init() {
    this.startSimulation();
    console.log('[HeartRateManager] 初始化完成 - 使用模拟数据');
  },

  // 启动模拟心率
  startSimulation() {
    if (this.simulationInterval) return;

    this.simulationInterval = setInterval(() => {
      // 只有在未连接 Polar 时才更新模拟数据
      if (!this.polarConnected) {
        this.simulatedHR = Math.max(45, Math.min(130,
          Math.round(55 + Math.sin(Date.now() / 8000) * 30 + 20 + (Math.random() - 0.5) * 6)
        ));
        this.updateHeartRate(this.simulatedHR, 'simulated');
      }
    }, 1000);
  },

  // 停止模拟
  stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  },

  // Polar 设备连接
  onPolarConnected() {
    this.polarConnected = true;
    this.source = 'polar';
    console.log('[HeartRateManager] ✅ 切换到 Polar 真实数据');
    // 不停止模拟器，但它不会更新数据
  },

  // Polar 设备断开
  onPolarDisconnected() {
    this.polarConnected = false;
    this.source = 'simulated';
    this.polarHR = 0;
    console.log('[HeartRateManager] ⚠️ Polar 断开，切换到模拟数据');
  },

  // 更新 Polar 心率
  updatePolarHR(hr) {
    if (!this.polarConnected) return;

    this.polarHR = hr;
    this.updateHeartRate(hr, 'polar');
  },

  // 统一心率更新接口（唯一数据源）
  updateHeartRate(hr, source) {
    this.currentHR = hr;
    this.source = source;
    this.lastUpdateTime = Date.now();

    // 更新全局变量（兼容旧代码）
    adaptiveHR = hr;

    // 广播到所有 Unity 客户端（唯一出口）
    this.broadcastToUnity(hr);

    // 更新 UI 显示
    this.updateUI(hr);

    // 自适应难度调整
    this.updateAdaptiveLevel(hr);
  },

  // 广播到 Unity（唯一的 WebSocket 发送点）
  broadcastToUnity(hr) {
    if (window.api && window.api.ble) {
      window.api.ble.notifyHeartRate(hr);
    }
  },

  // 更新 UI 显示
  updateUI(hr) {
    // Dashboard 心率显示
    const dashHR = document.getElementById('dashHR');
    if (dashHR) {
      dashHR.textContent = Math.round(hr);
      dashHR.style.color = hr > 100 ? 'var(--red)' : hr < 60 ? 'var(--blue)' : 'var(--green)';
    }

    // Devices 页面心率显示
    const bleHR = document.getElementById('bleHR');
    if (bleHR) {
      bleHR.textContent = Math.round(hr);
      bleHR.style.color = hr > 100 ? 'var(--red)' : hr < 60 ? 'var(--blue)' : 'var(--green)';
    }

    // Monitor 面板心率显示
    const monHR = document.getElementById('monHR');
    if (monHR) {
      monHR.textContent = Math.round(hr);
      monHR.style.color = hr > 90 ? 'var(--red)' : hr < 60 ? 'var(--blue)' : 'var(--green)';
    }

    // 显示数据源标识
    const sourceIndicator = document.getElementById('hrSource');
    if (sourceIndicator) {
      sourceIndicator.textContent = this.source === 'polar' ? '🔴 P10' : '🟡 模拟';
      sourceIndicator.style.color = this.source === 'polar' ? 'var(--green)' : 'var(--yellow)';
    }
  },

  // 自适应难度调整
  updateAdaptiveLevel(hr) {
    if (adaptiveMode === 'auto') {
      const newLevel = hr > 90 ? 1 : hr < 60 ? 3 : 2;
      if (newLevel !== adaptiveLevel) {
        adaptiveLevel = newLevel;
        sendCmd();
        console.log(`[HeartRateManager] 自适应难度调整: L${newLevel} (HR=${hr})`);
      }
    }
  },

  // 获取当前心率
  getHeartRate() {
    return this.currentHR;
  },

  // 获取数据源
  getSource() {
    return this.source;
  },

  // 是否连接 Polar
  isPolarConnected() {
    return this.polarConnected;
  }
};

// ═══════════════════════════════════════════════════
//  修改后的代码片段（替换原有代码）
// ═══════════════════════════════════════════════════

// 在 startTimers() 函数中移除模拟心率生成
// 原代码第30行附近：
/*
setInterval(() => {
  adaptiveHR = Math.max(45, Math.min(130, ...)); // ❌ 删除此行
}, 1000);
*/

// 修改 onHRData 函数（第594行）
function onHRData(event) {
  const char = event.target;
  if (!char.value) return;
  const parsed = parseHRMeasurement(char.value);

  // ✅ 使用统一管理器更新 Polar 心率
  HeartRateManager.updatePolarHR(parsed.bpm);

  // ❌ 删除原有的单独通知代码
  // if (window.api?.ble) window.api.ble.notifyHeartRate(polarHR);
}

// 修改 Polar 连接成功回调（第540行附近）
// 在连接成功后添加：
// HeartRateManager.onPolarConnected();

// 修改 onBLEDisconnected 函数（第633行）
function onBLEDisconnected() {
  bleLog('⚠️ 设备断开连接');
  polarConnected = false;
  polarHR = 0;
  updateBLEStatus('disconnected');

  // ✅ 通知心率管理器
  HeartRateManager.onPolarDisconnected();

  if (window.api?.ble) window.api.ble.notifyDisconnected();
  stopBLEEcg();
}

// 修改 bleDisconnect 函数（第642行）
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

  // ✅ 通知心率管理器
  HeartRateManager.onPolarDisconnected();

  bleLog('⏏ 已手动断开连接');
}

// 在页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  HeartRateManager.init();
});
