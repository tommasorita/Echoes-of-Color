// Variabili per function formeGeometriche
let lastColorChangeTime = 0; // Tempo dell'ultimo cambiamento di colore
let currentColor; // Colore attuale

// Variabili per gestire i glitch
let lastGlitchTime = 0; // Tempo dell'ultimo glitch

///WALKERS ////////////
let walkersNum = 200;
let wArray = []; // array di walker
let baseHue; // colore base per le sfumature
let walkersBool = false; // flag per indicare se la funzione deve iniziare

// Variabili per abilitare/disabilitare diverse visualizzazioni
let perlinNoiseBool = true;
let sinusoideCircolareBool = true;
let sinusoideTriangolareBool = false;
let glitchBool = false;
let cerchioBool = false;
let lineeVibrantiBool = false;  //linee che girano attorno alla sinusoideCircolare
let lineeRitmicheBool = false;
let formeCasualiBool = false;
let formeGeometricheBool = false;

// Variabili per generare forme basate su Perlin Noise
let points = [];
let mult = 0.005;
let maxRadius = 150; // Impostiamo il raggio iniziale

// Variabili per l'analisi audio
let fft;
let sound; 
let amplitude;
let vol;
let lowEnergy;
let midEnergy;
let highEnergy;

let r1, r2, g1, g2, b1, b2;
let numPoints = 360;  //modifica la sinusoideCircolare

let density = 100; // Densità iniziale
let diameter = 400;

let halfW;
let halfH;

function preload() {
  sound = loadSound('INTRO (monday).mp3');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);
  noiseDetail(random(8));
  frameRate(60);
  
  // Inizializza l'amplitude e l'FFT per l'analisi audio
  amplitude = new p5.Amplitude();
  amplitude.setInput(sound);
  fft = new p5.FFT(); // Inizializza l'oggetto FFT

  // Modalità angolo e rettangoli centrati
  angleMode(DEGREES);
  rectMode(CENTER);
  
  //Inizializza Variabili
  halfW = width / 2;
  halfH = height / 2;
  
  // Imposta il colore iniziale
  currentColor = color(random(0, 360), random(0, 360), random(0, 360));

  //Ottieni colori casuali
  r1 = random(360);
  r2 = random(360);
  g1 = random(360);
  g2 = random(360);
  b1 = random(360);
  b2 = random(360);
  
  sound.loop();
  
  sound.addCue(0.01, function() {  //aggiunta di addCue all'inizio per quanto si riavvia la musica da capo
    perlinNoiseBool = true;
    maxRadius = 150; 
    createPoints(density);
    sinusoideCircolareBool = true;
  })
  sound.addCue(13.2, function() {
    glitchBool = true;
  });
  sound.addCue(28, function() {
    cerchioBool = true;  //attiva la funzione riduciCerchio()
  });
  sound.addCue(103.3, function() {
    // Cambia il raggio al massimo per coprire tutto lo schermo
    maxRadius = dist(0, 0, halfW, halfH);
    mult = random(0.002, 0.05);
    density = 120; // Cambia la densità
    createPoints(density); // Ricrea i punti con la nuova densità
    glitchBool = false;
    lineeVibrantiBool = true;  //linee che girano attorno alla sinusoideCircolare
  });
  sound.addCue(118, function() {
    sinusoideCircolareBool = false;
    sinusoideTriangolareBool = true;
  });
  sound.addCue(133, function() {
    perlinNoiseBool = false;
    walkersBool = true;
    
    for (let walker of wArray) {
      walker.pos.set(halfW, halfH);
    }
    
    sinusoideTriangolareBool = false;
    lineeRitmicheBool = true;  //linee a tempo di musica dal secondo 133
    lineeVibrantiBool = false;  //linee che girano attorno alla sinusoideCircolare
    formeCasualiBool = true;
  });
  sound.addCue(162.5, function() {
    lineeRitmicheBool = false;  //linee a tempo di musica dal secondo 133
    walkersBool = false;
    formeGeometricheBool = true;
  })//;
  sound.addCue(177.3, function() {
    formeCasualiBool = false;
    walkersBool = true;
  })
  sound.addCue(178.1, function() {
    numPoints = 300;
    mult = 0.05;
    background(random(360));
    perlinNoiseBool = true;
    sinusoideCircolareBool = true;
    formeGeometricheBool = false;
  })
  sound.addCue(184.6, function() {
    walkersBool = false;
  });
  sound.addCue(221, stopAllFunctions);

  // Crea i punti iniziali per il disegno Perlin Noise
  createPoints(density);
  
  // Creazione dei walker e impostazione dei colori iniziali
  createWalkers();
  
}

