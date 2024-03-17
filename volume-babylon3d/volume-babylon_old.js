
import "/sys/libs/babylon.js"
import "/sys/libs/babylonjs.loaders.min.js"
import "/sys/libs/babylon.gui.js"
// import "/sys/cannon.js"

export default class View {

	constructor(args) {
		if(args) {
			this.uid = args.uid
			this.uuid = args.uuid
			this.urn = args.urn
		}
		this.routes = []
		this.resolve = this.resolve.bind(this)

		this.setup()

		this._fragment_merge = this._fragment_merge.bind(this)
		this.resolve = this.resolve.bind(this)
	}

	///
	/// resolve a scene graph
	///
	/// if a starting scene does not exist then one will be generated
	///
	/// any node can be in any scene - set the parent scene at will with .scene = parent scene name
	///
	/// although other services can parse scene graphs with children nodes, this expects a linear array
	///

	resolve(blob) {

		// it is possible that we are getting a structured object - pick it apart
		if(typeof blob === 'object' && blob.data) {
			blob = blob.data
		} else {
			//console.warn("view: no data")
			return
		}

		// it is possible that we are getting an array of objects
		if(Array.isArray(blob)) {
			blob.forEach(this._fragment_merge)
		} else {
			this._fragment_merge(blob)
		}
	}

	///
	/// accumulate listeners for keyboard events and picking and so on
	///

	route(route) {
		this.routes.push(route)
	}

	_echo(node) {
		this.routes.forEach(route=>{
			// TBD
			//route.resolve(input)
		})
	}

	///////////////////////////////////////////////////////////////////////////////////////////////////

	canvas = 0;
	engine = 0;
	scenes = [];
	scenes_indexed = {}
	babylon_nodes = {};
	PHYSICS = false;

	setup() {

		// it's easiest to produce this ourselves rather than rely on outside parties to do it
		this.canvas = document.createElement("canvas")
		//this.canvas.style.cssText += 'position:absolute;top:0;'

		const resize = () => {
			this.canvas.width = window.innerWidth
			this.canvas.height = window.innerHeight
		}
		resize()
		document.body.appendChild(this.canvas)
		window.addEventListener('resize', resize)

		this.canvas.focus()

		this.engine = new BABYLON.Engine(this.canvas, true)

		var renderLoop = () => {
			this.scenes.forEach(scene => { if(scene.camera) scene.render()})
		}
		this.engine.runRenderLoop(renderLoop)

		window.addEventListener("resize",this.engine.resize.bind(this.engine))

		window.addEventListener("click", (evt) => {
			this.scenes.forEach(scene => {
				var pickResult = scene.pick(evt.clientX, evt.clientY)
				if(pickResult && pickResult.pickedMesh && pickResult.pickedMesh) {

					// climb up to pickable or fail
					let node = pickResult.pickedMesh
					for(;node;node=node.parent) {
						if(node.fragment && node.fragment.pickable) break
					}

					// publish picking event
					if(node && node.fragment && node.fragment.pickable && node._context_handle) {

console.log("view: pick event happened " + node.uuid)

//						let view = node._context_handle
//						view.routes.forEach(route => {
//							route.resolve({event:"pick",fragment:node.fragment})						
//						})

					}
				}

			})

		})

	}


	create_scene(fragment) {

		let scene = new BABYLON.Scene(this.engine)

		if(this.scenes.length) scene.autoClear = false

		this.scenes.push(scene)

		this.scenes_indexed[scene.uuid] = scene

		if(this.PHYSICS) {
			let physicsPlugin = new BABYLON.CannonJSPlugin()
			scene.enablePhysics(new BABYLON.Vector3(0,-9.81, 0), physicsPlugin)
		}

		// console log - need some kind of stub here - todo improve
		return new BABYLON.TransformNode(fragment.uuid + "_trans",scene)
	}

