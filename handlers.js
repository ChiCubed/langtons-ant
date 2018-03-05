function updateItersPerFrame(slider) {
    var infoText = document.getElementById('iters-per-frame-display');
    
    if (slider.value < 0) infoText.innerHTML = '1/' + Math.pow(2, -slider.value);
    else infoText.innerHTML = Math.pow(2, slider.value);
    logIterationsPerFrame = slider.value;
}

function setRule() {
    var rule = document.getElementById('rule-input').value;
    
    parseRule(rule);
}

function setSizeFromForm() {
	var width = document.getElementById('size-width-input').value;
	var height = document.getElementById('size-height-input').value;

	setSize(width, height);
}

// Modifies the rule as much as possible
// to prevent confusing behaviour.
function submitRuleForm() {
	// let's fake submit

	document.getElementById('dummy-submit').click();
}
