// ==UserScript==
// @name           leproklava
// @namespace      ru.whitered
// @include        http://dirty.ru/*
// @include        http://*.dirty.ru/*
// @include        http://leprosorium.ru/*
// @include        http://*.leprosorium.ru/*
// ==/UserScript==

(function(){

const VERSION = "0.3";
var isLepra = window.location.hostname.indexOf("leprosorium.ru") >= 0;

var utils = {

  hasClass: function(ele, cls)
  {
    if(!ele) return false;
    return ele.className ? ele.className.split(" ").indexOf(cls) >= 0 : false;
  },



  addClass: function(ele, cls)
  {
    if (!this.hasClass(ele, cls)) ele.className += " " + cls;
  },



  removeClass: function(ele, cls)
  {
    if (this.hasClass(ele, cls))
    {
      var reg = new RegExp("(\\s|^)" + cls + "(\\s|$)");
      ele.className = ele.className.replace(reg, " ");
    }
  },



  getElementsByClass: function(searchClass, node, tag)
  {
    if(tag == null) tag = "*";

    var classElements = [];
    var els = node.getElementsByTagName(tag);
    var elsLen = els.length;
    var pattern = new RegExp("(^|\\s)" + searchClass + "(\\s|$)");

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
    return document.evaluate(expr, node, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  },



  scrollPosition: function(y, x)
  {
    x = x || null;
    y = y || null;

    if(x === null && y === null)
    {
      y = document.body.scrollTop ? document.body.scrollTop : document.documentElement.scrollTop;
      x = document.body.scrollTop ? document.body.scrollLeft : document.documentElement.scrollLeft;
      return { x: x, y: y }
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
      window.scrollTo(x, y);
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
    return { x: x, y: y };
  }

};



function createController()
{
  var cssClass = {
    post:           isLepra ? "ord" : "post",
    comment:        isLepra ? "post" : "comment",
    headComment:    "indent_0",
    newComment:     "new",
    hiddenComment:  "shrinked"
  };
  
  var xpath = isLepra ? 
  {
    parentLink:           ".//a[@class='show_parent']",
    itemLink:             "./div[@class='dd']/div[@class='p']/span/a",
    toggleUserLink:       ".//a[@class='u']",
    postAuthorLink:       "./div[@class='dd']/div[@class='p']//a[contains(@href, '/users/')]",
    commentAuthorLink:    "./div[@class='dd']/div[@class='p']//a[contains(@href, '/users/')]",
    votePlusLink:         ".//a[contains(@class, 'plus')]",
    voteMinusLink:        ".//a[contains(@class, 'minus')]",
    replyCommentLink:     ".//a[@class='reply_link']",
    showCommentLink:      ".//a[@class='show_link']",
    replyPostLink:        "id('reply_link_default')/a",
    commentPicture:       "./div[contains(@class, 'dt')]//img"
  } 
  : 
  {
    parentLink:           ".//a[@class='c_parent']",
    itemLink:             "./div[@class='dd']/span/a",
    toggleUserLink:       ".//a[@class='c_show_user']",
    postAuthorLink:       "./div[@class='dd']/a[contains(@href, '/user/')]", 
    commentAuthorLink:    ".//a[@class='c_user']",
    votePlusLink:         ".//a[contains(@class, 'vote_button_plus')]",
    voteMinusLink:        ".//a[contains(@class, 'vote_button_minus')]",
    replyCommentLink:     ".//a[@class='c_answer']",
    showCommentLink:      ".//a[@class='show_link']",
    replyPostLink:        "id('js-comments_add_block_bottom')/a",
    commentPicture:       ".//div[contains(@class, 'c_body')]//img"
  };
  
  
  var commentsHolder = document.getElementById("js-commentsHolder");

  
  var insidePost = commentsHolder != null;

  var head = utils.getElementsByClass(cssClass.post, document, "div")[0];
  var firstComment = insidePost ?
    utils.getElementByXPath("./div[contains(@class, '" + cssClass.comment + "')]", commentsHolder) :
    null;

  var current = insidePost ? head : null;
  var history = [];
  
  
  
  //----------------------------------------------------------------------------
  // focus element by mouse
  //----------------------------------------------------------------------------
  
  var handleClick = function(e)
  {
    var elem = e.target;
    while(elem && !isComment(elem) && !isPost(elem) && elem != e.currentTarget)
    {
      elem = elem.parentNode;
    }
    if(elem && elem != current) setCurrent(elem, true);
  }

  var listenForClick = function(target)
  {
    if(target)
    {
      target.addEventListener("click", handleClick, false);
    }
  }
  
  if(insidePost)
  {
    listenForClick(commentsHolder);
    listenForClick(head);
  }
  else
  {
    listenForClick(document.getElementById("js-posts_holder") || document.getElementById("inbox_posts"));
  }
  
  
  
  //----------------------------------------------------------------------------
  // fake link used to start selecting active elements inside the current item
  //----------------------------------------------------------------------------
  var fakeLink = document.createElement("a");
  fakeLink.setAttribute("href", "#");
  fakeLink.style.position = "absolute";
  fakeLink.style.left = "-1000px";
  
  var removeFakeLink = function(e)
  {
    fakeLink.parentNode.removeChild(fakeLink);
  };
  
  fakeLink.addEventListener("blur", removeFakeLink, false);
  


  var isPost = function(node)
  {
    return utils.hasClass(node, cssClass.post);
  };



  var isComment = function(node)
  {
    return utils.hasClass(node, cssClass.comment) && (node.parentNode == commentsHolder);
  };

  
  
  var moveTo = function(node)
  {
    history.push(current);
    setCurrent(node, false);
  };
  
  
  
  var setCurrent = function(node, silent)
  {
    var currentClass = "kb-current";
    
    if(current)
    {
      utils.removeClass(current, currentClass);
    }

    current = node;
    
    if(current)
    {
       // ensure that the first active element in the node will be selected when user press TAB
       // http://stackoverflow.com/questions/4490831/prepare-to-focus-first-active-element-in-a-container
      if(document.activeElement == fakeLink)
      {
        fakeLink.blur();
      }
      current.insertBefore(fakeLink, current.firstChild);
      fakeLink.focus();
      
      if(!silent)
      {
        utils.addClass(current, currentClass);
        var offset = (window.innerHeight - current.offsetHeight) / 2;
        if(offset < 0) offset = 0;
        utils.scrollPosition(utils.elementPosition(current).y - offset);
      }
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



  var clickLink = function(link)
  {
    var theEvent = document.createEvent("MouseEvent");
    theEvent.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    link.dispatchEvent(theEvent);
  };
  
  
  
  var findTarget = function(hash)
  {
    if(hash)
    {
      var target = document.getElementById(hash);
      if(!target)
      {
        var anchors = document.anchors;
        for (var i = 0; i < anchors.length; i++)
        {
          if(anchors[i].getAttribute("name") == hash)
          {
            target = getNext(anchors[i]);
            break;
          }
        }
      }
    }
    return target;
  };
  
  
  
  // init navigation with page's target element with no visual effect
  var target = findTarget(window.location.hash.substring(1));
  if(target && (isComment(target) || isPost(target))) setCurrent(target, true);



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
        while(node && !utils.hasClass(node, cssClass.newComment));
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
        while(node && !utils.hasClass(node, cssClass.newComment));
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
        var link = utils.getElementByXPath(xpath.parentLink, current);
        if(link)
        {
          var comment_id = link.getAttribute("replyto");
          moveTo(document.getElementById(comment_id));
        }
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
        while(node && !utils.hasClass(node, cssClass.headComment));
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
        while(node && !utils.hasClass(node, cssClass.headComment));
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
        while(node && !utils.getElementByXPath(xpath.commentPicture, node));
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
        while(node && !utils.getElementByXPath(xpath.commentPicture, node));
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
        setCurrent(history.pop(), false);
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
        var link = utils.getElementByXPath(xpath.votePlusLink, current);
        if(link) clickLink(link);
      }
    },



    rateDown: function()
    {
      if(current)
      {
        var link = utils.getElementByXPath(xpath.voteMinusLink, current);
        if(link) clickLink(link);
      }
    },



    toggleUser: function()
    {
      if(current)
      {
        var link = utils.getElementByXPath(xpath.toggleUserLink, current);
        if(link)
        {
          clickLink(link);
        }
      }
    },
    
    
    
    visitUser: function()
    {
      if(current)
      {
        var link = utils.getElementByXPath(isPost(current) ? xpath.postAuthorLink : xpath.commentAuthorLink, current);
        if(link) window.open(link.href);
      }
    },



    openPost: function()
    {
      if(current)
      {
        var link = utils.getElementByXPath(xpath.itemLink, current);
        if(link) window.location.href = link.href;
      }
    },
    
    
    
    openPostNewTab: function()
    {
      if(current)
      {
        var link = utils.getElementByXPath(xpath.itemLink, current);
        if(link) window.open(link.href);
      }
    },
    
    
    
    reply: function()
    {
      if(current && isComment(current))
      {
        if(utils.hasClass(current, cssClass.hiddenComment))
        {
          clickLink(utils.getElementByXPath(xpath.showCommentLink, current));
        }
        else
        {
          var replyCommentLink = utils.getElementByXPath(xpath.replyCommentLink, current);
          if(replyCommentLink) clickLink(replyCommentLink);
        }
      }
      else if(insidePost)
      {
        var replyPostLink = utils.getElementByXPath(xpath.replyPostLink, current);
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
  
  
  
  var openArchive = function(date)
  {
    var year = date.getFullYear().toString();
    var month = (date.getMonth() + 1).toString();
    var day = date.getDate().toString();
    if(month.length == 1) month = "0" + month;
    if(day.length == 1) day = "0" + day;
    
    go(glagne + "/archive/" + year + month + day);
  };
  
  
  
  var turnPage = function(step)
  {
    var path = window.location.pathname;
    var pagestr;
    if(path == "/")
    {
      pagestr = "1";
    }
    else
    {
      var md = path.match(/\/archive\/(\d{8})/) || path.match(/\/page\/(\d+)/);
      if(!md) return;
      pagestr = md[1];
    } 
    
    if(pagestr.length == 8)
    {
      var year = Number(pagestr.substr(0, 4));
      var month = Number(pagestr.substr(4, 2)) - 1;
      var day = Number(pagestr.substr(6, 2));
      var date = new Date(year, month, day);
      date.setDate(date.getDate() + step);
      openArchive(date);
    }
    else
    {
      var page = Number(pagestr) + step;
      go((page > 1) ? "/page/" + page : "/");
    }
  };
  
  
  
  var expr = isLepra ? "id('greetings')/a" : "//div[@class='header_tagline_inner']//a";
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
      go(glagne + "/my/inbox/");
    },
    
    
    
    goMyThings: function()
    {
      go(glagne + "/my/");
    },
    
    
    
    goFavourites: function()
    {
      go(glagne + "/my/favourites/");
    },
    
    
    
    goProfile: function()
    {
      go(profileUrl);
    },
    
    
    
    goArchive: function()
    {
      openArchive(new Date());
    },
    
    
    
    goPrevPage: function()
    {
      turnPage(-1);
    },
    
    
    
    goNextPage: function()
    {
      turnPage(1);
    }
  };
}



function createStyle()
{
  var css = [
    ".kb-current .dt, .kb-current .comment_inner { border: 1px dashed #556E8C; }",
    "#kb-help { position: fixed; background: #eee; padding: 1em 2em; z-index: 3; font-size: 10px; }",
    "#kb-help h4 {margin-top: 2em; }",
    "#kb-help dt { float: left; width: 8em; font-weight: bold; }",
    "#kb-help dd { margin: 0.5em 0; width: 40em; }",
    "#kb-help td { vertical-align: top; }"
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
  
  var dlist = function(container, values)
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
    container.appendChild(dl);
    return dl;
  };
  
  var tag = function(container, tag, text)
  {
    var el = document.createElement(tag);
    if(text) el.appendChild(document.createTextNode(text));
    container.appendChild(el);
    return el;
  };

  content = document.createElement("div");
  content.id = "kb-help";
  
  tag(content, "h2", "leproklava");
  
  tag(content, "a", "версия " + VERSION).href = "http://userscripts.org/scripts/show/93588";
  
  var tr = tag(tag(content, "table"), "tr");
  var td1 = tag(tr, "td");
  var td2 = tag(tr, "td");
  
  tag(td1, "h4", "навигация по странице");
  dlist(td1, [
    ["h или ?", "показать/скрыть окно помощи"],
    ["p / n", "переход по комментариям или постам"],
    ["shift + p / n", "переход по новым комментариям или постам"],
    ["k / j", "переход по новым комментариям или постам"],
    ["[ / ]", "переход по комментариям 1-го уровня или постам"],
    ["shift + [ / ]", "переход по комментариям с картинкой"],
    ["l", "родительский комментарий"],
    ["t", "первый пост на странице"],
    ["b", "назад"],
    ["v", "открыть пост (ctrl - в новой вкладке)"],
    ["- / +", "голосовать"],
    ["u", "выделить все комментарии автора"],
    ["ctrl + u", "открыть профиль автора"],
    ["c", "раскрыть комментарий, комментировать"]
  ]);
  
  tag(td2, "h4", "навигация по сайту");
  dlist(td2, [
    ["g g", "главная"],
    isLepra ? ["g h", "главная подлепры"] : null,
    ["g p", "мой профиль"],
    ["g i", "инбоксы"],
    ["g m", "мои вещи"],
    ["g f", "избранное"],
    ["g a", "архив"],
    ["g [", "предыдущая страница или день в архиве"],
    ["g ]", "следующая страница или день в архиве"]
  ]);
  
  document.getElementsByTagName("body")[0].appendChild(content);
  
  content.style.left = ((window.innerWidth - content.clientWidth) / 2) + "px";
  content.style.top = ((window.innerHeight - content.clientHeight) / 2) + "px";
  
  content.addEventListener("click", toggleHelp, false);
  document.addEventListener("keydown", closeOnEsc, false);
};



function initNavigation()
{
  const CTRL = 1;
  const SHIFT = 2;
  const ALT = 4;
    
  var staticHotkeys = [];
  var jumpingHotkeys = [];
  var navigationMode = false;
  var timeoutId;
  
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
    clearTimeout(timeoutId);
    navigationMode = false;
  };
  
  
  
  var setNavigationMode = function()
  {
    if(!navigationMode)
    {
      navigationMode = true;
      timeoutId = setTimeout(setStaticMode, 1000);
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
    if(document.activeElement) document.activeElement.blur();
  };
    
  
  
  var controller = createController();
  var nav = createNavigator();
  
  staticHotkey( controller.goPrev,          80 );
  staticHotkey( controller.goNext,          78 );
  staticHotkey( controller.goPrevNew,       80 , SHIFT);
  staticHotkey( controller.goNextNew,       78 , SHIFT);
  staticHotkey( controller.goPrevNew,       75 );
  staticHotkey( controller.goNextNew,       74 );
  staticHotkey( controller.goPrevHead,     219 );
  staticHotkey( controller.goNextHead,     221 );
  staticHotkey( controller.goPrevPicture,  219 , SHIFT);
  staticHotkey( controller.goNextPicture,  221 , SHIFT);
  staticHotkey( controller.goBack,          66 );
  staticHotkey( controller.goParent,        76 );
  staticHotkey( controller.goTop,           84 );
  staticHotkey( controller.rateDown,        45 );
  staticHotkey( controller.rateDown,       109 );
  staticHotkey( controller.rateDown,       189 );
  staticHotkey( controller.rateUp,          61 );
  staticHotkey( controller.rateUp,         187 );
  staticHotkey( controller.toggleUser,      85 );
  staticHotkey( controller.visitUser,       85 , CTRL);
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
  jumpingHotkey( nav.goFavourites,       70 );
  jumpingHotkey( nav.goProfile,          80 );
  jumpingHotkey( nav.goArchive,          65 );
  jumpingHotkey( nav.goPrevPage,        219 );
  jumpingHotkey( nav.goNextPage,        221 );

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
    if(navigationMode) setStaticMode();
    
    if(handlers)
    {
      var modifier = (e.ctrlKey ? CTRL : 0) + (e.shiftKey ? SHIFT : 0) + (e.altKey ? ALT : 0);
      var handler = handlers[modifier];
      if(handler)
      {
        handler();
        
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



createStyle();
initNavigation();

})();