	create_camera(fragment,scene) {

		if(scene.camera) {
			console.error("view: scene has camera")
			return
		}

		let camera = 0

		let lookat = fragment.lookat ? new BABYLON.Vector3(...fragment.lookat) : new BABYLON.Vector3(0, 0, 0)
		let xyz = fragment.xyz ? new BABYLON.Vector3(...fragment.xyz) : new BABYLON.Vector3(0,0,0)

		if(fragment.arcrotatecamera) {
			// https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_introduction
			let longitude = fragment.longitude || 0
			let latitude = fragment.latitude || Math.PI / 2
			let radius = fragment.radius || 1
			camera = new BABYLON.ArcRotateCamera("camera", longitude, latitude, radius, lookat,scene)
			let min = fragment.radiusmin ? fragment.radiusmin : 2
			let max = fragment.radiusmax ? fragment.radiusmax : 100
			camera.lowerRadiusLimit = min
			camera.upperRadiusLimit = max
		} else {
			camera = new BABYLON.UniversalCamera("UniversalCamera",xyz, scene)
		}

		// arc rotate can also be set this way - and this may be better in general
		camera.setTarget(lookat)

		// arc rotate can be set this way too - and this may be better
		camera.position = xyz

		// remember this for ourselves
		scene.camera = camera

		// camera controls
		if(!fragment.ortho) {

			// this is required
			camera.attachControl(this.canvas, true)

			// this is required
			camera.inputs.addMouseWheel()
		}

		// universal camera fiddly stuff
		if(fragment.universal) {
			camera.inputs.attached["mousewheel"].wheelYMoveRelative = BABYLON.Coordinate.Y
			camera.inputs.attached["mousewheel"].wheelPrecisionY = -1			
		}

		// special model for orthographic cameras for widgets (multiple cameras may be active)
		if(fragment.ortho) {
		    camera.mode = camera.ORTHOGRAPHIC_CAMERA;
		    const rect   = this.engine.getRenderingCanvasClientRect();
		    const aspect = rect.height / rect.width; 
			let radius = 5
		    camera.orthoLeft   = -radius;
		    camera.orthoRight  =  radius;
		    camera.orthoBottom = -radius * aspect;
		    camera.orthoTop    =  radius * aspect;    
		}

	    return camera
	}

	create_light(fragment,scene) {

		let uuid = fragment.uuid
		let art = fragment.art

		let light = 0;

		let xyz = fragment.xyz ? new BABYLON.Vector3(...fragment.xyz) : new BABYLON.Vector3(0,0,0)
		let dir = fragment.dir ? new BABYLON.Vector3(...fragment.dir) : new BABYLON.Vector3(0, -1, 0)

		switch(fragment.kind) {
			case "light":
			case "pointlight":
				light = new BABYLON.PointLight(fragment.uuid,xyz,scene)
				break
			case "directionallight":
			case "directionalight":
				light = new BABYLON.DirectionalLight(fragment.uuid,dir,scene)
				break
			case "spotlight":
				light = new BABYLON.HemisphericLight(fragment.uuid,xyz,dir,fragment.angle||1,fragment.exponent||2,scene)
				break
			case "hemisphericlight":
				light = new BABYLON.HemisphericLight(fragment.uuid,dir,scene)
				break
			default:
				throw "view: bad light"
		}

		light.intensity = fragment.intensity || 1.0;
		// light.falloffType = 2

		// debug
		if(fragment.debug) {
			var lightSphere = BABYLON.Mesh.CreateSphere("sphere", 10, 0.1, scene)
			lightSphere.position = xyz
			lightSphere.material = new BABYLON.StandardMaterial("light", scene)
			lightSphere.material.emissiveColor = new BABYLON.Color3(1, 1, 0)
		}

		if(fragment.shadows && !scene.shadowGenerator) {
			scene.shadowGenerator = light.shadowGenerator = new BABYLON.ShadowGenerator(4096, light)
			console.log("view: light/scene created shadow emitter")
			//scene.shadowGenerator.getShadowMap().refreshRate = BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONCE
			scene.shadowGenerator.useExponentialShadowMap = true
			// TODO - must destroy shadow generator if destroying light
		}

		// attach to camera
		/*
		if(false || fragment.attach_to_camera) {
			let camera1 = this.camera1;
			scene.registerBeforeRender( () => {
				light.position.x = camera1.position.x
				lightSphere.position = light.position
			})
		}*/

		return light
	}

	///
	/// material helper
	///

