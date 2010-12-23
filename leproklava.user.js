// ==UserScript==
// @name           leproklava
// @namespace      ru.whitered
// @include        http://dirty.ru/*
// @include        http://*.dirty.ru/*
// @include        http://leprosorium.ru/*
// @include        http://*.leprosorium.ru/*
// ==/UserScript==


const VERSION = "0.1";
var isLepra = window.location.hostname.indexOf("leprosorium.ru") >= 0;

var utils = {

  hasClass: function(ele,cls)
  {
    if(!ele) return false;
    return ele.className ? ele.className.split(" ").indexOf(cls) >= 0 : false;
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
    var postClass = isLepra ? "ord" : "post";
    var commentClass = isLepra ? "post" : "comment";
    var headCommentClass = "indent_0";
    var newCommentClass = "new";

    var commentsHolder = document.getElementById("js-commentsHolder");

    var insidePost = commentsHolder != null;
    trace("insidePost: " + insidePost);

    var head = utils.getElementsByClass(postClass, document, "div")[0];
    var firstComment = insidePost ?
      utils.getElementByXPath("./div[contains(@class, '" + commentClass + "')]", commentsHolder) :
      null;

    var fakeLink = document.createElement("a");
    fakeLink.setAttribute("href", "#");
    
    var removeFakeLink = function(e)
    {
      fakeLink.parentNode.removeChild(fakeLink);
    };
    
    fakeLink.addEventListener("blur", removeFakeLink, false);
    
    
    

    var current = insidePost ? head : null;
    var history = [];
    



    var isPost = function(node)
    {
      return utils.hasClass(node, postClass);
    };



    var isComment = function(node)
    {
      return utils.hasClass(node, commentClass) && (node.parentNode == commentsHolder);
    };
    
    
    
    if(window.location.hash.length > 1)
    {
      var target = document.getElementById(window.location.hash.substring(1));
      if(isComment(target)) current = target;
    }



    var moveTo = function(node)
    {
      history.push(current);
      setCurrent(node);
    };
    
    
    
    /**
     * this method ensures that the first active element in the node will be selected when user press TAB
     * http://stackoverflow.com/questions/4490831/prepare-to-focus-first-active-element-in-a-container
     */
    var prefocusElement = function(node)
    {
      if(document.activeElement == fakeLink)
      {
        fakeLink.blur();
      }
      node.insertBefore(fakeLink, node.firstChild);
      fakeLink.focus();
    };
    
    

    var setCurrent = function(node)
    {
      var currentClass = "kb-current";
      
      if(current == node)
      {
        trace("same element");
        //return;
      }     
      
      if(current)
      {
        utils.removeClass(current, currentClass);
      }

      current = node;
      //trace("current = " + (node));
      
      if(current)
      {
        prefocusElement(current);
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
      var expr = isLepra ? "./div[@class='dd']/div[@class='p']/span/a" : "./div[@class='dd']/span/a";
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
      return div && div.getElementsByTagName("a")[0];
    };
    
    
    
    var hasPicture = function(node)
    {
      var expr = isLepra ? "./div[contains(@class, 'dt')]//img" : ".//div[contains(@class, 'c_body')]//img";
      var img = utils.getElementByXPath(expr, node);
      return !!img;
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
          while(node && !utils.hasClass(node, newCommentClass));
          if(node) moveTo(node);
        }
        else
        {
          ctrl.goNext();
        }
      },
      
      
      
      goPrevNew: function()
      {
        if(insidePost)
        {
          var node = current || head;
          do
          {
            node = getPrev(node);
          }
          while(node && !utils.hasClass(node, newCommentClass));
          if(node) moveTo(node);
        }
        else
        {
          ctrl.goPrev();
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
      
      
      
      goNextPicture: function()
      {
        if(insidePost)
        {
          var node = current || head;
          do
          {
            node = getNext(node);
          }
          while(node && !hasPicture(node));
          if(node) moveTo(node);
        }
        else
        {
          ctrl.goNext();
        }
      },



      goPrevPicture: function()
      {
        if(insidePost)
        {
          var node = current || head;
          do
          {
            node = getPrev(node);
          }
          while(node && !hasPicture(node));
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
          if(replyPostLink)
          {
            clickLink(replyPostLink);
            if(isLepra) document.getElementById("comment_textarea").focus();
          }
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
  
  
  var expr = isLepra ? "id('greetings')/a" : "//div[@class='header_tagline_inner']/a";
  var profileLink = utils.getElementByXPath(expr, document);
  var profileUrl = profileLink && profileLink.href;
  var glagne = "http://" + (isLepra ? "leprosorium.ru" : window.location.host);
  
  
  
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
      go(glagne + "/my/inbox");
    },
    
    
    
    goMyThings: function()
    {
      go(glagne + "/my");
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
    "#kb-help { position: fixed; background: #eee; padding: 1em 3em; z-index: 3;}",
    "#kb-help h4 {margin-top: 2em; }",
    "#kb-help dt { float: left; width: 8em; font-weight: bold; }",
    "#kb-help dd { margin: 0.5em 0; width: 40em; }"
  ].join("\n");

  var style = document.createElement("style");
  style.type = "text/css";
  style.innerHTML = css;
  document.getElementsByTagName("head")[0].appendChild(style);
}



function closeOnEsc(e)
{
  e = e || window.event;
  
  var element = e.target;
  if(element.tagName == "INPUT" || element.tagName == "TEXTAREA") return true;
  
  var code = e.which || e.keyCode;
  if(code == 27)
  {
    toggleHelp();
    return false;
  }
  else
  {
    return true;
  }
}
  
  
  
  
function toggleHelp()
{
  var content = document.getElementById("kb-help");
  if(content)
  {
    content.parentNode.removeChild(content);
    document.removeEventListener("keydown", closeOnEsc, false);
    return;
  }
  
  var dlist = function(values)
  {
    var dl = document.createElement("dl");
    var dt;
    var dd;
    for (var i = 0; i < values.length; i++)
    {
       if(!values[i]) continue;
       dt = document.createElement("dt");
       dt.appendChild(document.createTextNode(values[i][0]));
       dl.appendChild(dt);
  
       dd = document.createElement("dd");
       dd.appendChild(document.createTextNode(values[i][1]));
       dl.appendChild(dd);
    }
    content.appendChild(dl);
  };
  
  var tag = function(tag, text)
  {
    var el = document.createElement(tag);
    el.appendChild(document.createTextNode(text));
    content.appendChild(el);
  };

  content = document.createElement("div");
  content.id = "kb-help";
  content.className = "small";
  
  tag("h2", "leproklava");
  
  tag("p", "версия " + VERSION);
  
  tag("h4", "навигация по странице");
  dlist([
    ["h или ?", "показать/скрыть окно помощи"],
    ["p / n", "переход по комментариям или постам"],
    ["k / j", "переход по новым комментариям или постам"],
    ["[ / ]", "переход по комментариям 1-го уровня или постам"],
    ["ctrl + [ / ]", "переход по комментариям с картинкой"],
    ["l", "родительский комментарий"],
    ["t", "первый пост на странице"],
    ["b", "назад"],
    ["v", "открыть пост (ctrl - в новой вкладке)"],
    ["-/+", "голосовать"],
    ["u", "выделить все комментарии автора"],
    ["c", "раскрыть комментарий, комментировать"]
  ]);
  
  tag("h4", "навигация по сайту");
  dlist([
    ["g g", "главная"],
    isLepra ? ["g h", "главная подлепры"] : null,
    ["g p", "профиль"],
    ["g i", "инбоксы"],
    ["g m", "мои вещи"]
  ]);
  
  document.getElementsByTagName("body")[0].appendChild(content);
  
  content.style.left = ((window.innerWidth - content.clientWidth) / 2) + "px";
  content.style.top = ((window.innerHeight - content.clientHeight) / 2) + "px";
  
  content.addEventListener("click", toggleHelp, false);
  document.addEventListener("keydown", closeOnEsc, false);
};



function initNavigation()
{
  var staticHotkeys = [];
  var jumpingHotkeys = [];
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
  
  
  
  var jumpingHotkey = function(handler, keyCode, modifier)
  {
    addHotkey(jumpingHotkeys, handler, keyCode, modifier);
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
      setTimeout(setStaticMode, 1000);
    }
  };
  
  
  
  var hideCommentForm = function()
  {
    if(isLepra)
    {
      document.getElementById("reply_form").style.display = "none";
      document.getElementById("reply_link_default").style.display = "block";
    }
    else
    {
      utils.addClass(document.getElementById("js-comments_reply_block"), "hidden");
      utils.removeClass(utils.getElementByXPath("./a[contains(@class, 'comments_add_block_bottom_link')]", document.getElementById('js-comments_add_block_bottom')), 'hidden');
    }
  };
    
  
  
  var controller = createController();
  var nav = createNavigator();
  
  staticHotkey( controller.goPrev,          80 );
  staticHotkey( controller.goNext,          78 );
  staticHotkey( controller.goPrevNew,       75 );
  staticHotkey( controller.goNextNew,       74 );
  staticHotkey( controller.goPrevHead,     219 );
  staticHotkey( controller.goNextHead,     221 );
  staticHotkey( controller.goPrevPicture,  219, CTRL);
  staticHotkey( controller.goNextPicture,  221, CTRL);
  staticHotkey( controller.goBack,          66 );
  staticHotkey( controller.goParent,        76 );
  staticHotkey( controller.goTop,           84 );
  staticHotkey( controller.rateDown,        45 );
  staticHotkey( controller.rateDown,       109 );
  staticHotkey( controller.rateDown,       189 );
  staticHotkey( controller.rateUp,          61 );
  staticHotkey( controller.rateUp,         187 );
  staticHotkey( controller.toggleUser,      85 );
  staticHotkey( controller.openPost,        86 );
  staticHotkey( controller.openPostNewTab,  86 , CTRL);
  staticHotkey( controller.reply,           67 );
  
  staticHotkey( setNavigationMode,          71 );
  staticHotkey( toggleHelp,                 72 );
  staticHotkey( toggleHelp,                 191, SHIFT);
  
  jumpingHotkey( nav.goGlagne,           71 );
  jumpingHotkey( nav.goHome,             72 );
  jumpingHotkey( nav.goInbox,            73 );
  jumpingHotkey( nav.goMyThings,         77 );
  jumpingHotkey( nav.goProfile,          80 );
  
  var onKeydown = function(e)
  {
    e = e || window.event;
    
    var element = e.target;
    var code = e.which || e.keyCode;
    
    if((element.tagName == "INPUT" && (element.type == "text" || element.type == "password")) || element.tagName == "TEXTAREA")
    {
      if(code == 27 && element.id == "comment_textarea")
      {
        hideCommentForm();
      }
      return true;
    } 
    
    var handlers = navigationMode ? jumpingHotkeys[code] : staticHotkeys[code];
    
    if(handlers)
    {
      var modifier = (e.ctrlKey ? CTRL : 0) + (e.shiftKey ? SHIFT : 0) + (e.altKey ? ALT : 0);
      var handler = handlers[modifier];
      if(handler)
      {
        try
        {
          var t1 = new Date();
          handler();
          var time = new Date() - t1;
          if(time > 2) trace("time: " + time);
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
  var t0 = new Date();
  createStyle();
  initNavigation();
  var t1 = new Date();
  trace("ready in " + (t1 - t0) + " ms");
}
catch(e)
{
  trace(e);
}



