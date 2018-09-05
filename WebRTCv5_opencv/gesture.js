var cv = require('opencv4nodejs');
var {Mat} = require('opencv4nodejs');
var n = 0;
module.exports = {
     ProcessFrames: function (iFrame, oFrame) {
          console.log("Processing Begin", n)
          iFrame = base64toMat(iFrame);
          oFrame = base64toMat(oFrame);
          
          // Process Image Matrix 
          var processedMat = grabCut(iFrame, oFrame);
          console.log("Processing End");
          
          // Convert Mat to base64
          // var outBase64 = "data:image/jpeg;base64," + cv.imencode('.jpeg', processedMat).toString('base64');
          n++;
          return  "data:image/jpeg;base64," + cv.imencode('.jpeg', processedMat).toString('base64');
          
          // return new Promise(resolve=>{
          //      resolve(outBase64)

          // })

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
     var split = base64.split(',')[1]
     return cv.imdecode(Buffer.from(split, 'base64'));
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
     // let background = Mat(handFrame.rows, handFrame.cols, handFrame.type);
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
     return ksrc
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