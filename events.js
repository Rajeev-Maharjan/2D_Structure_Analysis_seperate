function setupEventListeners() {
    window.addEventListener('resize', () => {
        resizeCanvases();
        drawGrid();
        drawStructure();
    });
    
    // Tool buttons
    document.getElementById('addNodeBtn').addEventListener('click', () => {
        setActiveMode(MODE.ADD_NODE);
    });
    document.getElementById('addBeamBtn').addEventListener('click', () => {
        setActiveMode(MODE.ADD_BEAM);
    });
    document.getElementById('addSupportBtn').addEventListener('click', () => {
        setActiveMode(MODE.ADD_SUPPORT);
    });
    document.getElementById('addForceBtn').addEventListener('click', () => {
        setActiveMode(MODE.ADD_FORCE);
    });
    document.getElementById('selectBtn').addEventListener('click', () => {
        setActiveMode(MODE.SELECT);
    });
    document.getElementById('windowSelectBtn').addEventListener('click', () => {
        setActiveMode(MODE.WINDOW_SELECT);
    });
    document.getElementById('deleteBtn').addEventListener('click', () => {
        setActiveMode(MODE.DELETE);
    });
    document.getElementById('panBtn').addEventListener('click', () => {
        setActiveMode(MODE.PAN);
    });
    document.getElementById('zoomExtentsBtn').addEventListener('click', zoomExtents);
    document.getElementById('toggleGridBtn').addEventListener('click', toggleGrid);
    
    // Snap options
    document.getElementById('snapGrid').addEventListener('change', function() {
        snap.grid = this.checked;
        drawGrid();
    });
    document.getElementById('snapNode').addEventListener('change', function() {
        snap.node = this.checked;
    });
    document.getElementById('snapEndpoint').addEventListener('change', function() {
        snap.endpoint = this.checked;
    });
    document.getElementById('snapMidpoint').addEventListener('change', function() {
        snap.midpoint = this.checked;
    });
    document.getElementById('snapIntersection').addEventListener('change', function() {
        snap.intersection = this.checked;
    });
    document.getElementById('snapPerpendicular').addEventListener('change', function() {
        snap.perpendicular = this.checked;
    });
    document.getElementById('snapNearest').addEventListener('change', function() {
        snap.nearest = this.checked;
    });
    
    // Zoom controls
    document.getElementById('zoomInBtn').addEventListener('click', () => {
        zoom(1.2, drawingCanvas.width/2, drawingCanvas.height/2);
    });
    document.getElementById('zoomOutBtn').addEventListener('click', () => {
        zoom(1/1.2, drawingCanvas.width/2, drawingCanvas.height/2);
    });
    
    // Canvas interaction
    drawingCanvas.addEventListener('mousedown', handleMouseDown);
    drawingCanvas.addEventListener('mousemove', handleMouseMove);
    drawingCanvas.addEventListener('mouseup', handleMouseUp);
    drawingCanvas.addEventListener('wheel', handleWheel);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
}

function handleMouseDown(e) {
    const rect = drawingCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (currentMode === MODE.PAN) {
        isPanning = true;
        panStartX = x;
        panStartY = y;
        drawingCanvas.style.cursor = 'grabbing';
        return;
    }
    
    if (currentMode === MODE.WINDOW_SELECT) {
        isSelecting = true;
        selectionStart = { x, y };
        selectionRect.style.left = `${x}px`;
        selectionRect.style.top = `${y}px`;
        selectionRect.style.width = '0px';
        selectionRect.style.height = '0px';
        selectionRect.style.display = 'block';
        return;
    }
    
    const snappedPos = findSnapPoint(x, y);
    const worldPos = screenToWorld(snappedPos.x, snappedPos.y);
    
    // Show snap indicator if snapped to a point
    if (snap.activePoint) {
        const screenPos = worldToScreen(snap.activePoint.x, snap.activePoint.y);
        snapIndicator.style.left = `${screenPos.x}px`;
        snapIndicator.style.top = `${screenPos.y}px`;
        snapIndicator.style.display = 'block';
    } else {
        snapIndicator.style.display = 'none';
    }
    
    if (currentMode === MODE.ADD_NODE) {
        // Add new node
        const id = nodes.length > 0 ? Math.max(...nodes.map(n => n.id)) + 1 : 1;
        nodes.push({ id, x: worldPos.x, y: worldPos.y });
        selectedNode = nodes[nodes.length - 1];
        drawStructure();
    }
    else if (currentMode === MODE.ADD_BEAM) {
        // Start beam creation
        selectedNode = findNodeAt(worldPos.x, worldPos.y);
        if (selectedNode) {
            beamStartNode = selectedNode;
        }
    }
    else if (currentMode === MODE.SELECT) {
        // Select node or beam
        selectAtPosition(worldPos.x, worldPos.y, e.shiftKey);
    }
    else if (currentMode === MODE.DELETE) {
        // Delete node or element
        deleteAtPosition(worldPos.x, worldPos.y);
    }
}

