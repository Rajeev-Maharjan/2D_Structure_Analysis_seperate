// Canvas setup
const gridCanvas = document.getElementById('gridCanvas');
const gridCtx = gridCanvas.getContext('2d');
const drawingCanvas = document.getElementById('drawingCanvas');
const drawingCtx = drawingCanvas.getContext('2d');
const selectionRect = document.getElementById('selectionRect');
const snapIndicator = document.getElementById('snapIndicator');

function resizeCanvases() {
    gridCanvas.width = window.innerWidth;
    gridCanvas.height = window.innerHeight;
    drawingCanvas.width = window.innerWidth;
    drawingCanvas.height = window.innerHeight;
}

function drawGrid() {
    if (!grid.enabled || !grid.visible) {
        gridCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
        return;
    }
    
    gridCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
    
    const scaledGridSize = grid.size * view.scale;
    const startX = view.offsetX % scaledGridSize;
    const startY = view.offsetY % scaledGridSize;
    
    // Draw minor grid lines
    gridCtx.strokeStyle = grid.color;
    gridCtx.lineWidth = 0.5;
    
    // Vertical lines
    for (let x = startX; x < gridCanvas.width; x += scaledGridSize) {
        gridCtx.beginPath();
        gridCtx.moveTo(x, 0);
        gridCtx.lineTo(x, gridCanvas.height);
        gridCtx.stroke();
    }
    
    // Horizontal lines
    for (let y = startY; y < gridCanvas.height; y += scaledGridSize) {
        gridCtx.beginPath();
        gridCtx.moveTo(0, y);
        gridCtx.lineTo(gridCanvas.width, y);
        gridCtx.stroke();
    }
    
    // Draw major grid lines
    const majorGridSize = scaledGridSize * grid.majorEvery;
    const majorStartX = view.offsetX % majorGridSize;
    const majorStartY = view.offsetY % majorGridSize;
    
    gridCtx.strokeStyle = grid.majorColor;
    gridCtx.lineWidth = 1;
    
    // Vertical lines
    for (let x = majorStartX; x < gridCanvas.width; x += majorGridSize) {
        gridCtx.beginPath();
        gridCtx.moveTo(x, 0);
        gridCtx.lineTo(x, gridCanvas.height);
        gridCtx.stroke();
    }
    
    // Horizontal lines
    for (let y = majorStartY; y < gridCanvas.height; y += majorGridSize) {
        gridCtx.beginPath();
        gridCtx.moveTo(0, y);
        gridCtx.lineTo(gridCanvas.width, y);
        gridCtx.stroke();
    }
    
    // Draw axis lines (X and Y axes)
    const originScreen = worldToScreen(0, 0);
    
    gridCtx.strokeStyle = grid.axisColor;
    gridCtx.lineWidth = 1.5;
    
    // X axis
    gridCtx.beginPath();
    gridCtx.moveTo(0, originScreen.y);
    gridCtx.lineTo(gridCanvas.width, originScreen.y);
    gridCtx.stroke();
    
    // Y axis
    gridCtx.beginPath();
    gridCtx.moveTo(originScreen.x, 0);
    gridCtx.lineTo(originScreen.x, gridCanvas.height);
    gridCtx.stroke();
    
    // Add grid labels if enabled
    if (grid.showLabels) {
        // Remove old labels
        const oldLabels = document.querySelectorAll('.axis-label');
        oldLabels.forEach(el => el.remove());
        
        // Add labels for major grid lines
        const labelEvery = grid.majorEvery;
        const worldStartX = (view.offsetX < 0 ? Math.floor(-view.offsetX / scaledGridSize) : -Math.ceil(view.offsetX / scaledGridSize)) * grid.size;
        const worldStartY = (view.offsetY < 0 ? Math.floor(-view.offsetY / scaledGridSize) : -Math.ceil(view.offsetY / scaledGridSize)) * grid.size;
        
        const worldEndX = worldStartX + (gridCanvas.width / view.scale);
        const worldEndY = worldStartY + (gridCanvas.height / view.scale);
        
        // X axis labels
        for (let x = Math.floor(worldStartX / (grid.size * labelEvery)) * (grid.size * labelEvery); 
             x <= worldEndX; 
             x += grid.size * labelEvery) {
            if (Math.abs(x) < 0.001) x = 0; // Avoid -0.00
            
            const screenPos = worldToScreen(x, 0);
            if (screenPos.x >= 0 && screenPos.x <= gridCanvas.width) {
                const label = document.createElement('div');
                label.className = 'axis-label';
                label.textContent = x.toString();
                label.style.left = `${screenPos.x - 10}px`;
                label.style.top = `${originScreen.y + 5}px`;
                document.getElementById('canvas-container').appendChild(label);
            }
        }
        
        // Y axis labels
        for (let y = Math.floor(worldStartY / (grid.size * labelEvery)) * (grid.size * labelEvery); 
             y <= worldEndY; 
             y += grid.size * labelEvery) {
            if (Math.abs(y) < 0.001) y = 0; // Avoid -0.00
            if (y === 0) continue; // Skip 0 on Y axis (already shown on X axis)
            
            const screenPos = worldToScreen(0, y);
            if (screenPos.y >= 0 && screenPos.y <= gridCanvas.height) {
                const label = document.createElement('div');
                label.className = 'axis-label';
                label.textContent = y.toString();
                label.style.left = `${originScreen.x + 5}px`;
                label.style.top = `${screenPos.y - 5}px`;
                document.getElementById('canvas-container').appendChild(label);
            }
        }
    }
}