function draw() {
  background(0, 10);
  noStroke();
  fill(0);
  
  // Ottieni il livello del volume e scalalo
  vol = amplitude.getLevel();
  let scaledVol = map(vol, 0, 1, 0, 20);
  
  let spectrum = fft.analyze(); // Analizza lo spettro audio
  
  let maxPoints = sound.currentTime() * 6 <= points.length ? sound.currentTime() * 6 : points.length;
  
  // Esegui i disegni in base ai flag attivi
  if (perlinNoiseBool) {
    perlinNoise(scaledVol, maxPoints);
  }
  if (sinusoideCircolareBool) {
  sinusoideCircolare(scaledVol);
  }
  if (glitchBool) {
    Glitch(scaledVol);
  }
  if (cerchioBool) {
    riduciCerchio(scaledVol);
  }  //si riduce e poi sparisce al secondo 103.3
  if (sinusoideTriangolareBool) {
      sinusoideTriangolare(scaledVol);
  }
  if (lineeVibrantiBool) {
    lineeVibranti(scaledVol);
  }  //linee che girano attorno alla sinusoideCircolare
  if (walkersBool) {
    updateWalkers();
  }
  if (lineeRitmicheBool) {
    lineeRitmiche(scaledVol);
  }
  if (formeCasualiBool) {
    formeCasuali(scaledVol);
  }
  if (formeGeometricheBool) {
    formeGeometriche(scaledVol);
  }
  
}


//FUNZIONI VARIE
function createPoints(density) {
  points = [];
  let space = height / density; 
  
  for (let x = 0; x < width; x += space) {
    for (let y = 0; y < height; y += space) {
      let p = createVector(x + random(-10, 10), y + random(-10, 10)); 
      points.push(p);
    }
  }

  for (let y = 0; y < height; y += space) {
    let p = createVector(0, y + random(-10, 10)); 
    points.push(p);
  }

  shuffle(points, true); // Mescola i punti
  
  if (mousePressed) {
    cambiaMult();
  }
  
}  //crea punti per PERLIN NOISE

function cambiaMult() {
  mult = random(0.001, 0.05);
  return mult;
}

function perlinNoise(vol, maxPoints) {
  
  let speedMultiplier = map(vol, 0, 1, 0.5, 1.5);
  
  push();
  strokeWeight(2);
  
  for (let i = 0; i < maxPoints; i++) {
    let pt = points[i];
    let r = map(pt.x, 0, width, r1, r2);
    let g = map(pt.y, 0, height, g1, g2);
    let b = map(pt.x, 0, width, b1, b2);
    let a = map(dist(halfW, halfH, pt.x, pt.y), 0, 400, 0, 255)
    
    //fill(r, g, b, a);
    stroke(r, g, b, a); // Usa stroke per colorare i punti

    let angle = map(noise(pt.x * mult, pt.y * mult), 0, 1, 0, 720);
    
    pt.add(createVector(cos(angle) * vol * speedMultiplier, sin(angle) * vol * speedMultiplier)); //cambio di velocità

    // Controlla se il punto è all'interno di maxRadius
    if (dist(halfW, halfH, pt.x, pt.y) < maxRadius) {
      //ellipse(pt.x, pt.y, 2);
      point(pt.x, pt.y);
    } else {
      // Riporta il punto all'interno del maxRadius
      let angleToCenter = atan2(pt.y - halfH, pt.x - halfW);
      pt.set(halfW + cos(angleToCenter) * maxRadius, halfH + sin(angleToCenter) * maxRadius);
    }
    
    // Controlla se il punto è fuori dal canvas e lo riporta dall'altro lato
    if (pt.x < 0) {
      pt.x = windowWidth; // Rientra da destra
    } else if (pt.x > windowWidth) {
      pt.x = 0; // Rientra da sinistra
    }
    
    if (pt.y < 0) {
      pt.y = windowHeight; // Rientra dall'alto
    } else if (pt.y > windowHeight) {
      pt.y = 0; // Rientra dal basso
    }
    
  }
  pop();
} //PERLIN NOISE

