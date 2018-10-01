const { cv } = require("./utils.js");
const { GetTraceCoordinates,_Set_HSV_Trace } = require("./GetTraceCoordinates");

var lH = 0;
var lS = 0.1;
var lV = 0.05;
var uH = 12;
var uS = 0.8;
var uV = 0.6;
var variance = 0.3;

var snapshot = null;
// var coordinates = [];

module.exports = {
	/**
	 * Draw on the @var snapshot, with coordinates extracted/drawn from current_frame
	 * UPDATE @var snapshot to latest output from @function FrameTrace
	 * @param {}
	 */
	FrameTrace: function (current_frame) {
		current_frame = base64toMat(current_frame);

		return GetTraceCoordinates(current_frame);
	},
	Set_HSV_Trace: function(hsv) {
		_Set_HSV_Trace(hsv);
	}
};
/**
 * Split base64 string, convert to Mat
 *
 * @param {string} base64 string
 * @returns {Mat} a Mat
 */
function base64toMat(base64) {
	var split = base64.split(",")[1];
	return cv.imdecode(Buffer.from(split, "base64"));
}
