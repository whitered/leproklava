// ==UserScript==
// @name           leproklava
// @namespace      ru.whitered
// @include        http://dirty.ru/*
// @include        http://*.dirty.ru/*
// @include        http://leprosorium.ru/*
// @include        http://*.leprosorium.ru/*
// ==/UserScript==


var isLepra = window.location.hostname.indexOf("leprosorium.ru") >= 0;

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
  
  
  
  getElementByXPath: function(expr, node)
  {
    var result = document.evaluate(expr, node, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    //trace("getElementByXPath(" + expr + "," + node + ") = " + result);
    return result;
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


    var postClass = isLepra ? "ord" : "post";
    var commentClass = isLepra ? "post" : "comment";
    var headCommentClass = "indent_0";

    var commentsHolder = document.getElementById("js-commentsHolder");

    var insidePost = commentsHolder != null;

    var head = utils.getElementByXPath(".//div[contains(@class, '" + postClass + "')]", document);
    var firstComment = insidePost ?
      utils.getElementByXPath("./div[contains(@class, '" + commentClass + "')]", commentsHolder) :
      null;


    var current = null;
    var history = [];



    var isPost = function(node)
    {
      return utils.hasClass(node, postClass);
    };



    var isComment = function(node)
    {
      return utils.hasClass(node, commentClass) && (node.parentNode == commentsHolder);
    };



    var moveTo = function(node)
    {
      history.push(current);
      setCurrent(node);
    };
    
    

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
        return firstComment;
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
      else if(node == firstComment)
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
    };



    var getParent = function(comment)
    {
      var link = utils.getElementByXPath(isLepra ? ".//a[@class='show_parent']" : ".//a[@class='c_parent']", comment);
      if(link)
      {
        var comment_id = link.getAttribute("replyto");
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
      var expr = isLepra ? "./div[@class='dd']/div[@class='p']/span/a" : ".//a[@class='c_icon']";
      var link = utils.getElementByXPath(expr, node);
      return link && link.href;
    };
    
    
    
    var getToggleUserLink = function(node)
    {
      var expr = isLepra ? ".//a[@class='u']" : ".//a[@class='c_show_user']";
      return utils.getElementByXPath(expr, node);
    };
    

    
    var getVotePlusLink = function(node)
    {
      var expr = isLepra ? ".//a[contains(@class, 'plus')]" : ".//a[contains(@class, 'vote_button_plus')]";
      return utils.getElementByXPath(expr, node);
    };



    var getVoteMinusLink = function(node)
    {
      var expr = isLepra ? ".//a[contains(@class, 'minus')]" : ".//a[contains(@class, 'vote_button_minus')]";
      return utils.getElementByXPath(expr, node);
    };
    
    
    
    var getReplyCommentLink = function(comment)
    {
      var expr = isLepra ? ".//a[@class='reply_link']" : ".//a[@class='c_answer']";
      return utils.getElementByXPath(expr, comment);
    };
    
    
    
    var commentIsHidden = function(node)
    {
      return utils.hasClass(node, "shrinked");
    };
    
    
    
    var getShowCommentLink = function(comment)
    {
      var expr = ".//a[@class='show_link']";
      return utils.getElementByXPath(expr, comment);
    };
    
    
    
    var getReplyPostLink = function()
    {
      var div = document.getElementById(isLepra ? "reply_link_default" : "js-comments_add_block_bottom");
      return div.getElementsByTagName("a")[0];
    };



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
          while(node && !utils.hasClass(node, "new"));
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
          if(url) window.location.href = url;
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



function createNavigator()
{
  var go = function(url)
  {
    window.location.href = url;
  };
  
  
  
  var profileUrl = utils.getElementByXPath("//div[@class='header_tagline_inner']/a", document).href;
  var glagne = isLepra ? "leprosorium.ru" : window.location.host;
  
  
  
  return {
    
    goGlagne: function()
    {
      go(glagne);
    },
    
    
    
    goHome: function()
    {    
      go("/");
    },
    
    
    
    goInbox: function()
    {
      go("/my/inbox");
    },
    
    
    
    goMyThings: function()
    {
      go("/my");
    },
    
    
    
    goProfile: function()
    {
      go(profileUrl);
    }
  };
}



function createStyle()
{
  var css = [
    ".kb-current .dt, .kb-current .comment_inner { border: 1px dashed #556E8C; }",
    "#kb-help { position: fixed; background: #ccc; padding: 1em; z-index: 1;}",
    "#kb-help dt { float: left; width: 2em; font-weight: bold; }",
    "#kb-help dd { margin: 0.5em 0;}"
  ].join("\n");

  var style = document.createElement("style");
  style.type = "text/css";
  style.innerHTML = css;
  document.getElementsByTagName('head')[0].appendChild(style);
}



function toggleHelp()
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



function initNavigation()
{

  var staticHotkeys = [];
  var navigationHotkeys = [];
  var navigationMode = false;
  
  const CTRL = 1;
  const SHIFT = 2;
  const ALT = 4;
  
  
    
  var addHotkey = function(hotkeys, handler, keyCode, modifier)
  {
    modifier = modifier || 0;
    if(hotkeys[keyCode] == null) hotkeys[keyCode] = [];
    hotkeys[keyCode][modifier] = handler;
  };
  
  
  
  var staticHotkey = function(handler, keyCode, modifier)
  {
    addHotkey(staticHotkeys, handler, keyCode, modifier);
  };
  
  
  
  var navigationHotkey = function(handler, keyCode, modifier)
  {
    addHotkey(navigationHotkeys, handler, keyCode, modifier);
  };
  
  
  
  var setStaticMode = function()
  {
    navigationMode = false;
  };
  
  
  
  var setNavigationMode = function()
  {
    if(!navigationMode)
    {
      navigationMode = true;
      setTimeout(setStaticMode, 2000);
    }
  };
  
  
  
  var controller = createController();
  var nav = createNavigator();
  
  staticHotkey( controller.goNext,          78 );
  staticHotkey( controller.goPrev,          80 );
  staticHotkey( controller.goNextNew,       77 );
  staticHotkey( controller.goParent,        86 );
  staticHotkey( controller.goPrevHead,     188 );
  staticHotkey( controller.goNextHead,     190 );
  staticHotkey( controller.goBack,          66 );
  staticHotkey( controller.goTop,           84 );
  staticHotkey( controller.rateDown,        45 );
  staticHotkey( controller.rateDown,       109 );
  staticHotkey( controller.rateDown,       189 );
  staticHotkey( controller.rateUp,          61 );
  staticHotkey( controller.rateUp,         187 );
  staticHotkey( controller.toggleUser,      85 );
  staticHotkey( controller.openPost,        79 );
  staticHotkey( controller.openPostNewTab,  79 , CTRL);
  staticHotkey( setNavigationMode,          71 );
  staticHotkey( controller.reply,           82 );
  staticHotkey( toggleHelp,                 72 );
  staticHotkey( toggleHelp,                 191, SHIFT);
  
  navigationHotkey( nav.goGlagne,           71 );
  navigationHotkey( nav.goHome,             72 );
  navigationHotkey( nav.goInbox,            73 );
  navigationHotkey( nav.goMyThings,         77 );
  navigationHotkey( nav.goProfile,          80 );
  
  var onKeydown = function(e)
  {
    e = e || window.event;
    
    var element = e.target;
    if(element.tagName == 'INPUT' || element.tagName == 'TEXTAREA') return true;
    
    var code = e.which || e.keyCode;
    var handlers = navigationMode ? navigationHotkeys[code] : staticHotkeys[code];
    
    if(handlers)
    {
      var modifier = (e.ctrlKey ? CTRL : 0) + (e.shiftKey ? SHIFT : 0) + (e.altKey ? ALT : 0);
      var handler = handlers[modifier];
      if(handler)
      {
        try
        {
          handler();
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
    return true;
  };
  
  document.addEventListener("keydown", onKeydown, false);
}



function trace(msg)
{
  GM_log(msg);
}



//function traceStack(args)
//{
//  trace(args.callee);
//  if(args.callee.caller) traceStack(callee.caller.arguments);
//}


      
try
{
  createStyle();
  initNavigation();
  trace("ready");
}
catch(e)
{
  trace(e);
}



