
const isServer = typeof window === 'undefined'

export async function stt_whisper(props,bufferArray) {

	try {

		// for some reason this fails on some nodejs installs due to some kind of weird pipe error
		// const blob = new Blob([bufferArray])
		// const form = new FormData()
		// form.append('file', blob, 'audio.mp3')
		// form.append("model", "whisper-1")
		// form.append("language", "en")
		// form.append("response_format", "verbose_json" )
		// form.append("timestamp_granularities[]", "word" )
		// form.append("timestamp_granularities[]", "segment" )

		// the file itself from a raw ArrayBuffer
		const file = new Uint8Array(bufferArray)

		// other important fields - @todo fetch from props
		const args = {
			model: "whisper-1",
			language: "en",
			response_format: "verbose_json",
			"timestamp_granularities[]": "word",
			file,
		}

		// build list of parts as an array
		const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
		let parts = []
		for(const [k,v] of Object.entries(args)) {
			parts.push(`--${boundary}\r\n`)
			if(k === 'file') {
				parts.push(
					'Content-Disposition: form-data; name="file"; filename="file.mp3"\r\n',
					'Content-Type: application/octet-stream\r\n\r\n',
					v,
					'\r\n'
				)
			} else {
				parts.push(
					`Content-Disposition: form-data; name="${k}";\r\n\r\n`,
					v,
					'\r\n'
				)
			}
		}
		parts.push(`--${boundary}--\r\n`)

		// estimate length of everything
		let totalLength = 0
		parts.forEach(part=>{ totalLength += part.length })

		let body = ""

		if(isServer) {
			// browser clients don't define 'Buffer' but it is typically stable for servers
			body = Buffer.allocUnsafe(totalLength);
			let offset = 0
			parts.forEach(part => {
				if (typeof part === 'string') {
					offset += body.write(part, offset, 'utf8');
				} else if (part === file || Buffer.isBuffer(part)) {
					file.forEach(c=>{ body.writeUInt8(c,offset); offset++ })
					//part.copy(body, offset);
					//offset += part.length;
				}
			})
		} else {
			// this approach can fail on some servers but shoudl work on browser clients
			body = new Blob(parts, { type: 'multipart/form-data' });
		}

		const headers = {
			'Content-Type': `multipart/form-data; boundary=${boundary}`,
			'Content-Length': totalLength,
			'Authorization': `Bearer ${props.bearer}`,
		}

		const response = await fetch( "https://api.openai.com/v1/audio/transcriptions" , {
			method: "POST", headers, body
		})

		if(!response.ok) {
			console.error("*** stt whisper bad response :(",response)
			return null
		}

		const json = await response.json()

		if(!json.words || !json.words.length) {
			console.error("*** stt whisper no data")
			return null
		}

		const whisperAudio = {
			words: [],
			wtimes: [],
			wdurations: [],
			markers: [],
			mtimes: []
		}

		// Add words to the whisperAudio object
		// @todo the -150 is a hack... it's setting timing for later in pipeline and probably should not be set here

		json.words.forEach( x => {
			// @ts-ignore
			whisperAudio.words.push( x.word );
			// @ts-ignore
			whisperAudio.wtimes.push( 1000 * x.start - 150 );
			// @ts-ignore
			whisperAudio.wdurations.push( 1000 * (x.end - x.start) );
		})

		// @todo signaling animations need to be not functions - just don't do these here ideally
		/*
		// Add timed callback markers to the audio object
		const startSegment = async () => {
			// Look at the camera
			head.lookAtCamera(500);
			head.speakWithHands();
		};

		// Add timed callback markers to the whisperAudio object
		json.segments.forEach( x => {
			if ( x.start > 2 && x.text.length > 10 ) {
				whisperAudio.markers.push( startSegment );
				whisperAudio.mtimes.push( 1000 * x.start - 1000 );
			}
		});
		*/

		return whisperAudio

	} catch(err) {
		console.error("stt whisper error",err)
	}

	return null
}


