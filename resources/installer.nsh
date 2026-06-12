; 自定义 NSIS 安装脚本
; 设置默认安装目录为 %LOCALAPPDATA%\Programs\EyeTimer
; 防止安装器将应用装到桌面上

!macro customInit
  ; 强制默认安装路径，避免用户上次选择的桌面路径被记住
  StrCpy $INSTDIR "$LOCALAPPDATA\Programs\EyeTimer"
!macroend
