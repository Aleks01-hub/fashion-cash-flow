param(
    [string]$Container = "caixa-central-mysql",
    [string]$Database = "caixa_central",
    [string]$BackupDirectory = ".\backups"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw "Docker CLI não encontrado. Abra o Docker Desktop e tente novamente."
}

$containerState = docker inspect --format '{{.State.Running}}' $Container 2>$null
if ($LASTEXITCODE -ne 0 -or $containerState -ne "true") {
    throw "O container '$Container' não está em execução. Confira com: docker ps -a"
}

$null = New-Item -ItemType Directory -Force -Path $BackupDirectory
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupPath = Join-Path $BackupDirectory "$Database-$timestamp.sql"

# O mysqldump executa dentro do container; a senha não é escrita no arquivo de backup.
# A variável MYSQL_ROOT_PASSWORD precisa existir no ambiente do container.
$dumpCommand = 'exec mysqldump --user=root --password="$MYSQL_ROOT_PASSWORD" --single-transaction --routines --triggers --events "$1"'
docker exec $Container sh -c $dumpCommand backup $Database | Out-File -FilePath $backupPath -Encoding utf8

if ($LASTEXITCODE -ne 0) {
    Remove-Item $backupPath -Force -ErrorAction SilentlyContinue
    throw "O mysqldump falhou. Nenhum backup válido foi confirmado."
}

if (-not (Test-Path $backupPath) -or (Get-Item $backupPath).Length -lt 100) {
    Remove-Item $backupPath -Force -ErrorAction SilentlyContinue
    throw "O arquivo de backup está vazio ou pequeno demais; confira o container e as permissões."
}

Write-Host "Backup criado: $((Resolve-Path $backupPath).Path)"
Write-Host "Guarde uma cópia fora deste computador e teste a restauração em um banco separado."
