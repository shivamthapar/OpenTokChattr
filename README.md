OpenTokChattr
=============
A multi-party text chat plugin written in Javascript. This project is built upon the [Signaling Library](https://tokbox.com/opentok/tutorials/signaling/js) of the [OpenTok API](https://tokbox.com).

Dependencies
-------------
The [OpenTok for WebRTC JS API](http://www.tokbox.com/opentok) is required.
The [jquery.event.ue](https://github.com/mmikowski/jquery.event.ue) and [jquery-udraggable](https://github.com/grantm/jquery-udraggable) libraries are required for a draggable interface. 

Running the Demo
------------------
1. Clone [this repo](https://github.com/shivamthapar/OpenTokChattr).
2. Get my API Key, Session ID, and Token from your [TokBox Dashboard](http://dashboard.tokbox.com/). For help on this step, visit the [Quickstart page](https://tokbox.com/opentok/quick-start/) in the OpenTok Docs. 
3. Replace `API KEY`, `SESSION ID`, and `TOKEN` with your corresponding credentials.
4. Run `npm install` to install the necessary packages.
5. Start the server with `node server.js`.
6. Open your browser to `localhost:8080/demo.html`.

Usage
-------
First, include the OpenTok JS library and the jQuery Library.
```html
<script src="https://swww.tokbox.com/webrtc/v2.2/js/TB.min.js" type="text/javascript" charset="utf-8"></script>
<script src="http://code.jquery.com/jquery-1.11.1.min.js" type="text/javascript" charset="utf-8"></script>
```
Then, add the OpenTokChattr dependencies, `jquery.event.ue` and `jquery-udraggable`.
```html
<script src="libs/jquery.udraggable.js" type="text/javascript" charset="utf-8"></script>
<script src="libs/jquery.event.ue.js" type="text/javascript" charset="utf-8"></script>
```
Finally, add the OpenTokChattr JS and CSS files.
```html
<script src="OpenTokChattr.js" type="text/javascript" charset="utf-8"></script>
<link rel="stylesheet" type="text/css" href="OpenTokChattr.css" />
```

Now, initialize an OpenTokChattr by calling:
```Javascript
var chattr = new OpenTokChattr("#container", "Room Id", otSession, options);
```
The first argument is the jQuery selector string for the container element of the OpenTokChattr window.

The second argument is the name of the room, which will appear at the top of the OpenTokChattr window.

The third argument is the OpenTok Session object that was previously initialized.

The final (and optional) argument is an object of any additional options. Include any of the following in the options argument:
```Javascript
var options = {
  "draggable": true, //Allows the chat window to be dragged
  "closeable": function(){ //Shows a close icon and performs this function when it is clicked
    $("#chattr").hide();
  }
}
