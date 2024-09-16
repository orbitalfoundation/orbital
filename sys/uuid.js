
import { append } from './append.js'

const uuid = "orbital/sys/uuid.js"

const description = `UUID observer stores objects with uuids in client storage that can be inter-refresh`

const resolve = async function(blob,sys) {

	const time = performance.now()

	// handle requests that have uuids only
	let uuid = blob.uuid
	if(!uuid) {
		return
	}

	// bring up db? @todo this may be sloppy / slow
	await db_init()

	// obliterate if desired; but still continue to pass the blob through other handlers
	if(blob.obliterate) {
		db_obliterate(uuid)
		return
	}

	// find existing entity if any
	let entity = db_query_uuid(uuid)

	// add new
	if(!entity) {
		blob._entity = blob
		blob._updated = blob._created = time
		db_write(blob)
	}

	// update existing
	else {
		append(blob,entity)
		blob._entity = entity
		entity._updated = time
		db_write(entity)
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
		const elem = uuids[args.uuid]
		return elem ? [ elem ] : []
	}

	const results = []

	for (const [uuid,entity] of Object.entries(uuids)) {
		if(!query_matches(args,entity)) continue
		results.push(entity)
	}

	return results
}

/////////////////////////////////////////////////////////////////////////////////////

let db
const uuids = {}
const USEDB = false

function db_init() {

	if(!USEDB) {
		return
	}

	return new Promise( (resolve,reject)=>{
		if(db) return
		if(typeof indexedDB === 'undefined') {
			console.error("uuid: why is indexedDB being visited here?")
			reject()
		}
		const request = indexedDB.open('orbital.local', 1)
		request.onupgradeneeded = (event) => {
			db = event.target.result
			const objectStore = db.createObjectStore('objectStore', { keyPath: 'uuid' })
			objectStore.createIndex('uuid', 'uuid', { unique: true })
		}
		request.onsuccess = (event) => {
		    console.log('orbital sys uuid - database opened successfully')
			resolve()
		}
		request.onerror = (event) => {
		    console.error('orbital sys uuid - database error:', event.target.errorCode)
		    reject()
		}
	})
}

function db_write(blob) {
	if(!USEDB) {
		uuids[blob.uuid]=blob
		return
	}
	if(!db) {
		console.error('orbital sys uuid - db not ready',blob)
		return
	}
	const transaction = db.transaction(['objectStore'], 'readwrite')
	const objectStore = transaction.objectStore('objectStore')
	const request = objectStore.add(blob)
	request.onsuccess = (event) => {
		console.log('orbital sys uuid - database object added:', event.target.result)
	}
	request.onerror = (event) => {
		console.error('orbital sys uuid - database error adding object:', event.target.errorCode)
	}
}

function db_query_uuid(uuid) {
	if(!USEDB) {
		return uuids[uuid]
	}
	if(!db) {
		console.error('orbital sys uuid - db not ready',blob)
		return
	}
	let transaction = db.transaction(['objectStore'], 'readonly')
	let objectStore = transaction.objectStore('objectStore')
	let request = objectStore.get(uuid)
	request.onsuccess = (event) => {
		if (request.result) {
			console.log('orbital sys uuid - Object retrieved:', request.result)
		} else {
			console.log('orbital sys uuid - Object not found')
		}
	}
	request.onerror = (event) => {
		console.error('orbital sys uuid - error retrieving object:', event.target.errorCode)
	}
}

function db_obliterate(uuid) {
	if(!USEDB) {
		delete uuids[uuid]
		return
	}
	if(!db) {
		console.error('orbital sys uuid - db not ready',blob)
		return
	}
	let transaction = db.transaction(['objectStore'], 'readwrite')
	let objectStore = transaction.objectStore('objectStore')
	let request = objectStore.delete(uuid)
	request.onsuccess = (event) => {
		console.log('orbital sys uuid - record with uuid', uuid, 'deleted successfully')
	}
	request.onerror = (event) => {
		console.error('orbital sys uuid - error deleting record:', event.target.errorCode)
	}
}

/////////////////////////////////////////////////////////////////////////////////////

export const uuid_observer = {
	uuid,
	description,
	query,
	resolve
}