function sinusoideCircolare(volume) {
  
  push();
  stroke(255, 200);
  strokeWeight(2);
  noFill();
  let radius = 150 + volume; 
  let phaseShift = frameCount * 2; 
  
  beginShape();
  for (let i = 0; i < numPoints; i++) {
    let angle = map(i, 0, numPoints, 0, 360);
    let noiseFactor = noise(i * 0.1, frameCount * 0.01) * volume * 20; 

    let distortedAngle = angle + sin(i * 10) * volume;
    
    let x = halfW + (radius + volume * sin(i * 20 + phaseShift) + noiseFactor) * cos(distortedAngle);
    let y = halfH + (radius + volume * sin(i * 20 + phaseShift) + noiseFactor) * sin(distortedAngle);
    
    vertex(x, y);
  }
  endShape(CLOSE);
  pop();
}

function sinusoideTriangolare(volume) {
  
  sinusoideTriangolareBool = true; // Abilita l'esecuzione di sinusoideTriangolare
  
  stroke(255, 200);
  noFill();
  let radius = 200 + volume; 
  let phaseShift = frameCount * 2; 

  // Calcoliamo i punti della sinusoide e disegniamo triangoli
  for (let i = 0; i < numPoints; i += 3) { // Incremento di 3 per disegnare un triangolo
    let angle = map(i, 0, numPoints, 0, 360);
    let noiseFactor = noise(i * 0.1, frameCount * 0.01) * volume * 30; 

    let distortedAngle = angle + sin(i * 10) * volume;
    
    let x1 = halfW + (radius + volume * sin(i * 20 + phaseShift) + noiseFactor) * cos(distortedAngle);
    let y1 = halfH + (radius + volume * sin(i * 20 + phaseShift) + noiseFactor) * sin(distortedAngle);

    // Calcoliamo i punti successivi per il triangolo
    let x2 = halfW + (radius + volume * sin((i + 1) * 20 + phaseShift) + noiseFactor) * cos(distortedAngle + 3); // leggermente spostato
    let y2 = halfH + (radius + volume * sin((i + 1) * 20 + phaseShift) + noiseFactor) * sin(distortedAngle + 3);
    
    let x3 = halfW + (radius + volume * sin((i + 2) * 20 + phaseShift) + noiseFactor) * cos(distortedAngle - 3); // leggermente spostato
    let y3 = halfH + (radius + volume * sin((i + 2) * 20 + phaseShift) + noiseFactor) * sin(distortedAngle - 3);

    // Disegna il triangolo
    fill(255, 200);
    triangle(x1, y1, x2, y2, x3, y3);
  }
  
  radius = 50 + volume; 
  // Calcoliamo i punti della sinusoide e disegniamo triangoli
  for (let j = 0; j < numPoints; j += 3) { // Incremento di 3 per disegnare un triangolo
    angle = map(j, 0, numPoints, 0, 360);
    noiseFactor = noise(j * 0.1, frameCount * 0.01) * volume * 30; 

    distortedAngle = angle + sin(j * 10) * volume;
    
     x1 = halfW + (radius + volume * sin(j * 20 + phaseShift) + noiseFactor) * cos(distortedAngle);
     y1 = halfH + (radius + volume * sin(j * 20 + phaseShift) + noiseFactor) * sin(distortedAngle);

    // Calcoliamo i punti successivi per il triangolo
     x2 = halfW + (radius + volume * sin((j + 1) * 20 + phaseShift) + noiseFactor) * cos(distortedAngle + 3); // leggermente spostato
     y2 = halfH + (radius + volume * sin((j + 1) * 20 + phaseShift) + noiseFactor) * sin(distortedAngle + 3);
    
     x3 = halfW + (radius + volume * sin((j + 2) * 20 + phaseShift) + noiseFactor) * cos(distortedAngle - 3); // leggermente spostato
     y3 = halfH + (radius + volume * sin((j + 2) * 20 + phaseShift) + noiseFactor) * sin(distortedAngle - 3);

    // Disegna il triangolo
    fill(255, 200);
    triangle(x1, y1, x2, y2, x3, y3);
  }
}

