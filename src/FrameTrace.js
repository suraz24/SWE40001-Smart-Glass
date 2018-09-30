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
		return snapshot.drawPolylines(coordinates, false);
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
