var voltage = v1 = v2 = v3 = 0;
v_1 = v_2 = 0.00;
var firstTrialComplete = false; // Track if first trial is done
var calcV1Done = false; // Track if Calculate V' has been clicked
var calcV2Done = false; // Track if Calculate V" has been clicked

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Current flow animation variables
let currentFlowOffset = 0;
let isAnimating = false;
let animationFrameId = null;

// Define the circuit path for current flow
// Define the circuit paths with gaps at components
// Updated circuit paths: Removed vertical segments connecting to the power supply
// Current flows on vertical wires but stops exactly where the PSU body begins
const circuitPaths = [
  // Path 1: From Top PSU terminal wire to R1
  [{x: 100, y: 180}, {x: 100, y: 62}, {x: 225, y: 62}],
  
  // Path 2: From R1 to junction (gap for R1)
  [{x: 283, y: 62}, {x: 395, y: 62}],
  
  // Path 3: From junction to R2
  [{x: 405, y: 62}, {x: 610, y: 62}],
  
  // Path 4: From R2, through corners, to Bottom PSU terminal wire
  [{x: 680, y: 62}, {x: 750, y: 62}, {x: 750, y: 430}, {x: 100, y: 430}, {x: 100, y: 281}]
];

// R3 branch paths with gaps
const circuitPathsR3 = [
  // Path before R3
  [{x: 400, y: 67}, {x: 400, y: 271}],
  
  // Path after R3 (gap for R3)
  [{x: 400, y: 345}, {x: 400, y: 430}]
];

function roundRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arcTo(x + width, y, x + width, y + radius, radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  ctx.lineTo(x + radius, y + height);
  ctx.arcTo(x, y + height, x, y + height - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

function drawPowerSupply(x, y, voltage, scale = 1, label = "VOLTMETER") {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  
  // Body - wider and shorter
  ctx.fillStyle = "#d9d9d9";
  ctx.fillRect(0, 0, 190, 124);
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, 190, 124);

  // Very Large Meter - takes up most of the space
  const meterCenterX = 95;
  const meterCenterY = 108;
  const meterRadius = 84;  // Much larger radius
  
  ctx.fillStyle = "#f9f9f9";
  ctx.beginPath();
  ctx.arc(meterCenterX, meterCenterY, meterRadius, Math.PI, 0);
  ctx.fill();
  ctx.strokeStyle = "#999";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Scale markings (0 to 30) - Very large and bold
  ctx.fillStyle = "black";
  ctx.font = "bold 22px Arial";
  ctx.textAlign = "center";
  
  // Draw scale numbers: 0, 10, 20, 30
const scaleValues = [0, 10, 20, 30];
scaleValues.forEach((val, i) => {
  const angle = Math.PI + (i / 3) * Math.PI;
  const labelRadius = 60;
  const labelX = meterCenterX + Math.cos(angle) * labelRadius;
  const yOffset = (i === 0 || i === 3) ? 0 : 8;
  const labelY = meterCenterY + Math.sin(angle) * labelRadius + yOffset;
  ctx.fillText(val, labelX, labelY);
});

  // Draw intermediate tick marks with numbers (5, 15, 25)
  ctx.font = "bold 16px Arial";
  const intermediateValues = [5, 15, 25];
  intermediateValues.forEach((val, i) => {
    const angle = Math.PI + ((val / 30) * Math.PI);
    const labelRadius = 60;
    const labelX = meterCenterX + Math.cos(angle) * labelRadius;
    const labelY = meterCenterY + Math.sin(angle) * labelRadius + 6;
    ctx.fillText(val, labelX, labelY);
  });

  // Draw tick marks - large and visible
  ctx.strokeStyle = "black";
  for (let i = 0; i <= 30; i += 1) {
    const angle = Math.PI + (i / 30) * Math.PI;
    const innerRadius = 75;
    let outerRadius;
    let lineWidth;
    
    if (i % 10 === 0) {
      outerRadius = 65;
      lineWidth = 3.5;
    } else if (i % 5 === 0) {
      outerRadius = 68;
      lineWidth = 2.5;
    } else {
      outerRadius = 71;
      lineWidth = 1.5;
    }
    
    const x1 = meterCenterX + Math.cos(angle) * innerRadius;
    const y1 = meterCenterY + Math.sin(angle) * innerRadius;
    const x2 = meterCenterX + Math.cos(angle) * outerRadius;
    const y2 = meterCenterY + Math.sin(angle) * outerRadius;
    
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // Needle - long and thick
  let angle = (-90 + (Math.min(voltage, 30) / 30) * 180) * Math.PI / 180;
  ctx.save();
  ctx.translate(meterCenterX, meterCenterY);
  ctx.rotate(angle);
  ctx.strokeStyle = "#cc0000";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -68);
  ctx.stroke();
  ctx.restore();

  // Pivot
  ctx.beginPath();
  ctx.arc(meterCenterX, meterCenterY, 7, 0, Math.PI * 2);
  ctx.fillStyle = "black";
  ctx.fill();

ctx.fillStyle = "black";
ctx.font = "bold 16px Arial";
ctx.textAlign = "center";
ctx.fillText(label, 93, 18);  

  ctx.restore();
}


function drawMainPowerSupply(x, y, voltage, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // PSU body
  ctx.fillStyle = "#d9d9d9";
  ctx.fillRect(0, 0, 140, 117);
  ctx.strokeStyle = "#999";
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, 140, 117);

  // Title
  ctx.fillStyle = "#000";
  ctx.font = "bold 10px Arial";
  ctx.textAlign = "center";
  ctx.fillText("DC POWER SUPPLY", 70, 15);

  // ENLARGED DISPLAY - Knobs removed, color changed to white
  function drawDisplay(dx, dy, label, value, unit) {
    ctx.fillStyle = "#111";
    ctx.fillRect(dx, dy, 110, 65);
    
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px Courier New";
    ctx.textAlign = "center";
    ctx.fillText(value, dx + 55, dy + 29);
    
    ctx.fillStyle = "#aaa";
    ctx.font = "bold 10px Arial";
    ctx.fillText(label + " (" + unit + ")", dx + 55, dy + 48);
  }

  // Draw the centered enlarged display
  drawDisplay(15, 25, "VOLTAGE", Number(voltage).toFixed(1), "V");

  ctx.restore();
}

