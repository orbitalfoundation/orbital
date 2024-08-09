
import * as fs from 'fs'
import * as URL from 'url'
import * as path from 'path'
import http from 'http'
import https from 'http'
import { mimeTypes } from './mimetypes.js'

//
// helper to find SPA files
//

async function spa_file(req) {

	// get subdomain as a zone if any or default to 'default' for now
	const cwd = process.cwd()
	const zone = req.headers.host.split('.').length > 2 ? path.join(cwd,'shared',req.headers.host.split(".").slice(0,1).join()) : cwd

	// find client side conception of resource
	const url = URL.parse('https://'+req.headers.host+req.url)
	let pathname = url.pathname
	let resource
	let leaf = ''

	// if pathname ends in /index.html then strip index.html or fail - do not keep trying to find a file
	if(pathname.endsWith('/index.html')) {
		resource = path.join(zone,pathname)
		if(!fs.existsSync(resource)) {
			return null
		}
		let stats = fs.statSync(resource)
		stats.resource = resource
		if(stats.isDirectory()) {
			return null
		}
		pathname = pathname.substr(0,-10)
		console.log("http: redirecting path to strip index.html",pathname,resource)
		return { redirect: pathname }
	}

	// if pathname ends in a slash then return pathname/index.html or fail - do not keep trying to find a file
	if(pathname.endsWith('/')) {
		resource = path.join(zone,pathname,'index.html')
		if(!fs.existsSync(resource)) {
			return null
		}
		let stats = fs.statSync(resource)
		stats.resource = resource
		if(stats.isDirectory()) {
			return null
		}
		//console.log("http: found spa index resource",pathname,resource)
		return stats
	}

	// return ordinary files - must ignore folders (allow folders to fall through to below)
	{
		resource = path.join(zone,pathname)
		if(fs.existsSync(resource)) {
			let stats = fs.statSync(resource)
			stats.resource = resource
			if(!stats.isDirectory()) {
				//console.log("http: found file",pathname,resource)
				return stats
			}
		}
	}

	// don't allow spa routes to have dot .mime type 
	const mime = pathname.lastIndexOf('.')
	if(mime >= 0 && mimeTypes[pathname.slice(mime+1)]) {
		console.log("http: found mime type - probably not a route - rejecting",pathname)
		return null
	}

	// enter spa app routing search mode - search upwards for an index.html
	const parts = pathname.match(/[^\/]+/g) || []
	while(true) {
		resource = path.join(zone,...parts,"index.html")
		console.log("http: looking upwards for resource",resource)
		if(fs.existsSync(resource)) {
			let stats = fs.statSync(resource)
			stats.resource = resource
			if(!stats.isDirectory()) {
				//  the client is hopefully smart enough to understand the path for spa apps is relative
				console.log("http: found spa resource",resource)
				return stats
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
	const parts = []
	req.on('data', chunk => {
		parts.push(chunk)
	})
	req.on('end', async () => {
		const body = Buffer.concat(parts)
		try {
			const options = {
				method: req.method,
				headers : req.headers,
				body
			}
			const res2 = await fetch(url,options)
			console.log(res2)
			const body2 = await res2.text()
			res.writeHead(res2.status,res2.headers)
			res.end(body2)
		} catch (error) {
			console.error('Proxy request failed:', error);
			res.writeHead(500, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ error: 'Proxy request failed' }));
		}
	})
	return true
}

const prox2y = async(req,res) => {

	// is proxy request?
	if(req.url !== "/proxy") return false

	// get real url
	const targetUrl = req.headers['proxy']
	if (!targetUrl) {
		res.writeHead(400, { 'Content-Type': 'text/plain' })
		res.end('Proxy target URL is missing')
		return false
	}

	// rebuild url
	const parsedUrl = URL.parse(targetUrl)
	const options = {
		hostname: parsedUrl.hostname,
		port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
		path: parsedUrl.path,
		method: req.method,
		headers: { ...req.headers }
	}
	delete options.headers['proxy']

	// Handle preflight CORS request
	if (req.method === 'OPTIONS') {
		res.writeHead(204, {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		})
		res.end()
		console.log("preflight")
		return true
	}

	console.log("real deal")

	// pipe response from proxy request back to client
	const proxyReq = (parsedUrl.protocol === 'https:' ? https : http).request(options, (proxyRes) => {
		res.writeHead(proxyRes.statusCode, proxyRes.headers)
		proxyRes.pipe(res, { end: true })
	})

	proxyReq.on('error', (err) => {
		res.writeHead(500, { 'Content-Type': 'text/plain' })
		res.end('Proxy error: ' + err.message)
	})

	req.pipe(proxyReq, { end: true })

	//req.on('end', () => { proxyReq.end() })

	return true
}


async function http_handle_request(req, res) {

	// a standalone proxy handler
	if( await proxy(req,res) ) return

	let stats = await spa_file(req)

	if(stats && stats.hasOwnProperty('redirect')) {
		console.log("server::http sending a redirect to the client",stats.redirect)
		res.writeHead(302, { 'Location': stats.redirect || "/" })
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

	console.log("http ...",stats)

	// @todo use incremental file reader stream later
	fs.readFile(stats.resource,'binary', async (err, data) => {

		if(err) {
			res.writeHead(500, {'Content-Type': 'text/plain'})
			res.write(err)
			res.end()
			return
		}

		// what is the file type?
		const mime = mimeTypes[stats.resource.split('.').pop()] || 'text/plain'

		// const expanded = await ssr_test(stats)
		// if(expanded) {
		//
		// } else

		{
			res.writeHead(200, { 'Content-Type': mime, 'Content-Length': stats.size })
			res.write(data,'binary')
			res.end()
		}

	})

}


/*

import { paper_ssr } from '../paper/paper-ssr.js'
let memoized = {}
let sys = null

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

function ssr_test() {

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

	let out = ssrdata + data
	res.writeHead(200, { 'Content-Type': mime, 'Content-Length': Buffer.byteLength(out,'utf8') })
	res.write(out)
	res.end()
	return true

}


*/

const config = {
	host: '127.0.0.1',
	port: 4000,
	exclusive: true
}

export const http_observer = {
	about: 'http traffic observer',
	resolve: function(blob,sys) {
		if(!blob.http) return blob

		if(!globalThis._http) {
			// @todo use supplied config if any
			globalThis._http = http.createServer( http_handle_request ).listen(config)
			console.log("http: started",config.host,config.port)
		}

		return blob
	}
}

