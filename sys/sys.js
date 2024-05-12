
import { log,warn,error } from '../utils/log.js'

///
/// Sys
///
///		- runs on both client and server
///		- this code is very unoptimized; it is establishing principles foremost
///		- tick: has a timer/tick mechanism that is tied to the frame counter on the client and is just an interval timer on the server
///
///		- handlers
///			- catches all incoming datagrams and routes them through both kernel handlers and outside handlers (I call those 'observers')
///			- are synchronous using await
///			- can rewrite events in transit
///			- can consume events preventing them from propagating further
///
///		- phases
///			- this engine is different from react which has an event accumulation phase and then event resolution phase
///			- this engine is by default fully resolving every event completely as it passes through the chain
///			- there is an option to pass your own queue and to run it as a two phase system but this not default behavior
///			- there is therefore a risk of a loop that never ends
///			- @todo write some loop detection logic such as writing a loop counter into traffic
///
/// @todo - reactionless writes -> could be convenient? right now listeners listen to all writes - could be nice to have bypass that
/// @todo - register sys query interceptors so that i can have a separate db?
/// @todo - handling children of an object here would be very convenient - can grant uuids in that case (right now .children are ignored here)
/// @todo - on clients we should set a public id from a public key such as from metamask
///

export class Sys {

	// config props - try not to use this too much - later i may force this down to individual modules @todo may deprecate
	config = {}

	// for now all volatile state is indexed here for now - later it will not be volatile - may also try use indexdb @todo improve later with real persistence
	database = {}

	systemid = 0
	timePrevious = 0

	constructor(config={}) {

		// detect if client or server
		this.server = (typeof window === 'undefined') ? true : false,

		// we need a quasi-stable durable inter-session uuid that can be used as a prefix for locally created entities
		// servers can set this in a configuration property
		// clients may want to use a user public key possibly?
		// clients for now just use a random key stuffed into localstorage
		this.systemid = config && config.systemid ? config.systemid : "you really should set this"

		// remember the config for other users
		// @todo generally i don't want a ton of global config if possible but it's a convenient catch all for now
		this.config = config || {}

		// bind the tick and frame update logic to allow it to be passed as a callback
		this.run = this.run.bind(this)

		//
		// configure the initial event pipeline
		//
	
		const raw = new OnRaw()
		const uuids = new OnUUID()
		const dependencies = new OnDependencies(config.importmaps)
		const outsiders = new OnOutsiders()

		raw.subsequent.push(uuids.chain.bind(uuids))
		uuids.subsequent.push(dependencies.chain.bind(dependencies))
		dependencies.subsequent.push(outsiders.chain.bind(outsiders))

		const sys = this
		this.resolve = async (blob) => {
			await raw.chain({blob,sys})
		}

	}

	async resolve(blob) {
		console.error("sys: abstract method called")
		return this
	}

	async step() {
		const sys = this
		const time = performance.now()
		const delta = this.timePrevious ? time - this.timePrevious : 0
		this.timePrevious = time
		const tick = {name:'tick',time,delta,tick:true}
		await this.resolve(tick)
		if(false) {
			// we don't use this right now - it is for a two phase action/reaction approach - right now i react immediately instead
			const blobs = this.raw.blobs
			this.raw.blobs = []
			blobs.unshift(tick)
			for(const blob of blobs) {
				let args = {blob,sys,time,delta}
				for(const resolve of this.observers) {
					await resolve(args)
				}
			}
		}
	}

	async sleep(millis) {
	    return new Promise(resolve => setTimeout(resolve, millis));
	}

	async run() {
		if(!this.server) {
			await this.step()
			window.requestAnimationFrame(this.run)
		} else {
			while(true) {
				await this.step()
				// @todo should only sleep the gap not always 1000/60 - really needs to calculate the delay please
				await this.sleep(16)
			}
		}
	}

	query_matches = (args,candidate) => {
		for (const [key,val] of Object.entries(args)) {
			if(!candidate.hasOwnProperty(key)) return false
			if(candidate[key] instanceof Object) continue
			if(candidate[key]!==val) return false
		}
		return true
	}

	///
	/// local query - sync for now not async
	///
	/// @todo decide where i want to do queries
	/// @todo decide if i want to allow handlers to filter by queries also for performance
	/// @todo may want to make this async or use a callback pattern because a real database won't be synchronous later???
	/// @todo need much richer query semantics
	///