	babylon_material(fragment,scene) {

		// make a material from args

		let mat = new BABYLON.StandardMaterial("material",scene);

		if(fragment.rgba) {
			let a = ((fragment.rgba >> 24) & 0xff) / 256.0
			let r = ((fragment.rgba >> 16) & 0xff) / 256.0
			let g = ((fragment.rgba >> 8) & 0xff) / 256.0
			let b = ((fragment.rgba) & 0xff) / 256.0
			mat.diffuseColor = new BABYLON.Color3(r,g,b) // basic color
			//mat.specularColor = new BABYLON.Color3(1,1,1) // specular highlights
			//mat.emissiveColor = new BABYLON.Color3(1,1,1) // self lit
			//mat.ambientColor = new BABYLON.Color3(1,1,1)
		}

		if(fragment.alpha) mat.alpha = fragment.alpha

		if(fragment.emissive) {
			let a = ((fragment.emissive >> 24) & 0xff) / 256.0
			let r = ((fragment.emissive >> 16) & 0xff) / 256.0
			let g = ((fragment.emissive >> 8) & 0xff) / 256.0
			let b = ((fragment.emissive) & 0xff) / 256.0
			mat.emissiveColor = new BABYLON.Color3(r,g,b) // self 
		}

		if(fragment.specular) {
			let a = ((fragment.specular >> 24) & 0xff) / 256.0
			let r = ((fragment.specular >> 16) & 0xff) / 256.0
			let g = ((fragment.specular >> 8) & 0xff) / 256.0
			let b = ((fragment.specular) & 0xff) / 256.0
			mat.specularColor = new BABYLON.Color3(r,g,b) // self lit
		}

		if(fragment.ambient) {
			let a = ((fragment.ambient >> 24) & 0xff) / 256.0
			let r = ((fragment.ambient >> 16) & 0xff) / 256.0
			let g = ((fragment.ambient >> 8) & 0xff) / 256.0
			let b = ((fragment.ambient) & 0xff) / 256.0
			mat.ambientColor = new BABYLON.Color3(r,g,b) // self lit
		}

		// todo deal with texture magic

		if(fragment.art) {
			mat.diffuseTexture = new BABYLON.Texture(fragment.art,scene)
			mat.diffuseTexture.uScale = 1
			mat.diffuseTexture.vScale = 1
			if(!fragment.specular)mat.specularColor = new BABYLON.Color3(0, 0, 0)
		}

		if(!fragment.children) {
			return mat
		}

		// deal with magical materials with embeddable text
		// deal with 2d elements - children if any
		// (In Orbital I want materials to be richer than merely dumb surfaces - this explores that idea)

		var texture = new BABYLON.DynamicTexture("dynamic texture", {width:512, height:256},scene)
		var context = texture.getContext()
		
		mat.diffuseTexture = texture;

		fragment.children.forEach(child=>{
			switch(child.kind) {
				case "text":
					let text = child.text ? child.text : "nothing"
					let font = child.font ? child.font : "bold 44px monospace";
					texture.drawText(text, 75, 135, font, "green", "white", true, true);
				// rect
				// path
				default:
			}
		})

		return mat
	}

	create_ux(fragment,scene) {
		let uuid = fragment.uuid
		let art = fragment.art

		var manager = new BABYLON.GUI.GUI3DManager(scene);

		// Let's add a slate
		var near = new BABYLON.GUI.NearMenu("near");
		manager.addControl(near);

// xxx todo examine better - seems kind of a hassle to get this right
//near.maxViewVerticalDegrees
//near.maxViewHorizontalDegrees to tweak these bounds.
near.defaultDistance = 10
//near.minimumDistance = 10
//near.maximumDistance = 10
//near.orientToCameraDeadzoneDegrees = 0;

		var button0 = new BABYLON.GUI.TouchHolographicButton("button0");
		button0.imageUrl = "./textures/IconFollowMe.png";
		button0.text = "Button 0";
		near.addButton(button0);

		var button1 = new BABYLON.GUI.TouchHolographicButton("button1");
		button1.imageUrl = "./textures/IconClose.png";
		button1.text = "Button 1";
		near.addButton(button1);

		var button2 = new BABYLON.GUI.TouchHolographicButton("button2");
		button2.imageUrl = "./textures/IconFollowMe.png";
		button2.text = "Button 2";
		near.addButton(button2);

		return new BABYLON.TransformNode(uuid,scene)
	}

	create_text(fragment,scene) {
		let uuid = fragment.uuid
		let art = fragment.art

		var ux = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

		var elem = new BABYLON.GUI.InputTextArea();
		elem.width = 0.9;
		elem.maxWidth = 0.9;
		elem.verticalAlignment = 1;
		elem.height = "200px";
		elem.text = ""
		elem.color = "white";
		elem.background = "black";
		ux.addControl(elem);   		

		// on carriage return echo the text back to observers blindly
		elem.onKeyboardEventProcessedObservable.add((input) => {
			if(input.keyCode == 13 && input.shiftKey == false) {
				this._echo({command:"key",keyCode:input.keyCode,text:`${elem.text}`,uuid:fragment.uuid})
				elem.text = ""
			}
		})

		return new BABYLON.TransformNode(uuid,scene)
	}

