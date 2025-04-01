function init() {
    resizeCanvases();
    setupEventListeners();
    drawGrid();
    updateStatusBar();
}

function setActiveMode(mode) {
    currentMode = mode;
    
    // Update button states
    document.querySelectorAll('.top-panel button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    switch(mode) {
        case MODE.ADD_NODE:
            document.getElementById('addNodeBtn').classList.add('active');
            drawingCanvas.style.cursor = 'crosshair';
            break;
        case MODE.ADD_BEAM:
            document.getElementById('addBeamBtn').classList.add('active');
            drawingCanvas.style.cursor = 'crosshair';
            break;
        case MODE.ADD_SUPPORT:
            document.getElementById('addSupportBtn').classList.add('active');
            drawingCanvas.style.cursor = 'crosshair';
            break;
        case MODE.ADD_FORCE:
            document.getElementById('addForceBtn').classList.add('active');
            drawingCanvas.style.cursor = 'crosshair';
            break;
        case MODE.SELECT:
            document.getElementById('selectBtn').classList.add('active');
            drawingCanvas.style.cursor = 'default';
            break;
        case MODE.WINDOW_SELECT:
            document.getElementById('windowSelectBtn').classList.add('active');
            drawingCanvas.style.cursor = 'crosshair';
            break;
        case MODE.DELETE:
            document.getElementById('deleteBtn').classList.add('active');
            drawingCanvas.style.cursor = 'default';
            break;
        case MODE.PAN:
            document.getElementById('panBtn').classList.add('active');
            drawingCanvas.style.cursor = 'grab';
            break;
    }
    
    // Clear any temporary states
    beamStartNode = null;
    temporaryBeamEnd = null;
    isSelecting = false;
    selectionRect.style.display = 'none';
}

// Coordinate conversion functions
function screenToWorld(x, y) {
    return {
        x: (x - view.offsetX) / view.scale,
        y: (y - view.offsetY) / view.scale
    };
}

function worldToScreen(x, y) {
    return {
        x: x * view.scale + view.offsetX,
        y: y * view.scale + view.offsetY
    };
}

// Initialize the application
init();