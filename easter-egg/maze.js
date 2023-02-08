import * as MAZE3D from "./maze-3d.js";
import { MazeBuilder } from "./maze-builder.js";
import * as RESOURCES from "./maze-resources.js";

// Menus
const inputLevel = document.getElementById("input-level");
const reloadBtn = document.getElementById("reload-btn");
const menuTitle = document.getElementById("menu-title");
const menuLevel = document.getElementById("menu-level");
const menuWon = document.getElementById("menu-won");
const menuLost = document.getElementById("menu-lost");

let CURRENT_STATE = "title";
const STATES = [
    {id:"title", enter: onTitle},
    {id:"level", enter: onLevel},
    {id:"loadgame", enter: onLoadGame},
    {id:"game", enter: onNewGame},
    {id:"won", enter: onWon},
    {id:"lost", enter: onLost}
];

function onTitle()  {
    CURRENT_STATE = "title";
    menuLevel.style.display = "none"; // TODO see if useful?
}

function onLevel()  {
    CURRENT_STATE = "level";
    levelEnded = true;
    MAZE3D.setLevelEnded(levelEnded);
    menuTitle.style.display = "none";
    menuWon.style.display = "none";
    menuLost.style.display = "none";
    menuLevel.style.display = "block";
}

function onLoadGame() {
    CURRENT_STATE = "loadgame";
    MAZE3D.setup().then(() => {
        MAZE3D.setLevel(+inputLevel.value);
        mazeSize = MAZE3D.getLevel() + 2;
        onNewGame();
    });
}

function onNewGame() {
    CURRENT_STATE = "game";
    menuLevel.style.display = "none";
    menuWon.style.display = "none";
    menuLost.style.display = "none";
    mazeBuilder = new MazeBuilder(mazeSize, mazeSize);
    score = levelScore;
    levelEnded = false;
    MAZE3D.setLevelEnded(levelEnded);
    RESOURCES.get(RESOURCES.SOUND_START).play();
    reloadBtn.style.display = "block";
    MAZE3D.setScore(score);
    MAZE3D.setup3dScene(mazeBuilder);
    MAZE3D.startRenderingLoop();
}

function onWon() {
    CURRENT_STATE = "won";
    // WON
    MAZE3D.setLevel(MAZE3D.getLevel() + 1);
    if (MAZE3D.getLevel() % 2 == 0) {
        mazeSize++;
    }
    levelEnded = true;
    MAZE3D.setLevelEnded(levelEnded);
    if (mazeSize > 5) score += Math.round(mazeSize * 0.75); // bonus
    levelScore = score;
    menuTitle.style.display = "none";
    menuWon.style.display = "block";
    menuLost.style.display = "none";
    menuLevel.style.display = "none";
    RESOURCES.get(RESOURCES.SOUND_LEVEL).play();
    MAZE3D.reset3dScene();
}

function onLost() {
    CURRENT_STATE = "lost";
    // LOST
    levelEnded = true;
    MAZE3D.setLevelEnded(levelEnded);
    score = 0;
    menuTitle.style.display = "none";
    menuWon.style.display = "none";
    menuLost.style.display = "block";
    menuLevel.style.display = "none";
    RESOURCES.get(RESOURCES.SOUND_LEVEL).play();
    MAZE3D.reset3dScene();
}

// Simulate 1000 ms / 60 FPS = 16.667 ms per frame every time we run update()
// SEE https://www.cleverti.com/blog/why-a-proper-frame-rate-system-can-change-the-game/

let levelEnded = false;
let levelScore = 0;
let score = 0;
var mazeBuilder;
var mazeSize;

window.addEventListener("keydown", (event) => {
    if (!levelEnded && MAZE3D.getPlayer()) {
        setTimeout(() => {
            if (event.keyCode == 38) {
                move(1);
            } else if (event.keyCode == 39) {
                move(2);
            } else if (event.keyCode == 40) {
                move(3);
            } else if (event.keyCode == 37) {
                move(4);
            }
        }, 1);
    }
    // ENTER and SPACE BAR are shortcuts
    if(!((event.keyCode == 32) || (event.keyCode == 13))) return;
    if (CURRENT_STATE == "level") {
        onLoadGame();
    } else if (CURRENT_STATE == "won" || CURRENT_STATE == "lost") {
        onNewGame();
    } else if (CURRENT_STATE == "title") {
        onLevel();
    }
    
});

function growFactor() {
    let level = mazeSize - 3;
    return level;/* Math.round(level < 5 ? level : level*1.5);*/
}

