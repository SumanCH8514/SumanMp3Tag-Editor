<?php
header('Access-Control-Allow-Origin: *');
header('Cross-Origin-Resource-Policy: cross-origin');
header('Content-Type: application/json');

$baseDir = 'uploads/';
$mp3Dir = $baseDir . 'mp3/';
$dataDir = $baseDir . 'data/';

$files = [];

if (file_exists($dataDir)) {
    $jsonFiles = glob($dataDir . '*.json');

    foreach ($jsonFiles as $jsonFile) {
        $content = file_get_contents($jsonFile);
        if ($content) {
            $data = json_decode($content, true);
            if ($data) {
                if (file_exists($mp3Dir . $data['filename'])) {
                    $data['id'] = pathinfo($jsonFile, PATHINFO_FILENAME);
                    
                    if (isset($data['url'])) {
                        $data['url'] = 'uploads/mp3/' . basename($data['url']);
                    }
                    if (isset($data['coverUrl']) && $data['coverUrl']) {
                        $data['coverUrl'] = 'uploads/covers/' . basename($data['coverUrl']);
                    }
                    
                    $files[] = $data;
                }
            }
        }
    }
}

usort($files, function($a, $b) {
    return strtotime($b['uploadDate']) - strtotime($a['uploadDate']);
});

echo json_encode(['files' => $files]);
?>
