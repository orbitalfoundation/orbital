
import { log,warn,error } from '../utils/log.js'

import { Router} from './router.js'

import { logo } from './logo.js'

/*

//
// ssr support
//

function paper_promote_to_string(node=null,indentation=0) {
	let built = ""
	if(node == null) node = this.body
	let indent = ""; for(let i = 0;i<indentation;i++) indent += "  "
	const elem = node.elem || "div"
	const css = node.css ? ` css='${node.css}'` : ""
	const style = node.style ? ` style='${node.style}'` : ""
	const props = node.props ? ` ${node.props}` : ""
	const id = node.uuid ? ` id=${node.uuid}` : ""
	built += `${indent}<${elem}${css}${style}${props}${id}>`
	if(node.content) {
		built += `${node.content}`
	}
	if(node.children) {
		let counter = 0
		node.children.forEach(child=> {
			built += "\n"
			built += this.dump(child,indentation+1)
		})
		built += "\n"
		built += `${indent}</${elem}>`
	} else {
		built += `</${elem}>`			
	}
	return built
}
*/

//
// create html representation of entity
//

function paper_promote_to_dom(entity,sys) {

	let node = entity._node

	if(node) {
		// @todo add dirty or change detector
		return node
	}

	const kind = entity.kind || 'div'

	// update dom node if changed
	if(!node || node._flavor != kind) {
		if(node) node.remove()
		if(!entity.link) {
			node = entity._node = document.createElement(entity.kind || 'div')
		} else {
			node = entity._node = document.createElement("a")
			entity._node.href = entity.link
			if(!entity.content) entity.content = entity.link
		}
		node.id = entity.id || entity.uuid
		node._flavor = kind
	}


	let content = entity.content ? entity.content.trim() : null

	// hack for markdown support
	if(entity.markdown && content) {
		if(!window.marked) {
			const temp = document.createElement('script')
			temp.setAttribute('type', 'text/javascript')
			temp.src= "/orbital/paper/marked.min.js"
			document.head.appendChild(temp)
			temp.addEventListener("load", (event) => {
				content = window.marked.parse(content)
				node.innerHTML = content
			})
			temp.addEventListener("error",(error)=>{
				console.error(error)
			})
		} else {
			content = window.marked.parse(content)
			node.innerHTML = content
		}
	} else

	// update content if changed
	if(content && content != node.innerHTML) {
		node.innerHTML = content
	}

	// button support - supply the parent entity
	if(entity.onclick) {
		node.onclick = (event) => { entity.onclick(event,entity,sys) }
	}

	if(entity.onchange) {
		node.onchange = (event) => { entity.onchange(event,entity,sys) }
	}

	//////////////////////////////////////////////////////////////////////////////////////////
	// apply properties in general

	// apply css if changed; handles strings or hashes, converts to camelcase
	if(entity.css) {
		if (typeof entity.css === 'string' || entity.css instanceof String) {
			node.style.cssText = entity.css
		} else if (typeof entity.css === 'object') {
			for(const [k,v] of Object.entries(entity.css)) {
				var camelCased = k.replace(/-([a-z])/g,(g) => { return g[1].toUpperCase() })
				node.style[k] = v
			}
		}
	}

	// apply classes to the node if changed; handles strings or arrays
	if(entity.classes) {
		let classes = entity.classes
		if (typeof entity.classes === 'string' || entity.classes instanceof String) {
			classes = entity.classes.split(' ')
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

	// set props - deal with deletion at some point
	if(entity.props) {
		//if(!node._entity_props) node._entity_props = {}
		for(let [k,v] of Object.entries(entity.props)) {
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

	if(entity.logo) {
		logo(entity)
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
	if(entity.content) {
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
// our entity routing scheme; catches non external http clicks and things not marked as #extern
//
// @todo minor: sys should produce all the nodes along the hiearchy to the current path; since children typically want parents to be present
// @todo minor: server side -> on the server side there's no strategy for resolving /blah/apps-evolved etc ... it should hunt for parent index.html
//

async function paper_route(uri,props) {

	if(!props || !props.sys) return

	const recurse = (path,entity,parent) => {

		// attach nodes to dom
		// @todo richer wildcard matching
		// @todo instead these should do an ssr supporting merge not brute force replace replace
		// @todo also this node may already be visible... so by append/replacing it i am doing extra meaningless work that may cause flickers

		if(!entity.regex || path.match(entity.regex)) {
			entity._node = paper_promote_to_dom(entity,props.sys)
			if(parent) {
				parent._node.appendChild(entity._node)
			} else {
				document.body.replaceChildren(entity._node)
			}
		} else if(entity.regex && entity._node) {
			entity._node.remove()
		}

		// also walk children to force sub-routes to be visible; and to mount children in general on a parent
		// @todo for now i force a child uuid - debate the merits of this
		// @todo children will be a rich query at some point not just a list

		if(entity.children && entity.children.length) {
			let counter = 0
			for(const child of entity.children) {
				counter++
				if(!child.uuid) child.uuid = `${entity.uuid}/${counter}`
				recurse(path,child,entity)
			}
		}
	}

	//
	// query for candidates to paint and then paint them
	//
	// @todo improve sys.query -> for now i have to get them all since sys.query cannot return me all the nodes along a path so root nodes would not be passed
	// @todo one note is that for now since i fetch *every* node i can manage the hide/show of root nodes... but later we will need a visible list
	//

	const candidates = await props.sys.query({paper:true})

	if(!candidates.length) {
		console.warn("paper: no candidates at all")
		return
	}

	// recover root for now - @todo revisit
	let root = '/'
	candidates.forEach(entity=>{
		if(entity.root) {
			// if a root path is supplied then establish that as the root of the filesystem
			const frag = decodeURI((new URL(entity.root)).pathname)
			root = frag.substr(0, frag.lastIndexOf('/'))
		}
	})

	// get user url request (a browser event from user has occurred or system state has changed)

	let path = decodeURI((new URL(uri)).pathname)
	log("paper route: user navigation event! ",uri,path)

	// some sites don't start at the '/' and this fact needs to be propagated to server during queries

	if(root && root != "/") {
		if( path.startsWith(root) ) {
			path = path.substr(root.length)
		}
		if(!path.length) path="/"
	}

	if(!candidates || !candidates.length) {
		error("paper route: hmm, no matching route... what should I do???",candidates,path)
		const err = document.createElement("div")
		err.innerHTML = "404 SPA app page not fully resolved"
		document.body.replaceChildren(err)
		return null
	}

	candidates.forEach(entity=>{
		recurse(path,entity,null)
	})

	return null
}

///
/// paper component
///

function observer(args) {
	if(!args.blob.paper) return
	console.log("paper: got some traffic",args)
	const sys = args.sys
	if(!this.router) this.router = new Router(paper_route,{sys})
	this.router.refresh({sys})
}

export const paper_component_observer = {
	about:'paper: react to entities with paper property',
	observer,
}

