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


// - load a given page into paper ...
// - i guess an app does this itself...
