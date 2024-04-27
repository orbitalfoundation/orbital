# Puppet

A testbed for digital puppets - largely a collection of third party open source pieces.

The goals are to support:

	- 3d animated puppets that provide reasoning and voice and visualization of responses with visemes
	- English focused for now (although Finnish and other languages are supported in TalkingHeads)

	- ReadyPlayer me based glb rigs with visemes (see https://readyplayer.me)
	- Realusion rigs
	- VRM Rigs
	- Drago Compression
	- Mixamo animations to animate these rigs ( https://www.mixamo.com )
	- Visemes can be used to drive face morph targets to animate the mouth for text responses
	- Blinking, gaze, breathing, gesturing and pointing and basic fidgiting and so on
	- Pointing and specific intelligent gestures
	- Micro-responses and empathetic listening in real time (stretch goal)

	- Reasoning capability using any llm of your choice (such as say OpenAI / ChatGPT )
	- Will need fairly aggressive squelching of user queries and voice to text inputs to avoid overloading the bot

	- Sparse Voxel Octree dynamic spatial search and pathfinding (stretch goal)

	- Overal portalbe multiplayer architecture (with an emphasis on server side components being headless)

Outside components that this also leverages:

	- Speech to Text helper using built in browser speech recognition
	- Text to Speech with timestamps for phonemes using Coqui ( https://github.com/coqui-ai/TTS ) and others
	- AWSD and keyboard basic navigation, turning, steering for direct control of a puppet
	- A UX with a text input box can be used to send text as well
	- Event dispatch/observe patterns to separate code into modular pieces

## Useful References

https://docs.readyplayer.me/ready-player-me/api-reference/avatars/morph-targets/oculus-ovr-libsync
https://developer.oculus.com/documentation/unity/audio-ovrlipsync-viseme-reference/
https://docs.readyplayer.me/ready-player-me/avatars/avatar-creator/customization-and-configuration
https://github.com/webaverse-studios/CharacterCreator/blob/stable/src/library/lipsync.js

https://threejs.org/examples/webgl_morphtargets_face.html
https://hiukim.github.io/mind-ar-js-doc/more-examples/threejs-face-blendshapes/
https://docs.aws.amazon.com/polly/latest/dg/ph-table-english-us.html
http://www.visagetechnologies.com/uploads/2012/08/MPEG-4FBAOverview.pdf

https://github.com/met4citizen/TalkingHead <- used extensively in this project
https://github.com/bornfree/talking_avatar
https://discourse.threejs.org/t/add-lip-sync-to-existing-3d-model-of-head/49943
https://threejs.org/examples/webgl_morphtargets_face
https://github.com/exokitxr/avatars/blob/master/README.md

https://www.youtube.com/watch?v=4JGxN8q0BIw
https://docs.readyplayer.me/ready-player-me/integration-guides/unreal-engine/animations/oculus-lipsync-integration
https://crazyminnowstudio.com/posts/salsa-lipsync-in-webgl-with-amplitude/ 
