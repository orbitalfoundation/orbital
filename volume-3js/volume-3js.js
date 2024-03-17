/*
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

import * as THREE from './libs/three/three.module.js'
import { GLTFLoader } from './libs/three/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from './libs/three/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from './libs/three/jsm/environments/RoomEnvironment.js'

class Volume {

	constructor (parentDiv,opt = {}) {

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
		new ResizeObserver(this.onResize.bind(this)).observe(this.parentDiv)

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

		if(true) {
			this.controls = new OrbitControls( this.camera, this.renderer.domElement )
			this.controls.enableZoom = this.opt.cameraZoomEnable
			this.controls.enableRotate = this.opt.cameraRotateEnable
			this.controls.enablePan = this.opt.cameraPanEnable
			this.controls.minDistance = 0.1
			this.controls.maxDistance = 200
			this.controls.autoRotateSpeed = 0
			this.controls.autoRotate = false
			this.controls.update()
		}

		camera.position.set(0, 1, 5)
		if(this.controls) this.controls.target.set(0,1,0); else camera.lookAt.set(0,1,0)

		if(true) {
			let s = 0.5
			const geometry = new THREE.BoxGeometry(s,s,s)
			const material = new THREE.MeshBasicMaterial({color: 0x00ff0000, wireframe: true })
			this.cube = new THREE.Mesh(geometry, material)
			scene.add(this.cube)
			renderer.render(scene, camera)
		}
	}

	update(time=0,delta=0) {

		if ( this.controls && this.controls.autoRotate ) {
			this.controls.update()
		}

		if(this.cube) {
			let SPEED = 0.01
			this.cube.position.y = 1
			this.cube.rotation.x -= SPEED * 2;
			this.cube.rotation.y -= SPEED;
			this.cube.rotation.z -= SPEED * 3;
		}

		this.renderer.render( this.scene, this.camera )
	}

	onResize() {
		this.camera.aspect = this.parentDiv.clientWidth / this.parentDiv.clientHeight
		this.camera.updateProjectionMatrix()
		this.renderer.setSize( this.parentDiv.clientWidth, this.parentDiv.clientHeight )
		if(this.controls)this.controls.update()
		this.renderer.render( this.scene, this.camera )
	}

	/////////////////////////////////////////////////////////////////

	uuid = 0
	nodes = {}

	async sdl(entity,parent) {

		// @todo revisit this concept later; i don't know that i really want to always have uuids here - sys should own it
		// for now i am remembering each of the nodes that i make by having a unique uuid per node ... i need some identifier
		// i could alternatively just stuff the _node into the real entity ... but then i need to mask out network traffic
		if(!entity.uuid) {
			this.uuid++
			entity.uuid = parent ? `${parent.uuid}/${this.uuid}` : `${uuid}`
			console.warn("volume: granted uuid",entity.uuid)
		}

		// camera - could generalize to anything
		if(entity.camera) {
			if(entity.transform && entity.transform.lookat) {
				this.camera.lookAt(...entity.transform.lookat)
				if(this.controls) this.controls.target.set(...entity.transform.lookat)
			}
			if(entity.transform && entity.transform.xyz) {
				this.camera.position.set(...entity.transform.xyz)
			}
		}

		// assign geometry
		// @todo detect changes later; delete previous; this is just a quick hack to get some art assets loaded up for now
		if(entity.geometry && entity.geometry.endsWith(".glb") && !entity._node && !this.nodes[entity.uuid]) {
			const loader = new GLTFLoader()
			let gltf = await loader.loadAsync( entity.geometry )
			if(!gltf || !gltf.scene) {
				console.error("volume: cannot load",entity.geometry)
			} else {

				gltf.scene.traverse((child) => {
					if ( child.type == 'SkinnedMesh' ) {
					  child.frustumCulled = false;
					}
				})

				this.nodes[entity.uuid] = entity._node = gltf.scene
				this.scene.add(gltf.scene)
				const x = entity.transform.xyz[0]
				const y = entity.transform.xyz[1]
				const z = entity.transform.xyz[2]
				gltf.scene.position.set(x,y,z)
			}
		}
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


/////////////////////////////////////////////////////////////////////////////////////////////////

function _volume_recurse(entity,parent=null) {

	if(!entity) {
		console.error("volume: no entity")
		return
	}

	// @note that if using multiple volumes one would have to specify the target volume for all interactions
	let volume = volume_manager(entity)
	if(!volume) {
		console.warn("volume: no volume surface target associated with entity",entity)
		return
	}

	try {
		volume.sdl(entity,parent)
	} catch(err) {
		console.log(err)
		return
	}

	if(entity.children) {
		entity.children.forEach(child=>{
			_volume_recurse(child,entity)
		})
	}
}

const volume_observer = {
	about: 'volume observer using 3js',
	observer: (args) => {
		if(!args) return
		if(args.blob && args.blob.name == 'tick') {
			Object.values(volumes).forEach(volume=>{
				volume.update(args.blob.time,args.blob.delta)
			})
		}
		else if(args.entity && args.entity.volume) {
			_volume_recurse(args.entity,null)
		}
	}
}

export const manifest = [ volume_observer ]
