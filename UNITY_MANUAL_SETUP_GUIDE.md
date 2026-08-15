# 🔧 Unity 登录系统手动设置指南

## 方法 1：使用右键菜单（最简单）⭐

### 步骤 1：等待脚本编译
Unity 编辑器右下角应显示编译进度，等待完成。

### 步骤 2：添加组件
1. 在 **Hierarchy** 窗口中找到并**选中** `LoginManager` GameObject
2. 在 Hierarchy 中**右键点击** `LoginManager`
3. 选择 `军训VR > Add Login Component`
4. 看到成功提示框

✅ 完成！组件已自动添加并绑定 UI。

---

## 方法 2：Inspector 手动添加

### 步骤 1：选择 GameObject
在 Hierarchy 中点击 `LoginManager`

### 步骤 2：添加组件
1. 在 **Inspector** 窗口底部点击 `Add Component`
2. 搜索框输入：`LoginManagerSimple`
3. 点击搜索结果中的 `LoginManagerSimple`

### 步骤 3：手动绑定 UI（拖拽）
在 Inspector 中的 LoginManagerSimple 组件里：

| 字段 | 拖拽对象（从 Hierarchy） |
|------|------------------------|
| **Student Id Input** | `StudentIdInput` |
| **Trainee Name Input** | `TraineeNameInput` |
| **Login Button** | `ConfirmNameButton` |
| **Status Text** | `StatusText` |

### 步骤 4：保存场景
`Ctrl + S` 或 `File > Save`

---

## 方法 3：使用 Unity MCP 命令

如果上述方法都不行，让我用命令帮你：

```
请在对话框中输入：
"用 Unity MCP 给 LoginManager 添加 LoginManagerSimple 组件"
```

---

## ✅ 验证配置是否正确

### 检查清单
在 Inspector 中检查 LoginManagerSimple 组件：

- [ ] **Student Id Input** - 应显示 `StudentIdInput (TMP_InputField)`
- [ ] **Trainee Name Input** - 应显示 `TraineeNameInput (TMP_InputField)`
- [ ] **Login Button** - 应显示 `ConfirmNameButton (Button)`
- [ ] **Status Text** - 应显示 `StatusText (TextMeshProUGUI)`
- [ ] **Server URL** - 应为 `ws://127.0.0.1:5180`
- [ ] **Server Port** - 应为 `5180`

### 配置截图参考
```
┌─────────────────────────────────────┐
│ LoginManagerSimple (Script)         │
├─────────────────────────────────────┤
│ Student Id Input    [StudentIdInput]│
│ Trainee Name Input [TraineeNameI...│
│ Login Button       [ConfirmNameBu...│
│ Status Text        [StatusText]     │
│ Loading Panel      [None] (可选)   │
├─────────────────────────────────────┤
│ Server IP          127.0.0.1        │
│ Server Port        5180             │
├─────────────────────────────────────┤
│ Training Scene Name TrainingScene   │
└─────────────────────────────────────┘
```

---

## 🚀 测试登录功能

### 1. 启动教官端
```bash
cd D:\MilitaryVR_202608050333\InstructorApp
npm start
```

**验证成功：** 控制台显示
```
[WS] Server listening on ws://127.0.0.1:5180
```

### 2. 在 Unity 中运行 LoginScene
点击 **Play** 按钮 ▶️

### 3. 输入测试账号
- **学号：** `2026010001`
- **姓名：** `王明杰`

### 4. 点击登录按钮

**预期结果：**
- ✅ 状态文本显示："欢迎，王明杰！"（绿色）
- ✅ 教官端控制台输出：`[Auth] Login success: 王明杰 (2026010001)`
- ✅ 1.5秒后自动跳转

---

## 🐛 常见问题

### Q1: 找不到 LoginManagerSimple 组件
**原因：** 脚本有编译错误

**解决：**
1. 查看 Unity Console（底部窗口）
2. 检查是否有红色错误信息
3. 双击错误可以打开出错的脚本

### Q2: 右键菜单没有"军训VR"选项
**原因：** QuickLoginSetup.cs 未编译

**解决：**
1. 检查文件是否在 `Assets/Scripts/Editor/QuickLoginSetup.cs`
2. 强制刷新：`Assets > Refresh` 或 `Ctrl+R`
3. 等待编译完成

### Q3: UI 绑定后显示 None
**原因：** GameObject 名称不匹配

**解决：**
确认 Hierarchy 中的对象名称：
- `StudentIdInput` ✅
- `TraineeNameInput` ✅
- `ConfirmNameButton` ✅
- `StatusText` ✅

### Q4: 运行时报错 "NullReferenceException"
**原因：** UI 组件未正确绑定

**解决：**
1. 停止运行（点击 Play 按钮）
2. 选中 LoginManager
3. 检查 Inspector 中所有字段是否都有对象
4. 重新绑定缺失的组件

---

## 📝 快速参考

### 所需组件列表
```
LoginManager (GameObject)
  └── LoginManagerSimple (Component)
      ├── studentIdInput → StudentIdInput
      ├── traineeNameInput → TraineeNameInput
      ├── loginButton → ConfirmNameButton
      ├── statusText → StatusText
      ├── serverIP = "127.0.0.1"
      └── serverPort = 5180
```

### 测试账号速查
| 学号 | 姓名 | 备注 |
|------|------|------|
| 2026010001 | 王明杰 | 推荐测试 |
| 2026010002 | 李明超 | |
| 2026010031 | 徐强威 | 新添加 |

### 连接信息
- **WebSocket 地址：** `ws://127.0.0.1:5180`
- **教官端启动命令：** `npm start`
- **教官端目录：** `D:\MilitaryVR_202608050333\InstructorApp`

---

## ✅ 完成后检查项

- [ ] LoginManager GameObject 存在
- [ ] LoginManagerSimple 组件已添加
- [ ] 所有 UI 字段已绑定（无 None）
- [ ] Server URL 和 Port 正确
- [ ] 场景已保存
- [ ] 教官端正在运行
- [ ] 可以成功登录

---

**需要帮助？**
如果遇到问题，请告诉我：
1. Unity Console 显示的错误信息
2. 哪一步卡住了
3. Inspector 中的截图

我会立即帮你解决！
