param(
    [Parameter(Mandatory = $true)]
    [string] $DatabaseUrl,

    [string] $OutputDir = "backups",

    [string] $PgDumpPath = "pg_dump"
)

$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outputFile = Join-Path $OutputDir "railway-postgres-$timestamp.dump"

& $PgDumpPath --format=custom --no-owner --no-acl --file $outputFile $DatabaseUrl

if ($LASTEXITCODE -ne 0) {
    throw "pg_dump falhou com codigo $LASTEXITCODE"
}

Write-Host "Backup criado em: $outputFile"
