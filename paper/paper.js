
import { log,warn,error } from '../utils/log.js'

import { Router} from './router.js'

import { logo } from './logo.js'

//
// create html representation of paper component
//

function paper_promote_to_dom(paper,sys) {

	let node = paper._dom

	if(node) {
		// @todo add dirty or change detector!
		return node
	}

	const kind = paper.kind || 'div'

	// update dom node if changed
	if(!node || node._flavor != kind) {
		if(node) node.remove()
		if(!paper.link) {
			node = paper._dom = document.createElement(kind)
		} else {
			node = paper._dom = document.createElement("a")
			paper._dom.href = paper.link
			if(!paper.content) paper.content = paper.link
		}
		node.id = paper.id || paper.uuid
		paper._flavor = kind
	}


	let content = paper.content ? paper.content.trim() : null

	// hack for markdown support - can't seem to import it directly @todo improve later
	if(paper.markdown && content) {
/*
		if(!window.marked) {
			window.marked = true
			const temp = document.createElement('script')
			temp.setAttribute('type', 'text/javascript')
			//const path = new URL(import.meta.url).pathname + "/../marked.min.js"
			const path = "/@orbital/paper/marked.min.js"
			temp.src= path
			document.head.appendChild(temp)
			temp.addEventListener("load", (event) => {
				content = window.marked.parse(content)
				node.innerHTML = content
			})
			temp.addEventListener("error",(error)=>{
				error(error)
			})
		} else
*/
		{
			content = window.marked.parse(content)
			node.innerHTML = content
		}
	} else

	// update content if changed
	if(content && content != node.innerHTML) {
		node.innerHTML = content
	}

	// button support - supply the parent paper component
	if(paper.onclick) {
		node.onclick = (event) => { paper.onclick(event,paper,sys) }
	}

	if(paper.onchange) {
		node.onchange = (event) => { paper.onchange(event,paper,sys) }
	}

	//////////////////////////////////////////////////////////////////////////////////////////
	// apply properties in general

	// apply css if changed; handles strings or hashes, converts to camelcase
	if(paper.css) {
		if (typeof paper.css === 'string' || paper.css instanceof String) {
			node.style.cssText = paper.css
		} else if (typeof paper.css === 'object') {
			for(const [k,v] of Object.entries(paper.css)) {
				var camelCased = k.replace(/-([a-z])/g,(g) => { return g[1].toUpperCase() })
				node.style[k] = v
			}
		}
	}

	// apply classes to the node if changed; handles strings or arrays
	if(paper.classes) {
		let classes = paper.classes
		if (typeof paper.classes === 'string' || paper.classes instanceof String) {
			classes = paper.classes.split(' ')
		}
		if(Array.isArray(classes)) {
			for(const c of classes) {
				if(!node.classList.contains[c]) node.classList.add(c)
			}
			node.className.split(' ').forEach(c => {
				if(!classes.includes[c]) {
//					node.classList.remove(c)
				}
			})
		}
	}

	// set other props - deal with deletion at some point
	if(paper.props) {
		//if(!node._props) node._props = {}
		for(let [k,v] of Object.entries(paper.props)) {
			if(this[k] != v) {
				this[k] = v
				//this.setAttribute(k,v)
			}
		}
	}

	//////////////////////////////////////////////////////////////////////////////////////////
	// testing a richer agent
	// @todo examine more later
	// - there are a variety of ways that we could do composite effects
	// - we could have a hiearchy of dom nodes to produce an overall effect
	// - we could rewrite the node as it passes through
	// - we could have real dom custom elements - these have to then be passed to the remote end for rehydration...
	//

	if(paper.logo) {
		logo(paper)
	}

	//////////////////////////////////////////////////////////////////////////////////////////
	// embeddable scripting support - first pass
	// it would be very nice to support inline execution with just <script> tags client side ... doesn't seem possible easily yet
	// @todo examine more later

	/*
	function setInnerHTML(elm, html) {
	  elm.innerHTML = html;
	  
	  Array.from(elm.querySelectorAll("script"))
	    .forEach( oldScriptEl => {
	      const newScriptEl = document.createElement("script");
	      
	      Array.from(oldScriptEl.attributes).forEach( attr => {
	        newScriptEl.setAttribute(attr.name, attr.value) 
	      });
	      
	      const scriptText = document.createTextNode(oldScriptEl.innerHTML);
	      newScriptEl.appendChild(scriptText);
	      
	      oldScriptEl.parentNode.replaceChild(newScriptEl, oldScriptEl);
	  });
	}

	if(kind == 'script') {
		log("paper: noticed script")
		node.setAttribute('type', 'text/javascript');
		//node.innerHTML = 'alert(\'hello\')';		
	}

	// look for js
	if(paper.content) {
		const child = node.querySelector('script')
		if(child) {
			log('paper: testing javascript execution')
			log(child,child.getAttribute('type'))
			child.setAttribute('type', 'text/javascript')
		}
	}
	*/


	return node
}


