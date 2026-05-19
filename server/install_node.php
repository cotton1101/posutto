<?php
require_once __DIR__ . '/admin_auth.php';
header('Content-Type: text/plain');

$node_version = "v16.14.0"; // Older version to try fixing npm
$node_url = "https://nodejs.org/dist/{$node_version}/node-{$node_version}-linux-x64.tar.xz";
$target_dir = __DIR__ . "/bin";
$tar_file = __DIR__ . "/node.tar.xz";

if (!file_exists($target_dir)) {
    mkdir($target_dir, 0755, true);
}

echo "Downloading Node.js {$node_version}...\n";
$content = file_get_contents($node_url);
if ($content === false) {
    die("Failed to download Node.js\n");
}
file_put_contents($tar_file, $content);
echo "Download complete.\n";

echo "Extracting Node.js...\n";
// Xserver has tar xf available
$cmd = "tar -xJf " . escapeshellarg($tar_file) . " -C " . escapeshellarg($target_dir) . " --strip-components=1 2>&1";
$output = shell_exec($cmd);
echo $output . "\n";

unlink($tar_file);

echo "Checking Node.js version:\n";
$node_path = $target_dir . "/bin/node";
echo shell_exec($node_path . " -v") . "\n";

echo "Installation finished.\n";
?>