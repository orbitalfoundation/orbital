
import { Sys } from './sys/sys.js'

const config = {
	meta: import.meta,
	selfid: 'orbital.foundation',
	dependencies: [ '/@orbital/net/network.js' ]
}

new Sys(config)

// Invoke ssr on an area

await sys.resolve({dependencies:["/index.js"]})
import { paper_ssr } from './paper/paper.js'
const results = paper_ssr(sys,"https://orbital.foundation/")

