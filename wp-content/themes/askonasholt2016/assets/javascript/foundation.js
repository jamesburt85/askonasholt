!function ($) {

  "use strict";

  var FOUNDATION_VERSION = '6.2.4';

  // Global Foundation object
  // This is attached to the window, or used as a module for AMD/Browserify
  var Foundation = {
    version: FOUNDATION_VERSION,

    /**
     * Stores initialized plugins.
     */
    _plugins: {},

    /**
     * Stores generated unique ids for plugin instances
     */
    _uuids: [],

    /**
     * Returns a boolean for RTL support
     */
    rtl: function () {
      return $('html').attr('dir') === 'rtl';
    },
    /**
     * Defines a Foundation plugin, adding it to the `Foundation` namespace and the list of plugins to initialize when reflowing.
     * @param {Object} plugin - The constructor of the plugin.
     */
    plugin: function (plugin, name) {
      // Object key to use when adding to global Foundation object
      // Examples: Foundation.Reveal, Foundation.OffCanvas
      var className = name || functionName(plugin);
      // Object key to use when storing the plugin, also used to create the identifying data attribute for the plugin
      // Examples: data-reveal, data-off-canvas
      var attrName = hyphenate(className);

      // Add to the Foundation object and the plugins list (for reflowing)
      this._plugins[attrName] = this[className] = plugin;
    },
    /**
     * @function
     * Populates the _uuids array with pointers to each individual plugin instance.
     * Adds the `zfPlugin` data-attribute to programmatically created plugins to allow use of $(selector).foundation(method) calls.
     * Also fires the initialization event for each plugin, consolidating repetitive code.
     * @param {Object} plugin - an instance of a plugin, usually `this` in context.
     * @param {String} name - the name of the plugin, passed as a camelCased string.
     * @fires Plugin#init
     */
    registerPlugin: function (plugin, name) {
      var pluginName = name ? hyphenate(name) : functionName(plugin.constructor).toLowerCase();
      plugin.uuid = this.GetYoDigits(6, pluginName);

      if (!plugin.$element.attr(`data-${pluginName}`)) {
        plugin.$element.attr(`data-${pluginName}`, plugin.uuid);
      }
      if (!plugin.$element.data('zfPlugin')) {
        plugin.$element.data('zfPlugin', plugin);
      }
      /**
       * Fires when the plugin has initialized.
       * @event Plugin#init
       */
      plugin.$element.trigger(`init.zf.${pluginName}`);

      this._uuids.push(plugin.uuid);

      return;
    },
    /**
     * @function
     * Removes the plugins uuid from the _uuids array.
     * Removes the zfPlugin data attribute, as well as the data-plugin-name attribute.
     * Also fires the destroyed event for the plugin, consolidating repetitive code.
     * @param {Object} plugin - an instance of a plugin, usually `this` in context.
     * @fires Plugin#destroyed
     */
    unregisterPlugin: function (plugin) {
      var pluginName = hyphenate(functionName(plugin.$element.data('zfPlugin').constructor));

      this._uuids.splice(this._uuids.indexOf(plugin.uuid), 1);
      plugin.$element.removeAttr(`data-${pluginName}`).removeData('zfPlugin')
      /**
       * Fires when the plugin has been destroyed.
       * @event Plugin#destroyed
       */
      .trigger(`destroyed.zf.${pluginName}`);
      for (var prop in plugin) {
        plugin[prop] = null; //clean up script to prep for garbage collection.
      }
      return;
    },

    /**
     * @function
     * Causes one or more active plugins to re-initialize, resetting event listeners, recalculating positions, etc.
     * @param {String} plugins - optional string of an individual plugin key, attained by calling `$(element).data('pluginName')`, or string of a plugin class i.e. `'dropdown'`
     * @default If no argument is passed, reflow all currently active plugins.
     */
    reInit: function (plugins) {
      var isJQ = plugins instanceof $;
      try {
        if (isJQ) {
          plugins.each(function () {
            $(this).data('zfPlugin')._init();
          });
        } else {
          var type = typeof plugins,
              _this = this,
              fns = {
            'object': function (plgs) {
              plgs.forEach(function (p) {
                p = hyphenate(p);
                $('[data-' + p + ']').foundation('_init');
              });
            },
            'string': function () {
              plugins = hyphenate(plugins);
              $('[data-' + plugins + ']').foundation('_init');
            },
            'undefined': function () {
              this['object'](Object.keys(_this._plugins));
            }
          };
          fns[type](plugins);
        }
      } catch (err) {
        console.error(err);
      } finally {
        return plugins;
      }
    },

    /**
     * returns a random base-36 uid with namespacing
     * @function
     * @param {Number} length - number of random base-36 digits desired. Increase for more random strings.
     * @param {String} namespace - name of plugin to be incorporated in uid, optional.
     * @default {String} '' - if no plugin name is provided, nothing is appended to the uid.
     * @returns {String} - unique id
     */
    GetYoDigits: function (length, namespace) {
      length = length || 6;
      return Math.round(Math.pow(36, length + 1) - Math.random() * Math.pow(36, length)).toString(36).slice(1) + (namespace ? `-${namespace}` : '');
    },
    /**
     * Initialize plugins on any elements within `elem` (and `elem` itself) that aren't already initialized.
     * @param {Object} elem - jQuery object containing the element to check inside. Also checks the element itself, unless it's the `document` object.
     * @param {String|Array} plugins - A list of plugins to initialize. Leave this out to initialize everything.
     */
    reflow: function (elem, plugins) {

      // If plugins is undefined, just grab everything
      if (typeof plugins === 'undefined') {
        plugins = Object.keys(this._plugins);
      }
      // If plugins is a string, convert it to an array with one item
      else if (typeof plugins === 'string') {
          plugins = [plugins];
        }

      var _this = this;

      // Iterate through each plugin
      $.each(plugins, function (i, name) {
        // Get the current plugin
        var plugin = _this._plugins[name];

        // Localize the search to all elements inside elem, as well as elem itself, unless elem === document
        var $elem = $(elem).find('[data-' + name + ']').addBack('[data-' + name + ']');

        // For each plugin found, initialize it
        $elem.each(function () {
          var $el = $(this),
              opts = {};
          // Don't double-dip on plugins
          if ($el.data('zfPlugin')) {
            console.warn("Tried to initialize " + name + " on an element that already has a Foundation plugin.");
            return;
          }

          if ($el.attr('data-options')) {
            var thing = $el.attr('data-options').split(';').forEach(function (e, i) {
              var opt = e.split(':').map(function (el) {
                return el.trim();
              });
              if (opt[0]) opts[opt[0]] = parseValue(opt[1]);
            });
          }
          try {
            $el.data('zfPlugin', new plugin($(this), opts));
          } catch (er) {
            console.error(er);
          } finally {
            return;
          }
        });
      });
    },
    getFnName: functionName,
    transitionend: function ($elem) {
      var transitions = {
        'transition': 'transitionend',
        'WebkitTransition': 'webkitTransitionEnd',
        'MozTransition': 'transitionend',
        'OTransition': 'otransitionend'
      };
      var elem = document.createElement('div'),
          end;

      for (var t in transitions) {
        if (typeof elem.style[t] !== 'undefined') {
          end = transitions[t];
        }
      }
      if (end) {
        return end;
      } else {
        end = setTimeout(function () {
          $elem.triggerHandler('transitionend', [$elem]);
        }, 1);
        return 'transitionend';
      }
    }
  };

  Foundation.util = {
    /**
     * Function for applying a debounce effect to a function call.
     * @function
     * @param {Function} func - Function to be called at end of timeout.
     * @param {Number} delay - Time in ms to delay the call of `func`.
     * @returns function
     */
    throttle: function (func, delay) {
      var timer = null;

      return function () {
        var context = this,
            args = arguments;

        if (timer === null) {
          timer = setTimeout(function () {
            func.apply(context, args);
            timer = null;
          }, delay);
        }
      };
    }
  };

  // TODO: consider not making this a jQuery function
  // TODO: need way to reflow vs. re-initialize
  /**
   * The Foundation jQuery method.
   * @param {String|Array} method - An action to perform on the current jQuery object.
   */
  var foundation = function (method) {
    var type = typeof method,
        $meta = $('meta.foundation-mq'),
        $noJS = $('.no-js');

    if (!$meta.length) {
      $('<meta class="foundation-mq">').appendTo(document.head);
    }
    if ($noJS.length) {
      $noJS.removeClass('no-js');
    }

    if (type === 'undefined') {
      //needs to initialize the Foundation object, or an individual plugin.
      Foundation.MediaQuery._init();
      Foundation.reflow(this);
    } else if (type === 'string') {
      //an individual method to invoke on a plugin or group of plugins
      var args = Array.prototype.slice.call(arguments, 1); //collect all the arguments, if necessary
      var plugClass = this.data('zfPlugin'); //determine the class of plugin

      if (plugClass !== undefined && plugClass[method] !== undefined) {
        //make sure both the class and method exist
        if (this.length === 1) {
          //if there's only one, call it directly.
          plugClass[method].apply(plugClass, args);
        } else {
          this.each(function (i, el) {
            //otherwise loop through the jQuery collection and invoke the method on each
            plugClass[method].apply($(el).data('zfPlugin'), args);
          });
        }
      } else {
        //error for no class or no method
        throw new ReferenceError("We're sorry, '" + method + "' is not an available method for " + (plugClass ? functionName(plugClass) : 'this element') + '.');
      }
    } else {
      //error for invalid argument type
      throw new TypeError(`We're sorry, ${type} is not a valid parameter. You must use a string representing the method you wish to invoke.`);
    }
    return this;
  };

  window.Foundation = Foundation;
  $.fn.foundation = foundation;

  // Polyfill for requestAnimationFrame
  (function () {
    if (!Date.now || !window.Date.now) window.Date.now = Date.now = function () {
      return new Date().getTime();
    };

    var vendors = ['webkit', 'moz'];
    for (var i = 0; i < vendors.length && !window.requestAnimationFrame; ++i) {
      var vp = vendors[i];
      window.requestAnimationFrame = window[vp + 'RequestAnimationFrame'];
      window.cancelAnimationFrame = window[vp + 'CancelAnimationFrame'] || window[vp + 'CancelRequestAnimationFrame'];
    }
    if (/iP(ad|hone|od).*OS 6/.test(window.navigator.userAgent) || !window.requestAnimationFrame || !window.cancelAnimationFrame) {
      var lastTime = 0;
      window.requestAnimationFrame = function (callback) {
        var now = Date.now();
        var nextTime = Math.max(lastTime + 16, now);
        return setTimeout(function () {
          callback(lastTime = nextTime);
        }, nextTime - now);
      };
      window.cancelAnimationFrame = clearTimeout;
    }
    /**
     * Polyfill for performance.now, required by rAF
     */
    if (!window.performance || !window.performance.now) {
      window.performance = {
        start: Date.now(),
        now: function () {
          return Date.now() - this.start;
        }
      };
    }
  })();
  if (!Function.prototype.bind) {
    Function.prototype.bind = function (oThis) {
      if (typeof this !== 'function') {
        // closest thing possible to the ECMAScript 5
        // internal IsCallable function
        throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
      }

      var aArgs = Array.prototype.slice.call(arguments, 1),
          fToBind = this,
          fNOP = function () {},
          fBound = function () {
        return fToBind.apply(this instanceof fNOP ? this : oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
      };

      if (this.prototype) {
        // native functions don't have a prototype
        fNOP.prototype = this.prototype;
      }
      fBound.prototype = new fNOP();

      return fBound;
    };
  }
  // Polyfill to get the name of a function in IE9
  function functionName(fn) {
    if (Function.prototype.name === undefined) {
      var funcNameRegex = /function\s([^(]{1,})\(/;
      var results = funcNameRegex.exec(fn.toString());
      return results && results.length > 1 ? results[1].trim() : "";
    } else if (fn.prototype === undefined) {
      return fn.constructor.name;
    } else {
      return fn.prototype.constructor.name;
    }
  }
  function parseValue(str) {
    if (/true/.test(str)) return true;else if (/false/.test(str)) return false;else if (!isNaN(str * 1)) return parseFloat(str);
    return str;
  }
  // Convert PascalCase to kebab-case
  // Thank you: http://stackoverflow.com/a/8955580
  function hyphenate(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }
}(jQuery);
;'use strict';

!function ($) {

  Foundation.Box = {
    ImNotTouchingYou: ImNotTouchingYou,
    GetDimensions: GetDimensions,
    GetOffsets: GetOffsets

    /**
     * Compares the dimensions of an element to a container and determines collision events with container.
     * @function
     * @param {jQuery} element - jQuery object to test for collisions.
     * @param {jQuery} parent - jQuery object to use as bounding container.
     * @param {Boolean} lrOnly - set to true to check left and right values only.
     * @param {Boolean} tbOnly - set to true to check top and bottom values only.
     * @default if no parent object passed, detects collisions with `window`.
     * @returns {Boolean} - true if collision free, false if a collision in any direction.
     */
  };function ImNotTouchingYou(element, parent, lrOnly, tbOnly) {
    var eleDims = GetDimensions(element),
        top,
        bottom,
        left,
        right;

    if (parent) {
      var parDims = GetDimensions(parent);

      bottom = eleDims.offset.top + eleDims.height <= parDims.height + parDims.offset.top;
      top = eleDims.offset.top >= parDims.offset.top;
      left = eleDims.offset.left >= parDims.offset.left;
      right = eleDims.offset.left + eleDims.width <= parDims.width + parDims.offset.left;
    } else {
      bottom = eleDims.offset.top + eleDims.height <= eleDims.windowDims.height + eleDims.windowDims.offset.top;
      top = eleDims.offset.top >= eleDims.windowDims.offset.top;
      left = eleDims.offset.left >= eleDims.windowDims.offset.left;
      right = eleDims.offset.left + eleDims.width <= eleDims.windowDims.width;
    }

    var allDirs = [bottom, top, left, right];

    if (lrOnly) {
      return left === right === true;
    }

    if (tbOnly) {
      return top === bottom === true;
    }

    return allDirs.indexOf(false) === -1;
  };

  /**
   * Uses native methods to return an object of dimension values.
   * @function
   * @param {jQuery || HTML} element - jQuery object or DOM element for which to get the dimensions. Can be any element other that document or window.
   * @returns {Object} - nested object of integer pixel values
   * TODO - if element is window, return only those values.
   */
  function GetDimensions(elem, test) {
    elem = elem.length ? elem[0] : elem;

    if (elem === window || elem === document) {
      throw new Error("I'm sorry, Dave. I'm afraid I can't do that.");
    }

    var rect = elem.getBoundingClientRect(),
        parRect = elem.parentNode.getBoundingClientRect(),
        winRect = document.body.getBoundingClientRect(),
        winY = window.pageYOffset,
        winX = window.pageXOffset;

    return {
      width: rect.width,
      height: rect.height,
      offset: {
        top: rect.top + winY,
        left: rect.left + winX
      },
      parentDims: {
        width: parRect.width,
        height: parRect.height,
        offset: {
          top: parRect.top + winY,
          left: parRect.left + winX
        }
      },
      windowDims: {
        width: winRect.width,
        height: winRect.height,
        offset: {
          top: winY,
          left: winX
        }
      }
    };
  }

  /**
   * Returns an object of top and left integer pixel values for dynamically rendered elements,
   * such as: Tooltip, Reveal, and Dropdown
   * @function
   * @param {jQuery} element - jQuery object for the element being positioned.
   * @param {jQuery} anchor - jQuery object for the element's anchor point.
   * @param {String} position - a string relating to the desired position of the element, relative to it's anchor
   * @param {Number} vOffset - integer pixel value of desired vertical separation between anchor and element.
   * @param {Number} hOffset - integer pixel value of desired horizontal separation between anchor and element.
   * @param {Boolean} isOverflow - if a collision event is detected, sets to true to default the element to full width - any desired offset.
   * TODO alter/rewrite to work with `em` values as well/instead of pixels
   */
  function GetOffsets(element, anchor, position, vOffset, hOffset, isOverflow) {
    var $eleDims = GetDimensions(element),
        $anchorDims = anchor ? GetDimensions(anchor) : null;

    switch (position) {
      case 'top':
        return {
          left: Foundation.rtl() ? $anchorDims.offset.left - $eleDims.width + $anchorDims.width : $anchorDims.offset.left,
          top: $anchorDims.offset.top - ($eleDims.height + vOffset)
        };
        break;
      case 'left':
        return {
          left: $anchorDims.offset.left - ($eleDims.width + hOffset),
          top: $anchorDims.offset.top
        };
        break;
      case 'right':
        return {
          left: $anchorDims.offset.left + $anchorDims.width + hOffset,
          top: $anchorDims.offset.top
        };
        break;
      case 'center top':
        return {
          left: $anchorDims.offset.left + $anchorDims.width / 2 - $eleDims.width / 2,
          top: $anchorDims.offset.top - ($eleDims.height + vOffset)
        };
        break;
      case 'center bottom':
        return {
          left: isOverflow ? hOffset : $anchorDims.offset.left + $anchorDims.width / 2 - $eleDims.width / 2,
          top: $anchorDims.offset.top + $anchorDims.height + vOffset
        };
        break;
      case 'center left':
        return {
          left: $anchorDims.offset.left - ($eleDims.width + hOffset),
          top: $anchorDims.offset.top + $anchorDims.height / 2 - $eleDims.height / 2
        };
        break;
      case 'center right':
        return {
          left: $anchorDims.offset.left + $anchorDims.width + hOffset + 1,
          top: $anchorDims.offset.top + $anchorDims.height / 2 - $eleDims.height / 2
        };
        break;
      case 'center':
        return {
          left: $eleDims.windowDims.offset.left + $eleDims.windowDims.width / 2 - $eleDims.width / 2,
          top: $eleDims.windowDims.offset.top + $eleDims.windowDims.height / 2 - $eleDims.height / 2
        };
        break;
      case 'reveal':
        return {
          left: ($eleDims.windowDims.width - $eleDims.width) / 2,
          top: $eleDims.windowDims.offset.top + vOffset
        };
      case 'reveal full':
        return {
          left: $eleDims.windowDims.offset.left,
          top: $eleDims.windowDims.offset.top
        };
        break;
      case 'left bottom':
        return {
          left: $anchorDims.offset.left,
          top: $anchorDims.offset.top + $anchorDims.height
        };
        break;
      case 'right bottom':
        return {
          left: $anchorDims.offset.left + $anchorDims.width + hOffset - $eleDims.width,
          top: $anchorDims.offset.top + $anchorDims.height
        };
        break;
      default:
        return {
          left: Foundation.rtl() ? $anchorDims.offset.left - $eleDims.width + $anchorDims.width : $anchorDims.offset.left + hOffset,
          top: $anchorDims.offset.top + $anchorDims.height + vOffset
        };
    }
  }
}(jQuery);
;/*******************************************
 *                                         *
 * This util was created by Marius Olbertz *
 * Please thank Marius on GitHub /owlbertz *
 * or the web http://www.mariusolbertz.de/ *
 *                                         *
 ******************************************/

'use strict';

!function ($) {

  const keyCodes = {
    9: 'TAB',
    13: 'ENTER',
    27: 'ESCAPE',
    32: 'SPACE',
    37: 'ARROW_LEFT',
    38: 'ARROW_UP',
    39: 'ARROW_RIGHT',
    40: 'ARROW_DOWN'
  };

  var commands = {};

  var Keyboard = {
    keys: getKeyCodes(keyCodes),

    /**
     * Parses the (keyboard) event and returns a String that represents its key
     * Can be used like Foundation.parseKey(event) === Foundation.keys.SPACE
     * @param {Event} event - the event generated by the event handler
     * @return String key - String that represents the key pressed
     */
    parseKey(event) {
      var key = keyCodes[event.which || event.keyCode] || String.fromCharCode(event.which).toUpperCase();
      if (event.shiftKey) key = `SHIFT_${key}`;
      if (event.ctrlKey) key = `CTRL_${key}`;
      if (event.altKey) key = `ALT_${key}`;
      return key;
    },

    /**
     * Handles the given (keyboard) event
     * @param {Event} event - the event generated by the event handler
     * @param {String} component - Foundation component's name, e.g. Slider or Reveal
     * @param {Objects} functions - collection of functions that are to be executed
     */
    handleKey(event, component, functions) {
      var commandList = commands[component],
          keyCode = this.parseKey(event),
          cmds,
          command,
          fn;

      if (!commandList) return console.warn('Component not defined!');

      if (typeof commandList.ltr === 'undefined') {
        // this component does not differentiate between ltr and rtl
        cmds = commandList; // use plain list
      } else {
        // merge ltr and rtl: if document is rtl, rtl overwrites ltr and vice versa
        if (Foundation.rtl()) cmds = $.extend({}, commandList.ltr, commandList.rtl);else cmds = $.extend({}, commandList.rtl, commandList.ltr);
      }
      command = cmds[keyCode];

      fn = functions[command];
      if (fn && typeof fn === 'function') {
        // execute function  if exists
        var returnValue = fn.apply();
        if (functions.handled || typeof functions.handled === 'function') {
          // execute function when event was handled
          functions.handled(returnValue);
        }
      } else {
        if (functions.unhandled || typeof functions.unhandled === 'function') {
          // execute function when event was not handled
          functions.unhandled();
        }
      }
    },

    /**
     * Finds all focusable elements within the given `$element`
     * @param {jQuery} $element - jQuery object to search within
     * @return {jQuery} $focusable - all focusable elements within `$element`
     */
    findFocusable($element) {
      return $element.find('a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, *[tabindex], *[contenteditable]').filter(function () {
        if (!$(this).is(':visible') || $(this).attr('tabindex') < 0) {
          return false;
        } //only have visible elements and those that have a tabindex greater or equal 0
        return true;
      });
    },

    /**
     * Returns the component name name
     * @param {Object} component - Foundation component, e.g. Slider or Reveal
     * @return String componentName
     */

    register(componentName, cmds) {
      commands[componentName] = cmds;
    }
  };

  /*
   * Constants for easier comparing.
   * Can be used like Foundation.parseKey(event) === Foundation.keys.SPACE
   */
  function getKeyCodes(kcs) {
    var k = {};
    for (var kc in kcs) k[kcs[kc]] = kcs[kc];
    return k;
  }

  Foundation.Keyboard = Keyboard;
}(jQuery);
;'use strict';

!function ($) {

  // Default set of media queries
  const defaultQueries = {
    'default': 'only screen',
    landscape: 'only screen and (orientation: landscape)',
    portrait: 'only screen and (orientation: portrait)',
    retina: 'only screen and (-webkit-min-device-pixel-ratio: 2),' + 'only screen and (min--moz-device-pixel-ratio: 2),' + 'only screen and (-o-min-device-pixel-ratio: 2/1),' + 'only screen and (min-device-pixel-ratio: 2),' + 'only screen and (min-resolution: 192dpi),' + 'only screen and (min-resolution: 2dppx)'
  };

  var MediaQuery = {
    queries: [],

    current: '',

    /**
     * Initializes the media query helper, by extracting the breakpoint list from the CSS and activating the breakpoint watcher.
     * @function
     * @private
     */
    _init() {
      var self = this;
      var extractedStyles = $('.foundation-mq').css('font-family');
      var namedQueries;

      namedQueries = parseStyleToObject(extractedStyles);

      for (var key in namedQueries) {
        if (namedQueries.hasOwnProperty(key)) {
          self.queries.push({
            name: key,
            value: `only screen and (min-width: ${namedQueries[key]})`
          });
        }
      }

      this.current = this._getCurrentSize();

      this._watcher();
    },

    /**
     * Checks if the screen is at least as wide as a breakpoint.
     * @function
     * @param {String} size - Name of the breakpoint to check.
     * @returns {Boolean} `true` if the breakpoint matches, `false` if it's smaller.
     */
    atLeast(size) {
      var query = this.get(size);

      if (query) {
        return window.matchMedia(query).matches;
      }

      return false;
    },

    /**
     * Gets the media query of a breakpoint.
     * @function
     * @param {String} size - Name of the breakpoint to get.
     * @returns {String|null} - The media query of the breakpoint, or `null` if the breakpoint doesn't exist.
     */
    get(size) {
      for (var i in this.queries) {
        if (this.queries.hasOwnProperty(i)) {
          var query = this.queries[i];
          if (size === query.name) return query.value;
        }
      }

      return null;
    },

    /**
     * Gets the current breakpoint name by testing every breakpoint and returning the last one to match (the biggest one).
     * @function
     * @private
     * @returns {String} Name of the current breakpoint.
     */
    _getCurrentSize() {
      var matched;

      for (var i = 0; i < this.queries.length; i++) {
        var query = this.queries[i];

        if (window.matchMedia(query.value).matches) {
          matched = query;
        }
      }

      if (typeof matched === 'object') {
        return matched.name;
      } else {
        return matched;
      }
    },

    /**
     * Activates the breakpoint watcher, which fires an event on the window whenever the breakpoint changes.
     * @function
     * @private
     */
    _watcher() {
      $(window).on('resize.zf.mediaquery', () => {
        var newSize = this._getCurrentSize(),
            currentSize = this.current;

        if (newSize !== currentSize) {
          // Change the current media query
          this.current = newSize;

          // Broadcast the media query change on the window
          $(window).trigger('changed.zf.mediaquery', [newSize, currentSize]);
        }
      });
    }
  };

  Foundation.MediaQuery = MediaQuery;

  // matchMedia() polyfill - Test a CSS media type/query in JS.
  // Authors & copyright (c) 2012: Scott Jehl, Paul Irish, Nicholas Zakas, David Knight. Dual MIT/BSD license
  window.matchMedia || (window.matchMedia = function () {
    'use strict';

    // For browsers that support matchMedium api such as IE 9 and webkit

    var styleMedia = window.styleMedia || window.media;

    // For those that don't support matchMedium
    if (!styleMedia) {
      var style = document.createElement('style'),
          script = document.getElementsByTagName('script')[0],
          info = null;

      style.type = 'text/css';
      style.id = 'matchmediajs-test';

      script && script.parentNode && script.parentNode.insertBefore(style, script);

      // 'style.currentStyle' is used by IE <= 8 and 'window.getComputedStyle' for all other browsers
      info = 'getComputedStyle' in window && window.getComputedStyle(style, null) || style.currentStyle;

      styleMedia = {
        matchMedium(media) {
          var text = `@media ${media}{ #matchmediajs-test { width: 1px; } }`;

          // 'style.styleSheet' is used by IE <= 8 and 'style.textContent' for all other browsers
          if (style.styleSheet) {
            style.styleSheet.cssText = text;
          } else {
            style.textContent = text;
          }

          // Test if media query is true or false
          return info.width === '1px';
        }
      };
    }

    return function (media) {
      return {
        matches: styleMedia.matchMedium(media || 'all'),
        media: media || 'all'
      };
    };
  }());

  // Thank you: https://github.com/sindresorhus/query-string
  function parseStyleToObject(str) {
    var styleObject = {};

    if (typeof str !== 'string') {
      return styleObject;
    }

    str = str.trim().slice(1, -1); // browsers re-quote string style values

    if (!str) {
      return styleObject;
    }

    styleObject = str.split('&').reduce(function (ret, param) {
      var parts = param.replace(/\+/g, ' ').split('=');
      var key = parts[0];
      var val = parts[1];
      key = decodeURIComponent(key);

      // missing `=` should be `null`:
      // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
      val = val === undefined ? null : decodeURIComponent(val);

      if (!ret.hasOwnProperty(key)) {
        ret[key] = val;
      } else if (Array.isArray(ret[key])) {
        ret[key].push(val);
      } else {
        ret[key] = [ret[key], val];
      }
      return ret;
    }, {});

    return styleObject;
  }

  Foundation.MediaQuery = MediaQuery;
}(jQuery);
;'use strict';

!function ($) {

  /**
   * Motion module.
   * @module foundation.motion
   */

  const initClasses = ['mui-enter', 'mui-leave'];
  const activeClasses = ['mui-enter-active', 'mui-leave-active'];

  const Motion = {
    animateIn: function (element, animation, cb) {
      animate(true, element, animation, cb);
    },

    animateOut: function (element, animation, cb) {
      animate(false, element, animation, cb);
    }
  };

  function Move(duration, elem, fn) {
    var anim,
        prog,
        start = null;
    // console.log('called');

    function move(ts) {
      if (!start) start = window.performance.now();
      // console.log(start, ts);
      prog = ts - start;
      fn.apply(elem);

      if (prog < duration) {
        anim = window.requestAnimationFrame(move, elem);
      } else {
        window.cancelAnimationFrame(anim);
        elem.trigger('finished.zf.animate', [elem]).triggerHandler('finished.zf.animate', [elem]);
      }
    }
    anim = window.requestAnimationFrame(move);
  }

  /**
   * Animates an element in or out using a CSS transition class.
   * @function
   * @private
   * @param {Boolean} isIn - Defines if the animation is in or out.
   * @param {Object} element - jQuery or HTML object to animate.
   * @param {String} animation - CSS class to use.
   * @param {Function} cb - Callback to run when animation is finished.
   */
  function animate(isIn, element, animation, cb) {
    element = $(element).eq(0);

    if (!element.length) return;

    var initClass = isIn ? initClasses[0] : initClasses[1];
    var activeClass = isIn ? activeClasses[0] : activeClasses[1];

    // Set up the animation
    reset();

    element.addClass(animation).css('transition', 'none');

    requestAnimationFrame(() => {
      element.addClass(initClass);
      if (isIn) element.show();
    });

    // Start the animation
    requestAnimationFrame(() => {
      element[0].offsetWidth;
      element.css('transition', '').addClass(activeClass);
    });

    // Clean up the animation when it finishes
    element.one(Foundation.transitionend(element), finish);

    // Hides the element (for out animations), resets the element, and runs a callback
    function finish() {
      if (!isIn) element.hide();
      reset();
      if (cb) cb.apply(element);
    }

    // Resets transitions and removes motion-specific classes
    function reset() {
      element[0].style.transitionDuration = 0;
      element.removeClass(`${initClass} ${activeClass} ${animation}`);
    }
  }

  Foundation.Move = Move;
  Foundation.Motion = Motion;
}(jQuery);
;'use strict';

!function ($) {

  const Nest = {
    Feather(menu, type = 'zf') {
      menu.attr('role', 'menubar');

      var items = menu.find('li').attr({ 'role': 'menuitem' }),
          subMenuClass = `is-${type}-submenu`,
          subItemClass = `${subMenuClass}-item`,
          hasSubClass = `is-${type}-submenu-parent`;

      menu.find('a:first').attr('tabindex', 0);

      items.each(function () {
        var $item = $(this),
            $sub = $item.children('ul');

        if ($sub.length) {
          $item.addClass(hasSubClass).attr({
            'aria-haspopup': true,
            'aria-expanded': false,
            'aria-label': $item.children('a:first').text()
          });

          $sub.addClass(`submenu ${subMenuClass}`).attr({
            'data-submenu': '',
            'aria-hidden': true,
            'role': 'menu'
          });
        }

        if ($item.parent('[data-submenu]').length) {
          $item.addClass(`is-submenu-item ${subItemClass}`);
        }
      });

      return;
    },

    Burn(menu, type) {
      var items = menu.find('li').removeAttr('tabindex'),
          subMenuClass = `is-${type}-submenu`,
          subItemClass = `${subMenuClass}-item`,
          hasSubClass = `is-${type}-submenu-parent`;

      menu.find('>li, .menu, .menu > li').removeClass(`${subMenuClass} ${subItemClass} ${hasSubClass} is-submenu-item submenu is-active`).removeAttr('data-submenu').css('display', '');

      // console.log(      menu.find('.' + subMenuClass + ', .' + subItemClass + ', .has-submenu, .is-submenu-item, .submenu, [data-submenu]')
      //           .removeClass(subMenuClass + ' ' + subItemClass + ' has-submenu is-submenu-item submenu')
      //           .removeAttr('data-submenu'));
      // items.each(function(){
      //   var $item = $(this),
      //       $sub = $item.children('ul');
      //   if($item.parent('[data-submenu]').length){
      //     $item.removeClass('is-submenu-item ' + subItemClass);
      //   }
      //   if($sub.length){
      //     $item.removeClass('has-submenu');
      //     $sub.removeClass('submenu ' + subMenuClass).removeAttr('data-submenu');
      //   }
      // });
    }
  };

  Foundation.Nest = Nest;
}(jQuery);
;'use strict';

!function ($) {

  function Timer(elem, options, cb) {
    var _this = this,
        duration = options.duration,
        //options is an object for easily adding features later.
    nameSpace = Object.keys(elem.data())[0] || 'timer',
        remain = -1,
        start,
        timer;

    this.isPaused = false;

    this.restart = function () {
      remain = -1;
      clearTimeout(timer);
      this.start();
    };

    this.start = function () {
      this.isPaused = false;
      // if(!elem.data('paused')){ return false; }//maybe implement this sanity check if used for other things.
      clearTimeout(timer);
      remain = remain <= 0 ? duration : remain;
      elem.data('paused', false);
      start = Date.now();
      timer = setTimeout(function () {
        if (options.infinite) {
          _this.restart(); //rerun the timer.
        }
        if (cb && typeof cb === 'function') {
          cb();
        }
      }, remain);
      elem.trigger(`timerstart.zf.${nameSpace}`);
    };

    this.pause = function () {
      this.isPaused = true;
      //if(elem.data('paused')){ return false; }//maybe implement this sanity check if used for other things.
      clearTimeout(timer);
      elem.data('paused', true);
      var end = Date.now();
      remain = remain - (end - start);
      elem.trigger(`timerpaused.zf.${nameSpace}`);
    };
  }

  /**
   * Runs a callback function when images are fully loaded.
   * @param {Object} images - Image(s) to check if loaded.
   * @param {Func} callback - Function to execute when image is fully loaded.
   */
  function onImagesLoaded(images, callback) {
    var self = this,
        unloaded = images.length;

    if (unloaded === 0) {
      callback();
    }

    images.each(function () {
      if (this.complete) {
        singleImageLoaded();
      } else if (typeof this.naturalWidth !== 'undefined' && this.naturalWidth > 0) {
        singleImageLoaded();
      } else {
        $(this).one('load', function () {
          singleImageLoaded();
        });
      }
    });

    function singleImageLoaded() {
      unloaded--;
      if (unloaded === 0) {
        callback();
      }
    }
  }

  Foundation.Timer = Timer;
  Foundation.onImagesLoaded = onImagesLoaded;
}(jQuery);
;//**************************************************
//**Work inspired by multiple jquery swipe plugins**
//**Done by Yohai Ararat ***************************
//**************************************************
(function ($) {

	$.spotSwipe = {
		version: '1.0.0',
		enabled: 'ontouchstart' in document.documentElement,
		preventDefault: false,
		moveThreshold: 75,
		timeThreshold: 200
	};

	var startPosX,
	    startPosY,
	    startTime,
	    elapsedTime,
	    isMoving = false;

	function onTouchEnd() {
		//  alert(this);
		this.removeEventListener('touchmove', onTouchMove);
		this.removeEventListener('touchend', onTouchEnd);
		isMoving = false;
	}

	function onTouchMove(e) {
		if ($.spotSwipe.preventDefault) {
			e.preventDefault();
		}
		if (isMoving) {
			var x = e.touches[0].pageX;
			var y = e.touches[0].pageY;
			var dx = startPosX - x;
			var dy = startPosY - y;
			var dir;
			elapsedTime = new Date().getTime() - startTime;
			if (Math.abs(dx) >= $.spotSwipe.moveThreshold && elapsedTime <= $.spotSwipe.timeThreshold) {
				dir = dx > 0 ? 'left' : 'right';
			}
			// else if(Math.abs(dy) >= $.spotSwipe.moveThreshold && elapsedTime <= $.spotSwipe.timeThreshold) {
			//   dir = dy > 0 ? 'down' : 'up';
			// }
			if (dir) {
				e.preventDefault();
				onTouchEnd.call(this);
				$(this).trigger('swipe', dir).trigger(`swipe${dir}`);
			}
		}
	}

	function onTouchStart(e) {
		if (e.touches.length == 1) {
			startPosX = e.touches[0].pageX;
			startPosY = e.touches[0].pageY;
			isMoving = true;
			startTime = new Date().getTime();
			this.addEventListener('touchmove', onTouchMove, false);
			this.addEventListener('touchend', onTouchEnd, false);
		}
	}

	function init() {
		this.addEventListener && this.addEventListener('touchstart', onTouchStart, false);
	}

	function teardown() {
		this.removeEventListener('touchstart', onTouchStart);
	}

	$.event.special.swipe = { setup: init };

	$.each(['left', 'up', 'down', 'right'], function () {
		$.event.special[`swipe${this}`] = { setup: function () {
				$(this).on('swipe', $.noop);
			} };
	});
})(jQuery);
/****************************************************
 * Method for adding psuedo drag events to elements *
 ***************************************************/
!function ($) {
	$.fn.addTouch = function () {
		this.each(function (i, el) {
			$(el).bind('touchstart touchmove touchend touchcancel', function () {
				//we pass the original event object because the jQuery event
				//object is normalized to w3c specs and does not provide the TouchList
				handleTouch(event);
			});
		});

		var handleTouch = function (event) {
			var touches = event.changedTouches,
			    first = touches[0],
			    eventTypes = {
				touchstart: 'mousedown',
				touchmove: 'mousemove',
				touchend: 'mouseup'
			},
			    type = eventTypes[event.type],
			    simulatedEvent;

			if ('MouseEvent' in window && typeof window.MouseEvent === 'function') {
				simulatedEvent = new window.MouseEvent(type, {
					'bubbles': true,
					'cancelable': true,
					'screenX': first.screenX,
					'screenY': first.screenY,
					'clientX': first.clientX,
					'clientY': first.clientY
				});
			} else {
				simulatedEvent = document.createEvent('MouseEvent');
				simulatedEvent.initMouseEvent(type, true, true, window, 1, first.screenX, first.screenY, first.clientX, first.clientY, false, false, false, false, 0 /*left*/, null);
			}
			first.target.dispatchEvent(simulatedEvent);
		};
	};
}(jQuery);

//**********************************
//**From the jQuery Mobile Library**
//**need to recreate functionality**
//**and try to improve if possible**
//**********************************

/* Removing the jQuery function ****
************************************

(function( $, window, undefined ) {

	var $document = $( document ),
		// supportTouch = $.mobile.support.touch,
		touchStartEvent = 'touchstart'//supportTouch ? "touchstart" : "mousedown",
		touchStopEvent = 'touchend'//supportTouch ? "touchend" : "mouseup",
		touchMoveEvent = 'touchmove'//supportTouch ? "touchmove" : "mousemove";

	// setup new event shortcuts
	$.each( ( "touchstart touchmove touchend " +
		"swipe swipeleft swiperight" ).split( " " ), function( i, name ) {

		$.fn[ name ] = function( fn ) {
			return fn ? this.bind( name, fn ) : this.trigger( name );
		};

		// jQuery < 1.8
		if ( $.attrFn ) {
			$.attrFn[ name ] = true;
		}
	});

	function triggerCustomEvent( obj, eventType, event, bubble ) {
		var originalType = event.type;
		event.type = eventType;
		if ( bubble ) {
			$.event.trigger( event, undefined, obj );
		} else {
			$.event.dispatch.call( obj, event );
		}
		event.type = originalType;
	}

	// also handles taphold

	// Also handles swipeleft, swiperight
	$.event.special.swipe = {

		// More than this horizontal displacement, and we will suppress scrolling.
		scrollSupressionThreshold: 30,

		// More time than this, and it isn't a swipe.
		durationThreshold: 1000,

		// Swipe horizontal displacement must be more than this.
		horizontalDistanceThreshold: window.devicePixelRatio >= 2 ? 15 : 30,

		// Swipe vertical displacement must be less than this.
		verticalDistanceThreshold: window.devicePixelRatio >= 2 ? 15 : 30,

		getLocation: function ( event ) {
			var winPageX = window.pageXOffset,
				winPageY = window.pageYOffset,
				x = event.clientX,
				y = event.clientY;

			if ( event.pageY === 0 && Math.floor( y ) > Math.floor( event.pageY ) ||
				event.pageX === 0 && Math.floor( x ) > Math.floor( event.pageX ) ) {

				// iOS4 clientX/clientY have the value that should have been
				// in pageX/pageY. While pageX/page/ have the value 0
				x = x - winPageX;
				y = y - winPageY;
			} else if ( y < ( event.pageY - winPageY) || x < ( event.pageX - winPageX ) ) {

				// Some Android browsers have totally bogus values for clientX/Y
				// when scrolling/zooming a page. Detectable since clientX/clientY
				// should never be smaller than pageX/pageY minus page scroll
				x = event.pageX - winPageX;
				y = event.pageY - winPageY;
			}

			return {
				x: x,
				y: y
			};
		},

		start: function( event ) {
			var data = event.originalEvent.touches ?
					event.originalEvent.touches[ 0 ] : event,
				location = $.event.special.swipe.getLocation( data );
			return {
						time: ( new Date() ).getTime(),
						coords: [ location.x, location.y ],
						origin: $( event.target )
					};
		},

		stop: function( event ) {
			var data = event.originalEvent.touches ?
					event.originalEvent.touches[ 0 ] : event,
				location = $.event.special.swipe.getLocation( data );
			return {
						time: ( new Date() ).getTime(),
						coords: [ location.x, location.y ]
					};
		},

		handleSwipe: function( start, stop, thisObject, origTarget ) {
			if ( stop.time - start.time < $.event.special.swipe.durationThreshold &&
				Math.abs( start.coords[ 0 ] - stop.coords[ 0 ] ) > $.event.special.swipe.horizontalDistanceThreshold &&
				Math.abs( start.coords[ 1 ] - stop.coords[ 1 ] ) < $.event.special.swipe.verticalDistanceThreshold ) {
				var direction = start.coords[0] > stop.coords[ 0 ] ? "swipeleft" : "swiperight";

				triggerCustomEvent( thisObject, "swipe", $.Event( "swipe", { target: origTarget, swipestart: start, swipestop: stop }), true );
				triggerCustomEvent( thisObject, direction,$.Event( direction, { target: origTarget, swipestart: start, swipestop: stop } ), true );
				return true;
			}
			return false;

		},

		// This serves as a flag to ensure that at most one swipe event event is
		// in work at any given time
		eventInProgress: false,

		setup: function() {
			var events,
				thisObject = this,
				$this = $( thisObject ),
				context = {};

			// Retrieve the events data for this element and add the swipe context
			events = $.data( this, "mobile-events" );
			if ( !events ) {
				events = { length: 0 };
				$.data( this, "mobile-events", events );
			}
			events.length++;
			events.swipe = context;

			context.start = function( event ) {

				// Bail if we're already working on a swipe event
				if ( $.event.special.swipe.eventInProgress ) {
					return;
				}
				$.event.special.swipe.eventInProgress = true;

				var stop,
					start = $.event.special.swipe.start( event ),
					origTarget = event.target,
					emitted = false;

				context.move = function( event ) {
					if ( !start || event.isDefaultPrevented() ) {
						return;
					}

					stop = $.event.special.swipe.stop( event );
					if ( !emitted ) {
						emitted = $.event.special.swipe.handleSwipe( start, stop, thisObject, origTarget );
						if ( emitted ) {

							// Reset the context to make way for the next swipe event
							$.event.special.swipe.eventInProgress = false;
						}
					}
					// prevent scrolling
					if ( Math.abs( start.coords[ 0 ] - stop.coords[ 0 ] ) > $.event.special.swipe.scrollSupressionThreshold ) {
						event.preventDefault();
					}
				};

				context.stop = function() {
						emitted = true;

						// Reset the context to make way for the next swipe event
						$.event.special.swipe.eventInProgress = false;
						$document.off( touchMoveEvent, context.move );
						context.move = null;
				};

				$document.on( touchMoveEvent, context.move )
					.one( touchStopEvent, context.stop );
			};
			$this.on( touchStartEvent, context.start );
		},

		teardown: function() {
			var events, context;

			events = $.data( this, "mobile-events" );
			if ( events ) {
				context = events.swipe;
				delete events.swipe;
				events.length--;
				if ( events.length === 0 ) {
					$.removeData( this, "mobile-events" );
				}
			}

			if ( context ) {
				if ( context.start ) {
					$( this ).off( touchStartEvent, context.start );
				}
				if ( context.move ) {
					$document.off( touchMoveEvent, context.move );
				}
				if ( context.stop ) {
					$document.off( touchStopEvent, context.stop );
				}
			}
		}
	};
	$.each({
		swipeleft: "swipe.left",
		swiperight: "swipe.right"
	}, function( event, sourceEvent ) {

		$.event.special[ event ] = {
			setup: function() {
				$( this ).bind( sourceEvent, $.noop );
			},
			teardown: function() {
				$( this ).unbind( sourceEvent );
			}
		};
	});
})( jQuery, this );
*/
;'use strict';

!function ($) {

  const MutationObserver = function () {
    var prefixes = ['WebKit', 'Moz', 'O', 'Ms', ''];
    for (var i = 0; i < prefixes.length; i++) {
      if (`${prefixes[i]}MutationObserver` in window) {
        return window[`${prefixes[i]}MutationObserver`];
      }
    }
    return false;
  }();

  const triggers = (el, type) => {
    el.data(type).split(' ').forEach(id => {
      $(`#${id}`)[type === 'close' ? 'trigger' : 'triggerHandler'](`${type}.zf.trigger`, [el]);
    });
  };
  // Elements with [data-open] will reveal a plugin that supports it when clicked.
  $(document).on('click.zf.trigger', '[data-open]', function () {
    triggers($(this), 'open');
  });

  // Elements with [data-close] will close a plugin that supports it when clicked.
  // If used without a value on [data-close], the event will bubble, allowing it to close a parent component.
  $(document).on('click.zf.trigger', '[data-close]', function () {
    let id = $(this).data('close');
    if (id) {
      triggers($(this), 'close');
    } else {
      $(this).trigger('close.zf.trigger');
    }
  });

  // Elements with [data-toggle] will toggle a plugin that supports it when clicked.
  $(document).on('click.zf.trigger', '[data-toggle]', function () {
    triggers($(this), 'toggle');
  });

  // Elements with [data-closable] will respond to close.zf.trigger events.
  $(document).on('close.zf.trigger', '[data-closable]', function (e) {
    e.stopPropagation();
    let animation = $(this).data('closable');

    if (animation !== '') {
      Foundation.Motion.animateOut($(this), animation, function () {
        $(this).trigger('closed.zf');
      });
    } else {
      $(this).fadeOut().trigger('closed.zf');
    }
  });

  $(document).on('focus.zf.trigger blur.zf.trigger', '[data-toggle-focus]', function () {
    let id = $(this).data('toggle-focus');
    $(`#${id}`).triggerHandler('toggle.zf.trigger', [$(this)]);
  });

  /**
  * Fires once after all other scripts have loaded
  * @function
  * @private
  */
  $(window).on('load', () => {
    checkListeners();
  });

  function checkListeners() {
    eventsListener();
    resizeListener();
    scrollListener();
    closemeListener();
  }

  //******** only fires this function once on load, if there's something to watch ********
  function closemeListener(pluginName) {
    var yetiBoxes = $('[data-yeti-box]'),
        plugNames = ['dropdown', 'tooltip', 'reveal'];

    if (pluginName) {
      if (typeof pluginName === 'string') {
        plugNames.push(pluginName);
      } else if (typeof pluginName === 'object' && typeof pluginName[0] === 'string') {
        plugNames.concat(pluginName);
      } else {
        console.error('Plugin names must be strings');
      }
    }
    if (yetiBoxes.length) {
      let listeners = plugNames.map(name => {
        return `closeme.zf.${name}`;
      }).join(' ');

      $(window).off(listeners).on(listeners, function (e, pluginId) {
        let plugin = e.namespace.split('.')[0];
        let plugins = $(`[data-${plugin}]`).not(`[data-yeti-box="${pluginId}"]`);

        plugins.each(function () {
          let _this = $(this);

          _this.triggerHandler('close.zf.trigger', [_this]);
        });
      });
    }
  }

  function resizeListener(debounce) {
    let timer,
        $nodes = $('[data-resize]');
    if ($nodes.length) {
      $(window).off('resize.zf.trigger').on('resize.zf.trigger', function (e) {
        if (timer) {
          clearTimeout(timer);
        }

        timer = setTimeout(function () {

          if (!MutationObserver) {
            //fallback for IE 9
            $nodes.each(function () {
              $(this).triggerHandler('resizeme.zf.trigger');
            });
          }
          //trigger all listening elements and signal a resize event
          $nodes.attr('data-events', "resize");
        }, debounce || 10); //default time to emit resize event
      });
    }
  }

  function scrollListener(debounce) {
    let timer,
        $nodes = $('[data-scroll]');
    if ($nodes.length) {
      $(window).off('scroll.zf.trigger').on('scroll.zf.trigger', function (e) {
        if (timer) {
          clearTimeout(timer);
        }

        timer = setTimeout(function () {

          if (!MutationObserver) {
            //fallback for IE 9
            $nodes.each(function () {
              $(this).triggerHandler('scrollme.zf.trigger');
            });
          }
          //trigger all listening elements and signal a scroll event
          $nodes.attr('data-events', "scroll");
        }, debounce || 10); //default time to emit scroll event
      });
    }
  }

  function eventsListener() {
    if (!MutationObserver) {
      return false;
    }
    let nodes = document.querySelectorAll('[data-resize], [data-scroll], [data-mutate]');

    //element callback
    var listeningElementsMutation = function (mutationRecordsList) {
      var $target = $(mutationRecordsList[0].target);
      //trigger the event handler for the element depending on type
      switch ($target.attr("data-events")) {

        case "resize":
          $target.triggerHandler('resizeme.zf.trigger', [$target]);
          break;

        case "scroll":
          $target.triggerHandler('scrollme.zf.trigger', [$target, window.pageYOffset]);
          break;

        // case "mutate" :
        // console.log('mutate', $target);
        // $target.triggerHandler('mutate.zf.trigger');
        //
        // //make sure we don't get stuck in an infinite loop from sloppy codeing
        // if ($target.index('[data-mutate]') == $("[data-mutate]").length-1) {
        //   domMutationObserver();
        // }
        // break;

        default:
          return false;
        //nothing
      }
    };

    if (nodes.length) {
      //for each element that needs to listen for resizing, scrolling, (or coming soon mutation) add a single observer
      for (var i = 0; i <= nodes.length - 1; i++) {
        let elementObserver = new MutationObserver(listeningElementsMutation);
        elementObserver.observe(nodes[i], { attributes: true, childList: false, characterData: false, subtree: false, attributeFilter: ["data-events"] });
      }
    }
  }

  // ------------------------------------

  // [PH]
  // Foundation.CheckWatchers = checkWatchers;
  Foundation.IHearYou = checkListeners;
  // Foundation.ISeeYou = scrollListener;
  // Foundation.IFeelYou = closemeListener;
}(jQuery);

// function domMutationObserver(debounce) {
//   // !!! This is coming soon and needs more work; not active  !!! //
//   var timer,
//   nodes = document.querySelectorAll('[data-mutate]');
//   //
//   if (nodes.length) {
//     // var MutationObserver = (function () {
//     //   var prefixes = ['WebKit', 'Moz', 'O', 'Ms', ''];
//     //   for (var i=0; i < prefixes.length; i++) {
//     //     if (prefixes[i] + 'MutationObserver' in window) {
//     //       return window[prefixes[i] + 'MutationObserver'];
//     //     }
//     //   }
//     //   return false;
//     // }());
//
//
//     //for the body, we need to listen for all changes effecting the style and class attributes
//     var bodyObserver = new MutationObserver(bodyMutation);
//     bodyObserver.observe(document.body, { attributes: true, childList: true, characterData: false, subtree:true, attributeFilter:["style", "class"]});
//
//
//     //body callback
//     function bodyMutation(mutate) {
//       //trigger all listening elements and signal a mutation event
//       if (timer) { clearTimeout(timer); }
//
//       timer = setTimeout(function() {
//         bodyObserver.disconnect();
//         $('[data-mutate]').attr('data-events',"mutate");
//       }, debounce || 150);
//     }
//   }
// }
;window.whatInput = function () {

  'use strict';

  /*
    ---------------
    variables
    ---------------
  */

  // array of actively pressed keys

  var activeKeys = [];

  // cache document.body
  var body;

  // boolean: true if touch buffer timer is running
  var buffer = false;

  // the last used input type
  var currentInput = null;

  // `input` types that don't accept text
  var nonTypingInputs = ['button', 'checkbox', 'file', 'image', 'radio', 'reset', 'submit'];

  // detect version of mouse wheel event to use
  // via https://developer.mozilla.org/en-US/docs/Web/Events/wheel
  var mouseWheel = detectWheel();

  // list of modifier keys commonly used with the mouse and
  // can be safely ignored to prevent false keyboard detection
  var ignoreMap = [16, // shift
  17, // control
  18, // alt
  91, // Windows key / left Apple cmd
  93 // Windows menu / right Apple cmd
  ];

  // mapping of events to input types
  var inputMap = {
    'keydown': 'keyboard',
    'keyup': 'keyboard',
    'mousedown': 'mouse',
    'mousemove': 'mouse',
    'MSPointerDown': 'pointer',
    'MSPointerMove': 'pointer',
    'pointerdown': 'pointer',
    'pointermove': 'pointer',
    'touchstart': 'touch'
  };

  // add correct mouse wheel event mapping to `inputMap`
  inputMap[detectWheel()] = 'mouse';

  // array of all used input types
  var inputTypes = [];

  // mapping of key codes to a common name
  var keyMap = {
    9: 'tab',
    13: 'enter',
    16: 'shift',
    27: 'esc',
    32: 'space',
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down'
  };

  // map of IE 10 pointer events
  var pointerMap = {
    2: 'touch',
    3: 'touch', // treat pen like touch
    4: 'mouse'
  };

  // touch buffer timer
  var timer;

  /*
    ---------------
    functions
    ---------------
  */

  // allows events that are also triggered to be filtered out for `touchstart`
  function eventBuffer() {
    clearTimer();
    setInput(event);

    buffer = true;
    timer = window.setTimeout(function () {
      buffer = false;
    }, 650);
  }

  function bufferedEvent(event) {
    if (!buffer) setInput(event);
  }

  function unBufferedEvent(event) {
    clearTimer();
    setInput(event);
  }

  function clearTimer() {
    window.clearTimeout(timer);
  }

  function setInput(event) {
    var eventKey = key(event);
    var value = inputMap[event.type];
    if (value === 'pointer') value = pointerType(event);

    // don't do anything if the value matches the input type already set
    if (currentInput !== value) {
      var eventTarget = target(event);
      var eventTargetNode = eventTarget.nodeName.toLowerCase();
      var eventTargetType = eventTargetNode === 'input' ? eventTarget.getAttribute('type') : null;

      if ( // only if the user flag to allow typing in form fields isn't set
      !body.hasAttribute('data-whatinput-formtyping') &&

      // only if currentInput has a value
      currentInput &&

      // only if the input is `keyboard`
      value === 'keyboard' &&

      // not if the key is `TAB`
      keyMap[eventKey] !== 'tab' && (

      // only if the target is a form input that accepts text
      eventTargetNode === 'textarea' || eventTargetNode === 'select' || eventTargetNode === 'input' && nonTypingInputs.indexOf(eventTargetType) < 0) ||
      // ignore modifier keys
      ignoreMap.indexOf(eventKey) > -1) {
        // ignore keyboard typing
      } else {
        switchInput(value);
      }
    }

    if (value === 'keyboard') logKeys(eventKey);
  }

  function switchInput(string) {
    currentInput = string;
    body.setAttribute('data-whatinput', currentInput);

    if (inputTypes.indexOf(currentInput) === -1) inputTypes.push(currentInput);
  }

  function key(event) {
    return event.keyCode ? event.keyCode : event.which;
  }

  function target(event) {
    return event.target || event.srcElement;
  }

  function pointerType(event) {
    if (typeof event.pointerType === 'number') {
      return pointerMap[event.pointerType];
    } else {
      return event.pointerType === 'pen' ? 'touch' : event.pointerType; // treat pen like touch
    }
  }

  // keyboard logging
  function logKeys(eventKey) {
    if (activeKeys.indexOf(keyMap[eventKey]) === -1 && keyMap[eventKey]) activeKeys.push(keyMap[eventKey]);
  }

  function unLogKeys(event) {
    var eventKey = key(event);
    var arrayPos = activeKeys.indexOf(keyMap[eventKey]);

    if (arrayPos !== -1) activeKeys.splice(arrayPos, 1);
  }

  function bindEvents() {
    body = document.body;

    // pointer events (mouse, pen, touch)
    if (window.PointerEvent) {
      body.addEventListener('pointerdown', bufferedEvent);
      body.addEventListener('pointermove', bufferedEvent);
    } else if (window.MSPointerEvent) {
      body.addEventListener('MSPointerDown', bufferedEvent);
      body.addEventListener('MSPointerMove', bufferedEvent);
    } else {

      // mouse events
      body.addEventListener('mousedown', bufferedEvent);
      body.addEventListener('mousemove', bufferedEvent);

      // touch events
      if ('ontouchstart' in window) {
        body.addEventListener('touchstart', eventBuffer);
      }
    }

    // mouse wheel
    body.addEventListener(mouseWheel, bufferedEvent);

    // keyboard events
    body.addEventListener('keydown', unBufferedEvent);
    body.addEventListener('keyup', unBufferedEvent);
    document.addEventListener('keyup', unLogKeys);
  }

  /*
    ---------------
    utilities
    ---------------
  */

  // detect version of mouse wheel event to use
  // via https://developer.mozilla.org/en-US/docs/Web/Events/wheel
  function detectWheel() {
    return mouseWheel = 'onwheel' in document.createElement('div') ? 'wheel' : // Modern browsers support "wheel"

    document.onmousewheel !== undefined ? 'mousewheel' : // Webkit and IE support at least "mousewheel"
    'DOMMouseScroll'; // let's assume that remaining browsers are older Firefox
  }

  /*
    ---------------
    init
     don't start script unless browser cuts the mustard,
    also passes if polyfills are used
    ---------------
  */

  if ('addEventListener' in window && Array.prototype.indexOf) {

    // if the dom is already ready already (script was placed at bottom of <body>)
    if (document.body) {
      bindEvents();

      // otherwise wait for the dom to load (script was placed in the <head>)
    } else {
      document.addEventListener('DOMContentLoaded', bindEvents);
    }
  }

  /*
    ---------------
    api
    ---------------
  */

  return {

    // returns string: the current input type
    ask: function () {
      return currentInput;
    },

    // returns array: currently pressed keys
    keys: function () {
      return activeKeys;
    },

    // returns array: all the detected input types
    types: function () {
      return inputTypes;
    },

    // accepts string: manually set the input type
    set: switchInput
  };
}();
;'use strict';

!function ($) {

  /**
   * Accordion module.
   * @module foundation.accordion
   * @requires foundation.util.keyboard
   * @requires foundation.util.motion
   */

  class Accordion {
    /**
     * Creates a new instance of an accordion.
     * @class
     * @fires Accordion#init
     * @param {jQuery} element - jQuery object to make into an accordion.
     * @param {Object} options - a plain object with settings to override the default options.
     */
    constructor(element, options) {
      this.$element = element;
      this.options = $.extend({}, Accordion.defaults, this.$element.data(), options);

      this._init();

      Foundation.registerPlugin(this, 'Accordion');
      Foundation.Keyboard.register('Accordion', {
        'ENTER': 'toggle',
        'SPACE': 'toggle',
        'ARROW_DOWN': 'next',
        'ARROW_UP': 'previous'
      });
    }

    /**
     * Initializes the accordion by animating the preset active pane(s).
     * @private
     */
    _init() {
      this.$element.attr('role', 'tablist');
      this.$tabs = this.$element.children('li, [data-accordion-item]');

      this.$tabs.each(function (idx, el) {
        var $el = $(el),
            $content = $el.children('[data-tab-content]'),
            id = $content[0].id || Foundation.GetYoDigits(6, 'accordion'),
            linkId = el.id || `${id}-label`;

        $el.find('a:first').attr({
          'aria-controls': id,
          'role': 'tab',
          'id': linkId,
          'aria-expanded': false,
          'aria-selected': false
        });

        $content.attr({ 'role': 'tabpanel', 'aria-labelledby': linkId, 'aria-hidden': true, 'id': id });
      });
      var $initActive = this.$element.find('.is-active').children('[data-tab-content]');
      if ($initActive.length) {
        this.down($initActive, true);
      }
      this._events();
    }

    /**
     * Adds event handlers for items within the accordion.
     * @private
     */
    _events() {
      var _this = this;

      this.$tabs.each(function () {
        var $elem = $(this);
        var $tabContent = $elem.children('[data-tab-content]');
        if ($tabContent.length) {
          $elem.children('a').off('click.zf.accordion keydown.zf.accordion').on('click.zf.accordion', function (e) {
            e.preventDefault();
            _this.toggle($tabContent);
          }).on('keydown.zf.accordion', function (e) {
            Foundation.Keyboard.handleKey(e, 'Accordion', {
              toggle: function () {
                _this.toggle($tabContent);
              },
              next: function () {
                var $a = $elem.next().find('a').focus();
                if (!_this.options.multiExpand) {
                  $a.trigger('click.zf.accordion');
                }
              },
              previous: function () {
                var $a = $elem.prev().find('a').focus();
                if (!_this.options.multiExpand) {
                  $a.trigger('click.zf.accordion');
                }
              },
              handled: function () {
                e.preventDefault();
                e.stopPropagation();
              }
            });
          });
        }
      });
    }

    /**
     * Toggles the selected content pane's open/close state.
     * @param {jQuery} $target - jQuery object of the pane to toggle (`.accordion-content`).
     * @function
     */
    toggle($target) {
      if ($target.parent().hasClass('is-active')) {
        this.up($target);
      } else {
        this.down($target);
      }
    }

    /**
     * Opens the accordion tab defined by `$target`.
     * @param {jQuery} $target - Accordion pane to open (`.accordion-content`).
     * @param {Boolean} firstTime - flag to determine if reflow should happen.
     * @fires Accordion#down
     * @function
     */
    down($target, firstTime) {
      $target.attr('aria-hidden', false).parent('[data-tab-content]').addBack().parent().addClass('is-active');

      if (!this.options.multiExpand && !firstTime) {
        var $currentActive = this.$element.children('.is-active').children('[data-tab-content]');
        if ($currentActive.length) {
          this.up($currentActive.not($target));
        }
      }

      $target.slideDown(this.options.slideSpeed, () => {
        /**
         * Fires when the tab is done opening.
         * @event Accordion#down
         */
        this.$element.trigger('down.zf.accordion', [$target]);
      });

      $(`#${$target.attr('aria-labelledby')}`).attr({
        'aria-expanded': true,
        'aria-selected': true
      });
    }

    /**
     * Closes the tab defined by `$target`.
     * @param {jQuery} $target - Accordion tab to close (`.accordion-content`).
     * @fires Accordion#up
     * @function
     */
    up($target) {
      var $aunts = $target.parent().siblings(),
          _this = this;

      if (!this.options.allowAllClosed && !$aunts.hasClass('is-active') || !$target.parent().hasClass('is-active')) {
        return;
      }

      // Foundation.Move(this.options.slideSpeed, $target, function(){
      $target.slideUp(_this.options.slideSpeed, function () {
        /**
         * Fires when the tab is done collapsing up.
         * @event Accordion#up
         */
        _this.$element.trigger('up.zf.accordion', [$target]);
      });
      // });

      $target.attr('aria-hidden', true).parent().removeClass('is-active');

      $(`#${$target.attr('aria-labelledby')}`).attr({
        'aria-expanded': false,
        'aria-selected': false
      });
    }

    /**
     * Destroys an instance of an accordion.
     * @fires Accordion#destroyed
     * @function
     */
    destroy() {
      this.$element.find('[data-tab-content]').stop(true).slideUp(0).css('display', '');
      this.$element.find('a').off('.zf.accordion');

      Foundation.unregisterPlugin(this);
    }
  }

  Accordion.defaults = {
    /**
     * Amount of time to animate the opening of an accordion pane.
     * @option
     * @example 250
     */
    slideSpeed: 250,
    /**
     * Allow the accordion to have multiple open panes.
     * @option
     * @example false
     */
    multiExpand: false,
    /**
     * Allow the accordion to close all panes.
     * @option
     * @example false
     */
    allowAllClosed: false
  };

  // Window exports
  Foundation.plugin(Accordion, 'Accordion');
}(jQuery);
;'use strict';

!function ($) {

  /**
   * AccordionMenu module.
   * @module foundation.accordionMenu
   * @requires foundation.util.keyboard
   * @requires foundation.util.motion
   * @requires foundation.util.nest
   */

  class AccordionMenu {
    /**
     * Creates a new instance of an accordion menu.
     * @class
     * @fires AccordionMenu#init
     * @param {jQuery} element - jQuery object to make into an accordion menu.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    constructor(element, options) {
      this.$element = element;
      this.options = $.extend({}, AccordionMenu.defaults, this.$element.data(), options);

      Foundation.Nest.Feather(this.$element, 'accordion');

      this._init();

      Foundation.registerPlugin(this, 'AccordionMenu');
      Foundation.Keyboard.register('AccordionMenu', {
        'ENTER': 'toggle',
        'SPACE': 'toggle',
        'ARROW_RIGHT': 'open',
        'ARROW_UP': 'up',
        'ARROW_DOWN': 'down',
        'ARROW_LEFT': 'close',
        'ESCAPE': 'closeAll'
      });
    }

    /**
     * Initializes the accordion menu by hiding all nested menus.
     * @private
     */
    _init() {
      this.$element.find('[data-submenu]').not('.is-active').slideUp(0); //.find('a').css('padding-left', '1rem');
      this.$element.attr({
        'role': 'menu',
        'aria-multiselectable': this.options.multiOpen
      });

      this.$menuLinks = this.$element.find('.is-accordion-submenu-parent');
      this.$menuLinks.each(function () {
        var linkId = this.id || Foundation.GetYoDigits(6, 'acc-menu-link'),
            $elem = $(this),
            $sub = $elem.children('[data-submenu]'),
            subId = $sub[0].id || Foundation.GetYoDigits(6, 'acc-menu'),
            isActive = $sub.hasClass('is-active');
        $elem.attr({
          'aria-controls': subId,
          'aria-expanded': isActive,
          'role': 'menuitem',
          'id': linkId
        });
        $sub.attr({
          'aria-labelledby': linkId,
          'aria-hidden': !isActive,
          'role': 'menu',
          'id': subId
        });
      });
      var initPanes = this.$element.find('.is-active');
      if (initPanes.length) {
        var _this = this;
        initPanes.each(function () {
          _this.down($(this));
        });
      }
      this._events();
    }

    /**
     * Adds event handlers for items within the menu.
     * @private
     */
    _events() {
      var _this = this;

      this.$element.find('li').each(function () {
        var $submenu = $(this).children('[data-submenu]');

        if ($submenu.length) {
          $(this).children('a').off('click.zf.accordionMenu').on('click.zf.accordionMenu', function (e) {
            e.preventDefault();

            _this.toggle($submenu);
          });
        }
      }).on('keydown.zf.accordionmenu', function (e) {
        var $element = $(this),
            $elements = $element.parent('ul').children('li'),
            $prevElement,
            $nextElement,
            $target = $element.children('[data-submenu]');

        $elements.each(function (i) {
          if ($(this).is($element)) {
            $prevElement = $elements.eq(Math.max(0, i - 1)).find('a').first();
            $nextElement = $elements.eq(Math.min(i + 1, $elements.length - 1)).find('a').first();

            if ($(this).children('[data-submenu]:visible').length) {
              // has open sub menu
              $nextElement = $element.find('li:first-child').find('a').first();
            }
            if ($(this).is(':first-child')) {
              // is first element of sub menu
              $prevElement = $element.parents('li').first().find('a').first();
            } else if ($prevElement.parents('li').first().children('[data-submenu]:visible').length) {
              // if previous element has open sub menu
              $prevElement = $prevElement.parents('li').find('li:last-child').find('a').first();
            }
            if ($(this).is(':last-child')) {
              // is last element of sub menu
              $nextElement = $element.parents('li').first().next('li').find('a').first();
            }

            return;
          }
        });

        Foundation.Keyboard.handleKey(e, 'AccordionMenu', {
          open: function () {
            if ($target.is(':hidden')) {
              _this.down($target);
              $target.find('li').first().find('a').first().focus();
            }
          },
          close: function () {
            if ($target.length && !$target.is(':hidden')) {
              // close active sub of this item
              _this.up($target);
            } else if ($element.parent('[data-submenu]').length) {
              // close currently open sub
              _this.up($element.parent('[data-submenu]'));
              $element.parents('li').first().find('a').first().focus();
            }
          },
          up: function () {
            $prevElement.focus();
            return true;
          },
          down: function () {
            $nextElement.focus();
            return true;
          },
          toggle: function () {
            if ($element.children('[data-submenu]').length) {
              _this.toggle($element.children('[data-submenu]'));
            }
          },
          closeAll: function () {
            _this.hideAll();
          },
          handled: function (preventDefault) {
            if (preventDefault) {
              e.preventDefault();
            }
            e.stopImmediatePropagation();
          }
        });
      }); //.attr('tabindex', 0);
    }

    /**
     * Closes all panes of the menu.
     * @function
     */
    hideAll() {
      this.$element.find('[data-submenu]').slideUp(this.options.slideSpeed);
    }

    /**
     * Toggles the open/close state of a submenu.
     * @function
     * @param {jQuery} $target - the submenu to toggle
     */
    toggle($target) {
      if (!$target.is(':animated')) {
        if (!$target.is(':hidden')) {
          this.up($target);
        } else {
          this.down($target);
        }
      }
    }

    /**
     * Opens the sub-menu defined by `$target`.
     * @param {jQuery} $target - Sub-menu to open.
     * @fires AccordionMenu#down
     */
    down($target) {
      var _this = this;

      if (!this.options.multiOpen) {
        this.up(this.$element.find('.is-active').not($target.parentsUntil(this.$element).add($target)));
      }

      $target.addClass('is-active').attr({ 'aria-hidden': false }).parent('.is-accordion-submenu-parent').attr({ 'aria-expanded': true });

      //Foundation.Move(this.options.slideSpeed, $target, function() {
      $target.slideDown(_this.options.slideSpeed, function () {
        /**
         * Fires when the menu is done opening.
         * @event AccordionMenu#down
         */
        _this.$element.trigger('down.zf.accordionMenu', [$target]);
      });
      //});
    }

    /**
     * Closes the sub-menu defined by `$target`. All sub-menus inside the target will be closed as well.
     * @param {jQuery} $target - Sub-menu to close.
     * @fires AccordionMenu#up
     */
    up($target) {
      var _this = this;
      //Foundation.Move(this.options.slideSpeed, $target, function(){
      $target.slideUp(_this.options.slideSpeed, function () {
        /**
         * Fires when the menu is done collapsing up.
         * @event AccordionMenu#up
         */
        _this.$element.trigger('up.zf.accordionMenu', [$target]);
      });
      //});

      var $menus = $target.find('[data-submenu]').slideUp(0).addBack().attr('aria-hidden', true);

      $menus.parent('.is-accordion-submenu-parent').attr('aria-expanded', false);
    }

    /**
     * Destroys an instance of accordion menu.
     * @fires AccordionMenu#destroyed
     */
    destroy() {
      this.$element.find('[data-submenu]').slideDown(0).css('display', '');
      this.$element.find('a').off('click.zf.accordionMenu');

      Foundation.Nest.Burn(this.$element, 'accordion');
      Foundation.unregisterPlugin(this);
    }
  }

  AccordionMenu.defaults = {
    /**
     * Amount of time to animate the opening of a submenu in ms.
     * @option
     * @example 250
     */
    slideSpeed: 250,
    /**
     * Allow the menu to have multiple open panes.
     * @option
     * @example true
     */
    multiOpen: true
  };

  // Window exports
  Foundation.plugin(AccordionMenu, 'AccordionMenu');
}(jQuery);
;'use strict';

!function ($) {

  /**
   * Dropdown module.
   * @module foundation.dropdown
   * @requires foundation.util.keyboard
   * @requires foundation.util.box
   * @requires foundation.util.triggers
   */

  class Dropdown {
    /**
     * Creates a new instance of a dropdown.
     * @class
     * @param {jQuery} element - jQuery object to make into a dropdown.
     *        Object should be of the dropdown panel, rather than its anchor.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    constructor(element, options) {
      this.$element = element;
      this.options = $.extend({}, Dropdown.defaults, this.$element.data(), options);
      this._init();

      Foundation.registerPlugin(this, 'Dropdown');
      Foundation.Keyboard.register('Dropdown', {
        'ENTER': 'open',
        'SPACE': 'open',
        'ESCAPE': 'close',
        'TAB': 'tab_forward',
        'SHIFT_TAB': 'tab_backward'
      });
    }

    /**
     * Initializes the plugin by setting/checking options and attributes, adding helper variables, and saving the anchor.
     * @function
     * @private
     */
    _init() {
      var $id = this.$element.attr('id');

      this.$anchor = $(`[data-toggle="${$id}"]`).length ? $(`[data-toggle="${$id}"]`) : $(`[data-open="${$id}"]`);
      this.$anchor.attr({
        'aria-controls': $id,
        'data-is-focus': false,
        'data-yeti-box': $id,
        'aria-haspopup': true,
        'aria-expanded': false

      });

      this.options.positionClass = this.getPositionClass();
      this.counter = 4;
      this.usedPositions = [];
      this.$element.attr({
        'aria-hidden': 'true',
        'data-yeti-box': $id,
        'data-resize': $id,
        'aria-labelledby': this.$anchor[0].id || Foundation.GetYoDigits(6, 'dd-anchor')
      });
      this._events();
    }

    /**
     * Helper function to determine current orientation of dropdown pane.
     * @function
     * @returns {String} position - string value of a position class.
     */
    getPositionClass() {
      var verticalPosition = this.$element[0].className.match(/(top|left|right|bottom)/g);
      verticalPosition = verticalPosition ? verticalPosition[0] : '';
      var horizontalPosition = /float-(\S+)/.exec(this.$anchor[0].className);
      horizontalPosition = horizontalPosition ? horizontalPosition[1] : '';
      var position = horizontalPosition ? horizontalPosition + ' ' + verticalPosition : verticalPosition;

      return position;
    }

    /**
     * Adjusts the dropdown panes orientation by adding/removing positioning classes.
     * @function
     * @private
     * @param {String} position - position class to remove.
     */
    _reposition(position) {
      this.usedPositions.push(position ? position : 'bottom');
      //default, try switching to opposite side
      if (!position && this.usedPositions.indexOf('top') < 0) {
        this.$element.addClass('top');
      } else if (position === 'top' && this.usedPositions.indexOf('bottom') < 0) {
        this.$element.removeClass(position);
      } else if (position === 'left' && this.usedPositions.indexOf('right') < 0) {
        this.$element.removeClass(position).addClass('right');
      } else if (position === 'right' && this.usedPositions.indexOf('left') < 0) {
        this.$element.removeClass(position).addClass('left');
      }

      //if default change didn't work, try bottom or left first
      else if (!position && this.usedPositions.indexOf('top') > -1 && this.usedPositions.indexOf('left') < 0) {
          this.$element.addClass('left');
        } else if (position === 'top' && this.usedPositions.indexOf('bottom') > -1 && this.usedPositions.indexOf('left') < 0) {
          this.$element.removeClass(position).addClass('left');
        } else if (position === 'left' && this.usedPositions.indexOf('right') > -1 && this.usedPositions.indexOf('bottom') < 0) {
          this.$element.removeClass(position);
        } else if (position === 'right' && this.usedPositions.indexOf('left') > -1 && this.usedPositions.indexOf('bottom') < 0) {
          this.$element.removeClass(position);
        }
        //if nothing cleared, set to bottom
        else {
            this.$element.removeClass(position);
          }
      this.classChanged = true;
      this.counter--;
    }

    /**
     * Sets the position and orientation of the dropdown pane, checks for collisions.
     * Recursively calls itself if a collision is detected, with a new position class.
     * @function
     * @private
     */
    _setPosition() {
      if (this.$anchor.attr('aria-expanded') === 'false') {
        return false;
      }
      var position = this.getPositionClass(),
          $eleDims = Foundation.Box.GetDimensions(this.$element),
          $anchorDims = Foundation.Box.GetDimensions(this.$anchor),
          _this = this,
          direction = position === 'left' ? 'left' : position === 'right' ? 'left' : 'top',
          param = direction === 'top' ? 'height' : 'width',
          offset = param === 'height' ? this.options.vOffset : this.options.hOffset;

      if ($eleDims.width >= $eleDims.windowDims.width || !this.counter && !Foundation.Box.ImNotTouchingYou(this.$element)) {
        this.$element.offset(Foundation.Box.GetOffsets(this.$element, this.$anchor, 'center bottom', this.options.vOffset, this.options.hOffset, true)).css({
          'width': $eleDims.windowDims.width - this.options.hOffset * 2,
          'height': 'auto'
        });
        this.classChanged = true;
        return false;
      }

      this.$element.offset(Foundation.Box.GetOffsets(this.$element, this.$anchor, position, this.options.vOffset, this.options.hOffset));

      while (!Foundation.Box.ImNotTouchingYou(this.$element, false, true) && this.counter) {
        this._reposition(position);
        this._setPosition();
      }
    }

    /**
     * Adds event listeners to the element utilizing the triggers utility library.
     * @function
     * @private
     */
    _events() {
      var _this = this;
      this.$element.on({
        'open.zf.trigger': this.open.bind(this),
        'close.zf.trigger': this.close.bind(this),
        'toggle.zf.trigger': this.toggle.bind(this),
        'resizeme.zf.trigger': this._setPosition.bind(this)
      });

      if (this.options.hover) {
        this.$anchor.off('mouseenter.zf.dropdown mouseleave.zf.dropdown').on('mouseenter.zf.dropdown', function () {
          if ($('body[data-whatinput="mouse"]').is('*')) {
            clearTimeout(_this.timeout);
            _this.timeout = setTimeout(function () {
              _this.open();
              _this.$anchor.data('hover', true);
            }, _this.options.hoverDelay);
          }
        }).on('mouseleave.zf.dropdown', function () {
          clearTimeout(_this.timeout);
          _this.timeout = setTimeout(function () {
            _this.close();
            _this.$anchor.data('hover', false);
          }, _this.options.hoverDelay);
        });
        if (this.options.hoverPane) {
          this.$element.off('mouseenter.zf.dropdown mouseleave.zf.dropdown').on('mouseenter.zf.dropdown', function () {
            clearTimeout(_this.timeout);
          }).on('mouseleave.zf.dropdown', function () {
            clearTimeout(_this.timeout);
            _this.timeout = setTimeout(function () {
              _this.close();
              _this.$anchor.data('hover', false);
            }, _this.options.hoverDelay);
          });
        }
      }
      this.$anchor.add(this.$element).on('keydown.zf.dropdown', function (e) {

        var $target = $(this),
            visibleFocusableElements = Foundation.Keyboard.findFocusable(_this.$element);

        Foundation.Keyboard.handleKey(e, 'Dropdown', {
          tab_forward: function () {
            if (_this.$element.find(':focus').is(visibleFocusableElements.eq(-1))) {
              // left modal downwards, setting focus to first element
              if (_this.options.trapFocus) {
                // if focus shall be trapped
                visibleFocusableElements.eq(0).focus();
                e.preventDefault();
              } else {
                // if focus is not trapped, close dropdown on focus out
                _this.close();
              }
            }
          },
          tab_backward: function () {
            if (_this.$element.find(':focus').is(visibleFocusableElements.eq(0)) || _this.$element.is(':focus')) {
              // left modal upwards, setting focus to last element
              if (_this.options.trapFocus) {
                // if focus shall be trapped
                visibleFocusableElements.eq(-1).focus();
                e.preventDefault();
              } else {
                // if focus is not trapped, close dropdown on focus out
                _this.close();
              }
            }
          },
          open: function () {
            if ($target.is(_this.$anchor)) {
              _this.open();
              _this.$element.attr('tabindex', -1).focus();
              e.preventDefault();
            }
          },
          close: function () {
            _this.close();
            _this.$anchor.focus();
          }
        });
      });
    }

    /**
     * Adds an event handler to the body to close any dropdowns on a click.
     * @function
     * @private
     */
    _addBodyHandler() {
      var $body = $(document.body).not(this.$element),
          _this = this;
      $body.off('click.zf.dropdown').on('click.zf.dropdown', function (e) {
        if (_this.$anchor.is(e.target) || _this.$anchor.find(e.target).length) {
          return;
        }
        if (_this.$element.find(e.target).length) {
          return;
        }
        _this.close();
        $body.off('click.zf.dropdown');
      });
    }

    /**
     * Opens the dropdown pane, and fires a bubbling event to close other dropdowns.
     * @function
     * @fires Dropdown#closeme
     * @fires Dropdown#show
     */
    open() {
      // var _this = this;
      /**
       * Fires to close other open dropdowns
       * @event Dropdown#closeme
       */
      this.$element.trigger('closeme.zf.dropdown', this.$element.attr('id'));
      this.$anchor.addClass('hover').attr({ 'aria-expanded': true });
      // this.$element/*.show()*/;
      this._setPosition();
      this.$element.addClass('is-open').attr({ 'aria-hidden': false });

      if (this.options.autoFocus) {
        var $focusable = Foundation.Keyboard.findFocusable(this.$element);
        if ($focusable.length) {
          $focusable.eq(0).focus();
        }
      }

      if (this.options.closeOnClick) {
        this._addBodyHandler();
      }

      /**
       * Fires once the dropdown is visible.
       * @event Dropdown#show
       */
      this.$element.trigger('show.zf.dropdown', [this.$element]);
    }

    /**
     * Closes the open dropdown pane.
     * @function
     * @fires Dropdown#hide
     */
    close() {
      if (!this.$element.hasClass('is-open')) {
        return false;
      }
      this.$element.removeClass('is-open').attr({ 'aria-hidden': true });

      this.$anchor.removeClass('hover').attr('aria-expanded', false);

      if (this.classChanged) {
        var curPositionClass = this.getPositionClass();
        if (curPositionClass) {
          this.$element.removeClass(curPositionClass);
        }
        this.$element.addClass(this.options.positionClass)
        /*.hide()*/.css({ height: '', width: '' });
        this.classChanged = false;
        this.counter = 4;
        this.usedPositions.length = 0;
      }
      this.$element.trigger('hide.zf.dropdown', [this.$element]);
    }

    /**
     * Toggles the dropdown pane's visibility.
     * @function
     */
    toggle() {
      if (this.$element.hasClass('is-open')) {
        if (this.$anchor.data('hover')) return;
        this.close();
      } else {
        this.open();
      }
    }

    /**
     * Destroys the dropdown.
     * @function
     */
    destroy() {
      this.$element.off('.zf.trigger').hide();
      this.$anchor.off('.zf.dropdown');

      Foundation.unregisterPlugin(this);
    }
  }

  Dropdown.defaults = {
    /**
     * Amount of time to delay opening a submenu on hover event.
     * @option
     * @example 250
     */
    hoverDelay: 250,
    /**
     * Allow submenus to open on hover events
     * @option
     * @example false
     */
    hover: false,
    /**
     * Don't close dropdown when hovering over dropdown pane
     * @option
     * @example true
     */
    hoverPane: false,
    /**
     * Number of pixels between the dropdown pane and the triggering element on open.
     * @option
     * @example 1
     */
    vOffset: 1,
    /**
     * Number of pixels between the dropdown pane and the triggering element on open.
     * @option
     * @example 1
     */
    hOffset: 1,
    /**
     * Class applied to adjust open position. JS will test and fill this in.
     * @option
     * @example 'top'
     */
    positionClass: '',
    /**
     * Allow the plugin to trap focus to the dropdown pane if opened with keyboard commands.
     * @option
     * @example false
     */
    trapFocus: false,
    /**
     * Allow the plugin to set focus to the first focusable element within the pane, regardless of method of opening.
     * @option
     * @example true
     */
    autoFocus: false,
    /**
     * Allows a click on the body to close the dropdown.
     * @option
     * @example false
     */
    closeOnClick: false

    // Window exports
  };Foundation.plugin(Dropdown, 'Dropdown');
}(jQuery);
;'use strict';

!function ($) {

  /**
   * DropdownMenu module.
   * @module foundation.dropdown-menu
   * @requires foundation.util.keyboard
   * @requires foundation.util.box
   * @requires foundation.util.nest
   */

  class DropdownMenu {
    /**
     * Creates a new instance of DropdownMenu.
     * @class
     * @fires DropdownMenu#init
     * @param {jQuery} element - jQuery object to make into a dropdown menu.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    constructor(element, options) {
      this.$element = element;
      this.options = $.extend({}, DropdownMenu.defaults, this.$element.data(), options);

      Foundation.Nest.Feather(this.$element, 'dropdown');
      this._init();

      Foundation.registerPlugin(this, 'DropdownMenu');
      Foundation.Keyboard.register('DropdownMenu', {
        'ENTER': 'open',
        'SPACE': 'open',
        'ARROW_RIGHT': 'next',
        'ARROW_UP': 'up',
        'ARROW_DOWN': 'down',
        'ARROW_LEFT': 'previous',
        'ESCAPE': 'close'
      });
    }

    /**
     * Initializes the plugin, and calls _prepareMenu
     * @private
     * @function
     */
    _init() {
      var subs = this.$element.find('li.is-dropdown-submenu-parent');
      this.$element.children('.is-dropdown-submenu-parent').children('.is-dropdown-submenu').addClass('first-sub');

      this.$menuItems = this.$element.find('[role="menuitem"]');
      this.$tabs = this.$element.children('[role="menuitem"]');
      this.$tabs.find('ul.is-dropdown-submenu').addClass(this.options.verticalClass);

      if (this.$element.hasClass(this.options.rightClass) || this.options.alignment === 'right' || Foundation.rtl() || this.$element.parents('.top-bar-right').is('*')) {
        this.options.alignment = 'right';
        subs.addClass('opens-left');
      } else {
        subs.addClass('opens-right');
      }
      this.changed = false;
      this._events();
    }

    _isVertical() {
      return this.$tabs.css('display') === 'block';
    }

    /**
     * Adds event listeners to elements within the menu
     * @private
     * @function
     */
    _events() {
      var _this = this,
          hasTouch = 'ontouchstart' in window || typeof window.ontouchstart !== 'undefined',
          parClass = 'is-dropdown-submenu-parent';

      // used for onClick and in the keyboard handlers
      var handleClickFn = function (e) {
        var $elem = $(e.target).parentsUntil('ul', `.${parClass}`),
            hasSub = $elem.hasClass(parClass),
            hasClicked = $elem.attr('data-is-click') === 'true',
            $sub = $elem.children('.is-dropdown-submenu');

        if (hasSub) {
          if (hasClicked) {
            if (!_this.options.closeOnClick || !_this.options.clickOpen && !hasTouch || _this.options.forceFollow && hasTouch) {
              return;
            } else {
              e.stopImmediatePropagation();
              e.preventDefault();
              _this._hide($elem);
            }
          } else {
            e.preventDefault();
            e.stopImmediatePropagation();
            _this._show($sub);
            $elem.add($elem.parentsUntil(_this.$element, `.${parClass}`)).attr('data-is-click', true);
          }
        } else {
          if (_this.options.closeOnClickInside) {
            _this._hide($elem);
          }
          return;
        }
      };

      if (this.options.clickOpen || hasTouch) {
        this.$menuItems.on('click.zf.dropdownmenu touchstart.zf.dropdownmenu', handleClickFn);
      }

      if (!this.options.disableHover) {
        this.$menuItems.on('mouseenter.zf.dropdownmenu', function (e) {
          var $elem = $(this),
              hasSub = $elem.hasClass(parClass);

          if (hasSub) {
            clearTimeout(_this.delay);
            _this.delay = setTimeout(function () {
              _this._show($elem.children('.is-dropdown-submenu'));
            }, _this.options.hoverDelay);
          }
        }).on('mouseleave.zf.dropdownmenu', function (e) {
          var $elem = $(this),
              hasSub = $elem.hasClass(parClass);
          if (hasSub && _this.options.autoclose) {
            if ($elem.attr('data-is-click') === 'true' && _this.options.clickOpen) {
              return false;
            }

            clearTimeout(_this.delay);
            _this.delay = setTimeout(function () {
              _this._hide($elem);
            }, _this.options.closingTime);
          }
        });
      }
      this.$menuItems.on('keydown.zf.dropdownmenu', function (e) {
        var $element = $(e.target).parentsUntil('ul', '[role="menuitem"]'),
            isTab = _this.$tabs.index($element) > -1,
            $elements = isTab ? _this.$tabs : $element.siblings('li').add($element),
            $prevElement,
            $nextElement;

        $elements.each(function (i) {
          if ($(this).is($element)) {
            $prevElement = $elements.eq(i - 1);
            $nextElement = $elements.eq(i + 1);
            return;
          }
        });

        var nextSibling = function () {
          if (!$element.is(':last-child')) {
            $nextElement.children('a:first').focus();
            e.preventDefault();
          }
        },
            prevSibling = function () {
          $prevElement.children('a:first').focus();
          e.preventDefault();
        },
            openSub = function () {
          var $sub = $element.children('ul.is-dropdown-submenu');
          if ($sub.length) {
            _this._show($sub);
            $element.find('li > a:first').focus();
            e.preventDefault();
          } else {
            return;
          }
        },
            closeSub = function () {
          //if ($element.is(':first-child')) {
          var close = $element.parent('ul').parent('li');
          close.children('a:first').focus();
          _this._hide(close);
          e.preventDefault();
          //}
        };
        var functions = {
          open: openSub,
          close: function () {
            _this._hide(_this.$element);
            _this.$menuItems.find('a:first').focus(); // focus to first element
            e.preventDefault();
          },
          handled: function () {
            e.stopImmediatePropagation();
          }
        };

        if (isTab) {
          if (_this._isVertical()) {
            // vertical menu
            if (Foundation.rtl()) {
              // right aligned
              $.extend(functions, {
                down: nextSibling,
                up: prevSibling,
                next: closeSub,
                previous: openSub
              });
            } else {
              // left aligned
              $.extend(functions, {
                down: nextSibling,
                up: prevSibling,
                next: openSub,
                previous: closeSub
              });
            }
          } else {
            // horizontal menu
            if (Foundation.rtl()) {
              // right aligned
              $.extend(functions, {
                next: prevSibling,
                previous: nextSibling,
                down: openSub,
                up: closeSub
              });
            } else {
              // left aligned
              $.extend(functions, {
                next: nextSibling,
                previous: prevSibling,
                down: openSub,
                up: closeSub
              });
            }
          }
        } else {
          // not tabs -> one sub
          if (Foundation.rtl()) {
            // right aligned
            $.extend(functions, {
              next: closeSub,
              previous: openSub,
              down: nextSibling,
              up: prevSibling
            });
          } else {
            // left aligned
            $.extend(functions, {
              next: openSub,
              previous: closeSub,
              down: nextSibling,
              up: prevSibling
            });
          }
        }
        Foundation.Keyboard.handleKey(e, 'DropdownMenu', functions);
      });
    }

    /**
     * Adds an event handler to the body to close any dropdowns on a click.
     * @function
     * @private
     */
    _addBodyHandler() {
      var $body = $(document.body),
          _this = this;
      $body.off('mouseup.zf.dropdownmenu touchend.zf.dropdownmenu').on('mouseup.zf.dropdownmenu touchend.zf.dropdownmenu', function (e) {
        var $link = _this.$element.find(e.target);
        if ($link.length) {
          return;
        }

        _this._hide();
        $body.off('mouseup.zf.dropdownmenu touchend.zf.dropdownmenu');
      });
    }

    /**
     * Opens a dropdown pane, and checks for collisions first.
     * @param {jQuery} $sub - ul element that is a submenu to show
     * @function
     * @private
     * @fires DropdownMenu#show
     */
    _show($sub) {
      var idx = this.$tabs.index(this.$tabs.filter(function (i, el) {
        return $(el).find($sub).length > 0;
      }));
      var $sibs = $sub.parent('li.is-dropdown-submenu-parent').siblings('li.is-dropdown-submenu-parent');
      this._hide($sibs, idx);
      $sub.css('visibility', 'hidden').addClass('js-dropdown-active').attr({ 'aria-hidden': false }).parent('li.is-dropdown-submenu-parent').addClass('is-active').attr({ 'aria-expanded': true });
      var clear = Foundation.Box.ImNotTouchingYou($sub, null, true);
      if (!clear) {
        var oldClass = this.options.alignment === 'left' ? '-right' : '-left',
            $parentLi = $sub.parent('.is-dropdown-submenu-parent');
        $parentLi.removeClass(`opens${oldClass}`).addClass(`opens-${this.options.alignment}`);
        clear = Foundation.Box.ImNotTouchingYou($sub, null, true);
        if (!clear) {
          $parentLi.removeClass(`opens-${this.options.alignment}`).addClass('opens-inner');
        }
        this.changed = true;
      }
      $sub.css('visibility', '');
      if (this.options.closeOnClick) {
        this._addBodyHandler();
      }
      /**
       * Fires when the new dropdown pane is visible.
       * @event DropdownMenu#show
       */
      this.$element.trigger('show.zf.dropdownmenu', [$sub]);
    }

    /**
     * Hides a single, currently open dropdown pane, if passed a parameter, otherwise, hides everything.
     * @function
     * @param {jQuery} $elem - element with a submenu to hide
     * @param {Number} idx - index of the $tabs collection to hide
     * @private
     */
    _hide($elem, idx) {
      var $toClose;
      if ($elem && $elem.length) {
        $toClose = $elem;
      } else if (idx !== undefined) {
        $toClose = this.$tabs.not(function (i, el) {
          return i === idx;
        });
      } else {
        $toClose = this.$element;
      }
      var somethingToClose = $toClose.hasClass('is-active') || $toClose.find('.is-active').length > 0;

      if (somethingToClose) {
        $toClose.find('li.is-active').add($toClose).attr({
          'aria-expanded': false,
          'data-is-click': false
        }).removeClass('is-active');

        $toClose.find('ul.js-dropdown-active').attr({
          'aria-hidden': true
        }).removeClass('js-dropdown-active');

        if (this.changed || $toClose.find('opens-inner').length) {
          var oldClass = this.options.alignment === 'left' ? 'right' : 'left';
          $toClose.find('li.is-dropdown-submenu-parent').add($toClose).removeClass(`opens-inner opens-${this.options.alignment}`).addClass(`opens-${oldClass}`);
          this.changed = false;
        }
        /**
         * Fires when the open menus are closed.
         * @event DropdownMenu#hide
         */
        this.$element.trigger('hide.zf.dropdownmenu', [$toClose]);
      }
    }

    /**
     * Destroys the plugin.
     * @function
     */
    destroy() {
      this.$menuItems.off('.zf.dropdownmenu').removeAttr('data-is-click').removeClass('is-right-arrow is-left-arrow is-down-arrow opens-right opens-left opens-inner');
      $(document.body).off('.zf.dropdownmenu');
      Foundation.Nest.Burn(this.$element, 'dropdown');
      Foundation.unregisterPlugin(this);
    }
  }

  /**
   * Default settings for plugin
   */
  DropdownMenu.defaults = {
    /**
     * Disallows hover events from opening submenus
     * @option
     * @example false
     */
    disableHover: false,
    /**
     * Allow a submenu to automatically close on a mouseleave event, if not clicked open.
     * @option
     * @example true
     */
    autoclose: true,
    /**
     * Amount of time to delay opening a submenu on hover event.
     * @option
     * @example 50
     */
    hoverDelay: 50,
    /**
     * Allow a submenu to open/remain open on parent click event. Allows cursor to move away from menu.
     * @option
     * @example true
     */
    clickOpen: false,
    /**
     * Amount of time to delay closing a submenu on a mouseleave event.
     * @option
     * @example 500
     */

    closingTime: 500,
    /**
     * Position of the menu relative to what direction the submenus should open. Handled by JS.
     * @option
     * @example 'left'
     */
    alignment: 'left',
    /**
     * Allow clicks on the body to close any open submenus.
     * @option
     * @example true
     */
    closeOnClick: true,
    /**
     * Allow clicks on leaf anchor links to close any open submenus.
     * @option
     * @example true
     */
    closeOnClickInside: true,
    /**
     * Class applied to vertical oriented menus, Foundation default is `vertical`. Update this if using your own class.
     * @option
     * @example 'vertical'
     */
    verticalClass: 'vertical',
    /**
     * Class applied to right-side oriented menus, Foundation default is `align-right`. Update this if using your own class.
     * @option
     * @example 'align-right'
     */
    rightClass: 'align-right',
    /**
     * Boolean to force overide the clicking of links to perform default action, on second touch event for mobile.
     * @option
     * @example false
     */
    forceFollow: true
  };

  // Window exports
  Foundation.plugin(DropdownMenu, 'DropdownMenu');
}(jQuery);
;'use strict';

!function ($) {

  /**
   * Equalizer module.
   * @module foundation.equalizer
   * @requires foundation.util.mediaQuery
   * @requires foundation.util.timerAndImageLoader if equalizer contains images
   */

  class Equalizer {
    /**
     * Creates a new instance of Equalizer.
     * @class
     * @fires Equalizer#init
     * @param {Object} element - jQuery object to add the trigger to.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    constructor(element, options) {
      this.$element = element;
      this.options = $.extend({}, Equalizer.defaults, this.$element.data(), options);

      this._init();

      Foundation.registerPlugin(this, 'Equalizer');
    }

    /**
     * Initializes the Equalizer plugin and calls functions to get equalizer functioning on load.
     * @private
     */
    _init() {
      var eqId = this.$element.attr('data-equalizer') || '';
      var $watched = this.$element.find(`[data-equalizer-watch="${eqId}"]`);

      this.$watched = $watched.length ? $watched : this.$element.find('[data-equalizer-watch]');
      this.$element.attr('data-resize', eqId || Foundation.GetYoDigits(6, 'eq'));

      this.hasNested = this.$element.find('[data-equalizer]').length > 0;
      this.isNested = this.$element.parentsUntil(document.body, '[data-equalizer]').length > 0;
      this.isOn = false;
      this._bindHandler = {
        onResizeMeBound: this._onResizeMe.bind(this),
        onPostEqualizedBound: this._onPostEqualized.bind(this)
      };

      var imgs = this.$element.find('img');
      var tooSmall;
      if (this.options.equalizeOn) {
        tooSmall = this._checkMQ();
        $(window).on('changed.zf.mediaquery', this._checkMQ.bind(this));
      } else {
        this._events();
      }
      if (tooSmall !== undefined && tooSmall === false || tooSmall === undefined) {
        if (imgs.length) {
          Foundation.onImagesLoaded(imgs, this._reflow.bind(this));
        } else {
          this._reflow();
        }
      }
    }

    /**
     * Removes event listeners if the breakpoint is too small.
     * @private
     */
    _pauseEvents() {
      this.isOn = false;
      this.$element.off({
        '.zf.equalizer': this._bindHandler.onPostEqualizedBound,
        'resizeme.zf.trigger': this._bindHandler.onResizeMeBound
      });
    }

    /**
     * function to handle $elements resizeme.zf.trigger, with bound this on _bindHandler.onResizeMeBound
     * @private
     */
    _onResizeMe(e) {
      this._reflow();
    }

    /**
     * function to handle $elements postequalized.zf.equalizer, with bound this on _bindHandler.onPostEqualizedBound
     * @private
     */
    _onPostEqualized(e) {
      if (e.target !== this.$element[0]) {
        this._reflow();
      }
    }

    /**
     * Initializes events for Equalizer.
     * @private
     */
    _events() {
      var _this = this;
      this._pauseEvents();
      if (this.hasNested) {
        this.$element.on('postequalized.zf.equalizer', this._bindHandler.onPostEqualizedBound);
      } else {
        this.$element.on('resizeme.zf.trigger', this._bindHandler.onResizeMeBound);
      }
      this.isOn = true;
    }

    /**
     * Checks the current breakpoint to the minimum required size.
     * @private
     */
    _checkMQ() {
      var tooSmall = !Foundation.MediaQuery.atLeast(this.options.equalizeOn);
      if (tooSmall) {
        if (this.isOn) {
          this._pauseEvents();
          this.$watched.css('height', 'auto');
        }
      } else {
        if (!this.isOn) {
          this._events();
        }
      }
      return tooSmall;
    }

    /**
     * A noop version for the plugin
     * @private
     */
    _killswitch() {
      return;
    }

    /**
     * Calls necessary functions to update Equalizer upon DOM change
     * @private
     */
    _reflow() {
      if (!this.options.equalizeOnStack) {
        if (this._isStacked()) {
          this.$watched.css('height', 'auto');
          return false;
        }
      }
      if (this.options.equalizeByRow) {
        this.getHeightsByRow(this.applyHeightByRow.bind(this));
      } else {
        this.getHeights(this.applyHeight.bind(this));
      }
    }

    /**
     * Manually determines if the first 2 elements are *NOT* stacked.
     * @private
     */
    _isStacked() {
      return this.$watched[0].getBoundingClientRect().top !== this.$watched[1].getBoundingClientRect().top;
    }

    /**
     * Finds the outer heights of children contained within an Equalizer parent and returns them in an array
     * @param {Function} cb - A non-optional callback to return the heights array to.
     * @returns {Array} heights - An array of heights of children within Equalizer container
     */
    getHeights(cb) {
      var heights = [];
      for (var i = 0, len = this.$watched.length; i < len; i++) {
        this.$watched[i].style.height = 'auto';
        heights.push(this.$watched[i].offsetHeight);
      }
      cb(heights);
    }

    /**
     * Finds the outer heights of children contained within an Equalizer parent and returns them in an array
     * @param {Function} cb - A non-optional callback to return the heights array to.
     * @returns {Array} groups - An array of heights of children within Equalizer container grouped by row with element,height and max as last child
     */
    getHeightsByRow(cb) {
      var lastElTopOffset = this.$watched.length ? this.$watched.first().offset().top : 0,
          groups = [],
          group = 0;
      //group by Row
      groups[group] = [];
      for (var i = 0, len = this.$watched.length; i < len; i++) {
        this.$watched[i].style.height = 'auto';
        //maybe could use this.$watched[i].offsetTop
        var elOffsetTop = $(this.$watched[i]).offset().top;
        if (elOffsetTop != lastElTopOffset) {
          group++;
          groups[group] = [];
          lastElTopOffset = elOffsetTop;
        }
        groups[group].push([this.$watched[i], this.$watched[i].offsetHeight]);
      }

      for (var j = 0, ln = groups.length; j < ln; j++) {
        var heights = $(groups[j]).map(function () {
          return this[1];
        }).get();
        var max = Math.max.apply(null, heights);
        groups[j].push(max);
      }
      cb(groups);
    }

    /**
     * Changes the CSS height property of each child in an Equalizer parent to match the tallest
     * @param {array} heights - An array of heights of children within Equalizer container
     * @fires Equalizer#preequalized
     * @fires Equalizer#postequalized
     */
    applyHeight(heights) {
      var max = Math.max.apply(null, heights);
      /**
       * Fires before the heights are applied
       * @event Equalizer#preequalized
       */
      this.$element.trigger('preequalized.zf.equalizer');

      this.$watched.css('height', max);

      /**
       * Fires when the heights have been applied
       * @event Equalizer#postequalized
       */
      this.$element.trigger('postequalized.zf.equalizer');
    }

    /**
     * Changes the CSS height property of each child in an Equalizer parent to match the tallest by row
     * @param {array} groups - An array of heights of children within Equalizer container grouped by row with element,height and max as last child
     * @fires Equalizer#preequalized
     * @fires Equalizer#preequalizedRow
     * @fires Equalizer#postequalizedRow
     * @fires Equalizer#postequalized
     */
    applyHeightByRow(groups) {
      /**
       * Fires before the heights are applied
       */
      this.$element.trigger('preequalized.zf.equalizer');
      for (var i = 0, len = groups.length; i < len; i++) {
        var groupsILength = groups[i].length,
            max = groups[i][groupsILength - 1];
        if (groupsILength <= 2) {
          $(groups[i][0][0]).css({ 'height': 'auto' });
          continue;
        }
        /**
          * Fires before the heights per row are applied
          * @event Equalizer#preequalizedRow
          */
        this.$element.trigger('preequalizedrow.zf.equalizer');
        for (var j = 0, lenJ = groupsILength - 1; j < lenJ; j++) {
          $(groups[i][j][0]).css({ 'height': max });
        }
        /**
          * Fires when the heights per row have been applied
          * @event Equalizer#postequalizedRow
          */
        this.$element.trigger('postequalizedrow.zf.equalizer');
      }
      /**
       * Fires when the heights have been applied
       */
      this.$element.trigger('postequalized.zf.equalizer');
    }

    /**
     * Destroys an instance of Equalizer.
     * @function
     */
    destroy() {
      this._pauseEvents();
      this.$watched.css('height', 'auto');

      Foundation.unregisterPlugin(this);
    }
  }

  /**
   * Default settings for plugin
   */
  Equalizer.defaults = {
    /**
     * Enable height equalization when stacked on smaller screens.
     * @option
     * @example true
     */
    equalizeOnStack: false,
    /**
     * Enable height equalization row by row.
     * @option
     * @example false
     */
    equalizeByRow: false,
    /**
     * String representing the minimum breakpoint size the plugin should equalize heights on.
     * @option
     * @example 'medium'
     */
    equalizeOn: ''
  };

  // Window exports
  Foundation.plugin(Equalizer, 'Equalizer');
}(jQuery);
;'use strict';

!function ($) {

  /**
   * Interchange module.
   * @module foundation.interchange
   * @requires foundation.util.mediaQuery
   * @requires foundation.util.timerAndImageLoader
   */

  class Interchange {
    /**
     * Creates a new instance of Interchange.
     * @class
     * @fires Interchange#init
     * @param {Object} element - jQuery object to add the trigger to.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    constructor(element, options) {
      this.$element = element;
      this.options = $.extend({}, Interchange.defaults, options);
      this.rules = [];
      this.currentPath = '';

      this._init();
      this._events();

      Foundation.registerPlugin(this, 'Interchange');
    }

    /**
     * Initializes the Interchange plugin and calls functions to get interchange functioning on load.
     * @function
     * @private
     */
    _init() {
      this._addBreakpoints();
      this._generateRules();
      this._reflow();
    }

    /**
     * Initializes events for Interchange.
     * @function
     * @private
     */
    _events() {
      $(window).on('resize.zf.interchange', Foundation.util.throttle(this._reflow.bind(this), 50));
    }

    /**
     * Calls necessary functions to update Interchange upon DOM change
     * @function
     * @private
     */
    _reflow() {
      var match;

      // Iterate through each rule, but only save the last match
      for (var i in this.rules) {
        if (this.rules.hasOwnProperty(i)) {
          var rule = this.rules[i];

          if (window.matchMedia(rule.query).matches) {
            match = rule;
          }
        }
      }

      if (match) {
        this.replace(match.path);
      }
    }

    /**
     * Gets the Foundation breakpoints and adds them to the Interchange.SPECIAL_QUERIES object.
     * @function
     * @private
     */
    _addBreakpoints() {
      for (var i in Foundation.MediaQuery.queries) {
        if (Foundation.MediaQuery.queries.hasOwnProperty(i)) {
          var query = Foundation.MediaQuery.queries[i];
          Interchange.SPECIAL_QUERIES[query.name] = query.value;
        }
      }
    }

    /**
     * Checks the Interchange element for the provided media query + content pairings
     * @function
     * @private
     * @param {Object} element - jQuery object that is an Interchange instance
     * @returns {Array} scenarios - Array of objects that have 'mq' and 'path' keys with corresponding keys
     */
    _generateRules(element) {
      var rulesList = [];
      var rules;

      if (this.options.rules) {
        rules = this.options.rules;
      } else {
        rules = this.$element.data('interchange').match(/\[.*?\]/g);
      }

      for (var i in rules) {
        if (rules.hasOwnProperty(i)) {
          var rule = rules[i].slice(1, -1).split(', ');
          var path = rule.slice(0, -1).join('');
          var query = rule[rule.length - 1];

          if (Interchange.SPECIAL_QUERIES[query]) {
            query = Interchange.SPECIAL_QUERIES[query];
          }

          rulesList.push({
            path: path,
            query: query
          });
        }
      }

      this.rules = rulesList;
    }

    /**
     * Update the `src` property of an image, or change the HTML of a container, to the specified path.
     * @function
     * @param {String} path - Path to the image or HTML partial.
     * @fires Interchange#replaced
     */
    replace(path) {
      if (this.currentPath === path) return;

      var _this = this,
          trigger = 'replaced.zf.interchange';

      // Replacing images
      if (this.$element[0].nodeName === 'IMG') {
        this.$element.attr('src', path).on('load', function () {
          _this.currentPath = path;
        }).trigger(trigger);
      }
      // Replacing background images
      else if (path.match(/\.(gif|jpg|jpeg|png|svg|tiff)([?#].*)?/i)) {
          this.$element.css({ 'background-image': 'url(' + path + ')' }).trigger(trigger);
        }
        // Replacing HTML
        else {
            $.get(path, function (response) {
              _this.$element.html(response).trigger(trigger);
              $(response).foundation();
              _this.currentPath = path;
            });
          }

      /**
       * Fires when content in an Interchange element is done being loaded.
       * @event Interchange#replaced
       */
      // this.$element.trigger('replaced.zf.interchange');
    }

    /**
     * Destroys an instance of interchange.
     * @function
     */
    destroy() {
      //TODO this.
    }
  }

  /**
   * Default settings for plugin
   */
  Interchange.defaults = {
    /**
     * Rules to be applied to Interchange elements. Set with the `data-interchange` array notation.
     * @option
     */
    rules: null
  };

  Interchange.SPECIAL_QUERIES = {
    'landscape': 'screen and (orientation: landscape)',
    'portrait': 'screen and (orientation: portrait)',
    'retina': 'only screen and (-webkit-min-device-pixel-ratio: 2), only screen and (min--moz-device-pixel-ratio: 2), only screen and (-o-min-device-pixel-ratio: 2/1), only screen and (min-device-pixel-ratio: 2), only screen and (min-resolution: 192dpi), only screen and (min-resolution: 2dppx)'
  };

  // Window exports
  Foundation.plugin(Interchange, 'Interchange');
}(jQuery);
;'use strict';

!function ($) {

  /**
   * OffCanvas module.
   * @module foundation.offcanvas
   * @requires foundation.util.mediaQuery
   * @requires foundation.util.triggers
   * @requires foundation.util.motion
   */

  class OffCanvas {
    /**
     * Creates a new instance of an off-canvas wrapper.
     * @class
     * @fires OffCanvas#init
     * @param {Object} element - jQuery object to initialize.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    constructor(element, options) {
      this.$element = element;
      this.options = $.extend({}, OffCanvas.defaults, this.$element.data(), options);
      this.$lastTrigger = $();
      this.$triggers = $();

      this._init();
      this._events();

      Foundation.registerPlugin(this, 'OffCanvas');
      Foundation.Keyboard.register('OffCanvas', {
        'ESCAPE': 'close'
      });
    }

    /**
     * Initializes the off-canvas wrapper by adding the exit overlay (if needed).
     * @function
     * @private
     */
    _init() {
      var id = this.$element.attr('id');

      this.$element.attr('aria-hidden', 'true');

      // Find triggers that affect this element and add aria-expanded to them
      this.$triggers = $(document).find('[data-open="' + id + '"], [data-close="' + id + '"], [data-toggle="' + id + '"]').attr('aria-expanded', 'false').attr('aria-controls', id);

      // Add a close trigger over the body if necessary
      if (this.options.closeOnClick) {
        if ($('.js-off-canvas-exit').length) {
          this.$exiter = $('.js-off-canvas-exit');
        } else {
          var exiter = document.createElement('div');
          exiter.setAttribute('class', 'js-off-canvas-exit');
          $('[data-off-canvas-content]').append(exiter);

          this.$exiter = $(exiter);
        }
      }

      this.options.isRevealed = this.options.isRevealed || new RegExp(this.options.revealClass, 'g').test(this.$element[0].className);

      if (this.options.isRevealed) {
        this.options.revealOn = this.options.revealOn || this.$element[0].className.match(/(reveal-for-medium|reveal-for-large)/g)[0].split('-')[2];
        this._setMQChecker();
      }
      if (!this.options.transitionTime) {
        this.options.transitionTime = parseFloat(window.getComputedStyle($('[data-off-canvas-wrapper]')[0]).transitionDuration) * 1000;
      }
    }

    /**
     * Adds event handlers to the off-canvas wrapper and the exit overlay.
     * @function
     * @private
     */
    _events() {
      this.$element.off('.zf.trigger .zf.offcanvas').on({
        'open.zf.trigger': this.open.bind(this),
        'close.zf.trigger': this.close.bind(this),
        'toggle.zf.trigger': this.toggle.bind(this),
        'keydown.zf.offcanvas': this._handleKeyboard.bind(this)
      });

      if (this.options.closeOnClick && this.$exiter.length) {
        this.$exiter.on({ 'click.zf.offcanvas': this.close.bind(this) });
      }
    }

    /**
     * Applies event listener for elements that will reveal at certain breakpoints.
     * @private
     */
    _setMQChecker() {
      var _this = this;

      $(window).on('changed.zf.mediaquery', function () {
        if (Foundation.MediaQuery.atLeast(_this.options.revealOn)) {
          _this.reveal(true);
        } else {
          _this.reveal(false);
        }
      }).one('load.zf.offcanvas', function () {
        if (Foundation.MediaQuery.atLeast(_this.options.revealOn)) {
          _this.reveal(true);
        }
      });
    }

    /**
     * Handles the revealing/hiding the off-canvas at breakpoints, not the same as open.
     * @param {Boolean} isRevealed - true if element should be revealed.
     * @function
     */
    reveal(isRevealed) {
      var $closer = this.$element.find('[data-close]');
      if (isRevealed) {
        this.close();
        this.isRevealed = true;
        // if (!this.options.forceTop) {
        //   var scrollPos = parseInt(window.pageYOffset);
        //   this.$element[0].style.transform = 'translate(0,' + scrollPos + 'px)';
        // }
        // if (this.options.isSticky) { this._stick(); }
        this.$element.off('open.zf.trigger toggle.zf.trigger');
        if ($closer.length) {
          $closer.hide();
        }
      } else {
        this.isRevealed = false;
        // if (this.options.isSticky || !this.options.forceTop) {
        //   this.$element[0].style.transform = '';
        //   $(window).off('scroll.zf.offcanvas');
        // }
        this.$element.on({
          'open.zf.trigger': this.open.bind(this),
          'toggle.zf.trigger': this.toggle.bind(this)
        });
        if ($closer.length) {
          $closer.show();
        }
      }
    }

    /**
     * Opens the off-canvas menu.
     * @function
     * @param {Object} event - Event object passed from listener.
     * @param {jQuery} trigger - element that triggered the off-canvas to open.
     * @fires OffCanvas#opened
     */
    open(event, trigger) {
      if (this.$element.hasClass('is-open') || this.isRevealed) {
        return;
      }
      var _this = this,
          $body = $(document.body);

      if (this.options.forceTop) {
        $('body').scrollTop(0);
      }
      // window.pageYOffset = 0;

      // if (!this.options.forceTop) {
      //   var scrollPos = parseInt(window.pageYOffset);
      //   this.$element[0].style.transform = 'translate(0,' + scrollPos + 'px)';
      //   if (this.$exiter.length) {
      //     this.$exiter[0].style.transform = 'translate(0,' + scrollPos + 'px)';
      //   }
      // }
      /**
       * Fires when the off-canvas menu opens.
       * @event OffCanvas#opened
       */

      var $wrapper = $('[data-off-canvas-wrapper]');
      $wrapper.addClass('is-off-canvas-open is-open-' + _this.options.position);

      _this.$element.addClass('is-open');

      // if (_this.options.isSticky) {
      //   _this._stick();
      // }

      this.$triggers.attr('aria-expanded', 'true');
      this.$element.attr('aria-hidden', 'false').trigger('opened.zf.offcanvas');

      if (this.options.closeOnClick) {
        this.$exiter.addClass('is-visible');
      }

      if (trigger) {
        this.$lastTrigger = trigger;
      }

      if (this.options.autoFocus) {
        $wrapper.one(Foundation.transitionend($wrapper), function () {
          if (_this.$element.hasClass('is-open')) {
            // handle double clicks
            _this.$element.attr('tabindex', '-1');
            _this.$element.focus();
          }
        });
      }

      if (this.options.trapFocus) {
        $wrapper.one(Foundation.transitionend($wrapper), function () {
          if (_this.$element.hasClass('is-open')) {
            // handle double clicks
            _this.$element.attr('tabindex', '-1');
            _this.trapFocus();
          }
        });
      }
    }

    /**
     * Traps focus within the offcanvas on open.
     * @private
     */
    _trapFocus() {
      var focusable = Foundation.Keyboard.findFocusable(this.$element),
          first = focusable.eq(0),
          last = focusable.eq(-1);

      focusable.off('.zf.offcanvas').on('keydown.zf.offcanvas', function (e) {
        var key = Foundation.Keyboard.parseKey(e);
        if (key === 'TAB' && e.target === last[0]) {
          e.preventDefault();
          first.focus();
        }
        if (key === 'SHIFT_TAB' && e.target === first[0]) {
          e.preventDefault();
          last.focus();
        }
      });
    }

    /**
     * Allows the offcanvas to appear sticky utilizing translate properties.
     * @private
     */
    // OffCanvas.prototype._stick = function() {
    //   var elStyle = this.$element[0].style;
    //
    //   if (this.options.closeOnClick) {
    //     var exitStyle = this.$exiter[0].style;
    //   }
    //
    //   $(window).on('scroll.zf.offcanvas', function(e) {
    //     console.log(e);
    //     var pageY = window.pageYOffset;
    //     elStyle.transform = 'translate(0,' + pageY + 'px)';
    //     if (exitStyle !== undefined) { exitStyle.transform = 'translate(0,' + pageY + 'px)'; }
    //   });
    //   // this.$element.trigger('stuck.zf.offcanvas');
    // };
    /**
     * Closes the off-canvas menu.
     * @function
     * @param {Function} cb - optional cb to fire after closure.
     * @fires OffCanvas#closed
     */
    close(cb) {
      if (!this.$element.hasClass('is-open') || this.isRevealed) {
        return;
      }

      var _this = this;

      //  Foundation.Move(this.options.transitionTime, this.$element, function() {
      $('[data-off-canvas-wrapper]').removeClass(`is-off-canvas-open is-open-${_this.options.position}`);
      _this.$element.removeClass('is-open');
      // Foundation._reflow();
      // });
      this.$element.attr('aria-hidden', 'true')
      /**
       * Fires when the off-canvas menu opens.
       * @event OffCanvas#closed
       */
      .trigger('closed.zf.offcanvas');
      // if (_this.options.isSticky || !_this.options.forceTop) {
      //   setTimeout(function() {
      //     _this.$element[0].style.transform = '';
      //     $(window).off('scroll.zf.offcanvas');
      //   }, this.options.transitionTime);
      // }
      if (this.options.closeOnClick) {
        this.$exiter.removeClass('is-visible');
      }

      this.$triggers.attr('aria-expanded', 'false');
      if (this.options.trapFocus) {
        $('[data-off-canvas-content]').removeAttr('tabindex');
      }
    }

    /**
     * Toggles the off-canvas menu open or closed.
     * @function
     * @param {Object} event - Event object passed from listener.
     * @param {jQuery} trigger - element that triggered the off-canvas to open.
     */
    toggle(event, trigger) {
      if (this.$element.hasClass('is-open')) {
        this.close(event, trigger);
      } else {
        this.open(event, trigger);
      }
    }

    /**
     * Handles keyboard input when detected. When the escape key is pressed, the off-canvas menu closes, and focus is restored to the element that opened the menu.
     * @function
     * @private
     */
    _handleKeyboard(e) {
      Foundation.Keyboard.handleKey(e, 'OffCanvas', {
        close: () => {
          this.close();
          this.$lastTrigger.focus();
          return true;
        },
        handled: () => {
          e.stopPropagation();
          e.preventDefault();
        }
      });
    }

    /**
     * Destroys the offcanvas plugin.
     * @function
     */
    destroy() {
      this.close();
      this.$element.off('.zf.trigger .zf.offcanvas');
      this.$exiter.off('.zf.offcanvas');

      Foundation.unregisterPlugin(this);
    }
  }

  OffCanvas.defaults = {
    /**
     * Allow the user to click outside of the menu to close it.
     * @option
     * @example true
     */
    closeOnClick: true,

    /**
     * Amount of time in ms the open and close transition requires. If none selected, pulls from body style.
     * @option
     * @example 500
     */
    transitionTime: 0,

    /**
     * Direction the offcanvas opens from. Determines class applied to body.
     * @option
     * @example left
     */
    position: 'left',

    /**
     * Force the page to scroll to top on open.
     * @option
     * @example true
     */
    forceTop: true,

    /**
     * Allow the offcanvas to remain open for certain breakpoints.
     * @option
     * @example false
     */
    isRevealed: false,

    /**
     * Breakpoint at which to reveal. JS will use a RegExp to target standard classes, if changing classnames, pass your class with the `revealClass` option.
     * @option
     * @example reveal-for-large
     */
    revealOn: null,

    /**
     * Force focus to the offcanvas on open. If true, will focus the opening trigger on close. Sets tabindex of [data-off-canvas-content] to -1 for accessibility purposes.
     * @option
     * @example true
     */
    autoFocus: true,

    /**
     * Class used to force an offcanvas to remain open. Foundation defaults for this are `reveal-for-large` & `reveal-for-medium`.
     * @option
     * TODO improve the regex testing for this.
     * @example reveal-for-large
     */
    revealClass: 'reveal-for-',

    /**
     * Triggers optional focus trapping when opening an offcanvas. Sets tabindex of [data-off-canvas-content] to -1 for accessibility purposes.
     * @option
     * @example true
     */
    trapFocus: false

    // Window exports
  };Foundation.plugin(OffCanvas, 'OffCanvas');
}(jQuery);
;'use strict';

!function ($) {

  /**
   * ResponsiveMenu module.
   * @module foundation.responsiveMenu
   * @requires foundation.util.triggers
   * @requires foundation.util.mediaQuery
   * @requires foundation.util.accordionMenu
   * @requires foundation.util.drilldown
   * @requires foundation.util.dropdown-menu
   */

  class ResponsiveMenu {
    /**
     * Creates a new instance of a responsive menu.
     * @class
     * @fires ResponsiveMenu#init
     * @param {jQuery} element - jQuery object to make into a dropdown menu.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    constructor(element, options) {
      this.$element = $(element);
      this.rules = this.$element.data('responsive-menu');
      this.currentMq = null;
      this.currentPlugin = null;

      this._init();
      this._events();

      Foundation.registerPlugin(this, 'ResponsiveMenu');
    }

    /**
     * Initializes the Menu by parsing the classes from the 'data-ResponsiveMenu' attribute on the element.
     * @function
     * @private
     */
    _init() {
      // The first time an Interchange plugin is initialized, this.rules is converted from a string of "classes" to an object of rules
      if (typeof this.rules === 'string') {
        let rulesTree = {};

        // Parse rules from "classes" pulled from data attribute
        let rules = this.rules.split(' ');

        // Iterate through every rule found
        for (let i = 0; i < rules.length; i++) {
          let rule = rules[i].split('-');
          let ruleSize = rule.length > 1 ? rule[0] : 'small';
          let rulePlugin = rule.length > 1 ? rule[1] : rule[0];

          if (MenuPlugins[rulePlugin] !== null) {
            rulesTree[ruleSize] = MenuPlugins[rulePlugin];
          }
        }

        this.rules = rulesTree;
      }

      if (!$.isEmptyObject(this.rules)) {
        this._checkMediaQueries();
      }
    }

    /**
     * Initializes events for the Menu.
     * @function
     * @private
     */
    _events() {
      var _this = this;

      $(window).on('changed.zf.mediaquery', function () {
        _this._checkMediaQueries();
      });
      // $(window).on('resize.zf.ResponsiveMenu', function() {
      //   _this._checkMediaQueries();
      // });
    }

    /**
     * Checks the current screen width against available media queries. If the media query has changed, and the plugin needed has changed, the plugins will swap out.
     * @function
     * @private
     */
    _checkMediaQueries() {
      var matchedMq,
          _this = this;
      // Iterate through each rule and find the last matching rule
      $.each(this.rules, function (key) {
        if (Foundation.MediaQuery.atLeast(key)) {
          matchedMq = key;
        }
      });

      // No match? No dice
      if (!matchedMq) return;

      // Plugin already initialized? We good
      if (this.currentPlugin instanceof this.rules[matchedMq].plugin) return;

      // Remove existing plugin-specific CSS classes
      $.each(MenuPlugins, function (key, value) {
        _this.$element.removeClass(value.cssClass);
      });

      // Add the CSS class for the new plugin
      this.$element.addClass(this.rules[matchedMq].cssClass);

      // Create an instance of the new plugin
      if (this.currentPlugin) this.currentPlugin.destroy();
      this.currentPlugin = new this.rules[matchedMq].plugin(this.$element, {});
    }

    /**
     * Destroys the instance of the current plugin on this element, as well as the window resize handler that switches the plugins out.
     * @function
     */
    destroy() {
      this.currentPlugin.destroy();
      $(window).off('.zf.ResponsiveMenu');
      Foundation.unregisterPlugin(this);
    }
  }

  ResponsiveMenu.defaults = {};

  // The plugin matches the plugin classes with these plugin instances.
  var MenuPlugins = {
    dropdown: {
      cssClass: 'dropdown',
      plugin: Foundation._plugins['dropdown-menu'] || null
    },
    drilldown: {
      cssClass: 'drilldown',
      plugin: Foundation._plugins['drilldown'] || null
    },
    accordion: {
      cssClass: 'accordion-menu',
      plugin: Foundation._plugins['accordion-menu'] || null
    }
  };

  // Window exports
  Foundation.plugin(ResponsiveMenu, 'ResponsiveMenu');
}(jQuery);
;'use strict';

!function ($) {

  /**
   * ResponsiveToggle module.
   * @module foundation.responsiveToggle
   * @requires foundation.util.mediaQuery
   */

  class ResponsiveToggle {
    /**
     * Creates a new instance of Tab Bar.
     * @class
     * @fires ResponsiveToggle#init
     * @param {jQuery} element - jQuery object to attach tab bar functionality to.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    constructor(element, options) {
      this.$element = $(element);
      this.options = $.extend({}, ResponsiveToggle.defaults, this.$element.data(), options);

      this._init();
      this._events();

      Foundation.registerPlugin(this, 'ResponsiveToggle');
    }

    /**
     * Initializes the tab bar by finding the target element, toggling element, and running update().
     * @function
     * @private
     */
    _init() {
      var targetID = this.$element.data('responsive-toggle');
      if (!targetID) {
        console.error('Your tab bar needs an ID of a Menu as the value of data-tab-bar.');
      }

      this.$targetMenu = $(`#${targetID}`);
      this.$toggler = this.$element.find('[data-toggle]');

      this._update();
    }

    /**
     * Adds necessary event handlers for the tab bar to work.
     * @function
     * @private
     */
    _events() {
      var _this = this;

      this._updateMqHandler = this._update.bind(this);

      $(window).on('changed.zf.mediaquery', this._updateMqHandler);

      this.$toggler.on('click.zf.responsiveToggle', this.toggleMenu.bind(this));
    }

    /**
     * Checks the current media query to determine if the tab bar should be visible or hidden.
     * @function
     * @private
     */
    _update() {
      // Mobile
      if (!Foundation.MediaQuery.atLeast(this.options.hideFor)) {
        this.$element.show();
        this.$targetMenu.hide();
      }

      // Desktop
      else {
          this.$element.hide();
          this.$targetMenu.show();
        }
    }

    /**
     * Toggles the element attached to the tab bar. The toggle only happens if the screen is small enough to allow it.
     * @function
     * @fires ResponsiveToggle#toggled
     */
    toggleMenu() {
      if (!Foundation.MediaQuery.atLeast(this.options.hideFor)) {
        this.$targetMenu.toggle(0);

        /**
         * Fires when the element attached to the tab bar toggles.
         * @event ResponsiveToggle#toggled
         */
        this.$element.trigger('toggled.zf.responsiveToggle');
      }
    }

    destroy() {
      this.$element.off('.zf.responsiveToggle');
      this.$toggler.off('.zf.responsiveToggle');

      $(window).off('changed.zf.mediaquery', this._updateMqHandler);

      Foundation.unregisterPlugin(this);
    }
  }

  ResponsiveToggle.defaults = {
    /**
     * The breakpoint after which the menu is always shown, and the tab bar is hidden.
     * @option
     * @example 'medium'
     */
    hideFor: 'medium'
  };

  // Window exports
  Foundation.plugin(ResponsiveToggle, 'ResponsiveToggle');
}(jQuery);
;'use strict';

!function ($) {

  /**
   * Sticky module.
   * @module foundation.sticky
   * @requires foundation.util.triggers
   * @requires foundation.util.mediaQuery
   */

  class Sticky {
    /**
     * Creates a new instance of a sticky thing.
     * @class
     * @param {jQuery} element - jQuery object to make sticky.
     * @param {Object} options - options object passed when creating the element programmatically.
     */
    constructor(element, options) {
      this.$element = element;
      this.options = $.extend({}, Sticky.defaults, this.$element.data(), options);

      this._init();

      Foundation.registerPlugin(this, 'Sticky');
    }

    /**
     * Initializes the sticky element by adding classes, getting/setting dimensions, breakpoints and attributes
     * @function
     * @private
     */
    _init() {
      var $parent = this.$element.parent('[data-sticky-container]'),
          id = this.$element[0].id || Foundation.GetYoDigits(6, 'sticky'),
          _this = this;

      if (!$parent.length) {
        this.wasWrapped = true;
      }
      this.$container = $parent.length ? $parent : $(this.options.container).wrapInner(this.$element);
      this.$container.addClass(this.options.containerClass);

      this.$element.addClass(this.options.stickyClass).attr({ 'data-resize': id });

      this.scrollCount = this.options.checkEvery;
      this.isStuck = false;
      $(window).one('load.zf.sticky', function () {
        //We calculate the container height to have correct values for anchor points offset calculation.
        _this.containerHeight = _this.$element.css("display") == "none" ? 0 : _this.$element[0].getBoundingClientRect().height;
        _this.$container.css('height', _this.containerHeight);
        _this.elemHeight = _this.containerHeight;
        if (_this.options.anchor !== '') {
          _this.$anchor = $('#' + _this.options.anchor);
        } else {
          _this._parsePoints();
        }

        _this._setSizes(function () {
          _this._calc(false);
        });
        _this._events(id.split('-').reverse().join('-'));
      });
    }

    /**
     * If using multiple elements as anchors, calculates the top and bottom pixel values the sticky thing should stick and unstick on.
     * @function
     * @private
     */
    _parsePoints() {
      var top = this.options.topAnchor == "" ? 1 : this.options.topAnchor,
          btm = this.options.btmAnchor == "" ? document.documentElement.scrollHeight : this.options.btmAnchor,
          pts = [top, btm],
          breaks = {};
      for (var i = 0, len = pts.length; i < len && pts[i]; i++) {
        var pt;
        if (typeof pts[i] === 'number') {
          pt = pts[i];
        } else {
          var place = pts[i].split(':'),
              anchor = $(`#${place[0]}`);

          pt = anchor.offset().top;
          if (place[1] && place[1].toLowerCase() === 'bottom') {
            pt += anchor[0].getBoundingClientRect().height;
          }
        }
        breaks[i] = pt;
      }

      this.points = breaks;
      return;
    }

    /**
     * Adds event handlers for the scrolling element.
     * @private
     * @param {String} id - psuedo-random id for unique scroll event listener.
     */
    _events(id) {
      var _this = this,
          scrollListener = this.scrollListener = `scroll.zf.${id}`;
      if (this.isOn) {
        return;
      }
      if (this.canStick) {
        this.isOn = true;
        $(window).off(scrollListener).on(scrollListener, function (e) {
          if (_this.scrollCount === 0) {
            _this.scrollCount = _this.options.checkEvery;
            _this._setSizes(function () {
              _this._calc(false, window.pageYOffset);
            });
          } else {
            _this.scrollCount--;
            _this._calc(false, window.pageYOffset);
          }
        });
      }

      this.$element.off('resizeme.zf.trigger').on('resizeme.zf.trigger', function (e, el) {
        _this._setSizes(function () {
          _this._calc(false);
          if (_this.canStick) {
            if (!_this.isOn) {
              _this._events(id);
            }
          } else if (_this.isOn) {
            _this._pauseListeners(scrollListener);
          }
        });
      });
    }

    /**
     * Removes event handlers for scroll and change events on anchor.
     * @fires Sticky#pause
     * @param {String} scrollListener - unique, namespaced scroll listener attached to `window`
     */
    _pauseListeners(scrollListener) {
      this.isOn = false;
      $(window).off(scrollListener);

      /**
       * Fires when the plugin is paused due to resize event shrinking the view.
       * @event Sticky#pause
       * @private
       */
      this.$element.trigger('pause.zf.sticky');
    }

    /**
     * Called on every `scroll` event and on `_init`
     * fires functions based on booleans and cached values
     * @param {Boolean} checkSizes - true if plugin should recalculate sizes and breakpoints.
     * @param {Number} scroll - current scroll position passed from scroll event cb function. If not passed, defaults to `window.pageYOffset`.
     */
    _calc(checkSizes, scroll) {
      if (checkSizes) {
        this._setSizes();
      }

      if (!this.canStick) {
        if (this.isStuck) {
          this._removeSticky(true);
        }
        return false;
      }

      if (!scroll) {
        scroll = window.pageYOffset;
      }

      if (scroll >= this.topPoint) {
        if (scroll <= this.bottomPoint) {
          if (!this.isStuck) {
            this._setSticky();
          }
        } else {
          if (this.isStuck) {
            this._removeSticky(false);
          }
        }
      } else {
        if (this.isStuck) {
          this._removeSticky(true);
        }
      }
    }

    /**
     * Causes the $element to become stuck.
     * Adds `position: fixed;`, and helper classes.
     * @fires Sticky#stuckto
     * @function
     * @private
     */
    _setSticky() {
      var _this = this,
          stickTo = this.options.stickTo,
          mrgn = stickTo === 'top' ? 'marginTop' : 'marginBottom',
          notStuckTo = stickTo === 'top' ? 'bottom' : 'top',
          css = {};

      css[mrgn] = `${this.options[mrgn]}em`;
      css[stickTo] = 0;
      css[notStuckTo] = 'auto';
      css['left'] = this.$container.offset().left + parseInt(window.getComputedStyle(this.$container[0])["padding-left"], 10);
      this.isStuck = true;
      this.$element.removeClass(`is-anchored is-at-${notStuckTo}`).addClass(`is-stuck is-at-${stickTo}`).css(css)
      /**
       * Fires when the $element has become `position: fixed;`
       * Namespaced to `top` or `bottom`, e.g. `sticky.zf.stuckto:top`
       * @event Sticky#stuckto
       */
      .trigger(`sticky.zf.stuckto:${stickTo}`);
      this.$element.on("transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd", function () {
        _this._setSizes();
      });
    }

    /**
     * Causes the $element to become unstuck.
     * Removes `position: fixed;`, and helper classes.
     * Adds other helper classes.
     * @param {Boolean} isTop - tells the function if the $element should anchor to the top or bottom of its $anchor element.
     * @fires Sticky#unstuckfrom
     * @private
     */
    _removeSticky(isTop) {
      var stickTo = this.options.stickTo,
          stickToTop = stickTo === 'top',
          css = {},
          anchorPt = (this.points ? this.points[1] - this.points[0] : this.anchorHeight) - this.elemHeight,
          mrgn = stickToTop ? 'marginTop' : 'marginBottom',
          notStuckTo = stickToTop ? 'bottom' : 'top',
          topOrBottom = isTop ? 'top' : 'bottom';

      css[mrgn] = 0;

      css['bottom'] = 'auto';
      if (isTop) {
        css['top'] = 0;
      } else {
        css['top'] = anchorPt;
      }

      css['left'] = '';
      this.isStuck = false;
      this.$element.removeClass(`is-stuck is-at-${stickTo}`).addClass(`is-anchored is-at-${topOrBottom}`).css(css)
      /**
       * Fires when the $element has become anchored.
       * Namespaced to `top` or `bottom`, e.g. `sticky.zf.unstuckfrom:bottom`
       * @event Sticky#unstuckfrom
       */
      .trigger(`sticky.zf.unstuckfrom:${topOrBottom}`);
    }

    /**
     * Sets the $element and $container sizes for plugin.
     * Calls `_setBreakPoints`.
     * @param {Function} cb - optional callback function to fire on completion of `_setBreakPoints`.
     * @private
     */
    _setSizes(cb) {
      this.canStick = Foundation.MediaQuery.atLeast(this.options.stickyOn);
      if (!this.canStick) {
        if (cb && typeof cb === 'function') {
          cb();
        }
      }
      var _this = this,
          newElemWidth = this.$container[0].getBoundingClientRect().width,
          comp = window.getComputedStyle(this.$container[0]),
          pdng = parseInt(comp['padding-right'], 10);

      if (this.$anchor && this.$anchor.length) {
        this.anchorHeight = this.$anchor[0].getBoundingClientRect().height;
      } else {
        this._parsePoints();
      }

      this.$element.css({
        'max-width': `${newElemWidth - pdng}px`
      });

      var newContainerHeight = this.$element[0].getBoundingClientRect().height || this.containerHeight;
      if (this.$element.css("display") == "none") {
        newContainerHeight = 0;
      }
      this.containerHeight = newContainerHeight;
      this.$container.css({
        height: newContainerHeight
      });
      this.elemHeight = newContainerHeight;

      if (this.isStuck) {
        this.$element.css({ "left": this.$container.offset().left + parseInt(comp['padding-left'], 10) });
      } else {
        if (this.$element.hasClass('is-at-bottom')) {
          var anchorPt = (this.points ? this.points[1] - this.$container.offset().top : this.anchorHeight) - this.elemHeight;
          this.$element.css('top', anchorPt);
        }
      }

      this._setBreakPoints(newContainerHeight, function () {
        if (cb && typeof cb === 'function') {
          cb();
        }
      });
    }

    /**
     * Sets the upper and lower breakpoints for the element to become sticky/unsticky.
     * @param {Number} elemHeight - px value for sticky.$element height, calculated by `_setSizes`.
     * @param {Function} cb - optional callback function to be called on completion.
     * @private
     */
    _setBreakPoints(elemHeight, cb) {
      if (!this.canStick) {
        if (cb && typeof cb === 'function') {
          cb();
        } else {
          return false;
        }
      }
      var mTop = emCalc(this.options.marginTop),
          mBtm = emCalc(this.options.marginBottom),
          topPoint = this.points ? this.points[0] : this.$anchor.offset().top,
          bottomPoint = this.points ? this.points[1] : topPoint + this.anchorHeight,

      // topPoint = this.$anchor.offset().top || this.points[0],
      // bottomPoint = topPoint + this.anchorHeight || this.points[1],
      winHeight = window.innerHeight;

      if (this.options.stickTo === 'top') {
        topPoint -= mTop;
        bottomPoint -= elemHeight + mTop;
      } else if (this.options.stickTo === 'bottom') {
        topPoint -= winHeight - (elemHeight + mBtm);
        bottomPoint -= winHeight - mBtm;
      } else {
        //this would be the stickTo: both option... tricky
      }

      this.topPoint = topPoint;
      this.bottomPoint = bottomPoint;

      if (cb && typeof cb === 'function') {
        cb();
      }
    }

    /**
     * Destroys the current sticky element.
     * Resets the element to the top position first.
     * Removes event listeners, JS-added css properties and classes, and unwraps the $element if the JS added the $container.
     * @function
     */
    destroy() {
      this._removeSticky(true);

      this.$element.removeClass(`${this.options.stickyClass} is-anchored is-at-top`).css({
        height: '',
        top: '',
        bottom: '',
        'max-width': ''
      }).off('resizeme.zf.trigger');
      if (this.$anchor && this.$anchor.length) {
        this.$anchor.off('change.zf.sticky');
      }
      $(window).off(this.scrollListener);

      if (this.wasWrapped) {
        this.$element.unwrap();
      } else {
        this.$container.removeClass(this.options.containerClass).css({
          height: ''
        });
      }
      Foundation.unregisterPlugin(this);
    }
  }

  Sticky.defaults = {
    /**
     * Customizable container template. Add your own classes for styling and sizing.
     * @option
     * @example '&lt;div data-sticky-container class="small-6 columns"&gt;&lt;/div&gt;'
     */
    container: '<div data-sticky-container></div>',
    /**
     * Location in the view the element sticks to.
     * @option
     * @example 'top'
     */
    stickTo: 'top',
    /**
     * If anchored to a single element, the id of that element.
     * @option
     * @example 'exampleId'
     */
    anchor: '',
    /**
     * If using more than one element as anchor points, the id of the top anchor.
     * @option
     * @example 'exampleId:top'
     */
    topAnchor: '',
    /**
     * If using more than one element as anchor points, the id of the bottom anchor.
     * @option
     * @example 'exampleId:bottom'
     */
    btmAnchor: '',
    /**
     * Margin, in `em`'s to apply to the top of the element when it becomes sticky.
     * @option
     * @example 1
     */
    marginTop: 1,
    /**
     * Margin, in `em`'s to apply to the bottom of the element when it becomes sticky.
     * @option
     * @example 1
     */
    marginBottom: 1,
    /**
     * Breakpoint string that is the minimum screen size an element should become sticky.
     * @option
     * @example 'medium'
     */
    stickyOn: 'medium',
    /**
     * Class applied to sticky element, and removed on destruction. Foundation defaults to `sticky`.
     * @option
     * @example 'sticky'
     */
    stickyClass: 'sticky',
    /**
     * Class applied to sticky container. Foundation defaults to `sticky-container`.
     * @option
     * @example 'sticky-container'
     */
    containerClass: 'sticky-container',
    /**
     * Number of scroll events between the plugin's recalculating sticky points. Setting it to `0` will cause it to recalc every scroll event, setting it to `-1` will prevent recalc on scroll.
     * @option
     * @example 50
     */
    checkEvery: -1
  };

  /**
   * Helper function to calculate em values
   * @param Number {em} - number of em's to calculate into pixels
   */
  function emCalc(em) {
    return parseInt(window.getComputedStyle(document.body, null).fontSize, 10) * em;
  }

  // Window exports
  Foundation.plugin(Sticky, 'Sticky');
}(jQuery);
;'use strict';

!function ($) {

  /**
   * Toggler module.
   * @module foundation.toggler
   * @requires foundation.util.motion
   * @requires foundation.util.triggers
   */

  class Toggler {
    /**
     * Creates a new instance of Toggler.
     * @class
     * @fires Toggler#init
     * @param {Object} element - jQuery object to add the trigger to.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    constructor(element, options) {
      this.$element = element;
      this.options = $.extend({}, Toggler.defaults, element.data(), options);
      this.className = '';

      this._init();
      this._events();

      Foundation.registerPlugin(this, 'Toggler');
    }

    /**
     * Initializes the Toggler plugin by parsing the toggle class from data-toggler, or animation classes from data-animate.
     * @function
     * @private
     */
    _init() {
      var input;
      // Parse animation classes if they were set
      if (this.options.animate) {
        input = this.options.animate.split(' ');

        this.animationIn = input[0];
        this.animationOut = input[1] || null;
      }
      // Otherwise, parse toggle class
      else {
          input = this.$element.data('toggler');
          // Allow for a . at the beginning of the string
          this.className = input[0] === '.' ? input.slice(1) : input;
        }

      // Add ARIA attributes to triggers
      var id = this.$element[0].id;
      $(`[data-open="${id}"], [data-close="${id}"], [data-toggle="${id}"]`).attr('aria-controls', id);
      // If the target is hidden, add aria-hidden
      this.$element.attr('aria-expanded', this.$element.is(':hidden') ? false : true);
    }

    /**
     * Initializes events for the toggle trigger.
     * @function
     * @private
     */
    _events() {
      this.$element.off('toggle.zf.trigger').on('toggle.zf.trigger', this.toggle.bind(this));
    }

    /**
     * Toggles the target class on the target element. An event is fired from the original trigger depending on if the resultant state was "on" or "off".
     * @function
     * @fires Toggler#on
     * @fires Toggler#off
     */
    toggle() {
      this[this.options.animate ? '_toggleAnimate' : '_toggleClass']();
    }

    _toggleClass() {
      this.$element.toggleClass(this.className);

      var isOn = this.$element.hasClass(this.className);
      if (isOn) {
        /**
         * Fires if the target element has the class after a toggle.
         * @event Toggler#on
         */
        this.$element.trigger('on.zf.toggler');
      } else {
        /**
         * Fires if the target element does not have the class after a toggle.
         * @event Toggler#off
         */
        this.$element.trigger('off.zf.toggler');
      }

      this._updateARIA(isOn);
    }

    _toggleAnimate() {
      var _this = this;

      if (this.$element.is(':hidden')) {
        Foundation.Motion.animateIn(this.$element, this.animationIn, function () {
          _this._updateARIA(true);
          this.trigger('on.zf.toggler');
        });
      } else {
        Foundation.Motion.animateOut(this.$element, this.animationOut, function () {
          _this._updateARIA(false);
          this.trigger('off.zf.toggler');
        });
      }
    }

    _updateARIA(isOn) {
      this.$element.attr('aria-expanded', isOn ? true : false);
    }

    /**
     * Destroys the instance of Toggler on the element.
     * @function
     */
    destroy() {
      this.$element.off('.zf.toggler');
      Foundation.unregisterPlugin(this);
    }
  }

  Toggler.defaults = {
    /**
     * Tells the plugin if the element should animated when toggled.
     * @option
     * @example false
     */
    animate: false
  };

  // Window exports
  Foundation.plugin(Toggler, 'Toggler');
}(jQuery);
;'use strict';

// Polyfill for requestAnimationFrame

(function () {
  if (!Date.now) Date.now = function () {
    return new Date().getTime();
  };

  var vendors = ['webkit', 'moz'];
  for (var i = 0; i < vendors.length && !window.requestAnimationFrame; ++i) {
    var vp = vendors[i];
    window.requestAnimationFrame = window[vp + 'RequestAnimationFrame'];
    window.cancelAnimationFrame = window[vp + 'CancelAnimationFrame'] || window[vp + 'CancelRequestAnimationFrame'];
  }
  if (/iP(ad|hone|od).*OS 6/.test(window.navigator.userAgent) || !window.requestAnimationFrame || !window.cancelAnimationFrame) {
    var lastTime = 0;
    window.requestAnimationFrame = function (callback) {
      var now = Date.now();
      var nextTime = Math.max(lastTime + 16, now);
      return setTimeout(function () {
        callback(lastTime = nextTime);
      }, nextTime - now);
    };
    window.cancelAnimationFrame = clearTimeout;
  }
})();

var initClasses = ['mui-enter', 'mui-leave'];
var activeClasses = ['mui-enter-active', 'mui-leave-active'];

// Find the right "transitionend" event for this browser
var endEvent = function () {
  var transitions = {
    'transition': 'transitionend',
    'WebkitTransition': 'webkitTransitionEnd',
    'MozTransition': 'transitionend',
    'OTransition': 'otransitionend'
  };
  var elem = window.document.createElement('div');

  for (var t in transitions) {
    if (typeof elem.style[t] !== 'undefined') {
      return transitions[t];
    }
  }

  return null;
}();

function animate(isIn, element, animation, cb) {
  element = $(element).eq(0);

  if (!element.length) return;

  if (endEvent === null) {
    isIn ? element.show() : element.hide();
    cb();
    return;
  }

  var initClass = isIn ? initClasses[0] : initClasses[1];
  var activeClass = isIn ? activeClasses[0] : activeClasses[1];

  // Set up the animation
  reset();
  element.addClass(animation);
  element.css('transition', 'none');
  requestAnimationFrame(function () {
    element.addClass(initClass);
    if (isIn) element.show();
  });

  // Start the animation
  requestAnimationFrame(function () {
    element[0].offsetWidth;
    element.css('transition', '');
    element.addClass(activeClass);
  });

  // Clean up the animation when it finishes
  element.one('transitionend', finish);

  // Hides the element (for out animations), resets the element, and runs a callback
  function finish() {
    if (!isIn) element.hide();
    reset();
    if (cb) cb.apply(element);
  }

  // Resets transitions and removes motion-specific classes
  function reset() {
    element[0].style.transitionDuration = 0;
    element.removeClass(initClass + ' ' + activeClass + ' ' + animation);
  }
}

var MotionUI = {
  animateIn: function (element, animation, cb) {
    animate(true, element, animation, cb);
  },

  animateOut: function (element, animation, cb) {
    animate(false, element, animation, cb);
  }
};
;/* =========================================================
 * foundation-datepicker.js
 * Copyright 2015 Peter Beno, najlepsiwebdesigner@gmail.com, @benopeter
 * project website http://foundation-datepicker.peterbeno.com
 * ========================================================= */
!function ($) {

    function UTCDate() {
        return new Date(Date.UTC.apply(Date, arguments));
    }

    function UTCToday() {
        var today = new Date();
        return UTCDate(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    }

    var Datepicker = function (element, options) {
        var that = this;

        this.element = $(element);
        this.autoShow = options.autoShow == undefined ? true : options.autoShow;
        this.appendTo = options.appendTo || 'body';
        this.closeButton = options.closeButton;
        this.language = options.language || this.element.data('date-language') || "en";
        this.language = this.language in dates ? this.language : this.language.split('-')[0]; //Check if "de-DE" style date is available, if not language should fallback to 2 letter code eg "de"
        this.language = this.language in dates ? this.language : "en";
        this.isRTL = dates[this.language].rtl || false;
        this.format = DPGlobal.parseFormat(options.format || this.element.data('date-format') || dates[this.language].format || 'mm/dd/yyyy');
        this.formatText = options.format || this.element.data('date-format') || dates[this.language].format || 'mm/dd/yyyy';
        this.isInline = false;
        this.isInput = this.element.is('input');
        this.component = this.element.is('.date') ? this.element.find('.prefix, .postfix') : false;
        this.hasInput = this.component && this.element.find('input').length;
        this.disableDblClickSelection = options.disableDblClickSelection;
        this.onRender = options.onRender || function () {};
        if (this.component && this.component.length === 0) {
            this.component = false;
        }
        this.linkField = options.linkField || this.element.data('link-field') || false;
        this.linkFormat = DPGlobal.parseFormat(options.linkFormat || this.element.data('link-format') || 'yyyy-mm-dd hh:ii:ss');
        this.minuteStep = options.minuteStep || this.element.data('minute-step') || 5;
        this.pickerPosition = options.pickerPosition || this.element.data('picker-position') || 'bottom-right';
        this.initialDate = options.initialDate || null;
        this.faCSSprefix = options.faCSSprefix || 'fa';
        this.leftArrow = options.leftArrow || '<i class="' + this.faCSSprefix + ' ' + this.faCSSprefix + '-chevron-left fi-arrow-left"/>';
        this.rightArrow = options.rightArrow || '<i class="' + this.faCSSprefix + ' ' + this.faCSSprefix + '-chevron-right fi-arrow-right"/>';
        this.closeIcon = options.closeIcon || '<i class="' + this.faCSSprefix + ' ' + this.faCSSprefix + '-remove ' + this.faCSSprefix + '-times fi-x"></i>';

        this.minView = 0;
        if ('minView' in options) {
            this.minView = options.minView;
        } else if ('minView' in this.element.data()) {
            this.minView = this.element.data('min-view');
        }
        this.minView = DPGlobal.convertViewMode(this.minView);

        this.maxView = DPGlobal.modes.length - 1;
        if ('maxView' in options) {
            this.maxView = options.maxView;
        } else if ('maxView' in this.element.data()) {
            this.maxView = this.element.data('max-view');
        }
        this.maxView = DPGlobal.convertViewMode(this.maxView);

        this.startViewMode = 'month';
        if ('startView' in options) {
            this.startViewMode = options.startView;
        } else if ('startView' in this.element.data()) {
            this.startViewMode = this.element.data('start-view');
        }
        this.startViewMode = DPGlobal.convertViewMode(this.startViewMode);
        this.viewMode = this.startViewMode;

        if (!('minView' in options) && !('maxView' in options) && !this.element.data('min-view') && !this.element.data('max-view')) {
            this.pickTime = false;
            if ('pickTime' in options) {
                this.pickTime = options.pickTime;
            }
            if (this.pickTime == true) {
                this.minView = 0;
                this.maxView = 4;
            } else {
                this.minView = 2;
                this.maxView = 4;
            }
        }

        this.forceParse = true;
        if ('forceParse' in options) {
            this.forceParse = options.forceParse;
        } else if ('dateForceParse' in this.element.data()) {
            this.forceParse = this.element.data('date-force-parse');
        }

        this.picker = $(DPGlobal.template(this.leftArrow, this.rightArrow, this.closeIcon)).appendTo(this.isInline ? this.element : this.appendTo).on({
            click: $.proxy(this.click, this),
            mousedown: $.proxy(this.mousedown, this)
        });
        if (this.closeButton) {
            this.picker.find('a.datepicker-close').show();
        } else {
            this.picker.find('a.datepicker-close').hide();
        }

        if (this.isInline) {
            this.picker.addClass('datepicker-inline');
        } else {
            this.picker.addClass('datepicker-dropdown dropdown-menu');
        }
        if (this.isRTL) {
            this.picker.addClass('datepicker-rtl');

            this.picker.find('.date-switch').each(function () {
                $(this).parent().prepend($(this).siblings('.next'));
                $(this).parent().append($(this).siblings('.prev'));
            });
            this.picker.find('.prev, .next').toggleClass('prev next');
        }
        $(document).on('mousedown', function (e) {
            if (that.isInput && e.target === that.element[0]) {
                return;
            }

            // Clicked outside the datepicker, hide it
            if ($(e.target).closest('.datepicker.datepicker-inline, .datepicker.datepicker-dropdown').length === 0) {
                that.hide();
            }
        });

        this.autoclose = true;
        if ('autoclose' in options) {
            this.autoclose = options.autoclose;
        } else if ('dateAutoclose' in this.element.data()) {
            this.autoclose = this.element.data('date-autoclose');
        }

        this.keyboardNavigation = true;
        if ('keyboardNavigation' in options) {
            this.keyboardNavigation = options.keyboardNavigation;
        } else if ('dateKeyboardNavigation' in this.element.data()) {
            this.keyboardNavigation = this.element.data('date-keyboard-navigation');
        }

        this.todayBtn = options.todayBtn || this.element.data('date-today-btn') || false;
        this.todayHighlight = options.todayHighlight || this.element.data('date-today-highlight') || false;

        this.calendarWeeks = false;
        if ('calendarWeeks' in options) {
            this.calendarWeeks = options.calendarWeeks;
        } else if ('dateCalendarWeeks' in this.element.data()) {
            this.calendarWeeks = this.element.data('date-calendar-weeks');
        }
        if (this.calendarWeeks) this.picker.find('tfoot th.today').attr('colspan', function (i, val) {
            return parseInt(val) + 1;
        });

        this.weekStart = (options.weekStart || this.element.data('date-weekstart') || dates[this.language].weekStart || 0) % 7;
        this.weekEnd = (this.weekStart + 6) % 7;
        this.startDate = -Infinity;
        this.endDate = Infinity;
        this.daysOfWeekDisabled = [];
        this.datesDisabled = [];
        this.setStartDate(options.startDate || this.element.data('date-startdate'));
        this.setEndDate(options.endDate || this.element.data('date-enddate'));
        this.setDaysOfWeekDisabled(options.daysOfWeekDisabled || this.element.data('date-days-of-week-disabled'));
        this.setDatesDisabled(options.datesDisabled || this.element.data('dates-disabled'));

        this.fillDow();
        this.fillMonths();
        this.update();

        this.showMode();

        if (this.isInline) {
            this.show();
        }

        this._attachEvents();
    };

    Datepicker.prototype = {
        constructor: Datepicker,

        _events: [],
        _attachEvents: function () {
            this._detachEvents();
            if (this.isInput) {
                // single input
                if (!this.keyboardNavigation) {
                    this._events = [[this.element, {
                        focus: this.autoShow ? $.proxy(this.show, this) : function () {}
                    }]];
                } else {
                    this._events = [[this.element, {
                        focus: this.autoShow ? $.proxy(this.show, this) : function () {},
                        keyup: $.proxy(this.update, this),
                        keydown: $.proxy(this.keydown, this),
                        click: this.element.attr('readonly') ? $.proxy(this.show, this) : function () {}
                    }]];
                }
            } else if (this.component && this.hasInput) {
                // component: input + button
                this._events = [
                // For components that are not readonly, allow keyboard nav
                [this.element.find('input'), {
                    focus: this.autoShow ? $.proxy(this.show, this) : function () {},
                    keyup: $.proxy(this.update, this),
                    keydown: $.proxy(this.keydown, this)
                }], [this.component, {
                    click: $.proxy(this.show, this)
                }]];
            } else if (this.element.is('div')) {
                // inline datepicker
                this.isInline = true;
            } else {
                this._events = [[this.element, {
                    click: $.proxy(this.show, this)
                }]];
            }

            if (this.disableDblClickSelection) {
                this._events[this._events.length] = [this.element, {
                    dblclick: function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        $(this).blur();
                    }
                }];
            }

            for (var i = 0, el, ev; i < this._events.length; i++) {
                el = this._events[i][0];
                ev = this._events[i][1];
                el.on(ev);
            }
        },
        _detachEvents: function () {
            for (var i = 0, el, ev; i < this._events.length; i++) {
                el = this._events[i][0];
                ev = this._events[i][1];
                el.off(ev);
            }
            this._events = [];
        },

        show: function (e) {
            this.picker.show();
            this.height = this.component ? this.component.outerHeight() : this.element.outerHeight();
            this.update();
            this.place();
            $(window).on('resize', $.proxy(this.place, this));
            if (e) {
                e.stopPropagation();
                e.preventDefault();
            }
            this.element.trigger({
                type: 'show',
                date: this.date
            });
        },

        hide: function (e) {
            if (this.isInline) return;
            if (!this.picker.is(':visible')) return;
            this.picker.hide();
            $(window).off('resize', this.place);
            this.viewMode = this.startViewMode;
            this.showMode();
            if (!this.isInput) {
                $(document).off('mousedown', this.hide);
            }

            if (this.forceParse && (this.isInput && this.element.val() || this.hasInput && this.element.find('input').val())) this.setValue();
            this.element.trigger({
                type: 'hide',
                date: this.date
            });
        },

        remove: function () {
            this._detachEvents();
            this.picker.remove();
            delete this.element.data().datepicker;
        },

        getDate: function () {
            var d = this.getUTCDate();
            return new Date(d.getTime() + d.getTimezoneOffset() * 60000);
        },

        getUTCDate: function () {
            return this.date;
        },

        setDate: function (d) {
            this.setUTCDate(new Date(d.getTime() - d.getTimezoneOffset() * 60000));
        },

        setUTCDate: function (d) {
            this.date = d;
            this.setValue();
        },

        setValue: function () {
            var formatted = this.getFormattedDate();
            if (!this.isInput) {
                if (this.component) {
                    this.element.find('input').val(formatted);
                }
                this.element.data('date', formatted);
            } else {
                this.element.val(formatted);
            }
        },

        getFormattedDate: function (format) {
            if (format === undefined) format = this.format;
            return DPGlobal.formatDate(this.date, format, this.language);
        },

        setStartDate: function (startDate) {
            this.startDate = startDate || -Infinity;
            if (this.startDate !== -Infinity) {
                this.startDate = DPGlobal.parseDate(this.startDate, this.format, this.language);
            }
            this.update();
            this.updateNavArrows();
        },

        setEndDate: function (endDate) {
            this.endDate = endDate || Infinity;
            if (this.endDate !== Infinity) {
                this.endDate = DPGlobal.parseDate(this.endDate, this.format, this.language);
            }
            this.update();
            this.updateNavArrows();
        },

        setDaysOfWeekDisabled: function (daysOfWeekDisabled) {
            this.daysOfWeekDisabled = daysOfWeekDisabled || [];
            if (!$.isArray(this.daysOfWeekDisabled)) {
                this.daysOfWeekDisabled = this.daysOfWeekDisabled.split(/,\s*/);
            }
            this.daysOfWeekDisabled = $.map(this.daysOfWeekDisabled, function (d) {
                return parseInt(d, 10);
            });
            this.update();
            this.updateNavArrows();
        },

        setDatesDisabled: function (datesDisabled) {
            this.datesDisabled = datesDisabled || [];
            if (!$.isArray(this.datesDisabled)) {
                this.datesDisabled = this.datesDisabled.split(/,\s*/);
            }
            this.datesDisabled = $.map(this.datesDisabled, function (d) {
                return DPGlobal.parseDate(d, this.format, this.language).valueOf();
            });
            this.update();
            this.updateNavArrows();
        },

        place: function () {
            if (this.isInline) return;
            var zIndex = parseInt(this.element.parents().filter(function () {
                return $(this).css('z-index') != 'auto';
            }).first().css('z-index')) + 10;
            var textbox = this.component ? this.component : this.element;
            var offset = textbox.offset();
            var height = textbox.outerHeight() + parseInt(textbox.css('margin-top'));
            var width = textbox.outerWidth() + parseInt(textbox.css('margin-left'));
            var fullOffsetTop = offset.top + height;
            var offsetLeft = offset.left;
            this.picker.removeClass('datepicker-top datepicker-bottom');
            // if the datepicker is going to be below the window, show it on top of the input
            if (fullOffsetTop + this.picker.outerHeight() >= $(window).scrollTop() + $(window).height()) {
                fullOffsetTop = offset.top - this.picker.outerHeight();
                this.picker.addClass('datepicker-top');
            } else {
                this.picker.addClass('datepicker-bottom');
            }

            // if the datepicker is going to go past the right side of the window, we want
            // to set the right position so the datepicker lines up with the textbox
            if (offset.left + this.picker.width() >= $(window).width()) {
                offsetLeft = offset.left + width - this.picker.width();
            }
            this.picker.css({
                top: fullOffsetTop,
                left: offsetLeft,
                zIndex: zIndex
            });
        },

        update: function () {
            var date,
                fromArgs = false;
            var currentVal = this.isInput ? this.element.val() : this.element.data('date') || this.element.find('input').val();
            if (arguments && arguments.length && (typeof arguments[0] === 'string' || arguments[0] instanceof Date)) {
                date = arguments[0];
                fromArgs = true;
            } else if (!currentVal && this.initialDate != null) {
                // If value is not set, set it to the initialDate 
                date = this.initialDate;
            } else {
                date = this.isInput ? this.element.val() : this.element.data('date') || this.element.find('input').val();
            }

            if (date && date.length > this.formatText.length) {
                $(this.picker).addClass('is-invalid');
                $(this.element).addClass('is-invalid-input');
                return;
            } else {
                $(this.picker).removeClass('is-invalid');
                $(this.element).removeClass('is-invalid-input');
            }

            this.date = DPGlobal.parseDate(date, this.format, this.language);

            if (fromArgs || this.initialDate != null) this.setValue();

            if (this.date < this.startDate) {
                this.viewDate = new Date(this.startDate.valueOf());
            } else if (this.date > this.endDate) {
                this.viewDate = new Date(this.endDate.valueOf());
            } else {
                this.viewDate = new Date(this.date.valueOf());
            }
            this.fill();
        },

        fillDow: function () {
            var dowCnt = this.weekStart,
                html = '<tr>';
            if (this.calendarWeeks) {
                var cell = '<th class="cw">&nbsp;</th>';
                html += cell;
                this.picker.find('.datepicker-days thead tr:first-child').prepend(cell);
            }
            while (dowCnt < this.weekStart + 7) {
                html += '<th class="dow">' + dates[this.language].daysMin[dowCnt++ % 7] + '</th>';
            }
            html += '</tr>';
            this.picker.find('.datepicker-days thead').append(html);
        },

        fillMonths: function () {
            var html = '',
                i = 0;
            while (i < 12) {
                html += '<span class="month">' + dates[this.language].monthsShort[i++] + '</span>';
            }
            this.picker.find('.datepicker-months td').html(html);
        },

        fill: function () {
            if (this.date == null || this.viewDate == null) {
                return;
            }

            var d = new Date(this.viewDate.valueOf()),
                year = d.getUTCFullYear(),
                month = d.getUTCMonth(),
                dayMonth = d.getUTCDate(),
                hours = d.getUTCHours(),
                minutes = d.getUTCMinutes(),
                startYear = this.startDate !== -Infinity ? this.startDate.getUTCFullYear() : -Infinity,
                startMonth = this.startDate !== -Infinity ? this.startDate.getUTCMonth() : -Infinity,
                endYear = this.endDate !== Infinity ? this.endDate.getUTCFullYear() : Infinity,
                endMonth = this.endDate !== Infinity ? this.endDate.getUTCMonth() : Infinity,
                currentDate = this.date && UTCDate(this.date.getUTCFullYear(), this.date.getUTCMonth(), this.date.getUTCDate()).valueOf(),
                today = new Date(),
                titleFormat = dates[this.language].titleFormat || dates['en'].titleFormat;
            // this.picker.find('.datepicker-days thead th.date-switch')
            // 			.text(DPGlobal.formatDate(new UTCDate(year, month), titleFormat, this.language));

            this.picker.find('.datepicker-days thead th:eq(1)').text(dates[this.language].months[month] + ' ' + year);
            this.picker.find('.datepicker-hours thead th:eq(1)').text(dayMonth + ' ' + dates[this.language].months[month] + ' ' + year);
            this.picker.find('.datepicker-minutes thead th:eq(1)').text(dayMonth + ' ' + dates[this.language].months[month] + ' ' + year);

            this.picker.find('tfoot th.today').text(dates[this.language].today).toggle(this.todayBtn !== false);
            this.updateNavArrows();
            this.fillMonths();
            var prevMonth = UTCDate(year, month - 1, 28, 0, 0, 0, 0),
                day = DPGlobal.getDaysInMonth(prevMonth.getUTCFullYear(), prevMonth.getUTCMonth());
            prevMonth.setUTCDate(day);
            prevMonth.setUTCDate(day - (prevMonth.getUTCDay() - this.weekStart + 7) % 7);
            var nextMonth = new Date(prevMonth.valueOf());
            nextMonth.setUTCDate(nextMonth.getUTCDate() + 42);
            nextMonth = nextMonth.valueOf();
            var html = [];
            var clsName;
            while (prevMonth.valueOf() < nextMonth) {
                if (prevMonth.getUTCDay() == this.weekStart) {
                    html.push('<tr>');
                    if (this.calendarWeeks) {
                        // adapted from https://github.com/timrwood/moment/blob/master/moment.js#L128
                        var a = new Date(prevMonth.getUTCFullYear(), prevMonth.getUTCMonth(), prevMonth.getUTCDate() - prevMonth.getDay() + 10 - (this.weekStart && this.weekStart % 7 < 5 && 7)),
                            b = new Date(a.getFullYear(), 0, 4),
                            calWeek = ~~((a - b) / 864e5 / 7 + 1.5);
                        html.push('<td class="cw">' + calWeek + '</td>');
                    }
                }
                clsName = ' ' + this.onRender(prevMonth) + ' ';
                if (prevMonth.getUTCFullYear() < year || prevMonth.getUTCFullYear() == year && prevMonth.getUTCMonth() < month) {
                    clsName += ' old';
                } else if (prevMonth.getUTCFullYear() > year || prevMonth.getUTCFullYear() == year && prevMonth.getUTCMonth() > month) {
                    clsName += ' new';
                }
                // Compare internal UTC date with local today, not UTC today
                if (this.todayHighlight && prevMonth.getUTCFullYear() == today.getFullYear() && prevMonth.getUTCMonth() == today.getMonth() && prevMonth.getUTCDate() == today.getDate()) {
                    clsName += ' today';
                }
                if (currentDate && prevMonth.valueOf() == currentDate) {
                    clsName += ' active';
                }
                if (prevMonth.valueOf() < this.startDate || prevMonth.valueOf() > this.endDate || $.inArray(prevMonth.getUTCDay(), this.daysOfWeekDisabled) !== -1 || $.inArray(prevMonth.valueOf(), this.datesDisabled) !== -1) {
                    clsName += ' disabled';
                }
                html.push('<td class="day' + clsName + '">' + prevMonth.getUTCDate() + '</td>');
                if (prevMonth.getUTCDay() == this.weekEnd) {
                    html.push('</tr>');
                }
                prevMonth.setUTCDate(prevMonth.getUTCDate() + 1);
            }
            this.picker.find('.datepicker-days tbody').empty().append(html.join(''));

            html = [];
            for (var i = 0; i < 24; i++) {
                var actual = UTCDate(year, month, dayMonth, i);
                clsName = '';
                // We want the previous hour for the startDate
                if (actual.valueOf() + 3600000 < this.startDate || actual.valueOf() > this.endDate) {
                    clsName += ' disabled';
                } else if (hours == i) {
                    clsName += ' active';
                }
                html.push('<span class="hour' + clsName + '">' + i + ':00</span>');
            }
            this.picker.find('.datepicker-hours td').html(html.join(''));

            html = [];
            for (var i = 0; i < 60; i += this.minuteStep) {
                var actual = UTCDate(year, month, dayMonth, hours, i);
                clsName = '';
                if (actual.valueOf() < this.startDate || actual.valueOf() > this.endDate) {
                    clsName += ' disabled';
                } else if (Math.floor(minutes / this.minuteStep) == Math.floor(i / this.minuteStep)) {
                    clsName += ' active';
                }
                html.push('<span class="minute' + clsName + '">' + hours + ':' + (i < 10 ? '0' + i : i) + '</span>');
            }
            this.picker.find('.datepicker-minutes td').html(html.join(''));

            var currentYear = this.date && this.date.getUTCFullYear();
            var months = this.picker.find('.datepicker-months').find('th:eq(1)').text(year).end().find('span').removeClass('active');
            if (currentYear && currentYear == year) {
                months.eq(this.date.getUTCMonth()).addClass('active');
            }
            if (year < startYear || year > endYear) {
                months.addClass('disabled');
            }
            if (year == startYear) {
                months.slice(0, startMonth).addClass('disabled');
            }
            if (year == endYear) {
                months.slice(endMonth + 1).addClass('disabled');
            }

            html = '';
            year = parseInt(year / 10, 10) * 10;
            var yearCont = this.picker.find('.datepicker-years').find('th:eq(1)').text(year + '-' + (year + 9)).end().find('td');
            year -= 1;
            for (var i = -1; i < 11; i++) {
                html += '<span class="year' + (i == -1 || i == 10 ? ' old' : '') + (currentYear == year ? ' active' : '') + (year < startYear || year > endYear ? ' disabled' : '') + '">' + year + '</span>';
                year += 1;
            }
            yearCont.html(html);
        },

        updateNavArrows: function () {
            var d = new Date(this.viewDate),
                year = d.getUTCFullYear(),
                month = d.getUTCMonth(),
                day = d.getUTCDate(),
                hour = d.getUTCHours();
            switch (this.viewMode) {
                case 0:
                    if (this.startDate !== -Infinity && year <= this.startDate.getUTCFullYear() && month <= this.startDate.getUTCMonth() && day <= this.startDate.getUTCDate() && hour <= this.startDate.getUTCHours()) {
                        this.picker.find('.prev').css({
                            visibility: 'hidden'
                        });
                    } else {
                        this.picker.find('.prev').css({
                            visibility: 'visible'
                        });
                    }
                    if (this.endDate !== Infinity && year >= this.endDate.getUTCFullYear() && month >= this.endDate.getUTCMonth() && day >= this.endDate.getUTCDate() && hour >= this.endDate.getUTCHours()) {
                        this.picker.find('.next').css({
                            visibility: 'hidden'
                        });
                    } else {
                        this.picker.find('.next').css({
                            visibility: 'visible'
                        });
                    }
                    break;
                case 1:
                    if (this.startDate !== -Infinity && year <= this.startDate.getUTCFullYear() && month <= this.startDate.getUTCMonth() && day <= this.startDate.getUTCDate()) {
                        this.picker.find('.prev').css({
                            visibility: 'hidden'
                        });
                    } else {
                        this.picker.find('.prev').css({
                            visibility: 'visible'
                        });
                    }
                    if (this.endDate !== Infinity && year >= this.endDate.getUTCFullYear() && month >= this.endDate.getUTCMonth() && day >= this.endDate.getUTCDate()) {
                        this.picker.find('.next').css({
                            visibility: 'hidden'
                        });
                    } else {
                        this.picker.find('.next').css({
                            visibility: 'visible'
                        });
                    }
                    break;
                case 2:
                    if (this.startDate !== -Infinity && year <= this.startDate.getUTCFullYear() && month <= this.startDate.getUTCMonth()) {
                        this.picker.find('.prev').css({
                            visibility: 'hidden'
                        });
                    } else {
                        this.picker.find('.prev').css({
                            visibility: 'visible'
                        });
                    }
                    if (this.endDate !== Infinity && year >= this.endDate.getUTCFullYear() && month >= this.endDate.getUTCMonth()) {
                        this.picker.find('.next').css({
                            visibility: 'hidden'
                        });
                    } else {
                        this.picker.find('.next').css({
                            visibility: 'visible'
                        });
                    }
                    break;
                case 3:
                case 4:
                    if (this.startDate !== -Infinity && year <= this.startDate.getUTCFullYear()) {
                        this.picker.find('.prev').css({
                            visibility: 'hidden'
                        });
                    } else {
                        this.picker.find('.prev').css({
                            visibility: 'visible'
                        });
                    }
                    if (this.endDate !== Infinity && year >= this.endDate.getUTCFullYear()) {
                        this.picker.find('.next').css({
                            visibility: 'hidden'
                        });
                    } else {
                        this.picker.find('.next').css({
                            visibility: 'visible'
                        });
                    }
                    break;
            }
        },

        click: function (e) {
            e.stopPropagation();
            e.preventDefault();

            if ($(e.target).hasClass('datepicker-close') || $(e.target).parent().hasClass('datepicker-close')) {
                this.hide();
            }

            var target = $(e.target).closest('span, td, th');
            if (target.length == 1) {
                if (target.is('.disabled')) {
                    this.element.trigger({
                        type: 'outOfRange',
                        date: this.viewDate,
                        startDate: this.startDate,
                        endDate: this.endDate
                    });
                    return;
                }

                switch (target[0].nodeName.toLowerCase()) {
                    case 'th':
                        switch (target[0].className) {
                            case 'date-switch':
                                this.showMode(1);
                                break;
                            case 'prev':
                            case 'next':
                                var dir = DPGlobal.modes[this.viewMode].navStep * (target[0].className == 'prev' ? -1 : 1);
                                switch (this.viewMode) {
                                    case 0:
                                        this.viewDate = this.moveHour(this.viewDate, dir);
                                        break;
                                    case 1:
                                        this.viewDate = this.moveDate(this.viewDate, dir);
                                        break;
                                    case 2:
                                        this.viewDate = this.moveMonth(this.viewDate, dir);
                                        break;
                                    case 3:
                                    case 4:
                                        this.viewDate = this.moveYear(this.viewDate, dir);
                                        break;
                                }
                                this.fill();
                                break;
                            case 'today':
                                var date = new Date();
                                date = UTCDate(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds());

                                this.viewMode = this.startViewMode;
                                this.showMode(0);
                                this._setDate(date);
                                break;
                        }
                        break;
                    case 'span':
                        if (!target.is('.disabled')) {
                            if (target.is('.month')) {
                                if (this.minView === 3) {
                                    var month = target.parent().find('span').index(target) || 0;
                                    var year = this.viewDate.getUTCFullYear(),
                                        day = 1,
                                        hours = this.viewDate.getUTCHours(),
                                        minutes = this.viewDate.getUTCMinutes(),
                                        seconds = this.viewDate.getUTCSeconds();
                                    this._setDate(UTCDate(year, month, day, hours, minutes, seconds, 0));
                                } else {
                                    this.viewDate.setUTCDate(1);
                                    var month = target.parent().find('span').index(target);
                                    this.viewDate.setUTCMonth(month);
                                    this.element.trigger({
                                        type: 'changeMonth',
                                        date: this.viewDate
                                    });
                                }
                            } else if (target.is('.year')) {
                                if (this.minView === 4) {
                                    var year = parseInt(target.text(), 10) || 0;
                                    var month = 0,
                                        day = 1,
                                        hours = this.viewDate.getUTCHours(),
                                        minutes = this.viewDate.getUTCMinutes(),
                                        seconds = this.viewDate.getUTCSeconds();
                                    this._setDate(UTCDate(year, month, day, hours, minutes, seconds, 0));
                                } else {
                                    this.viewDate.setUTCDate(1);
                                    var year = parseInt(target.text(), 10) || 0;
                                    this.viewDate.setUTCFullYear(year);
                                    this.element.trigger({
                                        type: 'changeYear',
                                        date: this.viewDate
                                    });
                                }
                            } else if (target.is('.hour')) {
                                var hours = parseInt(target.text(), 10) || 0;
                                var year = this.viewDate.getUTCFullYear(),
                                    month = this.viewDate.getUTCMonth(),
                                    day = this.viewDate.getUTCDate(),
                                    minutes = this.viewDate.getUTCMinutes(),
                                    seconds = this.viewDate.getUTCSeconds();
                                this._setDate(UTCDate(year, month, day, hours, minutes, seconds, 0));
                            } else if (target.is('.minute')) {
                                var minutes = parseInt(target.text().substr(target.text().indexOf(':') + 1), 10) || 0;
                                var year = this.viewDate.getUTCFullYear(),
                                    month = this.viewDate.getUTCMonth(),
                                    day = this.viewDate.getUTCDate(),
                                    hours = this.viewDate.getUTCHours(),
                                    seconds = this.viewDate.getUTCSeconds();
                                this._setDate(UTCDate(year, month, day, hours, minutes, seconds, 0));
                            }

                            if (this.viewMode != 0) {

                                var oldViewMode = this.viewMode;
                                this.showMode(-1);
                                this.fill();
                                if (oldViewMode == this.viewMode && this.autoclose) {
                                    this.hide();
                                }
                            } else {
                                this.fill();
                                if (this.autoclose) {
                                    this.hide();
                                }
                            }
                        }
                        break;
                    case 'td':

                        if (target.is('.day') && !target.is('.disabled')) {
                            var day = parseInt(target.text(), 10) || 1;
                            var year = this.viewDate.getUTCFullYear(),
                                month = this.viewDate.getUTCMonth(),
                                hours = this.viewDate.getUTCHours(),
                                minutes = this.viewDate.getUTCMinutes(),
                                seconds = this.viewDate.getUTCSeconds();
                            if (target.is('.old')) {
                                if (month === 0) {
                                    month = 11;
                                    year -= 1;
                                } else {
                                    month -= 1;
                                }
                            } else if (target.is('.new')) {
                                if (month == 11) {
                                    month = 0;
                                    year += 1;
                                } else {
                                    month += 1;
                                }
                            }
                            this._setDate(UTCDate(year, month, day, hours, minutes, seconds, 0));
                        }

                        var oldViewMode = this.viewMode;

                        this.showMode(-1);

                        this.fill();
                        if (oldViewMode == this.viewMode && this.autoclose) {
                            this.hide();
                        }
                        break;
                }
            }
        },

        _setDate: function (date, which) {

            if (!which || which == 'date') this.date = date;
            if (!which || which == 'view') this.viewDate = date;
            this.fill();
            this.setValue();
            this.element.trigger({
                type: 'changeDate',
                date: this.date
            });
            var element;
            if (this.isInput) {
                element = this.element;
            } else if (this.component) {
                element = this.element.find('input');
            }
            if (element) {
                element.change();
                if (this.autoclose && (!which || which == 'date')) {
                    // this.hide();
                }
            }
        },

        moveHour: function (date, dir) {
            if (!dir) return date;
            var new_date = new Date(date.valueOf());
            dir = dir > 0 ? 1 : -1;
            new_date.setUTCHours(new_date.getUTCHours() + dir);
            return new_date;
        },

        moveDate: function (date, dir) {
            if (!dir) return date;
            var new_date = new Date(date.valueOf());
            dir = dir > 0 ? 1 : -1;
            new_date.setUTCDate(new_date.getUTCDate() + dir);
            return new_date;
        },

        moveMonth: function (date, dir) {
            if (!dir) return date;
            var new_date = new Date(date.valueOf()),
                day = new_date.getUTCDate(),
                month = new_date.getUTCMonth(),
                mag = Math.abs(dir),
                new_month,
                test;
            dir = dir > 0 ? 1 : -1;
            if (mag == 1) {
                test = dir == -1
                // If going back one month, make sure month is not current month
                // (eg, Mar 31 -> Feb 31 == Feb 28, not Mar 02)
                ? function () {
                    return new_date.getUTCMonth() == month;
                }
                // If going forward one month, make sure month is as expected
                // (eg, Jan 31 -> Feb 31 == Feb 28, not Mar 02)
                : function () {
                    return new_date.getUTCMonth() != new_month;
                };
                new_month = month + dir;
                new_date.setUTCMonth(new_month);
                // Dec -> Jan (12) or Jan -> Dec (-1) -- limit expected date to 0-11
                if (new_month < 0 || new_month > 11) new_month = (new_month + 12) % 12;
            } else {
                // For magnitudes >1, move one month at a time...
                for (var i = 0; i < mag; i++)
                // ...which might decrease the day (eg, Jan 31 to Feb 28, etc)...
                new_date = this.moveMonth(new_date, dir);
                // ...then reset the day, keeping it in the new month
                new_month = new_date.getUTCMonth();
                new_date.setUTCDate(day);
                test = function () {
                    return new_month != new_date.getUTCMonth();
                };
            }
            // Common date-resetting loop -- if date is beyond end of month, make it
            // end of month
            while (test()) {
                new_date.setUTCDate(--day);
                new_date.setUTCMonth(new_month);
            }
            return new_date;
        },

        moveYear: function (date, dir) {
            return this.moveMonth(date, dir * 12);
        },

        dateWithinRange: function (date) {
            return date >= this.startDate && date <= this.endDate;
        },

        keydown: function (e) {
            if (!this.keyboardNavigation) {
                return true;
            }
            if (this.picker.is(':not(:visible)')) {
                if (e.keyCode == 27) // allow escape to hide and re-show picker
                    this.show();
                return;
            }
            var dateChanged = false,
                dir,
                day,
                month,
                newDate,
                newViewDate;
            switch (e.keyCode) {
                case 27:
                    // escape
                    this.hide();
                    e.preventDefault();
                    break;
                case 37: // left
                case 39:
                    // right
                    if (!this.keyboardNavigation) break;
                    dir = e.keyCode == 37 ? -1 : 1;
                    if (e.ctrlKey) {
                        newDate = this.moveYear(this.date, dir);
                        newViewDate = this.moveYear(this.viewDate, dir);
                    } else if (e.shiftKey) {
                        newDate = this.moveMonth(this.date, dir);
                        newViewDate = this.moveMonth(this.viewDate, dir);
                    } else {
                        newDate = new Date(this.date.valueOf());
                        newDate.setUTCDate(this.date.getUTCDate() + dir);
                        newViewDate = new Date(this.viewDate.valueOf());
                        newViewDate.setUTCDate(this.viewDate.getUTCDate() + dir);
                    }
                    if (this.dateWithinRange(newDate)) {
                        this.date = newDate;
                        this.viewDate = newViewDate;
                        this.setValue();
                        this.update();
                        e.preventDefault();
                        dateChanged = true;
                    }
                    break;
                case 38: // up
                case 40:
                    // down
                    if (!this.keyboardNavigation) break;
                    dir = e.keyCode == 38 ? -1 : 1;
                    if (e.ctrlKey) {
                        newDate = this.moveYear(this.date, dir);
                        newViewDate = this.moveYear(this.viewDate, dir);
                    } else if (e.shiftKey) {
                        newDate = this.moveMonth(this.date, dir);
                        newViewDate = this.moveMonth(this.viewDate, dir);
                    } else {
                        newDate = new Date(this.date.valueOf());
                        newDate.setUTCDate(this.date.getUTCDate() + dir * 7);
                        newViewDate = new Date(this.viewDate.valueOf());
                        newViewDate.setUTCDate(this.viewDate.getUTCDate() + dir * 7);
                    }
                    if (this.dateWithinRange(newDate)) {
                        this.date = newDate;
                        this.viewDate = newViewDate;
                        this.setValue();
                        this.update();
                        e.preventDefault();
                        dateChanged = true;
                    }
                    break;
                case 13:
                    // enter
                    this.hide();
                    e.preventDefault();
                    break;
                case 9:
                    // tab
                    this.hide();
                    break;
            }
            if (dateChanged) {
                this.element.trigger({
                    type: 'changeDate',
                    date: this.date
                });
                var element;
                if (this.isInput) {
                    element = this.element;
                } else if (this.component) {
                    element = this.element.find('input');
                }
                if (element) {
                    element.change();
                }
            }
        },

        showMode: function (dir) {

            if (dir) {
                var newViewMode = Math.max(0, Math.min(DPGlobal.modes.length - 1, this.viewMode + dir));
                if (newViewMode >= this.minView && newViewMode <= this.maxView) {
                    this.viewMode = newViewMode;
                }
            }
            /*
            	vitalets: fixing bug of very special conditions:
            	jquery 1.7.1 + webkit + show inline datepicker in bootstrap popover.
            	Method show() does not set display css correctly and datepicker is not shown.
            	Changed to .css('display', 'block') solve the problem.
            	See https://github.com/vitalets/x-editable/issues/37
             	In jquery 1.7.2+ everything works fine.
            */
            //this.picker.find('>div').hide().filter('.datepicker-'+DPGlobal.modes[this.viewMode].clsName).show();
            this.picker.find('>div').hide().filter('.datepicker-' + DPGlobal.modes[this.viewMode].clsName).css('display', 'block');
            this.updateNavArrows();
        },
        reset: function (e) {
            this._setDate(null, 'date');
        }
    };

    $.fn.fdatepicker = function (option) {
        var args = Array.apply(null, arguments);
        args.shift();
        return this.each(function () {
            var $this = $(this),
                data = $this.data('datepicker'),
                options = typeof option == 'object' && option;
            if (!data) {
                $this.data('datepicker', data = new Datepicker(this, $.extend({}, $.fn.fdatepicker.defaults, options)));
            }
            if (typeof option == 'string' && typeof data[option] == 'function') {
                data[option].apply(data, args);
            }
        });
    };

    $.fn.fdatepicker.defaults = {
        onRender: function (date) {
            return '';
        }
    };
    $.fn.fdatepicker.Constructor = Datepicker;
    var dates = $.fn.fdatepicker.dates = {
        'en': {
            days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            daysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            daysMin: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
            months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
            monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            today: "Today",
            titleFormat: "MM yyyy"
        }
    };

    var DPGlobal = {
        modes: [{
            clsName: 'minutes',
            navFnc: 'Hours',
            navStep: 1
        }, {
            clsName: 'hours',
            navFnc: 'Date',
            navStep: 1
        }, {
            clsName: 'days',
            navFnc: 'Month',
            navStep: 1
        }, {
            clsName: 'months',
            navFnc: 'FullYear',
            navStep: 1
        }, {
            clsName: 'years',
            navFnc: 'FullYear',
            navStep: 10
        }],
        isLeapYear: function (year) {
            return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
        },
        getDaysInMonth: function (year, month) {
            return [31, DPGlobal.isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
        },
        validParts: /hh?|ii?|ss?|dd?|mm?|MM?|yy(?:yy)?/g,
        nonpunctuation: /[^ -\/:-@\[\u3400-\u9fff-`{-~\t\n\r]+/g,
        parseFormat: function (format) {
            // IE treats \0 as a string end in inputs (truncating the value),
            // so it's a bad format delimiter, anyway
            var separators = format.replace(this.validParts, '\0').split('\0'),
                parts = format.match(this.validParts);
            if (!separators || !separators.length || !parts || parts.length === 0) {
                throw new Error("Invalid date format.");
            }
            this.formatText = format;
            return {
                separators: separators,
                parts: parts
            };
        },
        parseDate: function (date, format, language) {
            if (date instanceof Date) return new Date(date.valueOf() - date.getTimezoneOffset() * 60000);
            if (/^\d{4}\-\d{1,2}\-\d{1,2}$/.test(date)) {
                format = this.parseFormat('yyyy-mm-dd');
            }
            if (/^\d{4}\-\d{1,2}\-\d{1,2}[T ]\d{1,2}\:\d{1,2}$/.test(date)) {
                format = this.parseFormat('yyyy-mm-dd hh:ii');
            }
            if (/^\d{4}\-\d{1,2}\-\d{1,2}[T ]\d{1,2}\:\d{1,2}\:\d{1,2}[Z]{0,1}$/.test(date)) {
                format = this.parseFormat('yyyy-mm-dd hh:ii:ss');
            }
            if (/^[-+]\d+[dmwy]([\s,]+[-+]\d+[dmwy])*$/.test(date)) {
                var part_re = /([-+]\d+)([dmwy])/,
                    parts = date.match(/([-+]\d+)([dmwy])/g),
                    part,
                    dir;
                date = new Date();
                for (var i = 0; i < parts.length; i++) {
                    part = part_re.exec(parts[i]);
                    dir = parseInt(part[1]);
                    switch (part[2]) {
                        case 'd':
                            date.setUTCDate(date.getUTCDate() + dir);
                            break;
                        case 'm':
                            date = Datetimepicker.prototype.moveMonth.call(Datetimepicker.prototype, date, dir);
                            break;
                        case 'w':
                            date.setUTCDate(date.getUTCDate() + dir * 7);
                            break;
                        case 'y':
                            date = Datetimepicker.prototype.moveYear.call(Datetimepicker.prototype, date, dir);
                            break;
                    }
                }
                return UTCDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
            }
            var parts = date && date.match(this.nonpunctuation) || [],
                date = new Date(),
                parsed = {},
                setters_order = ['hh', 'h', 'ii', 'i', 'ss', 's', 'yyyy', 'yy', 'M', 'MM', 'm', 'mm', 'd', 'dd'],
                setters_map = {
                hh: function (d, v) {
                    return d.setUTCHours(v);
                },
                h: function (d, v) {
                    return d.setUTCHours(v);
                },
                ii: function (d, v) {
                    return d.setUTCMinutes(v);
                },
                i: function (d, v) {
                    return d.setUTCMinutes(v);
                },
                ss: function (d, v) {
                    return d.setUTCSeconds(v);
                },
                s: function (d, v) {
                    return d.setUTCSeconds(v);
                },
                yyyy: function (d, v) {
                    return d.setUTCFullYear(v);
                },
                yy: function (d, v) {
                    return d.setUTCFullYear(2000 + v);
                },
                m: function (d, v) {
                    v -= 1;
                    while (v < 0) v += 12;
                    v %= 12;
                    d.setUTCMonth(v);
                    while (d.getUTCMonth() != v) d.setUTCDate(d.getUTCDate() - 1);
                    return d;
                },
                d: function (d, v) {
                    return d.setUTCDate(v);
                }
            },
                val,
                filtered,
                part;
            setters_map['M'] = setters_map['MM'] = setters_map['mm'] = setters_map['m'];
            setters_map['dd'] = setters_map['d'];
            date = UTCDate(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0); //date.getHours(), date.getMinutes(), date.getSeconds());
            if (parts.length == format.parts.length) {
                for (var i = 0, cnt = format.parts.length; i < cnt; i++) {
                    val = parseInt(parts[i], 10);
                    part = format.parts[i];
                    if (isNaN(val)) {
                        switch (part) {
                            case 'MM':
                                filtered = $(dates[language].months).filter(function () {
                                    var m = this.slice(0, parts[i].length),
                                        p = parts[i].slice(0, m.length);
                                    return m == p;
                                });
                                val = $.inArray(filtered[0], dates[language].months) + 1;
                                break;
                            case 'M':
                                filtered = $(dates[language].monthsShort).filter(function () {
                                    var m = this.slice(0, parts[i].length),
                                        p = parts[i].slice(0, m.length);
                                    return m == p;
                                });
                                val = $.inArray(filtered[0], dates[language].monthsShort) + 1;
                                break;
                        }
                    }
                    parsed[part] = val;
                }
                for (var i = 0, s; i < setters_order.length; i++) {
                    s = setters_order[i];
                    if (s in parsed && !isNaN(parsed[s])) setters_map[s](date, parsed[s]);
                }
            }
            return date;
        },
        formatDate: function (date, format, language) {
            if (date == null) {
                return '';
            }
            var val = {
                h: date.getUTCHours(),
                i: date.getUTCMinutes(),
                s: date.getUTCSeconds(),
                d: date.getUTCDate(),
                m: date.getUTCMonth() + 1,
                M: dates[language].monthsShort[date.getUTCMonth()],
                MM: dates[language].months[date.getUTCMonth()],
                yy: date.getUTCFullYear().toString().substring(2),
                yyyy: date.getUTCFullYear()
            };
            val.hh = (val.h < 10 ? '0' : '') + val.h;
            val.ii = (val.i < 10 ? '0' : '') + val.i;
            val.ss = (val.s < 10 ? '0' : '') + val.s;
            val.dd = (val.d < 10 ? '0' : '') + val.d;
            val.mm = (val.m < 10 ? '0' : '') + val.m;
            var date = [],
                seps = $.extend([], format.separators);
            for (var i = 0, cnt = format.parts.length; i < cnt; i++) {
                if (seps.length) date.push(seps.shift());
                date.push(val[format.parts[i]]);
            }
            return date.join('');
        },
        convertViewMode: function (viewMode) {
            switch (viewMode) {
                case 4:
                case 'decade':
                    viewMode = 4;
                    break;
                case 3:
                case 'year':
                    viewMode = 3;
                    break;
                case 2:
                case 'month':
                    viewMode = 2;
                    break;
                case 1:
                case 'day':
                    viewMode = 1;
                    break;
                case 0:
                case 'hour':
                    viewMode = 0;
                    break;
            }

            return viewMode;
        },
        headTemplate: function (leftArrow, rightArrow) {
            return '<thead>' + '<tr>' + '<th class="prev">' + leftArrow + '</th>' + '<th colspan="5" class="date-switch"></th>' + '<th class="next">' + rightArrow + '</th>' + '</tr>' + '</thead>';
        },
        contTemplate: '<tbody><tr><td colspan="7"></td></tr></tbody>',
        footTemplate: '<tfoot><tr><th colspan="7" class="today"></th></tr></tfoot>'
    };
    DPGlobal.template = function (leftArrow, rightArrow, closeIcon) {
        return '<div class="datepicker">' + '<div class="datepicker-minutes">' + '<table class=" table-condensed">' + DPGlobal.headTemplate(leftArrow, rightArrow) + DPGlobal.contTemplate + DPGlobal.footTemplate + '</table>' + '</div>' + '<div class="datepicker-hours">' + '<table class=" table-condensed">' + DPGlobal.headTemplate(leftArrow, rightArrow) + DPGlobal.contTemplate + DPGlobal.footTemplate + '</table>' + '</div>' + '<div class="datepicker-days">' + '<table class=" table-condensed">' + DPGlobal.headTemplate(leftArrow, rightArrow) + '<tbody></tbody>' + DPGlobal.footTemplate + '</table>' + '</div>' + '<div class="datepicker-months">' + '<table class="table-condensed">' + DPGlobal.headTemplate(leftArrow, rightArrow) + DPGlobal.contTemplate + DPGlobal.footTemplate + '</table>' + '</div>' + '<div class="datepicker-years">' + '<table class="table-condensed">' + DPGlobal.headTemplate(leftArrow, rightArrow) + DPGlobal.contTemplate + DPGlobal.footTemplate + '</table>' + '</div>' + '<a class="button datepicker-close tiny alert right" style="width:auto;">' + closeIcon + '</a>' + '</div>';
    };

    $.fn.fdatepicker.DPGlobal = DPGlobal;
}(window.jQuery);
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZvdW5kYXRpb24uY29yZS5qcyIsImZvdW5kYXRpb24udXRpbC5ib3guanMiLCJmb3VuZGF0aW9uLnV0aWwua2V5Ym9hcmQuanMiLCJmb3VuZGF0aW9uLnV0aWwubWVkaWFRdWVyeS5qcyIsImZvdW5kYXRpb24udXRpbC5tb3Rpb24uanMiLCJmb3VuZGF0aW9uLnV0aWwubmVzdC5qcyIsImZvdW5kYXRpb24udXRpbC50aW1lckFuZEltYWdlTG9hZGVyLmpzIiwiZm91bmRhdGlvbi51dGlsLnRvdWNoLmpzIiwiZm91bmRhdGlvbi51dGlsLnRyaWdnZXJzLmpzIiwid2hhdC1pbnB1dC5qcyIsImZvdW5kYXRpb24uYWNjb3JkaW9uLmpzIiwiZm91bmRhdGlvbi5hY2NvcmRpb25NZW51LmpzIiwiZm91bmRhdGlvbi5kcm9wZG93bi5qcyIsImZvdW5kYXRpb24uZHJvcGRvd25NZW51LmpzIiwiZm91bmRhdGlvbi5lcXVhbGl6ZXIuanMiLCJmb3VuZGF0aW9uLmludGVyY2hhbmdlLmpzIiwiZm91bmRhdGlvbi5vZmZjYW52YXMuanMiLCJmb3VuZGF0aW9uLnJlc3BvbnNpdmVNZW51LmpzIiwiZm91bmRhdGlvbi5yZXNwb25zaXZlVG9nZ2xlLmpzIiwiZm91bmRhdGlvbi5zdGlja3kuanMiLCJmb3VuZGF0aW9uLnRvZ2dsZXIuanMiLCJtb3Rpb24tdWkuanMiLCJmb3VuZGF0aW9uLWRhdGVwaWNrZXIuanMiXSwibmFtZXMiOlsiJCIsIkZPVU5EQVRJT05fVkVSU0lPTiIsIkZvdW5kYXRpb24iLCJ2ZXJzaW9uIiwiX3BsdWdpbnMiLCJfdXVpZHMiLCJydGwiLCJhdHRyIiwicGx1Z2luIiwibmFtZSIsImNsYXNzTmFtZSIsImZ1bmN0aW9uTmFtZSIsImF0dHJOYW1lIiwiaHlwaGVuYXRlIiwicmVnaXN0ZXJQbHVnaW4iLCJwbHVnaW5OYW1lIiwiY29uc3RydWN0b3IiLCJ0b0xvd2VyQ2FzZSIsInV1aWQiLCJHZXRZb0RpZ2l0cyIsIiRlbGVtZW50IiwiZGF0YSIsInRyaWdnZXIiLCJwdXNoIiwidW5yZWdpc3RlclBsdWdpbiIsInNwbGljZSIsImluZGV4T2YiLCJyZW1vdmVBdHRyIiwicmVtb3ZlRGF0YSIsInByb3AiLCJyZUluaXQiLCJwbHVnaW5zIiwiaXNKUSIsImVhY2giLCJfaW5pdCIsInR5cGUiLCJfdGhpcyIsImZucyIsInBsZ3MiLCJmb3JFYWNoIiwicCIsImZvdW5kYXRpb24iLCJPYmplY3QiLCJrZXlzIiwiZXJyIiwiY29uc29sZSIsImVycm9yIiwibGVuZ3RoIiwibmFtZXNwYWNlIiwiTWF0aCIsInJvdW5kIiwicG93IiwicmFuZG9tIiwidG9TdHJpbmciLCJzbGljZSIsInJlZmxvdyIsImVsZW0iLCJpIiwiJGVsZW0iLCJmaW5kIiwiYWRkQmFjayIsIiRlbCIsIm9wdHMiLCJ3YXJuIiwidGhpbmciLCJzcGxpdCIsImUiLCJvcHQiLCJtYXAiLCJlbCIsInRyaW0iLCJwYXJzZVZhbHVlIiwiZXIiLCJnZXRGbk5hbWUiLCJ0cmFuc2l0aW9uZW5kIiwidHJhbnNpdGlvbnMiLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJlbmQiLCJ0Iiwic3R5bGUiLCJzZXRUaW1lb3V0IiwidHJpZ2dlckhhbmRsZXIiLCJ1dGlsIiwidGhyb3R0bGUiLCJmdW5jIiwiZGVsYXkiLCJ0aW1lciIsImNvbnRleHQiLCJhcmdzIiwiYXJndW1lbnRzIiwiYXBwbHkiLCJtZXRob2QiLCIkbWV0YSIsIiRub0pTIiwiYXBwZW5kVG8iLCJoZWFkIiwicmVtb3ZlQ2xhc3MiLCJNZWRpYVF1ZXJ5IiwiQXJyYXkiLCJwcm90b3R5cGUiLCJjYWxsIiwicGx1Z0NsYXNzIiwidW5kZWZpbmVkIiwiUmVmZXJlbmNlRXJyb3IiLCJUeXBlRXJyb3IiLCJ3aW5kb3ciLCJmbiIsIkRhdGUiLCJub3ciLCJnZXRUaW1lIiwidmVuZG9ycyIsInJlcXVlc3RBbmltYXRpb25GcmFtZSIsInZwIiwiY2FuY2VsQW5pbWF0aW9uRnJhbWUiLCJ0ZXN0IiwibmF2aWdhdG9yIiwidXNlckFnZW50IiwibGFzdFRpbWUiLCJjYWxsYmFjayIsIm5leHRUaW1lIiwibWF4IiwiY2xlYXJUaW1lb3V0IiwicGVyZm9ybWFuY2UiLCJzdGFydCIsIkZ1bmN0aW9uIiwiYmluZCIsIm9UaGlzIiwiYUFyZ3MiLCJmVG9CaW5kIiwiZk5PUCIsImZCb3VuZCIsImNvbmNhdCIsImZ1bmNOYW1lUmVnZXgiLCJyZXN1bHRzIiwiZXhlYyIsInN0ciIsImlzTmFOIiwicGFyc2VGbG9hdCIsInJlcGxhY2UiLCJqUXVlcnkiLCJCb3giLCJJbU5vdFRvdWNoaW5nWW91IiwiR2V0RGltZW5zaW9ucyIsIkdldE9mZnNldHMiLCJlbGVtZW50IiwicGFyZW50IiwibHJPbmx5IiwidGJPbmx5IiwiZWxlRGltcyIsInRvcCIsImJvdHRvbSIsImxlZnQiLCJyaWdodCIsInBhckRpbXMiLCJvZmZzZXQiLCJoZWlnaHQiLCJ3aWR0aCIsIndpbmRvd0RpbXMiLCJhbGxEaXJzIiwiRXJyb3IiLCJyZWN0IiwiZ2V0Qm91bmRpbmdDbGllbnRSZWN0IiwicGFyUmVjdCIsInBhcmVudE5vZGUiLCJ3aW5SZWN0IiwiYm9keSIsIndpblkiLCJwYWdlWU9mZnNldCIsIndpblgiLCJwYWdlWE9mZnNldCIsInBhcmVudERpbXMiLCJhbmNob3IiLCJwb3NpdGlvbiIsInZPZmZzZXQiLCJoT2Zmc2V0IiwiaXNPdmVyZmxvdyIsIiRlbGVEaW1zIiwiJGFuY2hvckRpbXMiLCJrZXlDb2RlcyIsImNvbW1hbmRzIiwiS2V5Ym9hcmQiLCJnZXRLZXlDb2RlcyIsInBhcnNlS2V5IiwiZXZlbnQiLCJrZXkiLCJ3aGljaCIsImtleUNvZGUiLCJTdHJpbmciLCJmcm9tQ2hhckNvZGUiLCJ0b1VwcGVyQ2FzZSIsInNoaWZ0S2V5IiwiY3RybEtleSIsImFsdEtleSIsImhhbmRsZUtleSIsImNvbXBvbmVudCIsImZ1bmN0aW9ucyIsImNvbW1hbmRMaXN0IiwiY21kcyIsImNvbW1hbmQiLCJsdHIiLCJleHRlbmQiLCJyZXR1cm5WYWx1ZSIsImhhbmRsZWQiLCJ1bmhhbmRsZWQiLCJmaW5kRm9jdXNhYmxlIiwiZmlsdGVyIiwiaXMiLCJyZWdpc3RlciIsImNvbXBvbmVudE5hbWUiLCJrY3MiLCJrIiwia2MiLCJkZWZhdWx0UXVlcmllcyIsImxhbmRzY2FwZSIsInBvcnRyYWl0IiwicmV0aW5hIiwicXVlcmllcyIsImN1cnJlbnQiLCJzZWxmIiwiZXh0cmFjdGVkU3R5bGVzIiwiY3NzIiwibmFtZWRRdWVyaWVzIiwicGFyc2VTdHlsZVRvT2JqZWN0IiwiaGFzT3duUHJvcGVydHkiLCJ2YWx1ZSIsIl9nZXRDdXJyZW50U2l6ZSIsIl93YXRjaGVyIiwiYXRMZWFzdCIsInNpemUiLCJxdWVyeSIsImdldCIsIm1hdGNoTWVkaWEiLCJtYXRjaGVzIiwibWF0Y2hlZCIsIm9uIiwibmV3U2l6ZSIsImN1cnJlbnRTaXplIiwic3R5bGVNZWRpYSIsIm1lZGlhIiwic2NyaXB0IiwiZ2V0RWxlbWVudHNCeVRhZ05hbWUiLCJpbmZvIiwiaWQiLCJpbnNlcnRCZWZvcmUiLCJnZXRDb21wdXRlZFN0eWxlIiwiY3VycmVudFN0eWxlIiwibWF0Y2hNZWRpdW0iLCJ0ZXh0Iiwic3R5bGVTaGVldCIsImNzc1RleHQiLCJ0ZXh0Q29udGVudCIsInN0eWxlT2JqZWN0IiwicmVkdWNlIiwicmV0IiwicGFyYW0iLCJwYXJ0cyIsInZhbCIsImRlY29kZVVSSUNvbXBvbmVudCIsImlzQXJyYXkiLCJpbml0Q2xhc3NlcyIsImFjdGl2ZUNsYXNzZXMiLCJNb3Rpb24iLCJhbmltYXRlSW4iLCJhbmltYXRpb24iLCJjYiIsImFuaW1hdGUiLCJhbmltYXRlT3V0IiwiTW92ZSIsImR1cmF0aW9uIiwiYW5pbSIsInByb2ciLCJtb3ZlIiwidHMiLCJpc0luIiwiZXEiLCJpbml0Q2xhc3MiLCJhY3RpdmVDbGFzcyIsInJlc2V0IiwiYWRkQ2xhc3MiLCJzaG93Iiwib2Zmc2V0V2lkdGgiLCJvbmUiLCJmaW5pc2giLCJoaWRlIiwidHJhbnNpdGlvbkR1cmF0aW9uIiwiTmVzdCIsIkZlYXRoZXIiLCJtZW51IiwiaXRlbXMiLCJzdWJNZW51Q2xhc3MiLCJzdWJJdGVtQ2xhc3MiLCJoYXNTdWJDbGFzcyIsIiRpdGVtIiwiJHN1YiIsImNoaWxkcmVuIiwiQnVybiIsIlRpbWVyIiwib3B0aW9ucyIsIm5hbWVTcGFjZSIsInJlbWFpbiIsImlzUGF1c2VkIiwicmVzdGFydCIsImluZmluaXRlIiwicGF1c2UiLCJvbkltYWdlc0xvYWRlZCIsImltYWdlcyIsInVubG9hZGVkIiwiY29tcGxldGUiLCJzaW5nbGVJbWFnZUxvYWRlZCIsIm5hdHVyYWxXaWR0aCIsInNwb3RTd2lwZSIsImVuYWJsZWQiLCJkb2N1bWVudEVsZW1lbnQiLCJwcmV2ZW50RGVmYXVsdCIsIm1vdmVUaHJlc2hvbGQiLCJ0aW1lVGhyZXNob2xkIiwic3RhcnRQb3NYIiwic3RhcnRQb3NZIiwic3RhcnRUaW1lIiwiZWxhcHNlZFRpbWUiLCJpc01vdmluZyIsIm9uVG91Y2hFbmQiLCJyZW1vdmVFdmVudExpc3RlbmVyIiwib25Ub3VjaE1vdmUiLCJ4IiwidG91Y2hlcyIsInBhZ2VYIiwieSIsInBhZ2VZIiwiZHgiLCJkeSIsImRpciIsImFicyIsIm9uVG91Y2hTdGFydCIsImFkZEV2ZW50TGlzdGVuZXIiLCJpbml0IiwidGVhcmRvd24iLCJzcGVjaWFsIiwic3dpcGUiLCJzZXR1cCIsIm5vb3AiLCJhZGRUb3VjaCIsImhhbmRsZVRvdWNoIiwiY2hhbmdlZFRvdWNoZXMiLCJmaXJzdCIsImV2ZW50VHlwZXMiLCJ0b3VjaHN0YXJ0IiwidG91Y2htb3ZlIiwidG91Y2hlbmQiLCJzaW11bGF0ZWRFdmVudCIsIk1vdXNlRXZlbnQiLCJzY3JlZW5YIiwic2NyZWVuWSIsImNsaWVudFgiLCJjbGllbnRZIiwiY3JlYXRlRXZlbnQiLCJpbml0TW91c2VFdmVudCIsInRhcmdldCIsImRpc3BhdGNoRXZlbnQiLCJNdXRhdGlvbk9ic2VydmVyIiwicHJlZml4ZXMiLCJ0cmlnZ2VycyIsInN0b3BQcm9wYWdhdGlvbiIsImZhZGVPdXQiLCJjaGVja0xpc3RlbmVycyIsImV2ZW50c0xpc3RlbmVyIiwicmVzaXplTGlzdGVuZXIiLCJzY3JvbGxMaXN0ZW5lciIsImNsb3NlbWVMaXN0ZW5lciIsInlldGlCb3hlcyIsInBsdWdOYW1lcyIsImxpc3RlbmVycyIsImpvaW4iLCJvZmYiLCJwbHVnaW5JZCIsIm5vdCIsImRlYm91bmNlIiwiJG5vZGVzIiwibm9kZXMiLCJxdWVyeVNlbGVjdG9yQWxsIiwibGlzdGVuaW5nRWxlbWVudHNNdXRhdGlvbiIsIm11dGF0aW9uUmVjb3Jkc0xpc3QiLCIkdGFyZ2V0IiwiZWxlbWVudE9ic2VydmVyIiwib2JzZXJ2ZSIsImF0dHJpYnV0ZXMiLCJjaGlsZExpc3QiLCJjaGFyYWN0ZXJEYXRhIiwic3VidHJlZSIsImF0dHJpYnV0ZUZpbHRlciIsIklIZWFyWW91Iiwid2hhdElucHV0IiwiYWN0aXZlS2V5cyIsImJ1ZmZlciIsImN1cnJlbnRJbnB1dCIsIm5vblR5cGluZ0lucHV0cyIsIm1vdXNlV2hlZWwiLCJkZXRlY3RXaGVlbCIsImlnbm9yZU1hcCIsImlucHV0TWFwIiwiaW5wdXRUeXBlcyIsImtleU1hcCIsInBvaW50ZXJNYXAiLCJldmVudEJ1ZmZlciIsImNsZWFyVGltZXIiLCJzZXRJbnB1dCIsImJ1ZmZlcmVkRXZlbnQiLCJ1bkJ1ZmZlcmVkRXZlbnQiLCJldmVudEtleSIsInBvaW50ZXJUeXBlIiwiZXZlbnRUYXJnZXQiLCJldmVudFRhcmdldE5vZGUiLCJub2RlTmFtZSIsImV2ZW50VGFyZ2V0VHlwZSIsImdldEF0dHJpYnV0ZSIsImhhc0F0dHJpYnV0ZSIsInN3aXRjaElucHV0IiwibG9nS2V5cyIsInN0cmluZyIsInNldEF0dHJpYnV0ZSIsInNyY0VsZW1lbnQiLCJ1bkxvZ0tleXMiLCJhcnJheVBvcyIsImJpbmRFdmVudHMiLCJQb2ludGVyRXZlbnQiLCJNU1BvaW50ZXJFdmVudCIsIm9ubW91c2V3aGVlbCIsImFzayIsInR5cGVzIiwic2V0IiwiQWNjb3JkaW9uIiwiZGVmYXVsdHMiLCIkdGFicyIsImlkeCIsIiRjb250ZW50IiwibGlua0lkIiwiJGluaXRBY3RpdmUiLCJkb3duIiwiX2V2ZW50cyIsIiR0YWJDb250ZW50IiwidG9nZ2xlIiwibmV4dCIsIiRhIiwiZm9jdXMiLCJtdWx0aUV4cGFuZCIsInByZXZpb3VzIiwicHJldiIsImhhc0NsYXNzIiwidXAiLCJmaXJzdFRpbWUiLCIkY3VycmVudEFjdGl2ZSIsInNsaWRlRG93biIsInNsaWRlU3BlZWQiLCIkYXVudHMiLCJzaWJsaW5ncyIsImFsbG93QWxsQ2xvc2VkIiwic2xpZGVVcCIsImRlc3Ryb3kiLCJzdG9wIiwiQWNjb3JkaW9uTWVudSIsIm11bHRpT3BlbiIsIiRtZW51TGlua3MiLCJzdWJJZCIsImlzQWN0aXZlIiwiaW5pdFBhbmVzIiwiJHN1Ym1lbnUiLCIkZWxlbWVudHMiLCIkcHJldkVsZW1lbnQiLCIkbmV4dEVsZW1lbnQiLCJtaW4iLCJwYXJlbnRzIiwib3BlbiIsImNsb3NlIiwiY2xvc2VBbGwiLCJoaWRlQWxsIiwic3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uIiwicGFyZW50c1VudGlsIiwiYWRkIiwiJG1lbnVzIiwiRHJvcGRvd24iLCIkaWQiLCIkYW5jaG9yIiwicG9zaXRpb25DbGFzcyIsImdldFBvc2l0aW9uQ2xhc3MiLCJjb3VudGVyIiwidXNlZFBvc2l0aW9ucyIsInZlcnRpY2FsUG9zaXRpb24iLCJtYXRjaCIsImhvcml6b250YWxQb3NpdGlvbiIsIl9yZXBvc2l0aW9uIiwiY2xhc3NDaGFuZ2VkIiwiX3NldFBvc2l0aW9uIiwiZGlyZWN0aW9uIiwiaG92ZXIiLCJ0aW1lb3V0IiwiaG92ZXJEZWxheSIsImhvdmVyUGFuZSIsInZpc2libGVGb2N1c2FibGVFbGVtZW50cyIsInRhYl9mb3J3YXJkIiwidHJhcEZvY3VzIiwidGFiX2JhY2t3YXJkIiwiX2FkZEJvZHlIYW5kbGVyIiwiJGJvZHkiLCJhdXRvRm9jdXMiLCIkZm9jdXNhYmxlIiwiY2xvc2VPbkNsaWNrIiwiY3VyUG9zaXRpb25DbGFzcyIsIkRyb3Bkb3duTWVudSIsInN1YnMiLCIkbWVudUl0ZW1zIiwidmVydGljYWxDbGFzcyIsInJpZ2h0Q2xhc3MiLCJhbGlnbm1lbnQiLCJjaGFuZ2VkIiwiX2lzVmVydGljYWwiLCJoYXNUb3VjaCIsIm9udG91Y2hzdGFydCIsInBhckNsYXNzIiwiaGFuZGxlQ2xpY2tGbiIsImhhc1N1YiIsImhhc0NsaWNrZWQiLCJjbGlja09wZW4iLCJmb3JjZUZvbGxvdyIsIl9oaWRlIiwiX3Nob3ciLCJjbG9zZU9uQ2xpY2tJbnNpZGUiLCJkaXNhYmxlSG92ZXIiLCJhdXRvY2xvc2UiLCJjbG9zaW5nVGltZSIsImlzVGFiIiwiaW5kZXgiLCJuZXh0U2libGluZyIsInByZXZTaWJsaW5nIiwib3BlblN1YiIsImNsb3NlU3ViIiwiJGxpbmsiLCIkc2licyIsImNsZWFyIiwib2xkQ2xhc3MiLCIkcGFyZW50TGkiLCIkdG9DbG9zZSIsInNvbWV0aGluZ1RvQ2xvc2UiLCJFcXVhbGl6ZXIiLCJlcUlkIiwiJHdhdGNoZWQiLCJoYXNOZXN0ZWQiLCJpc05lc3RlZCIsImlzT24iLCJfYmluZEhhbmRsZXIiLCJvblJlc2l6ZU1lQm91bmQiLCJfb25SZXNpemVNZSIsIm9uUG9zdEVxdWFsaXplZEJvdW5kIiwiX29uUG9zdEVxdWFsaXplZCIsImltZ3MiLCJ0b29TbWFsbCIsImVxdWFsaXplT24iLCJfY2hlY2tNUSIsIl9yZWZsb3ciLCJfcGF1c2VFdmVudHMiLCJfa2lsbHN3aXRjaCIsImVxdWFsaXplT25TdGFjayIsIl9pc1N0YWNrZWQiLCJlcXVhbGl6ZUJ5Um93IiwiZ2V0SGVpZ2h0c0J5Um93IiwiYXBwbHlIZWlnaHRCeVJvdyIsImdldEhlaWdodHMiLCJhcHBseUhlaWdodCIsImhlaWdodHMiLCJsZW4iLCJvZmZzZXRIZWlnaHQiLCJsYXN0RWxUb3BPZmZzZXQiLCJncm91cHMiLCJncm91cCIsImVsT2Zmc2V0VG9wIiwiaiIsImxuIiwiZ3JvdXBzSUxlbmd0aCIsImxlbkoiLCJJbnRlcmNoYW5nZSIsInJ1bGVzIiwiY3VycmVudFBhdGgiLCJfYWRkQnJlYWtwb2ludHMiLCJfZ2VuZXJhdGVSdWxlcyIsInJ1bGUiLCJwYXRoIiwiU1BFQ0lBTF9RVUVSSUVTIiwicnVsZXNMaXN0IiwicmVzcG9uc2UiLCJodG1sIiwiT2ZmQ2FudmFzIiwiJGxhc3RUcmlnZ2VyIiwiJHRyaWdnZXJzIiwiJGV4aXRlciIsImV4aXRlciIsImFwcGVuZCIsImlzUmV2ZWFsZWQiLCJSZWdFeHAiLCJyZXZlYWxDbGFzcyIsInJldmVhbE9uIiwiX3NldE1RQ2hlY2tlciIsInRyYW5zaXRpb25UaW1lIiwiX2hhbmRsZUtleWJvYXJkIiwicmV2ZWFsIiwiJGNsb3NlciIsImZvcmNlVG9wIiwic2Nyb2xsVG9wIiwiJHdyYXBwZXIiLCJfdHJhcEZvY3VzIiwiZm9jdXNhYmxlIiwibGFzdCIsIlJlc3BvbnNpdmVNZW51IiwiY3VycmVudE1xIiwiY3VycmVudFBsdWdpbiIsInJ1bGVzVHJlZSIsInJ1bGVTaXplIiwicnVsZVBsdWdpbiIsIk1lbnVQbHVnaW5zIiwiaXNFbXB0eU9iamVjdCIsIl9jaGVja01lZGlhUXVlcmllcyIsIm1hdGNoZWRNcSIsImNzc0NsYXNzIiwiZHJvcGRvd24iLCJkcmlsbGRvd24iLCJhY2NvcmRpb24iLCJSZXNwb25zaXZlVG9nZ2xlIiwidGFyZ2V0SUQiLCIkdGFyZ2V0TWVudSIsIiR0b2dnbGVyIiwiX3VwZGF0ZSIsIl91cGRhdGVNcUhhbmRsZXIiLCJ0b2dnbGVNZW51IiwiaGlkZUZvciIsIlN0aWNreSIsIiRwYXJlbnQiLCJ3YXNXcmFwcGVkIiwiJGNvbnRhaW5lciIsImNvbnRhaW5lciIsIndyYXBJbm5lciIsImNvbnRhaW5lckNsYXNzIiwic3RpY2t5Q2xhc3MiLCJzY3JvbGxDb3VudCIsImNoZWNrRXZlcnkiLCJpc1N0dWNrIiwiY29udGFpbmVySGVpZ2h0IiwiZWxlbUhlaWdodCIsIl9wYXJzZVBvaW50cyIsIl9zZXRTaXplcyIsIl9jYWxjIiwicmV2ZXJzZSIsInRvcEFuY2hvciIsImJ0bSIsImJ0bUFuY2hvciIsInNjcm9sbEhlaWdodCIsInB0cyIsImJyZWFrcyIsInB0IiwicGxhY2UiLCJwb2ludHMiLCJjYW5TdGljayIsIl9wYXVzZUxpc3RlbmVycyIsImNoZWNrU2l6ZXMiLCJzY3JvbGwiLCJfcmVtb3ZlU3RpY2t5IiwidG9wUG9pbnQiLCJib3R0b21Qb2ludCIsIl9zZXRTdGlja3kiLCJzdGlja1RvIiwibXJnbiIsIm5vdFN0dWNrVG8iLCJwYXJzZUludCIsImlzVG9wIiwic3RpY2tUb1RvcCIsImFuY2hvclB0IiwiYW5jaG9ySGVpZ2h0IiwidG9wT3JCb3R0b20iLCJzdGlja3lPbiIsIm5ld0VsZW1XaWR0aCIsImNvbXAiLCJwZG5nIiwibmV3Q29udGFpbmVySGVpZ2h0IiwiX3NldEJyZWFrUG9pbnRzIiwibVRvcCIsImVtQ2FsYyIsIm1hcmdpblRvcCIsIm1CdG0iLCJtYXJnaW5Cb3R0b20iLCJ3aW5IZWlnaHQiLCJpbm5lckhlaWdodCIsInVud3JhcCIsImVtIiwiZm9udFNpemUiLCJUb2dnbGVyIiwiaW5wdXQiLCJhbmltYXRpb25JbiIsImFuaW1hdGlvbk91dCIsIl90b2dnbGVDbGFzcyIsInRvZ2dsZUNsYXNzIiwiX3VwZGF0ZUFSSUEiLCJfdG9nZ2xlQW5pbWF0ZSIsImVuZEV2ZW50IiwiTW90aW9uVUkiLCJVVENEYXRlIiwiVVRDIiwiVVRDVG9kYXkiLCJ0b2RheSIsImdldFVUQ0Z1bGxZZWFyIiwiZ2V0VVRDTW9udGgiLCJnZXRVVENEYXRlIiwiRGF0ZXBpY2tlciIsInRoYXQiLCJhdXRvU2hvdyIsImNsb3NlQnV0dG9uIiwibGFuZ3VhZ2UiLCJkYXRlcyIsImlzUlRMIiwiZm9ybWF0IiwiRFBHbG9iYWwiLCJwYXJzZUZvcm1hdCIsImZvcm1hdFRleHQiLCJpc0lubGluZSIsImlzSW5wdXQiLCJoYXNJbnB1dCIsImRpc2FibGVEYmxDbGlja1NlbGVjdGlvbiIsIm9uUmVuZGVyIiwibGlua0ZpZWxkIiwibGlua0Zvcm1hdCIsIm1pbnV0ZVN0ZXAiLCJwaWNrZXJQb3NpdGlvbiIsImluaXRpYWxEYXRlIiwiZmFDU1NwcmVmaXgiLCJsZWZ0QXJyb3ciLCJyaWdodEFycm93IiwiY2xvc2VJY29uIiwibWluVmlldyIsImNvbnZlcnRWaWV3TW9kZSIsIm1heFZpZXciLCJtb2RlcyIsInN0YXJ0Vmlld01vZGUiLCJzdGFydFZpZXciLCJ2aWV3TW9kZSIsInBpY2tUaW1lIiwiZm9yY2VQYXJzZSIsInBpY2tlciIsInRlbXBsYXRlIiwiY2xpY2siLCJwcm94eSIsIm1vdXNlZG93biIsInByZXBlbmQiLCJjbG9zZXN0Iiwia2V5Ym9hcmROYXZpZ2F0aW9uIiwidG9kYXlCdG4iLCJ0b2RheUhpZ2hsaWdodCIsImNhbGVuZGFyV2Vla3MiLCJ3ZWVrU3RhcnQiLCJ3ZWVrRW5kIiwic3RhcnREYXRlIiwiSW5maW5pdHkiLCJlbmREYXRlIiwiZGF5c09mV2Vla0Rpc2FibGVkIiwiZGF0ZXNEaXNhYmxlZCIsInNldFN0YXJ0RGF0ZSIsInNldEVuZERhdGUiLCJzZXREYXlzT2ZXZWVrRGlzYWJsZWQiLCJzZXREYXRlc0Rpc2FibGVkIiwiZmlsbERvdyIsImZpbGxNb250aHMiLCJ1cGRhdGUiLCJzaG93TW9kZSIsIl9hdHRhY2hFdmVudHMiLCJfZGV0YWNoRXZlbnRzIiwia2V5dXAiLCJrZXlkb3duIiwiZGJsY2xpY2siLCJibHVyIiwiZXYiLCJvdXRlckhlaWdodCIsImRhdGUiLCJzZXRWYWx1ZSIsInJlbW92ZSIsImRhdGVwaWNrZXIiLCJnZXREYXRlIiwiZCIsImdldFRpbWV6b25lT2Zmc2V0Iiwic2V0RGF0ZSIsInNldFVUQ0RhdGUiLCJmb3JtYXR0ZWQiLCJnZXRGb3JtYXR0ZWREYXRlIiwiZm9ybWF0RGF0ZSIsInBhcnNlRGF0ZSIsInVwZGF0ZU5hdkFycm93cyIsInZhbHVlT2YiLCJ6SW5kZXgiLCJ0ZXh0Ym94Iiwib3V0ZXJXaWR0aCIsImZ1bGxPZmZzZXRUb3AiLCJvZmZzZXRMZWZ0IiwiZnJvbUFyZ3MiLCJjdXJyZW50VmFsIiwidmlld0RhdGUiLCJmaWxsIiwiZG93Q250IiwiY2VsbCIsImRheXNNaW4iLCJtb250aHNTaG9ydCIsInllYXIiLCJtb250aCIsImRheU1vbnRoIiwiaG91cnMiLCJnZXRVVENIb3VycyIsIm1pbnV0ZXMiLCJnZXRVVENNaW51dGVzIiwic3RhcnRZZWFyIiwic3RhcnRNb250aCIsImVuZFllYXIiLCJlbmRNb250aCIsImN1cnJlbnREYXRlIiwidGl0bGVGb3JtYXQiLCJtb250aHMiLCJwcmV2TW9udGgiLCJkYXkiLCJnZXREYXlzSW5Nb250aCIsImdldFVUQ0RheSIsIm5leHRNb250aCIsImNsc05hbWUiLCJhIiwiZ2V0RGF5IiwiYiIsImdldEZ1bGxZZWFyIiwiY2FsV2VlayIsImdldE1vbnRoIiwiaW5BcnJheSIsImVtcHR5IiwiYWN0dWFsIiwiZmxvb3IiLCJjdXJyZW50WWVhciIsInllYXJDb250IiwiaG91ciIsInZpc2liaWxpdHkiLCJuYXZTdGVwIiwibW92ZUhvdXIiLCJtb3ZlRGF0ZSIsIm1vdmVNb250aCIsIm1vdmVZZWFyIiwiZ2V0SG91cnMiLCJnZXRNaW51dGVzIiwiZ2V0U2Vjb25kcyIsIl9zZXREYXRlIiwic2Vjb25kcyIsImdldFVUQ1NlY29uZHMiLCJzZXRVVENNb250aCIsInNldFVUQ0Z1bGxZZWFyIiwic3Vic3RyIiwib2xkVmlld01vZGUiLCJjaGFuZ2UiLCJuZXdfZGF0ZSIsInNldFVUQ0hvdXJzIiwibWFnIiwibmV3X21vbnRoIiwiZGF0ZVdpdGhpblJhbmdlIiwiZGF0ZUNoYW5nZWQiLCJuZXdEYXRlIiwibmV3Vmlld0RhdGUiLCJuZXdWaWV3TW9kZSIsImZkYXRlcGlja2VyIiwib3B0aW9uIiwic2hpZnQiLCIkdGhpcyIsIkNvbnN0cnVjdG9yIiwiZGF5cyIsImRheXNTaG9ydCIsIm5hdkZuYyIsImlzTGVhcFllYXIiLCJ2YWxpZFBhcnRzIiwibm9ucHVuY3R1YXRpb24iLCJzZXBhcmF0b3JzIiwicGFydF9yZSIsInBhcnQiLCJEYXRldGltZXBpY2tlciIsInBhcnNlZCIsInNldHRlcnNfb3JkZXIiLCJzZXR0ZXJzX21hcCIsImhoIiwidiIsImgiLCJpaSIsInNldFVUQ01pbnV0ZXMiLCJzcyIsInNldFVUQ1NlY29uZHMiLCJzIiwieXl5eSIsInl5IiwibSIsImZpbHRlcmVkIiwiY250IiwiTSIsIk1NIiwic3Vic3RyaW5nIiwiZGQiLCJtbSIsInNlcHMiLCJoZWFkVGVtcGxhdGUiLCJjb250VGVtcGxhdGUiLCJmb290VGVtcGxhdGUiXSwibWFwcGluZ3MiOiJBQUFBLENBQUMsVUFBU0EsQ0FBVCxFQUFZOztBQUViOztBQUVBLE1BQUlDLHFCQUFxQixPQUF6Qjs7QUFFQTtBQUNBO0FBQ0EsTUFBSUMsYUFBYTtBQUNmQyxhQUFTRixrQkFETTs7QUFHZjs7O0FBR0FHLGNBQVUsRUFOSzs7QUFRZjs7O0FBR0FDLFlBQVEsRUFYTzs7QUFhZjs7O0FBR0FDLFNBQUssWUFBVTtBQUNiLGFBQU9OLEVBQUUsTUFBRixFQUFVTyxJQUFWLENBQWUsS0FBZixNQUEwQixLQUFqQztBQUNELEtBbEJjO0FBbUJmOzs7O0FBSUFDLFlBQVEsVUFBU0EsTUFBVCxFQUFpQkMsSUFBakIsRUFBdUI7QUFDN0I7QUFDQTtBQUNBLFVBQUlDLFlBQWFELFFBQVFFLGFBQWFILE1BQWIsQ0FBekI7QUFDQTtBQUNBO0FBQ0EsVUFBSUksV0FBWUMsVUFBVUgsU0FBVixDQUFoQjs7QUFFQTtBQUNBLFdBQUtOLFFBQUwsQ0FBY1EsUUFBZCxJQUEwQixLQUFLRixTQUFMLElBQWtCRixNQUE1QztBQUNELEtBakNjO0FBa0NmOzs7Ozs7Ozs7QUFTQU0sb0JBQWdCLFVBQVNOLE1BQVQsRUFBaUJDLElBQWpCLEVBQXNCO0FBQ3BDLFVBQUlNLGFBQWFOLE9BQU9JLFVBQVVKLElBQVYsQ0FBUCxHQUF5QkUsYUFBYUgsT0FBT1EsV0FBcEIsRUFBaUNDLFdBQWpDLEVBQTFDO0FBQ0FULGFBQU9VLElBQVAsR0FBYyxLQUFLQyxXQUFMLENBQWlCLENBQWpCLEVBQW9CSixVQUFwQixDQUFkOztBQUVBLFVBQUcsQ0FBQ1AsT0FBT1ksUUFBUCxDQUFnQmIsSUFBaEIsQ0FBc0IsUUFBT1EsVUFBVyxFQUF4QyxDQUFKLEVBQStDO0FBQUVQLGVBQU9ZLFFBQVAsQ0FBZ0JiLElBQWhCLENBQXNC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Qm9FLEdBa0JwRSxpQkFsQm9FLEdBbUJwRWYsU0FBUzBMLFlBbkIyRCxHQW9CcEUsVUFwQm9FLEdBcUJwRSxRQXJCb0UsR0FzQnBFLGlDQXRCb0UsR0F1QnBFLGlDQXZCb0UsR0F3QnBFMUwsU0FBU3dMLFlBQVQsQ0FBc0IxSyxTQUF0QixFQUFpQ0MsVUFBakMsQ0F4Qm9FLEdBeUJwRWYsU0FBU3lMLFlBekIyRCxHQTBCcEV6TCxTQUFTMEwsWUExQjJELEdBMkJwRSxVQTNCb0UsR0E0QnBFLFFBNUJvRSxHQTZCcEUsZ0NBN0JvRSxHQThCcEUsaUNBOUJvRSxHQStCcEUxTCxTQUFTd0wsWUFBVCxDQUFzQjFLLFNBQXRCLEVBQWlDQyxVQUFqQyxDQS9Cb0UsR0FnQ3BFZixTQUFTeUwsWUFoQzJELEdBaUNwRXpMLFNBQVMwTCxZQWpDMkQsR0FrQ3BFLFVBbENvRSxHQW1DcEUsUUFuQ29FLEdBb0NwRSwwRUFwQ29FLEdBb0NTMUssU0FwQ1QsR0FvQ3FCLE1BcENyQixHQXFDcEUsUUFyQzREO0FBcUNsRCxLQXJDZDs7QUF1Q0E3dEIsTUFBRTJHLEVBQUYsQ0FBS3F2QixXQUFMLENBQWlCbkosUUFBakIsR0FBNEJBLFFBQTVCO0FBRUgsQ0E1M0NDLENBNDNDQW5tQixPQUFPa0MsTUE1M0NQLENBQUYiLCJmaWxlIjoiZm91bmRhdGlvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIiFmdW5jdGlvbigkKSB7XG5cblwidXNlIHN0cmljdFwiO1xuXG52YXIgRk9VTkRBVElPTl9WRVJTSU9OID0gJzYuMi40JztcblxuLy8gR2xvYmFsIEZvdW5kYXRpb24gb2JqZWN0XG4vLyBUaGlzIGlzIGF0dGFjaGVkIHRvIHRoZSB3aW5kb3csIG9yIHVzZWQgYXMgYSBtb2R1bGUgZm9yIEFNRC9Ccm93c2VyaWZ5XG52YXIgRm91bmRhdGlvbiA9IHtcbiAgdmVyc2lvbjogRk9VTkRBVElPTl9WRVJTSU9OLFxuXG4gIC8qKlxuICAgKiBTdG9yZXMgaW5pdGlhbGl6ZWQgcGx1Z2lucy5cbiAgICovXG4gIF9wbHVnaW5zOiB7fSxcblxuICAvKipcbiAgICogU3RvcmVzIGdlbmVyYXRlZCB1bmlxdWUgaWRzIGZvciBwbHVnaW4gaW5zdGFuY2VzXG4gICAqL1xuICBfdXVpZHM6IFtdLFxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgYm9vbGVhbiBmb3IgUlRMIHN1cHBvcnRcbiAgICovXG4gIHJ0bDogZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gJCgnaHRtbCcpLmF0dHIoJ2RpcicpID09PSAncnRsJztcbiAgfSxcbiAgLyoqXG4gICAqIERlZmluZXMgYSBGb3VuZGF0aW9uIHBsdWdpbiwgYWRkaW5nIGl0IHRvIHRoZSBgRm91bmRhdGlvbmAgbmFtZXNwYWNlIGFuZCB0aGUgbGlzdCBvZiBwbHVnaW5zIHRvIGluaXRpYWxpemUgd2hlbiByZWZsb3dpbmcuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBwbHVnaW4gLSBUaGUgY29uc3RydWN0b3Igb2YgdGhlIHBsdWdpbi5cbiAgICovXG4gIHBsdWdpbjogZnVuY3Rpb24ocGx1Z2luLCBuYW1lKSB7XG4gICAgLy8gT2JqZWN0IGtleSB0byB1c2Ugd2hlbiBhZGRpbmcgdG8gZ2xvYmFsIEZvdW5kYXRpb24gb2JqZWN0XG4gICAgLy8gRXhhbXBsZXM6IEZvdW5kYXRpb24uUmV2ZWFsLCBGb3VuZGF0aW9uLk9mZkNhbnZhc1xuICAgIHZhciBjbGFzc05hbWUgPSAobmFtZSB8fCBmdW5jdGlvbk5hbWUocGx1Z2luKSk7XG4gICAgLy8gT2JqZWN0IGtleSB0byB1c2Ugd2hlbiBzdG9yaW5nIHRoZSBwbHVnaW4sIGFsc28gdXNlZCB0byBjcmVhdGUgdGhlIGlkZW50aWZ5aW5nIGRhdGEgYXR0cmlidXRlIGZvciB0aGUgcGx1Z2luXG4gICAgLy8gRXhhbXBsZXM6IGRhdGEtcmV2ZWFsLCBkYXRhLW9mZi1jYW52YXNcbiAgICB2YXIgYXR0ck5hbWUgID0gaHlwaGVuYXRlKGNsYXNzTmFtZSk7XG5cbiAgICAvLyBBZGQgdG8gdGhlIEZvdW5kYXRpb24gb2JqZWN0IGFuZCB0aGUgcGx1Z2lucyBsaXN0IChmb3IgcmVmbG93aW5nKVxuICAgIHRoaXMuX3BsdWdpbnNbYXR0ck5hbWVdID0gdGhpc1tjbGFzc05hbWVdID0gcGx1Z2luO1xuICB9LFxuICAvKipcbiAgICogQGZ1bmN0aW9uXG4gICAqIFBvcHVsYXRlcyB0aGUgX3V1aWRzIGFycmF5IHdpdGggcG9pbnRlcnMgdG8gZWFjaCBpbmRpdmlkdWFsIHBsdWdpbiBpbnN0YW5jZS5cbiAgICogQWRkcyB0aGUgYHpmUGx1Z2luYCBkYXRhLWF0dHJpYnV0ZSB0byBwcm9ncmFtbWF0aWNhbGx5IGNyZWF0ZWQgcGx1Z2lucyB0byBhbGxvdyB1c2Ugb2YgJChzZWxlY3RvcikuZm91bmRhdGlvbihtZXRob2QpIGNhbGxzLlxuICAgKiBBbHNvIGZpcmVzIHRoZSBpbml0aWFsaXphdGlvbiBldmVudCBmb3IgZWFjaCBwbHVnaW4sIGNvbnNvbGlkYXRpbmcgcmVwZXRpdGl2ZSBjb2RlLlxuICAgKiBAcGFyYW0ge09iamVjdH0gcGx1Z2luIC0gYW4gaW5zdGFuY2Ugb2YgYSBwbHVnaW4sIHVzdWFsbHkgYHRoaXNgIGluIGNvbnRleHQuXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIC0gdGhlIG5hbWUgb2YgdGhlIHBsdWdpbiwgcGFzc2VkIGFzIGEgY2FtZWxDYXNlZCBzdHJpbmcuXG4gICAqIEBmaXJlcyBQbHVnaW4jaW5pdFxuICAgKi9cbiAgcmVnaXN0ZXJQbHVnaW46IGZ1bmN0aW9uKHBsdWdpbiwgbmFtZSl7XG4gICAgdmFyIHBsdWdpbk5hbWUgPSBuYW1lID8gaHlwaGVuYXRlKG5hbWUpIDogZnVuY3Rpb25OYW1lKHBsdWdpbi5jb25zdHJ1Y3RvcikudG9Mb3dlckNhc2UoKTtcbiAgICBwbHVnaW4udXVpZCA9IHRoaXMuR2V0WW9EaWdpdHMoNiwgcGx1Z2luTmFtZSk7XG5cbiAgICBpZighcGx1Z2luLiRlbGVtZW50LmF0dHIoYGRhdGEtJHtwbHVnaW5OYW1lfWApKXsgcGx1Z2luLiRlbGVtZW50LmF0dHIoYGRhdGEtJHtwbHVnaW5OYW1lfWAsIHBsdWdpbi51dWlkKTsgfVxuICAgIGlmKCFwbHVnaW4uJGVsZW1lbnQuZGF0YSgnemZQbHVnaW4nKSl7IHBsdWdpbi4kZWxlbWVudC5kYXRhKCd6ZlBsdWdpbicsIHBsdWdpbik7IH1cbiAgICAgICAgICAvKipcbiAgICAgICAgICAgKiBGaXJlcyB3aGVuIHRoZSBwbHVnaW4gaGFzIGluaXRpYWxpemVkLlxuICAgICAgICAgICAqIEBldmVudCBQbHVnaW4jaW5pdFxuICAgICAgICAgICAqL1xuICAgIHBsdWdpbi4kZWxlbWVudC50cmlnZ2VyKGBpbml0LnpmLiR7cGx1Z2luTmFtZX1gKTtcblxuICAgIHRoaXMuX3V1aWRzLnB1c2gocGx1Z2luLnV1aWQpO1xuXG4gICAgcmV0dXJuO1xuICB9LFxuICAvKipcbiAgICogQGZ1bmN0aW9uXG4gICAqIFJlbW92ZXMgdGhlIHBsdWdpbnMgdXVpZCBmcm9tIHRoZSBfdXVpZHMgYXJyYXkuXG4gICAqIFJlbW92ZXMgdGhlIHpmUGx1Z2luIGRhdGEgYXR0cmlidXRlLCBhcyB3ZWxsIGFzIHRoZSBkYXRhLXBsdWdpbi1uYW1lIGF0dHJpYnV0ZS5cbiAgICogQWxzbyBmaXJlcyB0aGUgZGVzdHJveWVkIGV2ZW50IGZvciB0aGUgcGx1Z2luLCBjb25zb2xpZGF0aW5nIHJlcGV0aXRpdmUgY29kZS5cbiAgICogQHBhcmFtIHtPYmplY3R9IHBsdWdpbiAtIGFuIGluc3RhbmNlIG9mIGEgcGx1Z2luLCB1c3VhbGx5IGB0aGlzYCBpbiBjb250ZXh0LlxuICAgKiBAZmlyZXMgUGx1Z2luI2Rlc3Ryb3llZFxuICAgKi9cbiAgdW5yZWdpc3RlclBsdWdpbjogZnVuY3Rpb24ocGx1Z2luKXtcbiAgICB2YXIgcGx1Z2luTmFtZSA9IGh5cGhlbmF0ZShmdW5jdGlvbk5hbWUocGx1Z2luLiRlbGVtZW50LmRhdGEoJ3pmUGx1Z2luJykuY29uc3RydWN0b3IpKTtcblxuICAgIHRoaXMuX3V1aWRzLnNwbGljZSh0aGlzLl91dWlkcy5pbmRleE9mKHBsdWdpbi51dWlkKSwgMSk7XG4gICAgcGx1Z2luLiRlbGVtZW50LnJlbW92ZUF0dHIoYGRhdGEtJHtwbHVnaW5OYW1lfWApLnJlbW92ZURhdGEoJ3pmUGx1Z2luJylcbiAgICAgICAgICAvKipcbiAgICAgICAgICAgKiBGaXJlcyB3aGVuIHRoZSBwbHVnaW4gaGFzIGJlZW4gZGVzdHJveWVkLlxuICAgICAgICAgICAqIEBldmVudCBQbHVnaW4jZGVzdHJveWVkXG4gICAgICAgICAgICovXG4gICAgICAgICAgLnRyaWdnZXIoYGRlc3Ryb3llZC56Zi4ke3BsdWdpbk5hbWV9YCk7XG4gICAgZm9yKHZhciBwcm9wIGluIHBsdWdpbil7XG4gICAgICBwbHVnaW5bcHJvcF0gPSBudWxsOy8vY2xlYW4gdXAgc2NyaXB0IHRvIHByZXAgZm9yIGdhcmJhZ2UgY29sbGVjdGlvbi5cbiAgICB9XG4gICAgcmV0dXJuO1xuICB9LFxuXG4gIC8qKlxuICAgKiBAZnVuY3Rpb25cbiAgICogQ2F1c2VzIG9uZSBvciBtb3JlIGFjdGl2ZSBwbHVnaW5zIHRvIHJlLWluaXRpYWxpemUsIHJlc2V0dGluZyBldmVudCBsaXN0ZW5lcnMsIHJlY2FsY3VsYXRpbmcgcG9zaXRpb25zLCBldGMuXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwbHVnaW5zIC0gb3B0aW9uYWwgc3RyaW5nIG9mIGFuIGluZGl2aWR1YWwgcGx1Z2luIGtleSwgYXR0YWluZWQgYnkgY2FsbGluZyBgJChlbGVtZW50KS5kYXRhKCdwbHVnaW5OYW1lJylgLCBvciBzdHJpbmcgb2YgYSBwbHVnaW4gY2xhc3MgaS5lLiBgJ2Ryb3Bkb3duJ2BcbiAgICogQGRlZmF1bHQgSWYgbm8gYXJndW1lbnQgaXMgcGFzc2VkLCByZWZsb3cgYWxsIGN1cnJlbnRseSBhY3RpdmUgcGx1Z2lucy5cbiAgICovXG4gICByZUluaXQ6IGZ1bmN0aW9uKHBsdWdpbnMpe1xuICAgICB2YXIgaXNKUSA9IHBsdWdpbnMgaW5zdGFuY2VvZiAkO1xuICAgICB0cnl7XG4gICAgICAgaWYoaXNKUSl7XG4gICAgICAgICBwbHVnaW5zLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgICAgICAgJCh0aGlzKS5kYXRhKCd6ZlBsdWdpbicpLl9pbml0KCk7XG4gICAgICAgICB9KTtcbiAgICAgICB9ZWxzZXtcbiAgICAgICAgIHZhciB0eXBlID0gdHlwZW9mIHBsdWdpbnMsXG4gICAgICAgICBfdGhpcyA9IHRoaXMsXG4gICAgICAgICBmbnMgPSB7XG4gICAgICAgICAgICdvYmplY3QnOiBmdW5jdGlvbihwbGdzKXtcbiAgICAgICAgICAgICBwbGdzLmZvckVhY2goZnVuY3Rpb24ocCl7XG4gICAgICAgICAgICAgICBwID0gaHlwaGVuYXRlKHApO1xuICAgICAgICAgICAgICAgJCgnW2RhdGEtJysgcCArJ10nKS5mb3VuZGF0aW9uKCdfaW5pdCcpO1xuICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICB9LFxuICAgICAgICAgICAnc3RyaW5nJzogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICBwbHVnaW5zID0gaHlwaGVuYXRlKHBsdWdpbnMpO1xuICAgICAgICAgICAgICQoJ1tkYXRhLScrIHBsdWdpbnMgKyddJykuZm91bmRhdGlvbignX2luaXQnKTtcbiAgICAgICAgICAgfSxcbiAgICAgICAgICAgJ3VuZGVmaW5lZCc6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgdGhpc1snb2JqZWN0J10oT2JqZWN0LmtleXMoX3RoaXMuX3BsdWdpbnMpKTtcbiAgICAgICAgICAgfVxuICAgICAgICAgfTtcbiAgICAgICAgIGZuc1t0eXBlXShwbHVnaW5zKTtcbiAgICAgICB9XG4gICAgIH1jYXRjaChlcnIpe1xuICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgfWZpbmFsbHl7XG4gICAgICAgcmV0dXJuIHBsdWdpbnM7XG4gICAgIH1cbiAgIH0sXG5cbiAgLyoqXG4gICAqIHJldHVybnMgYSByYW5kb20gYmFzZS0zNiB1aWQgd2l0aCBuYW1lc3BhY2luZ1xuICAgKiBAZnVuY3Rpb25cbiAgICogQHBhcmFtIHtOdW1iZXJ9IGxlbmd0aCAtIG51bWJlciBvZiByYW5kb20gYmFzZS0zNiBkaWdpdHMgZGVzaXJlZC4gSW5jcmVhc2UgZm9yIG1vcmUgcmFuZG9tIHN0cmluZ3MuXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2UgLSBuYW1lIG9mIHBsdWdpbiB0byBiZSBpbmNvcnBvcmF0ZWQgaW4gdWlkLCBvcHRpb25hbC5cbiAgICogQGRlZmF1bHQge1N0cmluZ30gJycgLSBpZiBubyBwbHVnaW4gbmFtZSBpcyBwcm92aWRlZCwgbm90aGluZyBpcyBhcHBlbmRlZCB0byB0aGUgdWlkLlxuICAgKiBAcmV0dXJucyB7U3RyaW5nfSAtIHVuaXF1ZSBpZFxuICAgKi9cbiAgR2V0WW9EaWdpdHM6IGZ1bmN0aW9uKGxlbmd0aCwgbmFtZXNwYWNlKXtcbiAgICBsZW5ndGggPSBsZW5ndGggfHwgNjtcbiAgICByZXR1cm4gTWF0aC5yb3VuZCgoTWF0aC5wb3coMzYsIGxlbmd0aCArIDEpIC0gTWF0aC5yYW5kb20oKSAqIE1hdGgucG93KDM2LCBsZW5ndGgpKSkudG9TdHJpbmcoMzYpLnNsaWNlKDEpICsgKG5hbWVzcGFjZSA/IGAtJHtuYW1lc3BhY2V9YCA6ICcnKTtcbiAgfSxcbiAgLyoqXG4gICAqIEluaXRpYWxpemUgcGx1Z2lucyBvbiBhbnkgZWxlbWVudHMgd2l0aGluIGBlbGVtYCAoYW5kIGBlbGVtYCBpdHNlbGYpIHRoYXQgYXJlbid0IGFscmVhZHkgaW5pdGlhbGl6ZWQuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtIC0galF1ZXJ5IG9iamVjdCBjb250YWluaW5nIHRoZSBlbGVtZW50IHRvIGNoZWNrIGluc2lkZS4gQWxzbyBjaGVja3MgdGhlIGVsZW1lbnQgaXRzZWxmLCB1bmxlc3MgaXQncyB0aGUgYGRvY3VtZW50YCBvYmplY3QuXG4gICAqIEBwYXJhbSB7U3RyaW5nfEFycmF5fSBwbHVnaW5zIC0gQSBsaXN0IG9mIHBsdWdpbnMgdG8gaW5pdGlhbGl6ZS4gTGVhdmUgdGhpcyBvdXQgdG8gaW5pdGlhbGl6ZSBldmVyeXRoaW5nLlxuICAgKi9cbiAgcmVmbG93OiBmdW5jdGlvbihlbGVtLCBwbHVnaW5zKSB7XG5cbiAgICAvLyBJZiBwbHVnaW5zIGlzIHVuZGVmaW5lZCwganVzdCBncmFiIGV2ZXJ5dGhpbmdcbiAgICBpZiAodHlwZW9mIHBsdWdpbnMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBwbHVnaW5zID0gT2JqZWN0LmtleXModGhpcy5fcGx1Z2lucyk7XG4gICAgfVxuICAgIC8vIElmIHBsdWdpbnMgaXMgYSBzdHJpbmcsIGNvbnZlcnQgaXQgdG8gYW4gYXJyYXkgd2l0aCBvbmUgaXRlbVxuICAgIGVsc2UgaWYgKHR5cGVvZiBwbHVnaW5zID09PSAnc3RyaW5nJykge1xuICAgICAgcGx1Z2lucyA9IFtwbHVnaW5zXTtcbiAgICB9XG5cbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgLy8gSXRlcmF0ZSB0aHJvdWdoIGVhY2ggcGx1Z2luXG4gICAgJC5lYWNoKHBsdWdpbnMsIGZ1bmN0aW9uKGksIG5hbWUpIHtcbiAgICAgIC8vIEdldCB0aGUgY3VycmVudCBwbHVnaW5cbiAgICAgIHZhciBwbHVnaW4gPSBfdGhpcy5fcGx1Z2luc1tuYW1lXTtcblxuICAgICAgLy8gTG9jYWxpemUgdGhlIHNlYXJjaCB0byBhbGwgZWxlbWVudHMgaW5zaWRlIGVsZW0sIGFzIHdlbGwgYXMgZWxlbSBpdHNlbGYsIHVubGVzcyBlbGVtID09PSBkb2N1bWVudFxuICAgICAgdmFyICRlbGVtID0gJChlbGVtKS5maW5kKCdbZGF0YS0nK25hbWUrJ10nKS5hZGRCYWNrKCdbZGF0YS0nK25hbWUrJ10nKTtcblxuICAgICAgLy8gRm9yIGVhY2ggcGx1Z2luIGZvdW5kLCBpbml0aWFsaXplIGl0XG4gICAgICAkZWxlbS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJGVsID0gJCh0aGlzKSxcbiAgICAgICAgICAgIG9wdHMgPSB7fTtcbiAgICAgICAgLy8gRG9uJ3QgZG91YmxlLWRpcCBvbiBwbHVnaW5zXG4gICAgICAgIGlmICgkZWwuZGF0YSgnemZQbHVnaW4nKSkge1xuICAgICAgICAgIGNvbnNvbGUud2FybihcIlRyaWVkIHRvIGluaXRpYWxpemUgXCIrbmFtZStcIiBvbiBhbiBlbGVtZW50IHRoYXQgYWxyZWFkeSBoYXMgYSBGb3VuZGF0aW9uIHBsdWdpbi5cIik7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoJGVsLmF0dHIoJ2RhdGEtb3B0aW9ucycpKXtcbiAgICAgICAgICB2YXIgdGhpbmcgPSAkZWwuYXR0cignZGF0YS1vcHRpb25zJykuc3BsaXQoJzsnKS5mb3JFYWNoKGZ1bmN0aW9uKGUsIGkpe1xuICAgICAgICAgICAgdmFyIG9wdCA9IGUuc3BsaXQoJzonKS5tYXAoZnVuY3Rpb24oZWwpeyByZXR1cm4gZWwudHJpbSgpOyB9KTtcbiAgICAgICAgICAgIGlmKG9wdFswXSkgb3B0c1tvcHRbMF1dID0gcGFyc2VWYWx1ZShvcHRbMV0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHRyeXtcbiAgICAgICAgICAkZWwuZGF0YSgnemZQbHVnaW4nLCBuZXcgcGx1Z2luKCQodGhpcyksIG9wdHMpKTtcbiAgICAgICAgfWNhdGNoKGVyKXtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGVyKTtcbiAgICAgICAgfWZpbmFsbHl7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSxcbiAgZ2V0Rm5OYW1lOiBmdW5jdGlvbk5hbWUsXG4gIHRyYW5zaXRpb25lbmQ6IGZ1bmN0aW9uKCRlbGVtKXtcbiAgICB2YXIgdHJhbnNpdGlvbnMgPSB7XG4gICAgICAndHJhbnNpdGlvbic6ICd0cmFuc2l0aW9uZW5kJyxcbiAgICAgICdXZWJraXRUcmFuc2l0aW9uJzogJ3dlYmtpdFRyYW5zaXRpb25FbmQnLFxuICAgICAgJ01velRyYW5zaXRpb24nOiAndHJhbnNpdGlvbmVuZCcsXG4gICAgICAnT1RyYW5zaXRpb24nOiAnb3RyYW5zaXRpb25lbmQnXG4gICAgfTtcbiAgICB2YXIgZWxlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLFxuICAgICAgICBlbmQ7XG5cbiAgICBmb3IgKHZhciB0IGluIHRyYW5zaXRpb25zKXtcbiAgICAgIGlmICh0eXBlb2YgZWxlbS5zdHlsZVt0XSAhPT0gJ3VuZGVmaW5lZCcpe1xuICAgICAgICBlbmQgPSB0cmFuc2l0aW9uc1t0XTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYoZW5kKXtcbiAgICAgIHJldHVybiBlbmQ7XG4gICAgfWVsc2V7XG4gICAgICBlbmQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICRlbGVtLnRyaWdnZXJIYW5kbGVyKCd0cmFuc2l0aW9uZW5kJywgWyRlbGVtXSk7XG4gICAgICB9LCAxKTtcbiAgICAgIHJldHVybiAndHJhbnNpdGlvbmVuZCc7XG4gICAgfVxuICB9XG59O1xuXG5Gb3VuZGF0aW9uLnV0aWwgPSB7XG4gIC8qKlxuICAgKiBGdW5jdGlvbiBmb3IgYXBwbHlpbmcgYSBkZWJvdW5jZSBlZmZlY3QgdG8gYSBmdW5jdGlvbiBjYWxsLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyAtIEZ1bmN0aW9uIHRvIGJlIGNhbGxlZCBhdCBlbmQgb2YgdGltZW91dC5cbiAgICogQHBhcmFtIHtOdW1iZXJ9IGRlbGF5IC0gVGltZSBpbiBtcyB0byBkZWxheSB0aGUgY2FsbCBvZiBgZnVuY2AuXG4gICAqIEByZXR1cm5zIGZ1bmN0aW9uXG4gICAqL1xuICB0aHJvdHRsZTogZnVuY3Rpb24gKGZ1bmMsIGRlbGF5KSB7XG4gICAgdmFyIHRpbWVyID0gbnVsbDtcblxuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgY29udGV4dCA9IHRoaXMsIGFyZ3MgPSBhcmd1bWVudHM7XG5cbiAgICAgIGlmICh0aW1lciA9PT0gbnVsbCkge1xuICAgICAgICB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICAgICAgdGltZXIgPSBudWxsO1xuICAgICAgICB9LCBkZWxheSk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxufTtcblxuLy8gVE9ETzogY29uc2lkZXIgbm90IG1ha2luZyB0aGlzIGEgalF1ZXJ5IGZ1bmN0aW9uXG4vLyBUT0RPOiBuZWVkIHdheSB0byByZWZsb3cgdnMuIHJlLWluaXRpYWxpemVcbi8qKlxuICogVGhlIEZvdW5kYXRpb24galF1ZXJ5IG1ldGhvZC5cbiAqIEBwYXJhbSB7U3RyaW5nfEFycmF5fSBtZXRob2QgLSBBbiBhY3Rpb24gdG8gcGVyZm9ybSBvbiB0aGUgY3VycmVudCBqUXVlcnkgb2JqZWN0LlxuICovXG52YXIgZm91bmRhdGlvbiA9IGZ1bmN0aW9uKG1ldGhvZCkge1xuICB2YXIgdHlwZSA9IHR5cGVvZiBtZXRob2QsXG4gICAgICAkbWV0YSA9ICQoJ21ldGEuZm91bmRhdGlvbi1tcScpLFxuICAgICAgJG5vSlMgPSAkKCcubm8tanMnKTtcblxuICBpZighJG1ldGEubGVuZ3RoKXtcbiAgICAkKCc8bWV0YSBjbGFzcz1cImZvdW5kYXRpb24tbXFcIj4nKS5hcHBlbmRUbyhkb2N1bWVudC5oZWFkKTtcbiAgfVxuICBpZigkbm9KUy5sZW5ndGgpe1xuICAgICRub0pTLnJlbW92ZUNsYXNzKCduby1qcycpO1xuICB9XG5cbiAgaWYodHlwZSA9PT0gJ3VuZGVmaW5lZCcpey8vbmVlZHMgdG8gaW5pdGlhbGl6ZSB0aGUgRm91bmRhdGlvbiBvYmplY3QsIG9yIGFuIGluZGl2aWR1YWwgcGx1Z2luLlxuICAgIEZvdW5kYXRpb24uTWVkaWFRdWVyeS5faW5pdCgpO1xuICAgIEZvdW5kYXRpb24ucmVmbG93KHRoaXMpO1xuICB9ZWxzZSBpZih0eXBlID09PSAnc3RyaW5nJyl7Ly9hbiBpbmRpdmlkdWFsIG1ldGhvZCB0byBpbnZva2Ugb24gYSBwbHVnaW4gb3IgZ3JvdXAgb2YgcGx1Z2luc1xuICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTsvL2NvbGxlY3QgYWxsIHRoZSBhcmd1bWVudHMsIGlmIG5lY2Vzc2FyeVxuICAgIHZhciBwbHVnQ2xhc3MgPSB0aGlzLmRhdGEoJ3pmUGx1Z2luJyk7Ly9kZXRlcm1pbmUgdGhlIGNsYXNzIG9mIHBsdWdpblxuXG4gICAgaWYocGx1Z0NsYXNzICE9PSB1bmRlZmluZWQgJiYgcGx1Z0NsYXNzW21ldGhvZF0gIT09IHVuZGVmaW5lZCl7Ly9tYWtlIHN1cmUgYm90aCB0aGUgY2xhc3MgYW5kIG1ldGhvZCBleGlzdFxuICAgICAgaWYodGhpcy5sZW5ndGggPT09IDEpey8vaWYgdGhlcmUncyBvbmx5IG9uZSwgY2FsbCBpdCBkaXJlY3RseS5cbiAgICAgICAgICBwbHVnQ2xhc3NbbWV0aG9kXS5hcHBseShwbHVnQ2xhc3MsIGFyZ3MpO1xuICAgICAgfWVsc2V7XG4gICAgICAgIHRoaXMuZWFjaChmdW5jdGlvbihpLCBlbCl7Ly9vdGhlcndpc2UgbG9vcCB0aHJvdWdoIHRoZSBqUXVlcnkgY29sbGVjdGlvbiBhbmQgaW52b2tlIHRoZSBtZXRob2Qgb24gZWFjaFxuICAgICAgICAgIHBsdWdDbGFzc1ttZXRob2RdLmFwcGx5KCQoZWwpLmRhdGEoJ3pmUGx1Z2luJyksIGFyZ3MpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9ZWxzZXsvL2Vycm9yIGZvciBubyBjbGFzcyBvciBubyBtZXRob2RcbiAgICAgIHRocm93IG5ldyBSZWZlcmVuY2VFcnJvcihcIldlJ3JlIHNvcnJ5LCAnXCIgKyBtZXRob2QgKyBcIicgaXMgbm90IGFuIGF2YWlsYWJsZSBtZXRob2QgZm9yIFwiICsgKHBsdWdDbGFzcyA/IGZ1bmN0aW9uTmFtZShwbHVnQ2xhc3MpIDogJ3RoaXMgZWxlbWVudCcpICsgJy4nKTtcbiAgICB9XG4gIH1lbHNley8vZXJyb3IgZm9yIGludmFsaWQgYXJndW1lbnQgdHlwZVxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYFdlJ3JlIHNvcnJ5LCAke3R5cGV9IGlzIG5vdCBhIHZhbGlkIHBhcmFtZXRlci4gWW91IG11c3QgdXNlIGEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgbWV0aG9kIHlvdSB3aXNoIHRvIGludm9rZS5gKTtcbiAgfVxuICByZXR1cm4gdGhpcztcbn07XG5cbndpbmRvdy5Gb3VuZGF0aW9uID0gRm91bmRhdGlvbjtcbiQuZm4uZm91bmRhdGlvbiA9IGZvdW5kYXRpb247XG5cbi8vIFBvbHlmaWxsIGZvciByZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbihmdW5jdGlvbigpIHtcbiAgaWYgKCFEYXRlLm5vdyB8fCAhd2luZG93LkRhdGUubm93KVxuICAgIHdpbmRvdy5EYXRlLm5vdyA9IERhdGUubm93ID0gZnVuY3Rpb24oKSB7IHJldHVybiBuZXcgRGF0ZSgpLmdldFRpbWUoKTsgfTtcblxuICB2YXIgdmVuZG9ycyA9IFsnd2Via2l0JywgJ21veiddO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHZlbmRvcnMubGVuZ3RoICYmICF3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lOyArK2kpIHtcbiAgICAgIHZhciB2cCA9IHZlbmRvcnNbaV07XG4gICAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gd2luZG93W3ZwKydSZXF1ZXN0QW5pbWF0aW9uRnJhbWUnXTtcbiAgICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSA9ICh3aW5kb3dbdnArJ0NhbmNlbEFuaW1hdGlvbkZyYW1lJ11cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHx8IHdpbmRvd1t2cCsnQ2FuY2VsUmVxdWVzdEFuaW1hdGlvbkZyYW1lJ10pO1xuICB9XG4gIGlmICgvaVAoYWR8aG9uZXxvZCkuKk9TIDYvLnRlc3Qod2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQpXG4gICAgfHwgIXdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgIXdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSkge1xuICAgIHZhciBsYXN0VGltZSA9IDA7XG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBub3cgPSBEYXRlLm5vdygpO1xuICAgICAgICB2YXIgbmV4dFRpbWUgPSBNYXRoLm1heChsYXN0VGltZSArIDE2LCBub3cpO1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW5jdGlvbigpIHsgY2FsbGJhY2sobGFzdFRpbWUgPSBuZXh0VGltZSk7IH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG5leHRUaW1lIC0gbm93KTtcbiAgICB9O1xuICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSA9IGNsZWFyVGltZW91dDtcbiAgfVxuICAvKipcbiAgICogUG9seWZpbGwgZm9yIHBlcmZvcm1hbmNlLm5vdywgcmVxdWlyZWQgYnkgckFGXG4gICAqL1xuICBpZighd2luZG93LnBlcmZvcm1hbmNlIHx8ICF3aW5kb3cucGVyZm9ybWFuY2Uubm93KXtcbiAgICB3aW5kb3cucGVyZm9ybWFuY2UgPSB7XG4gICAgICBzdGFydDogRGF0ZS5ub3coKSxcbiAgICAgIG5vdzogZnVuY3Rpb24oKXsgcmV0dXJuIERhdGUubm93KCkgLSB0aGlzLnN0YXJ0OyB9XG4gICAgfTtcbiAgfVxufSkoKTtcbmlmICghRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQpIHtcbiAgRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQgPSBmdW5jdGlvbihvVGhpcykge1xuICAgIGlmICh0eXBlb2YgdGhpcyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgLy8gY2xvc2VzdCB0aGluZyBwb3NzaWJsZSB0byB0aGUgRUNNQVNjcmlwdCA1XG4gICAgICAvLyBpbnRlcm5hbCBJc0NhbGxhYmxlIGZ1bmN0aW9uXG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdGdW5jdGlvbi5wcm90b3R5cGUuYmluZCAtIHdoYXQgaXMgdHJ5aW5nIHRvIGJlIGJvdW5kIGlzIG5vdCBjYWxsYWJsZScpO1xuICAgIH1cblxuICAgIHZhciBhQXJncyAgID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSxcbiAgICAgICAgZlRvQmluZCA9IHRoaXMsXG4gICAgICAgIGZOT1AgICAgPSBmdW5jdGlvbigpIHt9LFxuICAgICAgICBmQm91bmQgID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIGZUb0JpbmQuYXBwbHkodGhpcyBpbnN0YW5jZW9mIGZOT1BcbiAgICAgICAgICAgICAgICAgPyB0aGlzXG4gICAgICAgICAgICAgICAgIDogb1RoaXMsXG4gICAgICAgICAgICAgICAgIGFBcmdzLmNvbmNhdChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgICAgIH07XG5cbiAgICBpZiAodGhpcy5wcm90b3R5cGUpIHtcbiAgICAgIC8vIG5hdGl2ZSBmdW5jdGlvbnMgZG9uJ3QgaGF2ZSBhIHByb3RvdHlwZVxuICAgICAgZk5PUC5wcm90b3R5cGUgPSB0aGlzLnByb3RvdHlwZTtcbiAgICB9XG4gICAgZkJvdW5kLnByb3RvdHlwZSA9IG5ldyBmTk9QKCk7XG5cbiAgICByZXR1cm4gZkJvdW5kO1xuICB9O1xufVxuLy8gUG9seWZpbGwgdG8gZ2V0IHRoZSBuYW1lIG9mIGEgZnVuY3Rpb24gaW4gSUU5XG5mdW5jdGlvbiBmdW5jdGlvbk5hbWUoZm4pIHtcbiAgaWYgKEZ1bmN0aW9uLnByb3RvdHlwZS5uYW1lID09PSB1bmRlZmluZWQpIHtcbiAgICB2YXIgZnVuY05hbWVSZWdleCA9IC9mdW5jdGlvblxccyhbXihdezEsfSlcXCgvO1xuICAgIHZhciByZXN1bHRzID0gKGZ1bmNOYW1lUmVnZXgpLmV4ZWMoKGZuKS50b1N0cmluZygpKTtcbiAgICByZXR1cm4gKHJlc3VsdHMgJiYgcmVzdWx0cy5sZW5ndGggPiAxKSA/IHJlc3VsdHNbMV0udHJpbSgpIDogXCJcIjtcbiAgfVxuICBlbHNlIGlmIChmbi5wcm90b3R5cGUgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBmbi5jb25zdHJ1Y3Rvci5uYW1lO1xuICB9XG4gIGVsc2Uge1xuICAgIHJldHVybiBmbi5wcm90b3R5cGUuY29uc3RydWN0b3IubmFtZTtcbiAgfVxufVxuZnVuY3Rpb24gcGFyc2VWYWx1ZShzdHIpe1xuICBpZigvdHJ1ZS8udGVzdChzdHIpKSByZXR1cm4gdHJ1ZTtcbiAgZWxzZSBpZigvZmFsc2UvLnRlc3Qoc3RyKSkgcmV0dXJuIGZhbHNlO1xuICBlbHNlIGlmKCFpc05hTihzdHIgKiAxKSkgcmV0dXJuIHBhcnNlRmxvYXQoc3RyKTtcbiAgcmV0dXJuIHN0cjtcbn1cbi8vIENvbnZlcnQgUGFzY2FsQ2FzZSB0byBrZWJhYi1jYXNlXG4vLyBUaGFuayB5b3U6IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzg5NTU1ODBcbmZ1bmN0aW9uIGh5cGhlbmF0ZShzdHIpIHtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC8oW2Etel0pKFtBLVpdKS9nLCAnJDEtJDInKS50b0xvd2VyQ2FzZSgpO1xufVxuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbkZvdW5kYXRpb24uQm94ID0ge1xuICBJbU5vdFRvdWNoaW5nWW91OiBJbU5vdFRvdWNoaW5nWW91LFxuICBHZXREaW1lbnNpb25zOiBHZXREaW1lbnNpb25zLFxuICBHZXRPZmZzZXRzOiBHZXRPZmZzZXRzXG59XG5cbi8qKlxuICogQ29tcGFyZXMgdGhlIGRpbWVuc2lvbnMgb2YgYW4gZWxlbWVudCB0byBhIGNvbnRhaW5lciBhbmQgZGV0ZXJtaW5lcyBjb2xsaXNpb24gZXZlbnRzIHdpdGggY29udGFpbmVyLlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gdGVzdCBmb3IgY29sbGlzaW9ucy5cbiAqIEBwYXJhbSB7alF1ZXJ5fSBwYXJlbnQgLSBqUXVlcnkgb2JqZWN0IHRvIHVzZSBhcyBib3VuZGluZyBjb250YWluZXIuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGxyT25seSAtIHNldCB0byB0cnVlIHRvIGNoZWNrIGxlZnQgYW5kIHJpZ2h0IHZhbHVlcyBvbmx5LlxuICogQHBhcmFtIHtCb29sZWFufSB0Yk9ubHkgLSBzZXQgdG8gdHJ1ZSB0byBjaGVjayB0b3AgYW5kIGJvdHRvbSB2YWx1ZXMgb25seS5cbiAqIEBkZWZhdWx0IGlmIG5vIHBhcmVudCBvYmplY3QgcGFzc2VkLCBkZXRlY3RzIGNvbGxpc2lvbnMgd2l0aCBgd2luZG93YC5cbiAqIEByZXR1cm5zIHtCb29sZWFufSAtIHRydWUgaWYgY29sbGlzaW9uIGZyZWUsIGZhbHNlIGlmIGEgY29sbGlzaW9uIGluIGFueSBkaXJlY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIEltTm90VG91Y2hpbmdZb3UoZWxlbWVudCwgcGFyZW50LCBsck9ubHksIHRiT25seSkge1xuICB2YXIgZWxlRGltcyA9IEdldERpbWVuc2lvbnMoZWxlbWVudCksXG4gICAgICB0b3AsIGJvdHRvbSwgbGVmdCwgcmlnaHQ7XG5cbiAgaWYgKHBhcmVudCkge1xuICAgIHZhciBwYXJEaW1zID0gR2V0RGltZW5zaW9ucyhwYXJlbnQpO1xuXG4gICAgYm90dG9tID0gKGVsZURpbXMub2Zmc2V0LnRvcCArIGVsZURpbXMuaGVpZ2h0IDw9IHBhckRpbXMuaGVpZ2h0ICsgcGFyRGltcy5vZmZzZXQudG9wKTtcbiAgICB0b3AgICAgPSAoZWxlRGltcy5vZmZzZXQudG9wID49IHBhckRpbXMub2Zmc2V0LnRvcCk7XG4gICAgbGVmdCAgID0gKGVsZURpbXMub2Zmc2V0LmxlZnQgPj0gcGFyRGltcy5vZmZzZXQubGVmdCk7XG4gICAgcmlnaHQgID0gKGVsZURpbXMub2Zmc2V0LmxlZnQgKyBlbGVEaW1zLndpZHRoIDw9IHBhckRpbXMud2lkdGggKyBwYXJEaW1zLm9mZnNldC5sZWZ0KTtcbiAgfVxuICBlbHNlIHtcbiAgICBib3R0b20gPSAoZWxlRGltcy5vZmZzZXQudG9wICsgZWxlRGltcy5oZWlnaHQgPD0gZWxlRGltcy53aW5kb3dEaW1zLmhlaWdodCArIGVsZURpbXMud2luZG93RGltcy5vZmZzZXQudG9wKTtcbiAgICB0b3AgICAgPSAoZWxlRGltcy5vZmZzZXQudG9wID49IGVsZURpbXMud2luZG93RGltcy5vZmZzZXQudG9wKTtcbiAgICBsZWZ0ICAgPSAoZWxlRGltcy5vZmZzZXQubGVmdCA+PSBlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LmxlZnQpO1xuICAgIHJpZ2h0ICA9IChlbGVEaW1zLm9mZnNldC5sZWZ0ICsgZWxlRGltcy53aWR0aCA8PSBlbGVEaW1zLndpbmRvd0RpbXMud2lkdGgpO1xuICB9XG5cbiAgdmFyIGFsbERpcnMgPSBbYm90dG9tLCB0b3AsIGxlZnQsIHJpZ2h0XTtcblxuICBpZiAobHJPbmx5KSB7XG4gICAgcmV0dXJuIGxlZnQgPT09IHJpZ2h0ID09PSB0cnVlO1xuICB9XG5cbiAgaWYgKHRiT25seSkge1xuICAgIHJldHVybiB0b3AgPT09IGJvdHRvbSA9PT0gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBhbGxEaXJzLmluZGV4T2YoZmFsc2UpID09PSAtMTtcbn07XG5cbi8qKlxuICogVXNlcyBuYXRpdmUgbWV0aG9kcyB0byByZXR1cm4gYW4gb2JqZWN0IG9mIGRpbWVuc2lvbiB2YWx1ZXMuXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7alF1ZXJ5IHx8IEhUTUx9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IG9yIERPTSBlbGVtZW50IGZvciB3aGljaCB0byBnZXQgdGhlIGRpbWVuc2lvbnMuIENhbiBiZSBhbnkgZWxlbWVudCBvdGhlciB0aGF0IGRvY3VtZW50IG9yIHdpbmRvdy5cbiAqIEByZXR1cm5zIHtPYmplY3R9IC0gbmVzdGVkIG9iamVjdCBvZiBpbnRlZ2VyIHBpeGVsIHZhbHVlc1xuICogVE9ETyAtIGlmIGVsZW1lbnQgaXMgd2luZG93LCByZXR1cm4gb25seSB0aG9zZSB2YWx1ZXMuXG4gKi9cbmZ1bmN0aW9uIEdldERpbWVuc2lvbnMoZWxlbSwgdGVzdCl7XG4gIGVsZW0gPSBlbGVtLmxlbmd0aCA/IGVsZW1bMF0gOiBlbGVtO1xuXG4gIGlmIChlbGVtID09PSB3aW5kb3cgfHwgZWxlbSA9PT0gZG9jdW1lbnQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJJJ20gc29ycnksIERhdmUuIEknbSBhZnJhaWQgSSBjYW4ndCBkbyB0aGF0LlwiKTtcbiAgfVxuXG4gIHZhciByZWN0ID0gZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcbiAgICAgIHBhclJlY3QgPSBlbGVtLnBhcmVudE5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksXG4gICAgICB3aW5SZWN0ID0gZG9jdW1lbnQuYm9keS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcbiAgICAgIHdpblkgPSB3aW5kb3cucGFnZVlPZmZzZXQsXG4gICAgICB3aW5YID0gd2luZG93LnBhZ2VYT2Zmc2V0O1xuXG4gIHJldHVybiB7XG4gICAgd2lkdGg6IHJlY3Qud2lkdGgsXG4gICAgaGVpZ2h0OiByZWN0LmhlaWdodCxcbiAgICBvZmZzZXQ6IHtcbiAgICAgIHRvcDogcmVjdC50b3AgKyB3aW5ZLFxuICAgICAgbGVmdDogcmVjdC5sZWZ0ICsgd2luWFxuICAgIH0sXG4gICAgcGFyZW50RGltczoge1xuICAgICAgd2lkdGg6IHBhclJlY3Qud2lkdGgsXG4gICAgICBoZWlnaHQ6IHBhclJlY3QuaGVpZ2h0LFxuICAgICAgb2Zmc2V0OiB7XG4gICAgICAgIHRvcDogcGFyUmVjdC50b3AgKyB3aW5ZLFxuICAgICAgICBsZWZ0OiBwYXJSZWN0LmxlZnQgKyB3aW5YXG4gICAgICB9XG4gICAgfSxcbiAgICB3aW5kb3dEaW1zOiB7XG4gICAgICB3aWR0aDogd2luUmVjdC53aWR0aCxcbiAgICAgIGhlaWdodDogd2luUmVjdC5oZWlnaHQsXG4gICAgICBvZmZzZXQ6IHtcbiAgICAgICAgdG9wOiB3aW5ZLFxuICAgICAgICBsZWZ0OiB3aW5YXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyBhbiBvYmplY3Qgb2YgdG9wIGFuZCBsZWZ0IGludGVnZXIgcGl4ZWwgdmFsdWVzIGZvciBkeW5hbWljYWxseSByZW5kZXJlZCBlbGVtZW50cyxcbiAqIHN1Y2ggYXM6IFRvb2x0aXAsIFJldmVhbCwgYW5kIERyb3Bkb3duXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCBmb3IgdGhlIGVsZW1lbnQgYmVpbmcgcG9zaXRpb25lZC5cbiAqIEBwYXJhbSB7alF1ZXJ5fSBhbmNob3IgLSBqUXVlcnkgb2JqZWN0IGZvciB0aGUgZWxlbWVudCdzIGFuY2hvciBwb2ludC5cbiAqIEBwYXJhbSB7U3RyaW5nfSBwb3NpdGlvbiAtIGEgc3RyaW5nIHJlbGF0aW5nIHRvIHRoZSBkZXNpcmVkIHBvc2l0aW9uIG9mIHRoZSBlbGVtZW50LCByZWxhdGl2ZSB0byBpdCdzIGFuY2hvclxuICogQHBhcmFtIHtOdW1iZXJ9IHZPZmZzZXQgLSBpbnRlZ2VyIHBpeGVsIHZhbHVlIG9mIGRlc2lyZWQgdmVydGljYWwgc2VwYXJhdGlvbiBiZXR3ZWVuIGFuY2hvciBhbmQgZWxlbWVudC5cbiAqIEBwYXJhbSB7TnVtYmVyfSBoT2Zmc2V0IC0gaW50ZWdlciBwaXhlbCB2YWx1ZSBvZiBkZXNpcmVkIGhvcml6b250YWwgc2VwYXJhdGlvbiBiZXR3ZWVuIGFuY2hvciBhbmQgZWxlbWVudC5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gaXNPdmVyZmxvdyAtIGlmIGEgY29sbGlzaW9uIGV2ZW50IGlzIGRldGVjdGVkLCBzZXRzIHRvIHRydWUgdG8gZGVmYXVsdCB0aGUgZWxlbWVudCB0byBmdWxsIHdpZHRoIC0gYW55IGRlc2lyZWQgb2Zmc2V0LlxuICogVE9ETyBhbHRlci9yZXdyaXRlIHRvIHdvcmsgd2l0aCBgZW1gIHZhbHVlcyBhcyB3ZWxsL2luc3RlYWQgb2YgcGl4ZWxzXG4gKi9cbmZ1bmN0aW9uIEdldE9mZnNldHMoZWxlbWVudCwgYW5jaG9yLCBwb3NpdGlvbiwgdk9mZnNldCwgaE9mZnNldCwgaXNPdmVyZmxvdykge1xuICB2YXIgJGVsZURpbXMgPSBHZXREaW1lbnNpb25zKGVsZW1lbnQpLFxuICAgICAgJGFuY2hvckRpbXMgPSBhbmNob3IgPyBHZXREaW1lbnNpb25zKGFuY2hvcikgOiBudWxsO1xuXG4gIHN3aXRjaCAocG9zaXRpb24pIHtcbiAgICBjYXNlICd0b3AnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogKEZvdW5kYXRpb24ucnRsKCkgPyAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCAtICRlbGVEaW1zLndpZHRoICsgJGFuY2hvckRpbXMud2lkdGggOiAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCksXG4gICAgICAgIHRvcDogJGFuY2hvckRpbXMub2Zmc2V0LnRvcCAtICgkZWxlRGltcy5oZWlnaHQgKyB2T2Zmc2V0KVxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnbGVmdCc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCAtICgkZWxlRGltcy53aWR0aCArIGhPZmZzZXQpLFxuICAgICAgICB0b3A6ICRhbmNob3JEaW1zLm9mZnNldC50b3BcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ3JpZ2h0JzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0ICsgJGFuY2hvckRpbXMud2lkdGggKyBoT2Zmc2V0LFxuICAgICAgICB0b3A6ICRhbmNob3JEaW1zLm9mZnNldC50b3BcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2NlbnRlciB0b3AnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogKCRhbmNob3JEaW1zLm9mZnNldC5sZWZ0ICsgKCRhbmNob3JEaW1zLndpZHRoIC8gMikpIC0gKCRlbGVEaW1zLndpZHRoIC8gMiksXG4gICAgICAgIHRvcDogJGFuY2hvckRpbXMub2Zmc2V0LnRvcCAtICgkZWxlRGltcy5oZWlnaHQgKyB2T2Zmc2V0KVxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnY2VudGVyIGJvdHRvbSc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiBpc092ZXJmbG93ID8gaE9mZnNldCA6ICgoJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgKyAoJGFuY2hvckRpbXMud2lkdGggLyAyKSkgLSAoJGVsZURpbXMud2lkdGggLyAyKSksXG4gICAgICAgIHRvcDogJGFuY2hvckRpbXMub2Zmc2V0LnRvcCArICRhbmNob3JEaW1zLmhlaWdodCArIHZPZmZzZXRcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2NlbnRlciBsZWZ0JzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0IC0gKCRlbGVEaW1zLndpZHRoICsgaE9mZnNldCksXG4gICAgICAgIHRvcDogKCRhbmNob3JEaW1zLm9mZnNldC50b3AgKyAoJGFuY2hvckRpbXMuaGVpZ2h0IC8gMikpIC0gKCRlbGVEaW1zLmhlaWdodCAvIDIpXG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlICdjZW50ZXIgcmlnaHQnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgKyAkYW5jaG9yRGltcy53aWR0aCArIGhPZmZzZXQgKyAxLFxuICAgICAgICB0b3A6ICgkYW5jaG9yRGltcy5vZmZzZXQudG9wICsgKCRhbmNob3JEaW1zLmhlaWdodCAvIDIpKSAtICgkZWxlRGltcy5oZWlnaHQgLyAyKVxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnY2VudGVyJzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6ICgkZWxlRGltcy53aW5kb3dEaW1zLm9mZnNldC5sZWZ0ICsgKCRlbGVEaW1zLndpbmRvd0RpbXMud2lkdGggLyAyKSkgLSAoJGVsZURpbXMud2lkdGggLyAyKSxcbiAgICAgICAgdG9wOiAoJGVsZURpbXMud2luZG93RGltcy5vZmZzZXQudG9wICsgKCRlbGVEaW1zLndpbmRvd0RpbXMuaGVpZ2h0IC8gMikpIC0gKCRlbGVEaW1zLmhlaWdodCAvIDIpXG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlICdyZXZlYWwnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogKCRlbGVEaW1zLndpbmRvd0RpbXMud2lkdGggLSAkZWxlRGltcy53aWR0aCkgLyAyLFxuICAgICAgICB0b3A6ICRlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LnRvcCArIHZPZmZzZXRcbiAgICAgIH1cbiAgICBjYXNlICdyZXZlYWwgZnVsbCc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiAkZWxlRGltcy53aW5kb3dEaW1zLm9mZnNldC5sZWZ0LFxuICAgICAgICB0b3A6ICRlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LnRvcFxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnbGVmdCBib3R0b20nOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQsXG4gICAgICAgIHRvcDogJGFuY2hvckRpbXMub2Zmc2V0LnRvcCArICRhbmNob3JEaW1zLmhlaWdodFxuICAgICAgfTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ3JpZ2h0IGJvdHRvbSc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCArICRhbmNob3JEaW1zLndpZHRoICsgaE9mZnNldCAtICRlbGVEaW1zLndpZHRoLFxuICAgICAgICB0b3A6ICRhbmNob3JEaW1zLm9mZnNldC50b3AgKyAkYW5jaG9yRGltcy5oZWlnaHRcbiAgICAgIH07XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogKEZvdW5kYXRpb24ucnRsKCkgPyAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCAtICRlbGVEaW1zLndpZHRoICsgJGFuY2hvckRpbXMud2lkdGggOiAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCArIGhPZmZzZXQpLFxuICAgICAgICB0b3A6ICRhbmNob3JEaW1zLm9mZnNldC50b3AgKyAkYW5jaG9yRGltcy5oZWlnaHQgKyB2T2Zmc2V0XG4gICAgICB9XG4gIH1cbn1cblxufShqUXVlcnkpO1xuIiwiLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4gKiBUaGlzIHV0aWwgd2FzIGNyZWF0ZWQgYnkgTWFyaXVzIE9sYmVydHogKlxuICogUGxlYXNlIHRoYW5rIE1hcml1cyBvbiBHaXRIdWIgL293bGJlcnR6ICpcbiAqIG9yIHRoZSB3ZWIgaHR0cDovL3d3dy5tYXJpdXNvbGJlcnR6LmRlLyAqXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG5jb25zdCBrZXlDb2RlcyA9IHtcbiAgOTogJ1RBQicsXG4gIDEzOiAnRU5URVInLFxuICAyNzogJ0VTQ0FQRScsXG4gIDMyOiAnU1BBQ0UnLFxuICAzNzogJ0FSUk9XX0xFRlQnLFxuICAzODogJ0FSUk9XX1VQJyxcbiAgMzk6ICdBUlJPV19SSUdIVCcsXG4gIDQwOiAnQVJST1dfRE9XTidcbn1cblxudmFyIGNvbW1hbmRzID0ge31cblxudmFyIEtleWJvYXJkID0ge1xuICBrZXlzOiBnZXRLZXlDb2RlcyhrZXlDb2RlcyksXG5cbiAgLyoqXG4gICAqIFBhcnNlcyB0aGUgKGtleWJvYXJkKSBldmVudCBhbmQgcmV0dXJucyBhIFN0cmluZyB0aGF0IHJlcHJlc2VudHMgaXRzIGtleVxuICAgKiBDYW4gYmUgdXNlZCBsaWtlIEZvdW5kYXRpb24ucGFyc2VLZXkoZXZlbnQpID09PSBGb3VuZGF0aW9uLmtleXMuU1BBQ0VcbiAgICogQHBhcmFtIHtFdmVudH0gZXZlbnQgLSB0aGUgZXZlbnQgZ2VuZXJhdGVkIGJ5IHRoZSBldmVudCBoYW5kbGVyXG4gICAqIEByZXR1cm4gU3RyaW5nIGtleSAtIFN0cmluZyB0aGF0IHJlcHJlc2VudHMgdGhlIGtleSBwcmVzc2VkXG4gICAqL1xuICBwYXJzZUtleShldmVudCkge1xuICAgIHZhciBrZXkgPSBrZXlDb2Rlc1tldmVudC53aGljaCB8fCBldmVudC5rZXlDb2RlXSB8fCBTdHJpbmcuZnJvbUNoYXJDb2RlKGV2ZW50LndoaWNoKS50b1VwcGVyQ2FzZSgpO1xuICAgIGlmIChldmVudC5zaGlmdEtleSkga2V5ID0gYFNISUZUXyR7a2V5fWA7XG4gICAgaWYgKGV2ZW50LmN0cmxLZXkpIGtleSA9IGBDVFJMXyR7a2V5fWA7XG4gICAgaWYgKGV2ZW50LmFsdEtleSkga2V5ID0gYEFMVF8ke2tleX1gO1xuICAgIHJldHVybiBrZXk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgdGhlIGdpdmVuIChrZXlib2FyZCkgZXZlbnRcbiAgICogQHBhcmFtIHtFdmVudH0gZXZlbnQgLSB0aGUgZXZlbnQgZ2VuZXJhdGVkIGJ5IHRoZSBldmVudCBoYW5kbGVyXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBjb21wb25lbnQgLSBGb3VuZGF0aW9uIGNvbXBvbmVudCdzIG5hbWUsIGUuZy4gU2xpZGVyIG9yIFJldmVhbFxuICAgKiBAcGFyYW0ge09iamVjdHN9IGZ1bmN0aW9ucyAtIGNvbGxlY3Rpb24gb2YgZnVuY3Rpb25zIHRoYXQgYXJlIHRvIGJlIGV4ZWN1dGVkXG4gICAqL1xuICBoYW5kbGVLZXkoZXZlbnQsIGNvbXBvbmVudCwgZnVuY3Rpb25zKSB7XG4gICAgdmFyIGNvbW1hbmRMaXN0ID0gY29tbWFuZHNbY29tcG9uZW50XSxcbiAgICAgIGtleUNvZGUgPSB0aGlzLnBhcnNlS2V5KGV2ZW50KSxcbiAgICAgIGNtZHMsXG4gICAgICBjb21tYW5kLFxuICAgICAgZm47XG5cbiAgICBpZiAoIWNvbW1hbmRMaXN0KSByZXR1cm4gY29uc29sZS53YXJuKCdDb21wb25lbnQgbm90IGRlZmluZWQhJyk7XG5cbiAgICBpZiAodHlwZW9mIGNvbW1hbmRMaXN0Lmx0ciA9PT0gJ3VuZGVmaW5lZCcpIHsgLy8gdGhpcyBjb21wb25lbnQgZG9lcyBub3QgZGlmZmVyZW50aWF0ZSBiZXR3ZWVuIGx0ciBhbmQgcnRsXG4gICAgICAgIGNtZHMgPSBjb21tYW5kTGlzdDsgLy8gdXNlIHBsYWluIGxpc3RcbiAgICB9IGVsc2UgeyAvLyBtZXJnZSBsdHIgYW5kIHJ0bDogaWYgZG9jdW1lbnQgaXMgcnRsLCBydGwgb3ZlcndyaXRlcyBsdHIgYW5kIHZpY2UgdmVyc2FcbiAgICAgICAgaWYgKEZvdW5kYXRpb24ucnRsKCkpIGNtZHMgPSAkLmV4dGVuZCh7fSwgY29tbWFuZExpc3QubHRyLCBjb21tYW5kTGlzdC5ydGwpO1xuXG4gICAgICAgIGVsc2UgY21kcyA9ICQuZXh0ZW5kKHt9LCBjb21tYW5kTGlzdC5ydGwsIGNvbW1hbmRMaXN0Lmx0cik7XG4gICAgfVxuICAgIGNvbW1hbmQgPSBjbWRzW2tleUNvZGVdO1xuXG4gICAgZm4gPSBmdW5jdGlvbnNbY29tbWFuZF07XG4gICAgaWYgKGZuICYmIHR5cGVvZiBmbiA9PT0gJ2Z1bmN0aW9uJykgeyAvLyBleGVjdXRlIGZ1bmN0aW9uICBpZiBleGlzdHNcbiAgICAgIHZhciByZXR1cm5WYWx1ZSA9IGZuLmFwcGx5KCk7XG4gICAgICBpZiAoZnVuY3Rpb25zLmhhbmRsZWQgfHwgdHlwZW9mIGZ1bmN0aW9ucy5oYW5kbGVkID09PSAnZnVuY3Rpb24nKSB7IC8vIGV4ZWN1dGUgZnVuY3Rpb24gd2hlbiBldmVudCB3YXMgaGFuZGxlZFxuICAgICAgICAgIGZ1bmN0aW9ucy5oYW5kbGVkKHJldHVyblZhbHVlKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGZ1bmN0aW9ucy51bmhhbmRsZWQgfHwgdHlwZW9mIGZ1bmN0aW9ucy51bmhhbmRsZWQgPT09ICdmdW5jdGlvbicpIHsgLy8gZXhlY3V0ZSBmdW5jdGlvbiB3aGVuIGV2ZW50IHdhcyBub3QgaGFuZGxlZFxuICAgICAgICAgIGZ1bmN0aW9ucy51bmhhbmRsZWQoKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIEZpbmRzIGFsbCBmb2N1c2FibGUgZWxlbWVudHMgd2l0aGluIHRoZSBnaXZlbiBgJGVsZW1lbnRgXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSAkZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gc2VhcmNoIHdpdGhpblxuICAgKiBAcmV0dXJuIHtqUXVlcnl9ICRmb2N1c2FibGUgLSBhbGwgZm9jdXNhYmxlIGVsZW1lbnRzIHdpdGhpbiBgJGVsZW1lbnRgXG4gICAqL1xuICBmaW5kRm9jdXNhYmxlKCRlbGVtZW50KSB7XG4gICAgcmV0dXJuICRlbGVtZW50LmZpbmQoJ2FbaHJlZl0sIGFyZWFbaHJlZl0sIGlucHV0Om5vdChbZGlzYWJsZWRdKSwgc2VsZWN0Om5vdChbZGlzYWJsZWRdKSwgdGV4dGFyZWE6bm90KFtkaXNhYmxlZF0pLCBidXR0b246bm90KFtkaXNhYmxlZF0pLCBpZnJhbWUsIG9iamVjdCwgZW1iZWQsICpbdGFiaW5kZXhdLCAqW2NvbnRlbnRlZGl0YWJsZV0nKS5maWx0ZXIoZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoISQodGhpcykuaXMoJzp2aXNpYmxlJykgfHwgJCh0aGlzKS5hdHRyKCd0YWJpbmRleCcpIDwgMCkgeyByZXR1cm4gZmFsc2U7IH0gLy9vbmx5IGhhdmUgdmlzaWJsZSBlbGVtZW50cyBhbmQgdGhvc2UgdGhhdCBoYXZlIGEgdGFiaW5kZXggZ3JlYXRlciBvciBlcXVhbCAwXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgfSxcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgY29tcG9uZW50IG5hbWUgbmFtZVxuICAgKiBAcGFyYW0ge09iamVjdH0gY29tcG9uZW50IC0gRm91bmRhdGlvbiBjb21wb25lbnQsIGUuZy4gU2xpZGVyIG9yIFJldmVhbFxuICAgKiBAcmV0dXJuIFN0cmluZyBjb21wb25lbnROYW1lXG4gICAqL1xuXG4gIHJlZ2lzdGVyKGNvbXBvbmVudE5hbWUsIGNtZHMpIHtcbiAgICBjb21tYW5kc1tjb21wb25lbnROYW1lXSA9IGNtZHM7XG4gIH1cbn1cblxuLypcbiAqIENvbnN0YW50cyBmb3IgZWFzaWVyIGNvbXBhcmluZy5cbiAqIENhbiBiZSB1c2VkIGxpa2UgRm91bmRhdGlvbi5wYXJzZUtleShldmVudCkgPT09IEZvdW5kYXRpb24ua2V5cy5TUEFDRVxuICovXG5mdW5jdGlvbiBnZXRLZXlDb2RlcyhrY3MpIHtcbiAgdmFyIGsgPSB7fTtcbiAgZm9yICh2YXIga2MgaW4ga2NzKSBrW2tjc1trY11dID0ga2NzW2tjXTtcbiAgcmV0dXJuIGs7XG59XG5cbkZvdW5kYXRpb24uS2V5Ym9hcmQgPSBLZXlib2FyZDtcblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG4vLyBEZWZhdWx0IHNldCBvZiBtZWRpYSBxdWVyaWVzXG5jb25zdCBkZWZhdWx0UXVlcmllcyA9IHtcbiAgJ2RlZmF1bHQnIDogJ29ubHkgc2NyZWVuJyxcbiAgbGFuZHNjYXBlIDogJ29ubHkgc2NyZWVuIGFuZCAob3JpZW50YXRpb246IGxhbmRzY2FwZSknLFxuICBwb3J0cmFpdCA6ICdvbmx5IHNjcmVlbiBhbmQgKG9yaWVudGF0aW9uOiBwb3J0cmFpdCknLFxuICByZXRpbmEgOiAnb25seSBzY3JlZW4gYW5kICgtd2Via2l0LW1pbi1kZXZpY2UtcGl4ZWwtcmF0aW86IDIpLCcgK1xuICAgICdvbmx5IHNjcmVlbiBhbmQgKG1pbi0tbW96LWRldmljZS1waXhlbC1yYXRpbzogMiksJyArXG4gICAgJ29ubHkgc2NyZWVuIGFuZCAoLW8tbWluLWRldmljZS1waXhlbC1yYXRpbzogMi8xKSwnICtcbiAgICAnb25seSBzY3JlZW4gYW5kIChtaW4tZGV2aWNlLXBpeGVsLXJhdGlvOiAyKSwnICtcbiAgICAnb25seSBzY3JlZW4gYW5kIChtaW4tcmVzb2x1dGlvbjogMTkyZHBpKSwnICtcbiAgICAnb25seSBzY3JlZW4gYW5kIChtaW4tcmVzb2x1dGlvbjogMmRwcHgpJ1xufTtcblxudmFyIE1lZGlhUXVlcnkgPSB7XG4gIHF1ZXJpZXM6IFtdLFxuXG4gIGN1cnJlbnQ6ICcnLFxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgbWVkaWEgcXVlcnkgaGVscGVyLCBieSBleHRyYWN0aW5nIHRoZSBicmVha3BvaW50IGxpc3QgZnJvbSB0aGUgQ1NTIGFuZCBhY3RpdmF0aW5nIHRoZSBicmVha3BvaW50IHdhdGNoZXIuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2luaXQoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBleHRyYWN0ZWRTdHlsZXMgPSAkKCcuZm91bmRhdGlvbi1tcScpLmNzcygnZm9udC1mYW1pbHknKTtcbiAgICB2YXIgbmFtZWRRdWVyaWVzO1xuXG4gICAgbmFtZWRRdWVyaWVzID0gcGFyc2VTdHlsZVRvT2JqZWN0KGV4dHJhY3RlZFN0eWxlcyk7XG5cbiAgICBmb3IgKHZhciBrZXkgaW4gbmFtZWRRdWVyaWVzKSB7XG4gICAgICBpZihuYW1lZFF1ZXJpZXMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICBzZWxmLnF1ZXJpZXMucHVzaCh7XG4gICAgICAgICAgbmFtZToga2V5LFxuICAgICAgICAgIHZhbHVlOiBgb25seSBzY3JlZW4gYW5kIChtaW4td2lkdGg6ICR7bmFtZWRRdWVyaWVzW2tleV19KWBcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5jdXJyZW50ID0gdGhpcy5fZ2V0Q3VycmVudFNpemUoKTtcblxuICAgIHRoaXMuX3dhdGNoZXIoKTtcbiAgfSxcblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoZSBzY3JlZW4gaXMgYXQgbGVhc3QgYXMgd2lkZSBhcyBhIGJyZWFrcG9pbnQuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcGFyYW0ge1N0cmluZ30gc2l6ZSAtIE5hbWUgb2YgdGhlIGJyZWFrcG9pbnQgdG8gY2hlY2suXG4gICAqIEByZXR1cm5zIHtCb29sZWFufSBgdHJ1ZWAgaWYgdGhlIGJyZWFrcG9pbnQgbWF0Y2hlcywgYGZhbHNlYCBpZiBpdCdzIHNtYWxsZXIuXG4gICAqL1xuICBhdExlYXN0KHNpemUpIHtcbiAgICB2YXIgcXVlcnkgPSB0aGlzLmdldChzaXplKTtcblxuICAgIGlmIChxdWVyeSkge1xuICAgICAgcmV0dXJuIHdpbmRvdy5tYXRjaE1lZGlhKHF1ZXJ5KS5tYXRjaGVzO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfSxcblxuICAvKipcbiAgICogR2V0cyB0aGUgbWVkaWEgcXVlcnkgb2YgYSBicmVha3BvaW50LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHBhcmFtIHtTdHJpbmd9IHNpemUgLSBOYW1lIG9mIHRoZSBicmVha3BvaW50IHRvIGdldC5cbiAgICogQHJldHVybnMge1N0cmluZ3xudWxsfSAtIFRoZSBtZWRpYSBxdWVyeSBvZiB0aGUgYnJlYWtwb2ludCwgb3IgYG51bGxgIGlmIHRoZSBicmVha3BvaW50IGRvZXNuJ3QgZXhpc3QuXG4gICAqL1xuICBnZXQoc2l6ZSkge1xuICAgIGZvciAodmFyIGkgaW4gdGhpcy5xdWVyaWVzKSB7XG4gICAgICBpZih0aGlzLnF1ZXJpZXMuaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgICAgdmFyIHF1ZXJ5ID0gdGhpcy5xdWVyaWVzW2ldO1xuICAgICAgICBpZiAoc2l6ZSA9PT0gcXVlcnkubmFtZSkgcmV0dXJuIHF1ZXJ5LnZhbHVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9LFxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjdXJyZW50IGJyZWFrcG9pbnQgbmFtZSBieSB0ZXN0aW5nIGV2ZXJ5IGJyZWFrcG9pbnQgYW5kIHJldHVybmluZyB0aGUgbGFzdCBvbmUgdG8gbWF0Y2ggKHRoZSBiaWdnZXN0IG9uZSkuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcmV0dXJucyB7U3RyaW5nfSBOYW1lIG9mIHRoZSBjdXJyZW50IGJyZWFrcG9pbnQuXG4gICAqL1xuICBfZ2V0Q3VycmVudFNpemUoKSB7XG4gICAgdmFyIG1hdGNoZWQ7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucXVlcmllcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHF1ZXJ5ID0gdGhpcy5xdWVyaWVzW2ldO1xuXG4gICAgICBpZiAod2luZG93Lm1hdGNoTWVkaWEocXVlcnkudmFsdWUpLm1hdGNoZXMpIHtcbiAgICAgICAgbWF0Y2hlZCA9IHF1ZXJ5O1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgbWF0Y2hlZCA9PT0gJ29iamVjdCcpIHtcbiAgICAgIHJldHVybiBtYXRjaGVkLm5hbWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBtYXRjaGVkO1xuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogQWN0aXZhdGVzIHRoZSBicmVha3BvaW50IHdhdGNoZXIsIHdoaWNoIGZpcmVzIGFuIGV2ZW50IG9uIHRoZSB3aW5kb3cgd2hlbmV2ZXIgdGhlIGJyZWFrcG9pbnQgY2hhbmdlcy5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfd2F0Y2hlcigpIHtcbiAgICAkKHdpbmRvdykub24oJ3Jlc2l6ZS56Zi5tZWRpYXF1ZXJ5JywgKCkgPT4ge1xuICAgICAgdmFyIG5ld1NpemUgPSB0aGlzLl9nZXRDdXJyZW50U2l6ZSgpLCBjdXJyZW50U2l6ZSA9IHRoaXMuY3VycmVudDtcblxuICAgICAgaWYgKG5ld1NpemUgIT09IGN1cnJlbnRTaXplKSB7XG4gICAgICAgIC8vIENoYW5nZSB0aGUgY3VycmVudCBtZWRpYSBxdWVyeVxuICAgICAgICB0aGlzLmN1cnJlbnQgPSBuZXdTaXplO1xuXG4gICAgICAgIC8vIEJyb2FkY2FzdCB0aGUgbWVkaWEgcXVlcnkgY2hhbmdlIG9uIHRoZSB3aW5kb3dcbiAgICAgICAgJCh3aW5kb3cpLnRyaWdnZXIoJ2NoYW5nZWQuemYubWVkaWFxdWVyeScsIFtuZXdTaXplLCBjdXJyZW50U2l6ZV0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59O1xuXG5Gb3VuZGF0aW9uLk1lZGlhUXVlcnkgPSBNZWRpYVF1ZXJ5O1xuXG4vLyBtYXRjaE1lZGlhKCkgcG9seWZpbGwgLSBUZXN0IGEgQ1NTIG1lZGlhIHR5cGUvcXVlcnkgaW4gSlMuXG4vLyBBdXRob3JzICYgY29weXJpZ2h0IChjKSAyMDEyOiBTY290dCBKZWhsLCBQYXVsIElyaXNoLCBOaWNob2xhcyBaYWthcywgRGF2aWQgS25pZ2h0LiBEdWFsIE1JVC9CU0QgbGljZW5zZVxud2luZG93Lm1hdGNoTWVkaWEgfHwgKHdpbmRvdy5tYXRjaE1lZGlhID0gZnVuY3Rpb24oKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICAvLyBGb3IgYnJvd3NlcnMgdGhhdCBzdXBwb3J0IG1hdGNoTWVkaXVtIGFwaSBzdWNoIGFzIElFIDkgYW5kIHdlYmtpdFxuICB2YXIgc3R5bGVNZWRpYSA9ICh3aW5kb3cuc3R5bGVNZWRpYSB8fCB3aW5kb3cubWVkaWEpO1xuXG4gIC8vIEZvciB0aG9zZSB0aGF0IGRvbid0IHN1cHBvcnQgbWF0Y2hNZWRpdW1cbiAgaWYgKCFzdHlsZU1lZGlhKSB7XG4gICAgdmFyIHN0eWxlICAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpLFxuICAgIHNjcmlwdCAgICAgID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3NjcmlwdCcpWzBdLFxuICAgIGluZm8gICAgICAgID0gbnVsbDtcblxuICAgIHN0eWxlLnR5cGUgID0gJ3RleHQvY3NzJztcbiAgICBzdHlsZS5pZCAgICA9ICdtYXRjaG1lZGlhanMtdGVzdCc7XG5cbiAgICBzY3JpcHQgJiYgc2NyaXB0LnBhcmVudE5vZGUgJiYgc2NyaXB0LnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKHN0eWxlLCBzY3JpcHQpO1xuXG4gICAgLy8gJ3N0eWxlLmN1cnJlbnRTdHlsZScgaXMgdXNlZCBieSBJRSA8PSA4IGFuZCAnd2luZG93LmdldENvbXB1dGVkU3R5bGUnIGZvciBhbGwgb3RoZXIgYnJvd3NlcnNcbiAgICBpbmZvID0gKCdnZXRDb21wdXRlZFN0eWxlJyBpbiB3aW5kb3cpICYmIHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKHN0eWxlLCBudWxsKSB8fCBzdHlsZS5jdXJyZW50U3R5bGU7XG5cbiAgICBzdHlsZU1lZGlhID0ge1xuICAgICAgbWF0Y2hNZWRpdW0obWVkaWEpIHtcbiAgICAgICAgdmFyIHRleHQgPSBgQG1lZGlhICR7bWVkaWF9eyAjbWF0Y2htZWRpYWpzLXRlc3QgeyB3aWR0aDogMXB4OyB9IH1gO1xuXG4gICAgICAgIC8vICdzdHlsZS5zdHlsZVNoZWV0JyBpcyB1c2VkIGJ5IElFIDw9IDggYW5kICdzdHlsZS50ZXh0Q29udGVudCcgZm9yIGFsbCBvdGhlciBicm93c2Vyc1xuICAgICAgICBpZiAoc3R5bGUuc3R5bGVTaGVldCkge1xuICAgICAgICAgIHN0eWxlLnN0eWxlU2hlZXQuY3NzVGV4dCA9IHRleHQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3R5bGUudGV4dENvbnRlbnQgPSB0ZXh0O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGVzdCBpZiBtZWRpYSBxdWVyeSBpcyB0cnVlIG9yIGZhbHNlXG4gICAgICAgIHJldHVybiBpbmZvLndpZHRoID09PSAnMXB4JztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24obWVkaWEpIHtcbiAgICByZXR1cm4ge1xuICAgICAgbWF0Y2hlczogc3R5bGVNZWRpYS5tYXRjaE1lZGl1bShtZWRpYSB8fCAnYWxsJyksXG4gICAgICBtZWRpYTogbWVkaWEgfHwgJ2FsbCdcbiAgICB9O1xuICB9XG59KCkpO1xuXG4vLyBUaGFuayB5b3U6IGh0dHBzOi8vZ2l0aHViLmNvbS9zaW5kcmVzb3JodXMvcXVlcnktc3RyaW5nXG5mdW5jdGlvbiBwYXJzZVN0eWxlVG9PYmplY3Qoc3RyKSB7XG4gIHZhciBzdHlsZU9iamVjdCA9IHt9O1xuXG4gIGlmICh0eXBlb2Ygc3RyICE9PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBzdHlsZU9iamVjdDtcbiAgfVxuXG4gIHN0ciA9IHN0ci50cmltKCkuc2xpY2UoMSwgLTEpOyAvLyBicm93c2VycyByZS1xdW90ZSBzdHJpbmcgc3R5bGUgdmFsdWVzXG5cbiAgaWYgKCFzdHIpIHtcbiAgICByZXR1cm4gc3R5bGVPYmplY3Q7XG4gIH1cblxuICBzdHlsZU9iamVjdCA9IHN0ci5zcGxpdCgnJicpLnJlZHVjZShmdW5jdGlvbihyZXQsIHBhcmFtKSB7XG4gICAgdmFyIHBhcnRzID0gcGFyYW0ucmVwbGFjZSgvXFwrL2csICcgJykuc3BsaXQoJz0nKTtcbiAgICB2YXIga2V5ID0gcGFydHNbMF07XG4gICAgdmFyIHZhbCA9IHBhcnRzWzFdO1xuICAgIGtleSA9IGRlY29kZVVSSUNvbXBvbmVudChrZXkpO1xuXG4gICAgLy8gbWlzc2luZyBgPWAgc2hvdWxkIGJlIGBudWxsYDpcbiAgICAvLyBodHRwOi8vdzMub3JnL1RSLzIwMTIvV0QtdXJsLTIwMTIwNTI0LyNjb2xsZWN0LXVybC1wYXJhbWV0ZXJzXG4gICAgdmFsID0gdmFsID09PSB1bmRlZmluZWQgPyBudWxsIDogZGVjb2RlVVJJQ29tcG9uZW50KHZhbCk7XG5cbiAgICBpZiAoIXJldC5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICByZXRba2V5XSA9IHZhbDtcbiAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkocmV0W2tleV0pKSB7XG4gICAgICByZXRba2V5XS5wdXNoKHZhbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldFtrZXldID0gW3JldFtrZXldLCB2YWxdO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9LCB7fSk7XG5cbiAgcmV0dXJuIHN0eWxlT2JqZWN0O1xufVxuXG5Gb3VuZGF0aW9uLk1lZGlhUXVlcnkgPSBNZWRpYVF1ZXJ5O1xuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbi8qKlxuICogTW90aW9uIG1vZHVsZS5cbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5tb3Rpb25cbiAqL1xuXG5jb25zdCBpbml0Q2xhc3NlcyAgID0gWydtdWktZW50ZXInLCAnbXVpLWxlYXZlJ107XG5jb25zdCBhY3RpdmVDbGFzc2VzID0gWydtdWktZW50ZXItYWN0aXZlJywgJ211aS1sZWF2ZS1hY3RpdmUnXTtcblxuY29uc3QgTW90aW9uID0ge1xuICBhbmltYXRlSW46IGZ1bmN0aW9uKGVsZW1lbnQsIGFuaW1hdGlvbiwgY2IpIHtcbiAgICBhbmltYXRlKHRydWUsIGVsZW1lbnQsIGFuaW1hdGlvbiwgY2IpO1xuICB9LFxuXG4gIGFuaW1hdGVPdXQ6IGZ1bmN0aW9uKGVsZW1lbnQsIGFuaW1hdGlvbiwgY2IpIHtcbiAgICBhbmltYXRlKGZhbHNlLCBlbGVtZW50LCBhbmltYXRpb24sIGNiKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBNb3ZlKGR1cmF0aW9uLCBlbGVtLCBmbil7XG4gIHZhciBhbmltLCBwcm9nLCBzdGFydCA9IG51bGw7XG4gIC8vIGNvbnNvbGUubG9nKCdjYWxsZWQnKTtcblxuICBmdW5jdGlvbiBtb3ZlKHRzKXtcbiAgICBpZighc3RhcnQpIHN0YXJ0ID0gd2luZG93LnBlcmZvcm1hbmNlLm5vdygpO1xuICAgIC8vIGNvbnNvbGUubG9nKHN0YXJ0LCB0cyk7XG4gICAgcHJvZyA9IHRzIC0gc3RhcnQ7XG4gICAgZm4uYXBwbHkoZWxlbSk7XG5cbiAgICBpZihwcm9nIDwgZHVyYXRpb24peyBhbmltID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShtb3ZlLCBlbGVtKTsgfVxuICAgIGVsc2V7XG4gICAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUoYW5pbSk7XG4gICAgICBlbGVtLnRyaWdnZXIoJ2ZpbmlzaGVkLnpmLmFuaW1hdGUnLCBbZWxlbV0pLnRyaWdnZXJIYW5kbGVyKCdmaW5pc2hlZC56Zi5hbmltYXRlJywgW2VsZW1dKTtcbiAgICB9XG4gIH1cbiAgYW5pbSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUobW92ZSk7XG59XG5cbi8qKlxuICogQW5pbWF0ZXMgYW4gZWxlbWVudCBpbiBvciBvdXQgdXNpbmcgYSBDU1MgdHJhbnNpdGlvbiBjbGFzcy5cbiAqIEBmdW5jdGlvblxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gaXNJbiAtIERlZmluZXMgaWYgdGhlIGFuaW1hdGlvbiBpcyBpbiBvciBvdXQuXG4gKiBAcGFyYW0ge09iamVjdH0gZWxlbWVudCAtIGpRdWVyeSBvciBIVE1MIG9iamVjdCB0byBhbmltYXRlLlxuICogQHBhcmFtIHtTdHJpbmd9IGFuaW1hdGlvbiAtIENTUyBjbGFzcyB0byB1c2UuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYiAtIENhbGxiYWNrIHRvIHJ1biB3aGVuIGFuaW1hdGlvbiBpcyBmaW5pc2hlZC5cbiAqL1xuZnVuY3Rpb24gYW5pbWF0ZShpc0luLCBlbGVtZW50LCBhbmltYXRpb24sIGNiKSB7XG4gIGVsZW1lbnQgPSAkKGVsZW1lbnQpLmVxKDApO1xuXG4gIGlmICghZWxlbWVudC5sZW5ndGgpIHJldHVybjtcblxuICB2YXIgaW5pdENsYXNzID0gaXNJbiA/IGluaXRDbGFzc2VzWzBdIDogaW5pdENsYXNzZXNbMV07XG4gIHZhciBhY3RpdmVDbGFzcyA9IGlzSW4gPyBhY3RpdmVDbGFzc2VzWzBdIDogYWN0aXZlQ2xhc3Nlc1sxXTtcblxuICAvLyBTZXQgdXAgdGhlIGFuaW1hdGlvblxuICByZXNldCgpO1xuXG4gIGVsZW1lbnRcbiAgICAuYWRkQ2xhc3MoYW5pbWF0aW9uKVxuICAgIC5jc3MoJ3RyYW5zaXRpb24nLCAnbm9uZScpO1xuXG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgZWxlbWVudC5hZGRDbGFzcyhpbml0Q2xhc3MpO1xuICAgIGlmIChpc0luKSBlbGVtZW50LnNob3coKTtcbiAgfSk7XG5cbiAgLy8gU3RhcnQgdGhlIGFuaW1hdGlvblxuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgIGVsZW1lbnRbMF0ub2Zmc2V0V2lkdGg7XG4gICAgZWxlbWVudFxuICAgICAgLmNzcygndHJhbnNpdGlvbicsICcnKVxuICAgICAgLmFkZENsYXNzKGFjdGl2ZUNsYXNzKTtcbiAgfSk7XG5cbiAgLy8gQ2xlYW4gdXAgdGhlIGFuaW1hdGlvbiB3aGVuIGl0IGZpbmlzaGVzXG4gIGVsZW1lbnQub25lKEZvdW5kYXRpb24udHJhbnNpdGlvbmVuZChlbGVtZW50KSwgZmluaXNoKTtcblxuICAvLyBIaWRlcyB0aGUgZWxlbWVudCAoZm9yIG91dCBhbmltYXRpb25zKSwgcmVzZXRzIHRoZSBlbGVtZW50LCBhbmQgcnVucyBhIGNhbGxiYWNrXG4gIGZ1bmN0aW9uIGZpbmlzaCgpIHtcbiAgICBpZiAoIWlzSW4pIGVsZW1lbnQuaGlkZSgpO1xuICAgIHJlc2V0KCk7XG4gICAgaWYgKGNiKSBjYi5hcHBseShlbGVtZW50KTtcbiAgfVxuXG4gIC8vIFJlc2V0cyB0cmFuc2l0aW9ucyBhbmQgcmVtb3ZlcyBtb3Rpb24tc3BlY2lmaWMgY2xhc3Nlc1xuICBmdW5jdGlvbiByZXNldCgpIHtcbiAgICBlbGVtZW50WzBdLnN0eWxlLnRyYW5zaXRpb25EdXJhdGlvbiA9IDA7XG4gICAgZWxlbWVudC5yZW1vdmVDbGFzcyhgJHtpbml0Q2xhc3N9ICR7YWN0aXZlQ2xhc3N9ICR7YW5pbWF0aW9ufWApO1xuICB9XG59XG5cbkZvdW5kYXRpb24uTW92ZSA9IE1vdmU7XG5Gb3VuZGF0aW9uLk1vdGlvbiA9IE1vdGlvbjtcblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG5jb25zdCBOZXN0ID0ge1xuICBGZWF0aGVyKG1lbnUsIHR5cGUgPSAnemYnKSB7XG4gICAgbWVudS5hdHRyKCdyb2xlJywgJ21lbnViYXInKTtcblxuICAgIHZhciBpdGVtcyA9IG1lbnUuZmluZCgnbGknKS5hdHRyKHsncm9sZSc6ICdtZW51aXRlbSd9KSxcbiAgICAgICAgc3ViTWVudUNsYXNzID0gYGlzLSR7dHlwZX0tc3VibWVudWAsXG4gICAgICAgIHN1Ykl0ZW1DbGFzcyA9IGAke3N1Yk1lbnVDbGFzc30taXRlbWAsXG4gICAgICAgIGhhc1N1YkNsYXNzID0gYGlzLSR7dHlwZX0tc3VibWVudS1wYXJlbnRgO1xuXG4gICAgbWVudS5maW5kKCdhOmZpcnN0JykuYXR0cigndGFiaW5kZXgnLCAwKTtcblxuICAgIGl0ZW1zLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgJGl0ZW0gPSAkKHRoaXMpLFxuICAgICAgICAgICRzdWIgPSAkaXRlbS5jaGlsZHJlbigndWwnKTtcblxuICAgICAgaWYgKCRzdWIubGVuZ3RoKSB7XG4gICAgICAgICRpdGVtXG4gICAgICAgICAgLmFkZENsYXNzKGhhc1N1YkNsYXNzKVxuICAgICAgICAgIC5hdHRyKHtcbiAgICAgICAgICAgICdhcmlhLWhhc3BvcHVwJzogdHJ1ZSxcbiAgICAgICAgICAgICdhcmlhLWV4cGFuZGVkJzogZmFsc2UsXG4gICAgICAgICAgICAnYXJpYS1sYWJlbCc6ICRpdGVtLmNoaWxkcmVuKCdhOmZpcnN0JykudGV4dCgpXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgJHN1YlxuICAgICAgICAgIC5hZGRDbGFzcyhgc3VibWVudSAke3N1Yk1lbnVDbGFzc31gKVxuICAgICAgICAgIC5hdHRyKHtcbiAgICAgICAgICAgICdkYXRhLXN1Ym1lbnUnOiAnJyxcbiAgICAgICAgICAgICdhcmlhLWhpZGRlbic6IHRydWUsXG4gICAgICAgICAgICAncm9sZSc6ICdtZW51J1xuICAgICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZiAoJGl0ZW0ucGFyZW50KCdbZGF0YS1zdWJtZW51XScpLmxlbmd0aCkge1xuICAgICAgICAkaXRlbS5hZGRDbGFzcyhgaXMtc3VibWVudS1pdGVtICR7c3ViSXRlbUNsYXNzfWApO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuO1xuICB9LFxuXG4gIEJ1cm4obWVudSwgdHlwZSkge1xuICAgIHZhciBpdGVtcyA9IG1lbnUuZmluZCgnbGknKS5yZW1vdmVBdHRyKCd0YWJpbmRleCcpLFxuICAgICAgICBzdWJNZW51Q2xhc3MgPSBgaXMtJHt0eXBlfS1zdWJtZW51YCxcbiAgICAgICAgc3ViSXRlbUNsYXNzID0gYCR7c3ViTWVudUNsYXNzfS1pdGVtYCxcbiAgICAgICAgaGFzU3ViQ2xhc3MgPSBgaXMtJHt0eXBlfS1zdWJtZW51LXBhcmVudGA7XG5cbiAgICBtZW51XG4gICAgICAuZmluZCgnPmxpLCAubWVudSwgLm1lbnUgPiBsaScpXG4gICAgICAucmVtb3ZlQ2xhc3MoYCR7c3ViTWVudUNsYXNzfSAke3N1Ykl0ZW1DbGFzc30gJHtoYXNTdWJDbGFzc30gaXMtc3VibWVudS1pdGVtIHN1Ym1lbnUgaXMtYWN0aXZlYClcbiAgICAgIC5yZW1vdmVBdHRyKCdkYXRhLXN1Ym1lbnUnKS5jc3MoJ2Rpc3BsYXknLCAnJyk7XG5cbiAgICAvLyBjb25zb2xlLmxvZyggICAgICBtZW51LmZpbmQoJy4nICsgc3ViTWVudUNsYXNzICsgJywgLicgKyBzdWJJdGVtQ2xhc3MgKyAnLCAuaGFzLXN1Ym1lbnUsIC5pcy1zdWJtZW51LWl0ZW0sIC5zdWJtZW51LCBbZGF0YS1zdWJtZW51XScpXG4gICAgLy8gICAgICAgICAgIC5yZW1vdmVDbGFzcyhzdWJNZW51Q2xhc3MgKyAnICcgKyBzdWJJdGVtQ2xhc3MgKyAnIGhhcy1zdWJtZW51IGlzLXN1Ym1lbnUtaXRlbSBzdWJtZW51JylcbiAgICAvLyAgICAgICAgICAgLnJlbW92ZUF0dHIoJ2RhdGEtc3VibWVudScpKTtcbiAgICAvLyBpdGVtcy5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgLy8gICB2YXIgJGl0ZW0gPSAkKHRoaXMpLFxuICAgIC8vICAgICAgICRzdWIgPSAkaXRlbS5jaGlsZHJlbigndWwnKTtcbiAgICAvLyAgIGlmKCRpdGVtLnBhcmVudCgnW2RhdGEtc3VibWVudV0nKS5sZW5ndGgpe1xuICAgIC8vICAgICAkaXRlbS5yZW1vdmVDbGFzcygnaXMtc3VibWVudS1pdGVtICcgKyBzdWJJdGVtQ2xhc3MpO1xuICAgIC8vICAgfVxuICAgIC8vICAgaWYoJHN1Yi5sZW5ndGgpe1xuICAgIC8vICAgICAkaXRlbS5yZW1vdmVDbGFzcygnaGFzLXN1Ym1lbnUnKTtcbiAgICAvLyAgICAgJHN1Yi5yZW1vdmVDbGFzcygnc3VibWVudSAnICsgc3ViTWVudUNsYXNzKS5yZW1vdmVBdHRyKCdkYXRhLXN1Ym1lbnUnKTtcbiAgICAvLyAgIH1cbiAgICAvLyB9KTtcbiAgfVxufVxuXG5Gb3VuZGF0aW9uLk5lc3QgPSBOZXN0O1xuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbmZ1bmN0aW9uIFRpbWVyKGVsZW0sIG9wdGlvbnMsIGNiKSB7XG4gIHZhciBfdGhpcyA9IHRoaXMsXG4gICAgICBkdXJhdGlvbiA9IG9wdGlvbnMuZHVyYXRpb24sLy9vcHRpb25zIGlzIGFuIG9iamVjdCBmb3IgZWFzaWx5IGFkZGluZyBmZWF0dXJlcyBsYXRlci5cbiAgICAgIG5hbWVTcGFjZSA9IE9iamVjdC5rZXlzKGVsZW0uZGF0YSgpKVswXSB8fCAndGltZXInLFxuICAgICAgcmVtYWluID0gLTEsXG4gICAgICBzdGFydCxcbiAgICAgIHRpbWVyO1xuXG4gIHRoaXMuaXNQYXVzZWQgPSBmYWxzZTtcblxuICB0aGlzLnJlc3RhcnQgPSBmdW5jdGlvbigpIHtcbiAgICByZW1haW4gPSAtMTtcbiAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgIHRoaXMuc3RhcnQoKTtcbiAgfVxuXG4gIHRoaXMuc3RhcnQgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmlzUGF1c2VkID0gZmFsc2U7XG4gICAgLy8gaWYoIWVsZW0uZGF0YSgncGF1c2VkJykpeyByZXR1cm4gZmFsc2U7IH0vL21heWJlIGltcGxlbWVudCB0aGlzIHNhbml0eSBjaGVjayBpZiB1c2VkIGZvciBvdGhlciB0aGluZ3MuXG4gICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICByZW1haW4gPSByZW1haW4gPD0gMCA/IGR1cmF0aW9uIDogcmVtYWluO1xuICAgIGVsZW0uZGF0YSgncGF1c2VkJywgZmFsc2UpO1xuICAgIHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgIGlmKG9wdGlvbnMuaW5maW5pdGUpe1xuICAgICAgICBfdGhpcy5yZXN0YXJ0KCk7Ly9yZXJ1biB0aGUgdGltZXIuXG4gICAgICB9XG4gICAgICBpZiAoY2IgJiYgdHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSB7IGNiKCk7IH1cbiAgICB9LCByZW1haW4pO1xuICAgIGVsZW0udHJpZ2dlcihgdGltZXJzdGFydC56Zi4ke25hbWVTcGFjZX1gKTtcbiAgfVxuXG4gIHRoaXMucGF1c2UgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmlzUGF1c2VkID0gdHJ1ZTtcbiAgICAvL2lmKGVsZW0uZGF0YSgncGF1c2VkJykpeyByZXR1cm4gZmFsc2U7IH0vL21heWJlIGltcGxlbWVudCB0aGlzIHNhbml0eSBjaGVjayBpZiB1c2VkIGZvciBvdGhlciB0aGluZ3MuXG4gICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICBlbGVtLmRhdGEoJ3BhdXNlZCcsIHRydWUpO1xuICAgIHZhciBlbmQgPSBEYXRlLm5vdygpO1xuICAgIHJlbWFpbiA9IHJlbWFpbiAtIChlbmQgLSBzdGFydCk7XG4gICAgZWxlbS50cmlnZ2VyKGB0aW1lcnBhdXNlZC56Zi4ke25hbWVTcGFjZX1gKTtcbiAgfVxufVxuXG4vKipcbiAqIFJ1bnMgYSBjYWxsYmFjayBmdW5jdGlvbiB3aGVuIGltYWdlcyBhcmUgZnVsbHkgbG9hZGVkLlxuICogQHBhcmFtIHtPYmplY3R9IGltYWdlcyAtIEltYWdlKHMpIHRvIGNoZWNrIGlmIGxvYWRlZC5cbiAqIEBwYXJhbSB7RnVuY30gY2FsbGJhY2sgLSBGdW5jdGlvbiB0byBleGVjdXRlIHdoZW4gaW1hZ2UgaXMgZnVsbHkgbG9hZGVkLlxuICovXG5mdW5jdGlvbiBvbkltYWdlc0xvYWRlZChpbWFnZXMsIGNhbGxiYWNrKXtcbiAgdmFyIHNlbGYgPSB0aGlzLFxuICAgICAgdW5sb2FkZWQgPSBpbWFnZXMubGVuZ3RoO1xuXG4gIGlmICh1bmxvYWRlZCA9PT0gMCkge1xuICAgIGNhbGxiYWNrKCk7XG4gIH1cblxuICBpbWFnZXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5jb21wbGV0ZSkge1xuICAgICAgc2luZ2xlSW1hZ2VMb2FkZWQoKTtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIHRoaXMubmF0dXJhbFdpZHRoICE9PSAndW5kZWZpbmVkJyAmJiB0aGlzLm5hdHVyYWxXaWR0aCA+IDApIHtcbiAgICAgIHNpbmdsZUltYWdlTG9hZGVkKCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgJCh0aGlzKS5vbmUoJ2xvYWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgc2luZ2xlSW1hZ2VMb2FkZWQoKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfSk7XG5cbiAgZnVuY3Rpb24gc2luZ2xlSW1hZ2VMb2FkZWQoKSB7XG4gICAgdW5sb2FkZWQtLTtcbiAgICBpZiAodW5sb2FkZWQgPT09IDApIHtcbiAgICAgIGNhbGxiYWNrKCk7XG4gICAgfVxuICB9XG59XG5cbkZvdW5kYXRpb24uVGltZXIgPSBUaW1lcjtcbkZvdW5kYXRpb24ub25JbWFnZXNMb2FkZWQgPSBvbkltYWdlc0xvYWRlZDtcblxufShqUXVlcnkpO1xuIiwiLy8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuLy8qKldvcmsgaW5zcGlyZWQgYnkgbXVsdGlwbGUganF1ZXJ5IHN3aXBlIHBsdWdpbnMqKlxuLy8qKkRvbmUgYnkgWW9oYWkgQXJhcmF0ICoqKioqKioqKioqKioqKioqKioqKioqKioqKlxuLy8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuKGZ1bmN0aW9uKCQpIHtcblxuICAkLnNwb3RTd2lwZSA9IHtcbiAgICB2ZXJzaW9uOiAnMS4wLjAnLFxuICAgIGVuYWJsZWQ6ICdvbnRvdWNoc3RhcnQnIGluIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCxcbiAgICBwcmV2ZW50RGVmYXVsdDogZmFsc2UsXG4gICAgbW92ZVRocmVzaG9sZDogNzUsXG4gICAgdGltZVRocmVzaG9sZDogMjAwXG4gIH07XG5cbiAgdmFyICAgc3RhcnRQb3NYLFxuICAgICAgICBzdGFydFBvc1ksXG4gICAgICAgIHN0YXJ0VGltZSxcbiAgICAgICAgZWxhcHNlZFRpbWUsXG4gICAgICAgIGlzTW92aW5nID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gb25Ub3VjaEVuZCgpIHtcbiAgICAvLyAgYWxlcnQodGhpcyk7XG4gICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCBvblRvdWNoTW92ZSk7XG4gICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIG9uVG91Y2hFbmQpO1xuICAgIGlzTW92aW5nID0gZmFsc2U7XG4gIH1cblxuICBmdW5jdGlvbiBvblRvdWNoTW92ZShlKSB7XG4gICAgaWYgKCQuc3BvdFN3aXBlLnByZXZlbnREZWZhdWx0KSB7IGUucHJldmVudERlZmF1bHQoKTsgfVxuICAgIGlmKGlzTW92aW5nKSB7XG4gICAgICB2YXIgeCA9IGUudG91Y2hlc1swXS5wYWdlWDtcbiAgICAgIHZhciB5ID0gZS50b3VjaGVzWzBdLnBhZ2VZO1xuICAgICAgdmFyIGR4ID0gc3RhcnRQb3NYIC0geDtcbiAgICAgIHZhciBkeSA9IHN0YXJ0UG9zWSAtIHk7XG4gICAgICB2YXIgZGlyO1xuICAgICAgZWxhcHNlZFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIHN0YXJ0VGltZTtcbiAgICAgIGlmKE1hdGguYWJzKGR4KSA+PSAkLnNwb3RTd2lwZS5tb3ZlVGhyZXNob2xkICYmIGVsYXBzZWRUaW1lIDw9ICQuc3BvdFN3aXBlLnRpbWVUaHJlc2hvbGQpIHtcbiAgICAgICAgZGlyID0gZHggPiAwID8gJ2xlZnQnIDogJ3JpZ2h0JztcbiAgICAgIH1cbiAgICAgIC8vIGVsc2UgaWYoTWF0aC5hYnMoZHkpID49ICQuc3BvdFN3aXBlLm1vdmVUaHJlc2hvbGQgJiYgZWxhcHNlZFRpbWUgPD0gJC5zcG90U3dpcGUudGltZVRocmVzaG9sZCkge1xuICAgICAgLy8gICBkaXIgPSBkeSA+IDAgPyAnZG93bicgOiAndXAnO1xuICAgICAgLy8gfVxuICAgICAgaWYoZGlyKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgb25Ub3VjaEVuZC5jYWxsKHRoaXMpO1xuICAgICAgICAkKHRoaXMpLnRyaWdnZXIoJ3N3aXBlJywgZGlyKS50cmlnZ2VyKGBzd2lwZSR7ZGlyfWApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIG9uVG91Y2hTdGFydChlKSB7XG4gICAgaWYgKGUudG91Y2hlcy5sZW5ndGggPT0gMSkge1xuICAgICAgc3RhcnRQb3NYID0gZS50b3VjaGVzWzBdLnBhZ2VYO1xuICAgICAgc3RhcnRQb3NZID0gZS50b3VjaGVzWzBdLnBhZ2VZO1xuICAgICAgaXNNb3ZpbmcgPSB0cnVlO1xuICAgICAgc3RhcnRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIG9uVG91Y2hNb3ZlLCBmYWxzZSk7XG4gICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgb25Ub3VjaEVuZCwgZmFsc2UpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgdGhpcy5hZGRFdmVudExpc3RlbmVyICYmIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIG9uVG91Y2hTdGFydCwgZmFsc2UpO1xuICB9XG5cbiAgZnVuY3Rpb24gdGVhcmRvd24oKSB7XG4gICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0Jywgb25Ub3VjaFN0YXJ0KTtcbiAgfVxuXG4gICQuZXZlbnQuc3BlY2lhbC5zd2lwZSA9IHsgc2V0dXA6IGluaXQgfTtcblxuICAkLmVhY2goWydsZWZ0JywgJ3VwJywgJ2Rvd24nLCAncmlnaHQnXSwgZnVuY3Rpb24gKCkge1xuICAgICQuZXZlbnQuc3BlY2lhbFtgc3dpcGUke3RoaXN9YF0gPSB7IHNldHVwOiBmdW5jdGlvbigpe1xuICAgICAgJCh0aGlzKS5vbignc3dpcGUnLCAkLm5vb3ApO1xuICAgIH0gfTtcbiAgfSk7XG59KShqUXVlcnkpO1xuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqIE1ldGhvZCBmb3IgYWRkaW5nIHBzdWVkbyBkcmFnIGV2ZW50cyB0byBlbGVtZW50cyAqXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuIWZ1bmN0aW9uKCQpe1xuICAkLmZuLmFkZFRvdWNoID0gZnVuY3Rpb24oKXtcbiAgICB0aGlzLmVhY2goZnVuY3Rpb24oaSxlbCl7XG4gICAgICAkKGVsKS5iaW5kKCd0b3VjaHN0YXJ0IHRvdWNobW92ZSB0b3VjaGVuZCB0b3VjaGNhbmNlbCcsZnVuY3Rpb24oKXtcbiAgICAgICAgLy93ZSBwYXNzIHRoZSBvcmlnaW5hbCBldmVudCBvYmplY3QgYmVjYXVzZSB0aGUgalF1ZXJ5IGV2ZW50XG4gICAgICAgIC8vb2JqZWN0IGlzIG5vcm1hbGl6ZWQgdG8gdzNjIHNwZWNzIGFuZCBkb2VzIG5vdCBwcm92aWRlIHRoZSBUb3VjaExpc3RcbiAgICAgICAgaGFuZGxlVG91Y2goZXZlbnQpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB2YXIgaGFuZGxlVG91Y2ggPSBmdW5jdGlvbihldmVudCl7XG4gICAgICB2YXIgdG91Y2hlcyA9IGV2ZW50LmNoYW5nZWRUb3VjaGVzLFxuICAgICAgICAgIGZpcnN0ID0gdG91Y2hlc1swXSxcbiAgICAgICAgICBldmVudFR5cGVzID0ge1xuICAgICAgICAgICAgdG91Y2hzdGFydDogJ21vdXNlZG93bicsXG4gICAgICAgICAgICB0b3VjaG1vdmU6ICdtb3VzZW1vdmUnLFxuICAgICAgICAgICAgdG91Y2hlbmQ6ICdtb3VzZXVwJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAgdHlwZSA9IGV2ZW50VHlwZXNbZXZlbnQudHlwZV0sXG4gICAgICAgICAgc2ltdWxhdGVkRXZlbnRcbiAgICAgICAgO1xuXG4gICAgICBpZignTW91c2VFdmVudCcgaW4gd2luZG93ICYmIHR5cGVvZiB3aW5kb3cuTW91c2VFdmVudCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBzaW11bGF0ZWRFdmVudCA9IG5ldyB3aW5kb3cuTW91c2VFdmVudCh0eXBlLCB7XG4gICAgICAgICAgJ2J1YmJsZXMnOiB0cnVlLFxuICAgICAgICAgICdjYW5jZWxhYmxlJzogdHJ1ZSxcbiAgICAgICAgICAnc2NyZWVuWCc6IGZpcnN0LnNjcmVlblgsXG4gICAgICAgICAgJ3NjcmVlblknOiBmaXJzdC5zY3JlZW5ZLFxuICAgICAgICAgICdjbGllbnRYJzogZmlyc3QuY2xpZW50WCxcbiAgICAgICAgICAnY2xpZW50WSc6IGZpcnN0LmNsaWVudFlcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzaW11bGF0ZWRFdmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdNb3VzZUV2ZW50Jyk7XG4gICAgICAgIHNpbXVsYXRlZEV2ZW50LmluaXRNb3VzZUV2ZW50KHR5cGUsIHRydWUsIHRydWUsIHdpbmRvdywgMSwgZmlyc3Quc2NyZWVuWCwgZmlyc3Quc2NyZWVuWSwgZmlyc3QuY2xpZW50WCwgZmlyc3QuY2xpZW50WSwgZmFsc2UsIGZhbHNlLCBmYWxzZSwgZmFsc2UsIDAvKmxlZnQqLywgbnVsbCk7XG4gICAgICB9XG4gICAgICBmaXJzdC50YXJnZXQuZGlzcGF0Y2hFdmVudChzaW11bGF0ZWRFdmVudCk7XG4gICAgfTtcbiAgfTtcbn0oalF1ZXJ5KTtcblxuXG4vLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbi8vKipGcm9tIHRoZSBqUXVlcnkgTW9iaWxlIExpYnJhcnkqKlxuLy8qKm5lZWQgdG8gcmVjcmVhdGUgZnVuY3Rpb25hbGl0eSoqXG4vLyoqYW5kIHRyeSB0byBpbXByb3ZlIGlmIHBvc3NpYmxlKipcbi8vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXG4vKiBSZW1vdmluZyB0aGUgalF1ZXJ5IGZ1bmN0aW9uICoqKipcbioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXG4oZnVuY3Rpb24oICQsIHdpbmRvdywgdW5kZWZpbmVkICkge1xuXG5cdHZhciAkZG9jdW1lbnQgPSAkKCBkb2N1bWVudCApLFxuXHRcdC8vIHN1cHBvcnRUb3VjaCA9ICQubW9iaWxlLnN1cHBvcnQudG91Y2gsXG5cdFx0dG91Y2hTdGFydEV2ZW50ID0gJ3RvdWNoc3RhcnQnLy9zdXBwb3J0VG91Y2ggPyBcInRvdWNoc3RhcnRcIiA6IFwibW91c2Vkb3duXCIsXG5cdFx0dG91Y2hTdG9wRXZlbnQgPSAndG91Y2hlbmQnLy9zdXBwb3J0VG91Y2ggPyBcInRvdWNoZW5kXCIgOiBcIm1vdXNldXBcIixcblx0XHR0b3VjaE1vdmVFdmVudCA9ICd0b3VjaG1vdmUnLy9zdXBwb3J0VG91Y2ggPyBcInRvdWNobW92ZVwiIDogXCJtb3VzZW1vdmVcIjtcblxuXHQvLyBzZXR1cCBuZXcgZXZlbnQgc2hvcnRjdXRzXG5cdCQuZWFjaCggKCBcInRvdWNoc3RhcnQgdG91Y2htb3ZlIHRvdWNoZW5kIFwiICtcblx0XHRcInN3aXBlIHN3aXBlbGVmdCBzd2lwZXJpZ2h0XCIgKS5zcGxpdCggXCIgXCIgKSwgZnVuY3Rpb24oIGksIG5hbWUgKSB7XG5cblx0XHQkLmZuWyBuYW1lIF0gPSBmdW5jdGlvbiggZm4gKSB7XG5cdFx0XHRyZXR1cm4gZm4gPyB0aGlzLmJpbmQoIG5hbWUsIGZuICkgOiB0aGlzLnRyaWdnZXIoIG5hbWUgKTtcblx0XHR9O1xuXG5cdFx0Ly8galF1ZXJ5IDwgMS44XG5cdFx0aWYgKCAkLmF0dHJGbiApIHtcblx0XHRcdCQuYXR0ckZuWyBuYW1lIF0gPSB0cnVlO1xuXHRcdH1cblx0fSk7XG5cblx0ZnVuY3Rpb24gdHJpZ2dlckN1c3RvbUV2ZW50KCBvYmosIGV2ZW50VHlwZSwgZXZlbnQsIGJ1YmJsZSApIHtcblx0XHR2YXIgb3JpZ2luYWxUeXBlID0gZXZlbnQudHlwZTtcblx0XHRldmVudC50eXBlID0gZXZlbnRUeXBlO1xuXHRcdGlmICggYnViYmxlICkge1xuXHRcdFx0JC5ldmVudC50cmlnZ2VyKCBldmVudCwgdW5kZWZpbmVkLCBvYmogKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0JC5ldmVudC5kaXNwYXRjaC5jYWxsKCBvYmosIGV2ZW50ICk7XG5cdFx0fVxuXHRcdGV2ZW50LnR5cGUgPSBvcmlnaW5hbFR5cGU7XG5cdH1cblxuXHQvLyBhbHNvIGhhbmRsZXMgdGFwaG9sZFxuXG5cdC8vIEFsc28gaGFuZGxlcyBzd2lwZWxlZnQsIHN3aXBlcmlnaHRcblx0JC5ldmVudC5zcGVjaWFsLnN3aXBlID0ge1xuXG5cdFx0Ly8gTW9yZSB0aGFuIHRoaXMgaG9yaXpvbnRhbCBkaXNwbGFjZW1lbnQsIGFuZCB3ZSB3aWxsIHN1cHByZXNzIHNjcm9sbGluZy5cblx0XHRzY3JvbGxTdXByZXNzaW9uVGhyZXNob2xkOiAzMCxcblxuXHRcdC8vIE1vcmUgdGltZSB0aGFuIHRoaXMsIGFuZCBpdCBpc24ndCBhIHN3aXBlLlxuXHRcdGR1cmF0aW9uVGhyZXNob2xkOiAxMDAwLFxuXG5cdFx0Ly8gU3dpcGUgaG9yaXpvbnRhbCBkaXNwbGFjZW1lbnQgbXVzdCBiZSBtb3JlIHRoYW4gdGhpcy5cblx0XHRob3Jpem9udGFsRGlzdGFuY2VUaHJlc2hvbGQ6IHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvID49IDIgPyAxNSA6IDMwLFxuXG5cdFx0Ly8gU3dpcGUgdmVydGljYWwgZGlzcGxhY2VtZW50IG11c3QgYmUgbGVzcyB0aGFuIHRoaXMuXG5cdFx0dmVydGljYWxEaXN0YW5jZVRocmVzaG9sZDogd2luZG93LmRldmljZVBpeGVsUmF0aW8gPj0gMiA/IDE1IDogMzAsXG5cblx0XHRnZXRMb2NhdGlvbjogZnVuY3Rpb24gKCBldmVudCApIHtcblx0XHRcdHZhciB3aW5QYWdlWCA9IHdpbmRvdy5wYWdlWE9mZnNldCxcblx0XHRcdFx0d2luUGFnZVkgPSB3aW5kb3cucGFnZVlPZmZzZXQsXG5cdFx0XHRcdHggPSBldmVudC5jbGllbnRYLFxuXHRcdFx0XHR5ID0gZXZlbnQuY2xpZW50WTtcblxuXHRcdFx0aWYgKCBldmVudC5wYWdlWSA9PT0gMCAmJiBNYXRoLmZsb29yKCB5ICkgPiBNYXRoLmZsb29yKCBldmVudC5wYWdlWSApIHx8XG5cdFx0XHRcdGV2ZW50LnBhZ2VYID09PSAwICYmIE1hdGguZmxvb3IoIHggKSA+IE1hdGguZmxvb3IoIGV2ZW50LnBhZ2VYICkgKSB7XG5cblx0XHRcdFx0Ly8gaU9TNCBjbGllbnRYL2NsaWVudFkgaGF2ZSB0aGUgdmFsdWUgdGhhdCBzaG91bGQgaGF2ZSBiZWVuXG5cdFx0XHRcdC8vIGluIHBhZ2VYL3BhZ2VZLiBXaGlsZSBwYWdlWC9wYWdlLyBoYXZlIHRoZSB2YWx1ZSAwXG5cdFx0XHRcdHggPSB4IC0gd2luUGFnZVg7XG5cdFx0XHRcdHkgPSB5IC0gd2luUGFnZVk7XG5cdFx0XHR9IGVsc2UgaWYgKCB5IDwgKCBldmVudC5wYWdlWSAtIHdpblBhZ2VZKSB8fCB4IDwgKCBldmVudC5wYWdlWCAtIHdpblBhZ2VYICkgKSB7XG5cblx0XHRcdFx0Ly8gU29tZSBBbmRyb2lkIGJyb3dzZXJzIGhhdmUgdG90YWxseSBib2d1cyB2YWx1ZXMgZm9yIGNsaWVudFgvWVxuXHRcdFx0XHQvLyB3aGVuIHNjcm9sbGluZy96b29taW5nIGEgcGFnZS4gRGV0ZWN0YWJsZSBzaW5jZSBjbGllbnRYL2NsaWVudFlcblx0XHRcdFx0Ly8gc2hvdWxkIG5ldmVyIGJlIHNtYWxsZXIgdGhhbiBwYWdlWC9wYWdlWSBtaW51cyBwYWdlIHNjcm9sbFxuXHRcdFx0XHR4ID0gZXZlbnQucGFnZVggLSB3aW5QYWdlWDtcblx0XHRcdFx0eSA9IGV2ZW50LnBhZ2VZIC0gd2luUGFnZVk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHg6IHgsXG5cdFx0XHRcdHk6IHlcblx0XHRcdH07XG5cdFx0fSxcblxuXHRcdHN0YXJ0OiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0XHR2YXIgZGF0YSA9IGV2ZW50Lm9yaWdpbmFsRXZlbnQudG91Y2hlcyA/XG5cdFx0XHRcdFx0ZXZlbnQub3JpZ2luYWxFdmVudC50b3VjaGVzWyAwIF0gOiBldmVudCxcblx0XHRcdFx0bG9jYXRpb24gPSAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZ2V0TG9jYXRpb24oIGRhdGEgKTtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHR0aW1lOiAoIG5ldyBEYXRlKCkgKS5nZXRUaW1lKCksXG5cdFx0XHRcdFx0XHRjb29yZHM6IFsgbG9jYXRpb24ueCwgbG9jYXRpb24ueSBdLFxuXHRcdFx0XHRcdFx0b3JpZ2luOiAkKCBldmVudC50YXJnZXQgKVxuXHRcdFx0XHRcdH07XG5cdFx0fSxcblxuXHRcdHN0b3A6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRcdHZhciBkYXRhID0gZXZlbnQub3JpZ2luYWxFdmVudC50b3VjaGVzID9cblx0XHRcdFx0XHRldmVudC5vcmlnaW5hbEV2ZW50LnRvdWNoZXNbIDAgXSA6IGV2ZW50LFxuXHRcdFx0XHRsb2NhdGlvbiA9ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5nZXRMb2NhdGlvbiggZGF0YSApO1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdHRpbWU6ICggbmV3IERhdGUoKSApLmdldFRpbWUoKSxcblx0XHRcdFx0XHRcdGNvb3JkczogWyBsb2NhdGlvbi54LCBsb2NhdGlvbi55IF1cblx0XHRcdFx0XHR9O1xuXHRcdH0sXG5cblx0XHRoYW5kbGVTd2lwZTogZnVuY3Rpb24oIHN0YXJ0LCBzdG9wLCB0aGlzT2JqZWN0LCBvcmlnVGFyZ2V0ICkge1xuXHRcdFx0aWYgKCBzdG9wLnRpbWUgLSBzdGFydC50aW1lIDwgJC5ldmVudC5zcGVjaWFsLnN3aXBlLmR1cmF0aW9uVGhyZXNob2xkICYmXG5cdFx0XHRcdE1hdGguYWJzKCBzdGFydC5jb29yZHNbIDAgXSAtIHN0b3AuY29vcmRzWyAwIF0gKSA+ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5ob3Jpem9udGFsRGlzdGFuY2VUaHJlc2hvbGQgJiZcblx0XHRcdFx0TWF0aC5hYnMoIHN0YXJ0LmNvb3Jkc1sgMSBdIC0gc3RvcC5jb29yZHNbIDEgXSApIDwgJC5ldmVudC5zcGVjaWFsLnN3aXBlLnZlcnRpY2FsRGlzdGFuY2VUaHJlc2hvbGQgKSB7XG5cdFx0XHRcdHZhciBkaXJlY3Rpb24gPSBzdGFydC5jb29yZHNbMF0gPiBzdG9wLmNvb3Jkc1sgMCBdID8gXCJzd2lwZWxlZnRcIiA6IFwic3dpcGVyaWdodFwiO1xuXG5cdFx0XHRcdHRyaWdnZXJDdXN0b21FdmVudCggdGhpc09iamVjdCwgXCJzd2lwZVwiLCAkLkV2ZW50KCBcInN3aXBlXCIsIHsgdGFyZ2V0OiBvcmlnVGFyZ2V0LCBzd2lwZXN0YXJ0OiBzdGFydCwgc3dpcGVzdG9wOiBzdG9wIH0pLCB0cnVlICk7XG5cdFx0XHRcdHRyaWdnZXJDdXN0b21FdmVudCggdGhpc09iamVjdCwgZGlyZWN0aW9uLCQuRXZlbnQoIGRpcmVjdGlvbiwgeyB0YXJnZXQ6IG9yaWdUYXJnZXQsIHN3aXBlc3RhcnQ6IHN0YXJ0LCBzd2lwZXN0b3A6IHN0b3AgfSApLCB0cnVlICk7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXG5cdFx0fSxcblxuXHRcdC8vIFRoaXMgc2VydmVzIGFzIGEgZmxhZyB0byBlbnN1cmUgdGhhdCBhdCBtb3N0IG9uZSBzd2lwZSBldmVudCBldmVudCBpc1xuXHRcdC8vIGluIHdvcmsgYXQgYW55IGdpdmVuIHRpbWVcblx0XHRldmVudEluUHJvZ3Jlc3M6IGZhbHNlLFxuXG5cdFx0c2V0dXA6IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIGV2ZW50cyxcblx0XHRcdFx0dGhpc09iamVjdCA9IHRoaXMsXG5cdFx0XHRcdCR0aGlzID0gJCggdGhpc09iamVjdCApLFxuXHRcdFx0XHRjb250ZXh0ID0ge307XG5cblx0XHRcdC8vIFJldHJpZXZlIHRoZSBldmVudHMgZGF0YSBmb3IgdGhpcyBlbGVtZW50IGFuZCBhZGQgdGhlIHN3aXBlIGNvbnRleHRcblx0XHRcdGV2ZW50cyA9ICQuZGF0YSggdGhpcywgXCJtb2JpbGUtZXZlbnRzXCIgKTtcblx0XHRcdGlmICggIWV2ZW50cyApIHtcblx0XHRcdFx0ZXZlbnRzID0geyBsZW5ndGg6IDAgfTtcblx0XHRcdFx0JC5kYXRhKCB0aGlzLCBcIm1vYmlsZS1ldmVudHNcIiwgZXZlbnRzICk7XG5cdFx0XHR9XG5cdFx0XHRldmVudHMubGVuZ3RoKys7XG5cdFx0XHRldmVudHMuc3dpcGUgPSBjb250ZXh0O1xuXG5cdFx0XHRjb250ZXh0LnN0YXJ0ID0gZnVuY3Rpb24oIGV2ZW50ICkge1xuXG5cdFx0XHRcdC8vIEJhaWwgaWYgd2UncmUgYWxyZWFkeSB3b3JraW5nIG9uIGEgc3dpcGUgZXZlbnRcblx0XHRcdFx0aWYgKCAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZXZlbnRJblByb2dyZXNzICkge1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXHRcdFx0XHQkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZXZlbnRJblByb2dyZXNzID0gdHJ1ZTtcblxuXHRcdFx0XHR2YXIgc3RvcCxcblx0XHRcdFx0XHRzdGFydCA9ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5zdGFydCggZXZlbnQgKSxcblx0XHRcdFx0XHRvcmlnVGFyZ2V0ID0gZXZlbnQudGFyZ2V0LFxuXHRcdFx0XHRcdGVtaXR0ZWQgPSBmYWxzZTtcblxuXHRcdFx0XHRjb250ZXh0Lm1vdmUgPSBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0XHRcdFx0aWYgKCAhc3RhcnQgfHwgZXZlbnQuaXNEZWZhdWx0UHJldmVudGVkKCkgKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0c3RvcCA9ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5zdG9wKCBldmVudCApO1xuXHRcdFx0XHRcdGlmICggIWVtaXR0ZWQgKSB7XG5cdFx0XHRcdFx0XHRlbWl0dGVkID0gJC5ldmVudC5zcGVjaWFsLnN3aXBlLmhhbmRsZVN3aXBlKCBzdGFydCwgc3RvcCwgdGhpc09iamVjdCwgb3JpZ1RhcmdldCApO1xuXHRcdFx0XHRcdFx0aWYgKCBlbWl0dGVkICkge1xuXG5cdFx0XHRcdFx0XHRcdC8vIFJlc2V0IHRoZSBjb250ZXh0IHRvIG1ha2Ugd2F5IGZvciB0aGUgbmV4dCBzd2lwZSBldmVudFxuXHRcdFx0XHRcdFx0XHQkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZXZlbnRJblByb2dyZXNzID0gZmFsc2U7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdC8vIHByZXZlbnQgc2Nyb2xsaW5nXG5cdFx0XHRcdFx0aWYgKCBNYXRoLmFicyggc3RhcnQuY29vcmRzWyAwIF0gLSBzdG9wLmNvb3Jkc1sgMCBdICkgPiAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuc2Nyb2xsU3VwcmVzc2lvblRocmVzaG9sZCApIHtcblx0XHRcdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdGNvbnRleHQuc3RvcCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0ZW1pdHRlZCA9IHRydWU7XG5cblx0XHRcdFx0XHRcdC8vIFJlc2V0IHRoZSBjb250ZXh0IHRvIG1ha2Ugd2F5IGZvciB0aGUgbmV4dCBzd2lwZSBldmVudFxuXHRcdFx0XHRcdFx0JC5ldmVudC5zcGVjaWFsLnN3aXBlLmV2ZW50SW5Qcm9ncmVzcyA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0JGRvY3VtZW50Lm9mZiggdG91Y2hNb3ZlRXZlbnQsIGNvbnRleHQubW92ZSApO1xuXHRcdFx0XHRcdFx0Y29udGV4dC5tb3ZlID0gbnVsbDtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHQkZG9jdW1lbnQub24oIHRvdWNoTW92ZUV2ZW50LCBjb250ZXh0Lm1vdmUgKVxuXHRcdFx0XHRcdC5vbmUoIHRvdWNoU3RvcEV2ZW50LCBjb250ZXh0LnN0b3AgKTtcblx0XHRcdH07XG5cdFx0XHQkdGhpcy5vbiggdG91Y2hTdGFydEV2ZW50LCBjb250ZXh0LnN0YXJ0ICk7XG5cdFx0fSxcblxuXHRcdHRlYXJkb3duOiBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBldmVudHMsIGNvbnRleHQ7XG5cblx0XHRcdGV2ZW50cyA9ICQuZGF0YSggdGhpcywgXCJtb2JpbGUtZXZlbnRzXCIgKTtcblx0XHRcdGlmICggZXZlbnRzICkge1xuXHRcdFx0XHRjb250ZXh0ID0gZXZlbnRzLnN3aXBlO1xuXHRcdFx0XHRkZWxldGUgZXZlbnRzLnN3aXBlO1xuXHRcdFx0XHRldmVudHMubGVuZ3RoLS07XG5cdFx0XHRcdGlmICggZXZlbnRzLmxlbmd0aCA9PT0gMCApIHtcblx0XHRcdFx0XHQkLnJlbW92ZURhdGEoIHRoaXMsIFwibW9iaWxlLWV2ZW50c1wiICk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0aWYgKCBjb250ZXh0ICkge1xuXHRcdFx0XHRpZiAoIGNvbnRleHQuc3RhcnQgKSB7XG5cdFx0XHRcdFx0JCggdGhpcyApLm9mZiggdG91Y2hTdGFydEV2ZW50LCBjb250ZXh0LnN0YXJ0ICk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKCBjb250ZXh0Lm1vdmUgKSB7XG5cdFx0XHRcdFx0JGRvY3VtZW50Lm9mZiggdG91Y2hNb3ZlRXZlbnQsIGNvbnRleHQubW92ZSApO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICggY29udGV4dC5zdG9wICkge1xuXHRcdFx0XHRcdCRkb2N1bWVudC5vZmYoIHRvdWNoU3RvcEV2ZW50LCBjb250ZXh0LnN0b3AgKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fTtcblx0JC5lYWNoKHtcblx0XHRzd2lwZWxlZnQ6IFwic3dpcGUubGVmdFwiLFxuXHRcdHN3aXBlcmlnaHQ6IFwic3dpcGUucmlnaHRcIlxuXHR9LCBmdW5jdGlvbiggZXZlbnQsIHNvdXJjZUV2ZW50ICkge1xuXG5cdFx0JC5ldmVudC5zcGVjaWFsWyBldmVudCBdID0ge1xuXHRcdFx0c2V0dXA6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHQkKCB0aGlzICkuYmluZCggc291cmNlRXZlbnQsICQubm9vcCApO1xuXHRcdFx0fSxcblx0XHRcdHRlYXJkb3duOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0JCggdGhpcyApLnVuYmluZCggc291cmNlRXZlbnQgKTtcblx0XHRcdH1cblx0XHR9O1xuXHR9KTtcbn0pKCBqUXVlcnksIHRoaXMgKTtcbiovXG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbmNvbnN0IE11dGF0aW9uT2JzZXJ2ZXIgPSAoZnVuY3Rpb24gKCkge1xuICB2YXIgcHJlZml4ZXMgPSBbJ1dlYktpdCcsICdNb3onLCAnTycsICdNcycsICcnXTtcbiAgZm9yICh2YXIgaT0wOyBpIDwgcHJlZml4ZXMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoYCR7cHJlZml4ZXNbaV19TXV0YXRpb25PYnNlcnZlcmAgaW4gd2luZG93KSB7XG4gICAgICByZXR1cm4gd2luZG93W2Ake3ByZWZpeGVzW2ldfU11dGF0aW9uT2JzZXJ2ZXJgXTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufSgpKTtcblxuY29uc3QgdHJpZ2dlcnMgPSAoZWwsIHR5cGUpID0+IHtcbiAgZWwuZGF0YSh0eXBlKS5zcGxpdCgnICcpLmZvckVhY2goaWQgPT4ge1xuICAgICQoYCMke2lkfWApWyB0eXBlID09PSAnY2xvc2UnID8gJ3RyaWdnZXInIDogJ3RyaWdnZXJIYW5kbGVyJ10oYCR7dHlwZX0uemYudHJpZ2dlcmAsIFtlbF0pO1xuICB9KTtcbn07XG4vLyBFbGVtZW50cyB3aXRoIFtkYXRhLW9wZW5dIHdpbGwgcmV2ZWFsIGEgcGx1Z2luIHRoYXQgc3VwcG9ydHMgaXQgd2hlbiBjbGlja2VkLlxuJChkb2N1bWVudCkub24oJ2NsaWNrLnpmLnRyaWdnZXInLCAnW2RhdGEtb3Blbl0nLCBmdW5jdGlvbigpIHtcbiAgdHJpZ2dlcnMoJCh0aGlzKSwgJ29wZW4nKTtcbn0pO1xuXG4vLyBFbGVtZW50cyB3aXRoIFtkYXRhLWNsb3NlXSB3aWxsIGNsb3NlIGEgcGx1Z2luIHRoYXQgc3VwcG9ydHMgaXQgd2hlbiBjbGlja2VkLlxuLy8gSWYgdXNlZCB3aXRob3V0IGEgdmFsdWUgb24gW2RhdGEtY2xvc2VdLCB0aGUgZXZlbnQgd2lsbCBidWJibGUsIGFsbG93aW5nIGl0IHRvIGNsb3NlIGEgcGFyZW50IGNvbXBvbmVudC5cbiQoZG9jdW1lbnQpLm9uKCdjbGljay56Zi50cmlnZ2VyJywgJ1tkYXRhLWNsb3NlXScsIGZ1bmN0aW9uKCkge1xuICBsZXQgaWQgPSAkKHRoaXMpLmRhdGEoJ2Nsb3NlJyk7XG4gIGlmIChpZCkge1xuICAgIHRyaWdnZXJzKCQodGhpcyksICdjbG9zZScpO1xuICB9XG4gIGVsc2Uge1xuICAgICQodGhpcykudHJpZ2dlcignY2xvc2UuemYudHJpZ2dlcicpO1xuICB9XG59KTtcblxuLy8gRWxlbWVudHMgd2l0aCBbZGF0YS10b2dnbGVdIHdpbGwgdG9nZ2xlIGEgcGx1Z2luIHRoYXQgc3VwcG9ydHMgaXQgd2hlbiBjbGlja2VkLlxuJChkb2N1bWVudCkub24oJ2NsaWNrLnpmLnRyaWdnZXInLCAnW2RhdGEtdG9nZ2xlXScsIGZ1bmN0aW9uKCkge1xuICB0cmlnZ2VycygkKHRoaXMpLCAndG9nZ2xlJyk7XG59KTtcblxuLy8gRWxlbWVudHMgd2l0aCBbZGF0YS1jbG9zYWJsZV0gd2lsbCByZXNwb25kIHRvIGNsb3NlLnpmLnRyaWdnZXIgZXZlbnRzLlxuJChkb2N1bWVudCkub24oJ2Nsb3NlLnpmLnRyaWdnZXInLCAnW2RhdGEtY2xvc2FibGVdJywgZnVuY3Rpb24oZSl7XG4gIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIGxldCBhbmltYXRpb24gPSAkKHRoaXMpLmRhdGEoJ2Nsb3NhYmxlJyk7XG5cbiAgaWYoYW5pbWF0aW9uICE9PSAnJyl7XG4gICAgRm91bmRhdGlvbi5Nb3Rpb24uYW5pbWF0ZU91dCgkKHRoaXMpLCBhbmltYXRpb24sIGZ1bmN0aW9uKCkge1xuICAgICAgJCh0aGlzKS50cmlnZ2VyKCdjbG9zZWQuemYnKTtcbiAgICB9KTtcbiAgfWVsc2V7XG4gICAgJCh0aGlzKS5mYWRlT3V0KCkudHJpZ2dlcignY2xvc2VkLnpmJyk7XG4gIH1cbn0pO1xuXG4kKGRvY3VtZW50KS5vbignZm9jdXMuemYudHJpZ2dlciBibHVyLnpmLnRyaWdnZXInLCAnW2RhdGEtdG9nZ2xlLWZvY3VzXScsIGZ1bmN0aW9uKCkge1xuICBsZXQgaWQgPSAkKHRoaXMpLmRhdGEoJ3RvZ2dsZS1mb2N1cycpO1xuICAkKGAjJHtpZH1gKS50cmlnZ2VySGFuZGxlcigndG9nZ2xlLnpmLnRyaWdnZXInLCBbJCh0aGlzKV0pO1xufSk7XG5cbi8qKlxuKiBGaXJlcyBvbmNlIGFmdGVyIGFsbCBvdGhlciBzY3JpcHRzIGhhdmUgbG9hZGVkXG4qIEBmdW5jdGlvblxuKiBAcHJpdmF0ZVxuKi9cbiQod2luZG93KS5vbignbG9hZCcsICgpID0+IHtcbiAgY2hlY2tMaXN0ZW5lcnMoKTtcbn0pO1xuXG5mdW5jdGlvbiBjaGVja0xpc3RlbmVycygpIHtcbiAgZXZlbnRzTGlzdGVuZXIoKTtcbiAgcmVzaXplTGlzdGVuZXIoKTtcbiAgc2Nyb2xsTGlzdGVuZXIoKTtcbiAgY2xvc2VtZUxpc3RlbmVyKCk7XG59XG5cbi8vKioqKioqKiogb25seSBmaXJlcyB0aGlzIGZ1bmN0aW9uIG9uY2Ugb24gbG9hZCwgaWYgdGhlcmUncyBzb21ldGhpbmcgdG8gd2F0Y2ggKioqKioqKipcbmZ1bmN0aW9uIGNsb3NlbWVMaXN0ZW5lcihwbHVnaW5OYW1lKSB7XG4gIHZhciB5ZXRpQm94ZXMgPSAkKCdbZGF0YS15ZXRpLWJveF0nKSxcbiAgICAgIHBsdWdOYW1lcyA9IFsnZHJvcGRvd24nLCAndG9vbHRpcCcsICdyZXZlYWwnXTtcblxuICBpZihwbHVnaW5OYW1lKXtcbiAgICBpZih0eXBlb2YgcGx1Z2luTmFtZSA9PT0gJ3N0cmluZycpe1xuICAgICAgcGx1Z05hbWVzLnB1c2gocGx1Z2luTmFtZSk7XG4gICAgfWVsc2UgaWYodHlwZW9mIHBsdWdpbk5hbWUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBwbHVnaW5OYW1lWzBdID09PSAnc3RyaW5nJyl7XG4gICAgICBwbHVnTmFtZXMuY29uY2F0KHBsdWdpbk5hbWUpO1xuICAgIH1lbHNle1xuICAgICAgY29uc29sZS5lcnJvcignUGx1Z2luIG5hbWVzIG11c3QgYmUgc3RyaW5ncycpO1xuICAgIH1cbiAgfVxuICBpZih5ZXRpQm94ZXMubGVuZ3RoKXtcbiAgICBsZXQgbGlzdGVuZXJzID0gcGx1Z05hbWVzLm1hcCgobmFtZSkgPT4ge1xuICAgICAgcmV0dXJuIGBjbG9zZW1lLnpmLiR7bmFtZX1gO1xuICAgIH0pLmpvaW4oJyAnKTtcblxuICAgICQod2luZG93KS5vZmYobGlzdGVuZXJzKS5vbihsaXN0ZW5lcnMsIGZ1bmN0aW9uKGUsIHBsdWdpbklkKXtcbiAgICAgIGxldCBwbHVnaW4gPSBlLm5hbWVzcGFjZS5zcGxpdCgnLicpWzBdO1xuICAgICAgbGV0IHBsdWdpbnMgPSAkKGBbZGF0YS0ke3BsdWdpbn1dYCkubm90KGBbZGF0YS15ZXRpLWJveD1cIiR7cGx1Z2luSWR9XCJdYCk7XG5cbiAgICAgIHBsdWdpbnMuZWFjaChmdW5jdGlvbigpe1xuICAgICAgICBsZXQgX3RoaXMgPSAkKHRoaXMpO1xuXG4gICAgICAgIF90aGlzLnRyaWdnZXJIYW5kbGVyKCdjbG9zZS56Zi50cmlnZ2VyJywgW190aGlzXSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiByZXNpemVMaXN0ZW5lcihkZWJvdW5jZSl7XG4gIGxldCB0aW1lcixcbiAgICAgICRub2RlcyA9ICQoJ1tkYXRhLXJlc2l6ZV0nKTtcbiAgaWYoJG5vZGVzLmxlbmd0aCl7XG4gICAgJCh3aW5kb3cpLm9mZigncmVzaXplLnpmLnRyaWdnZXInKVxuICAgIC5vbigncmVzaXplLnpmLnRyaWdnZXInLCBmdW5jdGlvbihlKSB7XG4gICAgICBpZiAodGltZXIpIHsgY2xlYXJUaW1lb3V0KHRpbWVyKTsgfVxuXG4gICAgICB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcblxuICAgICAgICBpZighTXV0YXRpb25PYnNlcnZlcil7Ly9mYWxsYmFjayBmb3IgSUUgOVxuICAgICAgICAgICRub2Rlcy5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAkKHRoaXMpLnRyaWdnZXJIYW5kbGVyKCdyZXNpemVtZS56Zi50cmlnZ2VyJyk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy90cmlnZ2VyIGFsbCBsaXN0ZW5pbmcgZWxlbWVudHMgYW5kIHNpZ25hbCBhIHJlc2l6ZSBldmVudFxuICAgICAgICAkbm9kZXMuYXR0cignZGF0YS1ldmVudHMnLCBcInJlc2l6ZVwiKTtcbiAgICAgIH0sIGRlYm91bmNlIHx8IDEwKTsvL2RlZmF1bHQgdGltZSB0byBlbWl0IHJlc2l6ZSBldmVudFxuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNjcm9sbExpc3RlbmVyKGRlYm91bmNlKXtcbiAgbGV0IHRpbWVyLFxuICAgICAgJG5vZGVzID0gJCgnW2RhdGEtc2Nyb2xsXScpO1xuICBpZigkbm9kZXMubGVuZ3RoKXtcbiAgICAkKHdpbmRvdykub2ZmKCdzY3JvbGwuemYudHJpZ2dlcicpXG4gICAgLm9uKCdzY3JvbGwuemYudHJpZ2dlcicsIGZ1bmN0aW9uKGUpe1xuICAgICAgaWYodGltZXIpeyBjbGVhclRpbWVvdXQodGltZXIpOyB9XG5cbiAgICAgIHRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xuXG4gICAgICAgIGlmKCFNdXRhdGlvbk9ic2VydmVyKXsvL2ZhbGxiYWNrIGZvciBJRSA5XG4gICAgICAgICAgJG5vZGVzLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICQodGhpcykudHJpZ2dlckhhbmRsZXIoJ3Njcm9sbG1lLnpmLnRyaWdnZXInKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICAvL3RyaWdnZXIgYWxsIGxpc3RlbmluZyBlbGVtZW50cyBhbmQgc2lnbmFsIGEgc2Nyb2xsIGV2ZW50XG4gICAgICAgICRub2Rlcy5hdHRyKCdkYXRhLWV2ZW50cycsIFwic2Nyb2xsXCIpO1xuICAgICAgfSwgZGVib3VuY2UgfHwgMTApOy8vZGVmYXVsdCB0aW1lIHRvIGVtaXQgc2Nyb2xsIGV2ZW50XG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZXZlbnRzTGlzdGVuZXIoKSB7XG4gIGlmKCFNdXRhdGlvbk9ic2VydmVyKXsgcmV0dXJuIGZhbHNlOyB9XG4gIGxldCBub2RlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLXJlc2l6ZV0sIFtkYXRhLXNjcm9sbF0sIFtkYXRhLW11dGF0ZV0nKTtcblxuICAvL2VsZW1lbnQgY2FsbGJhY2tcbiAgdmFyIGxpc3RlbmluZ0VsZW1lbnRzTXV0YXRpb24gPSBmdW5jdGlvbihtdXRhdGlvblJlY29yZHNMaXN0KSB7XG4gICAgdmFyICR0YXJnZXQgPSAkKG11dGF0aW9uUmVjb3Jkc0xpc3RbMF0udGFyZ2V0KTtcbiAgICAvL3RyaWdnZXIgdGhlIGV2ZW50IGhhbmRsZXIgZm9yIHRoZSBlbGVtZW50IGRlcGVuZGluZyBvbiB0eXBlXG4gICAgc3dpdGNoICgkdGFyZ2V0LmF0dHIoXCJkYXRhLWV2ZW50c1wiKSkge1xuXG4gICAgICBjYXNlIFwicmVzaXplXCIgOlxuICAgICAgJHRhcmdldC50cmlnZ2VySGFuZGxlcigncmVzaXplbWUuemYudHJpZ2dlcicsIFskdGFyZ2V0XSk7XG4gICAgICBicmVhaztcblxuICAgICAgY2FzZSBcInNjcm9sbFwiIDpcbiAgICAgICR0YXJnZXQudHJpZ2dlckhhbmRsZXIoJ3Njcm9sbG1lLnpmLnRyaWdnZXInLCBbJHRhcmdldCwgd2luZG93LnBhZ2VZT2Zmc2V0XSk7XG4gICAgICBicmVhaztcblxuICAgICAgLy8gY2FzZSBcIm11dGF0ZVwiIDpcbiAgICAgIC8vIGNvbnNvbGUubG9nKCdtdXRhdGUnLCAkdGFyZ2V0KTtcbiAgICAgIC8vICR0YXJnZXQudHJpZ2dlckhhbmRsZXIoJ211dGF0ZS56Zi50cmlnZ2VyJyk7XG4gICAgICAvL1xuICAgICAgLy8gLy9tYWtlIHN1cmUgd2UgZG9uJ3QgZ2V0IHN0dWNrIGluIGFuIGluZmluaXRlIGxvb3AgZnJvbSBzbG9wcHkgY29kZWluZ1xuICAgICAgLy8gaWYgKCR0YXJnZXQuaW5kZXgoJ1tkYXRhLW11dGF0ZV0nKSA9PSAkKFwiW2RhdGEtbXV0YXRlXVwiKS5sZW5ndGgtMSkge1xuICAgICAgLy8gICBkb21NdXRhdGlvbk9ic2VydmVyKCk7XG4gICAgICAvLyB9XG4gICAgICAvLyBicmVhaztcblxuICAgICAgZGVmYXVsdCA6XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAvL25vdGhpbmdcbiAgICB9XG4gIH1cblxuICBpZihub2Rlcy5sZW5ndGgpe1xuICAgIC8vZm9yIGVhY2ggZWxlbWVudCB0aGF0IG5lZWRzIHRvIGxpc3RlbiBmb3IgcmVzaXppbmcsIHNjcm9sbGluZywgKG9yIGNvbWluZyBzb29uIG11dGF0aW9uKSBhZGQgYSBzaW5nbGUgb2JzZXJ2ZXJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8PSBub2Rlcy5sZW5ndGgtMTsgaSsrKSB7XG4gICAgICBsZXQgZWxlbWVudE9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIobGlzdGVuaW5nRWxlbWVudHNNdXRhdGlvbik7XG4gICAgICBlbGVtZW50T2JzZXJ2ZXIub2JzZXJ2ZShub2Rlc1tpXSwgeyBhdHRyaWJ1dGVzOiB0cnVlLCBjaGlsZExpc3Q6IGZhbHNlLCBjaGFyYWN0ZXJEYXRhOiBmYWxzZSwgc3VidHJlZTpmYWxzZSwgYXR0cmlidXRlRmlsdGVyOltcImRhdGEtZXZlbnRzXCJdfSk7XG4gICAgfVxuICB9XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4vLyBbUEhdXG4vLyBGb3VuZGF0aW9uLkNoZWNrV2F0Y2hlcnMgPSBjaGVja1dhdGNoZXJzO1xuRm91bmRhdGlvbi5JSGVhcllvdSA9IGNoZWNrTGlzdGVuZXJzO1xuLy8gRm91bmRhdGlvbi5JU2VlWW91ID0gc2Nyb2xsTGlzdGVuZXI7XG4vLyBGb3VuZGF0aW9uLklGZWVsWW91ID0gY2xvc2VtZUxpc3RlbmVyO1xuXG59KGpRdWVyeSk7XG5cbi8vIGZ1bmN0aW9uIGRvbU11dGF0aW9uT2JzZXJ2ZXIoZGVib3VuY2UpIHtcbi8vICAgLy8gISEhIFRoaXMgaXMgY29taW5nIHNvb24gYW5kIG5lZWRzIG1vcmUgd29yazsgbm90IGFjdGl2ZSAgISEhIC8vXG4vLyAgIHZhciB0aW1lcixcbi8vICAgbm9kZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1tdXRhdGVdJyk7XG4vLyAgIC8vXG4vLyAgIGlmIChub2Rlcy5sZW5ndGgpIHtcbi8vICAgICAvLyB2YXIgTXV0YXRpb25PYnNlcnZlciA9IChmdW5jdGlvbiAoKSB7XG4vLyAgICAgLy8gICB2YXIgcHJlZml4ZXMgPSBbJ1dlYktpdCcsICdNb3onLCAnTycsICdNcycsICcnXTtcbi8vICAgICAvLyAgIGZvciAodmFyIGk9MDsgaSA8IHByZWZpeGVzLmxlbmd0aDsgaSsrKSB7XG4vLyAgICAgLy8gICAgIGlmIChwcmVmaXhlc1tpXSArICdNdXRhdGlvbk9ic2VydmVyJyBpbiB3aW5kb3cpIHtcbi8vICAgICAvLyAgICAgICByZXR1cm4gd2luZG93W3ByZWZpeGVzW2ldICsgJ011dGF0aW9uT2JzZXJ2ZXInXTtcbi8vICAgICAvLyAgICAgfVxuLy8gICAgIC8vICAgfVxuLy8gICAgIC8vICAgcmV0dXJuIGZhbHNlO1xuLy8gICAgIC8vIH0oKSk7XG4vL1xuLy9cbi8vICAgICAvL2ZvciB0aGUgYm9keSwgd2UgbmVlZCB0byBsaXN0ZW4gZm9yIGFsbCBjaGFuZ2VzIGVmZmVjdGluZyB0aGUgc3R5bGUgYW5kIGNsYXNzIGF0dHJpYnV0ZXNcbi8vICAgICB2YXIgYm9keU9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoYm9keU11dGF0aW9uKTtcbi8vICAgICBib2R5T2JzZXJ2ZXIub2JzZXJ2ZShkb2N1bWVudC5ib2R5LCB7IGF0dHJpYnV0ZXM6IHRydWUsIGNoaWxkTGlzdDogdHJ1ZSwgY2hhcmFjdGVyRGF0YTogZmFsc2UsIHN1YnRyZWU6dHJ1ZSwgYXR0cmlidXRlRmlsdGVyOltcInN0eWxlXCIsIFwiY2xhc3NcIl19KTtcbi8vXG4vL1xuLy8gICAgIC8vYm9keSBjYWxsYmFja1xuLy8gICAgIGZ1bmN0aW9uIGJvZHlNdXRhdGlvbihtdXRhdGUpIHtcbi8vICAgICAgIC8vdHJpZ2dlciBhbGwgbGlzdGVuaW5nIGVsZW1lbnRzIGFuZCBzaWduYWwgYSBtdXRhdGlvbiBldmVudFxuLy8gICAgICAgaWYgKHRpbWVyKSB7IGNsZWFyVGltZW91dCh0aW1lcik7IH1cbi8vXG4vLyAgICAgICB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4vLyAgICAgICAgIGJvZHlPYnNlcnZlci5kaXNjb25uZWN0KCk7XG4vLyAgICAgICAgICQoJ1tkYXRhLW11dGF0ZV0nKS5hdHRyKCdkYXRhLWV2ZW50cycsXCJtdXRhdGVcIik7XG4vLyAgICAgICB9LCBkZWJvdW5jZSB8fCAxNTApO1xuLy8gICAgIH1cbi8vICAgfVxuLy8gfVxuIiwid2luZG93LndoYXRJbnB1dCA9IChmdW5jdGlvbigpIHtcblxuICAndXNlIHN0cmljdCc7XG5cbiAgLypcbiAgICAtLS0tLS0tLS0tLS0tLS1cbiAgICB2YXJpYWJsZXNcbiAgICAtLS0tLS0tLS0tLS0tLS1cbiAgKi9cblxuICAvLyBhcnJheSBvZiBhY3RpdmVseSBwcmVzc2VkIGtleXNcbiAgdmFyIGFjdGl2ZUtleXMgPSBbXTtcblxuICAvLyBjYWNoZSBkb2N1bWVudC5ib2R5XG4gIHZhciBib2R5O1xuXG4gIC8vIGJvb2xlYW46IHRydWUgaWYgdG91Y2ggYnVmZmVyIHRpbWVyIGlzIHJ1bm5pbmdcbiAgdmFyIGJ1ZmZlciA9IGZhbHNlO1xuXG4gIC8vIHRoZSBsYXN0IHVzZWQgaW5wdXQgdHlwZVxuICB2YXIgY3VycmVudElucHV0ID0gbnVsbDtcblxuICAvLyBgaW5wdXRgIHR5cGVzIHRoYXQgZG9uJ3QgYWNjZXB0IHRleHRcbiAgdmFyIG5vblR5cGluZ0lucHV0cyA9IFtcbiAgICAnYnV0dG9uJyxcbiAgICAnY2hlY2tib3gnLFxuICAgICdmaWxlJyxcbiAgICAnaW1hZ2UnLFxuICAgICdyYWRpbycsXG4gICAgJ3Jlc2V0JyxcbiAgICAnc3VibWl0J1xuICBdO1xuXG4gIC8vIGRldGVjdCB2ZXJzaW9uIG9mIG1vdXNlIHdoZWVsIGV2ZW50IHRvIHVzZVxuICAvLyB2aWEgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvRXZlbnRzL3doZWVsXG4gIHZhciBtb3VzZVdoZWVsID0gZGV0ZWN0V2hlZWwoKTtcblxuICAvLyBsaXN0IG9mIG1vZGlmaWVyIGtleXMgY29tbW9ubHkgdXNlZCB3aXRoIHRoZSBtb3VzZSBhbmRcbiAgLy8gY2FuIGJlIHNhZmVseSBpZ25vcmVkIHRvIHByZXZlbnQgZmFsc2Uga2V5Ym9hcmQgZGV0ZWN0aW9uXG4gIHZhciBpZ25vcmVNYXAgPSBbXG4gICAgMTYsIC8vIHNoaWZ0XG4gICAgMTcsIC8vIGNvbnRyb2xcbiAgICAxOCwgLy8gYWx0XG4gICAgOTEsIC8vIFdpbmRvd3Mga2V5IC8gbGVmdCBBcHBsZSBjbWRcbiAgICA5MyAgLy8gV2luZG93cyBtZW51IC8gcmlnaHQgQXBwbGUgY21kXG4gIF07XG5cbiAgLy8gbWFwcGluZyBvZiBldmVudHMgdG8gaW5wdXQgdHlwZXNcbiAgdmFyIGlucHV0TWFwID0ge1xuICAgICdrZXlkb3duJzogJ2tleWJvYXJkJyxcbiAgICAna2V5dXAnOiAna2V5Ym9hcmQnLFxuICAgICdtb3VzZWRvd24nOiAnbW91c2UnLFxuICAgICdtb3VzZW1vdmUnOiAnbW91c2UnLFxuICAgICdNU1BvaW50ZXJEb3duJzogJ3BvaW50ZXInLFxuICAgICdNU1BvaW50ZXJNb3ZlJzogJ3BvaW50ZXInLFxuICAgICdwb2ludGVyZG93bic6ICdwb2ludGVyJyxcbiAgICAncG9pbnRlcm1vdmUnOiAncG9pbnRlcicsXG4gICAgJ3RvdWNoc3RhcnQnOiAndG91Y2gnXG4gIH07XG5cbiAgLy8gYWRkIGNvcnJlY3QgbW91c2Ugd2hlZWwgZXZlbnQgbWFwcGluZyB0byBgaW5wdXRNYXBgXG4gIGlucHV0TWFwW2RldGVjdFdoZWVsKCldID0gJ21vdXNlJztcblxuICAvLyBhcnJheSBvZiBhbGwgdXNlZCBpbnB1dCB0eXBlc1xuICB2YXIgaW5wdXRUeXBlcyA9IFtdO1xuXG4gIC8vIG1hcHBpbmcgb2Yga2V5IGNvZGVzIHRvIGEgY29tbW9uIG5hbWVcbiAgdmFyIGtleU1hcCA9IHtcbiAgICA5OiAndGFiJyxcbiAgICAxMzogJ2VudGVyJyxcbiAgICAxNjogJ3NoaWZ0JyxcbiAgICAyNzogJ2VzYycsXG4gICAgMzI6ICdzcGFjZScsXG4gICAgMzc6ICdsZWZ0JyxcbiAgICAzODogJ3VwJyxcbiAgICAzOTogJ3JpZ2h0JyxcbiAgICA0MDogJ2Rvd24nXG4gIH07XG5cbiAgLy8gbWFwIG9mIElFIDEwIHBvaW50ZXIgZXZlbnRzXG4gIHZhciBwb2ludGVyTWFwID0ge1xuICAgIDI6ICd0b3VjaCcsXG4gICAgMzogJ3RvdWNoJywgLy8gdHJlYXQgcGVuIGxpa2UgdG91Y2hcbiAgICA0OiAnbW91c2UnXG4gIH07XG5cbiAgLy8gdG91Y2ggYnVmZmVyIHRpbWVyXG4gIHZhciB0aW1lcjtcblxuXG4gIC8qXG4gICAgLS0tLS0tLS0tLS0tLS0tXG4gICAgZnVuY3Rpb25zXG4gICAgLS0tLS0tLS0tLS0tLS0tXG4gICovXG5cbiAgLy8gYWxsb3dzIGV2ZW50cyB0aGF0IGFyZSBhbHNvIHRyaWdnZXJlZCB0byBiZSBmaWx0ZXJlZCBvdXQgZm9yIGB0b3VjaHN0YXJ0YFxuICBmdW5jdGlvbiBldmVudEJ1ZmZlcigpIHtcbiAgICBjbGVhclRpbWVyKCk7XG4gICAgc2V0SW5wdXQoZXZlbnQpO1xuXG4gICAgYnVmZmVyID0gdHJ1ZTtcbiAgICB0aW1lciA9IHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgYnVmZmVyID0gZmFsc2U7XG4gICAgfSwgNjUwKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGJ1ZmZlcmVkRXZlbnQoZXZlbnQpIHtcbiAgICBpZiAoIWJ1ZmZlcikgc2V0SW5wdXQoZXZlbnQpO1xuICB9XG5cbiAgZnVuY3Rpb24gdW5CdWZmZXJlZEV2ZW50KGV2ZW50KSB7XG4gICAgY2xlYXJUaW1lcigpO1xuICAgIHNldElucHV0KGV2ZW50KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNsZWFyVGltZXIoKSB7XG4gICAgd2luZG93LmNsZWFyVGltZW91dCh0aW1lcik7XG4gIH1cblxuICBmdW5jdGlvbiBzZXRJbnB1dChldmVudCkge1xuICAgIHZhciBldmVudEtleSA9IGtleShldmVudCk7XG4gICAgdmFyIHZhbHVlID0gaW5wdXRNYXBbZXZlbnQudHlwZV07XG4gICAgaWYgKHZhbHVlID09PSAncG9pbnRlcicpIHZhbHVlID0gcG9pbnRlclR5cGUoZXZlbnQpO1xuXG4gICAgLy8gZG9uJ3QgZG8gYW55dGhpbmcgaWYgdGhlIHZhbHVlIG1hdGNoZXMgdGhlIGlucHV0IHR5cGUgYWxyZWFkeSBzZXRcbiAgICBpZiAoY3VycmVudElucHV0ICE9PSB2YWx1ZSkge1xuICAgICAgdmFyIGV2ZW50VGFyZ2V0ID0gdGFyZ2V0KGV2ZW50KTtcbiAgICAgIHZhciBldmVudFRhcmdldE5vZGUgPSBldmVudFRhcmdldC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgdmFyIGV2ZW50VGFyZ2V0VHlwZSA9IChldmVudFRhcmdldE5vZGUgPT09ICdpbnB1dCcpID8gZXZlbnRUYXJnZXQuZ2V0QXR0cmlidXRlKCd0eXBlJykgOiBudWxsO1xuXG4gICAgICBpZiAoXG4gICAgICAgICgvLyBvbmx5IGlmIHRoZSB1c2VyIGZsYWcgdG8gYWxsb3cgdHlwaW5nIGluIGZvcm0gZmllbGRzIGlzbid0IHNldFxuICAgICAgICAhYm9keS5oYXNBdHRyaWJ1dGUoJ2RhdGEtd2hhdGlucHV0LWZvcm10eXBpbmcnKSAmJlxuXG4gICAgICAgIC8vIG9ubHkgaWYgY3VycmVudElucHV0IGhhcyBhIHZhbHVlXG4gICAgICAgIGN1cnJlbnRJbnB1dCAmJlxuXG4gICAgICAgIC8vIG9ubHkgaWYgdGhlIGlucHV0IGlzIGBrZXlib2FyZGBcbiAgICAgICAgdmFsdWUgPT09ICdrZXlib2FyZCcgJiZcblxuICAgICAgICAvLyBub3QgaWYgdGhlIGtleSBpcyBgVEFCYFxuICAgICAgICBrZXlNYXBbZXZlbnRLZXldICE9PSAndGFiJyAmJlxuXG4gICAgICAgIC8vIG9ubHkgaWYgdGhlIHRhcmdldCBpcyBhIGZvcm0gaW5wdXQgdGhhdCBhY2NlcHRzIHRleHRcbiAgICAgICAgKFxuICAgICAgICAgICBldmVudFRhcmdldE5vZGUgPT09ICd0ZXh0YXJlYScgfHxcbiAgICAgICAgICAgZXZlbnRUYXJnZXROb2RlID09PSAnc2VsZWN0JyB8fFxuICAgICAgICAgICAoZXZlbnRUYXJnZXROb2RlID09PSAnaW5wdXQnICYmIG5vblR5cGluZ0lucHV0cy5pbmRleE9mKGV2ZW50VGFyZ2V0VHlwZSkgPCAwKVxuICAgICAgICApKSB8fCAoXG4gICAgICAgICAgLy8gaWdub3JlIG1vZGlmaWVyIGtleXNcbiAgICAgICAgICBpZ25vcmVNYXAuaW5kZXhPZihldmVudEtleSkgPiAtMVxuICAgICAgICApXG4gICAgICApIHtcbiAgICAgICAgLy8gaWdub3JlIGtleWJvYXJkIHR5cGluZ1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3dpdGNoSW5wdXQodmFsdWUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh2YWx1ZSA9PT0gJ2tleWJvYXJkJykgbG9nS2V5cyhldmVudEtleSk7XG4gIH1cblxuICBmdW5jdGlvbiBzd2l0Y2hJbnB1dChzdHJpbmcpIHtcbiAgICBjdXJyZW50SW5wdXQgPSBzdHJpbmc7XG4gICAgYm9keS5zZXRBdHRyaWJ1dGUoJ2RhdGEtd2hhdGlucHV0JywgY3VycmVudElucHV0KTtcblxuICAgIGlmIChpbnB1dFR5cGVzLmluZGV4T2YoY3VycmVudElucHV0KSA9PT0gLTEpIGlucHV0VHlwZXMucHVzaChjdXJyZW50SW5wdXQpO1xuICB9XG5cbiAgZnVuY3Rpb24ga2V5KGV2ZW50KSB7XG4gICAgcmV0dXJuIChldmVudC5rZXlDb2RlKSA/IGV2ZW50LmtleUNvZGUgOiBldmVudC53aGljaDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRhcmdldChldmVudCkge1xuICAgIHJldHVybiBldmVudC50YXJnZXQgfHwgZXZlbnQuc3JjRWxlbWVudDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBvaW50ZXJUeXBlKGV2ZW50KSB7XG4gICAgaWYgKHR5cGVvZiBldmVudC5wb2ludGVyVHlwZSA9PT0gJ251bWJlcicpIHtcbiAgICAgIHJldHVybiBwb2ludGVyTWFwW2V2ZW50LnBvaW50ZXJUeXBlXTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIChldmVudC5wb2ludGVyVHlwZSA9PT0gJ3BlbicpID8gJ3RvdWNoJyA6IGV2ZW50LnBvaW50ZXJUeXBlOyAvLyB0cmVhdCBwZW4gbGlrZSB0b3VjaFxuICAgIH1cbiAgfVxuXG4gIC8vIGtleWJvYXJkIGxvZ2dpbmdcbiAgZnVuY3Rpb24gbG9nS2V5cyhldmVudEtleSkge1xuICAgIGlmIChhY3RpdmVLZXlzLmluZGV4T2Yoa2V5TWFwW2V2ZW50S2V5XSkgPT09IC0xICYmIGtleU1hcFtldmVudEtleV0pIGFjdGl2ZUtleXMucHVzaChrZXlNYXBbZXZlbnRLZXldKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHVuTG9nS2V5cyhldmVudCkge1xuICAgIHZhciBldmVudEtleSA9IGtleShldmVudCk7XG4gICAgdmFyIGFycmF5UG9zID0gYWN0aXZlS2V5cy5pbmRleE9mKGtleU1hcFtldmVudEtleV0pO1xuXG4gICAgaWYgKGFycmF5UG9zICE9PSAtMSkgYWN0aXZlS2V5cy5zcGxpY2UoYXJyYXlQb3MsIDEpO1xuICB9XG5cbiAgZnVuY3Rpb24gYmluZEV2ZW50cygpIHtcbiAgICBib2R5ID0gZG9jdW1lbnQuYm9keTtcblxuICAgIC8vIHBvaW50ZXIgZXZlbnRzIChtb3VzZSwgcGVuLCB0b3VjaClcbiAgICBpZiAod2luZG93LlBvaW50ZXJFdmVudCkge1xuICAgICAgYm9keS5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVyZG93bicsIGJ1ZmZlcmVkRXZlbnQpO1xuICAgICAgYm9keS5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVybW92ZScsIGJ1ZmZlcmVkRXZlbnQpO1xuICAgIH0gZWxzZSBpZiAod2luZG93Lk1TUG9pbnRlckV2ZW50KSB7XG4gICAgICBib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ01TUG9pbnRlckRvd24nLCBidWZmZXJlZEV2ZW50KTtcbiAgICAgIGJvZHkuYWRkRXZlbnRMaXN0ZW5lcignTVNQb2ludGVyTW92ZScsIGJ1ZmZlcmVkRXZlbnQpO1xuICAgIH0gZWxzZSB7XG5cbiAgICAgIC8vIG1vdXNlIGV2ZW50c1xuICAgICAgYm9keS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBidWZmZXJlZEV2ZW50KTtcbiAgICAgIGJvZHkuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgYnVmZmVyZWRFdmVudCk7XG5cbiAgICAgIC8vIHRvdWNoIGV2ZW50c1xuICAgICAgaWYgKCdvbnRvdWNoc3RhcnQnIGluIHdpbmRvdykge1xuICAgICAgICBib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBldmVudEJ1ZmZlcik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gbW91c2Ugd2hlZWxcbiAgICBib2R5LmFkZEV2ZW50TGlzdGVuZXIobW91c2VXaGVlbCwgYnVmZmVyZWRFdmVudCk7XG5cbiAgICAvLyBrZXlib2FyZCBldmVudHNcbiAgICBib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB1bkJ1ZmZlcmVkRXZlbnQpO1xuICAgIGJvZHkuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB1bkJ1ZmZlcmVkRXZlbnQpO1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgdW5Mb2dLZXlzKTtcbiAgfVxuXG5cbiAgLypcbiAgICAtLS0tLS0tLS0tLS0tLS1cbiAgICB1dGlsaXRpZXNcbiAgICAtLS0tLS0tLS0tLS0tLS1cbiAgKi9cblxuICAvLyBkZXRlY3QgdmVyc2lvbiBvZiBtb3VzZSB3aGVlbCBldmVudCB0byB1c2VcbiAgLy8gdmlhIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0V2ZW50cy93aGVlbFxuICBmdW5jdGlvbiBkZXRlY3RXaGVlbCgpIHtcbiAgICByZXR1cm4gbW91c2VXaGVlbCA9ICdvbndoZWVsJyBpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSA/XG4gICAgICAnd2hlZWwnIDogLy8gTW9kZXJuIGJyb3dzZXJzIHN1cHBvcnQgXCJ3aGVlbFwiXG5cbiAgICAgIGRvY3VtZW50Lm9ubW91c2V3aGVlbCAhPT0gdW5kZWZpbmVkID9cbiAgICAgICAgJ21vdXNld2hlZWwnIDogLy8gV2Via2l0IGFuZCBJRSBzdXBwb3J0IGF0IGxlYXN0IFwibW91c2V3aGVlbFwiXG4gICAgICAgICdET01Nb3VzZVNjcm9sbCc7IC8vIGxldCdzIGFzc3VtZSB0aGF0IHJlbWFpbmluZyBicm93c2VycyBhcmUgb2xkZXIgRmlyZWZveFxuICB9XG5cblxuICAvKlxuICAgIC0tLS0tLS0tLS0tLS0tLVxuICAgIGluaXRcblxuICAgIGRvbid0IHN0YXJ0IHNjcmlwdCB1bmxlc3MgYnJvd3NlciBjdXRzIHRoZSBtdXN0YXJkLFxuICAgIGFsc28gcGFzc2VzIGlmIHBvbHlmaWxscyBhcmUgdXNlZFxuICAgIC0tLS0tLS0tLS0tLS0tLVxuICAqL1xuXG4gIGlmIChcbiAgICAnYWRkRXZlbnRMaXN0ZW5lcicgaW4gd2luZG93ICYmXG4gICAgQXJyYXkucHJvdG90eXBlLmluZGV4T2ZcbiAgKSB7XG5cbiAgICAvLyBpZiB0aGUgZG9tIGlzIGFscmVhZHkgcmVhZHkgYWxyZWFkeSAoc2NyaXB0IHdhcyBwbGFjZWQgYXQgYm90dG9tIG9mIDxib2R5PilcbiAgICBpZiAoZG9jdW1lbnQuYm9keSkge1xuICAgICAgYmluZEV2ZW50cygpO1xuXG4gICAgLy8gb3RoZXJ3aXNlIHdhaXQgZm9yIHRoZSBkb20gdG8gbG9hZCAoc2NyaXB0IHdhcyBwbGFjZWQgaW4gdGhlIDxoZWFkPilcbiAgICB9IGVsc2Uge1xuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGJpbmRFdmVudHMpO1xuICAgIH1cbiAgfVxuXG5cbiAgLypcbiAgICAtLS0tLS0tLS0tLS0tLS1cbiAgICBhcGlcbiAgICAtLS0tLS0tLS0tLS0tLS1cbiAgKi9cblxuICByZXR1cm4ge1xuXG4gICAgLy8gcmV0dXJucyBzdHJpbmc6IHRoZSBjdXJyZW50IGlucHV0IHR5cGVcbiAgICBhc2s6IGZ1bmN0aW9uKCkgeyByZXR1cm4gY3VycmVudElucHV0OyB9LFxuXG4gICAgLy8gcmV0dXJucyBhcnJheTogY3VycmVudGx5IHByZXNzZWQga2V5c1xuICAgIGtleXM6IGZ1bmN0aW9uKCkgeyByZXR1cm4gYWN0aXZlS2V5czsgfSxcblxuICAgIC8vIHJldHVybnMgYXJyYXk6IGFsbCB0aGUgZGV0ZWN0ZWQgaW5wdXQgdHlwZXNcbiAgICB0eXBlczogZnVuY3Rpb24oKSB7IHJldHVybiBpbnB1dFR5cGVzOyB9LFxuXG4gICAgLy8gYWNjZXB0cyBzdHJpbmc6IG1hbnVhbGx5IHNldCB0aGUgaW5wdXQgdHlwZVxuICAgIHNldDogc3dpdGNoSW5wdXRcbiAgfTtcblxufSgpKTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLyoqXG4gKiBBY2NvcmRpb24gbW9kdWxlLlxuICogQG1vZHVsZSBmb3VuZGF0aW9uLmFjY29yZGlvblxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5rZXlib2FyZFxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5tb3Rpb25cbiAqL1xuXG5jbGFzcyBBY2NvcmRpb24ge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBhbiBhY2NvcmRpb24uXG4gICAqIEBjbGFzc1xuICAgKiBAZmlyZXMgQWNjb3JkaW9uI2luaXRcbiAgICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIG1ha2UgaW50byBhbiBhY2NvcmRpb24uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gYSBwbGFpbiBvYmplY3Qgd2l0aCBzZXR0aW5ncyB0byBvdmVycmlkZSB0aGUgZGVmYXVsdCBvcHRpb25zLlxuICAgKi9cbiAgY29uc3RydWN0b3IoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMuJGVsZW1lbnQgPSBlbGVtZW50O1xuICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBBY2NvcmRpb24uZGVmYXVsdHMsIHRoaXMuJGVsZW1lbnQuZGF0YSgpLCBvcHRpb25zKTtcblxuICAgIHRoaXMuX2luaXQoKTtcblxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcywgJ0FjY29yZGlvbicpO1xuICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQucmVnaXN0ZXIoJ0FjY29yZGlvbicsIHtcbiAgICAgICdFTlRFUic6ICd0b2dnbGUnLFxuICAgICAgJ1NQQUNFJzogJ3RvZ2dsZScsXG4gICAgICAnQVJST1dfRE9XTic6ICduZXh0JyxcbiAgICAgICdBUlJPV19VUCc6ICdwcmV2aW91cydcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgYWNjb3JkaW9uIGJ5IGFuaW1hdGluZyB0aGUgcHJlc2V0IGFjdGl2ZSBwYW5lKHMpLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2luaXQoKSB7XG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKCdyb2xlJywgJ3RhYmxpc3QnKTtcbiAgICB0aGlzLiR0YWJzID0gdGhpcy4kZWxlbWVudC5jaGlsZHJlbignbGksIFtkYXRhLWFjY29yZGlvbi1pdGVtXScpO1xuXG4gICAgdGhpcy4kdGFicy5lYWNoKGZ1bmN0aW9uKGlkeCwgZWwpIHtcbiAgICAgIHZhciAkZWwgPSAkKGVsKSxcbiAgICAgICAgICAkY29udGVudCA9ICRlbC5jaGlsZHJlbignW2RhdGEtdGFiLWNvbnRlbnRdJyksXG4gICAgICAgICAgaWQgPSAkY29udGVudFswXS5pZCB8fCBGb3VuZGF0aW9uLkdldFlvRGlnaXRzKDYsICdhY2NvcmRpb24nKSxcbiAgICAgICAgICBsaW5rSWQgPSBlbC5pZCB8fCBgJHtpZH0tbGFiZWxgO1xuXG4gICAgICAkZWwuZmluZCgnYTpmaXJzdCcpLmF0dHIoe1xuICAgICAgICAnYXJpYS1jb250cm9scyc6IGlkLFxuICAgICAgICAncm9sZSc6ICd0YWInLFxuICAgICAgICAnaWQnOiBsaW5rSWQsXG4gICAgICAgICdhcmlhLWV4cGFuZGVkJzogZmFsc2UsXG4gICAgICAgICdhcmlhLXNlbGVjdGVkJzogZmFsc2VcbiAgICAgIH0pO1xuXG4gICAgICAkY29udGVudC5hdHRyKHsncm9sZSc6ICd0YWJwYW5lbCcsICdhcmlhLWxhYmVsbGVkYnknOiBsaW5rSWQsICdhcmlhLWhpZGRlbic6IHRydWUsICdpZCc6IGlkfSk7XG4gICAgfSk7XG4gICAgdmFyICRpbml0QWN0aXZlID0gdGhpcy4kZWxlbWVudC5maW5kKCcuaXMtYWN0aXZlJykuY2hpbGRyZW4oJ1tkYXRhLXRhYi1jb250ZW50XScpO1xuICAgIGlmKCRpbml0QWN0aXZlLmxlbmd0aCl7XG4gICAgICB0aGlzLmRvd24oJGluaXRBY3RpdmUsIHRydWUpO1xuICAgIH1cbiAgICB0aGlzLl9ldmVudHMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGV2ZW50IGhhbmRsZXJzIGZvciBpdGVtcyB3aXRoaW4gdGhlIGFjY29yZGlvbi5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9ldmVudHMoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIHRoaXMuJHRhYnMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgIHZhciAkZWxlbSA9ICQodGhpcyk7XG4gICAgICB2YXIgJHRhYkNvbnRlbnQgPSAkZWxlbS5jaGlsZHJlbignW2RhdGEtdGFiLWNvbnRlbnRdJyk7XG4gICAgICBpZiAoJHRhYkNvbnRlbnQubGVuZ3RoKSB7XG4gICAgICAgICRlbGVtLmNoaWxkcmVuKCdhJykub2ZmKCdjbGljay56Zi5hY2NvcmRpb24ga2V5ZG93bi56Zi5hY2NvcmRpb24nKVxuICAgICAgICAgICAgICAgLm9uKCdjbGljay56Zi5hY2NvcmRpb24nLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIF90aGlzLnRvZ2dsZSgkdGFiQ29udGVudCk7XG4gICAgICAgIH0pLm9uKCdrZXlkb3duLnpmLmFjY29yZGlvbicsIGZ1bmN0aW9uKGUpe1xuICAgICAgICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQuaGFuZGxlS2V5KGUsICdBY2NvcmRpb24nLCB7XG4gICAgICAgICAgICB0b2dnbGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICBfdGhpcy50b2dnbGUoJHRhYkNvbnRlbnQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG5leHQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICB2YXIgJGEgPSAkZWxlbS5uZXh0KCkuZmluZCgnYScpLmZvY3VzKCk7XG4gICAgICAgICAgICAgIGlmICghX3RoaXMub3B0aW9ucy5tdWx0aUV4cGFuZCkge1xuICAgICAgICAgICAgICAgICRhLnRyaWdnZXIoJ2NsaWNrLnpmLmFjY29yZGlvbicpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcmV2aW91czogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHZhciAkYSA9ICRlbGVtLnByZXYoKS5maW5kKCdhJykuZm9jdXMoKTtcbiAgICAgICAgICAgICAgaWYgKCFfdGhpcy5vcHRpb25zLm11bHRpRXhwYW5kKSB7XG4gICAgICAgICAgICAgICAgJGEudHJpZ2dlcignY2xpY2suemYuYWNjb3JkaW9uJylcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGhhbmRsZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFRvZ2dsZXMgdGhlIHNlbGVjdGVkIGNvbnRlbnQgcGFuZSdzIG9wZW4vY2xvc2Ugc3RhdGUuXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSAkdGFyZ2V0IC0galF1ZXJ5IG9iamVjdCBvZiB0aGUgcGFuZSB0byB0b2dnbGUgKGAuYWNjb3JkaW9uLWNvbnRlbnRgKS5cbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICB0b2dnbGUoJHRhcmdldCkge1xuICAgIGlmKCR0YXJnZXQucGFyZW50KCkuaGFzQ2xhc3MoJ2lzLWFjdGl2ZScpKSB7XG4gICAgICB0aGlzLnVwKCR0YXJnZXQpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRvd24oJHRhcmdldCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIE9wZW5zIHRoZSBhY2NvcmRpb24gdGFiIGRlZmluZWQgYnkgYCR0YXJnZXRgLlxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJHRhcmdldCAtIEFjY29yZGlvbiBwYW5lIHRvIG9wZW4gKGAuYWNjb3JkaW9uLWNvbnRlbnRgKS5cbiAgICogQHBhcmFtIHtCb29sZWFufSBmaXJzdFRpbWUgLSBmbGFnIHRvIGRldGVybWluZSBpZiByZWZsb3cgc2hvdWxkIGhhcHBlbi5cbiAgICogQGZpcmVzIEFjY29yZGlvbiNkb3duXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgZG93bigkdGFyZ2V0LCBmaXJzdFRpbWUpIHtcbiAgICAkdGFyZ2V0XG4gICAgICAuYXR0cignYXJpYS1oaWRkZW4nLCBmYWxzZSlcbiAgICAgIC5wYXJlbnQoJ1tkYXRhLXRhYi1jb250ZW50XScpXG4gICAgICAuYWRkQmFjaygpXG4gICAgICAucGFyZW50KCkuYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpO1xuXG4gICAgaWYgKCF0aGlzLm9wdGlvbnMubXVsdGlFeHBhbmQgJiYgIWZpcnN0VGltZSkge1xuICAgICAgdmFyICRjdXJyZW50QWN0aXZlID0gdGhpcy4kZWxlbWVudC5jaGlsZHJlbignLmlzLWFjdGl2ZScpLmNoaWxkcmVuKCdbZGF0YS10YWItY29udGVudF0nKTtcbiAgICAgIGlmICgkY3VycmVudEFjdGl2ZS5sZW5ndGgpIHtcbiAgICAgICAgdGhpcy51cCgkY3VycmVudEFjdGl2ZS5ub3QoJHRhcmdldCkpO1xuICAgICAgfVxuICAgIH1cblxuICAgICR0YXJnZXQuc2xpZGVEb3duKHRoaXMub3B0aW9ucy5zbGlkZVNwZWVkLCAoKSA9PiB7XG4gICAgICAvKipcbiAgICAgICAqIEZpcmVzIHdoZW4gdGhlIHRhYiBpcyBkb25lIG9wZW5pbmcuXG4gICAgICAgKiBAZXZlbnQgQWNjb3JkaW9uI2Rvd25cbiAgICAgICAqL1xuICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdkb3duLnpmLmFjY29yZGlvbicsIFskdGFyZ2V0XSk7XG4gICAgfSk7XG5cbiAgICAkKGAjJHskdGFyZ2V0LmF0dHIoJ2FyaWEtbGFiZWxsZWRieScpfWApLmF0dHIoe1xuICAgICAgJ2FyaWEtZXhwYW5kZWQnOiB0cnVlLFxuICAgICAgJ2FyaWEtc2VsZWN0ZWQnOiB0cnVlXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ2xvc2VzIHRoZSB0YWIgZGVmaW5lZCBieSBgJHRhcmdldGAuXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSAkdGFyZ2V0IC0gQWNjb3JkaW9uIHRhYiB0byBjbG9zZSAoYC5hY2NvcmRpb24tY29udGVudGApLlxuICAgKiBAZmlyZXMgQWNjb3JkaW9uI3VwXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgdXAoJHRhcmdldCkge1xuICAgIHZhciAkYXVudHMgPSAkdGFyZ2V0LnBhcmVudCgpLnNpYmxpbmdzKCksXG4gICAgICAgIF90aGlzID0gdGhpcztcblxuICAgIGlmKCghdGhpcy5vcHRpb25zLmFsbG93QWxsQ2xvc2VkICYmICEkYXVudHMuaGFzQ2xhc3MoJ2lzLWFjdGl2ZScpKSB8fCAhJHRhcmdldC5wYXJlbnQoKS5oYXNDbGFzcygnaXMtYWN0aXZlJykpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBGb3VuZGF0aW9uLk1vdmUodGhpcy5vcHRpb25zLnNsaWRlU3BlZWQsICR0YXJnZXQsIGZ1bmN0aW9uKCl7XG4gICAgICAkdGFyZ2V0LnNsaWRlVXAoX3RoaXMub3B0aW9ucy5zbGlkZVNwZWVkLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBGaXJlcyB3aGVuIHRoZSB0YWIgaXMgZG9uZSBjb2xsYXBzaW5nIHVwLlxuICAgICAgICAgKiBAZXZlbnQgQWNjb3JkaW9uI3VwXG4gICAgICAgICAqL1xuICAgICAgICBfdGhpcy4kZWxlbWVudC50cmlnZ2VyKCd1cC56Zi5hY2NvcmRpb24nLCBbJHRhcmdldF0pO1xuICAgICAgfSk7XG4gICAgLy8gfSk7XG5cbiAgICAkdGFyZ2V0LmF0dHIoJ2FyaWEtaGlkZGVuJywgdHJ1ZSlcbiAgICAgICAgICAgLnBhcmVudCgpLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcblxuICAgICQoYCMkeyR0YXJnZXQuYXR0cignYXJpYS1sYWJlbGxlZGJ5Jyl9YCkuYXR0cih7XG4gICAgICdhcmlhLWV4cGFuZGVkJzogZmFsc2UsXG4gICAgICdhcmlhLXNlbGVjdGVkJzogZmFsc2VcbiAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIGFuIGluc3RhbmNlIG9mIGFuIGFjY29yZGlvbi5cbiAgICogQGZpcmVzIEFjY29yZGlvbiNkZXN0cm95ZWRcbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICBkZXN0cm95KCkge1xuICAgIHRoaXMuJGVsZW1lbnQuZmluZCgnW2RhdGEtdGFiLWNvbnRlbnRdJykuc3RvcCh0cnVlKS5zbGlkZVVwKDApLmNzcygnZGlzcGxheScsICcnKTtcbiAgICB0aGlzLiRlbGVtZW50LmZpbmQoJ2EnKS5vZmYoJy56Zi5hY2NvcmRpb24nKTtcblxuICAgIEZvdW5kYXRpb24udW5yZWdpc3RlclBsdWdpbih0aGlzKTtcbiAgfVxufVxuXG5BY2NvcmRpb24uZGVmYXVsdHMgPSB7XG4gIC8qKlxuICAgKiBBbW91bnQgb2YgdGltZSB0byBhbmltYXRlIHRoZSBvcGVuaW5nIG9mIGFuIGFjY29yZGlvbiBwYW5lLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIDI1MFxuICAgKi9cbiAgc2xpZGVTcGVlZDogMjUwLFxuICAvKipcbiAgICogQWxsb3cgdGhlIGFjY29yZGlvbiB0byBoYXZlIG11bHRpcGxlIG9wZW4gcGFuZXMuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgZmFsc2VcbiAgICovXG4gIG11bHRpRXhwYW5kOiBmYWxzZSxcbiAgLyoqXG4gICAqIEFsbG93IHRoZSBhY2NvcmRpb24gdG8gY2xvc2UgYWxsIHBhbmVzLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIGZhbHNlXG4gICAqL1xuICBhbGxvd0FsbENsb3NlZDogZmFsc2Vcbn07XG5cbi8vIFdpbmRvdyBleHBvcnRzXG5Gb3VuZGF0aW9uLnBsdWdpbihBY2NvcmRpb24sICdBY2NvcmRpb24nKTtcblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG4vKipcbiAqIEFjY29yZGlvbk1lbnUgbW9kdWxlLlxuICogQG1vZHVsZSBmb3VuZGF0aW9uLmFjY29yZGlvbk1lbnVcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwua2V5Ym9hcmRcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubW90aW9uXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm5lc3RcbiAqL1xuXG5jbGFzcyBBY2NvcmRpb25NZW51IHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgYW4gYWNjb3JkaW9uIG1lbnUuXG4gICAqIEBjbGFzc1xuICAgKiBAZmlyZXMgQWNjb3JkaW9uTWVudSNpbml0XG4gICAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBtYWtlIGludG8gYW4gYWNjb3JkaW9uIG1lbnUuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRlbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgQWNjb3JkaW9uTWVudS5kZWZhdWx0cywgdGhpcy4kZWxlbWVudC5kYXRhKCksIG9wdGlvbnMpO1xuXG4gICAgRm91bmRhdGlvbi5OZXN0LkZlYXRoZXIodGhpcy4kZWxlbWVudCwgJ2FjY29yZGlvbicpO1xuXG4gICAgdGhpcy5faW5pdCgpO1xuXG4gICAgRm91bmRhdGlvbi5yZWdpc3RlclBsdWdpbih0aGlzLCAnQWNjb3JkaW9uTWVudScpO1xuICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQucmVnaXN0ZXIoJ0FjY29yZGlvbk1lbnUnLCB7XG4gICAgICAnRU5URVInOiAndG9nZ2xlJyxcbiAgICAgICdTUEFDRSc6ICd0b2dnbGUnLFxuICAgICAgJ0FSUk9XX1JJR0hUJzogJ29wZW4nLFxuICAgICAgJ0FSUk9XX1VQJzogJ3VwJyxcbiAgICAgICdBUlJPV19ET1dOJzogJ2Rvd24nLFxuICAgICAgJ0FSUk9XX0xFRlQnOiAnY2xvc2UnLFxuICAgICAgJ0VTQ0FQRSc6ICdjbG9zZUFsbCdcbiAgICB9KTtcbiAgfVxuXG5cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIGFjY29yZGlvbiBtZW51IGJ5IGhpZGluZyBhbGwgbmVzdGVkIG1lbnVzLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2luaXQoKSB7XG4gICAgdGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS1zdWJtZW51XScpLm5vdCgnLmlzLWFjdGl2ZScpLnNsaWRlVXAoMCk7Ly8uZmluZCgnYScpLmNzcygncGFkZGluZy1sZWZ0JywgJzFyZW0nKTtcbiAgICB0aGlzLiRlbGVtZW50LmF0dHIoe1xuICAgICAgJ3JvbGUnOiAnbWVudScsXG4gICAgICAnYXJpYS1tdWx0aXNlbGVjdGFibGUnOiB0aGlzLm9wdGlvbnMubXVsdGlPcGVuXG4gICAgfSk7XG5cbiAgICB0aGlzLiRtZW51TGlua3MgPSB0aGlzLiRlbGVtZW50LmZpbmQoJy5pcy1hY2NvcmRpb24tc3VibWVudS1wYXJlbnQnKTtcbiAgICB0aGlzLiRtZW51TGlua3MuZWFjaChmdW5jdGlvbigpe1xuICAgICAgdmFyIGxpbmtJZCA9IHRoaXMuaWQgfHwgRm91bmRhdGlvbi5HZXRZb0RpZ2l0cyg2LCAnYWNjLW1lbnUtbGluaycpLFxuICAgICAgICAgICRlbGVtID0gJCh0aGlzKSxcbiAgICAgICAgICAkc3ViID0gJGVsZW0uY2hpbGRyZW4oJ1tkYXRhLXN1Ym1lbnVdJyksXG4gICAgICAgICAgc3ViSWQgPSAkc3ViWzBdLmlkIHx8IEZvdW5kYXRpb24uR2V0WW9EaWdpdHMoNiwgJ2FjYy1tZW51JyksXG4gICAgICAgICAgaXNBY3RpdmUgPSAkc3ViLmhhc0NsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICAgICRlbGVtLmF0dHIoe1xuICAgICAgICAnYXJpYS1jb250cm9scyc6IHN1YklkLFxuICAgICAgICAnYXJpYS1leHBhbmRlZCc6IGlzQWN0aXZlLFxuICAgICAgICAncm9sZSc6ICdtZW51aXRlbScsXG4gICAgICAgICdpZCc6IGxpbmtJZFxuICAgICAgfSk7XG4gICAgICAkc3ViLmF0dHIoe1xuICAgICAgICAnYXJpYS1sYWJlbGxlZGJ5JzogbGlua0lkLFxuICAgICAgICAnYXJpYS1oaWRkZW4nOiAhaXNBY3RpdmUsXG4gICAgICAgICdyb2xlJzogJ21lbnUnLFxuICAgICAgICAnaWQnOiBzdWJJZFxuICAgICAgfSk7XG4gICAgfSk7XG4gICAgdmFyIGluaXRQYW5lcyA9IHRoaXMuJGVsZW1lbnQuZmluZCgnLmlzLWFjdGl2ZScpO1xuICAgIGlmKGluaXRQYW5lcy5sZW5ndGgpe1xuICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgIGluaXRQYW5lcy5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICAgIF90aGlzLmRvd24oJCh0aGlzKSk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgdGhpcy5fZXZlbnRzKCk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBldmVudCBoYW5kbGVycyBmb3IgaXRlbXMgd2l0aGluIHRoZSBtZW51LlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2V2ZW50cygpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgdGhpcy4kZWxlbWVudC5maW5kKCdsaScpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgJHN1Ym1lbnUgPSAkKHRoaXMpLmNoaWxkcmVuKCdbZGF0YS1zdWJtZW51XScpO1xuXG4gICAgICBpZiAoJHN1Ym1lbnUubGVuZ3RoKSB7XG4gICAgICAgICQodGhpcykuY2hpbGRyZW4oJ2EnKS5vZmYoJ2NsaWNrLnpmLmFjY29yZGlvbk1lbnUnKS5vbignY2xpY2suemYuYWNjb3JkaW9uTWVudScsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgICBfdGhpcy50b2dnbGUoJHN1Ym1lbnUpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KS5vbigna2V5ZG93bi56Zi5hY2NvcmRpb25tZW51JywgZnVuY3Rpb24oZSl7XG4gICAgICB2YXIgJGVsZW1lbnQgPSAkKHRoaXMpLFxuICAgICAgICAgICRlbGVtZW50cyA9ICRlbGVtZW50LnBhcmVudCgndWwnKS5jaGlsZHJlbignbGknKSxcbiAgICAgICAgICAkcHJldkVsZW1lbnQsXG4gICAgICAgICAgJG5leHRFbGVtZW50LFxuICAgICAgICAgICR0YXJnZXQgPSAkZWxlbWVudC5jaGlsZHJlbignW2RhdGEtc3VibWVudV0nKTtcblxuICAgICAgJGVsZW1lbnRzLmVhY2goZnVuY3Rpb24oaSkge1xuICAgICAgICBpZiAoJCh0aGlzKS5pcygkZWxlbWVudCkpIHtcbiAgICAgICAgICAkcHJldkVsZW1lbnQgPSAkZWxlbWVudHMuZXEoTWF0aC5tYXgoMCwgaS0xKSkuZmluZCgnYScpLmZpcnN0KCk7XG4gICAgICAgICAgJG5leHRFbGVtZW50ID0gJGVsZW1lbnRzLmVxKE1hdGgubWluKGkrMSwgJGVsZW1lbnRzLmxlbmd0aC0xKSkuZmluZCgnYScpLmZpcnN0KCk7XG5cbiAgICAgICAgICBpZiAoJCh0aGlzKS5jaGlsZHJlbignW2RhdGEtc3VibWVudV06dmlzaWJsZScpLmxlbmd0aCkgeyAvLyBoYXMgb3BlbiBzdWIgbWVudVxuICAgICAgICAgICAgJG5leHRFbGVtZW50ID0gJGVsZW1lbnQuZmluZCgnbGk6Zmlyc3QtY2hpbGQnKS5maW5kKCdhJykuZmlyc3QoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCQodGhpcykuaXMoJzpmaXJzdC1jaGlsZCcpKSB7IC8vIGlzIGZpcnN0IGVsZW1lbnQgb2Ygc3ViIG1lbnVcbiAgICAgICAgICAgICRwcmV2RWxlbWVudCA9ICRlbGVtZW50LnBhcmVudHMoJ2xpJykuZmlyc3QoKS5maW5kKCdhJykuZmlyc3QoKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKCRwcmV2RWxlbWVudC5wYXJlbnRzKCdsaScpLmZpcnN0KCkuY2hpbGRyZW4oJ1tkYXRhLXN1Ym1lbnVdOnZpc2libGUnKS5sZW5ndGgpIHsgLy8gaWYgcHJldmlvdXMgZWxlbWVudCBoYXMgb3BlbiBzdWIgbWVudVxuICAgICAgICAgICAgJHByZXZFbGVtZW50ID0gJHByZXZFbGVtZW50LnBhcmVudHMoJ2xpJykuZmluZCgnbGk6bGFzdC1jaGlsZCcpLmZpbmQoJ2EnKS5maXJzdCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoJCh0aGlzKS5pcygnOmxhc3QtY2hpbGQnKSkgeyAvLyBpcyBsYXN0IGVsZW1lbnQgb2Ygc3ViIG1lbnVcbiAgICAgICAgICAgICRuZXh0RWxlbWVudCA9ICRlbGVtZW50LnBhcmVudHMoJ2xpJykuZmlyc3QoKS5uZXh0KCdsaScpLmZpbmQoJ2EnKS5maXJzdCgpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQuaGFuZGxlS2V5KGUsICdBY2NvcmRpb25NZW51Jywge1xuICAgICAgICBvcGVuOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoJHRhcmdldC5pcygnOmhpZGRlbicpKSB7XG4gICAgICAgICAgICBfdGhpcy5kb3duKCR0YXJnZXQpO1xuICAgICAgICAgICAgJHRhcmdldC5maW5kKCdsaScpLmZpcnN0KCkuZmluZCgnYScpLmZpcnN0KCkuZm9jdXMoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGNsb3NlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoJHRhcmdldC5sZW5ndGggJiYgISR0YXJnZXQuaXMoJzpoaWRkZW4nKSkgeyAvLyBjbG9zZSBhY3RpdmUgc3ViIG9mIHRoaXMgaXRlbVxuICAgICAgICAgICAgX3RoaXMudXAoJHRhcmdldCk7XG4gICAgICAgICAgfSBlbHNlIGlmICgkZWxlbWVudC5wYXJlbnQoJ1tkYXRhLXN1Ym1lbnVdJykubGVuZ3RoKSB7IC8vIGNsb3NlIGN1cnJlbnRseSBvcGVuIHN1YlxuICAgICAgICAgICAgX3RoaXMudXAoJGVsZW1lbnQucGFyZW50KCdbZGF0YS1zdWJtZW51XScpKTtcbiAgICAgICAgICAgICRlbGVtZW50LnBhcmVudHMoJ2xpJykuZmlyc3QoKS5maW5kKCdhJykuZmlyc3QoKS5mb2N1cygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgdXA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICRwcmV2RWxlbWVudC5mb2N1cygpO1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LFxuICAgICAgICBkb3duOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAkbmV4dEVsZW1lbnQuZm9jdXMoKTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgdG9nZ2xlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoJGVsZW1lbnQuY2hpbGRyZW4oJ1tkYXRhLXN1Ym1lbnVdJykubGVuZ3RoKSB7XG4gICAgICAgICAgICBfdGhpcy50b2dnbGUoJGVsZW1lbnQuY2hpbGRyZW4oJ1tkYXRhLXN1Ym1lbnVdJykpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgY2xvc2VBbGw6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIF90aGlzLmhpZGVBbGwoKTtcbiAgICAgICAgfSxcbiAgICAgICAgaGFuZGxlZDogZnVuY3Rpb24ocHJldmVudERlZmF1bHQpIHtcbiAgICAgICAgICBpZiAocHJldmVudERlZmF1bHQpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7Ly8uYXR0cigndGFiaW5kZXgnLCAwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbG9zZXMgYWxsIHBhbmVzIG9mIHRoZSBtZW51LlxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIGhpZGVBbGwoKSB7XG4gICAgdGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS1zdWJtZW51XScpLnNsaWRlVXAodGhpcy5vcHRpb25zLnNsaWRlU3BlZWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRvZ2dsZXMgdGhlIG9wZW4vY2xvc2Ugc3RhdGUgb2YgYSBzdWJtZW51LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHBhcmFtIHtqUXVlcnl9ICR0YXJnZXQgLSB0aGUgc3VibWVudSB0byB0b2dnbGVcbiAgICovXG4gIHRvZ2dsZSgkdGFyZ2V0KXtcbiAgICBpZighJHRhcmdldC5pcygnOmFuaW1hdGVkJykpIHtcbiAgICAgIGlmICghJHRhcmdldC5pcygnOmhpZGRlbicpKSB7XG4gICAgICAgIHRoaXMudXAoJHRhcmdldCk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgdGhpcy5kb3duKCR0YXJnZXQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBPcGVucyB0aGUgc3ViLW1lbnUgZGVmaW5lZCBieSBgJHRhcmdldGAuXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSAkdGFyZ2V0IC0gU3ViLW1lbnUgdG8gb3Blbi5cbiAgICogQGZpcmVzIEFjY29yZGlvbk1lbnUjZG93blxuICAgKi9cbiAgZG93bigkdGFyZ2V0KSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIGlmKCF0aGlzLm9wdGlvbnMubXVsdGlPcGVuKSB7XG4gICAgICB0aGlzLnVwKHRoaXMuJGVsZW1lbnQuZmluZCgnLmlzLWFjdGl2ZScpLm5vdCgkdGFyZ2V0LnBhcmVudHNVbnRpbCh0aGlzLiRlbGVtZW50KS5hZGQoJHRhcmdldCkpKTtcbiAgICB9XG5cbiAgICAkdGFyZ2V0LmFkZENsYXNzKCdpcy1hY3RpdmUnKS5hdHRyKHsnYXJpYS1oaWRkZW4nOiBmYWxzZX0pXG4gICAgICAucGFyZW50KCcuaXMtYWNjb3JkaW9uLXN1Ym1lbnUtcGFyZW50JykuYXR0cih7J2FyaWEtZXhwYW5kZWQnOiB0cnVlfSk7XG5cbiAgICAgIC8vRm91bmRhdGlvbi5Nb3ZlKHRoaXMub3B0aW9ucy5zbGlkZVNwZWVkLCAkdGFyZ2V0LCBmdW5jdGlvbigpIHtcbiAgICAgICAgJHRhcmdldC5zbGlkZURvd24oX3RoaXMub3B0aW9ucy5zbGlkZVNwZWVkLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgLyoqXG4gICAgICAgICAgICogRmlyZXMgd2hlbiB0aGUgbWVudSBpcyBkb25lIG9wZW5pbmcuXG4gICAgICAgICAgICogQGV2ZW50IEFjY29yZGlvbk1lbnUjZG93blxuICAgICAgICAgICAqL1xuICAgICAgICAgIF90aGlzLiRlbGVtZW50LnRyaWdnZXIoJ2Rvd24uemYuYWNjb3JkaW9uTWVudScsIFskdGFyZ2V0XSk7XG4gICAgICAgIH0pO1xuICAgICAgLy99KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbG9zZXMgdGhlIHN1Yi1tZW51IGRlZmluZWQgYnkgYCR0YXJnZXRgLiBBbGwgc3ViLW1lbnVzIGluc2lkZSB0aGUgdGFyZ2V0IHdpbGwgYmUgY2xvc2VkIGFzIHdlbGwuXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSAkdGFyZ2V0IC0gU3ViLW1lbnUgdG8gY2xvc2UuXG4gICAqIEBmaXJlcyBBY2NvcmRpb25NZW51I3VwXG4gICAqL1xuICB1cCgkdGFyZ2V0KSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAvL0ZvdW5kYXRpb24uTW92ZSh0aGlzLm9wdGlvbnMuc2xpZGVTcGVlZCwgJHRhcmdldCwgZnVuY3Rpb24oKXtcbiAgICAgICR0YXJnZXQuc2xpZGVVcChfdGhpcy5vcHRpb25zLnNsaWRlU3BlZWQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZpcmVzIHdoZW4gdGhlIG1lbnUgaXMgZG9uZSBjb2xsYXBzaW5nIHVwLlxuICAgICAgICAgKiBAZXZlbnQgQWNjb3JkaW9uTWVudSN1cFxuICAgICAgICAgKi9cbiAgICAgICAgX3RoaXMuJGVsZW1lbnQudHJpZ2dlcigndXAuemYuYWNjb3JkaW9uTWVudScsIFskdGFyZ2V0XSk7XG4gICAgICB9KTtcbiAgICAvL30pO1xuXG4gICAgdmFyICRtZW51cyA9ICR0YXJnZXQuZmluZCgnW2RhdGEtc3VibWVudV0nKS5zbGlkZVVwKDApLmFkZEJhY2soKS5hdHRyKCdhcmlhLWhpZGRlbicsIHRydWUpO1xuXG4gICAgJG1lbnVzLnBhcmVudCgnLmlzLWFjY29yZGlvbi1zdWJtZW51LXBhcmVudCcpLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCBmYWxzZSk7XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgYW4gaW5zdGFuY2Ugb2YgYWNjb3JkaW9uIG1lbnUuXG4gICAqIEBmaXJlcyBBY2NvcmRpb25NZW51I2Rlc3Ryb3llZFxuICAgKi9cbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLiRlbGVtZW50LmZpbmQoJ1tkYXRhLXN1Ym1lbnVdJykuc2xpZGVEb3duKDApLmNzcygnZGlzcGxheScsICcnKTtcbiAgICB0aGlzLiRlbGVtZW50LmZpbmQoJ2EnKS5vZmYoJ2NsaWNrLnpmLmFjY29yZGlvbk1lbnUnKTtcblxuICAgIEZvdW5kYXRpb24uTmVzdC5CdXJuKHRoaXMuJGVsZW1lbnQsICdhY2NvcmRpb24nKTtcbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XG4gIH1cbn1cblxuQWNjb3JkaW9uTWVudS5kZWZhdWx0cyA9IHtcbiAgLyoqXG4gICAqIEFtb3VudCBvZiB0aW1lIHRvIGFuaW1hdGUgdGhlIG9wZW5pbmcgb2YgYSBzdWJtZW51IGluIG1zLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIDI1MFxuICAgKi9cbiAgc2xpZGVTcGVlZDogMjUwLFxuICAvKipcbiAgICogQWxsb3cgdGhlIG1lbnUgdG8gaGF2ZSBtdWx0aXBsZSBvcGVuIHBhbmVzLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIHRydWVcbiAgICovXG4gIG11bHRpT3BlbjogdHJ1ZVxufTtcblxuLy8gV2luZG93IGV4cG9ydHNcbkZvdW5kYXRpb24ucGx1Z2luKEFjY29yZGlvbk1lbnUsICdBY2NvcmRpb25NZW51Jyk7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLyoqXG4gKiBEcm9wZG93biBtb2R1bGUuXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24uZHJvcGRvd25cbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwua2V5Ym9hcmRcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwuYm94XG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLnRyaWdnZXJzXG4gKi9cblxuY2xhc3MgRHJvcGRvd24ge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBhIGRyb3Bkb3duLlxuICAgKiBAY2xhc3NcbiAgICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIG1ha2UgaW50byBhIGRyb3Bkb3duLlxuICAgKiAgICAgICAgT2JqZWN0IHNob3VsZCBiZSBvZiB0aGUgZHJvcGRvd24gcGFuZWwsIHJhdGhlciB0aGFuIGl0cyBhbmNob3IuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRlbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgRHJvcGRvd24uZGVmYXVsdHMsIHRoaXMuJGVsZW1lbnQuZGF0YSgpLCBvcHRpb25zKTtcbiAgICB0aGlzLl9pbml0KCk7XG5cbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdEcm9wZG93bicpO1xuICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQucmVnaXN0ZXIoJ0Ryb3Bkb3duJywge1xuICAgICAgJ0VOVEVSJzogJ29wZW4nLFxuICAgICAgJ1NQQUNFJzogJ29wZW4nLFxuICAgICAgJ0VTQ0FQRSc6ICdjbG9zZScsXG4gICAgICAnVEFCJzogJ3RhYl9mb3J3YXJkJyxcbiAgICAgICdTSElGVF9UQUInOiAndGFiX2JhY2t3YXJkJ1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHRoZSBwbHVnaW4gYnkgc2V0dGluZy9jaGVja2luZyBvcHRpb25zIGFuZCBhdHRyaWJ1dGVzLCBhZGRpbmcgaGVscGVyIHZhcmlhYmxlcywgYW5kIHNhdmluZyB0aGUgYW5jaG9yLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9pbml0KCkge1xuICAgIHZhciAkaWQgPSB0aGlzLiRlbGVtZW50LmF0dHIoJ2lkJyk7XG5cbiAgICB0aGlzLiRhbmNob3IgPSAkKGBbZGF0YS10b2dnbGU9XCIkeyRpZH1cIl1gKS5sZW5ndGggPyAkKGBbZGF0YS10b2dnbGU9XCIkeyRpZH1cIl1gKSA6ICQoYFtkYXRhLW9wZW49XCIkeyRpZH1cIl1gKTtcbiAgICB0aGlzLiRhbmNob3IuYXR0cih7XG4gICAgICAnYXJpYS1jb250cm9scyc6ICRpZCxcbiAgICAgICdkYXRhLWlzLWZvY3VzJzogZmFsc2UsXG4gICAgICAnZGF0YS15ZXRpLWJveCc6ICRpZCxcbiAgICAgICdhcmlhLWhhc3BvcHVwJzogdHJ1ZSxcbiAgICAgICdhcmlhLWV4cGFuZGVkJzogZmFsc2VcblxuICAgIH0pO1xuXG4gICAgdGhpcy5vcHRpb25zLnBvc2l0aW9uQ2xhc3MgPSB0aGlzLmdldFBvc2l0aW9uQ2xhc3MoKTtcbiAgICB0aGlzLmNvdW50ZXIgPSA0O1xuICAgIHRoaXMudXNlZFBvc2l0aW9ucyA9IFtdO1xuICAgIHRoaXMuJGVsZW1lbnQuYXR0cih7XG4gICAgICAnYXJpYS1oaWRkZW4nOiAndHJ1ZScsXG4gICAgICAnZGF0YS15ZXRpLWJveCc6ICRpZCxcbiAgICAgICdkYXRhLXJlc2l6ZSc6ICRpZCxcbiAgICAgICdhcmlhLWxhYmVsbGVkYnknOiB0aGlzLiRhbmNob3JbMF0uaWQgfHwgRm91bmRhdGlvbi5HZXRZb0RpZ2l0cyg2LCAnZGQtYW5jaG9yJylcbiAgICB9KTtcbiAgICB0aGlzLl9ldmVudHMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIZWxwZXIgZnVuY3Rpb24gdG8gZGV0ZXJtaW5lIGN1cnJlbnQgb3JpZW50YXRpb24gb2YgZHJvcGRvd24gcGFuZS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEByZXR1cm5zIHtTdHJpbmd9IHBvc2l0aW9uIC0gc3RyaW5nIHZhbHVlIG9mIGEgcG9zaXRpb24gY2xhc3MuXG4gICAqL1xuICBnZXRQb3NpdGlvbkNsYXNzKCkge1xuICAgIHZhciB2ZXJ0aWNhbFBvc2l0aW9uID0gdGhpcy4kZWxlbWVudFswXS5jbGFzc05hbWUubWF0Y2goLyh0b3B8bGVmdHxyaWdodHxib3R0b20pL2cpO1xuICAgICAgICB2ZXJ0aWNhbFBvc2l0aW9uID0gdmVydGljYWxQb3NpdGlvbiA/IHZlcnRpY2FsUG9zaXRpb25bMF0gOiAnJztcbiAgICB2YXIgaG9yaXpvbnRhbFBvc2l0aW9uID0gL2Zsb2F0LShcXFMrKS8uZXhlYyh0aGlzLiRhbmNob3JbMF0uY2xhc3NOYW1lKTtcbiAgICAgICAgaG9yaXpvbnRhbFBvc2l0aW9uID0gaG9yaXpvbnRhbFBvc2l0aW9uID8gaG9yaXpvbnRhbFBvc2l0aW9uWzFdIDogJyc7XG4gICAgdmFyIHBvc2l0aW9uID0gaG9yaXpvbnRhbFBvc2l0aW9uID8gaG9yaXpvbnRhbFBvc2l0aW9uICsgJyAnICsgdmVydGljYWxQb3NpdGlvbiA6IHZlcnRpY2FsUG9zaXRpb247XG5cbiAgICByZXR1cm4gcG9zaXRpb247XG4gIH1cblxuICAvKipcbiAgICogQWRqdXN0cyB0aGUgZHJvcGRvd24gcGFuZXMgb3JpZW50YXRpb24gYnkgYWRkaW5nL3JlbW92aW5nIHBvc2l0aW9uaW5nIGNsYXNzZXMuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gcG9zaXRpb24gLSBwb3NpdGlvbiBjbGFzcyB0byByZW1vdmUuXG4gICAqL1xuICBfcmVwb3NpdGlvbihwb3NpdGlvbikge1xuICAgIHRoaXMudXNlZFBvc2l0aW9ucy5wdXNoKHBvc2l0aW9uID8gcG9zaXRpb24gOiAnYm90dG9tJyk7XG4gICAgLy9kZWZhdWx0LCB0cnkgc3dpdGNoaW5nIHRvIG9wcG9zaXRlIHNpZGVcbiAgICBpZighcG9zaXRpb24gJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCd0b3AnKSA8IDApKXtcbiAgICAgIHRoaXMuJGVsZW1lbnQuYWRkQ2xhc3MoJ3RvcCcpO1xuICAgIH1lbHNlIGlmKHBvc2l0aW9uID09PSAndG9wJyAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ2JvdHRvbScpIDwgMCkpe1xuICAgICAgdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcyhwb3NpdGlvbik7XG4gICAgfWVsc2UgaWYocG9zaXRpb24gPT09ICdsZWZ0JyAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ3JpZ2h0JykgPCAwKSl7XG4gICAgICB0aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKHBvc2l0aW9uKVxuICAgICAgICAgIC5hZGRDbGFzcygncmlnaHQnKTtcbiAgICB9ZWxzZSBpZihwb3NpdGlvbiA9PT0gJ3JpZ2h0JyAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ2xlZnQnKSA8IDApKXtcbiAgICAgIHRoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3MocG9zaXRpb24pXG4gICAgICAgICAgLmFkZENsYXNzKCdsZWZ0Jyk7XG4gICAgfVxuXG4gICAgLy9pZiBkZWZhdWx0IGNoYW5nZSBkaWRuJ3Qgd29yaywgdHJ5IGJvdHRvbSBvciBsZWZ0IGZpcnN0XG4gICAgZWxzZSBpZighcG9zaXRpb24gJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCd0b3AnKSA+IC0xKSAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ2xlZnQnKSA8IDApKXtcbiAgICAgIHRoaXMuJGVsZW1lbnQuYWRkQ2xhc3MoJ2xlZnQnKTtcbiAgICB9ZWxzZSBpZihwb3NpdGlvbiA9PT0gJ3RvcCcgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdib3R0b20nKSA+IC0xKSAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ2xlZnQnKSA8IDApKXtcbiAgICAgIHRoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3MocG9zaXRpb24pXG4gICAgICAgICAgLmFkZENsYXNzKCdsZWZ0Jyk7XG4gICAgfWVsc2UgaWYocG9zaXRpb24gPT09ICdsZWZ0JyAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ3JpZ2h0JykgPiAtMSkgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdib3R0b20nKSA8IDApKXtcbiAgICAgIHRoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3MocG9zaXRpb24pO1xuICAgIH1lbHNlIGlmKHBvc2l0aW9uID09PSAncmlnaHQnICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZignbGVmdCcpID4gLTEpICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZignYm90dG9tJykgPCAwKSl7XG4gICAgICB0aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKHBvc2l0aW9uKTtcbiAgICB9XG4gICAgLy9pZiBub3RoaW5nIGNsZWFyZWQsIHNldCB0byBib3R0b21cbiAgICBlbHNle1xuICAgICAgdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcyhwb3NpdGlvbik7XG4gICAgfVxuICAgIHRoaXMuY2xhc3NDaGFuZ2VkID0gdHJ1ZTtcbiAgICB0aGlzLmNvdW50ZXItLTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBwb3NpdGlvbiBhbmQgb3JpZW50YXRpb24gb2YgdGhlIGRyb3Bkb3duIHBhbmUsIGNoZWNrcyBmb3IgY29sbGlzaW9ucy5cbiAgICogUmVjdXJzaXZlbHkgY2FsbHMgaXRzZWxmIGlmIGEgY29sbGlzaW9uIGlzIGRldGVjdGVkLCB3aXRoIGEgbmV3IHBvc2l0aW9uIGNsYXNzLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9zZXRQb3NpdGlvbigpIHtcbiAgICBpZih0aGlzLiRhbmNob3IuYXR0cignYXJpYS1leHBhbmRlZCcpID09PSAnZmFsc2UnKXsgcmV0dXJuIGZhbHNlOyB9XG4gICAgdmFyIHBvc2l0aW9uID0gdGhpcy5nZXRQb3NpdGlvbkNsYXNzKCksXG4gICAgICAgICRlbGVEaW1zID0gRm91bmRhdGlvbi5Cb3guR2V0RGltZW5zaW9ucyh0aGlzLiRlbGVtZW50KSxcbiAgICAgICAgJGFuY2hvckRpbXMgPSBGb3VuZGF0aW9uLkJveC5HZXREaW1lbnNpb25zKHRoaXMuJGFuY2hvciksXG4gICAgICAgIF90aGlzID0gdGhpcyxcbiAgICAgICAgZGlyZWN0aW9uID0gKHBvc2l0aW9uID09PSAnbGVmdCcgPyAnbGVmdCcgOiAoKHBvc2l0aW9uID09PSAncmlnaHQnKSA/ICdsZWZ0JyA6ICd0b3AnKSksXG4gICAgICAgIHBhcmFtID0gKGRpcmVjdGlvbiA9PT0gJ3RvcCcpID8gJ2hlaWdodCcgOiAnd2lkdGgnLFxuICAgICAgICBvZmZzZXQgPSAocGFyYW0gPT09ICdoZWlnaHQnKSA/IHRoaXMub3B0aW9ucy52T2Zmc2V0IDogdGhpcy5vcHRpb25zLmhPZmZzZXQ7XG5cblxuXG4gICAgaWYoKCRlbGVEaW1zLndpZHRoID49ICRlbGVEaW1zLndpbmRvd0RpbXMud2lkdGgpIHx8ICghdGhpcy5jb3VudGVyICYmICFGb3VuZGF0aW9uLkJveC5JbU5vdFRvdWNoaW5nWW91KHRoaXMuJGVsZW1lbnQpKSl7XG4gICAgICB0aGlzLiRlbGVtZW50Lm9mZnNldChGb3VuZGF0aW9uLkJveC5HZXRPZmZzZXRzKHRoaXMuJGVsZW1lbnQsIHRoaXMuJGFuY2hvciwgJ2NlbnRlciBib3R0b20nLCB0aGlzLm9wdGlvbnMudk9mZnNldCwgdGhpcy5vcHRpb25zLmhPZmZzZXQsIHRydWUpKS5jc3Moe1xuICAgICAgICAnd2lkdGgnOiAkZWxlRGltcy53aW5kb3dEaW1zLndpZHRoIC0gKHRoaXMub3B0aW9ucy5oT2Zmc2V0ICogMiksXG4gICAgICAgICdoZWlnaHQnOiAnYXV0bydcbiAgICAgIH0pO1xuICAgICAgdGhpcy5jbGFzc0NoYW5nZWQgPSB0cnVlO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHRoaXMuJGVsZW1lbnQub2Zmc2V0KEZvdW5kYXRpb24uQm94LkdldE9mZnNldHModGhpcy4kZWxlbWVudCwgdGhpcy4kYW5jaG9yLCBwb3NpdGlvbiwgdGhpcy5vcHRpb25zLnZPZmZzZXQsIHRoaXMub3B0aW9ucy5oT2Zmc2V0KSk7XG5cbiAgICB3aGlsZSghRm91bmRhdGlvbi5Cb3guSW1Ob3RUb3VjaGluZ1lvdSh0aGlzLiRlbGVtZW50LCBmYWxzZSwgdHJ1ZSkgJiYgdGhpcy5jb3VudGVyKXtcbiAgICAgIHRoaXMuX3JlcG9zaXRpb24ocG9zaXRpb24pO1xuICAgICAgdGhpcy5fc2V0UG9zaXRpb24oKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBldmVudCBsaXN0ZW5lcnMgdG8gdGhlIGVsZW1lbnQgdXRpbGl6aW5nIHRoZSB0cmlnZ2VycyB1dGlsaXR5IGxpYnJhcnkuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2V2ZW50cygpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIHRoaXMuJGVsZW1lbnQub24oe1xuICAgICAgJ29wZW4uemYudHJpZ2dlcic6IHRoaXMub3Blbi5iaW5kKHRoaXMpLFxuICAgICAgJ2Nsb3NlLnpmLnRyaWdnZXInOiB0aGlzLmNsb3NlLmJpbmQodGhpcyksXG4gICAgICAndG9nZ2xlLnpmLnRyaWdnZXInOiB0aGlzLnRvZ2dsZS5iaW5kKHRoaXMpLFxuICAgICAgJ3Jlc2l6ZW1lLnpmLnRyaWdnZXInOiB0aGlzLl9zZXRQb3NpdGlvbi5iaW5kKHRoaXMpXG4gICAgfSk7XG5cbiAgICBpZih0aGlzLm9wdGlvbnMuaG92ZXIpe1xuICAgICAgdGhpcy4kYW5jaG9yLm9mZignbW91c2VlbnRlci56Zi5kcm9wZG93biBtb3VzZWxlYXZlLnpmLmRyb3Bkb3duJylcbiAgICAgIC5vbignbW91c2VlbnRlci56Zi5kcm9wZG93bicsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBpZigkKCdib2R5W2RhdGEtd2hhdGlucHV0PVwibW91c2VcIl0nKS5pcygnKicpKSB7XG4gICAgICAgICAgICAgIGNsZWFyVGltZW91dChfdGhpcy50aW1lb3V0KTtcbiAgICAgICAgICAgICAgX3RoaXMudGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICBfdGhpcy5vcGVuKCk7XG4gICAgICAgICAgICAgICAgX3RoaXMuJGFuY2hvci5kYXRhKCdob3ZlcicsIHRydWUpO1xuICAgICAgICAgICAgICB9LCBfdGhpcy5vcHRpb25zLmhvdmVyRGVsYXkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pLm9uKCdtb3VzZWxlYXZlLnpmLmRyb3Bkb3duJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dChfdGhpcy50aW1lb3V0KTtcbiAgICAgICAgICAgIF90aGlzLnRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgIF90aGlzLmNsb3NlKCk7XG4gICAgICAgICAgICAgIF90aGlzLiRhbmNob3IuZGF0YSgnaG92ZXInLCBmYWxzZSk7XG4gICAgICAgICAgICB9LCBfdGhpcy5vcHRpb25zLmhvdmVyRGVsYXkpO1xuICAgICAgICAgIH0pO1xuICAgICAgaWYodGhpcy5vcHRpb25zLmhvdmVyUGFuZSl7XG4gICAgICAgIHRoaXMuJGVsZW1lbnQub2ZmKCdtb3VzZWVudGVyLnpmLmRyb3Bkb3duIG1vdXNlbGVhdmUuemYuZHJvcGRvd24nKVxuICAgICAgICAgICAgLm9uKCdtb3VzZWVudGVyLnpmLmRyb3Bkb3duJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KF90aGlzLnRpbWVvdXQpO1xuICAgICAgICAgICAgfSkub24oJ21vdXNlbGVhdmUuemYuZHJvcGRvd24nLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoX3RoaXMudGltZW91dCk7XG4gICAgICAgICAgICAgIF90aGlzLnRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgX3RoaXMuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICBfdGhpcy4kYW5jaG9yLmRhdGEoJ2hvdmVyJywgZmFsc2UpO1xuICAgICAgICAgICAgICB9LCBfdGhpcy5vcHRpb25zLmhvdmVyRGVsYXkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuJGFuY2hvci5hZGQodGhpcy4kZWxlbWVudCkub24oJ2tleWRvd24uemYuZHJvcGRvd24nLCBmdW5jdGlvbihlKSB7XG5cbiAgICAgIHZhciAkdGFyZ2V0ID0gJCh0aGlzKSxcbiAgICAgICAgdmlzaWJsZUZvY3VzYWJsZUVsZW1lbnRzID0gRm91bmRhdGlvbi5LZXlib2FyZC5maW5kRm9jdXNhYmxlKF90aGlzLiRlbGVtZW50KTtcblxuICAgICAgRm91bmRhdGlvbi5LZXlib2FyZC5oYW5kbGVLZXkoZSwgJ0Ryb3Bkb3duJywge1xuICAgICAgICB0YWJfZm9yd2FyZDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKF90aGlzLiRlbGVtZW50LmZpbmQoJzpmb2N1cycpLmlzKHZpc2libGVGb2N1c2FibGVFbGVtZW50cy5lcSgtMSkpKSB7IC8vIGxlZnQgbW9kYWwgZG93bndhcmRzLCBzZXR0aW5nIGZvY3VzIHRvIGZpcnN0IGVsZW1lbnRcbiAgICAgICAgICAgIGlmIChfdGhpcy5vcHRpb25zLnRyYXBGb2N1cykgeyAvLyBpZiBmb2N1cyBzaGFsbCBiZSB0cmFwcGVkXG4gICAgICAgICAgICAgIHZpc2libGVGb2N1c2FibGVFbGVtZW50cy5lcSgwKS5mb2N1cygpO1xuICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB9IGVsc2UgeyAvLyBpZiBmb2N1cyBpcyBub3QgdHJhcHBlZCwgY2xvc2UgZHJvcGRvd24gb24gZm9jdXMgb3V0XG4gICAgICAgICAgICAgIF90aGlzLmNsb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB0YWJfYmFja3dhcmQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmIChfdGhpcy4kZWxlbWVudC5maW5kKCc6Zm9jdXMnKS5pcyh2aXNpYmxlRm9jdXNhYmxlRWxlbWVudHMuZXEoMCkpIHx8IF90aGlzLiRlbGVtZW50LmlzKCc6Zm9jdXMnKSkgeyAvLyBsZWZ0IG1vZGFsIHVwd2FyZHMsIHNldHRpbmcgZm9jdXMgdG8gbGFzdCBlbGVtZW50XG4gICAgICAgICAgICBpZiAoX3RoaXMub3B0aW9ucy50cmFwRm9jdXMpIHsgLy8gaWYgZm9jdXMgc2hhbGwgYmUgdHJhcHBlZFxuICAgICAgICAgICAgICB2aXNpYmxlRm9jdXNhYmxlRWxlbWVudHMuZXEoLTEpLmZvY3VzKCk7XG4gICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7IC8vIGlmIGZvY3VzIGlzIG5vdCB0cmFwcGVkLCBjbG9zZSBkcm9wZG93biBvbiBmb2N1cyBvdXRcbiAgICAgICAgICAgICAgX3RoaXMuY2xvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIG9wZW46IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmICgkdGFyZ2V0LmlzKF90aGlzLiRhbmNob3IpKSB7XG4gICAgICAgICAgICBfdGhpcy5vcGVuKCk7XG4gICAgICAgICAgICBfdGhpcy4kZWxlbWVudC5hdHRyKCd0YWJpbmRleCcsIC0xKS5mb2N1cygpO1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgY2xvc2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIF90aGlzLmNsb3NlKCk7XG4gICAgICAgICAgX3RoaXMuJGFuY2hvci5mb2N1cygpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGFuIGV2ZW50IGhhbmRsZXIgdG8gdGhlIGJvZHkgdG8gY2xvc2UgYW55IGRyb3Bkb3ducyBvbiBhIGNsaWNrLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9hZGRCb2R5SGFuZGxlcigpIHtcbiAgICAgdmFyICRib2R5ID0gJChkb2N1bWVudC5ib2R5KS5ub3QodGhpcy4kZWxlbWVudCksXG4gICAgICAgICBfdGhpcyA9IHRoaXM7XG4gICAgICRib2R5Lm9mZignY2xpY2suemYuZHJvcGRvd24nKVxuICAgICAgICAgIC5vbignY2xpY2suemYuZHJvcGRvd24nLCBmdW5jdGlvbihlKXtcbiAgICAgICAgICAgIGlmKF90aGlzLiRhbmNob3IuaXMoZS50YXJnZXQpIHx8IF90aGlzLiRhbmNob3IuZmluZChlLnRhcmdldCkubGVuZ3RoKSB7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKF90aGlzLiRlbGVtZW50LmZpbmQoZS50YXJnZXQpLmxlbmd0aCkge1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBfdGhpcy5jbG9zZSgpO1xuICAgICAgICAgICAgJGJvZHkub2ZmKCdjbGljay56Zi5kcm9wZG93bicpO1xuICAgICAgICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIE9wZW5zIHRoZSBkcm9wZG93biBwYW5lLCBhbmQgZmlyZXMgYSBidWJibGluZyBldmVudCB0byBjbG9zZSBvdGhlciBkcm9wZG93bnMuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAZmlyZXMgRHJvcGRvd24jY2xvc2VtZVxuICAgKiBAZmlyZXMgRHJvcGRvd24jc2hvd1xuICAgKi9cbiAgb3BlbigpIHtcbiAgICAvLyB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIC8qKlxuICAgICAqIEZpcmVzIHRvIGNsb3NlIG90aGVyIG9wZW4gZHJvcGRvd25zXG4gICAgICogQGV2ZW50IERyb3Bkb3duI2Nsb3NlbWVcbiAgICAgKi9cbiAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ2Nsb3NlbWUuemYuZHJvcGRvd24nLCB0aGlzLiRlbGVtZW50LmF0dHIoJ2lkJykpO1xuICAgIHRoaXMuJGFuY2hvci5hZGRDbGFzcygnaG92ZXInKVxuICAgICAgICAuYXR0cih7J2FyaWEtZXhwYW5kZWQnOiB0cnVlfSk7XG4gICAgLy8gdGhpcy4kZWxlbWVudC8qLnNob3coKSovO1xuICAgIHRoaXMuX3NldFBvc2l0aW9uKCk7XG4gICAgdGhpcy4kZWxlbWVudC5hZGRDbGFzcygnaXMtb3BlbicpXG4gICAgICAgIC5hdHRyKHsnYXJpYS1oaWRkZW4nOiBmYWxzZX0pO1xuXG4gICAgaWYodGhpcy5vcHRpb25zLmF1dG9Gb2N1cyl7XG4gICAgICB2YXIgJGZvY3VzYWJsZSA9IEZvdW5kYXRpb24uS2V5Ym9hcmQuZmluZEZvY3VzYWJsZSh0aGlzLiRlbGVtZW50KTtcbiAgICAgIGlmKCRmb2N1c2FibGUubGVuZ3RoKXtcbiAgICAgICAgJGZvY3VzYWJsZS5lcSgwKS5mb2N1cygpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmKHRoaXMub3B0aW9ucy5jbG9zZU9uQ2xpY2speyB0aGlzLl9hZGRCb2R5SGFuZGxlcigpOyB9XG5cbiAgICAvKipcbiAgICAgKiBGaXJlcyBvbmNlIHRoZSBkcm9wZG93biBpcyB2aXNpYmxlLlxuICAgICAqIEBldmVudCBEcm9wZG93biNzaG93XG4gICAgICovXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdzaG93LnpmLmRyb3Bkb3duJywgW3RoaXMuJGVsZW1lbnRdKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbG9zZXMgdGhlIG9wZW4gZHJvcGRvd24gcGFuZS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBmaXJlcyBEcm9wZG93biNoaWRlXG4gICAqL1xuICBjbG9zZSgpIHtcbiAgICBpZighdGhpcy4kZWxlbWVudC5oYXNDbGFzcygnaXMtb3BlbicpKXtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcygnaXMtb3BlbicpXG4gICAgICAgIC5hdHRyKHsnYXJpYS1oaWRkZW4nOiB0cnVlfSk7XG5cbiAgICB0aGlzLiRhbmNob3IucmVtb3ZlQ2xhc3MoJ2hvdmVyJylcbiAgICAgICAgLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCBmYWxzZSk7XG5cbiAgICBpZih0aGlzLmNsYXNzQ2hhbmdlZCl7XG4gICAgICB2YXIgY3VyUG9zaXRpb25DbGFzcyA9IHRoaXMuZ2V0UG9zaXRpb25DbGFzcygpO1xuICAgICAgaWYoY3VyUG9zaXRpb25DbGFzcyl7XG4gICAgICAgIHRoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3MoY3VyUG9zaXRpb25DbGFzcyk7XG4gICAgICB9XG4gICAgICB0aGlzLiRlbGVtZW50LmFkZENsYXNzKHRoaXMub3B0aW9ucy5wb3NpdGlvbkNsYXNzKVxuICAgICAgICAgIC8qLmhpZGUoKSovLmNzcyh7aGVpZ2h0OiAnJywgd2lkdGg6ICcnfSk7XG4gICAgICB0aGlzLmNsYXNzQ2hhbmdlZCA9IGZhbHNlO1xuICAgICAgdGhpcy5jb3VudGVyID0gNDtcbiAgICAgIHRoaXMudXNlZFBvc2l0aW9ucy5sZW5ndGggPSAwO1xuICAgIH1cbiAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ2hpZGUuemYuZHJvcGRvd24nLCBbdGhpcy4kZWxlbWVudF0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFRvZ2dsZXMgdGhlIGRyb3Bkb3duIHBhbmUncyB2aXNpYmlsaXR5LlxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIHRvZ2dsZSgpIHtcbiAgICBpZih0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdpcy1vcGVuJykpe1xuICAgICAgaWYodGhpcy4kYW5jaG9yLmRhdGEoJ2hvdmVyJykpIHJldHVybjtcbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICB9ZWxzZXtcbiAgICAgIHRoaXMub3BlbigpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBEZXN0cm95cyB0aGUgZHJvcGRvd24uXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLiRlbGVtZW50Lm9mZignLnpmLnRyaWdnZXInKS5oaWRlKCk7XG4gICAgdGhpcy4kYW5jaG9yLm9mZignLnpmLmRyb3Bkb3duJyk7XG5cbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XG4gIH1cbn1cblxuRHJvcGRvd24uZGVmYXVsdHMgPSB7XG4gIC8qKlxuICAgKiBBbW91bnQgb2YgdGltZSB0byBkZWxheSBvcGVuaW5nIGEgc3VibWVudSBvbiBob3ZlciBldmVudC5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAyNTBcbiAgICovXG4gIGhvdmVyRGVsYXk6IDI1MCxcbiAgLyoqXG4gICAqIEFsbG93IHN1Ym1lbnVzIHRvIG9wZW4gb24gaG92ZXIgZXZlbnRzXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgZmFsc2VcbiAgICovXG4gIGhvdmVyOiBmYWxzZSxcbiAgLyoqXG4gICAqIERvbid0IGNsb3NlIGRyb3Bkb3duIHdoZW4gaG92ZXJpbmcgb3ZlciBkcm9wZG93biBwYW5lXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgdHJ1ZVxuICAgKi9cbiAgaG92ZXJQYW5lOiBmYWxzZSxcbiAgLyoqXG4gICAqIE51bWJlciBvZiBwaXhlbHMgYmV0d2VlbiB0aGUgZHJvcGRvd24gcGFuZSBhbmQgdGhlIHRyaWdnZXJpbmcgZWxlbWVudCBvbiBvcGVuLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIDFcbiAgICovXG4gIHZPZmZzZXQ6IDEsXG4gIC8qKlxuICAgKiBOdW1iZXIgb2YgcGl4ZWxzIGJldHdlZW4gdGhlIGRyb3Bkb3duIHBhbmUgYW5kIHRoZSB0cmlnZ2VyaW5nIGVsZW1lbnQgb24gb3Blbi5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAxXG4gICAqL1xuICBoT2Zmc2V0OiAxLFxuICAvKipcbiAgICogQ2xhc3MgYXBwbGllZCB0byBhZGp1c3Qgb3BlbiBwb3NpdGlvbi4gSlMgd2lsbCB0ZXN0IGFuZCBmaWxsIHRoaXMgaW4uXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgJ3RvcCdcbiAgICovXG4gIHBvc2l0aW9uQ2xhc3M6ICcnLFxuICAvKipcbiAgICogQWxsb3cgdGhlIHBsdWdpbiB0byB0cmFwIGZvY3VzIHRvIHRoZSBkcm9wZG93biBwYW5lIGlmIG9wZW5lZCB3aXRoIGtleWJvYXJkIGNvbW1hbmRzLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIGZhbHNlXG4gICAqL1xuICB0cmFwRm9jdXM6IGZhbHNlLFxuICAvKipcbiAgICogQWxsb3cgdGhlIHBsdWdpbiB0byBzZXQgZm9jdXMgdG8gdGhlIGZpcnN0IGZvY3VzYWJsZSBlbGVtZW50IHdpdGhpbiB0aGUgcGFuZSwgcmVnYXJkbGVzcyBvZiBtZXRob2Qgb2Ygb3BlbmluZy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSB0cnVlXG4gICAqL1xuICBhdXRvRm9jdXM6IGZhbHNlLFxuICAvKipcbiAgICogQWxsb3dzIGEgY2xpY2sgb24gdGhlIGJvZHkgdG8gY2xvc2UgdGhlIGRyb3Bkb3duLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIGZhbHNlXG4gICAqL1xuICBjbG9zZU9uQ2xpY2s6IGZhbHNlXG59XG5cbi8vIFdpbmRvdyBleHBvcnRzXG5Gb3VuZGF0aW9uLnBsdWdpbihEcm9wZG93biwgJ0Ryb3Bkb3duJyk7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLyoqXG4gKiBEcm9wZG93bk1lbnUgbW9kdWxlLlxuICogQG1vZHVsZSBmb3VuZGF0aW9uLmRyb3Bkb3duLW1lbnVcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwua2V5Ym9hcmRcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwuYm94XG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm5lc3RcbiAqL1xuXG5jbGFzcyBEcm9wZG93bk1lbnUge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBEcm9wZG93bk1lbnUuXG4gICAqIEBjbGFzc1xuICAgKiBAZmlyZXMgRHJvcGRvd25NZW51I2luaXRcbiAgICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIG1ha2UgaW50byBhIGRyb3Bkb3duIG1lbnUuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRlbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgRHJvcGRvd25NZW51LmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XG5cbiAgICBGb3VuZGF0aW9uLk5lc3QuRmVhdGhlcih0aGlzLiRlbGVtZW50LCAnZHJvcGRvd24nKTtcbiAgICB0aGlzLl9pbml0KCk7XG5cbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdEcm9wZG93bk1lbnUnKTtcbiAgICBGb3VuZGF0aW9uLktleWJvYXJkLnJlZ2lzdGVyKCdEcm9wZG93bk1lbnUnLCB7XG4gICAgICAnRU5URVInOiAnb3BlbicsXG4gICAgICAnU1BBQ0UnOiAnb3BlbicsXG4gICAgICAnQVJST1dfUklHSFQnOiAnbmV4dCcsXG4gICAgICAnQVJST1dfVVAnOiAndXAnLFxuICAgICAgJ0FSUk9XX0RPV04nOiAnZG93bicsXG4gICAgICAnQVJST1dfTEVGVCc6ICdwcmV2aW91cycsXG4gICAgICAnRVNDQVBFJzogJ2Nsb3NlJ1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHRoZSBwbHVnaW4sIGFuZCBjYWxscyBfcHJlcGFyZU1lbnVcbiAgICogQHByaXZhdGVcbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICBfaW5pdCgpIHtcbiAgICB2YXIgc3VicyA9IHRoaXMuJGVsZW1lbnQuZmluZCgnbGkuaXMtZHJvcGRvd24tc3VibWVudS1wYXJlbnQnKTtcbiAgICB0aGlzLiRlbGVtZW50LmNoaWxkcmVuKCcuaXMtZHJvcGRvd24tc3VibWVudS1wYXJlbnQnKS5jaGlsZHJlbignLmlzLWRyb3Bkb3duLXN1Ym1lbnUnKS5hZGRDbGFzcygnZmlyc3Qtc3ViJyk7XG5cbiAgICB0aGlzLiRtZW51SXRlbXMgPSB0aGlzLiRlbGVtZW50LmZpbmQoJ1tyb2xlPVwibWVudWl0ZW1cIl0nKTtcbiAgICB0aGlzLiR0YWJzID0gdGhpcy4kZWxlbWVudC5jaGlsZHJlbignW3JvbGU9XCJtZW51aXRlbVwiXScpO1xuICAgIHRoaXMuJHRhYnMuZmluZCgndWwuaXMtZHJvcGRvd24tc3VibWVudScpLmFkZENsYXNzKHRoaXMub3B0aW9ucy52ZXJ0aWNhbENsYXNzKTtcblxuICAgIGlmICh0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKHRoaXMub3B0aW9ucy5yaWdodENsYXNzKSB8fCB0aGlzLm9wdGlvbnMuYWxpZ25tZW50ID09PSAncmlnaHQnIHx8IEZvdW5kYXRpb24ucnRsKCkgfHwgdGhpcy4kZWxlbWVudC5wYXJlbnRzKCcudG9wLWJhci1yaWdodCcpLmlzKCcqJykpIHtcbiAgICAgIHRoaXMub3B0aW9ucy5hbGlnbm1lbnQgPSAncmlnaHQnO1xuICAgICAgc3Vicy5hZGRDbGFzcygnb3BlbnMtbGVmdCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdWJzLmFkZENsYXNzKCdvcGVucy1yaWdodCcpO1xuICAgIH1cbiAgICB0aGlzLmNoYW5nZWQgPSBmYWxzZTtcbiAgICB0aGlzLl9ldmVudHMoKTtcbiAgfTtcblxuICBfaXNWZXJ0aWNhbCgpIHtcbiAgICByZXR1cm4gdGhpcy4kdGFicy5jc3MoJ2Rpc3BsYXknKSA9PT0gJ2Jsb2NrJztcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGV2ZW50IGxpc3RlbmVycyB0byBlbGVtZW50cyB3aXRoaW4gdGhlIG1lbnVcbiAgICogQHByaXZhdGVcbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICBfZXZlbnRzKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXMsXG4gICAgICAgIGhhc1RvdWNoID0gJ29udG91Y2hzdGFydCcgaW4gd2luZG93IHx8ICh0eXBlb2Ygd2luZG93Lm9udG91Y2hzdGFydCAhPT0gJ3VuZGVmaW5lZCcpLFxuICAgICAgICBwYXJDbGFzcyA9ICdpcy1kcm9wZG93bi1zdWJtZW51LXBhcmVudCc7XG5cbiAgICAvLyB1c2VkIGZvciBvbkNsaWNrIGFuZCBpbiB0aGUga2V5Ym9hcmQgaGFuZGxlcnNcbiAgICB2YXIgaGFuZGxlQ2xpY2tGbiA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgIHZhciAkZWxlbSA9ICQoZS50YXJnZXQpLnBhcmVudHNVbnRpbCgndWwnLCBgLiR7cGFyQ2xhc3N9YCksXG4gICAgICAgICAgaGFzU3ViID0gJGVsZW0uaGFzQ2xhc3MocGFyQ2xhc3MpLFxuICAgICAgICAgIGhhc0NsaWNrZWQgPSAkZWxlbS5hdHRyKCdkYXRhLWlzLWNsaWNrJykgPT09ICd0cnVlJyxcbiAgICAgICAgICAkc3ViID0gJGVsZW0uY2hpbGRyZW4oJy5pcy1kcm9wZG93bi1zdWJtZW51Jyk7XG5cbiAgICAgIGlmIChoYXNTdWIpIHtcbiAgICAgICAgaWYgKGhhc0NsaWNrZWQpIHtcbiAgICAgICAgICBpZiAoIV90aGlzLm9wdGlvbnMuY2xvc2VPbkNsaWNrIHx8ICghX3RoaXMub3B0aW9ucy5jbGlja09wZW4gJiYgIWhhc1RvdWNoKSB8fCAoX3RoaXMub3B0aW9ucy5mb3JjZUZvbGxvdyAmJiBoYXNUb3VjaCkpIHsgcmV0dXJuOyB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgX3RoaXMuX2hpZGUoJGVsZW0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICBfdGhpcy5fc2hvdygkc3ViKTtcbiAgICAgICAgICAkZWxlbS5hZGQoJGVsZW0ucGFyZW50c1VudGlsKF90aGlzLiRlbGVtZW50LCBgLiR7cGFyQ2xhc3N9YCkpLmF0dHIoJ2RhdGEtaXMtY2xpY2snLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYoX3RoaXMub3B0aW9ucy5jbG9zZU9uQ2xpY2tJbnNpZGUpe1xuICAgICAgICAgIF90aGlzLl9oaWRlKCRlbGVtKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMuY2xpY2tPcGVuIHx8IGhhc1RvdWNoKSB7XG4gICAgICB0aGlzLiRtZW51SXRlbXMub24oJ2NsaWNrLnpmLmRyb3Bkb3dubWVudSB0b3VjaHN0YXJ0LnpmLmRyb3Bkb3dubWVudScsIGhhbmRsZUNsaWNrRm4pO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5vcHRpb25zLmRpc2FibGVIb3Zlcikge1xuICAgICAgdGhpcy4kbWVudUl0ZW1zLm9uKCdtb3VzZWVudGVyLnpmLmRyb3Bkb3dubWVudScsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdmFyICRlbGVtID0gJCh0aGlzKSxcbiAgICAgICAgICAgIGhhc1N1YiA9ICRlbGVtLmhhc0NsYXNzKHBhckNsYXNzKTtcblxuICAgICAgICBpZiAoaGFzU3ViKSB7XG4gICAgICAgICAgY2xlYXJUaW1lb3V0KF90aGlzLmRlbGF5KTtcbiAgICAgICAgICBfdGhpcy5kZWxheSA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBfdGhpcy5fc2hvdygkZWxlbS5jaGlsZHJlbignLmlzLWRyb3Bkb3duLXN1Ym1lbnUnKSk7XG4gICAgICAgICAgfSwgX3RoaXMub3B0aW9ucy5ob3ZlckRlbGF5KTtcbiAgICAgICAgfVxuICAgICAgfSkub24oJ21vdXNlbGVhdmUuemYuZHJvcGRvd25tZW51JywgZnVuY3Rpb24oZSkge1xuICAgICAgICB2YXIgJGVsZW0gPSAkKHRoaXMpLFxuICAgICAgICAgICAgaGFzU3ViID0gJGVsZW0uaGFzQ2xhc3MocGFyQ2xhc3MpO1xuICAgICAgICBpZiAoaGFzU3ViICYmIF90aGlzLm9wdGlvbnMuYXV0b2Nsb3NlKSB7XG4gICAgICAgICAgaWYgKCRlbGVtLmF0dHIoJ2RhdGEtaXMtY2xpY2snKSA9PT0gJ3RydWUnICYmIF90aGlzLm9wdGlvbnMuY2xpY2tPcGVuKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gICAgICAgICAgY2xlYXJUaW1lb3V0KF90aGlzLmRlbGF5KTtcbiAgICAgICAgICBfdGhpcy5kZWxheSA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBfdGhpcy5faGlkZSgkZWxlbSk7XG4gICAgICAgICAgfSwgX3RoaXMub3B0aW9ucy5jbG9zaW5nVGltZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICB0aGlzLiRtZW51SXRlbXMub24oJ2tleWRvd24uemYuZHJvcGRvd25tZW51JywgZnVuY3Rpb24oZSkge1xuICAgICAgdmFyICRlbGVtZW50ID0gJChlLnRhcmdldCkucGFyZW50c1VudGlsKCd1bCcsICdbcm9sZT1cIm1lbnVpdGVtXCJdJyksXG4gICAgICAgICAgaXNUYWIgPSBfdGhpcy4kdGFicy5pbmRleCgkZWxlbWVudCkgPiAtMSxcbiAgICAgICAgICAkZWxlbWVudHMgPSBpc1RhYiA/IF90aGlzLiR0YWJzIDogJGVsZW1lbnQuc2libGluZ3MoJ2xpJykuYWRkKCRlbGVtZW50KSxcbiAgICAgICAgICAkcHJldkVsZW1lbnQsXG4gICAgICAgICAgJG5leHRFbGVtZW50O1xuXG4gICAgICAkZWxlbWVudHMuZWFjaChmdW5jdGlvbihpKSB7XG4gICAgICAgIGlmICgkKHRoaXMpLmlzKCRlbGVtZW50KSkge1xuICAgICAgICAgICRwcmV2RWxlbWVudCA9ICRlbGVtZW50cy5lcShpLTEpO1xuICAgICAgICAgICRuZXh0RWxlbWVudCA9ICRlbGVtZW50cy5lcShpKzEpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIHZhciBuZXh0U2libGluZyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoISRlbGVtZW50LmlzKCc6bGFzdC1jaGlsZCcpKSB7XG4gICAgICAgICAgJG5leHRFbGVtZW50LmNoaWxkcmVuKCdhOmZpcnN0JykuZm9jdXMoKTtcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH1cbiAgICAgIH0sIHByZXZTaWJsaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRwcmV2RWxlbWVudC5jaGlsZHJlbignYTpmaXJzdCcpLmZvY3VzKCk7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIH0sIG9wZW5TdWIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRzdWIgPSAkZWxlbWVudC5jaGlsZHJlbigndWwuaXMtZHJvcGRvd24tc3VibWVudScpO1xuICAgICAgICBpZiAoJHN1Yi5sZW5ndGgpIHtcbiAgICAgICAgICBfdGhpcy5fc2hvdygkc3ViKTtcbiAgICAgICAgICAkZWxlbWVudC5maW5kKCdsaSA+IGE6Zmlyc3QnKS5mb2N1cygpO1xuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfSBlbHNlIHsgcmV0dXJuOyB9XG4gICAgICB9LCBjbG9zZVN1YiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAvL2lmICgkZWxlbWVudC5pcygnOmZpcnN0LWNoaWxkJykpIHtcbiAgICAgICAgdmFyIGNsb3NlID0gJGVsZW1lbnQucGFyZW50KCd1bCcpLnBhcmVudCgnbGknKTtcbiAgICAgICAgY2xvc2UuY2hpbGRyZW4oJ2E6Zmlyc3QnKS5mb2N1cygpO1xuICAgICAgICBfdGhpcy5faGlkZShjbG9zZSk7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgLy99XG4gICAgICB9O1xuICAgICAgdmFyIGZ1bmN0aW9ucyA9IHtcbiAgICAgICAgb3Blbjogb3BlblN1YixcbiAgICAgICAgY2xvc2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIF90aGlzLl9oaWRlKF90aGlzLiRlbGVtZW50KTtcbiAgICAgICAgICBfdGhpcy4kbWVudUl0ZW1zLmZpbmQoJ2E6Zmlyc3QnKS5mb2N1cygpOyAvLyBmb2N1cyB0byBmaXJzdCBlbGVtZW50XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9LFxuICAgICAgICBoYW5kbGVkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBpZiAoaXNUYWIpIHtcbiAgICAgICAgaWYgKF90aGlzLl9pc1ZlcnRpY2FsKCkpIHsgLy8gdmVydGljYWwgbWVudVxuICAgICAgICAgIGlmIChGb3VuZGF0aW9uLnJ0bCgpKSB7IC8vIHJpZ2h0IGFsaWduZWRcbiAgICAgICAgICAgICQuZXh0ZW5kKGZ1bmN0aW9ucywge1xuICAgICAgICAgICAgICBkb3duOiBuZXh0U2libGluZyxcbiAgICAgICAgICAgICAgdXA6IHByZXZTaWJsaW5nLFxuICAgICAgICAgICAgICBuZXh0OiBjbG9zZVN1YixcbiAgICAgICAgICAgICAgcHJldmlvdXM6IG9wZW5TdWJcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gZWxzZSB7IC8vIGxlZnQgYWxpZ25lZFxuICAgICAgICAgICAgJC5leHRlbmQoZnVuY3Rpb25zLCB7XG4gICAgICAgICAgICAgIGRvd246IG5leHRTaWJsaW5nLFxuICAgICAgICAgICAgICB1cDogcHJldlNpYmxpbmcsXG4gICAgICAgICAgICAgIG5leHQ6IG9wZW5TdWIsXG4gICAgICAgICAgICAgIHByZXZpb3VzOiBjbG9zZVN1YlxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgeyAvLyBob3Jpem9udGFsIG1lbnVcbiAgICAgICAgICBpZiAoRm91bmRhdGlvbi5ydGwoKSkgeyAvLyByaWdodCBhbGlnbmVkXG4gICAgICAgICAgICAkLmV4dGVuZChmdW5jdGlvbnMsIHtcbiAgICAgICAgICAgICAgbmV4dDogcHJldlNpYmxpbmcsXG4gICAgICAgICAgICAgIHByZXZpb3VzOiBuZXh0U2libGluZyxcbiAgICAgICAgICAgICAgZG93bjogb3BlblN1YixcbiAgICAgICAgICAgICAgdXA6IGNsb3NlU3ViXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2UgeyAvLyBsZWZ0IGFsaWduZWRcbiAgICAgICAgICAgICQuZXh0ZW5kKGZ1bmN0aW9ucywge1xuICAgICAgICAgICAgICBuZXh0OiBuZXh0U2libGluZyxcbiAgICAgICAgICAgICAgcHJldmlvdXM6IHByZXZTaWJsaW5nLFxuICAgICAgICAgICAgICBkb3duOiBvcGVuU3ViLFxuICAgICAgICAgICAgICB1cDogY2xvc2VTdWJcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHsgLy8gbm90IHRhYnMgLT4gb25lIHN1YlxuICAgICAgICBpZiAoRm91bmRhdGlvbi5ydGwoKSkgeyAvLyByaWdodCBhbGlnbmVkXG4gICAgICAgICAgJC5leHRlbmQoZnVuY3Rpb25zLCB7XG4gICAgICAgICAgICBuZXh0OiBjbG9zZVN1YixcbiAgICAgICAgICAgIHByZXZpb3VzOiBvcGVuU3ViLFxuICAgICAgICAgICAgZG93bjogbmV4dFNpYmxpbmcsXG4gICAgICAgICAgICB1cDogcHJldlNpYmxpbmdcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHsgLy8gbGVmdCBhbGlnbmVkXG4gICAgICAgICAgJC5leHRlbmQoZnVuY3Rpb25zLCB7XG4gICAgICAgICAgICBuZXh0OiBvcGVuU3ViLFxuICAgICAgICAgICAgcHJldmlvdXM6IGNsb3NlU3ViLFxuICAgICAgICAgICAgZG93bjogbmV4dFNpYmxpbmcsXG4gICAgICAgICAgICB1cDogcHJldlNpYmxpbmdcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgRm91bmRhdGlvbi5LZXlib2FyZC5oYW5kbGVLZXkoZSwgJ0Ryb3Bkb3duTWVudScsIGZ1bmN0aW9ucyk7XG5cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGFuIGV2ZW50IGhhbmRsZXIgdG8gdGhlIGJvZHkgdG8gY2xvc2UgYW55IGRyb3Bkb3ducyBvbiBhIGNsaWNrLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9hZGRCb2R5SGFuZGxlcigpIHtcbiAgICB2YXIgJGJvZHkgPSAkKGRvY3VtZW50LmJvZHkpLFxuICAgICAgICBfdGhpcyA9IHRoaXM7XG4gICAgJGJvZHkub2ZmKCdtb3VzZXVwLnpmLmRyb3Bkb3dubWVudSB0b3VjaGVuZC56Zi5kcm9wZG93bm1lbnUnKVxuICAgICAgICAgLm9uKCdtb3VzZXVwLnpmLmRyb3Bkb3dubWVudSB0b3VjaGVuZC56Zi5kcm9wZG93bm1lbnUnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgIHZhciAkbGluayA9IF90aGlzLiRlbGVtZW50LmZpbmQoZS50YXJnZXQpO1xuICAgICAgICAgICBpZiAoJGxpbmsubGVuZ3RoKSB7IHJldHVybjsgfVxuXG4gICAgICAgICAgIF90aGlzLl9oaWRlKCk7XG4gICAgICAgICAgICRib2R5Lm9mZignbW91c2V1cC56Zi5kcm9wZG93bm1lbnUgdG91Y2hlbmQuemYuZHJvcGRvd25tZW51Jyk7XG4gICAgICAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPcGVucyBhIGRyb3Bkb3duIHBhbmUsIGFuZCBjaGVja3MgZm9yIGNvbGxpc2lvbnMgZmlyc3QuXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSAkc3ViIC0gdWwgZWxlbWVudCB0aGF0IGlzIGEgc3VibWVudSB0byBzaG93XG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKiBAZmlyZXMgRHJvcGRvd25NZW51I3Nob3dcbiAgICovXG4gIF9zaG93KCRzdWIpIHtcbiAgICB2YXIgaWR4ID0gdGhpcy4kdGFicy5pbmRleCh0aGlzLiR0YWJzLmZpbHRlcihmdW5jdGlvbihpLCBlbCkge1xuICAgICAgcmV0dXJuICQoZWwpLmZpbmQoJHN1YikubGVuZ3RoID4gMDtcbiAgICB9KSk7XG4gICAgdmFyICRzaWJzID0gJHN1Yi5wYXJlbnQoJ2xpLmlzLWRyb3Bkb3duLXN1Ym1lbnUtcGFyZW50Jykuc2libGluZ3MoJ2xpLmlzLWRyb3Bkb3duLXN1Ym1lbnUtcGFyZW50Jyk7XG4gICAgdGhpcy5faGlkZSgkc2licywgaWR4KTtcbiAgICAkc3ViLmNzcygndmlzaWJpbGl0eScsICdoaWRkZW4nKS5hZGRDbGFzcygnanMtZHJvcGRvd24tYWN0aXZlJykuYXR0cih7J2FyaWEtaGlkZGVuJzogZmFsc2V9KVxuICAgICAgICAucGFyZW50KCdsaS5pcy1kcm9wZG93bi1zdWJtZW51LXBhcmVudCcpLmFkZENsYXNzKCdpcy1hY3RpdmUnKVxuICAgICAgICAuYXR0cih7J2FyaWEtZXhwYW5kZWQnOiB0cnVlfSk7XG4gICAgdmFyIGNsZWFyID0gRm91bmRhdGlvbi5Cb3guSW1Ob3RUb3VjaGluZ1lvdSgkc3ViLCBudWxsLCB0cnVlKTtcbiAgICBpZiAoIWNsZWFyKSB7XG4gICAgICB2YXIgb2xkQ2xhc3MgPSB0aGlzLm9wdGlvbnMuYWxpZ25tZW50ID09PSAnbGVmdCcgPyAnLXJpZ2h0JyA6ICctbGVmdCcsXG4gICAgICAgICAgJHBhcmVudExpID0gJHN1Yi5wYXJlbnQoJy5pcy1kcm9wZG93bi1zdWJtZW51LXBhcmVudCcpO1xuICAgICAgJHBhcmVudExpLnJlbW92ZUNsYXNzKGBvcGVucyR7b2xkQ2xhc3N9YCkuYWRkQ2xhc3MoYG9wZW5zLSR7dGhpcy5vcHRpb25zLmFsaWdubWVudH1gKTtcbiAgICAgIGNsZWFyID0gRm91bmRhdGlvbi5Cb3guSW1Ob3RUb3VjaGluZ1lvdSgkc3ViLCBudWxsLCB0cnVlKTtcbiAgICAgIGlmICghY2xlYXIpIHtcbiAgICAgICAgJHBhcmVudExpLnJlbW92ZUNsYXNzKGBvcGVucy0ke3RoaXMub3B0aW9ucy5hbGlnbm1lbnR9YCkuYWRkQ2xhc3MoJ29wZW5zLWlubmVyJyk7XG4gICAgICB9XG4gICAgICB0aGlzLmNoYW5nZWQgPSB0cnVlO1xuICAgIH1cbiAgICAkc3ViLmNzcygndmlzaWJpbGl0eScsICcnKTtcbiAgICBpZiAodGhpcy5vcHRpb25zLmNsb3NlT25DbGljaykgeyB0aGlzLl9hZGRCb2R5SGFuZGxlcigpOyB9XG4gICAgLyoqXG4gICAgICogRmlyZXMgd2hlbiB0aGUgbmV3IGRyb3Bkb3duIHBhbmUgaXMgdmlzaWJsZS5cbiAgICAgKiBAZXZlbnQgRHJvcGRvd25NZW51I3Nob3dcbiAgICAgKi9cbiAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ3Nob3cuemYuZHJvcGRvd25tZW51JywgWyRzdWJdKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIaWRlcyBhIHNpbmdsZSwgY3VycmVudGx5IG9wZW4gZHJvcGRvd24gcGFuZSwgaWYgcGFzc2VkIGEgcGFyYW1ldGVyLCBvdGhlcndpc2UsIGhpZGVzIGV2ZXJ5dGhpbmcuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJGVsZW0gLSBlbGVtZW50IHdpdGggYSBzdWJtZW51IHRvIGhpZGVcbiAgICogQHBhcmFtIHtOdW1iZXJ9IGlkeCAtIGluZGV4IG9mIHRoZSAkdGFicyBjb2xsZWN0aW9uIHRvIGhpZGVcbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9oaWRlKCRlbGVtLCBpZHgpIHtcbiAgICB2YXIgJHRvQ2xvc2U7XG4gICAgaWYgKCRlbGVtICYmICRlbGVtLmxlbmd0aCkge1xuICAgICAgJHRvQ2xvc2UgPSAkZWxlbTtcbiAgICB9IGVsc2UgaWYgKGlkeCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAkdG9DbG9zZSA9IHRoaXMuJHRhYnMubm90KGZ1bmN0aW9uKGksIGVsKSB7XG4gICAgICAgIHJldHVybiBpID09PSBpZHg7XG4gICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAkdG9DbG9zZSA9IHRoaXMuJGVsZW1lbnQ7XG4gICAgfVxuICAgIHZhciBzb21ldGhpbmdUb0Nsb3NlID0gJHRvQ2xvc2UuaGFzQ2xhc3MoJ2lzLWFjdGl2ZScpIHx8ICR0b0Nsb3NlLmZpbmQoJy5pcy1hY3RpdmUnKS5sZW5ndGggPiAwO1xuXG4gICAgaWYgKHNvbWV0aGluZ1RvQ2xvc2UpIHtcbiAgICAgICR0b0Nsb3NlLmZpbmQoJ2xpLmlzLWFjdGl2ZScpLmFkZCgkdG9DbG9zZSkuYXR0cih7XG4gICAgICAgICdhcmlhLWV4cGFuZGVkJzogZmFsc2UsXG4gICAgICAgICdkYXRhLWlzLWNsaWNrJzogZmFsc2VcbiAgICAgIH0pLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcblxuICAgICAgJHRvQ2xvc2UuZmluZCgndWwuanMtZHJvcGRvd24tYWN0aXZlJykuYXR0cih7XG4gICAgICAgICdhcmlhLWhpZGRlbic6IHRydWVcbiAgICAgIH0pLnJlbW92ZUNsYXNzKCdqcy1kcm9wZG93bi1hY3RpdmUnKTtcblxuICAgICAgaWYgKHRoaXMuY2hhbmdlZCB8fCAkdG9DbG9zZS5maW5kKCdvcGVucy1pbm5lcicpLmxlbmd0aCkge1xuICAgICAgICB2YXIgb2xkQ2xhc3MgPSB0aGlzLm9wdGlvbnMuYWxpZ25tZW50ID09PSAnbGVmdCcgPyAncmlnaHQnIDogJ2xlZnQnO1xuICAgICAgICAkdG9DbG9zZS5maW5kKCdsaS5pcy1kcm9wZG93bi1zdWJtZW51LXBhcmVudCcpLmFkZCgkdG9DbG9zZSlcbiAgICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoYG9wZW5zLWlubmVyIG9wZW5zLSR7dGhpcy5vcHRpb25zLmFsaWdubWVudH1gKVxuICAgICAgICAgICAgICAgIC5hZGRDbGFzcyhgb3BlbnMtJHtvbGRDbGFzc31gKTtcbiAgICAgICAgdGhpcy5jaGFuZ2VkID0gZmFsc2U7XG4gICAgICB9XG4gICAgICAvKipcbiAgICAgICAqIEZpcmVzIHdoZW4gdGhlIG9wZW4gbWVudXMgYXJlIGNsb3NlZC5cbiAgICAgICAqIEBldmVudCBEcm9wZG93bk1lbnUjaGlkZVxuICAgICAgICovXG4gICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ2hpZGUuemYuZHJvcGRvd25tZW51JywgWyR0b0Nsb3NlXSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIHRoZSBwbHVnaW4uXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLiRtZW51SXRlbXMub2ZmKCcuemYuZHJvcGRvd25tZW51JykucmVtb3ZlQXR0cignZGF0YS1pcy1jbGljaycpXG4gICAgICAgIC5yZW1vdmVDbGFzcygnaXMtcmlnaHQtYXJyb3cgaXMtbGVmdC1hcnJvdyBpcy1kb3duLWFycm93IG9wZW5zLXJpZ2h0IG9wZW5zLWxlZnQgb3BlbnMtaW5uZXInKTtcbiAgICAkKGRvY3VtZW50LmJvZHkpLm9mZignLnpmLmRyb3Bkb3dubWVudScpO1xuICAgIEZvdW5kYXRpb24uTmVzdC5CdXJuKHRoaXMuJGVsZW1lbnQsICdkcm9wZG93bicpO1xuICAgIEZvdW5kYXRpb24udW5yZWdpc3RlclBsdWdpbih0aGlzKTtcbiAgfVxufVxuXG4vKipcbiAqIERlZmF1bHQgc2V0dGluZ3MgZm9yIHBsdWdpblxuICovXG5Ecm9wZG93bk1lbnUuZGVmYXVsdHMgPSB7XG4gIC8qKlxuICAgKiBEaXNhbGxvd3MgaG92ZXIgZXZlbnRzIGZyb20gb3BlbmluZyBzdWJtZW51c1xuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIGZhbHNlXG4gICAqL1xuICBkaXNhYmxlSG92ZXI6IGZhbHNlLFxuICAvKipcbiAgICogQWxsb3cgYSBzdWJtZW51IHRvIGF1dG9tYXRpY2FsbHkgY2xvc2Ugb24gYSBtb3VzZWxlYXZlIGV2ZW50LCBpZiBub3QgY2xpY2tlZCBvcGVuLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIHRydWVcbiAgICovXG4gIGF1dG9jbG9zZTogdHJ1ZSxcbiAgLyoqXG4gICAqIEFtb3VudCBvZiB0aW1lIHRvIGRlbGF5IG9wZW5pbmcgYSBzdWJtZW51IG9uIGhvdmVyIGV2ZW50LlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIDUwXG4gICAqL1xuICBob3ZlckRlbGF5OiA1MCxcbiAgLyoqXG4gICAqIEFsbG93IGEgc3VibWVudSB0byBvcGVuL3JlbWFpbiBvcGVuIG9uIHBhcmVudCBjbGljayBldmVudC4gQWxsb3dzIGN1cnNvciB0byBtb3ZlIGF3YXkgZnJvbSBtZW51LlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIHRydWVcbiAgICovXG4gIGNsaWNrT3BlbjogZmFsc2UsXG4gIC8qKlxuICAgKiBBbW91bnQgb2YgdGltZSB0byBkZWxheSBjbG9zaW5nIGEgc3VibWVudSBvbiBhIG1vdXNlbGVhdmUgZXZlbnQuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgNTAwXG4gICAqL1xuXG4gIGNsb3NpbmdUaW1lOiA1MDAsXG4gIC8qKlxuICAgKiBQb3NpdGlvbiBvZiB0aGUgbWVudSByZWxhdGl2ZSB0byB3aGF0IGRpcmVjdGlvbiB0aGUgc3VibWVudXMgc2hvdWxkIG9wZW4uIEhhbmRsZWQgYnkgSlMuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgJ2xlZnQnXG4gICAqL1xuICBhbGlnbm1lbnQ6ICdsZWZ0JyxcbiAgLyoqXG4gICAqIEFsbG93IGNsaWNrcyBvbiB0aGUgYm9keSB0byBjbG9zZSBhbnkgb3BlbiBzdWJtZW51cy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSB0cnVlXG4gICAqL1xuICBjbG9zZU9uQ2xpY2s6IHRydWUsXG4gIC8qKlxuICAgKiBBbGxvdyBjbGlja3Mgb24gbGVhZiBhbmNob3IgbGlua3MgdG8gY2xvc2UgYW55IG9wZW4gc3VibWVudXMuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgdHJ1ZVxuICAgKi9cbiAgY2xvc2VPbkNsaWNrSW5zaWRlOiB0cnVlLFxuICAvKipcbiAgICogQ2xhc3MgYXBwbGllZCB0byB2ZXJ0aWNhbCBvcmllbnRlZCBtZW51cywgRm91bmRhdGlvbiBkZWZhdWx0IGlzIGB2ZXJ0aWNhbGAuIFVwZGF0ZSB0aGlzIGlmIHVzaW5nIHlvdXIgb3duIGNsYXNzLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlICd2ZXJ0aWNhbCdcbiAgICovXG4gIHZlcnRpY2FsQ2xhc3M6ICd2ZXJ0aWNhbCcsXG4gIC8qKlxuICAgKiBDbGFzcyBhcHBsaWVkIHRvIHJpZ2h0LXNpZGUgb3JpZW50ZWQgbWVudXMsIEZvdW5kYXRpb24gZGVmYXVsdCBpcyBgYWxpZ24tcmlnaHRgLiBVcGRhdGUgdGhpcyBpZiB1c2luZyB5b3VyIG93biBjbGFzcy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAnYWxpZ24tcmlnaHQnXG4gICAqL1xuICByaWdodENsYXNzOiAnYWxpZ24tcmlnaHQnLFxuICAvKipcbiAgICogQm9vbGVhbiB0byBmb3JjZSBvdmVyaWRlIHRoZSBjbGlja2luZyBvZiBsaW5rcyB0byBwZXJmb3JtIGRlZmF1bHQgYWN0aW9uLCBvbiBzZWNvbmQgdG91Y2ggZXZlbnQgZm9yIG1vYmlsZS5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBmYWxzZVxuICAgKi9cbiAgZm9yY2VGb2xsb3c6IHRydWVcbn07XG5cbi8vIFdpbmRvdyBleHBvcnRzXG5Gb3VuZGF0aW9uLnBsdWdpbihEcm9wZG93bk1lbnUsICdEcm9wZG93bk1lbnUnKTtcblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG4vKipcbiAqIEVxdWFsaXplciBtb2R1bGUuXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24uZXF1YWxpemVyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm1lZGlhUXVlcnlcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwudGltZXJBbmRJbWFnZUxvYWRlciBpZiBlcXVhbGl6ZXIgY29udGFpbnMgaW1hZ2VzXG4gKi9cblxuY2xhc3MgRXF1YWxpemVyIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgRXF1YWxpemVyLlxuICAgKiBAY2xhc3NcbiAgICogQGZpcmVzIEVxdWFsaXplciNpbml0XG4gICAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBhZGQgdGhlIHRyaWdnZXIgdG8uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMpe1xuICAgIHRoaXMuJGVsZW1lbnQgPSBlbGVtZW50O1xuICAgIHRoaXMub3B0aW9ucyAgPSAkLmV4dGVuZCh7fSwgRXF1YWxpemVyLmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XG5cbiAgICB0aGlzLl9pbml0KCk7XG5cbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdFcXVhbGl6ZXInKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgRXF1YWxpemVyIHBsdWdpbiBhbmQgY2FsbHMgZnVuY3Rpb25zIHRvIGdldCBlcXVhbGl6ZXIgZnVuY3Rpb25pbmcgb24gbG9hZC5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9pbml0KCkge1xuICAgIHZhciBlcUlkID0gdGhpcy4kZWxlbWVudC5hdHRyKCdkYXRhLWVxdWFsaXplcicpIHx8ICcnO1xuICAgIHZhciAkd2F0Y2hlZCA9IHRoaXMuJGVsZW1lbnQuZmluZChgW2RhdGEtZXF1YWxpemVyLXdhdGNoPVwiJHtlcUlkfVwiXWApO1xuXG4gICAgdGhpcy4kd2F0Y2hlZCA9ICR3YXRjaGVkLmxlbmd0aCA/ICR3YXRjaGVkIDogdGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS1lcXVhbGl6ZXItd2F0Y2hdJyk7XG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKCdkYXRhLXJlc2l6ZScsIChlcUlkIHx8IEZvdW5kYXRpb24uR2V0WW9EaWdpdHMoNiwgJ2VxJykpKTtcblxuICAgIHRoaXMuaGFzTmVzdGVkID0gdGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS1lcXVhbGl6ZXJdJykubGVuZ3RoID4gMDtcbiAgICB0aGlzLmlzTmVzdGVkID0gdGhpcy4kZWxlbWVudC5wYXJlbnRzVW50aWwoZG9jdW1lbnQuYm9keSwgJ1tkYXRhLWVxdWFsaXplcl0nKS5sZW5ndGggPiAwO1xuICAgIHRoaXMuaXNPbiA9IGZhbHNlO1xuICAgIHRoaXMuX2JpbmRIYW5kbGVyID0ge1xuICAgICAgb25SZXNpemVNZUJvdW5kOiB0aGlzLl9vblJlc2l6ZU1lLmJpbmQodGhpcyksXG4gICAgICBvblBvc3RFcXVhbGl6ZWRCb3VuZDogdGhpcy5fb25Qb3N0RXF1YWxpemVkLmJpbmQodGhpcylcbiAgICB9O1xuXG4gICAgdmFyIGltZ3MgPSB0aGlzLiRlbGVtZW50LmZpbmQoJ2ltZycpO1xuICAgIHZhciB0b29TbWFsbDtcbiAgICBpZih0aGlzLm9wdGlvbnMuZXF1YWxpemVPbil7XG4gICAgICB0b29TbWFsbCA9IHRoaXMuX2NoZWNrTVEoKTtcbiAgICAgICQod2luZG93KS5vbignY2hhbmdlZC56Zi5tZWRpYXF1ZXJ5JywgdGhpcy5fY2hlY2tNUS5iaW5kKHRoaXMpKTtcbiAgICB9ZWxzZXtcbiAgICAgIHRoaXMuX2V2ZW50cygpO1xuICAgIH1cbiAgICBpZigodG9vU21hbGwgIT09IHVuZGVmaW5lZCAmJiB0b29TbWFsbCA9PT0gZmFsc2UpIHx8IHRvb1NtYWxsID09PSB1bmRlZmluZWQpe1xuICAgICAgaWYoaW1ncy5sZW5ndGgpe1xuICAgICAgICBGb3VuZGF0aW9uLm9uSW1hZ2VzTG9hZGVkKGltZ3MsIHRoaXMuX3JlZmxvdy5iaW5kKHRoaXMpKTtcbiAgICAgIH1lbHNle1xuICAgICAgICB0aGlzLl9yZWZsb3coKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyBldmVudCBsaXN0ZW5lcnMgaWYgdGhlIGJyZWFrcG9pbnQgaXMgdG9vIHNtYWxsLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3BhdXNlRXZlbnRzKCkge1xuICAgIHRoaXMuaXNPbiA9IGZhbHNlO1xuICAgIHRoaXMuJGVsZW1lbnQub2ZmKHtcbiAgICAgICcuemYuZXF1YWxpemVyJzogdGhpcy5fYmluZEhhbmRsZXIub25Qb3N0RXF1YWxpemVkQm91bmQsXG4gICAgICAncmVzaXplbWUuemYudHJpZ2dlcic6IHRoaXMuX2JpbmRIYW5kbGVyLm9uUmVzaXplTWVCb3VuZFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIGZ1bmN0aW9uIHRvIGhhbmRsZSAkZWxlbWVudHMgcmVzaXplbWUuemYudHJpZ2dlciwgd2l0aCBib3VuZCB0aGlzIG9uIF9iaW5kSGFuZGxlci5vblJlc2l6ZU1lQm91bmRcbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9vblJlc2l6ZU1lKGUpIHtcbiAgICB0aGlzLl9yZWZsb3coKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBmdW5jdGlvbiB0byBoYW5kbGUgJGVsZW1lbnRzIHBvc3RlcXVhbGl6ZWQuemYuZXF1YWxpemVyLCB3aXRoIGJvdW5kIHRoaXMgb24gX2JpbmRIYW5kbGVyLm9uUG9zdEVxdWFsaXplZEJvdW5kXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfb25Qb3N0RXF1YWxpemVkKGUpIHtcbiAgICBpZihlLnRhcmdldCAhPT0gdGhpcy4kZWxlbWVudFswXSl7IHRoaXMuX3JlZmxvdygpOyB9XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgZXZlbnRzIGZvciBFcXVhbGl6ZXIuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfZXZlbnRzKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgdGhpcy5fcGF1c2VFdmVudHMoKTtcbiAgICBpZih0aGlzLmhhc05lc3RlZCl7XG4gICAgICB0aGlzLiRlbGVtZW50Lm9uKCdwb3N0ZXF1YWxpemVkLnpmLmVxdWFsaXplcicsIHRoaXMuX2JpbmRIYW5kbGVyLm9uUG9zdEVxdWFsaXplZEJvdW5kKTtcbiAgICB9ZWxzZXtcbiAgICAgIHRoaXMuJGVsZW1lbnQub24oJ3Jlc2l6ZW1lLnpmLnRyaWdnZXInLCB0aGlzLl9iaW5kSGFuZGxlci5vblJlc2l6ZU1lQm91bmQpO1xuICAgIH1cbiAgICB0aGlzLmlzT24gPSB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB0aGUgY3VycmVudCBicmVha3BvaW50IHRvIHRoZSBtaW5pbXVtIHJlcXVpcmVkIHNpemUuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfY2hlY2tNUSgpIHtcbiAgICB2YXIgdG9vU21hbGwgPSAhRm91bmRhdGlvbi5NZWRpYVF1ZXJ5LmF0TGVhc3QodGhpcy5vcHRpb25zLmVxdWFsaXplT24pO1xuICAgIGlmKHRvb1NtYWxsKXtcbiAgICAgIGlmKHRoaXMuaXNPbil7XG4gICAgICAgIHRoaXMuX3BhdXNlRXZlbnRzKCk7XG4gICAgICAgIHRoaXMuJHdhdGNoZWQuY3NzKCdoZWlnaHQnLCAnYXV0bycpO1xuICAgICAgfVxuICAgIH1lbHNle1xuICAgICAgaWYoIXRoaXMuaXNPbil7XG4gICAgICAgIHRoaXMuX2V2ZW50cygpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdG9vU21hbGw7XG4gIH1cblxuICAvKipcbiAgICogQSBub29wIHZlcnNpb24gZm9yIHRoZSBwbHVnaW5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9raWxsc3dpdGNoKCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxscyBuZWNlc3NhcnkgZnVuY3Rpb25zIHRvIHVwZGF0ZSBFcXVhbGl6ZXIgdXBvbiBET00gY2hhbmdlXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfcmVmbG93KCkge1xuICAgIGlmKCF0aGlzLm9wdGlvbnMuZXF1YWxpemVPblN0YWNrKXtcbiAgICAgIGlmKHRoaXMuX2lzU3RhY2tlZCgpKXtcbiAgICAgICAgdGhpcy4kd2F0Y2hlZC5jc3MoJ2hlaWdodCcsICdhdXRvJyk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRoaXMub3B0aW9ucy5lcXVhbGl6ZUJ5Um93KSB7XG4gICAgICB0aGlzLmdldEhlaWdodHNCeVJvdyh0aGlzLmFwcGx5SGVpZ2h0QnlSb3cuYmluZCh0aGlzKSk7XG4gICAgfWVsc2V7XG4gICAgICB0aGlzLmdldEhlaWdodHModGhpcy5hcHBseUhlaWdodC5iaW5kKHRoaXMpKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogTWFudWFsbHkgZGV0ZXJtaW5lcyBpZiB0aGUgZmlyc3QgMiBlbGVtZW50cyBhcmUgKk5PVCogc3RhY2tlZC5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9pc1N0YWNrZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuJHdhdGNoZWRbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wICE9PSB0aGlzLiR3YXRjaGVkWzFdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcDtcbiAgfVxuXG4gIC8qKlxuICAgKiBGaW5kcyB0aGUgb3V0ZXIgaGVpZ2h0cyBvZiBjaGlsZHJlbiBjb250YWluZWQgd2l0aGluIGFuIEVxdWFsaXplciBwYXJlbnQgYW5kIHJldHVybnMgdGhlbSBpbiBhbiBhcnJheVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYiAtIEEgbm9uLW9wdGlvbmFsIGNhbGxiYWNrIHRvIHJldHVybiB0aGUgaGVpZ2h0cyBhcnJheSB0by5cbiAgICogQHJldHVybnMge0FycmF5fSBoZWlnaHRzIC0gQW4gYXJyYXkgb2YgaGVpZ2h0cyBvZiBjaGlsZHJlbiB3aXRoaW4gRXF1YWxpemVyIGNvbnRhaW5lclxuICAgKi9cbiAgZ2V0SGVpZ2h0cyhjYikge1xuICAgIHZhciBoZWlnaHRzID0gW107XG4gICAgZm9yKHZhciBpID0gMCwgbGVuID0gdGhpcy4kd2F0Y2hlZC5sZW5ndGg7IGkgPCBsZW47IGkrKyl7XG4gICAgICB0aGlzLiR3YXRjaGVkW2ldLnN0eWxlLmhlaWdodCA9ICdhdXRvJztcbiAgICAgIGhlaWdodHMucHVzaCh0aGlzLiR3YXRjaGVkW2ldLm9mZnNldEhlaWdodCk7XG4gICAgfVxuICAgIGNiKGhlaWdodHMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZpbmRzIHRoZSBvdXRlciBoZWlnaHRzIG9mIGNoaWxkcmVuIGNvbnRhaW5lZCB3aXRoaW4gYW4gRXF1YWxpemVyIHBhcmVudCBhbmQgcmV0dXJucyB0aGVtIGluIGFuIGFycmF5XG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNiIC0gQSBub24tb3B0aW9uYWwgY2FsbGJhY2sgdG8gcmV0dXJuIHRoZSBoZWlnaHRzIGFycmF5IHRvLlxuICAgKiBAcmV0dXJucyB7QXJyYXl9IGdyb3VwcyAtIEFuIGFycmF5IG9mIGhlaWdodHMgb2YgY2hpbGRyZW4gd2l0aGluIEVxdWFsaXplciBjb250YWluZXIgZ3JvdXBlZCBieSByb3cgd2l0aCBlbGVtZW50LGhlaWdodCBhbmQgbWF4IGFzIGxhc3QgY2hpbGRcbiAgICovXG4gIGdldEhlaWdodHNCeVJvdyhjYikge1xuICAgIHZhciBsYXN0RWxUb3BPZmZzZXQgPSAodGhpcy4kd2F0Y2hlZC5sZW5ndGggPyB0aGlzLiR3YXRjaGVkLmZpcnN0KCkub2Zmc2V0KCkudG9wIDogMCksXG4gICAgICAgIGdyb3VwcyA9IFtdLFxuICAgICAgICBncm91cCA9IDA7XG4gICAgLy9ncm91cCBieSBSb3dcbiAgICBncm91cHNbZ3JvdXBdID0gW107XG4gICAgZm9yKHZhciBpID0gMCwgbGVuID0gdGhpcy4kd2F0Y2hlZC5sZW5ndGg7IGkgPCBsZW47IGkrKyl7XG4gICAgICB0aGlzLiR3YXRjaGVkW2ldLnN0eWxlLmhlaWdodCA9ICdhdXRvJztcbiAgICAgIC8vbWF5YmUgY291bGQgdXNlIHRoaXMuJHdhdGNoZWRbaV0ub2Zmc2V0VG9wXG4gICAgICB2YXIgZWxPZmZzZXRUb3AgPSAkKHRoaXMuJHdhdGNoZWRbaV0pLm9mZnNldCgpLnRvcDtcbiAgICAgIGlmIChlbE9mZnNldFRvcCE9bGFzdEVsVG9wT2Zmc2V0KSB7XG4gICAgICAgIGdyb3VwKys7XG4gICAgICAgIGdyb3Vwc1tncm91cF0gPSBbXTtcbiAgICAgICAgbGFzdEVsVG9wT2Zmc2V0PWVsT2Zmc2V0VG9wO1xuICAgICAgfVxuICAgICAgZ3JvdXBzW2dyb3VwXS5wdXNoKFt0aGlzLiR3YXRjaGVkW2ldLHRoaXMuJHdhdGNoZWRbaV0ub2Zmc2V0SGVpZ2h0XSk7XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaiA9IDAsIGxuID0gZ3JvdXBzLmxlbmd0aDsgaiA8IGxuOyBqKyspIHtcbiAgICAgIHZhciBoZWlnaHRzID0gJChncm91cHNbal0pLm1hcChmdW5jdGlvbigpeyByZXR1cm4gdGhpc1sxXTsgfSkuZ2V0KCk7XG4gICAgICB2YXIgbWF4ICAgICAgICAgPSBNYXRoLm1heC5hcHBseShudWxsLCBoZWlnaHRzKTtcbiAgICAgIGdyb3Vwc1tqXS5wdXNoKG1heCk7XG4gICAgfVxuICAgIGNiKGdyb3Vwcyk7XG4gIH1cblxuICAvKipcbiAgICogQ2hhbmdlcyB0aGUgQ1NTIGhlaWdodCBwcm9wZXJ0eSBvZiBlYWNoIGNoaWxkIGluIGFuIEVxdWFsaXplciBwYXJlbnQgdG8gbWF0Y2ggdGhlIHRhbGxlc3RcbiAgICogQHBhcmFtIHthcnJheX0gaGVpZ2h0cyAtIEFuIGFycmF5IG9mIGhlaWdodHMgb2YgY2hpbGRyZW4gd2l0aGluIEVxdWFsaXplciBjb250YWluZXJcbiAgICogQGZpcmVzIEVxdWFsaXplciNwcmVlcXVhbGl6ZWRcbiAgICogQGZpcmVzIEVxdWFsaXplciNwb3N0ZXF1YWxpemVkXG4gICAqL1xuICBhcHBseUhlaWdodChoZWlnaHRzKSB7XG4gICAgdmFyIG1heCA9IE1hdGgubWF4LmFwcGx5KG51bGwsIGhlaWdodHMpO1xuICAgIC8qKlxuICAgICAqIEZpcmVzIGJlZm9yZSB0aGUgaGVpZ2h0cyBhcmUgYXBwbGllZFxuICAgICAqIEBldmVudCBFcXVhbGl6ZXIjcHJlZXF1YWxpemVkXG4gICAgICovXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdwcmVlcXVhbGl6ZWQuemYuZXF1YWxpemVyJyk7XG5cbiAgICB0aGlzLiR3YXRjaGVkLmNzcygnaGVpZ2h0JywgbWF4KTtcblxuICAgIC8qKlxuICAgICAqIEZpcmVzIHdoZW4gdGhlIGhlaWdodHMgaGF2ZSBiZWVuIGFwcGxpZWRcbiAgICAgKiBAZXZlbnQgRXF1YWxpemVyI3Bvc3RlcXVhbGl6ZWRcbiAgICAgKi9cbiAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdwb3N0ZXF1YWxpemVkLnpmLmVxdWFsaXplcicpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoYW5nZXMgdGhlIENTUyBoZWlnaHQgcHJvcGVydHkgb2YgZWFjaCBjaGlsZCBpbiBhbiBFcXVhbGl6ZXIgcGFyZW50IHRvIG1hdGNoIHRoZSB0YWxsZXN0IGJ5IHJvd1xuICAgKiBAcGFyYW0ge2FycmF5fSBncm91cHMgLSBBbiBhcnJheSBvZiBoZWlnaHRzIG9mIGNoaWxkcmVuIHdpdGhpbiBFcXVhbGl6ZXIgY29udGFpbmVyIGdyb3VwZWQgYnkgcm93IHdpdGggZWxlbWVudCxoZWlnaHQgYW5kIG1heCBhcyBsYXN0IGNoaWxkXG4gICAqIEBmaXJlcyBFcXVhbGl6ZXIjcHJlZXF1YWxpemVkXG4gICAqIEBmaXJlcyBFcXVhbGl6ZXIjcHJlZXF1YWxpemVkUm93XG4gICAqIEBmaXJlcyBFcXVhbGl6ZXIjcG9zdGVxdWFsaXplZFJvd1xuICAgKiBAZmlyZXMgRXF1YWxpemVyI3Bvc3RlcXVhbGl6ZWRcbiAgICovXG4gIGFwcGx5SGVpZ2h0QnlSb3coZ3JvdXBzKSB7XG4gICAgLyoqXG4gICAgICogRmlyZXMgYmVmb3JlIHRoZSBoZWlnaHRzIGFyZSBhcHBsaWVkXG4gICAgICovXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdwcmVlcXVhbGl6ZWQuemYuZXF1YWxpemVyJyk7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGdyb3Vwcy5sZW5ndGg7IGkgPCBsZW4gOyBpKyspIHtcbiAgICAgIHZhciBncm91cHNJTGVuZ3RoID0gZ3JvdXBzW2ldLmxlbmd0aCxcbiAgICAgICAgICBtYXggPSBncm91cHNbaV1bZ3JvdXBzSUxlbmd0aCAtIDFdO1xuICAgICAgaWYgKGdyb3Vwc0lMZW5ndGg8PTIpIHtcbiAgICAgICAgJChncm91cHNbaV1bMF1bMF0pLmNzcyh7J2hlaWdodCc6J2F1dG8nfSk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgLyoqXG4gICAgICAgICogRmlyZXMgYmVmb3JlIHRoZSBoZWlnaHRzIHBlciByb3cgYXJlIGFwcGxpZWRcbiAgICAgICAgKiBAZXZlbnQgRXF1YWxpemVyI3ByZWVxdWFsaXplZFJvd1xuICAgICAgICAqL1xuICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdwcmVlcXVhbGl6ZWRyb3cuemYuZXF1YWxpemVyJyk7XG4gICAgICBmb3IgKHZhciBqID0gMCwgbGVuSiA9IChncm91cHNJTGVuZ3RoLTEpOyBqIDwgbGVuSiA7IGorKykge1xuICAgICAgICAkKGdyb3Vwc1tpXVtqXVswXSkuY3NzKHsnaGVpZ2h0JzptYXh9KTtcbiAgICAgIH1cbiAgICAgIC8qKlxuICAgICAgICAqIEZpcmVzIHdoZW4gdGhlIGhlaWdodHMgcGVyIHJvdyBoYXZlIGJlZW4gYXBwbGllZFxuICAgICAgICAqIEBldmVudCBFcXVhbGl6ZXIjcG9zdGVxdWFsaXplZFJvd1xuICAgICAgICAqL1xuICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdwb3N0ZXF1YWxpemVkcm93LnpmLmVxdWFsaXplcicpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBGaXJlcyB3aGVuIHRoZSBoZWlnaHRzIGhhdmUgYmVlbiBhcHBsaWVkXG4gICAgICovXG4gICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcigncG9zdGVxdWFsaXplZC56Zi5lcXVhbGl6ZXInKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXN0cm95cyBhbiBpbnN0YW5jZSBvZiBFcXVhbGl6ZXIuXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLl9wYXVzZUV2ZW50cygpO1xuICAgIHRoaXMuJHdhdGNoZWQuY3NzKCdoZWlnaHQnLCAnYXV0bycpO1xuXG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xuICB9XG59XG5cbi8qKlxuICogRGVmYXVsdCBzZXR0aW5ncyBmb3IgcGx1Z2luXG4gKi9cbkVxdWFsaXplci5kZWZhdWx0cyA9IHtcbiAgLyoqXG4gICAqIEVuYWJsZSBoZWlnaHQgZXF1YWxpemF0aW9uIHdoZW4gc3RhY2tlZCBvbiBzbWFsbGVyIHNjcmVlbnMuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgdHJ1ZVxuICAgKi9cbiAgZXF1YWxpemVPblN0YWNrOiBmYWxzZSxcbiAgLyoqXG4gICAqIEVuYWJsZSBoZWlnaHQgZXF1YWxpemF0aW9uIHJvdyBieSByb3cuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgZmFsc2VcbiAgICovXG4gIGVxdWFsaXplQnlSb3c6IGZhbHNlLFxuICAvKipcbiAgICogU3RyaW5nIHJlcHJlc2VudGluZyB0aGUgbWluaW11bSBicmVha3BvaW50IHNpemUgdGhlIHBsdWdpbiBzaG91bGQgZXF1YWxpemUgaGVpZ2h0cyBvbi5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAnbWVkaXVtJ1xuICAgKi9cbiAgZXF1YWxpemVPbjogJydcbn07XG5cbi8vIFdpbmRvdyBleHBvcnRzXG5Gb3VuZGF0aW9uLnBsdWdpbihFcXVhbGl6ZXIsICdFcXVhbGl6ZXInKTtcblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG4vKipcbiAqIEludGVyY2hhbmdlIG1vZHVsZS5cbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5pbnRlcmNoYW5nZVxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5tZWRpYVF1ZXJ5XG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLnRpbWVyQW5kSW1hZ2VMb2FkZXJcbiAqL1xuXG5jbGFzcyBJbnRlcmNoYW5nZSB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIEludGVyY2hhbmdlLlxuICAgKiBAY2xhc3NcbiAgICogQGZpcmVzIEludGVyY2hhbmdlI2luaXRcbiAgICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIGFkZCB0aGUgdHJpZ2dlciB0by5cbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPdmVycmlkZXMgdG8gdGhlIGRlZmF1bHQgcGx1Z2luIHNldHRpbmdzLlxuICAgKi9cbiAgY29uc3RydWN0b3IoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMuJGVsZW1lbnQgPSBlbGVtZW50O1xuICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBJbnRlcmNoYW5nZS5kZWZhdWx0cywgb3B0aW9ucyk7XG4gICAgdGhpcy5ydWxlcyA9IFtdO1xuICAgIHRoaXMuY3VycmVudFBhdGggPSAnJztcblxuICAgIHRoaXMuX2luaXQoKTtcbiAgICB0aGlzLl9ldmVudHMoKTtcblxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcywgJ0ludGVyY2hhbmdlJyk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIEludGVyY2hhbmdlIHBsdWdpbiBhbmQgY2FsbHMgZnVuY3Rpb25zIHRvIGdldCBpbnRlcmNoYW5nZSBmdW5jdGlvbmluZyBvbiBsb2FkLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9pbml0KCkge1xuICAgIHRoaXMuX2FkZEJyZWFrcG9pbnRzKCk7XG4gICAgdGhpcy5fZ2VuZXJhdGVSdWxlcygpO1xuICAgIHRoaXMuX3JlZmxvdygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIGV2ZW50cyBmb3IgSW50ZXJjaGFuZ2UuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2V2ZW50cygpIHtcbiAgICAkKHdpbmRvdykub24oJ3Jlc2l6ZS56Zi5pbnRlcmNoYW5nZScsIEZvdW5kYXRpb24udXRpbC50aHJvdHRsZSh0aGlzLl9yZWZsb3cuYmluZCh0aGlzKSwgNTApKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxscyBuZWNlc3NhcnkgZnVuY3Rpb25zIHRvIHVwZGF0ZSBJbnRlcmNoYW5nZSB1cG9uIERPTSBjaGFuZ2VcbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfcmVmbG93KCkge1xuICAgIHZhciBtYXRjaDtcblxuICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCBlYWNoIHJ1bGUsIGJ1dCBvbmx5IHNhdmUgdGhlIGxhc3QgbWF0Y2hcbiAgICBmb3IgKHZhciBpIGluIHRoaXMucnVsZXMpIHtcbiAgICAgIGlmKHRoaXMucnVsZXMuaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgICAgdmFyIHJ1bGUgPSB0aGlzLnJ1bGVzW2ldO1xuXG4gICAgICAgIGlmICh3aW5kb3cubWF0Y2hNZWRpYShydWxlLnF1ZXJ5KS5tYXRjaGVzKSB7XG4gICAgICAgICAgbWF0Y2ggPSBydWxlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG1hdGNoKSB7XG4gICAgICB0aGlzLnJlcGxhY2UobWF0Y2gucGF0aCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIEZvdW5kYXRpb24gYnJlYWtwb2ludHMgYW5kIGFkZHMgdGhlbSB0byB0aGUgSW50ZXJjaGFuZ2UuU1BFQ0lBTF9RVUVSSUVTIG9iamVjdC5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfYWRkQnJlYWtwb2ludHMoKSB7XG4gICAgZm9yICh2YXIgaSBpbiBGb3VuZGF0aW9uLk1lZGlhUXVlcnkucXVlcmllcykge1xuICAgICAgaWYgKEZvdW5kYXRpb24uTWVkaWFRdWVyeS5xdWVyaWVzLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgIHZhciBxdWVyeSA9IEZvdW5kYXRpb24uTWVkaWFRdWVyeS5xdWVyaWVzW2ldO1xuICAgICAgICBJbnRlcmNoYW5nZS5TUEVDSUFMX1FVRVJJRVNbcXVlcnkubmFtZV0gPSBxdWVyeS52YWx1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHRoZSBJbnRlcmNoYW5nZSBlbGVtZW50IGZvciB0aGUgcHJvdmlkZWQgbWVkaWEgcXVlcnkgKyBjb250ZW50IHBhaXJpbmdzXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge09iamVjdH0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdGhhdCBpcyBhbiBJbnRlcmNoYW5nZSBpbnN0YW5jZVxuICAgKiBAcmV0dXJucyB7QXJyYXl9IHNjZW5hcmlvcyAtIEFycmF5IG9mIG9iamVjdHMgdGhhdCBoYXZlICdtcScgYW5kICdwYXRoJyBrZXlzIHdpdGggY29ycmVzcG9uZGluZyBrZXlzXG4gICAqL1xuICBfZ2VuZXJhdGVSdWxlcyhlbGVtZW50KSB7XG4gICAgdmFyIHJ1bGVzTGlzdCA9IFtdO1xuICAgIHZhciBydWxlcztcblxuICAgIGlmICh0aGlzLm9wdGlvbnMucnVsZXMpIHtcbiAgICAgIHJ1bGVzID0gdGhpcy5vcHRpb25zLnJ1bGVzO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHJ1bGVzID0gdGhpcy4kZWxlbWVudC5kYXRhKCdpbnRlcmNoYW5nZScpLm1hdGNoKC9cXFsuKj9cXF0vZyk7XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaSBpbiBydWxlcykge1xuICAgICAgaWYocnVsZXMuaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgICAgdmFyIHJ1bGUgPSBydWxlc1tpXS5zbGljZSgxLCAtMSkuc3BsaXQoJywgJyk7XG4gICAgICAgIHZhciBwYXRoID0gcnVsZS5zbGljZSgwLCAtMSkuam9pbignJyk7XG4gICAgICAgIHZhciBxdWVyeSA9IHJ1bGVbcnVsZS5sZW5ndGggLSAxXTtcblxuICAgICAgICBpZiAoSW50ZXJjaGFuZ2UuU1BFQ0lBTF9RVUVSSUVTW3F1ZXJ5XSkge1xuICAgICAgICAgIHF1ZXJ5ID0gSW50ZXJjaGFuZ2UuU1BFQ0lBTF9RVUVSSUVTW3F1ZXJ5XTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJ1bGVzTGlzdC5wdXNoKHtcbiAgICAgICAgICBwYXRoOiBwYXRoLFxuICAgICAgICAgIHF1ZXJ5OiBxdWVyeVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnJ1bGVzID0gcnVsZXNMaXN0O1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUgYHNyY2AgcHJvcGVydHkgb2YgYW4gaW1hZ2UsIG9yIGNoYW5nZSB0aGUgSFRNTCBvZiBhIGNvbnRhaW5lciwgdG8gdGhlIHNwZWNpZmllZCBwYXRoLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGggLSBQYXRoIHRvIHRoZSBpbWFnZSBvciBIVE1MIHBhcnRpYWwuXG4gICAqIEBmaXJlcyBJbnRlcmNoYW5nZSNyZXBsYWNlZFxuICAgKi9cbiAgcmVwbGFjZShwYXRoKSB7XG4gICAgaWYgKHRoaXMuY3VycmVudFBhdGggPT09IHBhdGgpIHJldHVybjtcblxuICAgIHZhciBfdGhpcyA9IHRoaXMsXG4gICAgICAgIHRyaWdnZXIgPSAncmVwbGFjZWQuemYuaW50ZXJjaGFuZ2UnO1xuXG4gICAgLy8gUmVwbGFjaW5nIGltYWdlc1xuICAgIGlmICh0aGlzLiRlbGVtZW50WzBdLm5vZGVOYW1lID09PSAnSU1HJykge1xuICAgICAgdGhpcy4kZWxlbWVudC5hdHRyKCdzcmMnLCBwYXRoKS5vbignbG9hZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICBfdGhpcy5jdXJyZW50UGF0aCA9IHBhdGg7XG4gICAgICB9KVxuICAgICAgLnRyaWdnZXIodHJpZ2dlcik7XG4gICAgfVxuICAgIC8vIFJlcGxhY2luZyBiYWNrZ3JvdW5kIGltYWdlc1xuICAgIGVsc2UgaWYgKHBhdGgubWF0Y2goL1xcLihnaWZ8anBnfGpwZWd8cG5nfHN2Z3x0aWZmKShbPyNdLiopPy9pKSkge1xuICAgICAgdGhpcy4kZWxlbWVudC5jc3MoeyAnYmFja2dyb3VuZC1pbWFnZSc6ICd1cmwoJytwYXRoKycpJyB9KVxuICAgICAgICAgIC50cmlnZ2VyKHRyaWdnZXIpO1xuICAgIH1cbiAgICAvLyBSZXBsYWNpbmcgSFRNTFxuICAgIGVsc2Uge1xuICAgICAgJC5nZXQocGF0aCwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgX3RoaXMuJGVsZW1lbnQuaHRtbChyZXNwb25zZSlcbiAgICAgICAgICAgICAudHJpZ2dlcih0cmlnZ2VyKTtcbiAgICAgICAgJChyZXNwb25zZSkuZm91bmRhdGlvbigpO1xuICAgICAgICBfdGhpcy5jdXJyZW50UGF0aCA9IHBhdGg7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGaXJlcyB3aGVuIGNvbnRlbnQgaW4gYW4gSW50ZXJjaGFuZ2UgZWxlbWVudCBpcyBkb25lIGJlaW5nIGxvYWRlZC5cbiAgICAgKiBAZXZlbnQgSW50ZXJjaGFuZ2UjcmVwbGFjZWRcbiAgICAgKi9cbiAgICAvLyB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ3JlcGxhY2VkLnpmLmludGVyY2hhbmdlJyk7XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgYW4gaW5zdGFuY2Ugb2YgaW50ZXJjaGFuZ2UuXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgZGVzdHJveSgpIHtcbiAgICAvL1RPRE8gdGhpcy5cbiAgfVxufVxuXG4vKipcbiAqIERlZmF1bHQgc2V0dGluZ3MgZm9yIHBsdWdpblxuICovXG5JbnRlcmNoYW5nZS5kZWZhdWx0cyA9IHtcbiAgLyoqXG4gICAqIFJ1bGVzIHRvIGJlIGFwcGxpZWQgdG8gSW50ZXJjaGFuZ2UgZWxlbWVudHMuIFNldCB3aXRoIHRoZSBgZGF0YS1pbnRlcmNoYW5nZWAgYXJyYXkgbm90YXRpb24uXG4gICAqIEBvcHRpb25cbiAgICovXG4gIHJ1bGVzOiBudWxsXG59O1xuXG5JbnRlcmNoYW5nZS5TUEVDSUFMX1FVRVJJRVMgPSB7XG4gICdsYW5kc2NhcGUnOiAnc2NyZWVuIGFuZCAob3JpZW50YXRpb246IGxhbmRzY2FwZSknLFxuICAncG9ydHJhaXQnOiAnc2NyZWVuIGFuZCAob3JpZW50YXRpb246IHBvcnRyYWl0KScsXG4gICdyZXRpbmEnOiAnb25seSBzY3JlZW4gYW5kICgtd2Via2l0LW1pbi1kZXZpY2UtcGl4ZWwtcmF0aW86IDIpLCBvbmx5IHNjcmVlbiBhbmQgKG1pbi0tbW96LWRldmljZS1waXhlbC1yYXRpbzogMiksIG9ubHkgc2NyZWVuIGFuZCAoLW8tbWluLWRldmljZS1waXhlbC1yYXRpbzogMi8xKSwgb25seSBzY3JlZW4gYW5kIChtaW4tZGV2aWNlLXBpeGVsLXJhdGlvOiAyKSwgb25seSBzY3JlZW4gYW5kIChtaW4tcmVzb2x1dGlvbjogMTkyZHBpKSwgb25seSBzY3JlZW4gYW5kIChtaW4tcmVzb2x1dGlvbjogMmRwcHgpJ1xufTtcblxuLy8gV2luZG93IGV4cG9ydHNcbkZvdW5kYXRpb24ucGx1Z2luKEludGVyY2hhbmdlLCAnSW50ZXJjaGFuZ2UnKTtcblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG4vKipcbiAqIE9mZkNhbnZhcyBtb2R1bGUuXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24ub2ZmY2FudmFzXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm1lZGlhUXVlcnlcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwudHJpZ2dlcnNcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubW90aW9uXG4gKi9cblxuY2xhc3MgT2ZmQ2FudmFzIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgYW4gb2ZmLWNhbnZhcyB3cmFwcGVyLlxuICAgKiBAY2xhc3NcbiAgICogQGZpcmVzIE9mZkNhbnZhcyNpbml0XG4gICAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBpbml0aWFsaXplLlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE92ZXJyaWRlcyB0byB0aGUgZGVmYXVsdCBwbHVnaW4gc2V0dGluZ3MuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIE9mZkNhbnZhcy5kZWZhdWx0cywgdGhpcy4kZWxlbWVudC5kYXRhKCksIG9wdGlvbnMpO1xuICAgIHRoaXMuJGxhc3RUcmlnZ2VyID0gJCgpO1xuICAgIHRoaXMuJHRyaWdnZXJzID0gJCgpO1xuXG4gICAgdGhpcy5faW5pdCgpO1xuICAgIHRoaXMuX2V2ZW50cygpO1xuXG4gICAgRm91bmRhdGlvbi5yZWdpc3RlclBsdWdpbih0aGlzLCAnT2ZmQ2FudmFzJylcbiAgICBGb3VuZGF0aW9uLktleWJvYXJkLnJlZ2lzdGVyKCdPZmZDYW52YXMnLCB7XG4gICAgICAnRVNDQVBFJzogJ2Nsb3NlJ1xuICAgIH0pO1xuXG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIG9mZi1jYW52YXMgd3JhcHBlciBieSBhZGRpbmcgdGhlIGV4aXQgb3ZlcmxheSAoaWYgbmVlZGVkKS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaW5pdCgpIHtcbiAgICB2YXIgaWQgPSB0aGlzLiRlbGVtZW50LmF0dHIoJ2lkJyk7XG5cbiAgICB0aGlzLiRlbGVtZW50LmF0dHIoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKTtcblxuICAgIC8vIEZpbmQgdHJpZ2dlcnMgdGhhdCBhZmZlY3QgdGhpcyBlbGVtZW50IGFuZCBhZGQgYXJpYS1leHBhbmRlZCB0byB0aGVtXG4gICAgdGhpcy4kdHJpZ2dlcnMgPSAkKGRvY3VtZW50KVxuICAgICAgLmZpbmQoJ1tkYXRhLW9wZW49XCInK2lkKydcIl0sIFtkYXRhLWNsb3NlPVwiJytpZCsnXCJdLCBbZGF0YS10b2dnbGU9XCInK2lkKydcIl0nKVxuICAgICAgLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCAnZmFsc2UnKVxuICAgICAgLmF0dHIoJ2FyaWEtY29udHJvbHMnLCBpZCk7XG5cbiAgICAvLyBBZGQgYSBjbG9zZSB0cmlnZ2VyIG92ZXIgdGhlIGJvZHkgaWYgbmVjZXNzYXJ5XG4gICAgaWYgKHRoaXMub3B0aW9ucy5jbG9zZU9uQ2xpY2spIHtcbiAgICAgIGlmICgkKCcuanMtb2ZmLWNhbnZhcy1leGl0JykubGVuZ3RoKSB7XG4gICAgICAgIHRoaXMuJGV4aXRlciA9ICQoJy5qcy1vZmYtY2FudmFzLWV4aXQnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBleGl0ZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgZXhpdGVyLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCAnanMtb2ZmLWNhbnZhcy1leGl0Jyk7XG4gICAgICAgICQoJ1tkYXRhLW9mZi1jYW52YXMtY29udGVudF0nKS5hcHBlbmQoZXhpdGVyKTtcblxuICAgICAgICB0aGlzLiRleGl0ZXIgPSAkKGV4aXRlcik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5vcHRpb25zLmlzUmV2ZWFsZWQgPSB0aGlzLm9wdGlvbnMuaXNSZXZlYWxlZCB8fCBuZXcgUmVnRXhwKHRoaXMub3B0aW9ucy5yZXZlYWxDbGFzcywgJ2cnKS50ZXN0KHRoaXMuJGVsZW1lbnRbMF0uY2xhc3NOYW1lKTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMuaXNSZXZlYWxlZCkge1xuICAgICAgdGhpcy5vcHRpb25zLnJldmVhbE9uID0gdGhpcy5vcHRpb25zLnJldmVhbE9uIHx8IHRoaXMuJGVsZW1lbnRbMF0uY2xhc3NOYW1lLm1hdGNoKC8ocmV2ZWFsLWZvci1tZWRpdW18cmV2ZWFsLWZvci1sYXJnZSkvZylbMF0uc3BsaXQoJy0nKVsyXTtcbiAgICAgIHRoaXMuX3NldE1RQ2hlY2tlcigpO1xuICAgIH1cbiAgICBpZiAoIXRoaXMub3B0aW9ucy50cmFuc2l0aW9uVGltZSkge1xuICAgICAgdGhpcy5vcHRpb25zLnRyYW5zaXRpb25UaW1lID0gcGFyc2VGbG9hdCh3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSgkKCdbZGF0YS1vZmYtY2FudmFzLXdyYXBwZXJdJylbMF0pLnRyYW5zaXRpb25EdXJhdGlvbikgKiAxMDAwO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGV2ZW50IGhhbmRsZXJzIHRvIHRoZSBvZmYtY2FudmFzIHdyYXBwZXIgYW5kIHRoZSBleGl0IG92ZXJsYXkuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2V2ZW50cygpIHtcbiAgICB0aGlzLiRlbGVtZW50Lm9mZignLnpmLnRyaWdnZXIgLnpmLm9mZmNhbnZhcycpLm9uKHtcbiAgICAgICdvcGVuLnpmLnRyaWdnZXInOiB0aGlzLm9wZW4uYmluZCh0aGlzKSxcbiAgICAgICdjbG9zZS56Zi50cmlnZ2VyJzogdGhpcy5jbG9zZS5iaW5kKHRoaXMpLFxuICAgICAgJ3RvZ2dsZS56Zi50cmlnZ2VyJzogdGhpcy50b2dnbGUuYmluZCh0aGlzKSxcbiAgICAgICdrZXlkb3duLnpmLm9mZmNhbnZhcyc6IHRoaXMuX2hhbmRsZUtleWJvYXJkLmJpbmQodGhpcylcbiAgICB9KTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMuY2xvc2VPbkNsaWNrICYmIHRoaXMuJGV4aXRlci5sZW5ndGgpIHtcbiAgICAgIHRoaXMuJGV4aXRlci5vbih7J2NsaWNrLnpmLm9mZmNhbnZhcyc6IHRoaXMuY2xvc2UuYmluZCh0aGlzKX0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBsaWVzIGV2ZW50IGxpc3RlbmVyIGZvciBlbGVtZW50cyB0aGF0IHdpbGwgcmV2ZWFsIGF0IGNlcnRhaW4gYnJlYWtwb2ludHMuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfc2V0TVFDaGVja2VyKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAkKHdpbmRvdykub24oJ2NoYW5nZWQuemYubWVkaWFxdWVyeScsIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKEZvdW5kYXRpb24uTWVkaWFRdWVyeS5hdExlYXN0KF90aGlzLm9wdGlvbnMucmV2ZWFsT24pKSB7XG4gICAgICAgIF90aGlzLnJldmVhbCh0cnVlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIF90aGlzLnJldmVhbChmYWxzZSk7XG4gICAgICB9XG4gICAgfSkub25lKCdsb2FkLnpmLm9mZmNhbnZhcycsIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKEZvdW5kYXRpb24uTWVkaWFRdWVyeS5hdExlYXN0KF90aGlzLm9wdGlvbnMucmV2ZWFsT24pKSB7XG4gICAgICAgIF90aGlzLnJldmVhbCh0cnVlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIHRoZSByZXZlYWxpbmcvaGlkaW5nIHRoZSBvZmYtY2FudmFzIGF0IGJyZWFrcG9pbnRzLCBub3QgdGhlIHNhbWUgYXMgb3Blbi5cbiAgICogQHBhcmFtIHtCb29sZWFufSBpc1JldmVhbGVkIC0gdHJ1ZSBpZiBlbGVtZW50IHNob3VsZCBiZSByZXZlYWxlZC5cbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICByZXZlYWwoaXNSZXZlYWxlZCkge1xuICAgIHZhciAkY2xvc2VyID0gdGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS1jbG9zZV0nKTtcbiAgICBpZiAoaXNSZXZlYWxlZCkge1xuICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgdGhpcy5pc1JldmVhbGVkID0gdHJ1ZTtcbiAgICAgIC8vIGlmICghdGhpcy5vcHRpb25zLmZvcmNlVG9wKSB7XG4gICAgICAvLyAgIHZhciBzY3JvbGxQb3MgPSBwYXJzZUludCh3aW5kb3cucGFnZVlPZmZzZXQpO1xuICAgICAgLy8gICB0aGlzLiRlbGVtZW50WzBdLnN0eWxlLnRyYW5zZm9ybSA9ICd0cmFuc2xhdGUoMCwnICsgc2Nyb2xsUG9zICsgJ3B4KSc7XG4gICAgICAvLyB9XG4gICAgICAvLyBpZiAodGhpcy5vcHRpb25zLmlzU3RpY2t5KSB7IHRoaXMuX3N0aWNrKCk7IH1cbiAgICAgIHRoaXMuJGVsZW1lbnQub2ZmKCdvcGVuLnpmLnRyaWdnZXIgdG9nZ2xlLnpmLnRyaWdnZXInKTtcbiAgICAgIGlmICgkY2xvc2VyLmxlbmd0aCkgeyAkY2xvc2VyLmhpZGUoKTsgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmlzUmV2ZWFsZWQgPSBmYWxzZTtcbiAgICAgIC8vIGlmICh0aGlzLm9wdGlvbnMuaXNTdGlja3kgfHwgIXRoaXMub3B0aW9ucy5mb3JjZVRvcCkge1xuICAgICAgLy8gICB0aGlzLiRlbGVtZW50WzBdLnN0eWxlLnRyYW5zZm9ybSA9ICcnO1xuICAgICAgLy8gICAkKHdpbmRvdykub2ZmKCdzY3JvbGwuemYub2ZmY2FudmFzJyk7XG4gICAgICAvLyB9XG4gICAgICB0aGlzLiRlbGVtZW50Lm9uKHtcbiAgICAgICAgJ29wZW4uemYudHJpZ2dlcic6IHRoaXMub3Blbi5iaW5kKHRoaXMpLFxuICAgICAgICAndG9nZ2xlLnpmLnRyaWdnZXInOiB0aGlzLnRvZ2dsZS5iaW5kKHRoaXMpXG4gICAgICB9KTtcbiAgICAgIGlmICgkY2xvc2VyLmxlbmd0aCkge1xuICAgICAgICAkY2xvc2VyLnNob3coKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogT3BlbnMgdGhlIG9mZi1jYW52YXMgbWVudS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCAtIEV2ZW50IG9iamVjdCBwYXNzZWQgZnJvbSBsaXN0ZW5lci5cbiAgICogQHBhcmFtIHtqUXVlcnl9IHRyaWdnZXIgLSBlbGVtZW50IHRoYXQgdHJpZ2dlcmVkIHRoZSBvZmYtY2FudmFzIHRvIG9wZW4uXG4gICAqIEBmaXJlcyBPZmZDYW52YXMjb3BlbmVkXG4gICAqL1xuICBvcGVuKGV2ZW50LCB0cmlnZ2VyKSB7XG4gICAgaWYgKHRoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ2lzLW9wZW4nKSB8fCB0aGlzLmlzUmV2ZWFsZWQpIHsgcmV0dXJuOyB9XG4gICAgdmFyIF90aGlzID0gdGhpcyxcbiAgICAgICAgJGJvZHkgPSAkKGRvY3VtZW50LmJvZHkpO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5mb3JjZVRvcCkge1xuICAgICAgJCgnYm9keScpLnNjcm9sbFRvcCgwKTtcbiAgICB9XG4gICAgLy8gd2luZG93LnBhZ2VZT2Zmc2V0ID0gMDtcblxuICAgIC8vIGlmICghdGhpcy5vcHRpb25zLmZvcmNlVG9wKSB7XG4gICAgLy8gICB2YXIgc2Nyb2xsUG9zID0gcGFyc2VJbnQod2luZG93LnBhZ2VZT2Zmc2V0KTtcbiAgICAvLyAgIHRoaXMuJGVsZW1lbnRbMF0uc3R5bGUudHJhbnNmb3JtID0gJ3RyYW5zbGF0ZSgwLCcgKyBzY3JvbGxQb3MgKyAncHgpJztcbiAgICAvLyAgIGlmICh0aGlzLiRleGl0ZXIubGVuZ3RoKSB7XG4gICAgLy8gICAgIHRoaXMuJGV4aXRlclswXS5zdHlsZS50cmFuc2Zvcm0gPSAndHJhbnNsYXRlKDAsJyArIHNjcm9sbFBvcyArICdweCknO1xuICAgIC8vICAgfVxuICAgIC8vIH1cbiAgICAvKipcbiAgICAgKiBGaXJlcyB3aGVuIHRoZSBvZmYtY2FudmFzIG1lbnUgb3BlbnMuXG4gICAgICogQGV2ZW50IE9mZkNhbnZhcyNvcGVuZWRcbiAgICAgKi9cblxuICAgIHZhciAkd3JhcHBlciA9ICQoJ1tkYXRhLW9mZi1jYW52YXMtd3JhcHBlcl0nKTtcbiAgICAkd3JhcHBlci5hZGRDbGFzcygnaXMtb2ZmLWNhbnZhcy1vcGVuIGlzLW9wZW4tJysgX3RoaXMub3B0aW9ucy5wb3NpdGlvbik7XG5cbiAgICBfdGhpcy4kZWxlbWVudC5hZGRDbGFzcygnaXMtb3BlbicpXG5cbiAgICAgIC8vIGlmIChfdGhpcy5vcHRpb25zLmlzU3RpY2t5KSB7XG4gICAgICAvLyAgIF90aGlzLl9zdGljaygpO1xuICAgICAgLy8gfVxuXG4gICAgdGhpcy4kdHJpZ2dlcnMuYXR0cignYXJpYS1leHBhbmRlZCcsICd0cnVlJyk7XG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKCdhcmlhLWhpZGRlbicsICdmYWxzZScpXG4gICAgICAgIC50cmlnZ2VyKCdvcGVuZWQuemYub2ZmY2FudmFzJyk7XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmNsb3NlT25DbGljaykge1xuICAgICAgdGhpcy4kZXhpdGVyLmFkZENsYXNzKCdpcy12aXNpYmxlJyk7XG4gICAgfVxuXG4gICAgaWYgKHRyaWdnZXIpIHtcbiAgICAgIHRoaXMuJGxhc3RUcmlnZ2VyID0gdHJpZ2dlcjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmF1dG9Gb2N1cykge1xuICAgICAgJHdyYXBwZXIub25lKEZvdW5kYXRpb24udHJhbnNpdGlvbmVuZCgkd3JhcHBlciksIGZ1bmN0aW9uKCkge1xuICAgICAgICBpZihfdGhpcy4kZWxlbWVudC5oYXNDbGFzcygnaXMtb3BlbicpKSB7IC8vIGhhbmRsZSBkb3VibGUgY2xpY2tzXG4gICAgICAgICAgX3RoaXMuJGVsZW1lbnQuYXR0cigndGFiaW5kZXgnLCAnLTEnKTtcbiAgICAgICAgICBfdGhpcy4kZWxlbWVudC5mb2N1cygpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLnRyYXBGb2N1cykge1xuICAgICAgJHdyYXBwZXIub25lKEZvdW5kYXRpb24udHJhbnNpdGlvbmVuZCgkd3JhcHBlciksIGZ1bmN0aW9uKCkge1xuICAgICAgICBpZihfdGhpcy4kZWxlbWVudC5oYXNDbGFzcygnaXMtb3BlbicpKSB7IC8vIGhhbmRsZSBkb3VibGUgY2xpY2tzXG4gICAgICAgICAgX3RoaXMuJGVsZW1lbnQuYXR0cigndGFiaW5kZXgnLCAnLTEnKTtcbiAgICAgICAgICBfdGhpcy50cmFwRm9jdXMoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRyYXBzIGZvY3VzIHdpdGhpbiB0aGUgb2ZmY2FudmFzIG9uIG9wZW4uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfdHJhcEZvY3VzKCkge1xuICAgIHZhciBmb2N1c2FibGUgPSBGb3VuZGF0aW9uLktleWJvYXJkLmZpbmRGb2N1c2FibGUodGhpcy4kZWxlbWVudCksXG4gICAgICAgIGZpcnN0ID0gZm9jdXNhYmxlLmVxKDApLFxuICAgICAgICBsYXN0ID0gZm9jdXNhYmxlLmVxKC0xKTtcblxuICAgIGZvY3VzYWJsZS5vZmYoJy56Zi5vZmZjYW52YXMnKS5vbigna2V5ZG93bi56Zi5vZmZjYW52YXMnLCBmdW5jdGlvbihlKSB7XG4gICAgICB2YXIga2V5ID0gRm91bmRhdGlvbi5LZXlib2FyZC5wYXJzZUtleShlKTtcbiAgICAgIGlmIChrZXkgPT09ICdUQUInICYmIGUudGFyZ2V0ID09PSBsYXN0WzBdKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZmlyc3QuZm9jdXMoKTtcbiAgICAgIH1cbiAgICAgIGlmIChrZXkgPT09ICdTSElGVF9UQUInICYmIGUudGFyZ2V0ID09PSBmaXJzdFswXSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGxhc3QuZm9jdXMoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbGxvd3MgdGhlIG9mZmNhbnZhcyB0byBhcHBlYXIgc3RpY2t5IHV0aWxpemluZyB0cmFuc2xhdGUgcHJvcGVydGllcy5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIC8vIE9mZkNhbnZhcy5wcm90b3R5cGUuX3N0aWNrID0gZnVuY3Rpb24oKSB7XG4gIC8vICAgdmFyIGVsU3R5bGUgPSB0aGlzLiRlbGVtZW50WzBdLnN0eWxlO1xuICAvL1xuICAvLyAgIGlmICh0aGlzLm9wdGlvbnMuY2xvc2VPbkNsaWNrKSB7XG4gIC8vICAgICB2YXIgZXhpdFN0eWxlID0gdGhpcy4kZXhpdGVyWzBdLnN0eWxlO1xuICAvLyAgIH1cbiAgLy9cbiAgLy8gICAkKHdpbmRvdykub24oJ3Njcm9sbC56Zi5vZmZjYW52YXMnLCBmdW5jdGlvbihlKSB7XG4gIC8vICAgICBjb25zb2xlLmxvZyhlKTtcbiAgLy8gICAgIHZhciBwYWdlWSA9IHdpbmRvdy5wYWdlWU9mZnNldDtcbiAgLy8gICAgIGVsU3R5bGUudHJhbnNmb3JtID0gJ3RyYW5zbGF0ZSgwLCcgKyBwYWdlWSArICdweCknO1xuICAvLyAgICAgaWYgKGV4aXRTdHlsZSAhPT0gdW5kZWZpbmVkKSB7IGV4aXRTdHlsZS50cmFuc2Zvcm0gPSAndHJhbnNsYXRlKDAsJyArIHBhZ2VZICsgJ3B4KSc7IH1cbiAgLy8gICB9KTtcbiAgLy8gICAvLyB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ3N0dWNrLnpmLm9mZmNhbnZhcycpO1xuICAvLyB9O1xuICAvKipcbiAgICogQ2xvc2VzIHRoZSBvZmYtY2FudmFzIG1lbnUuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYiAtIG9wdGlvbmFsIGNiIHRvIGZpcmUgYWZ0ZXIgY2xvc3VyZS5cbiAgICogQGZpcmVzIE9mZkNhbnZhcyNjbG9zZWRcbiAgICovXG4gIGNsb3NlKGNiKSB7XG4gICAgaWYgKCF0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdpcy1vcGVuJykgfHwgdGhpcy5pc1JldmVhbGVkKSB7IHJldHVybjsgfVxuXG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIC8vICBGb3VuZGF0aW9uLk1vdmUodGhpcy5vcHRpb25zLnRyYW5zaXRpb25UaW1lLCB0aGlzLiRlbGVtZW50LCBmdW5jdGlvbigpIHtcbiAgICAkKCdbZGF0YS1vZmYtY2FudmFzLXdyYXBwZXJdJykucmVtb3ZlQ2xhc3MoYGlzLW9mZi1jYW52YXMtb3BlbiBpcy1vcGVuLSR7X3RoaXMub3B0aW9ucy5wb3NpdGlvbn1gKTtcbiAgICBfdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcygnaXMtb3BlbicpO1xuICAgICAgLy8gRm91bmRhdGlvbi5fcmVmbG93KCk7XG4gICAgLy8gfSk7XG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKCdhcmlhLWhpZGRlbicsICd0cnVlJylcbiAgICAgIC8qKlxuICAgICAgICogRmlyZXMgd2hlbiB0aGUgb2ZmLWNhbnZhcyBtZW51IG9wZW5zLlxuICAgICAgICogQGV2ZW50IE9mZkNhbnZhcyNjbG9zZWRcbiAgICAgICAqL1xuICAgICAgICAudHJpZ2dlcignY2xvc2VkLnpmLm9mZmNhbnZhcycpO1xuICAgIC8vIGlmIChfdGhpcy5vcHRpb25zLmlzU3RpY2t5IHx8ICFfdGhpcy5vcHRpb25zLmZvcmNlVG9wKSB7XG4gICAgLy8gICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgIC8vICAgICBfdGhpcy4kZWxlbWVudFswXS5zdHlsZS50cmFuc2Zvcm0gPSAnJztcbiAgICAvLyAgICAgJCh3aW5kb3cpLm9mZignc2Nyb2xsLnpmLm9mZmNhbnZhcycpO1xuICAgIC8vICAgfSwgdGhpcy5vcHRpb25zLnRyYW5zaXRpb25UaW1lKTtcbiAgICAvLyB9XG4gICAgaWYgKHRoaXMub3B0aW9ucy5jbG9zZU9uQ2xpY2spIHtcbiAgICAgIHRoaXMuJGV4aXRlci5yZW1vdmVDbGFzcygnaXMtdmlzaWJsZScpO1xuICAgIH1cblxuICAgIHRoaXMuJHRyaWdnZXJzLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCAnZmFsc2UnKTtcbiAgICBpZiAodGhpcy5vcHRpb25zLnRyYXBGb2N1cykge1xuICAgICAgJCgnW2RhdGEtb2ZmLWNhbnZhcy1jb250ZW50XScpLnJlbW92ZUF0dHIoJ3RhYmluZGV4Jyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRvZ2dsZXMgdGhlIG9mZi1jYW52YXMgbWVudSBvcGVuIG9yIGNsb3NlZC5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCAtIEV2ZW50IG9iamVjdCBwYXNzZWQgZnJvbSBsaXN0ZW5lci5cbiAgICogQHBhcmFtIHtqUXVlcnl9IHRyaWdnZXIgLSBlbGVtZW50IHRoYXQgdHJpZ2dlcmVkIHRoZSBvZmYtY2FudmFzIHRvIG9wZW4uXG4gICAqL1xuICB0b2dnbGUoZXZlbnQsIHRyaWdnZXIpIHtcbiAgICBpZiAodGhpcy4kZWxlbWVudC5oYXNDbGFzcygnaXMtb3BlbicpKSB7XG4gICAgICB0aGlzLmNsb3NlKGV2ZW50LCB0cmlnZ2VyKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB0aGlzLm9wZW4oZXZlbnQsIHRyaWdnZXIpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIGtleWJvYXJkIGlucHV0IHdoZW4gZGV0ZWN0ZWQuIFdoZW4gdGhlIGVzY2FwZSBrZXkgaXMgcHJlc3NlZCwgdGhlIG9mZi1jYW52YXMgbWVudSBjbG9zZXMsIGFuZCBmb2N1cyBpcyByZXN0b3JlZCB0byB0aGUgZWxlbWVudCB0aGF0IG9wZW5lZCB0aGUgbWVudS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaGFuZGxlS2V5Ym9hcmQoZSkge1xuICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQuaGFuZGxlS2V5KGUsICdPZmZDYW52YXMnLCB7XG4gICAgICBjbG9zZTogKCkgPT4ge1xuICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICAgIHRoaXMuJGxhc3RUcmlnZ2VyLmZvY3VzKCk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSxcbiAgICAgIGhhbmRsZWQ6ICgpID0+IHtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIHRoZSBvZmZjYW52YXMgcGx1Z2luLlxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIGRlc3Ryb3koKSB7XG4gICAgdGhpcy5jbG9zZSgpO1xuICAgIHRoaXMuJGVsZW1lbnQub2ZmKCcuemYudHJpZ2dlciAuemYub2ZmY2FudmFzJyk7XG4gICAgdGhpcy4kZXhpdGVyLm9mZignLnpmLm9mZmNhbnZhcycpO1xuXG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xuICB9XG59XG5cbk9mZkNhbnZhcy5kZWZhdWx0cyA9IHtcbiAgLyoqXG4gICAqIEFsbG93IHRoZSB1c2VyIHRvIGNsaWNrIG91dHNpZGUgb2YgdGhlIG1lbnUgdG8gY2xvc2UgaXQuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgdHJ1ZVxuICAgKi9cbiAgY2xvc2VPbkNsaWNrOiB0cnVlLFxuXG4gIC8qKlxuICAgKiBBbW91bnQgb2YgdGltZSBpbiBtcyB0aGUgb3BlbiBhbmQgY2xvc2UgdHJhbnNpdGlvbiByZXF1aXJlcy4gSWYgbm9uZSBzZWxlY3RlZCwgcHVsbHMgZnJvbSBib2R5IHN0eWxlLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIDUwMFxuICAgKi9cbiAgdHJhbnNpdGlvblRpbWU6IDAsXG5cbiAgLyoqXG4gICAqIERpcmVjdGlvbiB0aGUgb2ZmY2FudmFzIG9wZW5zIGZyb20uIERldGVybWluZXMgY2xhc3MgYXBwbGllZCB0byBib2R5LlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIGxlZnRcbiAgICovXG4gIHBvc2l0aW9uOiAnbGVmdCcsXG5cbiAgLyoqXG4gICAqIEZvcmNlIHRoZSBwYWdlIHRvIHNjcm9sbCB0byB0b3Agb24gb3Blbi5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSB0cnVlXG4gICAqL1xuICBmb3JjZVRvcDogdHJ1ZSxcblxuICAvKipcbiAgICogQWxsb3cgdGhlIG9mZmNhbnZhcyB0byByZW1haW4gb3BlbiBmb3IgY2VydGFpbiBicmVha3BvaW50cy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBmYWxzZVxuICAgKi9cbiAgaXNSZXZlYWxlZDogZmFsc2UsXG5cbiAgLyoqXG4gICAqIEJyZWFrcG9pbnQgYXQgd2hpY2ggdG8gcmV2ZWFsLiBKUyB3aWxsIHVzZSBhIFJlZ0V4cCB0byB0YXJnZXQgc3RhbmRhcmQgY2xhc3NlcywgaWYgY2hhbmdpbmcgY2xhc3NuYW1lcywgcGFzcyB5b3VyIGNsYXNzIHdpdGggdGhlIGByZXZlYWxDbGFzc2Agb3B0aW9uLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIHJldmVhbC1mb3ItbGFyZ2VcbiAgICovXG4gIHJldmVhbE9uOiBudWxsLFxuXG4gIC8qKlxuICAgKiBGb3JjZSBmb2N1cyB0byB0aGUgb2ZmY2FudmFzIG9uIG9wZW4uIElmIHRydWUsIHdpbGwgZm9jdXMgdGhlIG9wZW5pbmcgdHJpZ2dlciBvbiBjbG9zZS4gU2V0cyB0YWJpbmRleCBvZiBbZGF0YS1vZmYtY2FudmFzLWNvbnRlbnRdIHRvIC0xIGZvciBhY2Nlc3NpYmlsaXR5IHB1cnBvc2VzLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIHRydWVcbiAgICovXG4gIGF1dG9Gb2N1czogdHJ1ZSxcblxuICAvKipcbiAgICogQ2xhc3MgdXNlZCB0byBmb3JjZSBhbiBvZmZjYW52YXMgdG8gcmVtYWluIG9wZW4uIEZvdW5kYXRpb24gZGVmYXVsdHMgZm9yIHRoaXMgYXJlIGByZXZlYWwtZm9yLWxhcmdlYCAmIGByZXZlYWwtZm9yLW1lZGl1bWAuXG4gICAqIEBvcHRpb25cbiAgICogVE9ETyBpbXByb3ZlIHRoZSByZWdleCB0ZXN0aW5nIGZvciB0aGlzLlxuICAgKiBAZXhhbXBsZSByZXZlYWwtZm9yLWxhcmdlXG4gICAqL1xuICByZXZlYWxDbGFzczogJ3JldmVhbC1mb3ItJyxcblxuICAvKipcbiAgICogVHJpZ2dlcnMgb3B0aW9uYWwgZm9jdXMgdHJhcHBpbmcgd2hlbiBvcGVuaW5nIGFuIG9mZmNhbnZhcy4gU2V0cyB0YWJpbmRleCBvZiBbZGF0YS1vZmYtY2FudmFzLWNvbnRlbnRdIHRvIC0xIGZvciBhY2Nlc3NpYmlsaXR5IHB1cnBvc2VzLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIHRydWVcbiAgICovXG4gIHRyYXBGb2N1czogZmFsc2Vcbn1cblxuLy8gV2luZG93IGV4cG9ydHNcbkZvdW5kYXRpb24ucGx1Z2luKE9mZkNhbnZhcywgJ09mZkNhbnZhcycpO1xuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbi8qKlxuICogUmVzcG9uc2l2ZU1lbnUgbW9kdWxlLlxuICogQG1vZHVsZSBmb3VuZGF0aW9uLnJlc3BvbnNpdmVNZW51XG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLnRyaWdnZXJzXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm1lZGlhUXVlcnlcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwuYWNjb3JkaW9uTWVudVxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5kcmlsbGRvd25cbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwuZHJvcGRvd24tbWVudVxuICovXG5cbmNsYXNzIFJlc3BvbnNpdmVNZW51IHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgYSByZXNwb25zaXZlIG1lbnUuXG4gICAqIEBjbGFzc1xuICAgKiBAZmlyZXMgUmVzcG9uc2l2ZU1lbnUjaW5pdFxuICAgKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gbWFrZSBpbnRvIGEgZHJvcGRvd24gbWVudS5cbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPdmVycmlkZXMgdG8gdGhlIGRlZmF1bHQgcGx1Z2luIHNldHRpbmdzLlxuICAgKi9cbiAgY29uc3RydWN0b3IoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMuJGVsZW1lbnQgPSAkKGVsZW1lbnQpO1xuICAgIHRoaXMucnVsZXMgPSB0aGlzLiRlbGVtZW50LmRhdGEoJ3Jlc3BvbnNpdmUtbWVudScpO1xuICAgIHRoaXMuY3VycmVudE1xID0gbnVsbDtcbiAgICB0aGlzLmN1cnJlbnRQbHVnaW4gPSBudWxsO1xuXG4gICAgdGhpcy5faW5pdCgpO1xuICAgIHRoaXMuX2V2ZW50cygpO1xuXG4gICAgRm91bmRhdGlvbi5yZWdpc3RlclBsdWdpbih0aGlzLCAnUmVzcG9uc2l2ZU1lbnUnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgTWVudSBieSBwYXJzaW5nIHRoZSBjbGFzc2VzIGZyb20gdGhlICdkYXRhLVJlc3BvbnNpdmVNZW51JyBhdHRyaWJ1dGUgb24gdGhlIGVsZW1lbnQuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2luaXQoKSB7XG4gICAgLy8gVGhlIGZpcnN0IHRpbWUgYW4gSW50ZXJjaGFuZ2UgcGx1Z2luIGlzIGluaXRpYWxpemVkLCB0aGlzLnJ1bGVzIGlzIGNvbnZlcnRlZCBmcm9tIGEgc3RyaW5nIG9mIFwiY2xhc3Nlc1wiIHRvIGFuIG9iamVjdCBvZiBydWxlc1xuICAgIGlmICh0eXBlb2YgdGhpcy5ydWxlcyA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGxldCBydWxlc1RyZWUgPSB7fTtcblxuICAgICAgLy8gUGFyc2UgcnVsZXMgZnJvbSBcImNsYXNzZXNcIiBwdWxsZWQgZnJvbSBkYXRhIGF0dHJpYnV0ZVxuICAgICAgbGV0IHJ1bGVzID0gdGhpcy5ydWxlcy5zcGxpdCgnICcpO1xuXG4gICAgICAvLyBJdGVyYXRlIHRocm91Z2ggZXZlcnkgcnVsZSBmb3VuZFxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBydWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBsZXQgcnVsZSA9IHJ1bGVzW2ldLnNwbGl0KCctJyk7XG4gICAgICAgIGxldCBydWxlU2l6ZSA9IHJ1bGUubGVuZ3RoID4gMSA/IHJ1bGVbMF0gOiAnc21hbGwnO1xuICAgICAgICBsZXQgcnVsZVBsdWdpbiA9IHJ1bGUubGVuZ3RoID4gMSA/IHJ1bGVbMV0gOiBydWxlWzBdO1xuXG4gICAgICAgIGlmIChNZW51UGx1Z2luc1tydWxlUGx1Z2luXSAhPT0gbnVsbCkge1xuICAgICAgICAgIHJ1bGVzVHJlZVtydWxlU2l6ZV0gPSBNZW51UGx1Z2luc1tydWxlUGx1Z2luXTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0aGlzLnJ1bGVzID0gcnVsZXNUcmVlO1xuICAgIH1cblxuICAgIGlmICghJC5pc0VtcHR5T2JqZWN0KHRoaXMucnVsZXMpKSB7XG4gICAgICB0aGlzLl9jaGVja01lZGlhUXVlcmllcygpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyBldmVudHMgZm9yIHRoZSBNZW51LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9ldmVudHMoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICQod2luZG93KS5vbignY2hhbmdlZC56Zi5tZWRpYXF1ZXJ5JywgZnVuY3Rpb24oKSB7XG4gICAgICBfdGhpcy5fY2hlY2tNZWRpYVF1ZXJpZXMoKTtcbiAgICB9KTtcbiAgICAvLyAkKHdpbmRvdykub24oJ3Jlc2l6ZS56Zi5SZXNwb25zaXZlTWVudScsIGZ1bmN0aW9uKCkge1xuICAgIC8vICAgX3RoaXMuX2NoZWNrTWVkaWFRdWVyaWVzKCk7XG4gICAgLy8gfSk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHRoZSBjdXJyZW50IHNjcmVlbiB3aWR0aCBhZ2FpbnN0IGF2YWlsYWJsZSBtZWRpYSBxdWVyaWVzLiBJZiB0aGUgbWVkaWEgcXVlcnkgaGFzIGNoYW5nZWQsIGFuZCB0aGUgcGx1Z2luIG5lZWRlZCBoYXMgY2hhbmdlZCwgdGhlIHBsdWdpbnMgd2lsbCBzd2FwIG91dC5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfY2hlY2tNZWRpYVF1ZXJpZXMoKSB7XG4gICAgdmFyIG1hdGNoZWRNcSwgX3RoaXMgPSB0aGlzO1xuICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCBlYWNoIHJ1bGUgYW5kIGZpbmQgdGhlIGxhc3QgbWF0Y2hpbmcgcnVsZVxuICAgICQuZWFjaCh0aGlzLnJ1bGVzLCBmdW5jdGlvbihrZXkpIHtcbiAgICAgIGlmIChGb3VuZGF0aW9uLk1lZGlhUXVlcnkuYXRMZWFzdChrZXkpKSB7XG4gICAgICAgIG1hdGNoZWRNcSA9IGtleTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIE5vIG1hdGNoPyBObyBkaWNlXG4gICAgaWYgKCFtYXRjaGVkTXEpIHJldHVybjtcblxuICAgIC8vIFBsdWdpbiBhbHJlYWR5IGluaXRpYWxpemVkPyBXZSBnb29kXG4gICAgaWYgKHRoaXMuY3VycmVudFBsdWdpbiBpbnN0YW5jZW9mIHRoaXMucnVsZXNbbWF0Y2hlZE1xXS5wbHVnaW4pIHJldHVybjtcblxuICAgIC8vIFJlbW92ZSBleGlzdGluZyBwbHVnaW4tc3BlY2lmaWMgQ1NTIGNsYXNzZXNcbiAgICAkLmVhY2goTWVudVBsdWdpbnMsIGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcbiAgICAgIF90aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKHZhbHVlLmNzc0NsYXNzKTtcbiAgICB9KTtcblxuICAgIC8vIEFkZCB0aGUgQ1NTIGNsYXNzIGZvciB0aGUgbmV3IHBsdWdpblxuICAgIHRoaXMuJGVsZW1lbnQuYWRkQ2xhc3ModGhpcy5ydWxlc1ttYXRjaGVkTXFdLmNzc0NsYXNzKTtcblxuICAgIC8vIENyZWF0ZSBhbiBpbnN0YW5jZSBvZiB0aGUgbmV3IHBsdWdpblxuICAgIGlmICh0aGlzLmN1cnJlbnRQbHVnaW4pIHRoaXMuY3VycmVudFBsdWdpbi5kZXN0cm95KCk7XG4gICAgdGhpcy5jdXJyZW50UGx1Z2luID0gbmV3IHRoaXMucnVsZXNbbWF0Y2hlZE1xXS5wbHVnaW4odGhpcy4kZWxlbWVudCwge30pO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIHRoZSBpbnN0YW5jZSBvZiB0aGUgY3VycmVudCBwbHVnaW4gb24gdGhpcyBlbGVtZW50LCBhcyB3ZWxsIGFzIHRoZSB3aW5kb3cgcmVzaXplIGhhbmRsZXIgdGhhdCBzd2l0Y2hlcyB0aGUgcGx1Z2lucyBvdXQuXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLmN1cnJlbnRQbHVnaW4uZGVzdHJveSgpO1xuICAgICQod2luZG93KS5vZmYoJy56Zi5SZXNwb25zaXZlTWVudScpO1xuICAgIEZvdW5kYXRpb24udW5yZWdpc3RlclBsdWdpbih0aGlzKTtcbiAgfVxufVxuXG5SZXNwb25zaXZlTWVudS5kZWZhdWx0cyA9IHt9O1xuXG4vLyBUaGUgcGx1Z2luIG1hdGNoZXMgdGhlIHBsdWdpbiBjbGFzc2VzIHdpdGggdGhlc2UgcGx1Z2luIGluc3RhbmNlcy5cbnZhciBNZW51UGx1Z2lucyA9IHtcbiAgZHJvcGRvd246IHtcbiAgICBjc3NDbGFzczogJ2Ryb3Bkb3duJyxcbiAgICBwbHVnaW46IEZvdW5kYXRpb24uX3BsdWdpbnNbJ2Ryb3Bkb3duLW1lbnUnXSB8fCBudWxsXG4gIH0sXG4gZHJpbGxkb3duOiB7XG4gICAgY3NzQ2xhc3M6ICdkcmlsbGRvd24nLFxuICAgIHBsdWdpbjogRm91bmRhdGlvbi5fcGx1Z2luc1snZHJpbGxkb3duJ10gfHwgbnVsbFxuICB9LFxuICBhY2NvcmRpb246IHtcbiAgICBjc3NDbGFzczogJ2FjY29yZGlvbi1tZW51JyxcbiAgICBwbHVnaW46IEZvdW5kYXRpb24uX3BsdWdpbnNbJ2FjY29yZGlvbi1tZW51J10gfHwgbnVsbFxuICB9XG59O1xuXG4vLyBXaW5kb3cgZXhwb3J0c1xuRm91bmRhdGlvbi5wbHVnaW4oUmVzcG9uc2l2ZU1lbnUsICdSZXNwb25zaXZlTWVudScpO1xuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbi8qKlxuICogUmVzcG9uc2l2ZVRvZ2dsZSBtb2R1bGUuXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24ucmVzcG9uc2l2ZVRvZ2dsZVxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5tZWRpYVF1ZXJ5XG4gKi9cblxuY2xhc3MgUmVzcG9uc2l2ZVRvZ2dsZSB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIFRhYiBCYXIuXG4gICAqIEBjbGFzc1xuICAgKiBAZmlyZXMgUmVzcG9uc2l2ZVRvZ2dsZSNpbml0XG4gICAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBhdHRhY2ggdGFiIGJhciBmdW5jdGlvbmFsaXR5IHRvLlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE92ZXJyaWRlcyB0byB0aGUgZGVmYXVsdCBwbHVnaW4gc2V0dGluZ3MuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy4kZWxlbWVudCA9ICQoZWxlbWVudCk7XG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIFJlc3BvbnNpdmVUb2dnbGUuZGVmYXVsdHMsIHRoaXMuJGVsZW1lbnQuZGF0YSgpLCBvcHRpb25zKTtcblxuICAgIHRoaXMuX2luaXQoKTtcbiAgICB0aGlzLl9ldmVudHMoKTtcblxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcywgJ1Jlc3BvbnNpdmVUb2dnbGUnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgdGFiIGJhciBieSBmaW5kaW5nIHRoZSB0YXJnZXQgZWxlbWVudCwgdG9nZ2xpbmcgZWxlbWVudCwgYW5kIHJ1bm5pbmcgdXBkYXRlKCkuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2luaXQoKSB7XG4gICAgdmFyIHRhcmdldElEID0gdGhpcy4kZWxlbWVudC5kYXRhKCdyZXNwb25zaXZlLXRvZ2dsZScpO1xuICAgIGlmICghdGFyZ2V0SUQpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1lvdXIgdGFiIGJhciBuZWVkcyBhbiBJRCBvZiBhIE1lbnUgYXMgdGhlIHZhbHVlIG9mIGRhdGEtdGFiLWJhci4nKTtcbiAgICB9XG5cbiAgICB0aGlzLiR0YXJnZXRNZW51ID0gJChgIyR7dGFyZ2V0SUR9YCk7XG4gICAgdGhpcy4kdG9nZ2xlciA9IHRoaXMuJGVsZW1lbnQuZmluZCgnW2RhdGEtdG9nZ2xlXScpO1xuXG4gICAgdGhpcy5fdXBkYXRlKCk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBuZWNlc3NhcnkgZXZlbnQgaGFuZGxlcnMgZm9yIHRoZSB0YWIgYmFyIHRvIHdvcmsuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2V2ZW50cygpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgdGhpcy5fdXBkYXRlTXFIYW5kbGVyID0gdGhpcy5fdXBkYXRlLmJpbmQodGhpcyk7XG4gICAgXG4gICAgJCh3aW5kb3cpLm9uKCdjaGFuZ2VkLnpmLm1lZGlhcXVlcnknLCB0aGlzLl91cGRhdGVNcUhhbmRsZXIpO1xuXG4gICAgdGhpcy4kdG9nZ2xlci5vbignY2xpY2suemYucmVzcG9uc2l2ZVRvZ2dsZScsIHRoaXMudG9nZ2xlTWVudS5iaW5kKHRoaXMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgdGhlIGN1cnJlbnQgbWVkaWEgcXVlcnkgdG8gZGV0ZXJtaW5lIGlmIHRoZSB0YWIgYmFyIHNob3VsZCBiZSB2aXNpYmxlIG9yIGhpZGRlbi5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfdXBkYXRlKCkge1xuICAgIC8vIE1vYmlsZVxuICAgIGlmICghRm91bmRhdGlvbi5NZWRpYVF1ZXJ5LmF0TGVhc3QodGhpcy5vcHRpb25zLmhpZGVGb3IpKSB7XG4gICAgICB0aGlzLiRlbGVtZW50LnNob3coKTtcbiAgICAgIHRoaXMuJHRhcmdldE1lbnUuaGlkZSgpO1xuICAgIH1cblxuICAgIC8vIERlc2t0b3BcbiAgICBlbHNlIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQuaGlkZSgpO1xuICAgICAgdGhpcy4kdGFyZ2V0TWVudS5zaG93KCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRvZ2dsZXMgdGhlIGVsZW1lbnQgYXR0YWNoZWQgdG8gdGhlIHRhYiBiYXIuIFRoZSB0b2dnbGUgb25seSBoYXBwZW5zIGlmIHRoZSBzY3JlZW4gaXMgc21hbGwgZW5vdWdoIHRvIGFsbG93IGl0LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQGZpcmVzIFJlc3BvbnNpdmVUb2dnbGUjdG9nZ2xlZFxuICAgKi9cbiAgdG9nZ2xlTWVudSgpIHsgICBcbiAgICBpZiAoIUZvdW5kYXRpb24uTWVkaWFRdWVyeS5hdExlYXN0KHRoaXMub3B0aW9ucy5oaWRlRm9yKSkge1xuICAgICAgdGhpcy4kdGFyZ2V0TWVudS50b2dnbGUoMCk7XG5cbiAgICAgIC8qKlxuICAgICAgICogRmlyZXMgd2hlbiB0aGUgZWxlbWVudCBhdHRhY2hlZCB0byB0aGUgdGFiIGJhciB0b2dnbGVzLlxuICAgICAgICogQGV2ZW50IFJlc3BvbnNpdmVUb2dnbGUjdG9nZ2xlZFxuICAgICAgICovXG4gICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ3RvZ2dsZWQuemYucmVzcG9uc2l2ZVRvZ2dsZScpO1xuICAgIH1cbiAgfTtcblxuICBkZXN0cm95KCkge1xuICAgIHRoaXMuJGVsZW1lbnQub2ZmKCcuemYucmVzcG9uc2l2ZVRvZ2dsZScpO1xuICAgIHRoaXMuJHRvZ2dsZXIub2ZmKCcuemYucmVzcG9uc2l2ZVRvZ2dsZScpO1xuICAgIFxuICAgICQod2luZG93KS5vZmYoJ2NoYW5nZWQuemYubWVkaWFxdWVyeScsIHRoaXMuX3VwZGF0ZU1xSGFuZGxlcik7XG4gICAgXG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xuICB9XG59XG5cblJlc3BvbnNpdmVUb2dnbGUuZGVmYXVsdHMgPSB7XG4gIC8qKlxuICAgKiBUaGUgYnJlYWtwb2ludCBhZnRlciB3aGljaCB0aGUgbWVudSBpcyBhbHdheXMgc2hvd24sIGFuZCB0aGUgdGFiIGJhciBpcyBoaWRkZW4uXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgJ21lZGl1bSdcbiAgICovXG4gIGhpZGVGb3I6ICdtZWRpdW0nXG59O1xuXG4vLyBXaW5kb3cgZXhwb3J0c1xuRm91bmRhdGlvbi5wbHVnaW4oUmVzcG9uc2l2ZVRvZ2dsZSwgJ1Jlc3BvbnNpdmVUb2dnbGUnKTtcblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG4vKipcbiAqIFN0aWNreSBtb2R1bGUuXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24uc3RpY2t5XG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLnRyaWdnZXJzXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm1lZGlhUXVlcnlcbiAqL1xuXG5jbGFzcyBTdGlja3kge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBhIHN0aWNreSB0aGluZy5cbiAgICogQGNsYXNzXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBtYWtlIHN0aWNreS5cbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBvcHRpb25zIG9iamVjdCBwYXNzZWQgd2hlbiBjcmVhdGluZyB0aGUgZWxlbWVudCBwcm9ncmFtbWF0aWNhbGx5LlxuICAgKi9cbiAgY29uc3RydWN0b3IoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMuJGVsZW1lbnQgPSBlbGVtZW50O1xuICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBTdGlja3kuZGVmYXVsdHMsIHRoaXMuJGVsZW1lbnQuZGF0YSgpLCBvcHRpb25zKTtcblxuICAgIHRoaXMuX2luaXQoKTtcblxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcywgJ1N0aWNreScpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHRoZSBzdGlja3kgZWxlbWVudCBieSBhZGRpbmcgY2xhc3NlcywgZ2V0dGluZy9zZXR0aW5nIGRpbWVuc2lvbnMsIGJyZWFrcG9pbnRzIGFuZCBhdHRyaWJ1dGVzXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2luaXQoKSB7XG4gICAgdmFyICRwYXJlbnQgPSB0aGlzLiRlbGVtZW50LnBhcmVudCgnW2RhdGEtc3RpY2t5LWNvbnRhaW5lcl0nKSxcbiAgICAgICAgaWQgPSB0aGlzLiRlbGVtZW50WzBdLmlkIHx8IEZvdW5kYXRpb24uR2V0WW9EaWdpdHMoNiwgJ3N0aWNreScpLFxuICAgICAgICBfdGhpcyA9IHRoaXM7XG5cbiAgICBpZiAoISRwYXJlbnQubGVuZ3RoKSB7XG4gICAgICB0aGlzLndhc1dyYXBwZWQgPSB0cnVlO1xuICAgIH1cbiAgICB0aGlzLiRjb250YWluZXIgPSAkcGFyZW50Lmxlbmd0aCA/ICRwYXJlbnQgOiAkKHRoaXMub3B0aW9ucy5jb250YWluZXIpLndyYXBJbm5lcih0aGlzLiRlbGVtZW50KTtcbiAgICB0aGlzLiRjb250YWluZXIuYWRkQ2xhc3ModGhpcy5vcHRpb25zLmNvbnRhaW5lckNsYXNzKTtcblxuICAgIHRoaXMuJGVsZW1lbnQuYWRkQ2xhc3ModGhpcy5vcHRpb25zLnN0aWNreUNsYXNzKVxuICAgICAgICAgICAgICAgICAuYXR0cih7J2RhdGEtcmVzaXplJzogaWR9KTtcblxuICAgIHRoaXMuc2Nyb2xsQ291bnQgPSB0aGlzLm9wdGlvbnMuY2hlY2tFdmVyeTtcbiAgICB0aGlzLmlzU3R1Y2sgPSBmYWxzZTtcbiAgICAkKHdpbmRvdykub25lKCdsb2FkLnpmLnN0aWNreScsIGZ1bmN0aW9uKCl7XG4gICAgICAvL1dlIGNhbGN1bGF0ZSB0aGUgY29udGFpbmVyIGhlaWdodCB0byBoYXZlIGNvcnJlY3QgdmFsdWVzIGZvciBhbmNob3IgcG9pbnRzIG9mZnNldCBjYWxjdWxhdGlvbi5cbiAgICAgIF90aGlzLmNvbnRhaW5lckhlaWdodCA9IF90aGlzLiRlbGVtZW50LmNzcyhcImRpc3BsYXlcIikgPT0gXCJub25lXCIgPyAwIDogX3RoaXMuJGVsZW1lbnRbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkuaGVpZ2h0O1xuICAgICAgX3RoaXMuJGNvbnRhaW5lci5jc3MoJ2hlaWdodCcsIF90aGlzLmNvbnRhaW5lckhlaWdodCk7XG4gICAgICBfdGhpcy5lbGVtSGVpZ2h0ID0gX3RoaXMuY29udGFpbmVySGVpZ2h0O1xuICAgICAgaWYoX3RoaXMub3B0aW9ucy5hbmNob3IgIT09ICcnKXtcbiAgICAgICAgX3RoaXMuJGFuY2hvciA9ICQoJyMnICsgX3RoaXMub3B0aW9ucy5hbmNob3IpO1xuICAgICAgfWVsc2V7XG4gICAgICAgIF90aGlzLl9wYXJzZVBvaW50cygpO1xuICAgICAgfVxuXG4gICAgICBfdGhpcy5fc2V0U2l6ZXMoZnVuY3Rpb24oKXtcbiAgICAgICAgX3RoaXMuX2NhbGMoZmFsc2UpO1xuICAgICAgfSk7XG4gICAgICBfdGhpcy5fZXZlbnRzKGlkLnNwbGl0KCctJykucmV2ZXJzZSgpLmpvaW4oJy0nKSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSWYgdXNpbmcgbXVsdGlwbGUgZWxlbWVudHMgYXMgYW5jaG9ycywgY2FsY3VsYXRlcyB0aGUgdG9wIGFuZCBib3R0b20gcGl4ZWwgdmFsdWVzIHRoZSBzdGlja3kgdGhpbmcgc2hvdWxkIHN0aWNrIGFuZCB1bnN0aWNrIG9uLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9wYXJzZVBvaW50cygpIHtcbiAgICB2YXIgdG9wID0gdGhpcy5vcHRpb25zLnRvcEFuY2hvciA9PSBcIlwiID8gMSA6IHRoaXMub3B0aW9ucy50b3BBbmNob3IsXG4gICAgICAgIGJ0bSA9IHRoaXMub3B0aW9ucy5idG1BbmNob3I9PSBcIlwiID8gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbEhlaWdodCA6IHRoaXMub3B0aW9ucy5idG1BbmNob3IsXG4gICAgICAgIHB0cyA9IFt0b3AsIGJ0bV0sXG4gICAgICAgIGJyZWFrcyA9IHt9O1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBwdHMubGVuZ3RoOyBpIDwgbGVuICYmIHB0c1tpXTsgaSsrKSB7XG4gICAgICB2YXIgcHQ7XG4gICAgICBpZiAodHlwZW9mIHB0c1tpXSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgcHQgPSBwdHNbaV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgcGxhY2UgPSBwdHNbaV0uc3BsaXQoJzonKSxcbiAgICAgICAgICAgIGFuY2hvciA9ICQoYCMke3BsYWNlWzBdfWApO1xuXG4gICAgICAgIHB0ID0gYW5jaG9yLm9mZnNldCgpLnRvcDtcbiAgICAgICAgaWYgKHBsYWNlWzFdICYmIHBsYWNlWzFdLnRvTG93ZXJDYXNlKCkgPT09ICdib3R0b20nKSB7XG4gICAgICAgICAgcHQgKz0gYW5jaG9yWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmhlaWdodDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgYnJlYWtzW2ldID0gcHQ7XG4gICAgfVxuXG5cbiAgICB0aGlzLnBvaW50cyA9IGJyZWFrcztcbiAgICByZXR1cm47XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBldmVudCBoYW5kbGVycyBmb3IgdGhlIHNjcm9sbGluZyBlbGVtZW50LlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gaWQgLSBwc3VlZG8tcmFuZG9tIGlkIGZvciB1bmlxdWUgc2Nyb2xsIGV2ZW50IGxpc3RlbmVyLlxuICAgKi9cbiAgX2V2ZW50cyhpZCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXMsXG4gICAgICAgIHNjcm9sbExpc3RlbmVyID0gdGhpcy5zY3JvbGxMaXN0ZW5lciA9IGBzY3JvbGwuemYuJHtpZH1gO1xuICAgIGlmICh0aGlzLmlzT24pIHsgcmV0dXJuOyB9XG4gICAgaWYgKHRoaXMuY2FuU3RpY2spIHtcbiAgICAgIHRoaXMuaXNPbiA9IHRydWU7XG4gICAgICAkKHdpbmRvdykub2ZmKHNjcm9sbExpc3RlbmVyKVxuICAgICAgICAgICAgICAgLm9uKHNjcm9sbExpc3RlbmVyLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgIGlmIChfdGhpcy5zY3JvbGxDb3VudCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgIF90aGlzLnNjcm9sbENvdW50ID0gX3RoaXMub3B0aW9ucy5jaGVja0V2ZXJ5O1xuICAgICAgICAgICAgICAgICAgIF90aGlzLl9zZXRTaXplcyhmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgIF90aGlzLl9jYWxjKGZhbHNlLCB3aW5kb3cucGFnZVlPZmZzZXQpO1xuICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgIF90aGlzLnNjcm9sbENvdW50LS07XG4gICAgICAgICAgICAgICAgICAgX3RoaXMuX2NhbGMoZmFsc2UsIHdpbmRvdy5wYWdlWU9mZnNldCk7XG4gICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgdGhpcy4kZWxlbWVudC5vZmYoJ3Jlc2l6ZW1lLnpmLnRyaWdnZXInKVxuICAgICAgICAgICAgICAgICAub24oJ3Jlc2l6ZW1lLnpmLnRyaWdnZXInLCBmdW5jdGlvbihlLCBlbCkge1xuICAgICAgICAgICAgICAgICAgICAgX3RoaXMuX3NldFNpemVzKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5fY2FsYyhmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgICAgIGlmIChfdGhpcy5jYW5TdGljaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghX3RoaXMuaXNPbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuX2V2ZW50cyhpZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKF90aGlzLmlzT24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5fcGF1c2VMaXN0ZW5lcnMoc2Nyb2xsTGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIGV2ZW50IGhhbmRsZXJzIGZvciBzY3JvbGwgYW5kIGNoYW5nZSBldmVudHMgb24gYW5jaG9yLlxuICAgKiBAZmlyZXMgU3RpY2t5I3BhdXNlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBzY3JvbGxMaXN0ZW5lciAtIHVuaXF1ZSwgbmFtZXNwYWNlZCBzY3JvbGwgbGlzdGVuZXIgYXR0YWNoZWQgdG8gYHdpbmRvd2BcbiAgICovXG4gIF9wYXVzZUxpc3RlbmVycyhzY3JvbGxMaXN0ZW5lcikge1xuICAgIHRoaXMuaXNPbiA9IGZhbHNlO1xuICAgICQod2luZG93KS5vZmYoc2Nyb2xsTGlzdGVuZXIpO1xuXG4gICAgLyoqXG4gICAgICogRmlyZXMgd2hlbiB0aGUgcGx1Z2luIGlzIHBhdXNlZCBkdWUgdG8gcmVzaXplIGV2ZW50IHNocmlua2luZyB0aGUgdmlldy5cbiAgICAgKiBAZXZlbnQgU3RpY2t5I3BhdXNlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdwYXVzZS56Zi5zdGlja3knKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxsZWQgb24gZXZlcnkgYHNjcm9sbGAgZXZlbnQgYW5kIG9uIGBfaW5pdGBcbiAgICogZmlyZXMgZnVuY3Rpb25zIGJhc2VkIG9uIGJvb2xlYW5zIGFuZCBjYWNoZWQgdmFsdWVzXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gY2hlY2tTaXplcyAtIHRydWUgaWYgcGx1Z2luIHNob3VsZCByZWNhbGN1bGF0ZSBzaXplcyBhbmQgYnJlYWtwb2ludHMuXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBzY3JvbGwgLSBjdXJyZW50IHNjcm9sbCBwb3NpdGlvbiBwYXNzZWQgZnJvbSBzY3JvbGwgZXZlbnQgY2IgZnVuY3Rpb24uIElmIG5vdCBwYXNzZWQsIGRlZmF1bHRzIHRvIGB3aW5kb3cucGFnZVlPZmZzZXRgLlxuICAgKi9cbiAgX2NhbGMoY2hlY2tTaXplcywgc2Nyb2xsKSB7XG4gICAgaWYgKGNoZWNrU2l6ZXMpIHsgdGhpcy5fc2V0U2l6ZXMoKTsgfVxuXG4gICAgaWYgKCF0aGlzLmNhblN0aWNrKSB7XG4gICAgICBpZiAodGhpcy5pc1N0dWNrKSB7XG4gICAgICAgIHRoaXMuX3JlbW92ZVN0aWNreSh0cnVlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAoIXNjcm9sbCkgeyBzY3JvbGwgPSB3aW5kb3cucGFnZVlPZmZzZXQ7IH1cblxuICAgIGlmIChzY3JvbGwgPj0gdGhpcy50b3BQb2ludCkge1xuICAgICAgaWYgKHNjcm9sbCA8PSB0aGlzLmJvdHRvbVBvaW50KSB7XG4gICAgICAgIGlmICghdGhpcy5pc1N0dWNrKSB7XG4gICAgICAgICAgdGhpcy5fc2V0U3RpY2t5KCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0aGlzLmlzU3R1Y2spIHtcbiAgICAgICAgICB0aGlzLl9yZW1vdmVTdGlja3koZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0aGlzLmlzU3R1Y2spIHtcbiAgICAgICAgdGhpcy5fcmVtb3ZlU3RpY2t5KHRydWUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDYXVzZXMgdGhlICRlbGVtZW50IHRvIGJlY29tZSBzdHVjay5cbiAgICogQWRkcyBgcG9zaXRpb246IGZpeGVkO2AsIGFuZCBoZWxwZXIgY2xhc3Nlcy5cbiAgICogQGZpcmVzIFN0aWNreSNzdHVja3RvXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3NldFN0aWNreSgpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzLFxuICAgICAgICBzdGlja1RvID0gdGhpcy5vcHRpb25zLnN0aWNrVG8sXG4gICAgICAgIG1yZ24gPSBzdGlja1RvID09PSAndG9wJyA/ICdtYXJnaW5Ub3AnIDogJ21hcmdpbkJvdHRvbScsXG4gICAgICAgIG5vdFN0dWNrVG8gPSBzdGlja1RvID09PSAndG9wJyA/ICdib3R0b20nIDogJ3RvcCcsXG4gICAgICAgIGNzcyA9IHt9O1xuXG4gICAgY3NzW21yZ25dID0gYCR7dGhpcy5vcHRpb25zW21yZ25dfWVtYDtcbiAgICBjc3Nbc3RpY2tUb10gPSAwO1xuICAgIGNzc1tub3RTdHVja1RvXSA9ICdhdXRvJztcbiAgICBjc3NbJ2xlZnQnXSA9IHRoaXMuJGNvbnRhaW5lci5vZmZzZXQoKS5sZWZ0ICsgcGFyc2VJbnQod2luZG93LmdldENvbXB1dGVkU3R5bGUodGhpcy4kY29udGFpbmVyWzBdKVtcInBhZGRpbmctbGVmdFwiXSwgMTApO1xuICAgIHRoaXMuaXNTdHVjayA9IHRydWU7XG4gICAgdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcyhgaXMtYW5jaG9yZWQgaXMtYXQtJHtub3RTdHVja1RvfWApXG4gICAgICAgICAgICAgICAgIC5hZGRDbGFzcyhgaXMtc3R1Y2sgaXMtYXQtJHtzdGlja1RvfWApXG4gICAgICAgICAgICAgICAgIC5jc3MoY3NzKVxuICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICogRmlyZXMgd2hlbiB0aGUgJGVsZW1lbnQgaGFzIGJlY29tZSBgcG9zaXRpb246IGZpeGVkO2BcbiAgICAgICAgICAgICAgICAgICogTmFtZXNwYWNlZCB0byBgdG9wYCBvciBgYm90dG9tYCwgZS5nLiBgc3RpY2t5LnpmLnN0dWNrdG86dG9wYFxuICAgICAgICAgICAgICAgICAgKiBAZXZlbnQgU3RpY2t5I3N0dWNrdG9cbiAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgIC50cmlnZ2VyKGBzdGlja3kuemYuc3R1Y2t0bzoke3N0aWNrVG99YCk7XG4gICAgdGhpcy4kZWxlbWVudC5vbihcInRyYW5zaXRpb25lbmQgd2Via2l0VHJhbnNpdGlvbkVuZCBvVHJhbnNpdGlvbkVuZCBvdHJhbnNpdGlvbmVuZCBNU1RyYW5zaXRpb25FbmRcIiwgZnVuY3Rpb24oKSB7XG4gICAgICBfdGhpcy5fc2V0U2l6ZXMoKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYXVzZXMgdGhlICRlbGVtZW50IHRvIGJlY29tZSB1bnN0dWNrLlxuICAgKiBSZW1vdmVzIGBwb3NpdGlvbjogZml4ZWQ7YCwgYW5kIGhlbHBlciBjbGFzc2VzLlxuICAgKiBBZGRzIG90aGVyIGhlbHBlciBjbGFzc2VzLlxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IGlzVG9wIC0gdGVsbHMgdGhlIGZ1bmN0aW9uIGlmIHRoZSAkZWxlbWVudCBzaG91bGQgYW5jaG9yIHRvIHRoZSB0b3Agb3IgYm90dG9tIG9mIGl0cyAkYW5jaG9yIGVsZW1lbnQuXG4gICAqIEBmaXJlcyBTdGlja3kjdW5zdHVja2Zyb21cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9yZW1vdmVTdGlja3koaXNUb3ApIHtcbiAgICB2YXIgc3RpY2tUbyA9IHRoaXMub3B0aW9ucy5zdGlja1RvLFxuICAgICAgICBzdGlja1RvVG9wID0gc3RpY2tUbyA9PT0gJ3RvcCcsXG4gICAgICAgIGNzcyA9IHt9LFxuICAgICAgICBhbmNob3JQdCA9ICh0aGlzLnBvaW50cyA/IHRoaXMucG9pbnRzWzFdIC0gdGhpcy5wb2ludHNbMF0gOiB0aGlzLmFuY2hvckhlaWdodCkgLSB0aGlzLmVsZW1IZWlnaHQsXG4gICAgICAgIG1yZ24gPSBzdGlja1RvVG9wID8gJ21hcmdpblRvcCcgOiAnbWFyZ2luQm90dG9tJyxcbiAgICAgICAgbm90U3R1Y2tUbyA9IHN0aWNrVG9Ub3AgPyAnYm90dG9tJyA6ICd0b3AnLFxuICAgICAgICB0b3BPckJvdHRvbSA9IGlzVG9wID8gJ3RvcCcgOiAnYm90dG9tJztcblxuICAgIGNzc1ttcmduXSA9IDA7XG5cbiAgICBjc3NbJ2JvdHRvbSddID0gJ2F1dG8nO1xuICAgIGlmKGlzVG9wKSB7XG4gICAgICBjc3NbJ3RvcCddID0gMDtcbiAgICB9IGVsc2Uge1xuICAgICAgY3NzWyd0b3AnXSA9IGFuY2hvclB0O1xuICAgIH1cblxuICAgIGNzc1snbGVmdCddID0gJyc7XG4gICAgdGhpcy5pc1N0dWNrID0gZmFsc2U7XG4gICAgdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcyhgaXMtc3R1Y2sgaXMtYXQtJHtzdGlja1RvfWApXG4gICAgICAgICAgICAgICAgIC5hZGRDbGFzcyhgaXMtYW5jaG9yZWQgaXMtYXQtJHt0b3BPckJvdHRvbX1gKVxuICAgICAgICAgICAgICAgICAuY3NzKGNzcylcbiAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAqIEZpcmVzIHdoZW4gdGhlICRlbGVtZW50IGhhcyBiZWNvbWUgYW5jaG9yZWQuXG4gICAgICAgICAgICAgICAgICAqIE5hbWVzcGFjZWQgdG8gYHRvcGAgb3IgYGJvdHRvbWAsIGUuZy4gYHN0aWNreS56Zi51bnN0dWNrZnJvbTpib3R0b21gXG4gICAgICAgICAgICAgICAgICAqIEBldmVudCBTdGlja3kjdW5zdHVja2Zyb21cbiAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgIC50cmlnZ2VyKGBzdGlja3kuemYudW5zdHVja2Zyb206JHt0b3BPckJvdHRvbX1gKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSAkZWxlbWVudCBhbmQgJGNvbnRhaW5lciBzaXplcyBmb3IgcGx1Z2luLlxuICAgKiBDYWxscyBgX3NldEJyZWFrUG9pbnRzYC5cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgLSBvcHRpb25hbCBjYWxsYmFjayBmdW5jdGlvbiB0byBmaXJlIG9uIGNvbXBsZXRpb24gb2YgYF9zZXRCcmVha1BvaW50c2AuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfc2V0U2l6ZXMoY2IpIHtcbiAgICB0aGlzLmNhblN0aWNrID0gRm91bmRhdGlvbi5NZWRpYVF1ZXJ5LmF0TGVhc3QodGhpcy5vcHRpb25zLnN0aWNreU9uKTtcbiAgICBpZiAoIXRoaXMuY2FuU3RpY2spIHtcbiAgICAgIGlmIChjYiAmJiB0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpIHsgY2IoKTsgfVxuICAgIH1cbiAgICB2YXIgX3RoaXMgPSB0aGlzLFxuICAgICAgICBuZXdFbGVtV2lkdGggPSB0aGlzLiRjb250YWluZXJbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkud2lkdGgsXG4gICAgICAgIGNvbXAgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzLiRjb250YWluZXJbMF0pLFxuICAgICAgICBwZG5nID0gcGFyc2VJbnQoY29tcFsncGFkZGluZy1yaWdodCddLCAxMCk7XG5cbiAgICBpZiAodGhpcy4kYW5jaG9yICYmIHRoaXMuJGFuY2hvci5sZW5ndGgpIHtcbiAgICAgIHRoaXMuYW5jaG9ySGVpZ2h0ID0gdGhpcy4kYW5jaG9yWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmhlaWdodDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fcGFyc2VQb2ludHMoKTtcbiAgICB9XG5cbiAgICB0aGlzLiRlbGVtZW50LmNzcyh7XG4gICAgICAnbWF4LXdpZHRoJzogYCR7bmV3RWxlbVdpZHRoIC0gcGRuZ31weGBcbiAgICB9KTtcblxuICAgIHZhciBuZXdDb250YWluZXJIZWlnaHQgPSB0aGlzLiRlbGVtZW50WzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmhlaWdodCB8fCB0aGlzLmNvbnRhaW5lckhlaWdodDtcbiAgICBpZiAodGhpcy4kZWxlbWVudC5jc3MoXCJkaXNwbGF5XCIpID09IFwibm9uZVwiKSB7XG4gICAgICBuZXdDb250YWluZXJIZWlnaHQgPSAwO1xuICAgIH1cbiAgICB0aGlzLmNvbnRhaW5lckhlaWdodCA9IG5ld0NvbnRhaW5lckhlaWdodDtcbiAgICB0aGlzLiRjb250YWluZXIuY3NzKHtcbiAgICAgIGhlaWdodDogbmV3Q29udGFpbmVySGVpZ2h0XG4gICAgfSk7XG4gICAgdGhpcy5lbGVtSGVpZ2h0ID0gbmV3Q29udGFpbmVySGVpZ2h0O1xuXG4gICAgaWYgKHRoaXMuaXNTdHVjaykge1xuICAgICAgdGhpcy4kZWxlbWVudC5jc3Moe1wibGVmdFwiOnRoaXMuJGNvbnRhaW5lci5vZmZzZXQoKS5sZWZ0ICsgcGFyc2VJbnQoY29tcFsncGFkZGluZy1sZWZ0J10sIDEwKX0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodGhpcy4kZWxlbWVudC5oYXNDbGFzcygnaXMtYXQtYm90dG9tJykpIHtcbiAgICAgICAgdmFyIGFuY2hvclB0ID0gKHRoaXMucG9pbnRzID8gdGhpcy5wb2ludHNbMV0gLSB0aGlzLiRjb250YWluZXIub2Zmc2V0KCkudG9wIDogdGhpcy5hbmNob3JIZWlnaHQpIC0gdGhpcy5lbGVtSGVpZ2h0O1xuICAgICAgICB0aGlzLiRlbGVtZW50LmNzcygndG9wJywgYW5jaG9yUHQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuX3NldEJyZWFrUG9pbnRzKG5ld0NvbnRhaW5lckhlaWdodCwgZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoY2IgJiYgdHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSB7IGNiKCk7IH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB1cHBlciBhbmQgbG93ZXIgYnJlYWtwb2ludHMgZm9yIHRoZSBlbGVtZW50IHRvIGJlY29tZSBzdGlja3kvdW5zdGlja3kuXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBlbGVtSGVpZ2h0IC0gcHggdmFsdWUgZm9yIHN0aWNreS4kZWxlbWVudCBoZWlnaHQsIGNhbGN1bGF0ZWQgYnkgYF9zZXRTaXplc2AuXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNiIC0gb3B0aW9uYWwgY2FsbGJhY2sgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIG9uIGNvbXBsZXRpb24uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfc2V0QnJlYWtQb2ludHMoZWxlbUhlaWdodCwgY2IpIHtcbiAgICBpZiAoIXRoaXMuY2FuU3RpY2spIHtcbiAgICAgIGlmIChjYiAmJiB0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpIHsgY2IoKTsgfVxuICAgICAgZWxzZSB7IHJldHVybiBmYWxzZTsgfVxuICAgIH1cbiAgICB2YXIgbVRvcCA9IGVtQ2FsYyh0aGlzLm9wdGlvbnMubWFyZ2luVG9wKSxcbiAgICAgICAgbUJ0bSA9IGVtQ2FsYyh0aGlzLm9wdGlvbnMubWFyZ2luQm90dG9tKSxcbiAgICAgICAgdG9wUG9pbnQgPSB0aGlzLnBvaW50cyA/IHRoaXMucG9pbnRzWzBdIDogdGhpcy4kYW5jaG9yLm9mZnNldCgpLnRvcCxcbiAgICAgICAgYm90dG9tUG9pbnQgPSB0aGlzLnBvaW50cyA/IHRoaXMucG9pbnRzWzFdIDogdG9wUG9pbnQgKyB0aGlzLmFuY2hvckhlaWdodCxcbiAgICAgICAgLy8gdG9wUG9pbnQgPSB0aGlzLiRhbmNob3Iub2Zmc2V0KCkudG9wIHx8IHRoaXMucG9pbnRzWzBdLFxuICAgICAgICAvLyBib3R0b21Qb2ludCA9IHRvcFBvaW50ICsgdGhpcy5hbmNob3JIZWlnaHQgfHwgdGhpcy5wb2ludHNbMV0sXG4gICAgICAgIHdpbkhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMuc3RpY2tUbyA9PT0gJ3RvcCcpIHtcbiAgICAgIHRvcFBvaW50IC09IG1Ub3A7XG4gICAgICBib3R0b21Qb2ludCAtPSAoZWxlbUhlaWdodCArIG1Ub3ApO1xuICAgIH0gZWxzZSBpZiAodGhpcy5vcHRpb25zLnN0aWNrVG8gPT09ICdib3R0b20nKSB7XG4gICAgICB0b3BQb2ludCAtPSAod2luSGVpZ2h0IC0gKGVsZW1IZWlnaHQgKyBtQnRtKSk7XG4gICAgICBib3R0b21Qb2ludCAtPSAod2luSGVpZ2h0IC0gbUJ0bSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vdGhpcyB3b3VsZCBiZSB0aGUgc3RpY2tUbzogYm90aCBvcHRpb24uLi4gdHJpY2t5XG4gICAgfVxuXG4gICAgdGhpcy50b3BQb2ludCA9IHRvcFBvaW50O1xuICAgIHRoaXMuYm90dG9tUG9pbnQgPSBib3R0b21Qb2ludDtcblxuICAgIGlmIChjYiAmJiB0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpIHsgY2IoKTsgfVxuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIHRoZSBjdXJyZW50IHN0aWNreSBlbGVtZW50LlxuICAgKiBSZXNldHMgdGhlIGVsZW1lbnQgdG8gdGhlIHRvcCBwb3NpdGlvbiBmaXJzdC5cbiAgICogUmVtb3ZlcyBldmVudCBsaXN0ZW5lcnMsIEpTLWFkZGVkIGNzcyBwcm9wZXJ0aWVzIGFuZCBjbGFzc2VzLCBhbmQgdW53cmFwcyB0aGUgJGVsZW1lbnQgaWYgdGhlIEpTIGFkZGVkIHRoZSAkY29udGFpbmVyLlxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIGRlc3Ryb3koKSB7XG4gICAgdGhpcy5fcmVtb3ZlU3RpY2t5KHRydWUpO1xuXG4gICAgdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcyhgJHt0aGlzLm9wdGlvbnMuc3RpY2t5Q2xhc3N9IGlzLWFuY2hvcmVkIGlzLWF0LXRvcGApXG4gICAgICAgICAgICAgICAgIC5jc3Moe1xuICAgICAgICAgICAgICAgICAgIGhlaWdodDogJycsXG4gICAgICAgICAgICAgICAgICAgdG9wOiAnJyxcbiAgICAgICAgICAgICAgICAgICBib3R0b206ICcnLFxuICAgICAgICAgICAgICAgICAgICdtYXgtd2lkdGgnOiAnJ1xuICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAub2ZmKCdyZXNpemVtZS56Zi50cmlnZ2VyJyk7XG4gICAgaWYgKHRoaXMuJGFuY2hvciAmJiB0aGlzLiRhbmNob3IubGVuZ3RoKSB7XG4gICAgICB0aGlzLiRhbmNob3Iub2ZmKCdjaGFuZ2UuemYuc3RpY2t5Jyk7XG4gICAgfVxuICAgICQod2luZG93KS5vZmYodGhpcy5zY3JvbGxMaXN0ZW5lcik7XG5cbiAgICBpZiAodGhpcy53YXNXcmFwcGVkKSB7XG4gICAgICB0aGlzLiRlbGVtZW50LnVud3JhcCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLiRjb250YWluZXIucmVtb3ZlQ2xhc3ModGhpcy5vcHRpb25zLmNvbnRhaW5lckNsYXNzKVxuICAgICAgICAgICAgICAgICAgICAgLmNzcyh7XG4gICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogJydcbiAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgIH1cbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XG4gIH1cbn1cblxuU3RpY2t5LmRlZmF1bHRzID0ge1xuICAvKipcbiAgICogQ3VzdG9taXphYmxlIGNvbnRhaW5lciB0ZW1wbGF0ZS4gQWRkIHlvdXIgb3duIGNsYXNzZXMgZm9yIHN0eWxpbmcgYW5kIHNpemluZy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAnJmx0O2RpdiBkYXRhLXN0aWNreS1jb250YWluZXIgY2xhc3M9XCJzbWFsbC02IGNvbHVtbnNcIiZndDsmbHQ7L2RpdiZndDsnXG4gICAqL1xuICBjb250YWluZXI6ICc8ZGl2IGRhdGEtc3RpY2t5LWNvbnRhaW5lcj48L2Rpdj4nLFxuICAvKipcbiAgICogTG9jYXRpb24gaW4gdGhlIHZpZXcgdGhlIGVsZW1lbnQgc3RpY2tzIHRvLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlICd0b3AnXG4gICAqL1xuICBzdGlja1RvOiAndG9wJyxcbiAgLyoqXG4gICAqIElmIGFuY2hvcmVkIHRvIGEgc2luZ2xlIGVsZW1lbnQsIHRoZSBpZCBvZiB0aGF0IGVsZW1lbnQuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgJ2V4YW1wbGVJZCdcbiAgICovXG4gIGFuY2hvcjogJycsXG4gIC8qKlxuICAgKiBJZiB1c2luZyBtb3JlIHRoYW4gb25lIGVsZW1lbnQgYXMgYW5jaG9yIHBvaW50cywgdGhlIGlkIG9mIHRoZSB0b3AgYW5jaG9yLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlICdleGFtcGxlSWQ6dG9wJ1xuICAgKi9cbiAgdG9wQW5jaG9yOiAnJyxcbiAgLyoqXG4gICAqIElmIHVzaW5nIG1vcmUgdGhhbiBvbmUgZWxlbWVudCBhcyBhbmNob3IgcG9pbnRzLCB0aGUgaWQgb2YgdGhlIGJvdHRvbSBhbmNob3IuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgJ2V4YW1wbGVJZDpib3R0b20nXG4gICAqL1xuICBidG1BbmNob3I6ICcnLFxuICAvKipcbiAgICogTWFyZ2luLCBpbiBgZW1gJ3MgdG8gYXBwbHkgdG8gdGhlIHRvcCBvZiB0aGUgZWxlbWVudCB3aGVuIGl0IGJlY29tZXMgc3RpY2t5LlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIDFcbiAgICovXG4gIG1hcmdpblRvcDogMSxcbiAgLyoqXG4gICAqIE1hcmdpbiwgaW4gYGVtYCdzIHRvIGFwcGx5IHRvIHRoZSBib3R0b20gb2YgdGhlIGVsZW1lbnQgd2hlbiBpdCBiZWNvbWVzIHN0aWNreS5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAxXG4gICAqL1xuICBtYXJnaW5Cb3R0b206IDEsXG4gIC8qKlxuICAgKiBCcmVha3BvaW50IHN0cmluZyB0aGF0IGlzIHRoZSBtaW5pbXVtIHNjcmVlbiBzaXplIGFuIGVsZW1lbnQgc2hvdWxkIGJlY29tZSBzdGlja3kuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgJ21lZGl1bSdcbiAgICovXG4gIHN0aWNreU9uOiAnbWVkaXVtJyxcbiAgLyoqXG4gICAqIENsYXNzIGFwcGxpZWQgdG8gc3RpY2t5IGVsZW1lbnQsIGFuZCByZW1vdmVkIG9uIGRlc3RydWN0aW9uLiBGb3VuZGF0aW9uIGRlZmF1bHRzIHRvIGBzdGlja3lgLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlICdzdGlja3knXG4gICAqL1xuICBzdGlja3lDbGFzczogJ3N0aWNreScsXG4gIC8qKlxuICAgKiBDbGFzcyBhcHBsaWVkIHRvIHN0aWNreSBjb250YWluZXIuIEZvdW5kYXRpb24gZGVmYXVsdHMgdG8gYHN0aWNreS1jb250YWluZXJgLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlICdzdGlja3ktY29udGFpbmVyJ1xuICAgKi9cbiAgY29udGFpbmVyQ2xhc3M6ICdzdGlja3ktY29udGFpbmVyJyxcbiAgLyoqXG4gICAqIE51bWJlciBvZiBzY3JvbGwgZXZlbnRzIGJldHdlZW4gdGhlIHBsdWdpbidzIHJlY2FsY3VsYXRpbmcgc3RpY2t5IHBvaW50cy4gU2V0dGluZyBpdCB0byBgMGAgd2lsbCBjYXVzZSBpdCB0byByZWNhbGMgZXZlcnkgc2Nyb2xsIGV2ZW50LCBzZXR0aW5nIGl0IHRvIGAtMWAgd2lsbCBwcmV2ZW50IHJlY2FsYyBvbiBzY3JvbGwuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgNTBcbiAgICovXG4gIGNoZWNrRXZlcnk6IC0xXG59O1xuXG4vKipcbiAqIEhlbHBlciBmdW5jdGlvbiB0byBjYWxjdWxhdGUgZW0gdmFsdWVzXG4gKiBAcGFyYW0gTnVtYmVyIHtlbX0gLSBudW1iZXIgb2YgZW0ncyB0byBjYWxjdWxhdGUgaW50byBwaXhlbHNcbiAqL1xuZnVuY3Rpb24gZW1DYWxjKGVtKSB7XG4gIHJldHVybiBwYXJzZUludCh3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShkb2N1bWVudC5ib2R5LCBudWxsKS5mb250U2l6ZSwgMTApICogZW07XG59XG5cbi8vIFdpbmRvdyBleHBvcnRzXG5Gb3VuZGF0aW9uLnBsdWdpbihTdGlja3ksICdTdGlja3knKTtcblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG4vKipcbiAqIFRvZ2dsZXIgbW9kdWxlLlxuICogQG1vZHVsZSBmb3VuZGF0aW9uLnRvZ2dsZXJcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubW90aW9uXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLnRyaWdnZXJzXG4gKi9cblxuY2xhc3MgVG9nZ2xlciB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIFRvZ2dsZXIuXG4gICAqIEBjbGFzc1xuICAgKiBAZmlyZXMgVG9nZ2xlciNpbml0XG4gICAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBhZGQgdGhlIHRyaWdnZXIgdG8uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRlbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgVG9nZ2xlci5kZWZhdWx0cywgZWxlbWVudC5kYXRhKCksIG9wdGlvbnMpO1xuICAgIHRoaXMuY2xhc3NOYW1lID0gJyc7XG5cbiAgICB0aGlzLl9pbml0KCk7XG4gICAgdGhpcy5fZXZlbnRzKCk7XG5cbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdUb2dnbGVyJyk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIFRvZ2dsZXIgcGx1Z2luIGJ5IHBhcnNpbmcgdGhlIHRvZ2dsZSBjbGFzcyBmcm9tIGRhdGEtdG9nZ2xlciwgb3IgYW5pbWF0aW9uIGNsYXNzZXMgZnJvbSBkYXRhLWFuaW1hdGUuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2luaXQoKSB7XG4gICAgdmFyIGlucHV0O1xuICAgIC8vIFBhcnNlIGFuaW1hdGlvbiBjbGFzc2VzIGlmIHRoZXkgd2VyZSBzZXRcbiAgICBpZiAodGhpcy5vcHRpb25zLmFuaW1hdGUpIHtcbiAgICAgIGlucHV0ID0gdGhpcy5vcHRpb25zLmFuaW1hdGUuc3BsaXQoJyAnKTtcblxuICAgICAgdGhpcy5hbmltYXRpb25JbiA9IGlucHV0WzBdO1xuICAgICAgdGhpcy5hbmltYXRpb25PdXQgPSBpbnB1dFsxXSB8fCBudWxsO1xuICAgIH1cbiAgICAvLyBPdGhlcndpc2UsIHBhcnNlIHRvZ2dsZSBjbGFzc1xuICAgIGVsc2Uge1xuICAgICAgaW5wdXQgPSB0aGlzLiRlbGVtZW50LmRhdGEoJ3RvZ2dsZXInKTtcbiAgICAgIC8vIEFsbG93IGZvciBhIC4gYXQgdGhlIGJlZ2lubmluZyBvZiB0aGUgc3RyaW5nXG4gICAgICB0aGlzLmNsYXNzTmFtZSA9IGlucHV0WzBdID09PSAnLicgPyBpbnB1dC5zbGljZSgxKSA6IGlucHV0O1xuICAgIH1cblxuICAgIC8vIEFkZCBBUklBIGF0dHJpYnV0ZXMgdG8gdHJpZ2dlcnNcbiAgICB2YXIgaWQgPSB0aGlzLiRlbGVtZW50WzBdLmlkO1xuICAgICQoYFtkYXRhLW9wZW49XCIke2lkfVwiXSwgW2RhdGEtY2xvc2U9XCIke2lkfVwiXSwgW2RhdGEtdG9nZ2xlPVwiJHtpZH1cIl1gKVxuICAgICAgLmF0dHIoJ2FyaWEtY29udHJvbHMnLCBpZCk7XG4gICAgLy8gSWYgdGhlIHRhcmdldCBpcyBoaWRkZW4sIGFkZCBhcmlhLWhpZGRlblxuICAgIHRoaXMuJGVsZW1lbnQuYXR0cignYXJpYS1leHBhbmRlZCcsIHRoaXMuJGVsZW1lbnQuaXMoJzpoaWRkZW4nKSA/IGZhbHNlIDogdHJ1ZSk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgZXZlbnRzIGZvciB0aGUgdG9nZ2xlIHRyaWdnZXIuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2V2ZW50cygpIHtcbiAgICB0aGlzLiRlbGVtZW50Lm9mZigndG9nZ2xlLnpmLnRyaWdnZXInKS5vbigndG9nZ2xlLnpmLnRyaWdnZXInLCB0aGlzLnRvZ2dsZS5iaW5kKHRoaXMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUb2dnbGVzIHRoZSB0YXJnZXQgY2xhc3Mgb24gdGhlIHRhcmdldCBlbGVtZW50LiBBbiBldmVudCBpcyBmaXJlZCBmcm9tIHRoZSBvcmlnaW5hbCB0cmlnZ2VyIGRlcGVuZGluZyBvbiBpZiB0aGUgcmVzdWx0YW50IHN0YXRlIHdhcyBcIm9uXCIgb3IgXCJvZmZcIi5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBmaXJlcyBUb2dnbGVyI29uXG4gICAqIEBmaXJlcyBUb2dnbGVyI29mZlxuICAgKi9cbiAgdG9nZ2xlKCkge1xuICAgIHRoaXNbIHRoaXMub3B0aW9ucy5hbmltYXRlID8gJ190b2dnbGVBbmltYXRlJyA6ICdfdG9nZ2xlQ2xhc3MnXSgpO1xuICB9XG5cbiAgX3RvZ2dsZUNsYXNzKCkge1xuICAgIHRoaXMuJGVsZW1lbnQudG9nZ2xlQ2xhc3ModGhpcy5jbGFzc05hbWUpO1xuXG4gICAgdmFyIGlzT24gPSB0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKHRoaXMuY2xhc3NOYW1lKTtcbiAgICBpZiAoaXNPbikge1xuICAgICAgLyoqXG4gICAgICAgKiBGaXJlcyBpZiB0aGUgdGFyZ2V0IGVsZW1lbnQgaGFzIHRoZSBjbGFzcyBhZnRlciBhIHRvZ2dsZS5cbiAgICAgICAqIEBldmVudCBUb2dnbGVyI29uXG4gICAgICAgKi9cbiAgICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignb24uemYudG9nZ2xlcicpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIC8qKlxuICAgICAgICogRmlyZXMgaWYgdGhlIHRhcmdldCBlbGVtZW50IGRvZXMgbm90IGhhdmUgdGhlIGNsYXNzIGFmdGVyIGEgdG9nZ2xlLlxuICAgICAgICogQGV2ZW50IFRvZ2dsZXIjb2ZmXG4gICAgICAgKi9cbiAgICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignb2ZmLnpmLnRvZ2dsZXInKTtcbiAgICB9XG5cbiAgICB0aGlzLl91cGRhdGVBUklBKGlzT24pO1xuICB9XG5cbiAgX3RvZ2dsZUFuaW1hdGUoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIGlmICh0aGlzLiRlbGVtZW50LmlzKCc6aGlkZGVuJykpIHtcbiAgICAgIEZvdW5kYXRpb24uTW90aW9uLmFuaW1hdGVJbih0aGlzLiRlbGVtZW50LCB0aGlzLmFuaW1hdGlvbkluLCBmdW5jdGlvbigpIHtcbiAgICAgICAgX3RoaXMuX3VwZGF0ZUFSSUEodHJ1ZSk7XG4gICAgICAgIHRoaXMudHJpZ2dlcignb24uemYudG9nZ2xlcicpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgRm91bmRhdGlvbi5Nb3Rpb24uYW5pbWF0ZU91dCh0aGlzLiRlbGVtZW50LCB0aGlzLmFuaW1hdGlvbk91dCwgZnVuY3Rpb24oKSB7XG4gICAgICAgIF90aGlzLl91cGRhdGVBUklBKGZhbHNlKTtcbiAgICAgICAgdGhpcy50cmlnZ2VyKCdvZmYuemYudG9nZ2xlcicpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgX3VwZGF0ZUFSSUEoaXNPbikge1xuICAgIHRoaXMuJGVsZW1lbnQuYXR0cignYXJpYS1leHBhbmRlZCcsIGlzT24gPyB0cnVlIDogZmFsc2UpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIHRoZSBpbnN0YW5jZSBvZiBUb2dnbGVyIG9uIHRoZSBlbGVtZW50LlxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIGRlc3Ryb3koKSB7XG4gICAgdGhpcy4kZWxlbWVudC5vZmYoJy56Zi50b2dnbGVyJyk7XG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xuICB9XG59XG5cblRvZ2dsZXIuZGVmYXVsdHMgPSB7XG4gIC8qKlxuICAgKiBUZWxscyB0aGUgcGx1Z2luIGlmIHRoZSBlbGVtZW50IHNob3VsZCBhbmltYXRlZCB3aGVuIHRvZ2dsZWQuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgZmFsc2VcbiAgICovXG4gIGFuaW1hdGU6IGZhbHNlXG59O1xuXG4vLyBXaW5kb3cgZXhwb3J0c1xuRm91bmRhdGlvbi5wbHVnaW4oVG9nZ2xlciwgJ1RvZ2dsZXInKTtcblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vLyBQb2x5ZmlsbCBmb3IgcmVxdWVzdEFuaW1hdGlvbkZyYW1lXG4oZnVuY3Rpb24oKSB7XG4gIGlmICghRGF0ZS5ub3cpXG4gICAgRGF0ZS5ub3cgPSBmdW5jdGlvbigpIHsgcmV0dXJuIG5ldyBEYXRlKCkuZ2V0VGltZSgpOyB9O1xuXG4gIHZhciB2ZW5kb3JzID0gWyd3ZWJraXQnLCAnbW96J107XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdmVuZG9ycy5sZW5ndGggJiYgIXdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWU7ICsraSkge1xuICAgICAgdmFyIHZwID0gdmVuZG9yc1tpXTtcbiAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSB3aW5kb3dbdnArJ1JlcXVlc3RBbmltYXRpb25GcmFtZSddO1xuICAgICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lID0gKHdpbmRvd1t2cCsnQ2FuY2VsQW5pbWF0aW9uRnJhbWUnXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfHwgd2luZG93W3ZwKydDYW5jZWxSZXF1ZXN0QW5pbWF0aW9uRnJhbWUnXSk7XG4gIH1cbiAgaWYgKC9pUChhZHxob25lfG9kKS4qT1MgNi8udGVzdCh3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudClcbiAgICB8fCAhd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCAhd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKSB7XG4gICAgdmFyIGxhc3RUaW1lID0gMDtcbiAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIG5vdyA9IERhdGUubm93KCk7XG4gICAgICAgIHZhciBuZXh0VGltZSA9IE1hdGgubWF4KGxhc3RUaW1lICsgMTYsIG5vdyk7XG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBjYWxsYmFjayhsYXN0VGltZSA9IG5leHRUaW1lKTsgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbmV4dFRpbWUgLSBub3cpO1xuICAgIH07XG4gICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lID0gY2xlYXJUaW1lb3V0O1xuICB9XG59KSgpO1xuXG52YXIgaW5pdENsYXNzZXMgICA9IFsnbXVpLWVudGVyJywgJ211aS1sZWF2ZSddO1xudmFyIGFjdGl2ZUNsYXNzZXMgPSBbJ211aS1lbnRlci1hY3RpdmUnLCAnbXVpLWxlYXZlLWFjdGl2ZSddO1xuXG4vLyBGaW5kIHRoZSByaWdodCBcInRyYW5zaXRpb25lbmRcIiBldmVudCBmb3IgdGhpcyBicm93c2VyXG52YXIgZW5kRXZlbnQgPSAoZnVuY3Rpb24oKSB7XG4gIHZhciB0cmFuc2l0aW9ucyA9IHtcbiAgICAndHJhbnNpdGlvbic6ICd0cmFuc2l0aW9uZW5kJyxcbiAgICAnV2Via2l0VHJhbnNpdGlvbic6ICd3ZWJraXRUcmFuc2l0aW9uRW5kJyxcbiAgICAnTW96VHJhbnNpdGlvbic6ICd0cmFuc2l0aW9uZW5kJyxcbiAgICAnT1RyYW5zaXRpb24nOiAnb3RyYW5zaXRpb25lbmQnXG4gIH1cbiAgdmFyIGVsZW0gPSB3aW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbiAgZm9yICh2YXIgdCBpbiB0cmFuc2l0aW9ucykge1xuICAgIGlmICh0eXBlb2YgZWxlbS5zdHlsZVt0XSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHJldHVybiB0cmFuc2l0aW9uc1t0XTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn0pKCk7XG5cbmZ1bmN0aW9uIGFuaW1hdGUoaXNJbiwgZWxlbWVudCwgYW5pbWF0aW9uLCBjYikge1xuICBlbGVtZW50ID0gJChlbGVtZW50KS5lcSgwKTtcblxuICBpZiAoIWVsZW1lbnQubGVuZ3RoKSByZXR1cm47XG5cbiAgaWYgKGVuZEV2ZW50ID09PSBudWxsKSB7XG4gICAgaXNJbiA/IGVsZW1lbnQuc2hvdygpIDogZWxlbWVudC5oaWRlKCk7XG4gICAgY2IoKTtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgaW5pdENsYXNzID0gaXNJbiA/IGluaXRDbGFzc2VzWzBdIDogaW5pdENsYXNzZXNbMV07XG4gIHZhciBhY3RpdmVDbGFzcyA9IGlzSW4gPyBhY3RpdmVDbGFzc2VzWzBdIDogYWN0aXZlQ2xhc3Nlc1sxXTtcblxuICAvLyBTZXQgdXAgdGhlIGFuaW1hdGlvblxuICByZXNldCgpO1xuICBlbGVtZW50LmFkZENsYXNzKGFuaW1hdGlvbik7XG4gIGVsZW1lbnQuY3NzKCd0cmFuc2l0aW9uJywgJ25vbmUnKTtcbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmN0aW9uKCkge1xuICAgIGVsZW1lbnQuYWRkQ2xhc3MoaW5pdENsYXNzKTtcbiAgICBpZiAoaXNJbikgZWxlbWVudC5zaG93KCk7XG4gIH0pO1xuXG4gIC8vIFN0YXJ0IHRoZSBhbmltYXRpb25cbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmN0aW9uKCkge1xuICAgIGVsZW1lbnRbMF0ub2Zmc2V0V2lkdGg7XG4gICAgZWxlbWVudC5jc3MoJ3RyYW5zaXRpb24nLCAnJyk7XG4gICAgZWxlbWVudC5hZGRDbGFzcyhhY3RpdmVDbGFzcyk7XG4gIH0pO1xuXG4gIC8vIENsZWFuIHVwIHRoZSBhbmltYXRpb24gd2hlbiBpdCBmaW5pc2hlc1xuICBlbGVtZW50Lm9uZSgndHJhbnNpdGlvbmVuZCcsIGZpbmlzaCk7XG5cbiAgLy8gSGlkZXMgdGhlIGVsZW1lbnQgKGZvciBvdXQgYW5pbWF0aW9ucyksIHJlc2V0cyB0aGUgZWxlbWVudCwgYW5kIHJ1bnMgYSBjYWxsYmFja1xuICBmdW5jdGlvbiBmaW5pc2goKSB7XG4gICAgaWYgKCFpc0luKSBlbGVtZW50LmhpZGUoKTtcbiAgICByZXNldCgpO1xuICAgIGlmIChjYikgY2IuYXBwbHkoZWxlbWVudCk7XG4gIH1cblxuICAvLyBSZXNldHMgdHJhbnNpdGlvbnMgYW5kIHJlbW92ZXMgbW90aW9uLXNwZWNpZmljIGNsYXNzZXNcbiAgZnVuY3Rpb24gcmVzZXQoKSB7XG4gICAgZWxlbWVudFswXS5zdHlsZS50cmFuc2l0aW9uRHVyYXRpb24gPSAwO1xuICAgIGVsZW1lbnQucmVtb3ZlQ2xhc3MoaW5pdENsYXNzICsgJyAnICsgYWN0aXZlQ2xhc3MgKyAnICcgKyBhbmltYXRpb24pO1xuICB9XG59XG5cbnZhciBNb3Rpb25VSSA9IHtcbiAgYW5pbWF0ZUluOiBmdW5jdGlvbihlbGVtZW50LCBhbmltYXRpb24sIGNiKSB7XG4gICAgYW5pbWF0ZSh0cnVlLCBlbGVtZW50LCBhbmltYXRpb24sIGNiKTtcbiAgfSxcblxuICBhbmltYXRlT3V0OiBmdW5jdGlvbihlbGVtZW50LCBhbmltYXRpb24sIGNiKSB7XG4gICAgYW5pbWF0ZShmYWxzZSwgZWxlbWVudCwgYW5pbWF0aW9uLCBjYik7XG4gIH1cbn1cbiIsIi8qID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogZm91bmRhdGlvbi1kYXRlcGlja2VyLmpzXG4gKiBDb3B5cmlnaHQgMjAxNSBQZXRlciBCZW5vLCBuYWpsZXBzaXdlYmRlc2lnbmVyQGdtYWlsLmNvbSwgQGJlbm9wZXRlclxuICogcHJvamVjdCB3ZWJzaXRlIGh0dHA6Ly9mb3VuZGF0aW9uLWRhdGVwaWNrZXIucGV0ZXJiZW5vLmNvbVxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09ICovXG4hIGZ1bmN0aW9uKCQpIHtcblxuICAgIGZ1bmN0aW9uIFVUQ0RhdGUoKSB7XG4gICAgICAgIHJldHVybiBuZXcgRGF0ZShEYXRlLlVUQy5hcHBseShEYXRlLCBhcmd1bWVudHMpKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBVVENUb2RheSgpIHtcbiAgICAgICAgdmFyIHRvZGF5ID0gbmV3IERhdGUoKTtcbiAgICAgICAgcmV0dXJuIFVUQ0RhdGUodG9kYXkuZ2V0VVRDRnVsbFllYXIoKSwgdG9kYXkuZ2V0VVRDTW9udGgoKSwgdG9kYXkuZ2V0VVRDRGF0ZSgpKTtcbiAgICB9XG5cbiAgICB2YXIgRGF0ZXBpY2tlciA9IGZ1bmN0aW9uKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgICAgIHRoaXMuZWxlbWVudCA9ICQoZWxlbWVudCk7XG4gICAgICAgIHRoaXMuYXV0b1Nob3cgPSAob3B0aW9ucy5hdXRvU2hvdyA9PSB1bmRlZmluZWQgPyB0cnVlIDogb3B0aW9ucy5hdXRvU2hvdyk7XG4gICAgICAgIHRoaXMuYXBwZW5kVG8gPSBvcHRpb25zLmFwcGVuZFRvIHx8ICdib2R5JztcbiAgICAgICAgdGhpcy5jbG9zZUJ1dHRvbiA9IG9wdGlvbnMuY2xvc2VCdXR0b247XG4gICAgICAgIHRoaXMubGFuZ3VhZ2UgPSBvcHRpb25zLmxhbmd1YWdlIHx8IHRoaXMuZWxlbWVudC5kYXRhKCdkYXRlLWxhbmd1YWdlJykgfHwgXCJlblwiO1xuICAgICAgICB0aGlzLmxhbmd1YWdlID0gdGhpcy5sYW5ndWFnZSBpbiBkYXRlcyA/IHRoaXMubGFuZ3VhZ2UgOiB0aGlzLmxhbmd1YWdlLnNwbGl0KCctJylbMF07IC8vQ2hlY2sgaWYgXCJkZS1ERVwiIHN0eWxlIGRhdGUgaXMgYXZhaWxhYmxlLCBpZiBub3QgbGFuZ3VhZ2Ugc2hvdWxkIGZhbGxiYWNrIHRvIDIgbGV0dGVyIGNvZGUgZWcgXCJkZVwiXG4gICAgICAgIHRoaXMubGFuZ3VhZ2UgPSB0aGlzLmxhbmd1YWdlIGluIGRhdGVzID8gdGhpcy5sYW5ndWFnZSA6IFwiZW5cIjtcbiAgICAgICAgdGhpcy5pc1JUTCA9IGRhdGVzW3RoaXMubGFuZ3VhZ2VdLnJ0bCB8fCBmYWxzZTtcbiAgICAgICAgdGhpcy5mb3JtYXQgPSBEUEdsb2JhbC5wYXJzZUZvcm1hdChvcHRpb25zLmZvcm1hdCB8fCB0aGlzLmVsZW1lbnQuZGF0YSgnZGF0ZS1mb3JtYXQnKSB8fCBkYXRlc1t0aGlzLmxhbmd1YWdlXS5mb3JtYXQgfHwgJ21tL2RkL3l5eXknKTtcbiAgICAgICAgdGhpcy5mb3JtYXRUZXh0ID0gb3B0aW9ucy5mb3JtYXQgfHwgdGhpcy5lbGVtZW50LmRhdGEoJ2RhdGUtZm9ybWF0JykgfHwgZGF0ZXNbdGhpcy5sYW5ndWFnZV0uZm9ybWF0IHx8ICdtbS9kZC95eXl5JztcbiAgICAgICAgdGhpcy5pc0lubGluZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLmlzSW5wdXQgPSB0aGlzLmVsZW1lbnQuaXMoJ2lucHV0Jyk7XG4gICAgICAgIHRoaXMuY29tcG9uZW50ID0gdGhpcy5lbGVtZW50LmlzKCcuZGF0ZScpID8gdGhpcy5lbGVtZW50LmZpbmQoJy5wcmVmaXgsIC5wb3N0Zml4JykgOiBmYWxzZTtcbiAgICAgICAgdGhpcy5oYXNJbnB1dCA9IHRoaXMuY29tcG9uZW50ICYmIHRoaXMuZWxlbWVudC5maW5kKCdpbnB1dCcpLmxlbmd0aDtcbiAgICAgICAgdGhpcy5kaXNhYmxlRGJsQ2xpY2tTZWxlY3Rpb24gPSBvcHRpb25zLmRpc2FibGVEYmxDbGlja1NlbGVjdGlvbjtcbiAgICAgICAgdGhpcy5vblJlbmRlciA9IG9wdGlvbnMub25SZW5kZXIgfHwgZnVuY3Rpb24oKSB7fTtcbiAgICAgICAgaWYgKHRoaXMuY29tcG9uZW50ICYmIHRoaXMuY29tcG9uZW50Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgdGhpcy5jb21wb25lbnQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxpbmtGaWVsZCA9IG9wdGlvbnMubGlua0ZpZWxkIHx8IHRoaXMuZWxlbWVudC5kYXRhKCdsaW5rLWZpZWxkJykgfHwgZmFsc2U7XG4gICAgICAgIHRoaXMubGlua0Zvcm1hdCA9IERQR2xvYmFsLnBhcnNlRm9ybWF0KG9wdGlvbnMubGlua0Zvcm1hdCB8fCB0aGlzLmVsZW1lbnQuZGF0YSgnbGluay1mb3JtYXQnKSB8fCAneXl5eS1tbS1kZCBoaDppaTpzcycpO1xuICAgICAgICB0aGlzLm1pbnV0ZVN0ZXAgPSBvcHRpb25zLm1pbnV0ZVN0ZXAgfHwgdGhpcy5lbGVtZW50LmRhdGEoJ21pbnV0ZS1zdGVwJykgfHwgNTtcbiAgICAgICAgdGhpcy5waWNrZXJQb3NpdGlvbiA9IG9wdGlvbnMucGlja2VyUG9zaXRpb24gfHwgdGhpcy5lbGVtZW50LmRhdGEoJ3BpY2tlci1wb3NpdGlvbicpIHx8ICdib3R0b20tcmlnaHQnO1xuICAgICAgICB0aGlzLmluaXRpYWxEYXRlID0gb3B0aW9ucy5pbml0aWFsRGF0ZSB8fCBudWxsO1xuICAgICAgICB0aGlzLmZhQ1NTcHJlZml4ID0gb3B0aW9ucy5mYUNTU3ByZWZpeCB8fCAnZmEnO1xuICAgICAgICB0aGlzLmxlZnRBcnJvdyA9IG9wdGlvbnMubGVmdEFycm93IHx8ICc8aSBjbGFzcz1cIicgKyB0aGlzLmZhQ1NTcHJlZml4ICsgJyAnICsgdGhpcy5mYUNTU3ByZWZpeCArICctY2hldnJvbi1sZWZ0IGZpLWFycm93LWxlZnRcIi8+JztcbiAgICAgICAgdGhpcy5yaWdodEFycm93ID0gb3B0aW9ucy5yaWdodEFycm93IHx8ICc8aSBjbGFzcz1cIicgKyB0aGlzLmZhQ1NTcHJlZml4ICsgJyAnICsgdGhpcy5mYUNTU3ByZWZpeCArICctY2hldnJvbi1yaWdodCBmaS1hcnJvdy1yaWdodFwiLz4nO1xuICAgICAgICB0aGlzLmNsb3NlSWNvbiA9IG9wdGlvbnMuY2xvc2VJY29uIHx8ICc8aSBjbGFzcz1cIicgKyB0aGlzLmZhQ1NTcHJlZml4ICsgJyAnICsgdGhpcy5mYUNTU3ByZWZpeCArICctcmVtb3ZlICcgKyB0aGlzLmZhQ1NTcHJlZml4ICsgJy10aW1lcyBmaS14XCI+PC9pPic7XG5cbiAgICAgICAgXG5cbiAgICAgICAgdGhpcy5taW5WaWV3ID0gMDtcbiAgICAgICAgaWYgKCdtaW5WaWV3JyBpbiBvcHRpb25zKSB7XG4gICAgICAgICAgICB0aGlzLm1pblZpZXcgPSBvcHRpb25zLm1pblZpZXc7XG4gICAgICAgIH0gZWxzZSBpZiAoJ21pblZpZXcnIGluIHRoaXMuZWxlbWVudC5kYXRhKCkpIHtcbiAgICAgICAgICAgIHRoaXMubWluVmlldyA9IHRoaXMuZWxlbWVudC5kYXRhKCdtaW4tdmlldycpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubWluVmlldyA9IERQR2xvYmFsLmNvbnZlcnRWaWV3TW9kZSh0aGlzLm1pblZpZXcpO1xuXG4gICAgICAgIHRoaXMubWF4VmlldyA9IERQR2xvYmFsLm1vZGVzLmxlbmd0aCAtIDE7XG4gICAgICAgIGlmICgnbWF4VmlldycgaW4gb3B0aW9ucykge1xuICAgICAgICAgICAgdGhpcy5tYXhWaWV3ID0gb3B0aW9ucy5tYXhWaWV3O1xuICAgICAgICB9IGVsc2UgaWYgKCdtYXhWaWV3JyBpbiB0aGlzLmVsZW1lbnQuZGF0YSgpKSB7XG4gICAgICAgICAgICB0aGlzLm1heFZpZXcgPSB0aGlzLmVsZW1lbnQuZGF0YSgnbWF4LXZpZXcnKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm1heFZpZXcgPSBEUEdsb2JhbC5jb252ZXJ0Vmlld01vZGUodGhpcy5tYXhWaWV3KTtcblxuICAgICAgICB0aGlzLnN0YXJ0Vmlld01vZGUgPSAnbW9udGgnO1xuICAgICAgICBpZiAoJ3N0YXJ0VmlldycgaW4gb3B0aW9ucykge1xuICAgICAgICAgICAgdGhpcy5zdGFydFZpZXdNb2RlID0gb3B0aW9ucy5zdGFydFZpZXc7XG4gICAgICAgIH0gZWxzZSBpZiAoJ3N0YXJ0VmlldycgaW4gdGhpcy5lbGVtZW50LmRhdGEoKSkge1xuICAgICAgICAgICAgdGhpcy5zdGFydFZpZXdNb2RlID0gdGhpcy5lbGVtZW50LmRhdGEoJ3N0YXJ0LXZpZXcnKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnN0YXJ0Vmlld01vZGUgPSBEUEdsb2JhbC5jb252ZXJ0Vmlld01vZGUodGhpcy5zdGFydFZpZXdNb2RlKTtcbiAgICAgICAgdGhpcy52aWV3TW9kZSA9IHRoaXMuc3RhcnRWaWV3TW9kZTtcblxuICAgICAgICBpZiAoISgnbWluVmlldycgaW4gb3B0aW9ucykgJiYgISgnbWF4VmlldycgaW4gb3B0aW9ucykgJiYgISh0aGlzLmVsZW1lbnQuZGF0YSgnbWluLXZpZXcnKSkgJiYgISh0aGlzLmVsZW1lbnQuZGF0YSgnbWF4LXZpZXcnKSkpIHtcbiAgICAgICAgICAgIHRoaXMucGlja1RpbWUgPSBmYWxzZTtcbiAgICAgICAgICAgIGlmICgncGlja1RpbWUnIGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBpY2tUaW1lID0gb3B0aW9ucy5waWNrVGltZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLnBpY2tUaW1lID09IHRydWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm1pblZpZXcgPSAwO1xuICAgICAgICAgICAgICAgIHRoaXMubWF4VmlldyA9IDQ7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMubWluVmlldyA9IDI7XG4gICAgICAgICAgICAgICAgdGhpcy5tYXhWaWV3ID0gNDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZm9yY2VQYXJzZSA9IHRydWU7XG4gICAgICAgIGlmICgnZm9yY2VQYXJzZScgaW4gb3B0aW9ucykge1xuICAgICAgICAgICAgdGhpcy5mb3JjZVBhcnNlID0gb3B0aW9ucy5mb3JjZVBhcnNlO1xuICAgICAgICB9IGVsc2UgaWYgKCdkYXRlRm9yY2VQYXJzZScgaW4gdGhpcy5lbGVtZW50LmRhdGEoKSkge1xuICAgICAgICAgICAgdGhpcy5mb3JjZVBhcnNlID0gdGhpcy5lbGVtZW50LmRhdGEoJ2RhdGUtZm9yY2UtcGFyc2UnKTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgdGhpcy5waWNrZXIgPSAkKERQR2xvYmFsLnRlbXBsYXRlKHRoaXMubGVmdEFycm93LCB0aGlzLnJpZ2h0QXJyb3csIHRoaXMuY2xvc2VJY29uKSlcbiAgICAgICAgICAgIC5hcHBlbmRUbyh0aGlzLmlzSW5saW5lID8gdGhpcy5lbGVtZW50IDogdGhpcy5hcHBlbmRUbylcbiAgICAgICAgICAgIC5vbih7XG4gICAgICAgICAgICAgICAgY2xpY2s6ICQucHJveHkodGhpcy5jbGljaywgdGhpcyksXG4gICAgICAgICAgICAgICAgbW91c2Vkb3duOiAkLnByb3h5KHRoaXMubW91c2Vkb3duLCB0aGlzKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIGlmICh0aGlzLmNsb3NlQnV0dG9uKSB7XG4gICAgICAgICAgICB0aGlzLnBpY2tlci5maW5kKCdhLmRhdGVwaWNrZXItY2xvc2UnKS5zaG93KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnBpY2tlci5maW5kKCdhLmRhdGVwaWNrZXItY2xvc2UnKS5oaWRlKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5pc0lubGluZSkge1xuICAgICAgICAgICAgdGhpcy5waWNrZXIuYWRkQ2xhc3MoJ2RhdGVwaWNrZXItaW5saW5lJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnBpY2tlci5hZGRDbGFzcygnZGF0ZXBpY2tlci1kcm9wZG93biBkcm9wZG93bi1tZW51Jyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuaXNSVEwpIHtcbiAgICAgICAgICAgIHRoaXMucGlja2VyLmFkZENsYXNzKCdkYXRlcGlja2VyLXJ0bCcpO1xuXG4gICAgICAgICAgICB0aGlzLnBpY2tlci5maW5kKCcuZGF0ZS1zd2l0Y2gnKS5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICQodGhpcykucGFyZW50KCkucHJlcGVuZCgkKHRoaXMpLnNpYmxpbmdzKCcubmV4dCcpKTtcbiAgICAgICAgICAgICAgJCh0aGlzKS5wYXJlbnQoKS5hcHBlbmQoJCh0aGlzKS5zaWJsaW5ncygnLnByZXYnKSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnLnByZXYsIC5uZXh0JykudG9nZ2xlQ2xhc3MoJ3ByZXYgbmV4dCcpO1xuXG4gICAgICAgIH1cbiAgICAgICAgJChkb2N1bWVudCkub24oJ21vdXNlZG93bicsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIGlmICh0aGF0LmlzSW5wdXQgJiYgZS50YXJnZXQgPT09IHRoYXQuZWxlbWVudFswXSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQ2xpY2tlZCBvdXRzaWRlIHRoZSBkYXRlcGlja2VyLCBoaWRlIGl0XG4gICAgICAgICAgICBpZiAoJChlLnRhcmdldCkuY2xvc2VzdCgnLmRhdGVwaWNrZXIuZGF0ZXBpY2tlci1pbmxpbmUsIC5kYXRlcGlja2VyLmRhdGVwaWNrZXItZHJvcGRvd24nKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICB0aGF0LmhpZGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5hdXRvY2xvc2UgPSB0cnVlO1xuICAgICAgICBpZiAoJ2F1dG9jbG9zZScgaW4gb3B0aW9ucykge1xuICAgICAgICAgICAgdGhpcy5hdXRvY2xvc2UgPSBvcHRpb25zLmF1dG9jbG9zZTtcbiAgICAgICAgfSBlbHNlIGlmICgnZGF0ZUF1dG9jbG9zZScgaW4gdGhpcy5lbGVtZW50LmRhdGEoKSkge1xuICAgICAgICAgICAgdGhpcy5hdXRvY2xvc2UgPSB0aGlzLmVsZW1lbnQuZGF0YSgnZGF0ZS1hdXRvY2xvc2UnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMua2V5Ym9hcmROYXZpZ2F0aW9uID0gdHJ1ZTtcbiAgICAgICAgaWYgKCdrZXlib2FyZE5hdmlnYXRpb24nIGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHRoaXMua2V5Ym9hcmROYXZpZ2F0aW9uID0gb3B0aW9ucy5rZXlib2FyZE5hdmlnYXRpb247XG4gICAgICAgIH0gZWxzZSBpZiAoJ2RhdGVLZXlib2FyZE5hdmlnYXRpb24nIGluIHRoaXMuZWxlbWVudC5kYXRhKCkpIHtcbiAgICAgICAgICAgIHRoaXMua2V5Ym9hcmROYXZpZ2F0aW9uID0gdGhpcy5lbGVtZW50LmRhdGEoJ2RhdGUta2V5Ym9hcmQtbmF2aWdhdGlvbicpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy50b2RheUJ0biA9IChvcHRpb25zLnRvZGF5QnRuIHx8IHRoaXMuZWxlbWVudC5kYXRhKCdkYXRlLXRvZGF5LWJ0bicpIHx8IGZhbHNlKTtcbiAgICAgICAgdGhpcy50b2RheUhpZ2hsaWdodCA9IChvcHRpb25zLnRvZGF5SGlnaGxpZ2h0IHx8IHRoaXMuZWxlbWVudC5kYXRhKCdkYXRlLXRvZGF5LWhpZ2hsaWdodCcpIHx8IGZhbHNlKTtcblxuICAgICAgICB0aGlzLmNhbGVuZGFyV2Vla3MgPSBmYWxzZTtcbiAgICAgICAgaWYgKCdjYWxlbmRhcldlZWtzJyBpbiBvcHRpb25zKSB7XG4gICAgICAgICAgICB0aGlzLmNhbGVuZGFyV2Vla3MgPSBvcHRpb25zLmNhbGVuZGFyV2Vla3M7XG4gICAgICAgIH0gZWxzZSBpZiAoJ2RhdGVDYWxlbmRhcldlZWtzJyBpbiB0aGlzLmVsZW1lbnQuZGF0YSgpKSB7XG4gICAgICAgICAgICB0aGlzLmNhbGVuZGFyV2Vla3MgPSB0aGlzLmVsZW1lbnQuZGF0YSgnZGF0ZS1jYWxlbmRhci13ZWVrcycpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmNhbGVuZGFyV2Vla3MpXG4gICAgICAgICAgICB0aGlzLnBpY2tlci5maW5kKCd0Zm9vdCB0aC50b2RheScpXG4gICAgICAgICAgICAuYXR0cignY29sc3BhbicsIGZ1bmN0aW9uKGksIHZhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZUludCh2YWwpICsgMTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMud2Vla1N0YXJ0ID0gKChvcHRpb25zLndlZWtTdGFydCB8fCB0aGlzLmVsZW1lbnQuZGF0YSgnZGF0ZS13ZWVrc3RhcnQnKSB8fCBkYXRlc1t0aGlzLmxhbmd1YWdlXS53ZWVrU3RhcnQgfHwgMCkgJSA3KTtcbiAgICAgICAgdGhpcy53ZWVrRW5kID0gKCh0aGlzLndlZWtTdGFydCArIDYpICUgNyk7XG4gICAgICAgIHRoaXMuc3RhcnREYXRlID0gLUluZmluaXR5O1xuICAgICAgICB0aGlzLmVuZERhdGUgPSBJbmZpbml0eTtcbiAgICAgICAgdGhpcy5kYXlzT2ZXZWVrRGlzYWJsZWQgPSBbXTtcbiAgICAgICAgdGhpcy5kYXRlc0Rpc2FibGVkID0gW107XG4gICAgICAgIHRoaXMuc2V0U3RhcnREYXRlKG9wdGlvbnMuc3RhcnREYXRlIHx8IHRoaXMuZWxlbWVudC5kYXRhKCdkYXRlLXN0YXJ0ZGF0ZScpKTtcbiAgICAgICAgdGhpcy5zZXRFbmREYXRlKG9wdGlvbnMuZW5kRGF0ZSB8fCB0aGlzLmVsZW1lbnQuZGF0YSgnZGF0ZS1lbmRkYXRlJykpO1xuICAgICAgICB0aGlzLnNldERheXNPZldlZWtEaXNhYmxlZChvcHRpb25zLmRheXNPZldlZWtEaXNhYmxlZCB8fCB0aGlzLmVsZW1lbnQuZGF0YSgnZGF0ZS1kYXlzLW9mLXdlZWstZGlzYWJsZWQnKSk7XG4gICAgICAgIHRoaXMuc2V0RGF0ZXNEaXNhYmxlZChvcHRpb25zLmRhdGVzRGlzYWJsZWQgfHwgdGhpcy5lbGVtZW50LmRhdGEoJ2RhdGVzLWRpc2FibGVkJykpO1xuXG4gICAgICAgIHRoaXMuZmlsbERvdygpO1xuICAgICAgICB0aGlzLmZpbGxNb250aHMoKTtcbiAgICAgICAgdGhpcy51cGRhdGUoKTtcblxuICAgICAgICB0aGlzLnNob3dNb2RlKCk7XG5cbiAgICAgICAgaWYgKHRoaXMuaXNJbmxpbmUpIHtcbiAgICAgICAgICAgIHRoaXMuc2hvdygpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fYXR0YWNoRXZlbnRzKCk7XG4gICAgfTtcblxuICAgIERhdGVwaWNrZXIucHJvdG90eXBlID0ge1xuICAgICAgICBjb25zdHJ1Y3RvcjogRGF0ZXBpY2tlcixcblxuICAgICAgICBfZXZlbnRzOiBbXSxcbiAgICAgICAgX2F0dGFjaEV2ZW50czogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLl9kZXRhY2hFdmVudHMoKTtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzSW5wdXQpIHsgLy8gc2luZ2xlIGlucHV0XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmtleWJvYXJkTmF2aWdhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHMgPSBbXG4gICAgICAgICAgICAgICAgICAgICAgICBbdGhpcy5lbGVtZW50LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9jdXM6ICh0aGlzLmF1dG9TaG93KSA/ICQucHJveHkodGhpcy5zaG93LCB0aGlzKSA6IGZ1bmN0aW9uKCkge31cbiAgICAgICAgICAgICAgICAgICAgICAgIH1dXG4gICAgICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzID0gW1xuICAgICAgICAgICAgICAgICAgICAgICAgW3RoaXMuZWxlbWVudCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvY3VzOiAodGhpcy5hdXRvU2hvdykgPyAkLnByb3h5KHRoaXMuc2hvdywgdGhpcykgOiBmdW5jdGlvbigpIHt9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleXVwOiAkLnByb3h5KHRoaXMudXBkYXRlLCB0aGlzKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXlkb3duOiAkLnByb3h5KHRoaXMua2V5ZG93biwgdGhpcyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xpY2s6ICh0aGlzLmVsZW1lbnQuYXR0cigncmVhZG9ubHknKSkgPyAkLnByb3h5KHRoaXMuc2hvdywgdGhpcykgOiBmdW5jdGlvbigpIHt9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XVxuICAgICAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgIH0gXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh0aGlzLmNvbXBvbmVudCAmJiB0aGlzLmhhc0lucHV0KSB7IC8vIGNvbXBvbmVudDogaW5wdXQgKyBidXR0b25cbiAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHMgPSBbXG4gICAgICAgICAgICAgICAgICAgIC8vIEZvciBjb21wb25lbnRzIHRoYXQgYXJlIG5vdCByZWFkb25seSwgYWxsb3cga2V5Ym9hcmQgbmF2XG4gICAgICAgICAgICAgICAgICAgIFt0aGlzLmVsZW1lbnQuZmluZCgnaW5wdXQnKSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9jdXM6ICh0aGlzLmF1dG9TaG93KSA/ICQucHJveHkodGhpcy5zaG93LCB0aGlzKSA6IGZ1bmN0aW9uKCkge30sXG4gICAgICAgICAgICAgICAgICAgICAgICBrZXl1cDogJC5wcm94eSh0aGlzLnVwZGF0ZSwgdGhpcyksXG4gICAgICAgICAgICAgICAgICAgICAgICBrZXlkb3duOiAkLnByb3h5KHRoaXMua2V5ZG93biwgdGhpcylcbiAgICAgICAgICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICAgICAgICAgIFt0aGlzLmNvbXBvbmVudCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xpY2s6ICQucHJveHkodGhpcy5zaG93LCB0aGlzKVxuICAgICAgICAgICAgICAgICAgICB9XVxuICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuZWxlbWVudC5pcygnZGl2JykpIHsgLy8gaW5saW5lIGRhdGVwaWNrZXJcbiAgICAgICAgICAgICAgICB0aGlzLmlzSW5saW5lID0gdHJ1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzID0gW1xuICAgICAgICAgICAgICAgICAgICBbdGhpcy5lbGVtZW50LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGljazogJC5wcm94eSh0aGlzLnNob3csIHRoaXMpXG4gICAgICAgICAgICAgICAgICAgIH1dXG4gICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMuZGlzYWJsZURibENsaWNrU2VsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW3RoaXMuX2V2ZW50cy5sZW5ndGhdID0gW1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRibGNsaWNrOiBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5ibHVyKClcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBlbCwgZXY7IGkgPCB0aGlzLl9ldmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBlbCA9IHRoaXMuX2V2ZW50c1tpXVswXTtcbiAgICAgICAgICAgICAgICBldiA9IHRoaXMuX2V2ZW50c1tpXVsxXTtcbiAgICAgICAgICAgICAgICBlbC5vbihldik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIF9kZXRhY2hFdmVudHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGVsLCBldjsgaSA8IHRoaXMuX2V2ZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGVsID0gdGhpcy5fZXZlbnRzW2ldWzBdO1xuICAgICAgICAgICAgICAgIGV2ID0gdGhpcy5fZXZlbnRzW2ldWzFdO1xuICAgICAgICAgICAgICAgIGVsLm9mZihldik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9ldmVudHMgPSBbXTtcbiAgICAgICAgfSxcblxuICAgICAgICBzaG93OiBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICB0aGlzLnBpY2tlci5zaG93KCk7XG4gICAgICAgICAgICB0aGlzLmhlaWdodCA9IHRoaXMuY29tcG9uZW50ID8gdGhpcy5jb21wb25lbnQub3V0ZXJIZWlnaHQoKSA6IHRoaXMuZWxlbWVudC5vdXRlckhlaWdodCgpO1xuICAgICAgICAgICAgdGhpcy51cGRhdGUoKTtcbiAgICAgICAgICAgIHRoaXMucGxhY2UoKTtcbiAgICAgICAgICAgICQod2luZG93KS5vbigncmVzaXplJywgJC5wcm94eSh0aGlzLnBsYWNlLCB0aGlzKSk7XG4gICAgICAgICAgICBpZiAoZSkge1xuICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnRyaWdnZXIoe1xuICAgICAgICAgICAgICAgIHR5cGU6ICdzaG93JyxcbiAgICAgICAgICAgICAgICBkYXRlOiB0aGlzLmRhdGVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGhpZGU6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzSW5saW5lKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoIXRoaXMucGlja2VyLmlzKCc6dmlzaWJsZScpKSByZXR1cm47XG4gICAgICAgICAgICB0aGlzLnBpY2tlci5oaWRlKCk7XG4gICAgICAgICAgICAkKHdpbmRvdykub2ZmKCdyZXNpemUnLCB0aGlzLnBsYWNlKTtcbiAgICAgICAgICAgIHRoaXMudmlld01vZGUgPSB0aGlzLnN0YXJ0Vmlld01vZGU7XG4gICAgICAgICAgICB0aGlzLnNob3dNb2RlKCk7XG4gICAgICAgICAgICBpZiAoIXRoaXMuaXNJbnB1dCkge1xuICAgICAgICAgICAgICAgICQoZG9jdW1lbnQpLm9mZignbW91c2Vkb3duJywgdGhpcy5oaWRlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIHRoaXMuZm9yY2VQYXJzZSAmJlxuICAgICAgICAgICAgICAgIChcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pc0lucHV0ICYmIHRoaXMuZWxlbWVudC52YWwoKSB8fFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmhhc0lucHV0ICYmIHRoaXMuZWxlbWVudC5maW5kKCdpbnB1dCcpLnZhbCgpXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIHRoaXMuc2V0VmFsdWUoKTtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC50cmlnZ2VyKHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnaGlkZScsXG4gICAgICAgICAgICAgICAgZGF0ZTogdGhpcy5kYXRlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICByZW1vdmU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5fZGV0YWNoRXZlbnRzKCk7XG4gICAgICAgICAgICB0aGlzLnBpY2tlci5yZW1vdmUoKTtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmVsZW1lbnQuZGF0YSgpLmRhdGVwaWNrZXI7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0RGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgZCA9IHRoaXMuZ2V0VVRDRGF0ZSgpO1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBEYXRlKGQuZ2V0VGltZSgpICsgKGQuZ2V0VGltZXpvbmVPZmZzZXQoKSAqIDYwMDAwKSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0VVRDRGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5kYXRlO1xuICAgICAgICB9LFxuXG4gICAgICAgIHNldERhdGU6IGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0VVRDRGF0ZShuZXcgRGF0ZShkLmdldFRpbWUoKSAtIChkLmdldFRpbWV6b25lT2Zmc2V0KCkgKiA2MDAwMCkpKTtcbiAgICAgICAgfSxcblxuICAgICAgICBzZXRVVENEYXRlOiBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICB0aGlzLmRhdGUgPSBkO1xuICAgICAgICAgICAgdGhpcy5zZXRWYWx1ZSgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHNldFZhbHVlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBmb3JtYXR0ZWQgPSB0aGlzLmdldEZvcm1hdHRlZERhdGUoKTtcbiAgICAgICAgICAgIGlmICghdGhpcy5pc0lucHV0KSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudC5maW5kKCdpbnB1dCcpLnZhbChmb3JtYXR0ZWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQuZGF0YSgnZGF0ZScsIGZvcm1hdHRlZCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudC52YWwoZm9ybWF0dGVkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBnZXRGb3JtYXR0ZWREYXRlOiBmdW5jdGlvbihmb3JtYXQpIHtcbiAgICAgICAgICAgIGlmIChmb3JtYXQgPT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgICAgICBmb3JtYXQgPSB0aGlzLmZvcm1hdDtcbiAgICAgICAgICAgIHJldHVybiBEUEdsb2JhbC5mb3JtYXREYXRlKHRoaXMuZGF0ZSwgZm9ybWF0LCB0aGlzLmxhbmd1YWdlKTtcbiAgICAgICAgfSxcblxuICAgICAgICBzZXRTdGFydERhdGU6IGZ1bmN0aW9uKHN0YXJ0RGF0ZSkge1xuICAgICAgICAgICAgdGhpcy5zdGFydERhdGUgPSBzdGFydERhdGUgfHwgLUluZmluaXR5O1xuICAgICAgICAgICAgaWYgKHRoaXMuc3RhcnREYXRlICE9PSAtSW5maW5pdHkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXJ0RGF0ZSA9IERQR2xvYmFsLnBhcnNlRGF0ZSh0aGlzLnN0YXJ0RGF0ZSwgdGhpcy5mb3JtYXQsIHRoaXMubGFuZ3VhZ2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy51cGRhdGUoKTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlTmF2QXJyb3dzKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2V0RW5kRGF0ZTogZnVuY3Rpb24oZW5kRGF0ZSkge1xuICAgICAgICAgICAgdGhpcy5lbmREYXRlID0gZW5kRGF0ZSB8fCBJbmZpbml0eTtcbiAgICAgICAgICAgIGlmICh0aGlzLmVuZERhdGUgIT09IEluZmluaXR5KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbmREYXRlID0gRFBHbG9iYWwucGFyc2VEYXRlKHRoaXMuZW5kRGF0ZSwgdGhpcy5mb3JtYXQsIHRoaXMubGFuZ3VhZ2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy51cGRhdGUoKTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlTmF2QXJyb3dzKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2V0RGF5c09mV2Vla0Rpc2FibGVkOiBmdW5jdGlvbihkYXlzT2ZXZWVrRGlzYWJsZWQpIHtcbiAgICAgICAgICAgIHRoaXMuZGF5c09mV2Vla0Rpc2FibGVkID0gZGF5c09mV2Vla0Rpc2FibGVkIHx8IFtdO1xuICAgICAgICAgICAgaWYgKCEkLmlzQXJyYXkodGhpcy5kYXlzT2ZXZWVrRGlzYWJsZWQpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kYXlzT2ZXZWVrRGlzYWJsZWQgPSB0aGlzLmRheXNPZldlZWtEaXNhYmxlZC5zcGxpdCgvLFxccyovKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZGF5c09mV2Vla0Rpc2FibGVkID0gJC5tYXAodGhpcy5kYXlzT2ZXZWVrRGlzYWJsZWQsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VJbnQoZCwgMTApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZSgpO1xuICAgICAgICAgICAgdGhpcy51cGRhdGVOYXZBcnJvd3MoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBzZXREYXRlc0Rpc2FibGVkOiBmdW5jdGlvbihkYXRlc0Rpc2FibGVkKSB7XG4gICAgICAgICAgICB0aGlzLmRhdGVzRGlzYWJsZWQgPSBkYXRlc0Rpc2FibGVkIHx8IFtdO1xuICAgICAgICAgICAgaWYgKCEkLmlzQXJyYXkodGhpcy5kYXRlc0Rpc2FibGVkKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGF0ZXNEaXNhYmxlZCA9IHRoaXMuZGF0ZXNEaXNhYmxlZC5zcGxpdCgvLFxccyovKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZGF0ZXNEaXNhYmxlZCA9ICQubWFwKHRoaXMuZGF0ZXNEaXNhYmxlZCwgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBEUEdsb2JhbC5wYXJzZURhdGUoZCwgdGhpcy5mb3JtYXQsIHRoaXMubGFuZ3VhZ2UpLnZhbHVlT2YoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy51cGRhdGUoKTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlTmF2QXJyb3dzKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcGxhY2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuaXNJbmxpbmUpIHJldHVybjtcbiAgICAgICAgICAgIHZhciB6SW5kZXggPSBwYXJzZUludCh0aGlzLmVsZW1lbnQucGFyZW50cygpLmZpbHRlcihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJCh0aGlzKS5jc3MoJ3otaW5kZXgnKSAhPSAnYXV0byc7XG4gICAgICAgICAgICB9KS5maXJzdCgpLmNzcygnei1pbmRleCcpKSArIDEwO1xuICAgICAgICAgICAgdmFyIHRleHRib3ggPSB0aGlzLmNvbXBvbmVudCA/IHRoaXMuY29tcG9uZW50IDogdGhpcy5lbGVtZW50O1xuICAgICAgICAgICAgdmFyIG9mZnNldCA9IHRleHRib3gub2Zmc2V0KCk7XG4gICAgICAgICAgICB2YXIgaGVpZ2h0ID0gdGV4dGJveC5vdXRlckhlaWdodCgpICsgcGFyc2VJbnQodGV4dGJveC5jc3MoJ21hcmdpbi10b3AnKSk7XG4gICAgICAgICAgICB2YXIgd2lkdGggPSB0ZXh0Ym94Lm91dGVyV2lkdGgoKSArIHBhcnNlSW50KHRleHRib3guY3NzKCdtYXJnaW4tbGVmdCcpKTtcbiAgICAgICAgICAgIHZhciBmdWxsT2Zmc2V0VG9wID0gb2Zmc2V0LnRvcCArIGhlaWdodDtcbiAgICAgICAgICAgIHZhciBvZmZzZXRMZWZ0ID0gb2Zmc2V0LmxlZnQ7XG4gICAgICAgICAgICB0aGlzLnBpY2tlci5yZW1vdmVDbGFzcygnZGF0ZXBpY2tlci10b3AgZGF0ZXBpY2tlci1ib3R0b20nKTtcbiAgICAgICAgICAgIC8vIGlmIHRoZSBkYXRlcGlja2VyIGlzIGdvaW5nIHRvIGJlIGJlbG93IHRoZSB3aW5kb3csIHNob3cgaXQgb24gdG9wIG9mIHRoZSBpbnB1dFxuICAgICAgICAgICAgaWYgKChmdWxsT2Zmc2V0VG9wICsgdGhpcy5waWNrZXIub3V0ZXJIZWlnaHQoKSkgPj0gJCh3aW5kb3cpLnNjcm9sbFRvcCgpICsgJCh3aW5kb3cpLmhlaWdodCgpKSB7XG4gICAgICAgICAgICAgICAgZnVsbE9mZnNldFRvcCA9IG9mZnNldC50b3AgLSB0aGlzLnBpY2tlci5vdXRlckhlaWdodCgpO1xuICAgICAgICAgICAgICAgIHRoaXMucGlja2VyLmFkZENsYXNzKCdkYXRlcGlja2VyLXRvcCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5waWNrZXIuYWRkQ2xhc3MoJ2RhdGVwaWNrZXItYm90dG9tJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGlmIHRoZSBkYXRlcGlja2VyIGlzIGdvaW5nIHRvIGdvIHBhc3QgdGhlIHJpZ2h0IHNpZGUgb2YgdGhlIHdpbmRvdywgd2Ugd2FudFxuICAgICAgICAgICAgLy8gdG8gc2V0IHRoZSByaWdodCBwb3NpdGlvbiBzbyB0aGUgZGF0ZXBpY2tlciBsaW5lcyB1cCB3aXRoIHRoZSB0ZXh0Ym94XG4gICAgICAgICAgICBpZiAob2Zmc2V0LmxlZnQgKyB0aGlzLnBpY2tlci53aWR0aCgpID49ICQod2luZG93KS53aWR0aCgpKSB7XG4gICAgICAgICAgICAgICAgb2Zmc2V0TGVmdCA9IChvZmZzZXQubGVmdCArIHdpZHRoKSAtIHRoaXMucGlja2VyLndpZHRoKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnBpY2tlci5jc3Moe1xuICAgICAgICAgICAgICAgIHRvcDogZnVsbE9mZnNldFRvcCxcbiAgICAgICAgICAgICAgICBsZWZ0OiBvZmZzZXRMZWZ0LFxuICAgICAgICAgICAgICAgIHpJbmRleDogekluZGV4XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICB1cGRhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGRhdGUsIGZyb21BcmdzID0gZmFsc2U7XG4gICAgICAgICAgICB2YXIgY3VycmVudFZhbCA9IHRoaXMuaXNJbnB1dCA/IHRoaXMuZWxlbWVudC52YWwoKSA6IHRoaXMuZWxlbWVudC5kYXRhKCdkYXRlJykgfHwgdGhpcy5lbGVtZW50LmZpbmQoJ2lucHV0JykudmFsKCk7XG4gICAgICAgICAgICBpZiAoYXJndW1lbnRzICYmIGFyZ3VtZW50cy5sZW5ndGggJiYgKHR5cGVvZiBhcmd1bWVudHNbMF0gPT09ICdzdHJpbmcnIHx8IGFyZ3VtZW50c1swXSBpbnN0YW5jZW9mIERhdGUpKSB7XG4gICAgICAgICAgICAgICAgZGF0ZSA9IGFyZ3VtZW50c1swXTtcbiAgICAgICAgICAgICAgICBmcm9tQXJncyA9IHRydWU7XG4gICAgICAgICAgICB9IFxuICAgICAgICAgICAgZWxzZSBpZiAoIWN1cnJlbnRWYWwgJiYgdGhpcy5pbml0aWFsRGF0ZSAhPSBudWxsKSB7IC8vIElmIHZhbHVlIGlzIG5vdCBzZXQsIHNldCBpdCB0byB0aGUgaW5pdGlhbERhdGUgXG4gICAgICAgICAgICAgICAgZGF0ZSA9IHRoaXMuaW5pdGlhbERhdGVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGRhdGUgPSB0aGlzLmlzSW5wdXQgPyB0aGlzLmVsZW1lbnQudmFsKCkgOiB0aGlzLmVsZW1lbnQuZGF0YSgnZGF0ZScpIHx8IHRoaXMuZWxlbWVudC5maW5kKCdpbnB1dCcpLnZhbCgpO1xuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgaWYgKGRhdGUgJiYgZGF0ZS5sZW5ndGggPiB0aGlzLmZvcm1hdFRleHQubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICQodGhpcy5waWNrZXIpLmFkZENsYXNzKCdpcy1pbnZhbGlkJylcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzLmVsZW1lbnQpLmFkZENsYXNzKCdpcy1pbnZhbGlkLWlucHV0JylcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkKHRoaXMucGlja2VyKS5yZW1vdmVDbGFzcygnaXMtaW52YWxpZCcpXG4gICAgICAgICAgICAgICAgJCh0aGlzLmVsZW1lbnQpLnJlbW92ZUNsYXNzKCdpcy1pbnZhbGlkLWlucHV0JylcbiAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgICAgIHRoaXMuZGF0ZSA9IERQR2xvYmFsLnBhcnNlRGF0ZShkYXRlLCB0aGlzLmZvcm1hdCwgdGhpcy5sYW5ndWFnZSk7ICBcblxuICAgICAgICAgICAgaWYgKGZyb21BcmdzIHx8IHRoaXMuaW5pdGlhbERhdGUgIT0gbnVsbCkgdGhpcy5zZXRWYWx1ZSgpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5kYXRlIDwgdGhpcy5zdGFydERhdGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXdEYXRlID0gbmV3IERhdGUodGhpcy5zdGFydERhdGUudmFsdWVPZigpKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5kYXRlID4gdGhpcy5lbmREYXRlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy52aWV3RGF0ZSA9IG5ldyBEYXRlKHRoaXMuZW5kRGF0ZS52YWx1ZU9mKCkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXdEYXRlID0gbmV3IERhdGUodGhpcy5kYXRlLnZhbHVlT2YoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmZpbGwoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBmaWxsRG93OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBkb3dDbnQgPSB0aGlzLndlZWtTdGFydCxcbiAgICAgICAgICAgICAgICBodG1sID0gJzx0cj4nO1xuICAgICAgICAgICAgaWYgKHRoaXMuY2FsZW5kYXJXZWVrcykge1xuICAgICAgICAgICAgICAgIHZhciBjZWxsID0gJzx0aCBjbGFzcz1cImN3XCI+Jm5ic3A7PC90aD4nO1xuICAgICAgICAgICAgICAgIGh0bWwgKz0gY2VsbDtcbiAgICAgICAgICAgICAgICB0aGlzLnBpY2tlci5maW5kKCcuZGF0ZXBpY2tlci1kYXlzIHRoZWFkIHRyOmZpcnN0LWNoaWxkJykucHJlcGVuZChjZWxsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHdoaWxlIChkb3dDbnQgPCB0aGlzLndlZWtTdGFydCArIDcpIHtcbiAgICAgICAgICAgICAgICBodG1sICs9ICc8dGggY2xhc3M9XCJkb3dcIj4nICsgZGF0ZXNbdGhpcy5sYW5ndWFnZV0uZGF5c01pblsoZG93Q250KyspICUgN10gKyAnPC90aD4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaHRtbCArPSAnPC90cj4nO1xuICAgICAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnLmRhdGVwaWNrZXItZGF5cyB0aGVhZCcpLmFwcGVuZChodG1sKTtcbiAgICAgICAgfSxcblxuICAgICAgICBmaWxsTW9udGhzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBodG1sID0gJycsXG4gICAgICAgICAgICAgICAgaSA9IDA7XG4gICAgICAgICAgICB3aGlsZSAoaSA8IDEyKSB7XG4gICAgICAgICAgICAgICAgaHRtbCArPSAnPHNwYW4gY2xhc3M9XCJtb250aFwiPicgKyBkYXRlc1t0aGlzLmxhbmd1YWdlXS5tb250aHNTaG9ydFtpKytdICsgJzwvc3Bhbj4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnLmRhdGVwaWNrZXItbW9udGhzIHRkJykuaHRtbChodG1sKTtcbiAgICAgICAgfSxcblxuICAgICAgICBmaWxsOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmRhdGUgPT0gbnVsbCB8fCB0aGlzLnZpZXdEYXRlID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBkID0gbmV3IERhdGUodGhpcy52aWV3RGF0ZS52YWx1ZU9mKCkpLFxuICAgICAgICAgICAgICAgIHllYXIgPSBkLmdldFVUQ0Z1bGxZZWFyKCksXG4gICAgICAgICAgICAgICAgbW9udGggPSBkLmdldFVUQ01vbnRoKCksXG4gICAgICAgICAgICAgICAgZGF5TW9udGggPSBkLmdldFVUQ0RhdGUoKSxcbiAgICAgICAgICAgICAgICBob3VycyA9IGQuZ2V0VVRDSG91cnMoKSxcbiAgICAgICAgICAgICAgICBtaW51dGVzID0gZC5nZXRVVENNaW51dGVzKCksXG4gICAgICAgICAgICAgICAgc3RhcnRZZWFyID0gdGhpcy5zdGFydERhdGUgIT09IC1JbmZpbml0eSA/IHRoaXMuc3RhcnREYXRlLmdldFVUQ0Z1bGxZZWFyKCkgOiAtSW5maW5pdHksXG4gICAgICAgICAgICAgICAgc3RhcnRNb250aCA9IHRoaXMuc3RhcnREYXRlICE9PSAtSW5maW5pdHkgPyB0aGlzLnN0YXJ0RGF0ZS5nZXRVVENNb250aCgpIDogLUluZmluaXR5LFxuICAgICAgICAgICAgICAgIGVuZFllYXIgPSB0aGlzLmVuZERhdGUgIT09IEluZmluaXR5ID8gdGhpcy5lbmREYXRlLmdldFVUQ0Z1bGxZZWFyKCkgOiBJbmZpbml0eSxcbiAgICAgICAgICAgICAgICBlbmRNb250aCA9IHRoaXMuZW5kRGF0ZSAhPT0gSW5maW5pdHkgPyB0aGlzLmVuZERhdGUuZ2V0VVRDTW9udGgoKSA6IEluZmluaXR5LFxuICAgICAgICAgICAgICAgIGN1cnJlbnREYXRlID0gdGhpcy5kYXRlICYmIFVUQ0RhdGUodGhpcy5kYXRlLmdldFVUQ0Z1bGxZZWFyKCksIHRoaXMuZGF0ZS5nZXRVVENNb250aCgpLCB0aGlzLmRhdGUuZ2V0VVRDRGF0ZSgpKS52YWx1ZU9mKCksXG4gICAgICAgICAgICAgICAgdG9kYXkgPSBuZXcgRGF0ZSgpLFxuICAgICAgICAgICAgICAgIHRpdGxlRm9ybWF0ID0gZGF0ZXNbdGhpcy5sYW5ndWFnZV0udGl0bGVGb3JtYXQgfHwgZGF0ZXNbJ2VuJ10udGl0bGVGb3JtYXQ7XG4gICAgICAgICAgICAvLyB0aGlzLnBpY2tlci5maW5kKCcuZGF0ZXBpY2tlci1kYXlzIHRoZWFkIHRoLmRhdGUtc3dpdGNoJylcbiAgICAgICAgICAgIC8vIFx0XHRcdC50ZXh0KERQR2xvYmFsLmZvcm1hdERhdGUobmV3IFVUQ0RhdGUoeWVhciwgbW9udGgpLCB0aXRsZUZvcm1hdCwgdGhpcy5sYW5ndWFnZSkpO1xuXG4gICAgICAgICAgICB0aGlzLnBpY2tlci5maW5kKCcuZGF0ZXBpY2tlci1kYXlzIHRoZWFkIHRoOmVxKDEpJylcbiAgICAgICAgICAgICAgICAudGV4dChkYXRlc1t0aGlzLmxhbmd1YWdlXS5tb250aHNbbW9udGhdICsgJyAnICsgeWVhcik7XG4gICAgICAgICAgICB0aGlzLnBpY2tlci5maW5kKCcuZGF0ZXBpY2tlci1ob3VycyB0aGVhZCB0aDplcSgxKScpXG4gICAgICAgICAgICAgICAgLnRleHQoZGF5TW9udGggKyAnICcgKyBkYXRlc1t0aGlzLmxhbmd1YWdlXS5tb250aHNbbW9udGhdICsgJyAnICsgeWVhcik7XG4gICAgICAgICAgICB0aGlzLnBpY2tlci5maW5kKCcuZGF0ZXBpY2tlci1taW51dGVzIHRoZWFkIHRoOmVxKDEpJylcbiAgICAgICAgICAgICAgICAudGV4dChkYXlNb250aCArICcgJyArIGRhdGVzW3RoaXMubGFuZ3VhZ2VdLm1vbnRoc1ttb250aF0gKyAnICcgKyB5ZWFyKTtcblxuXG4gICAgICAgICAgICB0aGlzLnBpY2tlci5maW5kKCd0Zm9vdCB0aC50b2RheScpXG4gICAgICAgICAgICAgICAgLnRleHQoZGF0ZXNbdGhpcy5sYW5ndWFnZV0udG9kYXkpXG4gICAgICAgICAgICAgICAgLnRvZ2dsZSh0aGlzLnRvZGF5QnRuICE9PSBmYWxzZSk7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZU5hdkFycm93cygpO1xuICAgICAgICAgICAgdGhpcy5maWxsTW9udGhzKCk7XG4gICAgICAgICAgICB2YXIgcHJldk1vbnRoID0gVVRDRGF0ZSh5ZWFyLCBtb250aCAtIDEsIDI4LCAwLCAwLCAwLCAwKSxcbiAgICAgICAgICAgICAgICBkYXkgPSBEUEdsb2JhbC5nZXREYXlzSW5Nb250aChwcmV2TW9udGguZ2V0VVRDRnVsbFllYXIoKSwgcHJldk1vbnRoLmdldFVUQ01vbnRoKCkpO1xuICAgICAgICAgICAgcHJldk1vbnRoLnNldFVUQ0RhdGUoZGF5KTtcbiAgICAgICAgICAgIHByZXZNb250aC5zZXRVVENEYXRlKGRheSAtIChwcmV2TW9udGguZ2V0VVRDRGF5KCkgLSB0aGlzLndlZWtTdGFydCArIDcpICUgNyk7XG4gICAgICAgICAgICB2YXIgbmV4dE1vbnRoID0gbmV3IERhdGUocHJldk1vbnRoLnZhbHVlT2YoKSk7XG4gICAgICAgICAgICBuZXh0TW9udGguc2V0VVRDRGF0ZShuZXh0TW9udGguZ2V0VVRDRGF0ZSgpICsgNDIpO1xuICAgICAgICAgICAgbmV4dE1vbnRoID0gbmV4dE1vbnRoLnZhbHVlT2YoKTtcbiAgICAgICAgICAgIHZhciBodG1sID0gW107XG4gICAgICAgICAgICB2YXIgY2xzTmFtZTtcbiAgICAgICAgICAgIHdoaWxlIChwcmV2TW9udGgudmFsdWVPZigpIDwgbmV4dE1vbnRoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHByZXZNb250aC5nZXRVVENEYXkoKSA9PSB0aGlzLndlZWtTdGFydCkge1xuICAgICAgICAgICAgICAgICAgICBodG1sLnB1c2goJzx0cj4nKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuY2FsZW5kYXJXZWVrcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gYWRhcHRlZCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS90aW1yd29vZC9tb21lbnQvYmxvYi9tYXN0ZXIvbW9tZW50LmpzI0wxMjhcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhID0gbmV3IERhdGUocHJldk1vbnRoLmdldFVUQ0Z1bGxZZWFyKCksIHByZXZNb250aC5nZXRVVENNb250aCgpLCBwcmV2TW9udGguZ2V0VVRDRGF0ZSgpIC0gcHJldk1vbnRoLmdldERheSgpICsgMTAgLSAodGhpcy53ZWVrU3RhcnQgJiYgdGhpcy53ZWVrU3RhcnQgJSA3IDwgNSAmJiA3KSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYiA9IG5ldyBEYXRlKGEuZ2V0RnVsbFllYXIoKSwgMCwgNCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsV2VlayA9IH5+KChhIC0gYikgLyA4NjRlNSAvIDcgKyAxLjUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaHRtbC5wdXNoKCc8dGQgY2xhc3M9XCJjd1wiPicgKyBjYWxXZWVrICsgJzwvdGQ+Jyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2xzTmFtZSA9ICcgJyArIHRoaXMub25SZW5kZXIocHJldk1vbnRoKSArICcgJztcbiAgICAgICAgICAgICAgICBpZiAocHJldk1vbnRoLmdldFVUQ0Z1bGxZZWFyKCkgPCB5ZWFyIHx8IChwcmV2TW9udGguZ2V0VVRDRnVsbFllYXIoKSA9PSB5ZWFyICYmIHByZXZNb250aC5nZXRVVENNb250aCgpIDwgbW9udGgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNsc05hbWUgKz0gJyBvbGQnO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocHJldk1vbnRoLmdldFVUQ0Z1bGxZZWFyKCkgPiB5ZWFyIHx8IChwcmV2TW9udGguZ2V0VVRDRnVsbFllYXIoKSA9PSB5ZWFyICYmIHByZXZNb250aC5nZXRVVENNb250aCgpID4gbW9udGgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNsc05hbWUgKz0gJyBuZXcnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBDb21wYXJlIGludGVybmFsIFVUQyBkYXRlIHdpdGggbG9jYWwgdG9kYXksIG5vdCBVVEMgdG9kYXlcbiAgICAgICAgICAgICAgICBpZiAodGhpcy50b2RheUhpZ2hsaWdodCAmJlxuICAgICAgICAgICAgICAgICAgICBwcmV2TW9udGguZ2V0VVRDRnVsbFllYXIoKSA9PSB0b2RheS5nZXRGdWxsWWVhcigpICYmXG4gICAgICAgICAgICAgICAgICAgIHByZXZNb250aC5nZXRVVENNb250aCgpID09IHRvZGF5LmdldE1vbnRoKCkgJiZcbiAgICAgICAgICAgICAgICAgICAgcHJldk1vbnRoLmdldFVUQ0RhdGUoKSA9PSB0b2RheS5nZXREYXRlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xzTmFtZSArPSAnIHRvZGF5JztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnREYXRlICYmIHByZXZNb250aC52YWx1ZU9mKCkgPT0gY3VycmVudERhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xzTmFtZSArPSAnIGFjdGl2ZSc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChwcmV2TW9udGgudmFsdWVPZigpIDwgdGhpcy5zdGFydERhdGUgfHwgcHJldk1vbnRoLnZhbHVlT2YoKSA+IHRoaXMuZW5kRGF0ZSB8fFxuICAgICAgICAgICAgICAgICAgICAkLmluQXJyYXkocHJldk1vbnRoLmdldFVUQ0RheSgpLCB0aGlzLmRheXNPZldlZWtEaXNhYmxlZCkgIT09IC0xIHx8XG4gICAgICAgICAgICAgICAgICAgICQuaW5BcnJheShwcmV2TW9udGgudmFsdWVPZigpLCB0aGlzLmRhdGVzRGlzYWJsZWQpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBjbHNOYW1lICs9ICcgZGlzYWJsZWQnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBodG1sLnB1c2goJzx0ZCBjbGFzcz1cImRheScgKyBjbHNOYW1lICsgJ1wiPicgKyBwcmV2TW9udGguZ2V0VVRDRGF0ZSgpICsgJzwvdGQ+Jyk7XG4gICAgICAgICAgICAgICAgaWYgKHByZXZNb250aC5nZXRVVENEYXkoKSA9PSB0aGlzLndlZWtFbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgaHRtbC5wdXNoKCc8L3RyPicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwcmV2TW9udGguc2V0VVRDRGF0ZShwcmV2TW9udGguZ2V0VVRDRGF0ZSgpICsgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnBpY2tlci5maW5kKCcuZGF0ZXBpY2tlci1kYXlzIHRib2R5JykuZW1wdHkoKS5hcHBlbmQoaHRtbC5qb2luKCcnKSk7XG5cbiAgICAgICAgICAgIGh0bWwgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMjQ7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBhY3R1YWwgPSBVVENEYXRlKHllYXIsIG1vbnRoLCBkYXlNb250aCwgaSk7XG4gICAgICAgICAgICAgICAgY2xzTmFtZSA9ICcnO1xuICAgICAgICAgICAgICAgIC8vIFdlIHdhbnQgdGhlIHByZXZpb3VzIGhvdXIgZm9yIHRoZSBzdGFydERhdGVcbiAgICAgICAgICAgICAgICBpZiAoKGFjdHVhbC52YWx1ZU9mKCkgKyAzNjAwMDAwKSA8IHRoaXMuc3RhcnREYXRlIHx8IGFjdHVhbC52YWx1ZU9mKCkgPiB0aGlzLmVuZERhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xzTmFtZSArPSAnIGRpc2FibGVkJztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGhvdXJzID09IGkpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xzTmFtZSArPSAnIGFjdGl2ZSc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGh0bWwucHVzaCgnPHNwYW4gY2xhc3M9XCJob3VyJyArIGNsc05hbWUgKyAnXCI+JyArIGkgKyAnOjAwPC9zcGFuPicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnLmRhdGVwaWNrZXItaG91cnMgdGQnKS5odG1sKGh0bWwuam9pbignJykpO1xuXG4gICAgICAgICAgICBodG1sID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDYwOyBpICs9IHRoaXMubWludXRlU3RlcCkge1xuICAgICAgICAgICAgICAgIHZhciBhY3R1YWwgPSBVVENEYXRlKHllYXIsIG1vbnRoLCBkYXlNb250aCwgaG91cnMsIGkpO1xuICAgICAgICAgICAgICAgIGNsc05hbWUgPSAnJztcbiAgICAgICAgICAgICAgICBpZiAoYWN0dWFsLnZhbHVlT2YoKSA8IHRoaXMuc3RhcnREYXRlIHx8IGFjdHVhbC52YWx1ZU9mKCkgPiB0aGlzLmVuZERhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xzTmFtZSArPSAnIGRpc2FibGVkJztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKE1hdGguZmxvb3IobWludXRlcyAvIHRoaXMubWludXRlU3RlcCkgPT0gTWF0aC5mbG9vcihpIC8gdGhpcy5taW51dGVTdGVwKSkge1xuICAgICAgICAgICAgICAgICAgICBjbHNOYW1lICs9ICcgYWN0aXZlJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaHRtbC5wdXNoKCc8c3BhbiBjbGFzcz1cIm1pbnV0ZScgKyBjbHNOYW1lICsgJ1wiPicgKyBob3VycyArICc6JyArIChpIDwgMTAgPyAnMCcgKyBpIDogaSkgKyAnPC9zcGFuPicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnLmRhdGVwaWNrZXItbWludXRlcyB0ZCcpLmh0bWwoaHRtbC5qb2luKCcnKSk7XG5cblxuICAgICAgICAgICAgdmFyIGN1cnJlbnRZZWFyID0gdGhpcy5kYXRlICYmIHRoaXMuZGF0ZS5nZXRVVENGdWxsWWVhcigpO1xuICAgICAgICAgICAgdmFyIG1vbnRocyA9IHRoaXMucGlja2VyLmZpbmQoJy5kYXRlcGlja2VyLW1vbnRocycpXG4gICAgICAgICAgICAgICAgLmZpbmQoJ3RoOmVxKDEpJylcbiAgICAgICAgICAgICAgICAudGV4dCh5ZWFyKVxuICAgICAgICAgICAgICAgIC5lbmQoKVxuICAgICAgICAgICAgICAgIC5maW5kKCdzcGFuJykucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRZZWFyICYmIGN1cnJlbnRZZWFyID09IHllYXIpIHtcbiAgICAgICAgICAgICAgICBtb250aHMuZXEodGhpcy5kYXRlLmdldFVUQ01vbnRoKCkpLmFkZENsYXNzKCdhY3RpdmUnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh5ZWFyIDwgc3RhcnRZZWFyIHx8IHllYXIgPiBlbmRZZWFyKSB7XG4gICAgICAgICAgICAgICAgbW9udGhzLmFkZENsYXNzKCdkaXNhYmxlZCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHllYXIgPT0gc3RhcnRZZWFyKSB7XG4gICAgICAgICAgICAgICAgbW9udGhzLnNsaWNlKDAsIHN0YXJ0TW9udGgpLmFkZENsYXNzKCdkaXNhYmxlZCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHllYXIgPT0gZW5kWWVhcikge1xuICAgICAgICAgICAgICAgIG1vbnRocy5zbGljZShlbmRNb250aCArIDEpLmFkZENsYXNzKCdkaXNhYmxlZCcpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBodG1sID0gJyc7XG4gICAgICAgICAgICB5ZWFyID0gcGFyc2VJbnQoeWVhciAvIDEwLCAxMCkgKiAxMDtcbiAgICAgICAgICAgIHZhciB5ZWFyQ29udCA9IHRoaXMucGlja2VyLmZpbmQoJy5kYXRlcGlja2VyLXllYXJzJylcbiAgICAgICAgICAgICAgICAuZmluZCgndGg6ZXEoMSknKVxuICAgICAgICAgICAgICAgIC50ZXh0KHllYXIgKyAnLScgKyAoeWVhciArIDkpKVxuICAgICAgICAgICAgICAgIC5lbmQoKVxuICAgICAgICAgICAgICAgIC5maW5kKCd0ZCcpO1xuICAgICAgICAgICAgeWVhciAtPSAxO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IC0xOyBpIDwgMTE7IGkrKykge1xuICAgICAgICAgICAgICAgIGh0bWwgKz0gJzxzcGFuIGNsYXNzPVwieWVhcicgKyAoaSA9PSAtMSB8fCBpID09IDEwID8gJyBvbGQnIDogJycpICsgKGN1cnJlbnRZZWFyID09IHllYXIgPyAnIGFjdGl2ZScgOiAnJykgKyAoeWVhciA8IHN0YXJ0WWVhciB8fCB5ZWFyID4gZW5kWWVhciA/ICcgZGlzYWJsZWQnIDogJycpICsgJ1wiPicgKyB5ZWFyICsgJzwvc3Bhbj4nO1xuICAgICAgICAgICAgICAgIHllYXIgKz0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHllYXJDb250Lmh0bWwoaHRtbCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdXBkYXRlTmF2QXJyb3dzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBkID0gbmV3IERhdGUodGhpcy52aWV3RGF0ZSksXG4gICAgICAgICAgICAgICAgeWVhciA9IGQuZ2V0VVRDRnVsbFllYXIoKSxcbiAgICAgICAgICAgICAgICBtb250aCA9IGQuZ2V0VVRDTW9udGgoKSxcbiAgICAgICAgICAgICAgICBkYXkgPSBkLmdldFVUQ0RhdGUoKSxcbiAgICAgICAgICAgICAgICBob3VyID0gZC5nZXRVVENIb3VycygpO1xuICAgICAgICAgICAgc3dpdGNoICh0aGlzLnZpZXdNb2RlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAwOlxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5zdGFydERhdGUgIT09IC1JbmZpbml0eSAmJiB5ZWFyIDw9IHRoaXMuc3RhcnREYXRlLmdldFVUQ0Z1bGxZZWFyKCkgJiYgbW9udGggPD0gdGhpcy5zdGFydERhdGUuZ2V0VVRDTW9udGgoKSAmJiBkYXkgPD0gdGhpcy5zdGFydERhdGUuZ2V0VVRDRGF0ZSgpICYmIGhvdXIgPD0gdGhpcy5zdGFydERhdGUuZ2V0VVRDSG91cnMoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnLnByZXYnKS5jc3Moe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpc2liaWxpdHk6ICdoaWRkZW4nXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGlja2VyLmZpbmQoJy5wcmV2JykuY3NzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aXNpYmlsaXR5OiAndmlzaWJsZSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmVuZERhdGUgIT09IEluZmluaXR5ICYmIHllYXIgPj0gdGhpcy5lbmREYXRlLmdldFVUQ0Z1bGxZZWFyKCkgJiYgbW9udGggPj0gdGhpcy5lbmREYXRlLmdldFVUQ01vbnRoKCkgJiYgZGF5ID49IHRoaXMuZW5kRGF0ZS5nZXRVVENEYXRlKCkgJiYgaG91ciA+PSB0aGlzLmVuZERhdGUuZ2V0VVRDSG91cnMoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnLm5leHQnKS5jc3Moe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpc2liaWxpdHk6ICdoaWRkZW4nXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGlja2VyLmZpbmQoJy5uZXh0JykuY3NzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aXNpYmlsaXR5OiAndmlzaWJsZSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuc3RhcnREYXRlICE9PSAtSW5maW5pdHkgJiYgeWVhciA8PSB0aGlzLnN0YXJ0RGF0ZS5nZXRVVENGdWxsWWVhcigpICYmIG1vbnRoIDw9IHRoaXMuc3RhcnREYXRlLmdldFVUQ01vbnRoKCkgJiYgZGF5IDw9IHRoaXMuc3RhcnREYXRlLmdldFVUQ0RhdGUoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnLnByZXYnKS5jc3Moe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpc2liaWxpdHk6ICdoaWRkZW4nXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGlja2VyLmZpbmQoJy5wcmV2JykuY3NzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aXNpYmlsaXR5OiAndmlzaWJsZSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmVuZERhdGUgIT09IEluZmluaXR5ICYmIHllYXIgPj0gdGhpcy5lbmREYXRlLmdldFVUQ0Z1bGxZZWFyKCkgJiYgbW9udGggPj0gdGhpcy5lbmREYXRlLmdldFVUQ01vbnRoKCkgJiYgZGF5ID49IHRoaXMuZW5kRGF0ZS5nZXRVVENEYXRlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGlja2VyLmZpbmQoJy5uZXh0JykuY3NzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aXNpYmlsaXR5OiAnaGlkZGVuJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBpY2tlci5maW5kKCcubmV4dCcpLmNzcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlzaWJpbGl0eTogJ3Zpc2libGUnXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnN0YXJ0RGF0ZSAhPT0gLUluZmluaXR5ICYmIHllYXIgPD0gdGhpcy5zdGFydERhdGUuZ2V0VVRDRnVsbFllYXIoKSAmJiBtb250aCA8PSB0aGlzLnN0YXJ0RGF0ZS5nZXRVVENNb250aCgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBpY2tlci5maW5kKCcucHJldicpLmNzcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlzaWJpbGl0eTogJ2hpZGRlbidcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnLnByZXYnKS5jc3Moe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpc2liaWxpdHk6ICd2aXNpYmxlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuZW5kRGF0ZSAhPT0gSW5maW5pdHkgJiYgeWVhciA+PSB0aGlzLmVuZERhdGUuZ2V0VVRDRnVsbFllYXIoKSAmJiBtb250aCA+PSB0aGlzLmVuZERhdGUuZ2V0VVRDTW9udGgoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnLm5leHQnKS5jc3Moe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpc2liaWxpdHk6ICdoaWRkZW4nXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGlja2VyLmZpbmQoJy5uZXh0JykuY3NzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aXNpYmlsaXR5OiAndmlzaWJsZSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnN0YXJ0RGF0ZSAhPT0gLUluZmluaXR5ICYmIHllYXIgPD0gdGhpcy5zdGFydERhdGUuZ2V0VVRDRnVsbFllYXIoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnLnByZXYnKS5jc3Moe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpc2liaWxpdHk6ICdoaWRkZW4nXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGlja2VyLmZpbmQoJy5wcmV2JykuY3NzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aXNpYmlsaXR5OiAndmlzaWJsZSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmVuZERhdGUgIT09IEluZmluaXR5ICYmIHllYXIgPj0gdGhpcy5lbmREYXRlLmdldFVUQ0Z1bGxZZWFyKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGlja2VyLmZpbmQoJy5uZXh0JykuY3NzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aXNpYmlsaXR5OiAnaGlkZGVuJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBpY2tlci5maW5kKCcubmV4dCcpLmNzcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlzaWJpbGl0eTogJ3Zpc2libGUnXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBjbGljazogZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAgICAgaWYgKCQoZS50YXJnZXQpLmhhc0NsYXNzKCdkYXRlcGlja2VyLWNsb3NlJykgfHwgJChlLnRhcmdldCkucGFyZW50KCkuaGFzQ2xhc3MoJ2RhdGVwaWNrZXItY2xvc2UnKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuaGlkZSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgdGFyZ2V0ID0gJChlLnRhcmdldCkuY2xvc2VzdCgnc3BhbiwgdGQsIHRoJyk7XG4gICAgICAgICAgICBpZiAodGFyZ2V0Lmxlbmd0aCA9PSAxKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRhcmdldC5pcygnLmRpc2FibGVkJykpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LnRyaWdnZXIoe1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ291dE9mUmFuZ2UnLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZTogdGhpcy52aWV3RGF0ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0RGF0ZTogdGhpcy5zdGFydERhdGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmREYXRlOiB0aGlzLmVuZERhdGVcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBzd2l0Y2ggKHRhcmdldFswXS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3RoJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaCAodGFyZ2V0WzBdLmNsYXNzTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2RhdGUtc3dpdGNoJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zaG93TW9kZSgxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAncHJldic6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnbmV4dCc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkaXIgPSBEUEdsb2JhbC5tb2Rlc1t0aGlzLnZpZXdNb2RlXS5uYXZTdGVwICogKHRhcmdldFswXS5jbGFzc05hbWUgPT0gJ3ByZXYnID8gLTEgOiAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoICh0aGlzLnZpZXdNb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy52aWV3RGF0ZSA9IHRoaXMubW92ZUhvdXIodGhpcy52aWV3RGF0ZSwgZGlyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXdEYXRlID0gdGhpcy5tb3ZlRGF0ZSh0aGlzLnZpZXdEYXRlLCBkaXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudmlld0RhdGUgPSB0aGlzLm1vdmVNb250aCh0aGlzLnZpZXdEYXRlLCBkaXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSA0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudmlld0RhdGUgPSB0aGlzLm1vdmVZZWFyKHRoaXMudmlld0RhdGUsIGRpcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5maWxsKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3RvZGF5JzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRlID0gVVRDRGF0ZShkYXRlLmdldEZ1bGxZZWFyKCksIGRhdGUuZ2V0TW9udGgoKSwgZGF0ZS5nZXREYXRlKCksIGRhdGUuZ2V0SG91cnMoKSwgZGF0ZS5nZXRNaW51dGVzKCksIGRhdGUuZ2V0U2Vjb25kcygpKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXdNb2RlID0gdGhpcy5zdGFydFZpZXdNb2RlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNob3dNb2RlKDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9zZXREYXRlKGRhdGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdzcGFuJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGFyZ2V0LmlzKCcuZGlzYWJsZWQnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0YXJnZXQuaXMoJy5tb250aCcpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5taW5WaWV3ID09PSAzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtb250aCA9IHRhcmdldC5wYXJlbnQoKS5maW5kKCdzcGFuJykuaW5kZXgodGFyZ2V0KSB8fCAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgeWVhciA9IHRoaXMudmlld0RhdGUuZ2V0VVRDRnVsbFllYXIoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRheSA9IDEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBob3VycyA9IHRoaXMudmlld0RhdGUuZ2V0VVRDSG91cnMoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pbnV0ZXMgPSB0aGlzLnZpZXdEYXRlLmdldFVUQ01pbnV0ZXMoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlY29uZHMgPSB0aGlzLnZpZXdEYXRlLmdldFVUQ1NlY29uZHMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2V0RGF0ZShVVENEYXRlKHllYXIsIG1vbnRoLCBkYXksIGhvdXJzLCBtaW51dGVzLCBzZWNvbmRzLCAwKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXdEYXRlLnNldFVUQ0RhdGUoMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtb250aCA9IHRhcmdldC5wYXJlbnQoKS5maW5kKCdzcGFuJykuaW5kZXgodGFyZ2V0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy52aWV3RGF0ZS5zZXRVVENNb250aChtb250aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudC50cmlnZ2VyKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdjaGFuZ2VNb250aCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRlOiB0aGlzLnZpZXdEYXRlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGFyZ2V0LmlzKCcueWVhcicpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5taW5WaWV3ID09PSA0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB5ZWFyID0gcGFyc2VJbnQodGFyZ2V0LnRleHQoKSwgMTApIHx8IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtb250aCA9IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXkgPSAxLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaG91cnMgPSB0aGlzLnZpZXdEYXRlLmdldFVUQ0hvdXJzKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaW51dGVzID0gdGhpcy52aWV3RGF0ZS5nZXRVVENNaW51dGVzKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWNvbmRzID0gdGhpcy52aWV3RGF0ZS5nZXRVVENTZWNvbmRzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3NldERhdGUoVVRDRGF0ZSh5ZWFyLCBtb250aCwgZGF5LCBob3VycywgbWludXRlcywgc2Vjb25kcywgMCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy52aWV3RGF0ZS5zZXRVVENEYXRlKDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgeWVhciA9IHBhcnNlSW50KHRhcmdldC50ZXh0KCksIDEwKSB8fCAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXdEYXRlLnNldFVUQ0Z1bGxZZWFyKHllYXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQudHJpZ2dlcih7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnY2hhbmdlWWVhcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRlOiB0aGlzLnZpZXdEYXRlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGFyZ2V0LmlzKCcuaG91cicpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBob3VycyA9IHBhcnNlSW50KHRhcmdldC50ZXh0KCksIDEwKSB8fCAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgeWVhciA9IHRoaXMudmlld0RhdGUuZ2V0VVRDRnVsbFllYXIoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vbnRoID0gdGhpcy52aWV3RGF0ZS5nZXRVVENNb250aCgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF5ID0gdGhpcy52aWV3RGF0ZS5nZXRVVENEYXRlKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaW51dGVzID0gdGhpcy52aWV3RGF0ZS5nZXRVVENNaW51dGVzKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWNvbmRzID0gdGhpcy52aWV3RGF0ZS5nZXRVVENTZWNvbmRzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3NldERhdGUoVVRDRGF0ZSh5ZWFyLCBtb250aCwgZGF5LCBob3VycywgbWludXRlcywgc2Vjb25kcywgMCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGFyZ2V0LmlzKCcubWludXRlJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1pbnV0ZXMgPSBwYXJzZUludCh0YXJnZXQudGV4dCgpLnN1YnN0cih0YXJnZXQudGV4dCgpLmluZGV4T2YoJzonKSArIDEpLCAxMCkgfHwgMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHllYXIgPSB0aGlzLnZpZXdEYXRlLmdldFVUQ0Z1bGxZZWFyKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb250aCA9IHRoaXMudmlld0RhdGUuZ2V0VVRDTW9udGgoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRheSA9IHRoaXMudmlld0RhdGUuZ2V0VVRDRGF0ZSgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaG91cnMgPSB0aGlzLnZpZXdEYXRlLmdldFVUQ0hvdXJzKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWNvbmRzID0gdGhpcy52aWV3RGF0ZS5nZXRVVENTZWNvbmRzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3NldERhdGUoVVRDRGF0ZSh5ZWFyLCBtb250aCwgZGF5LCBob3VycywgbWludXRlcywgc2Vjb25kcywgMCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy52aWV3TW9kZSAhPSAwKSB7XG5cblxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBvbGRWaWV3TW9kZSA9IHRoaXMudmlld01vZGU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2hvd01vZGUoLTEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZpbGwoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9sZFZpZXdNb2RlID09IHRoaXMudmlld01vZGUgJiYgdGhpcy5hdXRvY2xvc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaGlkZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5maWxsKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmF1dG9jbG9zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5oaWRlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAndGQnOlxuXG5cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRhcmdldC5pcygnLmRheScpICYmICF0YXJnZXQuaXMoJy5kaXNhYmxlZCcpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRheSA9IHBhcnNlSW50KHRhcmdldC50ZXh0KCksIDEwKSB8fCAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB5ZWFyID0gdGhpcy52aWV3RGF0ZS5nZXRVVENGdWxsWWVhcigpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb250aCA9IHRoaXMudmlld0RhdGUuZ2V0VVRDTW9udGgoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaG91cnMgPSB0aGlzLnZpZXdEYXRlLmdldFVUQ0hvdXJzKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pbnV0ZXMgPSB0aGlzLnZpZXdEYXRlLmdldFVUQ01pbnV0ZXMoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2Vjb25kcyA9IHRoaXMudmlld0RhdGUuZ2V0VVRDU2Vjb25kcygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0YXJnZXQuaXMoJy5vbGQnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobW9udGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vbnRoID0gMTE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5ZWFyIC09IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb250aCAtPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0YXJnZXQuaXMoJy5uZXcnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobW9udGggPT0gMTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vbnRoID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHllYXIgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vbnRoICs9IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2V0RGF0ZShVVENEYXRlKHllYXIsIG1vbnRoLCBkYXksIGhvdXJzLCBtaW51dGVzLCBzZWNvbmRzLCAwKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cblxuXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgb2xkVmlld01vZGUgPSB0aGlzLnZpZXdNb2RlO1xuXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2hvd01vZGUoLTEpO1xuXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZmlsbCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9sZFZpZXdNb2RlID09IHRoaXMudmlld01vZGUgJiYgdGhpcy5hdXRvY2xvc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmhpZGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBfc2V0RGF0ZTogZnVuY3Rpb24oZGF0ZSwgd2hpY2gpIHtcblxuICAgICAgICAgICAgaWYgKCF3aGljaCB8fCB3aGljaCA9PSAnZGF0ZScpXG4gICAgICAgICAgICAgICAgdGhpcy5kYXRlID0gZGF0ZTtcbiAgICAgICAgICAgIGlmICghd2hpY2ggfHwgd2hpY2ggPT0gJ3ZpZXcnKVxuICAgICAgICAgICAgICAgIHRoaXMudmlld0RhdGUgPSBkYXRlO1xuICAgICAgICAgICAgdGhpcy5maWxsKCk7XG4gICAgICAgICAgICB0aGlzLnNldFZhbHVlKCk7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQudHJpZ2dlcih7XG4gICAgICAgICAgICAgICAgdHlwZTogJ2NoYW5nZURhdGUnLFxuICAgICAgICAgICAgICAgIGRhdGU6IHRoaXMuZGF0ZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB2YXIgZWxlbWVudDtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzSW5wdXQpIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50ID0gdGhpcy5lbGVtZW50O1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLmNvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgIGVsZW1lbnQgPSB0aGlzLmVsZW1lbnQuZmluZCgnaW5wdXQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5jaGFuZ2UoKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5hdXRvY2xvc2UgJiYgKCF3aGljaCB8fCB3aGljaCA9PSAnZGF0ZScpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHRoaXMuaGlkZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBtb3ZlSG91cjogZnVuY3Rpb24oZGF0ZSwgZGlyKSB7XG4gICAgICAgICAgICBpZiAoIWRpcikgcmV0dXJuIGRhdGU7XG4gICAgICAgICAgICB2YXIgbmV3X2RhdGUgPSBuZXcgRGF0ZShkYXRlLnZhbHVlT2YoKSk7XG4gICAgICAgICAgICBkaXIgPSBkaXIgPiAwID8gMSA6IC0xO1xuICAgICAgICAgICAgbmV3X2RhdGUuc2V0VVRDSG91cnMobmV3X2RhdGUuZ2V0VVRDSG91cnMoKSArIGRpcik7XG4gICAgICAgICAgICByZXR1cm4gbmV3X2RhdGU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgbW92ZURhdGU6IGZ1bmN0aW9uKGRhdGUsIGRpcikge1xuICAgICAgICAgICAgaWYgKCFkaXIpIHJldHVybiBkYXRlO1xuICAgICAgICAgICAgdmFyIG5ld19kYXRlID0gbmV3IERhdGUoZGF0ZS52YWx1ZU9mKCkpO1xuICAgICAgICAgICAgZGlyID0gZGlyID4gMCA/IDEgOiAtMTtcbiAgICAgICAgICAgIG5ld19kYXRlLnNldFVUQ0RhdGUobmV3X2RhdGUuZ2V0VVRDRGF0ZSgpICsgZGlyKTtcbiAgICAgICAgICAgIHJldHVybiBuZXdfZGF0ZTtcbiAgICAgICAgfSxcblxuICAgICAgICBtb3ZlTW9udGg6IGZ1bmN0aW9uKGRhdGUsIGRpcikge1xuICAgICAgICAgICAgaWYgKCFkaXIpIHJldHVybiBkYXRlO1xuICAgICAgICAgICAgdmFyIG5ld19kYXRlID0gbmV3IERhdGUoZGF0ZS52YWx1ZU9mKCkpLFxuICAgICAgICAgICAgICAgIGRheSA9IG5ld19kYXRlLmdldFVUQ0RhdGUoKSxcbiAgICAgICAgICAgICAgICBtb250aCA9IG5ld19kYXRlLmdldFVUQ01vbnRoKCksXG4gICAgICAgICAgICAgICAgbWFnID0gTWF0aC5hYnMoZGlyKSxcbiAgICAgICAgICAgICAgICBuZXdfbW9udGgsIHRlc3Q7XG4gICAgICAgICAgICBkaXIgPSBkaXIgPiAwID8gMSA6IC0xO1xuICAgICAgICAgICAgaWYgKG1hZyA9PSAxKSB7XG4gICAgICAgICAgICAgICAgdGVzdCA9IGRpciA9PSAtMVxuICAgICAgICAgICAgICAgICAgICAvLyBJZiBnb2luZyBiYWNrIG9uZSBtb250aCwgbWFrZSBzdXJlIG1vbnRoIGlzIG5vdCBjdXJyZW50IG1vbnRoXG4gICAgICAgICAgICAgICAgICAgIC8vIChlZywgTWFyIDMxIC0+IEZlYiAzMSA9PSBGZWIgMjgsIG5vdCBNYXIgMDIpXG4gICAgICAgICAgICAgICAgICAgID8gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3X2RhdGUuZ2V0VVRDTW9udGgoKSA9PSBtb250aDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyBJZiBnb2luZyBmb3J3YXJkIG9uZSBtb250aCwgbWFrZSBzdXJlIG1vbnRoIGlzIGFzIGV4cGVjdGVkXG4gICAgICAgICAgICAgICAgICAgIC8vIChlZywgSmFuIDMxIC0+IEZlYiAzMSA9PSBGZWIgMjgsIG5vdCBNYXIgMDIpXG4gICAgICAgICAgICAgICAgICAgIDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3X2RhdGUuZ2V0VVRDTW9udGgoKSAhPSBuZXdfbW9udGg7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgbmV3X21vbnRoID0gbW9udGggKyBkaXI7XG4gICAgICAgICAgICAgICAgbmV3X2RhdGUuc2V0VVRDTW9udGgobmV3X21vbnRoKTtcbiAgICAgICAgICAgICAgICAvLyBEZWMgLT4gSmFuICgxMikgb3IgSmFuIC0+IERlYyAoLTEpIC0tIGxpbWl0IGV4cGVjdGVkIGRhdGUgdG8gMC0xMVxuICAgICAgICAgICAgICAgIGlmIChuZXdfbW9udGggPCAwIHx8IG5ld19tb250aCA+IDExKVxuICAgICAgICAgICAgICAgICAgICBuZXdfbW9udGggPSAobmV3X21vbnRoICsgMTIpICUgMTI7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIEZvciBtYWduaXR1ZGVzID4xLCBtb3ZlIG9uZSBtb250aCBhdCBhIHRpbWUuLi5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1hZzsgaSsrKVxuICAgICAgICAgICAgICAgIC8vIC4uLndoaWNoIG1pZ2h0IGRlY3JlYXNlIHRoZSBkYXkgKGVnLCBKYW4gMzEgdG8gRmViIDI4LCBldGMpLi4uXG4gICAgICAgICAgICAgICAgICAgIG5ld19kYXRlID0gdGhpcy5tb3ZlTW9udGgobmV3X2RhdGUsIGRpcik7XG4gICAgICAgICAgICAgICAgLy8gLi4udGhlbiByZXNldCB0aGUgZGF5LCBrZWVwaW5nIGl0IGluIHRoZSBuZXcgbW9udGhcbiAgICAgICAgICAgICAgICBuZXdfbW9udGggPSBuZXdfZGF0ZS5nZXRVVENNb250aCgpO1xuICAgICAgICAgICAgICAgIG5ld19kYXRlLnNldFVUQ0RhdGUoZGF5KTtcbiAgICAgICAgICAgICAgICB0ZXN0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXdfbW9udGggIT0gbmV3X2RhdGUuZ2V0VVRDTW9udGgoKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gQ29tbW9uIGRhdGUtcmVzZXR0aW5nIGxvb3AgLS0gaWYgZGF0ZSBpcyBiZXlvbmQgZW5kIG9mIG1vbnRoLCBtYWtlIGl0XG4gICAgICAgICAgICAvLyBlbmQgb2YgbW9udGhcbiAgICAgICAgICAgIHdoaWxlICh0ZXN0KCkpIHtcbiAgICAgICAgICAgICAgICBuZXdfZGF0ZS5zZXRVVENEYXRlKC0tZGF5KTtcbiAgICAgICAgICAgICAgICBuZXdfZGF0ZS5zZXRVVENNb250aChuZXdfbW9udGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG5ld19kYXRlO1xuICAgICAgICB9LFxuXG4gICAgICAgIG1vdmVZZWFyOiBmdW5jdGlvbihkYXRlLCBkaXIpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm1vdmVNb250aChkYXRlLCBkaXIgKiAxMik7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZGF0ZVdpdGhpblJhbmdlOiBmdW5jdGlvbihkYXRlKSB7XG4gICAgICAgICAgICByZXR1cm4gZGF0ZSA+PSB0aGlzLnN0YXJ0RGF0ZSAmJiBkYXRlIDw9IHRoaXMuZW5kRGF0ZTtcbiAgICAgICAgfSxcblxuICAgICAgICBrZXlkb3duOiBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMua2V5Ym9hcmROYXZpZ2F0aW9uKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5waWNrZXIuaXMoJzpub3QoOnZpc2libGUpJykpIHtcbiAgICAgICAgICAgICAgICBpZiAoZS5rZXlDb2RlID09IDI3KSAvLyBhbGxvdyBlc2NhcGUgdG8gaGlkZSBhbmQgcmUtc2hvdyBwaWNrZXJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zaG93KCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGRhdGVDaGFuZ2VkID0gZmFsc2UsXG4gICAgICAgICAgICAgICAgZGlyLCBkYXksIG1vbnRoLFxuICAgICAgICAgICAgICAgIG5ld0RhdGUsIG5ld1ZpZXdEYXRlO1xuICAgICAgICAgICAgc3dpdGNoIChlLmtleUNvZGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlIDI3OiAvLyBlc2NhcGVcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oaWRlKCk7XG4gICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAzNzogLy8gbGVmdFxuICAgICAgICAgICAgICAgIGNhc2UgMzk6IC8vIHJpZ2h0XG4gICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5rZXlib2FyZE5hdmlnYXRpb24pIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBkaXIgPSBlLmtleUNvZGUgPT0gMzcgPyAtMSA6IDE7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlLmN0cmxLZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0RhdGUgPSB0aGlzLm1vdmVZZWFyKHRoaXMuZGF0ZSwgZGlyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld1ZpZXdEYXRlID0gdGhpcy5tb3ZlWWVhcih0aGlzLnZpZXdEYXRlLCBkaXIpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGUuc2hpZnRLZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0RhdGUgPSB0aGlzLm1vdmVNb250aCh0aGlzLmRhdGUsIGRpcik7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdWaWV3RGF0ZSA9IHRoaXMubW92ZU1vbnRoKHRoaXMudmlld0RhdGUsIGRpcik7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdEYXRlID0gbmV3IERhdGUodGhpcy5kYXRlLnZhbHVlT2YoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdEYXRlLnNldFVUQ0RhdGUodGhpcy5kYXRlLmdldFVUQ0RhdGUoKSArIGRpcik7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdWaWV3RGF0ZSA9IG5ldyBEYXRlKHRoaXMudmlld0RhdGUudmFsdWVPZigpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld1ZpZXdEYXRlLnNldFVUQ0RhdGUodGhpcy52aWV3RGF0ZS5nZXRVVENEYXRlKCkgKyBkaXIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmRhdGVXaXRoaW5SYW5nZShuZXdEYXRlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kYXRlID0gbmV3RGF0ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudmlld0RhdGUgPSBuZXdWaWV3RGF0ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0VmFsdWUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRlQ2hhbmdlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAzODogLy8gdXBcbiAgICAgICAgICAgICAgICBjYXNlIDQwOiAvLyBkb3duXG4gICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5rZXlib2FyZE5hdmlnYXRpb24pIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBkaXIgPSBlLmtleUNvZGUgPT0gMzggPyAtMSA6IDE7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlLmN0cmxLZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0RhdGUgPSB0aGlzLm1vdmVZZWFyKHRoaXMuZGF0ZSwgZGlyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld1ZpZXdEYXRlID0gdGhpcy5tb3ZlWWVhcih0aGlzLnZpZXdEYXRlLCBkaXIpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGUuc2hpZnRLZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0RhdGUgPSB0aGlzLm1vdmVNb250aCh0aGlzLmRhdGUsIGRpcik7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdWaWV3RGF0ZSA9IHRoaXMubW92ZU1vbnRoKHRoaXMudmlld0RhdGUsIGRpcik7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdEYXRlID0gbmV3IERhdGUodGhpcy5kYXRlLnZhbHVlT2YoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdEYXRlLnNldFVUQ0RhdGUodGhpcy5kYXRlLmdldFVUQ0RhdGUoKSArIGRpciAqIDcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3Vmlld0RhdGUgPSBuZXcgRGF0ZSh0aGlzLnZpZXdEYXRlLnZhbHVlT2YoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdWaWV3RGF0ZS5zZXRVVENEYXRlKHRoaXMudmlld0RhdGUuZ2V0VVRDRGF0ZSgpICsgZGlyICogNyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuZGF0ZVdpdGhpblJhbmdlKG5ld0RhdGUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRhdGUgPSBuZXdEYXRlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy52aWV3RGF0ZSA9IG5ld1ZpZXdEYXRlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRWYWx1ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGVDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDEzOiAvLyBlbnRlclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmhpZGUoKTtcbiAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDk6IC8vIHRhYlxuICAgICAgICAgICAgICAgICAgICB0aGlzLmhpZGUoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZGF0ZUNoYW5nZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQudHJpZ2dlcih7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdjaGFuZ2VEYXRlJyxcbiAgICAgICAgICAgICAgICAgICAgZGF0ZTogdGhpcy5kYXRlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdmFyIGVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaXNJbnB1dCkge1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50ID0gdGhpcy5lbGVtZW50O1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5jb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudCA9IHRoaXMuZWxlbWVudC5maW5kKCdpbnB1dCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmNoYW5nZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBzaG93TW9kZTogZnVuY3Rpb24oZGlyKSB7XG5cbiAgICAgICAgICAgIGlmIChkaXIpIHtcbiAgICAgICAgICAgICAgICB2YXIgbmV3Vmlld01vZGUgPSBNYXRoLm1heCgwLCBNYXRoLm1pbihEUEdsb2JhbC5tb2Rlcy5sZW5ndGggLSAxLCB0aGlzLnZpZXdNb2RlICsgZGlyKSk7XG4gICAgICAgICAgICAgICAgaWYgKG5ld1ZpZXdNb2RlID49IHRoaXMubWluVmlldyAmJiBuZXdWaWV3TW9kZSA8PSB0aGlzLm1heFZpZXcpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZSA9IG5ld1ZpZXdNb2RlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8qXG4gICAgICAgICAgICBcdHZpdGFsZXRzOiBmaXhpbmcgYnVnIG9mIHZlcnkgc3BlY2lhbCBjb25kaXRpb25zOlxuICAgICAgICAgICAgXHRqcXVlcnkgMS43LjEgKyB3ZWJraXQgKyBzaG93IGlubGluZSBkYXRlcGlja2VyIGluIGJvb3RzdHJhcCBwb3BvdmVyLlxuICAgICAgICAgICAgXHRNZXRob2Qgc2hvdygpIGRvZXMgbm90IHNldCBkaXNwbGF5IGNzcyBjb3JyZWN0bHkgYW5kIGRhdGVwaWNrZXIgaXMgbm90IHNob3duLlxuICAgICAgICAgICAgXHRDaGFuZ2VkIHRvIC5jc3MoJ2Rpc3BsYXknLCAnYmxvY2snKSBzb2x2ZSB0aGUgcHJvYmxlbS5cbiAgICAgICAgICAgIFx0U2VlIGh0dHBzOi8vZ2l0aHViLmNvbS92aXRhbGV0cy94LWVkaXRhYmxlL2lzc3Vlcy8zN1xuXG4gICAgICAgICAgICBcdEluIGpxdWVyeSAxLjcuMisgZXZlcnl0aGluZyB3b3JrcyBmaW5lLlxuICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIC8vdGhpcy5waWNrZXIuZmluZCgnPmRpdicpLmhpZGUoKS5maWx0ZXIoJy5kYXRlcGlja2VyLScrRFBHbG9iYWwubW9kZXNbdGhpcy52aWV3TW9kZV0uY2xzTmFtZSkuc2hvdygpO1xuICAgICAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnPmRpdicpLmhpZGUoKS5maWx0ZXIoJy5kYXRlcGlja2VyLScgKyBEUEdsb2JhbC5tb2Rlc1t0aGlzLnZpZXdNb2RlXS5jbHNOYW1lKS5jc3MoJ2Rpc3BsYXknLCAnYmxvY2snKTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlTmF2QXJyb3dzKCk7XG4gICAgICAgIH0sXG4gICAgICAgIHJlc2V0OiBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICB0aGlzLl9zZXREYXRlKG51bGwsICdkYXRlJyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgJC5mbi5mZGF0ZXBpY2tlciA9IGZ1bmN0aW9uKG9wdGlvbikge1xuICAgICAgICB2YXIgYXJncyA9IEFycmF5LmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgICAgIGFyZ3Muc2hpZnQoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciAkdGhpcyA9ICQodGhpcyksXG4gICAgICAgICAgICAgICAgZGF0YSA9ICR0aGlzLmRhdGEoJ2RhdGVwaWNrZXInKSxcbiAgICAgICAgICAgICAgICBvcHRpb25zID0gdHlwZW9mIG9wdGlvbiA9PSAnb2JqZWN0JyAmJiBvcHRpb247XG4gICAgICAgICAgICBpZiAoIWRhdGEpIHtcbiAgICAgICAgICAgICAgICAkdGhpcy5kYXRhKCdkYXRlcGlja2VyJywgKGRhdGEgPSBuZXcgRGF0ZXBpY2tlcih0aGlzLCAkLmV4dGVuZCh7fSwgJC5mbi5mZGF0ZXBpY2tlci5kZWZhdWx0cywgb3B0aW9ucykpKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9wdGlvbiA9PSAnc3RyaW5nJyAmJiB0eXBlb2YgZGF0YVtvcHRpb25dID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBkYXRhW29wdGlvbl0uYXBwbHkoZGF0YSwgYXJncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAkLmZuLmZkYXRlcGlja2VyLmRlZmF1bHRzID0ge1xuICAgICAgICBvblJlbmRlcjogZnVuY3Rpb24oZGF0ZSkge1xuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAkLmZuLmZkYXRlcGlja2VyLkNvbnN0cnVjdG9yID0gRGF0ZXBpY2tlcjtcbiAgICB2YXIgZGF0ZXMgPSAkLmZuLmZkYXRlcGlja2VyLmRhdGVzID0ge1xuICAgICAgICAnZW4nOiB7XG4gICAgICAgICAgICBkYXlzOiBbXCJTdW5kYXlcIiwgXCJNb25kYXlcIiwgXCJUdWVzZGF5XCIsIFwiV2VkbmVzZGF5XCIsIFwiVGh1cnNkYXlcIiwgXCJGcmlkYXlcIiwgXCJTYXR1cmRheVwiLCBcIlN1bmRheVwiXSxcbiAgICAgICAgICAgIGRheXNTaG9ydDogW1wiU3VuXCIsIFwiTW9uXCIsIFwiVHVlXCIsIFwiV2VkXCIsIFwiVGh1XCIsIFwiRnJpXCIsIFwiU2F0XCIsIFwiU3VuXCJdLFxuICAgICAgICAgICAgZGF5c01pbjogW1wiU3VcIiwgXCJNb1wiLCBcIlR1XCIsIFwiV2VcIiwgXCJUaFwiLCBcIkZyXCIsIFwiU2FcIiwgXCJTdVwiXSxcbiAgICAgICAgICAgIG1vbnRoczogW1wiSmFudWFyeVwiLCBcIkZlYnJ1YXJ5XCIsIFwiTWFyY2hcIiwgXCJBcHJpbFwiLCBcIk1heVwiLCBcIkp1bmVcIiwgXCJKdWx5XCIsIFwiQXVndXN0XCIsIFwiU2VwdGVtYmVyXCIsIFwiT2N0b2JlclwiLCBcIk5vdmVtYmVyXCIsIFwiRGVjZW1iZXJcIl0sXG4gICAgICAgICAgICBtb250aHNTaG9ydDogW1wiSmFuXCIsIFwiRmViXCIsIFwiTWFyXCIsIFwiQXByXCIsIFwiTWF5XCIsIFwiSnVuXCIsIFwiSnVsXCIsIFwiQXVnXCIsIFwiU2VwXCIsIFwiT2N0XCIsIFwiTm92XCIsIFwiRGVjXCJdLFxuICAgICAgICAgICAgdG9kYXk6IFwiVG9kYXlcIixcbiAgICAgICAgICAgIHRpdGxlRm9ybWF0OiBcIk1NIHl5eXlcIlxuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciBEUEdsb2JhbCA9IHtcbiAgICAgICAgbW9kZXM6IFt7XG4gICAgICAgICAgICBjbHNOYW1lOiAnbWludXRlcycsXG4gICAgICAgICAgICBuYXZGbmM6ICdIb3VycycsXG4gICAgICAgICAgICBuYXZTdGVwOiAxXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIGNsc05hbWU6ICdob3VycycsXG4gICAgICAgICAgICBuYXZGbmM6ICdEYXRlJyxcbiAgICAgICAgICAgIG5hdlN0ZXA6IDFcbiAgICAgICAgfSwge1xuICAgICAgICAgICAgY2xzTmFtZTogJ2RheXMnLFxuICAgICAgICAgICAgbmF2Rm5jOiAnTW9udGgnLFxuICAgICAgICAgICAgbmF2U3RlcDogMVxuICAgICAgICB9LCB7XG4gICAgICAgICAgICBjbHNOYW1lOiAnbW9udGhzJyxcbiAgICAgICAgICAgIG5hdkZuYzogJ0Z1bGxZZWFyJyxcbiAgICAgICAgICAgIG5hdlN0ZXA6IDFcbiAgICAgICAgfSwge1xuICAgICAgICAgICAgY2xzTmFtZTogJ3llYXJzJyxcbiAgICAgICAgICAgIG5hdkZuYzogJ0Z1bGxZZWFyJyxcbiAgICAgICAgICAgIG5hdlN0ZXA6IDEwXG4gICAgICAgIH1dLFxuICAgICAgICBpc0xlYXBZZWFyOiBmdW5jdGlvbih5ZWFyKSB7XG4gICAgICAgICAgICByZXR1cm4gKCgoeWVhciAlIDQgPT09IDApICYmICh5ZWFyICUgMTAwICE9PSAwKSkgfHwgKHllYXIgJSA0MDAgPT09IDApKTtcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0RGF5c0luTW9udGg6IGZ1bmN0aW9uKHllYXIsIG1vbnRoKSB7XG4gICAgICAgICAgICByZXR1cm4gWzMxLCAoRFBHbG9iYWwuaXNMZWFwWWVhcih5ZWFyKSA/IDI5IDogMjgpLCAzMSwgMzAsIDMxLCAzMCwgMzEsIDMxLCAzMCwgMzEsIDMwLCAzMV1bbW9udGhdO1xuICAgICAgICB9LFxuICAgICAgICB2YWxpZFBhcnRzOiAvaGg/fGlpP3xzcz98ZGQ/fG1tP3xNTT98eXkoPzp5eSk/L2csXG4gICAgICAgIG5vbnB1bmN0dWF0aW9uOiAvW14gLVxcLzotQFxcW1xcdTM0MDAtXFx1OWZmZi1gey1+XFx0XFxuXFxyXSsvZyxcbiAgICAgICAgcGFyc2VGb3JtYXQ6IGZ1bmN0aW9uKGZvcm1hdCkge1xuICAgICAgICAgICAgLy8gSUUgdHJlYXRzIFxcMCBhcyBhIHN0cmluZyBlbmQgaW4gaW5wdXRzICh0cnVuY2F0aW5nIHRoZSB2YWx1ZSksXG4gICAgICAgICAgICAvLyBzbyBpdCdzIGEgYmFkIGZvcm1hdCBkZWxpbWl0ZXIsIGFueXdheVxuICAgICAgICAgICAgdmFyIHNlcGFyYXRvcnMgPSBmb3JtYXQucmVwbGFjZSh0aGlzLnZhbGlkUGFydHMsICdcXDAnKS5zcGxpdCgnXFwwJyksXG4gICAgICAgICAgICAgICAgcGFydHMgPSBmb3JtYXQubWF0Y2godGhpcy52YWxpZFBhcnRzKTtcbiAgICAgICAgICAgIGlmICghc2VwYXJhdG9ycyB8fCAhc2VwYXJhdG9ycy5sZW5ndGggfHwgIXBhcnRzIHx8IHBhcnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgZGF0ZSBmb3JtYXQuXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5mb3JtYXRUZXh0ID0gZm9ybWF0O1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzZXBhcmF0b3JzOiBzZXBhcmF0b3JzLFxuICAgICAgICAgICAgICAgIHBhcnRzOiBwYXJ0c1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgcGFyc2VEYXRlOiBmdW5jdGlvbihkYXRlLCBmb3JtYXQsIGxhbmd1YWdlKSB7XG4gICAgICAgICAgICBpZiAoZGF0ZSBpbnN0YW5jZW9mIERhdGUpIHJldHVybiBuZXcgRGF0ZShkYXRlLnZhbHVlT2YoKSAtIGRhdGUuZ2V0VGltZXpvbmVPZmZzZXQoKSAqIDYwMDAwKTtcbiAgICAgICAgICAgIGlmICgvXlxcZHs0fVxcLVxcZHsxLDJ9XFwtXFxkezEsMn0kLy50ZXN0KGRhdGUpKSB7XG4gICAgICAgICAgICAgICAgZm9ybWF0ID0gdGhpcy5wYXJzZUZvcm1hdCgneXl5eS1tbS1kZCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKC9eXFxkezR9XFwtXFxkezEsMn1cXC1cXGR7MSwyfVtUIF1cXGR7MSwyfVxcOlxcZHsxLDJ9JC8udGVzdChkYXRlKSkge1xuICAgICAgICAgICAgICAgIGZvcm1hdCA9IHRoaXMucGFyc2VGb3JtYXQoJ3l5eXktbW0tZGQgaGg6aWknKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICgvXlxcZHs0fVxcLVxcZHsxLDJ9XFwtXFxkezEsMn1bVCBdXFxkezEsMn1cXDpcXGR7MSwyfVxcOlxcZHsxLDJ9W1pdezAsMX0kLy50ZXN0KGRhdGUpKSB7XG4gICAgICAgICAgICAgICAgZm9ybWF0ID0gdGhpcy5wYXJzZUZvcm1hdCgneXl5eS1tbS1kZCBoaDppaTpzcycpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKC9eWy0rXVxcZCtbZG13eV0oW1xccyxdK1stK11cXGQrW2Rtd3ldKSokLy50ZXN0KGRhdGUpKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhcnRfcmUgPSAvKFstK11cXGQrKShbZG13eV0pLyxcbiAgICAgICAgICAgICAgICAgICAgcGFydHMgPSBkYXRlLm1hdGNoKC8oWy0rXVxcZCspKFtkbXd5XSkvZyksXG4gICAgICAgICAgICAgICAgICAgIHBhcnQsIGRpcjtcbiAgICAgICAgICAgICAgICBkYXRlID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcnQgPSBwYXJ0X3JlLmV4ZWMocGFydHNbaV0pO1xuICAgICAgICAgICAgICAgICAgICBkaXIgPSBwYXJzZUludChwYXJ0WzFdKTtcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChwYXJ0WzJdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdkJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRlLnNldFVUQ0RhdGUoZGF0ZS5nZXRVVENEYXRlKCkgKyBkaXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnbSc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZSA9IERhdGV0aW1lcGlja2VyLnByb3RvdHlwZS5tb3ZlTW9udGguY2FsbChEYXRldGltZXBpY2tlci5wcm90b3R5cGUsIGRhdGUsIGRpcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICd3JzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRlLnNldFVUQ0RhdGUoZGF0ZS5nZXRVVENEYXRlKCkgKyBkaXIgKiA3KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3knOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGUgPSBEYXRldGltZXBpY2tlci5wcm90b3R5cGUubW92ZVllYXIuY2FsbChEYXRldGltZXBpY2tlci5wcm90b3R5cGUsIGRhdGUsIGRpcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIFVUQ0RhdGUoZGF0ZS5nZXRVVENGdWxsWWVhcigpLCBkYXRlLmdldFVUQ01vbnRoKCksIGRhdGUuZ2V0VVRDRGF0ZSgpLCBkYXRlLmdldFVUQ0hvdXJzKCksIGRhdGUuZ2V0VVRDTWludXRlcygpLCBkYXRlLmdldFVUQ1NlY29uZHMoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgcGFydHMgPSBkYXRlICYmIGRhdGUubWF0Y2godGhpcy5ub25wdW5jdHVhdGlvbikgfHwgW10sXG4gICAgICAgICAgICAgICAgZGF0ZSA9IG5ldyBEYXRlKCksXG4gICAgICAgICAgICAgICAgcGFyc2VkID0ge30sXG4gICAgICAgICAgICAgICAgc2V0dGVyc19vcmRlciA9IFsnaGgnLCAnaCcsICdpaScsICdpJywgJ3NzJywgJ3MnLCAneXl5eScsICd5eScsICdNJywgJ01NJywgJ20nLCAnbW0nLCAnZCcsICdkZCddLFxuICAgICAgICAgICAgICAgIHNldHRlcnNfbWFwID0ge1xuICAgICAgICAgICAgICAgICAgICBoaDogZnVuY3Rpb24oZCwgdikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGQuc2V0VVRDSG91cnModik7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGg6IGZ1bmN0aW9uKGQsIHYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkLnNldFVUQ0hvdXJzKHYpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBpaTogZnVuY3Rpb24oZCwgdikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGQuc2V0VVRDTWludXRlcyh2KTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgaTogZnVuY3Rpb24oZCwgdikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGQuc2V0VVRDTWludXRlcyh2KTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgc3M6IGZ1bmN0aW9uKGQsIHYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkLnNldFVUQ1NlY29uZHModik7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHM6IGZ1bmN0aW9uKGQsIHYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkLnNldFVUQ1NlY29uZHModik7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHl5eXk6IGZ1bmN0aW9uKGQsIHYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkLnNldFVUQ0Z1bGxZZWFyKHYpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB5eTogZnVuY3Rpb24oZCwgdikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGQuc2V0VVRDRnVsbFllYXIoMjAwMCArIHYpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBtOiBmdW5jdGlvbihkLCB2KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2IC09IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAodiA8IDApIHYgKz0gMTI7XG4gICAgICAgICAgICAgICAgICAgICAgICB2ICU9IDEyO1xuICAgICAgICAgICAgICAgICAgICAgICAgZC5zZXRVVENNb250aCh2KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChkLmdldFVUQ01vbnRoKCkgIT0gdilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkLnNldFVUQ0RhdGUoZC5nZXRVVENEYXRlKCkgLSAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBkOiBmdW5jdGlvbihkLCB2KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZC5zZXRVVENEYXRlKHYpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB2YWwsIGZpbHRlcmVkLCBwYXJ0O1xuICAgICAgICAgICAgc2V0dGVyc19tYXBbJ00nXSA9IHNldHRlcnNfbWFwWydNTSddID0gc2V0dGVyc19tYXBbJ21tJ10gPSBzZXR0ZXJzX21hcFsnbSddO1xuICAgICAgICAgICAgc2V0dGVyc19tYXBbJ2RkJ10gPSBzZXR0ZXJzX21hcFsnZCddO1xuICAgICAgICAgICAgZGF0ZSA9IFVUQ0RhdGUoZGF0ZS5nZXRGdWxsWWVhcigpLCBkYXRlLmdldE1vbnRoKCksIGRhdGUuZ2V0RGF0ZSgpLCAwLCAwLCAwKTsgLy9kYXRlLmdldEhvdXJzKCksIGRhdGUuZ2V0TWludXRlcygpLCBkYXRlLmdldFNlY29uZHMoKSk7XG4gICAgICAgICAgICBpZiAocGFydHMubGVuZ3RoID09IGZvcm1hdC5wYXJ0cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgY250ID0gZm9ybWF0LnBhcnRzLmxlbmd0aDsgaSA8IGNudDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbCA9IHBhcnNlSW50KHBhcnRzW2ldLCAxMCk7XG4gICAgICAgICAgICAgICAgICAgIHBhcnQgPSBmb3JtYXQucGFydHNbaV07XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc05hTih2YWwpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHBhcnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdNTSc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbHRlcmVkID0gJChkYXRlc1tsYW5ndWFnZV0ubW9udGhzKS5maWx0ZXIoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbSA9IHRoaXMuc2xpY2UoMCwgcGFydHNbaV0ubGVuZ3RoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwID0gcGFydHNbaV0uc2xpY2UoMCwgbS5sZW5ndGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG0gPT0gcDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbCA9ICQuaW5BcnJheShmaWx0ZXJlZFswXSwgZGF0ZXNbbGFuZ3VhZ2VdLm1vbnRocykgKyAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdNJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsdGVyZWQgPSAkKGRhdGVzW2xhbmd1YWdlXS5tb250aHNTaG9ydCkuZmlsdGVyKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG0gPSB0aGlzLnNsaWNlKDAsIHBhcnRzW2ldLmxlbmd0aCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcCA9IHBhcnRzW2ldLnNsaWNlKDAsIG0ubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBtID09IHA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWwgPSAkLmluQXJyYXkoZmlsdGVyZWRbMF0sIGRhdGVzW2xhbmd1YWdlXS5tb250aHNTaG9ydCkgKyAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBwYXJzZWRbcGFydF0gPSB2YWw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBzOyBpIDwgc2V0dGVyc19vcmRlci5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBzID0gc2V0dGVyc19vcmRlcltpXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHMgaW4gcGFyc2VkICYmICFpc05hTihwYXJzZWRbc10pKVxuICAgICAgICAgICAgICAgICAgICAgICAgc2V0dGVyc19tYXBbc10oZGF0ZSwgcGFyc2VkW3NdKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBkYXRlO1xuICAgICAgICB9LFxuICAgICAgICBmb3JtYXREYXRlOiBmdW5jdGlvbihkYXRlLCBmb3JtYXQsIGxhbmd1YWdlKSB7XG4gICAgICAgICAgICBpZiAoZGF0ZSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHZhbCA9IHtcbiAgICAgICAgICAgICAgICBoOiBkYXRlLmdldFVUQ0hvdXJzKCksXG4gICAgICAgICAgICAgICAgaTogZGF0ZS5nZXRVVENNaW51dGVzKCksXG4gICAgICAgICAgICAgICAgczogZGF0ZS5nZXRVVENTZWNvbmRzKCksXG4gICAgICAgICAgICAgICAgZDogZGF0ZS5nZXRVVENEYXRlKCksXG4gICAgICAgICAgICAgICAgbTogZGF0ZS5nZXRVVENNb250aCgpICsgMSxcbiAgICAgICAgICAgICAgICBNOiBkYXRlc1tsYW5ndWFnZV0ubW9udGhzU2hvcnRbZGF0ZS5nZXRVVENNb250aCgpXSxcbiAgICAgICAgICAgICAgICBNTTogZGF0ZXNbbGFuZ3VhZ2VdLm1vbnRoc1tkYXRlLmdldFVUQ01vbnRoKCldLFxuICAgICAgICAgICAgICAgIHl5OiBkYXRlLmdldFVUQ0Z1bGxZZWFyKCkudG9TdHJpbmcoKS5zdWJzdHJpbmcoMiksXG4gICAgICAgICAgICAgICAgeXl5eTogZGF0ZS5nZXRVVENGdWxsWWVhcigpXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdmFsLmhoID0gKHZhbC5oIDwgMTAgPyAnMCcgOiAnJykgKyB2YWwuaDtcbiAgICAgICAgICAgIHZhbC5paSA9ICh2YWwuaSA8IDEwID8gJzAnIDogJycpICsgdmFsLmk7XG4gICAgICAgICAgICB2YWwuc3MgPSAodmFsLnMgPCAxMCA/ICcwJyA6ICcnKSArIHZhbC5zO1xuICAgICAgICAgICAgdmFsLmRkID0gKHZhbC5kIDwgMTAgPyAnMCcgOiAnJykgKyB2YWwuZDtcbiAgICAgICAgICAgIHZhbC5tbSA9ICh2YWwubSA8IDEwID8gJzAnIDogJycpICsgdmFsLm07XG4gICAgICAgICAgICB2YXIgZGF0ZSA9IFtdLFxuICAgICAgICAgICAgICAgIHNlcHMgPSAkLmV4dGVuZChbXSwgZm9ybWF0LnNlcGFyYXRvcnMpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGNudCA9IGZvcm1hdC5wYXJ0cy5sZW5ndGg7IGkgPCBjbnQ7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChzZXBzLmxlbmd0aClcbiAgICAgICAgICAgICAgICAgICAgZGF0ZS5wdXNoKHNlcHMuc2hpZnQoKSlcbiAgICAgICAgICAgICAgICBkYXRlLnB1c2godmFsW2Zvcm1hdC5wYXJ0c1tpXV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGRhdGUuam9pbignJyk7XG4gICAgICAgIH0sXG4gICAgICAgIGNvbnZlcnRWaWV3TW9kZTogZnVuY3Rpb24odmlld01vZGUpIHtcbiAgICAgICAgICAgIHN3aXRjaCAodmlld01vZGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgICAgICAgY2FzZSAnZGVjYWRlJzpcbiAgICAgICAgICAgICAgICAgICAgdmlld01vZGUgPSA0O1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICAgICAgY2FzZSAneWVhcic6XG4gICAgICAgICAgICAgICAgICAgIHZpZXdNb2RlID0gMztcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgICAgIGNhc2UgJ21vbnRoJzpcbiAgICAgICAgICAgICAgICAgICAgdmlld01vZGUgPSAyO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICAgICAgY2FzZSAnZGF5JzpcbiAgICAgICAgICAgICAgICAgICAgdmlld01vZGUgPSAxO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICAgICAgY2FzZSAnaG91cic6XG4gICAgICAgICAgICAgICAgICAgIHZpZXdNb2RlID0gMDtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB2aWV3TW9kZTtcbiAgICAgICAgfSxcbiAgICAgICAgaGVhZFRlbXBsYXRlOiBmdW5jdGlvbihsZWZ0QXJyb3csIHJpZ2h0QXJyb3cpIHtyZXR1cm4oJzx0aGVhZD4nICtcbiAgICAgICAgICAgICc8dHI+JyArXG4gICAgICAgICAgICAnPHRoIGNsYXNzPVwicHJldlwiPicgKyBsZWZ0QXJyb3cgKyAnPC90aD4nICtcbiAgICAgICAgICAgICc8dGggY29sc3Bhbj1cIjVcIiBjbGFzcz1cImRhdGUtc3dpdGNoXCI+PC90aD4nICtcbiAgICAgICAgICAgICc8dGggY2xhc3M9XCJuZXh0XCI+JyArIHJpZ2h0QXJyb3cgKyAnPC90aD4nICtcbiAgICAgICAgICAgICc8L3RyPicgK1xuICAgICAgICAgICAgJzwvdGhlYWQ+Jyl9LFxuICAgICAgICBjb250VGVtcGxhdGU6ICc8dGJvZHk+PHRyPjx0ZCBjb2xzcGFuPVwiN1wiPjwvdGQ+PC90cj48L3Rib2R5PicsXG4gICAgICAgIGZvb3RUZW1wbGF0ZTogJzx0Zm9vdD48dHI+PHRoIGNvbHNwYW49XCI3XCIgY2xhc3M9XCJ0b2RheVwiPjwvdGg+PC90cj48L3Rmb290PidcbiAgICB9O1xuICAgIERQR2xvYmFsLnRlbXBsYXRlID0gZnVuY3Rpb24obGVmdEFycm93LCByaWdodEFycm93LCBjbG9zZUljb24pIHtyZXR1cm4oICc8ZGl2IGNsYXNzPVwiZGF0ZXBpY2tlclwiPicgK1xuICAgICAgICAnPGRpdiBjbGFzcz1cImRhdGVwaWNrZXItbWludXRlc1wiPicgK1xuICAgICAgICAnPHRhYmxlIGNsYXNzPVwiIHRhYmxlLWNvbmRlbnNlZFwiPicgK1xuICAgICAgICBEUEdsb2JhbC5oZWFkVGVtcGxhdGUobGVmdEFycm93LCByaWdodEFycm93KSArXG4gICAgICAgIERQR2xvYmFsLmNvbnRUZW1wbGF0ZSArXG4gICAgICAgIERQR2xvYmFsLmZvb3RUZW1wbGF0ZSArXG4gICAgICAgICc8L3RhYmxlPicgK1xuICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICc8ZGl2IGNsYXNzPVwiZGF0ZXBpY2tlci1ob3Vyc1wiPicgK1xuICAgICAgICAnPHRhYmxlIGNsYXNzPVwiIHRhYmxlLWNvbmRlbnNlZFwiPicgK1xuICAgICAgICBEUEdsb2JhbC5oZWFkVGVtcGxhdGUobGVmdEFycm93LCByaWdodEFycm93KSArXG4gICAgICAgIERQR2xvYmFsLmNvbnRUZW1wbGF0ZSArXG4gICAgICAgIERQR2xvYmFsLmZvb3RUZW1wbGF0ZSArXG4gICAgICAgICc8L3RhYmxlPicgK1xuICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICc8ZGl2IGNsYXNzPVwiZGF0ZXBpY2tlci1kYXlzXCI+JyArXG4gICAgICAgICc8dGFibGUgY2xhc3M9XCIgdGFibGUtY29uZGVuc2VkXCI+JyArXG4gICAgICAgIERQR2xvYmFsLmhlYWRUZW1wbGF0ZShsZWZ0QXJyb3csIHJpZ2h0QXJyb3cpICtcbiAgICAgICAgJzx0Ym9keT48L3Rib2R5PicgK1xuICAgICAgICBEUEdsb2JhbC5mb290VGVtcGxhdGUgK1xuICAgICAgICAnPC90YWJsZT4nICtcbiAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAnPGRpdiBjbGFzcz1cImRhdGVwaWNrZXItbW9udGhzXCI+JyArXG4gICAgICAgICc8dGFibGUgY2xhc3M9XCJ0YWJsZS1jb25kZW5zZWRcIj4nICtcbiAgICAgICAgRFBHbG9iYWwuaGVhZFRlbXBsYXRlKGxlZnRBcnJvdywgcmlnaHRBcnJvdykgK1xuICAgICAgICBEUEdsb2JhbC5jb250VGVtcGxhdGUgK1xuICAgICAgICBEUEdsb2JhbC5mb290VGVtcGxhdGUgK1xuICAgICAgICAnPC90YWJsZT4nICtcbiAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAnPGRpdiBjbGFzcz1cImRhdGVwaWNrZXIteWVhcnNcIj4nICtcbiAgICAgICAgJzx0YWJsZSBjbGFzcz1cInRhYmxlLWNvbmRlbnNlZFwiPicgK1xuICAgICAgICBEUEdsb2JhbC5oZWFkVGVtcGxhdGUobGVmdEFycm93LCByaWdodEFycm93KSArXG4gICAgICAgIERQR2xvYmFsLmNvbnRUZW1wbGF0ZSArXG4gICAgICAgIERQR2xvYmFsLmZvb3RUZW1wbGF0ZSArXG4gICAgICAgICc8L3RhYmxlPicgK1xuICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICc8YSBjbGFzcz1cImJ1dHRvbiBkYXRlcGlja2VyLWNsb3NlIHRpbnkgYWxlcnQgcmlnaHRcIiBzdHlsZT1cIndpZHRoOmF1dG87XCI+JyArIGNsb3NlSWNvbiArICc8L2E+JyArXG4gICAgICAgICc8L2Rpdj4nKX07XG5cbiAgICAkLmZuLmZkYXRlcGlja2VyLkRQR2xvYmFsID0gRFBHbG9iYWw7XG5cbn0od2luZG93LmpRdWVyeSk7XG4iXX0=
