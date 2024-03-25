
import "./libs/babylon.js"
import "./libs/babylonjs.loaders.min.js"
import "./libs/babylonjs.materials.min.js"
import "./libs/cannon.js"

class Volume {

	shadowGenerator = 0
	babylon_nodes = {}

	center_debug(mesh) {
	    const bv = mesh.getHierarchyBoundingVectors()
	    const sz = { x: bv.max.x - bv.min.x, y: bv.max.y - bv.min.y, z: bv.max.z - bv.min.z }
		let box = new BABYLON.Mesh.CreateBox("box", 1, this.scene);
		let mat = new BABYLON.StandardMaterial("mat", this.scene);
		mat.alpha = 0;
		box.material = mat;
		box.scaling = new BABYLON.Vector3(sz.x, sz.y, sz.z);
		box.position = new BABYLON.Vector3((bv.min.x + bv.max.x) / 2, (bv.min.y + bv.max.y) / 2, (bv.min.z + bv.max.z) / 2);
		box.enableEdgesRendering();    
		box.edgesWidth = 2.0;
	}

	constructor(parent) {

		let resizable = false
		let canvas = null

		if(!parent) {
			resizable = true
			parent = canvas = document.createElement("canvas")
			canvas.width = window.innerWidth
			canvas.height = window.innerHeight
			document.body.appendChild(canvas)
		} else {
			canvas = document.createElement("canvas")
			canvas.width = parent.clientWidth
			canvas.height = parent.clientHeight
			canvas.style.cssText += 'position:relative;'
			parent.insertBefore(canvas,parent.children[0])
		}

		let canvas2d = null
		if(false) {
			let canvas2d = document.createElement("canvas")
			let context2d = canvas2d.getContext("2d")
			canvas2d.width =canvas.width
			canvas2d.height = canvas.height
			parent.appendChild(canvas2d)
		}

		const resize = () => {
			if(canvas) {
				canvas.width = window.innerWidth
				canvas.height = window.innerHeight
			}
			if(canvas2d) {
				canvas2d.width =canvas.width
				canvas2d.height = canvas.height
			}
		}

		if(resizable) {
			resize()
		}


		if(resizable) {
			window.addEventListener('resize', resize)
		}

		const engine = new BABYLON.Engine(canvas, true)
		const scene = new BABYLON.Scene(engine)

		this.scene = scene

		var gravityVector = new BABYLON.Vector3(0,-9.81, 0);
		var physicsPlugin = new BABYLON.CannonJSPlugin();
		scene.enablePhysics(gravityVector, physicsPlugin);

		//const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 3, new BABYLON.Vector3(0, 0, 0))
		//camera.attachControl(canvas, true)
		//const camera = new BABYLON.FreeCamera("FreeCamera", new BABYLON.Vector3(0, 1, -15), scene);

		var camera = new BABYLON.UniversalCamera("UniversalCamera", new BABYLON.Vector3(0, 5, -10, scene) )
		camera.setTarget(BABYLON.Vector3.Zero())
		camera.attachControl(canvas, true)
		camera.inputs.addMouseWheel()
		//camera.inputs.attached["mousewheel"].wheelYMoveRelative = BABYLON.Coordinate.Y;
		// camera.inputs.attached["mousewheel"].wheelPrecisionY = -1;
		// camera.attachControl(true);

		this.camera = camera

		// hack for now ... this really needs to be removed @todo
		window.volume = this

		var renderLoop = function () {
			scene.render()
		};
		engine.runRenderLoop(renderLoop);

		if(resizable) {
			window.addEventListener("resize",engine.resize.bind(engine))
		}

	}

	update_camera(position,target) {
		if(!this.camera) return
		this.camera.position = position
		this.camera.setTarget(target)
	}

