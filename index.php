<?php
require_once __DIR__ . '/config/db.php';

// Prevent guests from accessing the game
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="<?= e($_SESSION['csrf_token']) ?>">
    <title>Dino Dash - Endless Runner</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>

    <main class="game-container">

        <header class="game-header">
            <div class="logo">
                <span class="logo-icon">🦖</span>
                <div>
                    <h1>DINO DASH</h1>
                    <p>ENDLESS RUNNER</p>
                </div>
            </div>

            
            <div class="header-right">

                <div class="player-info">
                    <span>WELCOME,</span>
                    <strong><?= e($_SESSION['user_name']) ?></strong>
                </div>

                <a href="logout.php" class="logout-btn"
                onclick="return confirm('Are you sure you want to logout?')">
                    <span>↪</span> LOGOUT
                </a>

                <div class="score-board">
                    <div class="score-item">
                        <span>SCORE</span>
                        <strong id="score">00000</strong>
                    </div>

                    <div class="score-item">
                        <span>BEST</span>
                        <strong id="best-score">00000</strong>
                    </div>
                </div>

            </div>

        </header>

        <section class="game-area">

            <canvas id="gameCanvas"></canvas>

            <div class="game-overlay" id="gameOverlay">
                <div class="overlay-content">
                    <div class="overlay-icon" id="overlayIcon">🦖</div>
                    <h2 id="overlayTitle">DINO DASH</h2>
                    <p id="overlayMessage">
                        Get ready to run! Jump over obstacles
                        and see how far you can go.
                    </p>
                    <button id="startBtn" class="primary-btn">
                        START GAME
                    </button>

                    <!-- BANANA MATHS PUZZLE -->
                    <div id="bananaPuzzle" hidden>

                        <div class="banana-heading">
                            🍌 SOLVE THE PUZZLE
                        </div>

                        <p class="banana-description">
                            You lost this round! Solve the maths puzzle
                            correctly to earn another chance.
                        </p>

                        <div class="banana-image-container">

                            <img
                                id="bananaQuestionImage"
                                src=""
                                alt="Banana Maths Puzzle"
                            >

                        </div>

                        <form id="bananaAnswerForm">

                            <input
                                type="number"
                                id="bananaAnswer"
                                placeholder="Enter your answer"
                                required
                                min="0"
                                step="1"
                            >

                            <button type="submit" class="primary-btn" id="submitBananaBtn">
                                SUBMIT ANSWER
                            </button>

                        </form>

                        <p id="bananaFeedback"></p>

                        <button
                            type="button"
                            id="continueBtn"
                            class="primary-btn"
                            hidden
                        >
                            PLAY AGAIN 🦖
                        </button>

                    </div>

                    <!-- FINAL GAME OVER ACTIONS -->
                    <div id="finalGameActions" hidden>

                        <a href="logout.php" class="primary-btn final-logout-btn">
                            LOGOUT
                        </a>

                    </div>

                </div>
            </div>

        </section>

        <div class="game-controls">

            <button id="pauseBtn" class="control-btn" disabled>
                <span>Ⅱ</span> PAUSE
            </button>

            <button id="restartBtn" class="control-btn">
                <span>↻</span> RESTART
            </button>

            <button id="jumpBtn" class="jump-btn">
                JUMP ↑
            </button>

        </div>

        <footer class="game-footer">
            <p>SPACE / ↑ TO JUMP</p>
            <p>AVOID OBSTACLES • BEAT YOUR BEST SCORE</p>
        </footer>

    </main>

    <script src="game.js"></script>

</body>
</html>

