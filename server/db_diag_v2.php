<?php
header('Content-Type: text/plain');
ini_set('display_errors', 1);
error_reporting(E_ALL);
try {
    $db = new SQLite3('data/posutto.db');
    echo "DB Connected.\n";
    $results = $db->query("SELECT name FROM sqlite_master WHERE type='table'");
    while ($row = $results->fetchArray()) {
        echo "Table: " . $row['name'] . "\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>