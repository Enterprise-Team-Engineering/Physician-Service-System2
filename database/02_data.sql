-- Physician Service System
-- 示例数据。先执行 01_schema.sql。
--
--   mysql -u root -p < 02_data.sql
--
-- 密码在库里是哈希值，明文如下（与当前网站演示账号一致）：
--   doctor / 123456    张医生 Dr. Zhang
--   wilson / 123456    威尔逊医生 Dr. Wilson（网站演示登录页暂未使用）
--   admin  / admin123  内科科室管理员
--
-- 数据关系：
-- 市立综合医院
--   └── 内科
--         ├── Dr. Zhang 负责 Robert、Linda、Michael
--         ├── Dr. Wilson 负责 Susan
--         └── Emily 尚未分配，正在问诊队列中等待
-- Linda 的问诊已结束，病历已由管理员审核。
-- Robert 的问诊仍在进行，病历已提交、待审核。
-- Susan 是随访病历，没有对应问诊，已提交、待审核。
-- Michael 已分配给张医生，问诊尚未接诊。

USE physician_service;
SET NAMES utf8mb4;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE medical_order;
TRUNCATE TABLE medical_record;
TRUNCATE TABLE consultation_message;
TRUNCATE TABLE consultation;
TRUNCATE TABLE patient_doctor_assignment;
TRUNCATE TABLE doctor_info;
TRUNCATE TABLE user_info;
TRUNCATE TABLE t_role_menu;
TRUNCATE TABLE t_menu;
TRUNCATE TABLE t_user_role;
TRUNCATE TABLE t_user;
TRUNCATE TABLE office_info;
TRUNCATE TABLE hospital_info;
TRUNCATE TABLE t_role;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO t_role (role_id, role_code, role_name, remark) VALUES
  (1, 'DOCTOR', 'Doctor', 'Accept consultations and write medical records'),
  (2, 'DEPT_ADMIN', 'Department Admin', 'Assign patients and review medical records');

INSERT INTO hospital_info (id, hospital_name, phone, address) VALUES
  (1, 'City General Hospital', '010-60000000', '88 Health Road');

INSERT INTO office_info (id, hospital_id, offices_name) VALUES
  (1, 1, 'Internal Medicine');

INSERT INTO t_user (user_id, username, password, real_name, department_id, email, mobile, status, create_time) VALUES
  (201, 'doctor', 'f92369da6ff2dc2ee12a045fe5ec5db1', 'Dr. Zhang', 1, 'doctor.zhang@example.com', '13800001001', '1', '2026-01-06 09:00:00'),
  (202, 'wilson', '61e49e31dbc7249759785fc6ca875186', 'Dr. Wilson', 1, 'doctor.wilson@example.com', '13800001002', '1', '2026-01-06 09:05:00'),
  (301, 'admin', '6c425eda513f46dcaf55290fc51b4ca5', 'Internal Medicine Department Admin', 1, 'admin.internal@example.com', '13800002001', '1', '2026-01-06 09:10:00');

INSERT INTO t_user_role (user_id, role_id) VALUES
  (201, 1),
  (202, 1),
  (301, 2);

-- 医生和科室管理员共用工作台、个人资料
INSERT INTO t_menu (menu_id, parent_id, menu_name, path, component, icon, visible, order_num) VALUES
  (10, NULL, 'Dashboard', '/app/dashboard', 'demo/Dashboard', 'dashboard', 1, 1),
  (50, NULL, 'Personal Profile', '/app/profile', 'demo/PersonalProfile', 'idcard', 1, 5);

-- 医生菜单
INSERT INTO t_menu (menu_id, parent_id, menu_name, path, component, icon, visible, order_num) VALUES
  (20, NULL, 'Patient Management', '/app/patients', 'PageView', 'team', 1, 2),
  (21, 20, 'My Patients', '/app/patients/mine', 'demo/MyPatients', 'user', 1, 1),
  (22, 20, 'Patient Search', '/app/patients/search', 'demo/PatientSearch', 'search', 1, 2),
  (23, 20, 'Patient Profile', '/app/patients/:id', 'demo/PatientProfile', 'none', 0, 3),
  (30, NULL, 'Online Consultation', '/app/consultations', 'PageView', 'message', 1, 3),
  (31, 30, 'Consultation Queue', '/app/consultations/queue', 'demo/ConsultationQueue', 'clock-circle', 1, 1),
  (32, 30, 'Consultation History', '/app/consultations/history', 'demo/ConsultationHistory', 'history', 1, 2),
  (33, 30, 'Consultation Chat', '/app/consultations/:id/chat', 'demo/ConsultationChat', 'none', 0, 3),
  (40, NULL, 'Medical Records', '/app/records', 'PageView', 'file-text', 1, 4),
  (41, 40, 'Patient Records', '/app/records/list', 'demo/MedicalRecords', 'solution', 1, 1),
  (42, 40, 'Create Medical Record', '/app/records/create/:patientId', 'demo/MedicalRecordForm', 'none', 0, 2),
  (43, 40, 'Medical Record', '/app/records/:id', 'demo/MedicalRecordForm', 'none', 0, 3);