	babylon_material_helper(fragment) {

		let mat = new BABYLON.StandardMaterial("material");

		if(fragment.rgba) {
			let a = ((fragment.rgba >> 24) & 0xff) / 256.0
			let r = ((fragment.rgba >> 16) & 0xff) / 256.0
			let g = ((fragment.rgba >> 8) & 0xff) / 256.0
			let b = ((fragment.rgba) & 0xff) / 256.0
			mat.diffuseColor = new BABYLON.Color3(r,g,b)
		}

		if(fragment.art) {
			mat.diffuseTexture = new BABYLON.Texture(fragment.art, this.scene)
			mat.diffuseTexture.uScale = 1
			mat.diffuseTexture.vScale = 1
			if(fragment.alpha) mat.alpha = fragment.alpha
			mat.specularColor = new BABYLON.Color3(0, 0, 0)
		}

		// deal with dynamic material (this is to allow some simple scribbling and words on textures)

		if(!fragment.props) return mat

		var texture = new BABYLON.DynamicTexture("dynamic texture", {width:512, height:256}, this.scene)
		var context = texture.getContext()
	
		mat.diffuseTexture = texture;

		// allow in painting of text

		fragment.props.forEach(child=>{
			switch(child.kind) {
				case "text":
					let text = child.text ? child.text : "nothing"
					let font = child.font ? child.font : "bold 44px monospace";
					texture.drawText(text, 75, 135, font, "green", "white", true, true);
				// case rect
				// case path
				default:
			}
		})

		return mat
	}

	babylon_create_light(fragment) {

		let uuid = fragment.uuid
		let art = fragment.art

		// light component of volume

		if(fragment.transform && fragment.transform.xyz) {
			let lightpos = new BABYLON.Vector3(...fragment.transform.xyz);
			let light = new BABYLON.PointLight(fragment.uuid, lightpos, this.scene);
			light.position = lightpos
			light.intensity = fragment.intensity || 2.5;

			var lightSphere = BABYLON.Mesh.CreateSphere("sphere", 10, 0.1, this.scene);
			lightSphere.position = light.position;
			lightSphere.material = new BABYLON.StandardMaterial("light", this.scene);
			lightSphere.material.emissiveColor = new BABYLON.Color3(1, 1, 0);
			light.falloffType = 2

			if(!this.shadowGenerator) {
				this.shadowGenerator = new BABYLON.ShadowGenerator(4096, light)
				this.shadowGenerator.getShadowMap().refreshRate = BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
			}

			return light
		}

		const light = new BABYLON.HemisphericLight(uuid, new BABYLON.Vector3(0, 1, 0))
		return light
	}

	babylon_create_geometry(fragment) {

		let uuid = fragment.uuid
		let art = fragment.art

console.log("************************************************************************* babylon loading geometry",fragment)
		
		// geometry component of volume

		switch(fragment.geometry) {
			case "camera": return this.camera
			case "transform": return new BABYLON.TransformNode()
			case "ground":
			case "box":
				{
					let mesh = 0
					if(false && fragment.heightmap) {
						// this appears to not allow physics so disable or now
						// get width and height todo
		  				//mesh = BABYLON.Mesh.CreateGroundFromHeightMap(uuid,fragment.heightmap, 4, 4, 100, 0, 0.01, scene, false)
		  				//mesh = BABYLON.Mesh.CreateGround(uuid, 1, 1, 10, scene);
					} else {
						mesh = BABYLON.MeshBuilder.CreateBox(uuid)
					}

					if(fragment.receiveShadows) mesh.receiveShadows = true

					return mesh
				}

			case "sphere": return BABYLON.MeshBuilder.CreateSphere(uuid)

			case "gltf":
			default:
				if(fragment.geometry && fragment.geometry.length > 5) {
					let root = new BABYLON.CreateBox(uuid)
					art = fragment.geometry
					name = fragment.geometry.includes(".glb") ? "" : "scene.gltf"
					BABYLON.SceneLoader.ImportMesh(null,art, name, this.scene, (meshes,particles,skeletons) => {
						if(meshes) {
							//console.log("volume: loaded ",art,name)
							let middle = new BABYLON.TransformNode(uuid+"_trans")
							middle.parent = root
							if(fragment.adjust) {
								middle.position.y = fragment.adjust.xyz[1]
								middle.rotation.y = fragment.adjust.ypr[1]
							}
							meshes[0].parent = middle
							root.isVisible = false
							let recurse = (m) => {
								if(this.shadowGenerator && m.isPickable) {
									this.shadowGenerator.addShadowCaster(m)
								}
								m.getChildMeshes(true,recurse)
							}
							meshes.forEach(recurse)
							//center_debug(meshes[0])
						}

					})
					return root
				}
		}

		return new BABYLON.TransformNode(uuid)
	}

