param(
    [switch]$SkipHallmark,
    [switch]$SkipImpeccable,
    [switch]$SkipEmil,
    [switch]$SkipTaste,
    [switch]$SkipCapawesome,
    [switch]$SkipCapgo
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Invoke-Step {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][scriptblock]$Command
    )

    Write-Host "`n==> $Name" -ForegroundColor Cyan
    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "$Name failed with exit code $LASTEXITCODE"
    }
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw 'Node.js is required to install the external agent skills.'
}

if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
    throw 'npx is required. Install a supported Node.js/npm distribution first.'
}

Write-Host 'FitAI Pro 3 — installing advisory design, interaction and Capacitor skills.' -ForegroundColor Green
Write-Host 'Run this script from the repository root. Binding FitAI skills are already versioned under .agents/skills/.'

if (-not $SkipEmil) {
    Invoke-Step 'Emil Kowalski design-engineering skills' {
        npx --yes skills@latest add emilkowalski/skills
    }
}

if (-not $SkipImpeccable) {
    Invoke-Step 'Impeccable design skill' {
        npx --yes impeccable skills install
    }
}

if (-not $SkipHallmark) {
    Invoke-Step 'Hallmark anti-generic design skill' {
        npx --yes skills add nutlope/hallmark
    }
}

if (-not $SkipTaste) {
    Invoke-Step 'Taste Skill (design-taste-frontend)' {
        npx --yes skills add https://github.com/Leonxlnx/taste-skill --skill design-taste-frontend
    }
}

if (-not $SkipCapawesome) {
    Invoke-Step 'Capawesome Capacitor plugin skill' {
        npx --yes skills add capawesome-team/skills --skill capacitor-plugins
    }
}

if (-not $SkipCapgo) {
    Invoke-Step 'Capgo Capacitor plugin skill' {
        npx --yes skills add https://github.com/cap-go/capacitor-skills --skill capacitor-plugins
    }
}

Write-Host "`nInstalled requested skills." -ForegroundColor Green
Write-Host 'Restart/reload Codex or the active coding harness if newly installed skills are not detected immediately.'
Write-Host 'The local AGENTS.md and .agents/skills rules override advisory external skills.'
Write-Host 'Use one primary design skill per implementation pass; use another only as an audit.'
