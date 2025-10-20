<?php
// Simple JSON-based leaderboard storage
// Writes to leaderboard.json in the same directory

header('Content-Type: application/json');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// Allow both JSON body and form-encoded
$raw = file_get_contents('php://input');
$data = [];
if ($raw) {
    $json = json_decode($raw, true);
    if (is_array($json)) { $data = $json; }
}
if (empty($data)) {
    $data = $_POST;
}

$name = isset($data['name']) ? trim($data['name']) : 'Player';
$score = isset($data['score']) ? intval($data['score']) : 0;

// Basic validation
if ($name === '') { $name = 'Player'; }
if ($score < 0) { $score = 0; }

$file = __DIR__ . DIRECTORY_SEPARATOR . 'leaderboard.json';

// Ensure file exists
if (!file_exists($file)) {
    file_put_contents($file, json_encode([]));
}

// Load existing
$existing = [];
$rawExisting = @file_get_contents($file);
if ($rawExisting !== false) {
    $decoded = json_decode($rawExisting, true);
    if (is_array($decoded)) { $existing = $decoded; }
}

// Update score if player already exists
$found = false;
foreach ($existing as &$entry) {
    if ($entry['name'] === $name) {
        // ✅ only update if new score is higher
        if ($score > $entry['score']) {
            $entry['score'] = $score;
        }
        $found = true;
        break;
    }
}
unset($entry);

if (!$found) {
    $existing[] = [ 'name' => $name, 'score' => $score ];
}



// Sort desc by score, then by name just in case
usort($existing, function($a, $b) {
    $sa = isset($a['score']) ? intval($a['score']) : 0;
    $sb = isset($b['score']) ? intval($b['score']) : 0;
    if ($sa === $sb) {
        return strcmp($a['name'], $b['name']); // alphabet tie-break
    }
    return $sb <=> $sa;
});

// Keep top 100
$existing = array_slice($existing, 0, 100);

// Persist
file_put_contents($file, json_encode($existing, JSON_PRETTY_PRINT));

echo json_encode([ 'ok' => true, 'scores' => $existing ]);
?>
