var ApcAccess = require('apcaccess');
var client = new ApcAccess();

(async () => {
  try {
    await client.connect('192.168.0.85', 3551)
    console.log('Connected')
    // .then(function() {
    const status = await client.getStatusJson()
    console.log(status)
    // const events = await client.getEvents();
    // console.log(events)
    await client.disconnect();
    console.log('Disconnected');  
  } catch (err) {
    console.error(err)
  }

  setTimeout(() => { process.exit(0) }, 2000)
})()
