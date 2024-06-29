
import { paper_ssr } from '../paper/paper-ssr.js'

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

		//
		// ssr attempt - test
		//
		// pastes the ssr in first and then the live site after - this should be good enough for the client to figure things out ...
		//
		// this code fakes a client side request effectively; and then asks paper to produce an ssr version of itself
		// this requires the request path to be sensible for server side resources ( see sys meta and sys side import maps )
		//
		// - needs to fetch the correct index.js - and this is currently only fetching the root one @todo
		//
		// - could flush the paper nodes after fetching them ... but it isn't strictly necessary to do so
		//
		// - we must not load things like volume-3js - this still needs thought @todo
		//

		let ssrdata = ""

		if(false && sys && stats.resource.endsWith("index.html")) {
			ssrdata = memoized[stats.resource]
			if(!ssrdata) {
				console.log("server: attempting fresh ssr on ",stats.resource,sys.meta.dirname)
				try {
					await sys.resolve({dependencies:["/index.js"]})
					memoized[stats.resource] = ssrdata = paper_ssr(sys,"https://orbital.foundation/") || ""
					// const candidates = sys.query({paper:true})
					// candidates.forEach(c=>{ sys.resolve({uuid:c.uuid,obliterate:true}) })
				} catch(err) {
					console.error("server: ssr failed",err)
				}
			}
		}

		// write header
		const mime = mimeTypes[stats.resource.split('.').pop()] || 'text/plain'

		if(!ssrdata.length) {
			res.writeHead(200, { 'Content-Type': mime, 'Content-Length': stats.size })
			res.write(data,'binary')
			res.end()
		} else {
			let out = ssrdata + data
			res.writeHead(200, { 'Content-Type': mime, 'Content-Length': Buffer.byteLength(out,'utf8') })
			res.write(out)
			res.end()
		}

	})

}

export class Server {

	http = null
	io = null
	sys = null
	port = DEFAULT_PORT

	constructor() {
		this.http = http.createServer(http_handle_request).listen(this.port)
		this.io = new Socket.Server(this.http)
		this.io.on('connection', this._fresh_connection.bind(this) )
	}

	async _fresh_connection(socket) {

		console.log("server: fresh connection",socket.id)

		if(!this.sys) {
			warn('server: no sys')
			return
		}

		socket.on('data', async (data) => {
			await this._consume_incoming_data(socket,data)
		})

		socket.on('disconnect', ()=>{
			this._disconnect_and_obliterate(socket)
		})

	}

	async _consume_incoming_data(socket,data) {

		if(!data || !data.network) return

		if( !data ||
			typeof data !== 'object' ||
			Array.isArray(data) ||
			!data.network ||
			typeof data.network !== 'object' ||
			Array.isArray(data.network))
		{
			error('server: data invalid',data)
			return			
		}

		if(!data.network.socketid) {
			error("server: data is not marked up with originator socket?",data,socket.id)
			return
		}

		// mark as remote as a convenience concept
		data.network.remote = true

		// handle remote query right now and throw away packet
		if(data.network.query) {
			await this._query(socket,data.network)
			return
		}

		// echo state to other parties in the subspace
		const sockets = await this.io.fetchSockets()
		for(const other of sockets) {
			if(other.id === socket.id || other.subspace !== data.network.subspace) continue
			await other.emit('data',data)
		}

		// wait for internal resolver to finalize ... not sure await really makes any difference @todo debate
		await this.sys.resolve(data)
	}

	//
	// publish a fresh copy of state
	// @todo 
	//
	// 
	// @todo this needs some work
	//		- it must filter by the subspace - or at least the client must ask for the subspace by hand
	//		- if we do get a subspace query for like a room or world - we should load that manifest first
	//		- it's unclear what happens if a client disconnects and reconnects - we should blow away transient objects
	//		- but if there are durable objects it arguably could send you a copy of your own avatar ... which is dumb... we need to mark where things came from and not send them back
	//

	async _query(socket,network={subspace:"/"}) {

		if(!this.sys) {
			warn('server: no sys')
			return
		}

		console.log('server: websocket got a query request',socket.id)

		const candidates = await this.sys.query({'network.subspace':network.subspace})

		for(const entity of candidates) {
			console.log("********* network server sending fresh whole entity",entity.uuid)
			socket.emit('data',entity)
		}
	}

	///
	/// traffic has arrived from one of the clients - route it through local handlers and typically multicast
	///

	async server_network_react(blob,sys) {

		// set sys if we see it
		this.sys = sys

		if(!blob || !blob.network) return

		if( !blob ||
			typeof blob !== 'object' ||
			Array.isArray(blob) ||
			!blob.network ||
			typeof blob.network !== 'object' ||
			Array.isArray(blob.network))
		{
			console.error('server: data network invalid',blob)
			return
		}

		// get full entity if any
		const entity = blob._entity

		// if traffic was originally from network then do not forward it
		// @todo actually this is not a terrible place to echo network traffic but lets not do it for now
		if(blob.network_remote || (blob._entity && blob._entity.network_remote )) {
			//console.log("server: rejecting sending",args)
			return
		}

		// the goal of this reactor is to forward locally manufactured traffic to network
		// @todo later it could deal with any state that appears on the network - including remote state

		// it may see traffic that belongs to client since all traffic is dumped directly to the bus for now and unfiltered
		// at the moment all traffic is always entities with effects, so we look at the entity for some hints on what to do

		// this should be checked by the query; but paranoia check it here again to avoid loopback
		if(!entity || !entity.network || entity.network_remote) {
			//console.log("server: rejecting sending",args)
			return
		}

		if(entity.networkid && entity.networkid !== sys.selfid) {
			//console.log("server: rejecting sending 2",args)
			// console.error("server: asked to publish something it does not own",args)
			// it is actually possible for this to occur - traffic is not fully filtered by the time it gets here
			return
		}

		// take ownership
		//entity.networkid = sys.selfid

		// always mark the traffic source
		//blob.networkid = sys.selfid

		const sockets = await this.io.fetchSockets()
		for(let socket of sockets) {
			socket.emit('data',blob)
		}

	}

	async _disconnect_and_obliterate(socket) {

		if(!this.sys) {
			warn('server: no sys')
			return
		}

		console.log("server: server disconnect ",socket)

		// @todo add a heartbeat system? clients can delete on loss of heartbeat
		// @todo do not delete truly persistent objects
		// @todo make sure to write to persistence layer

		// mark some entities as 'obliterated' - which observers can listen to and remove their records

		const candidates = await this.sys.query({})
		for(let entity of candidates) {
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



}