-- 科室管理员菜单
INSERT INTO t_menu (menu_id, parent_id, menu_name, path, component, icon, visible, order_num) VALUES
  (70, NULL, 'Patient Management', '/app/patients', 'PageView', 'team', 1, 2),
  (71, 70, 'Department Patients', '/app/patients/department', 'demo/PatientSearch', 'database', 1, 1),
  (72, 70, 'Patient Assignment', '/app/patients/assignment', 'demo/PatientAssignment', 'user-add', 1, 2),
  (73, 70, 'Patient Profile', '/app/patients/:id', 'demo/PatientProfile', 'none', 0, 3),
  (80, NULL, 'Department Management', '/app/department', 'PageView', 'apartment', 1, 3),
  (81, 80, 'Doctors', '/app/department/doctors', 'demo/Doctors', 'medicine-box', 1, 1),
  (90, NULL, 'Medical Records', '/app/records', 'PageView', 'file-text', 1, 4),
  (91, 90, 'Medical Record Review', '/app/records/review', 'demo/MedicalRecordReview', 'audit', 1, 1),
  (92, 90, 'Medical Record', '/app/records/:id', 'demo/MedicalRecordForm', 'none', 0, 2);

INSERT INTO t_role_menu (role_id, menu_id) VALUES
  (1, 10), (1, 20), (1, 21), (1, 22), (1, 23),
  (1, 30), (1, 31), (1, 32), (1, 33),
  (1, 40), (1, 41), (1, 42), (1, 43), (1, 50),
  (2, 10), (2, 50),
  (2, 70), (2, 71), (2, 72), (2, 73),
  (2, 80), (2, 81),
  (2, 90), (2, 91), (2, 92);

INSERT INTO doctor_info (id, user_id, doctor_name, code, hospital_id, offices_id, phone, email, doctor_title, status) VALUES
  (201, 201, 'Dr. Zhang', 'DT-201', 1, 1, '13800001001', 'doctor.zhang@example.com', 'Attending Physician', 'Available'),
  (202, 202, 'Dr. Wilson', 'DT-202', 1, 1, '13800001002', 'doctor.wilson@example.com', 'Associate Chief Physician', 'Available');

INSERT INTO user_info (id, patient_code, name, gender, date_of_birth, age, phone, department_id, medical_history, allergies, primary_diagnosis, status, create_date) VALUES
  (1001, 'P100001', 'Emily Johnson', 'Female', '1958-05-12', 68, '13800000001', 1, 'Hypertension for 8 years', 'Penicillin', 'Hypertension', '1', '2026-09-20 10:00:00'),
  (1002, 'P100002', 'Robert Smith', 'Male', '1972-03-21', 54, '13800000002', 1, 'Type 2 diabetes for 5 years', 'None known', 'Type 2 diabetes', '1', '2026-09-18 10:00:00'),
  (1003, 'P100003', 'Linda Brown', 'Female', '1984-11-06', 41, '13800000003', 1, 'Seasonal asthma', 'Sulfonamides', 'Bronchial asthma', '1', '2026-09-16 10:00:00'),
  (1004, 'P100004', 'Michael Davis', 'Male', '1990-07-14', 36, '13800000004', 1, 'No significant medical history', 'Penicillin', 'Acute pharyngitis', '1', '2026-09-22 10:00:00'),
  (1005, 'P100005', 'Susan Wilson', 'Female', '1966-01-30', 60, '13800000005', 1, 'Hyperlipidemia for 3 years', 'Aspirin', 'Hyperlipidemia', '1', '2026-09-15 10:00:00');