function drawVariableResistorArrow(x, y, width, height) {
  ctx.save();
  ctx.strokeStyle = "black";
  ctx.fillStyle = "black";
  ctx.lineWidth = 2;

  // Diagonal arrow line
  ctx.beginPath();
  ctx.moveTo(x + width * 0.2, y + height * 1.2);
  ctx.lineTo(x + width * 0.8, y - height * 0.2);
  ctx.stroke();

  // Arrow head
const tipX = x + width * 0.8;
const tipY = y - height * 0.2;

const headLength = 10;

const dx = tipX - (x + width * 0.2);
const dy = tipY - (y + height * 1.2);
const angle = Math.atan2(dy, dx);

ctx.beginPath();
ctx.moveTo(tipX, tipY);
ctx.lineTo(
  tipX - headLength * Math.cos(angle - Math.PI / 6),
  tipY - headLength * Math.sin(angle - Math.PI / 6)
);
ctx.lineTo(
  tipX - headLength * Math.cos(angle + Math.PI / 6),
  tipY - headLength * Math.sin(angle + Math.PI / 6)
);
ctx.closePath();
ctx.fill();

  ctx.restore();
}


function drawCircuit() {
  // ================= POWER SUPPLIES =================

  // Main supply
  drawMainPowerSupply(38, 180, voltage, 0.85);

  // V1, V2, V3 supplies
// V1, V2, V3 supplies
drawPowerSupply(200, 96, v1, 0.55, "VOLTMETER 1");
drawPowerSupply(586, 97, v2, 0.55, "VOLTMETER 2");
drawPowerSupply(435, 280, v3, 0.55, "VOLTMETER 3");

  // ==================================================

  const r3Image = document.getElementById("img_r3");
  const resistorHImage = document.getElementById("img_resistor_h");

  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;

  // GND terminal naming
  ctx.font = "bold small-caps 15px Arial";
  ctx.textBaseline = "middle";
  ctx.save();
  ctx.fillStyle = "black";
  ctx.fillText("GND", 410, 415)
  ctx.restore();

  // gnd terminal
  ctx.fillStyle = "black";
  roundRect(395, 425, 10, 10, 6);
  ctx.fill();
  roundRect(395, 58, 10, 10, 6);
  ctx.fill();
  
  // Resistor terminals
  ctx.fillStyle = "red";
  roundRect(165, 58, 10, 10, 6);
  ctx.fill();
  roundRect(335, 58, 10, 10, 6);
  ctx.fill();
  
  // v2
  ctx.fillStyle = "red";
  roundRect(546, 58, 10, 10, 6);
  ctx.fill();
  roundRect(715, 58, 10, 10, 6);
  ctx.fill();
  
  // v3
  ctx.fillStyle = "red";
  roundRect(395, 245, 10, 10, 6);
  ctx.fill();
  roundRect(395, 385, 10, 10, 6);
  ctx.fill();

  // WIRING (Lines)
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  
  // Vertical lines
  ctx.beginPath(); ctx.moveTo(400, 62); ctx.lineTo(400, 271); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(100, 62); ctx.lineTo(100, 180); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(400, 345); ctx.lineTo(400, 430); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(750, 62); ctx.lineTo(750, 430); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(100, 281); ctx.lineTo(100, 430); ctx.stroke();
  
  // Horizontal lines
  ctx.beginPath(); ctx.moveTo(100, 430); ctx.lineTo(750, 430); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(100, 62); ctx.lineTo(218, 62); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(290, 62); ctx.lineTo(400, 62); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(400, 62); ctx.lineTo(610, 62); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(680, 62); ctx.lineTo(750, 62); ctx.stroke();

  // Labels
  ctx.fillStyle = "black";
  ctx.font = " small-caps 18px Arial";
  ctx.textBaseline = "middle";
  ctx.fillText("+ve", 55, 170)
  ctx.fillText("-ve", 60, 290)
  ctx.font = "bold small-caps 16px Arial";

  // ===================================
  // DRAWING IMAGES (Replaces Lines)
  // ===================================

  // Resistor 1 (Horizontal)
  if (resistorHImage.complete) {
  ctx.drawImage(resistorHImage, 217, 51, 80, 22);
  drawVariableResistorArrow(199, 49, 100, 27);
}

  // Resistor 2 (Horizontal)
 if (resistorHImage.complete) {
  ctx.drawImage(resistorHImage, 602, 51, 80, 22);
  drawVariableResistorArrow(590, 49, 100, 27);
}

  // Resistor 3 (Vertical)
 if (r3Image.complete) {
  ctx.drawImage(r3Image, 356, 237, 90, 140);
  drawVariableResistorArrow(367, 297, 70, 25);
}

  // ===================================

  // Voltmeter 1 Wiring
  ctx.strokeStyle = "red"
  ctx.lineWidth = 2;
  // ver
ctx.beginPath(); ctx.moveTo(170, 62); ctx.lineTo(170, 120); ctx.stroke();
ctx.beginPath(); ctx.moveTo(340, 62); ctx.lineTo(340, 120); ctx.stroke();
// hor
ctx.beginPath(); 
ctx.moveTo(170, 120); ctx.lineTo(200, 120);
ctx.moveTo(304, 120); ctx.lineTo(340, 120);
ctx.stroke();
  // Voltmeter 2 Wiring
  // ver
 ctx.beginPath(); ctx.moveTo(550, 62); ctx.lineTo(550, 120); ctx.stroke();
ctx.beginPath(); ctx.moveTo(720, 62); ctx.lineTo(720, 120); ctx.stroke();
// hor
ctx.beginPath();
ctx.moveTo(550, 120); ctx.lineTo(586, 120);
ctx.moveTo(690, 120); ctx.lineTo(720, 120);
ctx.stroke();

  // Voltmeter 3 Wiring
  // ver
  ctx.beginPath(); ctx.moveTo(480, 250); ctx.lineTo(400, 250); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(480, 390); ctx.lineTo(400, 390); ctx.stroke();
  // hor
  ctx.beginPath();
ctx.moveTo(480, 390);
ctx.lineTo(480, 350);
ctx.moveTo(480, 276);
ctx.lineTo(480, 250);
ctx.stroke();

  // Labels
  ctx.fillStyle = "black";
  ctx.font = "bold small-caps 15px Arial";
  ctx.fillText("R1", 220, 30)
  ctx.fillText("R2", 600, 33)
  ctx.fillText("R3", 305, 307)

  // Ground Symbol
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(420, 450); ctx.lineTo(380, 450); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(410, 455); ctx.lineTo(390, 455); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(395, 460); ctx.lineTo(405, 460); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(400, 430); ctx.lineTo(400, 450); ctx.stroke();
  
  // Re-draw displays (to stay on top)
  if(typeof voltage !== 'undefined') batteryDisplay(voltage);
}

