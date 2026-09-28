import {DEMO_STORAGE_KEY, cloneDefaultData} from '@/mock/demoData'

const SESSION_KEY = 'PHYSICIAN_SERVICE_RUNTIME_V2'

function loadData () {
  try {
    if (!sessionStorage.getItem(SESSION_KEY)) {
      const initialData = cloneDefaultData()
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(initialData))
      sessionStorage.setItem(SESSION_KEY, 'active')
      return initialData
    }
    const saved = localStorage.getItem(DEMO_STORAGE_KEY)
    return saved ? JSON.parse(saved) : cloneDefaultData()
  } catch (e) {
    return cloneDefaultData()
  }
}

function persist (state) {
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state.data))
}

export default {
  namespaced: true,
  state: {data: loadData()},
  mutations: {
    assignPatient (state, payload) {
      const current = state.data.assignments.find(item => item.patientId === payload.patientId && item.status === 'ACTIVE')
      if (current) {
        current.doctorId = payload.doctorId
        current.assignedBy = payload.assignedBy
        current.assignedAt = payload.assignedAt
      } else {
        state.data.assignments.push(payload)
      }
      state.data.consultations.filter(item => item.patientId === payload.patientId && item.status === 'PENDING').forEach(item => {
        item.doctorId = payload.doctorId
      })
      persist(state)
    },
    acceptConsultation (state, payload) {
      const item = state.data.consultations.find(row => row.id === payload.id)
      if (item) {
        item.status = 'ONGOING'
        item.acceptedAt = payload.acceptedAt
        if (!item.doctorId && payload.doctorId) item.doctorId = payload.doctorId
      }
      persist(state)
    },
    sendMessage (state, payload) {
      state.data.messages.push(payload)
      persist(state)
    },
    endConsultation (state, payload) {
      const item = state.data.consultations.find(row => row.id === payload.id)
      if (item) {
        item.status = 'COMPLETED'
        item.completedAt = payload.completedAt
      }
      persist(state)
    },
    saveRecord (state, payload) {
      const index = state.data.medicalRecords.findIndex(item => item.id === payload.id)
      if (index >= 0) state.data.medicalRecords.splice(index, 1, payload)
      else state.data.medicalRecords.push(payload)
      persist(state)
    },
    addOrder (state, payload) {
      state.data.medicalOrders.push(payload)
      persist(state)
    },
    reviewRecord (state, payload) {
      const item = state.data.medicalRecords.find(row => row.id === payload.id)
      if (item) {
        item.status = 'REVIEWED'
        item.reviewedBy = payload.reviewedBy
        item.reviewedAt = payload.reviewedAt
        item.updatedAt = payload.reviewedAt
      }
      persist(state)
    }
  }
}
