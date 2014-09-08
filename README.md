OpenTokChattr
=============
A simple multi-party text chat plugin written in Javascript. This project is built upon the [Signaling Library](https://tokbox.com/opentok/tutorials/signaling/js) of the [OpenTok API](https://tokbox.com).

Installation
------------
Install using [Bower](https://github.com/bower/bower):
`bower install opentok-chattr`
or clone this repo.

Dependencies
-------------
The [OpenTok for WebRTC JS API](http://www.tokbox.com/opentok) is required.
The [jquery.event.ue](https://github.com/mmikowski/jquery.event.ue) and [jquery-udraggable](https://github.com/grantm/jquery-udraggable) libraries are required for a draggable interface. 

Running the Demo
------------------
1. Clone [this repo](https://github.com/shivamthapar/OpenTokChattr).
2. Get your API Key, Session ID, and Token from your [TokBox Dashboard](http://dashboard.tokbox.com/). For help on this step, visit the [Quickstart page](https://tokbox.com/opentok/quick-start/) in the OpenTok Docs. 
3. In `demo.html`, eplace `API KEY`, `SESSION ID`, and `TOKEN` with your corresponding credentials.
4. Serve `demo.html` on a web-server using e.g. `npm install http-server -g;http-server` or `python -m SimpleHTTPServer 8000`

Usage
-------
See [demo.html](https://github.com/shivamthapar/OpenTokChattr/blob/master/demo.html) for a complete example.

Include all required scripts:
```html
<script src="//static.opentok.com/webrtc/v2.2/js/opentok.min.js" type="text/javascript" charset="utf-8"></script>
<script src="bower_components/jquery/dist/jquery.min.js" type="text/javascript" charset="utf-8"></script>
<script src="bower_components/jquery.event.ue/jquery.event.ue.js" type="text/javascript" charset="utf-8"></script>
<script src="bower_components/jquery.udraggable/jquery.udraggable.js" type="text/javascript" charset="utf-8"></script>
<script src="OpenTokChattr.js" type="text/javascript" charset="utf-8"></script>
```

Include the `OpenTokChattr.css` file:
```html
<link rel="stylesheet" type="text/css" href="OpenTokChattr.css" />
```

Create an OpenTok session and connect to the session.
```Javascript
var apiKey = "API KEY";
var sessionId = "SESSION ID";
var token = "TOKEN";
var otSession = OT.initSession(apiKey,sessionId);
otSession.connect(token);
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
