IF EXIST "C:\Program Files (x86)\HAMILTON\LabWare\ML_STAR\" xcopy *.* "C:\Program Files (x86)\HAMILTON\LabWare\ML_STAR\MultiFlexCarrier" /c /d /i /y /r /z
IF EXIST "C:\Program Files (x86)\Hamilton Company\LabWare\ML_STAR\" xcopy *.* "C:\Program Files (x86)\Hamilton Company\LabWare\ML_STAR\MultiFlexCarrier" /c /d /i /y /r /z
IF EXIST "C:\Program Files\HAMILTON\LabWare\ML_STAR\" xcopy *.* "C:\Program Files\HAMILTON\LabWare\ML_STAR\MultiFlexCarrier" /c /d /i /y /r /z
IF EXIST "C:\Program Files\Hamilton Company\LabWare\ML_STAR\" xcopy *.* "C:\Program Files\Hamilton Company\LabWare\ML_STAR\MultiFlexCarrier" /c /d /i /y /r /z
IF EXIST "C:\Program Files (x86)\HAMILTON\Bin\" xcopy LabwareAssistant3D.exe "C:\Program Files (x86)\HAMILTON\Bin\" /c /d /i /y /r /z
IF EXIST "C:\Program Files (x86)\Hamilton Company\Bin\" xcopy LabwareAssistant3D.exe "C:\Program Files (x86)\Hamilton Company\Bin\" /c /d /i /y /r /z
IF EXIST "C:\Program Files\HAMILTON\Bin\" xcopy LabwareAssistant3D.exe "C:\Program Files\HAMILTON\Bin\" /c /d /i /y /r /z
IF EXIST "C:\Program Files\Hamilton Company\Bin\" xcopy LabwareAssistant3D.exe "C:\Program Files\Hamilton Company\Bin\" /c /d /i /y /r /z
%windir%\system32\reg.exe import 7x64.reg
%windir%\system32\reg.exe import 7x86.reg
%windir%\system32\reg.exe import 7x86_2.reg
%windir%\system32\reg.exe import XPx64.reg
%windir%\system32\reg.exe import XPx64_2.reg
%windir%\system32\reg.exe import XPx86.reg
%windir%\system32\reg.exe import XPx86_2.reg
IF EXIST "C:\Program Files (x86)\HAMILTON\LabWare\ML_STAR\" del /F /Q "C:\Program Files (x86)\HAMILTON\LabWare\ML_STAR\MultiFlexCarrier\LabwareAssistant3D.exe"
IF EXIST "C:\Program Files (x86)\Hamilton Company\LabWare\ML_STAR\" del /F /Q "C:\Program Files (x86)\Hamilton Company\LabWare\ML_STAR\MultiFlexCarrier\LabwareAssistant3D.exe"
IF EXIST "C:\Program Files\HAMILTON\LabWare\ML_STAR\" del /F /Q "C:\Program Files\HAMILTON\LabWare\ML_STAR\MultiFlexCarrier\LabwareAssistant3D.exe"
IF EXIST "C:\Program Files\Hamilton Company\LabWare\ML_STAR\" del /F /Q "C:\Program Files\Hamilton Company\LabWare\ML_STAR\MultiFlexCarrier\LabwareAssistant3D.exe"
IF EXIST "C:\Program Files (x86)\HAMILTON\LabWare\ML_STAR\" del /F /Q "C:\Program Files (x86)\HAMILTON\LabWare\ML_STAR\MultiFlexCarrier\Install.bat"
IF EXIST "C:\Program Files (x86)\Hamilton Company\LabWare\ML_STAR\" del /F /Q "C:\Program Files (x86)\Hamilton Company\LabWare\ML_STAR\MultiFlexCarrier\Install.bat"
IF EXIST "C:\Program Files\HAMILTON\LabWare\ML_STAR\" del /F /Q "C:\Program Files\HAMILTON\LabWare\ML_STAR\MultiFlexCarrier\Install.bat"
IF EXIST "C:\Program Files\Hamilton Company\LabWare\ML_STAR\" del /F /Q "C:\Program Files\Hamilton Company\LabWare\ML_STAR\MultiFlexCarrier\Install.bat"
IF EXIST "C:\Program Files (x86)\HAMILTON\LabWare\ML_STAR\" del /F /Q "C:\Program Files (x86)\HAMILTON\LabWare\ML_STAR\MultiFlexCarrier\7x64.reg"
IF EXIST "C:\Program Files (x86)\Hamilton Company\LabWare\ML_STAR\" del /F /Q "C:\Program Files (x86)\Hamilton Company\LabWare\ML_STAR\MultiFlexCarrier\7x64.reg"
IF EXIST "C:\Program Files\HAMILTON\LabWare\ML_STAR\" del /F /Q "C:\Program Files\HAMILTON\LabWare\ML_STAR\MultiFlexCarrier\7x64.reg"
IF EXIST "C:\Program Files\Hamilton Company\LabWare\ML_STAR\" del /F /Q "C:\Program Files\Hamilton Company\LabWare\ML_STAR\MultiFlexCarrier\7x64.reg"
IF EXIST "C:\Program Files (x86)\HAMILTON\LabWare\ML_STAR\" del /F /Q "C:\Program Files (x86)\HAMILTON\LabWare\ML_STAR\MultiFlexCarrier\7x86.reg"
IF EXIST "C:\Program Files (x86)\Hamilton Company\LabWare\ML_STAR\" del /F /Q "C:\Program Files (x86)\Hamilton Company\LabWare\ML_STAR\MultiFlexCarrier\7x86.reg"
IF EXIST "C:\Program Files\HAMILTON\LabWare\ML_STAR\" del /F /Q "C:\Program Files\HAMILTON\LabWare\ML_STAR\MultiFlexCarrier\7x86.reg"
IF EXIST "C:\Program Files\Hamilton Company\LabWare\ML_STAR\" del /F /Q "C:\Program Files\Hamilton Company\LabWare\ML_STAR\MultiFlexCarrier\7x86.reg"
IF EXIST "C:\Program Files (x86)\HAMILTON\LabWare\ML_STAR\" del /F /Q "C:\Program Files (x86)\HAMILTON\LabWare\ML_STAR\MultiFlexCarrier\7x86_2.reg"
IF EXIST "C:\Program Files (x86)\Hamilton Company\LabWare\ML_STAR\" del /F /Q "C:\Program Files (x86)\Hamilton Company\LabWare\ML_STAR\MultiFlexCarrier\7x86_2.reg"
IF EXIST "C:\Program Files\HAMILTON\LabWare\ML_STAR\" del /F /Q "C:\Program Files\HAMILTON\LabWare\ML_STAR\MultiFlexCarrier\7x86_2.reg"
IF EXIST "C:\Program Files\Hamilton Company\LabWare\ML_STAR\" del /F /Q "C:\Program Files\Hamilton Company\LabWare\ML_STAR\MultiFlexCarrier\7x86_2.reg"
IF EXIST "C:\Program Files (x86)\HAMILTON\LabWare\ML_STAR\" del /F /Q "C:\Program Files (x86)\HAMILTON\LabWare\ML_STAR\MultiFlexCarrier\XPx64.reg"
IF EXIST "C:\Program Files (x86)\Hamilton Company\LabWare\ML_STAR\" del /F /Q "C:\Program Files (x86)\Hamilton Company\LabWare\ML_STAR\MultiFlexCarrier\XPx64.reg"
IF EXIST "C:\Program Files\HAMILTON\LabWare\ML_STAR\" del /F /Q "C:\Program Files\HAMILTON\LabWare\ML_STAR\MultiFlexCarrier\XPx64.reg"
IF EXIST "C:\Program Files\Hamilton Company\LabWare\ML_STAR\" del /F /Q "C:\Program Files\Hamilton Company\LabWare\ML_STAR\MultiFlexCarrier\XPx64.reg"
IF EXIST "C:\Program Files (x86)\HAMILTON\LabWare\ML_STAR\" del /F /Q "C:\Program Files (x86)\HAMILTON\LabWare\ML_STAR\MultiFlexCarrier\XPx64_2.reg"
IF EXIST "C:\Program Files (x86)\Hamilton Company\LabWare\ML_STAR\" del /F /Q "C:\Program Files (x86)\Hamilton Company\LabWare\ML_STAR\MultiFlexCarrier\XPx64_2.reg"
IF EXIST "C:\Program Files\HAMILTON\LabWare\ML_STAR\" del /F /Q "C:\Program Files\HAMILTON\LabWare\ML_STAR\MultiFlexCarrier\XPx64_2.reg"
IF EXIST "C:\Program Files\Hamilton Company\LabWare\ML_STAR\" del /F /Q "C:\Program Files\Hamilton Company\LabWare\ML_STAR\MultiFlexCarrier\XPx64_2.reg"
IF EXIST "C:\Program Files (x86)\HAMILTON\LabWare\ML_STAR\" del /F /Q "C:\Program Files (x86)\HAMILTON\LabWare\ML_STAR\MultiFlexCarrier\XPx86.reg"
IF EXIST "C:\Program Files (x86)\Hamilton Company\LabWare\ML_STAR\" del /F /Q "C:\Program Files (x86)\Hamilton Company\LabWare\ML_STAR\MultiFlexCarrier\XPx86.reg"
IF EXIST "C:\Program Files\HAMILTON\LabWare\ML_STAR\" del /F /Q "C:\Program Files\HAMILTON\LabWare\ML_STAR\MultiFlexCarrier\XPx86.reg"
IF EXIST "C:\Program Files\Hamilton Company\LabWare\ML_STAR\" del /F /Q "C:\Program Files\Hamilton Company\LabWare\ML_STAR\MultiFlexCarrier\XPx86.reg"
IF EXIST "C:\Program Files (x86)\HAMILTON\LabWare\ML_STAR\" del /F /Q "C:\Program Files (x86)\HAMILTON\LabWare\ML_STAR\MultiFlexCarrier\XPx86_2.reg"
IF EXIST "C:\Program Files (x86)\Hamilton Company\LabWare\ML_STAR\" del /F /Q "C:\Program Files (x86)\Hamilton Company\LabWare\ML_STAR\MultiFlexCarrier\XPx86_2.reg"
IF EXIST "C:\Program Files\HAMILTON\LabWare\ML_STAR\" del /F /Q "C:\Program Files\HAMILTON\LabWare\ML_STAR\MultiFlexCarrier\XPx86_2.reg"
IF EXIST "C:\Program Files\Hamilton Company\LabWare\ML_STAR\" del /F /Q "C:\Program Files\Hamilton Company\LabWare\ML_STAR\MultiFlexCarrier\XPx86_2.reg"
