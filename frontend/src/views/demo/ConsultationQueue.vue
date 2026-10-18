<template>
  <a-card :bordered="false" class="card-area">
    <div class="queue-header">
      <div><b>Consultation Queue</b><span>Accept pending requests and continue active consultations.</span></div>
      <a-radio-group v-model="filter" buttonStyle="solid">
        <a-radio-button value="ALL">All Active</a-radio-button>
        <a-radio-button value="PENDING">Pending</a-radio-button>
        <a-radio-button value="ONGOING">Ongoing</a-radio-button>
      </a-radio-group>
    </div>
    <a-table :columns="columns" :dataSource="rows" :rowKey="row => row.id" :pagination="{pageSize: 8}">
      <template slot="patient" slot-scope="text, row">
        <b>{{patient(row.patientId).name}}</b>
        <small>{{patient(row.patientId).idNumber}}</small>
      </template>
      <template slot="status" slot-scope="text"><a-tag :color="text === 'PENDING' ? 'orange' : 'blue'">{{text}}</a-tag></template>
      <template slot="action" slot-scope="text, row">
        <a-button v-if="row.status === 'PENDING'" type="primary" size="small" icon="check" @click="accept(row)">Accept</a-button>
        <a-button v-else type="primary" ghost size="small" icon="message" @click="openChat(row)">Open Chat</a-button>
      </template>
    </a-table>
  </a-card>
</template>

<script>
import {mapState} from 'vuex'
import demoService from '@/services/demoService'
export default {
  name: 'ConsultationQueue',
  data () { return {
    filter: 'ALL',
    columns: [
      {title: 'Consultation ID', dataIndex: 'id', width: 130}, {title: 'Patient', scopedSlots: {customRender: 'patient'}},
      {title: 'Request Time', dataIndex: 'createdAt', width: 175}, {title: 'Summary', dataIndex: 'summary'},
      {title: 'Status', dataIndex: 'status', scopedSlots: {customRender: 'status'}, width: 110},
      {title: 'Action', scopedSlots: {customRender: 'action'}, width: 130}
    ]
  } },
  computed: {
    ...mapState({user: state => state.account.user, demo: state => state.demo.data}),
    rows () { return demoService.getConsultations(this.user.id).filter(item => item.status !== 'COMPLETED' && (this.filter === 'ALL' || item.status === this.filter)) }
  },
  methods: {
    patient (id) { return demoService.getPatient(id) || {} },
    accept (row) {
      demoService.acceptConsultation(row.id, this.user.id).then(() => {
        this.$message.success(`Consultation ${row.id} is now ongoing`)
      }).catch(error => this.$message.error(error.message))
    },
    openChat (row) { this.$router.push(`/app/consultations/${row.id}/chat`) }
  }
}
</script>
<style lang="less" scoped>
.queue-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
.queue-header span, small { display: block; margin-top: 4px; color: rgba(0, 0, 0, .45); font-size: 12px; }
</style>
