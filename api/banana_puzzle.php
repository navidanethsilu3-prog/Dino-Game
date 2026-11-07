
<?php

require_once __DIR__ . '/../config/db.php';

header('Content-Type: application/json');

// Only logged-in users can access the puzzle
if (!isset($_SESSION['user_id'])) {

    http_response_code(401);

    echo json_encode([
        'success' => false,
        'message' => 'Please login first.'
    ]);

    exit;
}


if ($_SERVER['REQUEST_METHOD'] === 'GET') {

    $apiUrl = 'https://marcconrad.com/uob/banana/api.php?out=json';

    try {

        // Fetch puzzle from Banana API using cURL
        $ch = curl_init($apiUrl);

        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 3,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_TIMEOUT => 20,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
            CURLOPT_HTTPHEADER => [
                'Accept: application/json'
            ]
        ]);

        $response = curl_exec($ch);

        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);

        curl_close($ch);

        if ($response === false || $httpCode !== 200) {
            throw new Exception('Unable to contact Banana API. ' . $curlError);
        }

        $puzzle = json_decode($response, true);

        if (
            !is_array($puzzle) ||
            !isset($puzzle['question']) ||
            !array_key_exists('solution', $puzzle) ||
            !is_numeric($puzzle['solution'])
        ) {
            throw new Exception('Invalid puzzle response.');
        }

        // Validate puzzle image URL
        $imageUrl = $puzzle['question'];
        $imageParts = parse_url($imageUrl);

        if (
            !is_array($imageParts) ||
            ($imageParts['scheme'] ?? '') !== 'https' ||
            !in_array(
                strtolower($imageParts['host'] ?? ''),
                ['sanfoh.com', 'www.sanfoh.com'],
                true
            )
        ) {
            throw new Exception('Invalid puzzle image URL.');
        }

        // Store answer securely in PHP session
        $_SESSION['banana_answer'] = (string) $puzzle['solution'];

        // Unique puzzle ID
        $_SESSION['banana_puzzle_id'] = bin2hex(random_bytes(16));

        // Return image WITHOUT the correct answer
        echo json_encode([
            'success' => true,
            'question' => $imageUrl,
            'puzzle_id' => $_SESSION['banana_puzzle_id']
        ]);

        exit;

    } catch (Throwable $e) {

        error_log('Banana API Error: ' . $e->getMessage());

        http_response_code(503);

        echo json_encode([
            'success' => false,
            'message' => 'Unable to load the maths puzzle. Please try again later.'
        ]);

        exit;
    }
}

// ==========================================
// POST: VERIFY PLAYER ANSWER
// ==========================================

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

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

    // Read submitted answer
    $data = json_decode(file_get_contents('php://input'), true);

    if (
        !is_array($data) ||
        !isset($data['answer']) ||
        !isset($data['puzzle_id']) ||
        !is_string($data['answer']) ||
        !preg_match('/^\d{1,6}$/', $data['answer']) ||
        !is_string($data['puzzle_id'])
    ) {

        http_response_code(422);

        echo json_encode([
            'success' => false,
            'message' => 'Invalid answer.'
        ]);

        exit;
    }

    // Check whether a puzzle exists
    if (
        !isset($_SESSION['banana_answer']) ||
        !isset($_SESSION['banana_puzzle_id']) ||
        !hash_equals(
            $_SESSION['banana_puzzle_id'],
            $data['puzzle_id']
        )
    ) {

        http_response_code(400);

        echo json_encode([
            'success' => false,
            'message' => 'Puzzle expired. Please reload the game.'
        ]);

        exit;
    }

    // Compare answers
    $correct = hash_equals(
        (string) $_SESSION['banana_answer'],
        $data['answer']
    );

    // Prevent submitting the same puzzle again
    unset($_SESSION['banana_answer']);
    unset($_SESSION['banana_puzzle_id']);

    echo json_encode([
        'success' => true,
        'correct' => $correct,
        'message' => $correct
            ? 'Correct answer! You earned another chance!'
            : 'Incorrect answer! Game over.'
    ]);

    exit;
}

// Other HTTP methods
http_response_code(405);

echo json_encode([
    'success' => false,
    'message' => 'Method not allowed.'
]);

?>
