import * as THREE from 'three';
import { OrbitControls } from "./lib/OrbitControls.js";
import Player from "./maze-player.js";
import * as RESOURCES from "./maze-resources.js";


// Constants
const cubeSize = 10;
const fov = 75;
const aspect = 2;  // the canvas default
const near = 0.1;
const far = 1000;

// Game scene objects
var canvas = document.getElementById("canvas");
const WALL_GEOMETRY = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
const PLAYER_GEOMETRY = new THREE.BoxGeometry(cubeSize - 2, cubeSize - 2, cubeSize - 2);
const PLAYER_MUSH_GEOMETRY = new THREE.BoxGeometry(3 * cubeSize - 1, 3 * cubeSize - 1, 3 * cubeSize - 1);

const CLOCK = new THREE.Clock();
var MIXER_PLAYER;
var MIXER_BOMB = [];

const RENDERER = new THREE.WebGLRenderer({ canvas });
RENDERER.autoClear = false;
const CAMERA = new THREE.PerspectiveCamera(fov, aspect, near, far);

const SCENE = new THREE.Scene();
var requestAnimationFrameId;
const MAX_FPS = 25; // The maximum FPS we want to allow
var last_frame_time_ms = 0; // The last time the loop was run
const TIME_STEP = 1000 / MAX_FPS;
var delta = 0;

function initialize3dScene() {
    // position the camera a little back from the origin
    //CAMERA.position.set(0, -60, 90);
    CAMERA.position.set(0, -10, interpolCameraHeight(mazeState.width)); // OK for size 13
    
    // Game board
    let gameBoardSize = mazeState.width * 20 + 10;
    const planeGeometry = new THREE.PlaneGeometry(gameBoardSize, gameBoardSize);
    const planeMaterial = new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff, side: THREE.DoubleSide });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    SCENE.add(plane);

    // Light
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(-10, 20, 50);
    SCENE.add(light);

    const colorAmbient = 0xFFFFFF;
    const intensityAmbient = .4;
    const lightAmbient = new THREE.AmbientLight(colorAmbient, intensityAmbient);
    SCENE.add(lightAmbient);

    // ADDON Orbit controls
    const controls = new OrbitControls(CAMERA, canvas);
    controls.target.set(0, 0, 5);
    controls.update();

    // HUD to create -- display score and other info 
    // Solution with 2 cameras : see https://codepen.io/jaamo/pen/MaOGZV (just add <script src="https://r105.threejsfundamentals.org/threejs/resources/threejs/r105/three.min.js"></script> in HTML and run)
    // Solution with 1 camera  : see https://discourse.threejs.org/t/how-to-build-a-hud-in-a-single-scene-with-a-single-camera/16108
}

var cameraHUD;
var sceneHUD;
var hudBitmap;
var hudTexture;
function initializeHUD() {
    // Create shortcuts for window size.
    var width = window.innerWidth;
    var height = window.innerHeight;

    // We will use 2D canvas element to render our HUD.  
    var hudCanvas = document.createElement('canvas');

    // Again, set dimensions to fit the screen.
    hudCanvas.width = width;
    hudCanvas.height = height;

    // Get 2D context and draw something supercool.
    hudBitmap = hudCanvas.getContext('2d');
    hudBitmap.font = "Bold 40px Arial";
    hudBitmap.textAlign = 'center';
    hudBitmap.fillStyle = "rgba(240,240,240,1)";
    hudBitmap.fillText('Initializing...', width / 2, height / 2);
        
    // Create the camera and set the viewport to match the screen dimensions.
    cameraHUD = new THREE.OrthographicCamera(-width/2, width/2, height/2, -height/2, 0, 30 );

    // Create also a custom scene for HUD.
    sceneHUD = new THREE.Scene();

    // Create texture from rendered graphics.
    hudTexture = new THREE.Texture(hudCanvas) 
    hudTexture.needsUpdate = true;

    // Create HUD material.
    var material = new THREE.MeshBasicMaterial( {map: hudTexture} );
    material.transparent = true;

    // Create plane to render the HUD. This plane fill the whole screen.
    var planeGeometry = new THREE.PlaneGeometry( width, height );
    var plane = new THREE.Mesh( planeGeometry, material );
    sceneHUD.add( plane );
}

function createBonusTreasureAt(x, y) {
    let treasure = RESOURCES.get(RESOURCES.MODEL_BONUS_TREASURE);
    treasure.scale.set(5, 5, 5);
    treasure.rotation.set(Math.PI/3, treasure.rotation.y, treasure.rotation.z);
    treasure.position.set(x,y,5);
    return treasure;
}