function calculatePathLength(path) {
  let totalLength = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const dx = path[i + 1].x - path[i].x;
    const dy = path[i + 1].y - path[i].y;
    totalLength += Math.sqrt(dx * dx + dy * dy);
  }
  return totalLength;
}

function getPositionOnPath(distance, path, totalLength) {
  let accumulatedDistance = 0;
  
  for (let i = 0; i < path.length - 1; i++) {
    const dx = path[i + 1].x - path[i].x;
    const dy = path[i + 1].y - path[i].y;
    const segmentLength = Math.sqrt(dx * dx + dy * dy);
    
    if (accumulatedDistance + segmentLength >= distance) {
      const t = (distance - accumulatedDistance) / segmentLength;
      return {
        x: path[i].x + dx * t,
        y: path[i].y + dy * t
      };
    }
    
    accumulatedDistance += segmentLength;
  }
  
  return path[0];
}

function drawAnimatedCurrent() {
  ctx.strokeStyle = "#FFD700";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";

  const segmentLength = 10;
  const gapLength = 8;
  const patternLength = segmentLength + gapLength;

  const allPaths = [...circuitPaths, ...circuitPathsR3];

  allPaths.forEach(path => {
    const totalLength = calculatePathLength(path);
    
    for (let d = -patternLength + (currentFlowOffset % patternLength); d < totalLength; d += patternLength) {
      
      let drawStart = Math.max(0, d); 
      let drawEnd = Math.min(d + segmentLength, totalLength);

      if (drawStart < drawEnd) {
        const startPos = getPositionOnPath(drawStart, path, totalLength);
        const endPos = getPositionOnPath(drawEnd, path, totalLength);

        if (startPos && endPos) {
          ctx.beginPath();
          ctx.moveTo(startPos.x, startPos.y);
          
          drawPathSegment(ctx, path, drawStart, drawEnd);
          
          ctx.stroke();
        }
      }
    }
  });
}

