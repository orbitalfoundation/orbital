
const isServer = typeof window === 'undefined'


function helper(sys,text) {

	console.log("voice recognizer caught text = ",text)

//	const speakers = sys.query({uuid:sys.selfid})
	const speakers = sys.query({navigation:true})

	if(!speakers || !speakers.length || !speakers[0].volume || !speakers[0].volume.transform || !speakers[0].volume.transform.xyz) {
		console.error("voice chat: bad speaker?",speakers)
		return
	}

	sys.resolve({
		uuid: null,
		conversation:{
			sponsor:speakers[0].uuid,
			xyz:speakers[0].volume.transform.xyz,
			text
		}
	})
}

///
/// start or restart audio recognizer (invoked from controls above)
/// mount this globally because it needs to be able to be start/stopped
///

let recognition = null
let voice_state = -1

const voice_recognizer = (sys,allowed = true ) => {

	if(isServer) return
	if(!sys) return

	try {
		if(!recognition) {
			recognition = new webkitSpeechRecognition()
			recognition.continuous = true
			recognition.interimResults = true
			recognition.onresult = function(event) {
				console.log(event)
				for (var i = event.resultIndex; i < event.results.length; ++i) {
					const text = event.results[i][0].transcript
					if (event.results[i].isFinal) {
						console.log("voice_recognizer final",text)
						helper(sys,text)
					} else {
						//console.log('chat widget: speech to text interim: ' + transcript);
					}
				}
			}
		}
		if(allowed==voice_state) return
		allowed ? recognition.start() : recognition.stop()
		voice_state = allowed
		console.log("voice_recognizer state",allowed ? "*** listening" : "*** paused","at time",performance.now() * 1000 )
	} catch(err) {
		console.log('chat widget: speech to text error: ' + err)
	}

}

let voice_enabled = 0
let voice_allowed = 0

export const voice_recognizer_observer = {
	about: 'puppet tick busy observer - client side',
	resolve: (blob,sys) => {
		if(isServer) return blob

		if(blob.hasOwnProperty('voice_recognizer')) {
			voice_enabled = blob.voice_recognizer ? 1 : 0
			voice_recognizer(sys,voice_allowed & voice_enabled ? true : false)
			return blob
		}

		if(!blob.tick) return blob

		// for now we are manually checking the puppets - since they make the sounds so far
		// @todo later we really want a more generic system like some audio timing event registry

		const entities = sys.query({puppet:true})
		voice_allowed = 1
		entities.forEach( (entity) => { if(entity.puppet.busy) voice_allowed = 0 })
		voice_recognizer(sys,voice_allowed & voice_enabled ? true : false)
		return blob
	}
}

