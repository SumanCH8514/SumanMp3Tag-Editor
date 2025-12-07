<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

$baseDir = 'uploads/';
$mp3Dir = $baseDir . 'mp3/';
$dataDir = $baseDir . 'data/';

$files = [];

if (file_exists($dataDir)) {
    // Scan for JSON files in data directory
    $jsonFiles = glob($dataDir . '*.json');
    
    foreach ($jsonFiles as $jsonFile) {
        $content = file_get_contents($jsonFile);
        if ($content) {
            $data = json_decode($content, true);
            if ($data) {
                // Ensure MP3 file exists in mp3 directory
                if (file_exists($mp3Dir . $data['filename'])) {
                    // Add ID (basename of JSON file) for deletion purposes
                    $data['id'] = pathinfo($jsonFile, PATHINFO_FILENAME);
                    $files[] = $data;
                }
            }
        }
    }
}

// Sort by uploadDate descending (newest first)
usort($files, function($a, $b) {
    return strtotime($b['uploadDate']) - strtotime($a['uploadDate']);
});

echo json_encode(['files' => $files]);
?>
