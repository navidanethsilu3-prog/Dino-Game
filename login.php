
<?php

require_once __DIR__ . '/config/db.php';

if (isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit;
}

$error = "";

if ($_SERVER["REQUEST_METHOD"] === "POST") {

    if (!verifyCsrfToken($_POST['csrf_token'] ?? null)) {

        $error = "Invalid request. Please try again.";

    } else {

        $email = strtolower(trim($_POST['email'] ?? ""));
        $pass = $_POST['password'] ?? "";

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {

            $error = "Invalid email or password.";

        } else {

            $stmt = $pdo->prepare(
                "SELECT id, name, email, password
                 FROM users
                 WHERE email = ?"
            );

            $stmt->execute([$email]);

            $user = $stmt->fetch();

            if ($user && password_verify($pass, $user['password'])) {

                session_regenerate_id(true);

                $_SESSION['user_id'] = $user['id'];
                $_SESSION['user_name'] = $user['name'];
                $_SESSION['user_email'] = $user['email'];

                $_SESSION['csrf_token'] = bin2hex(random_bytes(32));

                header("Location: index.php");
                exit;

            } else {

                $error = "Invalid email or password.";
            }
        }
    }
}

?>

<!DOCTYPE html>
<html lang="en">

<head>

    <meta charset="UTF-8">

    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Login - Dino Dash</title>

    <link rel="stylesheet" href="auth.css">

</head>

<body>

<div class="auth-container">

    <div class="auth-logo">🦖</div>

    <h1>WELCOME BACK!</h1>

    <p class="subtitle">
        Login to continue your Dino Dash adventure.
    </p>

    <?php if (isset($_GET['registered'])): ?>

        <div class="success-message">
            Registration successful! You can now login.
        </div>

    <?php endif; ?>

    <?php if ($error): ?>

        <div class="error-message">
            <?= e($error) ?>
        </div>

    <?php endif; ?>

    <form method="POST">

        <input
            type="hidden"
            name="csrf_token"
            value="<?= e($_SESSION['csrf_token']) ?>"
        >

        <label>Email Address</label>

        <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value="<?= e($_POST['email'] ?? '') ?>"
            required
        >

        <label>Password</label>

        <input
            type="password"
            name="password"
            placeholder="Enter your password"
            required
        >

        <button type="submit">
            LOGIN TO GAME
        </button>

    </form>

    <p class="auth-link">
        Don't have an account?
        <a href="register.php">Register here</a>
    </p>

</div>

</body>
</html>
