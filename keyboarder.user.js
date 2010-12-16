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
 


function createNavigation()
{
    var currentClass = "kb-current";
  
    var isLepra = window.location.hostname.indexOf("leprosorium.ru") >= 0;
    
    var postClass = "post";
    var commentClass = isLepra ? "post" : "comment";
    var parentLinkClass = isLepra ? "show_parent" : "c_parent";
    var dirtyMainContentHolderClass = isLepra ? "" : "js-posts_holder";
    
    var postsHolder = document.getElementById("js-posts_holder");
    var commentsHolder = document.getElementById("js-commentsHolder");
    
    var insidePost = commentsHolder != null;
    trace("insidePost = " + insidePost);
    
    var posts = utils.getElementsByClass(postClass, postsHolder, "div");
    var head = posts[0];
    var comments = insidePost ? utils.getElementsByClass(commentClass, commentsHolder, "div") : null;
    

    var css = ".kb-current { border: 1px solid #33c; }";
    var style = document.createElement("style");
    style.type = "text/css";
    style.innerHTML = css;
    document.getElementsByTagName('head')[0].appendChild(style);
    
    return {
        
        current: null,
        
        
        
        isPost: function(node)
        {
          return node && node.nodeType == 1 && utils.hasClass(node, postClass);
        },
        
        
        
        isComment: function(node)
        {
          return node && node.nodeType == 1 && utils.hasClass(node, commentClass);
        },
        
        
        
        isNew: function(node)
        {
          return utils.hasClass(node || this.current, "new");
        },
        
        
        
        setCurrent: function(node)
        {
          if(this.current)
          {
            utils.removeClass(this.current, currentClass);
          }
          
          this.current = node;
          trace("current = " + (node));
          
          if(this.current)
          {
            utils.addClass(this.current, currentClass);
            var offset = (window.innerHeight - this.current.offsetHeight) / 2;
            utils.scrollPosition(utils.elementPosition(this.current).y - offset);
          }
        },
        
        
        
        getNext: function(node)
        {
          var next = node || this.current;
          if(next)
          {
            if(this.isPost(next) && insidePost)
            {
              trace("insidePost");
              return comments[0];
            }
            else
            {
              trace("nope");
              do
              {
                next = next.nextSibling;
              } 
              while (next && !(this.isComment(next) || this.isPost(next)));
              return next;
            }
          }
          else
          {
            return head;
          }
        },
        
        
        
        goNext: function()
        {
          this.setCurrent(this.getNext());
        },
        
        
        
        goNextNew: function()
        {
          var next = this.getNext();
          while(next && !this.isNew(next))
          {
            next = this.getNext(next);
          }
          setCurrent(next);
        },
        
        
        
        goParent: function()
        {
          if(this.isComment(this.current))
          {
            //TODO: find parent comment
          }
        },
        
        
        
        goNextHead: function()
        {
        },
        
        
        
        goPrevHead: function()
        {
        },
        
        
        
        goBack: function()
        {
        },
        
        
        
        goTop: function()
        {
        },
        
        
        
        rateUp: function()
        {
        },
        
        
        
        rateDown: function()
        {
        },
        
        
        
        toggleUser: function()
        {
        },
        
        
        
        toPost: function(newTab)
        {
        }
        
    };
}



function initNavigation()
{
  var nav = createNavigation();
  shortcut.add("n", function(){ nav.goNext(); });
}



function trace(msg)
{
  GM_log(msg);
}


initNavigation();

trace("ready");
