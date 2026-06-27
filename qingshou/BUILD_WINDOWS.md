# 轻瘦 APP Windows 构建指南

## 目录结构
- 项目代码：`D:\coding\WLP`
- 开发环境：`D:\environments`

## 前置要求
- Windows 10/11
- 至少 8GB 内存（推荐 16GB）
- 至少 20GB 可用磁盘空间

## 一键安装环境

### 第一步：以管理员身份打开 PowerShell

右键点击开始菜单 → 选择 "Windows PowerShell (管理员)" 或 "终端 (管理员)"

### 第二步：运行环境安装脚本

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
cd D:\
mkdir -p coding\WLP, environments
cd D:\coding\WLP
# 将脚本复制到这里后运行
.\setup-env.ps1
```

## 一键构建 APK

环境安装完成后，运行：

```powershell
.\build-apk.ps1
```

构建成功后，APK 文件位于：
`D:\coding\WLP\android\app\build\outputs\apk\debug\app-debug.apk`

## 手动安装步骤（如果脚本不工作）

### 1. 安装 Node.js
- 下载：https://nodejs.org/ （选择 LTS 版本）
- 安装到：`D:\environments\nodejs`

### 2. 安装 JDK 17
- 下载：https://adoptium.net/ （选择 Temurin 17）
- 安装到：`D:\environments\jdk17`

### 3. 安装 Android SDK
- 下载 Android Studio 或命令行工具
- 安装到：`D:\environments\android-sdk`
- 安装组件：platform-tools, build-tools 34.0.0, platform android-34

### 4. 克隆项目
```powershell
git clone https://github.com/tfxsr512512/Weight-loss-plan.git D:\coding\WLP
```

### 5. 安装依赖
```powershell
cd D:\coding\WLP
npm install
```

### 6. 生成原生工程
```powershell
npx expo prebuild --platform android
```

### 7. 构建 APK
```powershell
cd android
.\gradlew.bat assembleDebug
```

## 常见问题

### 1. Gradle 下载慢
- 设置国内镜像（脚本已自动配置）

### 2. 构建时内存不足
- 增加 `android/gradle.properties` 中的内存配置

### 3. 安装到手机
- 将 APK 传到手机
- 手机上点击 APK 文件安装
- 需要开启 "允许安装未知来源应用"
