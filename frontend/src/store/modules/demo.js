import {apiGet} from '@/services/api'

function emptyData () {
  return {
    doctors: [],
    patients: [],
    assignments: [],
    consultations: [],
    messages: [],
    medicalRecords: [],
    medicalOrders: []
  }
}

export default {
  namespaced: true,
  state: {data: emptyData(), loaded: false},
  mutations: {
    setData (state, payload) {
      state.data = payload || emptyData()
      state.loaded = true
    }
  },
  actions: {
    load ({commit}) {
      return apiGet('/bootstrap').then(data => {
        commit('setData', data)
        return data
      })
    }
  }
}
