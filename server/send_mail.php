<?php
// PHP Mail Proxy - Node.js から呼ばれるメール送信プロキシ
header('Content-Type: application/json');

// Only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Read JSON body
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

// Verify internal key
$key = isset($input['key']) ? $input['key'] : '';
if ($key !== 'pos_admin_2024_xserver_secure') {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}

$to      = isset($input['to']) ? $input['to'] : '';
$subject = isset($input['subject']) ? $input['subject'] : '';
$html    = isset($input['html']) ? $input['html'] : '';
$from    = isset($input['from']) ? $input['from'] : 'info@sns-tool.online';

if (!$to || !$subject || !$html) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields: to, subject, html']);
    exit;
}

// Encode subject for UTF-8
$encoded_subject = '=?UTF-8?B?' . base64_encode($subject) . '?=';

// Build headers
$headers = "From: Posutto <$from>\r\n";
$headers .= "Reply-To: $from\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/html; charset=UTF-8\r\n";
$headers .= "Content-Transfer-Encoding: base64\r\n";
$headers .= "X-Mailer: Posutto/1.0\r\n";

// Encode body in base64 for proper UTF-8 handling
$encoded_body = base64_encode($html);

// Send
$result = mail($to, $encoded_subject, $encoded_body, $headers);

if ($result) {
    echo json_encode(['success' => true, 'message' => "Mail sent to $to"]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'mail() function returned false']);
}
