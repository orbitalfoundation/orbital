# Puppet - May 2024

An open source testbed for 3d digital embodied puppets with reasoning and facial and body performances.
This probably all will be fairly obsolete within a year given the rate of advance of technology.
At the same time it is useful right now for lightweight conversational puppets and to explore embodied agents.

The basic pipeline is:

	llm based reasoning -> tts -> word & phoneme timings -> text to visemes & emotions -> puppet face performance

Currently supports (* = done and - = not done):

	* TalkingHeads based text to viseme animation using ready player rigs
	* Ready Player Me rig support with Drago compression
	* Reallusion ActorCore / Character Creator rigs
	- VRM rigs
	- Mixamo support from fbx files

	* Text to Viseme to drive face morph targets directly from words
	* phoneme to viseme (supported using coqui tts pipeline only)
	- text to phoneme (this is a gap that would be nice to fill)

	- blinking
	- gaze
	- breathe
	- gesture
	- point
	- fidgit

	* llm based reasoning
	* text to speech (coqui and openai based tts)

Delivering those above features also requires a supporting harness - these are other things that had to be done:

	* client/server model (all clients see the same puppet performance)
	* buffering traffic; the client cannot play back all performances at once so a buffering scheme is needed
	* squelching of traffic to prevent overloading of puppet (cannot talk to puppet while is is busy talking)
	* coqui (python based TTS module that spits out phoneme timing information also)

	* sparse voxel octree dynamic pathfinding
	* avatar puppet navigation (so you can walk around)
	* distance based filtering of conversations (you have to be near a puppet to talk to them)
	* chat based text input dialog (a way to actually talk to the puppet if you don't want to use voice)
	* voice recognition (using built in browser capabilities
	* voice recognition disabling while puppets are speaking (to prevent them responding to themselves)

I've tried to keep all the code modules fairly portable, the top level harnesses run within Orbital using the event message passing scheme but the lower level pieces should be reuable anywhere.

## Understanding the various pipeline options

There are two pipelines here for producing visemes on faces: TalkingHead, which is quite good, but a bit complex with many features - and Puppet - a simpler pipeline that leverages some of TalkingHead.

Both pipelines overlap to some degree - this is the overall arc of how work is processed:

1) On my server I get the user text.

2) Paragraphs are broken into smaller sentence fragments (on period and comma boundaries) and cleaned up.

3) Each sentence is passed to a text to speech (still on the server).

4) Generation of 'anim' property is built (on the server):

   Each word in each sentence is passed to a viseme generator.
   Note that talking heads goes directly from words to visemes - skipping phonemes.
   A data structure is returned that is a sequence of playback hints with these fields:

		name: a command name - typically 'viseme' (as opposed to say 'break' or 'audio') or other commands
		mark: a counter that increments once per word
   		ts: the time stamp start, end, duration of the viseme
   		vs: the viseme name in ready player me format and the intensity

5) Generation of 'whisper' timing data property is built (on the server):

   OpenAI whisper is used to generate word timing.
   This duplicates some of the work above!
   In fact in some cases the above 'anim' prop is not used at all.
   This property has these fields:

		wdurations: [ 280, 120, 200, 139, ... ]	-> the number of milliseconds of length of each word
		words: [ what, can, i do, ... ] -> the actual words
		wtimes: [ -150, 130, 250, 450, ... ] -> when the word actually starts in the timewise sequence

	Note that the wtimes are adjusted to start at -150 milliseconds - I feel this is a hack ands should be removed.
	But in general these word timings are an excellent way to synchronize the visemes to text.
	And in fact on the client side they run throughthe same pipeline in (4) to go from words directly to visemes.

6) The client catches blobs of data telling it what to perform. I call these 'performances'.
   A given "blob" is something like this:

		'audio' -> a b64 encoded buffer of audio that gets turned into a raw audio buffer for playback
		'anim' -> the property described in (4) above - basically a collection of visemes and timing
		'whisper' -> the property described in (5) above - a collection of word timings

7)	The 'whisper' data is passed to 'lipsyncConvert()' (see TalkingHead/modules/lipsync-queue.mjs)
	This is turned from word timings directly into sequenced visemes over time to play back.
	The output is a new list of viseme timings that looks like this:

		template: name 'viseme',
		ts: [ start, end, duration ] in absolute time units (milliseconds)
		vs: [ viseme name, level or intensity, 0 ]

	Now the playback engine stuffs these into an anim queue for playback.

8) The TH animation queue tackles several different kinds of animation.
   It looks to see if a specific fragment is before or after the current time.
   It sets the degree of the morph target based on its estimation of the timing.
   This is similar to audio attack, sustain, decay, release

9) For my own purposes I have a simplified facial viseme playback queue handler - like so:
   - Given word timings from whisper.
   - I pass these to lipsyncConvert() to get a big array of visemes to play at a given point in time.
   - Every frame I iterate that whole array and the visemes that are in the right time window I set.

## Useful References

Various engines:

https://github.com/met4citizen/TalkingHead <- used extensively in this project
https://github.com/bornfree/talking_avatar
https://discourse.threejs.org/t/add-lip-sync-to-existing-3d-model-of-head/49943
https://threejs.org/examples/webgl_morphtargets_face
https://github.com/exokitxr/avatars/blob/master/README.md

General reference on rigging (there are many competing standards):

https://docs.readyplayer.me/ready-player-me/api-reference/avatars/full-body-avatars
https://docs.readyplayer.me/ready-player-me/api-reference/avatars/morph-targets/apple-arkit
https://docs.readyplayer.me/ready-player-me/api-reference/avatars/morph-targets/oculus-ovr-libsync
https://docs.readyplayer.me/ready-player-me/avatars/avatar-creator/customization-and-configuration
https://docs.readyplayer.me/ready-player-me/integration-guides/unreal-engine/animations/oculus-lipsync-integration
https://developer.oculus.com/documentation/unity/audio-ovrlipsync-viseme-reference/

Here's a clever raw audio to viseme converter - I tried this out - it is 'ok' for live performances

https://github.com/webaverse-studios/CharacterCreator/blob/stable/src/library/lipsync.js

Here are a few other things I ran across:

https://threejs.org/examples/webgl_morphtargets_face.html
https://hiukim.github.io/mind-ar-js-doc/more-examples/threejs-face-blendshapes/
https://docs.aws.amazon.com/polly/latest/dg/ph-table-english-us.html
http://www.visagetechnologies.com/uploads/2012/08/MPEG-4FBAOverview.pdf
https://www.youtube.com/watch?v=4JGxN8q0BIw
https://crazyminnowstudio.com/posts/salsa-lipsync-in-webgl-with-amplitude/ 

The future is probably transformer based raw audio to facial performance. I expect to see this integrated directly into tools like OpenAI fairly soon. I also expect to see single call pipelines that take voice, video or text as input and return voice, video, timings and possibly even facial performances:

https://www.nvidia.com/en-us/ai-data-science/audio2face/

