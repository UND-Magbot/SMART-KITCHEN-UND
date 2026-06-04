<#
.SYNOPSIS
    주방 HMI mockup(고정 1600×1000 캔버스)을 device viewport에 비율 유지(scale-to-fit)로 맞춘다.

.DESCRIPTION
    각 mockup HTML의 </head> 직전에 fit 오버라이드(style + script)를 1회 주입한다.
    - 디자인 캔버스(.app, 기본 1600×1000)는 그대로 두고 transform: scale로 viewport에 맞춤.
    - 16:10 비율 유지 → 화면 비율이 다르면 상하/좌우 레터박스(canvas 색 #0F1623).
    - 캔버스 크기를 런타임 측정하므로 1600×1000 외 규격도 안전.
    - id="fit-override" 가 이미 있으면 건너뛴다(idempotent).

.NOTES
    PNG 캡처는 1600×1000 viewport 기준이면 scale=1 이라 기존과 동일하게 보인다.
#>
[CmdletBinding()]
param(
    [string]$Dir = (Join-Path (Split-Path -Parent $PSScriptRoot) 'SMART_Docs\04_Mockup\Product_Mockups')
)

$ErrorActionPreference = 'Stop'

$inject = @'
<style id="fit-override">html,body{margin:0!important;padding:0!important;width:100vw!important;height:100vh!important;overflow:hidden!important;background:#0F1623!important;position:relative!important;}</style>
<script id="fit-script">(function(){function f(){var a=document.querySelector('.app')||document.body.firstElementChild;if(!a)return;a.style.transform='none';a.style.position='absolute';var w=a.offsetWidth||1600,h=a.offsetHeight||1000;var s=Math.min(window.innerWidth/w,window.innerHeight/h);a.style.transformOrigin='top left';a.style.transform='scale('+s+')';a.style.left=((window.innerWidth-w*s)/2)+'px';a.style.top=((window.innerHeight-h*s)/2)+'px';}window.addEventListener('resize',f,{passive:true});window.addEventListener('load',f);if(document.readyState!=='loading'){f();}else{document.addEventListener('DOMContentLoaded',f);}})();</script>
'@

$enc = New-Object System.Text.UTF8Encoding($false)
$applied = 0; $skipped = 0; $noHead = 0

Get-ChildItem -Path $Dir -Filter 'ui_kitchen_*.html' -File | ForEach-Object {
    $content = [System.IO.File]::ReadAllText($_.FullName)
    # 기존 fit 블록 제거 후 최신 버전 재주입 (idempotent)
    if ($content -match 'id="fit-override"') {
        $content = $content -replace '(?s)\s*<style id="fit-override">.*?</script>', ''
        $skipped++
    }
    if ($content -notmatch '</head>') {
        $noHead++
        Write-Host "  (스킵: </head> 없음) $($_.Name)" -ForegroundColor Yellow
        return
    }
    $idx = $content.IndexOf('</head>')
    $new = $content.Substring(0, $idx) + $inject + "`n" + $content.Substring($idx)
    [System.IO.File]::WriteAllText($_.FullName, $new, $enc)
    $applied++
    Write-Host "  적용: $($_.Name)" -ForegroundColor Green
}

Write-Host ""
Write-Host ("완료 — 적용 {0} · 이미적용(스킵) {1} · head없음 {2}" -f $applied, $skipped, $noHead) -ForegroundColor Cyan
