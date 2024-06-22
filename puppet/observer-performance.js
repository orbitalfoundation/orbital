
const isServer = typeof window === 'undefined'

import { Puppet } from './client/puppet-talkinghead.js'

///
/// observe performance requests
/// bind new puppet if needed
/// do performance
///
/// @todo detect entity deletion and dispose Puppet
///

export const puppet_client_side_performance_observer = {
	about: 'puppet observer - client side',
	observer: (args) => {
		if(isServer) return
		if(args.blob.tick) return
		if(!args.blob.performance) return
		const entities = args.sys.query({uuid:args.blob.performance.targetuuid})
		if(!entities || entities.length != 1) {
			console.error("puppet performance - entity query problem",args,entities)
			return
		}
		const handler = handler_bind(entities[0])
		if(!handler)return
		handler.perform(args.blob.performance)
	}
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
			const handler = handler_bind(entity)
			if(!handler) return
			handler.update(args.blob.time,args.blob.delta)
			handler_busy_flag(args.sys,entity,handler)
		})
	}
}

//
// associate a handler (that does the actual work) with the entity
//

const handler_bind = (entity) => {
	if(!entity.puppet || !entity.volume || !entity.volume._node) {
		console.error("puppet performance - invalid target entity",entity)
		return null
	}
	if(!entity.puppet._handler) {
		const div =  null // entity.volume._node.parent.parentDiv || null
		const camera = entity.volume._camera || null		
		const armature = entity.volume._node._vrm ? entity.volume._node._vrm : entity.volume._node
		entity.puppet._handler = new Puppet(armature,camera,div)

		// play a starting animation if desired
		if(entity.puppet.animation) {
			entity.puppet._handler.playAnimation(entity.puppet.animation.url,null,999999999,0,0.01)
		}
	}
	return entity.puppet._handler
}

//
// convenience concept; sync busy state up to network
// (in this way the server can avoid thrashing the client with more traffic)
//

const handler_busy_flag = (sys,entity,handler) => {
	if(!handler.busy && entity.puppet.busy) {
		sys.resolve({ uuid:entity.uuid, puppet:{ busy: 0 } })
		console.log("puppet::perform clearing busy flag for",entity.uuid)
	}
}
