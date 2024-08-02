
///
/// an append or clone utility for the in memory db for orbital
///
///		- copy new state overtop of old state for the db
///		- in general the local volatile transient state / database keeps a copy of state
///		- state is used extensively for queries everywhere in this engine, and later may even support fancy spatial queries specifically for 3d simulations
///		- this copy routine notices if inbound new state has an '_' in a field name because in this design new state should represent formal or canonical variables - not internal props
///		- deep copying is a hassle, loop prevention could use more work
///		- new state is layered on top of old state; appended - deletion of fields is not supported right now
///

export function append(source,target={},visited=[]) {

	if(!source || !target) {
		console.error(uuid,'corrupt input')
		return source
	}

	if(Array.isArray(source)) {
		console.error(uuid,'corrupt data',source)
		return source
	}

	if( typeof source !== 'object') {
		console.error(uuid,'corrupt input',source)
		return source
	}

	Object.entries(source).forEach( ([k,v]) => {

		// @todo improve
		// when writing to the database we have to avoid recursing deep into complex structures
		// the caller however may be passing a 'built' object that has rich properties
		if(k.startsWith("_")) {
			if(source.name=='tick') return
			// @todo think about this more - we're copying already populated objects over for some reason
			console.warn("append: looks like fully populated data",k)
			return
		}

		// examine source value

		if(!v) {
			// use as is - do nothing
		}
		else if(Array.isArray(v)) {
			// @todo will almost certainly want to deep copy elements - for now do nothing
		}
		else if(typeof v === 'function') {
			// refer to functions as is - do nothing
		}
		else if(typeof v === 'object') {
			// deep copy this to shake loose any pointers
			v = append(v,{},visited)
		}

		// examine target value

		const orig = target[k]
		if(!orig) {
			// write v as is overtop previous target
		}
		else if(Array.isArray(orig)) {
			// write v as is overtop previous target
		}
		else if(typeof orig === 'function') {
			// write v as is overtop previous target
		}
		else if(typeof orig === 'object' && typeof v === 'object') {
			// this appends only does not delete
			v = append(v,orig)
			target[k] = v
			visited.push(v)
		}

		target[k] = v

	})

	return target
}
