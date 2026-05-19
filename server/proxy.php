<?php
// PHP Proxy for Node.js (Posutto)
ini_set('post_max_size', '12M');
ini_set('upload_max_filesize', '12M');
ini_set('max_execution_time', '60');

$node_port = 3001;
$target_url = "http://localhost:{$node_port}" . $_SERVER['REQUEST_URI'];

// Strip /posutto if it exists in the URL to match Node's internal routes
$target_url = str_replace('/posutto/api', '/api', $target_url);

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $target_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);
curl_setopt($ch, CURLOPT_TIMEOUT, 30); // 30 second timeout

// Pass along headers (skip hop-by-hop and encoding headers that can corrupt proxied data)
$headers = [];
$hasAuth = false;
$skipHeaders = ['host', 'content-encoding', 'transfer-encoding', 'content-length', 'connection'];
foreach (getallheaders() as $key => $value) {
    if (!in_array(strtolower($key), $skipHeaders)) {
        $headers[] = "$key: $value";
        if (strtolower($key) === 'authorization') {
            $hasAuth = true;
        }
    }
}

// Fallback: get Authorization from environment (CGI/FastCGI mode)
if (!$hasAuth) {
    $auth = $_SERVER['HTTP_AUTHORIZATION']
        ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
        ?? null;
    if ($auth) {
        $headers[] = "Authorization: $auth";
    }
}

curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

// Pass along POST body
$input = file_get_contents('php://input');
if ($input) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
}

$response = curl_exec($ch);
$error = curl_error($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$content_type = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);

curl_close($ch);

if ($response === false) {
    header('Content-Type: application/json', true, 502);
    // Log detailed error server-side only, never expose internal URLs/ports to client
    error_log("[Posutto Proxy] Backend connection failed: $error | Target: $target_url");
    echo json_encode([
        'error' => 'サーバーに接続できませんでした。しばらくしてから再度お試しください。'
    ]);
    exit;
}

// Security headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Permissions-Policy: camera=(), microphone=(), geolocation=()');

header("Content-Type: $content_type", true, $http_code);
echo $response;
?>