@echo off
cd /d "%~dp0"
node scripts/setup.js
if errorlevel 1 goto erro
docker compose up -d --build --wait --wait-timeout 180
if errorlevel 1 goto erro
start http://localhost:3000
echo Aguarde a inicializacao do banco e atualize a pagina se necessario.
pause
exit /b 0
:erro
echo Verifique Node.js e Docker Desktop instalado e aberto.
pause
exit /b 1
