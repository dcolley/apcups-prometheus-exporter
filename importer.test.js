
import { ApcUpsImporter } from './importer.js'

const config = {
  hostname: '192.168.0.85',
  port: 3551,
  prefix: 'start_with_this'
}

const importer = new ApcUpsImporter(config);

(async () => {

  const metrics = await importer.read()
  console.log(metrics)

})()
