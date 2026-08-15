# ⌨️ VR 虚拟键盘集成指南

## 📋 功能说明

为军训VR登录界面添加虚拟键盘支持，让用户在 VR 环境中可以通过点击虚拟按键输入学号和姓名。

### 特性
- ✅ **自动激活** - 点击输入框自动显示键盘
- ✅ **完整布局** - 支持数字、字母、空格、退格
- ✅ **大小写切换** - Shift 键切换大小写
- ✅ **实时显示** - 显示当前输入内容
- ✅ **科技感设计** - 深色半透明背景，蓝色发光边框
- ✅ **VR 适配** - 适用于 VR 控制器点击

---

## 🚀 快速设置（3步完成）

### 步骤 1：等待编译
Unity 编辑器右下角等待脚本编译完成

### 步骤 2：创建 VR 键盘
菜单：`Tools > 军训VR > Setup VR Keyboard`
点击：**"创建 VR 键盘"** 按钮

### 步骤 3：添加输入框触发器
点击：**"为输入框添加触发器"** 按钮

✅ 完成！现在点击输入框就会弹出虚拟键盘。

---

## 🎨 键盘布局

```
┌─────────────────────────────────────────┐
│ [当前输入的文本显示]                    │
├─────────────────────────────────────────┤
│ 1  2  3  4  5  6  7  8  9  0           │
│ Q  W  E  R  T  Y  U  I  O  P           │
│ A  S  D  F  G  H  J  K  L              │
│ [Shift] Z  X  C  V  B  N  M  [←]      │
│      [    SPACE    ] [Clear] [Done]    │
└─────────────────────────────────────────┘
```

### 按键功能
| 按键 | 功能 |
|------|------|
| **数字/字母** | 输入对应字符 |
| **Shift** | 切换大小写 |
| **←** (退格) | 删除最后一个字符 |
| **SPACE** | 输入空格 |
| **Clear** | 清空所有输入 |
| **Done** | 确认输入并关闭键盘 |

---

## 🎯 工作原理

### 1. VRKeyboard 组件
主键盘管理器，负责：
- 生成键盘UI
- 处理按键点击
- 更新输入内容
- 显示/隐藏键盘

### 2. VRKeyboardTrigger 组件
附加到每个输入框，负责：
- 监听输入框点击事件
- 激活 VR 键盘
- 绑定输入框到键盘

### 3. 交互流程
```
用户点击输入框
    ↓
VRKeyboardTrigger 捕获点击
    ↓
调用 VRKeyboard.ShowKeyboard()
    ↓
键盘显示在屏幕底部
    ↓
用户点击虚拟按键
    ↓
VRKeyboard 更新输入框文本
    ↓
点击 Done 确认并关闭键盘
```

---

## 🔧 手动设置（如果自动工具失败）

### 创建键盘 GameObject

1. **创建主对象**
   - Hierarchy 右键 → Create Empty
   - 命名：`VRKeyboard`
   - 父对象：Canvas

2. **添加组件**
   - 选中 `VRKeyboard`
   - Add Component → `VRKeyboard`

3. **配置 RectTransform**
   ```
   Anchor: Bottom Center
   Position: (0, 50, 0)
   Size: (800, 400)
   ```

4. **创建子对象**
   - KeyboardPanel（背景面板）
   - DisplayText（显示文本）
   - KeysContainer（按键容器）

5. **绑定引用**
   在 VRKeyboard 组件中：
   - Keyboard Panel → KeyboardPanel
   - Display Text → DisplayText
   - Keys Container → KeysContainer

### 为输入框添加触发器

1. 选中 `StudentIdInput`
2. Add Component → `VRKeyboardTrigger`
3. 重复上述步骤为 `TraineeNameInput` 添加

---

## 🎨 自定义样式

### 修改键盘颜色

编辑 `VRKeyboard.cs` 的 `CreateKey` 方法：

```csharp
// 当前颜色（深灰色）
img.color = new Color(0.2f, 0.3f, 0.4f);

// 改为科技蓝
img.color = new Color(0.2f, 0.6f, 1f);

// 改为深色科技
img.color = new Color(0.15f, 0.2f, 0.3f);
```

### 修改键盘大小

在 `VRKeyboardSetup.cs` 中修改：

```csharp
// 键盘面板大小
keyboardRT.sizeDelta = new Vector2(800, 400);  // 宽 x 高

// 按键大小
rt.sizeDelta = new Vector2(60, 60);  // 单个按键
```

### 修改键盘位置

```csharp
// 底部居中（当前）
keyboardRT.anchorMin = new Vector2(0.5f, 0f);
keyboardRT.anchorMax = new Vector2(0.5f, 0f);
keyboardRT.anchoredPosition = new Vector2(0, 50);

// 改为屏幕中央
keyboardRT.anchorMin = new Vector2(0.5f, 0.5f);
keyboardRT.anchorMax = new Vector2(0.5f, 0.5f);
keyboardRT.anchoredPosition = new Vector2(0, 0);
```

---

## 🎮 VR 控制器支持

### XR Interaction Toolkit 集成

如果使用 Unity XR Interaction Toolkit：

1. **添加 XR UI Input Module**
   ```
   EventSystem 对象
     └── 替换为 XR UI Input Module
   ```

