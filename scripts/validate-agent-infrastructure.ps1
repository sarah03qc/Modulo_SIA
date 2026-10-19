param([string]$Root = (Split-Path -Parent $PSScriptRoot))
$ErrorActionPreference = 'Stop'
$issues = [System.Collections.Generic.List[string]]::new()
$counts = @{}
foreach ($kind in @('rules','agents','skills')) {
    $files = switch ($kind) {
        rules { Get-ChildItem -LiteralPath "$Root/.cursor/rules" -Filter '*.mdc' -File }
        agents { Get-ChildItem -LiteralPath "$Root/.cursor/agents" -Filter '*.md' -File }
        skills { foreach ($dir in @('.agents/skills','.cursor/skills')) {
            Get-ChildItem -LiteralPath "$Root/$dir" -Filter 'SKILL.md' -Recurse -File
        } }
    }
    $counts[$kind] = @($files).Count
    $names = @{}
    foreach ($file in $files) {
        $s = [IO.File]::ReadAllText($file.FullName)
        $m = [regex]::Match($s, '\A(?:\uFEFF)?---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]+)\z')
        if (!$m.Success) { $issues.Add("Missing frontmatter/body: $($file.FullName)"); continue }
        $fields = @{}
        # Deliberately validate the flat scalar YAML subset used by this repo.
        # Reject other YAML syntax rather than claiming a general YAML parser.
        foreach ($line in ($m.Groups[1].Value -split '\r?\n')) {
            if ($line -notmatch '^([a-zA-Z][a-zA-Z-]*): ([^\r\n]+)$') {
                $issues.Add("Unsupported metadata syntax: $($file.FullName)"); continue
            }
            $key = $Matches[1]; $value = $Matches[2]
            if ($fields.ContainsKey($key)) { $issues.Add("Duplicate key: $($file.FullName):$key") }
            if ($value -match ': |^[>|&*!{\[]| #') { $issues.Add("Unsupported YAML scalar: $($file.FullName):$key") }
            $fields[$key] = $value
        }
        if (!$fields.description) { $issues.Add("Missing description: $($file.FullName)") }
        foreach ($ref in [regex]::Matches($s, '(?:docs/agent-workflow/)[A-Za-z0-9_./-]+\.md')) {
            if (!(Test-Path -LiteralPath "$Root/$($ref.Value)" -PathType Leaf)) {
                $issues.Add("Broken workflow reference: $($file.FullName):$($ref.Value)")
            }
        }
        if ($kind -eq 'rules') {
            if ($fields.alwaysApply -notin @('true','false')) { $issues.Add("Invalid alwaysApply: $($file.FullName)") }
            if ($fields.alwaysApply -eq 'true' -and $file.Name -notin @('c00-sia-context.mdc','00-governance.mdc')) {
                $issues.Add("Unexpected global rule: $($file.FullName)")
            }
        } else {
            $name = $fields.name
            if (!$name -or $name -notmatch '^[a-z0-9]+(-[a-z0-9]+)*$') { $issues.Add("Invalid name: $($file.FullName)") }
            elseif ($names.ContainsKey($name)) { $issues.Add("Duplicate $kind name: $name") }
            else { $names[$name] = $true }
            if ($kind -eq 'skills' -and $name -ne $file.Directory.Name) { $issues.Add("Skill folder mismatch: $($file.FullName)") }
        }
    }
}
foreach ($path in @('docs/agent-workflow/workflow.md','docs/agent-workflow/quality-gates.md',
    'docs/agent-workflow/sources-and-validation.md','docs/agent-workflow/templates/task.md',
    'docs/agent-workflow/templates/handoff.md')) {
    if (!(Test-Path -LiteralPath "$Root/$path" -PathType Leaf)) { $issues.Add("Missing shared reference: $path") }
}
if ($counts.rules -ne 7 -or $counts.agents -ne 11 -or $counts.skills -lt 8) {
    $issues.Add('Expected 7 rules, 11 roles, at least 8 active skills')
}
foreach ($name in @('refine-requirement','plan-implementation','implement-backend',
    'implement-frontend','evolve-data-model','verify-traceability',
    'review-accessibility','run-quality-gates')) {
    if (!$names.ContainsKey($name)) { $issues.Add("Missing required skill: $name") }
}
if ($issues.Count) { $issues | ForEach-Object { Write-Output "FAIL: $_" }; exit 1 }
Write-Output "PASS: rules=$($counts.rules), agents=$($counts.agents), skills=$($counts.skills); flat YAML metadata, unique names, folders, shared references."
Write-Output 'NOT_RUN: Cursor runtime discovery. Product build/tests NOT_APPLICABLE to bootstrap.'
