import { log,warn,error } from '../utils/log.js'

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// a resource helper
///
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let importmaps = {}

export function resource_mapper(resource,add_importmaps) {

	// append these
	if(add_importmaps) {
		importmaps = { ...importmaps, ...add_importmaps }
	}

	// resource must be a string
	if (typeof resource !== 'string' && !(resource instanceof String)) {
		error("sys: resource loader: module path is not a string",resource)
		return null
	}

	// resource may be an url
	else if(resource.startsWith("http")) {
		return resource
	}

	// for now don't support relative paths for simplicity
	else if(resource.includes("..")) {
		error("sys: resource loader: does not support relative paths at the moment... resource=",resource)
		return null
	}

	// server side?
	if(resource.startsWith("/") && typeof process !== 'undefined') {
		resource = process.cwd() + resource
		console.log("resource loader: tacking on root of file system",resource);
	}

	// try find in import map

	if(!resource.startsWith("/") && !resource.startsWith("./")) {
		const tokens = resource.split("/")
		if(tokens.length) {
			const base = importmaps[tokens.shift()]
			if(base) {
				tokens.unshift(base)
				const results = tokens.join("/")
				log("sys: resource loader: found mapping ",resource,results)
				return results
			}
		}
	}

	// not found ... try use as is?

	log("sys: resource loader: using resource as is ",resource)
	return resource

}
