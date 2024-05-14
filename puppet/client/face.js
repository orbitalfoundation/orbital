
import { nodeAddVisemeHelpers } from './node.js'
import { animMoods } from '../talkinghead/modules/anim-moods.mjs'
import { lipsyncConvert } from '../talkinghead/modules/lipsync-queue.mjs'

let max = (a,b) => { return a > b ? a : b }

export class Face {

	morphs = {}

	sequence = []
	relaxation = 0

	constructor(node) {
		this.node = node
		nodeAddVisemeHelpers(node)
		this._emote("angry")
	}

	///
	/// start a new performance
	///

	perform(perf) {
		if(perf.emotion) {
			this._emote(perf.emotion.toLowerCase())
		}
		if(perf.whisper) {
			const o = lipsyncConvert(perf.whisper,"en")
			this.sequence = o.anim || []
			const time = performance.now() // use this since this routine does not get 'time'
			for(const item of this.sequence) {
				item.ts[0] += time + 150 // compensate for the data bias coming in (out of our control)
				item.ts[1] += time + 150
				this.relaxation = max(this.relaxation,item.ts[1])
			}
		}
	}

	///
	/// update face over time
	///

	update(time,delta,busy) {


		time = performance.now() // use this since above routine does not get 'time'

		// always blink
		this._blink(time)

		// are we due for relaxation?
		if(this.relaxation < time ) {
			if(this.relaxation + 2000 > time ) {
				console.log("relaxing",this.relaxation)
				this._finalize(0.90)
			}
			return
		}

		// update facial performance while speaking
		this._animate(time,delta)
		this._finalize()
	}

	//
	// blink both eyes every so often
	//

	_blink(time) {
		const clamp = (num, a, b) => Math.max(Math.min(num, Math.max(a, b)), Math.min(a, b));
		const v = clamp(Math.sin(time/1000) * 1000 - 1000 + 1,0,1)
		this.morphs.eyeBlinkLeft = v
		this.morphs.eyeBlinkRight = v
	}

	/*
    // Randomize facial expression
    if ( this.viewName !== 'full' ) {
      const randomizedMs = this.randomized[ Math.floor( Math.random() * this.randomized.length ) ];
      const v = this.getValue(randomizedMs);
      const vb = this.getBaselineValue(randomizedMs);
      if ( v === vb ) {
        const randomizedV = (this.mood.baseline[randomizedMs] || 0) + Math.random()/5;
        this.setBaselineValue(randomizedMs, randomizedV);
      }
    }
    this.randomized = [
      'mouthDippleLeft','mouthDippleRight', 'mouthLeft', 'mouthPress',
      'mouthStretchLeft', 'mouthStretchRight', 'mouthShrugLower',
      'mouthShrugUpper', 'noseSneerLeft', 'noseSneerRight', 'mouthRollLower',
      'mouthRollUpper', 'browDownLeft', 'browDownRight', 'browOuterUpLeft',
      'browOuterUpRight', 'cheekPuff', 'cheekSquintLeft', 'cheekSquintRight'
    ];
    */

	//
	// move towards emotion at a rate
	//

	_emote(emotion) {
		const fields = animMoods[emotion]
		if(!fields || !fields.baseline) return
		Object.entries(fields.baseline).forEach(([k,v]) => {
			this.morphs[k] = [v,0.1]
		})
		// hold face for a second at least
		this.relaxation = max( this.relaxation, performance.now() + 1000 )
	}

	//
	// fairly rapidly seek towards target visemes that should be on face at a time
	// @todo we throw away the supplied time because the performance init doesn't have it
	// @note i go out of my way to set the unused visemes to zero
	// @note i have fiddled with the attack and release to get something that feels ok
	//

	_animate(time,delta) {
		const attack = 50
		const release = 60
		time = performance.now()
		let visemes = this.visemes

		// a viseme decay strategy - testing
		Object.entries(visemes).forEach( ([k,v]) => {
			visemes[k] = v * 0.85
		})

		// for the current moment in time - set morph targets
		for(const item of this.sequence) {
			const begins = item.ts[0]
			const ends = item.ts[1]
			if(begins > time || ends < time) continue
			Object.entries(item.vs).forEach( ([k,v]) =>{
				v = v[1]
				if((time - begins) < attack) v *= Math.pow((time-begins)/attack,3)
				// turned off - trying the above
				//if((ends - time) < release) v *= Math.pow((release-(ends-time))/release,3)
				visemes[k] = v
			})
		}

		// copy over for finalization
		Object.entries(visemes).forEach( ([k,v]) => {
			this.morphs[k] = v
		})
	}

	//
	// apply morphs to real targets - also handle relaxation
	//

	_finalize(amplify=0) {
		Object.entries(this.morphs).forEach(([k,v])=>{
			if(Array.isArray(v)) {
				const p = this.node.getMorphTarget(k)
				if(p === undefined) return
				const r = v[1]
				v = v[0]
				v = p + (v-p)*r
				this.node.setMorphTargets(k,v)
				if(amplify) this.morphs[k]=v*amplify
			} else {
				this.node.setMorphTargets(k,v)
				if(amplify) this.morphs[k]=v*amplify
			}
		})
	}

	visemes = {
		'viseme_PP': 0,
		'viseme_FF': 0,
		'viseme_TH': 0,
		'viseme_DD': 0,
		'viseme_kk': 0,
		'viseme_CH': 0,
		'viseme_SS': 0,
		'viseme_nn': 0,
		'viseme_RR': 0,
		'viseme_aa': 0,
		'viseme_E': 0,
		'viseme_I': 0,
		'viseme_O': 0,
		'viseme_U': 0,
	}

}
