var {cv,state}  = require('./utils');
var {ProcessFrames,ProcessHands,setHSVPercent} = require('./gesture');
var {FrameTrace,clearTrace} = require('./FrameTrace');

exports.state = state;
module.exports = {
	
	
	ProcessFrame: function(iFrame,oFrame,processState){
		if(state.get(processState) ==  state.get('STREAM')){
			return streamState(iFrame,oFrame,processState);
		}
		else if(state.get(processState) == state.get('TRACE')){
			return traceState(iFrame,oFrame,processState);
		}
		else if(state.get(processState) == state.get('CALIBRATE'))
		{
			//ToDo: add algorithm of color calibration
			return -1;
		}
		else{
			console.log("GestureFacade::ProcessFrame-Error: invalid state!");
		}
	},
	CalibrateColorRange: function(_skinColorLower,_skinColorUpper){
		var CalibrateColorThresholdTrace  = require('./FrameTrace').CalibrateColorThreshold;
		var CalibrateColorThresholdGesture = require('./gesture').CalibrateColorThreshold;
		CalibrateColorThresholdTrace(_skinColorLower,_skinColorUpper);
		CalibrateColorThresholdGesture(_skinColorLower,_skinColorUpper);
	},
	CalibrateGrabCutThreshold: function(_min,_max)
	{
		var ClaibrateThresholdGrabCutMinMax = require('./gesture').ClaibrateThresholdGrabCutMinMax;
		ClaibrateThresholdGrabCutMinMax(_min,_max);
	},
	setHSVPercent: function(h,s,v){ //decimal value percentage
	    var _setHSVPercent = require('./gesture').setHSVPercent;
		_setHSVPercent(h,s,v);
	},
	skinColorUpperHSV: function(h,s,v)
	{
		console.log("skinColorUpperHSV: h - ",h,", s - ",s," v - ",v);
		var skinColorUpperHSV = require('./utils').skinColorUpperHSV;
		return skinColorUpperHSV(h,s,v);
	},
	skinColorLowerHSV: function(h,s,v)
	{
		console.log("skinColorLowerHSV: h - ",h,", s - ",s," v - ",v);
		var skinColorLowerHSV = require('./utils').skinColorLowerHSV;
		return skinColorLowerHSV(h,s,v);
	}
	
}


function streamState(iFrame,oFrame,processState)
{
	console.log("Current State: STREAM");
	if(snapShot != 0)
	{
		//reset snapshot for next trace 
		resetTrace();
	}
	
	if(iFrame)
	{
		return ProcessHands(iFrame);
	}
	else 
	{
		return -1;
	}
}

function traceState(iFrame,oFrame,processState)
{
	console.log("Current State: TRACE");
	if(iFrame && oFrame)
	{
		var extractedHand = ProcessHands(iFrame);
		//console.log("extractedHand: ", extractedHand);
		iFrame = b64toMat(iFrame);
		oFrame = b64toMat(oFrame);
		extractedHand = b64toMat(extractedHand);
		console.log("iFrame and oFrame converted to Mat type!");
		if(snapShot == null)
		{
			snapShot = oFrame;
			console.log("snapShot stored!");
		}	
		const tracedFrame = FrameTrace(extractedHand,snapShot);
		const tracedFrameOutBase64 = outBase64(tracedFrame);
		return tracedFrameOutBase64;
	}
	else 
	{
		return -1;
	}
}


var snapShot = null;

function resetTrace()
{
	snapShot = null;
	clearTrace();
}


function  b64toMat(base64) 
{
		console.log("converting Base64 to Mat type!");
		 var split = base64.split(',')[1]
		 return cv.imdecode(Buffer.from(split, 'base64'));
}

function outBase64(processedMat)
{
	var _outBase64 = "data:image/png;base64," + cv.imencode('.png',processedMat).toString('base64');
	return _outBase64;
}