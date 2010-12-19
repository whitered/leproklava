// ==UserScript==
// @name           leproklava
// @namespace      ru.whitered
// @include        http://dirty.ru/*
// @include        http://*.dirty.ru/*
// @include        http://leprosorium.ru/*
// @include        http://*.leprosorium.ru/*
// ==/UserScript==

var utils = {

  hasClass: function(ele,cls)
  {
    if(!ele) return false;
    var pattern = new RegExp("(\\s|^)" + cls + "(\\s|$)");
    return pattern.test(ele.className);
  },



  addClass: function(ele,cls)
  {
    if (!this.hasClass(ele,cls)) ele.className += " " + cls;
  },



  removeClass: function(ele,cls)
  {
    if (this.hasClass(ele,cls))
    {
      var reg = new RegExp('(\\s|^)'+cls+'(\\s|$)');
      ele.className=ele.className.replace(reg,' ');
    }
  },



  getElementsByClass: function(searchClass,node,tag)
  {
    if(node == null) node = document;
    if(tag == null) tag = '*';

    var classElements = [];
    var els = node.getElementsByTagName(tag);
    var elsLen = els.length;
    var pattern = new RegExp("(^|\\s)"+searchClass+"(\\s|$)");

    for(var i = 0; i < elsLen; i++)
    {
      if(pattern.test(els[i].className))
      {
        classElements.push(els[i]);
      }
    }

    return classElements;
  },



  scrollPosition: function(y,x)
  {
    var x = x || null;
    var y = y || null;

    if(x === null && y === null)
    {
      y = document.body.scrollTop ? document.body.scrollTop : document.documentElement.scrollTop;
      x = document.body.scrollTop ? document.body.scrollLeft : document.documentElement.scrollLeft;
      return {x:x, y:y}
    }
    else
    {
      if(y === null)
      {
        y = document.body.scrollTop ? document.body.scrollTop : document.documentElement.scrollTop;
      }
      if(x === null)
      {
        x = document.body.scrollTop ? document.body.scrollLeft : document.documentElement.scrollLeft;
      }
      window.scrollTo(x,y);
    }
  },



  elementPosition: function(el)
  {
    var x = 0;
    var y = 0;

    if(el.offsetParent)
    {
      x = el.offsetLeft;
      y = el.offsetTop;
      while(el = el.offsetParent)
      {
        x += el.offsetLeft;
        y += el.offsetTop;
      }
    }
    return {x:x, y:y};
  }

};



