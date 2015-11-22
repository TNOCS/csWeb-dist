REM @echo off
REM Useage: release major | minor | patch
xcopy ..\csWeb\dist-bower\*.* dist-bower\ /Y
xcopy ..\csWeb\dist-npm\*.*   dist-npm\   /Y
bower version %1
npm version %1
REM git commit -am "Update"