	create_text_3d(fragment,scene) {
		let uuid = fragment.uuid
		let art = fragment.art
	    const plane = BABYLON.MeshBuilder.CreatePlane("plane", { height: 4, width: 4 });

	    var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(plane);
	    advancedTexture.background = 'green'

	    const initialText = "This is some example text. \nIt's quite long, so will need to be displayed across multiple lines. \n\nIt also has several line breaks.";
	    // The "\n" in the text indicates a line break
	    // Line breaks are added by pressing 'return' when editing text

	    var inputTextArea = new BABYLON.GUI.InputTextArea('Example InputTextArea', initialText);
	    
	    inputTextArea.color = "white";
	    inputTextArea.fontSize = 48;

	    advancedTexture.addControl(inputTextArea);

		/*
					let gui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("myUI")

					var rect1 = new BABYLON.GUI.InputTextArea("input", "Some initial text")
				    rect1.width = 0.2;
				    rect1.height = "40px";
				    rect1.cornerRadius = 20;
				    rect1.color = "Orange";
				    rect1.thickness = 4;
				    rect1.background = "green";
				    rect1.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
				    rect1.top = "50px";
				    rect1.left = "50px";
					gui.addControl(rect1);

				    var text1 = new BABYLON.GUI.TextBlock()
				    text1.text = "Hello workkld";
				    text1.color = "white";
				    text1.height = 40;
				    text1.fontSize = 24;
					//  gui.addControl(text1);    

		*/

		/*
		    var rect1 = new BABYLON.GUI.Rectangle();
		    rect1.width = 0.2;
		    rect1.height = "40px";
		    rect1.cornerRadius = 20;
		    rect1.color = "Orange";
		    rect1.thickness = 4;
		    rect1.background = "green";
		    rect1.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
		    rect1.top = "50px";
		    rect1.left = "50px";
		    gui.addControl(rect1);   
		*/
		return new BABYLON.TransformNode(uuid,scene)
	}

	create_box(fragment,scene) {
		let uuid = fragment.uuid
		let art = fragment.art
		let mesh = 0

		// this appears to not allow physics so disable or now
		//mesh = BABYLON.Mesh.CreateGroundFromHeightMap(uuid,fragment.heightmap, 4, 4, 100, 0, 0.01, scene, false)
		//mesh = BABYLON.Mesh.CreateGround(uuid, 1, 1, 10,scene);
		if(fragment.walkable) {
			console.log("view: this object is a shadow receiver " + uuid)
			mesh = BABYLON.MeshBuilder.CreateGround("ground", {height: fragment.xyz[1], width: fragment.xyz[0], subdivisions: 8},scene)
			mesh.receiveShadows = true

			mesh = BABYLON.Mesh.CreateGroundFromHeightMap("ground", "/sys/assets/textures/heightMap.png", 2, 2, 100, 0, 20, scene, false);

			var groundMaterial = new BABYLON.StandardMaterial("ground", scene);
			groundMaterial.diffuseTexture = new BABYLON.Texture("/sys/assets/textures/ground.jpg", this.scene);
			groundMaterial.diffuseTexture.uScale = 4;
			groundMaterial.diffuseTexture.vScale = 4;
			groundMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
			mesh.material = groundMaterial;
			mesh.receiveShadows = true;


		} else {
			mesh = BABYLON.MeshBuilder.CreateBox(uuid,{},scene)
		}

		return mesh
	}

	create_sphere(fragment,scene) {
		return BABYLON.MeshBuilder.CreateSphere(fragment.uuid,{},scene)
	}

	create_line(fragment,scene) {
		let l = fragment.points
		let p1 = new BABYLON.Vector3(l[0][0],l[0][1],0)
		let p2 = new BABYLON.Vector3(l[1][0],l[1][1],0)
		let points = [p1,p2]
		return BABYLON.MeshBuilder.CreateLines(fragment.uuid,{points}, scene)
	}

