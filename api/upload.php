<?php
/**
 * FutMundial26 — Subida de imágenes al servidor
 * Guarda las imágenes en /uploads/ directamente en tu hosting
 * No necesita API key de ningún servicio externo
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Only POST allowed']);
    exit;
}

// Config
$uploadDir = __DIR__ . '/../uploads/';
$maxSize = 5 * 1024 * 1024; // 5MB max
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Create uploads directory if it doesn't exist
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Check if file was uploaded
if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    $errorMsg = isset($_FILES['image']) ? 'Upload error code: ' . $_FILES['image']['error'] : 'No image file received';
    echo json_encode(['error' => $errorMsg]);
    exit;
}

$file = $_FILES['image'];

// Validate file size
if ($file['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode(['error' => 'Image too large. Max 5MB.']);
    exit;
}

// Validate file type
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mimeType = $finfo->file($file['tmp_name']);

if (!in_array($mimeType, $allowedTypes)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid file type. Only JPG, PNG, GIF, WEBP allowed.']);
    exit;
}

// Generate unique filename
$ext = match($mimeType) {
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/gif' => 'gif',
    'image/webp' => 'webp',
    default => 'jpg'
};
$filename = 'img_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
$filepath = $uploadDir . $filename;

// Move uploaded file
if (move_uploaded_file($file['tmp_name'], $filepath)) {
    // Build the public URL
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    $url = $protocol . '://' . $host . '/uploads/' . $filename;
    
    echo json_encode([
        'success' => true,
        'data' => [
            'url' => $url,
            'filename' => $filename
        ]
    ]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save image. Check server permissions.']);
}
