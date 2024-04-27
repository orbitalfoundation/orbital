
const isServer = typeof window === 'undefined'

//////////////////////////////////////////////////////////////////////////////////////////////////
///
/// conversation support; text and voice, pushes events to sys
///
/// @todo should network
///
//////////////////////////////////////////////////////////////////////////////////////////////////

/*
const clickme_unused = {
	paper:true,
	uuid:'cloudcity/clickme',
	css:`
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100vh;
		margin: 0;
		`,
	children: [
		{
			kind:'button',
			css:`
				padding: 20px 40px;
				font-size: 24px;
				border: none;
				border-radius: 5px;
				background-color: #007BFF;
				color: white;
				cursor: pointer;
				transition: background-color 0.3s;
			`,
			//		.centered-button:hover { background-color: #0056b3; } @todo enable this concept
			content:`Click Me`
		}
	],
	onclick: (args)=>{
		console.log(args)
		// @todo can i remove this?
	}
}
*/

function onchange(event,parent,sys) {
	if(!event || !event.target || !event.target.value.length) return
	const value = event.target.value
	event.target.value = ''

	// network the event
	sys.resolve({
		// @todo supply a uuid of whom this is refering to - the sponsor basically
		conversation:{
			sponsor:null,
			text:value
		}
	})
	console.log("text: sending conversation",value)

	// @todo paint this below as a result of observing traffic rather than doing it now - so it networks...

	// @todo 'paper' should be reactive ideally
	// const elem = { kind:'div', css:'font-size:2em', content:value }
	//if(chatbox.children.length>5) chatbox.children.shift()
	//chatbox.children.splice(chatbox.children.length-1,0,elem)

	// hack around the lack of reactivity of 'paper'
	const elem = document.createElement('div')
	elem.innerHTML=value
	const history = event.target.parentNode.children[0]
	history.appendChild(elem)
	if(history.children.length>4) history.removeChild(history.firstChild)
}

export const puppet_text_chat_ux = {
	uuid:'@orbital/puppet/text-chat-ux',
	paper: {
		css: 'position:absolute;bottom:8px;left:2%;width:95%;font-size:2em',
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
				onclick: (args)=>{
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

