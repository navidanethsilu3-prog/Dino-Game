
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

        $name = trim($_POST['name'] ?? "");
        $email = strtolower(trim($_POST['email'] ?? ""));
        $pass = $_POST['password'] ?? "";
        $confirm = $_POST['confirm_password'] ?? "";

        if ($name === "" || strlen($name) > 100) {
            $error = "Please enter a valid name.";
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 150) {
            $error = "Please enter a valid email address.";
        } elseif (strlen($pass) < 8) {
            $error = "Password must contain at least 8 characters.";
        } elseif ($pass !== $confirm) {
            $error = "Passwords do not match.";
        } else {

            try {

                $check = $pdo->prepare(
                    "SELECT id FROM users WHERE email = ?"
                );

                $check->execute([$email]);

                if ($check->fetch()) {

                    $error = "This email is already registered.";

                } else {

                    $hashedPassword = password_hash(
                        $pass,
                        PASSWORD_DEFAULT
                    );

                    $stmt = $pdo->prepare(
                        "INSERT INTO users (name, email, password)
                         VALUES (?, ?, ?)"
                    );

                    $stmt->execute([
                        $name,
                        $email,
                        $hashedPassword
                    ]);

                    header("Location: login.php?registered=1");
                    exit;
                }

            } catch (PDOException $e) {

                error_log($e->getMessage());
                $error = "Registration failed. Please try again.";
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

    <title>Register - Dino Dash</title>

    <link rel="stylesheet" href="auth.css">
</head>

<body>

<div class="auth-container">

    <div class="auth-logo">🦖</div>

    <h1>JOIN DINO DASH</h1>

    <p class="subtitle">
        Create your account and start your adventure!
    </p>

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

        <label>Full Name</label>

        <input
            type="text"
            name="name"
            placeholder="Enter your full name"
            maxlength="100"
            value="<?= e($_POST['name'] ?? '') ?>"
            required
        >

        <label>Email Address</label>

        <input
            type="email"
            name="email"
            placeholder="Enter your email"
            maxlength="150"
            value="<?= e($_POST['email'] ?? '') ?>"
            required
        >

        <label>Password</label>

        <input
            type="password"
            name="password"
            placeholder="Minimum 8 characters"
            minlength="8"
            required
        >

        <label>Confirm Password</label>

        <input
            type="password"
            name="confirm_password"
            placeholder="Confirm your password"
            minlength="8"
            required
        >

        <button type="submit">
            CREATE ACCOUNT
        </button>

    </form>

    <p class="auth-link">
        Already have an account?
        <a href="login.php">Login here</a>
    </p>

</div>

</body>
</html>
