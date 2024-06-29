
const isServer = typeof window === 'undefined'

//////////////////////////////////////////////////////////////////////////////////////////////////
///
/// conversation support; text and voice, pushes events to sys
///
/// @todo should network
///
//////////////////////////////////////////////////////////////////////////////////////////////////

const text_chat_uuid = '@orbital/puppet/text-chat-ux'

export const text_observer = {
	about: 'text observer',

	resolve: (blob) => {
		if(isServer) return blob
		if(blob.tick) return blob
		if(!blob.conversation) return blob

		const target = document.getElementById(text_chat_uuid)
		if(!target) {
			console.log("text observer: weird no target")
			return blob
		}

		// @todo 'paper' should be reactive ideally
		// const elem = { kind:'div', css:'font-size:2em', content:value }
		//if(chatbox.children.length>5) chatbox.children.shift()
		//chatbox.children.splice(chatbox.children.length-1,0,elem)

		// hack around the lack of reactivity of 'paper'
		const elem = document.createElement('div')
		elem.innerHTML=blob.conversation.text
		const history = target.children[0]
		history.appendChild(elem)
		if(history.children.length>4) history.removeChild(history.firstChild)
		return blob
	}
}


function onchange(event,parent,sys) {
	if(!event || !event.target || !event.target.value.length) return
	const value = event.target.value
	event.target.value = ''

	const speakers = sys.query({navigation:true})

	if(!speakers || !speakers.length || !speakers[0].volume || !speakers[0].volume.transform || !speakers[0].volume.transform.xyz) {
		console.error("text chat: bad speaker?",speakers)
		return
	}

	sys.resolve({
		uuid: null,
		conversation:{
			sponsor:speakers[0].uuid,
			xyz:speakers[0].volume.transform.xyz,
			text:value,
			network:true
		}
	})
}

export const puppet_text_chat_ux = {
	uuid: text_chat_uuid,
	paper: {
		css: 'position:absolute;bottom:40px;right:10px;width:300px;font-size:2em;border:3px solid red;z-index:111000',
		children: [
			{
				css: 'display:none;width:100%;padding-left:4px;height:190px;background:rgba(200, 54, 54, 0.5)',
				kind: 'div',
				content: null,
			},
			{
				css: 'display:none;position:absolute;padding-left:4px;bottom:0px;left:0px;width:100%;outline:none;opacity:0.9;font-size:1em;border:0px;border-radius:5px;background:blue',
				kind:'input',
				onchange
			},
			{
				css: 'position:absolute;bottom:0px;right:0px;font-size:1.9em;font-size:2em;',
				content:`💬`,
				onclick: (args,paper,sys)=>{
					const a = args.target.parentNode.children[0].style
					const b = args.target.parentNode.children[1].style
					const state = a.display == 'block'
					a.display = b.display = state ? 'none' : 'block'
					sys.resolve({voice_recognizer:!state})
				}
			}
		]
	}
}