function createController()
{
    var currentClass = "kb-current";

    var isLepra = window.location.hostname.indexOf("leprosorium.ru") >= 0;

    var postClass = isLepra ? "ord" : "post";
    var commentClass = isLepra ? "post" : "comment";
    var parentLinkClass = isLepra ? "show_parent" : "c_parent";
    var headCommentClass = "indent_0";
    var newCommentClass = "new";

    var postsHolder = document.getElementById("js-posts_holder");
    var commentsHolder = document.getElementById("js-commentsHolder");

    var insidePost = commentsHolder != null;

    var posts = utils.getElementsByClass(postClass, postsHolder, "div");
    var head = posts[0];
    var comments = insidePost ? utils.getElementsByClass(commentClass, commentsHolder, "div") : null;


    var current = null;
    var history = [];

    var isPost = function(node)
    {
      //return node && node.nodeType == 1 && utils.hasClass(node, postClass);
      return utils.hasClass(node, postClass);
    };



    var isComment = function(node)
    {
      //FIXME: on lepra post has comment's class too
      //return node && node.nodeType == 1 && utils.hasClass(node, commentClass);
      return utils.hasClass(node, commentClass);
    };



    var moveTo = function(node)
    {
      history.push(current);
      setCurrent(node);
    }
    
    

    var setCurrent = function(node)
    {
      if(current == node)
      {
        trace("same element");
        return;
      }     
      
      if(current)
      {
        utils.removeClass(current, currentClass);
      }

      current = node;
      trace("current = " + (node));
      
      function traceStack(callee)
      {
        trace(callee);
        if(callee.caller) traceStack(callee.caller.arguments.callee);
      }
      
      //traceStack(arguments.callee);

      if(current)
      {
        var links = current.getElementsByTagName("a");
        links[0].focus();
        utils.addClass(current, currentClass);
        var offset = (window.innerHeight - current.offsetHeight) / 2;
        if(offset < 0) offset = 0;
        utils.scrollPosition(utils.elementPosition(current).y - offset);
      }
    };



    var getNext = function(node)
    {
      if(insidePost && isPost(node))
      {
        return comments[0];
      }
      else
      {
        do
        {
          node = node.nextSibling;
        }
        while (node && !isComment(node) && !isPost(node));
        return node;
      }
    };



    var getPrev = function(node)
    {
      if(insidePost && isPost(node))
      {
        return null;
      }
      else if(insidePost && node == comments[0])
      {
        return head;
      }
      else
      {
        do
        {
          node = node.previousSibling;
        }
        while (node && !isComment(node) && !isPost(node));
        return node;
      }
    }



    var getParent = function(comment)
    {
      const links = utils.getElementsByClass(parentLinkClass, comment, "a");
      if(links.length > 0)
      {
        var comment_id = links[0].getAttribute("replyto");
        return document.getElementById(comment_id);
      }
    };



    var clickLink = function(link)
    {
      var theEvent = document.createEvent("MouseEvent");
      theEvent.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
      link.dispatchEvent(theEvent);
    };


    var getItemLink = function(node)
    {
      if(isLepra)
      {
        var link = document.evaluate("./div[@class='dd']/div[@class='p']/span/a", node, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        return link && link.href;
      }
      else
      {
        var links = utils.getElementsByClass("c_icon", current, "a");
        if(links.length > 0)
        {
          return links[0].href;
        }
      }
    };
    
    
    
    var getToggleUserLink = function(node)
    {
      var expr = isLepra ? ".//a[@class='u']" : ".//a[@class='c_show_user']";
      var link = document.evaluate(expr, node, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      return link;
    };
    
    
    var getVotePlusLink = function(node)
    {
      var expr = isLepra ? ".//a[contains(@class, 'plus')]" : ".//a[contains(@class, 'vote_button_plus')]";
      return document.evaluate(expr, node, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    };


    var getVoteMinusLink = function(node)
    {
      var expr = isLepra ? ".//a[contains(@class, 'minus')]" : ".//a[contains(@class, 'vote_button_minus')]";
      return document.evaluate(expr, node, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    };
    
    
    
    var getReplyCommentLink = function(comment)
    {
      var expr = isLepra ? ".//a[@class='reply_link']" : ".//a[@class='c_answer']";
      return document.evaluate(expr, comment, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    };
    
    
    
    var commentIsHidden = function(node)
    {
      return utils.hasClass(node, "shrinked");
    };
    
    
    
    var getShowCommentLink = function(comment)
    {
      var expr = ".//a[@class='show_link']";
      return document.evaluate(expr, comment, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    };
    
    
    
    var getReplyPostLink = function()
    {
      var div = document.getElementById(isLepra ? "reply_link_default" : "js-comments_add_block_bottom");
      return div.getElementsByTagName("a")[0];
    }


    var ctrl = {

      goNext: function()
      {
        if(current)
        {
          var next = getNext(current);
          if(next) moveTo(next);
        }
        else
        {
          moveTo(head);
        }
      },
      
      
      
      goPrev: function()
      {
        if(current)
        {
          var prev = getPrev(current);
          if(prev) moveTo(prev);
        }
      },



      goNextNew: function()
      {
        if(insidePost)
        {
          var node = current || head;
          do
          {
            node = getNext(node);
          }
          while(node && !utils.hasClass(node, newCommentClass));
          if(node) moveTo(node);
        }
        else
        {
          ctrl.goNext();
        }
      },



      goParent: function()
      {
        if(isComment(current))
        {
          var parent = getParent(current);
          if(parent) moveTo(parent);
        }
      },



      goNextHead: function()
      {
        if(insidePost)
        {
          var node = current || head;
          do
          {
            node = getNext(node);
          }
          while(node && !utils.hasClass(node, headCommentClass));
          if(node) moveTo(node);
        }
        else
        {
          ctrl.goNext();
        }
      },



      goPrevHead: function()
      {
        if(insidePost)
        {
          var node = current || head;
          do
          {
            node = getPrev(node);
          }
          while(node && !utils.hasClass(node, headCommentClass));
          if(node) moveTo(node);
        }
        else
        {
          ctrl.goPrev();
        }
      },



      goBack: function()
      {
        if(history.length > 0)
        {
          setCurrent(history.pop());
        }
      },



      goTop: function()
      {
        moveTo(head);
      },



      rateUp: function()
      {
        if(current)
        {
          var link = getVotePlusLink(current);
          if(link) clickLink(link);
        }
      },



      rateDown: function()
      {
        if(current)
        {
          var link = getVoteMinusLink(current);
          if(link) clickLink(link);
        }
      },



      toggleUser: function()
      {
        if(current)
        {
          var link = getToggleUserLink(current);
          if(link)
          {
            clickLink(link);
          }
        }
      },



      openPost: function()
      {
        if(current)
        {
          var url = getItemLink(current);
          if(url) document.location.href = url;
        }
      },
      
      
      
      openPostNewTab: function()
      {
        if(current)
        {
          var url = getItemLink(current);
          if(url) GM_openInTab(url);
        }
      },
      
      
      
      goGlagne: function()
      {
        document.location.href = "/";
      },
      
      
      
      reply: function()
      {
        if(current && isComment(current))
        {
          if(commentIsHidden(current))
          {
            clickLink(getShowCommentLink(current));
          }
          else
          {
            var replyCommentLink = getReplyCommentLink(current);
            if(replyCommentLink) clickLink(replyCommentLink);
          }
        }
        else if(insidePost)
        {
          var replyPostLink = getReplyPostLink(current);
          trace(replyPostLink);
          if(replyPostLink) clickLink(replyPostLink);
        }
        
      }

    };

    return ctrl;
}





function initNavigation()
{
  var css = ".kb-current .dt, .kb-current .comment_inner { border: 1px dashed #556E8C; }";
  css += "\n#kb-help { position: fixed; background: #ccc; padding: 1em;}";
  css += "\n#kb-help dt { float: left; width: 2em; font-weight: bold; }";
  css += "\n#kb-help dd { margin: 0.5em 0;}"

  var style = document.createElement("style");
  style.type = "text/css";
  style.innerHTML = css;
  document.getElementsByTagName('head')[0].appendChild(style);

  var toggleHelp = function()
  {
    var content = document.getElementById("kb-help");
    if(content)
    {
      content.parentNode.removeChild(content);
      return;
    }

    var values = [
      ["h", "Показать/скрыть окно помощи"],
      ["n", "Следующий пост или комментарий"],
      ["m", "Следующий пост или новый комментарий"],
      ["v", "Родительский комментарий"],
      [",", "Предыдущий пост или комментарий 1-го уровня"],
      [".", "Следующий пост или комментарий 1-го уровня"],
      ["b", "Назад"],
      ["t", "Первый пост на странице"],
      ["-", "Минус"],
      ["=", "Плюс"],
      ["u", "Выделить все комментарии автора"],
      ["o", "Открыть пост (ctrl - в новой вкладке)"],
      ["g", "На глагне"]
    ];
    content = document.createElement("div");
    var dl = content.appendChild(document.createElement("dl"));
    var dt;
    var dd;
    for (var i = 0; i < values.length; i++)
    {
       dt = document.createElement("dt");
       dt.appendChild(document.createTextNode(values[i][0]));
       dl.appendChild(dt);

       dd = document.createElement("dd");
       dd.appendChild(document.createTextNode(values[i][1]));
       dl.appendChild(dd);
    }
    document.getElementsByTagName("body")[0].appendChild(content);

    content.id = "kb-help";
    content.style.left = ((window.innerWidth - content.clientWidth) / 2) + "px";
    content.style.top = ((window.innerHeight - content.clientHeight) / 2) + "px";
  };

  var  hotkeys = [];
    
  var onKeydown = function(e)
  {
    var e = e || window.event;
    
    var element = e.target;
    if(element.tagName == 'INPUT' || element.tagName == 'TEXTAREA') return true;
    
    var code = e.which || e.keyCode;
    var handlers = hotkeys[code];
    var mods;
    if(handlers)
    {
      for(var i = handlers.length - 1; i >= 0; i--)
      {
        mods = handlers[i].mods;
        if(mods.ctrl == e.ctrlKey && mods.shift == e.shiftKey && mods.alt == e.altKey)
        {
          try
          {
            handlers[i].handler();
          }
          catch(e)
          {
            trace(e);
          }
          
          e.cancelBubble = true;
          e.returnValue = false;
      
          if (e.stopPropagation)
          {
            e.stopPropagation();
            e.preventDefault();
          }
          return false;
          
        }
      }
    }
    return true;
  };
  
  document.addEventListener("keydown", onKeydown, false);
 
  var addHotkey = function(keyCode, handler, modifiers)
  {
    var mods = {
      shift: modifiers && modifiers.shift == true || false,
      ctrl: modifiers && modifiers.ctrl == true || false,
      alt: modifiers && modifiers.alt == true || false
    };
    if(!hotkeys[keyCode]) hotkeys[keyCode] = [];
    hotkeys[keyCode].push({ mods: mods, handler: handler });
  };
  
  var controller = createController();
  
  addHotkey(78, controller.goNext);
  addHotkey(80, controller.goPrev);
  addHotkey(77, controller.goNextNew);
  addHotkey(86, controller.goParent);
  addHotkey(188, controller.goPrevHead);
  addHotkey(190, controller.goNextHead);
  addHotkey(66, controller.goBack);
  addHotkey(84, controller.goTop);
  addHotkey(45, controller.rateDown);
  addHotkey(109, controller.rateDown);
  addHotkey(189, controller.rateDown);
  addHotkey(61, controller.rateUp);
  addHotkey(187, controller.rateUp);
  addHotkey(85, controller.toggleUser);
  addHotkey(79, controller.openPost);
  addHotkey(79, controller.openPostNewTab, { ctrl: true });
  addHotkey(71, controller.goGlagne);
  addHotkey(82, controller.reply);
  addHotkey(72, toggleHelp);
}



function trace(msg)
{
  GM_log(msg);
}



try
{
  initNavigation();
}
catch(e)
{
  trace(e);
}


trace("ready");

