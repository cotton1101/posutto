<?php
require_once __DIR__ . '/admin_auth.php';
header('Content-Type: text/plain');
putenv("OPENSSL_CONF=/dev/null");

$node_bin_dir = __DIR__ . "/bin/bin";
$node_executable = $node_bin_dir . "/node";
$local_node = __DIR__ . "/node";
if (!file_exists($local_node))
    symlink($node_executable, $local_node);

$current_dir = __DIR__;
$path = $current_dir . ":" . $node_bin_dir . ":" . getenv("PATH");
putenv("PATH=$path");

$npm = __DIR__ . "/bin/bin/npm";

// Remove old better-sqlite3
echo "Removing better-sqlite3...\n";
echo shell_exec("rm -rf node_modules/better-sqlite3 node_modules/.package-lock.json 2>&1");

// Install sql.js (pure JS/WASM, no native modules needed)
echo "Installing sql.js...\n";
chdir(__DIR__);
$cmd = "export OPENSSL_CONF=/dev/null && export PATH=" . escapeshellarg($path) . " && " . escapeshellarg($local_node) . " " . escapeshellarg($npm) . " install sql.js@1.11.0 --save";
echo "Executing: $cmd\n";
echo shell_exec($cmd . " 2>&1");

echo "\nDone. Checking sql.js installation...\n";
if (file_exists(__DIR__ . "/node_modules/sql.js/dist/sql-wasm.js")) {
    echo "SUCCESS: sql.js is installed!\n";
} else {
    echo "ERROR: sql.js not found!\n";
}
?>