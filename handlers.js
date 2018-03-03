function updateItersPerFrame(slider) {
    var infoText = document.getElementById('iters-per-frame-display');
    
    infoText.innerHTML = slider.value;
    iterationsPerFrame = slider.value;
}

function setRule() {
    var rule = document.getElementById('rule-input').value;
    
    parseRule(rule);
}