function createBonusCoinAt(x, y) {
    let coin = RESOURCES.get(RESOURCES.MODEL_BONUS_COIN);
    coin.scale.set(250, 250, 250);
    // coin.scale.set(5, 5, 5);
    coin.rotation.set(coin.rotation.x, Math.PI/2,  coin.rotation.y/*Math.PI/4*/);
    coin.position.set(x,y,5);
    return coin;
}

function createBonusStarAt(x, y) {
    let star = RESOURCES.get(RESOURCES.MODEL_BONUS_STAR);
    star.scale.set(3, 3, 3);
    star.rotation.set(0, star.rotation.y,  star.rotation.y);
    star.position.set(x,y - 3,3);
    return star;
}

function createBonusGemAt(x, y) {
    let gem = RESOURCES.get(RESOURCES.MODEL_BONUS_GEM);
    // gem.scale.set(3, 3, 3);
    // gem.rotation.set(0, gem.rotation.y,  gem.rotation.y);
    // gem.position.set(x,y - 3,3);
    gem.scale.set(10, 10, 10);
    gem.rotation.set(Math.PI/4, gem.rotation.y,  gem.rotation.y);
    gem.position.set(x, y, 5);
    return gem;
}

function createBonusMushroomAt(x, y) {
    let mushroom = RESOURCES.get(RESOURCES.MODEL_MUSHROOM);
    mushroom.scale.set(6, 6, 6);
    mushroom.position.set(x, y, 5);
    return mushroom;
}

function createMonsterBombAt(x, y) {
    let bomb = RESOURCES.get(RESOURCES.MODEL_BOMB);
    bomb.scale.set(6, 6, 6);
    bomb.position.set(x, y, 5);
    bomb.rotation.set(Math.PI/10, bomb.rotation.y, bomb.rotation.z);
    return bomb;
}

function createMonsterSpikyAt(x, y) {
    let spiky = RESOURCES.get(RESOURCES.MODEL_SPIKY);
    spiky.scale.set(6, 6, 6);
    spiky.position.set(x, y, 5);
    return spiky;
}
 
function createWallAt(x, y) {
    //const material = new THREE.MeshPhongMaterial({ color: 0x865e22, shininess:150 });
    const newCube = new THREE.Mesh(WALL_GEOMETRY, RESOURCES.get(RESOURCES.MATERIAL_WALL));
    newCube.position.set(x, y, 5);
    return newCube;
}

function createPlayerAt(x, y, hasMushroom) {
    const material = new THREE.MeshPhongMaterial({ color: 0xFF2822, shininess:150 });
    const newCube = new THREE.Mesh(hasMushroom ? PLAYER_MUSH_GEOMETRY : PLAYER_GEOMETRY, material);
    newCube.position.set(x, y, 5);
    return newCube;
}

function createExitAt(x, y) {
    let door = RESOURCES.get(RESOURCES.MODEL_DOOR).scene;
    door.scale.set(.015, .02, .02);
    door.position.set(x, y, 0);
    door.rotation.set(Math.PI/2, door.rotation.y, door.rotation.z);
    door.traverse((object) => {
        if (object.isMesh) {
            object.material = new THREE.MeshPhongMaterial({ color: 0xFF1133, shininess:150 });   
        }   
    });
    return door;
}

function createKeyAt(x, y) {
    let key = RESOURCES.get(RESOURCES.MODEL_KEY).scene;
    key.scale.set(.07, .07, .07);
    key.position.set(x, y, 5);
    key.rotation.set(key.rotation.x, key.rotation.y, Math.PI/4);
    return key;
}

function removeCubeInstance(cube) {
    if (!cube) return;
    if (cube instanceof Map) {
        cube.forEach((v) => removeCubeInstance(v));
    } else {
        cube.geometry?.dispose(); // optional => models do not have this property
        cube.material?.dispose(); // optional => models do not have this property
        cube.removeFromParent();
    }
}


// Simulate 1000 ms / 60 FPS = 16.667 ms per frame every time we run update()
// SEE https://www.cleverti.com/blog/why-a-proper-frame-rate-system-can-change-the-game/

let levelEnded = false;
let playerCube;
let keyCube;
let exitCube;
var wallsDrawn = false;
var bonusCubes = new Map();
var malusCubes = new Map();
var wallCubes = [];


function mazeCoordToWorldCoord(t) {
    return (-(mazeState.width*20)/2) + ((mazeState.width*20) * t) / (mazeState.maze.length - 1);
}

