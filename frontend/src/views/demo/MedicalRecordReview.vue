<template>
  <a-card :bordered="false" class="card-area">
    <div class="review-head"><div><b>Medical Record Review</b><span>Review records submitted by department doctors.</span></div><a-radio-group v-model="status"><a-radio-button value="ALL">All</a-radio-button><a-radio-button value="SUBMITTED">Pending Review</a-radio-button><a-radio-button value="REVIEWED">Reviewed</a-radio-button></a-radio-group></div>
    <a-alert class="review-alert" type="info" showIcon :message="`${pendingCount} medical record(s) awaiting review`" description="Select Review to inspect the diagnosis, treatment plan, and medical orders before approval."/>
    <a-table :columns="columns" :dataSource="rows" :rowKey="row => row.id" :pagination="{pageSize: 8}">
      <template slot="patient" slot-scope="text, row">{{patientName(row.patientId)}}</template>
      <template slot="doctor" slot-scope="text, row">{{doctorName(row.doctorId)}}</template>
      <template slot="status" slot-scope="text"><a-tag :color="text === 'REVIEWED' ? 'green' : 'orange'">{{text}}</a-tag></template>
      <template slot="action" slot-scope="text, row"><a-button :type="row.status === 'SUBMITTED' ? 'primary' : 'default'" size="small" icon="audit" @click="open(row)">{{row.status === 'SUBMITTED' ? 'Review' : 'View'}}</a-button></template>
    </a-table>
    <a-modal title="Medical Record Review" width="760px" :visible="visible" :footer="null" @cancel="visible = false">
      <template v-if="selected">
        <div class="review-summary"><b>#{{selected.id}} · {{patientName(selected.patientId)}}</b><a-tag :color="selected.status === 'REVIEWED' ? 'green' : 'orange'">{{selected.status}}</a-tag></div>
        <div class="review-section"><span>Chief Complaint</span><p>{{selected.chiefComplaint}}</p></div>
        <div class="review-section"><span>History of Present Illness</span><p>{{selected.historyOfPresentIllness}}</p></div>
        <div class="review-section"><span>Diagnosis</span><p>{{selected.diagnosis}}</p></div>
        <div class="review-section"><span>Treatment Plan</span><p>{{selected.treatmentPlan}}</p></div>
        <a-table size="small" :columns="orderColumns" :dataSource="orders" :rowKey="row => row.id" :pagination="false"/>
        <div class="review-actions"><a-button @click="visible = false">Close</a-button><a-button v-if="selected.status === 'SUBMITTED'" type="primary" icon="check-circle" @click="markReviewed">Mark as Reviewed</a-button></div>
      </template>
    </a-modal>
  </a-card>
</template>

<script>
import {mapState} from 'vuex'
import demoService from '@/services/demoService'
export default {
  name: 'MedicalRecordReview',
  data () { return {
    status: 'SUBMITTED', visible: false, selected: null,
    columns: [
      {title: 'Record ID', dataIndex: 'id', width: 110}, {title: 'Patient', scopedSlots: {customRender: 'patient'}},
      {title: 'Doctor', scopedSlots: {customRender: 'doctor'}}, {title: 'Diagnosis', dataIndex: 'diagnosis'},
      {title: 'Created Time', dataIndex: 'createdAt', width: 175}, {title: 'Status', dataIndex: 'status', scopedSlots: {customRender: 'status'}, width: 120},
      {title: 'Action', scopedSlots: {customRender: 'action'}, width: 100}
    ],
    orderColumns: [{title: 'Order Type', dataIndex: 'orderType', width: 140}, {title: 'Medical Order', dataIndex: 'content'}]
  } },
  computed: {
    ...mapState({user: state => state.account.user, demo: state => state.demo.data}),
    pendingCount () { return this.demo.medicalRecords.filter(item => item.status === 'SUBMITTED').length },
    rows () { return this.demo.medicalRecords.filter(item => item.status !== 'DRAFT' && (this.status === 'ALL' || item.status === this.status)).slice().sort((a, b) => b.id - a.id) },
    orders () { return this.selected ? demoService.getOrders(this.selected.id) : [] }
  },
  methods: {
    patientName (id) { const item = demoService.getPatient(id); return item ? item.name : '-' },
    doctorName (id) { const item = demoService.getDoctor(id); return item ? item.name : '-' },
    open (row) { this.selected = row; this.visible = true },
    markReviewed () {
      demoService.reviewRecord(this.selected.id, this.user.id)
      this.selected = demoService.getRecord(this.selected.id)
      this.$message.success('Medical record marked as reviewed')
    }
  }
}
</script>

<style lang="less" scoped>
.review-head, .review-summary, .review-actions { display: flex; justify-content: space-between; align-items: center; }
.review-head { margin-bottom: 18px; }.review-head span { display: block; margin-top: 4px; color: rgba(0, 0, 0, .45); font-size: 12px; }
.review-alert { margin-bottom: 16px; }
.review-summary { padding: 12px; margin-bottom: 15px; background: #fafafa; }
.review-section { margin-bottom: 14px; }.review-section span { color: rgba(0, 0, 0, .45); font-size: 12px; }.review-section p { margin: 4px 0 0; white-space: pre-wrap; }
.review-actions { justify-content: flex-end; margin-top: 20px; }.review-actions .ant-btn + .ant-btn { margin-left: 8px; }
</style>
