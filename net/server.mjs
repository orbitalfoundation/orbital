

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

let root = process.cwd()

const rewrite_routes_from_url = (req) => {
	// deal with subdomains @todo
	return url.parse(req.url).pathname
}

const find_local_file = async(req) => {

	let pathname = rewrite_routes_from_url(req)
	let resource

	try {

		// find exact file?
		resource = path.join(root,pathname)
		console.log("server::http: looking for ",resource,pathname)
		let stats = fs.statSync(resource)
		stats.resource = resource
		if(!stats.isDirectory()) return stats

		// a request for a directory without a trailing "/" will cause terrible grief to clients later - force promote to be a real directory request
		if(!pathname.endsWith('/')) {
			return { redirect: pathname+"/" }
		}

		// a request for a directory is legal if there is an index.html below it (for spa apps this is legal)
		try {
			resource = path.join(root,pathname,'index.html')
			let stats = fs.statSync(resource)
			stats.resource = resource
			if(!stats.isDirectory()) return stats
		} catch(err) {
			console.error("server::http",err)
		}

	} catch(err) {
		console.error("server::http",err)
	}

	// if there are no parts to the path then try return the absolute root index.html as a spa app
	const parts = pathname.match(/[^\/]+/g)
	if(!parts || parts.length <= 1) {
		try {
			resource = path.join(root,"index.html")
			let stats = fs.statSync(resource)
			stats.resource = resource
			if(!stats.isDirectory()) return stats
		} catch(err) {
			console.error("server::http",err)
		}
	}

	// otherwise if there are parts to the url path then try return the parent index.html - basically we are on some spa app route
	else {
		parts.pop()
		pathname = parts.join('/')
		resource = path.join(root,pathname,'index.html')
		try {
			let stats = fs.statSync(resource)
			stats.resource = resource
			if(!stats.isDirectory()) return stats
		} catch(err) {
			console.error("server::http",err)
		}
	}

	// or just give up
	return null
}


const http_handle_request = async (req, res) => {

	let stats = await find_local_file(req)

	if(stats && stats.redirect) {
		console.log("server::http sending a redirect to the client",stats.redirect)
		res.writeHead(302, { 'Location': stats.redirect })
		res.end()
		return
	}

	if(!stats) {
		console.error("server::http cannot find resource",req.url)
		res.writeHead(404, { 'Content-Type': 'text/plain' })
		res.write('404 Not Found')
		res.end()
		return
	}

	fs.readFile(stats.resource,'binary',(err, data) => {
		if(err) {
			res.writeHead(500, {'Content-Type': 'text/plain'})
			res.write(err)
			res.end()
			return
		}
		const mime = mimeTypes[stats.resource.split('.').pop()] || 'text/plain'
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
		const port = sys && sys.config && sys.config.network_port ? sys.config.network_port : DEFAULT_PORT
		this.http = http.createServer(http_handle_request).listen(port)
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

		// the server can react to some events - preventing them from going further
		console.log(data)
		if(data.server_query) {
			console.log("server: websocket got a query request - sending all db items for now - @todo refine")
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

