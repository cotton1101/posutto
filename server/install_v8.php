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

$npm = __DIR__ . "/bin/bin/npm";

echo "Installing better-sqlite3@8.7.0...\n";
chdir(__DIR__);
$cmd = "export OPENSSL_CONF=/dev/null && export PATH=" . escapeshellarg($path) . " && " . escapeshellarg($local_node) . " " . escapeshellarg($npm) . " install better-sqlite3@8.7.0 --ignore-scripts --save";
echo "Executing: $cmd\n";
echo shell_exec($cmd . " 2>&1");
?>