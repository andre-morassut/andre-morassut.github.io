/*

ASSETS
---------------------------------
Sound : https://freesound.org/people/Robinhood76/sounds/333489/ (door)
Sound : https://freesound.org/people/suntemple/sounds/253172/ (bonus)
Sound : https://freesound.org/people/jivatma07/sounds/122255/ (level)
Sound : https://freesound.org/people/AbdrTar/sounds/558121/ (closed)
Sound : three js example "ping pong"
Sound : https://freesound.org/people/TheDweebMan/sounds/278164/ (monster)
Sound : https://freesound.org/people/Prof.Mudkip/sounds/386862/ (explosion)

TEXTURES
---------------------------------
https://www.planetminecraft.com/member/gealx3/post/ 

MODELS
--------------------------------
Star : Star by Poly by Google [CC-BY] (https://creativecommons.org/licenses/by/3.0/) via Poly Pizza (https://poly.pizza/m/9NXf-SDxJny) 
Treasure : Treasure Chest by Alex “SAFFY” Safayan [CC-BY] (https://creativecommons.org/licenses/by/3.0/) via Poly Pizza (https://poly.pizza/m/3SGvQIwe214)
Gem : Gem by Wesley Thompson [CC-BY] (https://creativecommons.org/licenses/by/3.0/) via Poly Pizza (https://poly.pizza/m/6K1VsAxWLwH)
Coin : Coin by Poly by Google [CC-BY] (https://creativecommons.org/licenses/by/3.0/) via Poly Pizza (https://poly.pizza/m/5dwGkhjKXIW)
Bomb : Bomb by Quaternius (https://poly.pizza/m/0oNZ1y6ghg)
Key : Key by Poly by Google [CC-BY] (https://creativecommons.org/licenses/by/3.0/) via Poly Pizza (https://poly.pizza/m/0J_HflIStKl)
Gate : Gate by Poly by Google [CC-BY] (https://creativecommons.org/licenses/by/3.0/) via Poly Pizza (https://poly.pizza/m/07oA3gKcvLt)
Spiky ball : Spiky Ball by Quaternius (https://poly.pizza/m/HEKBGK7iIk) 
Mushroom : Mushroom by hat_my_guy (https://poly.pizza/m/ApDabEFWcs)
*/
import * as THREE from "three";
import { GLTFLoader } from "gltfLoader";

var LISTENER; // global listener
const GLTF_LOADER = new GLTFLoader();

export const SOUND_PLAYER = "player";
var SOUND_OBJ_PLAYER;

export const SOUND_BONUS = "bonus";
var SOUND_OBJ_BONUS;

export const SOUND_DOOR = "door";
var SOUND_OBJ_DOOR;

export const SOUND_LEVEL = "level";
var SOUND_OBJ_LEVEL;

export const SOUND_START = "start";
var SOUND_OBJ_START;

export const SOUND_CLOSED = "closed";
var SOUND_OBJ_CLOSED;

export const SOUND_MONSTER = "monster";
var SOUND_OBJ_MONSTER;

export const SOUND_EXPLOSION = "explosion";
var SOUND_OBJ_EXPLOSION;

export const SOUND_COIN = "coin";
var SOUND_OBJ_COIN;

export const SOUND_SPIKE = "spikesound";
var SOUND_OBJ_SPIKE;

export const SOUND_MUSHROOM = "mushroomsound";
var SOUND_OBJ_MUSHROOM;

export const MODEL_BOMB = "bomb";
var MODEL_BOMB_OBJ;

export const MODEL_BONUS_TREASURE = "treasure";
var MODEL_BONUS_TREASURE_OBJ;

export const MODEL_BONUS_COIN = "coinobj";
var MODEL_BONUS_COIN_OBJ;

export const MODEL_BONUS_STAR = "star";
var MODEL_BONUS_STAR_OBJ;

export const MODEL_BONUS_GEM = "gem";
var MODEL_BONUS_GEM_OBJ;

export const MODEL_DOOR = "gate";
var MODEL_DOOR_OBJ;

export const MODEL_KEY = "key";
var MODEL_KEY_OBJ;

export const MODEL_SPIKY = "spiky";
var MODEL_SPIKY_OBJ;

export const MODEL_MUSHROOM = "mushroom";
var MODEL_MUSHROOM_OBJ;

export const MATERIAL_WALL = "wall";
var MATERIAL_OBJ_WALL;

/**
 * Get a resource by its ID. Returns a pre-initialized object 
 * or a clone for models susceptible to multiple instatiation.
 * @param {*} id 
 * @returns resource
 */
