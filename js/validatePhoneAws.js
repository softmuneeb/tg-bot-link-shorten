/* global process */
require('dotenv').config()
const { PinpointClient, PhoneNumberValidateCommand } = require('@aws-sdk/client-pinpoint')

const client = new PinpointClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

const validatePhoneAws = async PhoneNumber => {
  const command = new PhoneNumberValidateCommand({
    NumberValidateRequest: {
      PhoneNumber,
    },
  })
  const res = await client.send(command)
  // console.log(res)
  return res?.NumberValidateResponse?.PhoneType !== 'INVALID'
}
// validatePhoneAws('+16465807362').then(console.log)
module.exports = validatePhoneAws
