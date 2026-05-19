<?php
header('Content-Type: text/plain');
putenv("OPENSSL_CONF=/dev/null");

$node_bin_dir = __DIR__ . "/bin/bin";
$node_executable = $node_bin_dir . "/node";
$local_node = __DIR__ . "/node";
if (!file_exists($local_node)) {
    if (file_exists($local_node))
        unlink($local_node);
    symlink($node_executable, $local_node);
}

$current_dir = __DIR__;
$path = $current_dir . ":" . $node_bin_dir . ":" . getenv("PATH");
putenv("PATH=$path");

$bin = __DIR__ . '/node_modules/better-sqlite3/node_modules/.bin/prebuild-install';
if (!file_exists($bin))
    $bin = __DIR__ . '/node_modules/.bin/prebuild-install';

if (file_exists($bin)) {
    echo "Running prebuild-install from $bin...\n";
    chdir(__DIR__ . '/node_modules/better-sqlite3');
    // Need to use absolute path to bin because we chdir
    echo shell_exec(escapeshellarg($bin) . " --verbose 2>&1");
} else {
    echo "prebuild-install not found in expected paths.\n";
    echo shell_exec("find node_modules -name prebuild-install -type f");
}
?>