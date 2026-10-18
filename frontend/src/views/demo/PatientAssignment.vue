<template>
  <a-card :bordered="false" class="card-area">
    <div class="page-intro"><b>Patient Assignment</b><span>Assign or reassign department patients to an available doctor.</span></div>
    <a-table :columns="columns" :dataSource="demo.patients" :rowKey="row => row.id" :pagination="{pageSize: 8}">
      <template slot="patient" slot-scope="text, row"><b>{{row.name}}</b><small>{{row.idNumber}}</small></template>
      <template slot="doctor" slot-scope="text, row"><a-tag :color="assignment(row.id) ? 'blue' : 'orange'">{{doctorName(row.id)}}</a-tag></template>
      <template slot="assignedAt" slot-scope="text, row">{{assignment(row.id) ? assignment(row.id).assignedAt : '-'}}</template>
      <template slot="action" slot-scope="text, row"><a-button type="primary" ghost size="small" icon="user-add" @click="openModal(row)">{{assignment(row.id) ? 'Reassign' : 'Assign'}}</a-button></template>
    </a-table>
    <a-modal title="Assign Patient" :visible="visible" okText="Confirm Assignment" @ok="confirm" @cancel="visible = false">
      <a-alert v-if="selectedPatient" type="info" showIcon :message="`${selectedPatient.name} (${selectedPatient.idNumber})`" style="margin-bottom: 20px"/>
      <a-form-item label="Select Doctor" :labelCol="{span: 6}" :wrapperCol="{span: 16}">
        <a-select
          v-model="selectedDoctorId"
          placeholder="Choose a doctor"
          style="width: 100%"
          :dropdownMatchSelectWidth="false"
          :dropdownStyle="{minWidth: '380px'}">
          <a-select-option v-for="doctor in demo.doctors" :key="doctor.id" :value="doctor.id">{{doctor.name}} - {{doctor.title}}</a-select-option>
        </a-select>
      </a-form-item>
    </a-modal>
  </a-card>
</template>

<script>
import {mapState} from 'vuex'
import demoService from '@/services/demoService'

export default {
  name: 'PatientAssignment',
  data () {
    return {
      visible: false, selectedPatient: null, selectedDoctorId: null,
      columns: [
        {title: 'Patient', scopedSlots: {customRender: 'patient'}}, {title: 'Gender', dataIndex: 'gender', width: 100},
        {title: 'Age', dataIndex: 'age', width: 80}, {title: 'Primary Diagnosis', dataIndex: 'primaryDiagnosis'},
        {title: 'Current Doctor', scopedSlots: {customRender: 'doctor'}, width: 170},
        {title: 'Assigned At', scopedSlots: {customRender: 'assignedAt'}, width: 175},
        {title: 'Action', scopedSlots: {customRender: 'action'}, width: 130}
      ]
    }
  },
  computed: mapState({user: state => state.account.user, demo: state => state.demo.data}),
  methods: {
    assignment (patientId) { return demoService.getAssignment(patientId) },
    doctorName (patientId) {
      const current = this.assignment(patientId)
      const doctor = current && demoService.getDoctor(current.doctorId)
      return doctor ? doctor.name : 'Unassigned'
    },
    openModal (patient) {
      this.selectedPatient = patient
      const current = this.assignment(patient.id)
      this.selectedDoctorId = current ? current.doctorId : null
      this.visible = true
    },
    confirm () {
      if (!this.selectedDoctorId) { this.$message.warning('Please select a doctor'); return }
      const doctor = demoService.getDoctor(this.selectedDoctorId)
      demoService.assignPatient(this.selectedPatient.id, this.selectedDoctorId, this.user.id).then(() => {
        this.visible = false
        this.$message.success(`${this.selectedPatient.name} has been assigned to ${doctor.name}`)
      }).catch(error => this.$message.error(error.message))
    }
  }
}
</script>

<style lang="less" scoped>
.page-intro { margin-bottom: 18px; }
.page-intro span, small { display: block; margin-top: 4px; color: rgba(0, 0, 0, .45); font-size: 12px; }
</style>