function drawPathSegment(context, path, startDist, endDist) {
  let accumulated = 0;
  let started = false;

  for (let i = 0; i < path.length - 1; i++) {
    const p1 = path[i];
    const p2 = path[i+1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx*dx + dy*dy);

    if (accumulated + len >= startDist && accumulated <= endDist) {
      const segmentStart = Math.max(0, startDist - accumulated);
      const segmentEnd = Math.min(len, endDist - accumulated);
      const tStart = segmentStart / len;
      const tEnd = segmentEnd / len;

      if (!started) {
        context.moveTo(p1.x + dx * tStart, p1.y + dy * tStart);
        started = true;
      }
      context.lineTo(p1.x + dx * tEnd, p1.y + dy * tEnd);
    }
    accumulated += len;
  }
}

function animateCurrentFlow() {
  if (!isAnimating) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawCircuit();
  drawAnimatedCurrent();
  
  resistance1Display($("#resistor1Spinner").spinner("value"));
  resistance2Display($("#resistor2Spinner").spinner("value"));
  resistance3Display($("#resistor3Spinner").spinner("value"));
  batteryDisplay(voltage);
  voltmeter1display(v1);
  voltmeter2display(v2);
  voltmeter3display(v3);

  currentFlowOffset += 0.5;

  animationFrameId = requestAnimationFrame(animateCurrentFlow);
}

function startCurrentFlow() {
  if (!isAnimating && voltage > 0) {
    isAnimating = true;
    currentFlowOffset = 0;
    animateCurrentFlow();
  }
}

function stopCurrentFlow() {
  isAnimating = false;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawCircuit();
  resistance1Display($("#resistor1Spinner").spinner("value"));
  resistance2Display($("#resistor2Spinner").spinner("value"));
  resistance3Display($("#resistor3Spinner").spinner("value"));
  batteryDisplay(voltage);
  voltmeter1display(v1);
  voltmeter2display(v2);
  voltmeter3display(v3);
}

drawCircuit();

function resistance2Display(res){
  let text = (res === null || res === undefined || res === "" || res === 0) ? "" : `${res}`;
  ctx.fillStyle = "white";
  ctx.fillRect(625, 23, 40, 20);
  ctx.fillStyle = "black";
  ctx.strokeStyle = "black";
  ctx.lineWidth = 1;
  ctx.strokeRect(625, 23, 40, 20);
  ctx.font = "small-caps 14px Arial";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 631, 33);
  if (text !== "") {
    ctx.font = "bold small-caps 12px Arial";
    ctx.fillText("Ω", 668, 33);
  }
}

