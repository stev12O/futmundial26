<?php
/**
 * FutMundial26 — API para gestionar noticias
 * Guarda/lee/elimina artículos en data/articles.json
 * 
 * POST   /api/articles.php          → Crear artículo
 * GET    /api/articles.php          → Leer todos
 * DELETE /api/articles.php?id=123   → Eliminar artículo
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$articlesFile = __DIR__ . '/../data/articles.json';

// Ensure data directory exists
$dataDir = dirname($articlesFile);
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}

// Read current articles
function readArticles($file) {
    if (!file_exists($file)) {
        return [];
    }
    $content = file_get_contents($file);
    $articles = json_decode($content, true);
    return is_array($articles) ? $articles : [];
}

// Write articles to file
function writeArticles($file, $articles) {
    $json = json_encode($articles, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    return file_put_contents($file, $json);
}

// --- GET: Return all articles ---
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $articles = readArticles($articlesFile);
    echo json_encode($articles);
    exit;
}

// --- POST: Create new article ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || empty($input['title']) || empty($input['excerpt'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Title and excerpt are required']);
        exit;
    }
    
    $articles = readArticles($articlesFile);
    
    // Build new article
    $newArticle = [
        'id' => isset($input['id']) ? intval($input['id']) : intval(microtime(true) * 1000),
        'title' => htmlspecialchars($input['title'], ENT_QUOTES, 'UTF-8'),
        'excerpt' => htmlspecialchars($input['excerpt'], ENT_QUOTES, 'UTF-8'),
        'body' => $input['body'] ?? '',
        'image' => filter_var($input['image'] ?? '', FILTER_SANITIZE_URL),
        'category' => $input['category'] ?? 'noticias',
        'categoryIcon' => $input['categoryIcon'] ?? '📰',
        'categoryLabel' => $input['categoryLabel'] ?? 'NOTICIAS',
        'time' => $input['time'] ?? 'Hace unos instantes',
        'date' => date('Y-m-d'),
        'author' => htmlspecialchars($input['author'] ?? 'Redacción', ENT_QUOTES, 'UTF-8'),
        'comments' => '0',
        'views' => '1',
        'featured' => $input['featured'] ?? false,
    ];
    
    // Add to beginning of array
    array_unshift($articles, $newArticle);
    
    if (writeArticles($articlesFile, $articles)) {
        http_response_code(201);
        echo json_encode(['success' => true, 'article' => $newArticle]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save article. Check file permissions.']);
    }
    exit;
}

// --- DELETE: Remove article by ID ---
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Article ID is required']);
        exit;
    }
    
    $articles = readArticles($articlesFile);
    $filtered = array_values(array_filter($articles, function($a) use ($id) {
        return $a['id'] !== $id;
    }));
    
    if (count($filtered) === count($articles)) {
        http_response_code(404);
        echo json_encode(['error' => 'Article not found']);
        exit;
    }
    
    if (writeArticles($articlesFile, $filtered)) {
        echo json_encode(['success' => true, 'remaining' => count($filtered)]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete article']);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