function trackScore() {
    if (score < 0) {
        onLost();
        return;
    }
    let p = MAZE3D.getPlayer();
    if (mazeBuilder.maze[p.y][p.x] == "treasure") {
        score += 8 + Math.round(growFactor()*1.75);
        RESOURCES.get(RESOURCES.SOUND_BONUS).play();
        MAZE3D.removeBonus(p.x, p.y);
        mazeBuilder.maze[p.y][p.x] = "";
        removeWallsAroundCurrentPosition(2);
    } else if (mazeBuilder.maze[p.y][p.x] == "coin") {
        score += 1 + growFactor();
        RESOURCES.get(RESOURCES.SOUND_COIN).play();
        MAZE3D.removeBonus(p.x, p.y);
        mazeBuilder.maze[p.y][p.x] = "";
        removeWallsAroundCurrentPosition(1);
    } else if (mazeBuilder.maze[p.y][p.x] == "bomb") {
        if (!p.hasStar && !p.hasMushroom) score -= 12 + Math.round(growFactor() * 1.5);
        if (score < 0) {
            onLost();
            return;
        }
        RESOURCES.get(RESOURCES.SOUND_EXPLOSION).play();
        MAZE3D.removeMalus(p.x, p.y);
        mazeBuilder.maze[p.y][p.x] = "";
        removeWallsAroundCurrentPosition();
    } else if (mazeBuilder.maze[p.y][p.x] == "spiky") {
        if (!p.hasStar && !p.hasMushroom) score -= 6 + Math.round(growFactor());
        if (score < 0) {
            onLost();
            return;
        }
        RESOURCES.get(RESOURCES.SOUND_SPIKE).play();
        MAZE3D.removeMalus(p.x, p.y);
        mazeBuilder.maze[p.y][p.x] = "";
        removeWallsAroundCurrentPosition(4);
    } else if (mazeBuilder.maze[p.y][p.x] == "key") {
        score += 5 + growFactor();
        RESOURCES.get(RESOURCES.SOUND_MONSTER).play();
        MAZE3D.removeKeyAndOpenDoor();
        mazeBuilder.maze[p.y][p.x] = "";
        p.hasKey = true;
        removeWallsAroundCurrentPosition();
        // animate an explosion : https://varun.ca 
    } else if (mazeBuilder.maze[p.y][p.x] == "star") {
        score += 1 + growFactor();
        RESOURCES.get(RESOURCES.SOUND_MONSTER).play();
        MAZE3D.removeBonus(p.x, p.y);
        mazeBuilder.maze[p.y][p.x] = "";
        p.hasStar = true;
        setTimeout(() => {
            p.hasStar = false;
        }, 5000);
        removeWallsAroundCurrentPosition();
        // animate an explosion : https://varun.ca 
    } else if (mazeBuilder.maze[p.y][p.x] == "mushroom") {
        score += 1 + growFactor();
        RESOURCES.get(RESOURCES.SOUND_MUSHROOM).play();
        MAZE3D.removeBonus(p.x, p.y);
        mazeBuilder.maze[p.y][p.x] = "";
        p.hasMushroom = true;
        setTimeout(() => {
            p.hasMushroom = false;
        }, MAZE3D.getLevel() > 10 ? 8000 : 6000);
        removeWallsAroundCurrentPosition();
        // animate an explosion : https://varun.ca 
    } else if (mazeBuilder.maze[p.y][p.x] == "gem") {
        score += 3 + growFactor();
        RESOURCES.get(RESOURCES.SOUND_BONUS).play();
        MAZE3D.removeBonus(p.x, p.y);
        mazeBuilder.maze[p.y][p.x] = "";
        removeWallsAroundCurrentPosition();
        // animate an explosion : https://varun.ca 
    } else if (mazeBuilder.maze[p.y][p.x] == "wall" && p.hasStar) {
        score += 1 + Math.round(growFactor()/10);
        MAZE3D.removeWalls(p.x, p.y);
        mazeBuilder.maze[p.y][p.x] = "";
    } else if (p.hasMushroom) {
        if (mazeBuilder.maze[p.y][p.x] == "wall") {
            score += 1 + Math.round(growFactor()/10);
            MAZE3D.removeWalls(p.x, p.y);
            mazeBuilder.maze[p.y][p.x] = "";
        }
        removeWallsAroundCurrentPosition(null, true);
    }
}

