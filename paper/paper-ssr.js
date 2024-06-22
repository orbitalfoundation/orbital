
const isServer = typeof window === 'undefined'

import { log,warn,error } from '../utils/log.js'

///
/// ssr production helper
///
/// at any time after a manifest is loaded this can be called to produce html pages for urls
///

export function paper_ssr(sys,url,anchor=null) {
	if(!isServer) return

	// generate a fresh server side abstraction of the document
	// in this manner any embedded javascript would also be able to operate on the document model
	const path = _paper_get_path(url,anchor)
	const candidates = sys.query({paper:true})
	candidates.forEach(entity=>{
		_paper_evaluate_path(sys,path,entity)
	})

	// build html for each node
	const recurse = function (node,depth=0) {
		if(node.invisible || !node.nodeName || !node.nodeName.length) return

		for(const child of node.children) {
			recurse(child,depth+1)
		}

		let pad = '\t'.repeat(depth)
		const id = node.id ? ` id="${node.id}"` : ''
		const style = node.style && Object.entries(node.style).length ? ` style="${Object.entries(node.style).map( ([k,v]) => { return `${k}:${v}` }).join(';')}"` : ''
		const classList = node.classList && node.classList.length ? ` class="${node.classList.join(" ")}"` : ''
		let html = node.innerHTML || ""

		if(html.length) {
			let parts = html.split('\n')
			html = "\n"
			for(let part of parts) {
				part = part.trim()
				//part = part.replace(/^ +/gm, '');
				if(!part.length) continue
				html += `\t${pad}${part}\n`
			}
		}

		node.html = `${pad}<${node.nodeName}${id}${style}${classList}>${html}\n`

		for(const child of node.children) {
			node.html += child.html
		}

		node.html += `${pad}</${node.nodeName}>\n`
	}


	const html = createElement("html")
	const head = createElement("head")
	const body = createElement("body")
	html.appendChild(head)
	html.appendChild(_paper_document_serverside.body)
	recurse(html)
	return html.html
}