	debug(mesh,scene) {

		const bv = mesh.getHierarchyBoundingVectors()
		const size = bv.max.subtract(bv.min)
		const bounds = new BABYLON.BoundingInfo(bv.min,bv.max)
		const center = bounds.boundingBox.centerWorld
		const box = BABYLON.Mesh.CreateBox("bounds",scene)
		box.scaling.copyFrom(size)
		box.position.copyFrom(center)

		box.parent = mesh.parent
		box.enableEdgesRendering()
		box.edgesWidth = 1.0
		box.material = new BABYLON.StandardMaterial("material",scene)
		box.material.alpha = 0.1
	}

	create_gltf(fragment,scene) {
		let uuid = fragment.uuid

		let node = new BABYLON.TransformNode(uuid,scene)

		if(fragment.debugbox) {
			node.material = this.babylon_material({alpha:0.3, art: fragment.debugbox })
		}

		let parts = fragment.art.split("/")
		let file = parts.pop()
		let path = parts.join("/") + "/"

		BABYLON.SceneLoader.ImportMesh(null,path,file, scene, (meshes,particles,skeletons) => {
			if(!meshes || !meshes.length || !meshes[0]) return

			// get mesh bounds - gltfs have arbitrary positions and sizes, i want them to 1,1,1 and at 0,0,0
			let mesh = meshes[0]
		    const bv = mesh.getHierarchyBoundingVectors()
		    const sz = { x: bv.max.x - bv.min.x, y: bv.max.y - bv.min.y, z: bv.max.z - bv.min.z }

		    // center mesh at 0,0,0 if desired
		    if(fragment.recenter) {
			    mesh.position.x -= ( bv.min.x + sz.x/2 )
			    mesh.position.y -= ( bv.min.y + sz.y/2 )
			    mesh.position.z -= ( bv.min.z + sz.z/2 )
			}

		    // scale mesh to 1,1,1 (workaround for transform compute order issue) - todo make optional
		    if(fragment.rescale) {
			    let extent = sz.x > sz.y ? sz.x : sz.y
			    extent = sz.z > extent ? sz.z : extent
			    extent = Math.sqrt ( extent * extent )
				let scale = new BABYLON.TransformNode(uuid,scene)
			    scale.scaling.x = 1.0 / extent;
			    scale.scaling.y = 1.0 / extent;
			    scale.scaling.z = 1.0 / extent;
			    mesh.parent = scale
			    mesh = scale
			}

		    // a bit of a hack to support fine grained adjustment since gltfs are so bonkers
		    if(fragment.adjust && fragment.adjust.xyz) {
				mesh.position.x = fragment.adjust.xyz[0]
				mesh.position.y = fragment.adjust.xyz[1]
				mesh.position.z = fragment.adjust.xyz[2]
			}
		    if(fragment.adjust && fragment.adjust.ypr) {
				mesh.rotation.x = fragment.adjust.ypr[0]
				mesh.rotation.y = fragment.adjust.ypr[1]
				mesh.rotation.z = fragment.adjust.ypr[2]
		    }

			// insert gltf into root node
			mesh.parent = node

			// add shadows
			if(scene.shadowGenerator) {
				node.shadow_was_created = 1
				let recurse = (m) => {
					if(m.isPickable) {
						scene.shadowGenerator.addShadowCaster(m)
						//console.log("view: adding shadow to " + m.id)
					}
					m.getChildMeshes(true,recurse)
				}
				recurse(mesh)
			}

			/*
			// pull out navigation info if desired - this is some test code
			let results = []
			this.scan_navmesh(mesh,results)

			// make these bi-directional
			if(results.length) {
				this.bidir(results)
				console.log(JSON.stringify(results))
			}
			*/

		})
		return node
	}

