<?php
// ============================================
// FutMundial26 — Intelligent Same-Origin Stream Proxy
// ============================================

if (!isset($_GET['canal']) || empty($_GET['canal'])) {
    die("Canal no especificado.");
}

$canal = basename($_GET['canal']); // Sanitize to prevent directory traversal

// Strictly allow only alphanumeric channel names ending with .php
if (!preg_match('/^[a-zA-Z0-9_-]+\.php$/', $canal)) {
    die("Canal inválido.");
}

$target_url = 'https://canalesdeportivos.net/' . $canal;

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $target_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
curl_setopt($ch, CURLOPT_REFERER, 'https://gopelotero.com/');
curl_setopt($ch, CURLOPT_TIMEOUT, 12);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($http_code !== 200 || !$response) {
    die("Error al cargar la señal de transmisión de canalesdeportivos.net (HTTP " . $http_code . ").");
}

// 1. Inject intelligent popup blocker at the very beginning of the <head> section
$popup_blocker = '
<script>
    // Overriding popup behavior to block ads same-origin
    (function() {
        var originalOpen = window.open;
        window.open = function(url, name, specs, replace) {
            console.log("Popup blocked by FutMundial26 Proxy:", url);
            return {
                focus: function() {},
                blur: function() {},
                close: function() {},
                closed: false,
                opener: window
            };
        };
        // Disable writing over window.open
        Object.defineProperty(window, "open", {
            value: window.open,
            writable: false,
            configurable: false
        });
    })();
</script>
';

// Inject the popup blocker script
$response = preg_replace('/<head>/i', '<head>' . $popup_blocker, $response);

// 2. Remove third-party ad networks scripts to optimize page performance
// Remove Adcash libraries
$response = preg_replace('/<script id="aclib"[^>]*>.*?<\/script>/is', '', $response);
// Remove Adcash runPop function scripts
$response = preg_replace('/aclib\.runPop\(.*?\);/is', '', $response);
// Remove Millerthe scripts
$response = preg_replace('/<script src="https:\/\/millerthe\.com\/.*?<\/script>/is', '', $response);
// Remove the anti-sandbox check script entirely
$response = preg_replace('/<script>!function\(\)\{try\{var t=\["sandbox".*?<\/script>/is', '', $response);

// 3. Normalize relative assets and links
$response = str_replace('href="/"', 'href="https://canalesdeportivos.net/"', $response);

// Output the sanitized stream page
echo $response;
?>
