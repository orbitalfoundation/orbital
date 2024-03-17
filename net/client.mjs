
//import * as Socket from './socket.io.esm.min.js'

// socket.io provides some magic
import '/socket.io/socket.io.js'

import { log,warn,error } from '../utils/log.js'

const sockets = {}

export async function client_network_react(args) {

	// @todo - it might make sense to build the connections earlier than first packet being sent?
	// @todo - allow for more aggressive packet filtering here perhaps custom; such as spatial distance or relevance?
	// @todo - later the network could specify different servers
	// @todo - later individual entities can be registered on different upstream providers; for now however let us assume a single server
	// @todo - i might want a more mature concept of network_remote like something more with acls or perms
	// const upstream = 'server'+entity.network
	// const upstream = args.entity.uuid.match(/^(?:https?:)?(?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n]+)/im)[1] || 'default' ?

	if(args.blob.name === "tick") return // ignore

	if(args.entity) {
		if(!args.entity.network || args.entity.network_remote) return
	} else {
		if(!args.blob || !args.blob.network || args.blob.network_remote) return
	}

	const upstream = 'default'
	let socket = sockets[upstream]
	if(!socket) {
		socket = sockets[upstream] = window.io()
		socket.on('connect',()=>{
			log('net: connected! localid is',socket.id)
		})
		socket.on('data',(data)=>{
			if(!data.networkid) {
				console.error("network: bad no networkid",data)
				return
			}
			if(data.networkid === socket.id) {
				console.error("network: loopback traffic error",data)
				return
			}

			data.network_remote = true
			args.sys.resolve(data)
		})
		socket.on('disconnect',(data)=>{
			console.error("client: ******* disconnected why?",socket.id,data)
			log('net: TBD delete remote entities that are marked as transient')
			socket.destroy()
			delete sockets[upstream]
		})
	}

	if(args.entity) {
		if(args.entity.networkid && args.entity.networkid != socket.id) {
			// @todo i may want to allow this - but sent a warning for now
			console.warn("client: being asked to publish something we do not create",args)
		}
		args.entity.networkid = socket.id
	}

	args.blob.networkid = socket.id
	socket.emit('data',args.blob)
}

