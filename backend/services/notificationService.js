const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN
const twilioFrom = process.env.TWILIO_FROM

let client = null
if (twilioAccountSid && twilioAuthToken) {
  const twilio = require('twilio')
  client = twilio(twilioAccountSid, twilioAuthToken)
} else {
  console.warn('Twilio credentials not set — SMS disabled')
}

const formatStatusEmoji = (status) => {
  if (status === 'waiting') return '🟡 Waiting'
  if (status === 'current') return '🟢 On Track'
  if (status === 'completed') return '⚪ Completed'
  return status
}

const buildTokenMessage = (appointment) => {
  const token = appointment.tokenNumber || '—'
  const doctorName = appointment.doctor?.name || 'TBA'
  const wait = (appointment.estimatedWaitTime && String(appointment.estimatedWaitTime)) || '—'
  const status = formatStatusEmoji(appointment.status)

  return [
    '-------------------------',
    `Token #${token}`,
    `Doctor: ${doctorName}`,
    `Wait Time: ${wait} mins`,
    `Status: ${status}`,
    '-------------------------',
  ].join('\n')
}

const sendSms = async (to, body) => {
  if (!client) {
    console.log('[SMS disabled] to:', to, '\n', body)
    return { success: true, debug: true }
  }

  try {
    const msg = await client.messages.create({
      body,
      from: twilioFrom,
      to,
    })
    return { success: true, sid: msg.sid }
  } catch (e) {
    console.error('Failed to send SMS:', e && e.message)
    return { success: false, error: e }
  }
}

const sendAppointmentToken = async (appointment) => {
  const phone = appointment.patient?.phone || appointment.patientPhone
  if (!phone) return { success: false, message: 'No phone' }
  const body = buildTokenMessage(appointment)
  return await sendSms(phone, body)
}

module.exports = { sendSms, sendAppointmentToken, buildTokenMessage }
