# ❤️ 心率实时同步系统使用指南

## 📋 系统概述

实现教官端 Polar 心率带监控数据与 Unity VR HUD 的实时同步显示。

### 数据流
```
Polar 心率带 (蓝牙)
    ↓
教官端 (Electron + Web Bluetooth)
    ↓
WebSocket (ws://127.0.0.1:5180)
    ↓
Unity HeartRateSync 组件
    ↓
VR HUD 显示
```

---

## 🚀 快速设置（3步完成）

### 步骤 1：等待 Unity 编译
Unity 编辑器右下角等待脚本编译完成

### 步骤 2：创建心率同步管理器
菜单：`Tools > 军训VR > Setup Heart Rate Sync`
点击：**"创建心率同步管理器"**

### 步骤 3：测试功能
1. 启动教官端：`npm start`
2. Unity 运行场景（Play ▶️）
3. 点击：**"测试心率显示"** 按钮

✅ 完成！HUD 应该显示实时心率数据。

---

## 📊 Unity 中的 HUD 显示组件

已自动检测到以下组件：

| 组件名 | 路径 | 当前值 | 用途 |
|--------|------|--------|------|
| **HeartRateValue** | VR_HUD_Modules/HeartRate_Module/ | 72 | 主心率数值 |
| **HeartRateText** | TrainingHeadHud/ | 心率：-- | 心率文本显示 |
| **HRVValue** | VR_HUD_Modules/HeartRate_Module/ | 45 | HRV 心率变异性 |

---

## 💡 工作原理

### 1. 教官端心率采集
```javascript
// main.js 中的 BLE 事件监听
ipcMain.on('ble:heart-rate-update', (_, hr) => {
  bleState.heartRate = hr;
  
  // 广播到所有 Unity 客户端
  const hrData = {
    type: 'HEART_RATE_UPDATE',
    heartRate: hr,
    hrv: 45,
    timestamp: Date.now()
  };
  broadcastToUnity(hrData);
});
```

### 2. Unity 接收和显示
```csharp
// HeartRateSync.cs
private void ParseHeartRateMessage(string message)
{
    HeartRateData data = JsonUtility.FromJson<HeartRateData>(message);
    
    if (data.type == "HEART_RATE_UPDATE")
    {
        UpdateHUD(data.heartRate, data.hrv);
    }
}
```

### 3. 数据格式
```json
{
  "type": "HEART_RATE_UPDATE",
  "heartRate": 72,
  "hrv": 45,
  "timestamp": 1691234567890
}
```

---

## 🔧 手动设置（如果自动工具失败）

### 在 Unity 中

1. **创建 GameObject**
   - Hierarchy 右键 → Create Empty
   - 命名：`HeartRateSync`

2. **添加组件**
   - Add Component → `HeartRateSync`

3. **配置连接**
   ```
   Server IP: 127.0.0.1
   Server Port: 5180
   ```

4. **绑定 HUD 组件**
   在 Inspector 中拖拽：
   - Heart Rate Value → `HeartRateValue`
   - Heart Rate Text → `HeartRateText`
   - Hrv Value → `HRVValue`

---

## 🎮 教官端配置

### Polar 心率带配置

1. **确保心率带已开启**
   - Polar H10 或 Polar Verity Sense
   - 蓝牙已开启

2. **教官端连接**
   - 启动教官端程序
   - 自动扫描 Polar 设备
   - 自动连接第一个发现的 Polar 设备

3. **验证连接**
   - 教官端界面应显示心率数据
   - Console 输出：`[BLE] Device connected: Polar H10`

---

## 🧪 测试步骤

### 完整测试流程

#### 1. 教官端测试
```bash
# 启动教官端
cd D:\MilitaryVR_202608050333\InstructorApp
npm start
```

**验证：**
- ✅ Console 显示：`[WS] Server listening on ws://127.0.0.1:5180`
- ✅ 蓝牙图标显示已连接
- ✅ 界面显示实时心率数据

#### 2. Unity 模拟测试（无心率带）
```
1. Unity 运行场景（Play ▶️）
2. Tools > 军训VR > Setup Heart Rate Sync
3. 点击"测试心率显示"
4. HUD 显示随机心率（60-120 BPM）
```

