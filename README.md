# apcups-prometheus-exporter

Nodejs prometheus exporter for https://github.com/mapero/apcaccess

# Switch to docker

## docker build
```
docker build -t metaspan/apcups-prometheus-exporter \
  --build-arg PORT=3000 \
  --build-arg UPS_HOST=192.168.40.3 \
  --build-arg UPS_PORT=3551 \
  --build-arg PROM_PREFIX=apc_ups \
  .
docker image ls
# test
docker run -it --rm --init -p 3000:3000 --name apcups-prometheus-exporter metaspan/apcups-prometheus-exporter
```

## docker compose build

```
docker compose build # still wip... 
```

# Dependencies

Run http://www.apcupsd.org on a maching with a usb connection to the UPS.

# Useage via pm2

```
git clone https://github.com/dcolley/apcups-prometheus-exporter
cd apcups-prometheus-exporter
npm install
# edit HOSTNAME, PORT in exporter.js
node exporter.js
```

- Open browser http://localhost:3000/metrics

## PM2

- https://pm2.keymetrics.io/

```bash
pm2 start exporter.js
pm2 list
```

### Example output

```
apc_ups_date{upsname: "miner5", hostname: "miner5"} 1665148814000
# HELP apc_ups_starttime The time/date that apcupsd was started.
# TYPE apc_ups_starttime counter
apc_ups_starttime{upsname: "miner5", hostname: "miner5"} 1665130709000
# HELP apc_ups_status The current status of the UPS (ONLINE, ONBATT, etc.)
# TYPE apc_ups_status guage
apc_ups_online{status: "ONLINE", upsname: "miner5", hostname: "miner5"} 0
# HELP apc_ups_linev The current line voltage as returned by the UPS.
# TYPE apc_ups_linev guage
apc_ups_linev{unit: "Volts", upsname: "miner5", hostname: "miner5"} 237
# HELP apc_ups_loadpct The percentage of load capacity as estimated by the UPS.
# TYPE apc_ups_loadpct guage
apc_ups_loadpct{unit: "Percent", upsname: "miner5", hostname: "miner5"} 1
# HELP apc_ups_bcharge The percentage charge on the batteries.
# TYPE apc_ups_bcharge guage
apc_ups_bcharge{unit: "Percent", upsname: "miner5", hostname: "miner5"} 99
# HELP apc_ups_timeleft The remaining runtime left on batteries as estimated by the UPS.
# TYPE apc_ups_timeleft guage
apc_ups_timeleft{unit: "Minutes", upsname: "miner5", hostname: "miner5"} 299.9
# HELP apc_ups_mbattchg If the battery charge percentage (BCHARGE) drops below this value, apcupsd will shutdown your system (%).
# TYPE apc_ups_mbattchg guage
apc_ups_mbattchg{unit: "Percent", upsname: "miner5", hostname: "miner5"} 30
# HELP apc_ups_mintimel apcupsd will shutdown your system if the remaining runtime equals or is below this point (minutes).
# TYPE apc_ups_mintimel guage
apc_ups_mintimel{unit: "Minutes", upsname: "miner5", hostname: "miner5"} 10
# HELP apc_ups_maxtime apcupsd will shutdown your system if the time on batteries exceeds this value (minutes).
# TYPE apc_ups_maxtime guage
apc_ups_maxtime{unit: "Seconds", upsname: "miner5", hostname: "miner5"} 0
# HELP apc_ups_sense The sensitivity level of the UPS to line voltage fluctuations {Low: 0, Medium: 1, High: 2}.
# TYPE apc_ups_sense guage
apc_ups_sense{sensitivity: "Medium", upsname: "miner5", hostname: "miner5"} 1
# HELP apc_ups_lotrans The line voltage below which the UPS will switch to batteries.
# TYPE apc_ups_lotrans guage
apc_ups_maxtime{unit: "Seconds", upsname: "miner5", hostname: "miner5"} 0
# HELP apc_ups_hitrans The line voltage below which the UPS will switch to mains.
# TYPE apc_ups_hitrans guage
apc_ups_lotrans{unit: "Volts", upsname: "miner5", hostname: "miner5"} 176
# HELP apc_ups_battv Battery voltage as supplied by the UPS.
# TYPE apc_ups_battv guage
apc_ups_battv{unit: "Volts", upsname: "miner5", hostname: "miner5"} 27.3
# HELP apc_ups_numxfers The number of transfers to batteries since apcupsd startup.
# TYPE apc_ups_numxfers counter
apc_ups_numxfers{reason: "Low line voltage", upsname: "miner5", hostname: "miner5"} 0
# HELP apc_ups_tonbatt Time in seconds currently on batteries, or 0.
# TYPE apc_ups_tonbatt counter
apc_ups_tonbatt{unit: "Seconds", upsname: "miner5", hostname: "miner5"} 0
# HELP apc_ups_cumonbatt Total (cumulative) time on batteries in seconds since apcupsd startup.
# TYPE apc_ups_cumonbatt counter
apc_ups_cumonbatt{unit: "Seconds", upsname: "miner5", hostname: "miner5"} 0
# HELP apc_ups_xoffbatt Time and date of last transfer from batteries, or 0='N/A'.
# TYPE apc_ups_xoffbatt guage
apc_ups_xoffbatt{upsname: "miner5", hostname: "miner5"} 0
# HELP apc_ups_battdate The date that batteries were last replaced.
# TYPE apc_ups_battdate counter
apc_ups_battdate{upsname: "miner5", hostname: "miner5"} 1639180800000
# HELP apc_ups_nominv The input voltage that the UPS is configured to expect.
# TYPE apc_ups_nominv guage
apc_ups_nominv{unit: "Volts", upsname: "miner5", hostname: "miner5"} 230
# HELP apc_ups_nombattv The nominal battery voltage.
# TYPE apc_ups_nombattv guage
apc_ups_nombattv{unit: "Volts", upsname: "miner5", hostname: "miner5"} 24
# HELP apc_ups_nompower The maximum power in Watts that the UPS is designed to supply.
# TYPE apc_ups_nompower guage
apc_ups_nompower{unit: "Watts", upsname: "miner5", hostname: "miner5"} 960
```
