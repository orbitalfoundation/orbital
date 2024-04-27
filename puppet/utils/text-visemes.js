///
/// Turn english prose into visemes over time.
///
/// Modified from:
///
/// @class English lip-sync processor
/// @author Mika Suominen
///

// the visemes that rpm models have
export const visemes_rpm = [
	"sil",
	"PP",
	"FF",
	"TH",
	"DD",
	"kk",
	"CH",
	"SS",
	"nn",
	"RR",
	"aa",
	"E",
	"I",
	"O",
	"U"
]

/*
export const visemes_indexed_rpm = {
	'sil': 0,
	'PP': 1,
	'FF': 2,
	'TH': 3,
	'DD': 4,
	'kk': 5,
	'CH': 6,
	'SS': 7,
	'nn': 8,
	'RR': 9,
	'aa': 10,
	'E': 11,
	'I': 12,
	'O': 13,
	'U': 14,
}
*/

// Viseme durations in relative unit - not in milliseconds or seconds! (1=average)
// @todo these need to be examined for english (they are from the finnish talking heads example)
export const viseme_durations_rpm = {
	'sil': 1,
	'PP': 1,
	'FF': 1.1,
	'TH': 0.8,
	'DD': 0.9,
	'kk': 0.8,
	'CH': 0.8,
	'SS': 1.3,
	'nn': 0.9,
	'RR': 1,
	'aa': 1.3,
	'E': 1.1,
	'I': 0.9,
	'O': 1.1,
	'U': 0.9,
}

// Pauses in relative units (1=average)
export const otherDurations = { ' ': 1, ',': 3, '-':0.5 };

// A raw mapping of phonemes to visemes
export const phonemeToVisemeMap_RPM = {

	// Consonants
	b: 1,
	d: 4,
	d͡ʒ: 6,
	ð: 3,
	f: 2,
	ɡ: 5,
	h: 5, // ??? no mapping in pdf
	j: 12, // ??? recheck
	k: 5,
	l: 8,
	m: 1,
	n: 8,
	ŋ: 5, // ???
	p: 1,
	ɹ: 9,
	s: 7,
	ʃ: 6,
	t: 4,
	t͡ʃ: 6,
	θ: 3,
	v: 2,
	w: 14,
	z: 7,
	ʒ: 6,

	// Vowels
	ə: 11,
	ɚ: 11,
	æ: 10,
	aɪ: 10,
	aʊ: 10,
	ɑ: 10,
	eɪ: 11,
	ɝ: 11,
	ɛ: 11,
	i: 12,
	ɪ: 12,
	oʊ: 13,
	ɔ: 13,
	ɔɪ: 13,
	u: 14,
	ʊ: 14,
	ʌ: 11,

	// Additional Symbols
	ˈ: null,
	ˌ: null,
	'.': null,
}

// A raw mapping of phonemes to visemes except for reallusion
export const phonemeToVisemeMap_Reallusion = {

	// Consonants
	b: 1,
	d: 4,
	d͡ʒ: 6,
	ð: 3,
	f: 2,
	ɡ: 5,
	h: 5, // ??? no mapping in pdf
	j: 12, // ??? recheck
	k: 5,
	l: 8,
	m: 1,
	n: 8,
	ŋ: 5, // ???
	p: 1,
	ɹ: 9,
	s: 7,
	ʃ: 6,
	t: 4,
	t͡ʃ: 6,
	θ: 3,
	v: 2,
	w: 14,
	z: 7,
	ʒ: 6,

	// Vowels
	ə: 11,
	ɚ: 11,
	æ: 10,
	aɪ: 10,
	aʊ: 10,
	ɑ: 10,
	eɪ: 11,
	ɝ: 11,
	ɛ: 11,
	i: 12,
	ɪ: 12,
	oʊ: 13,
	ɔ: 13,
	ɔɪ: 13,
	u: 14,
	ʊ: 14,
	ʌ: 11,

	// Additional Symbols
	ˈ: null,
	ˌ: null,
	'.': null,
}

// The above have to be remapped between oculus and realusion
//
// According to:
// https://manual.reallusion.com/Character-Creator-4/Content/ENU/4.0/06-Facial-Profile-Editor/8_7_and_1_1.htm
// These differ from:
// https://developer.oculus.com/documentation/unity/audio-ovrlipsync-viseme-reference/
//
// "Each character for iClone presents 15 visemes (lip shapes) when it talks.
//		AE
//		Ah
//		B_M_P
//		Ch_J
//		EE
//		Er
//		F_V,
//		Ih
//		K_G_H_NG
//		Oh
//		R
//		S_Z
//		T_L_D_N
//		Th
//		W_OO
//
// Above they are shown alphabetically but they are indexed in a different order in memory.
// We remap these for convenience below:
//

