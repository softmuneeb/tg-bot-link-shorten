const { Client } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')
const { customAlphabet } = require('nanoid')
const { log } = require('console')

const client = new Client()

client.on('qr', qr => {
  log(qr)
  qrcode.generate(qr, { small: true })
})

client.on('authenticated', () => {
  log(client.session)
  // Save the session to reuse authentication
  console.log('Authenticated')
})

const part1 = customAlphabet('23456789', 1)
const part2 = customAlphabet('0123456789', 6)
const countryCode = '1'
const areaCode = '862'

client.on('ready', async () => {
  console.log('Client is ready')

  for (let i = 0; i < 1; i++) {
    checkIfNumberOnWhatsApp()
  }
})

client.initialize()
// client.initializeFromSession(session)

async function checkIfNumberOnWhatsApp() {
  try {
    const phone = countryCode + areaCode + part1() + part2()
    const isOnWhatsApp = await client.isRegisteredUser(phone)
    isOnWhatsApp && console.log(`${phone} is on WhatsApp`)
  } catch (error) {
    console.error('Error checking WhatsApp status:' + error?.message)
  }
  //   finally {
  //     // Close the client after checking
  //     await client.destroy()
  //   }
}

// client.on('message', message => {
//   message.reply('Hello, World!')
//   console.log('Received message:', JSON.stringify(message, 0, 2))
//   message.reply({ body: 'Hello, World!', buttons: [{ buttonId: '12', buttonText: { displayText: 'Wow 1' }, type: 2 }] })
// })

/*
18622640896 is on WhatsApp: true
18622328337 is on WhatsApp: true
18623064106 is on WhatsApp: true
18626864828 is on WhatsApp: true
*/
