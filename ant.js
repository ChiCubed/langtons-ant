var ants = [];
var prevFrame = null;

var colCanvas = null, heatCanvas = null;

var drawType;
var iterationsPerFrame;

// rotations of respective colours
var rules = [1, -1];

var direction;

var size = { width: 500, height: 500 };
var pixelSize = 2;

function getCoord(pos) { return pos.y * size.width + pos.x; }
function fromCoord(coord) { return { x: coord % size.width, y: Math.floor(coord / size.width) }; }
function mod(x, m) { return ((x % m) + m) % m; }
function move(pos, dir) {
    return {
        x: mod(pos.x + (1 - dir % 2) * (1 - dir), size.width),
        y: mod(pos.y + (dir % 2) * (2 - dir), size.height)
    };
}

var cols = null;
var heats = null;

function displayMode(type) {
    drawType = type;
    if (type == 'colour') {
        colCanvas.style.display = '';
        heatCanvas.style.display = 'none';
    } else {
        colCanvas.style.display = 'none';
        heatCanvas.style.display = '';
    }
}

function parseRule(rule) {
    var newRules = [];
    for (var i = 0; i < rule.length; ++i) {
        if (rule[i] == "R") newRules.push(1);
        else newRules.push(-1);
    }
    
    // check if new rule is the same
    if (newRules.length == rules.length) {
        var i = 0;
        for (i = 0; i < rules.length; ++i) {
            if (rules[i] != newRules[i]) break;
        }
        if (i == rules.length) return;
    }
    
    rules = newRules;
    restart();
}

function render(time) {
    var updates = [];
    
    // add initial ant locations to handle backwards - need to overwrite these squares as well
    for (var i = 0; i < ants.length; ++i) updates.push(getCoord(ants[i].pos));
    
    for (var _ = 0; _ < iterationsPerFrame; ++_) {
        var colUpdates = [];
        for (var i = 0; i < ants.length; ++i) {
            if (direction == 'forwards') {
                var coord = getCoord(ants[i].pos);
                ants[i].dir = mod(ants[i].dir + rules[cols[coord]], 4);
                colUpdates.push(coord);
                heats[coord]++;

                ants[i].pos = move(ants[i].pos, ants[i].dir);
            } else {
                ants[i].pos = move(ants[i].pos, mod(ants[i].dir + 2, 4));
                
                var coord = getCoord(ants[i].pos);
                heats[coord]--;
                colUpdates.push(coord);
                ants[i].dir = mod(ants[i].dir - rules[mod(cols[coord] - 1, rules.length)], 4);
            }
        }
        
        colUpdates.sort();
        for (var i = 0; i < ants.length; ++i) {
            if (i && colUpdates[i] == colUpdates[i-1]) continue;
            
            if (direction == 'forwards') {
                cols[colUpdates[i]] = mod(cols[colUpdates[i]] + 1, rules.length);
            } else {
                cols[colUpdates[i]] = mod(cols[colUpdates[i]] - 1, rules.length);
            }
            
            updates.push(colUpdates[i]);
        }
    }
    
    var colCtx = colCanvas.getContext('2d');
    var heatCtx = heatCanvas.getContext('2d');
    
    updates.sort();
    for (var i = 0; i < updates.length; ++i) {
        if (i && updates[i] == updates[i-1]) continue;
        
        var coord = updates[i];
        var pos = fromCoord(coord);
        var x = pos.x; var y = pos.y;
        
        var col = Math.floor(255 - cols[coord] * 255 / (rules.length - 1));
        colCtx.fillStyle = "rgba("+col+","+col+","+col+",1)";
        colCtx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        
        var heat = heats[coord];
        var intensity = Math.min(Math.abs(heat), 255);
        if (heat < 0) {
            heatCtx.fillStyle = "rgba("+intensity+","+Math.floor(intensity/2)+",0,1)";
        } else {
            heatCtx.fillStyle = "rgba("+intensity+","+intensity+","+intensity+",1)"
        }
        heatCtx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
    }
    
    // draw ants
    for (var i = 0; i < ants.length; ++i) {
        colCtx.fillStyle = heatCtx.fillStyle = "rgba(255, 0, 0, 1)";
        colCtx.fillRect(ants[i].pos.x * pixelSize + pixelSize / 4, ants[i].pos.y * pixelSize + pixelSize / 4,
                     pixelSize / 2, pixelSize / 2);
        heatCtx.fillRect(ants[i].pos.x * pixelSize + pixelSize / 4, ants[i].pos.y * pixelSize + pixelSize / 4,
                     pixelSize / 2, pixelSize / 2);
    }    
    
    prevFrame = requestAnimationFrame(render);
}

function clearCanvases() {
    var colCtx = colCanvas.getContext('2d');
    var heatCtx = heatCanvas.getContext('2d');
    
    colCtx.fillStyle = 'rgba(255, 255, 255, 1)';
    heatCtx.fillStyle = 'rgba(0, 0, 0, 1)';
    
    colCtx.fillRect(0, 0, colCanvas.width, colCanvas.height);
    heatCtx.fillRect(0, 0, heatCanvas.width, heatCanvas.height);
}

function invertAnts() {
    var invertButton = document.getElementById('invert-ants-btn');
    if (direction == 'forwards') {
        direction = 'reverse';
        invertButton.innerHTML = 'Play Forwards';
    } else {
        direction = 'forwards';
        invertButton.innerHTML = 'Invert';
    }
}

function stop() {
    if (prevFrame !== null) cancelAnimationFrame(prevFrame);
    prevFrame = null;
}

function restart() {
    if (prevFrame !== null) togglePlay();
    
    ants = [{pos: {x: size.width / 2, y: size.height / 2}, dir: 0}];
    cols = Array(size.width * size.height).fill(0);
    heats = Array(size.width * size.height).fill(0);
    
    clearCanvases();
    
    if (direction == 'reverse') invertAnts();
    
    togglePlay();
}

function start() {
    stop(); // just to make sure
    
    prevFrame = requestAnimationFrame(render);
}

function togglePlay() {
    var toggleButton = document.getElementById('toggle-play-btn');
    if (prevFrame !== null) {
        toggleButton.innerHTML = 'Start';
        stop();
    } else {
        toggleButton.innerHTML = 'Stop';
        start();
    }
}

function setSize(width, height) {
    size = {width: width, height: height};
    colCanvas.width = heatCanvas.width = size.width * pixelSize;
    colCanvas.height = heatCanvas.height = size.height * pixelSize;
}

function init() {
    colCanvas = document.getElementById('col-canvas');
    heatCanvas = document.getElementById('heat-canvas');
    
    ants = [{pos: {x: size.width / 2, y: size.height / 2}, dir: 0}];
    cols = Array(size.width * size.height).fill(0);
    heats = Array(size.width * size.height).fill(0);
    
    drawType = 'colour';
    heatCanvas.style.display = 'none';
    iterationsPerFrame = 1;
    direction = 'forwards';
    
    setSize(size.width, size.height);
    
    clearCanvases();
}