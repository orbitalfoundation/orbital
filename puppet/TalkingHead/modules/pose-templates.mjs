import * as THREE from 'three';

// Pose templates
// NOTE: The body weight on each pose should be on left foot
// for most natural result.

export const poseTemplates = {

  'nothing': {
    standing: true,
    props:{
      'Hips.position':{x:0, y:0.989, z:0.001},
      'Hips.rotation':{x:0.047, y:0.007, z:-0.007},
      'Spine.rotation':{x:-0.143, y:-0.007, z:0.005},
      'Spine1.rotation':{x:-0.043, y:-0.014, z:0.012},
      'Spine2.rotation':{x:0.072, y:-0.013, z:0.013},
      'Neck.rotation':{x:0.048, y:-0.003, z:0.012},
      'Head.rotation':{x:0.05, y:-0.02, z:-0.017},
      'LeftShoulder.rotation':{x:1.62, y:-0.166, z:-1.605},
      'LeftArm.rotation':{x:1.275, y:0.544, z:-0.092},
      'LeftForeArm.rotation':{x:0, y:0, z:0.302},
      'LeftHand.rotation':{x:-0.225, y:-0.154, z:0.11},
      'LeftHandThumb1.rotation':{x:0.435, y:-0.044, z:0.457},
      'LeftHandThumb2.rotation':{x:-0.028, y:0.002, z:-0.246},
      'LeftHandThumb3.rotation':{x:-0.236, y:-0.025, z:0.113},
      'LeftHandIndex1.rotation':{x:0.218, y:0.008, z:-0.081},
      'LeftHandIndex2.rotation':{x:0.165, y:-0.001, z:-0.017},
      'LeftHandIndex3.rotation':{x:0.165, y:-0.001, z:-0.017},
      'LeftHandMiddle1.rotation':{x:0.235, y:-0.011, z:-0.065},
      'LeftHandMiddle2.rotation':{x:0.182, y:-0.002, z:-0.019},
      'LeftHandMiddle3.rotation':{x:0.182, y:-0.002, z:-0.019},
      'LeftHandRing1.rotation':{x:0.316, y:-0.017, z:0.008},
      'LeftHandRing2.rotation':{x:0.253, y:-0.003, z:-0.026},
      'LeftHandRing3.rotation':{x:0.255, y:-0.003, z:-0.026},
      'LeftHandPinky1.rotation':{x:0.336, y:-0.062, z:0.088},
      'LeftHandPinky2.rotation':{x:0.276, y:-0.004, z:-0.028},
      'LeftHandPinky3.rotation':{x:0.276, y:-0.004, z:-0.028},
      'RightShoulder.rotation':{x:1.615, y:0.064, z:1.53},
      'RightArm.rotation':{x:1.313, y:-0.424, z:0.131},
      'RightForeArm.rotation':{x:0, y:0, z:-0.317},
      'RightHand.rotation':{x:-0.158, y:-0.639, z:-0.196},
      'RightHandThumb1.rotation':{x:0.44, y:0.048, z:-0.549},
      'RightHandThumb2.rotation':{x:-0.056, y:-0.008, z:0.274},
      'RightHandThumb3.rotation':{x:-0.258, y:0.031, z:-0.095},
      'RightHandIndex1.rotation':{x:0.169, y:-0.011, z:0.105},
      'RightHandIndex2.rotation':{x:0.134, y:0.001, z:0.011},
      'RightHandIndex3.rotation':{x:0.134, y:0.001, z:0.011},
      'RightHandMiddle1.rotation':{x:0.288, y:0.014, z:0.092},
      'RightHandMiddle2.rotation':{x:0.248, y:0.003, z:0.02},
      'RightHandMiddle3.rotation':{x:0.249, y:0.003, z:0.02},
      'RightHandRing1.rotation':{x:0.369, y:0.019, z:0.006},
      'RightHandRing2.rotation':{x:0.321, y:0.004, z:0.026},
      'RightHandRing3.rotation':{x:0.323, y:0.004, z:0.026}, 
      'RightHandPinky1.rotation':{x:0.468, y:0.085, z:-0.03},
      'RightHandPinky2.rotation':{x:0.427, y:0.007, z:0.034},
      'RightHandPinky3.rotation':{x:0.142, y:0.001, z:0.012},
      'LeftUpLeg.rotation':{x:-0.077, y:-0.058, z:3.126}, 
      'LeftLeg.rotation':{x:-0.252, y:0.001, z:-0.018}, 
      'LeftFoot.rotation':{x:1.315, y:-0.064, z:0.315}, 
      'LeftToeBase.rotation':{x:0.577, y:-0.07, z:-0.009},
      'RightUpLeg.rotation':{x:-0.083, y:-0.032, z:3.124},
      'RightLeg.rotation':{x:-0.272, y:-0.003, z:0.021}, 
      'RightFoot.rotation':{x:1.342, y:0.076, z:-0.222}, 
      'RightToeBase.rotation':{x:0.44, y:0.069, z:0.016}
    }
  },
/*
  'side': {
    standing: true,
    props: {
      'Hips.position':{x:0, y:1, z:0}, 'Hips.rotation':{x:-0.003, y:-0.017, z:0.1}, 'Spine.rotation':{x:-0.103, y:-0.002, z:-0.063}, 'Spine1.rotation':{x:0.042, y:-0.02, z:-0.069}, 'Spine2.rotation':{x:0.131, y:-0.012, z:-0.065}, 'Neck.rotation':{x:0.027, y:0.006, z:0}, 'Head.rotation':{x:0.077, y:-0.065, z:0}, 'LeftShoulder.rotation':{x:1.599, y:0.084, z:-1.77}, 'LeftArm.rotation':{x:1.364, y:0.052, z:-0.044}, 'LeftForeArm.rotation':{x:0.002, y:-0.007, z:0.331}, 'LeftHand.rotation':{x:0.104, y:-0.067, z:-0.174}, 'LeftHandThumb1.rotation':{x:0.231, y:0.258, z:0.355}, 'LeftHandThumb2.rotation':{x:-0.106, y:-0.339, z:-0.454}, 'LeftHandThumb3.rotation':{x:-0.02, y:-0.142, z:-0.004}, 'LeftHandIndex1.rotation':{x:0.148, y:0.032, z:-0.069}, 'LeftHandIndex2.rotation':{x:0.326, y:-0.049, z:-0.029}, 'LeftHandIndex3.rotation':{x:0.247, y:-0.053, z:-0.073}, 'LeftHandMiddle1.rotation':{x:0.238, y:-0.057, z:-0.089}, 'LeftHandMiddle2.rotation':{x:0.469, y:-0.036, z:-0.081}, 'LeftHandMiddle3.rotation':{x:0.206, y:-0.015, z:-0.017}, 'LeftHandRing1.rotation':{x:0.187, y:-0.118, z:-0.157}, 'LeftHandRing2.rotation':{x:0.579, y:0.02, z:-0.097}, 'LeftHandRing3.rotation':{x:0.272, y:0.021, z:-0.063}, 'LeftHandPinky1.rotation':{x:0.405, y:-0.182, z:-0.138}, 'LeftHandPinky2.rotation':{x:0.613, y:0.128, z:-0.144}, 'LeftHandPinky3.rotation':{x:0.268, y:0.094, z:-0.081}, 'RightShoulder.rotation':{x:1.541, y:0.192, z:1.775}, 'RightArm.rotation':{x:1.273, y:-0.352, z:-0.067}, 'RightForeArm.rotation':{x:-0.011, y:-0.031, z:-0.357}, 'RightHand.rotation':{x:-0.008, y:0.312, z:-0.028}, 'RightHandThumb1.rotation':{x:0.23, y:-0.258, z:-0.355}, 'RightHandThumb2.rotation':{x:-0.107, y:0.339, z:0.454}, 'RightHandThumb3.rotation':{x:-0.02, y:0.142, z:0.004}, 'RightHandIndex1.rotation':{x:0.148, y:-0.031, z:0.069}, 'RightHandIndex2.rotation':{x:0.326, y:0.049, z:0.029}, 'RightHandIndex3.rotation':{x:0.247, y:0.053, z:0.073}, 'RightHandMiddle1.rotation':{x:0.237, y:0.057, z:0.089}, 'RightHandMiddle2.rotation':{x:0.469, y:0.036, z:0.081}, 'RightHandMiddle3.rotation':{x:0.206, y:0.015, z:0.017}, 'RightHandRing1.rotation':{x:0.204, y:0.086, z:0.135}, 'RightHandRing2.rotation':{x:0.579, y:-0.02, z:0.098}, 'RightHandRing3.rotation':{x:0.272, y:-0.021, z:0.063}, 'RightHandPinky1.rotation':{x:0.404, y:0.182, z:0.137}, 'RightHandPinky2.rotation':{x:0.613, y:-0.128, z:0.144}, 'RightHandPinky3.rotation':{x:0.268, y:-0.094, z:0.081}, 'LeftUpLeg.rotation':{x:0.096, y:0.209, z:2.983}, 'LeftLeg.rotation':{x:-0.053, y:0.042, z:-0.017}, 'LeftFoot.rotation':{x:1.091, y:0.15, z:0.026}, 'LeftToeBase.rotation':{x:0.469, y:-0.07, z:-0.015}, 'RightUpLeg.rotation':{x:-0.307, y:-0.219, z:2.912}, 'RightLeg.rotation':{x:-0.359, y:0.164, z:0.015}, 'RightFoot.rotation':{x:1.035, y:0.11, z:0.005}, 'RightToeBase.rotation':{x:0.467, y:0.07, z:0.015}
    }
  },

  'hip':{
    standing: true,
    props: {
      'Hips.position':{x:0,y:1,z:0}, 'Hips.rotation':{x:-0.036,y:0.09,z:0.135}, 'Spine.rotation':{x:0.076,y:-0.035,z:0.01}, 'Spine1.rotation':{x:-0.096,y:0.013,z:-0.094}, 'Spine2.rotation':{x:-0.014,y:0.002,z:-0.097}, 'Neck.rotation':{x:0.034,y:-0.051,z:-0.075}, 'Head.rotation':{x:0.298,y:-0.1,z:0.154}, 'LeftShoulder.rotation':{x:1.694,y:0.011,z:-1.68}, 'LeftArm.rotation':{x:1.343,y:0.177,z:-0.153}, 'LeftForeArm.rotation':{x:-0.049,y:0.134,z:0.351}, 'LeftHand.rotation':{x:0.057,y:-0.189,z:-0.026}, 'LeftHandThumb1.rotation':{x:0.368,y:-0.066,z:0.438}, 'LeftHandThumb2.rotation':{x:-0.156,y:0.029,z:-0.369}, 'LeftHandThumb3.rotation':{x:0.034,y:-0.009,z:0.016}, 'LeftHandIndex1.rotation':{x:0.157,y:-0.002,z:-0.171}, 'LeftHandIndex2.rotation':{x:0.099,y:0,z:0}, 'LeftHandIndex3.rotation':{x:0.1,y:0,z:0}, 'LeftHandMiddle1.rotation':{x:0.222,y:-0.019,z:-0.16}, 'LeftHandMiddle2.rotation':{x:0.142,y:0,z:0}, 'LeftHandMiddle3.rotation':{x:0.141,y:0,z:0}, 'LeftHandRing1.rotation':{x:0.333,y:-0.039,z:-0.174}, 'LeftHandRing2.rotation':{x:0.214,y:0,z:0}, 'LeftHandRing3.rotation':{x:0.213,y:0,z:0}, 'LeftHandPinky1.rotation':{x:0.483,y:-0.069,z:-0.189}, 'LeftHandPinky2.rotation':{x:0.312,y:0,z:0}, 'LeftHandPinky3.rotation':{x:0.309,y:0,z:0}, 'RightShoulder.rotation':{x:1.597,y:0.012,z:1.816}, 'RightArm.rotation':{x:0.618,y:-1.274,z:-0.266}, 'RightForeArm.rotation':{x:-0.395,y:-0.097,z:-1.342}, 'RightHand.rotation':{x:-0.816,y:-0.057,z:-0.976}, 'RightHandThumb1.rotation':{x:0.42,y:0.23,z:-1.172}, 'RightHandThumb2.rotation':{x:-0.027,y:0.361,z:0.122}, 'RightHandThumb3.rotation':{x:0.076,y:0.125,z:-0.371}, 'RightHandIndex1.rotation':{x:-0.158,y:-0.045,z:0.033}, 'RightHandIndex2.rotation':{x:0.391,y:0.051,z:0.025}, 'RightHandIndex3.rotation':{x:0.317,y:0.058,z:0.07}, 'RightHandMiddle1.rotation':{x:0.486,y:0.066,z:0.014}, 'RightHandMiddle2.rotation':{x:0.718,y:0.055,z:0.07}, 'RightHandMiddle3.rotation':{x:0.453,y:0.019,z:0.013}, 'RightHandRing1.rotation':{x:0.591,y:0.241,z:0.11}, 'RightHandRing2.rotation':{x:1.014,y:0.023,z:0.097}, 'RightHandRing3.rotation':{x:0.708,y:0.008,z:0.066}, 'RightHandPinky1.rotation':{x:1.02,y:0.305,z:0.051}, 'RightHandPinky2.rotation':{x:1.187,y:-0.028,z:0.191}, 'RightHandPinky3.rotation':{x:0.872,y:-0.031,z:0.121}, 'LeftUpLeg.rotation':{x:-0.095,y:-0.058,z:-3.338}, 'LeftLeg.rotation':{x:-0.366,y:0.287,z:-0.021}, 'LeftFoot.rotation':{x:1.131,y:0.21,z:0.176}, 'LeftToeBase.rotation':{x:0.739,y:-0.068,z:-0.001}, 'RightUpLeg.rotation':{x:-0.502,y:0.362,z:3.153}, 'RightLeg.rotation':{x:-1.002,y:0.109,z:0.008}, 'RightFoot.rotation':{x:0.626,y:-0.097,z:-0.194}, 'RightToeBase.rotation':{x:1.33,y:0.288,z:-0.078}
    }
  },
*/
  'turn':{
    standing: true,
    props: {
      'Hips.position':{x:0,y:1,z:0}, 'Hips.rotation':{x:-0.07,y:-0.604,z:-0.004}, 'Spine.rotation':{x:-0.007,y:0.003,z:0.071}, 'Spine1.rotation':{x:-0.053,y:0.024,z:-0.06}, 'Spine2.rotation':{x:0.074,y:0.013,z:-0.068}, 'Neck.rotation':{x:0.03,y:0.186,z:-0.077}, 'Head.rotation':{x:0.045,y:0.243,z:-0.086}, 'LeftShoulder.rotation':{x:1.717,y:-0.085,z:-1.761}, 'LeftArm.rotation':{x:1.314,y:0.07,z:-0.057}, 'LeftForeArm.rotation':{x:-0.151,y:0.714,z:0.302}, 'LeftHand.rotation':{x:-0.069,y:0.003,z:-0.118}, 'LeftHandThumb1.rotation':{x:0.23,y:0.258,z:0.354}, 'LeftHandThumb2.rotation':{x:-0.107,y:-0.338,z:-0.455}, 'LeftHandThumb3.rotation':{x:-0.015,y:-0.142,z:0.002}, 'LeftHandIndex1.rotation':{x:0.145,y:0.032,z:-0.069}, 'LeftHandIndex2.rotation':{x:0.323,y:-0.049,z:-0.028}, 'LeftHandIndex3.rotation':{x:0.249,y:-0.053,z:-0.074}, 'LeftHandMiddle1.rotation':{x:0.235,y:-0.057,z:-0.088}, 'LeftHandMiddle2.rotation':{x:0.468,y:-0.036,z:-0.081}, 'LeftHandMiddle3.rotation':{x:0.203,y:-0.015,z:-0.017}, 'LeftHandRing1.rotation':{x:0.185,y:-0.118,z:-0.157}, 'LeftHandRing2.rotation':{x:0.578,y:0.02,z:-0.097}, 'LeftHandRing3.rotation':{x:0.27,y:0.021,z:-0.063}, 'LeftHandPinky1.rotation':{x:0.404,y:-0.182,z:-0.138}, 'LeftHandPinky2.rotation':{x:0.612,y:0.128,z:-0.144}, 'LeftHandPinky3.rotation':{x:0.267,y:0.094,z:-0.081}, 'RightShoulder.rotation':{x:1.605,y:0.17,z:1.625}, 'RightArm.rotation':{x:1.574,y:-0.655,z:0.388}, 'RightForeArm.rotation':{x:-0.36,y:-0.849,z:-0.465}, 'RightHand.rotation':{x:0.114,y:0.416,z:-0.069}, 'RightHandThumb1.rotation':{x:0.486,y:0.009,z:-0.492}, 'RightHandThumb2.rotation':{x:-0.073,y:-0.01,z:0.284}, 'RightHandThumb3.rotation':{x:-0.054,y:-0.006,z:0.209}, 'RightHandIndex1.rotation':{x:0.245,y:-0.014,z:0.052}, 'RightHandIndex2.rotation':{x:0.155,y:0,z:0}, 'RightHandIndex3.rotation':{x:0.153,y:0,z:0}, 'RightHandMiddle1.rotation':{x:0.238,y:0.004,z:0.028}, 'RightHandMiddle2.rotation':{x:0.15,y:0,z:0}, 'RightHandMiddle3.rotation':{x:0.149,y:0,z:0}, 'RightHandRing1.rotation':{x:0.267,y:0.012,z:0.007}, 'RightHandRing2.rotation':{x:0.169,y:0,z:0}, 'RightHandRing3.rotation':{x:0.167,y:0,z:0}, 'RightHandPinky1.rotation':{x:0.304,y:0.018,z:-0.021}, 'RightHandPinky2.rotation':{x:0.192,y:0,z:0}, 'RightHandPinky3.rotation':{x:0.19,y:0,z:0}, 'LeftUpLeg.rotation':{x:-0.001,y:-0.058,z:-3.238}, 'LeftLeg.rotation':{x:-0.29,y:0.058,z:-0.021}, 'LeftFoot.rotation':{x:1.288,y:0.168,z:0.183}, 'LeftToeBase.rotation':{x:0.363,y:-0.09,z:-0.01}, 'RightUpLeg.rotation':{x:-0.100,y:0.36,z:3.062}, 'RightLeg.rotation':{x:-0.67,y:-0.304,z:0.043}, 'RightFoot.rotation':{x:1.195,y:-0.159,z:-0.294}, 'RightToeBase.rotation':{x:0.737,y:0.164,z:-0.002}
    }
  },

  'bend':{
    bend: true, standing: true,
    props: {
      'Hips.position':{x:-0.007, y:0.943, z:-0.001}, 'Hips.rotation':{x:1.488, y:-0.633, z:1.435}, 'Spine.rotation':{x:-0.126, y:0.007, z:-0.057}, 'Spine1.rotation':{x:-0.134, y:0.009, z:0.01}, 'Spine2.rotation':{x:-0.019, y:0, z:-0.002}, 'Neck.rotation':{x:-0.159, y:0.572, z:-0.108}, 'Head.rotation':{x:-0.064, y:0.716, z:-0.257}, 'RightShoulder.rotation':{x:1.625, y:-0.043, z:1.382}, 'RightArm.rotation':{x:0.746, y:-0.96, z:-1.009}, 'RightForeArm.rotation':{x:-0.199, y:-0.528, z:-0.38}, 'RightHand.rotation':{x:-0.261, y:-0.043, z:-0.027}, 'RightHandThumb1.rotation':{x:0.172, y:-0.138, z:-0.445}, 'RightHandThumb2.rotation':{x:-0.158, y:0.327, z:0.545}, 'RightHandThumb3.rotation':{x:-0.062, y:0.138, z:0.152}, 'RightHandIndex1.rotation':{x:0.328, y:-0.005, z:0.132}, 'RightHandIndex2.rotation':{x:0.303, y:0.049, z:0.028}, 'RightHandIndex3.rotation':{x:0.241, y:0.046, z:0.077}, 'RightHandMiddle1.rotation':{x:0.309, y:0.074, z:0.089}, 'RightHandMiddle2.rotation':{x:0.392, y:0.036, z:0.081}, 'RightHandMiddle3.rotation':{x:0.199, y:0.014, z:0.019}, 'RightHandRing1.rotation':{x:0.239, y:0.143, z:0.091}, 'RightHandRing2.rotation':{x:0.275, y:-0.02, z:0.097}, 'RightHandRing3.rotation':{x:0.248, y:-0.023, z:0.061}, 'RightHandPinky1.rotation':{x:0.211, y:0.154, z:0.029}, 'RightHandPinky2.rotation':{x:0.348, y:-0.128, z:0.144}, 'RightHandPinky3.rotation':{x:0.21, y:-0.091, z:0.065}, 'LeftShoulder.rotation':{x:1.626, y:-0.027, z:-1.367}, 'LeftArm.rotation':{x:1.048, y:0.737, z:0.712}, 'LeftForeArm.rotation':{x:-0.508, y:0.879, z:0.625}, 'LeftHand.rotation':{x:0.06, y:-0.243, z:-0.079}, 'LeftHandThumb1.rotation':{x:0.187, y:-0.072, z:0.346}, 'LeftHandThumb2.rotation':{x:-0.066, y:0.008, z:-0.256}, 'LeftHandThumb3.rotation':{x:-0.085, y:0.014, z:-0.334}, 'LeftHandIndex1.rotation':{x:-0.1, y:0.016, z:-0.058}, 'LeftHandIndex2.rotation':{x:0.334, y:0, z:0}, 'LeftHandIndex3.rotation':{x:0.281, y:0, z:0}, 'LeftHandMiddle1.rotation':{x:-0.056, y:0, z:0}, 'LeftHandMiddle2.rotation':{x:0.258, y:0, z:0}, 'LeftHandMiddle3.rotation':{x:0.26, y:0, z:0}, 'LeftHandRing1.rotation':{x:-0.067, y:-0.002, z:0.008}, 'LeftHandRing2.rotation':{x:0.259, y:0, z:0}, 'LeftHandRing3.rotation':{x:0.276, y:0, z:0}, 'LeftHandPinky1.rotation':{x:-0.128, y:-0.007, z:0.042}, 'LeftHandPinky2.rotation':{x:0.227, y:0, z:0}, 'LeftHandPinky3.rotation':{x:0.145, y:0, z:0}, 'RightUpLeg.rotation':{x:-1.507, y:0.2, z:-3.043}, 'RightLeg.rotation':{x:-0.689, y:-0.124, z:0.017}, 'RightFoot.rotation':{x:0.909, y:0.008, z:-0.093}, 'RightToeBase.rotation':{x:0.842, y:0.075, z:-0.008}, 'LeftUpLeg.rotation':{x:-1.449, y:-0.2, z:3.018}, 'LeftLeg.rotation':{x:-0.74, y:-0.115, z:-0.008}, 'LeftFoot.rotation':{x:1.048, y:-0.058, z:0.117}, 'LeftToeBase.rotation':{x:0.807, y:-0.067, z:0.003}
    }
  },

  'back':{
    standing: true,
    props: {
      'Hips.position':{x:0,y:1,z:0}, 'Hips.rotation':{x:-0.732,y:-1.463,z:-0.637}, 'Spine.rotation':{x:-0.171,y:0.106,z:0.157}, 'Spine1.rotation':{x:-0.044,y:0.138,z:-0.059}, 'Spine2.rotation':{x:0.082,y:0.133,z:-0.074}, 'Neck.rotation':{x:0.39,y:0.591,z:-0.248}, 'Head.rotation':{x:-0.001,y:0.596,z:-0.057}, 'LeftShoulder.rotation':{x:1.676,y:0.007,z:-1.892}, 'LeftArm.rotation':{x:-5.566,y:1.188,z:-0.173}, 'LeftForeArm.rotation':{x:-0.673,y:-0.105,z:1.702}, 'LeftHand.rotation':{x:-0.469,y:-0.739,z:0.003}, 'LeftHandThumb1.rotation':{x:0.876,y:0.274,z:0.793}, 'LeftHandThumb2.rotation':{x:0.161,y:-0.23,z:-0.172}, 'LeftHandThumb3.rotation':{x:0.078,y:0.027,z:0.156}, 'LeftHandIndex1.rotation':{x:-0.085,y:-0.002,z:0.009}, 'LeftHandIndex2.rotation':{x:0.176,y:0,z:-0.002}, 'LeftHandIndex3.rotation':{x:-0.036,y:0.001,z:-0.035}, 'LeftHandMiddle1.rotation':{x:0.015,y:0.144,z:-0.076}, 'LeftHandMiddle2.rotation':{x:0.378,y:-0.007,z:-0.077}, 'LeftHandMiddle3.rotation':{x:-0.141,y:-0.001,z:0.031}, 'LeftHandRing1.rotation':{x:0.039,y:0.02,z:-0.2}, 'LeftHandRing2.rotation':{x:0.25,y:-0.002,z:-0.073}, 'LeftHandRing3.rotation':{x:0.236,y:0.006,z:-0.075}, 'LeftHandPinky1.rotation':{x:0.172,y:-0.033,z:-0.275}, 'LeftHandPinky2.rotation':{x:0.216,y:0.043,z:-0.054}, 'LeftHandPinky3.rotation':{x:0.325,y:0.078,z:-0.13}, 'RightShoulder.rotation':{x:2.015,y:-0.168,z:1.706}, 'RightArm.rotation':{x:0.203,y:-1.258,z:-0.782}, 'RightForeArm.rotation':{x:-0.658,y:-0.133,z:-1.401}, 'RightHand.rotation':{x:-1.504,y:0.375,z:-0.005}, 'RightHandThumb1.rotation':{x:0.413,y:-0.158,z:-1.121}, 'RightHandThumb2.rotation':{x:-0.142,y:-0.008,z:0.209}, 'RightHandThumb3.rotation':{x:-0.091,y:0.021,z:0.142}, 'RightHandIndex1.rotation':{x:-0.167,y:0.014,z:-0.072}, 'RightHandIndex2.rotation':{x:0.474,y:0.009,z:0.051}, 'RightHandIndex3.rotation':{x:0.115,y:0.006,z:0.047}, 'RightHandMiddle1.rotation':{x:0.385,y:0.019,z:0.144}, 'RightHandMiddle2.rotation':{x:0.559,y:0.035,z:0.101}, 'RightHandMiddle3.rotation':{x:0.229,y:0,z:0.027}, 'RightHandRing1.rotation':{x:0.48,y:0.026,z:0.23}, 'RightHandRing2.rotation':{x:0.772,y:0.038,z:0.109}, 'RightHandRing3.rotation':{x:0.622,y:0.039,z:0.106}, 'RightHandPinky1.rotation':{x:0.767,y:0.288,z:0.353}, 'RightHandPinky2.rotation':{x:0.886,y:0.049,z:0.122}, 'RightHandPinky3.rotation':{x:0.662,y:0.044,z:0.113}, 'LeftUpLeg.rotation':{x:-0.206,y:-0.268,z:-3.343}, 'LeftLeg.rotation':{x:-0.333,y:0.757,z:-0.043}, 'LeftFoot.rotation':{x:1.049,y:0.167,z:0.287}, 'LeftToeBase.rotation':{x:0.672,y:-0.069,z:-0.004}, 'RightUpLeg.rotation':{x:0.055,y:-0.226,z:3.037}, 'RightLeg.rotation':{x:-0.559,y:0.39,z:-0.001}, 'RightFoot.rotation':{x:1.2,y:0.133,z:0.085}, 'RightToeBase.rotation':{x:0.92,y:0.093,z:-0.013}
    }
  },

  'straight':{
    standing: true,
    props: {
      'Hips.position':{x:0, y:0.989, z:0.001}, 'Hips.rotation':{x:0.047, y:0.007, z:-0.007}, 'Spine.rotation':{x:-0.143, y:-0.007, z:0.005}, 'Spine1.rotation':{x:-0.043, y:-0.014, z:0.012}, 'Spine2.rotation':{x:0.072, y:-0.013, z:0.013}, 'Neck.rotation':{x:0.048, y:-0.003, z:0.012}, 'Head.rotation':{x:0.05, y:-0.02, z:-0.017}, 'LeftShoulder.rotation':{x:1.62, y:-0.166, z:-1.605}, 'LeftArm.rotation':{x:1.275, y:0.544, z:-0.092}, 'LeftForeArm.rotation':{x:0, y:0, z:0.302}, 'LeftHand.rotation':{x:-0.225, y:-0.154, z:0.11}, 'LeftHandThumb1.rotation':{x:0.435, y:-0.044, z:0.457}, 'LeftHandThumb2.rotation':{x:-0.028, y:0.002, z:-0.246}, 'LeftHandThumb3.rotation':{x:-0.236, y:-0.025, z:0.113}, 'LeftHandIndex1.rotation':{x:0.218, y:0.008, z:-0.081}, 'LeftHandIndex2.rotation':{x:0.165, y:-0.001, z:-0.017}, 'LeftHandIndex3.rotation':{x:0.165, y:-0.001, z:-0.017}, 'LeftHandMiddle1.rotation':{x:0.235, y:-0.011, z:-0.065}, 'LeftHandMiddle2.rotation':{x:0.182, y:-0.002, z:-0.019}, 'LeftHandMiddle3.rotation':{x:0.182, y:-0.002, z:-0.019}, 'LeftHandRing1.rotation':{x:0.316, y:-0.017, z:0.008}, 'LeftHandRing2.rotation':{x:0.253, y:-0.003, z:-0.026}, 'LeftHandRing3.rotation':{x:0.255, y:-0.003, z:-0.026}, 'LeftHandPinky1.rotation':{x:0.336, y:-0.062, z:0.088}, 'LeftHandPinky2.rotation':{x:0.276, y:-0.004, z:-0.028}, 'LeftHandPinky3.rotation':{x:0.276, y:-0.004, z:-0.028}, 'RightShoulder.rotation':{x:1.615, y:0.064, z:1.53}, 'RightArm.rotation':{x:1.313, y:-0.424, z:0.131}, 'RightForeArm.rotation':{x:0, y:0, z:-0.317}, 'RightHand.rotation':{x:-0.158, y:-0.639, z:-0.196}, 'RightHandThumb1.rotation':{x:0.44, y:0.048, z:-0.549}, 'RightHandThumb2.rotation':{x:-0.056, y:-0.008, z:0.274}, 'RightHandThumb3.rotation':{x:-0.258, y:0.031, z:-0.095}, 'RightHandIndex1.rotation':{x:0.169, y:-0.011, z:0.105}, 'RightHandIndex2.rotation':{x:0.134, y:0.001, z:0.011}, 'RightHandIndex3.rotation':{x:0.134, y:0.001, z:0.011}, 'RightHandMiddle1.rotation':{x:0.288, y:0.014, z:0.092}, 'RightHandMiddle2.rotation':{x:0.248, y:0.003, z:0.02}, 'RightHandMiddle3.rotation':{x:0.249, y:0.003, z:0.02}, 'RightHandRing1.rotation':{x:0.369, y:0.019, z:0.006}, 'RightHandRing2.rotation':{x:0.321, y:0.004, z:0.026}, 'RightHandRing3.rotation':{x:0.323, y:0.004, z:0.026}, 'RightHandPinky1.rotation':{x:0.468, y:0.085, z:-0.03}, 'RightHandPinky2.rotation':{x:0.427, y:0.007, z:0.034}, 'RightHandPinky3.rotation':{x:0.142, y:0.001, z:0.012}, 'LeftUpLeg.rotation':{x:-0.077, y:-0.058, z:3.126}, 'LeftLeg.rotation':{x:-0.252, y:0.001, z:-0.018}, 'LeftFoot.rotation':{x:1.315, y:-0.064, z:0.315}, 'LeftToeBase.rotation':{x:0.577, y:-0.07, z:-0.009}, 'RightUpLeg.rotation':{x:-0.083, y:-0.032, z:3.124}, 'RightLeg.rotation':{x:-0.272, y:-0.003, z:0.021}, 'RightFoot.rotation':{x:1.342, y:0.076, z:-0.222}, 'RightToeBase.rotation':{x:0.44, y:0.069, z:0.016}
    }
  },

  'wide':{
    standing: true,
    props: {
      'Hips.position':{x:0, y:1.017, z:0.016}, 'Hips.rotation':{x:0.064, y:-0.048, z:0.059}, 'Spine.rotation':{x:-0.123, y:0, z:-0.018}, 'Spine1.rotation':{x:0.014, y:0.003, z:-0.006}, 'Spine2.rotation':{x:0.04, y:0.003, z:-0.007}, 'Neck.rotation':{x:0.101, y:0.007, z:-0.035}, 'Head.rotation':{x:-0.091, y:-0.049, z:0.105}, 'RightShoulder.rotation':{x:1.831, y:0.017, z:1.731}, 'RightArm.rotation':{x:-1.673, y:-1.102, z:-3.132}, 'RightForeArm.rotation':{x:0.265, y:0.23, z:-0.824}, 'RightHand.rotation':{x:-0.52, y:0.345, z:-0.061}, 'RightHandThumb1.rotation':{x:0.291, y:0.056, z:-0.428}, 'RightHandThumb2.rotation':{x:0.025, y:0.005, z:0.166}, 'RightHandThumb3.rotation':{x:-0.089, y:0.009, z:0.068}, 'RightHandIndex1.rotation':{x:0.392, y:-0.015, z:0.11}, 'RightHandIndex2.rotation':{x:0.391, y:0.001, z:0.004}, 'RightHandIndex3.rotation':{x:0.326, y:0, z:0.003}, 'RightHandMiddle1.rotation':{x:0.285, y:0.068, z:0.081}, 'RightHandMiddle2.rotation':{x:0.519, y:0.004, z:0.011}, 'RightHandMiddle3.rotation':{x:0.252, y:0, z:0.001}, 'RightHandRing1.rotation':{x:0.207, y:0.133, z:0.146}, 'RightHandRing2.rotation':{x:0.597, y:0.004, z:0.004}, 'RightHandRing3.rotation':{x:0.292, y:0.002, z:0.012}, 'RightHandPinky1.rotation':{x:0.338, y:0.182, z:0.136}, 'RightHandPinky2.rotation':{x:0.533, y:0.002, z:0.004}, 'RightHandPinky3.rotation':{x:0.194, y:0, z:0.002}, 'LeftShoulder.rotation':{x:1.83, y:-0.063, z:-1.808}, 'LeftArm.rotation':{x:-1.907, y:1.228, z:-2.959}, 'LeftForeArm.rotation':{x:-0.159, y:0.268, z:0.572}, 'LeftHand.rotation':{x:0.069, y:-0.498, z:-0.025}, 'LeftHandThumb1.rotation':{x:0.738, y:0.123, z:0.178}, 'LeftHandThumb2.rotation':{x:-0.26, y:0.028, z:-0.477}, 'LeftHandThumb3.rotation':{x:-0.448, y:0.093, z:-0.661}, 'LeftHandIndex1.rotation':{x:1.064, y:0.005, z:-0.13}, 'LeftHandIndex2.rotation':{x:1.55, y:-0.143, z:-0.136}, 'LeftHandIndex3.rotation':{x:0.722, y:-0.076, z:-0.127}, 'LeftHandMiddle1.rotation':{x:1.095, y:-0.091, z:0.006}, 'LeftHandMiddle2.rotation':{x:1.493, y:-0.174, z:-0.151}, 'LeftHandMiddle3.rotation':{x:0.651, y:-0.031, z:-0.087}, 'LeftHandRing1.rotation':{x:1.083, y:-0.224, z:0.072}, 'LeftHandRing2.rotation':{x:1.145, y:-0.107, z:-0.195}, 'LeftHandRing3.rotation':{x:1.208, y:-0.134, z:-0.158}, 'LeftHandPinky1.rotation':{x:0.964, y:-0.383, z:0.128}, 'LeftHandPinky2.rotation':{x:1.457, y:-0.146, z:-0.159}, 'LeftHandPinky3.rotation':{x:1.019, y:-0.102, z:-0.141}, 'RightUpLeg.rotation':{x:-0.221, y:-0.233, z:2.87}, 'RightLeg.rotation':{x:-0.339, y:-0.043, z:-0.041}, 'RightFoot.rotation':{x:1.081, y:0.177, z:0.114}, 'RightToeBase.rotation':{x:0.775, y:0, z:0}, 'LeftUpLeg.rotation':{x:-0.185, y:0.184, z:3.131}, 'LeftLeg.rotation':{x:-0.408, y:0.129, z:0.02}, 'LeftFoot.rotation':{x:1.167, y:-0.002, z:-0.007}, 'LeftToeBase.rotation':{x:0.723, y:0, z:0}
    }
  },

  'oneknee':{
    kneeling: true,
    props: {
      'Hips.position':{x:-0.005, y:0.415, z:-0.017}, 'Hips.rotation':{x:-0.25, y:0.04, z:-0.238}, 'Spine.rotation':{x:0.037, y:0.043, z:0.047}, 'Spine1.rotation':{x:0.317, y:0.103, z:0.066}, 'Spine2.rotation':{x:0.433, y:0.109, z:0.054}, 'Neck.rotation':{x:-0.156, y:-0.092, z:0.059}, 'Head.rotation':{x:-0.398, y:-0.032, z:0.018}, 'RightShoulder.rotation':{x:1.546, y:0.119, z:1.528}, 'RightArm.rotation':{x:0.896, y:-0.247, z:-0.512}, 'RightForeArm.rotation':{x:0.007, y:0, z:-1.622}, 'RightHand.rotation':{x:1.139, y:-0.853, z:0.874}, 'RightHandThumb1.rotation':{x:0.176, y:0.107, z:-0.311}, 'RightHandThumb2.rotation':{x:-0.047, y:-0.003, z:0.12}, 'RightHandThumb3.rotation':{x:0, y:0, z:0}, 'RightHandIndex1.rotation':{x:0.186, y:0.005, z:0.125}, 'RightHandIndex2.rotation':{x:0.454, y:0.005, z:0.015}, 'RightHandIndex3.rotation':{x:0, y:0, z:0}, 'RightHandMiddle1.rotation':{x:0.444, y:0.035, z:0.127}, 'RightHandMiddle2.rotation':{x:0.403, y:-0.006, z:-0.04}, 'RightHandMiddle3.rotation':{x:0, y:0, z:0}, 'RightHandRing1.rotation':{x:0.543, y:0.074, z:0.121}, 'RightHandRing2.rotation':{x:0.48, y:-0.018, z:-0.063}, 'RightHandRing3.rotation':{x:0, y:0, z:0}, 'RightHandPinky1.rotation':{x:0.464, y:0.086, z:0.113}, 'RightHandPinky2.rotation':{x:0.667, y:-0.06, z:-0.128}, 'RightHandPinky3.rotation':{x:0, y:0, z:0}, 'LeftShoulder.rotation':{x:1.545, y:-0.116, z:-1.529}, 'LeftArm.rotation':{x:0.799, y:0.631, z:0.556}, 'LeftForeArm.rotation':{x:-0.002, y:0.007, z:0.926}, 'LeftHand.rotation':{x:-0.508, y:0.439, z:0.502}, 'LeftHandThumb1.rotation':{x:0.651, y:-0.035, z:0.308}, 'LeftHandThumb2.rotation':{x:-0.053, y:0.008, z:-0.11}, 'LeftHandThumb3.rotation':{x:0, y:0, z:0}, 'LeftHandIndex1.rotation':{x:0.662, y:-0.053, z:-0.116}, 'LeftHandIndex2.rotation':{x:0.309, y:-0.004, z:-0.02}, 'LeftHandIndex3.rotation':{x:0, y:0, z:0}, 'LeftHandMiddle1.rotation':{x:0.501, y:-0.062, z:-0.12}, 'LeftHandMiddle2.rotation':{x:0.144, y:-0.002, z:0.016}, 'LeftHandMiddle3.rotation':{x:0, y:0, z:0}, 'LeftHandRing1.rotation':{x:0.397, y:-0.029, z:-0.143}, 'LeftHandRing2.rotation':{x:0.328, y:0.01, z:0.059}, 'LeftHandRing3.rotation':{x:0, y:0, z:0}, 'LeftHandPinky1.rotation':{x:0.194, y:0.008, z:-0.164}, 'LeftHandPinky2.rotation':{x:0.38, y:0.031, z:0.128}, 'LeftHandPinky3.rotation':{x:0, y:0, z:0}, 'RightUpLeg.rotation':{x:-1.594, y:-0.251, z:2.792}, 'RightLeg.rotation':{x:-2.301, y:-0.073, z:0.055}, 'RightFoot.rotation':{x:1.553, y:-0.207, z:-0.094}, 'RightToeBase.rotation':{x:0.459, y:0.069, z:0.016}, 'LeftUpLeg.rotation':{x:-0.788, y:-0.236, z:-2.881}, 'LeftLeg.rotation':{x:-2.703, y:0.012, z:-0.047}, 'LeftFoot.rotation':{x:2.191, y:-0.102, z:0.019}, 'LeftToeBase.rotation':{x:1.215, y:-0.027, z:0.01}
    }
  },

  'kneel':{
    kneeling: true, lying: true,
    props: {
      'Hips.position':{x:0, y:0.532, z:-0.002}, 'Hips.rotation':{x:0.018, y:-0.008, z:-0.017}, 'Spine.rotation':{x:-0.139, y:-0.01, z:0.002}, 'Spine1.rotation':{x:0.002, y:-0.002, z:0.001}, 'Spine2.rotation':{x:0.028, y:-0.002, z:0.001}, 'Neck.rotation':{x:-0.007, y:0, z:-0.002}, 'Head.rotation':{x:-0.02, y:-0.008, z:-0.004}, 'LeftShoulder.rotation':{x:1.77, y:-0.428, z:-1.588}, 'LeftArm.rotation':{x:0.911, y:0.343, z:0.083}, 'LeftForeArm.rotation':{x:0, y:0, z:0.347}, 'LeftHand.rotation':{x:0.033, y:-0.052, z:-0.105}, 'LeftHandThumb1.rotation':{x:0.508, y:-0.22, z:0.708}, 'LeftHandThumb2.rotation':{x:-0.323, y:-0.139, z:-0.56}, 'LeftHandThumb3.rotation':{x:-0.328, y:0.16, z:-0.301}, 'LeftHandIndex1.rotation':{x:0.178, y:0.248, z:0.045}, 'LeftHandIndex2.rotation':{x:0.236, y:-0.002, z:-0.019}, 'LeftHandIndex3.rotation':{x:-0.062, y:0, z:0.005}, 'LeftHandMiddle1.rotation':{x:0.123, y:-0.005, z:-0.019}, 'LeftHandMiddle2.rotation':{x:0.589, y:-0.014, z:-0.045}, 'LeftHandMiddle3.rotation':{x:0.231, y:-0.002, z:-0.019}, 'LeftHandRing1.rotation':{x:0.196, y:-0.008, z:-0.091}, 'LeftHandRing2.rotation':{x:0.483, y:-0.009, z:-0.038}, 'LeftHandRing3.rotation':{x:0.367, y:-0.005, z:-0.029}, 'LeftHandPinky1.rotation':{x:0.191, y:-0.269, z:-0.246}, 'LeftHandPinky2.rotation':{x:0.37, y:-0.006, z:-0.029}, 'LeftHandPinky3.rotation':{x:0.368, y:-0.005, z:-0.029}, 'RightShoulder.rotation':{x:1.73, y:0.434, z:1.715}, 'RightArm.rotation':{x:0.841, y:-0.508, z:-0.155}, 'RightForeArm.rotation':{x:0, y:0, z:-0.355}, 'RightHand.rotation':{x:0.091, y:0.137, z:0.197}, 'RightHandThumb1.rotation':{x:0.33, y:0.051, z:-0.753}, 'RightHandThumb2.rotation':{x:-0.113, y:0.075, z:0.612}, 'RightHandThumb3.rotation':{x:-0.271, y:-0.166, z:0.164}, 'RightHandIndex1.rotation':{x:0.073, y:0.001, z:-0.093}, 'RightHandIndex2.rotation':{x:0.338, y:0.006, z:0.034}, 'RightHandIndex3.rotation':{x:0.131, y:0.001, z:0.013}, 'RightHandMiddle1.rotation':{x:0.13, y:0.005, z:-0.017}, 'RightHandMiddle2.rotation':{x:0.602, y:0.018, z:0.058}, 'RightHandMiddle3.rotation':{x:-0.031, y:0, z:-0.003}, 'RightHandRing1.rotation':{x:0.351, y:0.019, z:0.045}, 'RightHandRing2.rotation':{x:0.19, y:0.002, z:0.019}, 'RightHandRing3.rotation':{x:0.21, y:0.002, z:0.021}, 'RightHandPinky1.rotation':{x:0.256, y:0.17, z:0.118}, 'RightHandPinky2.rotation':{x:0.451, y:0.01, z:0.045}, 'RightHandPinky3.rotation':{x:0.346, y:0.006, z:0.035}, 'LeftUpLeg.rotation':{x:-0.06, y:0.1, z:-2.918}, 'LeftLeg.rotation':{x:-1.933, y:-0.01, z:0.011}, 'LeftFoot.rotation':{x:0.774, y:-0.162, z:-0.144}, 'LeftToeBase.rotation':{x:1.188, y:0, z:0}, 'RightUpLeg.rotation':{x:-0.099, y:-0.057, z:2.922}, 'RightLeg.rotation':{x:-1.93, y:0.172, z:-0.02}, 'RightFoot.rotation':{x:0.644, y:0.251, z:0.212}, 'RightToeBase.rotation':{x:0.638, y:-0.034, z:-0.001}
    }
  },

  'sitting': {
    sitting: true, lying: true,
    props: {
      'Hips.position':{x:0, y:0.117, z:0.005}, 'Hips.rotation':{x:-0.411, y:-0.049, z:0.056}, 'Spine.rotation':{x:0.45, y:-0.039, z:-0.116}, 'Spine1.rotation':{x:0.092, y:-0.076, z:0.08}, 'Spine2.rotation':{x:0.073, y:0.035, z:0.066}, 'Neck.rotation':{x:0.051, y:0.053, z:-0.079}, 'Head.rotation':{x:-0.169, y:0.009, z:0.034}, 'LeftShoulder.rotation':{x:1.756, y:-0.037, z:-1.301}, 'LeftArm.rotation':{x:-0.098, y:0.016, z:1.006}, 'LeftForeArm.rotation':{x:-0.089, y:0.08, z:0.837}, 'LeftHand.rotation':{x:0.262, y:-0.399, z:0.3}, 'LeftHandThumb1.rotation':{x:0.149, y:-0.043, z:0.452}, 'LeftHandThumb2.rotation':{x:0.032, y:0.006, z:-0.162}, 'LeftHandThumb3.rotation':{x:-0.086, y:-0.005, z:-0.069}, 'LeftHandIndex1.rotation':{x:0.145, y:0.032, z:-0.069}, 'LeftHandIndex2.rotation':{x:0.325, y:-0.001, z:-0.004}, 'LeftHandIndex3.rotation':{x:0.253, y:0, z:-0.003}, 'LeftHandMiddle1.rotation':{x:0.186, y:-0.051, z:-0.091}, 'LeftHandMiddle2.rotation':{x:0.42, y:-0.003, z:-0.011}, 'LeftHandMiddle3.rotation':{x:0.153, y:0.001, z:-0.001}, 'LeftHandRing1.rotation':{x:0.087, y:-0.19, z:-0.078}, 'LeftHandRing2.rotation':{x:0.488, y:-0.004, z:-0.005}, 'LeftHandRing3.rotation':{x:0.183, y:-0.001, z:-0.012}, 'LeftHandPinky1.rotation':{x:0.205, y:-0.262, z:0.051}, 'LeftHandPinky2.rotation':{x:0.407, y:-0.002, z:-0.004}, 'LeftHandPinky3.rotation':{x:0.068, y:0, z:-0.002}, 'RightShoulder.rotation':{x:1.619, y:-0.139, z:1.179}, 'RightArm.rotation':{x:0.17, y:-0.037, z:-1.07}, 'RightForeArm.rotation':{x:-0.044, y:-0.056, z:-0.665}, 'RightHand.rotation':{x:0.278, y:0.454, z:-0.253}, 'RightHandThumb1.rotation':{x:0.173, y:0.089, z:-0.584}, 'RightHandThumb2.rotation':{x:-0.003, y:-0.004, z:0.299}, 'RightHandThumb3.rotation':{x:-0.133, y:-0.002, z:0.235}, 'RightHandIndex1.rotation':{x:0.393, y:-0.023, z:0.108}, 'RightHandIndex2.rotation':{x:0.391, y:0.001, z:0.004}, 'RightHandIndex3.rotation':{x:0.326, y:0, z:0.003}, 'RightHandMiddle1.rotation':{x:0.285, y:0.062, z:0.086}, 'RightHandMiddle2.rotation':{x:0.519, y:0.003, z:0.011}, 'RightHandMiddle3.rotation':{x:0.252, y:-0.001, z:0.001}, 'RightHandRing1.rotation':{x:0.207, y:0.122, z:0.155}, 'RightHandRing2.rotation':{x:0.597, y:0.004, z:0.005}, 'RightHandRing3.rotation':{x:0.292, y:0.001, z:0.012}, 'RightHandPinky1.rotation':{x:0.338, y:0.171, z:0.149}, 'RightHandPinky2.rotation':{x:0.533, y:0.002, z:0.004}, 'RightHandPinky3.rotation':{x:0.194, y:0, z:0.002}, 'LeftUpLeg.rotation':{x:-1.957, y:0.083, z:-2.886}, 'LeftLeg.rotation':{x:-1.46, y:0.123, z:0.005}, 'LeftFoot.rotation':{x:-0.013, y:0.016, z:0.09}, 'LeftToeBase.rotation':{x:0.744, y:0, z:0}, 'RightUpLeg.rotation':{x:-1.994, y:0.125, z:2.905}, 'RightLeg.rotation':{x:-1.5, y:-0.202, z:-0.006}, 'RightFoot.rotation':{x:-0.012, y:-0.065, z:0.081}, 'RightToeBase.rotation':{x:0.758, y:0, z:0}
    }
  }
};

