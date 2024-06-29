

/*







In more detail:

- elements with a uuid are considered to be at least lightly persistent in volatile storage
- if they are further marked up with a read or write flag they may interact with file storage
- the database observer maps to the file system and this is a way that other blobs of json or javascript can be loaded and be evaluated by the system overall
- disk storage for state is extremely crude and may not scale for industrial apps
- a concept of importmaps is introduced to allow developers to more easily organize code on disk
- objects may be cloned here in order to shake them loose of any other javascript code referring to them; this helps avoid code colliding over the same memory

Reading off disk:

- on the client browser this actually is a fetch() which triggers a server side http reaction
- the client has to make some guesses about what the file is; if a file ends in .mimetype such as .js or .json then it is fetched as is
- if the file ends in a path or a slash then the system will guess that a manifest is desired and will look for a default manifest in that path
- contents are passed back to sys.resolve() as if they were events flowing through the system
- files are read once only


	// handle requests to establish importmaps
	if(blob.importmaps) {
		// @todo
	}


- / if it has a slash then don't do an importmap obviously
- 

- for fetching uuid type resources that map to files
- i think i want to treat '/' as the absolute root; so not the local root of a project
- i could support ../ i guess but i prefer to use import maps to find third party resources

- if it

	// apply import map
	// append manifest
	// must walk down the tree to a node
	// we will want a concept of relative roots so that say cloudcity can refer to things without an absolute position
	
			// prevent duplicate loads for now - later there is some argument to allow prefabs
			if(this.loaded_modules[raw]) return
			this.loaded_modules[raw] = true

			try {

				// bring in the raw module off disk
				const module = await import(raw)
				if(!module) {
					error('sys: module not found ' + resource)
					return
				}

				// modules typically will expose many objects that we want to treat as separate messages to sys
				for(const [k,v] of Object.entries(module)) {

					//
					// uuid granting capability? @todo revisit
					//
					// uuids are somewhat desirable for subtle reasons; although not strictly necessary
					// there's a distinction between a message containing a 'blob'; which is the raw datagram passed through the message pipeline
					// and an 'entity' which is an object that a blob may have been applied to; and that represents the entire state of an entity
					// typically we decorate messages with the full entity if we have it
					// but entities only exist on things with uuids
					// there is a design intention that users do not have to grant uuids to entities - but rather can ship transient datagrams
					// at the same time there's some thought that we could grant uuids somewhere in the pipeline
					// at this point in the pipeline we do happen to know the objects name - and _could_ grant a uuid
					// another thought is that uuid management should occur entirely within the uuid observer
					//
					// if(typeof v === 'object' && !Array.isArray(v) && v !== null && !v.uuid) {
					//	console.warn('sys: note blob had no uuid key=',k,'value=',v,'raw=',raw,'granting uuid',`/${k}`)
					//	v.uuid = "/" + k
					// }

					//
					// path markup?
					//
					// it may make sense to allow marking objects with a path for later asset discovery
					// this is turned off for now
					//
					//recursively_set_origin(v,resource)

					await sys.resolve(v)
				}
			} catch(err) {
				console.error('sys: cannot finalize module due to some bug somewhere',raw,path,err)
			}
		}

		if(Array.isArray(modules)) {
			for(const item of modules) {
				await helper(item)
			}
		} else {
			await helper(modules)
		}

		return true
	}
}




// todo:

// - do import maps
// - read real explicit files such as /blah.js but also read manifests that are implicit on a path
// - write to real files


/*

server side

	- invent a db listener that can do writes?

		- can write to the end of the .manifest.js file

	- move reads to db also???

		- db intercepts on blobs with a uuid can try fetch assets of disk so {uuid:"/something/",read}} would try read off disk to fill out something
		- should it try read anyway even without an explicit command to do so???
		- and would echo to client?

		- note it is about the same as saying {load:"paper/paper.js"}

		- bringing up the starting area can become sys.resolve({uuid:"/",storage:'load'}) <- and those pages flow to the layout
			- and then switching a page can become sys.resolve({uuid:"/cloudreef",storage:'load'})

		- uuid is effectively a storage event but only for a transient database
		- real storage events have to echo to the server so they must be marked as networked

	- revise data structures?

		sys.resolve({
			uuid:'/cloudcity',
			name:'cloudcity',
			about:'an exploration of a futuristic city'
			area: true,
			schema: {
				 uuid: { required: true, type: 'string', default:'' },
				 name: { required: true, type: 'string', default:'' },
				about: { required: true, type: 'string', default:'' }
				 area: { required: true, type: 'bool',   default: true }
			},
			network:{
				networkid:'blah',
				multicast:false, // a way to turn multicast on or off may be nice
				host:'blah',
				remote:true,
			},
			storage: 'read' or 'write' or 'obliterate'
		})

	- other database needs

		- other databased such as mongo can be supported
		- improved hashing and indexing for queries would be nice also
		- spatial hashing both locally and over network
		- collision detection, proximity detection, proximity events
		- volumetric collision

*/




