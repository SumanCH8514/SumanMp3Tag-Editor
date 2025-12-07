<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

// Configuration
$baseDir = 'uploads/';
$mp3Dir = $baseDir . 'mp3/';
$coversDir = $baseDir . 'covers/';
$dataDir = $baseDir . 'data/';

$allowedTypes = ['audio/mpeg', 'audio/mp3'];
$maxSize = 50 * 1024 * 1024; // 50MB

// Create upload directories if they don't exist
if (!file_exists($mp3Dir)) mkdir($mp3Dir, 0755, true);
if (!file_exists($coversDir)) mkdir($coversDir, 0755, true);
if (!file_exists($dataDir)) mkdir($dataDir, 0755, true);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_FILES['file'])) {
        $file = $_FILES['file'];
        
        // Validate error
        if ($file['error'] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            echo json_encode(['error' => 'File upload error code: ' . $file['error']]);
            exit;
        }

        // Validate type
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        if (!in_array($mimeType, $allowedTypes) && !str_ends_with(strtolower($file['name']), '.mp3')) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid file type. Only MP3 allowed.']);
            exit;
        }

        // Validate size
        if ($file['size'] > $maxSize) {
            http_response_code(400);
            echo json_encode(['error' => 'File too large. Max size is 50MB.']);
            exit;
        }

        // Generate unique filename
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $basename = pathinfo($file['name'], PATHINFO_FILENAME);
        // Sanitize basename
        $basename = preg_replace('/[^a-zA-Z0-9_-]/', '_', $basename);
        $filename = $basename . '_' . uniqid() . '.' . $extension;
        $targetPath = $mp3Dir . $filename;

        // Move file
        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
            $domain = $_SERVER['HTTP_HOST'];
            $path = dirname($_SERVER['REQUEST_URI']);
            $url = "$protocol://$domain$path/$targetPath";
            
            // Handle Cover Upload
            $coverUrl = null;
            if (isset($_FILES['cover']) && $_FILES['cover']['error'] === UPLOAD_ERR_OK) {
                $coverFile = $_FILES['cover'];
                $coverExt = pathinfo($coverFile['name'], PATHINFO_EXTENSION);
                if (!$coverExt) $coverExt = 'jpg'; // Default to jpg if missing
                
                // Basic validation for images
                $coverMime = mime_content_type($coverFile['tmp_name']);
                if (strpos($coverMime, 'image/') === 0) {
                    $coverName = 'cover_' . $basename . '_' . uniqid() . '.' . $coverExt;
                    $coverPath = $coversDir . $coverName;
                    
                    if (move_uploaded_file($coverFile['tmp_name'], $coverPath)) {
                        $coverUrl = "$protocol://$domain$path/$coverPath";
                    }
                }
            }
            
            // Save metadata if provided
            if (isset($_POST['metadata'])) {
                $metadata = json_decode($_POST['metadata'], true);
                if ($metadata) {
                    $jsonFilename = $basename . '_' . uniqid() . '.json';
                    $jsonPath = $dataDir . $jsonFilename;
                    
                    // Add file info to metadata
                    $metadata['filename'] = $filename;
                    $metadata['url'] = $url;
                    $metadata['coverUrl'] = $coverUrl;
                    $metadata['uploadDate'] = date('Y-m-d H:i:s');
                    
                    file_put_contents($jsonPath, json_encode($metadata, JSON_PRETTY_PRINT));
                }
            }

            echo json_encode([
                'success' => true,
                'url' => $url,
                'filename' => $filename
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to move uploaded file.']);
        }
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'No file uploaded.']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed.']);
}
?>
