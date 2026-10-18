<template>
  <div>
    <a-dropdown style="display: inline-block; height: 100%; vertical-align: initial">
      <span class="account-trigger">
        <a-avatar class="avatar" size="small" shape="square" icon="user"/>
        <span class="curr-user">{{user.name || user.username}}</span>
        <a-tag class="role-tag" color="blue">{{user.roleName}}</a-tag>
      </span>
      <a-menu style="width: 210px" slot="overlay">
        <a-menu-item @click="openProfile"><a-icon type="idcard"/> Personal Profile</a-menu-item>
        <a-menu-divider/>
        <a-menu-item @click="logout"><a-icon type="logout"/> Sign Out</a-menu-item>
      </a-menu>
    </a-dropdown>
  </div>
</template>

<script>
import {mapState} from 'vuex'

export default {
  name: 'HeaderAvatar',
  computed: mapState({user: state => state.account.user}),
  methods: {
    openProfile () {
      this.$router.push('/app/profile')
    },
    logout () {
      ;['USER_TOKEN', 'EXPIRE_TIME', 'USER', 'PERMISSIONS', 'ROLES', 'USER_ROUTER'].forEach(key => localStorage.removeItem(key))
      window.location.hash = '#/login'
      window.location.reload()
    }
  }
}
</script>

<style lang="less" scoped>
.account-trigger { cursor: pointer; white-space: nowrap; }
.avatar { margin: 15px 4px 15px 0; color: #1890ff; background: #e6f7ff; vertical-align: middle; }
.curr-user { font-weight: 600; margin-left: 6px; }
.role-tag { margin-left: 8px; }
</style>
