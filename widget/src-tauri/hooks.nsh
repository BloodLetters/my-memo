; ========================================================
; Pixel Memo Widget - NSIS Installer Hooks
; Automatically adds shortcut to Windows Startup folder on install
; ========================================================

!macro NSIS_HOOK_POSTINSTALL
  DetailPrint "Menambahkan Pixel Memo Widget ke Windows Startup..."
  CreateShortcut "$SMSTARTUP\Pixel Memo Widget.lnk" "$INSTDIR\Pixel Memo Widget.exe" "" "$INSTDIR\Pixel Memo Widget.exe" 0
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  DetailPrint "Menghapus shortcut dari Windows Startup..."
  Delete "$SMSTARTUP\Pixel Memo Widget.lnk"
!macroend