	babylon_sdl(fragment,fragment_parent) {

		const uuid = fragment.uuid
		if(!uuid) {
			console.error("volume: illegal fragment no uuid?",fragment)
			return
		}

		let node = this.babylon_nodes[uuid] || 0

		if(node && node.light_was_updated && !fragment.light) {
			// manually compare entire entity for changes; later we can rely on reactions to changes
			// delete this node
			// node = null
			// delete babylon_nodes[uuid]
			// console.log("volume: deleted light",entity)
		}

		if(node && node.geometry_was_updated && !fragment.geometry) {
			// manually compare entire entity for changes; later we can rely on reactions to changes
			// delete 
			// node = null
			// delete babylon_nodes[uuid]
			// console.log("volume: deleted geometry",entity)
		}

		if(!node) {

			if(fragment.camera) {
				return this.camera
			}
			if(fragment.light) {
				node = this.babylon_nodes[uuid] = this.babylon_create_light(fragment)
				node.light_was_updated = true
			} else if(fragment.geometry) {

				node = this.babylon_nodes[uuid] = this.babylon_create_geometry(fragment)
				node.geometry_was_updated = true
			} else {
				node = new BABYLON.TransformNode(uuid)
			}
			node.id = uuid
		}

		// revise parent attachment?
		let parent = fragment_parent ? this.babylon_nodes[fragment_parent.uuid] : 0
		if((!node.parent && !parent) || (node.parent && parent && node.parent.id == parent.id)) {
		} else {
			node.parent = parent
		}

		// set shadow status once for now
		// @todo allow changes
		if(this.shadowGenerator && !this.shadow_was_updated) {
			node.shadow_was_updated = 1
			fragment.hasOwnProperty("shadow") ? this.shadowGenerator.addShadowCaster(node) : this.shadowGenerator.removeShadowCaster(node);
		}

		// set material once for now
		// @todo allow changes
		if(fragment.material && !node.material_was_updated) {
			node.material_was_updated = 1
			node.material = this.babylon_material_helper(fragment.material)
		}

		if(fragment.transform) {
			const t = fragment.transform

			// revise rotation?
			if(t.ypr && node.rotation && !(node.rotation.x == t.ypr[0] && node.rotation.y == t.ypr[1] && node.rotation.z==t.ypr[2])) {
				node.rotation.x = t.ypr[0]
				node.rotation.y = t.ypr[1]
				node.rotation.z = t.ypr[2]
			}

			// revise position?
			if(t.xyz && node.position && !(node.position.x == t.xyz[0] && node.position.y == t.xyz[1] && node.position.z==t.xyz[2])) {
				node.position.x = t.xyz[0]
				node.position.y = t.xyz[1]
				node.position.z = t.xyz[2]
			}

			// revise scale?
			if(t.whd && node.scaling && !(node.scaling.x == t.whd[0] && node.scaling.y == t.whd[1] && node.scaling.z==t.whd[2])) {
				node.scaling.x = t.whd[0]
				node.scaling.y = t.whd[1]
				node.scaling.z = t.whd[2]
			}
		}

		// revise lookat? have this last since it depends on camera state
		// todo - this is a bit of a hack to operate directly on the camera - it should ideally be node set target
		if(fragment.transform && fragment.transform.lookat && !(node.lookat && node.lookat.x == fragment.transform.lookat[0] && node.lookat.y == fragment.transform.lookat[1] && node.lookat.z==fragment.transform.lookat[2])) {
			if(node.setTarget)
				node.setTarget(new BABYLON.Vector3(...fragment.transform.lookat))
			node.lookat = fragment.transform.lookat
		}

		// seek to target if no physics
		// @todo rethink this
		if(fragment.impulse && !node.physics) {
			node.position.x += fragment.impulse[0]
			node.position.y += fragment.impulse[1]
			node.position.z += fragment.impulse[2]
		}

		// add physics after setting pose because altering position by force throws off physics
		if(fragment.physics && !node.physics) {
			let mass = fragment.physics.mass || 0
			let restitution = fragment.physics.restitution || 0.9
	// @todo physics broke?
	//		node.physics = new BABYLON.PhysicsImpostor(node, BABYLON.PhysicsImpostor.BoxImpostor, { mass: mass, restitution: restitution }, scene);
		}

		// add a physics impulse to an object this frame right now
		if(fragment.impulse && node.physics) {
	//		console.log(fragment.impulse)
	//		node.physics.applyImpulse(new BABYLON.Vector3(fragment.impulse[0],fragment.impulse[1],fragment.impulse[2]), node.getAbsolutePosition())
		}

		return node
	}
}