2. **输入框添加 Interactable**
   ```csharp
   // 在 VRKeyboardTrigger.cs 中添加
   using UnityEngine.XR.Interaction.Toolkit;
   
   [RequireComponent(typeof(XRSimpleInteractable))]
   public class VRKeyboardTrigger : MonoBehaviour
   {
       // ... 现有代码
   }
   ```

3. **键盘按钮支持射线点击**
   每个按钮自动支持 XR Ray Interactor

---

## 🧪 测试步骤

### PC 模式测试（鼠标点击）
1. 运行场景（Play ▶️）
2. 用鼠标点击 `StudentIdInput` 输入框
3. 虚拟键盘应该在底部弹出
4. 点击虚拟按键输入内容
5. 点击 `Done` 关闭键盘
6. 输入框显示输入的内容

### VR 模式测试（控制器射线）
1. 连接 VR 头显和控制器
2. 运行场景
3. 使用控制器射线指向输入框
4. 按下触发器（Trigger）点击
5. 键盘弹出
6. 用射线点击虚拟按键
7. 点击 Done 确认

---

## 🐛 常见问题

### Q1: 点击输入框没有反应
**原因：** 缺少 EventSystem 或 VRKeyboardTrigger 组件

**解决：**
1. 检查场景中是否有 `EventSystem`
2. 如果没有：GameObject → UI → Event System
3. 确认输入框有 `VRKeyboardTrigger` 组件

### Q2: 键盘显示但点击按键无效
**原因：** 按键没有正确生成或缺少点击事件

**解决：**
1. 重新运行 `Tools > 军训VR > Setup VR Keyboard`
2. 检查 Console 是否有错误信息
3. 确认 VRKeyboard 的 Keys Container 已绑定

### Q3: VR 控制器无法点击键盘
**原因：** 缺少 XR UI Input Module

**解决：**
1. 选中 EventSystem
2. 移除 `Standalone Input Module`
3. 添加 `XR UI Input Module`（需要 XR Interaction Toolkit 包）

### Q4: 键盘位置不对
**原因：** Canvas 的 Render Mode 设置问题

**解决：**
1. 选中 Canvas
2. Render Mode 设置为：
   - **Screen Space - Overlay**（2D UI，推荐测试用）
   - **World Space**（VR 专用）

### Q5: 输入中文会乱码
**原因：** 当前键盘只支持英文和数字

**解决：** 学号和姓名建议使用拼音或数字

---

## 📊 键盘规格

| 项目 | 规格 |
|------|------|
| **尺寸** | 800 x 400 px |
| **位置** | 屏幕底部，居中 |
| **按键数量** | 46 个（数字10 + 字母26 + 功能键10） |
| **按键大小** | 60 x 60 px |
| **特殊按键** | Space(300px), Shift/Clear/Done(100px) |
| **背景颜色** | RGBA(0.1, 0.1, 0.1, 0.95) |
| **边框颜色** | RGBA(0.2, 0.6, 1.0, 1.0) 科技蓝 |
| **字体大小** | 24px（字母）, 16px（功能键） |

---

## 🚀 高级功能（可选）

### 添加特殊字符支持
编辑 `VRKeyboard.cs` 的 `keyboardLayout`：

```csharp
new string[] { "!", "@", "#", "$", "%", "^", "&", "*", "(", ")" }
```

### 添加中文输入法
需要集成第三方中文输入法，如：
- Google Pinyin Input
- Microsoft IME
- 自定义拼音转汉字系统

### 添加数字小键盘
创建单独的数字键盘布局：

```csharp
private string[][] numpadLayout = new string[][]
{
    new string[] { "7", "8", "9" },
    new string[] { "4", "5", "6" },
    new string[] { "1", "2", "3" },
    new string[] { "0", "←", "Done" }
};
```

### 添加语音输入
集成 Unity Speech Recognition：
```csharp
using UnityEngine.Windows.Speech;
// 实现语音转文本功能
```

---

## ✅ 完整检查清单

设置完成后检查：

### 场景组件
- [ ] Canvas 存在
- [ ] EventSystem 存在
- [ ] VRKeyboard GameObject 存在
- [ ] StudentIdInput 有 VRKeyboardTrigger
- [ ] TraineeNameInput 有 VRKeyboardTrigger

### VRKeyboard 组件
- [ ] Keyboard Panel 已绑定
- [ ] Display Text 已绑定
- [ ] Keys Container 已绑定
- [ ] 键盘初始状态为隐藏

### 功能测试
- [ ] 点击输入框键盘弹出
- [ ] 可以输入数字
- [ ] 可以输入字母
- [ ] Shift 切换大小写
- [ ] 退格键删除字符
- [ ] Clear 清空内容
- [ ] Done 关闭键盘
- [ ] 输入框显示正确内容

---

## 📝 与登录系统集成

VR 键盘与登录系统完美配合：

```
用户戴上 VR 头显
    ↓
看到登录界面
    ↓
用控制器点击学号输入框
    ↓
虚拟键盘弹出
    ↓
输入学号（如 2026010001）
    ↓
点击 Done
    ↓
点击姓名输入框
    ↓
输入姓名（如 WangMingJie）
    ↓
点击 Done
    ↓
点击 LOGIN 按钮
    ↓
系统验证身份
    ↓
进入训练场景
```

---

**现在你的登录系统支持 VR 虚拟键盘输入了！** ⌨️🎮
