// ==UserScript==
// @name           leproklava
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
    var toggleUserClass = "c_show_user";
    var itemLinkClass = "c_icon";

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



    var clickLink = function(link)
    {
      var theEvent = document.createEvent("MouseEvent");
      theEvent.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
      link.dispatchEvent(theEvent);
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
        trace("rate up");
      },



      rateDown: function()
      {
        trace("rate down");
      },



      toggleUser: function()
      {
        if(current)
        {
          var links = utils.getElementsByClass(toggleUserClass, current, "a");
          if(links.length > 0)
          {
            clickLink(links[0]);
          }
        }
      },



      goInside: function(newTab)
      {
        if(current)
        {
          var links = utils.getElementsByClass(itemLinkClass, current, "a");
          if(links.length > 0)
          {
            document.location.href = links[0].href;
          }
        }
      }

    };

    return ctrl;
}





function initNavigation()
{
  var css = ".kb-current { border: 1px dotted #556E8C; }";
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
      ["i", "Войти в пост"]
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

  var controller = createController();

  shortcut.add("n", controller.goNext, { disable_in_input: true });
  shortcut.add("m", controller.goNextNew, { disable_in_input: true });
  shortcut.add("v", controller.goParent, { disable_in_input: true });
  shortcut.add(",", controller.goPrevHead, { disable_in_input: true });
  shortcut.add(".", controller.goNextHead, { disable_in_input: true });
  shortcut.add("b", controller.goBack, { disable_in_input: true });
  shortcut.add("t", controller.goTop, { disable_in_input: true });
  shortcut.add("-", controller.rateDown, { disable_in_input: true });
  shortcut.add("=", controller.rateUp, { disable_in_input: true });
  shortcut.add("u", controller.toggleUser, { disable_in_input: true });
  shortcut.add("i", controller.goInside, { disable_in_input: true });
  shortcut.add("h", toggleHelp, { disable_in_input: true });
}



function trace(msg)
{
  GM_log(msg);
}


initNavigation();

trace("ready");