function resistance1Display(res){
  let text = (res === null || res === undefined || res === "" || res === 0) ? "" : `${res}`;
  ctx.fillStyle = "white";
  ctx.fillRect(245, 20, 40, 20);
  ctx.fillStyle = "black";
  ctx.strokeStyle = "black";
  ctx.lineWidth = 1;
  ctx.strokeRect(245, 20, 40, 20);
  ctx.font = "small-caps 14px Arial";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 252, 30);
  if (text !== "") {
    ctx.font = "bold small-caps 12px Arial";
    ctx.fillText("Ω", 288, 30);
  }
}

function resistance3Display(res){
  let text = (res === null || res === undefined || res === "" || res === 0) ? "" : `${res}`;
  
  ctx.fillStyle = "white";
  ctx.fillRect(327, 295, 45, 20); 

  ctx.strokeStyle = "black";
  ctx.lineWidth = 1;
  ctx.strokeRect(327, 295, 45, 20); 

  if (text !== "") {
    ctx.save();
    ctx.fillStyle = "black";
    ctx.font = "small-caps 14px Arial";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    
    ctx.fillText(text, 351, 305); 

    ctx.textAlign = "left"; 
    ctx.font = "bold small-caps 12px Arial";
    ctx.fillText("Ω", 375, 305);
    ctx.restore();
  }
}

function voltmeter3display(V3) {
  let text = (V3 === null || V3 === undefined || V3 === "" || V3 === 0 || V3 === "0.00") ? "" : `${V3}`;
  ctx.fillStyle = "white";
  ctx.fillRect(490, 357, 50, 20);
  ctx.fillStyle = "black";
  ctx.strokeStyle = "black";
  ctx.lineWidth = 1;
  ctx.strokeRect(490, 357, 50, 20);
  ctx.font = "small-caps 14px Arial";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 498, 366);
  if (text !== "") {
    ctx.font = "bold small-caps 12px Arial";
    ctx.fillText("V", 542, 367);
  }
  ctx.fillStyle = "black";
}

function voltmeter2display(v2){
  let text = (v2 === null || v2 === undefined || v2 === "" || v2 === 0 || v2 === "0.00") ? "" : `${v2}`;
  ctx.fillStyle = "white";
  ctx.fillRect(610, 170, 50, 20);
  ctx.fillStyle = "black";
  ctx.strokeStyle = "black";
  ctx.lineWidth = 1;
  ctx.strokeRect(610, 170, 50, 20);
  ctx.font = "small-caps 14px Arial";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 616, 179);
  if (text !== "") {
    ctx.font = "bold small-caps 12px Arial";
    ctx.fillText("V", 663, 179);
  }
  ctx.fillStyle = "black";
}

function voltmeter1display(cur) {
  let text = (cur === null || cur === undefined || cur === "" || cur === 0 || cur === "0.00") ? "" : `${cur}`;
  ctx.fillStyle = "white";
  ctx.fillRect(225, 170, 50, 20);
  ctx.fillStyle = "black";
  ctx.strokeStyle = "black";
  ctx.lineWidth = 1;
  ctx.strokeRect(225, 170, 50, 20);
  ctx.font = "small-caps 14px Arial";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 234, 180);
  if (text !== "") {
    ctx.font = "bold small-caps 12px Arial";
    ctx.fillText("V", 280, 180);
  }
  ctx.fillStyle = "black";
}

function batteryDisplay(volt){
  let text = `${volt}`;
  ctx.fillStyle = "white";
  ctx.fillStyle = "black";
  ctx.strokeStyle = "black";
  ctx.lineWidth = 1;
  ctx.font = "small-caps 14px Arial";
  ctx.textBaseline = "middle";
  ctx.font = "small-caps 12px Arial";
  ctx.fillStyle = "black";
}