function handleMouseMove(e) {
    const rect = drawingCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Find snap point and update coordinates in status bar
    const snappedPos = findSnapPoint(x, y);
    const worldPos = screenToWorld(snappedPos.x, snappedPos.y);
    
    document.getElementById('coordinates').textContent = 
        `X: ${worldPos.x.toFixed(2)}, Y: ${worldPos.y.toFixed(2)}`;
    
    // Show snap indicator if snapped to a point
    if (snap.activePoint) {
        snapIndicator.style.left = `${snappedPos.x}px`;
        snapIndicator.style.top = `${snappedPos.y}px`;
        snapIndicator.style.display = 'block';
    } else {
        snapIndicator.style.display = 'none';
    }
    
    if (isPanning) {
        view.offsetX += x - panStartX;
        view.offsetY += y - panStartY;
        panStartX = x;
        panStartY = y;
        
        drawGrid();
        drawStructure();
        return;
    }
    
    if (isSelecting) {
        // Update selection rectangle
        const left = Math.min(selectionStart.x, x);
        const top = Math.min(selectionStart.y, y);
        const width = Math.abs(x - selectionStart.x);
        const height = Math.abs(y - selectionStart.y);
        
        selectionRect.style.left = `${left}px`;
        selectionRect.style.top = `${top}px`;
        selectionRect.style.width = `${width}px`;
        selectionRect.style.height = `${height}px`;
        return;
    }
    
    if (currentMode === MODE.ADD_BEAM && beamStartNode) {
        temporaryBeamEnd = { x: snappedPos.x, y: snappedPos.y };
        drawStructure();
    }
}

function handleMouseUp(e) {
    const rect = drawingCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (isPanning) {
        isPanning = false;
        if (currentMode === MODE.PAN) {
            drawingCanvas.style.cursor = 'grab';
        } else {
            drawingCanvas.style.cursor = 'default';
        }
        return;
    }
    
    if (isSelecting) {
        isSelecting = false;
        selectionRect.style.display = 'none';
        
        // Get selection rectangle bounds in world coordinates
        const start = screenToWorld(selectionStart.x, selectionStart.y);
        const end = screenToWorld(x, y);
        
        const left = Math.min(start.x, end.x);
        const right = Math.max(start.x, end.x);
        const top = Math.min(start.y, end.y);
        const bottom = Math.max(start.y, end.y);
        
        // Select elements within the rectangle
        selectInRectangle(left, right, top, bottom, e.shiftKey);
        return;
    }
    
    const snappedPos = findSnapPoint(x, y);
    const worldPos = screenToWorld(snappedPos.x, snappedPos.y);
    
    if (currentMode === MODE.ADD_BEAM && beamStartNode) {
        const endNode = findNodeAt(worldPos.x, worldPos.y);
        if (endNode) {
            // Create a new beam
            const beamId = beams.length > 0 ? Math.max(...beams.map(b => b.id || 0)) + 1 : 1;
            beams.push({ 
                id: beamId,
                startNode: beamStartNode.id, 
                endNode: endNode.id 
            });
            selectedNode = endNode;
        }
        beamStartNode = null;
        temporaryBeamEnd = null;
        drawStructure();
    }
}

function handleWheel(e) {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 1/1.1;
    zoom(factor, e.clientX, e.clientY);
}

function handleKeyDown(e) {
    // Space for pan
    if (e.code === 'Space') {
        setActiveMode(MODE.PAN);
    }
    // Delete key
    else if (e.code === 'Delete') {
        deleteSelected();
    }
    // Zoom with +/- 
    else if (e.code === 'Equal' && e.shiftKey) { // + key
        zoom(1.2, drawingCanvas.width/2, drawingCanvas.height/2);
    }
    else if (e.code === 'Minus') { // - key
        zoom(1/1.2, drawingCanvas.width/2, drawingCanvas.height/2);
    }
    // G to toggle grid
    else if (e.code === 'KeyG') {
        toggleGrid();
    }
    // Escape to cancel current action
    else if (e.code === 'Escape') {
        if (beamStartNode) {
            beamStartNode = null;
            temporaryBeamEnd = null;
            drawStructure();
        }
        if (isSelecting) {
            isSelecting = false;
            selectionRect.style.display = 'none';
        }
    }
}

function handleKeyUp(e) {
    if (e.code === 'Space' && currentMode === MODE.PAN) {
        setActiveMode(MODE.SELECT);
    }
}

