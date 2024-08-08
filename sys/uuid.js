
import { append } from './append.js'

const uuid = "orbital/sys/uuid.js"

const description = `UUID observer stores objects with uuids in transient storage; it is append only, there is no way to remove properties yet. Also provides a query interceptor.`

const resolve = async function(blob,sys) {

	const time = performance.now()

	// handle requests that have uuids only
	if(!blob.uuid) {
		return
	}
	let uuid = blob.uuid

	// obliterate if desired; but still continue to pass the blob through other handlers
	if(blob.obliterate) {
		delete sys._uuids[uuid]
		return
	}

	// find existing entity if any
	let entity = sys._uuids[uuid]

	// add new
	if(!entity) {
		blob._entity = blob
		blob._updated = blob._created = time
		sys._uuids[uuid] = blob
		return
	}

	// update existing
	{
		append(blob,entity)
		blob._entity = entity
		entity._updated = time
	}

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
		const elem = sys._uuids[args.uuid]
		return elem ? [ elem ] : []
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
