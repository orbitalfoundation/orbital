
///
/// Boot.js is an optional helper that deals with path and importmap chores for loading up an orbital project
/// This runs on client and server side
///

const isServer = (typeof window === 'undefined') ? true : false

///
/// Decide where the root of Orbital and project files are relative to the current folder.
///
/// On the server side a server is typically run in the current folder of a live app; so the anchor should be "/".
/// 
/// On the client side there may be nested projects; they may have urls like /cloudcity/
/// But as well there may be SPA app routes such as /systems
///
/// If a path ends in a "/" then it is assumed to be the anchor other artifacts - and the loader is specially informed.
/// Otherwise the app is assumed to be a spa app and this is just a SPA app route to be resolved at runtime
///
/// In general projects and subprojects can each have their own copy of Orbital relative to themselves
/// This is optional however, and any manifest can explicitly ask for Orbital pieces to be loaded from /orbital
/// However it is harder to bypass 'three' since third party modules outside of our control assume that this import map is defined.
/// To bypass this altogether you would want to have your own copy of this bootstrap helper
///

let anchor = "/"

if(!isServer && globalThis.location.pathname.endsWith("/")) {
	anchor = globalThis.location.pathname
}

///
/// Importmaps are mandatory/required by many third party libraries that Orbital relies on.
/// However Orbital doesn't use webpack, and due to a poor design choice in javascript importmaps cannot be ammended after a module loads.
/// The browser will report 'An import map is added after a module script load was triggered' which limits our control here.
/// Therefore we must define these importmaps early, and they have to be hardcoded effectively, and we use a non module boot.js file
///
/// At this time orbital itself is introduced as an import map for convenience.
/// Note that the server side invents its own pseudo import map policy that follows this scheme as well.
///

if(!isServer) {

	const importmap = {
		imports: {
			"orbital/": `${anchor}orbital/`,
			"three": `${anchor}orbital/volume-3js/libs/three/three.module.js`,
			"three/": `${anchor}orbital/volume-3js/libs/three/`
		}
	}
	const script = document.createElement("script")
	script.type = "importmap"
	script.textContent = JSON.stringify(importmap)
	//globalThis.document.currentScript.before(script)
	globalThis.document.head.prepend(script)
}

///
/// Load the project manifest - the same manifest is loaded on client and server - a default file './index.js' typically loaded.
///
/// It's worth noting that if paper is running, and a sub-folder is visited - then the server isn't restarting or reloading that default file.
/// That means that generally speaking developers will probably want to push assets to the server from the client at runtime.
/// So typically a client bootstrap index.js will want to specifically detect if it is being run on the server side and be prudent about what it declares.
///

import('./sys/sys.js').then(module=>{
	console.log("orbital boot loading manifest")
	module.sys.resolve({
		anchor,
		load:anchor
	})
})