#### 3. 真实心率带测试
```
1. 佩戴 Polar 心率带
2. 启动教官端并连接心率带
3. Unity 运行场景
4. HeartRateSync 自动连接教官端
5. HUD 显示真实心率数据
```

---

## 📈 心率数据说明

### 正常心率范围
| 状态 | 心率范围（BPM） | 颜色建议 |
|------|----------------|---------|
| **静息** | 60-80 | 绿色 |
| **轻度活动** | 80-100 | 黄色 |
| **中度活动** | 100-140 | 橙色 |
| **高强度** | 140-180 | 红色 |
| **危险** | >180 | 闪烁红色 |

### HRV（心率变异性）
- **正常值**：30-60 ms
- **高 HRV**：>60（良好恢复状态）
- **低 HRV**：<30（疲劳或压力）

---

## 🎨 自定义 HUD 显示

### 修改显示格式

编辑 `HeartRateSync.cs` 的 `UpdateHUD` 方法：

```csharp
private void UpdateHUD(int heartRate, int hrv)
{
    // 自定义格式
    if (heartRateValue != null)
    {
        heartRateValue.text = $"{heartRate}";
        
        // 根据心率改变颜色
        if (heartRate < 80)
            heartRateValue.color = Color.green;
        else if (heartRate < 120)
            heartRateValue.color = Color.yellow;
        else
            heartRateValue.color = Color.red;
    }

    if (heartRateText != null)
    {
        heartRateText.text = $"HR: {heartRate} BPM";
    }
}
```

### 添加心率警报

```csharp
private void UpdateHUD(int heartRate, int hrv)
{
    currentHeartRate = heartRate;
    
    // 心率过高警报
    if (heartRate > 160)
    {
        Debug.LogWarning($"⚠️ 心率过高: {heartRate} BPM");
        // 触发警报音效或视觉效果
    }
    
    // 更新显示...
}
```

---

## 🔍 问题排查

### Q1: Unity 无法连接教官端
**症状：** Console 显示 "连接失败"

**解决：**
1. 确认教官端正在运行
2. 检查端口 5180 是否被占用
3. 确认 IP 地址为 `127.0.0.1`（本机）
4. 关闭防火墙或添加例外

### Q2: HUD 不更新
**症状：** 教官端显示心率，Unity 不更新

**解决：**
1. 检查 HeartRateSync 组件是否存在
2. 确认 HUD 组件已正确绑定
3. 查看 Unity Console 是否有错误
4. 检查 WebSocket 连接状态

### Q3: 心率带无法连接
**症状：** 教官端找不到 Polar 设备

**解决：**
1. 确认心率带已开启（湿润电极）
2. 心率带电量充足
3. 重启蓝牙
4. 重启教官端程序
5. 检查 Chrome 蓝牙权限

### Q4: 心率数据延迟高
**症状：** Unity 显示滞后

**解决：**
1. 减少网络延迟（使用本地连接）
2. 检查教官端性能
3. 确认没有其他程序占用端口
4. 优化 Unity Update 频率

### Q5: 数据不一致
**症状：** 教官端和 Unity 显示的心率不同

**解决：**
1. 检查数据解析是否正确
2. 确认时间戳同步
3. 检查 JSON 格式是否匹配
4. 查看 Console 日志

---

## 🚀 高级功能

### 1. 心率历史记录

```csharp
private List<int> heartRateHistory = new List<int>();
private const int MAX_HISTORY = 60; // 保留 60 秒

private void UpdateHUD(int heartRate, int hrv)
{
    // 记录历史
    heartRateHistory.Add(heartRate);
    if (heartRateHistory.Count > MAX_HISTORY)
        heartRateHistory.RemoveAt(0);
    
    // 计算平均心率
    int avgHeartRate = (int)heartRateHistory.Average();
    
    // 更新显示...
}
```

### 2. 心率曲线图

