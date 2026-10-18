-- Physician Service System
-- 建表脚本。先执行本文件，再执行 02_data.sql。
--
--   mysql -u root -p < 01_schema.sql
--
-- 这里只建当前医师服务流程需要的表：
-- 账号与权限、医院与科室、医生、患者、患者分配、问诊、聊天、病历、医嘱。
-- 原项目里的购药订单、库存、物流等表不在本脚本中。

CREATE DATABASE IF NOT EXISTS physician_service
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_general_ci;

USE physician_service;
SET NAMES utf8mb4;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS medical_order;
DROP TABLE IF EXISTS medical_record;
DROP TABLE IF EXISTS consultation_message;
DROP TABLE IF EXISTS consultation;
DROP TABLE IF EXISTS patient_doctor_assignment;
DROP TABLE IF EXISTS doctor_info;
DROP TABLE IF EXISTS user_info;
DROP TABLE IF EXISTS t_role_menu;
DROP TABLE IF EXISTS t_menu;
DROP TABLE IF EXISTS t_user_role;
DROP TABLE IF EXISTS t_user;
DROP TABLE IF EXISTS office_info;
DROP TABLE IF EXISTS hospital_info;
DROP TABLE IF EXISTS t_role;

SET FOREIGN_KEY_CHECKS = 1;

-- 角色：医生、科室管理员
CREATE TABLE t_role (
  role_id     BIGINT       NOT NULL AUTO_INCREMENT,
  role_code   VARCHAR(32)  NOT NULL,
  role_name   VARCHAR(64)  NOT NULL,
  remark      VARCHAR(255) NULL,
  PRIMARY KEY (role_id),
  UNIQUE KEY uk_role_code (role_code)
) ENGINE=InnoDB COMMENT='登录角色';

