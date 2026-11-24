@echo off
chcp 65001 >nul
title Gerador de Executavel - Escudo do Mestre
cd /d "%~dp0"

echo ========================================================
echo   GERANDO ESCUDO DO MESTRE (.EXE PORTATIL)
echo ========================================================
echo.

python --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Python nao encontrado no PATH do Windows.
    echo Instale o Python marcando "Add Python to PATH" e tente novamente.
    pause
    exit /b 1
)

echo [1/3] Instalando/atualizando PyInstaller...
python -m pip install --upgrade pyinstaller

echo.
echo [2/3] Empacotando HTML, CSS, JS e Servidor em um unico .EXE...
python -m PyInstaller --noconfirm --clean --onefile --name "EscudoDoMestre" --add-data "index.html;." --add-data "css;css" --add-data "js;js" --add-data "assets;assets" server.py

if errorlevel 1 (
    echo.
    echo [ERRO] Falha ao gerar o executavel. Verifique as mensagens acima.
    pause
    exit /b 1
)

echo.
echo [3/3] Concluido com sucesso!
echo.
echo O executavel foi criado em:
echo   dist\EscudoDoMestre.exe
echo.
echo - Para usar com seus dados atuais: copie "escudo_mestre.db" para a mesma pasta do .exe.
echo - Para enviar ZERADO ao seu amigo: envie APENAS o arquivo "dist\EscudoDoMestre.exe".
echo.
pause