export function get(id) {
    switch (id) {
        case SOUND_PLAYER:
            return SOUND_OBJ_PLAYER;
        case SOUND_BONUS:
            return SOUND_OBJ_BONUS;
        case SOUND_DOOR:
            return SOUND_OBJ_DOOR;
        case SOUND_LEVEL:
            return SOUND_OBJ_LEVEL;
        case SOUND_START:
            return SOUND_OBJ_START;
        case SOUND_CLOSED:
            return SOUND_OBJ_CLOSED;
        case SOUND_MONSTER:
            return SOUND_OBJ_MONSTER;
        case SOUND_EXPLOSION:
            return SOUND_OBJ_EXPLOSION;
        case SOUND_COIN:
            return SOUND_OBJ_COIN;
        case SOUND_SPIKE:
            return SOUND_OBJ_SPIKE;
        case SOUND_MUSHROOM:
            return SOUND_OBJ_MUSHROOM;
        case MODEL_BOMB:
            return MODEL_BOMB_OBJ.scene.clone(); 
        case MODEL_BONUS_TREASURE:
            return MODEL_BONUS_TREASURE_OBJ.scene.clone();
        case MODEL_BONUS_COIN:
            return MODEL_BONUS_COIN_OBJ.scene.clone();
        case MODEL_BONUS_STAR:
            return MODEL_BONUS_STAR_OBJ.scene.clone();
        case MODEL_BONUS_GEM:
            return MODEL_BONUS_GEM_OBJ.scene.clone();
        case MODEL_SPIKY:
            return MODEL_SPIKY_OBJ.scene.clone();
        case MODEL_MUSHROOM:
            return MODEL_MUSHROOM_OBJ.scene.clone();
        case MODEL_DOOR:
            return MODEL_DOOR_OBJ;
        case MODEL_KEY:
            return MODEL_KEY_OBJ;
        case MATERIAL_WALL:
            return MATERIAL_OBJ_WALL;
        default:
            console.warn("Unrecognized resources id ; " + id);
    }
}

/**
 * Loads all resources and attach sounds to given camera 
 * @param {} CAMERA 
 * @returns Promise
 */
export function loadResources(CAMERA) {
    LISTENER = new THREE.AudioListener();
    CAMERA.add(LISTENER);
    let promises = [];
    // load all sounds
    promises.push(loadSound("sounds/ping_pong.mp3").then((audio) => SOUND_OBJ_PLAYER = audio));
    promises.push(loadSound("sounds/door.mp3").then((audio) => SOUND_OBJ_DOOR = audio));
    promises.push(loadSound("sounds/bonus.mp3").then((audio) => SOUND_OBJ_BONUS = audio));
    promises.push(loadSound("sounds/level.mp3").then((audio) => SOUND_OBJ_LEVEL = audio));
    promises.push(loadSound("sounds/start.mp3").then((audio) => SOUND_OBJ_START = audio));
    promises.push(loadSound("sounds/closed.mp3").then((audio) => SOUND_OBJ_CLOSED = audio));
    promises.push(loadSound("sounds/monster.mp3").then((audio) => SOUND_OBJ_MONSTER = audio));
    promises.push(loadSound("sounds/explosion.mp3").then((audio) => SOUND_OBJ_EXPLOSION = audio));
    promises.push(loadSound("sounds/coin.mp3").then((audio) => SOUND_OBJ_COIN = audio));
    promises.push(loadSound("sounds/spike.mp3").then((audio) => SOUND_OBJ_SPIKE = audio));
    promises.push(loadSound("sounds/mushroom.mp3").then((audio) => SOUND_OBJ_MUSHROOM = audio));
    // load models
    promises.push(loadModel("models/Bomb.glb").then((glb) => MODEL_BOMB_OBJ = glb));
    promises.push(loadModel("models/Treasure.glb").then((glb) => MODEL_BONUS_TREASURE_OBJ = glb));
    promises.push(loadModel("models/Coin.glb").then((glb) => MODEL_BONUS_COIN_OBJ = glb));
    promises.push(loadModel("models/Star.glb").then((glb) => MODEL_BONUS_STAR_OBJ = glb));
    promises.push(loadModel("models/Gate.glb").then((glb) => MODEL_DOOR_OBJ = glb));
    promises.push(loadModel("models/Key.glb").then((glb) => MODEL_KEY_OBJ = glb));
    promises.push(loadModel("models/Gem.glb").then((glb) => MODEL_BONUS_GEM_OBJ = glb));
    promises.push(loadModel("models/Spiky.glb").then((glb) => MODEL_SPIKY_OBJ = glb));
    promises.push(loadModel("models/Mushroom.glb").then((glb) => MODEL_MUSHROOM_OBJ = glb));
    // load texture
    promises.push(loadTexture("./textures/" + Math.round(Math.random() * 14) + ".png").then((texture) => MATERIAL_OBJ_WALL = texture));
    // wait all is loaded    
    return Promise.all(promises);
}

/**
 * Load a sound
 * @param {String} path 
 * @returns Promise
 */
 function loadSound(path) {
    const audio = new THREE.PositionalAudio(LISTENER);
    const audioLoader = new THREE.AudioLoader();
    return new Promise(function(res, rej) {
        audioLoader.load(path, function( buffer ) {
            audio.setBuffer( buffer );
            audio.setLoop( false );
            audio.setVolume(3.0);
            res(audio);
        }, undefined, rej);
    });    
}

function loadTexture(path) {
    // instantiate a loader
    return new Promise(function(res, rej) {
        const loader = new THREE.TextureLoader();
        // load a resource
        loader.load(
            // resource URL
            path,
            // onLoad callback
            function ( texture ) {
                // in this example we create the material when the texture is loaded
                res(new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture } ));
            },
            undefined, // onProgress callback currently not supported
            // onError callback
            function (err) {
                console.error(`Error on loading textures : ${JSON.stringify(err)}`);
                rej();
            }
        );
    });
}

function loadModel(path) {
    return new Promise(function(res, rej) {
        GLTF_LOADER.load(path, function ( gltf ) { 
            res(gltf);
        }, undefined, rej);
    });
}