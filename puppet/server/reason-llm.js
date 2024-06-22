
export async function reason_llm(reason,prompt) {

	const command = {
		method: 'POST',
		headers: {  'Content-Type': 'application/json' }
	}

	// configure for various targets
	if(reason.provider === 'openai') {
	 	reason.url = reason.url || 'https://api.openai.com/v1/chat/completions'
		command.headers.Authorization = `Bearer ${reason.bearer}`
		command.body = JSON.stringify({
			model: reason.model || 'gpt-3.5-turbo',
			messages: [
				{ role: "system", content: reason.backstory },
				{ role: "user", content: prompt }
			]
		})
	} else {
		const enable_rag = reason.hasOwnProperty('rag') ? reason.rag : false
		command.body = JSON.stringify({prompt,enable_rag})
	}

	// have endpoint do reasoning
	try {
		console.log(command,reason.url)
		const response = await fetch(reason.url,command)
		console.log(response)
		if(response.ok) {
			const json = await response.json()
			console.log(json)
			if(reason.provider === 'openai') {
				return json.choices[0].message.content
			} else {
				return json.error || json.data.response
			}
		}
		console.error("puppet: reasoning error",response)
	} catch(err) {
		console.error("puppet: reasoning catch error",err)
	}
	return null
}
