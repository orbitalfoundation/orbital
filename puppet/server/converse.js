
import { reason_openai } from './reason-openai.js'
import { tts_openai } from './tts-openai.js'
import { tts_coqui } from './tts-coqui.js'
import { stt_whisper } from './stt-whisper.js'
import { lipsyncQueue, lipsyncGetProcessor } from '../talkinghead/modules/lipsync-queue.mjs'
import { mp3duration } from './mp3duration.js'

let conversationCounter = 10000

///
/// Given a pile of utter perform reasoning, speech to text, time stamp generation and call a callback with many fragments
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

export async function converse(utter,callback) {

	let text = `${utter.text}`

	console.log("puppet::converse got prompt",text)

	if(text.startsWith('/emote')) {
		const emotion = text.slice(6).trim()
		console.log("puppet::converse command detected - emotion=",emotion)
		callback({text,emotion})
		return
	}

	//
	// moderation and sanitization and sanity checks on user input
	// @todo
	//

	//
	// call a reasoning module if any; this could be a full blown llm or anything else
	// there may be rag systems, decision trees, pre-parsing, memoization of previous responses etc...
	// @todo at the moment an emotion can be returned in brackets - by preprompting - improve
	// @todo also return gestures such as [wave] or [point at x] or [dance] that are appropriate
	//

	if(utter.reason) {
		text = await reason_openai(utter.reason,text)
		if(!text) {
			text = 	"Having trouble responding due to network error"
		}
		console.log("puppet::converse got response",text)
	}

	// test code - extract an emotion from the last brackets as in [happy]
	// @todo remove this - later use emoji and ideally more emotions more often rather than just one

	let emotion = null
	{
		const mark1 = text.lastIndexOf('[')
		const mark2 = text.lastIndexOf(']')
		if(mark1 && mark1 < mark2) {
			emotion = text.substring(mark1+1,mark2)
			text = text.slice(0,mark1)
			console.log("puppet::converse emotion from text",text,emotion)
		}
	}

	//
	// build a queue of separate sentences from the input phrase
	// @note this is kind of overkill; it's nice to clean up the sentences but visemes are not always needed
	//

	await lipsyncGetProcessor("en")
	let queue = lipsyncQueue(text)

	//
	// pass each of the fragments through the tts and onwards to the playback as fast as possible
	//

	const conversation = conversationCounter++

	for(let segment = 0;segment < queue.length;segment++) {
		let blob = queue[segment]
		blob.segment = segment
		blob.segmentsTotal = queue.length
		blob.conversation = conversation
		blob.emotion = emotion
		blob.prompt = utter.text
		let sentence = !blob.text ? null : blob.text.map( term => { return term.word }).join(' ')
		if(sentence && sentence.length) {
			blob.text = blob.sentence = sentence
			//console.log("puppet::converse segment",sentence)
		} else {
			delete blob.sentence
		}

		await converse_fragment(utter,blob)
		callback(blob)
	}

	return true
}

async function converse_fragment(utter,blob) {

	const sentence = blob.sentence

	let bufferArray = null

	//
	// tts using openai?
	//

	if(sentence && sentence.length && utter.tts && utter.tts.provider == "openai") {
		blob.sentence = sentence
		bufferArray = await tts_openai(utter.tts,sentence)
		if(bufferArray) {

			// would love to have duration early but sadly the blob isn't mp3 as openai claims but is in fact "ADTS" - which wraps mp3 for streaming
			// blob.duration = mp3duration(bufferArray)

			// tediously convert to binary
			let binary = ''
			bufferArray.forEach(elem => { binary+= String.fromCharCode(elem) })

			// don't bother packaging this up as a playable file but rather let the client do that if it wishes
			// blob.audio = "data:audio/mp3;base64," + window.btoa( binary )

			// then convert to b64 encoded and stuff it into blob for external access
			blob.audio = window.btoa( binary )

		}
	}

	//
	// tts using coqui? (this approach generates phoneme timestamps for visemes)
	//

	else if(sentence && sentence.length && utter.tts && utter.tts.provider == "coqui") {
		blob.sentence = sentence
		const results = await tts_coqui(utter.tts,sentence)

		// stuff duration, audio and other facts into returned results
		Object.assign(blob,results)
	}

	//
	// stt using whisper? to get performance timing per word for visemes
	//

	if(utter.whisper && bufferArray) {
		blob.whisper = await stt_whisper(utter.tts,bufferArray)
	}
}


