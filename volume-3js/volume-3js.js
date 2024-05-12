/*

// it would be nice if javascript exposed importmaps programmatically; but it appears to not do so @todo

const importMap = {
	"imports": {
		"three": "./libs/three/three.module.js",
		"three/addons/": "./libs/three/jsm/"
	}
}
const im = document.createElement('script')
im.type = 'importmap'
im.textContent = JSON.stringify(importMap)
document.head.append(im)
*/


//import { MeshOptDecoder } from '@meshoptdecoder' 
//<script src="https://cdn.jsdelivr.net/npm/meshoptimizer@0.20.0/meshopt_decoder.js"></script>
const im = document.createElement('script')
im.src = "@orbital/volume-3js/meshopt_decoder.js"
document.head.append(im)

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

import { VRMLoaderPlugin, VRMUtils } from './three-vrm.module.js'

/*
import * as THREE from './libs/three/three.module.js'
import { GLTFLoader } from './libs/three/jsm/loaders/GLTFLoader.js'
import { KTX2Loader } from './libs/three/jsm/loaders/KTX2Loader.js'
import { DRACOLoader } from './libs/three/jsm/loaders/DRACOLoader.js'
import { OrbitControls } from './libs/three/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from './libs/three/jsm/environments/RoomEnvironment.js'

import { VRMLoaderPlugin, VRMUtils } from './three-vrm.module.js'
*/

///////////////////////////////////////////////////////////////////////////////////////////////

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

///////////////////////////////////////////////////////////////////////////////////////////////

class VolumeManager {

	uuid = 0
	entities = {}

	constructor (parentDiv,opt = {}) {

		//////////////////////////////////////////////////////////////////////////////////
		// merge user options overtop defaults

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

		//////////////////////////////////////////////////////////////////////////////////
		// sdtart renderer

		const renderer = this.renderer = new THREE.WebGLRenderer({
			antialias: true,
			//preserveDrawingBuffer: true,
			alpha: true
		})
		//renderer.autoClearColor = false

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

		//////////////////////////////////////////////////////////////////////////////////
		// create a default scene with a default camera and controls

		const scene = this.scene = new THREE.Scene();
		scene.background = new THREE.Color(0x3355aa);

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
		//scene.add(camera)
		scene.camera = camera
		scene.parentDiv = parentDiv

		if(true) {
			this.controls = new OrbitControls( this.camera, this.renderer.domElement )
			this.controls.enableZoom = this.opt.cameraZoomEnable
			this.controls.enableRotate = this.opt.cameraRotateEnable
			this.controls.enablePan = this.opt.cameraPanEnable
			this.controls.minDistance = 0.1
			this.controls.maxDistance = far
			this.controls.autoRotateSpeed = 0
			this.controls.autoRotate = false
			this.controls.update()
		}

		camera.position.set(0, 1, 5)
		if(this.controls) this.controls.target.set(0,1,0); else camera.lookAt.set(0,1,0)

		// helpers
		const gridHelper = new THREE.GridHelper( 10, 10 );
		scene.add( gridHelper );

		const axesHelper = new THREE.AxesHelper( 5 );
		scene.add( axesHelper );


		///////////////////////////////////////////////////////////////////////
		// create default light - remove if one shows up

		// light
		const light = this.light = new THREE.DirectionalLight( 0xffffff, Math.PI );
		light.position.set( 1.0, 1.0, -1.0 ).normalize();
		scene.add( light );

		//////////////////////////////////////////////////////////////////////////////////
		// a debugging cube

		if(false) {
			let s = 0.5
			const geometry = new THREE.BoxGeometry(s,s,s)
			const material = new THREE.MeshBasicMaterial({color: 0x00ff0000, wireframe: true })
			this.cube = new THREE.Mesh(geometry, material)
			scene.add(this.cube)
			renderer.render(scene, camera)
		}
	}

	update(time=0,delta=0) {

		Object.values(this.entities).forEach(entity=> {
			this._update_animation(entity.volume,time,delta)
		})

		if ( this.controls && this.controls.autoRotate ) {
			this.controls.update()
		}

		if(this.cube) {
			let SPEED = 0.01
			this.cube.position.y = 1
			this.cube.rotation.x -= SPEED * 2
			this.cube.rotation.y -= SPEED
			this.cube.rotation.z -= SPEED * 3
		}

		this.renderer.render( this.scene, this.camera )
	}

