

//////////////////////////////////////////////////////////////////////////////////////////////////
///
/// a chat box
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
	sys.resolve({chatter:value})

	// @todo paint this below as a result of observing traffic rather than doing it now - so it networks

	// @todo paper should be reactive
	// const elem = { kind:'div', css:'font-size:2em', content:value }
	//if(chatbox.children.length>5) chatbox.children.shift()
	//chatbox.children.splice(chatbox.children.length-1,0,elem)

	const node = document.createElement('div')
	node.innerHTML=value
	const chat1 = document.getElementById("chat1")
	chat1.appendChild(node)
	if(chat1.children.length>4) chat1.removeChild(chat1.firstChild)
}

export const controls = {
	children:[
		{
			css: 'position:absolute;bottom:8px;left:2%;width:95%;font-size:2em',
			children: [
				{
					id: "chat1",
					css: 'display:none;width:100%;padding-left:4px;height:190px;background:rgba(200, 54, 54, 0.5)',
					kind: 'div',
					content: null,
				},
				{
					id: "chat2",
					css: 'display:none;position:absolute;padding-left:4px;bottom:0px;left:0px;width:100%;outline:none;opacity:0.9;font-size:1em;border:0px;border-radius:5px;background:blue',
					kind:'input',
					onchange
				},
				{
					css: 'position:absolute;bottom:0px;right:0px;font-size:1.9em;font-size:2em;',
					content:`💬`,
					onclick: ()=>{
						if(document.getElementById("chat1").style.display == "block") {
							document.getElementById("chat1").style.display = "none"
							document.getElementById("chat2").style.display = "none"
						} else {
							start_continuous_audio_recognizer()
							document.getElementById("chat1").style.display = "block"
							document.getElementById("chat2").style.display = "block"
						}
					}
				}
			]
		}
	]
}

// start or restart audio recognizer
function start_continuous_audio_recognizer() {
	try {
		var recognition = window.recognition = new webkitSpeechRecognition()
		recognition.continuous = true
		recognition.interimResults = true
		recognition.start();
		console.log("speech to text is running")
		recognition.onresult = function(event) {
			console.log(event)
			for (var i = event.resultIndex; i < event.results.length; ++i) {
				const transcript = event.results[i][0].transcript
				if (event.results[i].isFinal) {
					console.log('speech to text final: ' + transcript);
					window.sys.resolve({chatter:transcript})
					// @todo write to the local chat also
				} else {
					console.log('speech to text interim: ' + transcript);
				}
			}
		}
	} catch(err) {
		console.log('speech to text error: ' + err)
	}
}