function Glitch(vol) {
  
  let currentTime = millis();
  
  // Energia in diverse bande di frequenza
  lowEnergy = fft.getEnergy('bass');
  midEnergy = fft.getEnergy('mid');
  highEnergy = fft.getEnergy('treble');

  // Media globale dell'energia per determinare l'intensità del glitch
  let avgEnergy = (lowEnergy + midEnergy + highEnergy) / 3;
  
  // Regola l'intensità del glitch in base all'energia media e al volume globale
  glitchIntensity = map(avgEnergy + vol * 255, 0, 510, 50, 255);

  // Regola la velocità dei glitch in base alla somma di tutte le frequenze e al volume
  glitchInterval = map(avgEnergy + vol * 255, 0, 510, 200, 100); // Intervallo più breve con musica più intensa

  if (currentTime - lastGlitchTime > glitchInterval) {
    lastGlitchTime = currentTime; // Aggiorna l'ultimo glitch

    let numShapes = floor(map(vol, 0, 1, 1, 5)); // Numero di forme varia con il volume

    for (let i = 0; i < numShapes; i++) {
      let shapeColor = map(avgEnergy, 0, 255, 0, 360); // Colore varia con l'energia
      fill(random(shapeColor), random(shapeColor), random(shapeColor), random(5, 50));
      noStroke();
      
      let shapeType = random(['circle', 'rect', 'triangle']);
      let size = random(10, glitchIntensity); // Le dimensioni variano in base all'intensità del glitch
      let x = random(width);
      let y = random(height);
      
      if (shapeType === 'circle') {
        ellipse(x + random(-5, 5), y + random(-5, 5), size);
      } else if (shapeType === 'rect') {
        rect(x + random(-5, 5), y + random(-5, 5), size, size);
      } else if (shapeType === 'triangle') {
        triangle(
          x + random(-5, 5), y + random(-5, 5),
          x + random(-5, 5), y + random(-5, 5),
          x + random(-5, 5), y + random(-5, 5)
        );
      }
    }
  }
}

function riduciCerchio(volume) {
 
   let currentTime = sound.currentTime();  // Ottiene il tempo corrente della canzone
  
  //Mappa il tempo della canzone per ridurre gradualmente il diametro
  if (currentTime >= 28 && currentTime <= 103) {
    diameter = map(currentTime, 28, 103, max(width + 400, height + 400), 285);  // Riduci gradualmente il diametro
  } else if (currentTime > 103) {
    diameter = 285; // Mantieni il diametro fisso
  } else {
    diameter = (width + 400, height + 400); // Imposta un diametro iniziale
  }
  
  diameter = max(285, diameter); // Limita il diametro a un minimo di 285

  let radius = diameter / 2; // Calcola il raggio dall'ellisse

  if (diameter > 285) {
    noFill();
    stroke(0, 0, 100, random(1, 20));
    strokeWeight(2);
  
    // Crea la forma ellittica con rumore
    beginShape();
      for (let i = 0; i < numPoints; i++) {
        let angle = map(i, 0, numPoints, 0, 360); // Mappa l'angolo
        let noiseFactor = noise(i * 0.1, frameCount * 0.01) * volume * 80; // Noise basato sul volume

        // Calcola il valore distorto dell'angolo
        let distortedAngle = angle + sin(i * 10) * volume; 
        let x = halfW + (radius + noiseFactor) * cos(distortedAngle);
        let y = halfH + (radius + noiseFactor) * sin(distortedAngle);
    
        vertex(x, y); // Aggiungi il vertice al disegno
      }
    endShape(CLOSE);
  }
}  //CERCHIO CHE SI RESTRINGE

