<?php
header('Content-Type: text/plain');
putenv("OPENSSL_CONF=/dev/null");

$node_bin_dir = __DIR__ . "/bin/bin";
$node_executable = $node_bin_dir . "/node";
$local_node = __DIR__ . "/node";
if (!file_exists($local_node))
    symlink($node_executable, $local_node);

// Add current dir and node bin to PATH
$current_dir = __DIR__;
$path = $current_dir . ":" . $node_bin_dir . ":" . getenv("PATH");
putenv("PATH=$path");

// Always extract to be sure
echo "Cleaning old yarn...\n";
shell_exec("rm -rf yarn yarn-v*");
echo "Extracting yarn...\n";
echo shell_exec("tar -xzf yarn.tar.gz");
echo shell_exec("mv yarn-v* yarn");
// Verify
if (!file_exists(__DIR__ . '/yarn/bin/yarn.js')) {
    echo "Yarn binary not found after extraction!\n";
    echo shell_exec("ls -R");
    exit(1);
}

$yarn_bin = __DIR__ . '/yarn/bin/yarn.js';

$target_dir = __DIR__;

chdir($target_dir);
$cmd = "export OPENSSL_CONF=/dev/null && export PATH=" . escapeshellarg($path) . " && " . escapeshellarg($local_node) . " " . escapeshellarg($yarn_bin) . " install --ignore-engines --production";
echo "Executing: $cmd\n";
echo "PATH is: $path\n";
echo shell_exec($cmd . " 2>&1");
?>