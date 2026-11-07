
<?php

require_once __DIR__ . '/../config/db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {

    http_response_code(405);

    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed.'
    ]);

    exit;
}

// Check authentication
if (!isset($_SESSION['user_id'])) {

    http_response_code(401);

    echo json_encode([
        'success' => false,
        'message' => 'Please login first.'
    ]);

    exit;
}

// Verify CSRF token
$csrfToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';

if (!verifyCsrfToken($csrfToken)) {

    http_response_code(403);

    echo json_encode([
        'success' => false,
        'message' => 'Invalid security token.'
    ]);

    exit;
}

// Read submitted JSON
$data = json_decode(file_get_contents('php://input'), true);

if (!is_array($data) ||
    !isset($data['score']) ||
    !is_int($data['score']) ||
    $data['score'] < 0 ||
    $data['score'] > 10000000) {

    http_response_code(422);

    echo json_encode([
        'success' => false,
        'message' => 'Invalid score.'
    ]);

    exit;
}

$userId = $_SESSION['user_id'];
$score = $data['score'];

try {

    // Save game score
    $stmt = $pdo->prepare("
        INSERT INTO game_scores (user_id, score)
        VALUES (?, ?)
    ");

    $stmt->execute([$userId, $score]);

    // Retrieve personal best
    $statsStmt = $pdo->prepare("
        SELECT
            MAX(score) AS best_score,
            COUNT(*) AS games_played
        FROM game_scores
        WHERE user_id = ?
    ");

    $statsStmt->execute([$userId]);

    $stats = $statsStmt->fetch();

    echo json_encode([
        'success' => true,
        'saved_score' => $score,
        'best_score' => (int) $stats['best_score'],
        'games_played' => (int) $stats['games_played'],
        'message' => 'Score saved successfully!'
    ]);

} catch (PDOException $e) {

    error_log($e->getMessage());

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Unable to save score.'
    ]);
}

?>
