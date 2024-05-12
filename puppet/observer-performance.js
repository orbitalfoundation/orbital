
const isServer = typeof window === 'undefined'

// Talking Heads - by Mika Suominen
import { TalkingHeadArticulate } from './TalkingHead/modules/talkinghead-articulate.mjs'

///
/// pass inbound performance requests onwards
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
			helper1(entity,args.blob.performance)
			break
		}
	}
}

const helper1 = (entity,perf) => {

	if(!entity.puppet || !entity.volume || !entity.volume._node) {
		console.error("puppet::perform target entity has no puppet or volume or is not ready",entity)
		return
	}

	let handler = entity.puppet._handler
	if(!handler) {
		let div = entity.volume._node.parent.parentDiv
		handler = entity.puppet._handler = new TalkingHeadArticulate(div)
		handler.useAvatar(entity.volume._node)
		handler.camera = entity.volume._node.parent.camera
		console.log(entity.volume._node)
	}

	const blob = perf.whisper || {}
	if(perf.audio) blob.audio = perf.audio
	handler.speakAudio(blob)
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
			helper2(entity,args)
		})
	}
}

const helper2 = (entity,args) => {

	// do nothing if no art
	if(!entity.volume._node) return

	let handler = entity.puppet._handler
	if(!handler) {
		let div = entity.volume._node.parent.parentDiv
		handler = entity.puppet._handler = new TalkingHeadArticulate(div)
		handler.useAvatar(entity.volume._node)
		handler.camera = entity.volume._node.parent.camera
		console.log(entity.volume._node)
	}

	// perform animation over time
    let dt = handler.animateTime(args.blob.time)
    if(dt) {
		const o = handler.animateBuildList()
		handler.animateSpeech(o)
		handler.animateBody(o)
    }

	// clear busy flag if done
	if(!handler.isSpeaking && entity.puppet.busy) {
		entity.puppet.busy = false
		sys.resolve({ uuid:entity.uuid, puppet:{ busy: false } })
		console.log("puppet::perform clearing busy flag for",entity.uuid)
	}
}

