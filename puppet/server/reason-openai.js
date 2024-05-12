
export async function reason_openai(reason,prompt) {

	try {
		const url = reason.url || 'https://api.openai.com/v1/chat/completions'
		const command = {
			method: 'POST',
			headers: {  'Content-Type': 'application/json',
					   'Authorization': `Bearer ${reason.bearer}`,
					},
			body: JSON.stringify({
				model: reason.model || 'gpt-3.5-turbo',
				messages: [
					{ role: "system", content: reason.backstory },
					{ role: "user", content: prompt }
				]
			})
		}
		const response = await fetch(url,command)
		if(!response.ok) {
			console.error("puppet: reasoning error 1",response,reason)
		} else {
			const json = await response.json()
			const text = json.choices[0].message.content
			//console.log('puppet: reasoning success',text)
			return text
		}
	} catch(err) {
		console.error("puppet: reasoning error 2",err,reason)
	}

	return null
}
