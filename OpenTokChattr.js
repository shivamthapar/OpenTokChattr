function OpenTokChattr(targetElem, roomId,session, options){
  _this = this;
  this.targetElem = $(targetElem);
  this.roomId = roomId;
  this.messages = [];
  this.users = {};
  this.options = options;
  this.session = session;
  this.initialized = false;
  this.initOpenTok();
  this.targetElem.append(this.baseHtml);
  this.targetElem.find("#chattr #roomId").html(this.roomId); 
  $("#chatInput").keyup(_this.checkKeyPress);
  this.uiActions();
}
OpenTokChattr.prototype = {
  _this:this,
  constructor: OpenTokChattr,
  initOpenTok: function(){
    _this.session.on({
      sessionConnected: function(sessionConnectEvent){
        console.log("SESSION CONNECTED");
        _this.setName(_this._defaultNickname(_this.session.connection.connectionId));
        setTimeout(function(){_this.initialized = true;}, 2000);
      },
      signal: function(signal){
        console.log(signal);
        var signalData = JSON.parse(signal.data);
        switch(signal.type){
          case "signal:chat":
            console.log("CHAT RECEIVED");
            console.log(signalData);
            _this.messages.push({"type": "chat", data: signalData});
            _this.printMessage({"type": "chat", data: signalData});
            
            break;
          case "signal:updateUsers":
            _this.users = signalData;
            break;
          case "signal:newUser":
            //_this.messages.push({"type": "newUser", data: signalData});
            //_this.printMessage({"type": "newUser", data:signalData});
            break;
          case "signal:name":
            var nameData = {"oldName": _this.getNickname(signalData[0]), "newName": signalData[1]};
            _this.users[signalData[0]] = signalData[1];
            _this.printMessage({"type": "status", data:nameData});
            break;
          case "signal:help":
            console.log("help signal recieved");
            _this.printMessage({"type": "help", data:signalData});
            break;
          case "signal:list":
            _this.printMessage({"type": "list", data:signalData});
            break;
          case "signal:generalUpdate":
            _this.printMessage({"type": "generalUpdate", data:signalData});
            break;
          case "signal:pastMessages":
            if(!_this.initialized){
              _this.messages = signalData.messages;
              _this.printMessages();
              _this.initialized = true;}
            break;
        }
      },
      connectionCreated: function(event){
        if(_this.initialized){
          var connectionId = event.connection.connectionId;
          _this.sendSignal("pastMessages", {"messages":_this.messages}, event.connection);
          _this.users[connectionId] = _this._defaultNickname(connectionId);
          console.log("CONNECTION CREATED, NEW USER");
          console.log(_this.users);
          //NAME is coming out as undefined
          _this.signalUpdateUsers();
        }
        _this.printMessage({"type": "newUser", data: event.connection.connectionId});
      },
      connectionDestroyed: function(event){
        _this.printMessage({"type": "userLeave", data:{"from":event.connection.connectionId}});
        delete _this.users[event.connection.connectionId];
        console.log("USERS UPDATED");
      },
    });
  },
  close: function(){
    if(this.options.closeable)
      return this.options.closeable;
    else
      $("#chattr").hide();
  },
  uiActions: function(){
    $(".inner-chat").animate({scrollTop: $(".inner-chat")[0].scrollHeight},1000);
    if(this.options){
      if(this.options.closeable){
        $("#chattr .chat-header .btn-close").click(this.options.closeable);
      } else{
        $("#chattr .chat-header .btn-close").hide();
      }
      if(this.options.draggable){
        $("#chattr").udraggable({
          handle: "#chat_header",
        });
      }
    }
  },
  signalError: function(error){
    if(error){
      console.log("signal error: " + error.reason);
    }
  },
  sendSignal:function(type, data, to){
     console.log("SEND CHAT SIGNAL");
     var signalData = {type: type,data: JSON.stringify(data)};
     console.log(signalData);
     if(to)
      signalData.to=to;
    _this.session.signal(signalData,_this.signalError);
  },
  setName:function(name){
    _this.users[_this.session.connection.connectionId]=name;
  },
  baseHtml: "<div id = 'chattr'> \
        <div id='chat_header' class='chat-header' style='cursor: move;'> \
          <div><span></span><span></span><span></span></div> \
          <h4 id='roomId'></h4> \
          <a class='btn-close' title='Close chat'></a> \
        </div> \
        <div class='inner-chat'> \
          <p id = 'displayHelp'> Type /help for a list of commands \
          <ul id='messages'> \
          </ul> \
        </div> \
        <div class='chat-input-wrapper'> \
          <input type='text' id='chatInput' placeholder= 'Write here...'  /> \
        </div> \
      </div>",
  //iterate through messages in printMessages
  printMessages: function(){
    for(var i = 0; i<_this.messages.length; i++){
      _this.printMessage(_this.messages[i]);
    }
  },
  printMessage: function(msg){
    var data = msg.data;
    var html = "";
    switch(msg.type){
      case "chat":
        var time = this._timeDifference(new Date(data.date),new Date());
        var nickname=data.name+": ";
        var message=data.text;
        var cls = _this.isMe(data.from)?"from-me":"from-others";
        html="<li class='"+cls+"'><label>"+nickname+"</label><p title='"+time+"'>"+message+"</p>";
        break;
      case "status":
        html = "<li class = 'status'><p><span class='oldName'>"+data.oldName+"</span> is now known as <span class='newName'>"+data.newName+"</span></p></li>";
        break;
      case "help":
        console.log("/help");
        if(_this.isMe(data.from)){
          html+= "<li class = 'status help'>";
          html+= "<p>Type <span>/name your_name</span> to change your display name</p>";
          html+= "<p>Type <span>/list</span> to see a list of users in the room</p>";
          html+= "<p class='last'>Type <span>/help</span> to see a list of commands</p>";
          html+="</li>";
        }
        break;
      case "list":
        if(_this.isMe(data.from)){
          html+="<li class = 'status list'><p>Users in this room right now</p>";
          for(var i=0; i<data.users.length; i++){
            if(i<data.users.length-1)
              html+="<p>- "+data.users[i]+"</p>";
            else
              html+="<p class='last'>- "+data.users[i]+"</p>";
          }
        }
        break;
      case "newUser":
        if(!_this.isMe(data.from)||!data){
          html+="<li class= 'status newUser'>";
          html+="<p><span>"+_this.getNickname(data)+"</span> has joined the room</p>";
        }
        break;
      case "userLeave":
        if(!_this.isMe(data.from)||!data.from){
          html+="<li class= 'status newUser'>";
          html+="<p><span>"+_this.getNickname(data.from)+"</span> has left the room</p>";
        }
        break;
      case "generalUpdate":
        html = "<li class = 'status'><p>"+data.text+"</p></li>";
        break;
    }
    $("#messages").append(html);
    $(".inner-chat").scrollTop($(".inner-chat")[0].scrollHeight)
  },
  checkKeyPress: function(e){
    var code = (e.keyCode ? e.keyCode : e.which);
    if(code !== 13) {
     return;
    } 
    var text = $("#chatInput").val().trim();
    if(text.length===0)
       return;
    var parts = text.split(" ");
    switch(parts[0]){
      case "/name":
      case "/nick":
       _this.sendSignal("name", [_this.session.connection.connectionId, parts[1]]);
//        var oldName = _this.users[_this.session.connection.connectionId];
//        _this.setName(parts[1]);
//        _this.sendNameSignal(oldName,parts[1]);
        break;
      case "/help":
        _this.sendHelpSignal();
        break;
      case "/list":
        _this.sendListSignal();
        break;
      default:
        _this.sendChat(text);
    }
    $("#chatInput").val("");
  },
  sendHelpSignal: function(){
    var data = {from: _this.session.connection.connectionId};
    _this.sendSignal("help", data);
  },
  sendChat: function(msg){
    var date = new Date();
    var data = {name: _this.getNickname(_this.session.connection.connectionId), text: msg, date: date, from: _this.session.connection.connectionId};
    _this.sendSignal("chat", data);
  },
  sendGeneralUpdate: function(msg){
    _this.sendSignal("generalUpdate", {"text": msg});
  },
  sendNameSignal: function(oldName, newName){
    var data = {oldName: oldName, newName: newName};
    _this.sendSignal("name", data);
  },
  signalUpdateUsers: function(){
    console.log("signal user update");
    console.log(_this.users);
    _this.sendSignal("updateUsers", _this.users);
  },
  sendListSignal: function(){
    var list = [];
    for(var k in _this.users){
      list.push(_this.users[k])
    }
    _this.sendSignal("list",{"users":list, "from":_this.session.connection.connectionId});
  },
  getNickname: function(connectionId){
    return _this.users[connectionId] || _this._defaultNickname(connectionId);
//  code to return "me" for messages sent by myself
//    if(!_this.isMe(connectionId))
//      return _this.users[connectionId];
//    return "me ("+_this.users[connectionId]+")";
  },
  isMe: function(connectionId){
    return connectionId===_this.session.connection.connectionId;
  },
  displayChatMessage: function(msg){
    var html = "<li class = 'chatMsg'><p>"+msg+"</p></li>";
    $("ul#messages").append(html);
  },

  //Helper Methods

  _timeDifference: function(d1,d2){
    var seconds = (d2.getTime()-d1.getTime())/1000;
    if(seconds>=60 && seconds<3600)
      return parseInt(seconds/60,10)+" minutes ago";
    else if (seconds>=3600)
      return parseInt(seconds/3600,10)+" hours ago";
    else if (seconds>=1)
      return parseInt(seconds,10)+" seconds ago";
    else
      return "Just now";
  },
  _defaultNickname: function(connectionId){
    return "Guest-"+connectionId.substring( connectionId.length - 8, connectionId.length )
  }
/*
  _compareConnectionByCreation: function(a,b) {
    if (Date.parse(creationTime)h)
       return -1;
    if (a.last_nom > b.last_nom)
      return 1;
    return 0;
  }
*/
}