/**
* Convert internal notation to THREE objects.
* NOTE: All rotations are converted to quaternions.
* @param {Object} p Pose
* @return {Object} A new pose object.
*/
function propsToThreeObjects(p) {
  const r = {};
  for( let [key,val] of Object.entries(p) ) {
    const ids = key.split('.');
    let v;
    if ( ids[1] === 'position' || ids[1] === 'scale' ) {
      v = new THREE.Vector3(val.x,val.y,val.z);
    } else if ( ids[1] === 'rotation' ) {
      key = ids[0] + '.quaternion';
      v = new THREE.Quaternion().setFromEuler(new THREE.Euler(val.x,val.y,val.z,'XYZ')).normalize();
    } else if ( ids[1] === 'quaternion' ) {
      v = new THREE.Quaternion(val.x,val.y,val.z,val.w).normalize();
    }
    if (v) {
      r[key] = v;
    }
  }

  return r;
}

// Convert all the pose templates to THREE objects
Object.values(poseTemplates).forEach( x => {
  x.props = propsToThreeObjects( x.props );
});

// Pose deltas
// NOTE: In this object (x,y,z) are always Euler rotations despite the name!!
// NOTE: This object should include all the used delta properties.
export const poseDelta = {
  props: {
    'Hips.quaternion':{x:0, y:0, z:0},'Spine.quaternion':{x:0, y:0, z:0},
    'Spine1.quaternion':{x:0, y:0, z:0}, 'Neck.quaternion':{x:0, y:0, z:0},
    'Head.quaternion':{x:0, y:0, z:0}, 'Spine1.scale':{x:0, y:0, z:0},
    'Neck.scale':{x:0, y:0, z:0}, 'LeftArm.scale':{x:0, y:0, z:0},
    'RightArm.scale':{x:0, y:0, z:0}
  }
};
// Add legs, arms and hands
['Left','Right'].forEach( x => {
  ['Leg','UpLeg','Arm','ForeArm','Hand'].forEach( y => {
    poseDelta.props[x+y+'.quaternion'] = {x:0, y:0, z:0};
  });
  ['HandThumb', 'HandIndex','HandMiddle','HandRing', 'HandPinky'].forEach( y => {
    poseDelta.props[x+y+'1.quaternion'] = {x:0, y:0, z:0};
    poseDelta.props[x+y+'2.quaternion'] = {x:0, y:0, z:0};
    poseDelta.props[x+y+'3.quaternion'] = {x:0, y:0, z:0};
  });
})

// Dynamically pick up all the property names that we need in the code
const names = new Set();
Object.values(poseTemplates).forEach( x => {
  Object.keys(x.props).forEach( y => names.add(y) );
});
Object.keys( poseDelta.props ).forEach( x => {
  names.add(x)
});

console.log(names)

export const posePropNames = [...names];

