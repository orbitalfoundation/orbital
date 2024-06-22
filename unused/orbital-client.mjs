
/* sadly we cannot build these inside javascript itself as easily as i'd like
<script type="importmap">
{
	"imports": {
		"@orbital": "./sys/sys.js",
		"@orbital/sys/uuid": "./sys/uuid.js"
	}
}
</script>
*/

//
// start orbital
//
// do a bit of work to make sure that orbital related assets in our importmaps analogue are fetched correctly
//

import { Sys } from './sys/sys.js'

const segments = new URL(import.meta.url).pathname.split("/")
segments.pop()
const current_path = segments.join('/')
console.log("orbital client bootstrapping:  orbital kernel appears to be located at",current_path)

const config = {
	importmaps: {
		'@orbital':current_path,
	}
}

const sys = new Sys(config)

//
// spa app path fix up vaguely hacky subtlety:
//
//		- requests for a real folder such as /docs are caught by the server and a 302 is sent back telling the client to try /docs/ instead
//		- it's very important to never allow clients to skip have a trailing '/' because it will horribly mangle requests for assets in the path
//		- *BUT* on the client a path without a trailing "/" is a SPA app route and we do NOT want to include it when fetching the manifest
//

let path = window.location.pathname
const tokens = path.split('/')
if(tokens.length > 1 && !path.endsWith('/')) {
	tokens.pop()
	path = tokens.join('/')
}
console.log("orbital client bootstrapping: window raw location =",window.location.pathname,"with path =",path)

//
// load the manifest for the current folder (noting the above path fixup hack above)
//

const dependencies = [path,'manifest.js'].join('/').replace(/\/{1,}/g,'/')
console.log("orbital client bootstrapping: loading client manifest.js from path",dependencies)

await sys.resolve({dependencies})

//
// run forever - using frame interval timer
//

sys.run()
