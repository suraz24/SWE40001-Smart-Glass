const { cv } = require("./utils.js");
const { GetTraceCoordinates } = require("./GetTraceCoordinates");

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
