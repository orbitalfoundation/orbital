
import { perform } from './perform.js'

const isServer = typeof window === 'undefined'

///
/// queue inbound puppet performance events for playback on client
///

export const observer = {
	about: 'puppet observer performance - client side',
	observer: (args) => {
		if(isServer) return
		if(args.blob.tick) return
		if(!args.blob.performance) return

		// find one candidate
		const entities = args.sys.query({uuid:args.blob.uuid})
		if(!entities || !entities.length) {
			console.error("puppet performance - no entity found??")
		}

		// simply push packets onto that candidate
		// note that we use args.blob.performance (passed args) since args.entity.performance (final state) will constantly change
		for(const entity of entities) {
			if(!entity.puppet || !entity.puppet.reason) {
				console.error("puppet performance something is horribly wrong",entity)
				continue
			} else {
				if(!entity.puppet.queue) entity.puppet.queue=[]
				entity.puppet.queue.push(args.blob.performance)
				break
			}
		}
	}
}

///
/// observe every tick
///

export const puppet_client_side_tick = {
	about: 'puppet tick observer - client side',
	observer: (args) => {
		if(isServer) return
		if(!args.blob.tick) return

		// get all entities that are puppets
		const entities = args.sys.query({puppet:true})

		// update each one
		entities.forEach( (entity) => {
			perform({
				     node: entity.volume._node,
				      vrm: entity.volume._vrm,
				    queue: entity.puppet.queue,
				     time: args.blob.time,
					delta: args.blob.delta,
			})
		})
	}
}

///
/// a helper that will turn off voice recognition and also mark puppets as busy or not
/// the hope here is to prevent puppets from hearing themseves or getting bogged down too much with requests
///

let voice_busy = false

export const puppet_client_busy_tick = {
	about: 'puppet tick busy observer - client side',
	observer: (args) => {
		if(isServer) return
		if(!args.blob.tick) return
		const sys = args.sys

		// get all entities that are puppets
		const entities = args.sys.query({puppet:true})

		let busy_state = false
		entities.forEach( (entity) => {
			if(entity.puppet.queue && entity.puppet.queue.length) {
				busy_state = true
			} else {
				if(entity.puppet.busy == true) {
					console.log("performance busy checker: marking puppet as NOT busy",entity)
					sys.resolve({ uuid:entity.uuid, puppet:{ busy: false } })
				}
			}
		})

		if(voice_busy != busy_state) {
			voice_busy = busy_state
			console.log("performance busy checker: stopping voice? false is stopped=",!busy_state)
			sys.resolve({ voice_recognizer: !busy_state })
		}
	}
}
