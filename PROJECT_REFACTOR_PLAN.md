# Physician Service System Refactor Plan

> Scope of this document: repository scan and refactor plan only. No business code has been changed in this phase.

## A. Current Architecture

### Backend

- Project path: `backend`
- Framework: Spring Boot `2.1.0.RELEASE`
- Java version: `1.8`
- Main package: `cc.mrbird.febs`
- Application entry: `cc.mrbird.febs.FebsApplication`
- Persistence: MyBatis-Plus `3.1.1` + XML mappers
- Security: Shiro + JWT + Redis token cache
- Database: MySQL, configured database name `medical_cos`
- Cache/session dependency: Redis
- Main backend layers:
  - `system`: login, user, role, menu, dept, logs, redis monitor
  - `cos`: current healthcare/HIS business modules
  - `common`: response wrapper, JWT filter, Shiro config, utilities, generator, base controller
  - `web`: weather/movie/article external demo endpoints

### Frontend

- Project path: `frontend`
- Framework: Vue `2.5.17`
- UI: Ant Design Vue `1.3.7`
- State/router: Vuex `3.0.1`, Vue Router `3.0.1`
- HTTP: Axios wrapper in `frontend/src/utils/request.js`
- Layout/menu: existing FEBS admin layout under `frontend/src/views/common`
- Route loading model: dynamic routes are fetched from backend endpoint `menu/{username}` and stored in local storage.
- Important implication: final menu changes should primarily be made through `t_menu` / `t_role_menu` data or a menu migration script, not by deleting Vue files first.

### Database

- No `.sql` schema or seed file is present in this repository.
- Current schema is inferred from entities and mapper XML.
- Known system tables from code:
  - `t_user`
  - `t_role`
  - `t_user_role`
  - `t_menu`
  - `t_role_menu`
  - `t_dept`
  - login/log/config/dict related tables
- Known business tables inferred from entities/mappers:
  - `user_info`
  - `doctor_info`
  - `hospital_info`
  - `office_info`
  - `dept_info`
  - `register_info`
  - `schedule_info`
  - `help_info`
  - `medication_info`
  - `drug_info`
  - `order_info`
  - `order_detail`
  - `order_evaluate`
  - `purchase_info`
  - `pharmacy_inventory`
  - `stock_alert_info`
  - `inventory_statistics`
  - `logistics_info`
  - `medical_info`
  - `reply_info`
  - `bulletin_info`
  - `chronic_info`
  - `enterprise_info`
  - `staff_info`

## B. Current Functional Modules

### Current Roles

Based on README and code, the current system supports at least:

- Admin
- Hospital Admin
- Doctor
- User / Patient

The target system should reduce the core business roles to:

- Doctor
- Department Admin

The existing Admin role can remain for technical setup/system maintenance, but it should not be part of the final business demonstration flow.

### Current Backend Modules

- Authentication/login/register: `LoginController`, `UserController`, Shiro/JWT/Redis cache
- System management: user, role, menu, dept, dict, logs, online users, redis monitor
- User/patient management: `UserInfoController`, `UserInfo`
- Doctor management: `DoctorInfoController`, `DoctorInfo`
- Hospital and department/office management: `HospitalInfoController`, `OfficeInfoController`, `DeptInfoController`
- Registration/diagnosis records: `RegisterInfoController`, `RegisterInfo`
- Doctor schedule: `ScheduleInfoController`, `ScheduleInfo`
- User questions/help: `HelpInfoController`, `HelpInfo`
- Electronic prescription: `MedicationInfoController`, `MedicationInfo`
- Drug catalog: `DrugInfoController`, `DrugInfo`
- Orders/payment/logistics/inventory/purchase/statistics: order, pay, logistics, inventory, purchase, stock alert, inventory statistics
- Medical information/news: `MedicalInfoController`, `MedicalInfo`
- Comments/replies: `ReplyInfoController`, `ReplyInfo`
- Bulletin/chronic/enterprise/staff modules

### Current Frontend Modules

- Common FEBS layout, header, sidebar, menu rendering
- Login/register pages
- System pages: users, roles, menu, dept, dict
- Doctor pages:
  - personal
  - schedule
  - register/diagnosis
  - medication
  - order
  - help/question
- Hospital pages:
  - doctor, office, staff, register, schedule, medication, order, inventory, logistics, evaluate
- Manage pages:
  - user, doctor, hospital, office, register, help, medication, drug, order, purchase, procurement, logistics, inventory, statistics, map-related, comments, news, staff, etc.
- User pages:
  - personal, register, help, medical/news, order, pay, medication, comments, AI
- Statistics pages:
  - sale, report, rank, map, hospital, drug, register
- Monitor/quartz/web demo pages

## C. Keep

These modules should be kept and reused with minimal structural change:

