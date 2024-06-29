
import { log,warn,error } from '../utils/log.js'

const isServer = (typeof window === 'undefined') ? true : false

const cwd = (typeof process === 'undefined') ? "" : process.cwd() // relative cwd ../../ cannot be used on server due to path aliasing

const uuid = "orbital/sys/load.js"

const description = `The load observer fetches assets for Orbital`

const importmaps = {
	'orbital': 'orbital'
}

const _configuration = {
	importmaps,
	isServer,
	manifest:'index.js'
}

//
// fetch() is used to load files on client and server; harmonize this behavior for client and server
//
// callers should typically anchor their requests such as "/something" or be relative to root such as "./something"
//
//  https://blah is allowed as is
//  my/example/path is allowed as is although may not fetch() since webpack is not used nor npm resolution
//  mypath/ is turned into mypath/index.js
//  /mypath/myfile is turned into process.cwd()/mypath/myfile on server and /mypath/myfile on client
//  orbital/somefile is turned into process.cwd()/orbital/somefile on server and /orbital/somefile on client
//  ../../../etc/passwd cannot be reached ... although it is not our job to provide this security
//

export const _harmonize_resource_path = (resource,config=_configuration) => {

	if (!resource || typeof resource !== 'string' && !(resource instanceof String)) {
		error(uuid,'sys:load invalid resource',resource)
		return null
	}

	let extern = resource.toLowerCase()
	if( extern.startsWith('http://') || extern.startsWith('https://') || extern.startsWith('file://') ) {
		return resource
	}

	const parts = resource.split("/")

	const out = []
	for(let i = 0; i < parts.length; i++) {
		let part = parts[i]
		switch(part) {
			case '':
				if(i == 0) {
					if(config.isServer) out.push(cwd); else out.push('')
				}
				if(i == parts.length-1) {
					out.push(config.manifest)
				}
				break
			case '..':
				out.pop()
				break
			default:
				if(!i) {
					// @todo illegal paths such as /etc/passwd could sneak in via import maps
					if(config.importmaps[part]) {
						if(config.isServer) out.push(cwd)
						part = config.importmaps[part]
					}
				}
				out.push(part)
				break
		}
	}
	return out.length ? out.join('/')  : null
}

//
// import resources for client or server
//
// @todo note
// was toying with an idea of granting uuids here as a convenience @todo revisit
// if(typeof v === 'object' && !Array.isArray(v) && v !== null && !v.uuid) {
//	const uuid = resource + "/" + k
//	console.warn('sys: note blob had no uuid key=',k,'value=',v)
//	v.uuid = uuid
// }
//

const load = async (resource,sys) => {
	try {
		const module = await import(resource)
		for(const [k,v] of Object.entries(module)) {
			//console.log(`sys:load - loading module named ${k} from ${resource}`)
			try {
				await sys.resolve(v)
			} catch(e) {
				console.error("sys:load - error corrupt artifact?",k,e)
			}
		}
	} catch(err) {
		console.error("sys:load - error unable to load",err)
		console.error(err)
	}
}


const resolve = async function(blob,sys) {
	if(!blob.load) return blob
	const candidates = Array.isArray(blob.load) ? blob.load : [blob.load]
	for(let resource of candidates) {
		resource = _harmonize_resource_path(resource,this._configuration)
		if(resource) await load(resource,sys)
	}
	return blob
}

export const load_observer = {
	uuid,
	description,
	resolve,
	_configuration
}

