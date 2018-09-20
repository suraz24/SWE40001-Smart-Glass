const cv = require('../');
const { grabFrames } = require('./utils.js');
const { getObjectCenter } = require('./trackingObjects') 

function FrameTrace(inputVideo){
    var storageArray=[]; //saves every x,y point from the start
    var frameNumber=0;    //saves the current frame number
    const delay = 20;
    var twoPointDistance;
    const skinColorUpper = hue => new cv.Vec(hue, 0.8 * 255, 0.9 * 255);
    const skinColorLower = hue => new cv.Vec(hue, 0.1 * 255, 0.6 * 255);
    const upperLeft = new cv.Point(0, 0)

    //later to be replaced with the snapshot
    Snapshot= cv.imread('../data/s1.jpg',cv.IMREAD_COLOR);
    grabFrames(inputVideo, delay, (frame) => {
        const img = frame.resizeToMax(640);
        const imgHLS = img.cvtColor(cv.COLOR_BGR2HLS);
        const rangeMask = imgHLS.inRange(skinColorLower(100), skinColorUpper(180));
        const mode = cv.RETR_EXTERNAL;
        const method = cv.CHAIN_APPROX_SIMPLE;
        const blurred = rangeMask.blur(new cv.Size(10, 10));
        const thresholded = blurred.threshold(200, 255, cv.THRESH_BINARY);
        const handMask = thresholded;
        const contours = handMask.findContours(mode, method);
        const handContour = contours.sort((c0, c1) => c1.area - c0.area)[0];

        const drawParams = Object.assign(
            {},
            { thickness: 5 },   //can change the thickness of the drawing  
        )

        storageArray[frameNumber]=getObjectCenter(handContour, 25); //saves every point from the start to this array

        for(loop=1;loop<frameNumber;loop++){
        //distance between starting point and the current pooint
            twoPointDistance=Math.sqrt(Math.pow((storageArray[0][0]-storageArray[frameNumber][0]),2)+ Math.pow((storageArray[0][1]-storageArray[frameNumber][1]),2))
            if(frameNumber==0){       //if it is the first frame, then just draw a dot, because no previous x,y values
                Snapshot.drawLine(
                upperLeft.add(new cv.Point(storageArray[frameNumber][0],storageArray[frameNumber][1])),
                upperLeft.add(new cv.Point(storageArray[frameNumber][0],storageArray[frameNumber][1])),
                drawParams)
            } else {
                Snapshot.drawLine(        //if it is not the first frame, drawlines between each previous consecutive values,in real-time this looks like a drawing
                upperLeft.add(new cv.Point(storageArray[loop-1][0],storageArray[loop-1][1])),
                upperLeft.add(new cv.Point(storageArray[loop][0],storageArray[loop][1])),
                drawParams)
            }
        }
        console.log('x: '+storageArray[frameNumber][0]+" y: "+storageArray[frameNumber][1]+" Distance: "+twoPointDistance);        
        frameNumber++;
        cv.imshow('Snapshot',Snapshot); 
    });
}

module.exports = {FrameTrace : FrameTrace};