- Existing login flow: username/password login, JWT token, Shiro permission checks.
- Existing role/menu permission model: `t_role`, `t_menu`, `t_role_menu`, `MenuController`, dynamic Vue router.
- Existing admin layout and Ant Design Vue table/form/modal style.
- `UserInfo` as the base Patient profile entity.
- `DoctorInfo` as the base Doctor profile entity.
- `OfficeInfo` or `DeptInfo` as Department data. Prefer `OfficeInfo` if department must be linked to doctors/hospitals, because existing doctor and registration mappers already use `offices_id`.
- `RegisterInfo` as a reusable source for patient consultation/registration history.
- `HelpInfo` as a possible lightweight starting point for online consultation requests, but it is too limited for chat.
- `MedicationInfo` as a reusable reference for simple medical order/prescription style pages, but not as the final structured EMR.
- Existing `FileController` and `/imagesWeb/` static serving for image upload/display.
- Existing CRUD page pattern: `List.vue` + `Add.vue` + `Edit.vue` + `View.vue`.
- Existing Axios wrapper and `$get/$post/$put/$delete/$upload` usage.

## D. Modify

### Module Mapping

| Current module | Target module | Refactor approach |
| --- | --- | --- |
| `UserInfo` / user management | Patient Management | Rename in UI to Patient. Keep table/entity. Add medical history, allergies, primary diagnosis if absent. |
| `DoctorInfo` | Doctor Management | Keep. Restrict Department Admin view to same department. |
| `Hospital Admin` role/pages | Department Admin | Reuse selected hospital/admin code, but scope by `offices_id`/department instead of whole hospital. |
| `RegisterInfo` | Consultation History / patient history | Keep as historical registration/diagnosis data. Do not use payment statuses as final consultation statuses. |
| `HelpInfo` | Consultation Queue seed | Either extend carefully or replace with new `consultation` + `consultation_message` tables. Since target requires saved chat history and images, new tables are recommended. |
| `MedicationInfo` | Medical Order reference | Keep as reference UI. Target medical order should be a simple child record of EMR, not a sales/prescription/payment flow. |
| `MedicalInfo` | Remove/hide as medical news | Current `MedicalInfo` is news/content, not EMR. Do not reuse for EMR. |
| `OrderInfo` / pay / logistics | Remove/hide | Not part of target physician service workflow. Keep backend initially to avoid dependency breakage. |
| `DrugInfo` | Optional drug text reference | Keep only if useful for simple order text selection; hide inventory/sales flows. |
| `ScheduleInfo` | Optional extra | Keep if low-cost, but not part of core acceptance flow. |

### Important Backend Modifications

- Add business-level access control:
  - Doctor can only access assigned patients.
  - Doctor can only access consultations assigned to self.
  - Department Admin can only access doctors, patients, and EMRs in own department.
- Tighten `application.yml` anonymous URL configuration. Current `febs.shiro.anonUrl` includes `/cos/**`, which effectively bypasses authentication for all business APIs. This is a major risk for the target system.
- Add clear status transitions:
  - Consultation: `PENDING -> ONGOING -> COMPLETED`
  - EMR: `DRAFT -> SUBMITTED -> REVIEWED`
- Avoid physical deletion of patient records that already have consultation/EMR history. Prefer logical delete/status or deletion guard.

## E. Remove / Hide

Initial strategy: hide from final business menus first. Do not delete backend code until dependencies are checked.

### Hide from Doctor / Department Admin Menus

- Payment and Alipay pages/APIs:
  - `PayController`
  - `frontend/src/views/user/pay`
  - `frontend/src/views/service/pay`
  - `frontend/src/views/service/payment`
- E-commerce/order flow:
  - `OrderInfoController`, `OrderDetailController`, `OrderEvaluateController`
  - `frontend/src/views/*/order`
  - order evaluation pages
- Procurement/supplier/logistics:
  - `PurchaseInfoController`
  - `LogisticsInfoController`
  - `frontend/src/views/manage/procurement`
  - `frontend/src/views/manage/purchase`
  - `frontend/src/views/*/logistics`
  - `EnterpriseInfoController` if only used as supplier management
- Inventory/stock/statistics:
  - `PharmacyInventoryController`
  - `InventoryStatisticsController`
  - `StockAlertInfoController`
  - `frontend/src/views/*/inventory`
  - `frontend/src/views/manage/stock`
  - `frontend/src/views/manage/alert`
  - sales/statistics pages unrelated to target dashboard
- Map/GIS:
  - `frontend/src/utils/map`
  - `frontend/src/views/statistics/map`
  - hospital map endpoints under `HospitalInfoController`
- Medical news/content:
  - `MedicalInfoController`
  - `frontend/src/views/*/medical`
- Comments/reviews:
  - `ReplyInfoController`
  - `frontend/src/views/*/reply`
  - `frontend/src/views/*/evaluate`
