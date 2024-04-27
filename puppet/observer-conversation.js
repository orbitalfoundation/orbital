
import { converse } from './converse.js'

///
/// Observe conversations and drive puppets from those interactions
/// Separated into two files, one that is a binding to orbital and one that is fairly modular / independent
///

export const observer = {

	about: 'puppet observer conversation - server side',

	observer: async (args) => {

		// ignore tick for sanity
		if(args.blob.tick) return

		// intercept general player-to-player text conversations only
		if(!args.blob.conversation || !args.blob.conversation.text) return

		// get puppets
		const entities = args.sys.query({puppet:true})

		// randomize them for fun
		entities.sort(() => Math.random() - 0.5)

		// find puppets to converse with
		for(const entity of entities) {

			// able to hold a conversation?
			if(!entity.puppet.reason) continue

			// not busy?
			if(entity.puppet.busy) continue

			// nearby?
			// TBD

			// handle the details of the conversation; also mark the puppet as too busy for further chatter atm
			converse({
				text: args.blob.conversation.text,
				reason: entity.puppet.reason,
				tts: entity.puppet.tts,
			},(blob,segment)=>{
				console.log("puppet::converse - callback",segment,entity.uuid,blob)
				sys.resolve({uuid:entity.uuid,performance:blob})
				sys.resolve({uuid:entity.uuid,puppet:{busy:true}})
				entity.puppet.busy = true // @todo hack force faster
			})

			// only send to one for now
			break
		}
	}
}