function varinit() {
  $("#voltageSlider").slider({ max: 30, min: 0, step: 1, value: 0 });
  $("#voltageSpinner").spinner({ max: 30, min: 0, step: 1, value: 0 });
  
  $("#resistor1Slider").slider({ max: 200, min: 1, step: 1, value: 0 });
  $("#resistor1Spinner").spinner({ max: 200, min: 1, step: 1, value: 0 });
  
  $("#resistor2Slider").slider({ max: 200, min: 1, step: 1, value: 0 });
  $("#resistor2Spinner").spinner({ max: 200, min: 1, step: 1, value: 0 });
  
  $("#resistor3Slider").slider({ max: 200, min: 1, step: 1, value: 0 });
  $("#resistor3Spinner").spinner({ max: 200, min: 1, step: 1, value: 0 });
  
  varchange();
  

  // Initialize with empty displays
// resistance1Display(0);
// resistance2Display(0);
// resistance3Display(0);
// voltmeter1display("");
// voltmeter2display("");
// voltmeter3display("");
// batteryDisplay(0);
  // Initially: Everything disabled except Start Simulation
  $('#voltageSlider').slider("disable"); 
  $('#resistor1Slider').slider("disable"); 
  $('#resistor2Slider').slider("disable"); 
  $('#resistor3Slider').slider("disable"); 

  $('#voltageSpinner').spinner("disable"); 
  $('#resistor1Spinner').spinner("disable"); 
  $('#resistor2Spinner').spinner("disable"); 
  $('#resistor3Spinner').spinner("disable"); 

  // Only Start Simulation enabled initially
  $("#simulate-btn").prop("disabled", false);
  $("#add-to-table-btn").prop("disabled", true);
  $("#calcV-btn").prop("disabled", true);
  $("#calcV2-btn").prop("disabled", true);
  $("#result-btn").prop("disabled", true);

  //document.getElementById("message").innerHTML = "Click on Start Simulation";
  document.getElementById("resultdisplay").style.display='none';
}

function varchange() {
  $("#voltageSlider").off("slide").on("slide", function (e, ui) {
    $("#voltageSpinner").spinner("value", ui.value);
    varupdate();
  });
  
  $("#voltageSpinner").off("spin").on("spin", function (e, ui) {
    $("#voltageSlider").slider("value", ui.value);
    varupdate();
  });
  
  $("#voltageSpinner").off("change").on("change", function () {
    var val = $(this).spinner("value");
    $("#voltageSlider").slider("value", val);
    varupdate();
  });

  $("#resistor1Slider").off("slide").on("slide", function (e, ui) {
    $("#resistor1Spinner").spinner("value", ui.value);
    varupdate();
  });
  
  $("#resistor1Spinner").off("spin").on("spin", function (e, ui) {
    $("#resistor1Slider").slider("value", ui.value);
    varupdate();
  });
  
  $("#resistor1Spinner").off("change").on("change", function () {
    var val = $(this).spinner("value");
    $("#resistor1Slider").slider("value", val);
    varupdate();
  });

  $("#resistor2Slider").off("slide").on("slide", function (e, ui) {
    $("#resistor2Spinner").spinner("value", ui.value);
    varupdate();
  });
  
  $("#resistor2Spinner").off("spin").on("spin", function (e, ui) {
    $("#resistor2Slider").slider("value", ui.value);
    varupdate();
  });
  
  $("#resistor2Spinner").off("change").on("change", function () {
    var val = $(this).spinner("value");
    $("#resistor2Slider").slider("value", val);
    varupdate();
  });

  $("#resistor3Slider").off("slide").on("slide", function (e, ui) {
    $("#resistor3Spinner").spinner("value", ui.value);
    varupdate();
  });
  
  $("#resistor3Spinner").off("spin").on("spin", function (e, ui) {
    $("#resistor3Slider").slider("value", ui.value);
    varupdate();
  });
  
  $("#resistor3Spinner").off("change").on("change", function () {
    var val = $(this).spinner("value");
    $("#resistor3Slider").slider("value", val);
    varupdate();
  });
}