function toggleGrid() {
    grid.visible = !grid.visible;
    drawGrid();
}function setupEventListeners() {
    window.addEventListener('resize', () => {
        resizeCanvases();
        drawGrid();
        drawStructure();
    });
    
    // Tool buttons
    document.getElementById('addNodeBtn').addEventListener('click', () => {
        setActiveMode(MODE.ADD_NODE);
    });
    document.getElementById('addBeamBtn').addEventListener('click', () => {
        setActiveMode(MODE.ADD_BEAM);
    });
    document.getElementById('addSupportBtn').addEventListener('click', () => {
        setActiveMode(MODE.ADD_SUPPORT);
    });
    document.getElementById('addForceBtn').addEventListener('click', () => {
        setActiveMode(MODE.ADD_FORCE);
    });
    document.getElementById('selectBtn').addEventListener('click', () => {
        setActiveMode(MODE.SELECT);
    });
    document.getElementById('windowSelectBtn').addEventListener('click', () => {
        setActiveMode(MODE.WINDOW_SELECT);
    });
    document.getElementById('deleteBtn').addEventListener('click', () => {
        setActiveMode(MODE.DELETE);
    });
    document.getElementById('panBtn').addEventListener('click', () => {
        setActiveMode(MODE.PAN);
    });
    document.getElementById('zoomExtentsBtn').addEventListener('click', zoomExtents);
    document.getElementById('toggleGridBtn').addEventListener('click', toggleGrid);
    
    // Snap options
    document.getElementById('snapGrid').addEventListener('change', function() {
        snap.grid = this.checked;
        drawGrid();
    });
    document.getElementById('snapNode').addEventListener('change', function() {
        snap.node = this.checked;
    });
    document.getElementById('snapEndpoint').addEventListener('change', function() {
        snap.endpoint = this.checked;
    });
    document.getElementById('snapMidpoint').addEventListener('change', function() {
        snap.midpoint = this.checked;
    });
    document.getElementById('snapIntersection').addEventListener('change', function() {
        snap.intersection = this.checked;
    });
    document.getElementById('snapPerpendicular').addEventListener('change', function() {
        snap.perpendicular = this.checked;
    });
    document.getElementById('snapNearest').addEventListener('change', function() {
        snap.nearest = this.checked;
    });
    
    // Zoom controls
    document.getElementById('zoomInBtn').addEventListener('click', () => {
        zoom(1.2, drawingCanvas.width/2, drawingCanvas.height/2);
    });
    document.getElementById('zoomOutBtn').addEventListener('click', () => {
        zoom(1/1.2, drawingCanvas.width/2, drawingCanvas.height/2);
    });
    
    // Canvas interaction
    drawingCanvas.addEventListener('mousedown', handleMouseDown);
    drawingCanvas.addEventListener('mousemove', handleMouseMove);
    drawingCanvas.addEventListener('mouseup', handleMouseUp);
    drawingCanvas.addEventListener('wheel', handleWheel);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
}

function handleMouseDown(e) {
    const rect = drawingCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (currentMode === MODE.PAN) {
        isPanning = true;
        panStartX = x;
        panStartY = y;
        drawingCanvas.style.cursor = 'grabbing';
        return;
    }
    
    if (currentMode === MODE.WINDOW_SELECT) {
        isSelecting = true;
        selectionStart = { x, y };
        selectionRect.style.left = `${x}px`;
        selectionRect.style.top = `${y}px`;
        selectionRect.style.width = '0px';
        selectionRect.style.height = '0px';
        selectionRect.style.display = 'block';
        return;
    }
    
    const snappedPos = findSnapPoint(x, y);
    const worldPos = screenToWorld(snappedPos.x, snappedPos.y);
    
    // Show snap indicator if snapped to a point
    if (snap.activePoint) {
        const screenPos = worldToScreen(snap.activePoint.x, snap.activePoint.y);
        snapIndicator.style.left = `${screenPos.x}px`;
        snapIndicator.style.top = `${screenPos.y}px`;
        snapIndicator.style.display = 'block';
    } else {
        snapIndicator.style.display = 'none';
    }
    
    if (currentMode === MODE.ADD_NODE) {
        // Add new node
        const id = nodes.length > 0 ? Math.max(...nodes.map(n => n.id)) + 1 : 1;
        nodes.push({ id, x: worldPos.x, y: worldPos.y });
        selectedNode = nodes[nodes.length - 1];
        drawStructure();
    }
    else if (currentMode === MODE.ADD_BEAM) {
        // Start beam creation
        selectedNode = findNodeAt(worldPos.x, worldPos.y);
        if (selectedNode) {
            beamStartNode = selectedNode;
        }
    }
    else if (currentMode === MODE.SELECT) {
        // Select node or beam
        selectAtPosition(worldPos.x, worldPos.y, e.shiftKey);
    }
    else if (currentMode === MODE.DELETE) {
        // Delete node or element
        deleteAtPosition(worldPos.x, worldPos.y);
    }
}

