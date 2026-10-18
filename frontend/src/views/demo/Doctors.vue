<template>
  <a-card :bordered="false" class="card-area">
    <a-table :columns="columns" :dataSource="rows" :rowKey="row => row.id" :pagination="false">
      <template slot="name" slot-scope="text, row"><a-avatar icon="user" class="doctor-avatar"/><b>{{row.name}}</b></template>
      <template slot="patients" slot-scope="text, row"><a-badge :count="row.patientCount" :numberStyle="{backgroundColor: '#1890ff'}"/></template>
      <template slot="status"><a-badge status="success" text="Available"/></template>
    </a-table>
  </a-card>
</template>

<script>
import {mapState} from 'vuex'
import demoService from '@/services/demoService'
export default {
  name: 'DemoDoctors',
  data () { return {columns: [
    {title: 'Doctor', scopedSlots: {customRender: 'name'}}, {title: 'Professional Title', dataIndex: 'title'},
    {title: 'Department', dataIndex: 'departmentName'}, {title: 'Phone', dataIndex: 'phone'},
    {title: 'Email', dataIndex: 'email'}, {title: 'Patients', scopedSlots: {customRender: 'patients'}, width: 100},
    {title: 'Status', scopedSlots: {customRender: 'status'}, width: 120}
  ]} },
  computed: {
    ...mapState({demo: state => state.demo.data}),
    rows () { return this.demo.doctors.map(item => Object.assign({}, item, {patientCount: demoService.getMyPatients(item.id).length})) }
  }
}
</script>
<style scoped>.doctor-avatar { margin-right: 10px; color: #1890ff; background: #e6f7ff; }</style>