function varupdate() {
  volt = $("#voltageSpinner").spinner("value");
  res1 = $("#resistor1Spinner").spinner("value");
  res2 = $("#resistor2Spinner").spinner("value");
  res3 = $("#resistor3Spinner").spinner("value");

  resistance2Display(res2);
  resistance1Display(res1);
  resistance3Display(res3);
voltmeter1display("");
voltmeter2display("");
voltmeter3display(""); 
  batteryDisplay(volt);
  voltageassign(volt);

  const numerator = volt * (res3 + res2);
  const denominator = (res1 * res3) + (res1 * res2) + (res2 * res3);

  const I1 = denominator === 0 ? Infinity : numerator / denominator;
  const I2 = denominator === 0 ? Infinity : (volt * res3) / denominator;
  const I3 = denominator === 0 ? Infinity : (volt * res2) / denominator;
  V1=I1*res1;
  V2=I2*res2;
  V3=I3*res3;
  if (volt === 0 && res1 === 0 && res2 === 0 && res3 === 0) {
    v1assign(0.0);
    v2assign(0.0);
    v3assign(0.0);
  } else if (isNaN(V1) || !isFinite(V1)) {
    v1assign(0.0);
  } else if (isNaN(V2) || !isFinite(V2)) {
    v2assign(0.0);
  } else if (isNaN(V3) || !isFinite(V3)) {
    v3assign(0.0);
  } else {
    v1assign(V1);
    v2assign(V2);
    v3assign(V3);
  }
  
  if (voltage > 0 && !isAnimating) {
    startCurrentFlow();
  } else if (voltage === 0 && isAnimating) {
    stopCurrentFlow();
  }
  
  // If first trial not complete, follow sequential flow
  if (!firstTrialComplete) {
    // Step 1: After voltage is set, enable resistors
    if (volt > 0) {
      $('#resistor1Slider').slider("enable");
      $('#resistor2Slider').slider("enable");
      $('#resistor3Slider').slider("enable");
      $('#resistor1Spinner').spinner("enable");
      $('#resistor2Spinner').spinner("enable");
      $('#resistor3Spinner').spinner("enable");
     // document.getElementById("message").innerHTML = "Now set the Resistance values (R1, R2, R3)";
    }
    
    // Step 2: After all resistors are set, enable add to table button
    if (volt > 0 && res1 > 0 && res2 > 0 && res3 > 0) {
      $("#add-to-table-btn").prop("disabled", false);
      //document.getElementById("message").innerHTML = "All values set! Click 'Add to Table' to record the readings";
    }
  }
}

function voltageassign(volt){
  voltage = volt;
  batteryDisplay(voltage);
}

function v1assign(vol1){
  if (vol1 === 0 || vol1 === 0.0) {
    v1 = "";
    voltmeter1display("");
  } else {
    v1 = vol1.toFixed(2);
    voltmeter1display(vol1.toFixed(2));
  }
  console.log("v1 =" + v1);
}

function v2assign(vol2){
  if (vol2 === 0 || vol2 === 0.0) {
    v2 = "";
    voltmeter2display("");
  } else {
    v2 = vol2.toFixed(2);
    voltmeter2display(vol2.toFixed(2));
  }
  console.log("v2 =" + v2);
}

function v3assign(vol3){
  if (vol3 === 0 || vol3 === 0.0) {
    v3 = "";
    voltmeter3display("");
  } else {
    v3 = vol3.toFixed(2);
    voltmeter3display(vol3.toFixed(2));
  }
  console.log("v3 =" + v3);
}

function startSimulation(){
  // Only enable DC voltage slider and spinner initially
  $('#voltageSlider').slider("enable"); 
  $('#voltageSpinner').spinner("enable");
  
  // Keep resistors disabled initially
  $('#resistor1Slider').slider("disable"); 
  $('#resistor2Slider').slider("disable"); 
  $('#resistor3Slider').slider("disable"); 
  $('#resistor1Spinner').spinner("disable"); 
  $('#resistor2Spinner').spinner("disable"); 
  $('#resistor3Spinner').spinner("disable"); 

  // Disable Start Simulation button
  $("#simulate-btn").prop("disabled", true);
  
  // Keep all other buttons disabled initially
  $("#add-to-table-btn").prop("disabled", true);
  $("#calcV-btn").prop("disabled", true);
  $("#calcV2-btn").prop("disabled", true);
  $("#result-btn").prop("disabled", true);
  
  resistance1Display(0);
  resistance2Display(0);
  resistance3Display(0);
  batteryDisplay(0);
  voltageassign(0);
  v1assign(0);
  v2assign(0);
  v3assign(0);
  
 // document.getElementById("message").innerHTML = "Set the DC Voltage value";
}