-- 管理员 301 做的分配。Emily（1001）还没有分配记录
INSERT INTO patient_doctor_assignment (id, patient_id, doctor_id, department_id, assigned_by, assigned_at, status, created_at, updated_at) VALUES
  (1, 1002, 201, 1, 301, '2026-09-28 08:30:00', 'ACTIVE', '2026-09-28 08:30:00', '2026-09-28 08:30:00'),
  (2, 1003, 201, 1, 301, '2026-09-27 14:10:00', 'ACTIVE', '2026-09-27 14:10:00', '2026-09-27 14:10:00'),
  (3, 1004, 201, 1, 301, '2026-09-26 09:45:00', 'ACTIVE', '2026-09-26 09:45:00', '2026-09-26 09:45:00'),
  (4, 1005, 202, 1, 301, '2026-09-25 11:20:00', 'ACTIVE', '2026-09-25 11:20:00', '2026-09-25 11:20:00');

-- 3001 Emily 未分配，医生为空
-- 3004 Michael 已分配给张医生，但尚未点击接诊，所以 accepted_at 为空
INSERT INTO consultation (id, patient_id, doctor_id, department_id, status, summary, created_at, accepted_at, completed_at, updated_at) VALUES
  (3001, 1001, NULL, 1, 'PENDING', 'Persistent cough and mild fever.', '2026-09-28 09:20:00', NULL, NULL, '2026-09-28 09:20:00'),
  (3002, 1002, 201, 1, 'ONGOING', 'Elevated fasting blood glucose.', '2026-09-28 08:40:00', '2026-09-28 08:45:00', NULL, '2026-09-28 08:47:00'),
  (3003, 1003, 201, 1, 'COMPLETED', 'Shortness of breath after exercise.', '2026-09-26 13:00:00', '2026-09-26 13:04:00', '2026-09-26 13:25:00', '2026-09-26 13:25:00'),
  (3004, 1004, 201, 1, 'PENDING', 'Sore throat, dry cough and a low-grade fever.', '2026-09-28 10:05:00', NULL, NULL, '2026-09-28 10:05:00');

INSERT INTO consultation_message (id, consultation_id, sender_id, sender_type, message_type, content, created_at) VALUES
  (1, 3001, 1001, 'PATIENT', 'TEXT', 'I have had a cough for five days.', '2026-09-28 09:21:00'),
  (2, 3002, 1002, 'PATIENT', 'TEXT', 'My fasting glucose was 9.2 mmol/L this morning.', '2026-09-28 08:41:00'),
  (3, 3002, 201, 'DOCTOR', 'TEXT', 'Please tell me what you ate last night and list your current medication.', '2026-09-28 08:47:00'),
  (4, 3004, 1004, 'PATIENT', 'TEXT', 'Hello doctor. I have a sore throat, a dry cough, and felt slightly feverish last night.', '2026-09-28 10:05:00');

-- 4001 来自已结束的问诊 3003，管理员已审核
-- 4002 来自进行中的问诊 3002，等待审核
-- 4003 是 Susan 的随访，没有问诊记录
INSERT INTO medical_record (id, patient_id, doctor_id, department_id, consultation_id, chief_complaint, history_of_present_illness, diagnosis, treatment_plan, status, reviewed_by, reviewed_at, created_at, updated_at) VALUES
  (4001, 1003, 201, 1, 3003,
   'Shortness of breath after exercise.',
   'Symptoms began two weeks ago and improve with rest.',
   'Exercise-induced bronchospasm',
   'Continue inhaler and avoid known triggers.',
   'REVIEWED', 301, '2026-09-27 09:15:00', '2026-09-26 13:30:00', '2026-09-27 09:15:00'),
  (4002, 1002, 201, 1, 3002,
   'Elevated fasting blood glucose.',
   'Home readings have increased over the past week.',
   'Type 2 diabetes, suboptimal control',
   'Review diet and repeat fasting glucose in one week.',
   'SUBMITTED', NULL, NULL, '2026-09-28 09:00:00', '2026-09-28 09:05:00'),
  (4003, 1005, 202, 1, NULL,
   'Follow-up for elevated cholesterol.',
   'No chest pain or dyspnea. The patient has followed a low-fat diet for three months.',
   'Hyperlipidemia',
   'Continue lifestyle management and repeat the lipid panel in three months.',
   'SUBMITTED', NULL, NULL, '2026-09-28 09:35:00', '2026-09-28 09:42:00');

INSERT INTO medical_order (id, medical_record_id, patient_id, doctor_id, order_type, content, created_at) VALUES
  (5001, 4001, 1003, 201, 'MEDICATION', 'Salbutamol inhaler, two puffs when needed.', '2026-09-26 13:32:00'),
  (5002, 4002, 1002, 201, 'LAB_TEST', 'Fasting blood glucose and HbA1c.', '2026-09-28 09:03:00'),
  (5003, 4003, 1005, 202, 'LAB_TEST', 'Fasting lipid panel in three months.', '2026-09-28 09:40:00');
