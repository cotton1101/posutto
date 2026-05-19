<?php
header('Content-Type: text/plain');
try {
    $db = new PDO('sqlite:data/posutto.db');
    $tables = $db->query("SELECT name FROM sqlite_master WHERE type='table'")->fetchAll(PDO::FETCH_COLUMN);
    echo "Tables:\n";
    foreach ($tables as $table) {
        echo "- $table\n";
        $info = $db->query("PRAGMA table_info($table)")->fetchAll(PDO::FETCH_ASSOC);
        foreach ($info as $col) {
            echo "  " . $col['name'] . " (" . $col['type'] . ")\n";
        }
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>