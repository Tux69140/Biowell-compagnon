@echo off
setlocal EnableExtensions EnableDelayedExpansion

title Test POST API Epuriel - version simple
cls

set "API_URL=%~1"
if "%API_URL%"=="" set /p "API_URL=Endpoint POST à tester (ex: https://exemple.fr/api/test): "

set "API_PAYLOAD=%~2"
if "%API_PAYLOAD%"=="" set "API_PAYLOAD={\"ping\":\"ok\"}"

echo.
echo ==================================================
echo Test POST API Epuriel - version simple
echo Endpoint : %API_URL%
echo Payload  : %API_PAYLOAD%
echo ==================================================
echo.

echo [Reponse brute]
curl --ssl-no-revoke -X POST "%API_URL%" -H "Content-Type: application/json" --data "%API_PAYLOAD%"
set "CURL_EXIT=%ERRORLEVEL%"

echo.
echo.
echo [Fin]
if not "%CURL_EXIT%"=="0" (
  echo Erreur curl : code %CURL_EXIT%
) else (
  echo Requete terminee.
)
echo.
echo Tapez "exit" pour fermer la fenetre.
cmd /k
