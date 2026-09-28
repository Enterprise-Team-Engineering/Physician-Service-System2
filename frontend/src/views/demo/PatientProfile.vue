<template>
  <div class="patient-profile">
    <a-card :bordered="false" class="profile-banner">
      <div><a-avatar :size="64" icon="user"/><span><h2>{{patient.name}}</h2><p>{{patient.idNumber}} · {{patient.gender}}, {{patient.age}} years · {{patient.phone}}</p></span></div>
      <div class="profile-actions"><a-tag :color="doctorName === 'Unassigned' ? 'orange' : 'blue'">{{doctorName}}</a-tag><a-button v-if="user.roleCode === 'DOCTOR'" type="primary" icon="file-add" @click="createRecord">Create Medical Record</a-button></div>
    </a-card>
    <a-card :bordered="false" class="tabs-card">
      <a-tabs>
        <a-tab-pane key="basic" tab="Basic Information">
          <a-row :gutter="16"><a-col v-for="item in basicFields" :key="item.label" :md="8" :sm="12" :xs="24"><div class="info-field"><span>{{item.label}}</span><b>{{item.value}}</b></div></a-col></a-row>
        </a-tab-pane>
        <a-tab-pane key="medical" tab="Medical Information">
          <div class="medical-field"><span>Medical History</span><p>{{patient.medicalHistory}}</p></div>
          <div class="medical-field"><span>Allergies</span><p>{{patient.allergies}}</p></div>
          <div class="medical-field"><span>Primary Diagnosis</span><p>{{patient.primaryDiagnosis}}</p></div>
        </a-tab-pane>
        <a-tab-pane key="consultations" tab="Consultation History">
          <a-table size="small" :columns="consultationColumns" :dataSource="consultations" :rowKey="row => row.id" :pagination="false">
            <template slot="status" slot-scope="text"><a-tag :color="consultationColor(text)">{{text}}</a-tag></template>
            <template slot="action" slot-scope="text, row"><a-button v-if="user.roleCode === 'DOCTOR'" size="small" icon="message" @click="$router.push(`/app/consultations/${row.id}/chat`)">View</a-button><span v-else>-</span></template>
          </a-table>
        </a-tab-pane>
        <a-tab-pane key="records" tab="Medical Records">
          <a-table size="small" :columns="recordColumns" :dataSource="records" :rowKey="row => row.id" :pagination="false">
            <template slot="doctor" slot-scope="text, row">{{recordDoctor(row.doctorId)}}</template>
            <template slot="status" slot-scope="text"><a-tag :color="recordColor(text)">{{text}}</a-tag></template>
            <template slot="action" slot-scope="text, row"><a-button size="small" icon="file-text" @click="$router.push(`/app/records/${row.id}`)">View</a-button></template>
          </a-table>
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<script>
import {mapState} from 'vuex'
import demoService from '@/services/demoService'
export default {
  name: 'PatientProfile',
  data () { return {
    consultationColumns: [
      {title: 'Date', dataIndex: 'createdAt', width: 175}, {title: 'Summary', dataIndex: 'summary'},
      {title: 'Status', dataIndex: 'status', scopedSlots: {customRender: 'status'}, width: 120},
      {title: 'Action', scopedSlots: {customRender: 'action'}, width: 90}
    ],
    recordColumns: [
      {title: 'Date', dataIndex: 'createdAt', width: 175}, {title: 'Doctor', scopedSlots: {customRender: 'doctor'}},
      {title: 'Diagnosis', dataIndex: 'diagnosis'}, {title: 'Status', dataIndex: 'status', scopedSlots: {customRender: 'status'}, width: 120},
      {title: 'Action', scopedSlots: {customRender: 'action'}, width: 90}
    ]
  } },
  computed: {
    ...mapState({user: state => state.account.user, demo: state => state.demo.data}),
    patient () { return demoService.getPatient(this.$route.params.id) || {} },
    basicFields () { return [
      {label: 'Name', value: this.patient.name}, {label: 'Gender', value: this.patient.gender}, {label: 'Age', value: this.patient.age},
      {label: 'Date of Birth', value: this.patient.dateOfBirth}, {label: 'Phone', value: this.patient.phone}, {label: 'Patient ID', value: this.patient.idNumber}
    ] },
    doctorName () { const assignment = demoService.getAssignment(this.patient.id); const doctor = assignment && demoService.getDoctor(assignment.doctorId); return doctor ? doctor.name : 'Unassigned' },
    consultations () { return this.demo.consultations.filter(item => item.patientId === this.patient.id).slice().sort((a, b) => b.id - a.id) },
    records () { return demoService.getRecords({patientId: this.patient.id}).slice().sort((a, b) => b.id - a.id) }
  },
  methods: {
    recordDoctor (id) { const item = demoService.getDoctor(id); return item ? item.name : '-' },
    consultationColor (status) { return {PENDING: 'orange', ONGOING: 'blue', COMPLETED: 'green'}[status] },
    recordColor (status) { return {DRAFT: 'default', SUBMITTED: 'orange', REVIEWED: 'green'}[status] },
    createRecord () {
      const latest = this.consultations.find(item => item.status === 'COMPLETED')
      this.$router.push(`/app/records/create/${this.patient.id}${latest ? `?consultationId=${latest.id}` : ''}`)
    }
  }
}
</script>

<style lang="less" scoped>
.profile-banner { margin-bottom: 14px; }.profile-banner /deep/ .ant-card-body, .profile-banner > div { display: flex; justify-content: space-between; align-items: center; }
.profile-banner .ant-avatar { margin-right: 16px; color: #1890ff; background: #e6f7ff; }.profile-banner h2 { margin: 0 0 5px; }.profile-banner p { margin: 0; color: rgba(0, 0, 0, .55); }
.profile-actions .ant-tag { margin-right: 10px; }.tabs-card { min-height: 430px; }
.info-field { min-height: 72px; padding: 13px 16px; margin-bottom: 16px; background: #fafafa; border: 1px solid #eee; }.info-field span, .medical-field span { display: block; color: rgba(0, 0, 0, .45); font-size: 12px; margin-bottom: 5px; }
.medical-field { padding: 14px 16px; margin-bottom: 14px; border-left: 3px solid #1890ff; background: #fafafa; }.medical-field p { margin: 0; white-space: normal; }
</style>