const remap = [
-1, // "sil", "None"
11, // "PP" , "B_M_P"
 8, // "FF" , "F_V"
 9, // "TH" , "TH"
10, // "DD" , "T_L_D_N"
12, // "kk" , "K_G_H_NG"
 7, // "CH" , "Ch_J"
 6, // "SS" , "S_Z"
10, // "nn" , "T_L_D_N"
14, // "RR" , "R"
 3, // "aa" , "Ah"
 0, // "EE" , "EE" - or AE -> 13 is not used (AE) @todo
 2, // "I"  , "IH"
 4, // "O"  , "Oh"
 5, // "U"  , "W_OO"
]

Object.entries(phonemeToVisemeMap_Reallusion).forEach( ([k,v])=>{
	if(!v) return
	//console.log(k,v)
	phonemeToVisemeMap_Reallusion[k] = remap[v]
})

export const visemes_realusion = {
	0: "None",
	1: "B_M_P",
	2: "F_V",
	3: "TH",
	4: "T_L_D_N",
	5: "K_G_H_NG",
	6: "Ch_J",
	7: "S_Z",
	8: "T_L_D_N",
	9: "R",
	10: "Ah",
	11: "EE",
	12: "IH",
	13: "Oh",
	14: "W_OO",
}

//
// English words to Oculus visemes, algorithmic rules adapted from:
//   NRL Report 7948, "Automatic Translation of English Text to Phonetics by Means of Letter-to-Sound Rules" (1976)
//   by HONEY SUE EL.OVITZ, RODNEY W. JOHNSON, ASTRID McHUGH, AND JOHN E. SHORE
//   Available at: https://apps.dtic.mil/sti/pdfs/ADA021929.pdf
//