function drawStructure() {
    drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    
    // Draw beams
    for (const beam of beams) {
        const startNode = nodes.find(n => n.id === beam.startNode);
        const endNode = nodes.find(n => n.id === beam.endNode);
        if (startNode && endNode) {
            const start = worldToScreen(startNode.x, startNode.y);
            const end = worldToScreen(endNode.x, endNode.y);
            
            // Highlight if selected
            if (selectedElements.some(el => el.type === 'beam' && el.id === beam.id)) {
                drawingCtx.strokeStyle = '#0066ff';
                drawingCtx.lineWidth = 5 * view.scale;
                drawingCtx.beginPath();
                drawingCtx.moveTo(start.x, start.y);
                drawingCtx.lineTo(end.x, end.y);
                drawingCtx.stroke();
            }
            
            drawingCtx.strokeStyle = '#333';
            drawingCtx.lineWidth = 3 * view.scale;
            drawingCtx.beginPath();
            drawingCtx.moveTo(start.x, start.y);
            drawingCtx.lineTo(end.x, end.y);
            drawingCtx.stroke();
        }
    }
    
    // Draw nodes
    for (const node of nodes) {
        const screenPos = worldToScreen(node.x, node.y);
        
        // Highlight if selected
        if (selectedElements.some(el => el.type === 'node' && el.id === node.id)) {
            drawingCtx.fillStyle = '#0066ff';
            drawingCtx.beginPath();
            drawingCtx.arc(screenPos.x, screenPos.y, 8 * view.scale, 0, Math.PI * 2);
            drawingCtx.fill();
        }
        
        drawingCtx.fillStyle = node === selectedNode ? '#ff0000' : '#0000ff';
        drawingCtx.beginPath();
        drawingCtx.arc(screenPos.x, screenPos.y, 5 * view.scale, 0, Math.PI * 2);
        drawingCtx.fill();
        
        // Node label
        drawingCtx.fillStyle = '#000';
        drawingCtx.font = `${12 * view.scale}px Arial`;
        drawingCtx.fillText(`N${node.id}`, screenPos.x + 10 * view.scale, screenPos.y - 10 * view.scale);
    }
    
    // Temporary beam during creation
    if (beamStartNode && currentMode === MODE.ADD_BEAM) {
        const start = worldToScreen(beamStartNode.x, beamStartNode.y);
        drawingCtx.strokeStyle = 'rgba(0, 0, 255, 0.5)';
        drawingCtx.lineWidth = 2 * view.scale;
        drawingCtx.setLineDash([5 * view.scale, 5 * view.scale]);
        drawingCtx.beginPath();
        drawingCtx.moveTo(start.x, start.y);
        drawingCtx.lineTo(temporaryBeamEnd.x, temporaryBeamEnd.y);
        drawingCtx.stroke();
        drawingCtx.setLineDash([]);
    }
}

