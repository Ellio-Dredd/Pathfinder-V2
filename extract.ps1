$path = 'c:\Users\yasas\DATA\Sliit\Y3\Project\PrototypeDemo v2\Project Proposal Cr.doc'
$outPath = 'c:\Users\yasas\DATA\Sliit\Y3\Project\PrototypeDemo v2\proposal.txt'
try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $doc = $word.Documents.Open($path, $false, $true)
    $doc.Content.Text | Out-File $outPath
    $doc.Close()
    $word.Quit()
    Write-Host 'Success via COM'
} catch {
    Write-Host 'COM failed, extracting raw strings'
    $bytes = [System.IO.File]::ReadAllBytes($path)
    $text = [System.Text.Encoding]::ASCII.GetString($bytes)
    $text = $text -replace '[^\x20-\x7E\x0A\x0D]', ' '
    $text | Out-File $outPath
}
