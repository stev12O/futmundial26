<?php
header('Content-Type: text/plain');
echo "=== PROXY.PHP ===\n";
echo file_get_contents('proxy.php');
echo "\n=== SCRIPT.JS ===\n";
echo file_get_contents('script.js');
?>
