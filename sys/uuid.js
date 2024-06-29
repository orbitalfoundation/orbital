
import { append } from './append.js'

const uuid = "orbital/sys/uuid.js"

const description = `UUID observer stores objects with uuids in transient storage; it is append only, there is no way to remove properties yet. Also provides a query interceptor.`

const resolve = async function(blob,sys) {

	const time = performance.now()

	// handle requests that have uuids only
	if(!blob.uuid) {
		return blob
	}
	let uuid = blob.uuid

	// obliterate if desired; but still continue to pass the blob through other handlers
	if(blob.obliterate) {
		delete sys._uuids[uuid]
		return blob
	}

	// find existing entity if any
	let entity = sys._uuids[uuid]

	// update volatile storage
	if(!entity) {
		blob._updated = blob._created = time
		sys._uuids[uuid] = blob
	} else {
		blob._updated = time
		append(blob,entity)
	}

	return blob
}

const query_matches = (args,candidate) => {
	for (const [key,val] of Object.entries(args)) {
		if(!candidate.hasOwnProperty(key)) return false
		if(candidate[key] instanceof Object) continue
		if(candidate[key]!==val) return false
	}
	return true
}

const query = function(args,sys) {

	if(args.uuid) {
		return [ sys._uuids[args.uuid] ]
	}

	const results = []

	for (const [uuid,entity] of Object.entries(sys._uuids)) {
		if(!query_matches(args,entity)) continue
		results.push(entity)
	}

	return results
}

export const uuid_observer = {
	uuid,
	description,
	query,
	resolve
}