function removeWallsAroundCurrentPosition(stopCount, addScore) {
    let p = MAZE3D.getPlayer();
    let wallsDeleted = 0;
    if (p.x + 1 < mazeBuilder.maze.length) {
        if (mazeBuilder.maze[p.y][p.x+1] == "wall") {
            mazeBuilder.maze[p.y][p.x+1] = "";
            MAZE3D.removeWalls(p.x + 1, p.y);
            wallsDeleted++;
            if (addScore) score++;
            if (wallsDeleted == stopCount) return;
        }
        if (p.y + 1 < mazeBuilder.maze.length) {
            if (mazeBuilder.maze[p.y+1][p.x+1] == "wall") {
                mazeBuilder.maze[p.y+1][p.x+1] = "";
                MAZE3D.removeWalls(p.x + 1, p.y + 1);
                wallsDeleted++;
                if (addScore) score++;
                if (wallsDeleted == stopCount) return;
            }
        }
        if (p.y - 1 >= 0) {
            if (mazeBuilder.maze[p.y-1][p.x+1] == "wall") {
                mazeBuilder.maze[p.y-1][p.x+1] = "";
                MAZE3D.removeWalls(p.x + 1, p.y - 1);
                wallsDeleted++;
                if (addScore) score++;
                if (wallsDeleted == stopCount) return;
            }
        }
    }
    if (p.x - 1 >= 0) {
        if (mazeBuilder.maze[p.y][p.x-1] == "wall") {
            mazeBuilder.maze[p.y][p.x-1] = "";
            MAZE3D.removeWalls(p.x - 1, p.y);
            wallsDeleted++;
            if (addScore) score++;
            if (wallsDeleted == stopCount) return;
        }
        if (p.y + 1 < mazeBuilder.maze.length) {
            if (mazeBuilder.maze[p.y+1][p.x-1] == "wall") {
                mazeBuilder.maze[p.y+1][p.x-1] = "";
                MAZE3D.removeWalls(p.x - 1, p.y + 1);
                wallsDeleted++;
                if (addScore) score++;
                if (wallsDeleted == stopCount) return;
            }
        }
        if (p.y - 1 >= 0) {
            if (mazeBuilder.maze[p.y-1][p.x-1] == "wall") {
                mazeBuilder.maze[p.y-1][p.x-1] = "";
                MAZE3D.removeWalls(p.x - 1, p.y - 1);
                wallsDeleted++;
                if (addScore) score++;
                if (wallsDeleted == stopCount) return;
            }
        }
    }
    if (p.y + 1 < mazeBuilder.maze.length) {
        if (mazeBuilder.maze[p.y+1][p.x] == "wall") {
            mazeBuilder.maze[p.y+1][p.x] = "";
            MAZE3D.removeWalls(p.x, p.y + 1);
            wallsDeleted++;
            if (addScore) score++;
            if (wallsDeleted == stopCount) return;
        }
    }
    if (p.y - 1 >= 0) {
        if (mazeBuilder.maze[p.y-1][p.x] == "wall") {
            mazeBuilder.maze[p.y-1][p.x] = "";
            MAZE3D.removeWalls(p.x, p.y - 1);
            wallsDeleted++;
            if (addScore) score++;
            if (wallsDeleted == stopCount) return;
        }
    }
}

/**
 * Compute next move and changes x, y accordingly
 * @param {*} maze the current maze map
 * @param {*} direction 1 for up, 2 for right, 3 for down, 4 for left
 */
function move(direction) {
    if (!mazeBuilder) return;
    if (!mazeBuilder.maze) return;
    let p = MAZE3D.getPlayer();
    if (!p) return;
    let oldX = p.x;
    let oldY = p.y;
    switch(direction) {
        case 1:
            if (p.y < (mazeBuilder.maze.length - 1)) {
                if (mazeBuilder.maze[p.y+1][p.x] != "wall" || p.hasStar || p.hasMushroom) {
                    p.y = p.y + 1;
                } 
            }
            break;
        case 2:
            if (p.x < (mazeBuilder.maze.length - 1)) {
                if (mazeBuilder.maze[p.y][p.x+1] != "wall" || p.hasStar || p.hasMushroom) {
                    p.x = p.x + 1;
                } 
                // else if (p.hasStar || p.hasMushroom) {
                //     removeCubeInstance(wallCubes[mazeBuilder.mazeSize * worldCoordToMazeCoord(p.y+1) + worldCoordToMazeCoord(p.x)]);
                // }
            }
            break;
        case 3:
            if (p.y > 0) {
                if (mazeBuilder.maze[p.y-1][p.x] != "wall" || p.hasStar || p.hasMushroom) {
                    p.y = p.y - 1;
                }
            }
            break;
        case 4:
            if (p.x > 0) {
                if (mazeBuilder.maze[p.y][p.x-1] != "wall" || p.hasStar || p.hasMushroom) {
                    p.x = p.x - 1;
                }
            }
            break;
            default:
                console.error("Unrecognized player direction.");
                break;
    }
    switch(direction) {
        case 1:
        case 2:
        case 3:
        case 4:
            if (mazeBuilder.maze[p.y][p.x].length > 1) {
                if (mazeBuilder.maze[p.y][p.x][1] == "exit") {
                    if (!p.hasKey) {
                        RESOURCES.get(RESOURCES.SOUND_CLOSED).play();
                        p.x = oldX;
                        p.y = oldY;
                        if (!p.hasStar && !p.hasMushroom) score--;
                    } else {
                        onWon();
                    }
                }
            }
        break;
    }
    trackScore();
}

// expose function to HTML - simple and unsafe style
window.onLevel = onLevel;
window.onLoadGame = onLoadGame;
window.onNewGame = onNewGame;