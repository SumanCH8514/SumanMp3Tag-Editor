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
    
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
    $domain = $_SERVER['HTTP_HOST'];
    $path = dirname($_SERVER['REQUEST_URI']);
    $baseUrl = "$protocol://$domain$path/";

    foreach ($jsonFiles as $jsonFile) {
        $content = file_get_contents($jsonFile);
        if ($content) {
            $data = json_decode($content, true);
            if ($data) {
                // Ensure MP3 file exists in mp3 directory
                if (file_exists($mp3Dir . $data['filename'])) {
                    // Add ID (basename of JSON file) for deletion purposes
                    $data['id'] = pathinfo($jsonFile, PATHINFO_FILENAME);
                    
                    // Dynamically fix URLs based on current host
                    if (isset($data['url']) && !filter_var($data['url'], FILTER_VALIDATE_URL)) {
                        $data['url'] = $baseUrl . $data['url'];
                    }
                    if (isset($data['coverUrl']) && $data['coverUrl'] && !filter_var($data['coverUrl'], FILTER_VALIDATE_URL)) {
                        $data['coverUrl'] = $baseUrl . $data['coverUrl'];
                    }
                    
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
