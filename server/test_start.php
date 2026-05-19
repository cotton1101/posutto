<?php
require_once __DIR__ . '/admin_auth.php';
header('Content-Type: text/plain');
$dir = __DIR__;
chdir($dir);

$node = "$dir/bin/bin/node";
$app = "$dir/dist/index.js";

putenv("OPENSSL_CONF=/dev/null");
putenv("PATH=$dir/bin/bin:" . getenv("PATH"));
putenv("PORT=3001");

// Try to start and capture immediate errors
$descriptors = [
    0 => ['pipe', 'r'],
    1 => ['pipe', 'w'],
    2 => ['pipe', 'w'],
];

$env = [
    'PATH' => "$dir/bin/bin:" . getenv("PATH"),
    'PORT' => '3001',
    'OPENSSL_CONF' => '/dev/null',
    'HOME' => getenv('HOME'),
];

$proc = proc_open("$node $app", $descriptors, $pipes, $dir, $env);
if (!$proc) {
    echo "Failed to start process\n";
    exit(1);
}

// Wait a moment for startup
sleep(5);

// Read stdout and stderr
$stdout = stream_get_contents($pipes[1]);
$stderr = stream_get_contents($pipes[2]);

echo "=== STDOUT ===\n$stdout\n";
echo "=== STDERR ===\n$stderr\n";

$status = proc_get_status($proc);
echo "=== Process Status ===\n";
echo "Running: " . ($status['running'] ? 'yes' : 'no') . "\n";
echo "Exit code: " . $status['exitcode'] . "\n";

// Clean up
proc_terminate($proc);
?>