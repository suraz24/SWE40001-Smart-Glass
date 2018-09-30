const { cv } = require("./utils.js");
const { GetTraceCoordinates } = require("./GetTraceCoordinates");

var snapshot = null;
var coordinates = [];

module.exports = {
<<<<<<< HEAD
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
=======
  /**
   * Draw on the @var snapshot, with coordinates extracted/drawn from current_frame
   * UPDATE @var snapshot to latest output from @function FrameTrace
   * @param {}
   */
  FrameTrace: function(current_frame) {
    current_frame = base64toMat(current_frame);
    if (snapshot == null) {
      console.log("This is the first time");
      snapshot = current_frame;
	}

	//get coord from current_frame (xy||xy array)
    tempCoord = GetTraceCoordinates(current_frame);
    if(tempCoord !== null) {
    	coordinates.push(GetTraceCoordinates(current_frame));
	}
>>>>>>> b13fd7b9b6f5924f03e582366fa9f47bcb16432a

	//return the coordinates to the client
	return coordinates;
}
};
/**
 * Split base64 string, convert to Mat
 *
 * @param {string} base64 string
 * @returns {Mat} a Mat
 */
function base64toMat(base64) {
<<<<<<< HEAD
	var split = base64.split(',')[1]
	return cv.imdecode(Buffer.from(split, 'base64'));
=======
  var split = base64.split(",")[1];
  return cv.imdecode(Buffer.from(split, "base64"));
>>>>>>> b13fd7b9b6f5924f03e582366fa9f47bcb16432a
}
