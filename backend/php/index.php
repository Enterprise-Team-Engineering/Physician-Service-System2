<?php

$config = require __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

try {
    $pdo = connect_database($config);
    $method = $_SERVER['REQUEST_METHOD'];
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $path = preg_replace('#^/api#', '', $path);
    $path = rtrim($path, '/') ?: '/';
    $body = request_body();

    if ($method === 'POST' && $path === '/login') {
        json_response(login($pdo, $config, $body));
    }

    $userId = require_user($pdo, $config);

    if ($method === 'GET' && $path === '/bootstrap') {
        json_response(snapshot($pdo));
    }
    if ($method === 'POST' && $path === '/assignments') {
        assign_patient($pdo, $body);
        json_response(snapshot($pdo));
    }
    if ($method === 'POST' && $path === '/consultations/accept') {
        accept_consultation($pdo, $body);
        json_response(snapshot($pdo));
    }
    if ($method === 'POST' && $path === '/consultations/end') {
        end_consultation($pdo, $body);
        json_response(snapshot($pdo));
    }
    if ($method === 'POST' && $path === '/messages') {
        send_message($pdo, $body);
        json_response(snapshot($pdo));
    }
    if ($method === 'POST' && $path === '/records') {
        $record = save_record($pdo, $body);
        json_response(['record' => $record, 'data' => snapshot($pdo)]);
    }
    if ($method === 'POST' && $path === '/orders') {
        add_order($pdo, $body);
        json_response(snapshot($pdo));
    }
    if ($method === 'POST' && $path === '/records/review') {
        review_record($pdo, $body);
        json_response(snapshot($pdo));
    }

    fail(404, 'API route was not found');
} catch (PDOException $exception) {
    fail(500, 'Database request failed');
}

