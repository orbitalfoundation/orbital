
import { Sys } from './sys/sys.js'
//import { server_create_uuid } from './sys/uuid.js'

const config = {
	systemid: "orbital.foundation", //server_create_uuid(),
	importmaps: {
		'@orbital':import.meta.dirname,
	},
	network_port: 4000,
}

const sys = new Sys(config)

//
// order orbital to load networking (starts http and sockets)
//

await sys.resolve({dependencies:['@orbital/net/network.js']})

//
// also try load a manifest-server.js from the app folder
// @todo may have to have clients push this instead because this is only run once ... not fetched per folder per client
//

await sys.resolve({dependencies:['/manifest-server.mjs']})

//
// run forever
//

sys.run()