const rules = {
	'A': [
		"[A] =aa", " [ARE] =aa RR", " [AR]O=aa RR", "[AR]#=E RR",
		" ^[AS]#=E SS", "[A]WA=aa", "[AW]=aa", " :[ANY]=E nn I",
		"[A]^+#=E", "#:[ALLY]=aa nn I", " [AL]#=aa nn", "[AGAIN]=aa kk E nn",
		"#:[AG]E=I kk", "[A]^+:#=aa", ":[A]^+ =E", "[A]^%=E",
		" [ARR]=aa RR", "[ARR]=aa RR", " :[AR] =aa RR", "[AR] =E",
		"[AR]=aa RR", "[AIR]=E RR", "[AI]=E", "[AY]=E", "[AU]=aa",
		"#:[AL] =aa nn", "#:[ALS] =aa nn SS", "[ALK]=aa kk", "[AL]^=aa nn",
		" :[ABLE]=E PP aa nn", "[ABLE]=aa PP aa nn", "[ANG]+=E nn kk", "[A]=aa"
	],

	'B': [
		" [BE]^#=PP I", "[BEING]=PP I I nn", " [BOTH] =PP O TH",
		" [BUS]#=PP I SS", "[BUIL]=PP I nn", "[B]=PP"
	],

	'C': [
		" [CH]^=kk", "^E[CH]=kk", "[CH]=CH", " S[CI]#=SS aa",
		"[CI]A=SS", "[CI]O=SS", "[CI]EN=SS", "[C]+=SS",
		"[CK]=kk", "[COM]%=kk aa PP", "[C]=kk"
	],

	'D': [
		"#:[DED] =DD I DD", ".E[D] =DD", "#^:E[D] =DD", " [DE]^#=DD I",
		" [DO] =DD U", " [DOES]=DD aa SS", " [DOING]=DD U I nn",
		" [DOW]=DD aa", "[DU]A=kk U", "[D]=DD"
	],

	'E': [
		"#:[E] =", "'^:[E] =", " :[E] =I", "#[ED] =DD", "#:[E]D =",
		"[EV]ER=E FF", "[E]^%=I", "[ERI]#=I RR I", "[ERI]=E RR I",
		"#:[ER]#=E", "[ER]#=E RR", "[ER]=E", " [EVEN]=I FF E nn",
		"#:[E]W=", "@[EW]=U", "[EW]=I U", "[E]O=I", "#:&[ES] =I SS",
		"#:[E]S =", "#:[ELY] =nn I", "#:[EMENT]=PP E nn DD", "[EFUL]=FF U nn",
		"[EE]=I", "[EARN]=E nn", " [EAR]^=E", "[EAD]=E DD", "#:[EA] =I aa",
		"[EA]SU=E", "[EA]=I", "[EIGH]=E", "[EI]=I", " [EYE]=aa", "[EY]=I",
		"[EU]=I U", "[E]=E"
	],

	'F': [
		"[FUL]=FF U nn", "[F]=FF"
	],

	'G': [
		"[GIV]=kk I FF", " [G]I^=kk", "[GE]T=kk E", "SU[GGES]=kk kk E SS",
		"[GG]=kk", " B#[G]=kk", "[G]+=kk", "[GREAT]=kk RR E DD",
		"#[GH]=", "[G]=kk"
	],

	'H': [
		" [HAV]=I aa FF", " [HERE]=I I RR", " [HOUR]=aa EE", "[HOW]=I aa",
		"[H]#=I", "[H]="
	],

	'I': [
		" [IN]=I nn", " [I] =aa", "[IN]D=aa nn", "[IER]=I E",
		"#:R[IED] =I DD", "[IED] =aa DD", "[IEN]=I E nn", "[IE]T=aa E",
		" :[I]%=aa", "[I]%=I", "[IE]=I", "[I]^+:#=I", "[IR]#=aa RR",
		"[IZ]%=aa SS", "[IS]%=aa SS", "[I]D%=aa", "+^[I]^+=I",
		"[I]T%=aa", "#^:[I]^+=I", "[I]^+=aa", "[IR]=E", "[IGH]=aa",
		"[ILD]=aa nn DD", "[IGN] =aa nn", "[IGN]^=aa nn", "[IGN]%=aa nn",
		"[IQUE]=I kk", "[I]=I"
	],

	'J': [
		"[J]=kk"
	],

	'K': [
		" [K]N=", "[K]=kk"
	],

	'L': [
		"[LO]C#=nn O", "L[L]=", "#^:[L]%=aa nn", "[LEAD]=nn I DD", "[L]=nn"
	],

	'M': [
		"[MOV]=PP U FF", "[M]=PP"
	],

	'N': [
		"E[NG]+=nn kk", "[NG]R=nn kk", "[NG]#=nn kk", "[NGL]%=nn kk aa nn",
		"[NG]=nn", "[NK]=nn kk", " [NOW] =nn aa", "[N]=nn"
	],

	'O': [
		"[OF] =aa FF", "[OROUGH]=E O", "#:[OR] =E", "#:[ORS] =E SS",
		"[OR]=aa RR", " [ONE]=FF aa nn", "[OW]=O", " [OVER]=O FF E",
		"[OV]=aa FF", "[O]^%=O", "[O]^EN=O", "[O]^I#=O", "[OL]D=O nn",
		"[OUGHT]=aa DD", "[OUGH]=aa FF", " [OU]=aa", "H[OU]S#=aa",
		"[OUS]=aa SS", "[OUR]=aa RR", "[OULD]=U DD", "^[OU]^L=aa",
		"[OUP]=U OO", "[OU]=aa", "[OY]=O", "[OING]=O I nn", "[OI]=O",
		"[OOR]=aa RR", "[OOK]=U kk", "[OOD]=U DD", "[OO]=U", "[O]E=O",
		"[O] =O", "[OA]=O", " [ONLY]=O nn nn I", " [ONCE]=FF aa nn SS",
		"[ON'T]=O nn DD", "C[O]N=aa", "[O]NG=aa", " ^:[O]N=aa",
		"I[ON]=aa nn", "#:[ON] =aa nn", "#^[ON]=aa nn", "[O]ST =O",
		"[OF]^=aa FF", "[OTHER]=aa TH E", "[OSS] =aa SS", "#^:[OM]=aa PP",
		"[O]=aa"
	],

	'P': [
		"[PH]=FF", "[PEOP]=PP I PP", "[POW]=PP aa", "[PUT] =PP U DD",
		"[P]=PP"
	],

	'Q': [
		"[QUAR]=kk FF aa RR", "[QU]=kk FF", "[Q]=kk"
	],

	'R': [
		" [RE]^#=RR I", "[R]=RR"
	],

	'S': [
		"[SH]=SS", "#[SION]=SS aa nn", "[SOME]=SS aa PP", "#[SUR]#=SS E",
		"[SUR]#=SS E", "#[SU]#=SS U", "#[SSU]#=SS U", "#[SED] =SS DD",
		"#[S]#=SS", "[SAID]=SS E DD", "^[SION]=SS aa nn", "[S]S=",
		".[S] =SS", "#:.E[S] =SS", "#^:##[S] =SS", "#^:#[S] =SS",
		"U[S] =SS", " :#[S] =SS", " [SCH]=SS kk", "[S]C+=",
		"#[SM]=SS PP", "#[SN]'=SS aa nn", "[S]=SS"
	],

	'T': [
		" [THE] =TH aa", "[TO] =DD U", "[THAT] =TH aa DD", " [THIS] =TH I SS",
		" [THEY]=TH E", " [THERE]=TH E RR", "[THER]=TH E", "[THEIR]=TH E RR",
		" [THAN] =TH aa nn", " [THEM] =TH E PP", "[THESE] =TH I SS",
		" [THEN]=TH E nn", "[THROUGH]=TH RR U", "[THOSE]=TH O SS",
		"[THOUGH] =TH O", " [THUS]=TH aa SS", "[TH]=TH", "#:[TED] =DD I DD",
		"S[TI]#N=CH", "[TI]O=SS", "[TI]A=SS", "[TIEN]=SS aa nn",
		"[TUR]#=CH E", "[TU]A=CH U", " [TWO]=DD U", "[T]=DD"
	],

	'U': [
		" [UN]I=I U nn", " [UN]=aa nn", " [UPON]=aa PP aa nn",
		"@[UR]#=U RR", "[UR]#=I U RR", "[UR]=E", "[U]^ =aa",
		"[U]^^=aa", "[UY]=aa", " G[U]#=", "G[U]%=", "G[U]#=FF",
		"#N[U]=I U", "@[U]=I", "[U]=I U"
	],

	'V': [
		"[VIEW]=FF I U", "[V]=FF"
	],

	'W': [
		" [WERE]=FF E", "[WA]S=FF aa", "[WA]T=FF aa", "[WHERE]=FF E RR",
		"[WHAT]=FF aa DD", "[WHOL]=I O nn", "[WHO]=I U", "[WH]=FF",
		"[WAR]=FF aa RR", "[WOR]^=FF E", "[WR]=RR", "[W]=FF"
	],

	'X': [
		" [X]=SS", "[X]=kk SS"
	],

	'Y': [
		"[YOUNG]=I aa nn", " [YOU]=I U", " [YES]=I E SS", " [Y]=I",
		"#^:[Y] =I", "#^:[Y]I=I", " :[Y] =aa", " :[Y]#=aa",
		" :[Y]^+:#=I", " :[Y]^#=I", "[Y]=I"
	],

	'Z': [
		"[Z]=SS"
	]
}

