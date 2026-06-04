<#
.SYNOPSIS
    Playwright 검증 과정에서 생긴 스크린샷/스냅샷/로그를 정리한다.

.DESCRIPTION
    검증 산출물은 작업이 끝나면 보통 다시 필요 없다. 이 스크립트는
    세 곳을 청소한다:
      1. .playwright-mcp/   — MCP가 남긴 page yml / console log / 스크린샷 (전부 임시)
      2. 루트의 검증 png     — hmi-*, pos-*, tablet-*, owner-*, _*.png (소스에서 미참조)
      3. captures/*.png      — 비교용 스크린샷 (webm/html/txt 등 명시적 산출물은 보존)

    Stop hook(cleanup-playwright-artifacts.cjs)은 1번만 자동으로 비운다.
    2·3번처럼 더 광범위한 정리는 의도치 않은 손실을 막기 위해 이 스크립트로
    수동 실행하도록 분리했다.

.PARAMETER WhatIf
    실제로 지우지 않고 삭제 대상만 미리 보여준다.
        powershell -File scripts/clean-captures.ps1 -WhatIf

.EXAMPLE
    powershell -File scripts/clean-captures.ps1
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param()

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot   # 프로젝트 루트 (scripts/ 의 상위)

# 1) 루트의 검증 스크린샷 패턴 (소스에서 참조되지 않는 일회성 캡처)
$rootPatterns = @('hmi-*.png', 'pos-*.png', 'tablet-*.png', 'owner-*.png', '_*.png')

# 2) 임시 산출물 폴더 (확장자별)
$dirTargets = @(
    @{ Path = Join-Path $root '.playwright-mcp'; Ext = @('.png', '.jpeg', '.jpg', '.webp', '.yml', '.yaml', '.log') },
    @{ Path = Join-Path $root 'captures';        Ext = @('.png') }   # webm/html/txt 는 보존
)

$targets = [System.Collections.Generic.List[System.IO.FileInfo]]::new()

foreach ($pattern in $rootPatterns) {
    Get-ChildItem -Path $root -Filter $pattern -File -ErrorAction SilentlyContinue |
        ForEach-Object { $targets.Add($_) }
}

foreach ($t in $dirTargets) {
    if (Test-Path $t.Path) {
        Get-ChildItem -Path $t.Path -File -ErrorAction SilentlyContinue |
            Where-Object { $t.Ext -contains $_.Extension.ToLower() } |
            ForEach-Object { $targets.Add($_) }
    }
}

if ($targets.Count -eq 0) {
    Write-Host "정리할 검증 산출물이 없습니다." -ForegroundColor Green
    return
}

$removed = 0
foreach ($file in $targets) {
    if ($PSCmdlet.ShouldProcess($file.FullName, 'Remove')) {
        Remove-Item -LiteralPath $file.FullName -Force
        $removed++
    }
}

if ($WhatIfPreference) {
    Write-Host ("삭제 대상 {0}개 (WhatIf — 실제 삭제 안 함)" -f $targets.Count) -ForegroundColor Yellow
} else {
    Write-Host ("검증 산출물 {0}개 삭제 완료." -f $removed) -ForegroundColor Green
}