function lineeVibranti(volume) {  //linee che girano attorno alla sinusoideCircolare
  
  poligonoBool = true;
  
  stroke(255, 200);
  noFill();
  let numVertices = Math.floor(map(volume, 0, 1, 3, 20)); // Cambia il numero di vertici in base al volume
  let radius = 150 + volume * 30; 
  let phaseShift = frameCount * 2; 

  // Disegna il primo poligono
  beginShape();
  for (let i = 0; i < numVertices; i++) {
    let angle = map(i, 0, numVertices, 0, TWO_PI);
    let x = halfW + (radius + volume * 30) * cos(angle + phaseShift);
    let y = halfH + (radius + volume * 30) * sin(angle + phaseShift);
    vertex(x, y);
  }
  endShape(CLOSE);
  
  // Disegna un secondo poligono
  beginShape();
  for (let i = 0; i < numVertices; i++) {
    angle = map(i, 0, numVertices, 0, TWO_PI);
    let x = halfH + (radius + volume * 30) * cos(angle + phaseShift);
    let y = halfW + (radius + volume * 30) * sin(angle + phaseShift);
    vertex(y, x);
  }
  endShape(CLOSE);
  
}  

function lineeRitmiche(volume) {
  stroke(255, 150); // Bianco con opacità 200
  strokeWeight(1);
  for (let i = 0; i < 20; i++) {
    let x = halfW + cos(i * 20 + frameCount * 0.1) * volume * 80;
    let y = halfH + sin(i * 20 + frameCount * 0.1) * volume * 80;
    line(halfW, halfH, x, y);
  }
}

function formeCasuali(volume) {
  noFill();
  stroke(255, random(5,15));
  strokeWeight(random(0.5, 3));
  
  beginShape();
  for (let i = 0; i < 5; i++) {
    let x = halfW + cos(i * 20 + frameCount * 0.1) * volume * 5;
    let y = halfH + sin(i * 20 + frameCount * 0.1) * volume * 5;
    //line(random(width), random(height), x, y);
    //ellipse(width / 2, height / 2, x, y);
    //square(width / 2, height / 2, x, y);
    vertex(random(x) * 2, random(y) * 2);
    //point(x, y);
  }
  endShape();
}

function formeGeometriche(volume) {
  noFill();
  strokeWeight(random(0, 10));

  // Cambia il colore ogni 500 millisecondi
  if (millis() - lastColorChangeTime > 500) {
    currentColor = color(random(0, 360), random(0, 360), random(0, 360), random(10,100));
    lastColorChangeTime = millis(); // Aggiorna il tempo dell'ultimo cambiamento
  }

  stroke(currentColor);
  for (let i = 0; i < 5; i++) {
    square(halfW, halfH, (i + 1) * 50 + volume * 30);
    ellipse(halfW, halfH, (i + 3) * 180 + volume * 30);
  }
}

// WALKER //////////////////////////////////////////////////////////////////////////////////////
function Walker() {
  this.pos = createVector(halfW, halfH);
  this.vel = createVector(0, 0);
  this.xoof = random(0, 1000);  // Rumore per il movimento
  this.hue = random(360);
  this.sat = random(80, 100);
  this.bri = random(50, 100);
}  // Costruttore del Walker

