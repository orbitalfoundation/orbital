
import { reason_llm } from './reason-llm.js'
import { tts_openai } from './tts-openai.js'
import { tts_coqui } from './tts-coqui.js'
import { stt_whisper } from './stt-whisper.js'
import { lipsyncQueue, lipsyncGetProcessor } from '../talkinghead/modules/lipsync-queue.mjs'
//import { mp3duration } from './mp3duration.js'

let conversationCounter = 10000

const isServer = typeof window === 'undefined'

///
/// Do reasoning, speech to text, time stamp generation and call a callback with many fragments
///
/// Done as a separate file to make it independent and modular so can be used in other projects
///
/// Goals:
///
///		- this source file is intended to be modular/reusable and independent of any specific larger project or framing
///		- given a prompt, build out speech and visemes for a puppet to playback in 3d
///		- may do spatial proximity detection of speaker
///		- may detect if this puppet is busy
///		- may need to moderate prompts
///		- may call a reasoning engine if desired
///		- may call tts
///		- may even call an stt to get word timing
///		- may generates phonemes / visemes and whatnot
///
/// Can return true if it is likely to succeed - this can help reduce which entities receive traffic
///

export async function converse_queue(scope,prompt) {

	if(!scope.conversationCounter) {
		scope.conversationCurrent = 10000
		scope.conversationCounter = 10000
		scope.conversationSegment = 0
		scope.conversationSegments = 0
	} else {
		scope.conversationCounter++
	}

	console.log("puppet::converse got prompt",prompt)

	let emotion = null
	let text = null

	// developer support - test emotions
	if(prompt.startsWith('/emote')) {
		let tokens = prompt.split(' ')
		tokens.shift()
		emotion = tokens.shift()
		if(emotion && emotion.length) {
			text = tokens.join(' ') + `[${emotion}]`
		} else {
			text = "No emotion specified"
			emotion = "sad"
		}
	}

	// developer support skip reasoning and just say something on demand
	else if(prompt.startsWith('/say')) {
		text = prompt.slice(4).trim()
	}

	// reason
	else if(scope.reason) {
		text = await reason_llm(scope.reason,prompt)
		if(!text) {
			text = 	"Having trouble responding due to network error"
		}
		console.log("puppet::converse got response",text)
	} else {
		text = "This npc has no reasoning ability"
	}

	// simple emotion support hack - later support more granular emotions and emoji @todo
	if(!emotion) {
		const mark1 = text.lastIndexOf('[')
		const mark2 = text.lastIndexOf(']')
		if(mark1 && mark1 < mark2) {
			emotion = text.substring(mark1+1,mark2)
			text = text.slice(0,mark1)
		}
	}

	if(!text || !text.length) {
		console.error("npc has nothing to say")
		return []
	}

	//
	// build a queue of separate sentences from the input phrase
	// @note this is kind of overkill; it's nice to clean up the sentences but visemes are not always needed yet
	//

	await lipsyncGetProcessor("en")
	let queue = lipsyncQueue(text)
	queue.forEach(item => {
		if(item.text) {
			if(emotion && emotion.length) item.emotion = emotion
			item.prompt = prompt
		}
	})
	scope.conversationSegments = queue.length

	// return queue
	return queue
}

export async function converse_fragment(scope,blob) {

	blob.conversation = scope.conversationCounter
	blob.segment = scope.conversationSegment++
	blob.segmentsTotal = scope.conversationSegments

	// clean up text a bit if any
	let sentence = !blob.text ? null : blob.text.map( term => { return term.word }).join(' ')
	if(sentence && sentence.length) {
		blob.sentence = blob.text = sentence
	} else {
		delete blob.sentence
	}


	const text = blob.text && blob.text.length ? blob.text : null
	let buffer = null

	//
	// tts using openai?
	//

	if(text && scope.tts && scope.tts.provider == "openai") {
		buffer = await tts_openai(scope.tts,blob.text)
		if(!buffer) {
			console.error("npc: failed to talk to tts")
			delete blob.audio
			return
		}

		if(isServer) {
			const binary = Buffer.from(buffer).toString('binary');
			blob.audio = Buffer.from(binary, 'binary').toString('base64');
		} else {
			const uint8buf = new Uint8Array(buffer)
			const arrayu8 = Array.from(uint8buf)
			let binaryu8 = ''; arrayu8.forEach(elem => { binaryu8+= String.fromCharCode(elem) })
			//const binaryu8 = String.fromCharCode.apply(null,arrayu8) // this is blowing the stack
			// don't bother packaging this up as a playable file but rather let the client do that if desired
			// blob.audio = "data:audio/mp3;base64," + window.btoa( binary )
			blob.audio = window.btoa(binaryu8)
		}
	}

	//
	// tts using coqui? (this approach generates phoneme timestamps for visemes)
	//

	else if(text && scope.tts && scope.tts.provider == "coqui") {
		const results = await tts_coqui(scope.tts,text)
		Object.assign(blob,results)
	}

	//
	// stt using whisper? to get performance timing per word for visemes
	//

	if(scope.whisper && buffer) {
		blob.whisper = await stt_whisper(scope.whisper,buffer)
	}

	return blob
}