function addtable(){
  var table=document.getElementById("mytable");
  var row=table.insertRow(-1);
  var cell1=row.insertCell(0);
  var cell2=row.insertCell(1);
  var cell3=row.insertCell(2);
  var cell4=row.insertCell(3);
  var cell5=row.insertCell(4);
  var cell6=row.insertCell(5);
  cell1.innerHTML=voltage;
  cell2.innerHTML=v1;
  cell3.innerHTML=v2;
  cell4.innerHTML=v3;
  
  cell5.innerHTML="";
  cell5.classList.add("column1-font");
  cell5.setAttribute("data-row-id", table.rows.length - 1);
  
  cell6.innerHTML="";
  cell6.classList.add("column-font");
  cell6.setAttribute("data-row-id", table.rows.length - 1);
  
  // Reset calculation flags when new data is added
  calcV1Done = false;
  calcV2Done = false;
  
  // Don't disable add to table - keep it enabled
  
  // Enable calculate buttons
  $("#calcV-btn").prop("disabled", false);
  $("#calcV2-btn").prop("disabled", false);
  
  // Disable result button until both calculations are done
  $("#result-btn").prop("disabled", true);
  
  //document.getElementById("message").innerHTML = "Click on 'Calculate V'' to obtain V' in Loop1 and 'Calculate V\"' for Loop2";
}

function showvalue1(){
  var table = document.getElementById("mytable");
  
  for (let i = 1; i < table.rows.length; i++) {
    var row = table.rows[i];
    var cell2 = row.cells[1];
    var cell3 = row.cells[2];
    var cell5 = row.cells[4];
    
    if (cell5.innerHTML === "") {
      var v1_val = parseFloat(cell2.innerHTML);
      var v2_val = parseFloat(cell3.innerHTML);
      var v_1 = (v1_val + v2_val).toFixed(2);
      
      cell5.innerHTML = v_1;
      cell5.style.display = 'table-cell';
    }
  }
  
  // Mark that Calculate V' has been clicked
  calcV1Done = true;
  
  // Check if both calculations are done to enable Result button
  if (calcV1Done && calcV2Done) {
    $("#result-btn").prop("disabled", false);
   // document.getElementById("message").innerHTML = "Both calculations complete! Click 'Result' to see the conclusion";
  } else {
   // document.getElementById("message").innerHTML = "V' calculated! Now calculate V\" to enable the Result button";
  }
}

function showvalue2(){
  var table = document.getElementById("mytable");
  
  for (let i = 1; i < table.rows.length; i++) {
    var row = table.rows[i];
    var cell3 = row.cells[2];
    var cell4 = row.cells[3];
    var cell6 = row.cells[5];
    
    if (cell6.innerHTML === "") {
      var v2_val = parseFloat(cell3.innerHTML);
      var v3_val = parseFloat(cell4.innerHTML);
      var v_2 = (v2_val - v3_val).toFixed(2);
      
      cell6.innerHTML = v_2;
      cell6.style.display = 'table-cell';
    }
  }
  
  // Mark that Calculate V" has been clicked
  calcV2Done = true;
  
  // Check if both calculations are done to enable Result button
  if (calcV1Done && calcV2Done) {
    $("#result-btn").prop("disabled", false);
   // document.getElementById("message").innerHTML = "Both calculations complete! Click 'Result' to see the conclusion";
  } else {
    //document.getElementById("message").innerHTML = "V\" calculated! Now calculate V' to enable the Result button";
  }
}

function showresult(){
  document.getElementById("resultdisplay").style.display='block';
  
  // Mark first trial as complete
  if (!firstTrialComplete) {
    firstTrialComplete = true;
    
    // After first trial, enable all buttons and variables except start simulation
    $('#voltageSlider').slider("enable"); 
    $('#resistor1Slider').slider("enable"); 
    $('#resistor2Slider').slider("enable"); 
    $('#resistor3Slider').slider("enable"); 
    $('#voltageSpinner').spinner("enable"); 
    $('#resistor1Spinner').spinner("enable"); 
    $('#resistor2Spinner').spinner("enable"); 
    $('#resistor3Spinner').spinner("enable"); 
    
    $("#add-to-table-btn").prop("disabled", false);
    $("#calcV-btn").prop("disabled", false);
    $("#calcV2-btn").prop("disabled", false);
    $("#result-btn").prop("disabled", false);
    
   // document.getElementById("message").innerHTML = "First trial completed! All controls are now enabled for further experiments.";
  } else {
    // Don't disable result button - keep it enabled for subsequent views
   // document.getElementById("message").innerHTML = "Experiment completed successfully! You can perform more trials.";
  }
}

function startsim() {
}

window.addEventListener("load", varinit);