function connect_database(array $config): PDO
{
    $pdo = new PDO(
        sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $config['host'], $config['port'], $config['database']),
        $config['username'],
        $config['password'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
    $column = $pdo->query("SHOW COLUMNS FROM consultation_message LIKE 'content'")->fetch();
    if ($column && stripos($column['Type'], 'mediumtext') === false) {
        $pdo->exec('ALTER TABLE consultation_message MODIFY content MEDIUMTEXT NOT NULL');
    }
    return $pdo;
}

function request_body(): array
{
    $decoded = json_decode(file_get_contents('php://input') ?: '{}', true);
    return is_array($decoded) ? $decoded : [];
}

function json_response($payload): void
{
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function fail(int $status, string $message): void
{
    http_response_code($status);
    json_response(['message' => $message]);
}

function login(PDO $pdo, array $config, array $body): array
{
    $username = strtolower(trim((string)($body['username'] ?? '')));
    $password = (string)($body['password'] ?? '');
    $statement = $pdo->prepare(
        'SELECT u.user_id, u.username, u.password, u.real_name, u.department_id, r.role_code, r.role_name, d.id AS doctor_id
         FROM t_user u
         JOIN t_user_role ur ON ur.user_id = u.user_id
         JOIN t_role r ON r.role_id = ur.role_id
         LEFT JOIN doctor_info d ON d.user_id = u.user_id
         WHERE u.username = ? AND u.status = \'1\'
         LIMIT 1'
    );
    $statement->execute([$username]);
    $row = $statement->fetch();
    if (!$row || !hash_equals($row['password'], password_hash_febs($username, $password))) {
        fail(401, 'Invalid username or password.');
    }
    $user = public_user($row);
    return ['token' => issue_token($config, (int)$row['user_id']), 'user' => $user];
}

function password_hash_febs(string $username, string $password): string
{
    $salt = strtolower($username) . $password;
    $hash = md5($salt . $password, true);
    $hash = md5($hash, true);
    return bin2hex($hash);
}

function issue_token(array $config, int $userId): string
{
    $payload = rtrim(strtr(base64_encode(json_encode(['uid' => $userId, 'exp' => time() + 86400])), '+/', '-_'), '=');
    $signature = hash_hmac('sha256', $payload, $config['token_secret']);
    return $payload . '.' . $signature;
}

function require_user(PDO $pdo, array $config): int
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if ($header === '' && function_exists('getallheaders')) {
        $headers = getallheaders();
        $header = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    }
    if (!preg_match('/Bearer\s+(\S+)/', $header, $matches)) {
        fail(401, 'Please sign in again.');
    }
    $parts = explode('.', $matches[1], 2);
    if (count($parts) !== 2 || !hash_equals(hash_hmac('sha256', $parts[0], $config['token_secret']), $parts[1])) {
        fail(401, 'Please sign in again.');
    }
    $payload = json_decode(base64_decode(strtr($parts[0], '-_', '+/')), true);
    if (!is_array($payload) || (int)($payload['exp'] ?? 0) < time()) {
        fail(401, 'Please sign in again.');
    }
    $statement = $pdo->prepare('SELECT user_id FROM t_user WHERE user_id = ? AND status = \'1\'');
    $statement->execute([(int)$payload['uid']]);
    if (!$statement->fetch()) {
        fail(401, 'Please sign in again.');
    }
    return (int)$payload['uid'];
}

function public_user(array $row): array
{
    $userId = (int)$row['user_id'];
    return [
        'id' => $row['doctor_id'] === null ? $userId : (int)$row['doctor_id'],
        'userId' => $userId,
        'username' => $row['username'],
        'name' => $row['real_name'],
        'roleCode' => $row['role_code'],
        'roleName' => $row['role_name'],
        'departmentId' => (int)$row['department_id'],
        'avatar' => 'default.jpg',
    ];
}

function snapshot(PDO $pdo): array
{
    return [
        'doctors' => array_map(function ($row) {
            return [
                'id' => (int)$row['id'],
                'name' => $row['name'],
                'departmentId' => (int)$row['departmentId'],
                'departmentName' => $row['departmentName'],
                'phone' => $row['phone'],
                'email' => $row['email'],
                'title' => $row['title'],
            ];
        }, $pdo->query(
            'SELECT d.id, d.doctor_name AS name, d.offices_id AS departmentId, o.offices_name AS departmentName,
                    d.phone, d.email, d.doctor_title AS title
             FROM doctor_info d JOIN office_info o ON o.id = d.offices_id ORDER BY d.id'
        )->fetchAll()),
        'patients' => array_map(function ($row) {
            return [
                'id' => (int)$row['id'],
                'name' => $row['name'],
                'gender' => $row['gender'],
                'dateOfBirth' => $row['dateOfBirth'],
                'age' => (int)$row['age'],
                'phone' => $row['phone'],
                'idNumber' => $row['idNumber'],
                'departmentId' => (int)$row['departmentId'],
                'medicalHistory' => $row['medicalHistory'],
                'allergies' => $row['allergies'],
                'primaryDiagnosis' => $row['primaryDiagnosis'],
            ];
        }, $pdo->query(
            'SELECT id, name, gender, date_of_birth AS dateOfBirth, age, phone, patient_code AS idNumber,
                    department_id AS departmentId, medical_history AS medicalHistory, allergies,
                    primary_diagnosis AS primaryDiagnosis
             FROM user_info ORDER BY id'
        )->fetchAll()),
        'assignments' => array_map('map_assignment', $pdo->query(
            'SELECT id, patient_id, doctor_id, department_id, assigned_by, assigned_at, status FROM patient_doctor_assignment ORDER BY id'
        )->fetchAll()),
        'consultations' => array_map('map_consultation', $pdo->query(
            'SELECT id, patient_id, doctor_id, department_id, status, summary, created_at, accepted_at, completed_at FROM consultation ORDER BY id'
        )->fetchAll()),
        'messages' => array_map('map_message', $pdo->query(
            'SELECT id, consultation_id, sender_id, sender_type, message_type, content, created_at FROM consultation_message ORDER BY id'
        )->fetchAll()),
        'medicalRecords' => array_map('map_record', $pdo->query(
            'SELECT id, patient_id, doctor_id, department_id, consultation_id, chief_complaint, history_of_present_illness,
                    diagnosis, treatment_plan, status, reviewed_by, reviewed_at, created_at, updated_at
             FROM medical_record ORDER BY id'
        )->fetchAll()),
        'medicalOrders' => array_map('map_order', $pdo->query(
            'SELECT id, medical_record_id, patient_id, doctor_id, order_type, content, created_at FROM medical_order ORDER BY id'
        )->fetchAll()),
    ];
}

function map_assignment(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'patientId' => (int)$row['patient_id'],
        'doctorId' => (int)$row['doctor_id'],
        'departmentId' => (int)$row['department_id'],
        'assignedBy' => (int)$row['assigned_by'],
        'assignedAt' => $row['assigned_at'],
        'status' => $row['status'],
    ];
}

