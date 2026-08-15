const I18N={
zh:{
  // Login & Mode Selection
  login_subtitle:'军训VR射击训练 · 教官控制台',login_account:'账号',login_password:'密码',login_account_ph:'请输入账号',login_password_ph:'请输入密码',
  conn_subtitle:'选择与VR端的通信方式',conn_network:'网络模式 (WiFi / 有线)',conn_network_desc:'通过IP地址连接 · 跨设备通信',conn_unity:'Unity编辑器 (本机)',conn_unity_desc:'同一台电脑 · Unity Play模式 · 无防火墙',conn_package:'打包构建版本',conn_package_desc:'连接到独立VR应用程序',
  mode_subtitle:'选择训练人数',mode_solo:'单人训练',mode_solo_desc:'1人独立模式',mode_squad:'6人小组',mode_squad_desc:'小组训练模式',mode_platoon:'30人全班',mode_platoon_desc:'全班训练模式',mode_custom:'自定义人数',mode_custom_ph:'输入人数',
  subject_subtitle:'选择训练科目',subject_shooting:'射击场训练',subject_outdoor:'户外射击',subject_grenade:'手雷投掷',coming_soon:'暂未开放',
  weapon_subtitle:'选择本次训练使用的枪械',btn_go_back:'← 返回',btn_start_training:'🚀 开始进入训练',
  sidebar_sub:'教官训练控制台 v1.0',
  // Pages
  dashboard_title:'系统总览',dashboard_sub:'全局状态监控 · 射击训练场',training_title:'训练控制',training_sub:'训练模式控制 · 点击学员查看详情',bio_title:'身体体征自适应调控',bio_sub:'心率 · 脑电 · 姿态 三维监测',stu_title:'学员信息管理',stu_sub:'学员信息录入管理',arch_title:'学员档案',arch_sub:'学员档案检索 · 历史数据回溯',set_title:'系统设置',set_sub:'系统基础设置',dev_title:'设备连接',dev_sub:'Polar 心率设备蓝牙连接 · 无需系统配对',tasks_title:'训练任务',tasks_sub:'训练任务分配 · 枪械选择 · 靶型设置',
  btn_back:'◀ 返回选择模式',total_trainees:'总参训',online_count:'在线',offline_count:'未参训',current_level:'当前难度',filter_title:'🔍 学员筛选',all:'全部',trainee_status:'👥 学员体征状态',quick_ops:'📋 快捷操作',comm_log:'📡 通信日志',
  go_training:'🎯 训练控制',go_tasks:'📝 训练任务',go_bio:'🧬 体征监测',go_students:'👥 学员管理',go_archives:'📁 学员档案',
  target_type:'🎯 训练靶型',fixed_target:'固定靶射击训练',moving_target:'移动靶射击训练',batch_weapon:'🔫 批量分配枪械',assign_all:'全员分配',weapon_select:'🔫 枪械选择 (Unity VR武器库)',trainee_weapon_table:'📋 学员枪械分配表',select_all:'全选',assign_selected:'分配选中枪械',
  target_board:'🎯 实体靶盘 · 弹着分布',scoring:'📊 综合评分',score_time:'射击时长',score_acc:'射击精准度',score_breath:'呼吸平稳度',score_total:'综合得分',level_complete:'难度完成等级',save_score:'💾 保存评分归档',
  click_hint:'👇 点击学员卡片打开详细监控面板',no_students:'尚无已录入学员',go_add:'前往录入学员',
  hr_title:'实时心率',eeg_title:'脑电监测',posture_title:'姿态监测',body_posture:'身体姿态',level_ctrl:'🎯 难度等级控制',
  level1:'🔴 1级 · 放松引导',level2:'🟢 2级 · 标准训练',level3:'🔵 3级 · 高级挑战',json_cmd:'📋 当前指令 JSON',auto_mode:'🤖 自动模式',manual_mode:'🎯 手动强制',manual_select:'🎯 手动难度选择',mode_ctrl:'⚙ 模式控制',
  start_monitor:'▶ 启动模拟',stop_session:'■ 结束实训',connect:'连接',send_cmd:'⚡ 立即下发指令',
  rescan:'🔄 重新扫描',dev_log:'📡 设备日志',status:'状态',signal:'信号',battery:'电量',offline:'离线',online:'在线',
  add_manual:'＋ 手动录入',excel_import:'📊 Excel导入',export:'📤 导出',add_student:'添加学员',cancel:'取消',save:'保存',
  save_settings:'💾 保存设置',comm_config:'📡 通信配置',ui_config:'🎨 界面配置',brightness:'亮度',lang_label:'语言',data_path:'数据路径',auto_connect:'Unity自动连接',
  train_history:'📊 历史训练记录',search_ph:'搜索姓名/学号...',
  th_select:'选择',th_name:'姓名',th_sid:'学号',th_age:'年龄',th_class:'班级',th_group:'组别',th_device:'设备',th_last_hr:'上次HR',th_action:'操作',th_photo:'照片',th_weapon:'当前枪械',th_date:'日期',th_hr:'心率',th_level:'难度',th_score:'成绩',
  f_name:'姓名*',f_sid:'学号',f_age:'年龄',f_class:'班级',f_group:'小组',f_device:'设备编号',f_note:'备注',
  nav_dashboard:'系统总览',nav_tasks:'训练任务',nav_training:'训练控制',nav_adaptive:'体征自适应',nav_devices:'设备连接',nav_students:'学员管理',nav_archives:'学员档案',nav_results:'训练成绩',nav_settings:'系统设置',ws_waiting:'等待连接',
  res_title:'训练成绩',res_sub:'VR训练评估 · 统计分析',res_project:'项目:',res_total_students:'参训人数',res_avg_score:'平均分',res_pass_rate:'通过率',res_top_grade:'最高等级',res_transcript:'📋 学员成绩单',
  report_title:'评估报告',report_sub:'射击实训档案 · 五维雷达评估'
},
en:{
  // Login & Mode Selection
  login_subtitle:'VR Military Training · Instructor Console',login_account:'ACCOUNT',login_password:'PASSWORD',login_account_ph:'Enter account',login_password_ph:'Enter password',
  conn_subtitle:'Select how to communicate with VR client',conn_network:'Network (WiFi / LAN)',conn_network_desc:'Connect via IP address · Cross-device communication',conn_unity:'Unity Editor (Localhost)',conn_unity_desc:'Same machine · Unity Play Mode · No firewall',conn_package:'Packaged Build',conn_package_desc:'Connect to standalone VR application',
  mode_subtitle:'Select number of trainees',mode_solo:'Solo Training',mode_solo_desc:'1 Trainee Mode',mode_squad:'6-Man Squad',mode_squad_desc:'Squad Training Mode',mode_platoon:'30-Man Platoon',mode_platoon_desc:'Full Class Mode',mode_custom:'Custom Count',mode_custom_ph:'Enter count',
  subject_subtitle:'Choose training module',subject_shooting:'Shooting Range',subject_outdoor:'Outdoor Shooting',subject_grenade:'Grenade Throw',coming_soon:'Coming Soon',
  weapon_subtitle:'Choose weapon for this session',btn_go_back:'← Back',btn_start_training:'🚀 Start Training',
  sidebar_sub:'Instructor Console v1.0',
  // Pages
  dashboard_title:'System Overview',dashboard_sub:'Global Status Monitor · Shooting Range',training_title:'Training Control',training_sub:'Training Mode · Click Trainee for Details',bio_title:'Biometric Adaptive Control',bio_sub:'Heart Rate · EEG · Posture Monitoring',stu_title:'Trainee Database',stu_sub:'Student Record Management',arch_title:'Trainee Archives',arch_sub:'Student Archives & History Search',set_title:'System Settings',set_sub:'System Configuration',dev_title:'Device Connection',dev_sub:'Polar HR Sensor BLE · No System Pairing',tasks_title:'Training Tasks',tasks_sub:'Task Assignment · Weapon Selection · Target Setup',
  btn_back:'◀ Back to Mode',total_trainees:'Total',online_count:'Online',offline_count:'Offline',current_level:'Level',filter_title:'🔍 Filter Trainees',all:'All',trainee_status:'👥 Trainee Vital Status',quick_ops:'📋 Quick Actions',comm_log:'📡 Comm Log',
  go_training:'🎯 Training',go_tasks:'📝 Tasks',go_bio:'🧬 Biometric',go_students:'👥 Students',go_archives:'📁 Archives',
  target_type:'🎯 Target Type',fixed_target:'Fixed Target Training',moving_target:'Moving Target Training',batch_weapon:'🔫 Batch Assign',assign_all:'Assign All',weapon_select:'🔫 Weapon Select (Unity VR Arsenal)',trainee_weapon_table:'📋 Trainee Weapon Table',select_all:'Select All',assign_selected:'Assign Selected',
  target_board:'🎯 Target Board · Hit Distribution',scoring:'📊 Scoring',score_time:'Duration',score_acc:'Accuracy',score_breath:'Breath Stability',score_total:'Total Score',level_complete:'Level Completed',save_score:'💾 Save Score',
  click_hint:'👇 Click trainee card for detail monitor',no_students:'No Registered Trainees',go_add:'Add Trainees',
  hr_title:'HEART RATE',eeg_title:'EEG BRAINWAVE',posture_title:'POSTURE',body_posture:'Body Posture',level_ctrl:'🎯 Level Control',
  level1:'🔴 L1 · Relaxation',level2:'🟢 L2 · Standard',level3:'🔵 L3 · Advanced',json_cmd:'📋 Command JSON',auto_mode:'🤖 Auto',manual_mode:'🎯 Manual',manual_select:'🎯 Manual Level Select',mode_ctrl:'⚙ Mode Control',
  start_monitor:'▶ Start Monitor',stop_session:'■ Stop Session',connect:'Connect',send_cmd:'⚡ Send Command',
  rescan:'🔄 Rescan',dev_log:'📡 Device Log',status:'Status',signal:'Signal',battery:'Battery',offline:'Offline',online:'Online',
  add_manual:'＋ Add Manual',excel_import:'📊 Excel Import',export:'📤 Export',add_student:'Add Trainee',cancel:'Cancel',save:'Save',
  save_settings:'💾 Save',comm_config:'📡 Communication',ui_config:'🎨 Interface',brightness:'Brightness',lang_label:'Language',data_path:'Data Path',auto_connect:'Unity Auto-Connect',
  train_history:'📊 Training History',search_ph:'Search name/ID...',
  th_select:'Select',th_name:'Name',th_sid:'Student ID',th_age:'Age',th_class:'Class',th_group:'Group',th_device:'Device',th_last_hr:'Last HR',th_action:'Actions',th_photo:'Photo',th_weapon:'Weapon',th_date:'Date',th_hr:'HR',th_level:'Level',th_score:'Score',
  f_name:'Name*',f_sid:'Student ID',f_age:'Age',f_class:'Class',f_group:'Group',f_device:'Device ID',f_note:'Notes',
  nav_dashboard:'Overview',nav_tasks:'Tasks',nav_training:'Training',nav_adaptive:'Biometric',nav_devices:'Devices',nav_students:'Students',nav_archives:'Archives',nav_results:'Results',nav_settings:'Settings',ws_waiting:'Waiting',
  res_title:'TRAINING RESULTS',res_sub:'VR Training Assessment · Statistical Analysis',res_project:'Project:',res_total_students:'Students',res_avg_score:'Avg Score',res_pass_rate:'Pass Rate',res_top_grade:'Top Grade',res_transcript:'📋 Student Transcripts',
  report_title:'Evaluation Report',report_sub:'Shooting Assessment · Radar Analysis'
},
th:{
  // Login & Mode Selection
  login_subtitle:'การฝึกยิง VR ทหาร · คอนโซลครูฝึก',login_account:'บัญชี',login_password:'รหัสผ่าน',login_account_ph:'ป้อนบัญชี',login_password_ph:'ป้อนรหัสผ่าน',
  conn_subtitle:'เลือกวิธีสื่อสารกับ VR',conn_network:'เครือข่าย (WiFi / LAN)',conn_network_desc:'เชื่อมต่อผ่าน IP · สื่อสารข้ามอุปกรณ์',conn_unity:'Unity Editor (โลคัล)',conn_unity_desc:'เครื่องเดียวกัน · โหมด Play · ไม่มีไฟร์วอลล์',conn_package:'แพ็คเกจบิลด์',conn_package_desc:'เชื่อมต่อแอป VR แบบสแตนด์อโลน',
  mode_subtitle:'เลือกจำนวนผู้ฝึก',mode_solo:'ฝึกเดี่ยว',mode_solo_desc:'โหมด 1 คน',mode_squad:'ทีม 6 คน',mode_squad_desc:'โหมดทีมเล็ก',mode_platoon:'30 คน',mode_platoon_desc:'โหมดเต็มชั้น',mode_custom:'กำหนดเอง',mode_custom_ph:'จำนวน',
  subject_subtitle:'เลือกวิชาฝึก',subject_shooting:'สนามยิง',subject_outdoor:'ยิงกลางแจ้ง',subject_grenade:'ขว้างระเบิด',coming_soon:'เร็วๆนี้',
  weapon_subtitle:'เลือกอาวุธสำหรับเซสชั่นนี้',btn_go_back:'← กลับ',btn_start_training:'🚀 เริ่มฝึก',
  sidebar_sub:'คอนโซลครูฝึก v1.0',
  // Pages
  dashboard_title:'ภาพรวมระบบ',dashboard_sub:'ตรวจสอบสถานะ · สนามยิง',training_title:'ควบคุมการฝึก',training_sub:'โหมดฝึก · คลิกผู้ฝึกดูรายละเอียด',bio_title:'การปรับตัวทางชีวภาพ',bio_sub:'อัตราหัวใจ · คลื่นสมอง · ท่าทาง',stu_title:'ฐานข้อมูลผู้ฝึก',stu_sub:'จัดการข้อมูลนักเรียน',arch_title:'คลังข้อมูลผู้ฝึก',arch_sub:'ค้นหาและย้อนดูประวัติ',set_title:'ตั้งค่าระบบ',set_sub:'การตั้งค่าพื้นฐาน',dev_title:'เชื่อมต่ออุปกรณ์',dev_sub:'Polar BLE เซ็นเซอร์หัวใจ · ไม่ต้องจับคู่',tasks_title:'งานฝึกอบรม',tasks_sub:'มอบหมายงาน · เลือกอาวุธ · ประเภทเป้า',
  btn_back:'◀ กลับเลือกโหมด',total_trainees:'ทั้งหมด',online_count:'ออนไลน์',offline_count:'ออฟไลน์',current_level:'ระดับ',filter_title:'🔍 กรองผู้ฝึก',all:'ทั้งหมด',trainee_status:'👥 สถานะสุขภาพ',quick_ops:'📋 ทางลัด',comm_log:'📡 บันทึก',
  go_training:'🎯 ฝึกซ้อม',go_tasks:'📝 งาน',go_bio:'🧬 ชีวภาพ',go_students:'👥 นักเรียน',go_archives:'📁 คลังข้อมูล',
  target_type:'🎯 ประเภทเป้า',fixed_target:'ฝึกเป้าคงที่',moving_target:'ฝึกเป้าเคลื่อนที่',batch_weapon:'🔫 มอบหมายทั้งหมด',assign_all:'มอบหมายทั้งหมด',weapon_select:'🔫 เลือกอาวุธ',trainee_weapon_table:'📋 ตารางอาวุธ',select_all:'เลือกทั้งหมด',assign_selected:'มอบหมายที่เลือก',
  target_board:'🎯 กระดานเป้า',scoring:'📊 คะแนน',score_time:'ระยะเวลา',score_acc:'ความแม่นยำ',score_breath:'ความมั่นคงลมหายใจ',score_total:'คะแนนรวม',level_complete:'ระดับสำเร็จ',save_score:'💾 บันทึกคะแนน',
  click_hint:'👇 คลิกการ์ดผู้ฝึกเพื่อดูรายละเอียด',no_students:'ไม่มีผู้ฝึก',go_add:'เพิ่มผู้ฝึก',
  hr_title:'อัตราหัวใจ',eeg_title:'คลื่นสมอง',posture_title:'ท่าทาง',body_posture:'ท่าทางร่างกาย',level_ctrl:'🎯 ควบคุมระดับ',
  level1:'🔴 ระดับ1 · ผ่อนคลาย',level2:'🟢 ระดับ2 · มาตรฐาน',level3:'🔵 ระดับ3 · ขั้นสูง',json_cmd:'📋 คำสั่ง JSON',auto_mode:'🤖 อัตโนมัติ',manual_mode:'🎯 กำหนดเอง',manual_select:'🎯 เลือกระดับด้วยตนเอง',mode_ctrl:'⚙ ควบคุมโหมด',
  start_monitor:'▶ เริ่มตรวจสอบ',stop_session:'■ หยุดเซสชั่น',connect:'เชื่อมต่อ',send_cmd:'⚡ ส่งคำสั่ง',
  rescan:'🔄 สแกนใหม่',dev_log:'📡 บันทึกอุปกรณ์',status:'สถานะ',signal:'สัญญาณ',battery:'แบตเตอรี่',offline:'ออฟไลน์',online:'ออนไลน์',
  add_manual:'＋ เพิ่มด้วยตนเอง',excel_import:'📊 นำเข้า Excel',export:'📤 ส่งออก',add_student:'เพิ่มผู้ฝึก',cancel:'ยกเลิก',save:'บันทึก',
  save_settings:'💾 บันทึก',comm_config:'📡 การสื่อสาร',ui_config:'🎨 อินเทอร์เฟซ',brightness:'ความสว่าง',lang_label:'ภาษา',data_path:'เส้นทางข้อมูล',auto_connect:'เชื่อมต่ออัตโนมัติ',
  train_history:'📊 ประวัติการฝึก',search_ph:'ค้นหาชื่อ/รหัส...',
  th_select:'เลือก',th_name:'ชื่อ',th_sid:'รหัส',th_age:'อายุ',th_class:'ชั้น',th_group:'กลุ่ม',th_device:'อุปกรณ์',th_last_hr:'HR ล่าสุด',th_action:'การดำเนินการ',th_photo:'รูปถ่าย',th_weapon:'อาวุธ',th_date:'วันที่',th_hr:'HR',th_level:'ระดับ',th_score:'คะแนน',
  f_name:'ชื่อ*',f_sid:'รหัสนักเรียน',f_age:'อายุ',f_class:'ชั้น',f_group:'กลุ่ม',f_device:'รหัสอุปกรณ์',f_note:'หมายเหตุ',
  nav_dashboard:'ภาพรวม',nav_tasks:'งาน',nav_training:'ฝึกซ้อม',nav_adaptive:'ชีวภาพ',nav_devices:'อุปกรณ์',nav_students:'นักเรียน',nav_archives:'คลังข้อมูล',nav_results:'ผลการฝึก',nav_settings:'ตั้งค่า',ws_waiting:'รอเชื่อมต่อ',
  res_title:'ผลการฝึก',res_sub:'ประเมินการฝึก VR · วิเคราะห์สถิติ',res_project:'โปรเจกต์:',res_total_students:'ผู้ฝึก',res_avg_score:'คะแนนเฉลี่ย',res_pass_rate:'อัตราผ่าน',res_top_grade:'เกรดสูงสุด',res_transcript:'📋 ผลการเรียน',
  report_title:'รายงานประเมิน',report_sub:'ประเมินการยิง · วิเคราะห์เรดาร์'
}
};
function setLanguage(lang){
  currentLang=lang;
  document.querySelectorAll('[data-i18n]').forEach(el=>{const k=el.getAttribute('data-i18n');if(I18N[lang]&&I18N[lang][k])el.textContent=I18N[lang][k];});
  document.querySelectorAll('[data-i18n-ph]').forEach(el=>{const k=el.getAttribute('data-i18n-ph');if(I18N[lang]&&I18N[lang][k])el.placeholder=I18N[lang][k];});
  ['langZH','langEN','langTH'].forEach(id=>{const b=document.getElementById(id);if(b)b.classList.toggle('btn-primary',id==='lang'+lang.toUpperCase());});
  // Also update lang attribute on html element
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang === 'th' ? 'th' : 'en';
}
