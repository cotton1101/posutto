<?php
echo "Version: " . phpversion() . "\n";
echo "Binary: " . PHP_BINARY . "\n";
echo "Bindir: " . PHP_BINDIR . "\n";
$candidates = [
    '/usr/bin/php',
    '/usr/local/bin/php',
    '/usr/local/php/7.4/bin/php',
    '/usr/local/php/8.0/bin/php',
    '/usr/local/php/8.1/bin/php',
    '/usr/local/php/8.2/bin/php',
    '/usr/local/php/8.3/bin/php'
];
foreach ($candidates as $c) {
    if (file_exists($c))
        echo "Found: $c\n";
}
?>