- AI page:
  - `frontend/src/views/user/ai`
- Monitor/quartz/demo web pages from business roles:
  - keep for technical admin only if needed.

## F. Missing

The following target functions are not currently complete and need to be added:

- Patient-doctor assignment.
- Doctor "My Patients" page based on assignment.
- Patient profile page with:
  - basic information
  - medical history
  - allergies
  - primary diagnosis
  - past consultations
  - historical EMR
- Department Admin patient assignment UI.
- Online consultation with:
  - queue
  - accept
  - text messages
  - image messages
  - message history
  - end consultation
- Structured EMR:
  - chief complaint
  - history of present illness
  - diagnosis
  - treatment plan
- Medical order as EMR child data.
- EMR review by Department Admin.
- Simplified dashboard:
  - my patients count
  - pending consultations
  - completed consultations
  - EMR count
- Department-scoped backend permission checks.
- SQL migration scripts for new tables, menu changes, role/menu mappings, and possibly added patient fields.

## G. Database Changes

Because no schema file is included, create a new migration SQL file instead of editing an unavailable baseline schema.

Recommended file:

- `backend/src/main/resources/sql/physician_service_migration.sql`

Recommended changes:

### 1. Extend `user_info` for patient medical data

Add only missing columns after verifying actual DB:

- `medical_history`
- `allergies`
- `primary_diagnosis`
- optional `deleted` or `status` reuse for logical deletion

### 2. New table: `patient_doctor_assignment`

Purpose: Department Admin assigns patients to doctors.

Suggested fields:

- `id`
- `patient_id`
- `doctor_id`
- `department_id`
- `assigned_by`
- `assigned_at`
- `status`
- `created_at`
- `updated_at`

### 3. New table: `consultation`

Purpose: queue and history.

Suggested fields:

- `id`
- `patient_id`
- `doctor_id`
- `department_id`
- `created_by`
- `status`
- `accepted_at`
- `completed_at`
- `created_at`
- `updated_at`
- `summary`

### 4. New table: `consultation_message`

Purpose: persistent text/image chat history.

Suggested fields:

- `id`
- `consultation_id`
- `sender_id`
- `sender_type`
- `message_type`
- `content`
- `created_at`

### 5. New table: `medical_record`

Purpose: structured EMR.

Suggested fields:

- `id`
- `patient_id`
- `doctor_id`
- `department_id`
- `consultation_id`
- `chief_complaint`
- `history_of_present_illness`
- `diagnosis`
- `treatment_plan`
- `status`
- `reviewed_by`
- `reviewed_at`
- `created_at`
- `updated_at`

### 6. New table: `medical_order`

Purpose: simple EMR child order.

Suggested fields:

- `id`
- `medical_record_id`
- `patient_id`
- `doctor_id`
- `order_type`
- `content`
- `created_at`

### 7. Menu and role SQL

Add/update `t_menu` and `t_role_menu` data for:

- Doctor:
  - Dashboard
  - My Patients
  - Patient Search
  - Consultation Queue
  - Consultation History
  - Patient Records
  - Create/Edit Record
  - Medical Orders
  - Personal Profile
- Department Admin:
  - Department Doctors
  - Department Patients
  - Patient Assignment
  - Medical Record Review

Hide unrelated old menus by removing role-menu mappings instead of deleting rows first.

## H. Backend Changes

Follow existing structure:

- Entity under `cc.mrbird.febs.cos.entity`
- Mapper under `cc.mrbird.febs.cos.dao`
- Mapper XML under `resources/mapper/cos`
- Service interface under `cc.mrbird.febs.cos.service`
- Service implementation under `cc.mrbird.febs.cos.service.impl`
- Controller under `cc.mrbird.febs.cos.controller`

### New Entities

- `PatientDoctorAssignment`
- `Consultation`
- `ConsultationMessage`
- `MedicalRecord`
- `MedicalOrder`

### New Mappers

- `PatientDoctorAssignmentMapper`
- `ConsultationMapper`
- `ConsultationMessageMapper`
- `MedicalRecordMapper`
- `MedicalOrderMapper`

### New Services

- `IPatientDoctorAssignmentService`
- `IConsultationService`
- `IConsultationMessageService`
- `IMedicalRecordService`
- `IMedicalOrderService`

### New Controllers

- `PatientAssignmentController`
- `PatientProfileController` or extend `UserInfoController` with patient-specific endpoints
- `ConsultationController`
- `ConsultationMessageController`
- `MedicalRecordController`
- `MedicalOrderController`
- `PhysicianDashboardController`

### Modify Existing Controllers/Services

- `UserInfoController` / `IUserInfoService`
  - patient search by ID/name/phone
  - patient profile detail
  - guard deletion if EMR/consultations exist