function zoom(factor, centerX, centerY) {
    const oldScale = view.scale;
    view.scale *= factor;
    view.scale = Math.max(view.minScale, Math.min(view.scale, view.maxScale));
    
    // Adjust offset to zoom toward mouse position
    const worldPos = screenToWorld(centerX, centerY);
    view.offsetX = centerX - worldPos.x * view.scale;
    view.offsetY = centerY - worldPos.y * view.scale;
    
    drawGrid();
    drawStructure();
    updateStatusBar();
}

function zoomExtents() {
    if (nodes.length === 0) return;
    
    // Calculate bounding box of all nodes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const node of nodes) {
        minX = Math.min(minX, node.x);
        minY = Math.min(minY, node.y);
        maxX = Math.max(maxX, node.x);
        maxY = Math.max(maxY, node.y);
    }
    
    // Add some padding
    const padding = 50;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;
    
    // Calculate required scale
    const width = maxX - minX;
    const height = maxY - minY;
    const scaleX = drawingCanvas.width / width;
    const scaleY = drawingCanvas.height / height;
    view.scale = Math.min(scaleX, scaleY);
    
    // Center the view
    view.offsetX = -minX * view.scale;
    view.offsetY = -minY * view.scale;
    
    drawGrid();
    drawStructure();
    updateStatusBar();
}

function findSnapPoint(x, y) {
    const worldPos = screenToWorld(x, y);
    const tolerance = 15 / view.scale; // Tolerance in world coordinates
    
    // Check for node snap
    if (snap.node) {
        const node = findNodeAt(worldPos.x, worldPos.y, tolerance);
        if (node) {
            snap.activePoint = { x: node.x, y: node.y, type: 'node' };
            return worldToScreen(node.x, node.y);
        }
    }
    
    // Check for endpoint snap
    if (snap.endpoint) {
        for (const beam of beams) {
            const startNode = nodes.find(n => n.id === beam.startNode);
            const endNode = nodes.find(n => n.id === beam.endNode);
            
            if (startNode) {
                const distToStart = Math.sqrt((startNode.x - worldPos.x) ** 2 + (startNode.y - worldPos.y) ** 2);
                if (distToStart < tolerance) {
                    snap.activePoint = { x: startNode.x, y: startNode.y, type: 'endpoint' };
                    return worldToScreen(startNode.x, startNode.y);
                }
            }
            
            if (endNode) {
                const distToEnd = Math.sqrt((endNode.x - worldPos.x) ** 2 + (endNode.y - worldPos.y) ** 2);
                if (distToEnd < tolerance) {
                    snap.activePoint = { x: endNode.x, y: endNode.y, type: 'endpoint' };
                    return worldToScreen(endNode.x, endNode.y);
                }
            }
        }
    }
    
    // Check for midpoint snap
    if (snap.midpoint) {
        for (const beam of beams) {
            const startNode = nodes.find(n => n.id === beam.startNode);
            const endNode = nodes.find(n => n.id === beam.endNode);
            
            if (startNode && endNode) {
                const midX = (startNode.x + endNode.x) / 2;
                const midY = (startNode.y + endNode.y) / 2;
                const distToMid = Math.sqrt((midX - worldPos.x) ** 2 + (midY - worldPos.y) ** 2);
                
                if (distToMid < tolerance) {
                    snap.activePoint = { x: midX, y: midY, type: 'midpoint' };
                    return worldToScreen(midX, midY);
                }
            }
        }
    }
    
    // Check for grid snap
    if (snap.grid) {
        const gridSize = grid.size;
        const snappedX = Math.round(worldPos.x / gridSize) * gridSize;
        const snappedY = Math.round(worldPos.y / gridSize) * gridSize;
        
        snap.activePoint = { x: snappedX, y: snappedY, type: 'grid' };
        return worldToScreen(snappedX, snappedY);
    }
    
    // No snap found
    snap.activePoint = null;
    return { x, y };
}