const ops = {
	'#': '[AEIOUY]+', // One or more vowels AEIOUY
	// This one is not used: "'": '[BCDFGHJKLMNPQRSTVWXZ]+', // One or more consonants BCDFGHJKLMNPQRSTVWXZ
	'.': '[BDVGJLMNRWZ]', // One voiced consonant BDVGJLMNRWZ
	// This one is not used: '$': '[BDVGJLMNRWZ][EI]', // One consonant followed by E or I
	'%': '(?:ER|E|ES|ED|ING|ELY)', // One of ER, E, ES, ED, ING, ELY
	'&': '(?:[SCGZXJ]|CH|SH)', // One of S, C, G, Z, X, J, CH, SH
	'@': '(?:[TSRDLZNJ]|TH|CH|SH)', // One of T, S, R, D, L, Z, N, J, TH, CH, SH
	'^': '[BCDFGHJKLMNPQRSTVWXZ]', // One consonant BCDFGHJKLMNPQRSTVWXZ
	'+': '[EIY]', // One of E, I, Y
	':': '[BCDFGHJKLMNPQRSTVWXZ]*', // Zero or more consonants BCDFGHJKLMNPQRSTVWXZ
	' ': '\\b' // Start/end of the word
}

//
// pre-generate rules - run this immediately now once only
//

