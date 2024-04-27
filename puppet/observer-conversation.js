
import { converse } from './converse.js'

///
/// Observe conversations and drive puppets from those interactions
/// Separated into two files, one that is a binding to orbital and one that is fairly modular / independent
///

export const observer = {

	about: 'puppet observer conversation - server side',

	observer: async (args) => {

		// sanity check
		if(!args || !args.blob || !args.sys || args.blob.tick) return

		// intercept general player-to-player text conversations
		if(!args.blob.conversation || !args.blob.conversation.text) return

		// any reasoning puppets in range? @todo improve
		const entities = args.sys.query({puppet:true})
		let entity = null
		entities.forEach(candidate=>{
			entity = candidate.puppet.reason ? candidate : null
		})
		if(!entity) return

		// allow an application independent module to handle the details of the conversation
		converse({
			text:args.blob.conversation.text,
			reason: entity.puppet.reason,
			tts: entity.puppet.tts,
		},(blob)=>{
			sys.resolve({ uuid:entity.uuid,performance:blob})			
		})
	}
}

