

import * as fs from 'fs'
import * as http from 'http'
import * as url from 'url'
import * as path from 'path'
import * as Socket from 'socket.io'

const DEFAULT_PORT = 4000

const mimeTypes = {
	'bin': 'application/octet-stream',
	'css': 'text/css',
	'gif': 'image/gif',
	'glb': 'model/gltf-binary',
	'gltf': 'model/gltf+json',
	'htm': 'text/html',
	'html': 'text/html',
	'jpeg': 'image/jpeg',
	'jpg': 'image/jpeg',
	'js': 'text/javascript',
	'mjs': 'text/javascript',
	'json': 'application/json',
	'm3u8': 'application/tnd.apple.mpegurl',
	'map': 'application/json;charset=utf-8',
	'm4a': 'audio/mp4',
	'm4v': 'video/mp4',
	'mp3': 'audio/mpeg',
	'mp4': 'video/mp4',
	'ogg': 'audio/ogg',
	'ogv': 'video/ogg',
	'otf': 'font/otf',
	'png': 'image/png',
	'svg': 'tmage/svg+xml',
	'tif': 'image/tiff',
	'tiff': 'image/tiff',
	'ts': 'video/vnd.dlna.mpeg-tts',
	'ttf': 'application/font-sfnt',
	'tts': 'video/vnd.dlna.mpeg-tts',
	'txt': 'text/plain',
	'wasm': 'application/wasm',
	'webp': 'image/webp',
	'xml': 'text/xml',
}


const http_traffic = async (req, res) => {

	let root = "./" //process.cwd()
	let pathname = url.parse(req.url).pathname
	let resource = null

	const helper = async() => {
		try {
			// return file if found
			resource = path.join(root,pathname)
			let stats = fs.statSync(resource)
			if(!stats.isDirectory()) return stats
			// promote directory requests? (client needs to be moved to resource/ for it to find subsequent child resources correctly)
			if(!pathname.endsWith('/')) {
				console.log("server::http rewrote url",pathname)
				res.writeHead(302, { 'Location': `${pathname}/` })
				res.end()
				return { redirect: true }
			}
			// found pathname/index.html? (for spa apps this is legal)
			try {
				resource = path.join(root,pathname,'index.html')
				let stats = fs.statSync(resource)
				if(!stats.isDirectory()) return stats
			} catch(err) {
			}
		} catch(err) {
		}
		const parts = pathname.match(/[^\/]+/g)
		// if no path fragments then try just return the root index if any
		if(!parts || parts.length <= 1) {
			try {
				resource = path.join(root,"index.html")
				let stats = fs.statSync(resource)
				if(!stats.isDirectory()) return stats
			} catch(err) {
			}
		}
		// support users sharing urls to spa apps that are not anchored in real index.htmls ... so go up one notch and find it
		else {
			parts.pop()
			pathname = parts.join('/')
			resource = path.join(root,pathname,'index.html')
			try {
				let stats = fs.statSync(resource)
				if(!stats.isDirectory()) return stats
			} catch(err) {
			}
		}
		return null
	}

	let stats = await helper()

	if(stats && stats.redirect) {
		console.log("server redirected")
		return
	}

	if(!resource || !stats || stats.isDirectory()) {
		console.error("server::http cannot find resource",req.url)
		res.writeHead(404, { 'Content-Type': 'text/plain' })
		res.write('404 Not Found')
		res.end()
		return
	}

	fs.readFile(resource,'binary',(err, data) => {
		console.log("server::http returned resource",resource)
		if(err) {
			res.writeHead(500, {'Content-Type': 'text/plain'})
			res.write(err)
			res.end()
			return
		}
		const mime = mimeTypes[resource.split('.').pop()] || 'text/plain'
		res.writeHead(200, { 'Content-Type': mime, 'Content-Length': stats.size })
		res.write(data,'binary')
		res.end()
	})

}

export class Server {

	http = null
	io = null
	sys = null

