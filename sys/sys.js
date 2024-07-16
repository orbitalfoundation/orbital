
import { log,warn,error } from '../utils/log.js'

import { raw_observer } from './raw.js'
import { uuid_observer } from './uuid.js'
import { resolve_resolver } from './resolve_resolver.js'
import { load_observer } from './load.js'
import { tick_observer } from './tick.js'

const isServer = (typeof window === 'undefined') ? true : false

const uuid = 'orbital/sys/sys.js'

const description =
`
Sys - orbital messaging and event observer backbone

Orbital defines a 'data oriented' messaging pipeline as a service to connect independent pieces of code to each other using an event sourced model.

In more detail:

- Blobs of state or 'datagrams' flow through the system
- Registered event observers can react to these events; driving the overall system behavior.
- The 'state' of the system defines the 'effects'; programmers focus on arranging stat - rendering and other work are secondary.
- Code modules are decoupled from one another; allowing horizontal or rhizomatic scaling, reducing the cognitive burden and allowing many programmers to work together.
- The grammar is a secondary focus as well; there's less of a focus on if the code is in javascript, typescript, wasm, erlang, and more on arrangement of state.
- Datagrams follow an ECS pattern where json objects are entities and properties are components.
- An event observer can conceptually be considered to be an agent if you wish.
- A tick event can be observed to drive systems forward in time; systems are implemented by observing the tick and then querying for collections to act on.

Useful links on these topics:

- https://www.reactivemanifesto.org/
- https://dataorienteddesign.com/dodmain.pdf
- https://flecs.dev/
- https://worrydream.com/refs/Kay_1984_-_Computer_Software.pdf
- https://nms.kcl.ac.uk/michael.luck/resources/al3roadmap.pdf
`

const resolve = async function(blob,sys) {
	// resolve can await
	return this._observers[0].resolve(blob,this)
}

const query = function(args,sys) {
	// volatile no await
	return this._observers[0].query(args,this)
}

export const sys = {
	uuid,
	description,
	isServer,
	_uuids: {},
	_observers: [ raw_observer, uuid_observer, load_observer, resolve_resolver, tick_observer ],
	resolve,
	query,
}
