
const uuid = "@orbital/sys/observer.js"

const description = `Add or remove new observers`

const resolve = async function(blob,sys) {
	if(blob.resolve) {

		// do not re-add
		if(sys._observers.includes(blob)) {
			console.warn("sys observer observer noticed previous",blob)
			return
		}

		// replace same id - @todo can use sys._observers.filter() desired
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
	return blob
}

export const resolve_resolver = {
	uuid,
	description,
	resolve
}