	constructor(sys) {
		this.sys = sys
		if(!sys || !sys.systemid) throw "Must have sys and sys.systemid"
		this.http = http.createServer(http_traffic).listen(sys.port || DEFAULT_PORT)
		this.io = new Socket.Server(this.http)
		this.io.on('connection', this.fresh_connection.bind(this) )
		this.io.on('disconnect', this.disconnect.bind(this) )
	}

	async server_network_react(args) {

		// just avoid this
		if(args.blob.name === "tick") return

		// the goal of this reactor is to forward locally manufactured traffic to network
		// @todo later it could deal with any state that appears on the network - including remote state

		// it may see traffic that belongs to client since all traffic is dumped directly to the bus for now and unfiltered
		// at the moment all traffic is always entities with effects, so we look at the entity for some hints on what to do

		// this should be checked by the query; but paranoia check it here again to avoid loopback
		if(!args || !args.entity || !args.entity.network || args.entity.network_remote) {
			//console.log("server: rejecting sending",args)
			return
		}

		if(args.entity.networkid && args.entity.networkid !== this.sys.systemid) {
			//console.log("server: rejecting sending 2",args)
			// console.error("server: asked to publish something it does not own",args)
			// it is actually possible for this to occur - traffic is not fully filtered by the time it gets here
			return
		}

		// take ownership
		args.entity.networkid = this.sys.systemid

		// always mark the traffic source
		args.blob.networkid = this.sys.systemid

		const sockets = await this.io.fetchSockets()
		for(let socket of sockets) {
			socket.emit('data',args.blob)
		}

	}

	disconnect(socket) {
		console.log("server ********** server disconnect ",socket.id)
		// - stop sending heartbeats for this channel
		// - delete volatile transient objects owned by this channel and publish to all
	}

	async fresh_connection(socket) {
		console.log("server: ***************** fresh connection",socket.id)
		socket.on('data', (data) => {
			this.consume_incoming_data(socket,data)
		})
	}

	async send_fresh_data(socket) {

		// publish a fresh copy of all state to that client - sending also remote entities that happen to exist already

		// @todo this needs some work
		//		- it must filter by the subspace - or at least the client must ask for the subspace by hand
		//		- if we do get a subspace query for like a room or world - we should load that manifest first
		//		- it's unclear what happens if a client disconnects and reconnects - we should blow away transient objects
		//		- but if there are durable objects it arguably could send you a copy of your own avatar ... which is dumb... we need to mark where things came from and not send them back

		const candidates = await this.sys.query({})

		for(const entity of candidates) {
			if(entity.network) {
				if(!entity.networkid) {
					console.warn("server: had to grant networkid",entity.uuid)
					entity.networkid = this.sys.systemid
				}
				if(entity.networkid !== socket.id) {
					console.log("********* network server sending fresh whole",entity.uuid)
					socket.emit('data',entity)
				}
			}
		}
	}

	async consume_incoming_data(socket,data) {

		// perform incoming state here (the sys component doesn't run as many observers as the client typically)
		// echo to all other observers for now; later can improve
		// also this entire function could be an observer on sys rather than here at all

		if(data.networkid && data.networkid != socket.id) {
			warn("server: got traffic that is not from where it claims to come from",data,socket.id)
		}

		// mark with source
		data.networkid = socket.id

		// mark as not ours - this idea may go away
		data.network_remote = true

		// the server can intercept and react to some events - preventing them from going further
		console.log(data)
		if(data.server_query) {
			console.log("server: intercepted a query request - just send everything for now")
			await this.send_fresh_data(socket)
			return
		}

		// generally speaking the server echoes state to all other parties
		const sockets = await this.io.fetchSockets()
		for(let other of sockets) {
			if(other.id == socket.id || data.networkid == other.id) continue
			other.emit('data',data)
		}

		// async deal with it here as well - effectively acts as just one more listener and is asynchronous ... @todo debate
		this.sys.resolve(data)
	}

}

