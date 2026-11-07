
<?php

require_once __DIR__ . '/../config/db.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {

    http_response_code(401);

    echo json_encode([
        'success' => false,
        'message' => 'Please login first.'
    ]);

    exit;
}

$userId = $_SESSION['user_id'];

$stmt = $pdo->prepare("
    SELECT
        COALESCE(MAX(score), 0) AS best_score,
        COUNT(*) AS games_played
    FROM game_scores
    WHERE user_id = ?
");

$stmt->execute([$userId]);

$stats = $stmt->fetch();

echo json_encode([
    'success' => true,
    'best_score' => (int) $stats['best_score'],
    'games_played' => (int) $stats['games_played']
]);

?>
