# SWE40001-Smart-Glass

## Steps to run the app
1. Run the server
   - Clone this project.
   - Run `npm install` to install all the dependencies
   - Run `npm start` to run the app
   >The app is now running on port 5000. It can be accessed by going to `localhost:5000` from the browser of your choice.
   > You can also access the admin portal through `localhost:5000/admin`
   > If you are accessing the app via glasses, make sure the server and glasses are connected to the same network(same wifi). Then, access     `<ipaddress>:5000` through the glasses.

2. Streaming mode
   > Streaming starts automatically, the first pair of glasses to connect to the server is automatically assigned the INSTRUCTOR role, second pair is OPERATOR
3. Sketching mode
   > Access the admin panel in 4.2, click “switch to sketching”, both user’s video feed will freeze (a snapshot). Finger tracking/sketching processing will proceed from instructor’s camera/hand
4. Calibration
   - Color calibration is accessible on the admin panel in step 1.2.
   - Calibrate for streaming: click “calibrate for streaming”, a snapshot will be taken from the instructor’s camera This will only work if users are currently in streaming mode
   - Calibrate for sketching: click “calibrate for sketching”, a snapshot will be taken from the instructor’s camera This will only work if users are currently in sketching mode
   - Mouse over and click on the desired color in the snapshot to calibrate

  > Note: Firefox should be used to browse on the smart glasses instead of the default browser. There is no keyboard on the smart glasses,   we have set browser homepage to the server ip for development purposes. Another app (autostart) is used to launch Firefox 10 seconds       after boot(wait for wifi) due to having no access to root. 
  We have disabled Firefox mediadevice permission in `about:config` to eliminate permission dialogs. A bluetooth keyboard can be used to     change the homepage. The QR code scanner can also be used to scan generated web address for firefox to open, in our case, the server’s     ip address/port. It can also be used to connect to wifi.


# Technical Documentation

## FrameTrace.js
The of the this class has been deprecated and transferred to the client side 

### base64toMat(base64)
 
**Definition:** Converts a base64 value to a Mat value 

**Parameter:** Base64

**Return:** Mat

## Gesture.js

This file has the code that is used to extract the hand from the frame

**Variables**
- lH- Low Hue 
- lS- Low Saturation 
- lV- Low Value
- uH- Upper Hue
- uS- Upper Saturation
- uV- Upper Value
- hueVariance- Acceptable range of Hue 
- satVariance- Acceptable range of Saturation
- valVariance- Acceptable range of Value

**Constants**
- transparentPixel

### grabHand(handFrame)
 **Definition:** Extracts hands from frame using makeHandMask() 
 
 **Parameter:** Mat handFrame
 
 **Return:** Mat with the original frame with inverted hand mask

 
### makeHandMask(img)
**Definition:** Create a Mat Frame that consists of bits with values of 0s or 1s to signify the threshold of the color that is selected i.e. if the raw image pixel is the selected color, return a 1 else if not the color return a 0. This function generates the mask for one frame to be used for hand extraction.

**Parameter:** Mat of Vec3 RGB values

**Return:** Mat of Binary values

### base64toMat(base64)
**Definition:** Splits base64 string and converts it to Mat

**Parameter:** String base64 string

**Return:** Mat 
 
### calibrateHSV(hsv)
**Definition:** Calibrate upper and lower HSV values

**Parameter:** Float [3]

**Return:** void

## GetTraceCoordinates.js

This file has the code needed to get the coordinates of the center of the pointer 

**Variables**
- lH- Low Hue 
- lS- Low Saturation 
- lV- Low Value
- uH- Upper Hue
- uS- Upper Saturation
- uV- Upper Value
- hueVariance- Acceptable range of Hue 
- satVariance- Acceptable range of Saturation
- valVariance- Acceptable range of Value

**Constants**
- kernel = Morphology opening - Deprecated no longer used (used for dilation and erosion)
- kernelClose = Morphology closing - Deprecated no longer used (used for dilation and erosion)

### makeHandMask(img)

**Definition:** Create a Mat Frame that consists of bits with values of 0s or 1s to signify the threshold of the color that is selected i.e. if the raw image pixel is the selected color, return a 1 else if not the color return a 0. This function generates the mask for one frame to be used for hand extraction.

**Parameter:** Mat of Vec3 RGB values

**Return:** Mat of Binary values

### getHandContour (handMask)

**Definition:** Uses the hand mask to get the hand contour

**Parameter:** Mat of Binary values

**Return:** Contour[]

### getObjectCenter(contour)
 
 **Definition:** It takes the hull points from the contour and uses the hull points to calculate the center points of the pointer.
 
 **Parameter:** Contour[]
 
 **Return:** Point2d

### GetTraceCoordinates(frame)
 
**Definition:** It acts as the main function,

**Parameter:** Mat (Raw image)

**Return:** Point2d

### calibrateHSV(hsv)
  
**Definition:** It calibrates the HSV values 

**Parameter:** float[3]

**Return:** Void

## webRTC.js
### log()
 
**Definition:** emits message from server

**Parameter:** void

**Return:** void
