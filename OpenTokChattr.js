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
  // Every 10 seconds update the times for everyone
  setInterval(function () {
    $('.chat p').each(function () {
      var date = $(this).attr('data-date');
      var timeDiff = _this._timeDifference(new Date(date), new Date());
      $(this).attr('title',timeDiff);
    });
  }, 10000);
}
OpenTokChattr.prototype = {
  _this:this,
  constructor: OpenTokChattr,
  initOpenTok: function(){
    _this.session.on({
      sessionConnected: function(sessionConnectEvent){
        _this.setName(_this._defaultNickname(_this.session.connection.connectionId));
        setTimeout(function(){_this.initialized = true;}, 2000);
      },
      signal: function(signal){
        var signalData = JSON.parse(signal.data);
        switch(signal.type){
          case "signal:chat":
            _this.messages.push({"type": "chat", data: signalData});
            _this.printMessage({"type": "chat", data: signalData});
            
            break;
          case "signal:updateUsers":
            _this.users = signalData;
            _this.initialized = true;
            break;
          case "signal:name":
            var oldName = _this.getNickname(signalData.from);
            var nameData = {"oldName": oldName, "newName": signalData.newName}; 
            _this.users[signalData.from] = signalData.newName;
            _this.printMessage({"type": "status", data:nameData});
            break;
          case "signal:help":
            _this.printMessage({"type": "help", data:signalData});
            break;
          case "signal:generalUpdate":
            _this.printMessage({"type": "generalUpdate", data:signalData});
            break;
          case "signal:selfUpdate":
            _this.printMessage({"type": "selfUpdate", data:signalData});
            break;
          case "signal:pastMessages":
            if(!_this.initialized){
              _this.messages = signalData.messages;
              _this.printMessages();
            }
            break;
        }
      },
      connectionCreated: function(event){
        if(_this.initialized){
          var connectionId = event.connection.connectionId;
          _this.sendSignal("pastMessages", {"messages":_this.messages}, event.connection);
          _this.users[connectionId] = _this._defaultNickname(connectionId);
          _this.signalUpdateUsers();
        }
        _this.printMessage({"type": "newUser", data: event.connection.connectionId});
      },
      connectionDestroyed: function(event){
        _this.printMessage({"type": "userLeave", data:{"from":event.connection.connectionId}});
        delete _this.users[event.connection.connectionId];
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
     var signalData = {type: type,data: JSON.stringify(data)};
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
        var message=decodeURI(data.text).replace(/</g, '&lt;').replace(/>/g, '&gt;');
        var cls = _this.isMe(data.from)?"from-me":"from-others";
        html="<li class='chat "+cls+"'><label>"+nickname+"</label><p data-date='"+data.date+"' title='"+time+"'>"+message+"</p>";
        break;
      case "status":
        html = "<li class = 'status'><p><span class='oldName'>"+data.oldName+"</span> is now known as <span class='newName'>"+data.newName+"</span></p></li>";
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
      case "selfUpdate":
        if(_this.isMe(data.from)){
          html+="<li class = 'status'>"+data.text+"</li>";
        }
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
        _this.sendChangeNameSignal(parts[1]);
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
    var msg = "<p>Type <span>/name your_name</span> to change your display name</p> \
              <p>Type <span>/list</span> to see a list of users in the room</p> \
              <p class='last'>Type <span>/help</span> to see a list of commands</p>";
    _this.sendSelfUpdate(msg);
  },
  sendChat: function(msg){
    var date = new Date();
    var data = {name: _this.getNickname(_this.session.connection.connectionId), text: encodeURI(msg), date: date, from: _this.session.connection.connectionId};
    _this.sendSignal("chat", data);
  },
  sendGeneralUpdate: function(msg){
    _this.sendSignal("generalUpdate", {"text": msg});
  },
  sendSelfUpdate: function(msg){
    var data = {from: _this.session.connection.connectionId, text: msg};
    _this.sendSignal("selfUpdate", data);
  },
  sendChangeNameSignal: function(newName){
    for(var k in _this.users){
      if(_this.users[k]===newName){
        var msg = "<p>User <span>"+newName+"</span> already exists. Please choose another name.</p>";
        _this.sendSelfUpdate(msg);
        return;
      }
    }
    var data = {from: _this.session.connection.connectionId, newName: newName};
    _this.sendSignal("name", data);
  },
  signalUpdateUsers: function(){
    _this.sendSignal("updateUsers", _this.users);
  },
  sendListSignal: function(){
    var names = [];
    for(var k in _this.users){
      names.push(_this.users[k]);
    }
    var html = "<p class='userList'>Users in this room right now</p>";
    for(var i = 0; i<names.length; i++){  
      if(i<names.length-1)
        html+="<p class='userList'>- "+names[i]+"</p>";
      else
        html+="<p class='userList last'>- "+names[i]+"</p>";
    }
    _this.sendSelfUpdate(html);
  },
  getNickname: function(connectionId){
    return _this.users[connectionId] || _this._defaultNickname(connectionId);
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
    if(seconds>=60 && seconds<120)
      return "1 minute ago";
    else if(seconds>=120 && seconds<3600)
      return parseInt(seconds/60,10)+" minutes ago";
    else if(seconds>=3600 && seconds<7200)
      return "1 hour ago";
    else if (seconds>=7200)
      return parseInt(seconds/3600,10)+" hours ago";
    else if (seconds>=10)
      return parseInt(seconds/60,10)+" seconds ago";
    else
      return "Just now";
  },
  _defaultNickname: function(connectionId){
    return "Guest-"+connectionId.substring( connectionId.length - 8, connectionId.length )
  }
}
