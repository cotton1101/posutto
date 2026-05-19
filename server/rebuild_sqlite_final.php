<?php
header('Content-Type: text/plain');
putenv("OPENSSL_CONF=/dev/null");

// Setup Node env
$node_bin_dir = __DIR__ . "/bin/bin";
$node_executable = $node_bin_dir . "/node";
$local_node = __DIR__ . "/node";
if (!file_exists($local_node)) {
    if (file_exists($local_node))
        unlink($local_node); // remove broken link
    symlink($node_executable, $local_node);
}

$current_dir = __DIR__;
$path = $current_dir . ":" . $node_bin_dir . ":" . getenv("PATH");
putenv("PATH=$path");

echo "Environment setup complete.\n";
echo "PATH: $path\n";

// Path to node-gyp in npm
$node_gyp = __DIR__ . '/bin/lib/node_modules/npm/node_modules/node-gyp/bin/node-gyp.js';
$target_dir = __DIR__ . '/node_modules/better-sqlite3';

if (!file_exists($target_dir)) {
    echo "better-sqlite3 dir not found at $target_dir. Extracting node_modules.tar.gz...\n";
    if (file_exists("../node_modules.tar.gz")) {
        // use system tar, assume path is fixed by now
        echo shell_exec("tar -xzf ../node_modules.tar.gz 2>&1");
    } else {
        die("node_modules.tar.gz not found.\n");
    }
}

if (file_exists($target_dir)) {
    chdir($target_dir);
    // Export PATH in command shell too
    // Remove build dir to force rebuild
    echo shell_exec("rm -rf build");

    $cmd = "export OPENSSL_CONF=/dev/null && export PATH=" . escapeshellarg($path) . " && " . escapeshellarg($local_node) . " " . escapeshellarg($node_gyp) . " rebuild";
    echo "Executing: $cmd\n";
    echo shell_exec($cmd . " 2>&1");
} else {
    die("Target dir still missing.\n");
}
?>