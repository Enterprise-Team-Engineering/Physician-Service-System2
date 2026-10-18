<template>
  <a-card :bordered="false" class="chat-card">
    <div class="chat-header">
      <div>
        <a-button class="back-button" icon="left" title="Back to consultation queue" @click="goBack"/>
        <a-avatar icon="user"/><span><b>{{patient.name}}</b><small>{{patient.idNumber}} | Consultation #{{consultation.id}}</small></span>
      </div>
      <a-tag :color="statusColor">{{consultation.status}}</a-tag>
    </div>
    <div class="summary"><a-icon type="info-circle"/> {{consultation.summary}}</div>
    <div class="messages" ref="messages">
      <div v-for="message in messages" :key="message.id" :class="['message-row', message.senderType === 'DOCTOR' ? 'doctor' : 'patient']">
        <a-avatar :icon="message.senderType === 'DOCTOR' ? 'medicine-box' : 'user'"/>
        <div class="message-wrap">
          <span>{{message.senderType === 'DOCTOR' ? user.name : patient.name}}</span>
          <div class="bubble">
            <img v-if="message.messageType === 'IMAGE'" :src="message.content" alt="Consultation attachment"/>
            <template v-else>{{message.content}}</template>
          </div>
          <small>{{message.createdAt}}</small>
        </div>
      </div>
      <div v-if="replyPending" class="reply-pending"><a-icon type="loading"/> {{patient.name}} is typing...</div>
    </div>
    <div v-if="consultation.status === 'ONGOING'" class="composer">
      <a-textarea v-model="messageText" :rows="2" placeholder="Type a message..." @keydown.ctrl.enter="sendText"/>
      <div class="composer-actions">
        <input ref="imageInput" type="file" accept="image/*" hidden @change="sendImage">
        <a-button icon="picture" @click="$refs.imageInput.click()">Image</a-button>
        <span class="spacer"></span>
        <a-button type="danger" icon="stop" @click="endConsultation">End Consultation</a-button>
        <a-button type="primary" icon="send" @click="sendText">Send</a-button>
      </div>
    </div>
    <div v-else-if="consultation.status === 'COMPLETED'" class="completed-actions">
      <a-alert type="success" showIcon message="This consultation has been completed."/>
      <a-button type="primary" icon="file-add" @click="createRecord">Create Medical Record</a-button>
    </div>
    <div v-else class="completed-actions">
      <a-alert type="warning" showIcon message="Accept this consultation from the queue before starting the conversation."/>
    </div>
  </a-card>
</template>

<script>
import {mapState} from 'vuex'
import demoService from '@/services/demoService'
export default {
  name: 'ConsultationChat',
  data () { return {messageText: '', replyPending: false, replyTimer: null} },
  computed: {
    ...mapState({user: state => state.account.user, demo: state => state.demo.data}),
    consultation () { return demoService.getConsultation(this.$route.params.id) || {} },
    patient () { return demoService.getPatient(this.consultation.patientId) || {} },
    messages () { return demoService.getMessages(this.consultation.id) },
    statusColor () { return {PENDING: 'orange', ONGOING: 'blue', COMPLETED: 'green'}[this.consultation.status] }
  },
  mounted () { this.scrollBottom() },
  updated () { this.scrollBottom() },
  beforeDestroy () { if (this.replyTimer) clearTimeout(this.replyTimer) },
  methods: {
    goBack () { this.$router.push('/app/consultations/queue') },
    scrollBottom () { this.$nextTick(() => { if (this.$refs.messages) this.$refs.messages.scrollTop = this.$refs.messages.scrollHeight }) },
    sendText () {
      const content = this.messageText.trim()
      if (!content) { this.$message.warning('Please enter a message'); return }
      demoService.sendMessage(this.consultation.id, this.user.id, 'TEXT', content).then(() => {
        this.messageText = ''
        this.schedulePatientReply(content)
      }).catch(error => this.$message.error(error.message))
    },
    schedulePatientReply (content) {
      const reply = demoService.getPatientReply(this.consultation.id, content)
      if (!reply) return
      this.replyPending = true
      this.replyTimer = setTimeout(() => {
        if (this.consultation.status === 'ONGOING') {
          demoService.sendPatientMessage(this.consultation.id, this.patient.id, reply).catch(error => this.$message.error(error.message))
        }
        this.replyPending = false
        this.replyTimer = null
      }, 900)
    },
    sendImage (event) {
      const file = event.target.files[0]
      if (!file) return
      if (file.size > 1500000) { this.$message.warning('Please choose an image smaller than 1.5 MB'); event.target.value = ''; return }
      const reader = new FileReader()
      reader.onload = () => {
        demoService.sendMessage(this.consultation.id, this.user.id, 'IMAGE', reader.result).then(() => {
          this.$message.success('Image added to the conversation')
        }).catch(() => {
          this.$message.error('The image could not be added. Please choose a smaller file.')
        }).then(() => { event.target.value = '' })
      }
      reader.readAsDataURL(file)
    },
    endConsultation () {
      this.$confirm({title: 'Are you sure you want to end this consultation?', content: 'The consultation will move to history.', okText: 'End Consultation', onOk: () => {
        return demoService.endConsultation(this.consultation.id).then(() => {
          this.$message.success('Consultation completed')
        })
      }})
    },
    createRecord () {
      const existing = this.demo.medicalRecords.find(item => item.consultationId === this.consultation.id)
      this.$router.push(existing ? `/app/records/${existing.id}` : `/app/records/create/${this.patient.id}?consultationId=${this.consultation.id}`)
    }
  }
}
</script>

<style lang="less" scoped>
.chat-card { max-width: 1050px; margin: 0 auto; }
.chat-card /deep/ .ant-card-body { padding: 0; }
.chat-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #eee; }
.chat-header > div { display: flex; align-items: center; }
.chat-header .ant-avatar { margin-right: 12px; color: #1890ff; background: #e6f7ff; }
.back-button { margin-right: 12px; }
.chat-header small { display: block; color: rgba(0, 0, 0, .45); margin-top: 2px; }
.summary { padding: 10px 20px; color: rgba(0, 0, 0, .55); background: #fafafa; border-bottom: 1px solid #eee; }
.messages { height: 430px; overflow-y: auto; padding: 22px; background: #f5f7fa; }
.message-row { display: flex; margin-bottom: 18px; }
.reply-pending { margin: -6px 0 14px 54px; color: rgba(0, 0, 0, .45); font-size: 12px; }
.message-row.doctor { flex-direction: row-reverse; }
.message-row .ant-avatar { flex: 0 0 auto; margin: 20px 10px 0; }
.message-wrap { max-width: 70%; }
.message-wrap > span, .message-wrap > small { display: block; color: rgba(0, 0, 0, .45); font-size: 11px; margin: 0 2px 4px; }
.doctor .message-wrap > span, .doctor .message-wrap > small { text-align: right; }
.bubble { padding: 10px 13px; background: #fff; border: 1px solid #e8e8e8; border-radius: 3px; line-height: 21px; white-space: pre-wrap; }
.doctor .bubble { color: #fff; background: #1890ff; border-color: #1890ff; }
.bubble img { display: block; max-width: 320px; max-height: 230px; }
.composer { padding: 14px 18px; border-top: 1px solid #eee; }
.composer-actions { display: flex; margin-top: 10px; }
.composer-actions .spacer { flex: 1; }
.composer-actions .ant-btn + .ant-btn { margin-left: 8px; }
.completed-actions { display: flex; align-items: center; padding: 14px 18px; border-top: 1px solid #eee; }
.completed-actions .ant-alert { flex: 1; margin-right: 12px; }
</style>