function handleMouseMove(e) {
    const rect = drawingCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Find snap point and update coordinates in status bar
    const snappedPos = findSnapPoint(x, y);
    const worldPos = screenToWorld(snappedPos.x, snappedPos.y);
    
    document.getElementById('coordinates').textContent = 
        `X: ${worldPos.x.toFixed(2)}, Y: ${worldPos.y.toFixed(2)}`;
    
    // Show snap indicator if snapped to a point
    if (snap.activePoint) {
        snapIndicator.style.left = `${snappedPos.x}px`;
        snapIndicator.style.top = `${snappedPos.y}px`;
        snapIndicator.style.display = 'block';
    } else {
        snapIndicator.style.display = 'none';
    }
    
    if (isPanning) {
        view.offsetX += x - panStartX;
        view.offsetY += y - panStartY;
        panStartX = x;
        panStartY = y;
        
        drawGrid();
        drawStructure();
        return;
    }
    
    if (isSelecting) {
        // Update selection rectangle
        const left = Math.min(selectionStart.x, x);
        const top = Math.min(selectionStart.y, y);
        const width = Math.abs(x - selectionStart.x);
        const height = Math.abs(y - selectionStart.y);
        
        selectionRect.style.left = `${left}px`;
        selectionRect.style.top = `${top}px`;
        selectionRect.style.width = `${width}px`;
        selectionRect.style.height = `${height}px`;
        return;
    }
    
    if (currentMode === MODE.ADD_BEAM && beamStartNode) {
        temporaryBeamEnd = { x: snappedPos.x, y: snappedPos.y };
        drawStructure();
    }
}

function handleMouseUp(e) {
    const rect = drawingCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (isPanning) {
        isPanning = false;
        if (currentMode === MODE.PAN) {
            drawingCanvas.style.cursor = 'grab';
        } else {
            drawingCanvas.style.cursor = 'default';
        }
        return;
    }
    
    if (isSelecting) {
        isSelecting = false;
        selectionRect.style.display = 'none';
        
        // Get selection rectangle bounds in world coordinates
        const start = screenToWorld(selectionStart.x, selectionStart.y);
        const end = screenToWorld(x, y);
        
        const left = Math.min(start.x, end.x);
        const right = Math.max(start.x, end.x);
        const top = Math.min(start.y, end.y);
        const bottom = Math.max(start.y, end.y);
        
        // Select elements within the rectangle
        selectInRectangle(left, right, top, bottom, e.shiftKey);
        return;
    }
    
    const snappedPos = findSnapPoint(x, y);
    const worldPos = screenToWorld(snappedPos.x, snappedPos.y);
    
    if (currentMode === MODE.ADD_BEAM && beamStartNode) {
        const endNode = findNodeAt(worldPos.x, worldPos.y);
        if (endNode) {
            // Create a new beam
            const beamId = beams.length > 0 ? Math.max(...beams.map(b => b.id || 0)) + 1 : 1;
            beams.push({ 
                id: beamId,
                startNode: beamStartNode.id, 
                endNode: endNode.id 
            });
            selectedNode = endNode;
        }
        beamStartNode = null;
        temporaryBeamEnd = null;
        drawStructure();
    }
}

function handleWheel(e) {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 1/1.1;
    zoom(factor, e.clientX, e.clientY);
}

function handleKeyDown(e) {
    // Space for pan
    if (e.code === 'Space') {
        setActiveMode(MODE.PAN);
    }
    // Delete key
    else if (e.code === 'Delete') {
        deleteSelected();
    }
    // Zoom with +/- 
    else if (e.code === 'Equal' && e.shiftKey) { // + key
        zoom(1.2, drawingCanvas.width/2, drawingCanvas.height/2);
    }
    else if (e.code === 'Minus') { // - key
        zoom(1/1.2, drawingCanvas.width/2, drawingCanvas.height/2);
    }
    // G to toggle grid
    else if (e.code === 'KeyG') {
        toggleGrid();
    }
    // Escape to cancel current action
    else if (e.code === 'Escape') {
        if (beamStartNode) {
            beamStartNode = null;
            temporaryBeamEnd = null;
            drawStructure();
        }
        if (isSelecting) {
            isSelecting = false;
            selectionRect.style.display = 'none';
        }
    }
}

function handleKeyUp(e) {
    if (e.code === 'Space' && currentMode === MODE.PAN) {
        setActiveMode(MODE.SELECT);
    }
}

function toggleGrid() {
    grid.visible = !grid.visible;
    drawGrid();
}