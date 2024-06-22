
///
/// A router that intercepts low level browser navigation events
/// Caller should provide handlers to handle events
///

const isServer = typeof window === 'undefined'

export class Router {

	handlers = []

	broadcast_change() {
		if(isServer) return
		console.log('router: broadcasting changed url',window.location.href)
		for(let handle of this.handlers) {
			handle(window.location.href)
		}
	}

	constructor(handler) {

		// only runs on clients
		if(isServer) return this

		// a caller registers custom event handler @todo may want to verify uniqueness
		if(handler) this.handlers.push(handler)

		const history = window.history

		// support for using ?q=path - disabled for now
		//let query = new URLSearchParams(window.location.search).get("q") || ""

		// observe any browser level state push event
		var previousPushState = history.pushState.bind(history)

		history.pushState = (state,path,origin) => {
			console.log("router: pushstate occured",state,path,origin)
			previousPushState(state,path,origin)
			this.broadcast_change()
			event.preventDefault()
			return false
		}

		// observe user activity on the browser navigation buttons
		window.addEventListener("popstate",(event)=>{
			console.log("router: observed popstate",event)
			this.broadcast_change()
			event.preventDefault()
			return false
		})

		// observe user activity on a button, url or other possible navigation dom element
		document.addEventListener('click', (event) => {
			//console.log("router: user clicked on something",event)

			// ignore any user clicks on file type hrefs
			if(event.target.type == "file") return true

			// may have to dig around for the href a bit?
			var target = event.target || event.srcElement;
			while (target) {
				if (target instanceof HTMLAnchorElement) break
				target = target.parentNode
			}

			// do not intercept hrefs that are to external websites
			let raw = target ? target.getAttribute("href") : 0
			if(!raw || !raw.length || raw.startsWith("http") || raw.startsWith("mail") || raw.includes(":")) {
				return true
			}

			// support for explicit detection of external routes
			if(target.getAttribute("extern")) return true

			// interception: force a local page transition event rather than allowing new document
			let path = (new URL(target.href)).pathname
			history.pushState({},path,path)

			// interception: stop normal browser behavior (which would be to flush the document)
			event.preventDefault()
			return false
		})
	}

}
