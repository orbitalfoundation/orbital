
import { converse } from './server/converse.js'

///
/// Intercept player-to-player conversations
///

export const observer = {

	about: 'puppet observer conversation - server side',

	observer: async (args) => {

		// ignore tick for sanity
		if(args.blob.tick) return

		// intercept general player-to-player text conversations only
		if(!args.blob.conversation || !args.blob.conversation.text) return

		// query for puppets
		const entities = args.sys.query({puppet:true})

		// randomize just to prevent any kind of order dependent biases in targeting
		entities.sort(() => Math.random() - 0.5)

		// find puppets to converse with
		for(const entity of entities) {

			// filter by able to hold a conversation?
			if(!entity.puppet.reason) continue

			// spatially nearby?
			if(entity.volume && entity.volume.transform && entity.volume.transform.xyz && args.blob.conversation.xyz) {
				const xyz1 = entity.volume.transform.xyz
				const xyz2 = args.blob.conversation.xyz
				let x = xyz1[0] - xyz2[0]
				let y = xyz1[1] - xyz2[1]
				let z = xyz1[2] - xyz2[2]
				if( x*x + y*y + z*z > 3*3) {
					console.warn("puppet::converse - participants are are too far apart to chat")
					return false
				}
			}

			// busy?
			if(entity.puppet.busy) {
				console.warn("puppet::converse - puppet is too busy to talk",entity.uuid)
				return
			}

			// uuid
			let targetuuid = entity.uuid

			// build utterance that will be passed to the lower level conversation handler
			const utter = {
				// the props for how to shape the performance
				... entity.puppet,
				// what to say
				text: args.blob.conversation.text,
			}

			let helper = (performance)=>{
				// set the target uuid on the performance - i prefer to have performances be fresh entities
				performance.targetuuid = targetuuid
				// the text to speech is returned in many small fragments - send each one as a fresh new entity
				sys.resolve({uuid:null,performance})
				// also mark as busy at time - we needed some way to throttle the puppet and this seems reasonable
				sys.resolve({uuid:targetuuid,puppet:{busy:Date.now()}})
				entity.puppet.busy = true
				// @todo i need some kind of mechanic to time out performance objects from the database or delete them
			}

			// have a more application neutral converse() method perform the text to speech (or reject)
			let success = converse(utter,helper)

			// if the puppet responded it probably makes sense to stop also sending the message to other puppets
			if(success) break
		}
	}
}

