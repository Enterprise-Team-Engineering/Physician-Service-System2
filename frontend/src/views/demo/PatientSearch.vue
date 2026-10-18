<template>
  <a-card :bordered="false" class="card-area">
    <a-form layout="horizontal" class="search-form">
      <a-row :gutter="16">
        <a-col :md="6" :sm="24"><a-form-item label="Patient ID"><a-input v-model="query.id" placeholder="P100001 or 1001"/></a-form-item></a-col>
        <a-col :md="6" :sm="24"><a-form-item label="Name"><a-input v-model="query.name" placeholder="Patient name"/></a-form-item></a-col>
        <a-col :md="6" :sm="24"><a-form-item label="Phone"><a-input v-model="query.phone" placeholder="Phone number"/></a-form-item></a-col>
        <a-col :md="6" :sm="24" class="search-actions"><a-button type="primary" icon="search" @click="search">Search</a-button><a-button icon="reload" @click="reset">Reset</a-button></a-col>
      </a-row>
    </a-form>
    <a-table :columns="columns" :dataSource="results" :rowKey="row => row.id" :pagination="{pageSize: 8}">
      <template slot="assignment" slot-scope="text, row"><a-tag :color="doctorName(row.id) === 'Unassigned' ? 'default' : 'blue'">{{doctorName(row.id)}}</a-tag></template>
      <template slot="action" slot-scope="text, row"><a-button size="small" icon="profile" @click="$router.push(`/app/patients/${row.id}`)">View Profile</a-button></template>
    </a-table>
  </a-card>
</template>

<script>
import {mapState} from 'vuex'
import demoService from '@/services/demoService'

export default {
  name: 'PatientSearch',
  data () {
    return {
      query: {id: '', name: '', phone: ''}, results: [],
      columns: [
        {title: 'Patient ID', dataIndex: 'idNumber', width: 130}, {title: 'Name', dataIndex: 'name'},
        {title: 'Gender', dataIndex: 'gender', width: 100}, {title: 'Age', dataIndex: 'age', width: 80},
        {title: 'Phone', dataIndex: 'phone', width: 145}, {title: 'Primary Diagnosis', dataIndex: 'primaryDiagnosis'},
        {title: 'Current Doctor', scopedSlots: {customRender: 'assignment'}, width: 150},
        {title: 'Action', scopedSlots: {customRender: 'action'}, width: 130}
      ]
    }
  },
  computed: mapState({demo: state => state.demo.data}),
  created () { this.results = demoService.searchPatients() },
  methods: {
    search () {
      const normalized = Object.assign({}, this.query)
      if (normalized.id && normalized.id.toUpperCase().indexOf('P') === 0) {
        const match = this.demo.patients.find(item => item.idNumber.toLowerCase().indexOf(normalized.id.toLowerCase()) >= 0)
        normalized.id = match ? match.id : '-1'
      }
      this.results = demoService.searchPatients(normalized)
    },
    reset () { this.query = {id: '', name: '', phone: ''}; this.search() },
    doctorName (patientId) {
      const assignment = demoService.getAssignment(patientId)
      const doctor = assignment && demoService.getDoctor(assignment.doctorId)
      return doctor ? doctor.name : 'Unassigned'
    }
  }
}
</script>

<style lang="less" scoped>
.search-form { padding: 12px 16px 0; margin-bottom: 18px; background: #fafafa; border: 1px solid #eee; }
.search-actions { padding-top: 38px; }
.search-actions .ant-btn + .ant-btn { margin-left: 8px; }
</style>
