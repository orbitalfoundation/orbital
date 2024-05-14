
import { TalkingHeadArticulate } from '../TalkingHead/modules/talkinghead-articulate.mjs'

///
/// client side playback wrapper/shim for puppet face performances using talking head
///

export class Puppet {
	handler = null
	busy = 0
	constructor(node) {
		let div = node.parent.parentDiv
		this.handler = new TalkingHeadArticulate(div)
		this.handler.useAvatar(node)
		this.handler.camera = node.parent.camera
	}
	perform(perf) {
		const blob = perf.whisper || {}
		if(perf.audio) blob.audio = perf.audio
		this.handler.speakAudio(blob,"en")
	}
	update(time) {
		// perform animation over time
		const handler = this.handler
	    let dt = handler.animateTime(time)
	    if(dt) {
			const o = handler.animateBuildList()
			handler.animateSpeech(o)
			handler.animateBody(o)
	    }
		this.busy = handler.isSpeaking ? 1 : 0
	}
}

