
export async function stt_whisper(props,bufferArray) {
	try {

		const blob = new Blob([bufferArray])

		const form = new FormData()
		form.append('file', blob, 'audio.mp3')
		form.append("model", "whisper-1")
		form.append("language", "en")
		form.append("response_format", "verbose_json" )
		form.append("timestamp_granularities[]", "word" )
		form.append("timestamp_granularities[]", "segment" )

		const response = await fetch( "https://api.openai.com/v1/audio/transcriptions" , {
			method: "POST",
			body: form,
			headers: {
				//'Content-Type': 'multipart/form-data',
				'Authorization': `Bearer ${props.bearer}`,
			}
		})

		if(!response.ok) {
			console.error("*** stt whisper bad response",response)
			return null
		}

		const json = await response.json()
		if(!json.words || !json.words.length) {
			console.error("*** stt whisper no data")
			return null
		}

		const audio = {
			words: [],
			wtimes: [],
			wdurations: [],
			markers: [],
			mtimes: []
		}

		// Add words to the audio object
		// @todo the -150 is a hack... should i remove it?

		json.words.forEach( x => {
			audio.words.push( x.word );
			audio.wtimes.push( 1000 * x.start - 150 );
			audio.wdurations.push( 1000 * (x.end - x.start) );
		})

		// Add timed callback markers to the audio object
		json.segments.forEach( x => {
			if ( x.start > 2 && x.text.length > 10 ) {
				audio.mtimes.push( 1000 * x.start - 1000 );
			}
		});

		console.log(audio)
		return audio
	} catch(err) {
		console.error("stt whisper error",err)
	}
	return null
}
