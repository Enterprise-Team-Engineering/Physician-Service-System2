<template>
  <a-card :bordered="false" class="card-area">
    <a-table :columns="columns" :dataSource="rows" :rowKey="row => row.id" :pagination="{pageSize: 8}">
      <template slot="patient" slot-scope="text, row">{{patientName(row.patientId)}}</template>
      <template slot="status"><a-tag color="green">COMPLETED</a-tag></template>
      <template slot="action" slot-scope="text, row">
        <div class="action-buttons">
          <a-button size="small" icon="message" @click="$router.push(`/app/consultations/${row.id}/chat`)">View Chat</a-button>
          <a-button size="small" type="primary" icon="file-add" @click="createRecord(row)">Create EMR</a-button>
        </div>
      </template>
    </a-table>
  </a-card>
</template>

<script>
import {mapState} from 'vuex'
import demoService from '@/services/demoService'
export default {
  name: 'ConsultationHistory',
  data () { return {columns: [
    {title: 'Consultation ID', dataIndex: 'id', width: 130}, {title: 'Patient', scopedSlots: {customRender: 'patient'}},
    {title: 'Summary', dataIndex: 'summary'}, {title: 'Completed Time', dataIndex: 'completedAt', width: 175},
    {title: 'Status', scopedSlots: {customRender: 'status'}, width: 120}, {title: 'Action', scopedSlots: {customRender: 'action'}, width: 245}
  ]} },
  computed: {
    ...mapState({user: state => state.account.user}),
    rows () { return demoService.getConsultations(this.user.id, 'COMPLETED').slice().sort((a, b) => b.id - a.id) }
  },
  methods: {
    patientName (id) { const item = demoService.getPatient(id); return item ? item.name : '-' },
    createRecord (row) {
      this.$router.push(`/app/records/create/${row.patientId}?consultationId=${row.id}`)
    }
  }
}
</script>
<style scoped>
.action-buttons { display: inline-flex; align-items: center; gap: 8px; white-space: nowrap; }
</style>