function worldCoordToMazeCoord(t) {
    return Math.round(t/(10*mazeState.width) + 1);
}


function interpolCameraHeight(level) {
    // double slope = 1.0 * (output_end - output_start) / (input_end - input_start)
    // output = output_start + slope * (input - input_start)
    let slope = (200 - 90) / (14 - 5);
    return 90 + slope * (level - (level > 17 ? 3 : 5));
}

function updatePlayer() {
    if (!playerCube) return;
    let x = mazeCoordToWorldCoord(player.x);
    let y = mazeCoordToWorldCoord(player.y);
    let xP = Math.round(playerCube.position.x);
    let yP = Math.round(playerCube.position.y);
    if ((xP != x) || (yP != y)) {
        removeCubeInstance(playerCube);
        playerCube = createPlayerAt(x, y, player.hasMushroom);
        SCENE.add(playerCube);
        RESOURCES.get(RESOURCES.SOUND_PLAYER).play();
        MIXER_PLAYER = animateMeshWithBounce(playerCube)
    }
}

function resizeRendererToDisplaySize() {
    const canvas = RENDERER.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
        RENDERER.setSize(width, height, false);
    }
    return needResize;
}

/*
```js
 let array = Array(width * height);

 function setElement(colX, rowY, value) {
    array[width * rowY + colX] = value;  
 }
```
pour le row major order.

Pour l'inverse : 
```js
let x = row % width;
let y = row / width;
```
*/

function drawMaze() {
    // map 0-rows to -rows/2;+rows/2
    // see https://stackoverflow.com/a/5732390 for a generalization of mapping ranges
    if (!wallsDrawn) {
        mazeState.placeKey();
        mazeState.placeItems();
        wallCubes = new Array(mazeState.maze.length * mazeState.maze.length);
        mazeState.maze.forEach((rows, r) => {
            rows.forEach((cols, c) => {
                let x = mazeCoordToWorldCoord(c);
                let y = mazeCoordToWorldCoord(r);
                if (mazeState.maze[r][c] == "wall") {
                    wallCubes[mazeState.maze.length * r + c] = createWallAt(x, y);
                    SCENE.add(wallCubes[mazeState.maze.length * r + c]);
                } else if (mazeState.maze[r][c] == "treasure") {
                    let bonusCube = createBonusTreasureAt(x, y);
                    bonusCubes.set(c + "." + r, bonusCube);
                    SCENE.add(bonusCube);
                    MIXER_BOMB.push(animateMeshWithRotation(bonusCube));
                } else if (mazeState.maze[r][c] == "coin") {
                    let bonusCube = createBonusCoinAt(x, y);
                    bonusCubes.set(c + "." + r, bonusCube);
                    SCENE.add(bonusCube);
                    MIXER_BOMB.push(animateMeshWithRotation(bonusCube));
                } else if (mazeState.maze[r][c] == "star") {
                    let bonusCube = createBonusStarAt(x, y);
                    bonusCubes.set(c + "." + r, bonusCube);
                    SCENE.add(bonusCube);
                    MIXER_BOMB.push(animateMeshWithBounce(bonusCube));
                } else if (mazeState.maze[r][c] == "gem") {
                    let bonusCube = createBonusGemAt(x, y);
                    bonusCubes.set(c + "." + r, bonusCube);
                    SCENE.add(bonusCube);
                    MIXER_BOMB.push(animateMeshWithColor(bonusCube));
                } else if (mazeState.maze[r][c] == "mushroom") {
                    let bonusCube = createBonusMushroomAt(x, y);
                    bonusCubes.set(c + "." + r, bonusCube);
                    SCENE.add(bonusCube);
                    MIXER_BOMB.push(animateMeshWithRotation(bonusCube));
                } else if (mazeState.maze[r][c] == "bomb") {
                    let monsterCube = createMonsterBombAt(x, y);
                    malusCubes.set(c + "." + r, monsterCube);
                    SCENE.add(monsterCube);
                    MIXER_BOMB.push(animateMeshWithBounce(monsterCube));
                } else if (mazeState.maze[r][c] == "spiky") {
                    let spikyCube = createMonsterSpikyAt(x, y);
                    malusCubes.set(c + "." + r, spikyCube);
                    SCENE.add(spikyCube);
                    MIXER_BOMB.push(animateMeshWithBounce(spikyCube));
                } else if (mazeState.maze[r][c] == "key") {
                    keyCube = createKeyAt(x, y);
                    SCENE.add(keyCube);
                    MIXER_BOMB.push(animateMeshWithBounce(keyCube));
                } else if (cols.length > 1) {
                    if (r == mazeState.width*2) { // entrance
                        player = new Player(c, r);
                        playerCube = createPlayerAt(x, y);
                        SCENE.add(playerCube);
                        MIXER_PLAYER = animateMeshWithBounce(playerCube);
                    } else { // exit
                        exitCube = createExitAt(x, y)
                        SCENE.add(exitCube);
                    }   
                } 
            });
        });
        wallsDrawn = true;
    }
}

