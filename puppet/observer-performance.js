
const isServer = typeof window === 'undefined'

import { Puppet } from './client/puppet-standalone.js'

///
/// looks for performances that typically contain properties like
///
///		- audio
///		- emotion
///		- whisper timings
///

export const puppet_client_side_performance_observer = {
	about: 'puppet observer - client side',
	observer: (args) => {
		if(isServer) return
		if(args.blob.tick) return
		if(!args.blob.performance) return
		const entities = args.sys.query({uuid:args.blob.performance.targetuuid})
		if(!entities || !entities.length) {
			console.error("puppet performance - no entity found??",args)
			return
		}
		for(const entity of entities) {
			add_performance(entity,args.blob.performance)
			break
		}
	}
}

const add_performance = (entity,perf) => {
	if(!entity.puppet || !entity.volume || !entity.volume._node) return
	if(!entity.puppet._handler) {
		entity.puppet._handler = new Puppet(entity.volume._node)
		// @todo will eventually want a disposal mechanism for these dynamically created objects as well
	}
	console.log("puppet: got performance",perf)
	entity.puppet._handler.perform(perf)
}

///
/// observe ticks
///

export const puppet_client_side_tick_observer = {
	about: 'puppet tick observer - client side',
	observer: (args) => {
		if(isServer) return
		if(!args.blob.tick) return
		const entities = args.sys.query({puppet:true})
		entities.forEach( (entity) => {
			update_tick(entity,args)
		})
	}
}

const update_tick = (entity,args) => {
	if(!entity.puppet || !entity.volume || !entity.volume._node) return
	if(!entity.puppet._handler) {
		entity.puppet._handler = new Puppet(entity.volume._node)
		// @todo will eventually want a disposal mechanism for these dynamically created objects as well
	}
	entity.puppet._handler.update(args.blob.time,args.blob.delta)

	// a helpful flag for callers to avoid overwhelming the puppet
	if(!entity.puppet._handler.busy && entity.puppet.busy) {
		sys.resolve({ uuid:entity.uuid, puppet:{ busy: 0 } })
		console.log("puppet::perform clearing busy flag for",entity.uuid)
	}
}
