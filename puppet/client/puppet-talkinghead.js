
import { TalkingHeadArticulate } from '../talkinghead/modules/talkinghead-articulate.mjs'

import * as THREE from 'three';

///
/// client side playback wrapper/shim for puppet face performances using talking head
///
/// Supply a 3js model containing a loaded rigged avatar model - can be a vrm model
///

export class Puppet {
	handler = null
	busy = 0

	constructor(avatar,camera=null,div=null) {
		this.handler = new TalkingHeadArticulate(div)
		this.handler.useAvatar(avatar)
		this.handler.camera = camera
		this.avatar = avatar
		this.camera = camera

		this.handler.lookAtCamera(2000)

	}

	perform(perf) {
		// hack for some different ways of passing data
		const blob = perf.whisper ? perf.whisper : perf
		if(perf.audio) blob.audio = perf.audio
		if(perf.emotion) blob.mood = perf.emotion

console.log(blob)

		this.handler.speakAudio(blob,"en")

		// a test of a separate gaze system
	    // this.gaze()
	}

	update(time) {

		// perform animation over time
		const handler = this.handler
	    let dt = handler.animateTime(time)
	    if(dt) {
			const o = handler.animateBuildList()
			handler.animateSpeech(o,dt)
			handler.animateBody(o,dt)
	    }


		this.busy = handler.isSpeaking ? 1 : 0
	}

	async playAnimation(url, onprogress=null, dur=1, ndx=0, scale=0.01) {
		return this.handler.playAnimation(url,onprogress,dur,ndx,scale)
	}

/*
	gaze() {

		const body = this.avatar
		const camera = this.camera
		const head = body.getObjectByName("Head")
		const left = body.getObjectByName("LeftEye")
		const right = body.getObjectByName("RightEye")

		let proxy = this.proxy
		let proxy2 = this.proxy2
		if(!proxy) {
			proxy = this.proxy = new THREE.Object3D()
			head.parent.add(proxy)
			proxy.position.copy(head.position)
			proxy.quaternion.copy(head.quaternion)
			proxy2 = this.proxy2 = new THREE.Object3D()
			head.parent.add(proxy2)
			proxy2.position.copy(head.position)
			proxy2.quaternion.copy(head.quaternion)
		}

		// the puppet body faces towards +z by default
		const forward = new THREE.Vector3(0, 0, 1)
		forward.applyQuaternion(body.quaternion)

		// find lookat to camera
		const headPosition = new THREE.Vector3()
		const cameraPosition = new THREE.Vector3()
		head.getWorldPosition(headPosition)
		camera.getWorldPosition(cameraPosition)
		const lookat = new THREE.Vector3().subVectors(cameraPosition, headPosition).normalize()

		// calculate angle
		const angle = forward.angleTo(lookat)
		const maxAngle = 30 * Math.PI / 180
		const dist = headPosition.distanceToSquared(cameraPosition) 

		// if far away then relax to original effect
		if( dist > 4*4 || dist < 0.3*0.3 || angle > maxAngle || angle < -maxAngle ) {
			proxy2.quaternion.slerp(head.quaternion,0.05)
			head.quaternion.copy(proxy2.quaternion)
			left.quaternion.set(0,0,0,1)
			right.quaternion.set(0,0,0,1)
		}

		// slerp head and eyes; setting head first so that eyes can trace the hierarchy correctly
		else {
			proxy.lookAt(cameraPosition)
			proxy2.quaternion.slerp(proxy.quaternion,0.08)
			head.quaternion.copy(proxy2.quaternion)
			left.lookAt(this.camera.position)
			right.lookAt(this.camera.position)
		}
	}
*/

}
