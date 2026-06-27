# Setup Environment Script for Windows
# Run as Administrator

Write-Host "=== 轻瘦 APP 环境安装脚本 ===" -ForegroundColor Green
Write-Host ""

# Create directories
$projectDir = "D:\coding\WLP"
$envDir = "D:\environments"
$nodeDir = "$envDir\nodejs"
$jdkDir = "$envDir\jdk17"
$androidSdkDir = "$envDir\android-sdk"
$gradleDir = "$envDir\gradle"

Write-Host "[1/7] 创建目录..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $projectDir | Out-Null
New-Item -ItemType Directory -Force -Path $envDir | Out-Null
New-Item -ItemType Directory -Force -Path $nodeDir | Out-Null
New-Item -ItemType Directory -Force -Path $jdkDir | Out-Null
New-Item -ItemType Directory -Force -Path $androidSdkDir | Out-Null
New-Item -ItemType Directory -Force -Path $gradleDir | Out-Null
Write-Host "  目录创建完成" -ForegroundColor Green

# Check if Chocolatey is installed
Write-Host "[2/7] 检查 Chocolatey..." -ForegroundColor Cyan
$chocoExists = Get-Command choco -ErrorAction SilentlyContinue
if (-not $chocoExists) {
    Write-Host "  安装 Chocolatey..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    $env:Path += ";$env:ALLUSERSPROFILE\chocolatey\bin"
}
Write-Host "  Chocolatey 已就绪" -ForegroundColor Green

# Install Node.js
Write-Host "[3/7] 安装 Node.js..." -ForegroundColor Cyan
$nodeExists = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeExists) {
    Write-Host "  正在安装 Node.js LTS..." -ForegroundColor Yellow
    choco install nodejs-lts -y --installargs "INSTALLDIR=`"$nodeDir`""
    $env:Path += ";$nodeDir"
}
$nodeVersion = node --version
Write-Host "  Node.js 版本: $nodeVersion" -ForegroundColor Green

# Install JDK 17
Write-Host "[4/7] 安装 JDK 17..." -ForegroundColor Cyan
$javaExists = Get-Command java -ErrorAction SilentlyContinue
if (-not $javaExists -or -not (Test-Path $jdkDir)) {
    Write-Host "  正在安装 Temurin JDK 17..." -ForegroundColor Yellow
    choco install temurin17 -y --installargs "INSTALLDIR=`"$jdkDir`""
    $env:JAVA_HOME = $jdkDir
    $env:Path += ";$jdkDir\bin"
}
$javaVersion = java -version 2>&1 | Select-Object -First 1
Write-Host "  Java 版本: $javaVersion" -ForegroundColor Green

# Install Android SDK command line tools
Write-Host "[5/7] 安装 Android SDK..." -ForegroundColor Cyan
if (-not (Test-Path "$androidSdkDir\cmdline-tools")) {
    Write-Host "  下载 Android SDK 命令行工具..." -ForegroundColor Yellow
    $sdkToolsUrl = "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"
    $sdkToolsZip = "$env:TEMP\android-cmdline-tools.zip"
    Invoke-WebRequest -Uri $sdkToolsUrl -OutFile $sdkToolsZip
    
    Write-Host "  解压 Android SDK..." -ForegroundColor Yellow
    Expand-Archive -Path $sdkToolsZip -DestinationPath "$androidSdkDir\temp" -Force
    New-Item -ItemType Directory -Force -Path "$androidSdkDir\cmdline-tools\latest" | Out-Null
    Move-Item -Path "$androidSdkDir\temp\cmdline-tools\*" -Destination "$androidSdkDir\cmdline-tools\latest" -Force
    Remove-Item "$androidSdkDir\temp" -Recurse -Force
    Remove-Item $sdkToolsZip -Force
}

$env:ANDROID_HOME = $androidSdkDir
$env:ANDROID_SDK_ROOT = $androidSdkDir
$sdkManager = "$androidSdkDir\cmdline-tools\latest\bin\sdkmanager.bat"

if (Test-Path $sdkManager) {
    Write-Host "  安装 Android SDK 组件..." -ForegroundColor Yellow
    $sdkPackages = @(
        "platform-tools",
        "build-tools;34.0.0",
        "platforms;android-34",
        "cmake;3.22.1"
    )
    foreach ($pkg in $sdkPackages) {
        Write-Host "    安装 $pkg..." -ForegroundColor Gray
        echo y | & $sdkManager --sdk_root=$androidSdkDir $pkg 2>&1 | Out-Null
    }
    Write-Host "  Android SDK 安装完成" -ForegroundColor Green
}

# Install Git
Write-Host "[6/7] 检查 Git..." -ForegroundColor Cyan
$gitExists = Get-Command git -ErrorAction SilentlyContinue
if (-not $gitExists) {
    Write-Host "  正在安装 Git..." -ForegroundColor Yellow
    choco install git -y
    $env:Path += ";C:\Program Files\Git\bin"
}
$gitVersion = git --version
Write-Host "  Git 版本: $gitVersion" -ForegroundColor Green

# Clone project
Write-Host "[7/7] 克隆项目..." -ForegroundColor Cyan
if (-not (Test-Path "$projectDir\package.json")) {
    Write-Host "  正在克隆项目..." -ForegroundColor Yellow
    git clone https://github.com/tfxsr512512/Weight-loss-plan.git $projectDir
} else {
    Write-Host "  项目已存在，跳过克隆" -ForegroundColor Yellow
}

# Set environment variables permanently
Write-Host ""
Write-Host "设置环境变量..." -ForegroundColor Cyan

[Environment]::SetEnvironmentVariable("JAVA_HOME", $jdkDir, "User")
[Environment]::SetEnvironmentVariable("ANDROID_HOME", $androidSdkDir, "User")
[Environment]::SetEnvironmentVariable("ANDROID_SDK_ROOT", $androidSdkDir, "User")

$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$jdkDir\bin*") {
    [Environment]::SetEnvironmentVariable("Path", "$userPath;$jdkDir\bin", "User")
}
if ($userPath -notlike "*$androidSdkDir\platform-tools*") {
    [Environment]::SetEnvironmentVariable("Path", "$userPath;$androidSdkDir\platform-tools", "User")
}
if ($userPath -notlike "*$androidSdkDir\cmdline-tools\latest\bin*") {
    [Environment]::SetEnvironmentVariable("Path", "$userPath;$androidSdkDir\cmdline-tools\latest\bin", "User")
}

Write-Host ""
Write-Host "=== 环境安装完成 ===" -ForegroundColor Green
Write-Host ""
Write-Host "项目目录: $projectDir"
Write-Host "环境目录: $envDir"
Write-Host ""
Write-Host "请关闭当前 PowerShell 窗口，重新打开后运行:" -ForegroundColor Yellow
Write-Host "  cd D:\coding\WLP"
Write-Host "  .\build-apk.ps1"
Write-Host ""
Write-Host "注意: 重新打开 PowerShell 是为了让环境变量生效" -ForegroundColor Yellow
