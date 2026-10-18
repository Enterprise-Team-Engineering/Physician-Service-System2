<template>
  <a-card :bordered="false" class="profile-card">
    <div class="profile-head"><a-avatar :size="72" icon="user"/><div><h2>{{profile.name}}</h2><a-tag color="blue">{{user.roleName}}</a-tag></div></div>
    <a-divider/>
    <a-row :gutter="24">
      <a-col :md="12" :xs="24" v-for="item in fields" :key="item.label">
        <div class="field"><span>{{item.label}}</span><b>{{item.value}}</b></div>
      </a-col>
    </a-row>
  </a-card>
</template>

<script>
import {mapState} from 'vuex'
import demoService from '@/services/demoService'
export default {
  name: 'DemoPersonalProfile',
  computed: {
    ...mapState({user: state => state.account.user, demo: state => state.demo.data}),
    profile () {
      if (this.user.roleCode === 'DOCTOR') return demoService.getDoctor(this.user.id)
      return {name: this.user.name, departmentName: 'Internal Medicine', title: 'Department Administrator', phone: '13800002001', email: 'admin.internal@example.com'}
    },
    fields () { return [
      {label: 'Name', value: this.profile.name}, {label: 'Department', value: this.profile.departmentName},
      {label: 'Professional Title', value: this.profile.title}, {label: 'Phone', value: this.profile.phone},
      {label: 'Email', value: this.profile.email}, {label: 'Username', value: this.user.username}
    ] }
  }
}
</script>

<style lang="less" scoped>
.profile-card { max-width: 900px; }
.profile-head { display: flex; align-items: center; padding: 16px; }
.profile-head .ant-avatar { margin-right: 18px; color: #1890ff; background: #e6f7ff; }
.profile-head h2 { margin: 0 0 8px; }
.field { padding: 14px 18px; margin-bottom: 12px; background: #fafafa; border-left: 3px solid #1890ff; }
.field span { display: block; color: rgba(0, 0, 0, .45); font-size: 12px; margin-bottom: 5px; }
</style>
