
const isServer = typeof window === 'undefined'

import { log,warn,error } from '../utils/log.js'

import { Router} from './router.js'

import { logo } from './logo.js'

import * as marked from './marked.min.js'

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//
// a server side document model abstraction
// this is useful on the server side only for ssr generation
// by doing this extra step if there is javascript that executes in the page construction the page is still valid
// (alternatively the html ascii state could be produced directly onto paper nodes but we'd lose dynamic js effects)
//

const nodes = []

function createElement(kind) {
	let node = {
		className: "",
		nodeName:kind,
		classList: {},
		style: {},
		children: [],
		remove: function() {}, // @todo
		replaceChildren: function(child) {
			this.children = [child]
		},
		appendChild: function(child) {
			for(const node of this.children) {
				if(node.id && node.id == child.id) return
			}
			this.children.push(child)
		}
	}
	nodes.push(node)
	return node
}

function getElementById(id) {
	for(const node of nodes) {
		if(node.id == id) return node
	}
	return 0
}

const _paper_document_serverside = {
	createElement,
	getElementById,
	body: createElement("body")
}

const document = isServer ? _paper_document_serverside : window.document

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//
// bind paper nodes to the dom; effectively have the dom 'react' to changes in paper nodes
//

function _paper_dom_rebind(sys,path,entity,paper,parent_paper=null) {

	const invisible = paper.invisible = ( paper.match && paper.match !== path ) ? true : false

	if(invisible) {
		if(paper._dom) {
			paper._dom.remove()
		}
		return
	} else {
		if(paper._dom) {
			if(parent_paper && parent_paper._dom) {
				parent_paper._dom.appendChild(paper._dom)
			} else {
				document.body.appendChild(paper._dom)
			}
			return
		}
	}

	// get dom element if any
	let node = paper._dom

	// for now don't revisit things more than once - later do change detection and be reactive
	// @todo this needs to be removed if we want dynamic updates and reactivity
	// @todo to remove this however some of the below work needs to be skipped on update if no change
	if(node) {
		return
	}

	// may scavenge from the live scene (on the client this helps rebind to static SSR that was sent early)
	// @todo may want to use query() and wrap the uuid w brackets to circumvent query() limitations

	if(!node) {
		node = document.getElementById(paper.uuid)
		if(node) {
			node._kind = node.nodeName.toLowerCase()
			node._paper = paper
			paper._dom = node
		}
	}

	// may build or rebuild the dom element
	// for server side rendering a fake node is generated

	const kind = paper.kind || 'div'
	if(!node || node._kind != kind) {
		if(node) node.remove()
		if(!paper.link) {
			node = paper._dom = document.createElement(kind)
		} else {
			if(!paper.content) paper.content = paper.link
			node = paper._dom = document.createElement("a")
			node.href = paper.link
		}
		node.id = paper.uuid
		node._paper = paper
		node._kind = kind
	}

	// effects
	_paper_dom_effects(paper)

	// for now the content gets placed inside this node ... later this could be collapsed
	let content = paper.content ? paper.content.trim() : null

	// markdown is built in
	if(paper.markdown && content) {
		content = globalThis.marked.parse(content)
	}

// @todo xxx test change detector

	// update content if changed - script cannot be set 
	if(content && content != node.innerHTML) {
		node.innerHTML = content
	}

// @todo xxx test change detector

	// button and input support
	if(paper.onclick) {
		node.onclick = (event) => { paper.onclick(event,paper,sys) }
	}

	if(paper.onchange) {
		node.onchange = (event) => { paper.onchange(event,paper,sys) }
	}

	if(paper.onreturn) {
		node.onreturn = (event) => { paper.onreturn(event,paper,sys) }
	}

	if(paper.placeholder) {
		node.placeholder = paper.placeholder
	}

// @todo xxx test change detector

	//////////////////////////////////////////////////////////////////////////////////////////
	// apply properties

	// apply css if changed; handles strings or hashes, converts to camelcase
	if(paper.css) {
		if (typeof paper.css === 'string' || paper.css instanceof String) {
			// @todo actually best to pick these apart for consistency
			node.style.cssText = paper.css
		} else if (typeof paper.css === 'object') {
			for(const [k,v] of Object.entries(paper.css)) {
				// @todo any point in supporting dash notation at all? note that the dom supports both camelCase and dash
				// k.replace(/-([a-z])/g,(g) => { return g[1].toUpperCase() })
				node.style[k] = v
			}
		}
	}

// @todo xxx test change detector

	// apply classes to the node if changed; handles strings or arrays
	if(paper.classes) {
		let classes = paper.classes || []
		if (typeof paper.classes === 'string' || paper.classes instanceof String) {
			classes = paper.classes.split(' ')
		}
		if(Array.isArray(classes)) {
			for(const c of classes) {
				if(node.classList.contains && node.classList.add) {
					if(!node.classList.contains[c]) node.classList.add(c)
				} else {
					if(!node.classList.includes[c]) node.classList.push(c)
				}
			}
			node.className.split(' ').forEach(c => {
				if(classes.includes(c)) return
				if(node.classList.remove) {
					node.classList.remove(c)
				} else {
					let index = node.classList.indexOf(c)
					if(indexOf>=0) node.classList.splice(index,1)
				}
			})
		}
	}

// @todo xxx test change detector

	// set other props - deal with deletion at some point
	if(paper.props) {
		//if(!node._props) node._props = {}
		for(let [k,v] of Object.entries(paper.props)) {
			if(node[k] != v) {
				node[k] = v
				//this.setAttribute(k,v)
			}
		}
	}

// @todo should be hiding and showing to the SAME POINT as before not inserting at the end

	// adjust attachment point if needed
	if(parent_paper && parent_paper._dom) {
		parent_paper._dom.appendChild(paper._dom)
	} else {
		document.body.appendChild(paper._dom)
	}

	// pass an event to the node if it has a handler; i'm still thinking about various approaches here - how do we want to deal with events / reactivity etc?

	if(paper.onevent) {
		paper.onevent({event:'show',paper,sys})
	}

	/*
	// disabled support test - after attach
	if(paper.disabled) {
		node.disabled = true
		document.getElementById(node.id).disabled = true
	} else if(node.disabled) {
		node.disabled = false
	}
	*/

}

