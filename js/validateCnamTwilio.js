/* global process */
require('dotenv').config()
const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const client = require('twilio')(accountSid, authToken)

const validateCnamTwilio = async phone => {
  const res = await client.lookups.v2.phoneNumbers(phone).fetch({ fields: 'caller_name' })
  // console.log(res)
  return res?.callerName?.caller_name
}
// validateCnamTwilio('+16465807362').then(console.log)
module.exports = validateCnamTwilio
