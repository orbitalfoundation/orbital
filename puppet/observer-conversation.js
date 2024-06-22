
import { converse_queue, converse_fragment } from './server/converse.js'

///
/// Intercept player-to-player conversations and pass to npcs 
///

export const observer = {

	about: 'puppet observer conversation - server side',

	observer: async function (args) {

		// ignore tick for sanity
		if(args.blob.tick) return

		// intercept general player-to-player text conversations only
		if(!args.blob.conversation || !args.blob.conversation.text) return

		// pick entity
		let entity = findPartyToTalkTo(sys,args.blob.conversation.xyz)
		if(!entity || !entity.puppet) {
			console.warn("puppet::converse - nobody to talk to")
			return
		}

		// perform reasoning and get back a list of things to say
		const queue = await converse_queue(entity.puppet,args.blob.conversation.text)

		// pipe each thing to say through text to speech and then to the client
		for(let segment = 0;segment < queue.length;segment++) {

			const performance = await converse_fragment(entity.puppet,queue[segment])

			// set the target uuid on the performance - this is the npc that will speak
			performance.targetuuid = entity.uuid

			// send event to npc - note the uuid is set to null to force generate a new uuid; arguably however we may just want transient entities that don't pollute db @todo
			await args.sys.resolve({uuid:null,performance})

			// speculatively mark the puppet as busy to reduce inbound traffic; done here to avoid latency loop back
			await args.sys.resolve({uuid:entity.uuid,puppet:{busy:Date.now()}})

			// force mark the puppet as busy just to prevent a one frame gap where something could slip through
			entity.puppet.busy = true
		}

		// return face to neutral
		await args.sys.resolve({uuid:null,performance:{targetuuid:entity.uuid,emotion:'neutral'}})

	}
}

const findPartyToTalkTo = (sys,xyz) => {

	// query volatile local state for puppets
	const entities = sys.query({puppet:true})

	// randomize just to prevent any kind of order dependent biases in targeting
	entities.sort(() => Math.random() - 0.5)

	let best = null
	let distance = 9999999
	for(const entity of entities) {

		// can hold a conversation?
		if(!entity.puppet.reason) continue

		// busy?
		// @todo could look at how long it has been busy for as a way to avoid getting stuck in a busy state?
		else if(entity.puppet.busy) {
			console.warn("puppet::converse - puppet is too busy to talk",entity.uuid)
			continue
		}

		// distance?
		else if(entity.volume && entity.volume.transform && entity.volume.transform.xyz && xyz) {
			const xyz1 = entity.volume.transform.xyz
			let x = xyz1[0] - xyz[0]
			let y = xyz1[1] - xyz[1]
			let z = xyz1[2] - xyz[2]
			let d = x*x + y*y + z*z
			if( d > 10*10) continue
			if( d < distance ) {
				distance = d
				best = entity
			}
		} else {
			best = entity
			break
		}
	}

	return best
}


