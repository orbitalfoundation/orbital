import { log,warn,error } from '../utils/log.js'

const uuid = "orbital/sys/load.js"

const description = `Load component loads other assets on demand`

const _load_configuration = {
	manifest:'index.js',
	importmaps: {
		'orbital':'orbital',
		'@':'' // @todo may deprecate support for '@' notation since it is no longer used
	},
	anchor:null
}

const resolve = async function(blob,sys) {
	if(!blob.load) return

	//
	// a persistent anchor concept is used to ground subsequent loads - @todo may deprecate it is not used now
	// @todo this may need some push/pop style scoping such as when loading manifests from some other projects
	//

	if(blob.anchor && blob.anchor.length) {
		let temp = blob.anchor
		if(temp.startsWith('/')) temp = temp.slice(1)
		if(temp.endsWith('/')) temp = temp.slice(0,-1)
		_load_configuration.anchor = temp.length ? temp : null
	}

	//
	// load requested files
	//

	const candidates = Array.isArray(blob.load) ? blob.load : [blob.load]
	for(let resource of candidates) {
		resource = harmonize_resource_path(this._load_configuration,resource)
		try {
			log(uuid,'loading',resource)
			const module = await import(resource)
			for(const [k,v] of Object.entries(module)) {
				try {
					//log(uuid,'resolving',k,resource)
					await sys.resolve(v)
				} catch(e) {
					error(uuid,' - error corrupt artifact key=',k,'content=',v,'error=',e)
				}
			}
		} catch(err) {
			error(uuid,'- error unable to load',err)
		}
	}
}

export const load_observer = {
	uuid,
	description,
	resolve,
	_load_configuration
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////

const isServer = (typeof window === 'undefined') ? true : false

// note that relative cwd ../../ cannot be used on server due to path aliasing - it has to be a full blown process.cwd()
const cwd = (typeof process === 'undefined') ? "" : process.cwd()

export const harmonize_resource_path = (config,resource) => {

	// valid?
	if (!resource || typeof resource !== 'string' && !(resource instanceof String) || !resource.length) {
		error(uuid,'- invalid resource',resource,resource)
		return null
	}

	// external?
	const lower = resource.toLowerCase()
	if( lower.startsWith('http://') || lower.startsWith('https://') || lower.startsWith('file://') ) {
		log(uuid,'- external resource',resource)
		return resource
	}

	// pick apart and rebuild the path
	let out = []
	const parts = resource.split("/")
	for(let i = 0; i < parts.length; i++) {
		let part = parts[i]
		switch(part) {
			case '.':
				// @todo dunno what to do ...
				break
			case '..':
				// perform the .. right now - to prevent escaping the path space on client and server
				out.pop()
				break
			case '':
				if(i == parts.length-1) {
					// on both server and client if the file ends in '/' then force inject a default manifest typically '/index.js'
					out.push(config.manifest)
				}
				break
			default:
				if(!i) {
					// anchor paths that do not start with '/'
					if(config.anchor) {
						out.push(config.anchor)
					}
					// may rewrite token or throw it away
					if(config.importmaps.hasOwnProperty(part)) {
						part = config.importmaps[part]
					}
				}
				if(part.length) {
					out.push(part)
				}
				break
		}
	}

	// resources are located within their relative application filespace on server and client
	out.unshift( isServer ? cwd : '')

	// put all back together and return
	return out.length ? out.join('/')  : null
}


