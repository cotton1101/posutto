<?php
/**
 * Simple access control for PHP management scripts.
 * Require ?key=<ADMIN_KEY> in the URL to access.
 * The key is loaded from .env file (ADMIN_KEY).
 *
 * Include this file at the top of any management PHP script:
 *   require_once __DIR__ . '/admin_auth.php';
 */

// Load admin key from .env
$envFile = __DIR__ . '/.env';
$adminKey = null;

if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') continue;
        if (strpos($line, 'ADMIN_KEY=') === 0) {
            $adminKey = substr($line, strlen('ADMIN_KEY='));
            break;
        }
    }
}

// If no ADMIN_KEY is configured, deny all access
if (!$adminKey) {
    header('Content-Type: application/json', true, 403);
    echo json_encode(['error' => 'ADMIN_KEY is not configured in .env']);
    exit;
}

// Check the provided key
$providedKey = isset($_GET['key']) ? $_GET['key'] : '';

if ($providedKey !== $adminKey) {
    header('Content-Type: application/json', true, 403);
    echo json_encode(['error' => 'Access denied. Invalid or missing admin key.']);
    exit;
}

// Authentication passed
?>