	_resize() {
		this.camera.aspect = this.parentDiv.clientWidth / this.parentDiv.clientHeight
		this.camera.updateProjectionMatrix()
		this.renderer.setSize( this.parentDiv.clientWidth, this.parentDiv.clientHeight )
		if(this.controls)this.controls.update()
		this.renderer.render( this.scene, this.camera )
	}

	_update_animation(volume,time,delta) {

		// sanity check
		if(!volume.animations || !volume._node || !volume._clips || !volume._mixer) return

		// change animation?
		if(volume.animation && volume.animation != volume._animation_previous) {
			volume._animation_previous = volume.animation

			if(volume._animation_clip) {
				volume._mixer.clipAction(this._animation_clip).fadeOut(0.5)
			}

			volume._animation_clip = null

			if(volume.animation) {
				Object.entries(volume._clips).forEach( ([k,v])=>{
					if(k.includes(volume.animation)) {
						volume._animation_clip = v
						//console.log("volume - found animation to play now",v)
					}
				})
			}

			if(volume._animation_clip) {
				volume._mixer.clipAction(volume._animation_clip).reset().fadeIn(0.5).setLoop(THREE.LoopPingPong,20).play()
		    }
		}

		// animate the animations
		volume._mixer.update(delta/1000)
	}

	async _update_miscellaneous(volume) {

		//////////////////////////////////////////////////////////////////////////////////////

		// assign geometry and load art
		// @todo this runs once only for now improve later
		// @todo detect dynamic changes to this string later and delete previous; this is just a quick hack to get some art assets loaded up for now

		if(volume.geometry && !volume._node &&
			(volume.geometry.endsWith(".glb") || volume.geometry.endsWith(".gltf") || volume.geometry.endsWith(".vrm") )
		)
		{
			let currentVrm = null;

			let gltf = await loader.loadAsync( "/" + volume.geometry )
			if(!gltf || !gltf.scene) {
				console.error("volume: cannot load",volume.geometry)
			} else {
				//console.log("volume: has loaded something",volume.geometry,gltf)

				// don't cull these
				gltf.scene.traverse((child) => { if ( child.type == 'SkinnedMesh' ) {  child.frustumCulled = false; } })

				// for now stuff the gltf directly into the volume
				volume._gltf = gltf

				// stuff the node into the volume and track it
				volume._node = gltf.scene

				// deal with vrm or normal
				if(gltf.userData && gltf.userData.vrm) {
					const vrm = volume._vrm = gltf.userData.vrm
					//console.log("volume-3js: loaded vrm",vrm)
					// calling these functions greatly improves the performance (but collides with optimizers)
					//VRMUtils.removeUnnecessaryVertices( gltf.scene );
					//VRMUtils.removeUnnecessaryJoints( gltf.scene );
					vrm.scene.traverse( ( obj ) => { obj.frustumCulled = false })
					this.scene.add(vrm.scene)
				} else {
					//console.log("volume-3js: loaded normal glb")
					this.scene.add(gltf.scene)
				}
			}
		}

		//////////////////////////////////////////////////////////////////////////////////////

		// load animations - once only for now
		// @todo allow invocation more than once if animation sets change
		// @todo for now take just the first clip from each anim improve later
		// @todo right now we are tied to the ready player me avatars
		// @todo this avatar animation loading feature could actually move to puppet possibly

		if(volume.animations && !volume._clips && volume._node) {
			volume._clips = {}
			for(let filename of volume.animations) {
				try {
					const response = await fetch(filename)
					const json = await response.json()
					let clip = null
					json.forEach((animation) => {
						if (animation.tracks.length <= 0) return
						clip = THREE.AnimationClip.parse(animation)
					})
					if(clip) volume._clips[filename] = clip
				} catch(err) {
					console.error("volume-3js: cannot load animation file",filename,err)
					continue
				}
			}

			let part = volume._node.getObjectByName('Wolf3D_Body') || volume._node.getObjectByName('Wolf3D_Avatar') || volume._node.getObjectByName('CC_Game_Body')
			if(!part) {
				console.error("volume-3js: missing body parts for animations",volume)
			} else {
				volume._mixer = new THREE.AnimationMixer(part)
			}
		}

		//////////////////////////////////////////////////////////////////////////////////////

		this._update_pose(volume)

	}

