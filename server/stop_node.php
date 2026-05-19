<?php
/**
 * Node.js Process Stopper for Xserver Shared Hosting
 * Usage: Access https://sns-tool.online/posutto/server/stop_node.php?key=YOUR_ADMIN_KEY
 */
require_once __DIR__ . '/admin_auth.php';
header('Content-Type: application/json');

$dir = __DIR__;
$pidFile = "$dir/node.pid";

if (!file_exists($pidFile)) {
    echo json_encode([
        'status' => 'not_running',
        'message' => 'No PID file found. Node.js does not appear to be running.'
    ]);
    exit;
}

$pid = trim(file_get_contents($pidFile));

if (!$pid || !is_numeric($pid)) {
    unlink($pidFile);
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid PID file. Cleaned up.'
    ]);
    exit;
}

// Try graceful kill first (SIGTERM), then force (SIGKILL) if needed
$killed = false;
if (file_exists("/proc/$pid")) {
    shell_exec("kill $pid 2>&1");
    sleep(2);

    if (file_exists("/proc/$pid")) {
        // Force kill
        shell_exec("kill -9 $pid 2>&1");
        sleep(1);
    }

    $killed = !file_exists("/proc/$pid");
}

unlink($pidFile);

echo json_encode([
    'status' => $killed ? 'stopped' : 'cleaned',
    'pid' => (int)$pid,
    'message' => $killed
        ? "Node.js process (PID: $pid) has been stopped."
        : "PID file removed. Process was not running."
]);
?>
