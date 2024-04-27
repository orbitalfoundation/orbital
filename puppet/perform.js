
import { phonemesToVisemesAtTime, visemes_realusion } from './utils/text-visemes.js'

import { animMoods } from '../TalkingHead/modules/anim-moods.mjs'

import { audio_preload, audio_play } from './utils/audio-play.js'

const clamp = (num, a, b) => Math.max(Math.min(num, Math.max(a, b)), Math.min(a, b));

const lerp = (arr,i,target,rate,delta) => {
	if(arr[i] == target) return
	arr[i] += (target-arr[i])*rate
}

const rest = (parts,delta) => {
	parts.forEach(part=>{
		Object.entries(part.morphTargetDictionary).forEach(([k,v])=>{
			lerp(part.morphTargetInfluences,v,0,0.1,delta)
		})
	})
}

const BREAK_PAD = 100

///
/// resolve queue
///
/// this function is async, but will be called synchronously, it will resolve the queue on its own timeframe however
///

export async function perform(args) {

	// time
	const performance_now = performance.now() * 1000

	// get queue if exists
	const queue = args.queue

	// test: async promote audio blobs early since there are huge delays here
	// @todo probably want a totally different way of streaming audio
	if(queue) {
		queue.forEach(perf=>{
			if(perf.audio && !perf.audio_preload_started) {
				//console.log("audio preloading ",perf.sentence)
				perf.audio_preload_started = true
				const before = performance_now
				const success = (audio) => {
					const after = performance.now() * 1000
					const duration = audio.duration * 1000
					//console.log("audio preloader done: duration",duration,"compute time",(after-before),"sentence",perf.sentence)
					perf.duration = duration
					perf._audio = audio
					perf.audio_loaded = true
				}
				const fail = ()=> {
					perf.corrupt = true
				}
				audio_preload(perf,success,fail)
			}
		})
	}

	// look at current performance on stack
	let perf = queue && queue.length ? queue[0] : null

	// stopping a performance callback
	const done = () => {
		const performance_now = performance.now() * 1000
		console.log("puppet::perform done",performance_now,perf)
		if(queue) queue.shift()
		return
	}

	// corrupt performance?
	if(perf && perf.corrupt) {
		console.error("puppet::perform corrupt at time",perf,performance_now)
		done()
		perf = null
	}

	// a time delay packet?
	if(perf && perf.hasOwnProperty('break')) {
		const delay = perf.break || 100
		console.log("puppet::perform break at time",delay,performance_now)
		delete perf.break
		perf = null
		setTimeout(done,delay)
	}

	// start audio performance?
	if(perf && perf.audio) {
		if(!perf.audio_loaded) {
			console.warn("*** waiting for audio to load at time",perf.sentence,performance_now)
			// do not start the performance yet; do nothing
			perf = null
		} else if(!perf.duration) {
			//console.error("*** no audio duration",perf.sentence)
			done()
			perf = null
		} else {
			audio_play(perf,done)
			perf.starttime = performance_now
			delete perf.audio
			console.log("*** audio playing sentence,start,duration,now",perf.sentence,perf.starttime,perf.duration,performance_now)
		}
	}

	// apply visual effects - phonemes, emotions and animations if any
	const node = args.node
	const vrm = args.vrm
	const phonemes = perf ? perf.phonemes : null
	const emotion = perf ? perf.emotion : null
	const starttime = perf ? perf.starttime : 0
	const time = args.time
	const delta = args.delta

	// must have graphics
	if(!node) {
		return
	}

	// initialize parts once if any - tidy up later @todo
	if(!node.parts) {
		initMorphTargets(node)
	}

	// @todo revise
	// blink eyes if rpm or realusion model - @todo support vrm
	node.parts.forEach(part=>{
		const blink = clamp(Math.sin(time/1000) * 1000 - 1000 + 1,0,1)
		let target = part.morphTargetDictionary['eyeBlinkLeft']
		if(target < 0) return false
		part.morphTargetInfluences[target] = blink
		target = part.morphTargetDictionary['eyeBlinkRight']
		if(target < 0) return false
		part.morphTargetInfluences[target] = blink
	})

	// transition body animation?
	// if(node._speaking !== speaking) {
	//	node._speaking = speaking
	//	node.animation = speaking ? "*" : "Neutral"
	// }

	// perform emotion if any
	if(emotion) {
		const fields = animMoods[emotion.toLowerCase()]
		if(fields && fields.baseline) {
			node.parts.forEach(part=>{
				Object.entries(fields.baseline).forEach( ([k,v]) => {
					const target = part.morphTargetDictionary[k]
					if(!target) return
					//if(target) part.morphTargetInfluences[target]=v
					lerp(part.morphTargetInfluences,target,v,0.2,delta)
				})
			})
		}
	}

	// return if no visemes to generate
	if(!phonemes || !starttime || !duration) {
		rest(node.parts,delta)
		return false
	}

	//
	// vrm - do vrm visemes a different way
	//
	// VRM is actually gltf with some extensions
	// there is a javascript library that has its one morph target concept called a VRMExpression
	// Typically we are exporting from Realusion as FBX and then adding visemes in Blender and exporting VRM
	// We add extra visemes beyond the default to support the same shape targets as RPM for simplicity
	//

	if(vrm) {

		if(starttime + duration < time) {
			// @todo should have a relax strategy
			return false
		}

		const data = phonemesToVisemesAtTime(phonemes,time-starttime,duration)

		if(!data) {
			return false
		}

		for (let i = 0; i < data.length; i++) {
			vrm.expressionManager.setValue(visemes_realusion[i],data[i])
		}

		vrm.update(args.delta/1000.0)

		return true
	}

	//
	// else must be valid rpm?
	//

	if(!node.parts || !node.parts.length) {
		return false
	}

	// out of time? @todo have this relax rather than pop @todo also there's some chance this may not be invoked
	if(starttime + duration < time) {
		//console.log("puppet: stopping mouth because ",starttime,duration,time)
		rest(node.parts,delta)
		return false
	}

	// any data to render?
	const data = phonemesToVisemesAtTime(phonemes,time-starttime,duration,node.realusion ? true : false)
	if(!data) {
		return false
	}

	// apply performance
	node.parts.forEach(part=>{
		for (let i = 0; i < data.length; i++) {
			lerp(part.morphTargetInfluences,part.visemeIndex+i,data[i],1.0,delta)
		}
	})

	// success
	return true
}

function initMorphTargets(node) {

	const parts = node.parts = []

	const partnames = [

		// ready player me parts by convention
		'EyeLeft',
		'EyeRight',
		'Wolf3D_Head',
		'Wolf3D_Teeth',

		// realusion parts by convention
		'CC_Base_Eye',
		'CC_Base_Teeth',
		'CC_Game_Body',
		'CC_Game_Tongue',
		'RL_BoneRoot',
		'Hair',
		'Pants'
	]

	partnames.forEach(name => {
		let part = node.getObjectByName(name)
		if(!part) return
		part.visemeIndex = part.morphTargetDictionary['viseme_sil']
		if(part.visemeIndex >= 0) {
			//console.log("puppet init - found part",name,part)
			parts.push(part)
		} else {
			part.visemeIndex = part.morphTargetDictionary["EE"]
			if(part.visemeIndex >= 0) {
				node.realusion = part.realusion = true
				//console.log("puppet init - found part - reallusion",name,part)
				parts.push(part)
			}
		}
	})

	if(!parts.length) console.error("puppet init - didn't find any parts at all")

}

