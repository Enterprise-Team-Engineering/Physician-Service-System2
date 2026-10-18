export const DEMO_STORAGE_KEY = 'PHYSICIAN_DEMO_DATA_V1'

export const defaultDemoData = {
  doctors: [
    {id: 201, name: 'Dr. Zhang', departmentId: 1, departmentName: 'Internal Medicine', phone: '13800001001', email: 'doctor.zhang@example.com', title: 'Attending Physician'},
    {id: 202, name: 'Dr. Wilson', departmentId: 1, departmentName: 'Internal Medicine', phone: '13800001002', email: 'doctor.wilson@example.com', title: 'Associate Chief Physician'}
  ],
  patients: [
    {id: 1001, name: 'Emily Johnson', gender: 'Female', dateOfBirth: '1958-05-12', age: 68, phone: '13800000001', idNumber: 'P100001', departmentId: 1, medicalHistory: 'Hypertension for 8 years', allergies: 'Penicillin', primaryDiagnosis: 'Hypertension'},
    {id: 1002, name: 'Robert Smith', gender: 'Male', dateOfBirth: '1972-03-21', age: 54, phone: '13800000002', idNumber: 'P100002', departmentId: 1, medicalHistory: 'Type 2 diabetes for 5 years', allergies: 'None known', primaryDiagnosis: 'Type 2 diabetes'},
    {id: 1003, name: 'Linda Brown', gender: 'Female', dateOfBirth: '1984-11-06', age: 41, phone: '13800000003', idNumber: 'P100003', departmentId: 1, medicalHistory: 'Seasonal asthma', allergies: 'Sulfonamides', primaryDiagnosis: 'Bronchial asthma'},
    {id: 1004, name: 'Michael Davis', gender: 'Male', dateOfBirth: '1990-07-14', age: 36, phone: '13800000004', idNumber: 'P100004', departmentId: 1, medicalHistory: 'No significant medical history', allergies: 'Penicillin', primaryDiagnosis: 'Acute pharyngitis'},
    {id: 1005, name: 'Susan Wilson', gender: 'Female', dateOfBirth: '1966-01-30', age: 60, phone: '13800000005', idNumber: 'P100005', departmentId: 1, medicalHistory: 'Hyperlipidemia for 3 years', allergies: 'Aspirin', primaryDiagnosis: 'Hyperlipidemia'}
  ],
  assignments: [
    {id: 1, patientId: 1002, doctorId: 201, departmentId: 1, assignedBy: 301, assignedAt: '2026-09-28 08:30:00', status: 'ACTIVE'},
    {id: 2, patientId: 1003, doctorId: 201, departmentId: 1, assignedBy: 301, assignedAt: '2026-09-27 14:10:00', status: 'ACTIVE'},
    {id: 3, patientId: 1004, doctorId: 201, departmentId: 1, assignedBy: 301, assignedAt: '2026-09-26 09:45:00', status: 'ACTIVE'},
    {id: 4, patientId: 1005, doctorId: 202, departmentId: 1, assignedBy: 301, assignedAt: '2026-09-25 11:20:00', status: 'ACTIVE'}
  ],
  consultations: [
    {id: 3001, patientId: 1001, doctorId: null, departmentId: 1, status: 'PENDING', createdAt: '2026-09-28 09:20:00', acceptedAt: null, completedAt: null, summary: 'Persistent cough and mild fever.'},
    {id: 3002, patientId: 1002, doctorId: 201, departmentId: 1, status: 'ONGOING', createdAt: '2026-09-28 08:40:00', acceptedAt: '2026-09-28 08:45:00', completedAt: null, summary: 'Elevated fasting blood glucose.'},
    {id: 3003, patientId: 1003, doctorId: 201, departmentId: 1, status: 'COMPLETED', createdAt: '2026-09-26 13:00:00', acceptedAt: '2026-09-26 13:04:00', completedAt: '2026-09-26 13:25:00', summary: 'Shortness of breath after exercise.'},
    {id: 3004, patientId: 1004, doctorId: 201, departmentId: 1, status: 'PENDING', createdAt: '2026-09-28 10:05:00', acceptedAt: null, completedAt: null, summary: 'Sore throat, dry cough and a low-grade fever.'}
  ],
  messages: [
    {id: 1, consultationId: 3001, senderId: 1001, senderType: 'PATIENT', messageType: 'TEXT', content: 'I have had a cough for five days.', createdAt: '2026-09-28 09:21:00'},
    {id: 2, consultationId: 3002, senderId: 1002, senderType: 'PATIENT', messageType: 'TEXT', content: 'My fasting glucose was 9.2 mmol/L this morning.', createdAt: '2026-09-28 08:41:00'},
    {id: 3, consultationId: 3002, senderId: 201, senderType: 'DOCTOR', messageType: 'TEXT', content: 'Please tell me what you ate last night and list your current medication.', createdAt: '2026-09-28 08:47:00'},
    {id: 4, consultationId: 3004, senderId: 1004, senderType: 'PATIENT', messageType: 'TEXT', content: 'Hello doctor. I have a sore throat, a dry cough, and felt slightly feverish last night.', createdAt: '2026-09-28 10:05:00'}
  ],
  medicalRecords: [
    {id: 4001, patientId: 1003, doctorId: 201, departmentId: 1, consultationId: 3003, chiefComplaint: 'Shortness of breath after exercise.', historyOfPresentIllness: 'Symptoms began two weeks ago and improve with rest.', diagnosis: 'Exercise-induced bronchospasm', treatmentPlan: 'Continue inhaler and avoid known triggers.', status: 'REVIEWED', reviewedBy: 301, reviewedAt: '2026-09-27 09:15:00', createdAt: '2026-09-26 13:30:00', updatedAt: '2026-09-27 09:15:00'},
    {id: 4002, patientId: 1002, doctorId: 201, departmentId: 1, consultationId: 3002, chiefComplaint: 'Elevated fasting blood glucose.', historyOfPresentIllness: 'Home readings have increased over the past week.', diagnosis: 'Type 2 diabetes, suboptimal control', treatmentPlan: 'Review diet and repeat fasting glucose in one week.', status: 'SUBMITTED', reviewedBy: null, reviewedAt: null, createdAt: '2026-09-28 09:00:00', updatedAt: '2026-09-28 09:05:00'},
    {id: 4003, patientId: 1005, doctorId: 202, departmentId: 1, consultationId: null, chiefComplaint: 'Follow-up for elevated cholesterol.', historyOfPresentIllness: 'No chest pain or dyspnea. The patient has followed a low-fat diet for three months.', diagnosis: 'Hyperlipidemia', treatmentPlan: 'Continue lifestyle management and repeat the lipid panel in three months.', status: 'SUBMITTED', reviewedBy: null, reviewedAt: null, createdAt: '2026-09-28 09:35:00', updatedAt: '2026-09-28 09:42:00'}
  ],
  medicalOrders: [
    {id: 5001, medicalRecordId: 4001, patientId: 1003, doctorId: 201, orderType: 'MEDICATION', content: 'Salbutamol inhaler, two puffs when needed.', createdAt: '2026-09-26 13:32:00'},
    {id: 5002, medicalRecordId: 4002, patientId: 1002, doctorId: 201, orderType: 'LAB_TEST', content: 'Fasting blood glucose and HbA1c.', createdAt: '2026-09-28 09:03:00'},
    {id: 5003, medicalRecordId: 4003, patientId: 1005, doctorId: 202, orderType: 'LAB_TEST', content: 'Fasting lipid panel in three months.', createdAt: '2026-09-28 09:40:00'}
  ]
}

export function cloneDefaultData () {
  return JSON.parse(JSON.stringify(defaultDemoData))
}
