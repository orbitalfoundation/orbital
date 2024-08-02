
import { log, warn, error } from '../utils/log.js'

import { uuid_server } from './uuid.js'

import * as Socket from 'socket.io'

class Server {

	io = null
	sys = null

	constructor(sys) {
		this.sys = sys
		if(!globalThis._http) {
			error('network server: http must be started first')
			return
		}
		this.io = new Socket.Server(globalThis._http)
		this.io.on('connection', this._fresh_connection.bind(this) )
		console.log("server started")
	}

	async _fresh_connection(socket) {

		log("network server: fresh connection",socket.id)

		if(!this.sys) {
			error('network server: no sys')
			return
		}

		socket.on('data', (blob) => {
			this._consume_incoming_data(socket,blob)
		})

		socket.on('disconnect', ()=>{
			this._disconnect_and_obliterate(socket)
		})

	}

	async _consume_incoming_data(socket,blob) {

		if(!blob || typeof blob !== 'object' ||
			Array.isArray(blob) ||
			!blob.network ||
			typeof blob.network !== 'object' ||
			Array.isArray(blob.network))
		{
			error('server: data network invalid',blob)
			return
		}

		if(!blob.network.socketid) {
			error("network server: data is not marked up with originator socket?",blob)
			return
		}

		// mark as remote to avoid loops
		blob.network.remote = true

		// echo to other sockets for now ... it's debatable if resolve() should do this or not
        socket.broadcast.emit('data',blob)

		// wait for internal resolver to finalize ... not sure await really makes any difference @todo debate
		this.sys.resolve(blob)
	}

	async _disconnect_and_obliterate(socket) {

		if(!this.sys) {
			warn('server: no sys')
			return
		}

		log("server: server disconnect ")

		// @todo add a heartbeat system? clients can delete on loss of heartbeat
		// @todo do not delete truly persistent objects
		// @todo make sure to write to persistence layer

		// mark some entities as 'obliterated' - which observers can listen to and remove their records
		// for now manually echo to everybody else
		// @todo improve: currently server rejects traffic not sponsored by server
		// @todo we really don't want to multicast like this since it bypasses reactivity

		const candidates = await this.sys.query({})
		for(let blob of candidates) {
			if(blob.uuid && blob.network && blob.network.socketid && blob.network.socketid === socket.id && !blob.persist) {
				const data = { ...blob, obliterate: true }
				this.sys.resolve(data)
				const sockets = await this.io.fetchSockets()
				for(let other of sockets) {
					if(other.id == socket.id || data.networkid == other.id) continue
					other.emit('data',data)
				}
			}
		}
	}

	///
	/// traffic is arriving here from internal activity on the local instance
	///

	async resolve(blob,sys) {

		// set sys if we see it
		this.sys = sys

		if(!blob || typeof blob !== 'object' ||
			Array.isArray(blob) ||
			!blob.network ||
			typeof blob.network !== 'object' ||
			Array.isArray(blob.network))
		{
			error('server: data network invalid',blob)
			return
		}

		if(blob.network.remote) {
			//warn('network server: ignoring traffic that is already handled',blob)
			return
		}

		const sponsor = await uuid_server()

		// @todo loopback protection will be needed

		// mark up as originating from us if has not been networked yet
		if(!blob.network.sponsor) blob.network.sponsor = sponsor

		// also stuff in the server identifier as well for fun
		blob.network.server_sponsor = sponsor

		const sockets = await this.io.fetchSockets()

		// if monocast
		if(blob.network.monocast) {
			for(let socket of sockets) {
				if(socket.id == blob.network.monocast) {
					blob.network.socketid = sponsor
					socket.emit('data',blob)
					break
				}
			}
			return
		}

		// multicast to other parties 
		for(let socket of sockets) {
			socket.emit('data',blob)
		}

	}

}

export const server_observer = {
	about: 'server traffic observer',
	resolve: function(blob,sys) {
		if(blob.tick) return blob

		if(blob.server && !this._server) {
			this._server = new Server(sys)
			log("server: sockets started for server")
		}

		if(blob.network) {
			this._server.resolve(blob,sys)
		}

		return blob
	}
}
