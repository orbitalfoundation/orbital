
const uuid = "@orbital/sys/observer.js"

const description = `Add or remove new observers`

const resolve = async function(blob,sys) {
	if(!blob.resolve) return

	// already exists - never add an observer twice
	// or at least remove the previous one @todo
	// @todo probably ALSO want to force observers to have a uuid and block duplicates that way rather than by internal js hash ? 
	if(sys._observers.includes(blob)) {
		console.warn("sys observer observer noticed previous",blob)
		return
	}

	// replace same id - @todo could try invent a sys._observers.filter() pattern instead?
	if(blob.uuid) {
		for(let i = 0; i < sys._observers.length; i++) {
			if(blob.uuid === sys._observers[i]._uuid) {
				sys._observers[i] = blob
				return
			}
		}
	}

	// insert after?
	if(blob.resolve && blob.resolve.insert_after) {
		for(let i = 0; i < sys._observers.length; i++) {
			if(blob.uuid === blob.resolve.insert_after) {
				sys._observers[i].splice(i+1,0,blob)
				return
			}
		}
	}

	// insert before?
	if(blob.resolve && blob.resolve.insert_before) {
		for(let i = 0; i < sys._observers.length; i++) {
			if(blob.uuid === blob.resolve.insert_before) {
				sys._observers[i].splice(i,0,blob)
				return
			}
		}			
	}

	// append
	sys._observers.push(blob)
}

export const resolve_observer = {
	uuid,
	description,
	resolve
}
