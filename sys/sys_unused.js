
import Factory from './factory.js'

///
/// Pool Manager
///
/// A core service for Orbital that passes messages to other services and can manufacture them if needed
///

export default class Pool extends Factory {

	///
	/// constructor(command={})
	///
	/// valid command may be { server:true, domain:"mydomain.com", uuid:1234, commands:[{},{},{}] }
	///

	constructor(blob=null) {
		super(blob)
		this.resolve = this.resolve.bind(this)
		console.log("POOL uuid =",this.uuid)
		if(blob && blob.commands) {
			this.resolve(blob.commands)
		}
	}

	routes = []

	///
	/// it doesn't really make sense to try listen to the pool... but anyway
	///

	route(route) {
		if(typeof route === 'object' && route.resolve) {
			route = route.resolve.bind(route)
			this.routes.push(route)
		}
		let err = "pool: bad route"
		console.error(err)
		throw err
	}

	///
	/// resolve(command={}||[{},{},{}])
	///
	/// The pool managers general job is to forward received traffic to other services. It can make services too.
	///
	/// The pool manager expects a @command to be an object with a service identifier at least - like so:
	///
	///		{
	///			urn:"*:/sys/services/db",
	///			uuid:"myservice",
	///			...
	///		}
	///
	/// For us a service identifier is like so:
	///
	///		[domain segment]:[service name]:[optional checksum]:[optional signature]
	///
	///		domain segment: -> a specific domain such as 'me.github.io' or '*' or nothing -> meaning just find nearest service anywhere with the rest of the name
	///
	///		service name: -> a locally unique name for a service, this translates to an actual file path in current architecture
	///
	/// Notes / TODO:
	///
	///		We need package signing: https://blog.tidelift.com/the-state-of-package-signing-across-package-managers
	///

	async resolve(blob=0) {

		// as a convenience optionally handle bundles of commands passed at once
		if(Array.isArray(blob)) {
			let results = []
			for(let c of blob) {
				await this.resolve(c)
			}
			return
		}

		// sanity test
		if(!blob || typeof blob !== 'object') {
			let err = "POOL: incomplete command"
			console.error(err)
			console.error(blob)
			throw err
		}

		// get service
		let handler = await this._fetch(blob)

		// always pass contents to resolve - may be ignored - return the promise
		if(handler && handler.resolve && handler.resolve instanceof Function) {
			handler.resolve(blob)
		}

		if(handler) {
			// it is ok if a handler does not have a resolver
			return handler
		}

		// else throw err
		let err = "POOL: cannot resolve request at urn=" + blob.urn + " uuid="+blob.uuid
		console.error(err)
		console.error(blob)
		throw err

		// or could later return nothing if unable to resolve request...
		return null
	}

}