function gameLoop(timestamp) {
    // Throttle the frame rate.
    if (timestamp < last_frame_time_ms + (1000 / MAX_FPS)) {
        if (resizeRendererToDisplaySize()) {
            const canvas = RENDERER.domElement;
            CAMERA.aspect = canvas.clientWidth / canvas.clientHeight;
            CAMERA.updateProjectionMatrix();
        }
        requestAnimationFrameId = requestAnimationFrame(gameLoop);
        return;
    }
    delta += timestamp - last_frame_time_ms;
    last_frame_time_ms = timestamp;

    while (delta >= TIME_STEP) {
        updateCameraPosition(timestamp);
        delta -= TIME_STEP;
    }

    if (!levelEnded) {
        drawMaze();
        updatePlayer();
    }
    let clockDelta = CLOCK.getDelta();
    if (MIXER_PLAYER) {
        MIXER_PLAYER.update(clockDelta);
    }
    if (MIXER_BOMB) {
        MIXER_BOMB.forEach(v => v.update(clockDelta));
    }

    // Update HUD graphics.
    hudBitmap.clearRect(0, 0,  window.innerWidth,  window.innerHeight);
    hudBitmap.fillText("SCORE:" + Math.max(0, score).toString().padStart(3, "0"),  120,  50);
    hudBitmap.fillText("NIVEAU:" +  level.toString().padStart(2, "0"),  115,  100);
    hudTexture.needsUpdate = true;

    RENDERER.render(SCENE, CAMERA);
    RENDERER.render(sceneHUD, cameraHUD);
    // Call gameLoop recursively
    requestAnimationFrameId = requestAnimationFrame(gameLoop);
}

function updateCameraPosition(timestamp) {
    CAMERA.position.set(Math.sin(timestamp/8) * 2, CAMERA.position.y, CAMERA.position.z); 
}

function animateMeshWithColor(mesh) {
    mesh = mesh.children[0]; // HACK for gem model
    // create a keyframe track (i.e. a timed sequence of keyframes) for each animated property
    // Note: the keyframe track type should correspond to the type of the property being animated
    let zStart = 4 + Math.random();
    let zEnd = 8 - Math.random();
    if (Math.random() > 0.5) {
        [zStart, zEnd] = [zEnd, zStart];
    }
    const kFPosition = new THREE.VectorKeyframeTrack( '.position', [ 0, 0.2, 0.4 ], [ mesh.position.x, mesh.position.y, 0.15, mesh.position.x, mesh.position.y, 0, mesh.position.x, mesh.position.y, 0.15 ] );
    const kFcolor = new THREE.ColorKeyframeTrack( '.material.color', [ 0, 0.2, 0.4 ], [ Math.random(), Math.random(), 0, 0, Math.random(), 0, 0, 0, Math.random() ], THREE.InterpolateDiscrete );
    // create an animation sequence with the tracks
    // If a negative time value is passed, the duration will be calculated from the times of the passed tracks array
    const clip = new THREE.AnimationClip( 'Action', 0.6, [kFcolor, kFPosition] );
    const mixer = new THREE.AnimationMixer( mesh );
    const clipAction = mixer.clipAction( clip );
    // clipAction.setLoop(THREE.LoopOnce);
    // clipAction.clampWhenFinished = true;
    clipAction.play();
    return mixer;
}

