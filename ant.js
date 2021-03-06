var ants = {};
var prevFrame = null;

var colCanvas = null, heatCanvas = null;

var drawType;
var logIterationsPerFrame;

// rotations of respective colours
var rules = [1, -1];

// updates to render
var updates = [];

var currFrame = 0, lastRenderFrame = -1000000;

var direction;

var size = { width: 500, height: 500 };

var recordingCol = false, startedRecording, stopPlaying;
var colCapturer;

var antid = 0; // unique id for every ant

function getCoord(pos) { return pos.y * size.width + pos.x; }
function fromCoord(coord) { return { x: coord % size.width, y: Math.floor(coord / size.width) }; }
function mod(x, m) { return ((x % m) + m) % m; }
function move(pos, dir) {
    return {
        x: Math.floor(mod(pos.x + (dir % 2) * (2 - dir), size.width)),
        y: Math.floor(mod(pos.y + (1 - dir % 2) * (dir - 1), size.height))
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

// This function modifies the global 'updates'
// array of updates to be made.
function stepOnce(storeUpdates) {
    var colUpdates = [];
    for (var i in ants) if (ants.hasOwnProperty(i)) {
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
    for (var i = 0; i < colUpdates.length; ++i) {
        if (i && colUpdates[i] == colUpdates[i-1]) continue;

        if (direction == 'forwards') {
            cols[colUpdates[i]] = mod(cols[colUpdates[i]] + 1, rules.length);
        } else {
            cols[colUpdates[i]] = mod(cols[colUpdates[i]] - 1, rules.length);
        }

        if (storeUpdates) updates.push(colUpdates[i]);
    }
}

function renderUpdates() {
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
        colCtx.fillRect(x, y, 1, 1);

        var heat = heats[coord];
        var intensity = Math.min(Math.abs(heat), 255);
        if (heat < 0) {
            heatCtx.fillStyle = "rgba("+intensity+","+Math.floor(intensity/2)+",0,1)";
        } else {
            heatCtx.fillStyle = "rgba("+intensity+","+intensity+","+intensity+",1)";
        }
        heatCtx.fillRect(x, y, 1, 1);
    }
    
    updates = [];
    
    // draw ants
    colCtx.fillStyle = "rgba(255, 0, 0, 1)";
    heatCtx.fillStyle = "rgba(255, 0, 0, 1)";
    for (var i in ants) if (ants.hasOwnProperty(i)) {
        colCtx.fillRect(ants[i].pos.x, ants[i].pos.y, 1, 1);
        heatCtx.fillRect(ants[i].pos.x, ants[i].pos.y, 1, 1);
    }
}

function render(time) {
    // add initial ant locations to handle backwards - need to overwrite these squares as well
    for (var i in ants) if (ants.hasOwnProperty(i)) updates.push(getCoord(ants[i].pos));
    
    if (logIterationsPerFrame < 0) {
        // check if we've had enough frames
        if (currFrame - lastRenderFrame >= Math.pow(2, -logIterationsPerFrame)) {
            stepOnce(true);
            lastRenderFrame = currFrame;
        }
    } else for (var _ = 0; _ < Math.pow(2, logIterationsPerFrame); ++_) stepOnce(true);
    
    renderUpdates();
    
    currFrame++;
    
    if (!stopPlaying) {
        prevFrame = requestAnimationFrame(render);

        if (recordingCol && !startedRecording) {
            startedRecording = true;
            colCapturer.start();
        }
        if (recordingCol) colCapturer.capture(colCanvas);
    } else {
        stopPlaying = false;
        colCapturer.stop();
        startedRecording = false;
    }
}

function clearCanvases() {
    var colCtx = colCanvas.getContext('2d');
    var heatCtx = heatCanvas.getContext('2d');
    
    colCtx.fillStyle = 'rgba(255, 255, 255, 1)';
    heatCtx.fillStyle = 'rgba(0, 0, 0, 1)';
    
    colCtx.fillRect(0, 0, colCanvas.width, colCanvas.height);
    heatCtx.fillRect(0, 0, heatCanvas.width, heatCanvas.height);
}

// save images
function saveColImg() {
    var link = document.createElement("a");
    link.download = 'col.png';
    
    colCanvas.toBlob(function(blob) {
        link.href = URL.createObjectURL(blob);
        link.click();
    }, 'image/png');
}

function saveHeatImg() {
    var link = document.createElement("a");
    link.download = 'heat.png';
    
    heatCanvas.toBlob(function(blob) {
        link.href = URL.createObjectURL(blob);
        link.click();
    }, 'image/png');
}

// reset ants to their positions in the table
function resetAnts() {
    ants = {};
    
    var table = document.getElementById('ants-table');
    for (var i = 1; i < table.rows.length; ++i) {
        var row = table.rows[i];
        var pos = row.children[0];
        
        var x = Number(pos.children[0].value);
        var y = Number(pos.children[1].value);
        var d = Number(row.children[1].children[0].value);
        
        ants[row.dataset.antid] = {pos: {x: x, y: y}, dir: d};
    }
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
    stopPlaying = true;

    lastRenderFrame = -1000000;
}

function restart() {
    if (prevFrame !== null) togglePlay();
    
    resetAnts(); // from the table
    cols = Array(size.width * size.height).fill(0);
    heats = Array(size.width * size.height).fill(0);
    
    clearCanvases();
    
    if (direction == 'reverse') invertAnts();
    
    // draw ants
    updates = [];
    renderUpdates();
}

function start() {
    stop(); // just to make sure
    stopPlaying = false;
    
    prevFrame = requestAnimationFrame(render);
}

function stepNTimes() {
	var wasPlaying = false;
	if (prevFrame !== null) wasPlaying = true;
	stop();

    var nSteps = Number(document.getElementById('num-steps').value);
    
    // add initial ant locations to handle backwards - need to overwrite these squares as well
    for (var i in ants) if (ants.hasOwnProperty(i)) updates.push(getCoord(ants[i].pos));
    
	var storeUpdates = (nSteps < size.width * size.height);

	// progress bar
	var progressBarContainer = document.getElementById('step-progress-container');
	var progressBar = document.getElementById('step-progress');
	var progressText = document.getElementById('step-progress-text');
	progressBarContainer.style.display = '';
	progressBar.value = 0;
	progressBar.max = nSteps;
	progressText.innerHTML = '0%';

	var c = 0;

	// disable all buttons
	var buttons = document.getElementsByTagName('button');
	var otherButtons = document.getElementsByClassName('btn');
	var inputs = document.getElementsByTagName('input');
	for (var i = 0; i < buttons.length; ++i) {
		buttons[i].disabled = true;
	}
	for (var i = 0; i < otherButtons.length; ++i) {
		otherButtons[i].classList.add('btn-disabled');
	}
	for (var i = 0; i < inputs.length; ++i) {
		inputs[i].disabled = true;
	}

	var blockSize = 100000;

	function renderBlock() {
		if (c >= nSteps) {
			// we done
			if (!storeUpdates) {
				// add every cell to list of updates
				updates = [];
				for (var i = 0; i < size.width; ++i) {
					for (var j = 0; j < size.height; ++j) {
						updates.push(getCoord({x: i, y: j}));
					}
				}
			}

			renderUpdates();

			// enable buttons
			for (var i = 0; i < buttons.length; ++i) {
				buttons[i].disabled = false;
			}
			for (var i = 0; i < otherButtons.length; ++i) {
				otherButtons[i].classList.remove('btn-disabled');
			}
			for (var i = 0; i < inputs.length; ++i) {
				inputs[i].disabled = false;
			}

			progressBarContainer.style.display = 'none';

			if (wasPlaying) start();

			return;
		}

		for (var j = c; j < Math.min(c + blockSize, nSteps); ++j) {
			stepOnce(storeUpdates);
		}

		c = Math.min(c + blockSize, nSteps);
		progressBar.value = c;
		progressText.innerHTML = Math.floor(c * 100 / nSteps) + '%';

		setTimeout(renderBlock, 1);
	}
	renderBlock();
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

function toggleRecordCol() {
    var btn = document.getElementById('record-col-btn');
    if (recordingCol) {
        btn.innerHTML = 'Colour';
        recordingCol = false;

        colCapturer.stop();
        colCapturer.save();
    } else {
        btn.innerHTML = 'Stop';
        recordingCol = true;
        startedRecording = false;
    }
}

function setSize(width, height) {
	width = Number(width);
	height = Number(height);
    size = {width: width, height: height};
    colCanvas.width = heatCanvas.width = size.width;
    colCanvas.height = heatCanvas.height = size.height;

	var canvasContainer = document.getElementById('2d-canvas-container');
	canvasContainer.style.height = height + 'px';
	canvasContainer.style.maxHeight = Math.min(60, Math.floor(height / width * 80)) + 'vw';
    
    // reset ant positions
    var table = document.getElementById('ants-table');
    for (var i = 1; i < table.rows.length; ++i) {
        var row = table.rows[i];
        var pos = row.children[0];
        pos.children[0].value = Math.floor(size.width / 2);
        pos.children[1].value = Math.floor(size.height / 2);
    }

	restart();
}

function addImage(img) {
	// draw to canvas
	var colCtx = colCanvas.getContext('2d');

	colCtx.drawImage(img, 0, 0);

	// Get pixel data, put it into col
	var data = colCtx.getImageData(0, 0, size.width, size.height).data;
	for (var i = 0; i < size.width * size.height; ++i) {
		// for now, just use red component
		cols[i] = data[4 * i];
	}

	// duplicate 'rules' until
	// it has length 256
	var len = rules.length;
	for (var i = len; i < 256; ++i) {
		rules.push(rules[i - len]);
	}

	// cull 'rules' to length 256
	rules.length = 256;

	// modify the value of the rule input
	// to reflect this
	var input = document.getElementById('rule-input');
	var txt = '';
	for (var i = 0; i < 256; ++i) {
		if (rules[i] == 1) txt += 'R';
		else txt += 'L';
	}

	input.value = txt;

	// also modify size inputs
	var widthInput = document.getElementById('size-width-input');
	var heightInput = document.getElementById('size-height-input');

	widthInput.value = size.width;
	heightInput.value = size.height;
}

function addAnt() {
    var antTable = document.getElementById('ants-table');
    var row = antTable.insertRow(-1);
    
    var pos = row.insertCell(0);
    var dir = row.insertCell(1);
    var del = row.insertCell(2);
    
    var xInput = document.createElement('input');
    var yInput = document.createElement('input');
    
    xInput.type = 'number';
    yInput.type = 'number';
    xInput.value = size.width / 2; xInput.step = 1;
    yInput.value = size.height / 2; yInput.step = 1;
    
    xInput.style.width = "50%";
    xInput.style.boxSizing = "border-box";
    yInput.style.width = "50%";
    yInput.style.boxSizing = "border-box";
    
    var currID = antid;
    var currX = xInput;
    var currY = yInput;
    xInput.oninput = function() {
        if (currX.value < 0) currX.value = 0;
        if (currX.value >= size.width) currX.value = size.width - 1;
        updates.push(getCoord(ants[currID].pos));
        ants[currID].pos.x = Number(currX.value);
        renderUpdates();
    };
    yInput.oninput = function() {
        if (currY.value < 0) currY.value = 0;
        if (currY.value >= size.height) currY.value = size.height - 1;
        updates.push(getCoord(ants[currID].pos));
        ants[currID].pos.y = Number(currY.value);
        renderUpdates();
    };
    
    pos.appendChild(xInput); pos.appendChild(yInput);
    
    var dInput = document.createElement('input');
    dInput.type = 'number';
    dInput.value = 0;
    dInput.style.width = "100%";
    dInput.style.boxSizing = "border-box";
    
    var currD = dInput;
    dInput.oninput = function() {
        if (currD.value < 0) currD.value = 0;
        if (currD.value > 3) currD.value = 3;
        ants[currID].dir = Number(currD.value);
    };
    
    dir.appendChild(dInput);
    
    var delBtn = document.createElement('button');
    delBtn.innerHTML = '&times;';
    delBtn.dataset.antid = antid;
    delBtn.onclick = function() {
        var row = document.getElementById('_ant_table_elem_' + this.dataset.antid);
        updates.push(getCoord(ants[this.dataset.antid].pos));
        delete ants[this.dataset.antid];
        row.parentNode.removeChild(row);
        renderUpdates();
    };
    delBtn.style.borderColor = 'red';
    
    del.appendChild(delBtn);
    
    row.id = '_ant_table_elem_' + antid;
    row.dataset.antid = antid;
    
    ants[antid] = {pos: {x: size.width / 2, y: size.height / 2}, dir: 0};
    
    renderUpdates();
    
    antid++;
}

function init() {
    colCanvas = document.getElementById('col-canvas');
    heatCanvas = document.getElementById('heat-canvas');
    
    ants = {};
    cols = Array(size.width * size.height).fill(0);
    heats = Array(size.width * size.height).fill(0);
    
    drawType = 'colour';
    heatCanvas.style.display = 'none';
    logIterationsPerFrame = 0;
    direction = 'forwards';
    
    stopPlaying = false;

    recordingCol = false;
    colCapturer = new CCapture({
        framerate: 30,
        format: 'webm',
        name: 'col'
    });

    currFrame = 0;
    lastRenderFrame = -1000000;
    
    setSize(size.width, size.height);
    
    clearCanvases();
    
    addAnt();
    
    updates = [];
    renderUpdates();
}