function map_consultation(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'patientId' => (int)$row['patient_id'],
        'doctorId' => $row['doctor_id'] === null ? null : (int)$row['doctor_id'],
        'departmentId' => (int)$row['department_id'],
        'status' => $row['status'],
        'summary' => $row['summary'],
        'createdAt' => $row['created_at'],
        'acceptedAt' => $row['accepted_at'],
        'completedAt' => $row['completed_at'],
    ];
}

function map_message(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'consultationId' => (int)$row['consultation_id'],
        'senderId' => (int)$row['sender_id'],
        'senderType' => $row['sender_type'],
        'messageType' => $row['message_type'],
        'content' => $row['content'],
        'createdAt' => $row['created_at'],
    ];
}

function map_record(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'patientId' => (int)$row['patient_id'],
        'doctorId' => (int)$row['doctor_id'],
        'departmentId' => (int)$row['department_id'],
        'consultationId' => $row['consultation_id'] === null ? null : (int)$row['consultation_id'],
        'chiefComplaint' => $row['chief_complaint'],
        'historyOfPresentIllness' => $row['history_of_present_illness'],
        'diagnosis' => $row['diagnosis'],
        'treatmentPlan' => $row['treatment_plan'],
        'status' => $row['status'],
        'reviewedBy' => $row['reviewed_by'] === null ? null : (int)$row['reviewed_by'],
        'reviewedAt' => $row['reviewed_at'],
        'createdAt' => $row['created_at'],
        'updatedAt' => $row['updated_at'],
    ];
}

function map_order(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'medicalRecordId' => (int)$row['medical_record_id'],
        'patientId' => (int)$row['patient_id'],
        'doctorId' => (int)$row['doctor_id'],
        'orderType' => $row['order_type'],
        'content' => $row['content'],
        'createdAt' => $row['created_at'],
    ];
}

function assign_patient(PDO $pdo, array $body): void
{
    $patientId = required_int($body, 'patientId');
    $doctorId = required_int($body, 'doctorId');
    $assignedBy = required_int($body, 'assignedBy');
    $pdo->beginTransaction();
    $current = $pdo->prepare('SELECT id FROM patient_doctor_assignment WHERE patient_id = ? AND status = \'ACTIVE\' LIMIT 1');
    $current->execute([$patientId]);
    $existing = $current->fetch();
    if ($existing) {
        $update = $pdo->prepare('UPDATE patient_doctor_assignment SET doctor_id = ?, assigned_by = ?, assigned_at = NOW(), updated_at = NOW() WHERE id = ?');
        $update->execute([$doctorId, $assignedBy, $existing['id']]);
    } else {
        $insert = $pdo->prepare('INSERT INTO patient_doctor_assignment (patient_id, doctor_id, department_id, assigned_by, assigned_at, status, created_at, updated_at) VALUES (?, ?, 1, ?, NOW(), \'ACTIVE\', NOW(), NOW())');
        $insert->execute([$patientId, $doctorId, $assignedBy]);
    }
    $pending = $pdo->prepare('UPDATE consultation SET doctor_id = ?, updated_at = NOW() WHERE patient_id = ? AND status = \'PENDING\'');
    $pending->execute([$doctorId, $patientId]);
    $pdo->commit();
}

function accept_consultation(PDO $pdo, array $body): void
{
    $statement = $pdo->prepare(
        'UPDATE consultation
         SET status = \'ONGOING\', accepted_at = NOW(), doctor_id = IFNULL(doctor_id, ?), updated_at = NOW()
         WHERE id = ? AND status = \'PENDING\''
    );
    $statement->execute([required_int($body, 'doctorId'), required_int($body, 'id')]);
}

