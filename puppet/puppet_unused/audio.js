

export class Audio {

	constructor() {
 		this.audioCtx = new AudioContext();
	    this.audioCtx.audioSpeechSource = audioCtx.createBufferSource();
	    this.audioBackgroundSource = this.audioCtx.createBufferSource();
	    this.audioBackgroundGainNode = this.audioCtx.createGain();
	    this.audioSpeechGainNode = this.audioCtx.createGain();
	    this.audioReverbNode = this.audioCtx.createConvolver();
	    this.setReverb(null); // Set dry impulse as default
	    this.audioBackgroundGainNode.connect(this.audioReverbNode);
	    this.audioSpeechGainNode.connect(this.audioReverbNode);
	    this.audioReverbNode.connect(this.audioCtx.destination);
	    this.audioPlaylist = [];
	}

	/**
	* Play background audio.
	* @param {string} url URL for the audio, stop if null.
	*/
	async playBackgroundAudio( url ) {

		// Fetch audio
		let response = await fetch(url);
		let arraybuffer = await response.arrayBuffer();

		// Play audio in a loop
		this.stopBackgroundAudio()
		this.audioBackgroundSource = this.audioCtx.createBufferSource();
		this.audioBackgroundSource.loop = true;
		this.audioBackgroundSource.buffer = await this.audioCtx.decodeAudioData(arraybuffer);
		this.audioBackgroundSource.playbackRate.value = 1 / this.animSlowdownRate;
		this.audioBackgroundSource.connect(this.audioBackgroundGainNode);
		this.audioBackgroundSource.start(0);

	}

	/**
	* Stop background audio.
	*/
	stopBackgroundAudio() {
		try { this.audioBackgroundSource.stop(); } catch(error) {}
		this.audioBackgroundSource.disconnect();
	}

	/**
	* Setup the convolver node based on an impulse.
	* @param {string} [url=null] URL for the impulse, dry impulse if null
	*/
	async setReverb( url=null ) {
		if ( url ) {
			// load impulse response from file
			let response = await fetch(url);
			let arraybuffer = await response.arrayBuffer();
			this.audioReverbNode.buffer = await this.audioCtx.decodeAudioData(arraybuffer);
		} else {
			// dry impulse
			const samplerate = this.audioCtx.sampleRate;
			const impulse = this.audioCtx.createBuffer(2, samplerate, samplerate);
			impulse.getChannelData(0)[0] = 1;
			impulse.getChannelData(1)[0] = 1;
			this.audioReverbNode.buffer = impulse;
		}
	}

	/**
	* Set audio gain.
	* @param {number} speech Gain for speech, if null do not change
	* @param {number} background Gain for background audio, if null do not change
	*/
	setMixerGain( speech, background ) {
		if ( speech !== null ) {
			this.audioSpeechGainNode.gain.value = speech;
		}
		if ( background !== null ) {
			this.audioBackgroundGainNode.gain.value = background;
		}
	}

	playstuff() {

		// If Web Audio API is suspended, try to resume it
		if ( this.audioCtx.state === "suspended" ) {
			const resume = this.audioCtx.resume();
			const timeout = new Promise((_r, rej) => setTimeout(() => rej("p2"), 1000));
			try {
				await Promise.race([resume, timeout]);
			} catch(e) {
				console.log("Can't play audio. Web Audio API suspended. This is often due to calling some speak method before the first user action, which is typically prevented by the browser.");
				this.playAudio(true);
			return;
			}
		}

		// AudioBuffer
		let audio = item.audio

		if(typeof audio === 'string') {
			try {
				const buf = this.b64ToArrayBuffer(audio)
				audio = await this.audioCtx.decodeAudioData(buf)
			} catch(err) {
				audio = null
				this.playAudio(true);
				return
			}
		}
		else if ( Array.isArray(item.audio) ) {
			// Convert from PCM samples
			let buf = this.concatArrayBuffers( item.audio );
			audio = this.pcmToAudioBuffer(buf);
		}

		// Create audio source
		this.audioSpeechSource = this.audioCtx.createBufferSource();
		this.audioSpeechSource.buffer = audio;
		this.audioSpeechSource.playbackRate.value = 1 / this.animSlowdownRate;
		this.audioSpeechSource.connect(this.audioSpeechGainNode);
		this.audioSpeechSource.addEventListener('ended', () => {
			this.audioSpeechSource.disconnect();
			this.playAudio(true);
		}, { once: true });
	}

}

/*


	// test: async promote audio blobs early since there are huge delays here
	// @todo probably want a totally different way of streaming audio
	if(queue) {
		queue.forEach(perf=>{
			if(perf.audio && !perf.audio_preload_started) {
				console.log("audio preloading ",perf.sentence,"pre-play duration estimate",perf.duration,perf.audio)
				perf.audio_preload_started = true
				const before = performance_now
				const success = (audio) => {
					const after = performance.now() * 1000
					const duration = audio.duration * 1000
					console.log("audio preloader done: post start duration",duration,"orig sentence",perf.sentence)
					console.log("audio preloader done: time it took to move sample in memory",(after-before))
					perf.duration = duration
					perf._audio = audio
					perf.audio_loaded = true
				}
				const fail = ()=> {
					perf.corrupt = true
				}
				audio_preload(perf,success,fail)
			}
		})
	}



*/

