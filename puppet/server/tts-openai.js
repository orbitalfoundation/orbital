
export async function tts_openai(tts,text) {
	const url = tts.url || 'https://api.openai.com/v1/audio/speech'
	try {
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${tts.bearer}`,
			},
			body: JSON.stringify({
				model: tts.model || "tts-1",
				voice: tts.voice || "shimmer",
				input: text,
			}),
		})
		if(!response.ok) {
			console.error("puppet:tts error",response)
			return null
		}

		return await response.arrayBuffer()

	} catch(err) {
	  console.error('Error:', err)
	}
	return null
}