-- 医院
CREATE TABLE hospital_info (
  id          BIGINT       NOT NULL AUTO_INCREMENT,
  hospital_name VARCHAR(100) NOT NULL,
  phone       VARCHAR(20)  NULL,
  address     VARCHAR(255) NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB COMMENT='医院';

-- 科室。医生、患者、问诊都挂在科室上
CREATE TABLE office_info (
  id            BIGINT       NOT NULL AUTO_INCREMENT,
  hospital_id   BIGINT       NOT NULL,
  offices_name  VARCHAR(100) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_office_hospital (hospital_id),
  CONSTRAINT fk_office_hospital FOREIGN KEY (hospital_id) REFERENCES hospital_info (id)
) ENGINE=InnoDB COMMENT='医院科室';

-- 登录账号。密码与医生档案分开存放，科室管理员也使用这张表
CREATE TABLE t_user (
  user_id       BIGINT       NOT NULL AUTO_INCREMENT,
  username      VARCHAR(32)  NOT NULL,
  password      VARCHAR(128) NOT NULL COMMENT 'Shiro MD5：盐为小写用户名+明文密码，迭代 2 次',
  real_name     VARCHAR(64)  NOT NULL,
  department_id BIGINT       NULL COMMENT '所属科室，对应 office_info.id',
  email         VARCHAR(100) NULL,
  mobile        VARCHAR(20)  NULL,
  status        CHAR(1)      NOT NULL DEFAULT '1' COMMENT '1 有效，0 锁定',
  create_time   DATETIME     NOT NULL,
  PRIMARY KEY (user_id),
  UNIQUE KEY uk_username (username),
  KEY idx_user_department (department_id),
  CONSTRAINT fk_user_department FOREIGN KEY (department_id) REFERENCES office_info (id)
) ENGINE=InnoDB COMMENT='登录账号';

CREATE TABLE t_user_role (
  user_id BIGINT NOT NULL,
  role_id BIGINT NOT NULL,
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT fk_user_role_user FOREIGN KEY (user_id) REFERENCES t_user (user_id),
  CONSTRAINT fk_user_role_role FOREIGN KEY (role_id) REFERENCES t_role (role_id)
) ENGINE=InnoDB COMMENT='账号与角色';

-- 菜单。visible = 0 的是页面内跳转，不出现在侧栏
CREATE TABLE t_menu (
  menu_id    BIGINT       NOT NULL AUTO_INCREMENT,
  parent_id  BIGINT       NULL,
  menu_name  VARCHAR(64)  NOT NULL,
  path       VARCHAR(128) NOT NULL,
  component  VARCHAR(128) NOT NULL,
  icon       VARCHAR(64)  NULL,
  visible    TINYINT      NOT NULL DEFAULT 1,
  order_num  INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (menu_id),
  KEY idx_menu_parent (parent_id),
  CONSTRAINT fk_menu_parent FOREIGN KEY (parent_id) REFERENCES t_menu (menu_id)
) ENGINE=InnoDB COMMENT='系统菜单';

CREATE TABLE t_role_menu (
  role_id BIGINT NOT NULL,
  menu_id BIGINT NOT NULL,
  PRIMARY KEY (role_id, menu_id),
  CONSTRAINT fk_role_menu_role FOREIGN KEY (role_id) REFERENCES t_role (role_id),
  CONSTRAINT fk_role_menu_menu FOREIGN KEY (menu_id) REFERENCES t_menu (menu_id)
) ENGINE=InnoDB COMMENT='角色可见菜单';

-- 医生档案。user_id 指向登录账号，一个账号最多对应一名医生
CREATE TABLE doctor_info (
  id            BIGINT       NOT NULL AUTO_INCREMENT,
  user_id       BIGINT       NOT NULL,
  doctor_name   VARCHAR(64)  NOT NULL,
  code          VARCHAR(32)  NOT NULL,
  hospital_id   BIGINT       NOT NULL,
  offices_id    BIGINT       NOT NULL,
  phone         VARCHAR(20)  NULL,
  email         VARCHAR(100) NULL,
  doctor_title  VARCHAR(64)  NULL,
  status        VARCHAR(20)  NOT NULL DEFAULT 'Available',
  PRIMARY KEY (id),
  UNIQUE KEY uk_doctor_user (user_id),
  UNIQUE KEY uk_doctor_code (code),
  KEY idx_doctor_office (offices_id),
  CONSTRAINT fk_doctor_user FOREIGN KEY (user_id) REFERENCES t_user (user_id),
  CONSTRAINT fk_doctor_hospital FOREIGN KEY (hospital_id) REFERENCES hospital_info (id),
  CONSTRAINT fk_doctor_office FOREIGN KEY (offices_id) REFERENCES office_info (id)
) ENGINE=InnoDB COMMENT='医生档案';

-- 患者档案。当前系统的患者不登录，因此不关联 t_user
CREATE TABLE user_info (
  id                 BIGINT       NOT NULL AUTO_INCREMENT,
  patient_code       VARCHAR(32)  NOT NULL,
  name               VARCHAR(64)  NOT NULL,
  gender             VARCHAR(10)  NOT NULL,
  date_of_birth      DATE         NOT NULL,
  age                INT          NOT NULL,
  phone              VARCHAR(20)  NULL,
  department_id      BIGINT       NOT NULL,
  medical_history    VARCHAR(500) NULL,
  allergies          VARCHAR(255) NULL,
  primary_diagnosis  VARCHAR(255) NULL,
  status             CHAR(1)      NOT NULL DEFAULT '1' COMMENT '1 正常，0 停用',
  create_date        DATETIME     NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_patient_code (patient_code),
  KEY idx_patient_department (department_id),
  CONSTRAINT fk_patient_department FOREIGN KEY (department_id) REFERENCES office_info (id)
) ENGINE=InnoDB COMMENT='患者档案';

-- 科室管理员把患者分配给医生。同一患者同时只有一条 ACTIVE
CREATE TABLE patient_doctor_assignment (
  id             BIGINT      NOT NULL AUTO_INCREMENT,
  patient_id     BIGINT      NOT NULL,
  doctor_id      BIGINT      NOT NULL,
  department_id  BIGINT      NOT NULL,
  assigned_by    BIGINT      NOT NULL COMMENT '操作人，对应 t_user.user_id',
  assigned_at    DATETIME    NOT NULL,
  status         VARCHAR(20) NOT NULL COMMENT 'ACTIVE 或 ENDED',
  created_at     DATETIME    NOT NULL,
  updated_at     DATETIME    NOT NULL,
  PRIMARY KEY (id),
  KEY idx_assignment_patient (patient_id),
  KEY idx_assignment_doctor (doctor_id),
  CONSTRAINT fk_assignment_patient FOREIGN KEY (patient_id) REFERENCES user_info (id),
  CONSTRAINT fk_assignment_doctor FOREIGN KEY (doctor_id) REFERENCES doctor_info (id),
  CONSTRAINT fk_assignment_department FOREIGN KEY (department_id) REFERENCES office_info (id),
  CONSTRAINT fk_assignment_user FOREIGN KEY (assigned_by) REFERENCES t_user (user_id)
) ENGINE=InnoDB COMMENT='患者分配';

-- 一次在线问诊。待接诊时 doctor_id 可以为空
CREATE TABLE consultation (
  id             BIGINT       NOT NULL AUTO_INCREMENT,
  patient_id     BIGINT       NOT NULL,
  doctor_id      BIGINT       NULL,
  department_id  BIGINT       NOT NULL,
  status         VARCHAR(20)  NOT NULL COMMENT 'PENDING、ONGOING、COMPLETED',
  summary        VARCHAR(500) NULL,
  created_at     DATETIME     NOT NULL,
  accepted_at    DATETIME     NULL,
  completed_at   DATETIME     NULL,
  updated_at     DATETIME     NOT NULL,
  PRIMARY KEY (id),
  KEY idx_consultation_patient (patient_id),
  KEY idx_consultation_doctor (doctor_id),
  KEY idx_consultation_status (status),
  CONSTRAINT fk_consultation_patient FOREIGN KEY (patient_id) REFERENCES user_info (id),
  CONSTRAINT fk_consultation_doctor FOREIGN KEY (doctor_id) REFERENCES doctor_info (id),
  CONSTRAINT fk_consultation_department FOREIGN KEY (department_id) REFERENCES office_info (id)
) ENGINE=InnoDB COMMENT='在线问诊';

-- 问诊聊天。发送者可能是患者或医生，因此 sender_id 不设外键
CREATE TABLE consultation_message (
  id               BIGINT      NOT NULL AUTO_INCREMENT,
  consultation_id  BIGINT      NOT NULL,
  sender_id        BIGINT      NOT NULL COMMENT '患者取 user_info.id，医生取 doctor_info.id',
  sender_type      VARCHAR(20) NOT NULL COMMENT 'PATIENT 或 DOCTOR',
  message_type     VARCHAR(20) NOT NULL COMMENT 'TEXT 或 IMAGE',
  content          MEDIUMTEXT  NOT NULL,
  created_at       DATETIME    NOT NULL,
  PRIMARY KEY (id),
  KEY idx_message_consultation (consultation_id),
  CONSTRAINT fk_message_consultation FOREIGN KEY (consultation_id) REFERENCES consultation (id)
) ENGINE=InnoDB COMMENT='问诊消息';

-- 病历。随访病历可以没有 consultation_id
CREATE TABLE medical_record (
  id                          BIGINT      NOT NULL AUTO_INCREMENT,
  patient_id                  BIGINT      NOT NULL,
  doctor_id                   BIGINT      NOT NULL,
  department_id               BIGINT      NOT NULL,
  consultation_id             BIGINT      NULL,
  chief_complaint             TEXT        NULL,
  history_of_present_illness  TEXT        NULL,
  diagnosis                   TEXT        NULL,
  treatment_plan              TEXT        NULL,
  status                      VARCHAR(20) NOT NULL COMMENT 'DRAFT、SUBMITTED、REVIEWED',
  reviewed_by                 BIGINT      NULL COMMENT '审核人，对应 t_user.user_id',
  reviewed_at                 DATETIME    NULL,
  created_at                  DATETIME    NOT NULL,
  updated_at                  DATETIME    NOT NULL,
  PRIMARY KEY (id),
  KEY idx_record_patient (patient_id),
  KEY idx_record_doctor (doctor_id),
  KEY idx_record_consultation (consultation_id),
  KEY idx_record_status (status),
  CONSTRAINT fk_record_patient FOREIGN KEY (patient_id) REFERENCES user_info (id),
  CONSTRAINT fk_record_doctor FOREIGN KEY (doctor_id) REFERENCES doctor_info (id),
  CONSTRAINT fk_record_department FOREIGN KEY (department_id) REFERENCES office_info (id),
  CONSTRAINT fk_record_consultation FOREIGN KEY (consultation_id) REFERENCES consultation (id),
  CONSTRAINT fk_record_reviewer FOREIGN KEY (reviewed_by) REFERENCES t_user (user_id)
) ENGINE=InnoDB COMMENT='病历';

-- 医嘱，从属于一份病历
CREATE TABLE medical_order (
  id                 BIGINT      NOT NULL AUTO_INCREMENT,
  medical_record_id  BIGINT      NOT NULL,
  patient_id         BIGINT      NOT NULL,
  doctor_id          BIGINT      NOT NULL,
  order_type         VARCHAR(20) NOT NULL COMMENT 'MEDICATION、LAB_TEST、OTHER',
  content            TEXT        NOT NULL,
  created_at         DATETIME    NOT NULL,
  PRIMARY KEY (id),
  KEY idx_order_record (medical_record_id),
  CONSTRAINT fk_order_record FOREIGN KEY (medical_record_id) REFERENCES medical_record (id),
  CONSTRAINT fk_order_patient FOREIGN KEY (patient_id) REFERENCES user_info (id),
  CONSTRAINT fk_order_doctor FOREIGN KEY (doctor_id) REFERENCES doctor_info (id)
) ENGINE=InnoDB COMMENT='医嘱';
