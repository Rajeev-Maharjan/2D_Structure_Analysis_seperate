// draw.js - Handles all drawing-related functionality

// Drawing modes
const DRAW_MODE = {
    NONE: 0,
    POINT: 1,
    BEAM: 2,
    TRUSS: 3
};

// Current drawing mode
let currentDrawMode = DRAW_MODE.NONE;

// Initialize drawing functionality
function initDraw() {
    // Set up event listeners for draw buttons
    document.getElementById('addPointBtn').addEventListener('click', function(e) {
        e.preventDefault();
        setDrawMode(DRAW_MODE.POINT);
        setActiveMode(MODE.ADD_NODE);
        updateDrawUI();
    });
    
    document.getElementById('addBeamBtn').addEventListener('click', function(e) {
        e.preventDefault();
        setDrawMode(DRAW_MODE.BEAM);
        setActiveMode(MODE.ADD_BEAM);
        updateDrawUI();
    });
    
    document.getElementById('addTrussBtn').addEventListener('click', function(e) {
        e.preventDefault();
        setDrawMode(DRAW_MODE.TRUSS);
        setActiveMode(MODE.ADD_BEAM);
        updateDrawUI();
    });
}

// Set the current drawing mode
function setDrawMode(mode) {
    currentDrawMode = mode;
}

// Update the drawing UI to reflect current mode
function updateDrawUI() {
    // Remove active class from all draw buttons
    const drawItems = document.querySelectorAll('.dropdown-content a');
    drawItems.forEach(item => item.classList.remove('active'));
    
    // Add active class to current mode
    switch(currentDrawMode) {
        case DRAW_MODE.POINT:
            document.getElementById('addPointBtn').classList.add('active');
            break;
        case DRAW_MODE.BEAM:
            document.getElementById('addBeamBtn').classList.add('active');
            break;
        case DRAW_MODE.TRUSS:
            document.getElementById('addTrussBtn').classList.add('active');
            break;
    }
}

// Handle drawing of structural elements
function drawStructuralElements() {
    // Draw all beams and trusses
    for (const element of beams) {
        const startNode = nodes.find(n => n.id === element.startNode);
        const endNode = nodes.find(n => n.id === element.endNode);
        
        if (startNode && endNode) {
            const start = worldToScreen(startNode.x, startNode.y);
            const end = worldToScreen(endNode.x, endNode.y);
            
            // Set style based on element type
            if (element.type === 'truss') {
                drawingCtx.strokeStyle = '#FFD700'; // Yellow for trusses
                drawingCtx.lineWidth = 3 * view.scale;
                drawingCtx.setLineDash([10 * view.scale, 5 * view.scale]); // Dashed line for trusses
            } else {
                drawingCtx.strokeStyle = '#333'; // Default color for beams
                drawingCtx.lineWidth = 3 * view.scale;
                drawingCtx.setLineDash([]); // Solid line for beams
            }
            
            // Highlight if selected
            if (selectedElements.some(el => el.type === 'beam' && el.id === element.id)) {
                drawingCtx.strokeStyle = '#0066ff';
                drawingCtx.lineWidth = 5 * view.scale;
            }
            
            // Draw the element
            drawingCtx.beginPath();
            drawingCtx.moveTo(start.x, start.y);
            drawingCtx.lineTo(end.x, end.y);
            drawingCtx.stroke();
            
            // Reset line dash for other drawings
            drawingCtx.setLineDash([]);
        }
    }
}

// Create a new structural element (beam or truss)
function createStructuralElement(startNode, endNode) {
    const elementId = beams.length > 0 ? Math.max(...beams.map(b => b.id || 0)) + 1 : 1;
    
    const newElement = {
        id: elementId,
        startNode: startNode.id, 
        endNode: endNode.id,
        type: currentDrawMode === DRAW_MODE.TRUSS ? 'truss' : 'beam'
    };
    
    beams.push(newElement);
    return newElement;
}

// Handle mouse up for drawing operations
function handleDrawMouseUp(worldPos) {
    if (currentMode === MODE.ADD_BEAM && beamStartNode) {
        const endNode = findNodeAt(worldPos.x, worldPos.y);
        
        if (endNode) {
            const newElement = createStructuralElement(beamStartNode, endNode);
            selectedNode = endNode;
            
            // If we're drawing trusses, keep the start node for next connection
            if (currentDrawMode === DRAW_MODE.TRUSS) {
                beamStartNode = endNode; // Chain truss members
                temporaryBeamEnd = worldToScreen(endNode.x, endNode.y);
            } else {
                beamStartNode = null;
                temporaryBeamEnd = null;
            }
            
            drawStructure();
        }
    }
}

// Initialize the draw module when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initDraw();
});
