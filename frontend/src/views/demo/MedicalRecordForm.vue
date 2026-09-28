<template>
  <div class="record-page">
    <a-card :bordered="false" class="record-card">
      <div class="record-title">
        <div><h3>{{form.id ? `Medical Record #${form.id}` : 'Create Medical Record'}}</h3><span>{{patient.name}} · {{patient.idNumber}} · {{doctor.name}}</span></div>
        <a-tag :color="statusColor">{{form.status}}</a-tag>
      </div>
      <a-alert v-if="form.status === 'REVIEWED'" type="success" showIcon :message="`Reviewed on ${form.reviewedAt}`" style="margin-bottom: 20px"/>
      <a-form layout="vertical">
        <a-form-item label="Chief Complaint"><a-textarea v-model="form.chiefComplaint" :rows="3" :disabled="readOnly" placeholder="Describe the patient's main symptoms and duration"/></a-form-item>
        <a-form-item label="History of Present Illness"><a-textarea v-model="form.historyOfPresentIllness" :rows="4" :disabled="readOnly" placeholder="Document symptom development, relevant history and observations"/></a-form-item>
        <a-form-item label="Diagnosis"><a-textarea v-model="form.diagnosis" :rows="3" :disabled="readOnly" placeholder="Enter the clinical diagnosis"/></a-form-item>
        <a-form-item label="Treatment Plan"><a-textarea v-model="form.treatmentPlan" :rows="4" :disabled="readOnly" placeholder="Enter treatment, follow-up and patient guidance"/></a-form-item>
      </a-form>
      <a-divider orientation="left">Medical Orders</a-divider>
      <div class="order-tools"><span>{{orders.length}} order(s)</span><a-button v-if="!readOnly" type="primary" ghost icon="plus" @click="openOrder">Add Medical Order</a-button></div>
      <a-table size="small" :columns="orderColumns" :dataSource="orders" :rowKey="row => row.id" :pagination="false">
        <template slot="type" slot-scope="text"><a-tag color="blue">{{typeLabel(text)}}</a-tag></template>
      </a-table>
      <div v-if="!readOnly" class="form-actions">
        <a-button icon="save" @click="saveDraft">Save Draft</a-button>
        <a-button type="primary" icon="check" @click="submit">Submit</a-button>
      </div>
    </a-card>
    <a-modal title="Add Medical Order" :visible="orderVisible" okText="Add Order" @ok="addOrder" @cancel="orderVisible = false">
      <a-form layout="vertical">
        <a-form-item label="Order Type"><a-select v-model="newOrder.orderType"><a-select-option value="MEDICATION">Medication</a-select-option><a-select-option value="LAB_TEST">Lab Test</a-select-option><a-select-option value="OTHER">Other</a-select-option></a-select></a-form-item>
        <a-form-item label="Content"><a-textarea v-model="newOrder.content" :rows="4" placeholder="e.g. Amoxicillin 500 mg, three times daily."/></a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script>
import {mapState} from 'vuex'
import demoService from '@/services/demoService'
export default {
  name: 'MedicalRecordForm',
  data () { return {
    form: {id: null, patientId: null, doctorId: null, departmentId: 1, consultationId: null, chiefComplaint: '', historyOfPresentIllness: '', diagnosis: '', treatmentPlan: '', status: 'DRAFT', reviewedBy: null, reviewedAt: null, createdAt: '', updatedAt: ''},
    orderVisible: false, newOrder: {orderType: 'MEDICATION', content: ''},
    orderColumns: [
      {title: 'Order ID', dataIndex: 'id', width: 100}, {title: 'Type', dataIndex: 'orderType', scopedSlots: {customRender: 'type'}, width: 130},
      {title: 'Content', dataIndex: 'content'}, {title: 'Created Time', dataIndex: 'createdAt', width: 175}
    ]
  } },
  computed: {
    ...mapState({user: state => state.account.user, demo: state => state.demo.data}),
    patient () { return demoService.getPatient(this.form.patientId) || {} },
    doctor () { return demoService.getDoctor(this.form.doctorId) || {name: this.user.name} },
    orders () { return this.form.id ? demoService.getOrders(this.form.id) : [] },
    readOnly () { return this.user.roleCode === 'DEPT_ADMIN' },
    statusColor () { return {DRAFT: 'default', SUBMITTED: 'orange', REVIEWED: 'green'}[this.form.status] }
  },
  created () {
    if (this.$route.params.id) {
      const existing = demoService.getRecord(this.$route.params.id)
      if (existing) this.form = Object.assign({}, existing)
    } else {
      const consultationId = Number(this.$route.query.consultationId) || null
      this.form.patientId = Number(this.$route.params.patientId)
      this.form.doctorId = this.user.id
      this.form.consultationId = consultationId
    }
  },
  methods: {
    typeLabel (type) { return {MEDICATION: 'Medication', LAB_TEST: 'Lab Test', OTHER: 'Other'}[type] },
    persist (status) {
      const payload = Object.assign({}, this.form, {status: status || this.form.status})
      this.form = status === 'SUBMITTED' ? demoService.submitRecord(payload) : demoService.saveRecord(payload)
      if (!this.$route.params.id) this.$router.replace(`/app/records/${this.form.id}`)
    },
    saveDraft () { this.persist('DRAFT'); this.$message.success('Draft saved locally') },
    openOrder () {
      if (!this.form.id) this.persist('DRAFT')
      this.newOrder = {orderType: 'MEDICATION', content: ''}
      this.orderVisible = true
    },
    addOrder () {
      if (!this.newOrder.content.trim()) { this.$message.warning('Please enter the medical order content'); return }
      demoService.addOrder({medicalRecordId: this.form.id, patientId: this.form.patientId, doctorId: this.form.doctorId, orderType: this.newOrder.orderType, content: this.newOrder.content.trim()})
      this.orderVisible = false
      this.$message.success('Medical order added')
    },
    submit () {
      if (!this.form.chiefComplaint.trim() || !this.form.diagnosis.trim()) { this.$message.warning('Chief complaint and diagnosis are required'); return }
      this.$confirm({title: 'Submit this medical record?', content: 'The record will be sent to the Department Admin for review.', okText: 'Submit', cancelText: 'Cancel', onOk: () => {
        this.persist('SUBMITTED')
        this.$message.success('Medical record submitted for review')
      }})
    }
  }
}
</script>

<style lang="less" scoped>
.record-page, .record-card { width: 100%; }
.record-card { max-width: none; margin: 0; }
.record-card /deep/ .ant-form,
.record-card /deep/ .ant-form-item-control-wrapper,
.record-card /deep/ .ant-form-item-control,
.record-card /deep/ .ant-form-item-children,
.record-card /deep/ textarea.ant-input { width: 100%; }
.record-title { display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px; padding-bottom: 15px; border-bottom: 1px solid #eee; }
.record-title h3 { margin: 0 0 4px; }.record-title span { color: rgba(0, 0, 0, .45); }
.order-tools { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; color: rgba(0, 0, 0, .45); }
.form-actions { display: flex; justify-content: flex-end; margin-top: 24px; padding-top: 18px; border-top: 1px solid #eee; }
.form-actions .ant-btn + .ant-btn { margin-left: 10px; }
</style>
