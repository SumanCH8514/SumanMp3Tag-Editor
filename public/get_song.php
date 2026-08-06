<?php
header('Access-Control-Allow-Origin: *');
header('Cross-Origin-Resource-Policy: cross-origin');
header('Content-Type: application/json');

$id = isset($_GET['id']) ? preg_replace('/[^a-zA-Z0-9_-]/', '', $_GET['id']) : '';

if (!$id) {
    http_response_code(400);
    echo json_encode(['error' => 'Song ID is required']);
    exit;
}

$baseDir = 'uploads/';
$mp3Dir = $baseDir . 'mp3/';
$dataDir = $baseDir . 'data/';
$jsonFile = $dataDir . $id . '.json';

if (file_exists($jsonFile)) {
    $content = file_get_contents($jsonFile);
    if ($content) {
        $data = json_decode($content, true);
        if ($data) {
            $data['id'] = $id;
            if (isset($data['url'])) {
                $data['url'] = 'uploads/mp3/' . basename($data['url']);
            }
            if (isset($data['coverUrl']) && $data['coverUrl']) {
                $data['coverUrl'] = 'uploads/covers/' . basename($data['coverUrl']);
            }

            echo json_encode(['success' => true, 'song' => $data]);
            exit;
        }
    }
}

http_response_code(404);
echo json_encode(['error' => 'Song not found']);
?>
