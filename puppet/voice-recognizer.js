
const isServer = typeof window === 'undefined'

///
/// start or restart audio recognizer (invoked from controls above)
/// mount this globally because it needs to be able to be start/stopped
///

let recognition = null

const voice_recognizer = (state) => {

	if(isServer) return

	console.log("voice_recognizer state",state ? "*** listening" : "*** paused","at time",performance.now() * 1000 )

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

export const voice_recognizer_observer = {
	about: 'puppet tick busy observer - client side',
	observer: (args) => {
		if(isServer) return
		if(args.blob.hasOwnProperty('voice_recognizer')) {
			voice_recognizer(args.blob.voice_recognizer)
		}
	}
}