function createWalkers() {
  for (var i = 0; i < walkersNum; i++) {
    wArray[i] = new Walker();
  }
  resetcolors(); // Imposta i colori iniziali
}

function updateWalkers() {
  for (let i = 0; i < wArray.length; i++) {
    // Aggiornamento del Walker
    let wA = wArray[i];
    wA.xoof += 0.01;
    
    // Modifica della velocità basata sul livello audio
    var speedMultiplier = map(vol, 0, 1, 0.5, 15); // regola la velocità in base al volume
    wA.acc = p5.Vector.fromAngle(map(noise(wA.xoof), 0, 1, -TWO_PI, TWO_PI));
    wA.acc.mult(0.5 * speedMultiplier); // moltiplica la velocità in base al volume
    
    wA.vel.add(wA.acc);
    wA.vel.limit(2 * speedMultiplier); // limita la velocità massima con il moltiplicatore
    wA.pos.add(wA.vel);
    
    // Controllo dei bordi
    if (wA.pos.x > width) {
      wA.pos.x = 0;
    } else if (wA.pos.x < 0) {
      wA.pos.x = width;
    }
    if (wA.pos.y > height) {
      wA.pos.y = 0;
    } else if (wA.pos.y < 0) {
      wA.pos.y = height;
    }

    // Disegno del Walker
    let brushSize = map(noise(wA.xoof), 0, 1, 2, 10);
    wA.bri = noise(wA.xoof) * 100;
    
    // Modifica la luminosità in base al volume
    let brightnessMultiplier = map(vol, 0, 1, 0.5, 200);
    strokeWeight(brushSize);
    stroke(wA.hue, wA.sat, wA.bri * brightnessMultiplier);
    point(wA.pos.x, wA.pos.y);
  }
}

function resetcolors() {
  //colorMode(HSB, 360, 100, 100, 100);
  baseHue = random(360); // Colore base
  
  for (let i = 0; i < wArray.length; i++) {
    let wA = wArray[i];
    let hueVariation = random(-50, 50); // Variazione casuale nell'intervallo -30 a +30
    let sat = random(80, 100); // Saturazione casuale tra 80 e 100
    let bri = random(50, 360); // Luminosità casuale tra 50 e 100
    
    // Applica il colore con sfumature varie intorno al colore base
    wA.hue = (baseHue + hueVariation + 360) % 360;
    wA.sat = sat;
    wA.bri = bri;
  }
}  // Resetta solo i colori, senza ricominciare il disegno
//////////////////////////////////////////////////////////////////////////////////////

function stopAllFunctions() {
  perlinNoiseBool = false;
  sinusoideCircolareBool = false;
  cerchioBool = false;
}

function toggleFullscreen() {
  let fs = fullscreen();
  fullscreen(!fs);  
}


function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  
  halfW = width / 2;
  halfH = height / 2;
  
  //Riposiziona posizione walkers
  for (let walker of wArray) {
      walker.pos.set(halfW, halfH);
    }
  
}

// INTERAZIONI
function keyPressed() {
  if (key === ' ') { // Controlla se la barra spaziatrice è premuta
    let fs = fullscreen();
    toggleFullscreen(); // Attiva/disattiva il fullscreen
  } else if (key === 'p' || key === 'P') { // Controlla se "P" o "p" è premuto
    if (sound.isPlaying()) {
      disattivaAudio(); // Metti in pausa il brano
    } else {
      attivaAudio(); // Riprendi il brano
    }
  }
}

function mousePressed() {
  resetcolors();
  cambiaMult();
}  // Al clic del mouse, cambia solo i colori

// CONTROLLI AUDIO
function attivaAudio() {  
  sound.loop(); // Riavvia il brano
  isPaused = false; // La musica non è in pausa
}

function disattivaAudio() {  
  sound.pause(); // Metti in pausa il brano
  isPaused = true; // La musica è in pausa
  pausedTime = sound.currentTime(); // Memorizza il tempo corrente quando la musica viene messa in pausa
}