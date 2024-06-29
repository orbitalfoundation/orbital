

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
	let leaf = ''

	// if the pathname ends in an index.html then redirect to base of that
	if(pathname.endsWith('index.html')) {
		pathname = pathname.substr(0,-10)
		//console.log("http: redirecting path to strip index.html",req.path,pathname)
		return { redirect: pathname }
	}

	// if pathname ends in a slash then try return pathname/index.html
	if(pathname.endsWith('/')) {
		resource = path.join(root,pathname,'index.html')
		if(fs.existsSync(resource)) {
			let stats = fs.statSync(resource)
			stats.resource = resource
			if(!stats.isDirectory()) {
				//console.log("http: found spa resource",resource)
				return stats
			}
			//console.log("http: did not find spa resource",resource)
		}
	}

	// else look for an ordinary file
	else {
		resource = path.join(root,pathname)
		if(fs.existsSync(resource)) {
			let stats = fs.statSync(resource)
			stats.resource = resource
			if(!stats.isDirectory()) {
				//console.log("http: found file resource",resource)
				return stats
			}
			//console.log("http: did not find file resource",resource)
		}
	}

	// recursively search upwards for best spa index to run
	const parts = pathname.match(/[^\/]+/g) || []
	while(true) {
		resource = path.join(root,...parts,"index.html")
		console.log("http: looking upwards for resource",resource)
		if(fs.existsSync(resource)) {
			let stats = fs.statSync(resource)
			stats.resource = resource
			if(!stats.isDirectory()) {
				//  the client is hopefully smart enough to understand the path for spa apps is relative
				return stats
				// alternatively a redirect could be used but then urls are not web persistent
				// resource = path.join(...parts) + "/"
				// console.log("http: redirecting to ",resource)
				// return { redirect: resource }
			}
		}
		if(!parts.length) break
		parts.pop()
	}

	// or just give up
	return null
}

const proxy = async(req,res) => {

	if(req.url !== "/proxy") return false

	const url = req.headers.proxy
	delete req.headers.proxy

	let requestBody = ''

	req.on('data', chunk => {
		requestBody += chunk.toString()
	})

	req.on('end', async () => {

		try {

			const sendme = req.method.toLowerCase() === 'post' ? JSON.parse(requestBody) : null
			const options = {
				method: req.method,
				headers : req.headers,
			}
			if(sendme) options.body = JSON.stringify(sendme)

			const response = await fetch(url, options )
			const json = await response.json()
			const body = JSON.stringify(json)

			res.writeHead(response.status,{
				...response.headers,
				'Content-Length': body.length,
				'Content-Type': 'application/json',				
			})

			res.end(body)

		} catch (error) {
			console.error('Proxy request failed:', error);
			res.writeHead(500, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ error: 'Proxy request failed' }));
		}
	})

	return true
}

let sys = null
let memoized = {}

async function http_handle_request(req, res) {

	if( await proxy(req,res) ) return

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

	fs.readFile(stats.resource,'binary', async (err, data) => {
		if(err) {
			res.writeHead(500, {'Content-Type': 'text/plain'})
			res.write(err)
			res.end()
			return
		}

		// write header
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

	constructor(_sys) {
		sys = this.sys = _sys
		if(!sys || !sys.selfid) throw "Must have sys and sys.selfid"
		const port = sys && sys.config && sys.config.network_port ? sys.config.network_port : DEFAULT_PORT
		this.http = http.createServer(http_handle_request).listen(port)
		this.io = new Socket.Server(this.http)
		this.io.on('connection', this.fresh_connection.bind(this) )
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

		if(args.entity.networkid && args.entity.networkid !== this.sys.selfid) {
			//console.log("server: rejecting sending 2",args)
			// console.error("server: asked to publish something it does not own",args)
			// it is actually possible for this to occur - traffic is not fully filtered by the time it gets here
			return
		}

		// take ownership
		args.entity.networkid = this.sys.selfid

		// always mark the traffic source
		args.blob.networkid = this.sys.selfid

		const sockets = await this.io.fetchSockets()
		for(let socket of sockets) {
			socket.emit('data',args.blob)
		}

	}

	async disconnect_and_obliterate(socket) {
		console.log("server: server disconnect ",socket)

		// @todo add a heartbeat system? clients can delete on loss of heartbeat
		// @todo do not delete truly persistent objects
		// @todo make sure to write to persistence layer

		// mark some entities as 'obliterated' - which observers can listen to and remove their records

		const candidates = await this.sys.query({})
		for(const entity of candidates) {
			if(entity.uuid && entity.network && entity.networkid && entity.networkid === socket.id && !entity.persist) {

				const data = {
					uuid:entity.uuid,
					networkid:entity.networkid,
					networkhost:entity.networkhost,
					network:true,
					network_remote:true,
					obliterate:true
				}

				// allow system to deal with the obliterate event; typically storage but also any observers can react
				this.sys.resolve(data)

				// for now manually echo to everybody else
				// @todo improve: currently server rejects traffic not sponsored by server
				// @todo we really don't want to multicast like this since it bypasses reactivity
				const sockets = await this.io.fetchSockets()
				for(let other of sockets) {
					if(other.id == socket.id || data.networkid == other.id) continue
					other.emit('data',data)
				}
			}
		}
	}

	async fresh_connection(socket) {

		console.log("server: fresh connection",socket.id)

		// start watching disconnect
		socket.on('disconnect', ()=>{ this.disconnect_and_obliterate(socket) } )

		// start watching fresh data
		socket.on('data', (data) => {
			this.consume_incoming_data(socket,data)
		})

		// for now send initial state right away - @todo the client should actually proactively ask for this
		await this.send_fresh_data(socket)
	}

	async send_fresh_data(socket) {

		console.log("server: websocket got a query request - sending all db items for now - @todo refine",socket.id)

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
					entity.networkid = this.sys.selfid
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
		if(data.server_query) {
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

new Server({selfid: "asdf"})