	/*

	this was a navigation experiment - it needs some more thinking
	can this be done in database instead? can database have enough introspection?
	should these be generated outside the app and loaded?

	bidir(results) {
		let hashed = {}
		results.forEach(result=>{hashed[result.uuid]=result})

		results.forEach(result=>{
			if(!result) { console.error("bad"); return }
			// visit dests of each source
			result.c.forEach(dest=>{
				// get dest and make sure it has a back link to source
				let d = hashed[dest]
				if(d == null) {
					console.error("bad " + dest)
				} else {
					let found = false 
					d.c.forEach(d2=>{
						if(d2 == result.uuid) found = true
					})
					if(!found) {
						d.c.push(result.uuid)
					}
				}
			})
		})
	}

	scan_navmesh(node,collection) {

		let n = node.name

		let i = n.indexOf("_WALK")
		if(i >=0 ) {

		    const bv = node.getHierarchyBoundingVectors()
		    const sz = { x: bv.max.x - bv.min.x, y: bv.max.y - bv.min.y, z: bv.max.z - bv.min.z }

			let x = node.position.x - ( bv.min.x + sz.x/2 )
			let y = node.position.y - ( bv.min.y + sz.y/2 )
			let z = node.position.z - ( bv.min.z + sz.z/2 )

			let parts = n.substring(i+5).split("_")

			let uuid = parts.shift()
			let c = parts

			collection.push({ xyz: [x,y,z], uuid, c })
		}

		let children = node.getChildren()
		children.forEach(child=>{
			this.scan_navmesh(child,collection)
		})

		return collection
	}
	*/

	create_sound(fragment,scene) {

		let node = new BABYLON.TransformNode(fragment.uuid,scene)

		let id = fragment.uuid + "/sound"
		let soundfile = '/sys/assets/horn.wav'

		var volume = 1
		var playbackRate = 1
		let loop = false
		let autoplay = false

		let sound = null

		let handler = () => {
			console.log("sound callback called")
			if(sound) {
				console.log("has sound")
				sound.attachToMesh(node)
			}
		}

		sound = new BABYLON.Sound(id, soundfile, scene, handler, { playbackRate, volume, loop, autoplay });

		return node
	}

	///
	/// manufacture a new a graphical artifact from an orbital fragment
	///

	create_node(fragment,scene) {
		let uuid = fragment.uuid
		let art = fragment.art
		switch(fragment.kind) {
			case "scene": return this.create_scene(fragment)
			case "sound": return this.create_sound(fragment,scene)
			case "textarea": return this.create_text(fragment,scene)
			case "ground":
			case "box": return this.create_box(fragment,scene)
			case "sphere": return this.create_sphere(fragment,scene)
			case "camera": return this.create_camera(fragment,scene)
			case "pointlight":
			case "directionallight":
			case "directionalight":
			case "spotlight":
			case "hemisphericlight":
			case "light": return this.create_light(fragment,scene)
			case "gltf": return this.create_gltf(fragment,scene)
			case "glb": return this.create_gltf(fragment,scene)
			case "line": return this.create_line(fragment,scene)
			default: return new BABYLON.TransformNode(uuid,scene)
		}
	}

	///
	/// apply changes from fragment to node
	///
	/// a concept of a context handle allows me to recover which users artifacts are being set for picking
	///
	/// TODO these could and should be optimized to only revise more carefully on actual changes
	///

	_fragment_merge(fragment,context_handle=0) {

		if(!fragment || !fragment.uuid) {
			let err = "view: bad fragment"
			console.error(err)
			console.error(fragment)
			throw err
		}

		let uuid = fragment.uuid

		// find scene to apply fragment to
		let scene = null
		if(fragment.scene) {
			scene = this.scenes_indexed[fragment.scene]
		} else {
			if(this.scenes.length) {
				scene = this.scenes[0]
			}
		}

		// get babylon node matching uuid if any
		let node = this.babylon_nodes[uuid] || 0

		// if there is a huge change then throw away babylon node
		if(node.fragment && node.fragment.hasOwnProperty("kind") && fragment.hasOwnProperty("kind") && node.fragment.kind != fragment.kind) {
			if(node) node.dispose()
			node = this.babylon_nodes[uuid] = 0
		}

		// guarantee that a babylon node exists
		if(!node) {
			if(!fragment.kind) {
				console.error(`view: fragment must have fragment kind is null ${fragment.kind} ${fragment.uuid}`)
				console.log(fragment)
				return null
			}
			if(fragment.kind != "scene" && scene == null) {
				console.warn("view: no scene - forcing one to exist")
				let name = fragment.scene ? fragment.scene : "scene"
				scene = this.create_node({uuid:name,kind:"scene",network:false})
			}
			node = this.babylon_nodes[uuid] = this.create_node(fragment,scene)
			if(!node) {
				console.error("view: could not make node " + fragment.uuid)
				return null
			}
			node.kind = fragment.kind
			node.uuid = node.id = uuid
			//node._context_handle = view
			//console.log("view: spawned node uuid=" + uuid)
		} else {
			//console.log("view: updated node uuid=" + uuid)
		}

		// get merged new changes from user on top of our previous state
		fragment = { ...(node.fragment ? node.fragment : {}), ...fragment}

		// if there is no parent then force detach the node
		if(!fragment.parent_uuid) {
			if(node.parent) {
				node.parent = null
			}
		}
		// else try hard to find and bind to parent
		else {
			let parent = this.babylon_nodes[fragment.parent_uuid]
			if(!parent) {
				console.error("view: error for node " + node.uuid + " cannot find parent " + fragment.parent_uuid)
			} else {
				if(node.parent && node.parent.uuid == parent.uuid) {
					//console.log("view: parent is correct")
				} else {
					node.parent = parent
					//console.log("view: set parent for " + node.uuid)
				}
			}
		}

		// update props
		this._update_props(node,fragment,scene)

		// update our state tracking
		node.fragment = fragment

		return node
	}

