
import { Sys } from './sys/sys.js'

const config = {
	meta: import.meta,
	selfid: 'orbital.foundation',
	dependencies: [ '/@orbital/net/network.js' ]
}

new Sys(config)