Object.keys(rules).forEach( key => {
	rules[key] = rules[key].map( rule => {
		const posL = rule.indexOf('[');
		const posR = rule.indexOf(']');
		const posE = rule.indexOf('=');
		const strLeft = rule.substring(0,posL);
		const strLetters = rule.substring(posL+1,posR);
		const strRight = rule.substring(posR+1,posE);
		const strVisemes = rule.substring(posE+1);

		const o = { regex: '', move: 0, visemes: [] }

		let exp = '';
		exp += [...strLeft].map( x => ops[x] || x ).join('');
		const ctxLetters = [...strLetters];
		ctxLetters[0] = ctxLetters[0].toLowerCase();
		exp += ctxLetters.join('');
		o.move = ctxLetters.length;
		exp += [...strRight].map( x => ops[x] || x ).join('');
		o.regex = new RegExp(exp);

		if ( strVisemes.length ) {
			strVisemes.split(' ').forEach( viseme => {
				o.visemes.push(viseme);
			});
		}

		return o;
	});
})


///
/// This is an approach from the talking heads demo - it accepts text and it returns a list of visemes with time stamps
///
/// Convert a piece of text (a word, sentence, phrase) go directly to Oculus LipSync Visemes start times and durations
/// This approach one of two approaches and is different from the approach after this 
///
/// Returns a sequence like so:
///
/// "oculus": {
///    "text": "HELLO",
///    "visemes": [ "I","E","nn","O" ],
///    "times": [ 0, 0.9, 2, 2.9 ],
///    "durations": [ 0.9, 1.1, 0.9, 1.1 ],
///    "i": 5
///  }
///
/// the durations are not in milliseconds but are where the duration of a viseme is 'around 1' and the entire sequence has to be stretched to fit the audio duration
///

const FUDGE_FACTOR = 0.7

function text2Visemes(text) {

	text = text.toUpperCase()

	let o = {
		text,
		visemes: [],
		times: [],
		durations: [],
		i:0
	}

	let t = 0;

	const chars = Array.from(text)
	while( o.i < chars.length ) {
		const c = chars[o.i];
		const ruleset = rules[c];
		if ( ruleset ) {
			for(let i=0; i<ruleset.length; i++) {
				const rule = ruleset[i];
				const test = text.substring(0, o.i) + c.toLowerCase() + text.substring(o.i+1);
				let matches = test.match(rule.regex);
				if ( matches ) {
					rule.visemes.forEach( viseme => {
						const duration = viseme_durations_rpm[viseme] || 1
						if ( o.visemes.length && o.visemes[ o.visemes.length - 1 ] === viseme ) {
							o.durations[ o.durations.length - 1 ] += (FUDGE_FACTOR * duration);
							t += (FUDGE_FACTOR * duration);
						} else {
							o.visemes.push( viseme );
							o.times.push(t);
							o.durations.push( viseme_durations_rpm[viseme] || 1 );
							t += duration;
						}
					})
					o.i += rule.move;
					break;
				}
			}
		} else {
			o.i++;
			t += otherDurations[c] || 0;
		}
	}

	return o;
}

///
/// sentences to visemes - a fancy approach with attack, decay, release
///
///		input is an an array of sentences, where each sentence is an array of words, and each word is a string
///
/// 	output a 'sequence' or collection of visemes per word - an element in a sequence looks like this:
///
///			[
///				{
///					oculus: {
///						text: "hello",
///						visemes: [ 'A', 'O', 'U' ],
///						times: [ 0, 0.3, 1.2 ],
///						durations: [ 0.3, 0.8, 0.5 ],
///						i:0
///					},
///					rpm: [
///						{ ts:[ -0.5, 0.5, 1.3 ], vs:{ "viseme_FF", 0.9 } }
///						{ ts:[  0.8, 0.5, 1.8 ], vs:{ "viseme_A", 0.6 } }
///						...
///					]
///				}
///			]
///
/// each word turns into a collection of oculus viseme objects; basically just the visemes related to that word
///
/// the durations are not in milliseconds but are where the duration of a viseme is 'around 1' and the entire sequence has to be stretched to fit the audio duration
///
/// right now the output of this is not used - was from talking heads demo
///