//
// update
//
// hide or show a node (effectively synchronize the state)
//
// if a paper node is marked as a 'page' then it cannot exist with others - later introduce a bitmask
//
// @todo these should do an ssr friendly supporting merge not brute force replace replace
// @todo smarter more granular updates - this node may already be visible... so by append/replacing it i am doing extra meaningless work that may cause flickers
//

function update(entity,path,sys,parent=null) {

	const paper = entity.paper

	// set for convenience

	if(entity.uuid) paper.uuid = entity.uuid
	if(entity.id) paper.id = entity.id

	// visible?

	const visible = paper.regex == null || (path && path.match(paper.regex))

	// hide?

	if(!visible) {
		if(paper._dom) {
			paper._dom.remove()
		}
		return
	}

	// build or update dom node if needed (this routine should do nothing if there were no changes)

	paper._dom = paper_promote_to_dom(paper,sys)

	// adjust attachment point if needed

	if(parent && parent._dom) {
		parent._dom.appendChild(paper._dom)
	} else {
		if(paper.page) {
			// @todo only replace other pages not everything
			document.body.replaceChildren(paper._dom)
		} else {
			document.body.appendChild(paper._dom)
		}
	}

	if(paper.children && paper.children.length) {
		let counter = 0
		for(const child of paper.children) {
			const _scratch = { uuid:`${entity.uuid}/${counter++}`, paper:child }
			_scratch.paper.uuid = _scratch.uuid
			update(_scratch,null,sys,paper)
		}
	}
}


//
// get the path the user requested - stripping an 'anchor' if any
// never let path be null - just for my own sanity
//

function get_path(uri,anchor) {
	let path = decodeURI((new URL(uri)).pathname)
	if(anchor && path.startsWith(anchor) ) {
		path = path.substr(anchor.length)
	}
	if(!path || !path.length) path="/"
	return path
}

//
// an event has occured - intercept only paper events
//

function observer(args) {
	if(args.blob.tick) return
	if(!args.blob.paper) return

	const sys = args.sys

	//
	// allow an anchor to be specified
	// (in this way urls can be remapped from say /docs/license to /license )
	//

	let anchor = this.anchor || null
	if(args.blob.paper.anchor) {
		anchor = args.blob.paper.anchor
		anchor = decodeURI((new URL(anchor)).pathname)
		anchor = anchor.substr(0, anchor.lastIndexOf('/'))
		if(anchor == "/") anchor = null
		this.anchor = anchor
		console.log("paper: will remove this anchor from subsequent url path requests:",anchor)
	}

	//
	// update all elements on browser navigation event
	//

	if(!this.router) {
		this.url = "/"
		this.router = new Router((url)=>{
			this.url = url
			console.log("paper: router refreshing with url",url)
			const path = get_path(this.url,anchor)
			const candidates = sys.query({paper:true})
			candidates.forEach(entity=>{
				update(entity,path,sys)
			})
		})
		// force the url to be updated now
		this.router.broadcast_change()

		// no need to run the below since the above will force the update
		return
	}

	//
	// update a single element when it changes
	//

	const path = get_path(this.url,anchor)
	update(args.entity,path,sys)
}

///
/// paper component observer
///

export const paper_component_observer = {
	about:'paper component observer',
	observer
}

