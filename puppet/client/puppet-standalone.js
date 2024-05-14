
import { Audio } from './audio.js'
import { Face } from './face.js'

const BREAK_DURATION = 100

///
/// a standalone client side playback handler for puppet face performances
///

export class Puppet {

	face = null
	audio = null
	queue = []
	busy = 0

	constructor(node) {
		this.advance = this.advance.bind(this)
		this.audio = new Audio()
		this.face = new Face(node)
	}

	perform(perf) {
		this.queue.push(perf)
		if(!this.busy) this.advance()
	}

	async advance() {

		if(!this.queue.length) {
			this.busy = 0
			return
		}

		this.busy = Date.now()
		const perf = this.queue.shift()

		// time delay?
		if(perf.hasOwnProperty('break')) {
			setTimeout(this.advance,perf.break || BREAK_DURATION )
			return
		}

		// play performance that has audio?
		if(perf.audio || perf.emotion) {
			try {
				if(perf.audio) {
					await this.audio.playAudioBuffer(perf.audio,BREAK_DURATION,this.advance)
					this.face.perform(perf)
				} else {
					this.face.perform(perf)
					this.advance()
				}
			} catch(err) {
				console.error("puppet::perform audio error",err)
				this.advance()
			}
			return
		}
	}

	update(time,delta) {
		this.face.update(time,delta,this.busy)
	}
}

