<?php
// Quick Test Proxy for elcanaldeportivo.com

if (isset($_GET['url']) && !empty($_GET['url'])) {
    $url = $_GET['url'];
} else {
    $url = 'https://elcanaldeportivo.com/directvsports.php';
}

// Determine Referer
$referer = 'https://deepcathink.com/';
if (strpos($url, 'elcanaldeportivo.com') !== false) {
    $referer = 'https://gopelotero.com/';
} elseif (strpos($url, 'deepcathink.com') !== false) {
    $referer = 'https://elcanaldeportivo.com/';
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
    die("Error: HTTP " . $http_code . " fetching URL: " . htmlspecialchars($url));
}

if (strpos($content_type, 'text/html') !== false || strpos($response, '<html') !== false) {
    // Inject base href and client hooks
    $base_href = '<base href="' . htmlspecialchars($url) . '">';
    
    $client_hooks = '
    <script>
        (function() {
            // Block popups globally
            window.open = function(url, name, specs, replace) {
                console.log("Popup blocked:", url);
                return { focus: function() {}, blur: function() {}, close: function() {}, closed: false, opener: window };
            };
            Object.defineProperty(window, "open", { value: window.open, writable: false, configurable: false });

            // Intercept XMLHttpRequest for .m3u8
            (function() {
                var XHR = XMLHttpRequest.prototype;
                var open = XHR.open;
                XHR.open = function(method, url) {
                    if (typeof url === "string" && url.indexOf(".m3u8") !== -1 && url.indexOf("test_play.php") === -1) {
                        var absoluteUrl = url;
                        if (url.indexOf("http") !== 0) {
                            var a = document.createElement("a");
                            a.href = url;
                            absoluteUrl = a.href;
                        }
                        console.log("XHR Intercepted .m3u8:", absoluteUrl);
                        url = "https://crazydeportes.com/test_play.php?url=" + encodeURIComponent(absoluteUrl);
                    }
                    return open.apply(this, arguments);
                };
            })();

            // Intercept Fetch API for .m3u8
            if (window.fetch) {
                var originalFetch = window.fetch;
                window.fetch = function(input, init) {
                    var url = typeof input === "string" ? input : (input && input.url);
                    if (typeof url === "string" && url.indexOf(".m3u8") !== -1 && url.indexOf("test_play.php") === -1) {
                        var absoluteUrl = url;
                        if (url.indexOf("http") !== 0) {
                            var a = document.createElement("a");
                            a.href = url;
                            absoluteUrl = a.href;
                        }
                        console.log("Fetch Intercepted .m3u8:", absoluteUrl);
                        var proxiedUrl = "https://crazydeportes.com/test_play.php?url=" + encodeURIComponent(absoluteUrl);
                        if (typeof input === "string") {
                            input = proxiedUrl;
                        } else {
                            input = new Request(proxiedUrl, init);
                        }
                    }
                    return originalFetch.call(this, input, init);
                };
            }

            // Intercept Dynamic Iframes
            function checkAndProxyIframe(iframe) {
                if (!iframe) return;
                var src = iframe.src;
                if (src && src.indexOf("test_play.php") === -1 && src.indexOf("javascript:") !== 0 && src.indexOf("about:") !== 0) {
                    if (src.indexOf("https://crazydeportes.com") !== 0) {
                        iframe.src = "https://crazydeportes.com/test_play.php?url=" + encodeURIComponent(src);
                    }
                }
            }

            var originalCreateElement = document.createElement;
            document.createElement = function(tag) {
                var el = originalCreateElement.apply(this, arguments);
                if (tag && tag.toLowerCase() === "iframe") {
                    Object.defineProperty(el, "src", {
                        get: function() { return this.getAttribute("src"); },
                        set: function(val) {
                            if (val && val.indexOf("test_play.php") === -1 && val.indexOf("javascript:") !== 0 && val.indexOf("about:") !== 0) {
                                var absoluteUrl = val;
                                if (val.indexOf("http") !== 0) {
                                    var a = document.createElement("a");
                                    a.href = val;
                                    absoluteUrl = a.href;
                                }
                                val = "https://crazydeportes.com/test_play.php?url=" + encodeURIComponent(absoluteUrl);
                            }
                            this.setAttribute("src", val);
                        },
                        configurable: true
                    });
                }
                return el;
            };

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
            if (document.documentElement) {
                observer.observe(document.documentElement, { childList: true, subtree: true });
            }
        })();
    </script>
    ';
    
    // Inject at head
    $response = preg_replace('/<head>/i', '<head>' . $base_href . $client_hooks, $response);
    
    // Remove typical anti-sandbox scripts and ad scripts
    $response = preg_replace('/<script id="aclib"[^>]*>.*?<\/script>/is', '', $response);
    $response = preg_replace('/aclib\.runPop\(.*?\);/is', '', $response);
    $response = preg_replace('/<script src="https:\/\/millerthe\.com\/.*?<\/script>/is', '', $response);
    $response = preg_replace('/<script>!function\(\)\{try\{var t=\["sandbox".*?<\/script>/is', '', $response);
    $response = preg_replace('/<script[^>]*>[^<]*SANDBOX IFRAME NOT ALLOWED[^<]*<\/script>/is', '', $response);
    
    // Rewrite deportivo.js reference to go through us
    $response = str_replace('//deepcathink.com/deportivo.js', 'https://crazydeportes.com/test_play.php?url=https%3A%2F%2Fdeepcathink.com%2Fdeportivo.js', $response);
} elseif (strpos($content_type, 'mpegurl') !== false || strpos($response, '#EXTM3U') === 0 || preg_match('/\.m3u8/i', $url)) {
    // Rewrite .m3u8 relative links to absolute
    $lines = explode("\n", $response);
    $base_dir = substr($url, 0, strrpos($url, '/') + 1);
    foreach ($lines as &$line) {
        $line = trim($line);
        if ($line !== '' && $line[0] !== '#' && strpos($line, '://') === false) {
            $line = $base_dir . $line;
        }
    }
    $response = implode("\n", $lines);
}

header('Content-Type: ' . $content_type);
echo $response;
?>
