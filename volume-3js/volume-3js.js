
//
// must bring in meshoptdecoder by injection for now - @todo improve
//
// import { MeshOptDecoder } from '@meshoptdecoder' 
// <script src="https://cdn.jsdelivr.net/npm/meshoptimizer@0.20.0/meshopt_decoder.js"></script>
//

if(typeof document !== 'undefined') {
	const im = document.createElement('script')
	im.src = "/orbital/volume-3js/meshopt_decoder.js"
	document.head.append(im)
}

//
// note regarding use of import maps:
//
// we rely on hardcoded importmaps for 'three' because we also pull in third party libraries that rely on this and that we cannot change
// there's a very poorly designed 'feature' in javascript that importmaps cannot be ammended at runtime after javascript modules load
//

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { VRM, VRMUtils, VRMHumanoid, VRMLoaderPlugin } from './three-vrm.module.js'

//
// GLTF Loader helpers
//

const loader = new GLTFLoader()

loader.setCrossOrigin('anonymous')

if(typeof DRACOLoader !== 'undefined') {
	const dracoLoader = new DRACOLoader()
	dracoLoader.setDecoderPath("@orbital/volume-3js/dracolibs/")
	loader.setDRACOLoader(dracoLoader)
}

if(typeof KTX2Loader !== 'undefined') {
	const ktx2Loader = new KTX2Loader()
	ktx2Loader.setTranscoderPath("@orbital/volume-3js/ktx2loaderlibs/")
	//ktx2Loader.detectSupport(this.renderer) // annoying
	loader.setKTX2Loader(ktx2Loader)
}

if(typeof MeshoptDecoder !== 'undefined') {
	loader.setMeshoptDecoder( MeshoptDecoder )
}

loader.register((parser) => { return new VRMLoaderPlugin(parser) })


///
/// A volume represents a 3d scene with objects - there can be more than one on a given web page - a default is used if none specified
///

class VolumeManager {

	uuid = 0
	entities = {}

	//
	// path and resource discovery helper
	//
	// there is a problem with knowing where assets are - manifests can be anywhere - and the entire app can be in a subfolder
	// for now i let the caller specify a @/ to indicate that they want the root of the app space
	// that root should always be about 3 folders up from this file - because orbital is typically included as a child per app
	// sys also may store a map of where the current local application actually is anchored and we may want to use that @todo
	//

	fixup_path(path) {
		if(path.startsWith('@/')) {
			let parts = new URL(import.meta.url).pathname.split('/')
			parts.pop()
			parts.pop()
			parts.pop()
			let more = path.split('/'); more.shift()
			parts = [ ...parts, ...more ]
			path = parts.join('/')
		}

		return path
	}

	///
	/// init 3js scene
	///

	constructor (parentDiv,opt = {}) {

		//
		// merge options if any
		//

		this.opt = {
			cameraView: 'full',
			cameraDistance: 0,
			cameraX: 0,
			cameraY: 0,
			cameraRotateX: 0,
			cameraRotateY: 0,
			cameraRotateEnable: true,
			cameraPanEnable: false,
			cameraZoomEnable: true,
		}
		Object.assign( this.opt, opt || {} )

		this.parentDiv = parentDiv

		//
		// start renderer
		//

		const renderer = this.renderer = new THREE.WebGLRenderer({
			antialias: true,
			//preserveDrawingBuffer: true,
			alpha: true
		})
		renderer.autoClearColor = false
		renderer.setClearColor(0xffffff, 0);
		renderer.setSize(parentDiv.clientWidth, parentDiv.clientHeight)
		renderer.setPixelRatio(window.devicePixelRatio)
		if(false) {
			this.renderer.outputColorSpace = THREE.SRGBColorSpace
			this.renderer.outputEncoding = THREE.sRGBEncoding
			this.renderer.toneMapping = THREE.ACESFilmicToneMapping
			this.renderer.shadowMap.enabled = false
			this.renderer.useLegacyLights = false
		}
		parentDiv.append(renderer.domElement)
		new ResizeObserver(this._resize.bind(this)).observe(this.parentDiv)

		//
		// create a default scene with a default camera and default controls for now
		//

		const scene = this.scene = new THREE.Scene();
		scene.background = new THREE.Color(0xffffff);

		if(true) {
			const pmremGenerator = new THREE.PMREMGenerator( this.renderer )
			pmremGenerator.compileEquirectangularShader()
			this.scene.environment = pmremGenerator.fromScene( new RoomEnvironment() ).texture
		}

		const fov = 35
		const aspect = parentDiv.clientWidth / parentDiv.clientHeight
		const near = 0.01
		const far = 100
		const camera = this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far)
		//scene.add(camera) <- not needed
		scene.camera = camera
		scene.parentDiv = parentDiv

