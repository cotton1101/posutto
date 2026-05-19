#!/bin/bash
cd "$(dirname "$0")"
/usr/local/php/8.0/bin/php rebuild_sqlite_final.php > build.log 2>&1