/////////////////////////////////////////////////////////////////////////////////////////////////

const volumes = {}

function volume_manager(entity) {

	if(!entity) return null

	// use existing target?
	let id = entity.volume
	let volume = volumes[id]
	if(volume) return volume

	// only create a volume if a surface is specified
	if(!entity.surface) return null

	// find dom node to attach to?
	let parent = document.getElementById(id)

	// if no target is found then take over the whole screen
	if(!parent) {
		parent = document.createElement("div")
		parent.style = "width:100%;height:100%;padding:0px;margin:0px;position:absolute;top:0;left:0"
		parent.id = id
		document.body.appendChild(parent)
	} else {
		console.log("volume found parent")
	}

	// attach
	parent.volume = volume = volumes[id] = new Volume(parent)
	return volume

}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Volume Component
///
///	implements a reactive view of objects with specific components
///	3d rendering, collision support, physics, animation, sequencing, effects, controls, avatars
///
/// @todo this is bulky as a concept; better to observe transform, geometry, children and so on directly
/// @todo children may be a general sys capability/component
/// @todo use full screen strategy from volume-3js to remove ugly white border
///
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function volume_react(entity,parent=null) {
	const volume = volume_manager(entity)
	if(!volume) return
	volume.babylon_sdl(entity,parent)
	if(entity.children) {
		entity.children.forEach(child=>{
			volume_react(child,entity)
		})
	}
}

const volume_observer = {
	uuid: '/orbital/volume/volume-observer-babylon3d',
	about: 'volume observer using babylon3d',
	query: { volume: true }, // @todo i need better smarter matching on queries to reduce the labor the observer below
	observer: (args) => {
		if(args.blob.name=='tick') return
		if(!args || !args.entity || !args.entity.volume) return
		volume_react(args.entity,null)
	}
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// volume picker component
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*

window.addEventListener("click", function (evt) {
	var pickResult = scene.pick(evt.clientX, evt.clientY)
	if(pickResult && pickResult.pickedMesh && pickResult.pickedMesh) {
		// climb up to pickable or fail
		let node = pickResult.pickedMesh
		//for(;node;node=node.parent) {
		//	if(node.fragment && node.fragment.pickable) break
		//}
		// publish picking event
		//if(node && node.fragment && node.fragment.pickable && node._view_backhandle) {
		//	node._view_backhandle._publish({event:"pick",fragment:node.fragment})
		//}
	}
})

*/


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// exported manifest for this module
///
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const manifest = [ volume_observer ]
