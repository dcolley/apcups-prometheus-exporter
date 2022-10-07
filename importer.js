import ApcAccess from 'apcaccess'
var client = new ApcAccess()
import moment from 'moment-timezone'

// ref: http://www.apcupsd.org/manual/

const DEFAULT_CONFIG = {
  hostname: 'localhost',
  port: 3551,
  prefix: 'apc_ups',
  dateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
  trace: true
}

const sensitivityLookup = {
  Low: 0,
  Medium: 1,
  Hign: 2
}

// const lastXfer = {
//   'Unacceptable Utility Voltage Change': 0,
//   'U command or Self Test': 1,
//   'Low line voltage': 2
// }

const statusLookup = {
  ONLINE: 0,
  ONBATT: 1
}

export class ApcUpsImporter {
  
  constructor(config = {}) {
    console.debug('ApcImporter()', config)
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  slog (text) {
    if(this.config && this.config.trace) {
      var ts = moment().format(this.config.dateTimeFormat);
      console.log(ts+`|${this.config.prefix}|`+text);
    }
  }

  async read () {
    this.slog('ApcUpsImporter: read()')
    try {
      await client.connect(this.config.hostname, this.config.port)
      this.slog('Connected')

      const status = await client.getStatusJson()
      // console.debug(status)

      const parsed = this.parse(status)
      // console.debug(parsed)

      const resp = this.metrics(parsed)

      await client.disconnect();
      this.slog('Disconnected');  
      return resp

    } catch (err) {
      console.error(err)
    }
  }

  // LINEV: '229.0 Volts',
  // LOADPCT: '1.0 Percent'
  parseUnit (str='', delim=' ') {
    let parts = str.split(delim)
    return { value: Number(parts[0]), unit: parts[1] || '' }
  }

  // DATE: '2022-10-07 08:35:39 +0000  ',
  // STARTTIME: '2022-10-07 08:18:29 +0000  ',
  parseDateTime (str) {
    // let dt = str.trim()
    //   .replace(/-/g, '/')
    //   .replace(/ \+/, '+')
    //   .replace(/ /, 'T')
    let dt = str.slice(0, 19) // .replace(/-/g, '/')
    this.slog(`parseDateTime, ${str}, ${dt}`)
    return moment.utc(dt, 'YYYY-MM-DD HH:mm:ss')
  }

  /*
   * 
   * @param {*} status 
   */
  parse(status) {
    let res = {}
    // APC: '001,036,0856',
    res.apc = status.APC
    // DATE: '2022-10-07 08:35:39 +0000  ',
    res.date = this.parseDateTime(status.DATE)
    // HOSTNAME: 'miner5',
    res.hostname = status.HOSTNAME
    // VERSION: '3.14.14 (31 May 2016) debian',
    res.version = status.VERSION.trim()
    // UPSNAME: 'miner5',
    res.upsname = status.UPSNAME
    // CABLE: 'USB Cable',
    res.cable = status.CABLE
    // DRIVER: 'USB UPS Driver',
    res.driver = status.DRIVER
    // UPSMODE: 'Stand Alone',
    res.upsmode = status.UPSMODE
    // STARTTIME: '2022-10-07 08:18:29 +0000  ',
    res.starttime = this.parseDateTime(status.STARTTIME)
    // MODEL: 'Back-UPS RS 1600SI ',
    res.model = status.MODEL.trim()
    // STATUS: 'ONLINE ',
    res.status = status.STATUS.trim()
    // LINEV: '229.0 Volts',
    res.linev = this.parseUnit(status.LINEV)
    // LOADPCT: '1.0 Percent',
    res.loadpct = this.parseUnit(status.LOADPCT)
    // BCHARGE: '98.0 Percent',
    res.bcharge = this.parseUnit(status.BCHARGE)
    // TIMELEFT: '296.9 Minutes',
    res.timeleft = this.parseUnit(status.TIMELEFT)
    // MBATTCHG: '30 Percent',
    res.mbattchg = this.parseUnit(status.MBATTCHG)
    // MINTIMEL: '10 Minutes',
    res.mintimel = this.parseUnit(status.MINTIMEL)
    // MAXTIME: '0 Seconds',
    res.maxtime = this.parseUnit(status.MAXTIME)
    // SENSE: 'Medium',
    res.sense = status.SENSE.trim()
    // LOTRANS: '176.0 Volts',
    res.lotrans = this.parseUnit(status.LOTRANS)
    // HITRANS: '288.0 Volts',
    res.hitrans = this.parseUnit(status.HITRANS)
    // ALARMDEL: 'No alarm',
    res.alarmdel = status.ALARMDEL.trim()
    // BATTV: '27.3 Volts',
    res.battv = this.parseUnit(status.BATTV)
    // LASTXFER: 'Low line voltage',
    res.lastxfer = status.LASTXFER.trim()
    // NUMXFERS: '0',
    res.numxfers = Number(status.NUMXFERS.trim())
    // TONBATT: '0 Seconds',
    res.tonbatt = this.parseUnit(status.TONBATT)
    // CUMONBATT: '0 Seconds',
    res.cumonbatt = this.parseUnit(status.CUMONBATT)
    // XOFFBATT: 'N/A', // Time and date of last transfer from batteries, or N/A.
    res.xoffbatt = status.XOFFBATT.trim()
    // SELFTEST: 'NO',
    res.selftest = status.SELFTEST
    // STATFLAG: '0x05000008',
    // SERIALNO: '5B2149T89914  ',
    // BATTDATE: '2021-12-11',
    res.battdate = moment(status.BATTDATE.trim())
    // NOMINV: '230 Volts',
    res.nominv = this.parseUnit(status.NOMINV)
    // NOMBATTV: '24.0 Volts',
    res.nombattv = this.parseUnit(status.NOMBATTV)
    // NOMPOWER: '960 Watts',
    res.nompower = this.parseUnit(status.NOMPOWER)
    // FIRMWARE: '963.g5 .I USB FW:g5',
    res.firmware = status.FIRMWARE.trim()
    // 'END APC': '2022-10-07 08:36:18 +0000  '
    return res
  }

  makeUnitLine (key, value, upsname, hostname) {
    return `${this.config.prefix}_${key}{unit="${value.unit}", upsname="${upsname}", hostname="${hostname}"} ${value.value}`
  }

  metrics (parsed) {
    var lines = []
    // date: Moment<2022-10-07T09:48:12Z>,
    lines.push(`${this.config.prefix}_date{upsname="${parsed.upsname}", hostname="${parsed.hostname}"} ${parsed.date.valueOf()}`)
    // hostname: 'miner5',
    // upsname: 'miner5',
    // starttime: Moment<2022-10-07T08:18:29Z>,
    lines.push(`# HELP ${this.config.prefix}_starttime The time/date that apcupsd was started.`)
    lines.push(`# TYPE ${this.config.prefix}_starttime counter`)
    lines.push(`${this.config.prefix}_starttime{upsname="${parsed.upsname}", hostname="${parsed.hostname}"} ${parsed.starttime.valueOf()}`)
    // status: 'ONLINE',
    lines.push(`# HELP ${this.config.prefix}_status The current status of the UPS (ONLINE, ONBATT, etc.)`)
    lines.push(`# TYPE ${this.config.prefix}_status gauge`)
    lines.push(`${this.config.prefix}_online{status="${parsed.status}", upsname="${parsed.upsname}", hostname="${parsed.hostname}"} ${statusLookup[parsed.status]}`)
    // linev: { value: 233, unit: 'Volts' },
    lines.push(`# HELP ${this.config.prefix}_linev The current line voltage as returned by the UPS.`)
    lines.push(`# TYPE ${this.config.prefix}_linev gauge`)
    lines.push(this.makeUnitLine('linev', parsed.linev, parsed.upsname, parsed.hostname))
    // loadpct: { value: 1, unit: 'Percent' },
    lines.push(`# HELP ${this.config.prefix}_loadpct The percentage of load capacity as estimated by the UPS.`)
    lines.push(`# TYPE ${this.config.prefix}_loadpct gauge`)
    lines.push(this.makeUnitLine('loadpct', parsed.loadpct, parsed.upsname, parsed.hostname))
    // bcharge: { value: 98, unit: 'Percent' },
    lines.push(`# HELP ${this.config.prefix}_bcharge The percentage charge on the batteries.`)
    lines.push(`# TYPE ${this.config.prefix}_bcharge gauge`)
    lines.push(this.makeUnitLine('bcharge', parsed.bcharge, parsed.upsname, parsed.hostname))
    // timeleft: { value: 296.9, unit: 'Minutes' },
    lines.push(`# HELP ${this.config.prefix}_timeleft The remaining runtime left on batteries as estimated by the UPS.`)
    lines.push(`# TYPE ${this.config.prefix}_timeleft gauge`)
    lines.push(this.makeUnitLine('timeleft', parsed.timeleft, parsed.upsname, parsed.hostname))
    // mbattchg: { value: 30, unit: 'Percent' },
    lines.push(`# HELP ${this.config.prefix}_mbattchg If the battery charge percentage (BCHARGE) drops below this value, apcupsd will shutdown your system (%).`)
    lines.push(`# TYPE ${this.config.prefix}_mbattchg gauge`)
    lines.push(this.makeUnitLine('mbattchg', parsed.mbattchg, parsed.upsname, parsed.hostname))
    // mintimel: { value: 10, unit: 'Minutes' },
    lines.push(`# HELP ${this.config.prefix}_mintimel apcupsd will shutdown your system if the remaining runtime equals or is below this point (minutes).`)
    lines.push(`# TYPE ${this.config.prefix}_mintimel gauge`)
    lines.push(this.makeUnitLine('mintimel', parsed.mintimel, parsed.upsname, parsed.hostname))
    // maxtime: { value: 0, unit: 'Seconds' },
    lines.push(`# HELP ${this.config.prefix}_maxtime apcupsd will shutdown your system if the time on batteries exceeds this value (minutes).`)
    lines.push(`# TYPE ${this.config.prefix}_maxtime gauge`)
    lines.push(this.makeUnitLine('maxtime', parsed.maxtime, parsed.upsname, parsed.hostname))
    // sense: 'Medium',
    lines.push(`# HELP ${this.config.prefix}_sense The sensitivity level of the UPS to line voltage fluctuations {Low: 0, Medium: 1, High: 2}.`)
    lines.push(`# TYPE ${this.config.prefix}_sense gauge`)
    lines.push(`${this.config.prefix}_sense{sensitivity="${parsed.sense}", upsname="${parsed.upsname}", hostname="${parsed.hostname}"} ${sensitivityLookup[parsed.sense]}`)
    // lotrans: { value: 176, unit: 'Volts' },
    lines.push(`# HELP ${this.config.prefix}_lotrans The line voltage below which the UPS will switch to batteries.`)
    lines.push(`# TYPE ${this.config.prefix}_lotrans gauge`)
    lines.push(this.makeUnitLine('maxtime', parsed.maxtime, parsed.upsname, parsed.hostname))
    // hitrans: { value: 288, unit: 'Volts' },
    lines.push(`# HELP ${this.config.prefix}_hitrans The line voltage below which the UPS will switch to mains.`)
    lines.push(`# TYPE ${this.config.prefix}_hitrans gauge`)
    lines.push(this.makeUnitLine('lotrans', parsed.lotrans, parsed.upsname, parsed.hostname))
    // alarmdel: 'No alarm', // The delay period for the UPS alarm.
    // battv: { value: 27.3, unit: 'Volts' },
    lines.push(`# HELP ${this.config.prefix}_battv Battery voltage as supplied by the UPS.`)
    lines.push(`# TYPE ${this.config.prefix}_battv gauge`)
    lines.push(this.makeUnitLine('battv', parsed.battv, parsed.upsname, parsed.hostname))
    // lastxfer: 'Low line voltage',
    // numxfers: 0,
    lines.push(`# HELP ${this.config.prefix}_numxfers The number of transfers to batteries since apcupsd startup.`)
    lines.push(`# TYPE ${this.config.prefix}_numxfers counter`)
    lines.push(`${this.config.prefix}_numxfers{reason="${parsed.lastxfer}", upsname="${parsed.upsname}", hostname="${parsed.hostname}"} ${parsed.numxfers}`)
    // tonbatt: { value: 0, unit: 'Seconds' },
    lines.push(`# HELP ${this.config.prefix}_tonbatt Time in seconds currently on batteries, or 0.`)
    lines.push(`# TYPE ${this.config.prefix}_tonbatt counter`)
    lines.push(this.makeUnitLine('tonbatt', parsed.tonbatt, parsed.upsname, parsed.hostname))
    // cumonbatt: { value: 0, unit: 'Seconds' },
    lines.push(`# HELP ${this.config.prefix}_cumonbatt Total (cumulative) time on batteries in seconds since apcupsd startup.`)
    lines.push(`# TYPE ${this.config.prefix}_cumonbatt counter`)
    lines.push(this.makeUnitLine('cumonbatt', parsed.cumonbatt, parsed.upsname, parsed.hostname))
    // xoffbatt: 'N/A',
    lines.push(`# HELP ${this.config.prefix}_xoffbatt Time and date of last transfer from batteries, or 0='N/A'.`)
    lines.push(`# TYPE ${this.config.prefix}_xoffbatt gauge`)
    lines.push(`${this.config.prefix}_xoffbatt{upsname="${parsed.upsname}", hostname="${parsed.hostname}"} ${parsed.xoffbatt === 'N/A' ? 0 : this.parseDateTime(parsed.xoffbatt).valueOf()}`)
    // battdate: Moment<2021-12-11T00:00:00+00:00>,
    lines.push(`# HELP ${this.config.prefix}_battdate The date that batteries were last replaced.`)
    lines.push(`# TYPE ${this.config.prefix}_battdate counter`)
    lines.push(`${this.config.prefix}_battdate{upsname="${parsed.upsname}", hostname="${parsed.hostname}"} ${parsed.battdate.valueOf()}`)
    // nominv: { value: 230, unit: 'Volts' },
    lines.push(`# HELP ${this.config.prefix}_nominv The input voltage that the UPS is configured to expect.`)
    lines.push(`# TYPE ${this.config.prefix}_nominv gauge`)
    lines.push(this.makeUnitLine('nominv', parsed.nominv, parsed.upsname, parsed.hostname))
    // nombattv: { value: 24, unit: 'Volts' },
    lines.push(`# HELP ${this.config.prefix}_nombattv The nominal battery voltage.`)
    lines.push(`# TYPE ${this.config.prefix}_nombattv gauge`)
    lines.push(this.makeUnitLine('nombattv', parsed.nombattv, parsed.upsname, parsed.hostname))
    // nompower: { value: 960, unit: 'Watts' },
    lines.push(`# HELP ${this.config.prefix}_nompower The maximum power in Watts that the UPS is designed to supply.`)
    lines.push(`# TYPE ${this.config.prefix}_nompower gauge`)
    lines.push(this.makeUnitLine('nompower', parsed.nompower, parsed.upsname, parsed.hostname))
    // firmware: '963.g5 .I USB FW:g5'
    return lines.join("\n")
  }

}
