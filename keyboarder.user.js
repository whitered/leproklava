// ==UserScript==
// @name           Keyboarder
// @namespace      ru.whitered
// @require        http://www.openjs.com/scripts/events/keyboard_shortcuts/shortcut.js
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
    
    var postClass = "post";
    var commentClass = isLepra ? "post" : "comment";
    var parentLinkClass = isLepra ? "show_parent" : "c_parent";
    var dirtyMainContentHolderClass = isLepra ? "" : "js-posts_holder";
    var headCommentClass = "indent_0";
    var newCommentClass = "new";
    
    var postsHolder = document.getElementById("js-posts_holder");
    var commentsHolder = document.getElementById("js-commentsHolder");
    
    var insidePost = commentsHolder != null;
    trace("insidePost = " + insidePost);
    
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
      if(current)
      {
        utils.removeClass(current, currentClass);
      }
      
      current = node;
      trace("current = " + (node));
      
      if(current)
      {
        utils.addClass(current, currentClass);
        var offset = (window.innerHeight - current.offsetHeight) / 2;
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
      trace("getParent");
      const links = utils.getElementsByClass(parentLinkClass, comment, "a");
      if(links.length > 0)
      {
        var comment_id = links[0].getAttribute("replyto");
        trace("comment_id=" + comment_id);
        return document.getElementById(comment_id);
      }
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
          if(node) moveTo(next);
        }
        else
        {
          this.goNext();
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
          this.goNext();
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
          this.goPrev();
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
        trace("rate up");
      },
      
      
      
      rateDown: function()
      {
        trace("rate down");
      },
      
      
      
      toggleUser: function()
      {
        trace("toggle user");
      },
      
      
      
      goInside: function(newTab)
      {
        trace("go inside");
      }
        
    };
    
    return ctrl;
}



function initNavigation()
{
  var css = ".kb-current { border: 1px dotted #556E8C; }";
  var style = document.createElement("style");
  style.type = "text/css";
  style.innerHTML = css;
  document.getElementsByTagName('head')[0].appendChild(style);
    
  var controller = createController();
  
  shortcut.add("n", controller.goNext);
  shortcut.add("m", controller.goNextNew);
  shortcut.add("v", controller.goParent);
  shortcut.add(".", controller.goNextHead);
  shortcut.add(",", controller.goPrevHead);
  shortcut.add("b", controller.goBack);
  shortcut.add("h", controller.goTop);
  shortcut.add("=", controller.rateUp);
  shortcut.add("-", controller.rateDown);
  shortcut.add("u", controller.toggleUser);
  shortcut.add("i", controller.goInside);
}



function trace(msg)
{
  GM_log(msg);
}


initNavigation();

trace("ready");
