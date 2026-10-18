import 'babel-polyfill'
import Vue from 'vue'
import Febs from './FEBS'
import router from './router'
import Antd from 'ant-design-vue'
import store from './store'
import request from 'utils/request'
import db from 'utils/localstorage'
import VueApexCharts from 'vue-apexcharts'


import 'ant-design-vue/dist/antd.css'

import 'utils/install'

import Es6Promise from 'es6-promise'
Es6Promise.polyfill()

Vue.config.productionTip = false
Vue.use(Antd)
Vue.use(db)
Vue.use(VueApexCharts)

Vue.component('apexchart', VueApexCharts)

Vue.use({
  install (Vue) {
    Vue.prototype.$db = db
  }
})

Vue.prototype.$post = request.post
Vue.prototype.$get = request.get
Vue.prototype.$put = request.put
Vue.prototype.$delete = request.delete
Vue.prototype.$export = request.export
Vue.prototype.$download = request.download
Vue.prototype.$upload = request.upload

function start () {
  /* eslint-disable no-new */
  new Vue({
    router,
    store,
    render: h => h(Febs)
  }).$mount('#febs')
}

const token = db.get('USER_TOKEN', '')
if (token) {
  store.dispatch('demo/load').then(start).catch(error => {
    if (error.status === 401) {
      db.remove('USER_TOKEN')
      db.remove('USER')
    }
    start()
  })
} else {
  start()
}
