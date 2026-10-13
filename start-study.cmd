@echo off
setlocal EnableExtensions DisableDelayedExpansion
cd /d "%~dp0"
if errorlevel 1 goto :failed

where node >nul 2>&1
if errorlevel 1 goto :missingNode
node -e "const [major, minor] = process.versions.node.split('.').map(Number); if (major < 22 || (major === 22 && minor < 12)) { console.error('Node.js 22.12 or newer is required. Found ' + process.versions.node); process.exit(1); }"
if errorlevel 1 goto :failed

where npm.cmd >nul 2>&1
if errorlevel 1 goto :missingNpm
if not exist "node_modules\" goto :missingDependencies

echo Building D365/PA Study Desk...
call npm run build
if errorlevel 1 goto :failed

echo Starting locally at http://localhost:4173
echo Port 4173 must be free. No alternate port or network host will be used.
echo Keep this window open while studying. Press Ctrl+C to stop.
call npm start
if errorlevel 1 goto :failed
endlocal & exit /b 0

:missingNode
echo Node.js was not found. Install Node.js 22.12 or newer with npm.
echo Then reopen this launcher.
set "exitCode=1"
goto :pauseAndExit

:missingNpm
echo npm was not found. Install Node.js 22.12 or newer with npm on PATH.
set "exitCode=1"
goto :pauseAndExit

:missingDependencies
echo Dependencies are missing. Open a terminal in this project folder.
echo Run npm install first, then reopen this launcher.
echo Alternatively, use npm ci for a clean initial install from the lockfile.
echo Dependencies are not installed automatically on each launch.
set "exitCode=1"
goto :pauseAndExit

:failed
set "exitCode=%errorlevel%"
echo.
echo Study Desk failed with exit code %exitCode%. See the error above.
echo If port 4173 is occupied, stop the conflicting process and retry.

:pauseAndExit
pause
endlocal & exit /b %exitCode%