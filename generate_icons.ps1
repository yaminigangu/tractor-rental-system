Add-Type -AssemblyName System.Drawing

function Generate-AppIcon([int]$size, [string]$outputPath) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Background gradient
    $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $rect,
        [System.Drawing.Color]::FromArgb(255, 14, 66, 23),
        [System.Drawing.Color]::FromArgb(255, 34, 115, 45),
        45.0
    )
    $g.FillRectangle($bgBrush, $rect)

    # Scale factor
    $s = $size / 100.0

    # Golden glow circle in center
    $glowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(40, 251, 192, 45))
    $g.FillEllipse($glowBrush, [int](15 * $s), [int](15 * $s), [int](70 * $s), [int](70 * $s))

    # Agricultural sun / soil ground line
    $groundBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 20, 80, 28))
    $g.FillRectangle($groundBrush, 0, [int](72 * $s), $size, [int](28 * $s))

    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
    $goldBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 193, 7))
    $tireBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 25, 30, 26))
    $hubBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 245, 158, 11))
    $greenAccent = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 76, 175, 80))

    # Tractor Hood (Front)
    $g.FillRectangle($whiteBrush, [float](42 * $s), [float](42 * $s), [float](36 * $s), [float](22 * $s))
    # Green engine stripe
    $g.FillRectangle($greenAccent, [float](42 * $s), [float](49 * $s), [float](36 * $s), [float](5 * $s))
    
    # Tractor Cabin
    $g.FillRectangle($whiteBrush, [float](20 * $s), [float](28 * $s), [float](24 * $s), [float](36 * $s))
    # Cabin Window
    $windowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 14, 66, 23))
    $g.FillRectangle($windowBrush, [float](23 * $s), [float](32 * $s), [float](18 * $s), [float](16 * $s))
    
    # Roof canopy
    $g.FillRectangle($goldBrush, [float](16 * $s), [float](25 * $s), [float](32 * $s), [float](5 * $s))

    # Exhaust pipe
    $g.FillRectangle($goldBrush, [float](68 * $s), [float](28 * $s), [float](4 * $s), [float](15 * $s))
    $g.FillEllipse($goldBrush, [float](67 * $s), [float](26 * $s), [float](6 * $s), [float](5 * $s))

    # Big Rear Wheel
    $g.FillEllipse($tireBrush, [float](13 * $s), [float](48 * $s), [float](34 * $s), [float](34 * $s))
    $g.FillEllipse($hubBrush, [float](22 * $s), [float](57 * $s), [float](16 * $s), [float](16 * $s))
    $g.FillEllipse($whiteBrush, [float](27 * $s), [float](62 * $s), [float](6 * $s), [float](6 * $s))

    # Small Front Wheel
    $g.FillEllipse($tireBrush, [float](62 * $s), [float](58 * $s), [float](23 * $s), [float](23 * $s))
    $g.FillEllipse($hubBrush, [float](68 * $s), [float](64 * $s), [float](11 * $s), [float](11 * $s))
    $g.FillEllipse($whiteBrush, [float](71 * $s), [float](67 * $s), [float](5 * $s), [float](5 * $s))

    # Golden Wheat Stalk in top right
    $wheatPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 255, 215, 0), [float](3 * $s))
    $g.DrawArc($wheatPen, [float](60 * $s), [float](10 * $s), [float](26 * $s), [float](26 * $s), 160, 110)
    $g.FillEllipse($goldBrush, [float](70 * $s), [float](12 * $s), [float](5 * $s), [float](8 * $s))
    $g.FillEllipse($goldBrush, [float](76 * $s), [float](15 * $s), [float](5 * $s), [float](8 * $s))

    # Save PNG
    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Generated $outputPath ($size x $size)"
}

Generate-AppIcon 192 "public\pwa-192.png"
Generate-AppIcon 512 "public\pwa-512.png"
Generate-AppIcon 180 "public\apple-touch-icon.png"