	_update_props(node,fragment,scene) {

		if(fragment.kind == "scene") return

		// TODO at the moment this logic is not sensitive to subtle material changes
		if(fragment.material && !fragment.material_was_updated) {
			fragment.material_was_updated = 1
			node.material = this.babylon_material(fragment.material,scene)
		}

		// revise rotation?
		if(fragment.ypr && node.rotation && !(node.rotation.x == fragment.ypr[0] && node.rotation.y == fragment.ypr[1] && node.rotation.z==fragment.ypr[2])) {
			node.rotation.x = fragment.ypr[0]
			node.rotation.y = fragment.ypr[1]
			node.rotation.z = fragment.ypr[2]
		}

		// revise position?
		if(fragment.xyz && node.position && !(node.position.x == fragment.xyz[0] && node.position.y == fragment.xyz[1] && node.position.z==fragment.xyz[2])) {
			node.position.x = fragment.xyz[0]
			node.position.y = fragment.xyz[1]
			node.position.z = fragment.xyz[2]
		}

		// revise scale?
		if(fragment.whd && node.scaling && !(node.scaling.x == fragment.whd[0] && node.scaling.y == fragment.whd[1] && node.scaling.z==fragment.whd[2])) {
			node.scaling.x = fragment.whd[0]
			node.scaling.y = fragment.whd[1]
			node.scaling.z = fragment.whd[2]
		}

		// revise lookat? have this last since it depends on camera state
		if(fragment.lookat && !(node.lookat && node.lookat.x == fragment.lookat[0] && node.lookat.y == fragment.lookat[1] && node.lookat.z==fragment.lookat[2])) {
			// todo - this is a bit of a hack to operate directly on the camera - it should ideally be node set target
			if(!node.setTarget) {
				console.error("node is not a camera??? " + node.kind + " " + node.uuid)
				console.error(node)
			} else {
				node.setTarget(new BABYLON.Vector3(...fragment.lookat))
			}
			node.lookat = fragment.lookat
		}

		if(this.PHYSICS) {

			// add physics *after* setting pose because altering position throws off physics
			if(fragment.physics && !node.physics) {
				let mass = fragment.physics.mass || 0
				let restitution = fragment.physics.restitution || 0.9
				node.physics = new BABYLON.PhysicsImpostor(node, BABYLON.PhysicsImpostor.BoxImpostor, { mass: mass, restitution: restitution }, scene);
			}

			// add a physics impulse to an object this frame right now
			if(fragment.impulse && node.physics) {
				node.physics.applyImpulse(new BABYLON.Vector3(fragment.impulse[0],fragment.impulse[1],fragment.impulse[2]), node.getAbsolutePosition())
			}
		}

		// revise shadow if this is an object not a scene
		if(scene && scene.shadowGenerator && !node.shadow_was_created) {
			node.shadow_was_created = 1
			if(fragment.hasOwnProperty("shadow")) {
				scene.shadowGenerator.addShadowCaster(node)
				console.log("...view: item casts a shadow " + node.uuid)
			} else {
				// deal with removals
				// scene.shadowGenerator.removeShadowCaster(node)
				// console.log("...view: item has no shadow " + node.uuid)
			}
		}

	}

	/*
	interpolate(node,fragment,scene) {
		// TBD improve
		// seek to target if no physics
		// todo don't pop but instead interpolate
		if(fragment.impulse && !node.physics) {
			node.position.x += fragment.impulse[0]
			node.position.y += fragment.impulse[1]
			node.position.z += fragment.impulse[2]
		}
	}*/


}
