import { sys } from './sys/sys.js'
await sys.resolve({load:["/"]})
import { paper_ssr } from './paper/paper.js'
const results = paper_ssr(sys,"https://orbital.foundation/")

