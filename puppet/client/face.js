
import { animMoods } from '../talkinghead/modules/anim-moods.mjs'
import { lipsyncConvert } from '../talkinghead/modules/lipsync-queue.mjs'

export class Face {

	parts = []

	targets = {}
	dirty = {}
	dictionary = {}

	sequence = []
	relaxation = 0

	constructor(node) {
		this.node = node
		this._setNodeParts(node)
		this._emote("sad")
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
				item.ts[2] += time + 150
				this.relaxation = Math.max(this.relaxation,item.ts[1])
			}
		}
	}

	///
	/// update face over time
	///

	update(time,delta,busy) {

		time = performance.now() // use this since above routine does not get 'time'

		// always blink
		this._blink(time,delta)

		// are we due for relaxation?
		if(this.relaxation < time ) {
			if(this.relaxation + 2000 > time ) {
				console.log("relaxing",this.relaxation)
				this._finalize(time,delta,0.9)
			}
			return
		}

		// apply performance over time
		this._animate(time,delta)

		// apply performance to 3js avatar / puppet
		this._finalize(time,delta,1.0)
	}

	//
	// blink both eyes every so often
	//

	_blink(time,delta) {
		const clamp = (num, a, b) => Math.max(Math.min(num, Math.max(a, b)), Math.min(a, b));
		const v = clamp(Math.sin(time/1000) * 1000 - 1000 + 1,0,1)
		this.targets.eyeBlinkLeft = v
		this.targets.eyeBlinkRight = v
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
	// emotion - remove this code
	// @todo could play entire performance rather than just one frame of it
	//

	_emote(emotion) {
		const fields = animMoods[emotion]
		if(!fields || !fields.baseline) return
		Object.entries(fields.baseline).forEach(([k,v]) => {
			this.targets[k] = v
		})
		// hold face for a second at least
		this.relaxation = Math.max( this.relaxation, performance.now() + 1000 )
	}

	//
	// given a large collection of targets, apply those that are in the right time window
	//
	// @todo we throw away the supplied time because the performance init doesn't have it
	// @note i go out of my way to set the unused visemes to zero
	// @note i have fiddled with the attack and release to get something that feels ok
	//

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

	_animate(time,delta) {
		const attack = 50
		const release = 60
		time = performance.now()
		const visemes = this.visemes

		// a viseme decay strategy - debate if we need a separate table
		Object.entries(visemes).forEach( ([k,v]) => {
			visemes[k] = v > 0.01 ? v * 0.85 : 0
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
			this.targets[k] = v
		})
	}

	//
	// apply targets
	//

	_finalize(time,delta,amplify=1.0) {

		Object.entries(this.targets).forEach(([k,v])=>{

			// linear global fader - useful for returning to a neutral pose gracefully
			if(amplify != 1.0) {
				v = this.targets[k] = v*amplify
			}

			// touch only dirty targets
			if(v != this.dirty[k]) {
				this.dirty[k]=v
				this._setTarget(k,v)
			}

		})

		if(this.node._vrm) {
			this.node._vrm.update(delta/1000)
		}

	}

	//
	// write to a target - morph targets for now
	//
	// @todo
	//	- abstract eye and mouth
	//	- handle writing to other things like the pose not just the morph targets
	//  - i could shorten viseme_sil to just sil
	//  - then also support the richer animation playback scheme in talkingheads
	//

	_setTarget(target1,degree) {

		// vrm support - based off of reallusion naming - but uses its own scheme distinct from 3js
		if(this.node._vrm) {
			const target = retargeting[target1]
			if(target === undefined) return
			if(Array.isArray(target)) {
				target.forEach(t2=>{
					const t3 = retargeting[t2]
					if(t3 === undefined) return
					this.node._vrm.expressionManager.setValue(t3,degree)
				})
			} else {
				this.node._vrm.expressionManager.setValue(target,degree)				
			}
			return
		}

		// rpm and reallusion both rely on the 3js traditional morph target pipeline
		const index = this.dictionary[target]
		if(index === undefined) return
		this.parts.forEach(part=>{
			if(Array.isArray(index)) {
				index.forEach(i2=>{
					part.morphTargetInfluences[i2] = degree
				})
			} else {
				part.morphTargetInfluences[index] = degree
			}
		})

	}

	//
	// setup node parts and targets
	//
	// look for rpm or reallusion rig parts that have morph targets
	// remember all those parts because we will want to write to their morph targets
	// also scavenge all of the individual english -> numeric bindings into our own dictionary
	//
	// this choreography system uses rpm part names, but may have to write to reallusion targets in some cases
	// in this case rewrite all of the rpm targets to the dictionary but use reallusion target values
	//

	_setNodeParts(node) {

		console.log("******* npc puppet scanning node",node)

		// reset

		const parts = this.parts = []
		this.targets = {}
		this.dirty = {}
		const dictionary = this.dictionary = {}
		this.sequence = []
		this.relaxation = 0

		// vrm doesn't use a dictionary
		if(node._vrm) {
			return
		}

		// accumulate parts with desired morph targets

		node.traverse((part) => {
			if(!part.morphTargetDictionary) return
			if(part.morphTargetDictionary['viseme_sil'] !== undefined) {
				console.log("npc puppet found is rpm",part.name)
				parts.push(part)
			}
			if(part.morphTargetDictionary["EE"] !== undefined) {
				console.log("npc puppet found is reallusion",part.name)
				node.reallusion = part.reallusion = true
				parts.push(part)				
			}
		})

		// build dictionary of names from english to indexes

		parts.forEach(part => {
			if(!node.reallusion) {
				Object.entries(part.morphTargetDictionary).forEach( ([k,v]) => {
					console.log("npc puppet scavenged rpm morph target",k,v)
					dictionary[k]=v
				})
			}
			else {
				Object.entries(part.morphTargetDictionary).forEach( ([k,v]) => {
					console.log("npc puppet scavenged reallusion morph target",k,v)
					dictionary[k]=v
				})
				Object.entries(retargeting).forEach( ([k,v]) => {
					const t = dictionary[v]
					if(t !== undefined) {
						dictionary[k] = t
						console.log("npc puppet retargeted realusion (realusion,rpm,index)=",v,k,t)
					}
				})
			}
		})

		// dictionary supports a concept of multiple targets - but they need to be turned into indexes

		Object.entries(dictionary).forEach( ([k,v]) => {
			if(Array.isArray(v)) {
				const rewritten = []
				v.forEach(item => {
					const v2 = dictionary[v]
					if(Array.isArray(v2) || v2 === undefined) return
					rewritten.push( dictionary[v] )
				})
				dictionary[k] = rewritten
			}
		})

	}

}

