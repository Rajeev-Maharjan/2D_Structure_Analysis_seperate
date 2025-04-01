function findNodeAt(x, y, tolerance = 10) {
    tolerance /= view.scale; // Adjust tolerance based on zoom level
    
    for (const node of nodes) {
        const distance = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
        if (distance <= tolerance) {
            return node;
        }
    }
    return null;
}

function deleteAtPosition(x, y) {
    const tolerance = 10 / view.scale;
    
    // First try to delete a node
    const nodeIndex = nodes.findIndex(n => 
        Math.sqrt((n.x - x) ** 2 + (n.y - y) ** 2) <= tolerance);
    
    if (nodeIndex >= 0) {
        const node = nodes[nodeIndex];
        
        // Remove beams connected to this node
        beams = beams.filter(b => 
            b.startNode !== node.id && b.endNode !== node.id);
        
        // Remove supports on this node
        supports = supports.filter(s => s.nodeId !== node.id);
        
        // Remove forces on this node
        forces = forces.filter(f => f.nodeId !== node.id);
        
        // Remove the node
        nodes.splice(nodeIndex, 1);
        
        if (selectedNode === node) {
            selectedNode = null;
        }
        
        drawStructure();
        return;
    }
    
    // If no node was clicked, try to delete a beam
    for (let i = beams.length - 1; i >= 0; i--) {
        const beam = beams[i];
        const startNode = nodes.find(n => n.id === beam.startNode);
        const endNode = nodes.find(n => n.id === beam.endNode);
        
        if (startNode && endNode) {
            if (isPointOnLine(x, y, startNode.x, startNode.y, endNode.x, endNode.y, tolerance)) {
                beams.splice(i, 1);
                drawStructure();
                return;
            }
        }
    }
}

function isPointOnLine(px, py, x1, y1, x2, y2, tolerance) {
    // Calculate distance from point to line segment
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    
    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = -1;
    
    if (len_sq !== 0) {
        param = dot / len_sq;
    }
    
    let xx, yy;
    
    if (param < 0) {
        xx = x1;
        yy = y1;
    }
    else if (param > 1) {
        xx = x2;
        yy = y2;
    }
    else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }
    
    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy) < tolerance;
}

function updateStatusBar() {
    document.getElementById('scale').textContent = `Scale: ${Math.round(view.scale * 100)}%`;
}

function selectAtPosition(x, y, addToSelection = false) {
    const tolerance = 10 / view.scale;
    
    if (!addToSelection) {
        selectedElements = [];
    }
    
    // First try to select a node
    const node = findNodeAt(x, y, tolerance);
    if (node) {
        const existingIndex = selectedElements.findIndex(el => el.type === 'node' && el.id === node.id);
        if (existingIndex >= 0) {
            selectedElements.splice(existingIndex, 1); // Deselect if already selected
        } else {
            selectedElements.push({ type: 'node', id: node.id });
        }
        drawStructure();
        return;
    }
    
    // If no node was clicked, try to select a beam
    for (const beam of beams) {
        const startNode = nodes.find(n => n.id === beam.startNode);
        const endNode = nodes.find(n => n.id === beam.endNode);
        
        if (startNode && endNode) {
            if (isPointOnLine(x, y, startNode.x, startNode.y, endNode.x, endNode.y, tolerance)) {
                const existingIndex = selectedElements.findIndex(el => el.type === 'beam' && el.id === beam.id);
                if (existingIndex >= 0) {
                    selectedElements.splice(existingIndex, 1); // Deselect if already selected
                } else {
                    selectedElements.push({ type: 'beam', id: beam.id });
                }
                drawStructure();
                return;
            }
        }
    }
    
    // If nothing was clicked and we're not adding to selection, clear selection
    if (!addToSelection) {
        selectedElements = [];
        drawStructure();
    }
}

function selectInRectangle(left, right, top, bottom, addToSelection = false) {
    if (!addToSelection) {
        selectedElements = [];
    }
    
    // Select nodes within the rectangle
    for (const node of nodes) {
        if (node.x >= left && node.x <= right && node.y >= top && node.y <= bottom) {
            selectedElements.push({ type: 'node', id: node.id });
        }
    }
    
    // Select beams that are entirely within the rectangle
    for (const beam of beams) {
        const startNode = nodes.find(n => n.id === beam.startNode);
        const endNode = nodes.find(n => n.id === beam.endNode);
        
        if (startNode && endNode) {
            if (startNode.x >= left && startNode.x <= right && 
                startNode.y >= top && startNode.y <= bottom &&
                endNode.x >= left && endNode.x <= right && 
                endNode.y >= top && endNode.y <= bottom) {
                selectedElements.push({ type: 'beam', id: beam.id });
            }
        }
    }
    
    drawStructure();
}

function deleteSelected() {
    // Delete selected beams first
    beams = beams.filter(beam => !selectedElements.some(el => el.type === 'beam' && el.id === beam.id));
    
    // Then delete selected nodes and any connected elements
    for (const element of selectedElements) {
        if (element.type === 'node') {
            const nodeId = element.id;
            
            // Remove beams connected to this node
            beams = beams.filter(b => b.startNode !== nodeId && b.endNode !== nodeId);
            
            // Remove supports on this node
            supports = supports.filter(s => s.nodeId !== nodeId);
            
            // Remove forces on this node
            forces = forces.filter(f => f.nodeId !== nodeId);
            
            // Remove the node
            nodes = nodes.filter(n => n.id !== nodeId);
            
            if (selectedNode && selectedNode.id === nodeId) {
                selectedNode = null;
            }
        }
    }
    
    selectedElements = [];
    drawStructure();
}