function animateMeshWithBounce(mesh) {
    // create a keyframe track (i.e. a timed sequence of keyframes) for each animated property
    // Note: the keyframe track type should correspond to the type of the property being animated
    let zStart = 4 + Math.random();
    let zEnd = 8 - Math.random();
    if (Math.random() > 0.5) {
        [zStart, zEnd] = [zEnd, zStart];
    }
    
     const positionKF = new THREE.VectorKeyframeTrack( '.position', [ 0, 1, 2 ], [ mesh.position.x, mesh.position.y, zStart, mesh.position.x, mesh.position.y, zEnd, mesh.position.x, mesh.position.y, zStart ] );

    const positionKFStar = new THREE.VectorKeyframeTrack( '.position', [ 0, 0.2, 0.4 ], [ mesh.position.x, mesh.position.y, 5, mesh.position.x, mesh.position.y, 7, mesh.position.x, mesh.position.y, 5 ] );
    const colorKFStar = new THREE.ColorKeyframeTrack( '.material.color', [ 0, 0.2, 0.4 ], [ 1, 1, 0, 0, 1, 0, 0, 0, 1 ], THREE.InterpolateDiscrete );
    // create an animation sequence with the tracks
    // If a negative time value is passed, the duration will be calculated from the times of the passed tracks array
    const clip = player && player.hasStar ? new THREE.AnimationClip( 'Action', 0.6, [positionKFStar, colorKFStar] ) : new THREE.AnimationClip( 'Action', 2, [positionKF] );
    const mixer = new THREE.AnimationMixer( mesh );
    const clipAction = mixer.clipAction( clip );
    // clipAction.setLoop(THREE.LoopOnce);
    // clipAction.clampWhenFinished = true;
    clipAction.play();
    return mixer;
}

function animateMeshWithRotation(mesh) {
    // create a keyframe track (i.e. a timed sequence of keyframes) for each animated property
    // Note: the keyframe track type should correspond to the type of the property being animated
    const positionKF = new THREE.VectorKeyframeTrack( '.position', [ 0, 1, 2 ], [ mesh.position.x, mesh.position.y, 5, mesh.position.x, mesh.position.y, 7, mesh.position.x, mesh.position.y, 5 ] );
    // ROTATION
    // Rotation should be performed using quaternions, using a THREE.QuaternionKeyframeTrack
    // Interpolating Euler angles (.rotation property) can be problematic and is currently not supported

    // set up rotation about x axis
    let xAxis = mesh.rotation; // start with current rotation
    xAxis = new THREE.Vector3( 0, 0, 1 );
    //xAxis.normalize();

    const qInitial = new THREE.Quaternion().setFromAxisAngle( xAxis, Math.PI / 8 );
    const qFinal = new THREE.Quaternion().setFromAxisAngle( xAxis, -Math.PI / 8 );
    const quaternionKF = new THREE.QuaternionKeyframeTrack( '.quaternion', [ 0, 1, 2 ], [ qInitial.x, qInitial.y, qInitial.z, qInitial.w, qFinal.x, qFinal.y, qFinal.z, qFinal.w, qInitial.x, qInitial.y, qInitial.z, qInitial.w ] );
    // create an animation sequence with the tracks
    // If a negative time value is passed, the duration will be calculated from the times of the passed tracks array
    const clip = new THREE.AnimationClip( 'Action', 2, [positionKF, quaternionKF] );
    const mixer = new THREE.AnimationMixer( mesh );
    const clipAction = mixer.clipAction( clip );
    // clipAction.setLoop(THREE.LoopOnce);
    // clipAction.clampWhenFinished = true;
    clipAction.play();
    return mixer;
}
//------------------------------

var mazeState;
var level;
var score;
var player;

export function setup() {
    return RESOURCES.loadResources(CAMERA);
}

export function reset3dScene() {
    removeCubeInstance(playerCube);
    removeCubeInstance(bonusCubes);
    removeCubeInstance(malusCubes);
    while (SCENE.children.length > 0) { 
        SCENE.remove(SCENE.children[0]); 
    }
    wallsDrawn = false;
}

export function setup3dScene(maze) {
    mazeState = maze;
    initialize3dScene();
    initializeHUD();
}

export function startRenderingLoop() {
    if (!requestAnimationFrameId) {
        requestAnimationFrameId = window.requestAnimationFrame(gameLoop);
    }
}

export function removeBonus(x, y) {
    removeCubeInstance(bonusCubes.get(x + "." + y));
    bonusCubes.delete(x + "." + y);
}

export function removeMalus(x, y) {
    removeCubeInstance(malusCubes.get(x + "." + y));
    malusCubes.delete(x + "." + y);
}

export function removeKeyAndOpenDoor() {
    removeCubeInstance(keyCube);
    exitCube.children[0].material.color.setHex(0x11FF33);
}

export function removeWalls(x, y) {
    removeCubeInstance(wallCubes[mazeState.maze.length * y + x]);
}

export function setLevel(aLevel) {
    level = aLevel;
}

export function getLevel() {
    return level;
}

export function setScore(aScore) {
    score = aScore;
}

export function getScore() {
    return score;
}

export function setPlayer(aPlayer) {
    player = aPlayer;
}

export function getPlayer() {
    return player;
}

export function setLevelEnded(l) {
    levelEnded = l;
}