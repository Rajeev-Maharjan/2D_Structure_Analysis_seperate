// View settings
const view = {
    offsetX: 0,
    offsetY: 0,
    scale: 1.0,
    minScale: 0.1,
    maxScale: 10.0
};

// Grid settings
const grid = {
    enabled: true,
    visible: true,
    size: 20, // Grid size in pixels at scale 1.0
    color: '#e0e0e0',
    majorColor: '#c0c0c0',
    axisColor: '#999999',
    majorEvery: 5, // Every 5th line is a major grid line
    showLabels: true
};

// Snap settings
const snap = {
    grid: true,
    node: true,
    endpoint: true,
    midpoint: true,
    intersection: false,
    perpendicular: false,
    nearest: false,
    activePoint: null
};

// Tool modes
const MODE = {
    NONE: 0,
    ADD_NODE: 1,
    ADD_BEAM: 2,
    ADD_SUPPORT: 3,
    ADD_FORCE: 4,
    SELECT: 5,
    WINDOW_SELECT: 6,
    DELETE: 7,
    PAN: 8
};

// Structural elements
let nodes = [];
let beams = [];
let supports = [];
let forces = [];
let selectedNode = null;
let selectedElements = [];
let beamStartNode = null;

// Current state
let currentMode = MODE.ADD_NODE;
let isSelecting = false;
let selectionStart = { x: 0, y: 0 };
let temporaryBeamEnd = null;
let isPanning = false;
let panStartX, panStartY;