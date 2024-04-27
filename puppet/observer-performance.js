
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
		const entities = args.sys.query({uuid:args.blob.uuid}) // note this should only return one candidate
		entities.forEach(entity=>{
			if(!entity.puppet) return
			if(!entity.puppet.queue) entity.puppet.queue=[]
			entity.puppet.queue.push(args.blob.performance) // note that args.entity.performance is volatile
		})
	}
}

///
/// observe every tick on client and may dequeue events
///

export const puppet_client_side_tick = {
	about: 'puppet tick observer - client side',
	observer: (args) => {
		if(isServer) return
		if(!args.blob.tick) return
		const entities = args.sys.query({puppet:true})
		entities.forEach( (entity) => {
			const done = perform({
				     node: entity.volume._node,
				      vrm: entity.volume._vrm,
				    queue: entity.puppet.queue,
				     time: args.blob.time,
					delta: args.blob.delta,
			})
		})
	}
}
