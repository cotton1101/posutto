<?php
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

$node_gyp = __DIR__ . '/bin/lib/node_modules/npm/node_modules/node-gyp/bin/node-gyp.js';
$target_dir = __DIR__ . '/node_modules/better-sqlite3';

chdir($target_dir);
$cmd = "export OPENSSL_CONF=/dev/null && export PATH=" . escapeshellarg($path) . " && node -v && " . escapeshellarg($local_node) . " " . escapeshellarg($node_gyp) . " rebuild";
echo "Executing: $cmd\n";
echo shell_exec($cmd . " 2>&1");
?>