// Canvas Drawing Patterns Module - Pattern-specific drawing logic
// Part 2 of modularized canvas drawing system
// FIXED: Half-drop patterns with proper alignment and tiling

// Calculate visual offset for half-drop patterns based on repeat width
function calculateHalfDropVisualOffset(pattern, panelIndex) {
    if (!pattern.patternMatch || pattern.patternMatch.toLowerCase() !== 'half drop') {
        return 0;
    }
    
    // Only offset strips when pattern is full width
    const repeatsPerStrip = pattern.panelWidth / pattern.repeatWidth;
    if (repeatsPerStrip > 1) {
        return 0; // Pattern repeats within strip - no strip offset
    }
    
    // Even strips (2nd, 4th, 6th) get offset for full-width patterns
    if (panelIndex % 2 === 0) {
        return 0; // Odd strips (1, 3, 5) - no offset
    }
    
    // Full-width patterns get the full visual offset
    const visualOffset = pattern.repeatHeight / 2;
    
    console.log(`🎨 Half-drop visual offset for strip ${panelIndex + 1}:`, {
        repeatWidth: pattern.repeatWidth,
        panelWidth: pattern.panelWidth,
        ratio: pattern.repeatWidth / pattern.panelWidth,
        fullOffset: pattern.repeatHeight / 2,
        visualOffset: visualOffset
    });
    
    return visualOffset;
}

// Draw pattern with half-drop support
function drawPatternInArea(ctx, areaX, areaY, areaWidth, areaHeight, referenceCoords, isSection2 = false, panelIndex = null) {
    const { pattern, calculations } = currentPreview;
    
    if (!imageLoaded || !patternImage) {
        console.warn('Pattern image not loaded, skipping pattern drawing');
        return;
    }
    
    const { scale } = referenceCoords;
    
    // Calculate pattern dimensions
    const repeatW = pattern.repeatWidth * scale;
    const repeatH = pattern.repeatHeight * scale;
    
    // Check if this is a half-drop pattern
    const isHalfDrop = pattern.patternMatch && pattern.patternMatch.toLowerCase() === 'half drop';
    const repeatsPerStrip = pattern.panelWidth / pattern.repeatWidth;
    
    // Set clip area to prevent drawing outside boundaries
    ctx.save();
    ctx.beginPath();
    ctx.rect(Math.floor(areaX), Math.floor(areaY), Math.ceil(areaWidth), Math.ceil(areaHeight));
    ctx.clip();
    
    // For half-drop patterns that repeat within strips
    if (isHalfDrop && repeatsPerStrip > 1) {
        // Draw pattern with half-drop offset within the strip
        let x = 0;
        let columnIndex = 0;
        
        while (x < areaWidth) {
            // Calculate offset for this column
            const yOffset = (columnIndex % 2) * (repeatH / 2);
            
            // Draw vertical repeats for this column
            let y = -yOffset;
            while (y < areaHeight + repeatH) {
                const drawX = Math.floor(areaX + x);
                const drawY = Math.floor(areaY + y);
                ctx.drawImage(patternImage, drawX, drawY, Math.ceil(repeatW), Math.ceil(repeatH));
                y += repeatH;
            }
            
            x += repeatW;
            columnIndex++;
        }
    } else if (isHalfDrop && panelIndex !== null) {
        // Full-width half-drop pattern - handle strip offset
        const stripOffset = calculateHalfDropVisualOffset(pattern, panelIndex) * scale;
        
        // Draw pattern with potential strip offset
        let y = -stripOffset;
        while (y < areaHeight + repeatH) {
            let x = 0;
            while (x < areaWidth) {
                const drawX = Math.floor(areaX + x);
                const drawY = Math.floor(areaY + y);
                ctx.drawImage(patternImage, drawX, drawY, Math.ceil(repeatW), Math.ceil(repeatH));
                x += repeatW;
            }
            y += repeatH;
        }
    } else {
        // Straight match or Section 2 view
        if (isSection2) {
            // For Section 2, we need to maintain exact pattern alignment with Section 1
            // Calculate pattern offset based on wall position relative to full panel coverage
            const { wallHeight } = currentPreview;
            const wallOffsetY = referenceCoords.section1.wallStartY;
            const patternStartY = referenceCoords.section1.patternStartY;
            const relativeOffset = wallOffsetY - patternStartY;
            
            // Tile pattern maintaining alignment
            let y = -(relativeOffset % repeatH);
            while (y < areaHeight + repeatH) {
                let x = 0;
                while (x < areaWidth) {
                    // For half-drop in Section 2, calculate which strip we're in
                    if (isHalfDrop && repeatsPerStrip > 1) {
                        const stripX = (areaX + x - referenceCoords.section2.wallStartX) / scale;
                        const stripIndex = Math.floor(stripX / pattern.panelWidth);
                        const positionInStrip = (stripX % pattern.panelWidth) / pattern.repeatWidth;
                        const columnIndex = Math.floor(positionInStrip);
                        
                        const yOffset = (columnIndex % 2) * (repeatH / 2);
                        const drawY = Math.floor(areaY + y + yOffset);
                        const drawX = Math.floor(areaX + x);
                        
                        ctx.drawImage(patternImage, drawX, drawY, Math.ceil(repeatW), Math.ceil(repeatH));
                    } else {
                        const drawX = Math.floor(areaX + x);
                        const drawY = Math.floor(areaY + y);
                        ctx.drawImage(patternImage, drawX, drawY, Math.ceil(repeatW), Math.ceil(repeatH));
                    }
                    x += repeatW;
                }
                y += repeatH;
            }
        } else {
            // Standard tiling for non-half-drop patterns
            let y = 0;
            while (y < areaHeight + repeatH) {
                let x = 0;
                while (x < areaWidth) {
                    const drawX = Math.floor(areaX + x);
                    const drawY = Math.floor(areaY + y);
                    ctx.drawImage(patternImage, drawX, drawY, Math.ceil(repeatW), Math.ceil(repeatH));
                    x += repeatW;
                }
                y += repeatH;
            }
        }
    }
    
    ctx.restore();
}
