<template>
  <a-card :bordered="false" class="login-card">
    <div class="login-label"><a-icon type="medicine-box"/> Secure Account Access</div>
    <a-alert v-if="error" type="error" :message="error" showIcon closable @close="error = ''"/>
    <a-form @submit.prevent="doLogin" :autoFormCreate="form => this.form = form">
      <a-form-item
        fieldDecoratorId="name"
        :fieldDecoratorOptions="{initialValue: 'doctor', rules: [{required: true, message: 'Please enter a username'}]}">
        <a-input size="large" placeholder="Username">
          <a-icon slot="prefix" type="user"/>
        </a-input>
      </a-form-item>
      <a-form-item
        fieldDecoratorId="password"
        :fieldDecoratorOptions="{rules: [{required: true, message: 'Please enter a password'}]}">
        <a-input size="large" type="password" placeholder="Password">
          <a-icon slot="prefix" type="lock"/>
        </a-input>
      </a-form-item>
      <a-form-item>
        <a-button :loading="loading" block size="large" htmlType="submit" type="primary">Sign In</a-button>
      </a-form-item>
    </a-form>
  </a-card>
</template>

<script>
import {mapMutations} from 'vuex'
import {apiPost} from '@/services/api'
import {getDemoMenu} from '@/demo/menu'

export default {
  name: 'Login',
  data () {
    return {loading: false, error: ''}
  },
  created () {
    this.clearSession()
  },
  methods: {
    clearSession () {
      ;['USER_TOKEN', 'EXPIRE_TIME', 'USER', 'PERMISSIONS', 'ROLES', 'USER_ROUTER'].forEach(key => localStorage.removeItem(key))
    },
    doLogin () {
      this.form.validateFields((errors, values) => {
        if (errors) return
        this.login(values.name, values.password)
      })
    },
    login (username, password) {
      this.loading = true
      this.error = ''
      apiPost('/login', {username: String(username).trim().toLowerCase(), password}).then(result => {
        const user = result.user
        this.setToken(result.token)
        this.setExpireTime(Date.now() + 86400000)
        this.setUser(user)
        this.setPermissions(['system:access'])
        this.setRoles([user.roleCode])
        this.setTheme('light')
        this.setLayout('side')
        this.setMultipage(false)
        this.fixSiderbar(true)
        this.fixHeader(true)
        localStorage.setItem('USER_ROUTER', JSON.stringify(getDemoMenu(user.roleCode)))
        window.location.hash = '#/app/dashboard'
        window.location.reload()
      }).catch(error => {
        this.loading = false
        this.error = error.message || 'Invalid username or password.'
      })
    },
    ...mapMutations({
      setToken: 'account/setToken', setExpireTime: 'account/setExpireTime', setPermissions: 'account/setPermissions',
      setRoles: 'account/setRoles', setUser: 'account/setUser', setTheme: 'setting/setTheme', setLayout: 'setting/setLayout',
      setMultipage: 'setting/setMultipage', fixSiderbar: 'setting/fixSiderbar', fixHeader: 'setting/fixHeader'
    })
  }
}
</script>

<style lang="less" scoped>
.login-card { margin-top: 28px; background: rgba(255, 255, 255, .96); box-shadow: 0 8px 28px rgba(0, 0, 0, .12); }
.login-label { margin-bottom: 22px; color: #1890ff; font-weight: 600; font-size: 15px; }
.ant-alert { margin-bottom: 18px; }
</style>
