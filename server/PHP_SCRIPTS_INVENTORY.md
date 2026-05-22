# PHP スクリプト棚卸し (server/)

このリポジトリの `server/` 直下には **25 個の PHP スクリプト** があります。多くは
Xserver 共有ホスティング上で Node.js を動かすための「デプロイ試行錯誤」の名残です。

> **目的**: 本番運用に必要なものと、削除してよい残骸を切り分けるためのドラフト提案です。
> **このファイル生成時点では PHP は 1 つも削除していません。** 下記「削除候補」を確認のうえ、
> 「これは消してよい」と指示いただいたものだけ `git rm` します。

判定の根拠（コード参照の有無）:
- `proxy.php` … 本番の `/posutto/api/*` 中継（`.htaccess` 経由）。**実行時必須**
- `send_mail.php` … `server/index.ts:304` から呼ばれるメール送信プロキシ。**実行時必須**
- `admin_auth.php` … `check_node.php` / `install_node.php` / `install_sqljs.php` / `start_node.php` / `test_start.php` が `require_once`。**依存あり**
- `start_node.php` / `stop_node.php` / `check_node.php` / `install_node.php` … コードからの参照は無いが、`upload_xserver.sh` の手順で手動アクセスして Node を管理する運用スクリプト。

---

## 分類サマリ

### ✅ A. 残すべき（本番運用に必須 / 依存あり）
| ファイル | 役割 |
|---|---|
| `proxy.php` | APIプロキシ（Apache .htaccess → localhost:3001 Node）。runtime必須 |
| `send_mail.php` | Node(index.ts:304)から呼ばれるメール送信プロキシ。runtime必須 |
| `admin_auth.php` | 管理スクリプト共通の `?key=ADMIN_KEY` 認証。複数が require |
| `start_node.php` | Node バックグラウンド起動（運用） |
| `stop_node.php` | Node 停止（運用） |
| `check_node.php` | Node 稼働確認（運用） |
| `install_node.php` | Node バイナリ導入（再デプロイ時のセットアップ） |

### ❓ B. 要確認（運用次第で残す / 消す）
| ファイル | 役割 / 判断材料 |
|---|---|
| `run_command.php` | 「Safe Server Status Command Runner」。コード参照なし。管理画面/手動運用で使うなら残す |
| `install_sqljs.php` | sql.js 導入スクリプト。初期セットアップ／DB再構築時に使う可能性 |

### 🗑 C. 削除候補（過去のデプロイ試行錯誤の重複・診断残骸）
| ファイル | 理由 |
|---|---|
| `install_v7.php` | Node 導入の旧版（`install_node.php` に集約済みと思われる） |
| `install_v8.php` | 同上（バージョン違いの重複） |
| `install_v9.php` | 同上（バージョン違いの重複） |
| `clean_and_install_v7.php` | 同上（クリーン導入の試行版） |
| `run_yarn_install.php` | yarn 導入の試行版 |
| `yarn_install_v2.php` | yarn 導入の試行版（v2） |
| `yarn_install_final.php` | yarn 導入の「final」版（重複） |
| `rebuild_sqlite.php` | SQLite 再構築の旧版 |
| `rebuild_sqlite_final.php` | SQLite 再構築の「final」版（重複） |
| `db_diag.php` | DB 診断（旧版） |
| `db_diag_v2.php` | DB 診断（v2、重複） |
| `find_php.php` | PHP バイナリ探索の一発スクリプト |
| `find_php_verbose.php` | PHP バイナリ探索（詳細版） |
| `diagnose_prebuild.php` | ビルド前診断の一発スクリプト |
| `test_smtp.php` | SMTP テスト。ファイル冒頭に **「テスト後に削除すること」** と明記 |
| `test_start.php` | 起動テスト用スクリプト |

> C 群（16 ファイル）はいずれもデプロイ作業中の使い捨てと推測されます。`yarn_install_v2.php` /
> `yarn_install_final.php` は既に `.gitignore` 対象です。

---

## 各ファイルの先頭 5 行

### A. 残すべき

#### proxy.php
```php
<?php
// PHP Proxy for Node.js (Posutto)
ini_set('post_max_size', '12M');
ini_set('upload_max_filesize', '12M');
ini_set('max_execution_time', '60');
```

#### send_mail.php
```php
<?php
// PHP Mail Proxy - Node.js から呼ばれるメール送信プロキシ
header('Content-Type: application/json');

// Only accept POST
```

#### admin_auth.php
```php
<?php
/**
 * Simple access control for PHP management scripts.
 * Require ?key=<ADMIN_KEY> in the URL to access.
 * The key is loaded from .env file (ADMIN_KEY).
```

