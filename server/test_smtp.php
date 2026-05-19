<?php
// SMTP Test Script - テスト後に削除すること
header('Content-Type: application/json');

$key = isset($_GET['key']) ? $_GET['key'] : '';
if ($key !== 'pos_admin_2024_xserver_secure') {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}

$host = 'sv16817.xserver.jp';
$port = 587;
$user = 'info@sns-tool.online';
$pass = 'Maiko-0310hideki';
$from = 'info@sns-tool.online';
$to   = 'info@sns-tool.online';

$subject = '=?UTF-8?B?' . base64_encode('【Posutto】SMTP テスト') . '?=';
$message = '<html><body><h2>SMTP Test</h2><p>This is a test email sent at ' . date('Y-m-d H:i:s') . '</p></body></html>';

$headers = "From: Posutto <$from>\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/html; charset=UTF-8\r\n";

// Try PHP mail() first
$result_mail = @mail($to, $subject, $message, $headers);

// Try direct SMTP socket connection
$smtp_log = [];
$smtp_success = false;

$socket = @fsockopen($host, $port, $errno, $errstr, 10);
if ($socket) {
    $smtp_log[] = 'Connected to ' . $host . ':' . $port;
    $response = fgets($socket, 512);
    $smtp_log[] = 'Server: ' . trim($response);

    // EHLO
    fputs($socket, "EHLO posutto.local\r\n");
    $response = '';
    while ($line = fgets($socket, 512)) {
        $response .= $line;
        if (substr($line, 3, 1) == ' ') break;
    }
    $smtp_log[] = 'EHLO: ' . trim($response);

    // STARTTLS
    fputs($socket, "STARTTLS\r\n");
    $response = fgets($socket, 512);
    $smtp_log[] = 'STARTTLS: ' . trim($response);

    if (strpos($response, '220') === 0) {
        // Enable TLS
        $crypto = stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
        if ($crypto) {
            $smtp_log[] = 'TLS enabled';

            // EHLO again after TLS
            fputs($socket, "EHLO posutto.local\r\n");
            $response = '';
            while ($line = fgets($socket, 512)) {
                $response .= $line;
                if (substr($line, 3, 1) == ' ') break;
            }
            $smtp_log[] = 'EHLO2: OK';

            // AUTH LOGIN
            fputs($socket, "AUTH LOGIN\r\n");
            $response = fgets($socket, 512);
            $smtp_log[] = 'AUTH LOGIN: ' . trim($response);

            // Username
            fputs($socket, base64_encode($user) . "\r\n");
            $response = fgets($socket, 512);
            $smtp_log[] = 'Username: ' . trim($response);

            // Password
            fputs($socket, base64_encode($pass) . "\r\n");
            $response = fgets($socket, 512);
            $smtp_log[] = 'Password: ' . trim($response);

            if (strpos($response, '235') === 0) {
                $smtp_success = true;
                $smtp_log[] = 'AUTH SUCCESS!';

                // MAIL FROM
                fputs($socket, "MAIL FROM:<$from>\r\n");
                $response = fgets($socket, 512);
                $smtp_log[] = 'MAIL FROM: ' . trim($response);

                // RCPT TO
                fputs($socket, "RCPT TO:<$to>\r\n");
                $response = fgets($socket, 512);
                $smtp_log[] = 'RCPT TO: ' . trim($response);

                // DATA
                fputs($socket, "DATA\r\n");
                $response = fgets($socket, 512);
                $smtp_log[] = 'DATA: ' . trim($response);

                // Send email content
                $email_content = "From: Posutto <$from>\r\n";
                $email_content .= "To: $to\r\n";
                $email_content .= "Subject: $subject\r\n";
                $email_content .= "MIME-Version: 1.0\r\n";
                $email_content .= "Content-Type: text/html; charset=UTF-8\r\n";
                $email_content .= "\r\n";
                $email_content .= $message;
                $email_content .= "\r\n.\r\n";

                fputs($socket, $email_content);
                $response = fgets($socket, 512);
                $smtp_log[] = 'Send: ' . trim($response);
            } else {
                $smtp_log[] = 'AUTH FAILED!';
            }

            fputs($socket, "QUIT\r\n");
        } else {
            $smtp_log[] = 'TLS failed';
        }
    }
    fclose($socket);
} else {
    $smtp_log[] = "Connection failed: $errstr ($errno)";
}

echo json_encode([
    'php_mail_result' => $result_mail,
    'smtp_direct_test' => $smtp_success,
    'smtp_log' => $smtp_log,
    'test_time' => date('Y-m-d H:i:s'),
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
