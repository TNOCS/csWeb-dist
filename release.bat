REM @echo off
REM Useage: release major | minor | patch
xcopy ..\csWeb\dist-bower\*.* dist-bower\ /Y
xcopy ..\csWeb\dist-npm\*.*   dist-npm\   /Y
bower version %1
REM Do not try to create a new git tag, as bower already did this.
npm --no-git-tag-version version %1
REM git commit -am "Update"
REM npm publish