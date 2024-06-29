
import { log,warn,error } from '../utils/log.js'

const uuid = 'orbital/sys/raw.js'

const description =
`
Raw performs early stage sanity checks on data flowing into the system and then passes the data to all other observers.
Raw also destructures arrays; other observers can assume data is not an array; each array element is piped all the way through the pipeline one at a time.
There is a quirk in that this observer itself is one of the observers in the queue (always the first) so it specifically excludes visiting itself.
Later observers can rewrite the list of observers and can evict this observer from the queue; replacing it with another if they wish.
`

const resolve = async (blob,sys) => {

	if(Array.isArray(blob)) {
		for(let child of blob) {
			await resolve(child,sys)
		}
	}

	else if(!blob) {
		error(uuid,`no data error`)
	}

	else if(typeof blob === 'function') {
		warn(uuid,`functions not supported yet`,blob)
	}

	else if( typeof blob !== 'object') {
		error(uuid,`must be an object`,blob)
	}

	else {

		for(let i = 1; blob && i < sys._observers.length;i++) {
			const observer = sys._observers[i]
			if(observer.resolve_filter) {
				// match query tbd
				// @todo write templated filter in order to reduce calls to resolve
				continue
			}

			// do work
			if(observer.resolve) {
				blob = await observer.resolve(blob,sys)
			}
			// early exit? @todo could require an actual blob { abort: true } ?
			if(!blob) {
				console.warn("sys:raw early exit: ",observer)
				break
			}
		}
	}

	// raw is always the first observer and never returns any results since it calls the rest
	return null
}

const query = (args,sys) => {
	// find any query handler and return it for now - refine later into a concept of handlers that choose to handle or choose to not handle @todo
	for(let i = 1; args && i < sys._observers.length;i++) {
		const observer = sys._observers[i]
		if(observer.query) {
			return observer.query(args,sys)
		}
	}
}

export const raw_observer = {
	uuid,
	description,
	resolve_filter: null,
	resolve,
	query,
}
