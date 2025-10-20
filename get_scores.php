<?php
header('Content-Type: application/json');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

$file = __DIR__ . DIRECTORY_SEPARATOR . 'leaderboard.json';
if (!file_exists($file)) {
    echo json_encode([]);
    exit;
}

$raw = @file_get_contents($file);
$scores = [];
if ($raw !== false) {
    $decoded = json_decode($raw, true);
    if (is_array($decoded)) {
        // Clean: only keep name + score
        foreach ($decoded as $entry) {
            $scores[] = [
                'name' => $entry['name'] ?? 'Player',
                'score' => intval($entry['score'] ?? 0)
            ];
        }
    }
}

echo json_encode($scores);
?>
