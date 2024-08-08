
import { raw_observer } from './raw.js'
import { uuid_observer } from './uuid.js'
import { write_observer } from './write.js'
import { resolve_observer } from './resolve.js'
import { load_observer } from './load.js'
import { tick_observer } from './tick.js'

const isServer = (typeof window === 'undefined') ? true : false

if(isServer) {
	await import('../utils/server-logging.js')
}

const uuid = '/orbital/sys/sys.js'

const description = 'Sys - orbital messaging backbone'

const resolve = async function(blob,sys) {
	// resolve can await
	return this._observers[0].resolve(blob,this)
}

const query = function(args,sys) {
	// volatile no await
	return this._observers[0].query(args,this)
}

export const sys = {
	uuid,
	description,
	isServer,
	_uuids: {},
	_observers: [
		raw_observer,
		uuid_observer,
		write_observer,
		load_observer,
		resolve_observer,
		tick_observer
	],
	resolve,
	query,
}
