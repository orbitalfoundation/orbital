
//import * as Socket from './socket.io.esm.min.js'

// socket.io provides some magic
import '/socket.io/socket.io.js'

import { log,warn,error } from '../utils/log.js'

const sockets = {}

const isServer = (typeof window === 'undefined') ? true : false

///
/// network client side
///
/// @todo - it might make sense to build the connections earlier than first packet being sent?
/// @todo - allow for more aggressive packet filtering here perhaps custom; such as spatial distance or relevance?
/// @todo - later the network could specify different servers
/// @todo - later individual entities can be registered on different upstream providers; for now however let us assume a single server
/// @todo - i might want a more mature concept of network_remote like something more with acls or perms
/// const upstream = 'server'+entity.network
/// const upstream = args.entity.uuid.match(/^(?:https?:)?(?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n]+)/im)[1] || 'default' ?
///

export async function client_network_react(args) {

	const blob = args

	if(!blob.network) return

	if(isServer) {
		console.error("network: this cannot run on server side",args)
		return
	}

	if(args.entity) {
		if(!args.entity.network) return
		if(args.entity.network_remote) {
			// @todo this can happen because remote inbound traffic flies past this observer
			// @todo this is a good argument for smarter query observers
			//console.warn("client: being asked to publish something we do not create",args)
			return
		}
	} else {
		if(!args.blob || !args.blob.network) return
		if(args.blob.network_remote) {
			// @todo this can happen because remote inbound traffic flies past this observer
			// @todo this is a good argument for smarter query observers
			// console.warn("client: being asked to publish something we do not create",args)
			return
		}
	}

	// publish helper

	const helper = (socket)=> {
		// publish the client changes

		if(args.entity) {
			if(args.entity.networkid && args.entity.networkid != socket.id) {
				// @todo i may want to allow this - but sent a warning for now
				console.warn("client: being asked to publish something we do not create",args)
			}
			args.entity.networkid = socket.id
		}

// hack @todo must improve
let send = { ... args.blob }
if(send.volume) {
	send.volume = { ... send.volume }
	delete send.volume._node
	delete send.volume._camera
	delete send.volume._gltf
	delete send.volume._node_tried_load
	delete send.volume.camera_follow
}

		send.networkid = args.blob.networkid = socket.id
		send.networkhost = args.sys.selfid


console.log("sending",send)

		socket.emit('data',send)

	}

	// build connection on first packet

	const upstream = 'default'
	let socket = sockets[upstream]
	if(!socket) {
		socket = sockets[upstream] = window.io()
		socket.on('connect',()=>{
			log('net: connected! localid is',socket.id)
			helper(socket)
		})
		socket.on('data',(data)=>{

console.log("client inbound",data)

			if(data.networkhost === args.sys.selfid) {
				console.error("network: client got something it created",data)
				return
			}

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

	else if(socket.connected == true) {
		helper(socket)
	} else {
		console.warn("client: network socket fail")
	}


}

