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
} elseif (strpos($url, 'deepcathink.com') !== false) {
    $referer = 'https://canalesdeportivos.net/';
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

// If it's HTML, we sanitize and inject the client-side hooks and base href
if (strpos($content_type, 'text/html') !== false || strpos($response, '<html') !== false) {
    // 1. Inject base href tag
    $base_href = '<base href="' . htmlspecialchars($url) . '">';

    // 2. Inject client-side hooks
    $client_hooks = '
    <script>
        (function() {
            // Block popups globally
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

            // Interceptor function to rewrite iframe URLs to go through proxy.php
            function checkAndProxyIframe(iframe) {
                if (!iframe) return;
                var src = iframe.src; // Resolved absolute URL via browser base href
                if (src && src.indexOf("https://crazydeportes.com/proxy.php") === -1 && src.indexOf("javascript:") !== 0 && src.indexOf("about:") !== 0) {
                    if (src.indexOf("https://crazydeportes.com") !== 0) {
                        iframe.src = "https://crazydeportes.com/proxy.php?url=" + encodeURIComponent(src);
                    }
                }
            }

            // Hook document.createElement to catch runtime iframe creation
            var originalCreateElement = document.createElement;
            document.createElement = function(tag) {
                var el = originalCreateElement.apply(this, arguments);
                if (tag && tag.toLowerCase() === "iframe") {
                    Object.defineProperty(el, "src", {
                        get: function() { return this.getAttribute("src"); },
                        set: function(val) {
                            if (val && val.indexOf("https://crazydeportes.com/proxy.php") === -1 && val.indexOf("javascript:") !== 0 && val.indexOf("about:") !== 0) {
                                var absoluteUrl = val;
                                // Resolve to absolute URL if relative
                                if (val.indexOf("http") !== 0) {
                                    var a = document.createElement("a");
                                    a.href = val;
                                    absoluteUrl = a.href;
                                }
                                if (absoluteUrl.indexOf("https://crazydeportes.com") !== 0) {
                                    val = "https://crazydeportes.com/proxy.php?url=" + encodeURIComponent(absoluteUrl);
                                }
                            }
                            this.setAttribute("src", val);
                        },
                        configurable: true
                    });
                }
                return el;
            };

            // Hook MutationObserver to catch iframes injected via innerHTML
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
            
            // Start observer
            if (document.documentElement) {
                observer.observe(document.documentElement, { childList: true, subtree: true });
            } else {
                document.addEventListener("DOMContentLoaded", function() {
                    observer.observe(document.documentElement, { childList: true, subtree: true });
                });
            }

            // Hook document.write to catch legacy iframe insertion
            var originalWrite = document.write;
            document.write = function(html) {
                if (typeof html === "string" && html.indexOf("<iframe") !== -1) {
                    html = html.replace(/src=["\'](https?:\/\/[^"\']+)["\']/g, function(match, url) {
                        if (url.indexOf("https://crazydeportes.com") !== 0 && url.indexOf("proxy.php") === -1) {
                            return \'src="https://crazydeportes.com/proxy.php?url=\' + encodeURIComponent(url) + \'"\';
                        }
                        return match;
                    });
                }
                originalWrite.call(document, html);
            };
        })();
    </script>
    ';
    
    // Inject base href and client hooks right after <head>
    $response = preg_replace('/<head>/i', '<head>' . $base_href . $client_hooks, $response);
    
    // Remove third-party ad networks scripts
    $response = preg_replace('/<script id="aclib"[^>]*>.*?<\/script>/is', '', $response);
    $response = preg_replace('/aclib\.runPop\(.*?\);/is', '', $response);
    $response = preg_replace('/<script src="https:\/\/millerthe\.com\/.*?<\/script>/is', '', $response);
    $response = preg_replace('/<script>!function\(\)\{try\{var t=\["sandbox".*?<\/script>/is', '', $response);
    
    // Remove the specific SANDBOX IFRAME NOT ALLOWED check scripts
    $response = preg_replace('/<script[^>]*>[^<]*SANDBOX IFRAME NOT ALLOWED[^<]*<\/script>/is', '', $response);

    // Rewrite any static links to go through our proxy with absolute paths
    $response = preg_replace_callback('/(src|href)=["\'](https?:\/\/[a-z0-9.-]+(?:\.xyz|\.live|\.click|\.net)\/[^"\']+)["\']/i', function($matches) {
        $attr = $matches[1];
        $target_url = $matches[2];
        
        // Skip direct media streams (m3u8, mp4, ts) and stylesheet/script files to save server resources
        if (preg_match('/\.(m3u8|mp4|ts|css|js|png|jpg|gif|jpeg|svg|woff|woff2|ttf)/i', $target_url)) {
            return $matches[0];
        }
        
        // Proxy HTML/PHP page loads using absolute path
        return $attr . '="https://crazydeportes.com/proxy.php?url=' . urlencode($target_url) . '"';
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