	_update_pose(volume) {

		if(!volume.transform || !volume._node) return

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
		// @todo consolidate handes on _vrm and _gltf - test if i can use node for vrm? 
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
				const x = volume.transform.xyz[0]
				const y = volume.transform.xyz[1]
				const z = volume.transform.xyz[2]
				volume._vrm.scene.position.set(x,y,z)
			}
			else if(volume._node) {
				const x = volume.transform.xyz[0]
				const y = volume.transform.xyz[1]
				const z = volume.transform.xyz[2]
				volume._node.position.set(x,y,z)
			}
		}		

		if(volume.camera_follow) {
			const v = new THREE.Vector3(0,2,-5).applyQuaternion(node.quaternion)
			const p = node.position.clone().add(v)
			this.camera.position.set(p.x,p.y,p.z)
			this.camera.lookAt(node.position.x,node.position.y+1,node.position.z)
		}

	}

	//
	// deal with changes to entities that have volumes
	//

	async resolve(entity,parent=null) {

		// @todo for now force grant a uuid to each entity
		// I am actually unsure about this concept... sys should own it?
		// i do need some kind of uuid per node but children nodes are not visible to sys
		// another idea is that 3js grants locally good enough uuids i believe?
		if(!entity.uuid) {
			this.uuid++
			entity.uuid = parent ? `${parent.uuid}/${this.uuid}` : `${uuid}`
			console.warn("volume-3js: force granted uuid",entity.uuid)
		}

		// store the entity
		this.entities[entity.uuid] = entity

		// for now update these right away - this could be done in the update loop instead @todo
		await this._update_miscellaneous(entity.volume)

		// recursively update children (assumption is they are also volume nodes)
		// @todo if just a parent is being modified we shouldn't bother revisiting all the children?
		// @todo must actually attach to parent
		if(entity.children) {
			for(const child in entity.children) {
				if(!child.volume) {
					console.error("volume-3jw: child has no volume",child,entity)
				} else {
					await this.resolve(child,entity)
				}
			}
		}

	}

}

///////////////////////////////////////////////////////////////////////////////////////////////

const volume_managers = {}

function _volume_manager_bind(entity) {

	let key = entity.volume.dom

	// use first volume if none specified
	if(!key) {
		//console.log("volume - key not found so binding to default",entity)
		const values = Object.values(volume_managers)
		return values.length ? values[0] : null
	}

	// use specified if found
	let manager = volume_managers[key]
	if(manager) {
		return manager
	}

	// create new - the key is overloaded to refer to an existing DOM node in the html scenegraph
	let elem = document.getElementById(key)

	// if there is no dom node for a volume then just take over the whole screen for now
	if(!elem) {
		console.log("volume: taking over entire display because no parent html element was provided/found",key)
		elem = document.createElement("div")
		elem.style = "width:100%;height:100%;padding:0px;margin:0px;position:absolute;top:0;left:0"
		elem.id = key
		document.body.appendChild(elem)
	} else {
		//console.log("volume: attaching to a provided html node for rendering",key)
	}

	// attach
	manager = volume_managers[key] = elem._volume_manager = new VolumeManager(elem)
	return manager
}

///
/// Observe traffic and do work
/// @todo there's some argument that we should bind javascript signals or dynamic listeners?
///

export const volume_observer = {
	about: 'volume observer using 3js',
	observer: async (args) => {
		if(!args) return
		if(args.blob && args.blob.name == 'tick') {
			Object.values(volume_managers).forEach(manager=>{
				manager.update(args.blob.time,args.blob.delta)
			})
		}
		else if(args.entity && args.entity.volume) {

			// before doing any work we must define which volume the entity is associated with
			let manager = _volume_manager_bind(args.entity)
			if(!manager) {
				console.warn("volume: no volume surface target associated with entity",args.entity)
				return
			}

			// just have the volume manager store the entity - it is reactive because it is real time
			await manager.resolve(args.entity,null)
		}
	}
}
