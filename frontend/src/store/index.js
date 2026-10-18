import Vue from 'vue'
import Vuex from 'vuex'
import account from './modules/account'
import setting from './modules/setting'
import demo from './modules/demo'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    account,
    setting,
    demo
  }
})
