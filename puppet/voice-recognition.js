
const isServer = typeof window === 'undefined'

///
/// start or restart audio recognizer (invoked from controls above)
/// mount this globally because it needs to be able to be start/stopped
///

let recognition = null
let recognition_started = false


export const voice_recognizer = (state) => {

	if(isServer) return

	try {
		if(!recognition) {
			recognition = new webkitSpeechRecognition()
			recognition.continuous = true
			recognition.interimResults = true
			recognition.onresult = function(event) {
				for (var i = event.resultIndex; i < event.results.length; ++i) {
					const transcript = event.results[i][0].transcript
					if (event.results[i].isFinal) {
						//console.log('speech to text final: ' + transcript);
						window.sys.resolve({
							// @todo supply a uuid of whom this is refering to - the sponsor basically
							conversation:{
								sponsor:null,
								text:transcript
							}
						})
						// @todo write to the local chat also
					} else {
						//console.log('chat widget: speech to text interim: ' + transcript);
					}
				}
			}
		}

		if(state) {
			recognition.start()
		} else {
			recognition.stop()
		}
	} catch(err) {
		console.log('chat widget: speech to text error: ' + err)
	}

}

//
// hack - we need to stop detecting voice input while we are playing any audio
//

let recognizer_released = 0
let recognizer_timer = 0

export const recognizer_suspend = (duration=1000) => {

	if(isServer) return

	// if our request is entirely within the current suspension just return
	const time = performance.now() * 1000
	if(recognizer_timer && recognizer_released >= time + duration) {
		console.log("recognizer: doing nothing")
		return
	}

	// if there is no current suspension then stop the recognizer
	if(!recognizer_timer) {
		voice_recognizer(false)
		console.log("recognizer: *** stopping listener at time for duration",time,duration)
	}

	// if there is a suspension then end it
	if(recognizer_timer) {
		clearTimeout(recognizer_timer)
		recognizer_timer = null
	}

	// if timer expires then enable recognition
	const callback = () => {
		const time = performance.now() * 1000
		console.log("recognizer: **** starting listener at time",time)
		voice_recognizer(true)
		recognizer_timer = null
	}

	// start a new timer that may eventually complete
	recognizer_timer = setTimeout(callback,duration,"enable voice recog")

}

if(!isServer) {
	window.recognizer_suspend = recognizer_suspend
}

