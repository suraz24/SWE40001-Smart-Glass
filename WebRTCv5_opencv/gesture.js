var cv = require('opencv4nodejs');

module.exports = {
     ProcessFrames: function (instructorFrame, operatorFrame) {
          
          return new Promise(resolve=>{

               var oFrame = base64toMat(operatorFrame);
               var iFrame = base64toMat(instructorFrame);

               var processedMat = grabCut(iFrame, oFrame);

               resolve(cv.imencode('.jpeg', processedMat).toString('base64'))
          })

          // return cv.imencode('.jpeg', processedMat).toString('base64');
     }
}


// segmenting by skin color (has to be adjusted)
const skinColorUpper = hue => new cv.Vec(hue, 0.8 * 255, 0.6 * 255);
const skinColorLower = hue => new cv.Vec(hue, 0.1 * 255, 0.05 * 255);


/**
 * Split base64 string, decode to Mat
 * 
 * @param {string} base64 
 * @returns {Mat} a Mat
 */
function base64toMat(base64) {
     return cv.imdecode(new Buffer(base64.split(',')[1], 'base64'));
}

/**
 * Extract hands from handFrame
 * 
 * @param {Mat} handFrame 
 * @param {Mat} backgroundFrame 
 * @returns a Mat, combined with hands from handFrame and backgroundFrame
 */
function grabCut(handFrame, backgroundFrame) {
     let src = handFrame;
     let background = backgroundFrame;
     src = src.cvtColor(cv.COLOR_RGBA2RGB);
     background = background.cvtColor(cv.COLOR_RGBA2RGB);
     let ksrc = src;
     const handMask = makeHandMask(src);
     // draw foreground
     for (let i = 0; i < src.rows; i++) {
          for (let j = 0; j < src.cols; j++) {
               if (handMask.at(i, j) == 0) {
                    let pixel = new cv.Vec(background.at(i, j).at(0), background.at(i, j).at(1), background.at(i, j).at(2));
                    ksrc.set(i, j, pixel);
               }
          }
     }
     return cv.imencode('.jpg', ksrc).toString('base64');
}

function makeHandMask(img) {
     // filter by skin color
     const imgHLS = img.cvtColor(cv.COLOR_BGR2HLS);
     const rangeMask = imgHLS.inRange(skinColorLower(0), skinColorUpper(12));

     // remove noise
     const blurred = rangeMask.blur(new cv.Size(10, 10));
     //const thresholded = blurred.threshold(200, 255, cv.THRESH_BINARY);
     const thresholded = blurred.threshold(100, 500, cv.THRESH_BINARY);

     return thresholded;
};