
///
/// an append or clone utility
///
/// @todo note this fails to deal with deletions it only appends
/// @todo maybe structuredClone to copy simple types also?
/// @todo finish visited[] loop prevention - incomplete
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
