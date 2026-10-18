<template>
  <a-card :bordered="false" class="card-area">
    <div class="record-head">
      <div><b>Patient Medical Records</b><span>Structured records created for your assigned patients.</span></div>
      <a-select v-model="status" style="width: 150px"><a-select-option value="ALL">All Statuses</a-select-option><a-select-option value="DRAFT">Draft</a-select-option><a-select-option value="SUBMITTED">Submitted</a-select-option><a-select-option value="REVIEWED">Reviewed</a-select-option></a-select>
    </div>
    <a-table :columns="columns" :dataSource="rows" :rowKey="row => row.id" :pagination="{pageSize: 8}">
      <template slot="patient" slot-scope="text, row">{{patientName(row.patientId)}}</template>
      <template slot="status" slot-scope="text"><a-tag :color="statusColor(text)">{{text}}</a-tag></template>
      <template slot="action" slot-scope="text, row"><a-button size="small" icon="file-text" @click="$router.push(`/app/records/${row.id}`)">{{row.status === 'DRAFT' ? 'Edit' : 'View'}}</a-button></template>
    </a-table>
  </a-card>
</template>

<script>
import {mapState} from 'vuex'
import demoService from '@/services/demoService'
export default {
  name: 'MedicalRecords',
  data () { return {status: 'ALL', columns: [
    {title: 'Record ID', dataIndex: 'id', width: 110}, {title: 'Patient', scopedSlots: {customRender: 'patient'}},
    {title: 'Diagnosis', dataIndex: 'diagnosis'}, {title: 'Updated Time', dataIndex: 'updatedAt', width: 175},
    {title: 'Status', dataIndex: 'status', scopedSlots: {customRender: 'status'}, width: 120},
    {title: 'Action', scopedSlots: {customRender: 'action'}, width: 100}
  ]} },
  computed: {
    ...mapState({user: state => state.account.user, demo: state => state.demo.data}),
    rows () { return demoService.getRecords({doctorId: this.user.id, status: this.status === 'ALL' ? null : this.status}).slice().sort((a, b) => b.id - a.id) }
  },
  methods: {
    patientName (id) { const item = demoService.getPatient(id); return item ? item.name : '-' },
    statusColor (status) { return {DRAFT: 'default', SUBMITTED: 'orange', REVIEWED: 'green'}[status] }
  }
}
</script>
<style lang="less" scoped>.record-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }.record-head span { display: block; margin-top: 4px; color: rgba(0, 0, 0, .45); font-size: 12px; }</style>
