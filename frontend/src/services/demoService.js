import store from '@/store'
import {apiPost} from '@/services/api'

function data () {
  return store.state.demo.data
}

function saveSnapshot (payload) {
  store.commit('demo/setData', payload)
  return payload
}

const demoService = {
  getData: data,
  getPatient (id) {
    return data().patients.find(item => item.id === Number(id))
  },
  getDoctor (id) {
    return data().doctors.find(item => item.id === Number(id))
  },
  getAssignment (patientId) {
    return data().assignments.find(item => item.patientId === Number(patientId) && item.status === 'ACTIVE')
  },
  getMyPatients (doctorId) {
    const ids = data().assignments.filter(item => item.doctorId === Number(doctorId) && item.status === 'ACTIVE').map(item => item.patientId)
    return data().patients.filter(item => ids.indexOf(item.id) >= 0)
  },
  searchPatients (query) {
    const params = query || {}
    return data().patients.filter(item => {
      return (!params.id || String(item.id).indexOf(String(params.id)) >= 0) &&
        (!params.name || item.name.toLowerCase().indexOf(params.name.toLowerCase()) >= 0) &&
        (!params.phone || item.phone.indexOf(params.phone) >= 0)
    })
  },
  assignPatient (patientId, doctorId, assignedBy) {
    return apiPost('/assignments', {patientId: Number(patientId), doctorId: Number(doctorId), assignedBy: Number(assignedBy)}).then(saveSnapshot)
  },
  getConsultations (doctorId, status) {
    return data().consultations.filter(item => (!doctorId || item.doctorId === Number(doctorId) || (item.status === 'PENDING' && !item.doctorId)) && (!status || item.status === status))
  },
  getConsultation (id) {
    return data().consultations.find(item => item.id === Number(id))
  },
  acceptConsultation (id, doctorId) {
    return apiPost('/consultations/accept', {id: Number(id), doctorId: Number(doctorId)}).then(saveSnapshot)
  },
  getMessages (consultationId) {
    return data().messages.filter(item => item.consultationId === Number(consultationId))
  },
  sendMessage (consultationId, senderId, messageType, content) {
    return apiPost('/messages', {
      consultationId: Number(consultationId), senderId: Number(senderId), senderType: 'DOCTOR', messageType, content
    }).then(saveSnapshot)
  },
  sendPatientMessage (consultationId, patientId, content) {
    return apiPost('/messages', {
      consultationId: Number(consultationId), senderId: Number(patientId), senderType: 'PATIENT', messageType: 'TEXT', content
    }).then(saveSnapshot)
  },
  getPatientReply (consultationId, message) {
    const consultation = this.getConsultation(consultationId)
    if (!consultation) return null
    const text = String(message).toLowerCase()
    if (/how long|when did|started|start/.test(text)) return 'The sore throat started three days ago, and the cough began yesterday.'
    if (/fever|temperature|temp/.test(text)) return 'My temperature was 37.8 degrees Celsius last night. It is 37.3 now.'
    if (/allerg/.test(text)) return 'I am allergic to penicillin. It caused a rash when I was a child.'
    if (/medication|medicine|taken|take anything/.test(text)) return 'I took one paracetamol tablet last night, and it helped a little.'
    if (/breath|breathing|chest pain/.test(text)) return 'No, I can breathe normally and I do not have chest pain.'
    const replies = [
      'The main problem is the sore throat, especially when I swallow.',
      'The cough is dry, and I have not noticed any phlegm.',
      'I have been drinking water and resting, but the symptoms are still there.'
    ]
    const doctorMessageCount = this.getMessages(consultationId).filter(item => item.senderType === 'DOCTOR').length
    return replies[(Math.max(doctorMessageCount, 1) - 1) % replies.length]
  },
  endConsultation (id) {
    return apiPost('/consultations/end', {id: Number(id)}).then(saveSnapshot)
  },
  getRecords (filters) {
    const params = filters || {}
    return data().medicalRecords.filter(item => (!params.patientId || item.patientId === Number(params.patientId)) &&
      (!params.doctorId || item.doctorId === Number(params.doctorId)) && (!params.status || item.status === params.status))
  },
  getRecord (id) {
    return data().medicalRecords.find(item => item.id === Number(id))
  },
  saveRecord (record) {
    return apiPost('/records', record).then(result => {
      saveSnapshot(result.data)
      return result.record
    })
  },
  submitRecord (record) {
    return this.saveRecord(Object.assign({}, record, {status: 'SUBMITTED'}))
  },
  getOrders (medicalRecordId) {
    return data().medicalOrders.filter(item => item.medicalRecordId === Number(medicalRecordId))
  },
  addOrder (order) {
    return apiPost('/orders', order).then(saveSnapshot)
  },
  reviewRecord (id, reviewedBy) {
    return apiPost('/records/review', {id: Number(id), reviewedBy: Number(reviewedBy)}).then(saveSnapshot)
  }
}

export default demoService
