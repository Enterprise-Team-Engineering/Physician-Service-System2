import {DEMO_ROLES} from './config'

function page (path, name, component, icon, extra) {
  return Object.assign({
    path,
    name,
    component,
    icon: icon || 'none',
    meta: {closeable: true}
  }, extra || {})
}

function group (path, name, icon, children) {
  return {
    path,
    name,
    component: 'PageView',
    icon,
    meta: {},
    children
  }
}

export function getDemoMenu (role) {
  const doctorMenus = [
    page('/app/dashboard', 'Dashboard', 'demo/Dashboard', 'dashboard'),
    group('/app/patients', 'Patient Management', 'team', [
      page('/app/patients/mine', 'My Patients', 'demo/MyPatients', 'user'),
      page('/app/patients/search', 'Patient Search', 'demo/PatientSearch', 'search'),
      page('/app/patients/:id', 'Patient Profile', 'demo/PatientProfile', 'none', {hidden: true})
    ]),
    group('/app/consultations', 'Online Consultation', 'message', [
      page('/app/consultations/queue', 'Consultation Queue', 'demo/ConsultationQueue', 'clock-circle'),
      page('/app/consultations/history', 'Consultation History', 'demo/ConsultationHistory', 'history'),
      page('/app/consultations/:id/chat', 'Consultation Chat', 'demo/ConsultationChat', 'none', {hidden: true})
    ]),
    group('/app/records', 'Medical Records', 'file-text', [
      page('/app/records/list', 'Patient Records', 'demo/MedicalRecords', 'solution'),
      page('/app/records/create/:patientId', 'Create Medical Record', 'demo/MedicalRecordForm', 'none', {hidden: true}),
      page('/app/records/:id', 'Medical Record', 'demo/MedicalRecordForm', 'none', {hidden: true})
    ]),
    page('/app/profile', 'Personal Profile', 'demo/PersonalProfile', 'idcard')
  ]

  const adminMenus = [
    page('/app/dashboard', 'Dashboard', 'demo/Dashboard', 'dashboard'),
    group('/app/patients', 'Patient Management', 'team', [
      page('/app/patients/department', 'Department Patients', 'demo/PatientSearch', 'database'),
      page('/app/patients/assignment', 'Patient Assignment', 'demo/PatientAssignment', 'user-add'),
      page('/app/patients/:id', 'Patient Profile', 'demo/PatientProfile', 'none', {hidden: true})
    ]),
    group('/app/department', 'Department Management', 'apartment', [
      page('/app/department/doctors', 'Doctors', 'demo/Doctors', 'medicine-box')
    ]),
    group('/app/records', 'Medical Records', 'file-text', [
      page('/app/records/review', 'Medical Record Review', 'demo/MedicalRecordReview', 'audit'),
      page('/app/records/:id', 'Medical Record', 'demo/MedicalRecordForm', 'none', {hidden: true})
    ]),
    page('/app/profile', 'Personal Profile', 'demo/PersonalProfile', 'idcard')
  ]

  return [{
    path: '/',
    name: 'Physician Service System',
    component: 'MenuView',
    redirect: '/app/dashboard',
    children: role === DEMO_ROLES.DEPT_ADMIN ? adminMenus : doctorMenus
  }]
}