- `DoctorInfoController` / `IDoctorInfoService`
  - department doctor list
  - current doctor lookup by `t_user.user_id`
- `MenuController` / menu SQL
  - provide final role menus
- `LoginController` / security config
  - keep existing login
  - avoid broad anonymous `/cos/**`

## I. Frontend Changes

Follow existing Ant Design Vue page patterns and keep current UI style.

### Menu

- Update backend menu data, not hardcoded frontend menu.
- Create role-specific menu mappings for Doctor and Department Admin.
- Remove old business menus from these roles.

### Router

- Dynamic route loading already supports new pages if `t_menu.component` points to the Vue component path.
- No major router rewrite needed.

### Vue Pages

Recommended new pages:

- `frontend/src/views/physician/dashboard/Dashboard.vue`
- `frontend/src/views/physician/patient/MyPatients.vue`
- `frontend/src/views/physician/patient/PatientSearch.vue`
- `frontend/src/views/physician/patient/PatientProfile.vue`
- `frontend/src/views/physician/assignment/PatientAssignment.vue`
- `frontend/src/views/physician/consultation/ConsultationQueue.vue`
- `frontend/src/views/physician/consultation/ConsultationChat.vue`
- `frontend/src/views/physician/consultation/ConsultationHistory.vue`
- `frontend/src/views/physician/record/MedicalRecord.vue`
- `frontend/src/views/physician/record/MedicalRecordEdit.vue`
- `frontend/src/views/physician/record/MedicalRecordView.vue`
- `frontend/src/views/physician/record/MedicalRecordReview.vue`
- `frontend/src/views/physician/order/MedicalOrder.vue`

Alternative: place pages under existing `doctor` and `hospital` directories to minimize menu path churn. This is lower risk if current menu data already references those folders.

### API Usage

No separate API module pattern exists. Current pages call:

- `this.$get(...)`
- `this.$post(...)`
- `this.$put(...)`
- `this.$delete(...)`
- `this.$upload(...)`

New pages should continue this pattern.

### UI Style

- Use existing `<a-card class="card-area">`, search form, table, modal, `RangeDate`, pagination, and icon operation style.
- Copy from existing pages such as:
  - `frontend/src/views/manage/user/User.vue`
  - `frontend/src/views/doctor/register/Register.vue`
  - `frontend/src/views/doctor/help/Help.vue`

## J. Implementation Order

Risk from low to high:

1. Add migration SQL skeleton and menu migration strategy.
2. Hide unrelated menus for Doctor and Department Admin by adjusting `t_role_menu`; keep backend code.
3. Add patient medical fields to `user_info` and update `UserInfo`.
4. Implement patient search/profile APIs and pages.
5. Implement `patient_doctor_assignment` backend and Department Admin assignment page.
6. Implement Doctor "My Patients" page using assignment table.
7. Implement consultation tables, queue API, accept/end API.
8. Implement consultation chat page with REST polling/manual refresh and image upload.
9. Implement structured EMR tables, APIs, create/edit/view pages.
10. Implement medical order as EMR child data.
11. Implement EMR submit/review flow for Department Admin.
12. Implement simplified dashboard.
13. Tighten business access control in service/controller methods.
14. Remove or disable broad `/cos/**` anonymous access after login/menu/API flow has been verified.
15. Run backend compile, frontend build, and end-to-end manual acceptance flow.

## K. Risk List

- No database schema file exists. Migration must be based on the actual local MySQL schema before execution.
- Menu is database-driven. Deleting Vue files without updating `t_menu` can break dynamic route loading.
- Existing role/menu IDs are unknown without DB data. Menu migration must query current IDs or use stable `path/component` matching.
- Existing `/cos/**` anonymous URL config is too broad. Tightening it too early may expose missing permissions and break current pages; do it after target role menus and permissions are prepared.
- Order/payment/inventory/procurement modules are highly coupled through `RegisterInfo`, `MedicationInfo`, `OrderInfo`, `PharmacyInventory`, and statistics endpoints. Hide first, delete later only after dependency checks.
- `RegisterInfo` currently mixes registration, payment, diagnosis, prescription status, and statistics. It should not be directly treated as final consultation without isolating target status semantics.
- `MedicalInfo` name is misleading: it is medical news/content, not electronic medical record.
- `HelpInfo` has only one question and one answer field. It cannot satisfy persistent multi-message text/image chat without new message storage.
- Existing `UserInfo` lacks explicit allergies, medical history, and primary diagnosis fields.
- Department Admin scope is not currently modeled clearly. Need a reliable link from current `t_user.user_id` to department/office before enforcing access.
- Current code contains many pages with Chinese text that may display as mojibake in this terminal, but source files are otherwise readable by path and structure.
- `git` command is unavailable in the current execution environment, so this scan could not report repository dirty state.