		if(true && camera) {
			this.controls = new OrbitControls( camera, this.renderer.domElement )
			this.controls.enableZoom = this.opt.cameraZoomEnable
			this.controls.enableRotate = this.opt.cameraRotateEnable
			this.controls.enablePan = this.opt.cameraPanEnable
			this.controls.minDistance = 0.1
			this.controls.maxDistance = far
			this.controls.autoRotateSpeed = 0
			this.controls.autoRotate = false
		}

		this._camera_retarget()

		//
		// create a default light so we can see what is going on - can remove later if one shows up from data driven sources
		//

		const light = this.light = new THREE.DirectionalLight( 0xffffff, Math.PI );
		light.position.set( 1.0, 1.0, -1.0 ).normalize();
		scene.add( light );

		//
		// helpers
		//

		//const gridHelper = new THREE.GridHelper( 10, 10 );
		//scene.add( gridHelper );

		//const axesHelper = new THREE.AxesHelper( 5 );
		//scene.add( axesHelper );

	}

	///
	/// advance all 3d ojects managed here over time
	///

	step(time=0,delta=0) {

		Object.values(this.entities).forEach(entity=> {
			this._animation_update(entity.volume,time,delta)
		})

		if (this.controls) {
			this._camera_hide_near_target()
			this.controls.update()
		}

		this.renderer.render( this.scene, this.camera )
	}

	//
	// deal witih browser window resizing
	//

	_resize() {
		this.camera.aspect = this.parentDiv.clientWidth / this.parentDiv.clientHeight
		this.camera.updateProjectionMatrix()
		this.renderer.setSize( this.parentDiv.clientWidth, this.parentDiv.clientHeight )
		if(this.controls)this.controls.update()
		this.renderer.render( this.scene, this.camera )
	}

	//
	// work around some issues with wanting orbit and nav at the same time - improve later
	//

	_camera_retarget(node=null) {

		const camera = this.camera

		if(!node) {
			camera.distance = 5
			camera.height = 1.5
			camera.targetHeight = 1.5
			camera.target = new THREE.Vector3(0,camera.targetHeight,0)
			camera.position.set(camera.target.x,camera.target.y,camera.target.z+camera.distance)
			let delta = camera.targetHeight - camera.height
			camera.lookAt(camera.target.x,camera.target.y-delta,camera.target.z)
			return
		}

		// get distance prior to the object moving and after any control or other effects
		let distance = camera.position.distanceTo( camera.target )

		// update target
		camera.target.x = node.position.x
		camera.target.y = node.position.y + camera.targetHeight
		camera.target.z = node.position.z

		// put camera behind target
		const v = new THREE.Vector3(0,0,-distance).applyQuaternion(node.quaternion)
		const p = node.position.clone().add(v)
		camera.position.set(p.x,p.y+camera.height,p.z)

		// update lookat
		camera.lookAt(camera.target.x,camera.target.y,camera.target.z)

		// adjust control lookat
		if(this.controls) {
			this.controls.target.set(camera.target.x,camera.target.y,camera.target.z)
		}

		node.visible = true
		this.latchNode = node
	}

	//
	// hide the main player if the camera is close to them
	//

	_camera_hide_near_target() {
		if(!this.latchNode) return
		const camera = this.camera
		let distance = camera.position.distanceTo( camera.target )
		this.latchNode.visible = distance < 2 ? false : true
	}

	//
	// as a side task load animations one at a time that are requested and then latch as complete using volume._clips
	// @todo later detect changes
	//

	async _animations_lazy_load(volume) {
		const clips = {}
		for(let filename of volume.animations) {
			try {
				if(filename.endsWith(".json")) {
					const response = await fetch(this.fixup_path(filename))
					const json = await response.json()
					json.forEach((animation) => {
						if (animation.tracks.length <= 0) {
							console.error("volume-3js: animation track empty",filename,animation)
						} else {
							let clip = THREE.AnimationClip.parse(animation)
							clips[clip.name] = clip
							console.log("volume-3js: registered json animation named:",clip.name)
						}
					})
				} else if(filename.endsWith(".glb") || filename.endsWith(".gltf")) {
					let gltf = await loader.loadAsync( this.fixup_path(filename) )
					for(let clip of gltf.animations) {
						clips[clip.name] = clip
						console.log("volume-3js: registered animation named:",clip.name)
					}
				} else {
					console.error("volume-3js: unsure how to load animation named",filename)
				}
			} catch(err) {
				console.error("volume-3js: cannot load animation file",this.fixup_path(filename),err)
				continue
			}
		}
		volume._clips = clips
	}

	//
	// update anims every frame if any
	//

	_animation_update(volume,time,delta) {

		if(!volume._node || !volume._clips) return

		if(volume._mixer) {
            volume._mixer.update(delta/1000);
        }

		if(volume.animation == volume._animation_previous) return

		// force mixer up
		if(!volume._mixer) {
			volume._mixer = new THREE.AnimationMixer(volume._node)
		}

		// fade out previous
		if(volume._animation_clip) {
			volume._mixer.clipAction(this._animation_clip).fadeOut(0.5)
			volume._animation_clip = null
		}

		// done?
		if(!volume.animation || !volume.animation.length) {
			volume._animation_previous = volume.animation
			return
		}

		// apply new found
		Object.entries(volume._clips).forEach( ([k,v])=>{
			if(k.includes(volume.animation)) {
				volume._animation_clip = v
			}
		})

		if(volume._animation_clip) {
			// looponce, looppingpong, looprepeat -> could expose these
			volume._mixer.clipAction(volume._animation_clip).reset().fadeIn(0.5).setLoop(THREE.LoopRepeat,10).play()
			volume._animation_previous = volume.animation
	    }

	}

	//
	// observe changes to volume geometry state and make sure the display reflects those changes
	//

	async _update_geometry(volume) {

		if(volume.light && !volume._node) {
			// @todo improve - this is just set once and clearly should be more reactive
			volume._node = this.light
		}

		else if(volume.camera && !volume._node) {
			// @todo improve - this is just set once and clearly should be more reactive
			volume._node = this.camera
		}

		// assign geometry and load art
		// @todo this runs once only for now improve later
		// @todo detect dynamic changes to this string later and delete previous; this is just a quick hack to get some art assets loaded up for now

		else if( volume.geometry &&
				!volume._node &&
				!volume._node_tried_load &&
				(volume.geometry.endsWith(".glb") || volume.geometry.endsWith(".gltf") || volume.geometry.endsWith(".vrm") )
		) {
			volume._node_tried_load = true

			const path = this.fixup_path(volume.geometry)

			console.log("volume-3js: loading",volume.geometry,path)

			const gltf = await loader.loadAsync( path )

			if(!gltf || !gltf.scene) {
				console.error("volume-3js: cannot load",volume.geometry)
				return
			}

			// specifically force these not to be culled
			gltf.scene.traverse((child) => { if ( child.type == 'SkinnedMesh' ) {  child.frustumCulled = false; } })

			// remember the gltf here for now
			volume._gltf = gltf

			// remember the node here for now
			volume._node = gltf.scene

			// also advise the volume about the camera - this may need rethinking @todo
			volume._camera = this.camera

			// we have to distinguish between ordinary gltfs and vrms
			if(!gltf.userData || !gltf.userData.vrm) {
				this.scene.add(gltf.scene)

				// keep track of any animations for later
				if(gltf.animations) {
					gltf.scene.animations = gltf.animations
				}

			} else {

				// vrm models are rotated? correct this
				let vrm = gltf.userData.vrm

				// this is needed for vrm 0.0 rigs only - improve later or force use of vrm 1.0
				if(true) {
					const bones = vrm.humanoid.rawHumanBones
					vrm.humanoid.normalizedHumanBonesRoot.removeFromParent()
					bones.hips.node.rotateY(Math.PI)
					vrm.humanoid = new VRMHumanoid(bones)
					vrm.update(100)
				}

				volume._vrm = gltf.scene._vrm = gltf._vrm = gltf.userData.vrm = vrm

				//console.log("volume-3js: loaded vrm",vrm)
				// calling these functions greatly improves the performance (but collides with optimizers)
				//VRMUtils.removeUnnecessaryVertices( gltf.scene );
				//VRMUtils.removeUnnecessaryJoints( gltf.scene );

				vrm.scene.traverse( ( obj ) => { obj.frustumCulled = false })
				this.scene.add(vrm.scene)
			}

			// remember animations if any found
	        if(gltf.animations) {
	        	volume._clips = {}
	        	for(let clip of gltf.animations) {
	        		console.log("volume-3js: noticed an animation in the geometry file",clip.name)
	        		volume._clips[clip.name]=clip
	        		volume.animation=clip.name
	        	}
	        }

	        // also load explicit animations if any
	        if(volume.animations) {
				this._animations_lazy_load(volume)
			}
		}
	}

	_update_pose(volume) {

		if(!volume.transform) {
			volume.transform = { xyz:[0,0,0], ypr:[0,0,0], whd:[0,0,0]}
		}

		if(!volume._node) {
			console.warn("volume-3js - entity missing props",volume)
			return
		}

		const transform = volume.transform
		const node = volume._node

		// for now set the xyz and ypr to target - @todo introduce real interframe update smoothing
		if(transform.target_xyz) transform.xyz = transform.target_xyz
		if(transform.target_ypr) transform.ypr = transform.target_ypr

		// if ypr has changed then set it
		// yaw pitch and roll are not mapped correctly to xyz @todo
		if(transform.ypr && node.rotation && !(node.rotation.x == transform.ypr[0] && node.rotation.y == transform.ypr[1] && node.rotation.z==transform.ypr[2])) {
			node.rotation.x = transform.ypr[0]
			node.rotation.y = transform.ypr[1]
			node.rotation.z = transform.ypr[2]
		}

		// if position has changed then set it
		if(transform.xyz && node.position && !(node.position.x == transform.xyz[0] && node.position.y == transform.xyz[1] && node.position.z==transform.xyz[2])) {
			node.position.x = transform.xyz[0]
			node.position.y = transform.xyz[1]
			node.position.z = transform.xyz[2]
		}

		// update scale?
		if(transform.whd && node.scale && !(node.scale.x == transform.whd[0] && node.scale.y == transform.whd[1] && node.scale.z==transform.whd[2])) {
			node.scale.x = transform.whd[0]
			node.scale.y = transform.whd[1]
			node.scale.z = transform.whd[2]
		}

		// 

		// revise lookat? have this last since it depends on camera state
		// todo - this is a bit of a hack to operate directly on the camera - it should ideally be node set target
		//if(transform.lookat && !(node.lookat && node.lookat.x == transform.lookat[0] && node.lookat.y == transform.lookat[1] && node.lookat.z==transform.lookat[2])) {
		//	//if(node.setTarget) node.setTarget(new BABYLON.Vector3(...volume.transform.lookat))
		//	node.lookat = transform.lookat
		//}

		// set position
		// @todo only if changed
		// @todo consolidate _vrm and _gltf - test if i can use node for vrm? 
		// @todo allow multiple cameras
		// @todo consolidate the concepts here - rather than special treatment
		// @todo allow anything to lookat anything

		if(volume.camera) {
			if(transform.lookat) {
				this.camera.lookAt(...transform.lookat)
				if(this.controls) this.controls.target.set(...transform.lookat)
			}
			if(transform.xyz) {
				this.camera.position.set(...transform.xyz)
			}
		}
		else if(transform.xyz) {
			if(volume._vrm) {
				const x = transform.xyz[0]
				const y = transform.xyz[1]
				const z = transform.xyz[2]
				volume._vrm.scene.position.set(x,y,z)
			}
			else if(volume._node) {
				const x = transform.xyz[0]
				const y = transform.xyz[1]
				const z = transform.xyz[2]
				volume._node.position.set(x,y,z)
			}
		}

		if(volume.camera_follow) {
			this._camera_retarget(volume._node)
		}

	}

	//
	// deal with changes to entities that have volumes
	//

	async resolve(blob,parent=null) {

		// ignore invalid
		if(!blob.uuid) {
			console.warn('volume-3js - blob has no uuid',blob)
			return
		}

		// stuff this in for now
		blob.volume.uuid = blob.uuid

		// for now clone/copy volume component state ourselves
		// @todo may only need to track the volume component not the whole thing!
		let entity = this.entities[blob.uuid]
		if(!entity) {
			entity = this.entities[blob.uuid] = blob
		} else {
			const volume = { ...entity.volume, ...blob.volume }
			entity = this.entities[blob.uuid] = { ...entity, ...blob }
			entity.volume = volume
		}

		if(entity.obliterate) {
			console.log("volume-3js: being asked to destroy entity",blob)
			if(entity.volume && entity.volume._node) {
				delete _volume_entities[blob.uuid]
				entity.volume._node.removeFromParent()
				entity.volume._node = null
			}
			delete this.entities[entity.uuid]
			return
		}

		// perform updates to a single volume component immediately
		// another way would be to mark volume as dirty and do this in the update loop @todo debate this idea

		await this._update_geometry(entity.volume)
		this._update_pose(entity.volume)

		// peek directly at entity children and also update them
		if(!entity.children) return
		let counter = 0
		for(const child of entity.children) {
			if(!child.volume) continue
			if(!child.uuid) child.uuid = `${entity.uuid}/child-${counter++}`
			await this.resolve(child,entity)
		}
	}

}

