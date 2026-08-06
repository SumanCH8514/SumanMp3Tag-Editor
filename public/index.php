<?php
header('Access-Control-Allow-Origin: *');
header('Cross-Origin-Resource-Policy: cross-origin');

$playId = isset($_GET['play']) ? preg_replace('/[^a-zA-Z0-9_-]/', '', $_GET['play']) : (isset($_GET['id']) ? preg_replace('/[^a-zA-Z0-9_-]/', '', $_GET['id']) : '');

$pageTitle = "SumanMp3Tag Editor - Online MP3 Tag & Cover Art Editor";
$siteName = "SumanMp3Tag Player";
$description = "Edit MP3 ID3 tags, title, artist, album, cover art watermarks online.";
$coverUrl = "";

$isSecure = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');
$protocol = $isSecure ? 'https' : 'http';
$host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'localhost';
$uriDir = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\');
$baseUrl = $protocol . '://' . $host . $uriDir;

if (!empty($playId)) {
    $jsonFile = __DIR__ . '/uploads/data/' . $playId . '.json';
    if (file_exists($jsonFile)) {
        $content = file_get_contents($jsonFile);
        if ($content) {
            $data = json_decode($content, true);
            if ($data) {
                $title = !empty($data['title']) ? $data['title'] : (!empty($data['filename']) ? $data['filename'] : 'Shared Track');
                $artist = !empty($data['artist']) ? $data['artist'] : 'Unknown Artist';
                $album = !empty($data['album']) ? $data['album'] : '';
                $year = !empty($data['year']) ? $data['year'] : '';

                $pageTitle = $title . ' - ' . $artist . ' | SumanMp3Tag';
                $description = $artist . ($album ? ' • ' . $album : '') . ($year ? ' • ' . $year : '') . ' | Stream & Download on SumanMp3Tag Player';

                if (!empty($data['coverUrl'])) {
                    $coverFilename = basename($data['coverUrl']);
                    $coverUrl = $baseUrl . '/uploads/covers/' . $coverFilename;
                }
            }
        }
    }
}

if (empty($coverUrl)) {
    $coverUrl = $baseUrl . '/project_poster.png';
}

$requestUri = $_SERVER['REQUEST_URI'];
$fullUrl = $protocol . '://' . $host . $requestUri;

$htmlFile = __DIR__ . '/index.html';
if (!file_exists($htmlFile)) {
    $htmlFile = __DIR__ . '/../dist/index.html';
}

if (file_exists($htmlFile)) {
    $html = file_get_contents($htmlFile);

    $metaTags = '
    <title>' . htmlspecialchars($pageTitle) . '</title>
    <meta name="title" content="' . htmlspecialchars($pageTitle) . '" />
    <meta name="description" content="' . htmlspecialchars($description) . '" />
    <meta property="og:type" content="music.song" />
    <meta property="og:url" content="' . htmlspecialchars($fullUrl) . '" />
    <meta property="og:site_name" content="' . htmlspecialchars($siteName) . '" />
    <meta property="og:title" content="' . htmlspecialchars($pageTitle) . '" />
    <meta property="og:description" content="' . htmlspecialchars($description) . '" />
    <meta property="og:image" content="' . htmlspecialchars($coverUrl) . '" />
    <meta property="og:image:secure_url" content="' . htmlspecialchars($coverUrl) . '" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="600" />
    <meta property="og:image:height" content="600" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="' . htmlspecialchars($fullUrl) . '" />
    <meta name="twitter:title" content="' . htmlspecialchars($pageTitle) . '" />
    <meta name="twitter:description" content="' . htmlspecialchars($description) . '" />
    <meta name="twitter:image" content="' . htmlspecialchars($coverUrl) . '" />';

    $html = preg_replace('/<title>.*?<\/title>/s', '', $html);
    $html = preg_replace('/<meta\s+property="og:[^"]*"\s+content="[^"]*"\s*\/?>/i', '', $html);
    $html = preg_replace('/<meta\s+name="twitter:[^"]*"\s+content="[^"]*"\s*\/?>/i', '', $html);
    $html = preg_replace('/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i', '', $html);

    $html = str_replace('<head>', '<head>' . $metaTags, $html);
    echo $html;
    exit;
}

echo "SumanMp3Tag Player";
?>
