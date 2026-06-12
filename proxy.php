<?php
// ============================================
// FutMundial26 — Advanced Multi-Domain Stream Proxy
// ============================================

if (!isset($_GET['url']) || empty($_GET['url'])) {
    // Legacy support for 'canal' parameter in script.js
    if (isset($_GET['canal']) && !empty($_GET['canal'])) {
        $canal = basename($_GET['canal']);
        if (preg_match('/^[a-zA-Z0-9_-]+\.php$/', $canal)) {
            $url = 'https://canalesdeportivos.net/' . $canal;
        } else {
            die("Canal inválido.");
        }
    } else {
        die("URL no especificada.");
    }
} else {
    $url = $_GET['url'];
}

// Security Check: Only allow streaming-related domains
$allowed_patterns = [
    '/^https?:\/\/(www\.)?canalesdeportivos\.net/i',
    '/^https?:\/\/[a-z0-9-]+\.xyz/i', // Matches streamtpday1.xyz, streamtp.xyz, etc.
    '/^https?:\/\/[a-z0-9-]+\.live/i',
    '/^https?:\/\/[a-z0-9-]+\.click/i',
    '/^https?:\/\/[a-z0-9-]+\.net/i',
    '/^https?:\/\/[a-z0-9-]+\.org/i',
    '/^https?:\/\/[a-z0-9-]+\.com/i',
];

$allowed = false;
foreach ($allowed_patterns as $pattern) {
    if (preg_match($pattern, $url)) {
        // Exclude known ad domains or search engines
        if (!preg_match('/(google|bing|yahoo|millerthe|acscdn|doubleclick|adsterra|facebook|twitter)/i', $url)) {
            $allowed = true;
            break;
        }
    }
}

if (!$allowed) {
    die("Acceso denegado: dominio no autorizado.");
}

// Set appropriate referer based on target url
$referer = 'https://canalesdeportivos.net/';
if (strpos($url, 'canalesdeportivos.net') !== false) {
    $referer = 'https://gopelotero.com/';
}

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
curl_setopt($ch, CURLOPT_REFERER, $referer);
curl_setopt($ch, CURLOPT_TIMEOUT, 15);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$content_type = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
curl_close($ch);

if ($http_code !== 200 || !$response) {
    die("Error al cargar el recurso (HTTP " . $http_code . "). URL: " . htmlspecialchars($url));
}

// If it's HTML, we sanitize and inject the client-side hooks
if (strpos($content_type, 'text/html') !== false || strpos($response, '<html') !== false) {
    // Inject intelligent popup blocker and client-side iframe interceptor
    $client_hooks = '
    <script>
        (function() {
            // 1. Block popups globally
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
            Object.defineProperty(window, "open", {
                value: window.open,
                writable: false,
                configurable: false
            });

            // 2. Interceptor function to rewrite iframe URLs to go through proxy.php
            function checkAndProxyIframe(iframe) {
                if (!iframe) return;
                var src = iframe.getAttribute("src");
                if (src && (src.indexOf("streamtp") !== -1 || src.indexOf("canalesdeportivos.net") !== -1) && src.indexOf("proxy.php") === -1) {
                    iframe.setAttribute("src", "proxy.php?url=" + encodeURIComponent(src));
                }
            }

            // 3. Hook document.createElement to catch runtime iframe creation
            var originalCreateElement = document.createElement;
            document.createElement = function(tag) {
                var el = originalCreateElement.apply(this, arguments);
                if (tag && tag.toLowerCase() === "iframe") {
                    Object.defineProperty(el, "src", {
                        get: function() { return this.getAttribute("src"); },
                        set: function(val) {
                            if (val && (val.indexOf("streamtp") !== -1 || val.indexOf("canalesdeportivos.net") !== -1) && val.indexOf("proxy.php") === -1) {
                                val = "proxy.php?url=" + encodeURIComponent(val);
                            }
                            this.setAttribute("src", val);
                        },
                        configurable: true
                    });
                }
                return el;
            };

            // 4. Hook MutationObserver to catch iframes injected via innerHTML
            var observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeName === "IFRAME") {
                            checkAndProxyIframe(node);
                        } else if (node.querySelectorAll) {
                            var iframes = node.querySelectorAll("iframe");
                            iframes.forEach(checkAndProxyIframe);
                        }
                    });
                });
            });
            
            // Start observer as soon as documentElement is available
            if (document.documentElement) {
                observer.observe(document.documentElement, { childList: true, subtree: true });
            } else {
                document.addEventListener("DOMContentLoaded", function() {
                    observer.observe(document.documentElement, { childList: true, subtree: true });
                });
            }

            // 5. Hook document.write to catch legacy iframe insertion
            var originalWrite = document.write;
            document.write = function(html) {
                if (typeof html === "string" && html.indexOf("<iframe") !== -1) {
                    html = html.replace(/src=["\'](https?:\/\/[^"\']+)["\']/g, function(match, url) {
                        if ((url.indexOf("streamtp") !== -1 || url.indexOf("canalesdeportivos.net") !== -1) && url.indexOf("proxy.php") === -1) {
                            return \'src="proxy.php?url=\' + encodeURIComponent(url) + \'"\';
                        }
                        return match;
                    });
                }
                originalWrite.call(document, html);
            };
        })();
    </script>
    ';
    
    // Inject the client hooks at the very top of <head>
    $response = preg_replace('/<head>/i', '<head>' . $client_hooks, $response);
    
    // Remove third-party ad networks scripts
    $response = preg_replace('/<script id="aclib"[^>]*>.*?<\/script>/is', '', $response);
    $response = preg_replace('/aclib\.runPop\(.*?\);/is', '', $response);
    $response = preg_replace('/<script src="https:\/\/millerthe\.com\/.*?<\/script>/is', '', $response);
    $response = preg_replace('/<script>!function\(\)\{try\{var t=\["sandbox".*?<\/script>/is', '', $response);

    // Rewrite any static links to go through our proxy
    $response = preg_replace_callback('/(src|href)=["\'](https?:\/\/[a-z0-9.-]+(?:\.xyz|\.live|\.click|\.net)\/[^"\']+)["\']/i', function($matches) {
        $attr = $matches[1];
        $target_url = $matches[2];
        
        // Skip direct media streams (m3u8, mp4, ts) and stylesheet/script files to save server resources
        if (preg_match('/\.(m3u8|mp4|ts|css|js|png|jpg|gif|jpeg|svg|woff|woff2|ttf)/i', $target_url)) {
            return $matches[0];
        }
        
        // Proxy HTML/PHP page loads
        return $attr . '="proxy.php?url=' . urlencode($target_url) . '"';
    }, $response);
    
    // Normalize relative links on canalesdeportivos.net
    if (strpos($url, 'canalesdeportivos.net') !== false) {
        $response = str_replace('href="/"', 'href="https://canalesdeportivos.net/"', $response);
    }
}

// Forward the original Content-Type header
header('Content-Type: ' . $content_type);
echo $response;
?>
