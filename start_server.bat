@echo off
chcp 65001 >nul 2>&1
cd /d "E:\.workbuddy\2026-07-29-14-27-18\deploy"
echo ============================================================
echo   人生 RPG 本地服务器已启动（localhost，数据自动落盘）
echo   请在浏览器打开：  http://localhost:8080/
echo   首次打开请点页面顶部「📁 选择存档文件」选一个本地
echo   lifeRPG_save.json —— 之后每次保存自动写入，清缓存都不丢
echo   关闭此窗口即停止服务器
echo ============================================================
"C:\Users\ZhuanZ1\.workbuddy\binaries\python\versions\3.13.12\python.exe" -m http.server 8080
pause
