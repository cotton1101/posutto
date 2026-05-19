<?php
/**
 * Safe Server Status Command Runner
 * Only allows pre-defined safe commands for server management.
 * Arbitrary command execution is NOT allowed.
 */
require_once __DIR__ . '/admin_auth.php';
header('Content-Type: application/json');

$dir = __DIR__;
$node_bin_dir = "$dir/bin/bin";
putenv("OPENSSL_CONF=/dev/null");
putenv("PATH=" . $node_bin_dir . ":" . getenv("PATH"));

// Whitelist of allowed commands
$allowed_commands = [
    'status'      => 'Check if Node.js process is running',
    'node_ver'    => 'Show Node.js version',
    'disk'        => 'Show disk usage of server directory',
    'log'         => 'Show last 50 lines of Node.js log',
    'uptime'      => 'Show server uptime',
    'db_size'     => 'Show database file size',
    'npm_install' => 'Run npm install --production in server directory',
    'kill_node'   => 'Kill all Node.js processes for this user',
    'restart'     => 'Kill Node.js and start fresh',
    'start_node'  => 'Start Node.js (without killing first)',
    'bot_info'    => 'Show bot configurations and schedules',
];

$cmd_key = isset($_GET['cmd']) ? $_GET['cmd'] : 'help';

if ($cmd_key === 'help') {
    echo json_encode([
        'available_commands' => $allowed_commands,
        'usage' => 'Add ?cmd=<command_name> to the URL'
    ], JSON_PRETTY_PRINT);
    exit;
}

if (!array_key_exists($cmd_key, $allowed_commands)) {
    echo json_encode([
        'error' => 'Command not allowed',
        'allowed' => array_keys($allowed_commands)
    ]);
    exit;
}

$pidFile = "$dir/node.pid";
$logFile = "$dir/node.log";

// Helper function to kill all node processes
function killNodeProcesses($node_bin_dir, $pidFile) {
    $results = [];

    // Try PID file first
    if (file_exists($pidFile)) {
        $pid = trim(file_get_contents($pidFile));
        if ($pid && is_numeric($pid)) {
            shell_exec("kill $pid 2>&1");
            $results[] = "Killed PID $pid from pidfile";
        }
        unlink($pidFile);
    }

    // Also find and kill any orphaned node processes running our app
    $ps_output = shell_exec("ps aux 2>/dev/null | grep 'dist/index.js' | grep -v grep");
    if ($ps_output) {
        $lines = array_filter(explode("\n", trim($ps_output)));
        foreach ($lines as $line) {
            $parts = preg_split('/\s+/', trim($line));
            if (isset($parts[1]) && is_numeric($parts[1])) {
                shell_exec("kill " . $parts[1] . " 2>&1");
                $results[] = "Killed orphan PID " . $parts[1];
            }
        }
    }

    // Also kill by port 3001
    $lsof = shell_exec("lsof -ti:3001 2>/dev/null");
    if ($lsof) {
        $pids = array_filter(explode("\n", trim($lsof)));
        foreach ($pids as $p) {
            if (is_numeric(trim($p))) {
                shell_exec("kill " . trim($p) . " 2>&1");
                $results[] = "Killed port-3001 PID " . trim($p);
            }
        }
    }

    return $results;
}

