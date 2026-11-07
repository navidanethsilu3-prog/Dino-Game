
// ==========================================
// DINO DASH - ENDLESS RUNNER GAME
// ==========================================

// 1. GET HTML ELEMENTS
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const bestElement = document.getElementById("best-score");

const overlay = document.getElementById("gameOverlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayMessage = document.getElementById("overlayMessage");
const overlayIcon = document.getElementById("overlayIcon");

const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const restartBtn = document.getElementById("restartBtn");
const jumpBtn = document.getElementById("jumpBtn");


// Banana puzzle elements
const bananaPuzzle = document.getElementById("bananaPuzzle");
const bananaImage = document.getElementById("bananaQuestionImage");
const bananaForm = document.getElementById("bananaAnswerForm");
const bananaAnswer = document.getElementById("bananaAnswer");
const bananaFeedback = document.getElementById("bananaFeedback");
const submitBananaBtn = document.getElementById("submitBananaBtn");
const continueBtn = document.getElementById("continueBtn");
const finalGameActions = document.getElementById("finalGameActions");

// Current completed game score
let pendingFinalScore = 0;


// 2. CANVAS SETTINGS
let width = 0;
let height = 0;
let groundY = 0;

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    width = rect.width;
    height = rect.height;
    groundY = height - 35;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// 3. GAME VARIABLES
let gameState = "ready";

let score = 0;
let bestScore = 0;

let gameSpeed = 330;
let gravity = 1800;
let spawnTimer = 0;
let obstacleDelay = 1.3;
let groundOffset = 0;
let animationFrame = 0;
let lastTime = 0;

bestElement.textContent = formatScore(bestScore);
// CSRF security token
const csrfToken = document.querySelector(
    'meta[name="csrf-token"]'
).content;


// Load logged-in user's game statistics
async function loadPlayerStats() {

    try {

        const response = await fetch("api/get_stats.php");

        if (!response.ok) {
            throw new Error("Unable to retrieve player statistics.");
        }

        const data = await response.json();

        if (data.success) {

            bestScore = data.best_score;

            bestElement.textContent = formatScore(bestScore);

            console.log("Games played:", data.games_played);
        }

    } catch (error) {

        console.error(error);
    }
}


// Save completed game score to database
async function saveGameScore(finalScore) {

    try {

        const response = await fetch("api/save_score.php", {

            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": csrfToken
            },

            body: JSON.stringify({
                score: finalScore
            })

        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Score saving failed.");
        }

        bestScore = data.best_score;

        bestElement.textContent = formatScore(bestScore);

        console.log("Score saved successfully:", data);

    } catch (error) {

        console.error("Score saving error:", error);
    }
}

// Load a new puzzle from Banana API
async function loadBananaPuzzle(finalScore) {

    pendingFinalScore = finalScore;

    overlay.style.display = "flex";

    overlayIcon.textContent = "🍌";
    overlayTitle.textContent = "BANANA CHALLENGE";

    overlayMessage.textContent =
        "Your score: " + finalScore +
        " | Solve the puzzle to get another chance!";

    startBtn.hidden = true;
    bananaPuzzle.hidden = false;
    finalGameActions.hidden = true;
    continueBtn.hidden = true;

    bananaFeedback.textContent = "Loading puzzle...";
    bananaFeedback.className = "";

    bananaAnswer.value = "";
    bananaAnswer.disabled = true;
    submitBananaBtn.disabled = true;

    restartBtn.disabled = true;
    jumpBtn.disabled = true;
    pauseBtn.disabled = true;

    try {

        const response = await fetch(
            "api/banana_puzzle.php",
            {
                method: "GET",
                cache: "no-store"
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || "Unable to load puzzle."
            );
        }

        // Display puzzle image
        bananaImage.src = data.question;

        // Store puzzle ID for answer verification
        bananaImage.dataset.puzzleId = data.puzzle_id;

        bananaFeedback.textContent =
            "Enter the correct answer below!";

        bananaAnswer.disabled = false;
        submitBananaBtn.disabled = false;

        bananaAnswer.focus();

    } catch (error) {

        console.error("Banana API error:", error);

        showFinalGameOver(
            finalScore,
            "The maths puzzle could not be loaded."
        );
    }
}


// Submit player's answer
async function submitBananaAnswer(event) {

    event.preventDefault();

    const answer = bananaAnswer.value.trim();

    if (!/^\d{1,6}$/.test(answer)) {

        bananaFeedback.textContent =
            "Please enter a valid numerical answer.";

        bananaFeedback.className = "error";

        return;
    }

    submitBananaBtn.disabled = true;
    bananaAnswer.disabled = true;

    bananaFeedback.textContent = "Checking your answer...";
    bananaFeedback.className = "";

    try {

        const response = await fetch(
            "api/banana_puzzle.php",
            {

                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken
                },

                body: JSON.stringify({

                    answer: answer,

                    puzzle_id: bananaImage.dataset.puzzleId

                })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {

            throw new Error(
                data.message || "Unable to verify answer."
            );
        }

        if (data.correct) {

            // CORRECT ANSWER
            bananaFeedback.textContent =
                "🎉 Excellent! Your answer is correct!";

            bananaFeedback.className = "success";

            continueBtn.hidden = false;

        } else {

            // INCORRECT ANSWER
            showFinalGameOver(
                pendingFinalScore,
                "Your maths answer was incorrect."
            );
        }

    } catch (error) {

        console.error("Answer verification error:", error);

        showFinalGameOver(
            pendingFinalScore,
            "Unable to verify your answer. Please try again later."
        );
    }
}


// Final game over screen
function showFinalGameOver(finalScore, message) {

    bananaPuzzle.hidden = true;

    continueBtn.hidden = true;

    overlay.style.display = "flex";

    overlayIcon.textContent = "💥";
    overlayTitle.textContent = "GAME OVER";

    overlayMessage.textContent =
        message + " Your final score: " + finalScore;

    startBtn.hidden = true;

    finalGameActions.hidden = false;

    restartBtn.disabled = true;
    jumpBtn.disabled = true;
    pauseBtn.disabled = true;
}


// Correct answer: start another dinosaur game
function startBonusRun() {

    resetGame();

    bananaPuzzle.hidden = true;
    continueBtn.hidden = true;
    finalGameActions.hidden = true;

    startBtn.hidden = false;

    restartBtn.disabled = false;
    jumpBtn.disabled = false;

    startGame();
}


// Connect puzzle form
bananaForm.addEventListener(
    "submit",
    submitBananaAnswer
);


// Connect second-chance button
continueBtn.addEventListener(
    "click",
    startBonusRun
);


// 4. HELPER FUNCTION
function formatScore(value) {
    return Math.floor(value).toString().padStart(5, "0");
}

// 5. DINOSAUR OBJECT
const dino = {
    x: 70,
    y: 0,
    width: 44,
    height: 52,
    velocityY: 0,
    jumpPower: -680,
    isJumping: false,
    animation: 0
};

function resetDino() {
    dino.x = Math.min(70, width * 0.15);
    dino.y = groundY - dino.height;
    dino.velocityY = 0;
    dino.isJumping = false;
    dino.animation = 0;
}

// 6. OBSTACLES
let obstacles = [];

function createObstacle() {

    const canFly = score > 250 && Math.random() > 0.72;

    if (canFly) {
        obstacles.push({
            type: "bird",
            x: width + 20,
            y: groundY - 85 - Math.random() * 35,
            width: 42,
            height: 28,
            animation: 0
        });

    } else {
        const tall = Math.random() > 0.55;

        obstacles.push({
            type: "cactus",
            x: width + 20,
            y: groundY - (tall ? 65 : 45),
            width: tall ? 28 : 20,
            height: tall ? 65 : 45,
            tall: tall
        });
    }
}

// 7. CLOUDS
let clouds = [
    { x: 150, y: 50, size: 1 },
    { x: 450, y: 80, size: 0.8 },
    { x: 750, y: 45, size: 1.2 }
];

// 8. DRAW BACKGROUND
function drawBackground() {

    ctx.fillStyle = "#f4f0df";
    ctx.fillRect(0, 0, width, height);

    // Sun
    ctx.beginPath();
    ctx.arc(width - 85, 65, 25, 0, Math.PI * 2);
    ctx.fillStyle = "#e8c76d";
    ctx.fill();

    // Clouds
    clouds.forEach(cloud => {

        ctx.save();
        ctx.translate(cloud.x, cloud.y);
        ctx.scale(cloud.size, cloud.size);

        ctx.fillStyle = "#d8d9c9";

        ctx.beginPath();
        ctx.arc(0, 10, 12, 0, Math.PI * 2);
        ctx.arc(15, 2, 16, 0, Math.PI * 2);
        ctx.arc(32, 10, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    });

    // Ground
    ctx.fillStyle = "#9a8055";
    ctx.fillRect(0, groundY, width, 2);

    // Moving ground details
    ctx.fillStyle = "#b7a17a";

    for (let i = 0; i < width / 35 + 2; i++) {
        const x = ((i * 35 - groundOffset) % (width + 35) + width + 35) % (width + 35);

        ctx.fillRect(x, groundY + 12, 12, 2);
        ctx.fillRect(x + 15, groundY + 20, 5, 2);
    }
}

// 9. DRAW DINOSAUR
function drawDino() {

    const x = dino.x;
    const y = dino.y;

    const running = !dino.isJumping &&
        gameState === "running";

    dino.animation += running ? 0.2 : 0;

    const legMove = running
        ? Math.sin(dino.animation) * 5
        : 0;

    ctx.save();

    // Body
    ctx.fillStyle = "#365d38";
    ctx.fillRect(x + 5, y + 15, 30, 27);

    // Head
    ctx.fillRect(x + 23, y, 24, 23);

    // Snout
    ctx.fillRect(x + 35, y + 12, 12, 10);

    // Tail
    ctx.beginPath();
    ctx.moveTo(x + 7, y + 22);
    ctx.lineTo(x - 8, y + 12);
    ctx.lineTo(x + 7, y + 32);
    ctx.fill();

    // Eye
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x + 38, y + 5, 5, 5);

    ctx.fillStyle = "#17210c";
    ctx.fillRect(x + 40, y + 6, 2, 3);

    // Legs
    ctx.fillStyle = "#365d38";

    ctx.fillRect(x + 10, y + 39, 8, 12 + legMove);
    ctx.fillRect(x + 27, y + 39, 8, 12 - legMove);

    // Feet
    ctx.fillRect(x + 7, y + 49 + legMove, 12, 3);
    ctx.fillRect(x + 25, y + 49 - legMove, 12, 3);

    // Small arms
    ctx.fillRect(x + 32, y + 26, 9, 4);

    ctx.restore();
}

// 10. DRAW CACTUS
function drawCactus(obstacle) {

    const x = obstacle.x;
    const y = obstacle.y;
    const w = obstacle.width;
    const h = obstacle.height;

    ctx.fillStyle = "#54834c";

    // Main stem
    ctx.fillRect(x + w * 0.35, y, w * 0.35, h);

    // Left branch
    ctx.fillRect(x, y + h * 0.35, w * 0.45, 7);
    ctx.fillRect(x, y + h * 0.18, 7, h * 0.20);

    // Right branch
    ctx.fillRect(x + w * 0.65, y + h * 0.52, w * 0.35, 7);
    ctx.fillRect(x + w * 0.90, y + h * 0.32, 7, h * 0.24);

    // Top rounded look
    ctx.fillRect(x + w * 0.35, y - 3, w * 0.35, 5);
}

// 11. DRAW BIRD
function drawBird(obstacle) {

    const x = obstacle.x;
    const y = obstacle.y;

    const wing = Math.sin(animationFrame * 0.015) * 8;

    ctx.fillStyle = "#64748b";

    // Body
    ctx.fillRect(x + 8, y + 10, 27, 12);

    // Head
    ctx.fillRect(x + 29, y + 4, 12, 12);

    // Beak
    ctx.fillStyle = "#d97706";
    ctx.fillRect(x + 39, y + 10, 8, 4);

    // Wings
    ctx.fillStyle = "#475569";

    ctx.beginPath();
    ctx.moveTo(x + 18, y + 13);
    ctx.lineTo(x + 22, y + wing);
    ctx.lineTo(x + 30, y + 13);
    ctx.fill();

    // Eye
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x + 35, y + 7, 3, 3);
}

// 12. DRAW ALL OBSTACLES
function drawObstacles() {

    obstacles.forEach(obstacle => {

        if (obstacle.type === "cactus") {
            drawCactus(obstacle);
        } else {
            drawBird(obstacle);
        }
    });
}

// 13. JUMP FUNCTION
function jump() {

    if (gameState === "ready") {
        startGame();
    }

    if (gameState !== "running") return;

    if (!dino.isJumping) {
        dino.velocityY = dino.jumpPower;
        dino.isJumping = true;
    }
}

// 14. COLLISION DETECTION
function checkCollision(a, b) {

    // Slightly smaller hitboxes make gameplay fairer.
    const padding = 7;

    return (
        a.x + padding < b.x + b.width - padding &&
        a.x + a.width - padding > b.x + padding &&
        a.y + padding < b.y + b.height - padding &&
        a.y + a.height - padding > b.y + padding
    );
}

// 15. UPDATE GAME
function update(deltaTime) {

    if (gameState !== "running") return;

    // Increase score
    score += deltaTime * 10;

    scoreElement.textContent = formatScore(score);

    // Increase difficulty
    gameSpeed = Math.min(330 + score * 1.3, 700);

    // Update dinosaur physics
    dino.velocityY += gravity * deltaTime;
    dino.y += dino.velocityY * deltaTime;

    // Ground collision
    if (dino.y + dino.height >= groundY) {
        dino.y = groundY - dino.height;
        dino.velocityY = 0;
        dino.isJumping = false;
    }

    // Move ground
    groundOffset += gameSpeed * deltaTime;

    // Move clouds
    clouds.forEach(cloud => {
        cloud.x -= gameSpeed * 0.12 * deltaTime;

        if (cloud.x < -60) {
            cloud.x = width + 60;
        }
    });

    // Spawn obstacles
    spawnTimer += deltaTime;

    if (spawnTimer >= obstacleDelay) {
        createObstacle();
        spawnTimer = 0;

        obstacleDelay = Math.max(
            0.75,
            1.3 - score / 4000
        );
    }

    // Move obstacles
    obstacles.forEach(obstacle => {
        obstacle.x -= gameSpeed * deltaTime;
    });

    // Remove obstacles outside screen
    obstacles = obstacles.filter(
        obstacle => obstacle.x + obstacle.width > -20
    );

    // Check collision
    for (const obstacle of obstacles) {

        if (checkCollision(dino, obstacle)) {
            endGame();
            return;
        }
    }
}

// 16. DRAW GAME
function drawGame() {

    ctx.clearRect(0, 0, width, height);

    drawBackground();
    drawDino();
    drawObstacles();

}

// 17. START GAME
function startGame() {

    if (gameState === "running") return;

    if (gameState === "gameover") {
        resetGame();
    }

    gameState = "running";

    overlay.style.display = "none";

    pauseBtn.disabled = false;
    pauseBtn.innerHTML = "<span>Ⅱ</span> PAUSE";
}

// 18. PAUSE GAME
function pauseGame() {

    if (gameState === "running") {

        gameState = "paused";

        overlay.style.display = "flex";
        overlayIcon.textContent = "⏸️";
        overlayTitle.textContent = "PAUSED";
        overlayMessage.textContent =
            "Take a break! Your progress is safe.";
        startBtn.textContent = "RESUME GAME";

        pauseBtn.innerHTML = "<span>▶</span> RESUME";

    } else if (gameState === "paused") {

        startGame();
    }
}


function endGame() {

    if (gameState !== "running") return;

    gameState = "gameover";

    const finalScore = Math.floor(score);

    // Save original game score to MySQL
    saveGameScore(finalScore);

    // Show Banana maths puzzle
    loadBananaPuzzle(finalScore);
}


// 20. RESET GAME
function resetGame() {

    score = 0;
    gameSpeed = 330;
    spawnTimer = 0;
    obstacleDelay = 1.3;
    groundOffset = 0;

    obstacles = [];

    scoreElement.textContent = "00000";

    resetDino();

    gameState = "ready";
}

// 21. GAME LOOP
function gameLoop(timestamp) {

    const deltaTime = Math.min(
        (timestamp - lastTime) / 1000 || 0,
        0.04
    );

    lastTime = timestamp;

    animationFrame = timestamp;

    update(deltaTime);
    drawGame();

    requestAnimationFrame(gameLoop);
}

// 22. KEYBOARD CONTROLS
document.addEventListener("keydown", function(event) {

    if (
        event.code === "Space" ||
        event.code === "ArrowUp"
    ) {
        event.preventDefault();

        if (event.repeat) return;

        jump();
    }

    if (event.code === "Escape") {

        if (
            gameState === "running" ||
            gameState === "paused"
        ) {
            pauseGame();
        }
    }
});

// 23. BUTTON EVENTS
startBtn.addEventListener("click", startGame);

pauseBtn.addEventListener("click", pauseGame);

restartBtn.addEventListener("click", function() {

    resetGame();

    bananaPuzzle.hidden = true;
    continueBtn.hidden = true;
    finalGameActions.hidden = true;

    startBtn.hidden = false;

    restartBtn.disabled = false;
    jumpBtn.disabled = false;

    overlay.style.display = "flex";
    overlayIcon.textContent = "🦖";
    overlayTitle.textContent = "DINO DASH";
    overlayMessage.textContent =
        "Get ready to run! Jump over obstacles and see how far you can go.";

    startBtn.textContent = "START GAME";

    pauseBtn.disabled = true;
    pauseBtn.innerHTML = "<span>Ⅱ</span> PAUSE";
});

jumpBtn.addEventListener("click", jump);

// Mobile screen keyboard support
canvas.addEventListener("pointerdown", function(event) {

    if (event.pointerType === "touch") {
        event.preventDefault();
        jump();
    }
});

// 24. INITIALIZE GAME
resetDino();

drawGame();

// Load personal best score from MySQL
loadPlayerStats();

requestAnimationFrame(gameLoop);