function sentencesToVisemesFancy(sentences) {
	const VISEME_ATTACK_TIME = -0.5
	const VISEME_RELEASE_TIME = 0.5
	const VISEME_DECAY_TIME = 0.5
	const VISEME_DEGREE_LARGE = 0.9 // @todo can slightly randomize later
	const VISEME_DEGREE_MEDIUM = 0.6
	const visemes = []
	let time = 0
	const chunks2visemes = (word) => {
		const oculus = text2Visemes(word)
		if(!oculus || !oculus.visemes || !oculus.visemes.length) return
		const rpm = []
		for( let j=0; j<oculus.visemes.length; j++ ) {
			const attack = time + oculus.times[j] + VISEME_ATTACK_TIME
			const sustain = 0
			const release = time + oculus.times[j] + VISEME_RELEASE_TIME // @todo is this right?
			const decay = time + oculus.times[j] + oculus.durations[j] + VISEME_DECAY_TIME
			const ts = [ attack, release, decay ]
			const viseme = oculus.visemes[j]
			const visemeDegree = [null,(viseme === 'PP' || viseme === 'FF') ? VISEME_DEGREE_LARGE : VISEME_DEGREE_MEDIUM, 0]
			const vs = { ['viseme_'+viseme]: visemeDegree }
			rpm.push({ts,vs})
		}
		time += oculus.times[ oculus.visemes.length-1 ] + oculus.durations[ oculus.visemes.length-1 ] + VISEME_DECAY_TIME
		visemes.push({oculus,rpm})
	}
	sentences.forEach(sentence=>{
		sentence.forEach(word=>{
			chunks2visemes(word)
		})
	})
	return visemes
}


///
/// sentences to visemes - simple
///
/// this is a lighter variation of the above
/// this throws away the rpm attack/decay/release timing above and just returns a simpler list of visemes over time
/// it shifts the labor to visemesToMorphsAtTime()
///
/// given arrays of sentences and words, generate a list of visemes over time
/// 
/// we end up with an array of hashes like so:
///
///		[{
///			viseme: "I",
///			degree: 0.6,
///			start: 0,
///			end: 0.9
///		}]
///
/// the durations are not in milliseconds but are where the duration of a viseme is 'around 1' and the entire sequence has to be stretched to fit the audio duration
///

function sentencesToVisemesSimple(sentences) {

	let start = 0
	const stack = []
	const word2visemes = (word) => {
		const oculus = text2Visemes(word)
		if(!oculus || !oculus.visemes || !oculus.visemes.length) return
		for(let i = 0; i < oculus.visemes.length;i++) {
			const viseme = oculus.visemes[i]
			const duration = oculus.durations[i]
			const end = start+duration
			const degree = viseme === 'PP' || viseme === 'FF' ? 0.9 : 0.6
			const item = {
				viseme,
				degree,
				start,
				end
			}
			start = end
			stack.push(item)
		}
	}

	sentences.forEach(sentence=>{
		sentence.forEach(word=>{
			word2visemes(word)
		})
	})

	return stack
}


///
/// Given phonemes over a timeline and a given point in that timeline, calculate the visemes for that point in time
/// This approach differs from the above approach
///
/// Accepts an array of phonemes where each phoneme is something like { phoneme:'a', startOffsetS: 123 }
/// Returns an exact placement for visemes at that time as an array of 15 ordered viseme amplitudes
///
/// Time is in milliseconds
///

export function phonemesToVisemesAtTime(phonemes,time,duration, useRPM = true ) {

	const map = useRPM ? phonemeToVisemeMap_RPM : phonemeToVisemeMap_Reallusion

	// in milliseconds how long is a viseme relevant?
	const RELEVANT = 200
	let visemeData = Array(visemes_rpm.length).fill(0)

	for(let i = 0; i < phonemes.length; i++) {

		const elem = phonemes[i]
		const start = elem.offset
		const duration = i < phonemes.length - 1 ? phonemes[i+1].offset - elem.offset : RELEVANT

		// current playback time is examining an area prior to this and following elements so get out now
		if(time + RELEVANT < start) {
			return visemeData
		}

		// current time is later than this element so keep looping
		if(time - RELEVANT > start + duration) {
			continue
		}

		// estimate degree of effect
		const phoneme = elem.text[0] || ' '
		const code = map[phoneme] || 0
		if(!code) continue // never bother setting viseme_SIL ever
		const viseme = visemes_rpm[code]
		let degree = viseme === 'PP' || viseme === 'FF' ? 0.9 : 0.6

		if(time >= start && time <= start+duration) {
			// use as is
		}
		else if(time > start+duration) {
			degree *= Math.pow((start+duration+RELEVANT-time) / RELEVANT,3)
		}
		else if(time < start) {
			degree *= Math.pow((RELEVANT-start+time) / RELEVANT,3)
		}
		
		visemeData[code] = degree
	}

	return visemeData
}