switch ($cmd_key) {
    case 'status':
        $pid = file_exists($pidFile) ? trim(file_get_contents($pidFile)) : null;
        $running = $pid && file_exists("/proc/$pid");

        // Also check port 3001
        $portCheck = trim(shell_exec("lsof -ti:3001 2>/dev/null"));

        echo json_encode([
            'node_running' => $running || !empty($portCheck),
            'pid' => $pid ? (int)$pid : null,
            'port_3001_pids' => $portCheck ?: null,
            'server_time' => date('Y-m-d H:i:s')
        ]);
        break;

    case 'node_ver':
        $ver = trim(shell_exec("$node_bin_dir/node -v 2>&1"));
        echo json_encode(['node_version' => $ver]);
        break;

    case 'disk':
        $size = trim(shell_exec("du -sh " . escapeshellarg($dir) . " 2>&1"));
        echo json_encode(['disk_usage' => $size]);
        break;

    case 'log':
        if (file_exists($logFile)) {
            $lines = shell_exec("tail -50 " . escapeshellarg($logFile) . " 2>&1");
            echo json_encode(['log' => $lines]);
        } else {
            echo json_encode(['log' => 'No log file found.']);
        }
        break;

    case 'uptime':
        echo json_encode(['uptime' => trim(shell_exec("uptime 2>&1"))]);
        break;

    case 'db_size':
        $dbPath = "$dir/dist/data/posutto.db";
        if (!file_exists($dbPath)) $dbPath = "$dir/data/posutto.db";
        if (file_exists($dbPath)) {
            $size = filesize($dbPath);
            echo json_encode([
                'db_file' => $dbPath,
                'size_bytes' => $size,
                'size_human' => round($size / 1024, 1) . ' KB'
            ]);
        } else {
            echo json_encode(['message' => 'Database file not found. It will be created on first run.']);
        }
        break;

    case 'npm_install':
        if (!file_exists("$node_bin_dir/node")) {
            echo json_encode(['error' => 'Node.js not installed. Run install_node.php first.']);
            break;
        }
        $output = shell_exec("cd " . escapeshellarg($dir) . " && export PATH=" . escapeshellarg($node_bin_dir) . ":\$PATH && export OPENSSL_CONF=/dev/null && " . escapeshellarg($node_bin_dir . "/npm") . " install --production 2>&1");
        echo json_encode([
            'command' => 'npm install --production',
            'output' => $output,
            'status' => 'completed'
        ]);
        break;

    case 'kill_node':
        $results = killNodeProcesses($node_bin_dir, $pidFile);
        sleep(1);
        $portCheck = trim(shell_exec("lsof -ti:3001 2>/dev/null"));
        echo json_encode([
            'actions' => $results ?: ['No processes found to kill'],
            'port_3001_clear' => empty($portCheck),
            'status' => 'done'
        ]);
        break;

    case 'start_node':
        $node = "$node_bin_dir/node";
        $app = "$dir/dist/index.js";

        if (!file_exists($node) || !file_exists($app)) {
            echo json_encode([
                'error' => 'Node binary or app not found',
                'node_exists' => file_exists($node),
                'app_exists' => file_exists($app)
            ]);
            break;
        }

        // Build a shell script to start in background
        $startScript = "$dir/start_bg.sh";
        $envLines = "export OPENSSL_CONF=/dev/null\nexport PORT=3001\nexport NODE_ENV=production\n";
        $envFile = "$dir/.env";
        if (file_exists($envFile)) {
            $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                $line = trim($line);
                if ($line === '' || $line[0] === '#') continue;
                if (strpos($line, '=') !== false) {
                    $envLines .= "export " . $line . "\n";
                }
            }
        }

        $scriptContent = "#!/bin/bash\n";
        $scriptContent .= "cd " . escapeshellarg($dir) . "\n";
        $scriptContent .= "export PATH=" . escapeshellarg($node_bin_dir) . ":\$PATH\n";
        $scriptContent .= $envLines;
        $scriptContent .= escapeshellarg($node) . " " . escapeshellarg($app) . " > " . escapeshellarg($logFile) . " 2>&1 &\n";
        $scriptContent .= "echo \$! > " . escapeshellarg($pidFile) . "\n";

        file_put_contents($startScript, $scriptContent);
        chmod($startScript, 0700); // Owner only — restrict permissions

        // Execute completely detached
        exec("nohup bash " . escapeshellarg($startScript) . " > /dev/null 2>&1 &");

        // Brief wait then check
        usleep(500000); // 0.5 sec
        $pid = file_exists($pidFile) ? trim(file_get_contents($pidFile)) : null;

        // Security: remove start script (contains env secrets in plaintext)
        if (file_exists($startScript)) {
            unlink($startScript);
        }

        echo json_encode([
            'start_status' => 'launched',
            'pid' => $pid ? (int)$pid : null,
            'status' => 'ok',
            'note' => 'Check status after a few seconds'
        ]);
        break;

    case 'bot_info':
        $dbPath = "$dir/dist/data/posutto.db";
        if (!file_exists($dbPath)) {
            // Fallback to data/ dir
            $dbPath = "$dir/data/posutto.db";
        }
        if (!file_exists($dbPath)) {
            echo json_encode(['error' => 'Database not found']);
            break;
        }
        try {
            $pdo = new PDO("sqlite:$dbPath");
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $stmt = $pdo->query("SELECT b.id, b.name, b.status, b.schedule, b.settings, b.account_id, a.screen_name FROM bots b LEFT JOIN accounts a ON b.account_id = a.id LIMIT 20");
            $bots = $stmt->fetchAll(PDO::FETCH_ASSOC);
            // Get bot_logs count and data
            $extra = [];
            try {
                $logCount = $pdo->query("SELECT COUNT(*) FROM bot_logs")->fetchColumn();
                $extra['log_count'] = (int)$logCount;
                $logStmt = $pdo->query("SELECT bot_id, log_type, message, created_at FROM bot_logs ORDER BY created_at DESC LIMIT 20");
                $extra['recent_logs'] = $logStmt->fetchAll(PDO::FETCH_ASSOC);
                // posting-specific logs (exclude like skip messages)
                $postLogStmt = $pdo->query("SELECT bot_id, log_type, message, created_at FROM bot_logs WHERE (message LIKE '%auto-post%' OR message LIKE '%Triggered%' OR message LIKE '%video tweet%' OR message LIKE '%affiliate%' OR message LIKE '%Cannot create%' OR message LIKE '%Selected tweet%' OR message LIKE '%Posted tweet%' OR message LIKE '%reference account%') ORDER BY created_at DESC LIMIT 30");
                $extra['posting_logs'] = $postLogStmt->fetchAll(PDO::FETCH_ASSOC);
            } catch (Exception $e) {
                $extra['log_error'] = $e->getMessage();
            }
            try {
                $postCount = $pdo->query("SELECT COUNT(*) FROM posted_tweets")->fetchColumn();
                $extra['post_count'] = (int)$postCount;
                $postStmt = $pdo->query("SELECT * FROM posted_tweets ORDER BY created_at DESC LIMIT 10");
                $extra['recent_posts'] = $postStmt->fetchAll(PDO::FETCH_ASSOC);
            } catch (Exception $e) {
                $extra['post_error'] = $e->getMessage();
            }
            // Check account encryption status
            $acctStmt = $pdo->query("SELECT id, screen_name, substr(api_key, 1, 30) as api_key_prefix, length(api_key) as api_key_len FROM accounts LIMIT 10");
            $extra['accounts'] = $acctStmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(array_merge(['bots' => $bots], $extra), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'restart':
        // Step 1: Kill
        $killResults = killNodeProcesses($node_bin_dir, $pidFile);
        sleep(1);

        // Step 2: Start via background script
        $node = "$node_bin_dir/node";
        $app = "$dir/dist/index.js";

        if (!file_exists($node) || !file_exists($app)) {
            echo json_encode([
                'kill_results' => $killResults,
                'error' => 'Node binary or app not found',
                'node_exists' => file_exists($node),
                'app_exists' => file_exists($app)
            ]);
            break;
        }

        $startScript = "$dir/start_bg.sh";
        $envLines = "export OPENSSL_CONF=/dev/null\nexport PORT=3001\nexport NODE_ENV=production\n";
        $envFile = "$dir/.env";
        if (file_exists($envFile)) {
            $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                $line = trim($line);
                if ($line === '' || $line[0] === '#') continue;
                if (strpos($line, '=') !== false) {
                    $envLines .= "export " . $line . "\n";
                }
            }
        }

        $scriptContent = "#!/bin/bash\n";
        $scriptContent .= "cd " . escapeshellarg($dir) . "\n";
        $scriptContent .= "export PATH=" . escapeshellarg($node_bin_dir) . ":\$PATH\n";
        $scriptContent .= $envLines;
        $scriptContent .= escapeshellarg($node) . " " . escapeshellarg($app) . " > " . escapeshellarg($logFile) . " 2>&1 &\n";
        $scriptContent .= "echo \$! > " . escapeshellarg($pidFile) . "\n";

        file_put_contents($startScript, $scriptContent);
        chmod($startScript, 0700); // Owner only — restrict permissions

        exec("nohup bash " . escapeshellarg($startScript) . " > /dev/null 2>&1 &");

        usleep(500000);
        $pid = file_exists($pidFile) ? trim(file_get_contents($pidFile)) : null;

        // Security: remove start script (contains env secrets in plaintext)
        if (file_exists($startScript)) {
            unlink($startScript);
        }

        echo json_encode([
            'kill_results' => $killResults,
            'start_status' => 'launched',
            'pid' => $pid ? (int)$pid : null,
            'status' => 'restarted',
            'note' => 'Check status after a few seconds'
        ]);
        break;
}
?>
