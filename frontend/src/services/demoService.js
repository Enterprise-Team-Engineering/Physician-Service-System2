import store from '@/store'

function now () {
  const date = new Date()
  const pad = value => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function data () {
  return store.state.demo.data
}

function nextId (items, floor) {
  return Math.max(floor, ...items.map(item => Number(item.id) || 0)) + 1
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
    store.commit('demo/assignPatient', {
      id: nextId(data().assignments, 0), patientId: Number(patientId), doctorId: Number(doctorId),
      departmentId: 1, assignedBy: Number(assignedBy), assignedAt: now(), status: 'ACTIVE'
    })
  },
  getConsultations (doctorId, status) {
    return data().consultations.filter(item => (!doctorId || item.doctorId === Number(doctorId) || (item.status === 'PENDING' && !item.doctorId)) && (!status || item.status === status))
  },
  getConsultation (id) {
    return data().consultations.find(item => item.id === Number(id))
  },
  acceptConsultation (id, doctorId) {
    store.commit('demo/acceptConsultation', {id: Number(id), doctorId: Number(doctorId), acceptedAt: now()})
  },
  getMessages (consultationId) {
    return data().messages.filter(item => item.consultationId === Number(consultationId))
  },
  sendMessage (consultationId, senderId, messageType, content) {
    store.commit('demo/sendMessage', {
      id: nextId(data().messages, 0), consultationId: Number(consultationId), senderId: Number(senderId),
      senderType: 'DOCTOR', messageType, content, createdAt: now()
    })
  },
  sendPatientMessage (consultationId, patientId, content) {
    store.commit('demo/sendMessage', {
      id: nextId(data().messages, 0), consultationId: Number(consultationId), senderId: Number(patientId),
      senderType: 'PATIENT', messageType: 'TEXT', content, createdAt: now()
    })
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
    store.commit('demo/endConsultation', {id: Number(id), completedAt: now()})
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
    const stamp = now()
    const saved = Object.assign({}, record)
    if (!saved.id) {
      saved.id = nextId(data().medicalRecords, 4000)
      saved.createdAt = stamp
    }
    saved.updatedAt = stamp
    saved.status = saved.status || 'DRAFT'
    store.commit('demo/saveRecord', saved)
    return saved
  },
  submitRecord (record) {
    return this.saveRecord(Object.assign({}, record, {status: 'SUBMITTED'}))
  },
  getOrders (medicalRecordId) {
    return data().medicalOrders.filter(item => item.medicalRecordId === Number(medicalRecordId))
  },
  addOrder (order) {
    const saved = Object.assign({}, order, {id: nextId(data().medicalOrders, 5000), createdAt: now()})
    store.commit('demo/addOrder', saved)
    return saved
  },
  reviewRecord (id, reviewedBy) {
    store.commit('demo/reviewRecord', {id: Number(id), reviewedBy: Number(reviewedBy), reviewedAt: now()})
  }
}

export default demoService