//
// unused experimental feature
//
/*
function _paper_javascript(paper) {

	const kind = paper.kind

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
}
*/

//
// test code to explore an idea of supporting richer primitives
//
// @todo examine more later
// - there are a variety of ways that we could do composite effects
// - we could have a hiearchy of dom nodes to produce an overall effect
// - we could rewrite the node as it passes through
// - we could have real dom custom elements - these have to then be passed to the remote end for rehydration...
//

function _paper_dom_effects(paper) {
	if(paper.logo) {
		logo(paper)
	}
}

//
// re-evaluate a given node and all children against a path - largely for visibility
//
// hide or show a node (effectively synchronize the state between our db model and the dom)
//

function _paper_evaluate_entity_against_path(sys,path,entity,parent=null) {

	const paper = entity.paper
	paper.uuid = entity.uuid

	// may attach to dom or mark as invisible
	_paper_dom_rebind(sys,path,entity,paper,parent)

	// children of paper can skip the .paper attribute for now @todo may remove this feature
	// @todo later allow children ids to be used rather than using a hardcoded counter
	if(!paper.invisible && paper.children && paper.children.length) {
		let counter = 0
		for(const child of paper.children) {
			const p = child.paper ? child.paper : child
			//p.parent = entity.uuid - don't set this - pass it by hand
			const _scratch = { uuid:`${paper.uuid}/${++counter}`, paper:p }
			_paper_evaluate_entity_against_path(sys,path,_scratch,paper)
		}
	}

}

//
// get the path the user requested - stripping an 'anchor' if any
// never let path be null - just for my own sanity
//

function _paper_get_path(url,anchor) {
	if(!url && isServer) url = "http://orbital.foundation/"
	let path = decodeURI((new URL(url)).pathname)
	if(anchor && path.startsWith(anchor) ) {
		path = path.substr(anchor.length)
	}
	if(!path || !path.length) path="/"
	return path
}

//
// an event has occured - intercept only paper events
//

async function resolve(blob,sys) {

	if(!blob.paper) return blob

	//
	// allow an anchor to be specified
	// (in this way urls can be remapped from say /docs/license to /license )
	//

	let anchor = this.anchor || null
	if(blob.paper.anchor) {
		anchor = blob.paper.anchor
		anchor = decodeURI((new URL(anchor)).pathname)
		anchor = anchor.substr(0, anchor.lastIndexOf('/'))
		if(anchor == "/") anchor = null
		this.anchor = anchor
		console.log("paper: will remove this anchor from subsequent url path requests:",anchor)
	}

	//
	// once only - setup router that will update all elements on browser navigation event and set the current this.url
	//

	if(!isServer && !this.router) {
		this.url = "/"


		this.router = new Router((url)=>{
			this.url = url
			console.log("paper: router refreshing with url",url)
			const path = _paper_get_path(this.url,anchor)
			const candidates = sys.query({paper:true})
			candidates.forEach(entity=>{
				_paper_evaluate_entity_against_path(sys,path,entity)
			})
		})

		// skip evaluation of the current element because the sys.query() above will discover it
		//const path = _paper_get_path(this.url,anchor)
		//_paper_evaluate_entity_against_path(sys,path,blob)

		// force the url to be updated even before scene is complete
		// @todo arguably this could be deferred to the last item but i can't tell when that happens
		// @todo maybe i could broadcast a load completion event that is caught here?
		this.router.broadcast_change()
	} else {

		//
		// re-evaluate a single element when it changes - there's a chance it may be visible and have changes
		//

		const path = _paper_get_path(this.url,anchor)
		_paper_evaluate_entity_against_path(sys,path,blob)
	}

	return blob
}

///
/// paper component observer
///

export const paper_component_observer = {
	about:'paper component observer',
	resolve
}

