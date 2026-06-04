param(
  [string]$SourceDir = ".claude\agents",
  [string]$TargetDir = ".codex\agents"
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$sourcePath = Resolve-Path (Join-Path $repoRoot $SourceDir)
$targetPath = Resolve-Path (Join-Path $repoRoot $TargetDir)
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Get-FrontmatterValue {
  param(
    [string]$Frontmatter,
    [string]$Key
  )

  $pattern = "(?m)^" + [regex]::Escape($Key) + ":\s*(.+)$"
  $match = [regex]::Match($Frontmatter, $pattern)
  if (-not $match.Success) {
    throw "Missing frontmatter key '$Key'"
  }

  return $match.Groups[1].Value.Trim()
}

function Assert-NoTomlLiteralTerminator {
  param(
    [string]$Value,
    [string]$Path
  )

  if ($Value.Contains("'''")) {
    throw "Cannot encode TOML literal string because content contains triple single quotes: $Path"
  }
}

$files = Get-ChildItem -LiteralPath $sourcePath -Filter "*.md" -File
foreach ($file in $files) {
  $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
  $match = [regex]::Match(
    $content,
    "\A---\r?\n(?<fm>.*?)\r?\n---\r?\n(?<body>.*)\z",
    [System.Text.RegularExpressions.RegexOptions]::Singleline
  )

  if (-not $match.Success) {
    throw "Invalid Claude agent frontmatter: $($file.FullName)"
  }

  $frontmatter = $match.Groups["fm"].Value
  $body = $match.Groups["body"].Value.TrimStart("`r", "`n")
  $name = Get-FrontmatterValue -Frontmatter $frontmatter -Key "name"
  $description = Get-FrontmatterValue -Frontmatter $frontmatter -Key "description"

  Assert-NoTomlLiteralTerminator -Value $description -Path $file.FullName
  Assert-NoTomlLiteralTerminator -Value $body -Path $file.FullName

  $developerInstructions = @"
Codex compatibility notes:
- This is a standalone Codex custom agent file. Keep fields at the TOML root; do not wrap them in [agent].
- The role body below is mirrored from .claude/agents/$($file.Name).
- Claude-only frontmatter keys such as tools, model, and omd_managed are intentionally not emitted here.
- Model selection and tool availability inherit from the parent Codex session unless a supported Codex config key is added later.

$body
"@
  Assert-NoTomlLiteralTerminator -Value $developerInstructions -Path $file.FullName

  $toml = @"
# omd:installed-agent -- Codex-compatible mirror generated from .claude/agents/$($file.Name).
# Regenerate this file from the Claude agent body if the source role changes.
name = '''$name'''
description = '''$description'''
developer_instructions = '''$developerInstructions'''
"@

  $targetFile = Join-Path $targetPath ($file.BaseName + ".toml")
  [System.IO.File]::WriteAllText($targetFile, $toml, $utf8NoBom)
}

Write-Output "Rewrote $($files.Count) Codex agent TOML files."
