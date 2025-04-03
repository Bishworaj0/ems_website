<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header("Content-Type: application/json");

// === DB CONNECTION ===
$host = "localhost";
$port = "8889";
$db_name = "ems";
$db_user = "root";
$db_pass = "root";

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db_name;charset=utf8", $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    exit(json_encode(["error" => "DB Connection Error: " . $e->getMessage()]));
}

// === ROUTING ===
$requestUri = $_SERVER['PATH_INFO'] ?? str_replace($_SERVER['SCRIPT_NAME'], '', $_SERVER['REQUEST_URI']);
$request = explode('/', trim($requestUri, '/'));
$resource = array_shift($request);
$id = $request[0] ?? null;

function respond($status, $data) {
    http_response_code($status);
    exit(json_encode($data));
}

// === RESOURCE SWITCH ===
switch ($resource) {

    // === REMINDERS ===
    case 'reminders':
        switch ($_SERVER['REQUEST_METHOD']) {
            case 'GET':
                if ($id) {
                    $stmt = $pdo->prepare("SELECT * FROM reminders WHERE id = ?");
                    $stmt->execute([$id]);
                    $item = $stmt->fetch(PDO::FETCH_ASSOC);
                    $item ? respond(200, $item) : respond(404, ["error" => "Reminder not found"]);
                } else {
                    $stmt = $pdo->query("SELECT * FROM reminders");
                    respond(200, $stmt->fetchAll(PDO::FETCH_ASSOC));
                }
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                if (!isset($data['title'])) respond(400, ["error" => "Title required"]);
                $stmt = $pdo->prepare("INSERT INTO reminders (title, date_time, notes, completed) VALUES (?, ?, ?, ?)");
                $stmt->execute([
                    $data['title'],
                    $data['dateTime'] ?? '',
                    $data['notes'] ?? '',
                    $data['completed'] ?? 0
                ]);
                respond(201, ["message" => "Reminder created", "id" => $pdo->lastInsertId()]);
                break;

            case 'PUT':
                if (!$id) respond(400, ["error" => "Reminder ID required"]);
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("UPDATE reminders SET title = ?, date_time = ?, notes = ?, completed = ? WHERE id = ?");
                $stmt->execute([
                    $data['title'] ?? '',
                    $data['dateTime'] ?? '',
                    $data['notes'] ?? '',
                    $data['completed'] ?? 0,
                    $id
                ]);
                respond(200, ["message" => "Reminder updated"]);
                break;

            case 'DELETE':
                if (!$id) respond(400, ["error" => "Reminder ID required"]);
                $stmt = $pdo->prepare("DELETE FROM reminders WHERE id = ?");
                $stmt->execute([$id]);
                respond(200, ["message" => "Reminder deleted"]);
                break;

            default:
                respond(405, ["error" => "Method not allowed"]);
        }
        break;

    // === ACCOUNTS ===
    case 'accounts':
        switch ($_SERVER['REQUEST_METHOD']) {
            case 'GET':
                if ($id) {
                    $stmt = $pdo->prepare("SELECT * FROM accounts WHERE id = ?");
                    $stmt->execute([$id]);
                    $item = $stmt->fetch(PDO::FETCH_ASSOC);
                    $item ? respond(200, $item) : respond(404, ["error" => "Account not found"]);
                } else {
                    $stmt = $pdo->query("SELECT * FROM accounts");
                    respond(200, $stmt->fetchAll(PDO::FETCH_ASSOC));
                }
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                if (!isset($data['name'])) respond(400, ["error" => "Name required"]);
                $stmt = $pdo->prepare("INSERT INTO accounts (name, account_type, balance, notes) VALUES (?, ?, ?, ?)");
                $stmt->execute([
                    $data['name'],
                    $data['account_type'] ?? '',
                    $data['balance'] ?? 0,
                    $data['notes'] ?? ''
                ]);
                respond(201, ["message" => "Account created", "id" => $pdo->lastInsertId()]);
                break;

            case 'PUT':
                if (!$id) respond(400, ["error" => "Account ID required"]);
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("UPDATE accounts SET name = ?, account_type = ?, balance = ?, notes = ? WHERE id = ?");
                $stmt->execute([
                    $data['name'] ?? '',
                    $data['account_type'] ?? '',
                    $data['balance'] ?? 0,
                    $data['notes'] ?? '',
                    $id
                ]);
                respond(200, ["message" => "Account updated"]);
                break;

            case 'DELETE':
                if (!$id) respond(400, ["error" => "Account ID required"]);
                $stmt = $pdo->prepare("DELETE FROM accounts WHERE id = ?");
                $stmt->execute([$id]);
                respond(200, ["message" => "Account deleted"]);
                break;

            default:
                respond(405, ["error" => "Method not allowed"]);
        }
        break;

    // === USERS ===
    case 'users':
        switch ($_SERVER['REQUEST_METHOD']) {
            case 'GET':
                $stmt = $pdo->query("SELECT id, username, role FROM users");
                respond(200, $stmt->fetchAll(PDO::FETCH_ASSOC));
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                if (!isset($data['username'], $data['password'])) {
                    respond(400, ["error" => "Username and password required"]);
                }
                $hash = password_hash($data['password'], PASSWORD_DEFAULT);
                $stmt = $pdo->prepare("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)");
                $stmt->execute([
                    $data['username'],
                    $hash,
                    $data['role'] ?? 'user'
                ]);
                respond(201, ["message" => "User created"]);
                break;

            default:
                respond(405, ["error" => "Method not allowed"]);
        }
        break;

    // === DEFAULT (NOT FOUND) ===
    default:
        respond(404, ["error" => "Resource not found"]);
}
?>