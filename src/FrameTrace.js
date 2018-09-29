const { grabFrames, cv } = require('./utils.js');
const { GetTraceCoordinates } = require('./GetTraceCoordinates')

let storageArray = []; //saves every x,y point from the start
let frameNumber = 0;    //saves the current frame number
let upperLeft = new cv.Point(0, 0);

const blue = new cv.Vec(255, 0, 0);
const green = new cv.Vec(0, 255, 0);
const red = new cv.Vec(0, 0, 255);


var snapshot = null;
var coordinates = [];

module.exports = {
	/**
	 * Draw on the @var snapshot, with coordinates extracted/drawn from current_frame
	 * UPDATE @var snapshot to latest output from @function FrameTrace
	 * @param {}
	 */
	FrameTrace: function (current_frame) {
		current_frame = base64toMat(current_frame);
		if (snapshot == null) {
			snapshot = base64toMat(current_frame);
		}

		// get coord from current_frame (xy||xy array)
		coordinates.push(GetTraceCoordinates(current_frame));
		// upperLeft = coordinates[0]
		// if(coordinates.length == 1) return;

		return snapshot.drawPolyLines(coordinates, false);

	}
}

/**
 * Split base64 string, convert to Mat
 * 
 * @param {string} base64 string
 * @returns {Mat} a Mat
 */
function base64toMat(base64) {
     var split = base64.split(',')[1]
     return cv.imdecode(Buffer.from(split, 'base64'));
}

// function FrameTrace(frame, Snapshot) {

// 	Snapshot = combineFrames(frame, Snapshot);

// 	const delay = 20;
// 	var twoPointDistance;
// 	const drawParams = Object.assign(
// 		{},
// 		{ color: green, thickness: 20 },   //can change the thickness of the drawing
// 	)
// 	var coodinates = GetTraceCoordinates(frame); //saves every point from the start to this array
// 	if (coodinates != null) {
// 		console.log("FrameTrace - coordinates: x - ", coodinates[0], ", y - ", coodinates[1]);
// 		storageArray[frameNumber] = coodinates;
// 	}
// 	else {
// 		//console.log("FrameTrace - coordinates: x - ",coodinates[0],", y - ",coodinates[1]);
// 		if (frameNumber > 0) {
// 			storageArray[frameNumber] = storageArray[frameNumber - 1];
// 		}
// 		else {
// 			storageArray[frameNumber] = [0, 0];
// 		}
// 	}
// 	console.log("frameNumber = ", frameNumber);
// 	console.log("storageArray[frameNumber]: ", storageArray[frameNumber]);
// 	if (storageArray[frameNumber][0] != null && storageArray[frameNumber][1] != null) {
// 		console.log("drawing trace");
// 		for (iterator = 1; iterator < frameNumber; iterator++) {
// 			//distance between starting point and the current pooint
// 			twoPointDistance = Math.sqrt(Math.pow((storageArray[0][0] - storageArray[frameNumber][0]), 2) + Math.pow((storageArray[0][1] - storageArray[frameNumber][1]), 2))
// 			if (frameNumber == 0) {       //if it is the first frame, then just draw a dot, because no previous x,y values
// 				console.log("drawing trace frameNumer = 0");
// 				Snapshot.drawLine(
// 					upperLeft.add(new cv.Point(storageArray[frameNumber][0], storageArray[frameNumber][1])),
// 					upperLeft.add(new cv.Point(storageArray[frameNumber][0], storageArray[frameNumber][1])),
// 					{ color: green, thickness: 5 });
// 			} else {
// 				console.log("drawing trace frameNumber != 0");
// 				Snapshot.drawLine(        //if it is not the first frame, drawlines between each previous consecutive values,in real-time this looks like a drawing
// 					upperLeft.add(new cv.Point(storageArray[iterator - 1][0], storageArray[iterator - 1][1])),
// 					upperLeft.add(new cv.Point(storageArray[iterator][0], storageArray[iterator][1])),
// 					{ color: green, thickness: 5 });
// 			}
// 		}
// 	}

// 	console.log('x: ' + storageArray[frameNumber][0] + " y: " + storageArray[frameNumber][1] + " Distance: " + twoPointDistance);
// 	frameNumber++;
// 	cv.imshow('Snapshot', Snapshot);
// 	const key = cv.waitKey(20);

// 	return Snapshot;
// }

// function combineFrames(hand, snapshot) {
// 	let src = hand;
// 	src = src.cvtColor(cv.COLOR_RGBA2RGB);
// 	for (let i = 0; i < hand.rows; i++) {
// 		for (let j = 0; j < hand.cols; j++) {
// 			if (hand.at(i, j).at(0) == 0 && hand.at(i, j).at(1) == 0 && hand.at(i, j).at(2) == 0) {
// 				let pixel = new cv.Vec(snapshot.at(i, j).at(0), snapshot.at(i, j).at(1), snapshot.at(i, j).at(2));
// 				src.set(i, j, pixel);
// 			}
// 		}
// 	}
// 	return src;

// }

// function clearTrace() {
// 	storageArray = []; //saves every x,y point from the start
// 	frameNumber = 0;    //saves the current frame number
// 	upperLeft = new cv.Point(0, 0);
// }

// module.exports = {
// 	FrameTrace: FrameTrace,
// 	CalibrateColorThreshold: function (_skinColorLower, _skinColorUpper) {
// 		const _CalibrateColorThreshold = require('./GetTraceCoordinates').CalibrateColorThreshold;
// 		_CalibrateColorThreshold(_skinColorLower, _skinColorUpper);
// 	},
// 	setHSVPercent: function (h, s, v) {
// 		const _setHSVPercent = require('./GetTraceCoordinates').setHSVPercent;
// 		_setHSVPercent(h, s, v);
// 	},
// 	clearTrace: clearTrace
// };