使用 Unity UI Line Renderer 或第三方图表库：
```csharp
// 实时绘制心率曲线
public void DrawHeartRateCurve()
{
    for (int i = 0; i < heartRateHistory.Count; i++)
    {
        float x = i * spacing;
        float y = heartRateHistory[i] * scale;
        lineRenderer.SetPosition(i, new Vector3(x, y, 0));
    }
}
```

### 3. 心率区间训练

```csharp
public enum HeartRateZone
{
    VeryLight,  // <60%
    Light,      // 60-70%
    Moderate,   // 70-80%
    Hard,       // 80-90%
    Maximum     // >90%
}

public HeartRateZone GetHeartRateZone(int heartRate)
{
    int maxHR = 220 - 25; // 假设年龄 25
    float percentage = (float)heartRate / maxHR;
    
    if (percentage < 0.6f) return HeartRateZone.VeryLight;
    if (percentage < 0.7f) return HeartRateZone.Light;
    if (percentage < 0.8f) return HeartRateZone.Moderate;
    if (percentage < 0.9f) return HeartRateZone.Hard;
    return HeartRateZone.Maximum;
}
```

### 4. 导出训练数据

```csharp
public void ExportTrainingData()
{
    string json = JsonUtility.ToJson(new TrainingData
    {
        studentId = LoginManagerSimple.CurrentStudent?.studentId,
        heartRateHistory = heartRateHistory,
        avgHeartRate = (int)heartRateHistory.Average(),
        maxHeartRate = heartRateHistory.Max(),
        minHeartRate = heartRateHistory.Min(),
        timestamp = DateTime.Now
    });
    
    // 发送到教官端保存
    // 或保存到本地文件
}
```

---

## 📊 数据统计示例

### 教官端显示统计

可以在教官端添加实时统计：

```javascript
// 计算平均心率
let heartRateHistory = [];
ipcMain.on('ble:heart-rate-update', (_, hr) => {
  heartRateHistory.push(hr);
  if (heartRateHistory.length > 60) {
    heartRateHistory.shift();
  }
  
  const avgHR = Math.round(
    heartRateHistory.reduce((a, b) => a + b, 0) / heartRateHistory.length
  );
  
  const hrData = {
    type: 'HEART_RATE_UPDATE',
    heartRate: hr,
    avgHeartRate: avgHR,
    hrv: bleState.battery || 45,
    timestamp: Date.now()
  };
  
  broadcastToUnity(hrData);
});
```

---

## ✅ 完整检查清单

### Unity 端
- [ ] HeartRateSync GameObject 存在
- [ ] HeartRateSync 组件已添加
- [ ] HUD 组件已正确绑定
- [ ] Server IP 设置为 127.0.0.1
- [ ] Server Port 设置为 5180

### 教官端
- [ ] 教官端程序正在运行
- [ ] WebSocket 服务器已启动（端口 5180）
- [ ] Polar 心率带已连接
- [ ] 界面显示实时心率数据
- [ ] Console 无错误信息

### 功能测试
- [ ] Unity 可以连接教官端
- [ ] HUD 显示实时心率数据
- [ ] 数据与教官端一致
- [ ] 无明显延迟（<1秒）
- [ ] 断线自动重连

---

## 📝 与训练系统集成

### 训练开始时记录初始心率

```csharp
public class TrainingSession : MonoBehaviour
{
    private int initialHeartRate;
    
    void StartTraining()
    {
        if (HeartRateSync.Instance != null)
        {
            initialHeartRate = HeartRateSync.Instance.currentHeartRate;
            Debug.Log($"训练开始心率: {initialHeartRate} BPM");
        }
    }
}
```

### 训练结束时上传心率数据

```csharp
void EndTraining()
{
    var trainingData = new {
        studentId = LoginManagerSimple.CurrentStudent?.studentId,
        initialHR = initialHeartRate,
        finalHR = HeartRateSync.Instance.currentHeartRate,
        avgHR = CalculateAverageHeartRate(),
        maxHR = maxHeartRate,
        timestamp = DateTime.Now
    };
    
    // 发送到教官端保存
    SendTrainingData(trainingData);
}
```

---

**现在你的系统支持实时心率监控和显示了！** ❤️📊
