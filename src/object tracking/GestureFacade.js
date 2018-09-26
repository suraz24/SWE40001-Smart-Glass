var {cv,state}  = require('./utils');
var {ProcessFrames,ProcessHands} = require('./gesture');
var {FrameTrace} = require('./FrameTrace');
exports.state = state;
module.exports = {
	
	
	ProcessFrame: function(iFrame,oFrame,processState){
	console.log("processState Type: ",typeof(processState));

		if(processState ==  state.get('STREAM')){
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
		else if(processState == state.get('TRACE')){
			if(iFrame && oFrame)
			{
				if(snapShot == 0)
				{
					snapShot = oFrame;
				}
				const extractedHand = ProcessHands(iFrame);
				const tracedFrame = FrameTrace(extractedHand,snapShot);
				return tracedFrame;
			}
			else 
			{
				return -1;
			}
		}
		else if(processState == state.get('CALIBRATE'))
		{
			//ToDo: add algorithm of color calibration
			return -1;
		}
		else{
			console.log("GestureFacade::ProcessFrame-Error: invalid state!");
		}
	}
}

var snapShot = 0;

function resetTrace()
{
	snapShot = 0;
}