#### start_node.php
```php
<?php
/**
 * Node.js Background Process Starter for Xserver Shared Hosting
 * Usage: Access https://sns-tool.online/posutto/server/start_node.php?key=YOUR_ADMIN_KEY
 *
```

#### stop_node.php
```php
<?php
/**
 * Node.js Process Stopper for Xserver Shared Hosting
 * Usage: Access https://sns-tool.online/posutto/server/stop_node.php?key=YOUR_ADMIN_KEY
 */
```

#### check_node.php
```php
<?php
require_once __DIR__ . '/admin_auth.php';
header('Content-Type: application/json');

$port = 3001;
```

#### install_node.php
```php
<?php
require_once __DIR__ . '/admin_auth.php';
header('Content-Type: text/plain');

$node_version = "v16.14.0"; // Older version to try fixing npm
```

### B. 要確認

#### run_command.php
```php
<?php
/**
 * Safe Server Status Command Runner
 * Only allows pre-defined safe commands for server management.
 * Arbitrary command execution is NOT allowed.
```

#### install_sqljs.php
```php
<?php
require_once __DIR__ . '/admin_auth.php';
header('Content-Type: text/plain');
putenv("OPENSSL_CONF=/dev/null");

```

### C. 削除候補

#### install_v7.php
```php
<?php
header('Content-Type: text/plain');
putenv("OPENSSL_CONF=/dev/null");

$node_bin_dir = __DIR__ . "/bin/bin";
```

#### install_v8.php
```php
<?php
header('Content-Type: text/plain');
putenv("OPENSSL_CONF=/dev/null");

$node_bin_dir = __DIR__ . "/bin/bin";
```

#### install_v9.php
```php
<?php
header('Content-Type: text/plain');
putenv("OPENSSL_CONF=/dev/null");

$node_bin_dir = __DIR__ . "/bin/bin";
```

#### clean_and_install_v7.php
```php
<?php
header('Content-Type: text/plain');
putenv("OPENSSL_CONF=/dev/null");

$node_bin_dir = __DIR__ . "/bin/bin";
```

#### run_yarn_install.php
```php
<?php
header('Content-Type: text/plain');
putenv("OPENSSL_CONF=/dev/null");

$node_bin_dir = __DIR__ . "/bin/bin";
```

#### yarn_install_v2.php
```php
<?php
header('Content-Type: text/plain');
putenv("OPENSSL_CONF=/dev/null");

$node_bin_dir = __DIR__ . "/bin/bin";
```

#### yarn_install_final.php
```php
<?php
header('Content-Type: text/plain');
putenv("OPENSSL_CONF=/dev/null");

$node_bin_dir = __DIR__ . "/bin/bin";
```

#### rebuild_sqlite.php
```php
<?php
header('Content-Type: text/plain');
putenv("OPENSSL_CONF=/dev/null");
$node_bin_dir = __DIR__ . "/bin/bin";
$node_executable = $node_bin_dir . "/node";
```

#### rebuild_sqlite_final.php
```php
<?php
header('Content-Type: text/plain');
putenv("OPENSSL_CONF=/dev/null");

// Setup Node env
```

#### db_diag.php
```php
<?php
header('Content-Type: text/plain');
try {
    $db = new PDO('sqlite:data/posutto.db');
    $tables = $db->query("SELECT name FROM sqlite_master WHERE type='table'")->fetchAll(PDO::FETCH_COLUMN);
```

#### db_diag_v2.php
```php
<?php
header('Content-Type: text/plain');
ini_set('display_errors', 1);
error_reporting(E_ALL);
try {
```

#### find_php.php
```php
<?php echo PHP_BINARY; ?>
```

#### find_php_verbose.php
```php
<?php
echo "Version: " . phpversion() . "\n";
echo "Binary: " . PHP_BINARY . "\n";
echo "Bindir: " . PHP_BINDIR . "\n";
$candidates = [
```

#### diagnose_prebuild.php
```php
<?php
header('Content-Type: text/plain');
putenv("OPENSSL_CONF=/dev/null");

$node_bin_dir = __DIR__ . "/bin/bin";
```

#### test_smtp.php
```php
<?php
// SMTP Test Script - テスト後に削除すること
header('Content-Type: application/json');

$key = isset($_GET['key']) ? $_GET['key'] : '';
```

#### test_start.php
```php
<?php
require_once __DIR__ . '/admin_auth.php';
header('Content-Type: text/plain');
$dir = __DIR__;
chdir($dir);
```