function end_consultation(PDO $pdo, array $body): void
{
    $statement = $pdo->prepare(
        'UPDATE consultation SET status = \'COMPLETED\', completed_at = NOW(), updated_at = NOW() WHERE id = ? AND status = \'ONGOING\''
    );
    $statement->execute([required_int($body, 'id')]);
}

function send_message(PDO $pdo, array $body): void
{
    $content = trim((string)($body['content'] ?? ''));
    if ($content === '') {
        fail(400, 'Please enter a message');
    }
    $statement = $pdo->prepare(
        'INSERT INTO consultation_message (consultation_id, sender_id, sender_type, message_type, content, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())'
    );
    $statement->execute([
        required_int($body, 'consultationId'),
        required_int($body, 'senderId'),
        (string)($body['senderType'] ?? 'DOCTOR'),
        (string)($body['messageType'] ?? 'TEXT'),
        $content,
    ]);
}

function save_record(PDO $pdo, array $body): array
{
    $status = (string)($body['status'] ?? 'DRAFT');
    $consultationId = isset($body['consultationId']) && $body['consultationId'] !== '' ? (int)$body['consultationId'] : null;
    $fields = [
        required_int($body, 'patientId'),
        required_int($body, 'doctorId'),
        (int)($body['departmentId'] ?? 1),
        $consultationId,
        (string)($body['chiefComplaint'] ?? ''),
        (string)($body['historyOfPresentIllness'] ?? ''),
        (string)($body['diagnosis'] ?? ''),
        (string)($body['treatmentPlan'] ?? ''),
        $status,
    ];
    if (!empty($body['id'])) {
        $fields[] = (int)$body['id'];
        $statement = $pdo->prepare(
            'UPDATE medical_record
             SET patient_id = ?, doctor_id = ?, department_id = ?, consultation_id = ?, chief_complaint = ?,
                 history_of_present_illness = ?, diagnosis = ?, treatment_plan = ?, status = ?, updated_at = NOW()
             WHERE id = ?'
        );
        $statement->execute($fields);
        $id = (int)$body['id'];
    } else {
        $statement = $pdo->prepare(
            'INSERT INTO medical_record
             (patient_id, doctor_id, department_id, consultation_id, chief_complaint, history_of_present_illness,
              diagnosis, treatment_plan, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())'
        );
        $statement->execute($fields);
        $id = (int)$pdo->lastInsertId();
    }
    $loaded = $pdo->prepare(
        'SELECT id, patient_id, doctor_id, department_id, consultation_id, chief_complaint, history_of_present_illness,
                diagnosis, treatment_plan, status, reviewed_by, reviewed_at, created_at, updated_at
         FROM medical_record WHERE id = ?'
    );
    $loaded->execute([$id]);
    return map_record($loaded->fetch());
}

function add_order(PDO $pdo, array $body): void
{
    $content = trim((string)($body['content'] ?? ''));
    if ($content === '') {
        fail(400, 'Please enter the medical order content');
    }
    $statement = $pdo->prepare(
        'INSERT INTO medical_order (medical_record_id, patient_id, doctor_id, order_type, content, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())'
    );
    $statement->execute([
        required_int($body, 'medicalRecordId'),
        required_int($body, 'patientId'),
        required_int($body, 'doctorId'),
        (string)($body['orderType'] ?? 'OTHER'),
        $content,
    ]);
}

function review_record(PDO $pdo, array $body): void
{
    $statement = $pdo->prepare(
        'UPDATE medical_record
         SET status = \'REVIEWED\', reviewed_by = ?, reviewed_at = NOW(), updated_at = NOW()
         WHERE id = ?'
    );
    $statement->execute([required_int($body, 'reviewedBy'), required_int($body, 'id')]);
}

function required_int(array $body, string $key): int
{
    if (!isset($body[$key]) || $body[$key] === '' || !is_numeric($body[$key])) {
        fail(400, 'Missing ' . $key);
    }
    return (int)$body[$key];
}
