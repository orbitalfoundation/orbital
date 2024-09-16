
//import * as Socket from './socket.io.esm.min.js'

// socket.io provides magic built in ability to dereference a copy of itself
import '/socket.io/socket.io.js'

import { log,warn,error } from '../utils/log.js'

import { uuid_client } from './uuid.js'

const sockets = {}

///
/// network client side
///

async function client_resolve(blob,sys) {

// xxx @todo there may be some kind of corrupt blob or blob with too much data in it
// look at this more closely
return

	// we are seeing traffic that we want to send to server?
	if(!blob.network) return

	if(typeof blob.network !== 'object') {
		error('network client: invalid network field',blob)
		return
	}

	// make sure the blob did not come from network - since they will be passed back through sys.resolve() below
	if(blob.network.remote) {
		warn('network client: saw traffic fly past that is already handled',blob.uuid)
		return
	}

	// locally durable uuid
	const sponsor = uuid_client()

	// a send helper

	const send_helper = (socket,blob)=> {

		// set sender socket for now - debatable
		if(!blob.network.socketid) {
			blob.network.socketid = socket.id
		}
		else if(blob.network.socketid != socket.id) {
			// @todo may want to allow - depends on perms
			warn("network client: being asked to publish something we do not create",blob)
			return
		}

		// strip off things that start with _ for now - a poor mans filter @todo later use a schema
		function strip(src) {
			const target = {}
			Object.entries(src).forEach(([k,v]) =>{
				if(k.startsWith('_')) return
				if(typeof v === 'object' && !Array.isArray(v) && v !== null) {
					target[k] = strip(v)
				} else {
					target[k] = v
				}
			})
			return target
		}

		const send = strip(blob)

		// 'sponsor' isn't really used but it feels reasonable to have some kind of identifier for the source? @todo evaluate 
		if(!send.network.sponsor) send.network.sponsor = sponsor

		// log("network client: sending",send)

		socket.emit('data',send)
	}

	const inbound_helper = (socket,blob) => {

		log("network client inbound:",blob)

		if(blob.network.sponsor === sponsor) {
			error("network client: client got something it created",blob)
			return
		}

		if(!blob.network.socketid) {
			error("network client: bad no socketid",blob)
			return
		}

		if(blob.network.socketid === socket.id) {
			error("network client: loopback traffic error",blob)
			return
		}

		blob.network.remote = true
		sys.resolve(blob)

	}

	const rebuild_helper = (blob) => {
		const socket = sockets[upstream] = window.io()
		socket.on('connect',()=>{
			//log('net: connected! localid is',socket.id)
			send_helper(socket,blob)
		})
		socket.on('data',(blob)=>{
			inbound_helper(socket,blob)
		})
		socket.on('disconnect',(data)=>{
			//warn("network client: ******* disconnected why?",socket.id,data)
			//log('net: TBD delete remote entities that are marked as transient remote') // @todo
			socket.destroy()
			delete sockets[upstream]
		})
	}

	// try send - connecting if needed

	const upstream = 'default'
	const socket = sockets[upstream]

	if(!socket) {
		rebuild_helper(blob)
	}
	else if(socket.connected != true) {
		warn("network client: network socket fail")
		rebuild_helper(blob)
	}
	else {
		send_helper(socket,blob)
	}

}



export const client_observer = {
	about: 'network client traffic observer',
	resolve: async function(blob,sys) {
		if(blob.tick) return
		if(!blob.network) return
		client_resolve(blob,sys) // don't be async just throw it
	}
}

