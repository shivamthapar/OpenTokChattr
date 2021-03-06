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
  this.templates = {};
  $.get('src/templates.mustache.html', function(template, textStatus, jqXhr) {
    _this.initTemplates(template);
    _this.targetElem.append(Mustache.render(_this.templates.base, {}));
    _this.targetElem.find("#chattr #roomId").html(_this.roomId); 
    $("#chatInput").keyup(_this.checkKeyPress);
    _this.uiActions();
  });
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
  initTemplates: function(template){
    _this.templates.base = $(template).filter('#baseTpl').html();
    _this.templates.chat = $(template).filter('#chatTpl').html();
    _this.templates.status = $(template).filter('#statusTpl').html();
    _this.templates.newUser = $(template).filter('#newUserTpl').html();
    _this.templates.userLeave = $(template).filter('#userLeaveTpl').html();
    _this.templates.update = $(template).filter('#updateTpl').html();
    _this.templates.userList = $(template).filter('#userListTpl').html();
    _this.templates.help = $(template).filter('#helpTpl').html();
    _this.templates.nameExists = $(template).filter('#nameExistsTpl').html();
  },
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
              _this.users = signalData.users;
              _this.printMessages();
              _this.initialized = true;
            }
            break;
        }
      },
      connectionCreated: function(event){
        if(_this.initialized){
          var connectionId = event.connection.connectionId;
          if(!(connectionId in _this.users)){
            _this.users[connectionId] = _this._defaultNickname(connectionId);
          }
          _this.sendSignal("pastMessages", {"messages":_this.messages, "users": _this.users}, event.connection);
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
  //iterate through messages in printMessages
  printMessages: function(){
    for(var i = 0; i<_this.messages.length; i++){
      _this.printMessage(_this.messages[i]);
    }
  },
  printMessage: function(msg){
    var data = msg.data;
    var html = "";
    var tmplData = {};
    switch(msg.type){
      case "chat":
        tmplData.time = this._timeDifference(new Date(data.date),new Date());
        tmplData.nickname=data.name+": ";
        tmplData.message=decodeURI(data.text).replace(/</g, '&lt;').replace(/>/g, '&gt;');
        tmplData.cls = _this.isMe(data.from)?"from-me":"from-others";
        _this.appendToMessages('chat', tmplData);
        break;
      case "status":
        tmplData.oldName = data.oldName;
        tmplData.newName = data.newName;
        _this.appendToMessages('status', tmplData);
        break;
      case "newUser":
        if(!_this.isMe(data.from)||!data){
          tmplData.nickname = _this.getNickname(data);
          _this.appendToMessages('newUser', tmplData);
        }
        break;
      case "userLeave":
        if(!_this.isMe(data.from)||!data.from){
          tmplData.nickname = _this.getNickname(data.from);
          _this.appendToMessages('userLeave', tmplData);
        }
        break;
      case "generalUpdate":
        tmplData.text = data.text; 
        _this.appendToMessages('update', tmplData);
        break;
      case "selfUpdate":
          tmplData.cls = data.cls;
        if(_this.isMe(data.from)){
          tmplData.text = data.text; 
          tmplData.cls = data.cls;
          _this.appendToMessages('update', tmplData);
        }
        break;
    }
    $("#messages").append(html);
    $(".inner-chat").scrollTop($(".inner-chat")[0].scrollHeight)
  },
  appendToMessages: function(template, data){
    console.log(Mustache.render(_this.templates[template],data));
    $("#chattr .inner-chat ul#messages").append(Mustache.render(_this.templates[template],data));
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
    _this.sendSelfUpdate(_this.templates.help, "help");
  },
  sendChat: function(msg){
    var date = new Date();
    var data = {name: _this.getNickname(_this.session.connection.connectionId), text: encodeURI(msg), date: date, from: _this.session.connection.connectionId};
    _this.sendSignal("chat", data);
  },
  sendGeneralUpdate: function(msg){
    _this.sendSignal("generalUpdate", {"text": msg});
  },
  sendSelfUpdate: function(msg,cls){
    var data = {from: _this.session.connection.connectionId, text: msg, cls: cls};
    _this.sendSignal("selfUpdate", data);
  },
  sendChangeNameSignal: function(newName){
    for(var k in _this.users){
      if(_this.users[k]===newName){
        var msg = Mustache.render(_this.templates.nameExists, {newName: newName});
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
    var html = "";
    var data = {users:[]};
    for(var i = 0; i<names.length; i++){  
      var userData = {name: names[i]};
      if(i==names.length-1)
        userData.last = "last";
      data.users.push(userData);
    }
    html=Mustache.render(_this.templates.userList,data)
    _this.sendSelfUpdate(html);
  },
  getNickname: function(connectionId){
    return _this.users[connectionId] || _this._defaultNickname(connectionId);
  },
  isMe: function(connectionId){
    return connectionId===_this.session.connection.connectionId;
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
