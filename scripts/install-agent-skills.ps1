param(
    [switch]$SkipHallmark,
    [switch]$SkipImpeccable,
    [switch]$SkipEmil,
    [switch]$SkipTaste,
    [switch]$SkipTransitions,
    [switch]$SkipReactDoctor,
    [switch]$SkipVercelReact,
    [switch]$SkipVercelDesign,
    [switch]$SkipAccessLint,
    [switch]$SkipCiSecure,
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

Write-Host 'FitAI Pro 3 — installing reviewed advisory skills for design, React, accessibility, CI and Capacitor.' -ForegroundColor Green
Write-Host 'Run this script from the repository root. Binding FitAI skills are already versioned under .agents/skills/.'

if (-not $SkipEmil) {
    Invoke-Step 'Emil Kowalski design-engineering skills' {
        npx --yes skills@latest add emilkowalski/skills --all
    }
}

if (-not $SkipTransitions) {
    Invoke-Step 'Transitions.dev product-motion skills' {
        npx --yes skills@latest add Jakubantalik/transitions.dev --all
    }
}

if (-not $SkipReactDoctor) {
    Invoke-Step 'React Doctor agent skill' {
        npx --yes react-doctor@latest install
    }
}

if (-not $SkipVercelReact) {
    Invoke-Step 'Vercel React best-practices skill' {
        npx --yes skills@latest add vercel-labs/agent-skills --skill vercel-react-best-practices
    }
}

if (-not $SkipVercelDesign) {
    Invoke-Step 'Vercel web-design-guidelines skill' {
        npx --yes skills@latest add vercel-labs/agent-skills --skill web-design-guidelines
    }
}

if (-not $SkipAccessLint) {
    Invoke-Step 'AccessLint WCAG 2.2 skills' {
        npx --yes skills@latest add AccessLint/skills --all
    }
}

if (-not $SkipCiSecure) {
    Invoke-Step 'StarSling CI security skill' {
        npx --yes skills@latest add starslingdev/skills --skill ci-secure
    }
}

if (-not $SkipImpeccable) {
    Invoke-Step 'Impeccable design skill' {
        npx --yes impeccable skills install
    }
}

if (-not $SkipHallmark) {
    Invoke-Step 'Hallmark anti-generic design skill' {
        npx --yes skills@latest add nutlope/hallmark --all
    }
}

if (-not $SkipTaste) {
    Invoke-Step 'Taste Skill (design-taste-frontend)' {
        npx --yes skills@latest add https://github.com/Leonxlnx/taste-skill --skill design-taste-frontend
    }
}

if (-not $SkipCapawesome) {
    Invoke-Step 'Capawesome Capacitor plugin skill' {
        npx --yes skills@latest add capawesome-team/skills --skill capacitor-plugins
    }
}

if (-not $SkipCapgo) {
    Invoke-Step 'Capgo Capacitor plugin skill' {
        npx --yes skills@latest add https://github.com/cap-go/capacitor-skills --skill capacitor-plugins
    }
}

Write-Host "`nRequested skills installed for the detected coding agents." -ForegroundColor Green
Write-Host 'Restart/reload Codex or the active coding harness if newly installed skills are not detected immediately.'
Write-Host 'The local AGENTS.md and .agents/skills rules override advisory external skills.'
Write-Host 'External skills are third-party development instructions, never runtime APK dependencies.'
Write-Host 'Use one motion/design implementation lens at a time, then audit with the others to avoid conflicting edits.'
