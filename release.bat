REM @echo off
REM Useage: release major | minor | patch
xcopy ..\csWeb\dist-bower\*.* dist-bower\ /Y /S
xcopy ..\csWeb\out\csServerComp\*.*   dist-npm\   /Y /S
REM bower version %1
REM Do not try to create a new git tag, as bower already did this.
REM npm version --no-git-tag-version %1
REM git commit -am "Update"
REM npm publish