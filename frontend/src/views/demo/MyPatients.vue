<template>
  <a-card :bordered="false" class="card-area">
    <div class="table-heading">
      <div><b>Assigned Patients</b><span>Patients currently assigned to {{user.name}}</span></div>
      <a-input-search v-model="keyword" placeholder="Search name, ID or phone" style="width: 280px"/>
    </div>
    <a-table :columns="columns" :dataSource="filteredPatients" :rowKey="row => row.id" :pagination="{pageSize: 8}">
      <template slot="patientId" slot-scope="text, row">{{row.idNumber}}</template>
      <template slot="action" slot-scope="text, row">
        <a-button type="primary" size="small" icon="profile" @click="openProfile(row.id)">View Profile</a-button>
      </template>
    </a-table>
  </a-card>
</template>

<script>
import {mapState} from 'vuex'
import demoService from '@/services/demoService'

export default {
  name: 'MyPatients',
  data () {
    return {
      keyword: '',
      columns: [
        {title: 'Patient ID', scopedSlots: {customRender: 'patientId'}, width: 130},
        {title: 'Name', dataIndex: 'name'}, {title: 'Gender', dataIndex: 'gender', width: 100},
        {title: 'Age', dataIndex: 'age', width: 80}, {title: 'Phone', dataIndex: 'phone', width: 145},
        {title: 'Primary Diagnosis', dataIndex: 'primaryDiagnosis'},
        {title: 'Action', scopedSlots: {customRender: 'action'}, width: 140}
      ]
    }
  },
  computed: {
    ...mapState({user: state => state.account.user, demo: state => state.demo.data}),
    filteredPatients () {
      const keyword = this.keyword.trim().toLowerCase()
      return demoService.getMyPatients(this.user.id).filter(item => !keyword || `${item.idNumber} ${item.name} ${item.phone}`.toLowerCase().indexOf(keyword) >= 0)
    }
  },
  methods: {
    openProfile (id) { this.$router.push(`/app/patients/${id}`) }
  }
}
</script>

<style lang="less" scoped>
.table-heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
.table-heading span { display: block; margin-top: 4px; color: rgba(0, 0, 0, .45); font-size: 12px; }
</style>
