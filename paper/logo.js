
//
// a fun stylized look generator for logos that defines some custom html content
//

export function logo(entity) {

	let stylize = entity.stylize
	let logo = entity.content
	let scrunch="10px"
	let size = "1310%"

	// big?
	if(stylize.includes("small")) {
		scrunch="2px"
		size = "500%"
	}

	// mulicolor?
	let multicolor = ""
	if(stylize.includes("multicolor")) {
		multicolor = `
					background: linear-gradient(to right, rgb(255,96,0), rgb(15,216,55), rgb(0,164,255));
					-webkit-background-clip: text;
					-webkit-text-fill-color: transparent;
					`
	}

	// enhance
	if(!stylize.includes("minimal"))
	{
		logo = `<div style="
					font-family: Arial;
					font-weight: bold;
					font-size: ${size};
					width: fit-content;
					boxSizing: border-box;
					letter-spacing: -${scrunch};
					padding-right: ${scrunch};
					${multicolor}
					">
					${logo}
				</div>`
	}

	// mirror
	if(stylize.includes("reflect")) {
		let card = "background: white; padding: 60px;"
		let mirror = "transform: scaleY(-1); -webkit-mask-image: linear-gradient(to bottom, rgb(255,255,255,0), rgb(255,255,255,0.0), rgb(255,255,255,0.05), rgb(255,255,255,0.3), rgb(255,255,255,0.5));"
		logo = `<div style="${card}">${logo}</div>
				<br/>
				<div style="${card}${mirror}">${logo}</div>`
	}

	// mailto
	if(entity.link) {
		logo = `<a href="${entity.link}">${logo}</a>`
	}

	// pivot
	if(stylize.includes("pivot")) {
		let pivot = "transform: perspective(2000px) rotate3d(0,0.7,-0.1,45deg);"
		logo = `<div style="${pivot}">${logo}</div>`
	}

	// center
	if(stylize.includes("center")) {
		logo = `<div style="display:flex;width:100%;justify-content:center">${logo}</div>`
	}

	// rewrite entity content
	entity.content = logo;
}