///////////////////////////////////////////////////////////////////////////////////////////////

const _volume_managers = {}
const _volume_entities = {}

function _volume_manager_get(blob) {

	// is there a manager?
	let manager = _volume_entities[blob.uuid]
	if(manager) {
		return manager
	}

	// is there a specific dom name to bind a manager to?
	const name = blob.volume.dom && blob.volume.dom.length ? blob.volume.dom : null

	// if there is no name but if a previous manager exists then bind to it - else invent a name
	if(!name) {
		const values = Object.values(_volume_managers)
		if(values.length) {
			manager = _volume_entities[blob.uuid] = values[0]
			return manager
		}
		name = 'volume001'
	}

	// return manager if found
	manager = _volume_managers[name]
	if(manager) {
		_volume_entities[blob.uuid] = manager
		return manager
	}

	// look at the dom itself
	let elem = document.getElementById(name)

	// force create if none
	if(!elem) {
		console.log("volume: taking over entire display because no parent html element was provided/found",name)
		elem = document.createElement("div")
		elem.style = "width:100%;height:100%;padding:0px;margin:0px;position:absolute;top:0;left:0"
		elem.id = name
		document.body.appendChild(elem)
	} else {
		//console.log("volume: attaching to a provided html node for rendering",key)
	}

	manager = _volume_entities[blob.uuid] = _volume_managers[name] = new VolumeManager(elem)
	return manager
}

///
/// Observe traffic and do work
/// @todo there's some argument that we should bind javascript signals or dynamic listeners?
///

export const volume_observer = {

	about: 'volume observer using 3js',
	resolve: async (blob) => {

		if(blob.tick) {
			Object.values(_volume_managers).forEach(manager=>{
				manager.step(blob.time,blob.delta)
			})
			return blob
		}

		if(!blob.volume) {
			return blob
		}

		if(!blob.uuid) {
			console.warn('volume: volume entity must have uuid')
			return blob
		}

		let manager = _volume_manager_get(blob)

		await manager.resolve(blob,null)

		return blob
	}
}