const targets_reallusion = {
	"None" : 0,
	"B_M_P" : 1,
	"F_V" : 2,
	"TH" : 3,
	"T_L_D_N" : 4,
	"K_G_H_NG" : 5,
	"Ch_J" : 6,
	"S_Z" : 7,
	"T_L_D_N" : 8,
	"R" : 9,
	"Ah" : 10,
	"EE" : 11,
	"IH" : 12,
	"Oh" : 13,
	"W_OO" : 14,
}


//
// retargeting rpm to reallusion
//

const retargeting = {

	//viseme_sil: undefined
	viseme_PP: 'B_M_P',
	viseme_FF: 'F_V',
	viseme_TH: 'TH',
	viseme_DD: 'T_L_D_N',
	viseme_kk: 'K_G_H_NG',
	viseme_CH: 'Ch_J',
	viseme_SS: 'S_Z',
	viseme_nn: 'T_L_D_N',
	viseme_RR: 'R',
	viseme_aa: 'Ah',
	viseme_E: 'EE',
	viseme_I: 'IH',
	viseme_O: 'Oh',
	viseme_U: 'W_OO',

	// undefined:AE
	// undefined:Er

	browDownLeft:'Brow_Drop_Left',
	browDownRight:'Brow_Drop_Right',
	browInnerUp: [ 'Brow_Raise_Inner_Left', 'Brow_Raise_Inner_Right' ],
	browOuterUpLeft:'Brow_Raise_Outer_Left',
	browOuterUpRight:'Brow_Raise_Outer_Right',

	// : 'Brow_Raise_Left',
	// : 'Brow_Raise_Right',

	cheekPuff: [ 'Cheek_Blow_L', 'Cheek_Blow_R' ],
	cheekSquintLeft:'Cheek_Raise_L',
	cheekSquintRight:'Cheek_Raise_R',

	// : Cheeks_Suck,

	eyeBlinkLeft:'Eye_Blink_L',
	eyeBlinkRight:'Eye_Blink_R',
	eyeSquintLeft:'Eye_Squint_L',
	eyeSquintRight:'Eye_Squint_R',
	eyeWideLeft:'Eye_Wide_L',
	eyeWideRight:'Eye_Wide_R',

	//eyeLookDownLeft: undefined,
	//eyeLookDownRight: undefined,
	//eyeLookInLeft: undefined,
	//eyeLookInRight: undefined,
	//eyeLookOutLeft: undefined,
	//eyeLookOutRight: undefined,
	//eyeLookUpLeft: undefined,
	//eyeLookUpRight: undefined,

	// : 'Eyes_Blink',

	// eyesClosed: undefined,
	// eyesLookUp: undefined,
	// eyesLookDown: undefined,

	eyesLookDown: [ 'eyeLookDownLeft', 'eyeLookDownRight' ], // convenience concept
	eyesLookUp: [ 'eyeLookUpLeft', 'eyeLookUpRight' ], // convenience concept

	//jawForward:undefined,
	//jawLeft:undefined,
	//jawOpen:undefined,
	//jawRight:undefined,

	// mouthClose: undefined,

	// : Mouth_Blow
	// : Mouth_Bottom_Lip_Bite
	// : Mouth_Bottom_Lip_Down
	// : Mouth_Bottom_Lip_Trans
	mouthRollLower:'Mouth_Bottom_Lip_Under',
	mouthDimpleLeft:'Mouth_Dimple_L',
	mouthDimpleRight:'Mouth_Dimple_R',
	// : Mouth_Down
	mouthFrownLeft:'Mouth_Frown_L',
	mouthFrownRight:'Mouth_Frown_R',
	mouthLeft: 'Mouth_L',
	// : Mouth_Lips_Jaw_Adjust
	// : Mouth_Lips_Open
	// : Mouth_Lips_Part
	// : Mouth_Lips_Tight
	// : Mouth_Lips_Tuck
	mouthOpen:'Mouth_Open',
	//Mouth_Plosive
	mouthPucker:'Mouth_Pucker',
	mouthFunnel:'Mouth_Pucker_Open',
	mouthRight: 'Mouth_R',
	// : Mouth_Skewer

	// mouthSmile:'Mouth_Smile',
	mouthSmile: [ 'mouthSmileLeft', 'mouthSmileRight' ], // works for both rpm and reallusion

	mouthSmileLeft:'Mouth_Smile_L',
	mouthSmileRight:'Mouth_Smile_R',
	// : Mouth_Snarl_Lower_L
	// : Mouth_Snarl_Lower_R
	// : Mouth_Snarl_Upper_L
	// : Mouth_Snarl_Upper_R
	mouthRollUpper:'Mouth_Top_Lip_Under',
	// : 'Mouth_Top_Lip_Up'
	//Mouth_Up
	//Mouth_Widen
	mouthStretchLeft: 'Mouth_Widen_Sides',
	mouthStretchRight: 'Mouth_Widen_Sides',

	// mouthShrugLower :
	// mouthShrugUpper :
	// mouthPressLeft :
	// mouthPressRight :
	// mouthLowerDownLeft :
	// mouthLowerDownRight :
	// mouthUpperUpLeft :
	// mouthUpperUpRight :


	noseSneerLeft: 'Nose_Flank_Raise_L',
	noseSneerRight: 'Nose_Flank_Raise_R',
	// undefined:'Nose_Flanks_Raise',
	// undefined:'Nose_Nostrils_Flare',
	// undefined:'Nose_Scrunch',

	// tongueOut: undefined,

	// handFistLeft, handFistRight ...
}