	query(args) {

		if(args.uuid) {
			return [ this.database[args.uuid] ]
		}

		const results = []

		for (const [uuid,entity] of Object.entries(this.database)) {
			if(!this.query_matches(args,entity)) continue
			results.push(entity)
		}

		return results
	}

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// capture raw traffic and do some early preprocessing
///
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class OnRaw {

	content = 'catch raw inbound state into a transient cache - separate incoming activity from reaction to that activity'
	subsequent = []

	async chain(args) {	

		let {blob,sys} = args

		if(!blob) {
			error('sys:raw: empty input')
			return
		}

		if(Array.isArray(blob)) {
			for(let i = 0; i < blob.length; i++) {
				await this.chain({blob:blob[i],sys})
			}
			return
		}

		if(typeof blob === 'function') {
			//warn('sys::raw functions not supported yet')
			return
		}

		if( typeof blob !== 'object') {
			error('sys::raw: subject is not an entity?',blob)
			return
		}

		// must detach from inputs asap so that nobody ever accidentally writes to the passed pointer state
		if(!args.blob.tick) {
			try {
				args.blob = deepAppend(blob)
			} catch(err) {
				error('sys:raw: deepcopy error',err)
			}
		}

		// pass through other handlers
		for(const handler of this.subsequent) {
			await handler(args)
		}
	}
}

//
// note this fails to deal with deletions
// @todo maybe structuredClone to copy simple types also
// @todo finish visited[] loop prevention
//

function deepAppend(source,target={},visited=[]) {

	if(!source || !target) {
		console.error("sys: corrupt input")
		return source
	}

	if(Array.isArray(source)) {
		console.error("sys: corrupt data",source)
		return source
	}

	if( typeof source !== 'object') {
		console.error("sys: corrupt input",source)
		return source
	}

	Object.entries(source).forEach( ([k,v]) => {

		// examine source value

		if(!v) {
			// use as is
		}
		else if(Array.isArray(v)) {
			// @todo arguably could deep copy elements
		}
		else if(typeof v === 'function') {
			// @todo copy function refs directly
		}
		else if(typeof v === 'object') {
			// deep copy this to shake loose any pointers
			v = deepAppend(v,{},visited)
		}

		// examine target value

		const orig = target[k]
		if(!orig) {
			// write v as is overtop target
		}
		else if(Array.isArray(orig)) {
			// write v as is overtop target
		}
		else if(typeof orig === 'function') {
			// write v as is overtop target
		}
		else if(typeof orig === 'object' && typeof v === 'object') {
			v = deepAppend(v,orig)
			target[k] = v
			visited.push(v)
		}

		target[k] = v

	})

	return target
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// OnEntity - handle raw datagrams coming in and grant uuids if desired and store in a database
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let uuidcounter = 1

class OnUUID {

	content = 'grant a uuid and timestamp and cache blob as entity'
	subsequent = []

	async chain(args) {

		// save to database if any and also in that case set args.entity
		await this._may_write_to_database(args)

		// call other chained kernel handlers
		for(const handler of this.subsequent) {
			await handler(args)
		}
	}

	async _may_write_to_database(args) {
		const sys = args.sys
		const blob = args.blob
		const time = Date.now() // args.time

/*
		// trialing a name granting capability
		// i disabled this because it's too fragile - it is unclear when to use it @todo revisit anselm feb 2024
		if(!blob.uuid && blob.name && blob.hasOwnProperty("_origin")) {
			blob.uuid = sys.host + blob._origin + '/' + blob.name
			blob.host = sys.host
			blob.path = blob._origin
			console.log("sys::uuid granted a uuid to a thing using origin",blob)
		} else {
			console.log("sys::uuid not granting a uuid because it may have one",blob)
		}
*/

		blob._now = performance.now() * 1000

		// blob may specify to generate a uuid
		// @todo could look at parent also later and generate one that is based on hierarchy
		if(blob.hasOwnProperty('uuid') && !blob.uuid) {
			blob.uuid = `${uuidcounter++}-${sys.systemid}`
		}

		// done this stage if no uuid; nothing to really do
		let uuid = blob.uuid
		if(!uuid) {
			blob._updated = time
			args.fresh = blob._created ? false : true
			if(args.fresh) blob._created = time
			return
		}

		// get existing entity if any
		let entity = sys.database[uuid]

		// otherwise make a new one
		if(!entity) {
			args.fresh = true
			entity = args.entity = sys.database[uuid] = blob
			entity._created = entity._updated = blob._created = blob._updated = time
		}
		
		// copy blob props to entity
		else {
			args.fresh = false
			args.entity = entity
			entity._updated = time
			entity._now = performance.now() * 1000
			deepAppend(blob,entity)
		}		
	}
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// On Modules / Dependencies
///
/// There are a variety of ways we could allow dynamic import of code blobs in a declarative low-code approach.
///
/// For now we expose a 'modules' component that effectively acts a dynamic import on vanilla javascript files.
/// Any javascript file has its exports passed directly back into sys as if they were datagrams / events.
/// A user can load up anything like so:
///
/// const dependencies = {
///		dependencies: [ "myfile.js", "myotherfile.js" ]
///	}
///
/// Note:
///
/// entity._origin Injection: Modules force inject _origin (loaded file path of manifest) into an entity -> useful for several reasons...
/// @todo should actually inject the folder not the actual manifest name? although it is useful to have the manifest name as well...
/// @todo could maybe rename as provenance or something?
///
/// Reactions: We try to 'react' to module exports being loaded as fast as possible because observers there are used later in the same file.
/// If we didn't fully produce the observers asap then as the file was read further reactions would not be triggered.
///
/// LATER:
///
/// It's arguable that we don't need a modules loader at all but to simply refer to an asset by a uuid path
/// A database lookup could produce the original module in question since my database maps to the filesystem...
///
///
/// Current Path: Orbital is anchored at the start of its filesystem on the server, so we assume that is the relative path start.
/// A caller could pass import.meta which has hints about the actual current folder; hopefully this won't be needed.
//
/// Prefab: Later I may want to invent an idea of prefabs - forceloading a module more than once - @todo.
///
/// @todo - implicit or magical module loader - simply specifying a resource would read through from disk ... making modules concept obsolete
/// @todo - could look for modules: and run those first to circumvent a sequence order issue with imports?
/// @todo - server could pre-scan the entire file hierarchy to allow for fast reference based loading (to make modules obsolete)
///
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { path } from './path.js'
import { resource_mapper } from './resource_mapper.js'

class OnDependencies {

	content = 'load modules/dependencies on demand'
	loaded_modules = []
	subsequent = []

	constructor(importmaps) {
		this.importmaps = importmaps
	}

	async chain(args) {

		// produce modules?
		if(args.blob && args.fresh && (args.blob.modules || args.blob.dependencies)) {
			await this._module_load(args)
			// do not return / consume ... there may be other props that other handlers want to chew on the packet
		}

		// call other chained kernel handlers with any traffic
		for(const handler of this.subsequent) {
			await handler(args)
		}
	}

	async _module_load({blob,sys}) {
		const modules = blob.modules || blob.dependencies

		// a module is permitted to contain collections that are arrays that hold objects; mark those with the origin if any
		// @todo i may want to remove this feature and force users to qualify their paths themselves
		const recursively_set_origin = (item,resource) => {
			if(!item) {
				warn("sys::module loader: null object")
			} else if(typeof item === 'function') {
				warn("sys::module loader: naked functions are not supported")
			} else if(Array.isArray(item)) {
				item.forEach( item_child => recursively_set_origin(item_child,resource) )
			} else if(item instanceof Object) {
				log("sys::module loader: stuffing origin into item",item,resource)
				item._origin = resource.substring(0, resource.lastIndexOf("/"))
			} else {
				error("module loader: unknown item type")
			}
		}
	
		const helper = async (resource) => {

			const raw = resource_mapper(resource,this.importmaps)

			if(!raw) {
				error("module loader: cannot resolve path",resource)
				return
			}


			// prevent duplicate loads
			if(this.loaded_modules[raw]) return
			this.loaded_modules[raw] = true

			// go ahead and pass module contents to sys
			try {
				//log("sys::module loading",raw,resource)
				const module = await import(raw)
				if(!module) {
					error('sys: module not found ' + resource)
					return
				}
				//log('sys::modules now parsing')
				for(const [k,v] of Object.entries(module)) {
					//log('sys::modules loaded and resolving this item',v,resource)
					//recursively_set_origin(v,resource)
					await sys.resolve(v)
				}
			} catch(err) {
				error('sys: cannot finalize module due to some bug somewhere',path,err)
			}
		}

		if(Array.isArray(modules)) {
			for(const item of modules) {
				await helper(item)
			}
		} else {
			await helper(modules)
		}

		return true
	}
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// OnObservers
///
/// Watch every single packet that flows past and register outside observers
///
/// Those observers in turn can have their own fine grained reactivity
/// This is effectively how we implement components in an ECS like nomenclature
///
/// @todo userland observers should use a declarative query format so that query observers can be optimized
/// @todo right now every single datagram is passed to every single observer! which is terrible
/// @todo at least filter by room...
///
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class OnOutsiders {

	content = 'register outside observers on demand'
	_outsiders = []
	subsequent = []

	async chain(args) {

		// if we notice a new outside observer then register it as soon as possible
		// @todo i think we should sanitize network traffic
		if(args && args.fresh && args.blob && args.blob.observer && !args.blob.network_remote) {
			this._register_outsider(args.blob)
			//log("sys::outsider registered",args.blob)
			// do not return/consume - instead fall thru in case there are other props on the blob to chew on later
		}

		// call other chained kernel handlers with any traffic that is flying past
		for(const handler of this.subsequent) {
			await handler(args)
		}

		// lastly - call the outsiders last for now ... @todo may want to add a sort order
		for(const handler of this._outsiders) {
			await handler(args)
		}

	}

	_register_outsider(blob) {
		if(typeof blob.observer === 'function') {
			this._outsiders.push(blob.observer.bind(blob))
		} else if(blob.observer.react && typeof blob.observer.react === 'function') {
			// @todo should we scope to the blob for 'this'? it means not copying the blob but using as is in earlier stages
			this._outsiders.push(blob.observer.react.bind(blob.observer))
		} else {
			console.error("sys:outsiders: unknown")
		}
	}

}

