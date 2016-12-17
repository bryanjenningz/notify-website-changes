const request = require('request')
let cachedResponseLength = null

const phoneNumberArg = process.argv[2]
if (!phoneNumberArg || /[^\d\-\(\)\. ]/.test(phoneNumberArg)) {
  console.log('Enter your phone number as an argument so you can get notified when there is a change in the website.')
  return
}

const phoneNumberString = phoneNumberArg.replace(/[^\d]/g, '')
if (phoneNumberString.length < 10) {
  console.log('Make sure your phone number is at least 10 characters long (include your area code).')
  return
}

const phoneNumber = Number(phoneNumberString)

// Monitors the response from monitorUrl and sends a text message to
// phoneNumber when there is a change in the response length.
const notifyWebsiteChanges = (monitorUrl, phoneNumber) => {
  request(monitorUrl, (err, res, body) => {
    if (err) {
      console.log(err)
      console.log(`There was an error requesting ${monitorUrl}. Trying again in 5 seconds...`)
      setTimeout(() => notifyWebsiteChanges(monitorUrl, phoneNumber), 5000)
      return
    }

    const responseLength = JSON.stringify(res).length

    if (cachedResponseLength === null) {
      cachedResponseLength = responseLength
    }

    // For some reason, the response length varies in length by a character, but
    // there are no real changes to the response, so we don't consider
    // the response different if the length has only changed by a character.
    if (Math.abs(cachedResponseLength - responseLength) <= 1) {
      setTimeout(() => notifyWebsiteChanges(monitorUrl, phoneNumber), 5000)
    } else {
      const dataString = encodeURI(`number=${phoneNumber}&message=The response from ${monitorUrl} changed.`)
      const options = {
        url: 'http://textbelt.com/text',
        headers: {
          'Content-Type' : 'application/x-www-form-urlencoded'
        },
        method: 'POST',
        body: dataString
      }

      request(options, (err, res, body) => {
        if (err) {
          console.log(err)
          console.log(`Error sending text message to ${phoneNumber}.`)
        } else {
          console.log(res)
          console.log(`Sent text message to ${phoneNumber}.`)
        }
      })
    }
  })
}

notifyWebsiteChanges('http://www.news.google.com', phoneNumber)
