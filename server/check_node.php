<?php
require_once __DIR__ . '/admin_auth.php';
header('Content-Type: application/json');

$port = 3001;
$host = 'localhost';
$url = "http://$host:$port/api/auth/captcha";

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);

$response = curl_exec($ch);
$error = curl_error($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

curl_close($ch);

echo json_encode([
    'status' => $response !== false ? 'alive' : 'dead',
    'http_code' => $httpCode,
    'error' => $error,
    'endpoint_checked' => $url,
    'server_time' => date('Y-m-d H:i:s')
]);
?>