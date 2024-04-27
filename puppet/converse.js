
import { log,warn,error } from './utils/log.js'

import { reason_openai } from './utils/reason-openai.js'
import { tts_openai } from './utils/tts-openai.js'
import { tts_coqui } from './utils/tts-coqui.js'
import { stt_whisper } from './utils/stt-whisper.js'
import { lipsyncQueue, lipsyncGetProcessor } from '../TalkingHead/modules/lipsync-queue.mjs'

let conversationCounter = 10000

lipsyncGetProcessor("en")

///
/// Handle a conversation consisting of a prompt and an answer, possibly broken into fragments.
///
/// Goals:
///
///		- this source file is intended to be modular/reusable and independent of any specific larger project or framing
///
///		- given a prompt, build out speech and visemes for a puppet to playback in 3d
///
///		- may need to do aggressive throttling and even throw away input if the avatar is still speaking
///		- may need to moderate prompts
///		- may call a reasoning engine if desired
///		- may call tts
///		- may even call an stt to get word timing
///		- may generates phonemes / visemes and whatnot
///

export async function converse(args,callback) {

	let text = `${args.text}`

	log("puppet::converse got prompt",text)

	//
	// i'm finding that it is easy to saturate the puppet with requests... this needs to be fixed
	// need to reduce traffic by throwing away interactions if there are too many
	// arguably could squelch traffic here - if already responding to a conversation just ignore this one
	// or have some kind of feedback for when it is ready to engage more?
	//

	{
		// @todo
	}

	//
	// moderation and sanitization and sanity checks on user input
	//

	{
		// @todo
	}

	//
	// call a reasoning module if any; this could be a full blown llm or anything else
	// there may be rag systems, decision trees, pre-parsing, memoization of previous responses etc...
	//

	if(args.reason) {
		text = await reason_openai(args.reason,text)
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
			log("puppet::converse emotion",emotion)
		}
	}

	//
	// build a series of lipsync 'performances' split on sentences
	// @todo this does a bit too much work since other phoneme systems may be used; leave for now
	//		i'd prefer to break this into two separate routines; a sentence splitter and a viseme builder per frag
	//

	const queue = lipsyncQueue(text)

	//
	// rebuild all sentences because the words are buried inside of separate tokens but tts wants to say a string
	// @todo this is a bit messy - it should be done inside the queue generation above
	//

	for(let segment = 0;segment < queue.length;segment++) {
		const blob = queue[segment]
		const sentence = !blob.text ? null : blob.text.map( term => { return term.word }).join(' ')
		if(sentence && sentence.length) {
			blob.sentence = sentence
			console.log("puppet::converse segment",sentence)
		}
	}

	//
	// for each sentence pass to tts
	// tts is slow - so strategy here is to break up the tts generation into fragments and ship each one
	// the player will start voicing the first sentence and the rest will pile up; lowering perceived latency
	// note the subroutine appends state to the performance
	//

	for(let segment = 0;segment < queue.length;segment++) {
		const blob = queue[segment]
		await converse_fragment(args,blob)
	}

	//
	// pass all fragments to callback
	//

	for(let segment = 0;segment < queue.length;segment++) {
		const blob = queue[segment]
		blob.conversation = conversationCounter++
		blob.segment = segment
		blob.emotion = emotion
		blob.prompt = args.text
		callback(blob)
	}

}

async function converse_fragment(args,blob) {

	const sentence = blob.sentence

	let bufferArray = null

	//
	// tts using openai?
	//

	if(sentence && sentence.length && args.tts && args.tts.provider == "openai") {
		blob.sentence = sentence
		bufferArray = await tts_openai(args.tts,sentence)
		if(bufferArray) {
			var binary = ''
			bufferArray.forEach(elem => { binary+= String.fromCharCode(elem) })
			blob.audio = "data:audio/mp3;base64," + window.btoa( binary )
			// @todo this is not matching an mp3 but it would be very very helpful to know the duration - try fix
			//blob.duration = getmp3duration(bufferArray)
			console.log("puppet::converse tts success fragment",sentence)
		}
	}

	//
	// tts using coqui?
	//

	else if(sentence && sentence.length && args.tts && args.tts.provider == "coqui") {
		blob.sentence = sentence
		const results = await tts_coqui(args.tts,sentence)
		Object.assign(blob,results)
	}

	//
	// stt using whisper? - may enhance performance with whisper timing
	//

	if(args.whisper && bufferArray) {
		blob.whisper = await stt_whisper(args.tts,bufferArray)
		console.log("puppet::converse whisper success fragment",sentence)
	}
}


