<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$id = $input['id'] ?? null;

if (!$id) {
    http_response_code(400);
    echo json_encode(['error' => 'No file ID provided']);
    exit;
}

$baseDir = 'uploads/';
$mp3Dir = $baseDir . 'mp3/';
$coversDir = $baseDir . 'covers/';
$dataDir = $baseDir . 'data/';

$jsonPath = $dataDir . $id . '.json';

if (!file_exists($jsonPath)) {
    http_response_code(404);
    echo json_encode(['error' => 'File not found']);
    exit;
}

$content = file_get_contents($jsonPath);
$data = json_decode($content, true);

if ($data) {
    if (isset($data['filename']) && file_exists($mp3Dir . $data['filename'])) {
        unlink($mp3Dir . $data['filename']);
    }

    if (isset($data['coverUrl'])) {
        $coverName = basename($data['coverUrl']);
        if (file_exists($coversDir . $coverName)) {
            unlink($coversDir . $coverName);
        }
    }
}

if (unlink($jsonPath)) {
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to delete record']);
}
?>
