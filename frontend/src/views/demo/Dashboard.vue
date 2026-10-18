<template>
  <div class="demo-dashboard">
    <a-row :gutter="16">
      <a-col v-for="item in statistics" :key="item.title" :md="6" :sm="12" :xs="24">
        <a-card :bordered="false" class="stat-card">
          <div class="stat-icon" :style="{background: item.color}"><a-icon :type="item.icon"/></div>
          <div class="stat-copy"><span>{{item.title}}</span><strong>{{item.value}}</strong></div>
        </a-card>
      </a-col>
    </a-row>
    <a-row :gutter="16" class="content-row">
      <a-col :md="17" :xs="24">
        <a-card title="Recent Consultations" :bordered="false">
          <a-table :columns="columns" :dataSource="recentConsultations" :rowKey="row => row.id" :pagination="false">
            <template slot="patient" slot-scope="text, row">{{patientName(row.patientId)}}</template>
            <template slot="status" slot-scope="text"><a-tag :color="statusColor(text)">{{text}}</a-tag></template>
          </a-table>
        </a-card>
      </a-col>
      <a-col :md="7" :xs="24">
        <a-card title="Clinical Workflow" :bordered="false" class="workflow-card">
          <a-steps direction="vertical" size="small" :current="workflowStep">
            <a-step title="Assign a patient" description="Department Admin"/>
            <a-step title="Complete consultation" description="Doctor"/>
            <a-step title="Submit medical record" description="Doctor"/>
            <a-step title="Review record" description="Department Admin"/>
          </a-steps>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script>
import {mapState} from 'vuex'
import demoService from '@/services/demoService'

export default {
  name: 'DemoDashboard',
  data () {
    return {
      columns: [
        {title: 'ID', dataIndex: 'id', width: 90},
        {title: 'Patient', scopedSlots: {customRender: 'patient'}},
        {title: 'Summary', dataIndex: 'summary'},
        {title: 'Request Time', dataIndex: 'createdAt', width: 170},
        {title: 'Status', dataIndex: 'status', scopedSlots: {customRender: 'status'}, width: 120}
      ]
    }
  },
  computed: {
    ...mapState({user: state => state.account.user, demo: state => state.demo.data}),
    doctorId () {
      return this.user.roleCode === 'DOCTOR' ? this.user.id : null
    },
    statistics () {
      const consultations = this.doctorId ? demoService.getConsultations(this.doctorId) : this.demo.consultations
      const patients = this.doctorId ? demoService.getMyPatients(this.doctorId).length : this.demo.patients.length
      return [
        {title: this.doctorId ? 'My Patients' : 'Department Patients', value: patients, icon: 'team', color: '#1890ff'},
        {title: 'Pending Consultations', value: consultations.filter(item => item.status === 'PENDING').length, icon: 'clock-circle', color: '#faad14'},
        {title: 'Completed Consultations', value: consultations.filter(item => item.status === 'COMPLETED').length, icon: 'check-circle', color: '#52c41a'},
        {title: 'Medical Records', value: this.doctorId ? this.demo.medicalRecords.filter(item => item.doctorId === this.doctorId).length : this.demo.medicalRecords.length, icon: 'file-text', color: '#722ed1'}
      ]
    },
    recentConsultations () {
      const list = this.doctorId ? this.demo.consultations.filter(item => item.doctorId === this.doctorId) : this.demo.consultations
      return list.slice().sort((a, b) => b.id - a.id).slice(0, 5)
    },
    workflowStep () {
      const emilyAssigned = !!demoService.getAssignment(1001)
      const consultation = demoService.getConsultation(3001)
      const record = this.demo.medicalRecords.find(item => item.patientId === 1001)
      if (record && record.status === 'REVIEWED') return 4
      if (record && record.status === 'SUBMITTED') return 3
      if (consultation.status === 'COMPLETED') return 2
      if (emilyAssigned) return 1
      return 0
    }
  },
  methods: {
    patientName (id) {
      const patient = demoService.getPatient(id)
      return patient ? patient.name : '-'
    },
    statusColor (status) {
      return {PENDING: 'orange', ONGOING: 'blue', COMPLETED: 'green'}[status]
    }
  }
}
</script>

<style lang="less" scoped>
.stat-card { margin-bottom: 16px; }
.stat-card /deep/ .ant-card-body { display: flex; align-items: center; min-height: 102px; }
.stat-icon { width: 52px; height: 52px; line-height: 52px; text-align: center; color: #fff; font-size: 23px; border-radius: 4px; margin-right: 14px; }
.stat-copy { display: flex; flex-direction: column; color: rgba(0, 0, 0, .55); }
.stat-copy strong { color: rgba(0, 0, 0, .85); font-size: 26px; line-height: 34px; }
.content-row { margin-top: 2px; }
.workflow-card { min-height: 355px; }
@media (max-width: 767px) { .content-row .ant-col { margin-bottom: 16px; } }
</style>
