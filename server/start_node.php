<?php
/**
 * Node.js Background Process Starter for Xserver Shared Hosting
 * Usage: Access https://sns-tool.online/posutto/server/start_node.php?key=YOUR_ADMIN_KEY
 *
 * This script starts the Node.js backend as a background process (nohup).
 * The process will persist even after the PHP request completes.
 */
require_once __DIR__ . '/admin_auth.php';
header('Content-Type: application/json');

$dir = __DIR__;
$node = "$dir/bin/bin/node";
$app = "$dir/dist/index.js";
$pidFile = "$dir/node.pid";
$logFile = "$dir/node.log";

// Check if already running
if (file_exists($pidFile)) {
    $pid = trim(file_get_contents($pidFile));
    // Check if process is actually alive
    if ($pid && file_exists("/proc/$pid")) {
        echo json_encode([
            'status' => 'already_running',
            'pid' => (int)$pid,
            'message' => 'Node.js is already running.'
        ]);
        exit;
    }
    // PID file exists but process is dead, clean up
    unlink($pidFile);
}

// Verify Node.js binary exists
if (!file_exists($node)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Node.js binary not found. Run install_node.php first.',
        'expected_path' => $node
    ]);
    exit;
}

// Verify app file exists
if (!file_exists($app)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Application file not found at ' . $app,
        'hint' => 'Make sure server/dist/index.js has been uploaded.'
    ]);
    exit;
}

// Set environment variables
$env_vars = "OPENSSL_CONF=/dev/null PORT=3001 NODE_ENV=production";

// Load .env file if exists
$envFile = "$dir/.env";
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') continue;
        if (strpos($line, '=') !== false) {
            $env_vars .= " " . escapeshellarg($line);
        }
    }
}

// Start Node.js in background with nohup
$cmd = sprintf(
    'cd %s && export PATH=%s/bin/bin:$PATH && export %s && nohup %s %s > %s 2>&1 & echo $!',
    escapeshellarg($dir),
    escapeshellarg($dir),
    $env_vars,
    escapeshellarg($node),
    escapeshellarg($app),
    escapeshellarg($logFile)
);

$pid = trim(shell_exec($cmd));

if ($pid && is_numeric($pid)) {
    file_put_contents($pidFile, $pid);

    // Wait a moment then verify it's running
    sleep(2);

    $isRunning = file_exists("/proc/$pid");

    // Also try to check the HTTP endpoint
    $ch = curl_init("http://localhost:3001/api/auth/captcha");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 3);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    echo json_encode([
        'status' => $isRunning ? 'started' : 'failed',
        'pid' => (int)$pid,
        'process_alive' => $isRunning,
        'http_check' => $httpCode > 0 ? "HTTP $httpCode" : 'not_yet_responding',
        'log_file' => $logFile,
        'message' => $isRunning
            ? 'Node.js started successfully. It may take a few seconds to fully initialize.'
            : 'Process may have crashed. Check log file for details.'
    ]);
} else {
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to start Node.js process.',
        'output' => $pid
    ]);
}
?>
