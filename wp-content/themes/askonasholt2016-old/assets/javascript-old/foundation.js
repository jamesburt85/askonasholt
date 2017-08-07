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
  };

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
  function ImNotTouchingYou(element, parent, lrOnly, tbOnly) {
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
  };

  // Window exports
  Foundation.plugin(Dropdown, 'Dropdown');
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
  };

  // Window exports
  Foundation.plugin(OffCanvas, 'OffCanvas');
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZvdW5kYXRpb24uY29yZS5qcyIsImZvdW5kYXRpb24udXRpbC5ib3guanMiLCJmb3VuZGF0aW9uLnV0aWwua2V5Ym9hcmQuanMiLCJmb3VuZGF0aW9uLnV0aWwubWVkaWFRdWVyeS5qcyIsImZvdW5kYXRpb24udXRpbC5tb3Rpb24uanMiLCJmb3VuZGF0aW9uLnV0aWwubmVzdC5qcyIsImZvdW5kYXRpb24udXRpbC50aW1lckFuZEltYWdlTG9hZGVyLmpzIiwiZm91bmRhdGlvbi51dGlsLnRvdWNoLmpzIiwiZm91bmRhdGlvbi51dGlsLnRyaWdnZXJzLmpzIiwid2hhdC1pbnB1dC5qcyIsImZvdW5kYXRpb24uYWNjb3JkaW9uLmpzIiwiZm91bmRhdGlvbi5hY2NvcmRpb25NZW51LmpzIiwiZm91bmRhdGlvbi5kcm9wZG93bi5qcyIsImZvdW5kYXRpb24uZHJvcGRvd25NZW51LmpzIiwiZm91bmRhdGlvbi5lcXVhbGl6ZXIuanMiLCJmb3VuZGF0aW9uLmludGVyY2hhbmdlLmpzIiwiZm91bmRhdGlvbi5vZmZjYW52YXMuanMiLCJmb3VuZGF0aW9uLnJlc3BvbnNpdmVNZW51LmpzIiwiZm91bmRhdGlvbi5yZXNwb25zaXZlVG9nZ2xlLmpzIiwiZm91bmRhdGlvbi5zdGlja3kuanMiLCJmb3VuZGF0aW9uLnRvZ2dsZXIuanMiLCJtb3Rpb24tdWkuanMiLCJmb3VuZGF0aW9uLWRhdGVwaWNrZXIuanMiXSwibmFtZXMiOlsiJCIsIkZPVU5EQVRJT05fVkVSU0lPTiIsIkZvdW5kYXRpb24iLCJ2ZXJzaW9uIiwiX3BsdWdpbnMiLCJfdXVpZHMiLCJydGwiLCJhdHRyIiwicGx1Z2luIiwibmFtZSIsImNsYXNzTmFtZSIsImZ1bmN0aW9uTmFtZSIsImF0dHJOYW1lIiwiaHlwaGVuYXRlIiwicmVnaXN0ZXJQbHVnaW4iLCJwbHVnaW5OYW1lIiwiY29uc3RydWN0b3IiLCJ0b0xvd2VyQ2FzZSIsInV1aWQiLCJHZXRZb0RpZ2l0cyIsIiRlbGVtZW50IiwiZGF0YSIsInRyaWdnZXIiLCJwdXNoIiwidW5yZWdpc3RlclBsdWdpbiIsInNwbGljZSIsImluZGV4T2YiLCJyZW1vdmVBdHRyIiwicmVtb3ZlRGF0YSIsInByb3AiLCJyZUluaXQiLCJwbHVnaW5zIiwiaXNKUSIsImVhY2giLCJfaW5pdCIsInR5cGUiLCJfdGhpcyIsImZucyIsInBsZ3MiLCJmb3JFYWNoIiwicCIsImZvdW5kYXRpb24iLCJPYmplY3QiLCJrZXlzIiwiZXJyIiwiY29uc29sZSIsImVycm9yIiwibGVuZ3RoIiwibmFtZXNwYWNlIiwiTWF0aCIsInJvdW5kIiwicG93IiwicmFuZG9tIiwidG9TdHJpbmciLCJzbGljZSIsInJlZmxvdyIsImVsZW0iLCJpIiwiJGVsZW0iLCJmaW5kIiwiYWRkQmFjayIsIiRlbCIsIm9wdHMiLCJ3YXJuIiwidGhpbmciLCJzcGxpdCIsImUiLCJvcHQiLCJtYXAiLCJlbCIsInRyaW0iLCJwYXJzZVZhbHVlIiwiZXIiLCJnZXRGbk5hbWUiLCJ0cmFuc2l0aW9uZW5kIiwidHJhbnNpdGlvbnMiLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJlbmQiLCJ0Iiwic3R5bGUiLCJzZXRUaW1lb3V0IiwidHJpZ2dlckhhbmRsZXIiLCJ1dGlsIiwidGhyb3R0bGUiLCJmdW5jIiwiZGVsYXkiLCJ0aW1lciIsImNvbnRleHQiLCJhcmdzIiwiYXJndW1lbnRzIiwiYXBwbHkiLCJtZXRob2QiLCIkbWV0YSIsIiRub0pTIiwiYXBwZW5kVG8iLCJoZWFkIiwicmVtb3ZlQ2xhc3MiLCJNZWRpYVF1ZXJ5IiwiQXJyYXkiLCJwcm90b3R5cGUiLCJjYWxsIiwicGx1Z0NsYXNzIiwidW5kZWZpbmVkIiwiUmVmZXJlbmNlRXJyb3IiLCJUeXBlRXJyb3IiLCJ3aW5kb3ciLCJmbiIsIkRhdGUiLCJub3ciLCJnZXRUaW1lIiwidmVuZG9ycyIsInJlcXVlc3RBbmltYXRpb25GcmFtZSIsInZwIiwiY2FuY2VsQW5pbWF0aW9uRnJhbWUiLCJ0ZXN0IiwibmF2aWdhdG9yIiwidXNlckFnZW50IiwibGFzdFRpbWUiLCJjYWxsYmFjayIsIm5leHRUaW1lIiwibWF4IiwiY2xlYXJUaW1lb3V0IiwicGVyZm9ybWFuY2UiLCJzdGFydCIsIkZ1bmN0aW9uIiwiYmluZCIsIm9UaGlzIiwiYUFyZ3MiLCJmVG9CaW5kIiwiZk5PUCIsImZCb3VuZCIsImNvbmNhdCIsImZ1bmNOYW1lUmVnZXgiLCJyZXN1bHRzIiwiZXhlYyIsInN0ciIsImlzTmFOIiwicGFyc2VGbG9hdCIsInJlcGxhY2UiLCJqUXVlcnkiLCJCb3giLCJJbU5vdFRvdWNoaW5nWW91IiwiR2V0RGltZW5zaW9ucyIsIkdldE9mZnNldHMiLCJlbGVtZW50IiwicGFyZW50IiwibHJPbmx5IiwidGJPbmx5IiwiZWxlRGltcyIsInRvcCIsImJvdHRvbSIsImxlZnQiLCJyaWdodCIsInBhckRpbXMiLCJvZmZzZXQiLCJoZWlnaHQiLCJ3aWR0aCIsIndpbmRvd0RpbXMiLCJhbGxEaXJzIiwiRXJyb3IiLCJyZWN0IiwiZ2V0Qm91bmRpbmdDbGllbnRSZWN0IiwicGFyUmVjdCIsInBhcmVudE5vZGUiLCJ3aW5SZWN0IiwiYm9keSIsIndpblkiLCJwYWdlWU9mZnNldCIsIndpblgiLCJwYWdlWE9mZnNldCIsInBhcmVudERpbXMiLCJhbmNob3IiLCJwb3NpdGlvbiIsInZPZmZzZXQiLCJoT2Zmc2V0IiwiaXNPdmVyZmxvdyIsIiRlbGVEaW1zIiwiJGFuY2hvckRpbXMiLCJrZXlDb2RlcyIsImNvbW1hbmRzIiwiS2V5Ym9hcmQiLCJnZXRLZXlDb2RlcyIsInBhcnNlS2V5IiwiZXZlbnQiLCJrZXkiLCJ3aGljaCIsImtleUNvZGUiLCJTdHJpbmciLCJmcm9tQ2hhckNvZGUiLCJ0b1VwcGVyQ2FzZSIsInNoaWZ0S2V5IiwiY3RybEtleSIsImFsdEtleSIsImhhbmRsZUtleSIsImNvbXBvbmVudCIsImZ1bmN0aW9ucyIsImNvbW1hbmRMaXN0IiwiY21kcyIsImNvbW1hbmQiLCJsdHIiLCJleHRlbmQiLCJyZXR1cm5WYWx1ZSIsImhhbmRsZWQiLCJ1bmhhbmRsZWQiLCJmaW5kRm9jdXNhYmxlIiwiZmlsdGVyIiwiaXMiLCJyZWdpc3RlciIsImNvbXBvbmVudE5hbWUiLCJrY3MiLCJrIiwia2MiLCJkZWZhdWx0UXVlcmllcyIsImxhbmRzY2FwZSIsInBvcnRyYWl0IiwicmV0aW5hIiwicXVlcmllcyIsImN1cnJlbnQiLCJzZWxmIiwiZXh0cmFjdGVkU3R5bGVzIiwiY3NzIiwibmFtZWRRdWVyaWVzIiwicGFyc2VTdHlsZVRvT2JqZWN0IiwiaGFzT3duUHJvcGVydHkiLCJ2YWx1ZSIsIl9nZXRDdXJyZW50U2l6ZSIsIl93YXRjaGVyIiwiYXRMZWFzdCIsInNpemUiLCJxdWVyeSIsImdldCIsIm1hdGNoTWVkaWEiLCJtYXRjaGVzIiwibWF0Y2hlZCIsIm9uIiwibmV3U2l6ZSIsImN1cnJlbnRTaXplIiwic3R5bGVNZWRpYSIsIm1lZGlhIiwic2NyaXB0IiwiZ2V0RWxlbWVudHNCeVRhZ05hbWUiLCJpbmZvIiwiaWQiLCJpbnNlcnRCZWZvcmUiLCJnZXRDb21wdXRlZFN0eWxlIiwiY3VycmVudFN0eWxlIiwibWF0Y2hNZWRpdW0iLCJ0ZXh0Iiwic3R5bGVTaGVldCIsImNzc1RleHQiLCJ0ZXh0Q29udGVudCIsInN0eWxlT2JqZWN0IiwicmVkdWNlIiwicmV0IiwicGFyYW0iLCJwYXJ0cyIsInZhbCIsImRlY29kZVVSSUNvbXBvbmVudCIsImlzQXJyYXkiLCJpbml0Q2xhc3NlcyIsImFjdGl2ZUNsYXNzZXMiLCJNb3Rpb24iLCJhbmltYXRlSW4iLCJhbmltYXRpb24iLCJjYiIsImFuaW1hdGUiLCJhbmltYXRlT3V0IiwiTW92ZSIsImR1cmF0aW9uIiwiYW5pbSIsInByb2ciLCJtb3ZlIiwidHMiLCJpc0luIiwiZXEiLCJpbml0Q2xhc3MiLCJhY3RpdmVDbGFzcyIsInJlc2V0IiwiYWRkQ2xhc3MiLCJzaG93Iiwib2Zmc2V0V2lkdGgiLCJvbmUiLCJmaW5pc2giLCJoaWRlIiwidHJhbnNpdGlvbkR1cmF0aW9uIiwiTmVzdCIsIkZlYXRoZXIiLCJtZW51IiwiaXRlbXMiLCJzdWJNZW51Q2xhc3MiLCJzdWJJdGVtQ2xhc3MiLCJoYXNTdWJDbGFzcyIsIiRpdGVtIiwiJHN1YiIsImNoaWxkcmVuIiwiQnVybiIsIlRpbWVyIiwib3B0aW9ucyIsIm5hbWVTcGFjZSIsInJlbWFpbiIsImlzUGF1c2VkIiwicmVzdGFydCIsImluZmluaXRlIiwicGF1c2UiLCJvbkltYWdlc0xvYWRlZCIsImltYWdlcyIsInVubG9hZGVkIiwiY29tcGxldGUiLCJzaW5nbGVJbWFnZUxvYWRlZCIsIm5hdHVyYWxXaWR0aCIsInNwb3RTd2lwZSIsImVuYWJsZWQiLCJkb2N1bWVudEVsZW1lbnQiLCJwcmV2ZW50RGVmYXVsdCIsIm1vdmVUaHJlc2hvbGQiLCJ0aW1lVGhyZXNob2xkIiwic3RhcnRQb3NYIiwic3RhcnRQb3NZIiwic3RhcnRUaW1lIiwiZWxhcHNlZFRpbWUiLCJpc01vdmluZyIsIm9uVG91Y2hFbmQiLCJyZW1vdmVFdmVudExpc3RlbmVyIiwib25Ub3VjaE1vdmUiLCJ4IiwidG91Y2hlcyIsInBhZ2VYIiwieSIsInBhZ2VZIiwiZHgiLCJkeSIsImRpciIsImFicyIsIm9uVG91Y2hTdGFydCIsImFkZEV2ZW50TGlzdGVuZXIiLCJpbml0IiwidGVhcmRvd24iLCJzcGVjaWFsIiwic3dpcGUiLCJzZXR1cCIsIm5vb3AiLCJhZGRUb3VjaCIsImhhbmRsZVRvdWNoIiwiY2hhbmdlZFRvdWNoZXMiLCJmaXJzdCIsImV2ZW50VHlwZXMiLCJ0b3VjaHN0YXJ0IiwidG91Y2htb3ZlIiwidG91Y2hlbmQiLCJzaW11bGF0ZWRFdmVudCIsIk1vdXNlRXZlbnQiLCJzY3JlZW5YIiwic2NyZWVuWSIsImNsaWVudFgiLCJjbGllbnRZIiwiY3JlYXRlRXZlbnQiLCJpbml0TW91c2VFdmVudCIsInRhcmdldCIsImRpc3BhdGNoRXZlbnQiLCJNdXRhdGlvbk9ic2VydmVyIiwicHJlZml4ZXMiLCJ0cmlnZ2VycyIsInN0b3BQcm9wYWdhdGlvbiIsImZhZGVPdXQiLCJjaGVja0xpc3RlbmVycyIsImV2ZW50c0xpc3RlbmVyIiwicmVzaXplTGlzdGVuZXIiLCJzY3JvbGxMaXN0ZW5lciIsImNsb3NlbWVMaXN0ZW5lciIsInlldGlCb3hlcyIsInBsdWdOYW1lcyIsImxpc3RlbmVycyIsImpvaW4iLCJvZmYiLCJwbHVnaW5JZCIsIm5vdCIsImRlYm91bmNlIiwiJG5vZGVzIiwibm9kZXMiLCJxdWVyeVNlbGVjdG9yQWxsIiwibGlzdGVuaW5nRWxlbWVudHNNdXRhdGlvbiIsIm11dGF0aW9uUmVjb3Jkc0xpc3QiLCIkdGFyZ2V0IiwiZWxlbWVudE9ic2VydmVyIiwib2JzZXJ2ZSIsImF0dHJpYnV0ZXMiLCJjaGlsZExpc3QiLCJjaGFyYWN0ZXJEYXRhIiwic3VidHJlZSIsImF0dHJpYnV0ZUZpbHRlciIsIklIZWFyWW91Iiwid2hhdElucHV0IiwiYWN0aXZlS2V5cyIsImJ1ZmZlciIsImN1cnJlbnRJbnB1dCIsIm5vblR5cGluZ0lucHV0cyIsIm1vdXNlV2hlZWwiLCJkZXRlY3RXaGVlbCIsImlnbm9yZU1hcCIsImlucHV0TWFwIiwiaW5wdXRUeXBlcyIsImtleU1hcCIsInBvaW50ZXJNYXAiLCJldmVudEJ1ZmZlciIsImNsZWFyVGltZXIiLCJzZXRJbnB1dCIsImJ1ZmZlcmVkRXZlbnQiLCJ1bkJ1ZmZlcmVkRXZlbnQiLCJldmVudEtleSIsInBvaW50ZXJUeXBlIiwiZXZlbnRUYXJnZXQiLCJldmVudFRhcmdldE5vZGUiLCJub2RlTmFtZSIsImV2ZW50VGFyZ2V0VHlwZSIsImdldEF0dHJpYnV0ZSIsImhhc0F0dHJpYnV0ZSIsInN3aXRjaElucHV0IiwibG9nS2V5cyIsInN0cmluZyIsInNldEF0dHJpYnV0ZSIsInNyY0VsZW1lbnQiLCJ1bkxvZ0tleXMiLCJhcnJheVBvcyIsImJpbmRFdmVudHMiLCJQb2ludGVyRXZlbnQiLCJNU1BvaW50ZXJFdmVudCIsIm9ubW91c2V3aGVlbCIsImFzayIsInR5cGVzIiwic2V0IiwiQWNjb3JkaW9uIiwiZGVmYXVsdHMiLCIkdGFicyIsImlkeCIsIiRjb250ZW50IiwibGlua0lkIiwiJGluaXRBY3RpdmUiLCJkb3duIiwiX2V2ZW50cyIsIiR0YWJDb250ZW50IiwidG9nZ2xlIiwibmV4dCIsIiRhIiwiZm9jdXMiLCJtdWx0aUV4cGFuZCIsInByZXZpb3VzIiwicHJldiIsImhhc0NsYXNzIiwidXAiLCJmaXJzdFRpbWUiLCIkY3VycmVudEFjdGl2ZSIsInNsaWRlRG93biIsInNsaWRlU3BlZWQiLCIkYXVudHMiLCJzaWJsaW5ncyIsImFsbG93QWxsQ2xvc2VkIiwic2xpZGVVcCIsImRlc3Ryb3kiLCJzdG9wIiwiQWNjb3JkaW9uTWVudSIsIm11bHRpT3BlbiIsIiRtZW51TGlua3MiLCJzdWJJZCIsImlzQWN0aXZlIiwiaW5pdFBhbmVzIiwiJHN1Ym1lbnUiLCIkZWxlbWVudHMiLCIkcHJldkVsZW1lbnQiLCIkbmV4dEVsZW1lbnQiLCJtaW4iLCJwYXJlbnRzIiwib3BlbiIsImNsb3NlIiwiY2xvc2VBbGwiLCJoaWRlQWxsIiwic3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uIiwicGFyZW50c1VudGlsIiwiYWRkIiwiJG1lbnVzIiwiRHJvcGRvd24iLCIkaWQiLCIkYW5jaG9yIiwicG9zaXRpb25DbGFzcyIsImdldFBvc2l0aW9uQ2xhc3MiLCJjb3VudGVyIiwidXNlZFBvc2l0aW9ucyIsInZlcnRpY2FsUG9zaXRpb24iLCJtYXRjaCIsImhvcml6b250YWxQb3NpdGlvbiIsIl9yZXBvc2l0aW9uIiwiY2xhc3NDaGFuZ2VkIiwiX3NldFBvc2l0aW9uIiwiZGlyZWN0aW9uIiwiaG92ZXIiLCJ0aW1lb3V0IiwiaG92ZXJEZWxheSIsImhvdmVyUGFuZSIsInZpc2libGVGb2N1c2FibGVFbGVtZW50cyIsInRhYl9mb3J3YXJkIiwidHJhcEZvY3VzIiwidGFiX2JhY2t3YXJkIiwiX2FkZEJvZHlIYW5kbGVyIiwiJGJvZHkiLCJhdXRvRm9jdXMiLCIkZm9jdXNhYmxlIiwiY2xvc2VPbkNsaWNrIiwiY3VyUG9zaXRpb25DbGFzcyIsIkRyb3Bkb3duTWVudSIsInN1YnMiLCIkbWVudUl0ZW1zIiwidmVydGljYWxDbGFzcyIsInJpZ2h0Q2xhc3MiLCJhbGlnbm1lbnQiLCJjaGFuZ2VkIiwiX2lzVmVydGljYWwiLCJoYXNUb3VjaCIsIm9udG91Y2hzdGFydCIsInBhckNsYXNzIiwiaGFuZGxlQ2xpY2tGbiIsImhhc1N1YiIsImhhc0NsaWNrZWQiLCJjbGlja09wZW4iLCJmb3JjZUZvbGxvdyIsIl9oaWRlIiwiX3Nob3ciLCJjbG9zZU9uQ2xpY2tJbnNpZGUiLCJkaXNhYmxlSG92ZXIiLCJhdXRvY2xvc2UiLCJjbG9zaW5nVGltZSIsImlzVGFiIiwiaW5kZXgiLCJuZXh0U2libGluZyIsInByZXZTaWJsaW5nIiwib3BlblN1YiIsImNsb3NlU3ViIiwiJGxpbmsiLCIkc2licyIsImNsZWFyIiwib2xkQ2xhc3MiLCIkcGFyZW50TGkiLCIkdG9DbG9zZSIsInNvbWV0aGluZ1RvQ2xvc2UiLCJFcXVhbGl6ZXIiLCJlcUlkIiwiJHdhdGNoZWQiLCJoYXNOZXN0ZWQiLCJpc05lc3RlZCIsImlzT24iLCJfYmluZEhhbmRsZXIiLCJvblJlc2l6ZU1lQm91bmQiLCJfb25SZXNpemVNZSIsIm9uUG9zdEVxdWFsaXplZEJvdW5kIiwiX29uUG9zdEVxdWFsaXplZCIsImltZ3MiLCJ0b29TbWFsbCIsImVxdWFsaXplT24iLCJfY2hlY2tNUSIsIl9yZWZsb3ciLCJfcGF1c2VFdmVudHMiLCJfa2lsbHN3aXRjaCIsImVxdWFsaXplT25TdGFjayIsIl9pc1N0YWNrZWQiLCJlcXVhbGl6ZUJ5Um93IiwiZ2V0SGVpZ2h0c0J5Um93IiwiYXBwbHlIZWlnaHRCeVJvdyIsImdldEhlaWdodHMiLCJhcHBseUhlaWdodCIsImhlaWdodHMiLCJsZW4iLCJvZmZzZXRIZWlnaHQiLCJsYXN0RWxUb3BPZmZzZXQiLCJncm91cHMiLCJncm91cCIsImVsT2Zmc2V0VG9wIiwiaiIsImxuIiwiZ3JvdXBzSUxlbmd0aCIsImxlbkoiLCJJbnRlcmNoYW5nZSIsInJ1bGVzIiwiY3VycmVudFBhdGgiLCJfYWRkQnJlYWtwb2ludHMiLCJfZ2VuZXJhdGVSdWxlcyIsInJ1bGUiLCJwYXRoIiwiU1BFQ0lBTF9RVUVSSUVTIiwicnVsZXNMaXN0IiwicmVzcG9uc2UiLCJodG1sIiwiT2ZmQ2FudmFzIiwiJGxhc3RUcmlnZ2VyIiwiJHRyaWdnZXJzIiwiJGV4aXRlciIsImV4aXRlciIsImFwcGVuZCIsImlzUmV2ZWFsZWQiLCJSZWdFeHAiLCJyZXZlYWxDbGFzcyIsInJldmVhbE9uIiwiX3NldE1RQ2hlY2tlciIsInRyYW5zaXRpb25UaW1lIiwiX2hhbmRsZUtleWJvYXJkIiwicmV2ZWFsIiwiJGNsb3NlciIsImZvcmNlVG9wIiwic2Nyb2xsVG9wIiwiJHdyYXBwZXIiLCJfdHJhcEZvY3VzIiwiZm9jdXNhYmxlIiwibGFzdCIsIlJlc3BvbnNpdmVNZW51IiwiY3VycmVudE1xIiwiY3VycmVudFBsdWdpbiIsInJ1bGVzVHJlZSIsInJ1bGVTaXplIiwicnVsZVBsdWdpbiIsIk1lbnVQbHVnaW5zIiwiaXNFbXB0eU9iamVjdCIsIl9jaGVja01lZGlhUXVlcmllcyIsIm1hdGNoZWRNcSIsImNzc0NsYXNzIiwiZHJvcGRvd24iLCJkcmlsbGRvd24iLCJhY2NvcmRpb24iLCJSZXNwb25zaXZlVG9nZ2xlIiwidGFyZ2V0SUQiLCIkdGFyZ2V0TWVudSIsIiR0b2dnbGVyIiwiX3VwZGF0ZSIsIl91cGRhdGVNcUhhbmRsZXIiLCJ0b2dnbGVNZW51IiwiaGlkZUZvciIsIlN0aWNreSIsIiRwYXJlbnQiLCJ3YXNXcmFwcGVkIiwiJGNvbnRhaW5lciIsImNvbnRhaW5lciIsIndyYXBJbm5lciIsImNvbnRhaW5lckNsYXNzIiwic3RpY2t5Q2xhc3MiLCJzY3JvbGxDb3VudCIsImNoZWNrRXZlcnkiLCJpc1N0dWNrIiwiY29udGFpbmVySGVpZ2h0IiwiZWxlbUhlaWdodCIsIl9wYXJzZVBvaW50cyIsIl9zZXRTaXplcyIsIl9jYWxjIiwicmV2ZXJzZSIsInRvcEFuY2hvciIsImJ0bSIsImJ0bUFuY2hvciIsInNjcm9sbEhlaWdodCIsInB0cyIsImJyZWFrcyIsInB0IiwicGxhY2UiLCJwb2ludHMiLCJjYW5TdGljayIsIl9wYXVzZUxpc3RlbmVycyIsImNoZWNrU2l6ZXMiLCJzY3JvbGwiLCJfcmVtb3ZlU3RpY2t5IiwidG9wUG9pbnQiLCJib3R0b21Qb2ludCIsIl9zZXRTdGlja3kiLCJzdGlja1RvIiwibXJnbiIsIm5vdFN0dWNrVG8iLCJwYXJzZUludCIsImlzVG9wIiwic3RpY2tUb1RvcCIsImFuY2hvclB0IiwiYW5jaG9ySGVpZ2h0IiwidG9wT3JCb3R0b20iLCJzdGlja3lPbiIsIm5ld0VsZW1XaWR0aCIsImNvbXAiLCJwZG5nIiwibmV3Q29udGFpbmVySGVpZ2h0IiwiX3NldEJyZWFrUG9pbnRzIiwibVRvcCIsImVtQ2FsYyIsIm1hcmdpblRvcCIsIm1CdG0iLCJtYXJnaW5Cb3R0b20iLCJ3aW5IZWlnaHQiLCJpbm5lckhlaWdodCIsInVud3JhcCIsImVtIiwiZm9udFNpemUiLCJUb2dnbGVyIiwiaW5wdXQiLCJhbmltYXRpb25JbiIsImFuaW1hdGlvbk91dCIsIl90b2dnbGVDbGFzcyIsInRvZ2dsZUNsYXNzIiwiX3VwZGF0ZUFSSUEiLCJfdG9nZ2xlQW5pbWF0ZSIsImVuZEV2ZW50IiwiTW90aW9uVUkiLCJVVENEYXRlIiwiVVRDIiwiVVRDVG9kYXkiLCJ0b2RheSIsImdldFVUQ0Z1bGxZZWFyIiwiZ2V0VVRDTW9udGgiLCJnZXRVVENEYXRlIiwiRGF0ZXBpY2tlciIsInRoYXQiLCJhdXRvU2hvdyIsImNsb3NlQnV0dG9uIiwibGFuZ3VhZ2UiLCJkYXRlcyIsImlzUlRMIiwiZm9ybWF0IiwiRFBHbG9iYWwiLCJwYXJzZUZvcm1hdCIsImZvcm1hdFRleHQiLCJpc0lubGluZSIsImlzSW5wdXQiLCJoYXNJbnB1dCIsImRpc2FibGVEYmxDbGlja1NlbGVjdGlvbiIsIm9uUmVuZGVyIiwibGlua0ZpZWxkIiwibGlua0Zvcm1hdCIsIm1pbnV0ZVN0ZXAiLCJwaWNrZXJQb3NpdGlvbiIsImluaXRpYWxEYXRlIiwiZmFDU1NwcmVmaXgiLCJsZWZ0QXJyb3ciLCJyaWdodEFycm93IiwiY2xvc2VJY29uIiwibWluVmlldyIsImNvbnZlcnRWaWV3TW9kZSIsIm1heFZpZXciLCJtb2RlcyIsInN0YXJ0Vmlld01vZGUiLCJzdGFydFZpZXciLCJ2aWV3TW9kZSIsInBpY2tUaW1lIiwiZm9yY2VQYXJzZSIsInBpY2tlciIsInRlbXBsYXRlIiwiY2xpY2siLCJwcm94eSIsIm1vdXNlZG93biIsInByZXBlbmQiLCJjbG9zZXN0Iiwia2V5Ym9hcmROYXZpZ2F0aW9uIiwidG9kYXlCdG4iLCJ0b2RheUhpZ2hsaWdodCIsImNhbGVuZGFyV2Vla3MiLCJ3ZWVrU3RhcnQiLCJ3ZWVrRW5kIiwic3RhcnREYXRlIiwiSW5maW5pdHkiLCJlbmREYXRlIiwiZGF5c09mV2Vla0Rpc2FibGVkIiwiZGF0ZXNEaXNhYmxlZCIsInNldFN0YXJ0RGF0ZSIsInNldEVuZERhdGUiLCJzZXREYXlzT2ZXZWVrRGlzYWJsZWQiLCJzZXREYXRlc0Rpc2FibGVkIiwiZmlsbERvdyIsImZpbGxNb250aHMiLCJ1cGRhdGUiLCJzaG93TW9kZSIsIl9hdHRhY2hFdmVudHMiLCJfZGV0YWNoRXZlbnRzIiwia2V5dXAiLCJrZXlkb3duIiwiZGJsY2xpY2siLCJibHVyIiwiZXYiLCJvdXRlckhlaWdodCIsImRhdGUiLCJzZXRWYWx1ZSIsInJlbW92ZSIsImRhdGVwaWNrZXIiLCJnZXREYXRlIiwiZCIsImdldFRpbWV6b25lT2Zmc2V0Iiwic2V0RGF0ZSIsInNldFVUQ0RhdGUiLCJmb3JtYXR0ZWQiLCJnZXRGb3JtYXR0ZWREYXRlIiwiZm9ybWF0RGF0ZSIsInBhcnNlRGF0ZSIsInVwZGF0ZU5hdkFycm93cyIsInZhbHVlT2YiLCJ6SW5kZXgiLCJ0ZXh0Ym94Iiwib3V0ZXJXaWR0aCIsImZ1bGxPZmZzZXRUb3AiLCJvZmZzZXRMZWZ0IiwiZnJvbUFyZ3MiLCJjdXJyZW50VmFsIiwidmlld0RhdGUiLCJmaWxsIiwiZG93Q250IiwiY2VsbCIsImRheXNNaW4iLCJtb250aHNTaG9ydCIsInllYXIiLCJtb250aCIsImRheU1vbnRoIiwiaG91cnMiLCJnZXRVVENIb3VycyIsIm1pbnV0ZXMiLCJnZXRVVENNaW51dGVzIiwic3RhcnRZZWFyIiwic3RhcnRNb250aCIsImVuZFllYXIiLCJlbmRNb250aCIsImN1cnJlbnREYXRlIiwidGl0bGVGb3JtYXQiLCJtb250aHMiLCJwcmV2TW9udGgiLCJkYXkiLCJnZXREYXlzSW5Nb250aCIsImdldFVUQ0RheSIsIm5leHRNb250aCIsImNsc05hbWUiLCJhIiwiZ2V0RGF5IiwiYiIsImdldEZ1bGxZZWFyIiwiY2FsV2VlayIsImdldE1vbnRoIiwiaW5BcnJheSIsImVtcHR5IiwiYWN0dWFsIiwiZmxvb3IiLCJjdXJyZW50WWVhciIsInllYXJDb250IiwiaG91ciIsInZpc2liaWxpdHkiLCJuYXZTdGVwIiwibW92ZUhvdXIiLCJtb3ZlRGF0ZSIsIm1vdmVNb250aCIsIm1vdmVZZWFyIiwiZ2V0SG91cnMiLCJnZXRNaW51dGVzIiwiZ2V0U2Vjb25kcyIsIl9zZXREYXRlIiwic2Vjb25kcyIsImdldFVUQ1NlY29uZHMiLCJzZXRVVENNb250aCIsInNldFVUQ0Z1bGxZZWFyIiwic3Vic3RyIiwib2xkVmlld01vZGUiLCJjaGFuZ2UiLCJuZXdfZGF0ZSIsInNldFVUQ0hvdXJzIiwibWFnIiwibmV3X21vbnRoIiwiZGF0ZVdpdGhpblJhbmdlIiwiZGF0ZUNoYW5nZWQiLCJuZXdEYXRlIiwibmV3Vmlld0RhdGUiLCJuZXdWaWV3TW9kZSIsImZkYXRlcGlja2VyIiwib3B0aW9uIiwic2hpZnQiLCIkdGhpcyIsIkNvbnN0cnVjdG9yIiwiZGF5cyIsImRheXNTaG9ydCIsIm5hdkZuYyIsImlzTGVhcFllYXIiLCJ2YWxpZFBhcnRzIiwibm9ucHVuY3R1YXRpb24iLCJzZXBhcmF0b3JzIiwicGFydF9yZSIsInBhcnQiLCJEYXRldGltZXBpY2tlciIsInBhcnNlZCIsInNldHRlcnNfb3JkZXIiLCJzZXR0ZXJzX21hcCIsImhoIiwidiIsImgiLCJpaSIsInNldFVUQ01pbnV0ZXMiLCJzcyIsInNldFVUQ1NlY29uZHMiLCJzIiwieXl5eSIsInl5IiwibSIsImZpbHRlcmVkIiwiY250IiwiTSIsIk1NIiwic3Vic3RyaW5nIiwiZGQiLCJtbSIsInNlcHMiLCJoZWFkVGVtcGxhdGUiLCJjb250VGVtcGxhdGUiLCJmb290VGVtcGxhdGUiXSwibWFwcGluZ3MiOiJBQUFBLENBQUMsVUFBU0EsQ0FBVCxFQUFZOztBQUViOztBQUVBLE1BQUlDLHFCQUFxQixPQUF6Qjs7QUFFQTtBQUNBO0FBQ0EsTUFBSUMsYUFBYTtBQUNmQyxhQUFTRixrQkFETTs7QUFHZjs7O0FBR0FHLGNBQVUsRUFOSzs7QUFRZjs7O0FBR0FDLFlBQVEsRUFYTzs7QUFhZjs7O0FBR0FDLFNBQUssWUFBVTtBQUNiLGFBQU9OLEVBQUUsTUFBRixFQUFVTyxJQUFWLENBQWUsS0FBZixNQUEwQixLQUFqQztBQUNELEtBbEJjO0FBbUJmOzs7O0FBSUFDLFlBQVEsVUFBU0EsTUFBVCxFQUFpQkMsSUFBakIsRUFBdUI7QUFDN0I7QUFDQTtBQUNBLFVBQUlDLFlBQWFELFFBQVFFLGFBQWFILE1BQWIsQ0FBekI7QUFDQTtBQUNBO0FBQ0EsVUFBSUksV0FBWUMsVUFBVUgsU0FBVixDQUFoQjs7QUFFQTtBQUNBLFdBQUtOLFFBQUwsQ0FBY1EsUUFBZCxJQUEwQixLQUFLRixTQUFMLElBQWtCRixNQUE1QztBQUNELEtBakNjO0FBa0NmOzs7Ozs7Ozs7QUFTQU0sb0JBQWdCLFVBQVNOLE1BQVQsRUFBaUJDLElBQWpCLEVBQXNCO0FBQ3BDLFVBQUlNLGFBQWFOLE9BQU9JLFVBQVVKLElBQVYsQ0FBUCxHQUF5QkUsYUFBYUgsT0FBT1EsV0FBcEIsRUFBaUNDLFdBQWpDLEVBQTFDO0FBQ0FULGFBQU9VLElBQVAsR0FBYyxLQUFLQyxXQUFMLENBQWlCLENBQWpCLEVBQW9CSixVQUFwQixDQUFkOztBQUVBLFVBQUcsQ0FBQ1AsT0FBT1ksUUFBUCxDQUFnQmIsSUFBaEIsQ0FBc0IsUUFBT1EsVUFBVyxFQUF4QyxDQUFKLEVBQStDO0FBQUVQLGVBQU9ZLFFBQVAsQ0FBZ0JiLElBQWhCLENBQXNC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QWtCcEUsaUJBbEJvRSxHQW1CcEVmLFNBQVMwTCxZQW5CMkQsR0FvQnBFLFVBcEJvRSxHQXFCcEUsUUFyQm9FLEdBc0JwRSxpQ0F0Qm9FLEdBdUJwRSxpQ0F2Qm9FLEdBd0JwRTFMLFNBQVN3TCxZQUFULENBQXNCMUssU0FBdEIsRUFBaUNDLFVBQWpDLENBeEJvRSxHQXlCcEVmLFNBQVN5TCxZQXpCMkQsR0EwQnBFekwsU0FBUzBMLFlBMUIyRCxHQTJCcEUsVUEzQm9FLEdBNEJwRSxRQTVCb0UsR0E2QnBFLGdDQTdCb0UsR0E4QnBFLGlDQTlCb0UsR0ErQnBFMUwsU0FBU3dMLFlBQVQsQ0FBc0IxSyxTQUF0QixFQUFpQ0MsVUFBakMsQ0EvQm9FLEdBZ0NwRWYsU0FBU3lMLFlBaEMyRCxHQWlDcEV6TCxTQUFTMEwsWUFqQzJELEdBa0NwRSxVQWxDb0UsR0FtQ3BFLFFBbkNvRSxHQW9DcEUsMEVBcENvRSxHQW9DUzFLLFNBcENULEdBb0NxQixNQXBDckIsR0FxQ3BFLFFBckM0RDtBQXFDbEQsS0FyQ2Q7O0FBdUNBN3RCLE1BQUUyRyxFQUFGLENBQUtxdkIsV0FBTCxDQUFpQm5KLFFBQWpCLEdBQTRCQSxRQUE1QjtBQUVILENBNTNDQyxDQTQzQ0FubUIsT0FBT2tDLE1BNTNDUCxDQUFGIiwiZmlsZSI6ImZvdW5kYXRpb24uanMiLCJzb3VyY2VzQ29udGVudCI6WyIhZnVuY3Rpb24oJCkge1xuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIEZPVU5EQVRJT05fVkVSU0lPTiA9ICc2LjIuNCc7XG5cbi8vIEdsb2JhbCBGb3VuZGF0aW9uIG9iamVjdFxuLy8gVGhpcyBpcyBhdHRhY2hlZCB0byB0aGUgd2luZG93LCBvciB1c2VkIGFzIGEgbW9kdWxlIGZvciBBTUQvQnJvd3NlcmlmeVxudmFyIEZvdW5kYXRpb24gPSB7XG4gIHZlcnNpb246IEZPVU5EQVRJT05fVkVSU0lPTixcblxuICAvKipcbiAgICogU3RvcmVzIGluaXRpYWxpemVkIHBsdWdpbnMuXG4gICAqL1xuICBfcGx1Z2luczoge30sXG5cbiAgLyoqXG4gICAqIFN0b3JlcyBnZW5lcmF0ZWQgdW5pcXVlIGlkcyBmb3IgcGx1Z2luIGluc3RhbmNlc1xuICAgKi9cbiAgX3V1aWRzOiBbXSxcblxuICAvKipcbiAgICogUmV0dXJucyBhIGJvb2xlYW4gZm9yIFJUTCBzdXBwb3J0XG4gICAqL1xuICBydGw6IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuICQoJ2h0bWwnKS5hdHRyKCdkaXInKSA9PT0gJ3J0bCc7XG4gIH0sXG4gIC8qKlxuICAgKiBEZWZpbmVzIGEgRm91bmRhdGlvbiBwbHVnaW4sIGFkZGluZyBpdCB0byB0aGUgYEZvdW5kYXRpb25gIG5hbWVzcGFjZSBhbmQgdGhlIGxpc3Qgb2YgcGx1Z2lucyB0byBpbml0aWFsaXplIHdoZW4gcmVmbG93aW5nLlxuICAgKiBAcGFyYW0ge09iamVjdH0gcGx1Z2luIC0gVGhlIGNvbnN0cnVjdG9yIG9mIHRoZSBwbHVnaW4uXG4gICAqL1xuICBwbHVnaW46IGZ1bmN0aW9uKHBsdWdpbiwgbmFtZSkge1xuICAgIC8vIE9iamVjdCBrZXkgdG8gdXNlIHdoZW4gYWRkaW5nIHRvIGdsb2JhbCBGb3VuZGF0aW9uIG9iamVjdFxuICAgIC8vIEV4YW1wbGVzOiBGb3VuZGF0aW9uLlJldmVhbCwgRm91bmRhdGlvbi5PZmZDYW52YXNcbiAgICB2YXIgY2xhc3NOYW1lID0gKG5hbWUgfHwgZnVuY3Rpb25OYW1lKHBsdWdpbikpO1xuICAgIC8vIE9iamVjdCBrZXkgdG8gdXNlIHdoZW4gc3RvcmluZyB0aGUgcGx1Z2luLCBhbHNvIHVzZWQgdG8gY3JlYXRlIHRoZSBpZGVudGlmeWluZyBkYXRhIGF0dHJpYnV0ZSBmb3IgdGhlIHBsdWdpblxuICAgIC8vIEV4YW1wbGVzOiBkYXRhLXJldmVhbCwgZGF0YS1vZmYtY2FudmFzXG4gICAgdmFyIGF0dHJOYW1lICA9IGh5cGhlbmF0ZShjbGFzc05hbWUpO1xuXG4gICAgLy8gQWRkIHRvIHRoZSBGb3VuZGF0aW9uIG9iamVjdCBhbmQgdGhlIHBsdWdpbnMgbGlzdCAoZm9yIHJlZmxvd2luZylcbiAgICB0aGlzLl9wbHVnaW5zW2F0dHJOYW1lXSA9IHRoaXNbY2xhc3NOYW1lXSA9IHBsdWdpbjtcbiAgfSxcbiAgLyoqXG4gICAqIEBmdW5jdGlvblxuICAgKiBQb3B1bGF0ZXMgdGhlIF91dWlkcyBhcnJheSB3aXRoIHBvaW50ZXJzIHRvIGVhY2ggaW5kaXZpZHVhbCBwbHVnaW4gaW5zdGFuY2UuXG4gICAqIEFkZHMgdGhlIGB6ZlBsdWdpbmAgZGF0YS1hdHRyaWJ1dGUgdG8gcHJvZ3JhbW1hdGljYWxseSBjcmVhdGVkIHBsdWdpbnMgdG8gYWxsb3cgdXNlIG9mICQoc2VsZWN0b3IpLmZvdW5kYXRpb24obWV0aG9kKSBjYWxscy5cbiAgICogQWxzbyBmaXJlcyB0aGUgaW5pdGlhbGl6YXRpb24gZXZlbnQgZm9yIGVhY2ggcGx1Z2luLCBjb25zb2xpZGF0aW5nIHJlcGV0aXRpdmUgY29kZS5cbiAgICogQHBhcmFtIHtPYmplY3R9IHBsdWdpbiAtIGFuIGluc3RhbmNlIG9mIGEgcGx1Z2luLCB1c3VhbGx5IGB0aGlzYCBpbiBjb250ZXh0LlxuICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZSAtIHRoZSBuYW1lIG9mIHRoZSBwbHVnaW4sIHBhc3NlZCBhcyBhIGNhbWVsQ2FzZWQgc3RyaW5nLlxuICAgKiBAZmlyZXMgUGx1Z2luI2luaXRcbiAgICovXG4gIHJlZ2lzdGVyUGx1Z2luOiBmdW5jdGlvbihwbHVnaW4sIG5hbWUpe1xuICAgIHZhciBwbHVnaW5OYW1lID0gbmFtZSA/IGh5cGhlbmF0ZShuYW1lKSA6IGZ1bmN0aW9uTmFtZShwbHVnaW4uY29uc3RydWN0b3IpLnRvTG93ZXJDYXNlKCk7XG4gICAgcGx1Z2luLnV1aWQgPSB0aGlzLkdldFlvRGlnaXRzKDYsIHBsdWdpbk5hbWUpO1xuXG4gICAgaWYoIXBsdWdpbi4kZWxlbWVudC5hdHRyKGBkYXRhLSR7cGx1Z2luTmFtZX1gKSl7IHBsdWdpbi4kZWxlbWVudC5hdHRyKGBkYXRhLSR7cGx1Z2luTmFtZX1gLCBwbHVnaW4udXVpZCk7IH1cbiAgICBpZighcGx1Z2luLiRlbGVtZW50LmRhdGEoJ3pmUGx1Z2luJykpeyBwbHVnaW4uJGVsZW1lbnQuZGF0YSgnemZQbHVnaW4nLCBwbHVnaW4pOyB9XG4gICAgICAgICAgLyoqXG4gICAgICAgICAgICogRmlyZXMgd2hlbiB0aGUgcGx1Z2luIGhhcyBpbml0aWFsaXplZC5cbiAgICAgICAgICAgKiBAZXZlbnQgUGx1Z2luI2luaXRcbiAgICAgICAgICAgKi9cbiAgICBwbHVnaW4uJGVsZW1lbnQudHJpZ2dlcihgaW5pdC56Zi4ke3BsdWdpbk5hbWV9YCk7XG5cbiAgICB0aGlzLl91dWlkcy5wdXNoKHBsdWdpbi51dWlkKTtcblxuICAgIHJldHVybjtcbiAgfSxcbiAgLyoqXG4gICAqIEBmdW5jdGlvblxuICAgKiBSZW1vdmVzIHRoZSBwbHVnaW5zIHV1aWQgZnJvbSB0aGUgX3V1aWRzIGFycmF5LlxuICAgKiBSZW1vdmVzIHRoZSB6ZlBsdWdpbiBkYXRhIGF0dHJpYnV0ZSwgYXMgd2VsbCBhcyB0aGUgZGF0YS1wbHVnaW4tbmFtZSBhdHRyaWJ1dGUuXG4gICAqIEFsc28gZmlyZXMgdGhlIGRlc3Ryb3llZCBldmVudCBmb3IgdGhlIHBsdWdpbiwgY29uc29saWRhdGluZyByZXBldGl0aXZlIGNvZGUuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBwbHVnaW4gLSBhbiBpbnN0YW5jZSBvZiBhIHBsdWdpbiwgdXN1YWxseSBgdGhpc2AgaW4gY29udGV4dC5cbiAgICogQGZpcmVzIFBsdWdpbiNkZXN0cm95ZWRcbiAgICovXG4gIHVucmVnaXN0ZXJQbHVnaW46IGZ1bmN0aW9uKHBsdWdpbil7XG4gICAgdmFyIHBsdWdpbk5hbWUgPSBoeXBoZW5hdGUoZnVuY3Rpb25OYW1lKHBsdWdpbi4kZWxlbWVudC5kYXRhKCd6ZlBsdWdpbicpLmNvbnN0cnVjdG9yKSk7XG5cbiAgICB0aGlzLl91dWlkcy5zcGxpY2UodGhpcy5fdXVpZHMuaW5kZXhPZihwbHVnaW4udXVpZCksIDEpO1xuICAgIHBsdWdpbi4kZWxlbWVudC5yZW1vdmVBdHRyKGBkYXRhLSR7cGx1Z2luTmFtZX1gKS5yZW1vdmVEYXRhKCd6ZlBsdWdpbicpXG4gICAgICAgICAgLyoqXG4gICAgICAgICAgICogRmlyZXMgd2hlbiB0aGUgcGx1Z2luIGhhcyBiZWVuIGRlc3Ryb3llZC5cbiAgICAgICAgICAgKiBAZXZlbnQgUGx1Z2luI2Rlc3Ryb3llZFxuICAgICAgICAgICAqL1xuICAgICAgICAgIC50cmlnZ2VyKGBkZXN0cm95ZWQuemYuJHtwbHVnaW5OYW1lfWApO1xuICAgIGZvcih2YXIgcHJvcCBpbiBwbHVnaW4pe1xuICAgICAgcGx1Z2luW3Byb3BdID0gbnVsbDsvL2NsZWFuIHVwIHNjcmlwdCB0byBwcmVwIGZvciBnYXJiYWdlIGNvbGxlY3Rpb24uXG4gICAgfVxuICAgIHJldHVybjtcbiAgfSxcblxuICAvKipcbiAgICogQGZ1bmN0aW9uXG4gICAqIENhdXNlcyBvbmUgb3IgbW9yZSBhY3RpdmUgcGx1Z2lucyB0byByZS1pbml0aWFsaXplLCByZXNldHRpbmcgZXZlbnQgbGlzdGVuZXJzLCByZWNhbGN1bGF0aW5nIHBvc2l0aW9ucywgZXRjLlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGx1Z2lucyAtIG9wdGlvbmFsIHN0cmluZyBvZiBhbiBpbmRpdmlkdWFsIHBsdWdpbiBrZXksIGF0dGFpbmVkIGJ5IGNhbGxpbmcgYCQoZWxlbWVudCkuZGF0YSgncGx1Z2luTmFtZScpYCwgb3Igc3RyaW5nIG9mIGEgcGx1Z2luIGNsYXNzIGkuZS4gYCdkcm9wZG93bidgXG4gICAqIEBkZWZhdWx0IElmIG5vIGFyZ3VtZW50IGlzIHBhc3NlZCwgcmVmbG93IGFsbCBjdXJyZW50bHkgYWN0aXZlIHBsdWdpbnMuXG4gICAqL1xuICAgcmVJbml0OiBmdW5jdGlvbihwbHVnaW5zKXtcbiAgICAgdmFyIGlzSlEgPSBwbHVnaW5zIGluc3RhbmNlb2YgJDtcbiAgICAgdHJ5e1xuICAgICAgIGlmKGlzSlEpe1xuICAgICAgICAgcGx1Z2lucy5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICQodGhpcykuZGF0YSgnemZQbHVnaW4nKS5faW5pdCgpO1xuICAgICAgICAgfSk7XG4gICAgICAgfWVsc2V7XG4gICAgICAgICB2YXIgdHlwZSA9IHR5cGVvZiBwbHVnaW5zLFxuICAgICAgICAgX3RoaXMgPSB0aGlzLFxuICAgICAgICAgZm5zID0ge1xuICAgICAgICAgICAnb2JqZWN0JzogZnVuY3Rpb24ocGxncyl7XG4gICAgICAgICAgICAgcGxncy5mb3JFYWNoKGZ1bmN0aW9uKHApe1xuICAgICAgICAgICAgICAgcCA9IGh5cGhlbmF0ZShwKTtcbiAgICAgICAgICAgICAgICQoJ1tkYXRhLScrIHAgKyddJykuZm91bmRhdGlvbignX2luaXQnKTtcbiAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgfSxcbiAgICAgICAgICAgJ3N0cmluZyc6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgcGx1Z2lucyA9IGh5cGhlbmF0ZShwbHVnaW5zKTtcbiAgICAgICAgICAgICAkKCdbZGF0YS0nKyBwbHVnaW5zICsnXScpLmZvdW5kYXRpb24oJ19pbml0Jyk7XG4gICAgICAgICAgIH0sXG4gICAgICAgICAgICd1bmRlZmluZWQnOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgIHRoaXNbJ29iamVjdCddKE9iamVjdC5rZXlzKF90aGlzLl9wbHVnaW5zKSk7XG4gICAgICAgICAgIH1cbiAgICAgICAgIH07XG4gICAgICAgICBmbnNbdHlwZV0ocGx1Z2lucyk7XG4gICAgICAgfVxuICAgICB9Y2F0Y2goZXJyKXtcbiAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgIH1maW5hbGx5e1xuICAgICAgIHJldHVybiBwbHVnaW5zO1xuICAgICB9XG4gICB9LFxuXG4gIC8qKlxuICAgKiByZXR1cm5zIGEgcmFuZG9tIGJhc2UtMzYgdWlkIHdpdGggbmFtZXNwYWNpbmdcbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBsZW5ndGggLSBudW1iZXIgb2YgcmFuZG9tIGJhc2UtMzYgZGlnaXRzIGRlc2lyZWQuIEluY3JlYXNlIGZvciBtb3JlIHJhbmRvbSBzdHJpbmdzLlxuICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlIC0gbmFtZSBvZiBwbHVnaW4gdG8gYmUgaW5jb3Jwb3JhdGVkIGluIHVpZCwgb3B0aW9uYWwuXG4gICAqIEBkZWZhdWx0IHtTdHJpbmd9ICcnIC0gaWYgbm8gcGx1Z2luIG5hbWUgaXMgcHJvdmlkZWQsIG5vdGhpbmcgaXMgYXBwZW5kZWQgdG8gdGhlIHVpZC5cbiAgICogQHJldHVybnMge1N0cmluZ30gLSB1bmlxdWUgaWRcbiAgICovXG4gIEdldFlvRGlnaXRzOiBmdW5jdGlvbihsZW5ndGgsIG5hbWVzcGFjZSl7XG4gICAgbGVuZ3RoID0gbGVuZ3RoIHx8IDY7XG4gICAgcmV0dXJuIE1hdGgucm91bmQoKE1hdGgucG93KDM2LCBsZW5ndGggKyAxKSAtIE1hdGgucmFuZG9tKCkgKiBNYXRoLnBvdygzNiwgbGVuZ3RoKSkpLnRvU3RyaW5nKDM2KS5zbGljZSgxKSArIChuYW1lc3BhY2UgPyBgLSR7bmFtZXNwYWNlfWAgOiAnJyk7XG4gIH0sXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIHBsdWdpbnMgb24gYW55IGVsZW1lbnRzIHdpdGhpbiBgZWxlbWAgKGFuZCBgZWxlbWAgaXRzZWxmKSB0aGF0IGFyZW4ndCBhbHJlYWR5IGluaXRpYWxpemVkLlxuICAgKiBAcGFyYW0ge09iamVjdH0gZWxlbSAtIGpRdWVyeSBvYmplY3QgY29udGFpbmluZyB0aGUgZWxlbWVudCB0byBjaGVjayBpbnNpZGUuIEFsc28gY2hlY2tzIHRoZSBlbGVtZW50IGl0c2VsZiwgdW5sZXNzIGl0J3MgdGhlIGBkb2N1bWVudGAgb2JqZWN0LlxuICAgKiBAcGFyYW0ge1N0cmluZ3xBcnJheX0gcGx1Z2lucyAtIEEgbGlzdCBvZiBwbHVnaW5zIHRvIGluaXRpYWxpemUuIExlYXZlIHRoaXMgb3V0IHRvIGluaXRpYWxpemUgZXZlcnl0aGluZy5cbiAgICovXG4gIHJlZmxvdzogZnVuY3Rpb24oZWxlbSwgcGx1Z2lucykge1xuXG4gICAgLy8gSWYgcGx1Z2lucyBpcyB1bmRlZmluZWQsIGp1c3QgZ3JhYiBldmVyeXRoaW5nXG4gICAgaWYgKHR5cGVvZiBwbHVnaW5zID09PSAndW5kZWZpbmVkJykge1xuICAgICAgcGx1Z2lucyA9IE9iamVjdC5rZXlzKHRoaXMuX3BsdWdpbnMpO1xuICAgIH1cbiAgICAvLyBJZiBwbHVnaW5zIGlzIGEgc3RyaW5nLCBjb252ZXJ0IGl0IHRvIGFuIGFycmF5IHdpdGggb25lIGl0ZW1cbiAgICBlbHNlIGlmICh0eXBlb2YgcGx1Z2lucyA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHBsdWdpbnMgPSBbcGx1Z2luc107XG4gICAgfVxuXG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCBlYWNoIHBsdWdpblxuICAgICQuZWFjaChwbHVnaW5zLCBmdW5jdGlvbihpLCBuYW1lKSB7XG4gICAgICAvLyBHZXQgdGhlIGN1cnJlbnQgcGx1Z2luXG4gICAgICB2YXIgcGx1Z2luID0gX3RoaXMuX3BsdWdpbnNbbmFtZV07XG5cbiAgICAgIC8vIExvY2FsaXplIHRoZSBzZWFyY2ggdG8gYWxsIGVsZW1lbnRzIGluc2lkZSBlbGVtLCBhcyB3ZWxsIGFzIGVsZW0gaXRzZWxmLCB1bmxlc3MgZWxlbSA9PT0gZG9jdW1lbnRcbiAgICAgIHZhciAkZWxlbSA9ICQoZWxlbSkuZmluZCgnW2RhdGEtJytuYW1lKyddJykuYWRkQmFjaygnW2RhdGEtJytuYW1lKyddJyk7XG5cbiAgICAgIC8vIEZvciBlYWNoIHBsdWdpbiBmb3VuZCwgaW5pdGlhbGl6ZSBpdFxuICAgICAgJGVsZW0uZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyICRlbCA9ICQodGhpcyksXG4gICAgICAgICAgICBvcHRzID0ge307XG4gICAgICAgIC8vIERvbid0IGRvdWJsZS1kaXAgb24gcGx1Z2luc1xuICAgICAgICBpZiAoJGVsLmRhdGEoJ3pmUGx1Z2luJykpIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oXCJUcmllZCB0byBpbml0aWFsaXplIFwiK25hbWUrXCIgb24gYW4gZWxlbWVudCB0aGF0IGFscmVhZHkgaGFzIGEgRm91bmRhdGlvbiBwbHVnaW4uXCIpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKCRlbC5hdHRyKCdkYXRhLW9wdGlvbnMnKSl7XG4gICAgICAgICAgdmFyIHRoaW5nID0gJGVsLmF0dHIoJ2RhdGEtb3B0aW9ucycpLnNwbGl0KCc7JykuZm9yRWFjaChmdW5jdGlvbihlLCBpKXtcbiAgICAgICAgICAgIHZhciBvcHQgPSBlLnNwbGl0KCc6JykubWFwKGZ1bmN0aW9uKGVsKXsgcmV0dXJuIGVsLnRyaW0oKTsgfSk7XG4gICAgICAgICAgICBpZihvcHRbMF0pIG9wdHNbb3B0WzBdXSA9IHBhcnNlVmFsdWUob3B0WzFdKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICB0cnl7XG4gICAgICAgICAgJGVsLmRhdGEoJ3pmUGx1Z2luJywgbmV3IHBsdWdpbigkKHRoaXMpLCBvcHRzKSk7XG4gICAgICAgIH1jYXRjaChlcil7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihlcik7XG4gICAgICAgIH1maW5hbGx5e1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH0sXG4gIGdldEZuTmFtZTogZnVuY3Rpb25OYW1lLFxuICB0cmFuc2l0aW9uZW5kOiBmdW5jdGlvbigkZWxlbSl7XG4gICAgdmFyIHRyYW5zaXRpb25zID0ge1xuICAgICAgJ3RyYW5zaXRpb24nOiAndHJhbnNpdGlvbmVuZCcsXG4gICAgICAnV2Via2l0VHJhbnNpdGlvbic6ICd3ZWJraXRUcmFuc2l0aW9uRW5kJyxcbiAgICAgICdNb3pUcmFuc2l0aW9uJzogJ3RyYW5zaXRpb25lbmQnLFxuICAgICAgJ09UcmFuc2l0aW9uJzogJ290cmFuc2l0aW9uZW5kJ1xuICAgIH07XG4gICAgdmFyIGVsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSxcbiAgICAgICAgZW5kO1xuXG4gICAgZm9yICh2YXIgdCBpbiB0cmFuc2l0aW9ucyl7XG4gICAgICBpZiAodHlwZW9mIGVsZW0uc3R5bGVbdF0gIT09ICd1bmRlZmluZWQnKXtcbiAgICAgICAgZW5kID0gdHJhbnNpdGlvbnNbdF07XG4gICAgICB9XG4gICAgfVxuICAgIGlmKGVuZCl7XG4gICAgICByZXR1cm4gZW5kO1xuICAgIH1lbHNle1xuICAgICAgZW5kID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAkZWxlbS50cmlnZ2VySGFuZGxlcigndHJhbnNpdGlvbmVuZCcsIFskZWxlbV0pO1xuICAgICAgfSwgMSk7XG4gICAgICByZXR1cm4gJ3RyYW5zaXRpb25lbmQnO1xuICAgIH1cbiAgfVxufTtcblxuRm91bmRhdGlvbi51dGlsID0ge1xuICAvKipcbiAgICogRnVuY3Rpb24gZm9yIGFwcGx5aW5nIGEgZGVib3VuY2UgZWZmZWN0IHRvIGEgZnVuY3Rpb24gY2FsbC5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgLSBGdW5jdGlvbiB0byBiZSBjYWxsZWQgYXQgZW5kIG9mIHRpbWVvdXQuXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBkZWxheSAtIFRpbWUgaW4gbXMgdG8gZGVsYXkgdGhlIGNhbGwgb2YgYGZ1bmNgLlxuICAgKiBAcmV0dXJucyBmdW5jdGlvblxuICAgKi9cbiAgdGhyb3R0bGU6IGZ1bmN0aW9uIChmdW5jLCBkZWxheSkge1xuICAgIHZhciB0aW1lciA9IG51bGw7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGNvbnRleHQgPSB0aGlzLCBhcmdzID0gYXJndW1lbnRzO1xuXG4gICAgICBpZiAodGltZXIgPT09IG51bGwpIHtcbiAgICAgICAgdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICAgIHRpbWVyID0gbnVsbDtcbiAgICAgICAgfSwgZGVsYXkpO1xuICAgICAgfVxuICAgIH07XG4gIH1cbn07XG5cbi8vIFRPRE86IGNvbnNpZGVyIG5vdCBtYWtpbmcgdGhpcyBhIGpRdWVyeSBmdW5jdGlvblxuLy8gVE9ETzogbmVlZCB3YXkgdG8gcmVmbG93IHZzLiByZS1pbml0aWFsaXplXG4vKipcbiAqIFRoZSBGb3VuZGF0aW9uIGpRdWVyeSBtZXRob2QuXG4gKiBAcGFyYW0ge1N0cmluZ3xBcnJheX0gbWV0aG9kIC0gQW4gYWN0aW9uIHRvIHBlcmZvcm0gb24gdGhlIGN1cnJlbnQgalF1ZXJ5IG9iamVjdC5cbiAqL1xudmFyIGZvdW5kYXRpb24gPSBmdW5jdGlvbihtZXRob2QpIHtcbiAgdmFyIHR5cGUgPSB0eXBlb2YgbWV0aG9kLFxuICAgICAgJG1ldGEgPSAkKCdtZXRhLmZvdW5kYXRpb24tbXEnKSxcbiAgICAgICRub0pTID0gJCgnLm5vLWpzJyk7XG5cbiAgaWYoISRtZXRhLmxlbmd0aCl7XG4gICAgJCgnPG1ldGEgY2xhc3M9XCJmb3VuZGF0aW9uLW1xXCI+JykuYXBwZW5kVG8oZG9jdW1lbnQuaGVhZCk7XG4gIH1cbiAgaWYoJG5vSlMubGVuZ3RoKXtcbiAgICAkbm9KUy5yZW1vdmVDbGFzcygnbm8tanMnKTtcbiAgfVxuXG4gIGlmKHR5cGUgPT09ICd1bmRlZmluZWQnKXsvL25lZWRzIHRvIGluaXRpYWxpemUgdGhlIEZvdW5kYXRpb24gb2JqZWN0LCBvciBhbiBpbmRpdmlkdWFsIHBsdWdpbi5cbiAgICBGb3VuZGF0aW9uLk1lZGlhUXVlcnkuX2luaXQoKTtcbiAgICBGb3VuZGF0aW9uLnJlZmxvdyh0aGlzKTtcbiAgfWVsc2UgaWYodHlwZSA9PT0gJ3N0cmluZycpey8vYW4gaW5kaXZpZHVhbCBtZXRob2QgdG8gaW52b2tlIG9uIGEgcGx1Z2luIG9yIGdyb3VwIG9mIHBsdWdpbnNcbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7Ly9jb2xsZWN0IGFsbCB0aGUgYXJndW1lbnRzLCBpZiBuZWNlc3NhcnlcbiAgICB2YXIgcGx1Z0NsYXNzID0gdGhpcy5kYXRhKCd6ZlBsdWdpbicpOy8vZGV0ZXJtaW5lIHRoZSBjbGFzcyBvZiBwbHVnaW5cblxuICAgIGlmKHBsdWdDbGFzcyAhPT0gdW5kZWZpbmVkICYmIHBsdWdDbGFzc1ttZXRob2RdICE9PSB1bmRlZmluZWQpey8vbWFrZSBzdXJlIGJvdGggdGhlIGNsYXNzIGFuZCBtZXRob2QgZXhpc3RcbiAgICAgIGlmKHRoaXMubGVuZ3RoID09PSAxKXsvL2lmIHRoZXJlJ3Mgb25seSBvbmUsIGNhbGwgaXQgZGlyZWN0bHkuXG4gICAgICAgICAgcGx1Z0NsYXNzW21ldGhvZF0uYXBwbHkocGx1Z0NsYXNzLCBhcmdzKTtcbiAgICAgIH1lbHNle1xuICAgICAgICB0aGlzLmVhY2goZnVuY3Rpb24oaSwgZWwpey8vb3RoZXJ3aXNlIGxvb3AgdGhyb3VnaCB0aGUgalF1ZXJ5IGNvbGxlY3Rpb24gYW5kIGludm9rZSB0aGUgbWV0aG9kIG9uIGVhY2hcbiAgICAgICAgICBwbHVnQ2xhc3NbbWV0aG9kXS5hcHBseSgkKGVsKS5kYXRhKCd6ZlBsdWdpbicpLCBhcmdzKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfWVsc2V7Ly9lcnJvciBmb3Igbm8gY2xhc3Mgb3Igbm8gbWV0aG9kXG4gICAgICB0aHJvdyBuZXcgUmVmZXJlbmNlRXJyb3IoXCJXZSdyZSBzb3JyeSwgJ1wiICsgbWV0aG9kICsgXCInIGlzIG5vdCBhbiBhdmFpbGFibGUgbWV0aG9kIGZvciBcIiArIChwbHVnQ2xhc3MgPyBmdW5jdGlvbk5hbWUocGx1Z0NsYXNzKSA6ICd0aGlzIGVsZW1lbnQnKSArICcuJyk7XG4gICAgfVxuICB9ZWxzZXsvL2Vycm9yIGZvciBpbnZhbGlkIGFyZ3VtZW50IHR5cGVcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBXZSdyZSBzb3JyeSwgJHt0eXBlfSBpcyBub3QgYSB2YWxpZCBwYXJhbWV0ZXIuIFlvdSBtdXN0IHVzZSBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIG1ldGhvZCB5b3Ugd2lzaCB0byBpbnZva2UuYCk7XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG53aW5kb3cuRm91bmRhdGlvbiA9IEZvdW5kYXRpb247XG4kLmZuLmZvdW5kYXRpb24gPSBmb3VuZGF0aW9uO1xuXG4vLyBQb2x5ZmlsbCBmb3IgcmVxdWVzdEFuaW1hdGlvbkZyYW1lXG4oZnVuY3Rpb24oKSB7XG4gIGlmICghRGF0ZS5ub3cgfHwgIXdpbmRvdy5EYXRlLm5vdylcbiAgICB3aW5kb3cuRGF0ZS5ub3cgPSBEYXRlLm5vdyA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKCk7IH07XG5cbiAgdmFyIHZlbmRvcnMgPSBbJ3dlYmtpdCcsICdtb3onXTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB2ZW5kb3JzLmxlbmd0aCAmJiAhd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZTsgKytpKSB7XG4gICAgICB2YXIgdnAgPSB2ZW5kb3JzW2ldO1xuICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvd1t2cCsnUmVxdWVzdEFuaW1hdGlvbkZyYW1lJ107XG4gICAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSAod2luZG93W3ZwKydDYW5jZWxBbmltYXRpb25GcmFtZSddXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8fCB3aW5kb3dbdnArJ0NhbmNlbFJlcXVlc3RBbmltYXRpb25GcmFtZSddKTtcbiAgfVxuICBpZiAoL2lQKGFkfGhvbmV8b2QpLipPUyA2Ly50ZXN0KHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50KVxuICAgIHx8ICF3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8ICF3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUpIHtcbiAgICB2YXIgbGFzdFRpbWUgPSAwO1xuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICB2YXIgbm93ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgdmFyIG5leHRUaW1lID0gTWF0aC5tYXgobGFzdFRpbWUgKyAxNiwgbm93KTtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IGNhbGxiYWNrKGxhc3RUaW1lID0gbmV4dFRpbWUpOyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICBuZXh0VGltZSAtIG5vdyk7XG4gICAgfTtcbiAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSBjbGVhclRpbWVvdXQ7XG4gIH1cbiAgLyoqXG4gICAqIFBvbHlmaWxsIGZvciBwZXJmb3JtYW5jZS5ub3csIHJlcXVpcmVkIGJ5IHJBRlxuICAgKi9cbiAgaWYoIXdpbmRvdy5wZXJmb3JtYW5jZSB8fCAhd2luZG93LnBlcmZvcm1hbmNlLm5vdyl7XG4gICAgd2luZG93LnBlcmZvcm1hbmNlID0ge1xuICAgICAgc3RhcnQ6IERhdGUubm93KCksXG4gICAgICBub3c6IGZ1bmN0aW9uKCl7IHJldHVybiBEYXRlLm5vdygpIC0gdGhpcy5zdGFydDsgfVxuICAgIH07XG4gIH1cbn0pKCk7XG5pZiAoIUZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kKSB7XG4gIEZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kID0gZnVuY3Rpb24ob1RoaXMpIHtcbiAgICBpZiAodHlwZW9mIHRoaXMgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIC8vIGNsb3Nlc3QgdGhpbmcgcG9zc2libGUgdG8gdGhlIEVDTUFTY3JpcHQgNVxuICAgICAgLy8gaW50ZXJuYWwgSXNDYWxsYWJsZSBmdW5jdGlvblxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQgLSB3aGF0IGlzIHRyeWluZyB0byBiZSBib3VuZCBpcyBub3QgY2FsbGFibGUnKTtcbiAgICB9XG5cbiAgICB2YXIgYUFyZ3MgICA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSksXG4gICAgICAgIGZUb0JpbmQgPSB0aGlzLFxuICAgICAgICBmTk9QICAgID0gZnVuY3Rpb24oKSB7fSxcbiAgICAgICAgZkJvdW5kICA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiBmVG9CaW5kLmFwcGx5KHRoaXMgaW5zdGFuY2VvZiBmTk9QXG4gICAgICAgICAgICAgICAgID8gdGhpc1xuICAgICAgICAgICAgICAgICA6IG9UaGlzLFxuICAgICAgICAgICAgICAgICBhQXJncy5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgICAgICB9O1xuXG4gICAgaWYgKHRoaXMucHJvdG90eXBlKSB7XG4gICAgICAvLyBuYXRpdmUgZnVuY3Rpb25zIGRvbid0IGhhdmUgYSBwcm90b3R5cGVcbiAgICAgIGZOT1AucHJvdG90eXBlID0gdGhpcy5wcm90b3R5cGU7XG4gICAgfVxuICAgIGZCb3VuZC5wcm90b3R5cGUgPSBuZXcgZk5PUCgpO1xuXG4gICAgcmV0dXJuIGZCb3VuZDtcbiAgfTtcbn1cbi8vIFBvbHlmaWxsIHRvIGdldCB0aGUgbmFtZSBvZiBhIGZ1bmN0aW9uIGluIElFOVxuZnVuY3Rpb24gZnVuY3Rpb25OYW1lKGZuKSB7XG4gIGlmIChGdW5jdGlvbi5wcm90b3R5cGUubmFtZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdmFyIGZ1bmNOYW1lUmVnZXggPSAvZnVuY3Rpb25cXHMoW14oXXsxLH0pXFwoLztcbiAgICB2YXIgcmVzdWx0cyA9IChmdW5jTmFtZVJlZ2V4KS5leGVjKChmbikudG9TdHJpbmcoKSk7XG4gICAgcmV0dXJuIChyZXN1bHRzICYmIHJlc3VsdHMubGVuZ3RoID4gMSkgPyByZXN1bHRzWzFdLnRyaW0oKSA6IFwiXCI7XG4gIH1cbiAgZWxzZSBpZiAoZm4ucHJvdG90eXBlID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gZm4uY29uc3RydWN0b3IubmFtZTtcbiAgfVxuICBlbHNlIHtcbiAgICByZXR1cm4gZm4ucHJvdG90eXBlLmNvbnN0cnVjdG9yLm5hbWU7XG4gIH1cbn1cbmZ1bmN0aW9uIHBhcnNlVmFsdWUoc3RyKXtcbiAgaWYoL3RydWUvLnRlc3Qoc3RyKSkgcmV0dXJuIHRydWU7XG4gIGVsc2UgaWYoL2ZhbHNlLy50ZXN0KHN0cikpIHJldHVybiBmYWxzZTtcbiAgZWxzZSBpZighaXNOYU4oc3RyICogMSkpIHJldHVybiBwYXJzZUZsb2F0KHN0cik7XG4gIHJldHVybiBzdHI7XG59XG4vLyBDb252ZXJ0IFBhc2NhbENhc2UgdG8ga2ViYWItY2FzZVxuLy8gVGhhbmsgeW91OiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS84OTU1NTgwXG5mdW5jdGlvbiBoeXBoZW5hdGUoc3RyKSB7XG4gIHJldHVybiBzdHIucmVwbGFjZSgvKFthLXpdKShbQS1aXSkvZywgJyQxLSQyJykudG9Mb3dlckNhc2UoKTtcbn1cblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG5Gb3VuZGF0aW9uLkJveCA9IHtcbiAgSW1Ob3RUb3VjaGluZ1lvdTogSW1Ob3RUb3VjaGluZ1lvdSxcbiAgR2V0RGltZW5zaW9uczogR2V0RGltZW5zaW9ucyxcbiAgR2V0T2Zmc2V0czogR2V0T2Zmc2V0c1xufVxuXG4vKipcbiAqIENvbXBhcmVzIHRoZSBkaW1lbnNpb25zIG9mIGFuIGVsZW1lbnQgdG8gYSBjb250YWluZXIgYW5kIGRldGVybWluZXMgY29sbGlzaW9uIGV2ZW50cyB3aXRoIGNvbnRhaW5lci5cbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIHRlc3QgZm9yIGNvbGxpc2lvbnMuXG4gKiBAcGFyYW0ge2pRdWVyeX0gcGFyZW50IC0galF1ZXJ5IG9iamVjdCB0byB1c2UgYXMgYm91bmRpbmcgY29udGFpbmVyLlxuICogQHBhcmFtIHtCb29sZWFufSBsck9ubHkgLSBzZXQgdG8gdHJ1ZSB0byBjaGVjayBsZWZ0IGFuZCByaWdodCB2YWx1ZXMgb25seS5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gdGJPbmx5IC0gc2V0IHRvIHRydWUgdG8gY2hlY2sgdG9wIGFuZCBib3R0b20gdmFsdWVzIG9ubHkuXG4gKiBAZGVmYXVsdCBpZiBubyBwYXJlbnQgb2JqZWN0IHBhc3NlZCwgZGV0ZWN0cyBjb2xsaXNpb25zIHdpdGggYHdpbmRvd2AuXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gLSB0cnVlIGlmIGNvbGxpc2lvbiBmcmVlLCBmYWxzZSBpZiBhIGNvbGxpc2lvbiBpbiBhbnkgZGlyZWN0aW9uLlxuICovXG5mdW5jdGlvbiBJbU5vdFRvdWNoaW5nWW91KGVsZW1lbnQsIHBhcmVudCwgbHJPbmx5LCB0Yk9ubHkpIHtcbiAgdmFyIGVsZURpbXMgPSBHZXREaW1lbnNpb25zKGVsZW1lbnQpLFxuICAgICAgdG9wLCBib3R0b20sIGxlZnQsIHJpZ2h0O1xuXG4gIGlmIChwYXJlbnQpIHtcbiAgICB2YXIgcGFyRGltcyA9IEdldERpbWVuc2lvbnMocGFyZW50KTtcblxuICAgIGJvdHRvbSA9IChlbGVEaW1zLm9mZnNldC50b3AgKyBlbGVEaW1zLmhlaWdodCA8PSBwYXJEaW1zLmhlaWdodCArIHBhckRpbXMub2Zmc2V0LnRvcCk7XG4gICAgdG9wICAgID0gKGVsZURpbXMub2Zmc2V0LnRvcCA+PSBwYXJEaW1zLm9mZnNldC50b3ApO1xuICAgIGxlZnQgICA9IChlbGVEaW1zLm9mZnNldC5sZWZ0ID49IHBhckRpbXMub2Zmc2V0LmxlZnQpO1xuICAgIHJpZ2h0ICA9IChlbGVEaW1zLm9mZnNldC5sZWZ0ICsgZWxlRGltcy53aWR0aCA8PSBwYXJEaW1zLndpZHRoICsgcGFyRGltcy5vZmZzZXQubGVmdCk7XG4gIH1cbiAgZWxzZSB7XG4gICAgYm90dG9tID0gKGVsZURpbXMub2Zmc2V0LnRvcCArIGVsZURpbXMuaGVpZ2h0IDw9IGVsZURpbXMud2luZG93RGltcy5oZWlnaHQgKyBlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LnRvcCk7XG4gICAgdG9wICAgID0gKGVsZURpbXMub2Zmc2V0LnRvcCA+PSBlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LnRvcCk7XG4gICAgbGVmdCAgID0gKGVsZURpbXMub2Zmc2V0LmxlZnQgPj0gZWxlRGltcy53aW5kb3dEaW1zLm9mZnNldC5sZWZ0KTtcbiAgICByaWdodCAgPSAoZWxlRGltcy5vZmZzZXQubGVmdCArIGVsZURpbXMud2lkdGggPD0gZWxlRGltcy53aW5kb3dEaW1zLndpZHRoKTtcbiAgfVxuXG4gIHZhciBhbGxEaXJzID0gW2JvdHRvbSwgdG9wLCBsZWZ0LCByaWdodF07XG5cbiAgaWYgKGxyT25seSkge1xuICAgIHJldHVybiBsZWZ0ID09PSByaWdodCA9PT0gdHJ1ZTtcbiAgfVxuXG4gIGlmICh0Yk9ubHkpIHtcbiAgICByZXR1cm4gdG9wID09PSBib3R0b20gPT09IHRydWU7XG4gIH1cblxuICByZXR1cm4gYWxsRGlycy5pbmRleE9mKGZhbHNlKSA9PT0gLTE7XG59O1xuXG4vKipcbiAqIFVzZXMgbmF0aXZlIG1ldGhvZHMgdG8gcmV0dXJuIGFuIG9iamVjdCBvZiBkaW1lbnNpb24gdmFsdWVzLlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge2pRdWVyeSB8fCBIVE1MfSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCBvciBET00gZWxlbWVudCBmb3Igd2hpY2ggdG8gZ2V0IHRoZSBkaW1lbnNpb25zLiBDYW4gYmUgYW55IGVsZW1lbnQgb3RoZXIgdGhhdCBkb2N1bWVudCBvciB3aW5kb3cuXG4gKiBAcmV0dXJucyB7T2JqZWN0fSAtIG5lc3RlZCBvYmplY3Qgb2YgaW50ZWdlciBwaXhlbCB2YWx1ZXNcbiAqIFRPRE8gLSBpZiBlbGVtZW50IGlzIHdpbmRvdywgcmV0dXJuIG9ubHkgdGhvc2UgdmFsdWVzLlxuICovXG5mdW5jdGlvbiBHZXREaW1lbnNpb25zKGVsZW0sIHRlc3Qpe1xuICBlbGVtID0gZWxlbS5sZW5ndGggPyBlbGVtWzBdIDogZWxlbTtcblxuICBpZiAoZWxlbSA9PT0gd2luZG93IHx8IGVsZW0gPT09IGRvY3VtZW50KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiSSdtIHNvcnJ5LCBEYXZlLiBJJ20gYWZyYWlkIEkgY2FuJ3QgZG8gdGhhdC5cIik7XG4gIH1cblxuICB2YXIgcmVjdCA9IGVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksXG4gICAgICBwYXJSZWN0ID0gZWxlbS5wYXJlbnROb2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLFxuICAgICAgd2luUmVjdCA9IGRvY3VtZW50LmJvZHkuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksXG4gICAgICB3aW5ZID0gd2luZG93LnBhZ2VZT2Zmc2V0LFxuICAgICAgd2luWCA9IHdpbmRvdy5wYWdlWE9mZnNldDtcblxuICByZXR1cm4ge1xuICAgIHdpZHRoOiByZWN0LndpZHRoLFxuICAgIGhlaWdodDogcmVjdC5oZWlnaHQsXG4gICAgb2Zmc2V0OiB7XG4gICAgICB0b3A6IHJlY3QudG9wICsgd2luWSxcbiAgICAgIGxlZnQ6IHJlY3QubGVmdCArIHdpblhcbiAgICB9LFxuICAgIHBhcmVudERpbXM6IHtcbiAgICAgIHdpZHRoOiBwYXJSZWN0LndpZHRoLFxuICAgICAgaGVpZ2h0OiBwYXJSZWN0LmhlaWdodCxcbiAgICAgIG9mZnNldDoge1xuICAgICAgICB0b3A6IHBhclJlY3QudG9wICsgd2luWSxcbiAgICAgICAgbGVmdDogcGFyUmVjdC5sZWZ0ICsgd2luWFxuICAgICAgfVxuICAgIH0sXG4gICAgd2luZG93RGltczoge1xuICAgICAgd2lkdGg6IHdpblJlY3Qud2lkdGgsXG4gICAgICBoZWlnaHQ6IHdpblJlY3QuaGVpZ2h0LFxuICAgICAgb2Zmc2V0OiB7XG4gICAgICAgIHRvcDogd2luWSxcbiAgICAgICAgbGVmdDogd2luWFxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgYW4gb2JqZWN0IG9mIHRvcCBhbmQgbGVmdCBpbnRlZ2VyIHBpeGVsIHZhbHVlcyBmb3IgZHluYW1pY2FsbHkgcmVuZGVyZWQgZWxlbWVudHMsXG4gKiBzdWNoIGFzOiBUb29sdGlwLCBSZXZlYWwsIGFuZCBEcm9wZG93blxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBlbGVtZW50IGJlaW5nIHBvc2l0aW9uZWQuXG4gKiBAcGFyYW0ge2pRdWVyeX0gYW5jaG9yIC0galF1ZXJ5IG9iamVjdCBmb3IgdGhlIGVsZW1lbnQncyBhbmNob3IgcG9pbnQuXG4gKiBAcGFyYW0ge1N0cmluZ30gcG9zaXRpb24gLSBhIHN0cmluZyByZWxhdGluZyB0byB0aGUgZGVzaXJlZCBwb3NpdGlvbiBvZiB0aGUgZWxlbWVudCwgcmVsYXRpdmUgdG8gaXQncyBhbmNob3JcbiAqIEBwYXJhbSB7TnVtYmVyfSB2T2Zmc2V0IC0gaW50ZWdlciBwaXhlbCB2YWx1ZSBvZiBkZXNpcmVkIHZlcnRpY2FsIHNlcGFyYXRpb24gYmV0d2VlbiBhbmNob3IgYW5kIGVsZW1lbnQuXG4gKiBAcGFyYW0ge051bWJlcn0gaE9mZnNldCAtIGludGVnZXIgcGl4ZWwgdmFsdWUgb2YgZGVzaXJlZCBob3Jpem9udGFsIHNlcGFyYXRpb24gYmV0d2VlbiBhbmNob3IgYW5kIGVsZW1lbnQuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGlzT3ZlcmZsb3cgLSBpZiBhIGNvbGxpc2lvbiBldmVudCBpcyBkZXRlY3RlZCwgc2V0cyB0byB0cnVlIHRvIGRlZmF1bHQgdGhlIGVsZW1lbnQgdG8gZnVsbCB3aWR0aCAtIGFueSBkZXNpcmVkIG9mZnNldC5cbiAqIFRPRE8gYWx0ZXIvcmV3cml0ZSB0byB3b3JrIHdpdGggYGVtYCB2YWx1ZXMgYXMgd2VsbC9pbnN0ZWFkIG9mIHBpeGVsc1xuICovXG5mdW5jdGlvbiBHZXRPZmZzZXRzKGVsZW1lbnQsIGFuY2hvciwgcG9zaXRpb24sIHZPZmZzZXQsIGhPZmZzZXQsIGlzT3ZlcmZsb3cpIHtcbiAgdmFyICRlbGVEaW1zID0gR2V0RGltZW5zaW9ucyhlbGVtZW50KSxcbiAgICAgICRhbmNob3JEaW1zID0gYW5jaG9yID8gR2V0RGltZW5zaW9ucyhhbmNob3IpIDogbnVsbDtcblxuICBzd2l0Y2ggKHBvc2l0aW9uKSB7XG4gICAgY2FzZSAndG9wJzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6IChGb3VuZGF0aW9uLnJ0bCgpID8gJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgLSAkZWxlRGltcy53aWR0aCArICRhbmNob3JEaW1zLndpZHRoIDogJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQpLFxuICAgICAgICB0b3A6ICRhbmNob3JEaW1zLm9mZnNldC50b3AgLSAoJGVsZURpbXMuaGVpZ2h0ICsgdk9mZnNldClcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2xlZnQnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgLSAoJGVsZURpbXMud2lkdGggKyBoT2Zmc2V0KSxcbiAgICAgICAgdG9wOiAkYW5jaG9yRGltcy5vZmZzZXQudG9wXG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlICdyaWdodCc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCArICRhbmNob3JEaW1zLndpZHRoICsgaE9mZnNldCxcbiAgICAgICAgdG9wOiAkYW5jaG9yRGltcy5vZmZzZXQudG9wXG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlICdjZW50ZXIgdG9wJzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6ICgkYW5jaG9yRGltcy5vZmZzZXQubGVmdCArICgkYW5jaG9yRGltcy53aWR0aCAvIDIpKSAtICgkZWxlRGltcy53aWR0aCAvIDIpLFxuICAgICAgICB0b3A6ICRhbmNob3JEaW1zLm9mZnNldC50b3AgLSAoJGVsZURpbXMuaGVpZ2h0ICsgdk9mZnNldClcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2NlbnRlciBib3R0b20nOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogaXNPdmVyZmxvdyA/IGhPZmZzZXQgOiAoKCRhbmNob3JEaW1zLm9mZnNldC5sZWZ0ICsgKCRhbmNob3JEaW1zLndpZHRoIC8gMikpIC0gKCRlbGVEaW1zLndpZHRoIC8gMikpLFxuICAgICAgICB0b3A6ICRhbmNob3JEaW1zLm9mZnNldC50b3AgKyAkYW5jaG9yRGltcy5oZWlnaHQgKyB2T2Zmc2V0XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlICdjZW50ZXIgbGVmdCc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCAtICgkZWxlRGltcy53aWR0aCArIGhPZmZzZXQpLFxuICAgICAgICB0b3A6ICgkYW5jaG9yRGltcy5vZmZzZXQudG9wICsgKCRhbmNob3JEaW1zLmhlaWdodCAvIDIpKSAtICgkZWxlRGltcy5oZWlnaHQgLyAyKVxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnY2VudGVyIHJpZ2h0JzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0ICsgJGFuY2hvckRpbXMud2lkdGggKyBoT2Zmc2V0ICsgMSxcbiAgICAgICAgdG9wOiAoJGFuY2hvckRpbXMub2Zmc2V0LnRvcCArICgkYW5jaG9yRGltcy5oZWlnaHQgLyAyKSkgLSAoJGVsZURpbXMuaGVpZ2h0IC8gMilcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2NlbnRlcic6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiAoJGVsZURpbXMud2luZG93RGltcy5vZmZzZXQubGVmdCArICgkZWxlRGltcy53aW5kb3dEaW1zLndpZHRoIC8gMikpIC0gKCRlbGVEaW1zLndpZHRoIC8gMiksXG4gICAgICAgIHRvcDogKCRlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LnRvcCArICgkZWxlRGltcy53aW5kb3dEaW1zLmhlaWdodCAvIDIpKSAtICgkZWxlRGltcy5oZWlnaHQgLyAyKVxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAncmV2ZWFsJzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6ICgkZWxlRGltcy53aW5kb3dEaW1zLndpZHRoIC0gJGVsZURpbXMud2lkdGgpIC8gMixcbiAgICAgICAgdG9wOiAkZWxlRGltcy53aW5kb3dEaW1zLm9mZnNldC50b3AgKyB2T2Zmc2V0XG4gICAgICB9XG4gICAgY2FzZSAncmV2ZWFsIGZ1bGwnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogJGVsZURpbXMud2luZG93RGltcy5vZmZzZXQubGVmdCxcbiAgICAgICAgdG9wOiAkZWxlRGltcy53aW5kb3dEaW1zLm9mZnNldC50b3BcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2xlZnQgYm90dG9tJzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0LFxuICAgICAgICB0b3A6ICRhbmNob3JEaW1zLm9mZnNldC50b3AgKyAkYW5jaG9yRGltcy5oZWlnaHRcbiAgICAgIH07XG4gICAgICBicmVhaztcbiAgICBjYXNlICdyaWdodCBib3R0b20nOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgKyAkYW5jaG9yRGltcy53aWR0aCArIGhPZmZzZXQgLSAkZWxlRGltcy53aWR0aCxcbiAgICAgICAgdG9wOiAkYW5jaG9yRGltcy5vZmZzZXQudG9wICsgJGFuY2hvckRpbXMuaGVpZ2h0XG4gICAgICB9O1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6IChGb3VuZGF0aW9uLnJ0bCgpID8gJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgLSAkZWxlRGltcy53aWR0aCArICRhbmNob3JEaW1zLndpZHRoIDogJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgKyBoT2Zmc2V0KSxcbiAgICAgICAgdG9wOiAkYW5jaG9yRGltcy5vZmZzZXQudG9wICsgJGFuY2hvckRpbXMuaGVpZ2h0ICsgdk9mZnNldFxuICAgICAgfVxuICB9XG59XG5cbn0oalF1ZXJ5KTtcbiIsIi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogVGhpcyB1dGlsIHdhcyBjcmVhdGVkIGJ5IE1hcml1cyBPbGJlcnR6ICpcbiAqIFBsZWFzZSB0aGFuayBNYXJpdXMgb24gR2l0SHViIC9vd2xiZXJ0eiAqXG4gKiBvciB0aGUgd2ViIGh0dHA6Ly93d3cubWFyaXVzb2xiZXJ0ei5kZS8gKlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuY29uc3Qga2V5Q29kZXMgPSB7XG4gIDk6ICdUQUInLFxuICAxMzogJ0VOVEVSJyxcbiAgMjc6ICdFU0NBUEUnLFxuICAzMjogJ1NQQUNFJyxcbiAgMzc6ICdBUlJPV19MRUZUJyxcbiAgMzg6ICdBUlJPV19VUCcsXG4gIDM5OiAnQVJST1dfUklHSFQnLFxuICA0MDogJ0FSUk9XX0RPV04nXG59XG5cbnZhciBjb21tYW5kcyA9IHt9XG5cbnZhciBLZXlib2FyZCA9IHtcbiAga2V5czogZ2V0S2V5Q29kZXMoa2V5Q29kZXMpLFxuXG4gIC8qKlxuICAgKiBQYXJzZXMgdGhlIChrZXlib2FyZCkgZXZlbnQgYW5kIHJldHVybnMgYSBTdHJpbmcgdGhhdCByZXByZXNlbnRzIGl0cyBrZXlcbiAgICogQ2FuIGJlIHVzZWQgbGlrZSBGb3VuZGF0aW9uLnBhcnNlS2V5KGV2ZW50KSA9PT0gRm91bmRhdGlvbi5rZXlzLlNQQUNFXG4gICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50IC0gdGhlIGV2ZW50IGdlbmVyYXRlZCBieSB0aGUgZXZlbnQgaGFuZGxlclxuICAgKiBAcmV0dXJuIFN0cmluZyBrZXkgLSBTdHJpbmcgdGhhdCByZXByZXNlbnRzIHRoZSBrZXkgcHJlc3NlZFxuICAgKi9cbiAgcGFyc2VLZXkoZXZlbnQpIHtcbiAgICB2YXIga2V5ID0ga2V5Q29kZXNbZXZlbnQud2hpY2ggfHwgZXZlbnQua2V5Q29kZV0gfHwgU3RyaW5nLmZyb21DaGFyQ29kZShldmVudC53aGljaCkudG9VcHBlckNhc2UoKTtcbiAgICBpZiAoZXZlbnQuc2hpZnRLZXkpIGtleSA9IGBTSElGVF8ke2tleX1gO1xuICAgIGlmIChldmVudC5jdHJsS2V5KSBrZXkgPSBgQ1RSTF8ke2tleX1gO1xuICAgIGlmIChldmVudC5hbHRLZXkpIGtleSA9IGBBTFRfJHtrZXl9YDtcbiAgICByZXR1cm4ga2V5O1xuICB9LFxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIHRoZSBnaXZlbiAoa2V5Ym9hcmQpIGV2ZW50XG4gICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50IC0gdGhlIGV2ZW50IGdlbmVyYXRlZCBieSB0aGUgZXZlbnQgaGFuZGxlclxuICAgKiBAcGFyYW0ge1N0cmluZ30gY29tcG9uZW50IC0gRm91bmRhdGlvbiBjb21wb25lbnQncyBuYW1lLCBlLmcuIFNsaWRlciBvciBSZXZlYWxcbiAgICogQHBhcmFtIHtPYmplY3RzfSBmdW5jdGlvbnMgLSBjb2xsZWN0aW9uIG9mIGZ1bmN0aW9ucyB0aGF0IGFyZSB0byBiZSBleGVjdXRlZFxuICAgKi9cbiAgaGFuZGxlS2V5KGV2ZW50LCBjb21wb25lbnQsIGZ1bmN0aW9ucykge1xuICAgIHZhciBjb21tYW5kTGlzdCA9IGNvbW1hbmRzW2NvbXBvbmVudF0sXG4gICAgICBrZXlDb2RlID0gdGhpcy5wYXJzZUtleShldmVudCksXG4gICAgICBjbWRzLFxuICAgICAgY29tbWFuZCxcbiAgICAgIGZuO1xuXG4gICAgaWYgKCFjb21tYW5kTGlzdCkgcmV0dXJuIGNvbnNvbGUud2FybignQ29tcG9uZW50IG5vdCBkZWZpbmVkIScpO1xuXG4gICAgaWYgKHR5cGVvZiBjb21tYW5kTGlzdC5sdHIgPT09ICd1bmRlZmluZWQnKSB7IC8vIHRoaXMgY29tcG9uZW50IGRvZXMgbm90IGRpZmZlcmVudGlhdGUgYmV0d2VlbiBsdHIgYW5kIHJ0bFxuICAgICAgICBjbWRzID0gY29tbWFuZExpc3Q7IC8vIHVzZSBwbGFpbiBsaXN0XG4gICAgfSBlbHNlIHsgLy8gbWVyZ2UgbHRyIGFuZCBydGw6IGlmIGRvY3VtZW50IGlzIHJ0bCwgcnRsIG92ZXJ3cml0ZXMgbHRyIGFuZCB2aWNlIHZlcnNhXG4gICAgICAgIGlmIChGb3VuZGF0aW9uLnJ0bCgpKSBjbWRzID0gJC5leHRlbmQoe30sIGNvbW1hbmRMaXN0Lmx0ciwgY29tbWFuZExpc3QucnRsKTtcblxuICAgICAgICBlbHNlIGNtZHMgPSAkLmV4dGVuZCh7fSwgY29tbWFuZExpc3QucnRsLCBjb21tYW5kTGlzdC5sdHIpO1xuICAgIH1cbiAgICBjb21tYW5kID0gY21kc1trZXlDb2RlXTtcblxuICAgIGZuID0gZnVuY3Rpb25zW2NvbW1hbmRdO1xuICAgIGlmIChmbiAmJiB0eXBlb2YgZm4gPT09ICdmdW5jdGlvbicpIHsgLy8gZXhlY3V0ZSBmdW5jdGlvbiAgaWYgZXhpc3RzXG4gICAgICB2YXIgcmV0dXJuVmFsdWUgPSBmbi5hcHBseSgpO1xuICAgICAgaWYgKGZ1bmN0aW9ucy5oYW5kbGVkIHx8IHR5cGVvZiBmdW5jdGlvbnMuaGFuZGxlZCA9PT0gJ2Z1bmN0aW9uJykgeyAvLyBleGVjdXRlIGZ1bmN0aW9uIHdoZW4gZXZlbnQgd2FzIGhhbmRsZWRcbiAgICAgICAgICBmdW5jdGlvbnMuaGFuZGxlZChyZXR1cm5WYWx1ZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChmdW5jdGlvbnMudW5oYW5kbGVkIHx8IHR5cGVvZiBmdW5jdGlvbnMudW5oYW5kbGVkID09PSAnZnVuY3Rpb24nKSB7IC8vIGV4ZWN1dGUgZnVuY3Rpb24gd2hlbiBldmVudCB3YXMgbm90IGhhbmRsZWRcbiAgICAgICAgICBmdW5jdGlvbnMudW5oYW5kbGVkKCk7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBGaW5kcyBhbGwgZm9jdXNhYmxlIGVsZW1lbnRzIHdpdGhpbiB0aGUgZ2l2ZW4gYCRlbGVtZW50YFxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIHNlYXJjaCB3aXRoaW5cbiAgICogQHJldHVybiB7alF1ZXJ5fSAkZm9jdXNhYmxlIC0gYWxsIGZvY3VzYWJsZSBlbGVtZW50cyB3aXRoaW4gYCRlbGVtZW50YFxuICAgKi9cbiAgZmluZEZvY3VzYWJsZSgkZWxlbWVudCkge1xuICAgIHJldHVybiAkZWxlbWVudC5maW5kKCdhW2hyZWZdLCBhcmVhW2hyZWZdLCBpbnB1dDpub3QoW2Rpc2FibGVkXSksIHNlbGVjdDpub3QoW2Rpc2FibGVkXSksIHRleHRhcmVhOm5vdChbZGlzYWJsZWRdKSwgYnV0dG9uOm5vdChbZGlzYWJsZWRdKSwgaWZyYW1lLCBvYmplY3QsIGVtYmVkLCAqW3RhYmluZGV4XSwgKltjb250ZW50ZWRpdGFibGVdJykuZmlsdGVyKGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCEkKHRoaXMpLmlzKCc6dmlzaWJsZScpIHx8ICQodGhpcykuYXR0cigndGFiaW5kZXgnKSA8IDApIHsgcmV0dXJuIGZhbHNlOyB9IC8vb25seSBoYXZlIHZpc2libGUgZWxlbWVudHMgYW5kIHRob3NlIHRoYXQgaGF2ZSBhIHRhYmluZGV4IGdyZWF0ZXIgb3IgZXF1YWwgMFxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGNvbXBvbmVudCBuYW1lIG5hbWVcbiAgICogQHBhcmFtIHtPYmplY3R9IGNvbXBvbmVudCAtIEZvdW5kYXRpb24gY29tcG9uZW50LCBlLmcuIFNsaWRlciBvciBSZXZlYWxcbiAgICogQHJldHVybiBTdHJpbmcgY29tcG9uZW50TmFtZVxuICAgKi9cblxuICByZWdpc3Rlcihjb21wb25lbnROYW1lLCBjbWRzKSB7XG4gICAgY29tbWFuZHNbY29tcG9uZW50TmFtZV0gPSBjbWRzO1xuICB9XG59XG5cbi8qXG4gKiBDb25zdGFudHMgZm9yIGVhc2llciBjb21wYXJpbmcuXG4gKiBDYW4gYmUgdXNlZCBsaWtlIEZvdW5kYXRpb24ucGFyc2VLZXkoZXZlbnQpID09PSBGb3VuZGF0aW9uLmtleXMuU1BBQ0VcbiAqL1xuZnVuY3Rpb24gZ2V0S2V5Q29kZXMoa2NzKSB7XG4gIHZhciBrID0ge307XG4gIGZvciAodmFyIGtjIGluIGtjcykga1trY3Nba2NdXSA9IGtjc1trY107XG4gIHJldHVybiBrO1xufVxuXG5Gb3VuZGF0aW9uLktleWJvYXJkID0gS2V5Ym9hcmQ7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLy8gRGVmYXVsdCBzZXQgb2YgbWVkaWEgcXVlcmllc1xuY29uc3QgZGVmYXVsdFF1ZXJpZXMgPSB7XG4gICdkZWZhdWx0JyA6ICdvbmx5IHNjcmVlbicsXG4gIGxhbmRzY2FwZSA6ICdvbmx5IHNjcmVlbiBhbmQgKG9yaWVudGF0aW9uOiBsYW5kc2NhcGUpJyxcbiAgcG9ydHJhaXQgOiAnb25seSBzY3JlZW4gYW5kIChvcmllbnRhdGlvbjogcG9ydHJhaXQpJyxcbiAgcmV0aW5hIDogJ29ubHkgc2NyZWVuIGFuZCAoLXdlYmtpdC1taW4tZGV2aWNlLXBpeGVsLXJhdGlvOiAyKSwnICtcbiAgICAnb25seSBzY3JlZW4gYW5kIChtaW4tLW1vei1kZXZpY2UtcGl4ZWwtcmF0aW86IDIpLCcgK1xuICAgICdvbmx5IHNjcmVlbiBhbmQgKC1vLW1pbi1kZXZpY2UtcGl4ZWwtcmF0aW86IDIvMSksJyArXG4gICAgJ29ubHkgc2NyZWVuIGFuZCAobWluLWRldmljZS1waXhlbC1yYXRpbzogMiksJyArXG4gICAgJ29ubHkgc2NyZWVuIGFuZCAobWluLXJlc29sdXRpb246IDE5MmRwaSksJyArXG4gICAgJ29ubHkgc2NyZWVuIGFuZCAobWluLXJlc29sdXRpb246IDJkcHB4KSdcbn07XG5cbnZhciBNZWRpYVF1ZXJ5ID0ge1xuICBxdWVyaWVzOiBbXSxcblxuICBjdXJyZW50OiAnJyxcblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIG1lZGlhIHF1ZXJ5IGhlbHBlciwgYnkgZXh0cmFjdGluZyB0aGUgYnJlYWtwb2ludCBsaXN0IGZyb20gdGhlIENTUyBhbmQgYWN0aXZhdGluZyB0aGUgYnJlYWtwb2ludCB3YXRjaGVyLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9pbml0KCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgZXh0cmFjdGVkU3R5bGVzID0gJCgnLmZvdW5kYXRpb24tbXEnKS5jc3MoJ2ZvbnQtZmFtaWx5Jyk7XG4gICAgdmFyIG5hbWVkUXVlcmllcztcblxuICAgIG5hbWVkUXVlcmllcyA9IHBhcnNlU3R5bGVUb09iamVjdChleHRyYWN0ZWRTdHlsZXMpO1xuXG4gICAgZm9yICh2YXIga2V5IGluIG5hbWVkUXVlcmllcykge1xuICAgICAgaWYobmFtZWRRdWVyaWVzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgc2VsZi5xdWVyaWVzLnB1c2goe1xuICAgICAgICAgIG5hbWU6IGtleSxcbiAgICAgICAgICB2YWx1ZTogYG9ubHkgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAke25hbWVkUXVlcmllc1trZXldfSlgXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuY3VycmVudCA9IHRoaXMuX2dldEN1cnJlbnRTaXplKCk7XG5cbiAgICB0aGlzLl93YXRjaGVyKCk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGUgc2NyZWVuIGlzIGF0IGxlYXN0IGFzIHdpZGUgYXMgYSBicmVha3BvaW50LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHBhcmFtIHtTdHJpbmd9IHNpemUgLSBOYW1lIG9mIHRoZSBicmVha3BvaW50IHRvIGNoZWNrLlxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gYHRydWVgIGlmIHRoZSBicmVha3BvaW50IG1hdGNoZXMsIGBmYWxzZWAgaWYgaXQncyBzbWFsbGVyLlxuICAgKi9cbiAgYXRMZWFzdChzaXplKSB7XG4gICAgdmFyIHF1ZXJ5ID0gdGhpcy5nZXQoc2l6ZSk7XG5cbiAgICBpZiAocXVlcnkpIHtcbiAgICAgIHJldHVybiB3aW5kb3cubWF0Y2hNZWRpYShxdWVyeSkubWF0Y2hlcztcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG1lZGlhIHF1ZXJ5IG9mIGEgYnJlYWtwb2ludC5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBzaXplIC0gTmFtZSBvZiB0aGUgYnJlYWtwb2ludCB0byBnZXQuXG4gICAqIEByZXR1cm5zIHtTdHJpbmd8bnVsbH0gLSBUaGUgbWVkaWEgcXVlcnkgb2YgdGhlIGJyZWFrcG9pbnQsIG9yIGBudWxsYCBpZiB0aGUgYnJlYWtwb2ludCBkb2Vzbid0IGV4aXN0LlxuICAgKi9cbiAgZ2V0KHNpemUpIHtcbiAgICBmb3IgKHZhciBpIGluIHRoaXMucXVlcmllcykge1xuICAgICAgaWYodGhpcy5xdWVyaWVzLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgIHZhciBxdWVyeSA9IHRoaXMucXVlcmllc1tpXTtcbiAgICAgICAgaWYgKHNpemUgPT09IHF1ZXJ5Lm5hbWUpIHJldHVybiBxdWVyeS52YWx1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfSxcblxuICAvKipcbiAgICogR2V0cyB0aGUgY3VycmVudCBicmVha3BvaW50IG5hbWUgYnkgdGVzdGluZyBldmVyeSBicmVha3BvaW50IGFuZCByZXR1cm5pbmcgdGhlIGxhc3Qgb25lIHRvIG1hdGNoICh0aGUgYmlnZ2VzdCBvbmUpLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICogQHJldHVybnMge1N0cmluZ30gTmFtZSBvZiB0aGUgY3VycmVudCBicmVha3BvaW50LlxuICAgKi9cbiAgX2dldEN1cnJlbnRTaXplKCkge1xuICAgIHZhciBtYXRjaGVkO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnF1ZXJpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBxdWVyeSA9IHRoaXMucXVlcmllc1tpXTtcblxuICAgICAgaWYgKHdpbmRvdy5tYXRjaE1lZGlhKHF1ZXJ5LnZhbHVlKS5tYXRjaGVzKSB7XG4gICAgICAgIG1hdGNoZWQgPSBxdWVyeTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIG1hdGNoZWQgPT09ICdvYmplY3QnKSB7XG4gICAgICByZXR1cm4gbWF0Y2hlZC5uYW1lO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbWF0Y2hlZDtcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIEFjdGl2YXRlcyB0aGUgYnJlYWtwb2ludCB3YXRjaGVyLCB3aGljaCBmaXJlcyBhbiBldmVudCBvbiB0aGUgd2luZG93IHdoZW5ldmVyIHRoZSBicmVha3BvaW50IGNoYW5nZXMuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3dhdGNoZXIoKSB7XG4gICAgJCh3aW5kb3cpLm9uKCdyZXNpemUuemYubWVkaWFxdWVyeScsICgpID0+IHtcbiAgICAgIHZhciBuZXdTaXplID0gdGhpcy5fZ2V0Q3VycmVudFNpemUoKSwgY3VycmVudFNpemUgPSB0aGlzLmN1cnJlbnQ7XG5cbiAgICAgIGlmIChuZXdTaXplICE9PSBjdXJyZW50U2l6ZSkge1xuICAgICAgICAvLyBDaGFuZ2UgdGhlIGN1cnJlbnQgbWVkaWEgcXVlcnlcbiAgICAgICAgdGhpcy5jdXJyZW50ID0gbmV3U2l6ZTtcblxuICAgICAgICAvLyBCcm9hZGNhc3QgdGhlIG1lZGlhIHF1ZXJ5IGNoYW5nZSBvbiB0aGUgd2luZG93XG4gICAgICAgICQod2luZG93KS50cmlnZ2VyKCdjaGFuZ2VkLnpmLm1lZGlhcXVlcnknLCBbbmV3U2l6ZSwgY3VycmVudFNpemVdKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufTtcblxuRm91bmRhdGlvbi5NZWRpYVF1ZXJ5ID0gTWVkaWFRdWVyeTtcblxuLy8gbWF0Y2hNZWRpYSgpIHBvbHlmaWxsIC0gVGVzdCBhIENTUyBtZWRpYSB0eXBlL3F1ZXJ5IGluIEpTLlxuLy8gQXV0aG9ycyAmIGNvcHlyaWdodCAoYykgMjAxMjogU2NvdHQgSmVobCwgUGF1bCBJcmlzaCwgTmljaG9sYXMgWmFrYXMsIERhdmlkIEtuaWdodC4gRHVhbCBNSVQvQlNEIGxpY2Vuc2VcbndpbmRvdy5tYXRjaE1lZGlhIHx8ICh3aW5kb3cubWF0Y2hNZWRpYSA9IGZ1bmN0aW9uKCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgLy8gRm9yIGJyb3dzZXJzIHRoYXQgc3VwcG9ydCBtYXRjaE1lZGl1bSBhcGkgc3VjaCBhcyBJRSA5IGFuZCB3ZWJraXRcbiAgdmFyIHN0eWxlTWVkaWEgPSAod2luZG93LnN0eWxlTWVkaWEgfHwgd2luZG93Lm1lZGlhKTtcblxuICAvLyBGb3IgdGhvc2UgdGhhdCBkb24ndCBzdXBwb3J0IG1hdGNoTWVkaXVtXG4gIGlmICghc3R5bGVNZWRpYSkge1xuICAgIHZhciBzdHlsZSAgID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKSxcbiAgICBzY3JpcHQgICAgICA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdzY3JpcHQnKVswXSxcbiAgICBpbmZvICAgICAgICA9IG51bGw7XG5cbiAgICBzdHlsZS50eXBlICA9ICd0ZXh0L2Nzcyc7XG4gICAgc3R5bGUuaWQgICAgPSAnbWF0Y2htZWRpYWpzLXRlc3QnO1xuXG4gICAgc2NyaXB0ICYmIHNjcmlwdC5wYXJlbnROb2RlICYmIHNjcmlwdC5wYXJlbnROb2RlLmluc2VydEJlZm9yZShzdHlsZSwgc2NyaXB0KTtcblxuICAgIC8vICdzdHlsZS5jdXJyZW50U3R5bGUnIGlzIHVzZWQgYnkgSUUgPD0gOCBhbmQgJ3dpbmRvdy5nZXRDb21wdXRlZFN0eWxlJyBmb3IgYWxsIG90aGVyIGJyb3dzZXJzXG4gICAgaW5mbyA9ICgnZ2V0Q29tcHV0ZWRTdHlsZScgaW4gd2luZG93KSAmJiB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShzdHlsZSwgbnVsbCkgfHwgc3R5bGUuY3VycmVudFN0eWxlO1xuXG4gICAgc3R5bGVNZWRpYSA9IHtcbiAgICAgIG1hdGNoTWVkaXVtKG1lZGlhKSB7XG4gICAgICAgIHZhciB0ZXh0ID0gYEBtZWRpYSAke21lZGlhfXsgI21hdGNobWVkaWFqcy10ZXN0IHsgd2lkdGg6IDFweDsgfSB9YDtcblxuICAgICAgICAvLyAnc3R5bGUuc3R5bGVTaGVldCcgaXMgdXNlZCBieSBJRSA8PSA4IGFuZCAnc3R5bGUudGV4dENvbnRlbnQnIGZvciBhbGwgb3RoZXIgYnJvd3NlcnNcbiAgICAgICAgaWYgKHN0eWxlLnN0eWxlU2hlZXQpIHtcbiAgICAgICAgICBzdHlsZS5zdHlsZVNoZWV0LmNzc1RleHQgPSB0ZXh0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0eWxlLnRleHRDb250ZW50ID0gdGV4dDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRlc3QgaWYgbWVkaWEgcXVlcnkgaXMgdHJ1ZSBvciBmYWxzZVxuICAgICAgICByZXR1cm4gaW5mby53aWR0aCA9PT0gJzFweCc7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uKG1lZGlhKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG1hdGNoZXM6IHN0eWxlTWVkaWEubWF0Y2hNZWRpdW0obWVkaWEgfHwgJ2FsbCcpLFxuICAgICAgbWVkaWE6IG1lZGlhIHx8ICdhbGwnXG4gICAgfTtcbiAgfVxufSgpKTtcblxuLy8gVGhhbmsgeW91OiBodHRwczovL2dpdGh1Yi5jb20vc2luZHJlc29yaHVzL3F1ZXJ5LXN0cmluZ1xuZnVuY3Rpb24gcGFyc2VTdHlsZVRvT2JqZWN0KHN0cikge1xuICB2YXIgc3R5bGVPYmplY3QgPSB7fTtcblxuICBpZiAodHlwZW9mIHN0ciAhPT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gc3R5bGVPYmplY3Q7XG4gIH1cblxuICBzdHIgPSBzdHIudHJpbSgpLnNsaWNlKDEsIC0xKTsgLy8gYnJvd3NlcnMgcmUtcXVvdGUgc3RyaW5nIHN0eWxlIHZhbHVlc1xuXG4gIGlmICghc3RyKSB7XG4gICAgcmV0dXJuIHN0eWxlT2JqZWN0O1xuICB9XG5cbiAgc3R5bGVPYmplY3QgPSBzdHIuc3BsaXQoJyYnKS5yZWR1Y2UoZnVuY3Rpb24ocmV0LCBwYXJhbSkge1xuICAgIHZhciBwYXJ0cyA9IHBhcmFtLnJlcGxhY2UoL1xcKy9nLCAnICcpLnNwbGl0KCc9Jyk7XG4gICAgdmFyIGtleSA9IHBhcnRzWzBdO1xuICAgIHZhciB2YWwgPSBwYXJ0c1sxXTtcbiAgICBrZXkgPSBkZWNvZGVVUklDb21wb25lbnQoa2V5KTtcblxuICAgIC8vIG1pc3NpbmcgYD1gIHNob3VsZCBiZSBgbnVsbGA6XG4gICAgLy8gaHR0cDovL3czLm9yZy9UUi8yMDEyL1dELXVybC0yMDEyMDUyNC8jY29sbGVjdC11cmwtcGFyYW1ldGVyc1xuICAgIHZhbCA9IHZhbCA9PT0gdW5kZWZpbmVkID8gbnVsbCA6IGRlY29kZVVSSUNvbXBvbmVudCh2YWwpO1xuXG4gICAgaWYgKCFyZXQuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgcmV0W2tleV0gPSB2YWw7XG4gICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHJldFtrZXldKSkge1xuICAgICAgcmV0W2tleV0ucHVzaCh2YWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXRba2V5XSA9IFtyZXRba2V5XSwgdmFsXTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfSwge30pO1xuXG4gIHJldHVybiBzdHlsZU9iamVjdDtcbn1cblxuRm91bmRhdGlvbi5NZWRpYVF1ZXJ5ID0gTWVkaWFRdWVyeTtcblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG4vKipcbiAqIE1vdGlvbiBtb2R1bGUuXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24ubW90aW9uXG4gKi9cblxuY29uc3QgaW5pdENsYXNzZXMgICA9IFsnbXVpLWVudGVyJywgJ211aS1sZWF2ZSddO1xuY29uc3QgYWN0aXZlQ2xhc3NlcyA9IFsnbXVpLWVudGVyLWFjdGl2ZScsICdtdWktbGVhdmUtYWN0aXZlJ107XG5cbmNvbnN0IE1vdGlvbiA9IHtcbiAgYW5pbWF0ZUluOiBmdW5jdGlvbihlbGVtZW50LCBhbmltYXRpb24sIGNiKSB7XG4gICAgYW5pbWF0ZSh0cnVlLCBlbGVtZW50LCBhbmltYXRpb24sIGNiKTtcbiAgfSxcblxuICBhbmltYXRlT3V0OiBmdW5jdGlvbihlbGVtZW50LCBhbmltYXRpb24sIGNiKSB7XG4gICAgYW5pbWF0ZShmYWxzZSwgZWxlbWVudCwgYW5pbWF0aW9uLCBjYik7XG4gIH1cbn1cblxuZnVuY3Rpb24gTW92ZShkdXJhdGlvbiwgZWxlbSwgZm4pe1xuICB2YXIgYW5pbSwgcHJvZywgc3RhcnQgPSBudWxsO1xuICAvLyBjb25zb2xlLmxvZygnY2FsbGVkJyk7XG5cbiAgZnVuY3Rpb24gbW92ZSh0cyl7XG4gICAgaWYoIXN0YXJ0KSBzdGFydCA9IHdpbmRvdy5wZXJmb3JtYW5jZS5ub3coKTtcbiAgICAvLyBjb25zb2xlLmxvZyhzdGFydCwgdHMpO1xuICAgIHByb2cgPSB0cyAtIHN0YXJ0O1xuICAgIGZuLmFwcGx5KGVsZW0pO1xuXG4gICAgaWYocHJvZyA8IGR1cmF0aW9uKXsgYW5pbSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUobW92ZSwgZWxlbSk7IH1cbiAgICBlbHNle1xuICAgICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKGFuaW0pO1xuICAgICAgZWxlbS50cmlnZ2VyKCdmaW5pc2hlZC56Zi5hbmltYXRlJywgW2VsZW1dKS50cmlnZ2VySGFuZGxlcignZmluaXNoZWQuemYuYW5pbWF0ZScsIFtlbGVtXSk7XG4gICAgfVxuICB9XG4gIGFuaW0gPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKG1vdmUpO1xufVxuXG4vKipcbiAqIEFuaW1hdGVzIGFuIGVsZW1lbnQgaW4gb3Igb3V0IHVzaW5nIGEgQ1NTIHRyYW5zaXRpb24gY2xhc3MuXG4gKiBAZnVuY3Rpb25cbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGlzSW4gLSBEZWZpbmVzIGlmIHRoZSBhbmltYXRpb24gaXMgaW4gb3Igb3V0LlxuICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgLSBqUXVlcnkgb3IgSFRNTCBvYmplY3QgdG8gYW5pbWF0ZS5cbiAqIEBwYXJhbSB7U3RyaW5nfSBhbmltYXRpb24gLSBDU1MgY2xhc3MgdG8gdXNlLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgLSBDYWxsYmFjayB0byBydW4gd2hlbiBhbmltYXRpb24gaXMgZmluaXNoZWQuXG4gKi9cbmZ1bmN0aW9uIGFuaW1hdGUoaXNJbiwgZWxlbWVudCwgYW5pbWF0aW9uLCBjYikge1xuICBlbGVtZW50ID0gJChlbGVtZW50KS5lcSgwKTtcblxuICBpZiAoIWVsZW1lbnQubGVuZ3RoKSByZXR1cm47XG5cbiAgdmFyIGluaXRDbGFzcyA9IGlzSW4gPyBpbml0Q2xhc3Nlc1swXSA6IGluaXRDbGFzc2VzWzFdO1xuICB2YXIgYWN0aXZlQ2xhc3MgPSBpc0luID8gYWN0aXZlQ2xhc3Nlc1swXSA6IGFjdGl2ZUNsYXNzZXNbMV07XG5cbiAgLy8gU2V0IHVwIHRoZSBhbmltYXRpb25cbiAgcmVzZXQoKTtcblxuICBlbGVtZW50XG4gICAgLmFkZENsYXNzKGFuaW1hdGlvbilcbiAgICAuY3NzKCd0cmFuc2l0aW9uJywgJ25vbmUnKTtcblxuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgIGVsZW1lbnQuYWRkQ2xhc3MoaW5pdENsYXNzKTtcbiAgICBpZiAoaXNJbikgZWxlbWVudC5zaG93KCk7XG4gIH0pO1xuXG4gIC8vIFN0YXJ0IHRoZSBhbmltYXRpb25cbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICBlbGVtZW50WzBdLm9mZnNldFdpZHRoO1xuICAgIGVsZW1lbnRcbiAgICAgIC5jc3MoJ3RyYW5zaXRpb24nLCAnJylcbiAgICAgIC5hZGRDbGFzcyhhY3RpdmVDbGFzcyk7XG4gIH0pO1xuXG4gIC8vIENsZWFuIHVwIHRoZSBhbmltYXRpb24gd2hlbiBpdCBmaW5pc2hlc1xuICBlbGVtZW50Lm9uZShGb3VuZGF0aW9uLnRyYW5zaXRpb25lbmQoZWxlbWVudCksIGZpbmlzaCk7XG5cbiAgLy8gSGlkZXMgdGhlIGVsZW1lbnQgKGZvciBvdXQgYW5pbWF0aW9ucyksIHJlc2V0cyB0aGUgZWxlbWVudCwgYW5kIHJ1bnMgYSBjYWxsYmFja1xuICBmdW5jdGlvbiBmaW5pc2goKSB7XG4gICAgaWYgKCFpc0luKSBlbGVtZW50LmhpZGUoKTtcbiAgICByZXNldCgpO1xuICAgIGlmIChjYikgY2IuYXBwbHkoZWxlbWVudCk7XG4gIH1cblxuICAvLyBSZXNldHMgdHJhbnNpdGlvbnMgYW5kIHJlbW92ZXMgbW90aW9uLXNwZWNpZmljIGNsYXNzZXNcbiAgZnVuY3Rpb24gcmVzZXQoKSB7XG4gICAgZWxlbWVudFswXS5zdHlsZS50cmFuc2l0aW9uRHVyYXRpb24gPSAwO1xuICAgIGVsZW1lbnQucmVtb3ZlQ2xhc3MoYCR7aW5pdENsYXNzfSAke2FjdGl2ZUNsYXNzfSAke2FuaW1hdGlvbn1gKTtcbiAgfVxufVxuXG5Gb3VuZGF0aW9uLk1vdmUgPSBNb3ZlO1xuRm91bmRhdGlvbi5Nb3Rpb24gPSBNb3Rpb247XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuY29uc3QgTmVzdCA9IHtcbiAgRmVhdGhlcihtZW51LCB0eXBlID0gJ3pmJykge1xuICAgIG1lbnUuYXR0cigncm9sZScsICdtZW51YmFyJyk7XG5cbiAgICB2YXIgaXRlbXMgPSBtZW51LmZpbmQoJ2xpJykuYXR0cih7J3JvbGUnOiAnbWVudWl0ZW0nfSksXG4gICAgICAgIHN1Yk1lbnVDbGFzcyA9IGBpcy0ke3R5cGV9LXN1Ym1lbnVgLFxuICAgICAgICBzdWJJdGVtQ2xhc3MgPSBgJHtzdWJNZW51Q2xhc3N9LWl0ZW1gLFxuICAgICAgICBoYXNTdWJDbGFzcyA9IGBpcy0ke3R5cGV9LXN1Ym1lbnUtcGFyZW50YDtcblxuICAgIG1lbnUuZmluZCgnYTpmaXJzdCcpLmF0dHIoJ3RhYmluZGV4JywgMCk7XG5cbiAgICBpdGVtcy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgdmFyICRpdGVtID0gJCh0aGlzKSxcbiAgICAgICAgICAkc3ViID0gJGl0ZW0uY2hpbGRyZW4oJ3VsJyk7XG5cbiAgICAgIGlmICgkc3ViLmxlbmd0aCkge1xuICAgICAgICAkaXRlbVxuICAgICAgICAgIC5hZGRDbGFzcyhoYXNTdWJDbGFzcylcbiAgICAgICAgICAuYXR0cih7XG4gICAgICAgICAgICAnYXJpYS1oYXNwb3B1cCc6IHRydWUsXG4gICAgICAgICAgICAnYXJpYS1leHBhbmRlZCc6IGZhbHNlLFxuICAgICAgICAgICAgJ2FyaWEtbGFiZWwnOiAkaXRlbS5jaGlsZHJlbignYTpmaXJzdCcpLnRleHQoKVxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICRzdWJcbiAgICAgICAgICAuYWRkQ2xhc3MoYHN1Ym1lbnUgJHtzdWJNZW51Q2xhc3N9YClcbiAgICAgICAgICAuYXR0cih7XG4gICAgICAgICAgICAnZGF0YS1zdWJtZW51JzogJycsXG4gICAgICAgICAgICAnYXJpYS1oaWRkZW4nOiB0cnVlLFxuICAgICAgICAgICAgJ3JvbGUnOiAnbWVudSdcbiAgICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYgKCRpdGVtLnBhcmVudCgnW2RhdGEtc3VibWVudV0nKS5sZW5ndGgpIHtcbiAgICAgICAgJGl0ZW0uYWRkQ2xhc3MoYGlzLXN1Ym1lbnUtaXRlbSAke3N1Ykl0ZW1DbGFzc31gKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybjtcbiAgfSxcblxuICBCdXJuKG1lbnUsIHR5cGUpIHtcbiAgICB2YXIgaXRlbXMgPSBtZW51LmZpbmQoJ2xpJykucmVtb3ZlQXR0cigndGFiaW5kZXgnKSxcbiAgICAgICAgc3ViTWVudUNsYXNzID0gYGlzLSR7dHlwZX0tc3VibWVudWAsXG4gICAgICAgIHN1Ykl0ZW1DbGFzcyA9IGAke3N1Yk1lbnVDbGFzc30taXRlbWAsXG4gICAgICAgIGhhc1N1YkNsYXNzID0gYGlzLSR7dHlwZX0tc3VibWVudS1wYXJlbnRgO1xuXG4gICAgbWVudVxuICAgICAgLmZpbmQoJz5saSwgLm1lbnUsIC5tZW51ID4gbGknKVxuICAgICAgLnJlbW92ZUNsYXNzKGAke3N1Yk1lbnVDbGFzc30gJHtzdWJJdGVtQ2xhc3N9ICR7aGFzU3ViQ2xhc3N9IGlzLXN1Ym1lbnUtaXRlbSBzdWJtZW51IGlzLWFjdGl2ZWApXG4gICAgICAucmVtb3ZlQXR0cignZGF0YS1zdWJtZW51JykuY3NzKCdkaXNwbGF5JywgJycpO1xuXG4gICAgLy8gY29uc29sZS5sb2coICAgICAgbWVudS5maW5kKCcuJyArIHN1Yk1lbnVDbGFzcyArICcsIC4nICsgc3ViSXRlbUNsYXNzICsgJywgLmhhcy1zdWJtZW51LCAuaXMtc3VibWVudS1pdGVtLCAuc3VibWVudSwgW2RhdGEtc3VibWVudV0nKVxuICAgIC8vICAgICAgICAgICAucmVtb3ZlQ2xhc3Moc3ViTWVudUNsYXNzICsgJyAnICsgc3ViSXRlbUNsYXNzICsgJyBoYXMtc3VibWVudSBpcy1zdWJtZW51LWl0ZW0gc3VibWVudScpXG4gICAgLy8gICAgICAgICAgIC5yZW1vdmVBdHRyKCdkYXRhLXN1Ym1lbnUnKSk7XG4gICAgLy8gaXRlbXMuZWFjaChmdW5jdGlvbigpe1xuICAgIC8vICAgdmFyICRpdGVtID0gJCh0aGlzKSxcbiAgICAvLyAgICAgICAkc3ViID0gJGl0ZW0uY2hpbGRyZW4oJ3VsJyk7XG4gICAgLy8gICBpZigkaXRlbS5wYXJlbnQoJ1tkYXRhLXN1Ym1lbnVdJykubGVuZ3RoKXtcbiAgICAvLyAgICAgJGl0ZW0ucmVtb3ZlQ2xhc3MoJ2lzLXN1Ym1lbnUtaXRlbSAnICsgc3ViSXRlbUNsYXNzKTtcbiAgICAvLyAgIH1cbiAgICAvLyAgIGlmKCRzdWIubGVuZ3RoKXtcbiAgICAvLyAgICAgJGl0ZW0ucmVtb3ZlQ2xhc3MoJ2hhcy1zdWJtZW51Jyk7XG4gICAgLy8gICAgICRzdWIucmVtb3ZlQ2xhc3MoJ3N1Ym1lbnUgJyArIHN1Yk1lbnVDbGFzcykucmVtb3ZlQXR0cignZGF0YS1zdWJtZW51Jyk7XG4gICAgLy8gICB9XG4gICAgLy8gfSk7XG4gIH1cbn1cblxuRm91bmRhdGlvbi5OZXN0ID0gTmVzdDtcblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG5mdW5jdGlvbiBUaW1lcihlbGVtLCBvcHRpb25zLCBjYikge1xuICB2YXIgX3RoaXMgPSB0aGlzLFxuICAgICAgZHVyYXRpb24gPSBvcHRpb25zLmR1cmF0aW9uLC8vb3B0aW9ucyBpcyBhbiBvYmplY3QgZm9yIGVhc2lseSBhZGRpbmcgZmVhdHVyZXMgbGF0ZXIuXG4gICAgICBuYW1lU3BhY2UgPSBPYmplY3Qua2V5cyhlbGVtLmRhdGEoKSlbMF0gfHwgJ3RpbWVyJyxcbiAgICAgIHJlbWFpbiA9IC0xLFxuICAgICAgc3RhcnQsXG4gICAgICB0aW1lcjtcblxuICB0aGlzLmlzUGF1c2VkID0gZmFsc2U7XG5cbiAgdGhpcy5yZXN0YXJ0ID0gZnVuY3Rpb24oKSB7XG4gICAgcmVtYWluID0gLTE7XG4gICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICB0aGlzLnN0YXJ0KCk7XG4gIH1cblxuICB0aGlzLnN0YXJ0ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5pc1BhdXNlZCA9IGZhbHNlO1xuICAgIC8vIGlmKCFlbGVtLmRhdGEoJ3BhdXNlZCcpKXsgcmV0dXJuIGZhbHNlOyB9Ly9tYXliZSBpbXBsZW1lbnQgdGhpcyBzYW5pdHkgY2hlY2sgaWYgdXNlZCBmb3Igb3RoZXIgdGhpbmdzLlxuICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgcmVtYWluID0gcmVtYWluIDw9IDAgPyBkdXJhdGlvbiA6IHJlbWFpbjtcbiAgICBlbGVtLmRhdGEoJ3BhdXNlZCcsIGZhbHNlKTtcbiAgICBzdGFydCA9IERhdGUubm93KCk7XG4gICAgdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICBpZihvcHRpb25zLmluZmluaXRlKXtcbiAgICAgICAgX3RoaXMucmVzdGFydCgpOy8vcmVydW4gdGhlIHRpbWVyLlxuICAgICAgfVxuICAgICAgaWYgKGNiICYmIHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJykgeyBjYigpOyB9XG4gICAgfSwgcmVtYWluKTtcbiAgICBlbGVtLnRyaWdnZXIoYHRpbWVyc3RhcnQuemYuJHtuYW1lU3BhY2V9YCk7XG4gIH1cblxuICB0aGlzLnBhdXNlID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5pc1BhdXNlZCA9IHRydWU7XG4gICAgLy9pZihlbGVtLmRhdGEoJ3BhdXNlZCcpKXsgcmV0dXJuIGZhbHNlOyB9Ly9tYXliZSBpbXBsZW1lbnQgdGhpcyBzYW5pdHkgY2hlY2sgaWYgdXNlZCBmb3Igb3RoZXIgdGhpbmdzLlxuICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgZWxlbS5kYXRhKCdwYXVzZWQnLCB0cnVlKTtcbiAgICB2YXIgZW5kID0gRGF0ZS5ub3coKTtcbiAgICByZW1haW4gPSByZW1haW4gLSAoZW5kIC0gc3RhcnQpO1xuICAgIGVsZW0udHJpZ2dlcihgdGltZXJwYXVzZWQuemYuJHtuYW1lU3BhY2V9YCk7XG4gIH1cbn1cblxuLyoqXG4gKiBSdW5zIGEgY2FsbGJhY2sgZnVuY3Rpb24gd2hlbiBpbWFnZXMgYXJlIGZ1bGx5IGxvYWRlZC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBpbWFnZXMgLSBJbWFnZShzKSB0byBjaGVjayBpZiBsb2FkZWQuXG4gKiBAcGFyYW0ge0Z1bmN9IGNhbGxiYWNrIC0gRnVuY3Rpb24gdG8gZXhlY3V0ZSB3aGVuIGltYWdlIGlzIGZ1bGx5IGxvYWRlZC5cbiAqL1xuZnVuY3Rpb24gb25JbWFnZXNMb2FkZWQoaW1hZ2VzLCBjYWxsYmFjayl7XG4gIHZhciBzZWxmID0gdGhpcyxcbiAgICAgIHVubG9hZGVkID0gaW1hZ2VzLmxlbmd0aDtcblxuICBpZiAodW5sb2FkZWQgPT09IDApIHtcbiAgICBjYWxsYmFjaygpO1xuICB9XG5cbiAgaW1hZ2VzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuY29tcGxldGUpIHtcbiAgICAgIHNpbmdsZUltYWdlTG9hZGVkKCk7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiB0aGlzLm5hdHVyYWxXaWR0aCAhPT0gJ3VuZGVmaW5lZCcgJiYgdGhpcy5uYXR1cmFsV2lkdGggPiAwKSB7XG4gICAgICBzaW5nbGVJbWFnZUxvYWRlZCgpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICQodGhpcykub25lKCdsb2FkJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHNpbmdsZUltYWdlTG9hZGVkKCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIHNpbmdsZUltYWdlTG9hZGVkKCkge1xuICAgIHVubG9hZGVkLS07XG4gICAgaWYgKHVubG9hZGVkID09PSAwKSB7XG4gICAgICBjYWxsYmFjaygpO1xuICAgIH1cbiAgfVxufVxuXG5Gb3VuZGF0aW9uLlRpbWVyID0gVGltZXI7XG5Gb3VuZGF0aW9uLm9uSW1hZ2VzTG9hZGVkID0gb25JbWFnZXNMb2FkZWQ7XG5cbn0oalF1ZXJ5KTtcbiIsIi8vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbi8vKipXb3JrIGluc3BpcmVkIGJ5IG11bHRpcGxlIGpxdWVyeSBzd2lwZSBwbHVnaW5zKipcbi8vKipEb25lIGJ5IFlvaGFpIEFyYXJhdCAqKioqKioqKioqKioqKioqKioqKioqKioqKipcbi8vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbihmdW5jdGlvbigkKSB7XG5cbiAgJC5zcG90U3dpcGUgPSB7XG4gICAgdmVyc2lvbjogJzEuMC4wJyxcbiAgICBlbmFibGVkOiAnb250b3VjaHN0YXJ0JyBpbiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsXG4gICAgcHJldmVudERlZmF1bHQ6IGZhbHNlLFxuICAgIG1vdmVUaHJlc2hvbGQ6IDc1LFxuICAgIHRpbWVUaHJlc2hvbGQ6IDIwMFxuICB9O1xuXG4gIHZhciAgIHN0YXJ0UG9zWCxcbiAgICAgICAgc3RhcnRQb3NZLFxuICAgICAgICBzdGFydFRpbWUsXG4gICAgICAgIGVsYXBzZWRUaW1lLFxuICAgICAgICBpc01vdmluZyA9IGZhbHNlO1xuXG4gIGZ1bmN0aW9uIG9uVG91Y2hFbmQoKSB7XG4gICAgLy8gIGFsZXJ0KHRoaXMpO1xuICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgb25Ub3VjaE1vdmUpO1xuICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCBvblRvdWNoRW5kKTtcbiAgICBpc01vdmluZyA9IGZhbHNlO1xuICB9XG5cbiAgZnVuY3Rpb24gb25Ub3VjaE1vdmUoZSkge1xuICAgIGlmICgkLnNwb3RTd2lwZS5wcmV2ZW50RGVmYXVsdCkgeyBlLnByZXZlbnREZWZhdWx0KCk7IH1cbiAgICBpZihpc01vdmluZykge1xuICAgICAgdmFyIHggPSBlLnRvdWNoZXNbMF0ucGFnZVg7XG4gICAgICB2YXIgeSA9IGUudG91Y2hlc1swXS5wYWdlWTtcbiAgICAgIHZhciBkeCA9IHN0YXJ0UG9zWCAtIHg7XG4gICAgICB2YXIgZHkgPSBzdGFydFBvc1kgLSB5O1xuICAgICAgdmFyIGRpcjtcbiAgICAgIGVsYXBzZWRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCkgLSBzdGFydFRpbWU7XG4gICAgICBpZihNYXRoLmFicyhkeCkgPj0gJC5zcG90U3dpcGUubW92ZVRocmVzaG9sZCAmJiBlbGFwc2VkVGltZSA8PSAkLnNwb3RTd2lwZS50aW1lVGhyZXNob2xkKSB7XG4gICAgICAgIGRpciA9IGR4ID4gMCA/ICdsZWZ0JyA6ICdyaWdodCc7XG4gICAgICB9XG4gICAgICAvLyBlbHNlIGlmKE1hdGguYWJzKGR5KSA+PSAkLnNwb3RTd2lwZS5tb3ZlVGhyZXNob2xkICYmIGVsYXBzZWRUaW1lIDw9ICQuc3BvdFN3aXBlLnRpbWVUaHJlc2hvbGQpIHtcbiAgICAgIC8vICAgZGlyID0gZHkgPiAwID8gJ2Rvd24nIDogJ3VwJztcbiAgICAgIC8vIH1cbiAgICAgIGlmKGRpcikge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIG9uVG91Y2hFbmQuY2FsbCh0aGlzKTtcbiAgICAgICAgJCh0aGlzKS50cmlnZ2VyKCdzd2lwZScsIGRpcikudHJpZ2dlcihgc3dpcGUke2Rpcn1gKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBvblRvdWNoU3RhcnQoZSkge1xuICAgIGlmIChlLnRvdWNoZXMubGVuZ3RoID09IDEpIHtcbiAgICAgIHN0YXJ0UG9zWCA9IGUudG91Y2hlc1swXS5wYWdlWDtcbiAgICAgIHN0YXJ0UG9zWSA9IGUudG91Y2hlc1swXS5wYWdlWTtcbiAgICAgIGlzTW92aW5nID0gdHJ1ZTtcbiAgICAgIHN0YXJ0VGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCBvblRvdWNoTW92ZSwgZmFsc2UpO1xuICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIG9uVG91Y2hFbmQsIGZhbHNlKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBpbml0KCkge1xuICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lciAmJiB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBvblRvdWNoU3RhcnQsIGZhbHNlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRlYXJkb3duKCkge1xuICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIG9uVG91Y2hTdGFydCk7XG4gIH1cblxuICAkLmV2ZW50LnNwZWNpYWwuc3dpcGUgPSB7IHNldHVwOiBpbml0IH07XG5cbiAgJC5lYWNoKFsnbGVmdCcsICd1cCcsICdkb3duJywgJ3JpZ2h0J10sIGZ1bmN0aW9uICgpIHtcbiAgICAkLmV2ZW50LnNwZWNpYWxbYHN3aXBlJHt0aGlzfWBdID0geyBzZXR1cDogZnVuY3Rpb24oKXtcbiAgICAgICQodGhpcykub24oJ3N3aXBlJywgJC5ub29wKTtcbiAgICB9IH07XG4gIH0pO1xufSkoalF1ZXJ5KTtcbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiBNZXRob2QgZm9yIGFkZGluZyBwc3VlZG8gZHJhZyBldmVudHMgdG8gZWxlbWVudHMgKlxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbiFmdW5jdGlvbigkKXtcbiAgJC5mbi5hZGRUb3VjaCA9IGZ1bmN0aW9uKCl7XG4gICAgdGhpcy5lYWNoKGZ1bmN0aW9uKGksZWwpe1xuICAgICAgJChlbCkuYmluZCgndG91Y2hzdGFydCB0b3VjaG1vdmUgdG91Y2hlbmQgdG91Y2hjYW5jZWwnLGZ1bmN0aW9uKCl7XG4gICAgICAgIC8vd2UgcGFzcyB0aGUgb3JpZ2luYWwgZXZlbnQgb2JqZWN0IGJlY2F1c2UgdGhlIGpRdWVyeSBldmVudFxuICAgICAgICAvL29iamVjdCBpcyBub3JtYWxpemVkIHRvIHczYyBzcGVjcyBhbmQgZG9lcyBub3QgcHJvdmlkZSB0aGUgVG91Y2hMaXN0XG4gICAgICAgIGhhbmRsZVRvdWNoKGV2ZW50KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgdmFyIGhhbmRsZVRvdWNoID0gZnVuY3Rpb24oZXZlbnQpe1xuICAgICAgdmFyIHRvdWNoZXMgPSBldmVudC5jaGFuZ2VkVG91Y2hlcyxcbiAgICAgICAgICBmaXJzdCA9IHRvdWNoZXNbMF0sXG4gICAgICAgICAgZXZlbnRUeXBlcyA9IHtcbiAgICAgICAgICAgIHRvdWNoc3RhcnQ6ICdtb3VzZWRvd24nLFxuICAgICAgICAgICAgdG91Y2htb3ZlOiAnbW91c2Vtb3ZlJyxcbiAgICAgICAgICAgIHRvdWNoZW5kOiAnbW91c2V1cCdcbiAgICAgICAgICB9LFxuICAgICAgICAgIHR5cGUgPSBldmVudFR5cGVzW2V2ZW50LnR5cGVdLFxuICAgICAgICAgIHNpbXVsYXRlZEV2ZW50XG4gICAgICAgIDtcblxuICAgICAgaWYoJ01vdXNlRXZlbnQnIGluIHdpbmRvdyAmJiB0eXBlb2Ygd2luZG93Lk1vdXNlRXZlbnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgc2ltdWxhdGVkRXZlbnQgPSBuZXcgd2luZG93Lk1vdXNlRXZlbnQodHlwZSwge1xuICAgICAgICAgICdidWJibGVzJzogdHJ1ZSxcbiAgICAgICAgICAnY2FuY2VsYWJsZSc6IHRydWUsXG4gICAgICAgICAgJ3NjcmVlblgnOiBmaXJzdC5zY3JlZW5YLFxuICAgICAgICAgICdzY3JlZW5ZJzogZmlyc3Quc2NyZWVuWSxcbiAgICAgICAgICAnY2xpZW50WCc6IGZpcnN0LmNsaWVudFgsXG4gICAgICAgICAgJ2NsaWVudFknOiBmaXJzdC5jbGllbnRZXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2ltdWxhdGVkRXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnTW91c2VFdmVudCcpO1xuICAgICAgICBzaW11bGF0ZWRFdmVudC5pbml0TW91c2VFdmVudCh0eXBlLCB0cnVlLCB0cnVlLCB3aW5kb3csIDEsIGZpcnN0LnNjcmVlblgsIGZpcnN0LnNjcmVlblksIGZpcnN0LmNsaWVudFgsIGZpcnN0LmNsaWVudFksIGZhbHNlLCBmYWxzZSwgZmFsc2UsIGZhbHNlLCAwLypsZWZ0Ki8sIG51bGwpO1xuICAgICAgfVxuICAgICAgZmlyc3QudGFyZ2V0LmRpc3BhdGNoRXZlbnQoc2ltdWxhdGVkRXZlbnQpO1xuICAgIH07XG4gIH07XG59KGpRdWVyeSk7XG5cblxuLy8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4vLyoqRnJvbSB0aGUgalF1ZXJ5IE1vYmlsZSBMaWJyYXJ5Kipcbi8vKipuZWVkIHRvIHJlY3JlYXRlIGZ1bmN0aW9uYWxpdHkqKlxuLy8qKmFuZCB0cnkgdG8gaW1wcm92ZSBpZiBwb3NzaWJsZSoqXG4vLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcblxuLyogUmVtb3ZpbmcgdGhlIGpRdWVyeSBmdW5jdGlvbiAqKioqXG4qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcblxuKGZ1bmN0aW9uKCAkLCB3aW5kb3csIHVuZGVmaW5lZCApIHtcblxuXHR2YXIgJGRvY3VtZW50ID0gJCggZG9jdW1lbnQgKSxcblx0XHQvLyBzdXBwb3J0VG91Y2ggPSAkLm1vYmlsZS5zdXBwb3J0LnRvdWNoLFxuXHRcdHRvdWNoU3RhcnRFdmVudCA9ICd0b3VjaHN0YXJ0Jy8vc3VwcG9ydFRvdWNoID8gXCJ0b3VjaHN0YXJ0XCIgOiBcIm1vdXNlZG93blwiLFxuXHRcdHRvdWNoU3RvcEV2ZW50ID0gJ3RvdWNoZW5kJy8vc3VwcG9ydFRvdWNoID8gXCJ0b3VjaGVuZFwiIDogXCJtb3VzZXVwXCIsXG5cdFx0dG91Y2hNb3ZlRXZlbnQgPSAndG91Y2htb3ZlJy8vc3VwcG9ydFRvdWNoID8gXCJ0b3VjaG1vdmVcIiA6IFwibW91c2Vtb3ZlXCI7XG5cblx0Ly8gc2V0dXAgbmV3IGV2ZW50IHNob3J0Y3V0c1xuXHQkLmVhY2goICggXCJ0b3VjaHN0YXJ0IHRvdWNobW92ZSB0b3VjaGVuZCBcIiArXG5cdFx0XCJzd2lwZSBzd2lwZWxlZnQgc3dpcGVyaWdodFwiICkuc3BsaXQoIFwiIFwiICksIGZ1bmN0aW9uKCBpLCBuYW1lICkge1xuXG5cdFx0JC5mblsgbmFtZSBdID0gZnVuY3Rpb24oIGZuICkge1xuXHRcdFx0cmV0dXJuIGZuID8gdGhpcy5iaW5kKCBuYW1lLCBmbiApIDogdGhpcy50cmlnZ2VyKCBuYW1lICk7XG5cdFx0fTtcblxuXHRcdC8vIGpRdWVyeSA8IDEuOFxuXHRcdGlmICggJC5hdHRyRm4gKSB7XG5cdFx0XHQkLmF0dHJGblsgbmFtZSBdID0gdHJ1ZTtcblx0XHR9XG5cdH0pO1xuXG5cdGZ1bmN0aW9uIHRyaWdnZXJDdXN0b21FdmVudCggb2JqLCBldmVudFR5cGUsIGV2ZW50LCBidWJibGUgKSB7XG5cdFx0dmFyIG9yaWdpbmFsVHlwZSA9IGV2ZW50LnR5cGU7XG5cdFx0ZXZlbnQudHlwZSA9IGV2ZW50VHlwZTtcblx0XHRpZiAoIGJ1YmJsZSApIHtcblx0XHRcdCQuZXZlbnQudHJpZ2dlciggZXZlbnQsIHVuZGVmaW5lZCwgb2JqICk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdCQuZXZlbnQuZGlzcGF0Y2guY2FsbCggb2JqLCBldmVudCApO1xuXHRcdH1cblx0XHRldmVudC50eXBlID0gb3JpZ2luYWxUeXBlO1xuXHR9XG5cblx0Ly8gYWxzbyBoYW5kbGVzIHRhcGhvbGRcblxuXHQvLyBBbHNvIGhhbmRsZXMgc3dpcGVsZWZ0LCBzd2lwZXJpZ2h0XG5cdCQuZXZlbnQuc3BlY2lhbC5zd2lwZSA9IHtcblxuXHRcdC8vIE1vcmUgdGhhbiB0aGlzIGhvcml6b250YWwgZGlzcGxhY2VtZW50LCBhbmQgd2Ugd2lsbCBzdXBwcmVzcyBzY3JvbGxpbmcuXG5cdFx0c2Nyb2xsU3VwcmVzc2lvblRocmVzaG9sZDogMzAsXG5cblx0XHQvLyBNb3JlIHRpbWUgdGhhbiB0aGlzLCBhbmQgaXQgaXNuJ3QgYSBzd2lwZS5cblx0XHRkdXJhdGlvblRocmVzaG9sZDogMTAwMCxcblxuXHRcdC8vIFN3aXBlIGhvcml6b250YWwgZGlzcGxhY2VtZW50IG11c3QgYmUgbW9yZSB0aGFuIHRoaXMuXG5cdFx0aG9yaXpvbnRhbERpc3RhbmNlVGhyZXNob2xkOiB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyA+PSAyID8gMTUgOiAzMCxcblxuXHRcdC8vIFN3aXBlIHZlcnRpY2FsIGRpc3BsYWNlbWVudCBtdXN0IGJlIGxlc3MgdGhhbiB0aGlzLlxuXHRcdHZlcnRpY2FsRGlzdGFuY2VUaHJlc2hvbGQ6IHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvID49IDIgPyAxNSA6IDMwLFxuXG5cdFx0Z2V0TG9jYXRpb246IGZ1bmN0aW9uICggZXZlbnQgKSB7XG5cdFx0XHR2YXIgd2luUGFnZVggPSB3aW5kb3cucGFnZVhPZmZzZXQsXG5cdFx0XHRcdHdpblBhZ2VZID0gd2luZG93LnBhZ2VZT2Zmc2V0LFxuXHRcdFx0XHR4ID0gZXZlbnQuY2xpZW50WCxcblx0XHRcdFx0eSA9IGV2ZW50LmNsaWVudFk7XG5cblx0XHRcdGlmICggZXZlbnQucGFnZVkgPT09IDAgJiYgTWF0aC5mbG9vciggeSApID4gTWF0aC5mbG9vciggZXZlbnQucGFnZVkgKSB8fFxuXHRcdFx0XHRldmVudC5wYWdlWCA9PT0gMCAmJiBNYXRoLmZsb29yKCB4ICkgPiBNYXRoLmZsb29yKCBldmVudC5wYWdlWCApICkge1xuXG5cdFx0XHRcdC8vIGlPUzQgY2xpZW50WC9jbGllbnRZIGhhdmUgdGhlIHZhbHVlIHRoYXQgc2hvdWxkIGhhdmUgYmVlblxuXHRcdFx0XHQvLyBpbiBwYWdlWC9wYWdlWS4gV2hpbGUgcGFnZVgvcGFnZS8gaGF2ZSB0aGUgdmFsdWUgMFxuXHRcdFx0XHR4ID0geCAtIHdpblBhZ2VYO1xuXHRcdFx0XHR5ID0geSAtIHdpblBhZ2VZO1xuXHRcdFx0fSBlbHNlIGlmICggeSA8ICggZXZlbnQucGFnZVkgLSB3aW5QYWdlWSkgfHwgeCA8ICggZXZlbnQucGFnZVggLSB3aW5QYWdlWCApICkge1xuXG5cdFx0XHRcdC8vIFNvbWUgQW5kcm9pZCBicm93c2VycyBoYXZlIHRvdGFsbHkgYm9ndXMgdmFsdWVzIGZvciBjbGllbnRYL1lcblx0XHRcdFx0Ly8gd2hlbiBzY3JvbGxpbmcvem9vbWluZyBhIHBhZ2UuIERldGVjdGFibGUgc2luY2UgY2xpZW50WC9jbGllbnRZXG5cdFx0XHRcdC8vIHNob3VsZCBuZXZlciBiZSBzbWFsbGVyIHRoYW4gcGFnZVgvcGFnZVkgbWludXMgcGFnZSBzY3JvbGxcblx0XHRcdFx0eCA9IGV2ZW50LnBhZ2VYIC0gd2luUGFnZVg7XG5cdFx0XHRcdHkgPSBldmVudC5wYWdlWSAtIHdpblBhZ2VZO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR4OiB4LFxuXHRcdFx0XHR5OiB5XG5cdFx0XHR9O1xuXHRcdH0sXG5cblx0XHRzdGFydDogZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdFx0dmFyIGRhdGEgPSBldmVudC5vcmlnaW5hbEV2ZW50LnRvdWNoZXMgP1xuXHRcdFx0XHRcdGV2ZW50Lm9yaWdpbmFsRXZlbnQudG91Y2hlc1sgMCBdIDogZXZlbnQsXG5cdFx0XHRcdGxvY2F0aW9uID0gJC5ldmVudC5zcGVjaWFsLnN3aXBlLmdldExvY2F0aW9uKCBkYXRhICk7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0dGltZTogKCBuZXcgRGF0ZSgpICkuZ2V0VGltZSgpLFxuXHRcdFx0XHRcdFx0Y29vcmRzOiBbIGxvY2F0aW9uLngsIGxvY2F0aW9uLnkgXSxcblx0XHRcdFx0XHRcdG9yaWdpbjogJCggZXZlbnQudGFyZ2V0IClcblx0XHRcdFx0XHR9O1xuXHRcdH0sXG5cblx0XHRzdG9wOiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0XHR2YXIgZGF0YSA9IGV2ZW50Lm9yaWdpbmFsRXZlbnQudG91Y2hlcyA/XG5cdFx0XHRcdFx0ZXZlbnQub3JpZ2luYWxFdmVudC50b3VjaGVzWyAwIF0gOiBldmVudCxcblx0XHRcdFx0bG9jYXRpb24gPSAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZ2V0TG9jYXRpb24oIGRhdGEgKTtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHR0aW1lOiAoIG5ldyBEYXRlKCkgKS5nZXRUaW1lKCksXG5cdFx0XHRcdFx0XHRjb29yZHM6IFsgbG9jYXRpb24ueCwgbG9jYXRpb24ueSBdXG5cdFx0XHRcdFx0fTtcblx0XHR9LFxuXG5cdFx0aGFuZGxlU3dpcGU6IGZ1bmN0aW9uKCBzdGFydCwgc3RvcCwgdGhpc09iamVjdCwgb3JpZ1RhcmdldCApIHtcblx0XHRcdGlmICggc3RvcC50aW1lIC0gc3RhcnQudGltZSA8ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5kdXJhdGlvblRocmVzaG9sZCAmJlxuXHRcdFx0XHRNYXRoLmFicyggc3RhcnQuY29vcmRzWyAwIF0gLSBzdG9wLmNvb3Jkc1sgMCBdICkgPiAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuaG9yaXpvbnRhbERpc3RhbmNlVGhyZXNob2xkICYmXG5cdFx0XHRcdE1hdGguYWJzKCBzdGFydC5jb29yZHNbIDEgXSAtIHN0b3AuY29vcmRzWyAxIF0gKSA8ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS52ZXJ0aWNhbERpc3RhbmNlVGhyZXNob2xkICkge1xuXHRcdFx0XHR2YXIgZGlyZWN0aW9uID0gc3RhcnQuY29vcmRzWzBdID4gc3RvcC5jb29yZHNbIDAgXSA/IFwic3dpcGVsZWZ0XCIgOiBcInN3aXBlcmlnaHRcIjtcblxuXHRcdFx0XHR0cmlnZ2VyQ3VzdG9tRXZlbnQoIHRoaXNPYmplY3QsIFwic3dpcGVcIiwgJC5FdmVudCggXCJzd2lwZVwiLCB7IHRhcmdldDogb3JpZ1RhcmdldCwgc3dpcGVzdGFydDogc3RhcnQsIHN3aXBlc3RvcDogc3RvcCB9KSwgdHJ1ZSApO1xuXHRcdFx0XHR0cmlnZ2VyQ3VzdG9tRXZlbnQoIHRoaXNPYmplY3QsIGRpcmVjdGlvbiwkLkV2ZW50KCBkaXJlY3Rpb24sIHsgdGFyZ2V0OiBvcmlnVGFyZ2V0LCBzd2lwZXN0YXJ0OiBzdGFydCwgc3dpcGVzdG9wOiBzdG9wIH0gKSwgdHJ1ZSApO1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBmYWxzZTtcblxuXHRcdH0sXG5cblx0XHQvLyBUaGlzIHNlcnZlcyBhcyBhIGZsYWcgdG8gZW5zdXJlIHRoYXQgYXQgbW9zdCBvbmUgc3dpcGUgZXZlbnQgZXZlbnQgaXNcblx0XHQvLyBpbiB3b3JrIGF0IGFueSBnaXZlbiB0aW1lXG5cdFx0ZXZlbnRJblByb2dyZXNzOiBmYWxzZSxcblxuXHRcdHNldHVwOiBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBldmVudHMsXG5cdFx0XHRcdHRoaXNPYmplY3QgPSB0aGlzLFxuXHRcdFx0XHQkdGhpcyA9ICQoIHRoaXNPYmplY3QgKSxcblx0XHRcdFx0Y29udGV4dCA9IHt9O1xuXG5cdFx0XHQvLyBSZXRyaWV2ZSB0aGUgZXZlbnRzIGRhdGEgZm9yIHRoaXMgZWxlbWVudCBhbmQgYWRkIHRoZSBzd2lwZSBjb250ZXh0XG5cdFx0XHRldmVudHMgPSAkLmRhdGEoIHRoaXMsIFwibW9iaWxlLWV2ZW50c1wiICk7XG5cdFx0XHRpZiAoICFldmVudHMgKSB7XG5cdFx0XHRcdGV2ZW50cyA9IHsgbGVuZ3RoOiAwIH07XG5cdFx0XHRcdCQuZGF0YSggdGhpcywgXCJtb2JpbGUtZXZlbnRzXCIsIGV2ZW50cyApO1xuXHRcdFx0fVxuXHRcdFx0ZXZlbnRzLmxlbmd0aCsrO1xuXHRcdFx0ZXZlbnRzLnN3aXBlID0gY29udGV4dDtcblxuXHRcdFx0Y29udGV4dC5zdGFydCA9IGZ1bmN0aW9uKCBldmVudCApIHtcblxuXHRcdFx0XHQvLyBCYWlsIGlmIHdlJ3JlIGFscmVhZHkgd29ya2luZyBvbiBhIHN3aXBlIGV2ZW50XG5cdFx0XHRcdGlmICggJC5ldmVudC5zcGVjaWFsLnN3aXBlLmV2ZW50SW5Qcm9ncmVzcyApIHtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblx0XHRcdFx0JC5ldmVudC5zcGVjaWFsLnN3aXBlLmV2ZW50SW5Qcm9ncmVzcyA9IHRydWU7XG5cblx0XHRcdFx0dmFyIHN0b3AsXG5cdFx0XHRcdFx0c3RhcnQgPSAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuc3RhcnQoIGV2ZW50ICksXG5cdFx0XHRcdFx0b3JpZ1RhcmdldCA9IGV2ZW50LnRhcmdldCxcblx0XHRcdFx0XHRlbWl0dGVkID0gZmFsc2U7XG5cblx0XHRcdFx0Y29udGV4dC5tb3ZlID0gZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdFx0XHRcdGlmICggIXN0YXJ0IHx8IGV2ZW50LmlzRGVmYXVsdFByZXZlbnRlZCgpICkge1xuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHN0b3AgPSAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuc3RvcCggZXZlbnQgKTtcblx0XHRcdFx0XHRpZiAoICFlbWl0dGVkICkge1xuXHRcdFx0XHRcdFx0ZW1pdHRlZCA9ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5oYW5kbGVTd2lwZSggc3RhcnQsIHN0b3AsIHRoaXNPYmplY3QsIG9yaWdUYXJnZXQgKTtcblx0XHRcdFx0XHRcdGlmICggZW1pdHRlZCApIHtcblxuXHRcdFx0XHRcdFx0XHQvLyBSZXNldCB0aGUgY29udGV4dCB0byBtYWtlIHdheSBmb3IgdGhlIG5leHQgc3dpcGUgZXZlbnRcblx0XHRcdFx0XHRcdFx0JC5ldmVudC5zcGVjaWFsLnN3aXBlLmV2ZW50SW5Qcm9ncmVzcyA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHQvLyBwcmV2ZW50IHNjcm9sbGluZ1xuXHRcdFx0XHRcdGlmICggTWF0aC5hYnMoIHN0YXJ0LmNvb3Jkc1sgMCBdIC0gc3RvcC5jb29yZHNbIDAgXSApID4gJC5ldmVudC5zcGVjaWFsLnN3aXBlLnNjcm9sbFN1cHJlc3Npb25UaHJlc2hvbGQgKSB7XG5cdFx0XHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fTtcblxuXHRcdFx0XHRjb250ZXh0LnN0b3AgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdGVtaXR0ZWQgPSB0cnVlO1xuXG5cdFx0XHRcdFx0XHQvLyBSZXNldCB0aGUgY29udGV4dCB0byBtYWtlIHdheSBmb3IgdGhlIG5leHQgc3dpcGUgZXZlbnRcblx0XHRcdFx0XHRcdCQuZXZlbnQuc3BlY2lhbC5zd2lwZS5ldmVudEluUHJvZ3Jlc3MgPSBmYWxzZTtcblx0XHRcdFx0XHRcdCRkb2N1bWVudC5vZmYoIHRvdWNoTW92ZUV2ZW50LCBjb250ZXh0Lm1vdmUgKTtcblx0XHRcdFx0XHRcdGNvbnRleHQubW92ZSA9IG51bGw7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0JGRvY3VtZW50Lm9uKCB0b3VjaE1vdmVFdmVudCwgY29udGV4dC5tb3ZlIClcblx0XHRcdFx0XHQub25lKCB0b3VjaFN0b3BFdmVudCwgY29udGV4dC5zdG9wICk7XG5cdFx0XHR9O1xuXHRcdFx0JHRoaXMub24oIHRvdWNoU3RhcnRFdmVudCwgY29udGV4dC5zdGFydCApO1xuXHRcdH0sXG5cblx0XHR0ZWFyZG93bjogZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgZXZlbnRzLCBjb250ZXh0O1xuXG5cdFx0XHRldmVudHMgPSAkLmRhdGEoIHRoaXMsIFwibW9iaWxlLWV2ZW50c1wiICk7XG5cdFx0XHRpZiAoIGV2ZW50cyApIHtcblx0XHRcdFx0Y29udGV4dCA9IGV2ZW50cy5zd2lwZTtcblx0XHRcdFx0ZGVsZXRlIGV2ZW50cy5zd2lwZTtcblx0XHRcdFx0ZXZlbnRzLmxlbmd0aC0tO1xuXHRcdFx0XHRpZiAoIGV2ZW50cy5sZW5ndGggPT09IDAgKSB7XG5cdFx0XHRcdFx0JC5yZW1vdmVEYXRhKCB0aGlzLCBcIm1vYmlsZS1ldmVudHNcIiApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmICggY29udGV4dCApIHtcblx0XHRcdFx0aWYgKCBjb250ZXh0LnN0YXJ0ICkge1xuXHRcdFx0XHRcdCQoIHRoaXMgKS5vZmYoIHRvdWNoU3RhcnRFdmVudCwgY29udGV4dC5zdGFydCApO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICggY29udGV4dC5tb3ZlICkge1xuXHRcdFx0XHRcdCRkb2N1bWVudC5vZmYoIHRvdWNoTW92ZUV2ZW50LCBjb250ZXh0Lm1vdmUgKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoIGNvbnRleHQuc3RvcCApIHtcblx0XHRcdFx0XHQkZG9jdW1lbnQub2ZmKCB0b3VjaFN0b3BFdmVudCwgY29udGV4dC5zdG9wICk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH07XG5cdCQuZWFjaCh7XG5cdFx0c3dpcGVsZWZ0OiBcInN3aXBlLmxlZnRcIixcblx0XHRzd2lwZXJpZ2h0OiBcInN3aXBlLnJpZ2h0XCJcblx0fSwgZnVuY3Rpb24oIGV2ZW50LCBzb3VyY2VFdmVudCApIHtcblxuXHRcdCQuZXZlbnQuc3BlY2lhbFsgZXZlbnQgXSA9IHtcblx0XHRcdHNldHVwOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0JCggdGhpcyApLmJpbmQoIHNvdXJjZUV2ZW50LCAkLm5vb3AgKTtcblx0XHRcdH0sXG5cdFx0XHR0ZWFyZG93bjogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdCQoIHRoaXMgKS51bmJpbmQoIHNvdXJjZUV2ZW50ICk7XG5cdFx0XHR9XG5cdFx0fTtcblx0fSk7XG59KSggalF1ZXJ5LCB0aGlzICk7XG4qL1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG5jb25zdCBNdXRhdGlvbk9ic2VydmVyID0gKGZ1bmN0aW9uICgpIHtcbiAgdmFyIHByZWZpeGVzID0gWydXZWJLaXQnLCAnTW96JywgJ08nLCAnTXMnLCAnJ107XG4gIGZvciAodmFyIGk9MDsgaSA8IHByZWZpeGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGAke3ByZWZpeGVzW2ldfU11dGF0aW9uT2JzZXJ2ZXJgIGluIHdpbmRvdykge1xuICAgICAgcmV0dXJuIHdpbmRvd1tgJHtwcmVmaXhlc1tpXX1NdXRhdGlvbk9ic2VydmVyYF07XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn0oKSk7XG5cbmNvbnN0IHRyaWdnZXJzID0gKGVsLCB0eXBlKSA9PiB7XG4gIGVsLmRhdGEodHlwZSkuc3BsaXQoJyAnKS5mb3JFYWNoKGlkID0+IHtcbiAgICAkKGAjJHtpZH1gKVsgdHlwZSA9PT0gJ2Nsb3NlJyA/ICd0cmlnZ2VyJyA6ICd0cmlnZ2VySGFuZGxlciddKGAke3R5cGV9LnpmLnRyaWdnZXJgLCBbZWxdKTtcbiAgfSk7XG59O1xuLy8gRWxlbWVudHMgd2l0aCBbZGF0YS1vcGVuXSB3aWxsIHJldmVhbCBhIHBsdWdpbiB0aGF0IHN1cHBvcnRzIGl0IHdoZW4gY2xpY2tlZC5cbiQoZG9jdW1lbnQpLm9uKCdjbGljay56Zi50cmlnZ2VyJywgJ1tkYXRhLW9wZW5dJywgZnVuY3Rpb24oKSB7XG4gIHRyaWdnZXJzKCQodGhpcyksICdvcGVuJyk7XG59KTtcblxuLy8gRWxlbWVudHMgd2l0aCBbZGF0YS1jbG9zZV0gd2lsbCBjbG9zZSBhIHBsdWdpbiB0aGF0IHN1cHBvcnRzIGl0IHdoZW4gY2xpY2tlZC5cbi8vIElmIHVzZWQgd2l0aG91dCBhIHZhbHVlIG9uIFtkYXRhLWNsb3NlXSwgdGhlIGV2ZW50IHdpbGwgYnViYmxlLCBhbGxvd2luZyBpdCB0byBjbG9zZSBhIHBhcmVudCBjb21wb25lbnQuXG4kKGRvY3VtZW50KS5vbignY2xpY2suemYudHJpZ2dlcicsICdbZGF0YS1jbG9zZV0nLCBmdW5jdGlvbigpIHtcbiAgbGV0IGlkID0gJCh0aGlzKS5kYXRhKCdjbG9zZScpO1xuICBpZiAoaWQpIHtcbiAgICB0cmlnZ2VycygkKHRoaXMpLCAnY2xvc2UnKTtcbiAgfVxuICBlbHNlIHtcbiAgICAkKHRoaXMpLnRyaWdnZXIoJ2Nsb3NlLnpmLnRyaWdnZXInKTtcbiAgfVxufSk7XG5cbi8vIEVsZW1lbnRzIHdpdGggW2RhdGEtdG9nZ2xlXSB3aWxsIHRvZ2dsZSBhIHBsdWdpbiB0aGF0IHN1cHBvcnRzIGl0IHdoZW4gY2xpY2tlZC5cbiQoZG9jdW1lbnQpLm9uKCdjbGljay56Zi50cmlnZ2VyJywgJ1tkYXRhLXRvZ2dsZV0nLCBmdW5jdGlvbigpIHtcbiAgdHJpZ2dlcnMoJCh0aGlzKSwgJ3RvZ2dsZScpO1xufSk7XG5cbi8vIEVsZW1lbnRzIHdpdGggW2RhdGEtY2xvc2FibGVdIHdpbGwgcmVzcG9uZCB0byBjbG9zZS56Zi50cmlnZ2VyIGV2ZW50cy5cbiQoZG9jdW1lbnQpLm9uKCdjbG9zZS56Zi50cmlnZ2VyJywgJ1tkYXRhLWNsb3NhYmxlXScsIGZ1bmN0aW9uKGUpe1xuICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICBsZXQgYW5pbWF0aW9uID0gJCh0aGlzKS5kYXRhKCdjbG9zYWJsZScpO1xuXG4gIGlmKGFuaW1hdGlvbiAhPT0gJycpe1xuICAgIEZvdW5kYXRpb24uTW90aW9uLmFuaW1hdGVPdXQoJCh0aGlzKSwgYW5pbWF0aW9uLCBmdW5jdGlvbigpIHtcbiAgICAgICQodGhpcykudHJpZ2dlcignY2xvc2VkLnpmJyk7XG4gICAgfSk7XG4gIH1lbHNle1xuICAgICQodGhpcykuZmFkZU91dCgpLnRyaWdnZXIoJ2Nsb3NlZC56ZicpO1xuICB9XG59KTtcblxuJChkb2N1bWVudCkub24oJ2ZvY3VzLnpmLnRyaWdnZXIgYmx1ci56Zi50cmlnZ2VyJywgJ1tkYXRhLXRvZ2dsZS1mb2N1c10nLCBmdW5jdGlvbigpIHtcbiAgbGV0IGlkID0gJCh0aGlzKS5kYXRhKCd0b2dnbGUtZm9jdXMnKTtcbiAgJChgIyR7aWR9YCkudHJpZ2dlckhhbmRsZXIoJ3RvZ2dsZS56Zi50cmlnZ2VyJywgWyQodGhpcyldKTtcbn0pO1xuXG4vKipcbiogRmlyZXMgb25jZSBhZnRlciBhbGwgb3RoZXIgc2NyaXB0cyBoYXZlIGxvYWRlZFxuKiBAZnVuY3Rpb25cbiogQHByaXZhdGVcbiovXG4kKHdpbmRvdykub24oJ2xvYWQnLCAoKSA9PiB7XG4gIGNoZWNrTGlzdGVuZXJzKCk7XG59KTtcblxuZnVuY3Rpb24gY2hlY2tMaXN0ZW5lcnMoKSB7XG4gIGV2ZW50c0xpc3RlbmVyKCk7XG4gIHJlc2l6ZUxpc3RlbmVyKCk7XG4gIHNjcm9sbExpc3RlbmVyKCk7XG4gIGNsb3NlbWVMaXN0ZW5lcigpO1xufVxuXG4vLyoqKioqKioqIG9ubHkgZmlyZXMgdGhpcyBmdW5jdGlvbiBvbmNlIG9uIGxvYWQsIGlmIHRoZXJlJ3Mgc29tZXRoaW5nIHRvIHdhdGNoICoqKioqKioqXG5mdW5jdGlvbiBjbG9zZW1lTGlzdGVuZXIocGx1Z2luTmFtZSkge1xuICB2YXIgeWV0aUJveGVzID0gJCgnW2RhdGEteWV0aS1ib3hdJyksXG4gICAgICBwbHVnTmFtZXMgPSBbJ2Ryb3Bkb3duJywgJ3Rvb2x0aXAnLCAncmV2ZWFsJ107XG5cbiAgaWYocGx1Z2luTmFtZSl7XG4gICAgaWYodHlwZW9mIHBsdWdpbk5hbWUgPT09ICdzdHJpbmcnKXtcbiAgICAgIHBsdWdOYW1lcy5wdXNoKHBsdWdpbk5hbWUpO1xuICAgIH1lbHNlIGlmKHR5cGVvZiBwbHVnaW5OYW1lID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgcGx1Z2luTmFtZVswXSA9PT0gJ3N0cmluZycpe1xuICAgICAgcGx1Z05hbWVzLmNvbmNhdChwbHVnaW5OYW1lKTtcbiAgICB9ZWxzZXtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1BsdWdpbiBuYW1lcyBtdXN0IGJlIHN0cmluZ3MnKTtcbiAgICB9XG4gIH1cbiAgaWYoeWV0aUJveGVzLmxlbmd0aCl7XG4gICAgbGV0IGxpc3RlbmVycyA9IHBsdWdOYW1lcy5tYXAoKG5hbWUpID0+IHtcbiAgICAgIHJldHVybiBgY2xvc2VtZS56Zi4ke25hbWV9YDtcbiAgICB9KS5qb2luKCcgJyk7XG5cbiAgICAkKHdpbmRvdykub2ZmKGxpc3RlbmVycykub24obGlzdGVuZXJzLCBmdW5jdGlvbihlLCBwbHVnaW5JZCl7XG4gICAgICBsZXQgcGx1Z2luID0gZS5uYW1lc3BhY2Uuc3BsaXQoJy4nKVswXTtcbiAgICAgIGxldCBwbHVnaW5zID0gJChgW2RhdGEtJHtwbHVnaW59XWApLm5vdChgW2RhdGEteWV0aS1ib3g9XCIke3BsdWdpbklkfVwiXWApO1xuXG4gICAgICBwbHVnaW5zLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgICAgbGV0IF90aGlzID0gJCh0aGlzKTtcblxuICAgICAgICBfdGhpcy50cmlnZ2VySGFuZGxlcignY2xvc2UuemYudHJpZ2dlcicsIFtfdGhpc10pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVzaXplTGlzdGVuZXIoZGVib3VuY2Upe1xuICBsZXQgdGltZXIsXG4gICAgICAkbm9kZXMgPSAkKCdbZGF0YS1yZXNpemVdJyk7XG4gIGlmKCRub2Rlcy5sZW5ndGgpe1xuICAgICQod2luZG93KS5vZmYoJ3Jlc2l6ZS56Zi50cmlnZ2VyJylcbiAgICAub24oJ3Jlc2l6ZS56Zi50cmlnZ2VyJywgZnVuY3Rpb24oZSkge1xuICAgICAgaWYgKHRpbWVyKSB7IGNsZWFyVGltZW91dCh0aW1lcik7IH1cblxuICAgICAgdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG5cbiAgICAgICAgaWYoIU11dGF0aW9uT2JzZXJ2ZXIpey8vZmFsbGJhY2sgZm9yIElFIDlcbiAgICAgICAgICAkbm9kZXMuZWFjaChmdW5jdGlvbigpe1xuICAgICAgICAgICAgJCh0aGlzKS50cmlnZ2VySGFuZGxlcigncmVzaXplbWUuemYudHJpZ2dlcicpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIC8vdHJpZ2dlciBhbGwgbGlzdGVuaW5nIGVsZW1lbnRzIGFuZCBzaWduYWwgYSByZXNpemUgZXZlbnRcbiAgICAgICAgJG5vZGVzLmF0dHIoJ2RhdGEtZXZlbnRzJywgXCJyZXNpemVcIik7XG4gICAgICB9LCBkZWJvdW5jZSB8fCAxMCk7Ly9kZWZhdWx0IHRpbWUgdG8gZW1pdCByZXNpemUgZXZlbnRcbiAgICB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzY3JvbGxMaXN0ZW5lcihkZWJvdW5jZSl7XG4gIGxldCB0aW1lcixcbiAgICAgICRub2RlcyA9ICQoJ1tkYXRhLXNjcm9sbF0nKTtcbiAgaWYoJG5vZGVzLmxlbmd0aCl7XG4gICAgJCh3aW5kb3cpLm9mZignc2Nyb2xsLnpmLnRyaWdnZXInKVxuICAgIC5vbignc2Nyb2xsLnpmLnRyaWdnZXInLCBmdW5jdGlvbihlKXtcbiAgICAgIGlmKHRpbWVyKXsgY2xlYXJUaW1lb3V0KHRpbWVyKTsgfVxuXG4gICAgICB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcblxuICAgICAgICBpZighTXV0YXRpb25PYnNlcnZlcil7Ly9mYWxsYmFjayBmb3IgSUUgOVxuICAgICAgICAgICRub2Rlcy5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAkKHRoaXMpLnRyaWdnZXJIYW5kbGVyKCdzY3JvbGxtZS56Zi50cmlnZ2VyJyk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy90cmlnZ2VyIGFsbCBsaXN0ZW5pbmcgZWxlbWVudHMgYW5kIHNpZ25hbCBhIHNjcm9sbCBldmVudFxuICAgICAgICAkbm9kZXMuYXR0cignZGF0YS1ldmVudHMnLCBcInNjcm9sbFwiKTtcbiAgICAgIH0sIGRlYm91bmNlIHx8IDEwKTsvL2RlZmF1bHQgdGltZSB0byBlbWl0IHNjcm9sbCBldmVudFxuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGV2ZW50c0xpc3RlbmVyKCkge1xuICBpZighTXV0YXRpb25PYnNlcnZlcil7IHJldHVybiBmYWxzZTsgfVxuICBsZXQgbm9kZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1yZXNpemVdLCBbZGF0YS1zY3JvbGxdLCBbZGF0YS1tdXRhdGVdJyk7XG5cbiAgLy9lbGVtZW50IGNhbGxiYWNrXG4gIHZhciBsaXN0ZW5pbmdFbGVtZW50c011dGF0aW9uID0gZnVuY3Rpb24obXV0YXRpb25SZWNvcmRzTGlzdCkge1xuICAgIHZhciAkdGFyZ2V0ID0gJChtdXRhdGlvblJlY29yZHNMaXN0WzBdLnRhcmdldCk7XG4gICAgLy90cmlnZ2VyIHRoZSBldmVudCBoYW5kbGVyIGZvciB0aGUgZWxlbWVudCBkZXBlbmRpbmcgb24gdHlwZVxuICAgIHN3aXRjaCAoJHRhcmdldC5hdHRyKFwiZGF0YS1ldmVudHNcIikpIHtcblxuICAgICAgY2FzZSBcInJlc2l6ZVwiIDpcbiAgICAgICR0YXJnZXQudHJpZ2dlckhhbmRsZXIoJ3Jlc2l6ZW1lLnpmLnRyaWdnZXInLCBbJHRhcmdldF0pO1xuICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgXCJzY3JvbGxcIiA6XG4gICAgICAkdGFyZ2V0LnRyaWdnZXJIYW5kbGVyKCdzY3JvbGxtZS56Zi50cmlnZ2VyJywgWyR0YXJnZXQsIHdpbmRvdy5wYWdlWU9mZnNldF0pO1xuICAgICAgYnJlYWs7XG5cbiAgICAgIC8vIGNhc2UgXCJtdXRhdGVcIiA6XG4gICAgICAvLyBjb25zb2xlLmxvZygnbXV0YXRlJywgJHRhcmdldCk7XG4gICAgICAvLyAkdGFyZ2V0LnRyaWdnZXJIYW5kbGVyKCdtdXRhdGUuemYudHJpZ2dlcicpO1xuICAgICAgLy9cbiAgICAgIC8vIC8vbWFrZSBzdXJlIHdlIGRvbid0IGdldCBzdHVjayBpbiBhbiBpbmZpbml0ZSBsb29wIGZyb20gc2xvcHB5IGNvZGVpbmdcbiAgICAgIC8vIGlmICgkdGFyZ2V0LmluZGV4KCdbZGF0YS1tdXRhdGVdJykgPT0gJChcIltkYXRhLW11dGF0ZV1cIikubGVuZ3RoLTEpIHtcbiAgICAgIC8vICAgZG9tTXV0YXRpb25PYnNlcnZlcigpO1xuICAgICAgLy8gfVxuICAgICAgLy8gYnJlYWs7XG5cbiAgICAgIGRlZmF1bHQgOlxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgLy9ub3RoaW5nXG4gICAgfVxuICB9XG5cbiAgaWYobm9kZXMubGVuZ3RoKXtcbiAgICAvL2ZvciBlYWNoIGVsZW1lbnQgdGhhdCBuZWVkcyB0byBsaXN0ZW4gZm9yIHJlc2l6aW5nLCBzY3JvbGxpbmcsIChvciBjb21pbmcgc29vbiBtdXRhdGlvbikgYWRkIGEgc2luZ2xlIG9ic2VydmVyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPD0gbm9kZXMubGVuZ3RoLTE7IGkrKykge1xuICAgICAgbGV0IGVsZW1lbnRPYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKGxpc3RlbmluZ0VsZW1lbnRzTXV0YXRpb24pO1xuICAgICAgZWxlbWVudE9ic2VydmVyLm9ic2VydmUobm9kZXNbaV0sIHsgYXR0cmlidXRlczogdHJ1ZSwgY2hpbGRMaXN0OiBmYWxzZSwgY2hhcmFjdGVyRGF0YTogZmFsc2UsIHN1YnRyZWU6ZmFsc2UsIGF0dHJpYnV0ZUZpbHRlcjpbXCJkYXRhLWV2ZW50c1wiXX0pO1xuICAgIH1cbiAgfVxufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuLy8gW1BIXVxuLy8gRm91bmRhdGlvbi5DaGVja1dhdGNoZXJzID0gY2hlY2tXYXRjaGVycztcbkZvdW5kYXRpb24uSUhlYXJZb3UgPSBjaGVja0xpc3RlbmVycztcbi8vIEZvdW5kYXRpb24uSVNlZVlvdSA9IHNjcm9sbExpc3RlbmVyO1xuLy8gRm91bmRhdGlvbi5JRmVlbFlvdSA9IGNsb3NlbWVMaXN0ZW5lcjtcblxufShqUXVlcnkpO1xuXG4vLyBmdW5jdGlvbiBkb21NdXRhdGlvbk9ic2VydmVyKGRlYm91bmNlKSB7XG4vLyAgIC8vICEhISBUaGlzIGlzIGNvbWluZyBzb29uIGFuZCBuZWVkcyBtb3JlIHdvcms7IG5vdCBhY3RpdmUgICEhISAvL1xuLy8gICB2YXIgdGltZXIsXG4vLyAgIG5vZGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtbXV0YXRlXScpO1xuLy8gICAvL1xuLy8gICBpZiAobm9kZXMubGVuZ3RoKSB7XG4vLyAgICAgLy8gdmFyIE11dGF0aW9uT2JzZXJ2ZXIgPSAoZnVuY3Rpb24gKCkge1xuLy8gICAgIC8vICAgdmFyIHByZWZpeGVzID0gWydXZWJLaXQnLCAnTW96JywgJ08nLCAnTXMnLCAnJ107XG4vLyAgICAgLy8gICBmb3IgKHZhciBpPTA7IGkgPCBwcmVmaXhlcy5sZW5ndGg7IGkrKykge1xuLy8gICAgIC8vICAgICBpZiAocHJlZml4ZXNbaV0gKyAnTXV0YXRpb25PYnNlcnZlcicgaW4gd2luZG93KSB7XG4vLyAgICAgLy8gICAgICAgcmV0dXJuIHdpbmRvd1twcmVmaXhlc1tpXSArICdNdXRhdGlvbk9ic2VydmVyJ107XG4vLyAgICAgLy8gICAgIH1cbi8vICAgICAvLyAgIH1cbi8vICAgICAvLyAgIHJldHVybiBmYWxzZTtcbi8vICAgICAvLyB9KCkpO1xuLy9cbi8vXG4vLyAgICAgLy9mb3IgdGhlIGJvZHksIHdlIG5lZWQgdG8gbGlzdGVuIGZvciBhbGwgY2hhbmdlcyBlZmZlY3RpbmcgdGhlIHN0eWxlIGFuZCBjbGFzcyBhdHRyaWJ1dGVzXG4vLyAgICAgdmFyIGJvZHlPYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKGJvZHlNdXRhdGlvbik7XG4vLyAgICAgYm9keU9ic2VydmVyLm9ic2VydmUoZG9jdW1lbnQuYm9keSwgeyBhdHRyaWJ1dGVzOiB0cnVlLCBjaGlsZExpc3Q6IHRydWUsIGNoYXJhY3RlckRhdGE6IGZhbHNlLCBzdWJ0cmVlOnRydWUsIGF0dHJpYnV0ZUZpbHRlcjpbXCJzdHlsZVwiLCBcImNsYXNzXCJdfSk7XG4vL1xuLy9cbi8vICAgICAvL2JvZHkgY2FsbGJhY2tcbi8vICAgICBmdW5jdGlvbiBib2R5TXV0YXRpb24obXV0YXRlKSB7XG4vLyAgICAgICAvL3RyaWdnZXIgYWxsIGxpc3RlbmluZyBlbGVtZW50cyBhbmQgc2lnbmFsIGEgbXV0YXRpb24gZXZlbnRcbi8vICAgICAgIGlmICh0aW1lcikgeyBjbGVhclRpbWVvdXQodGltZXIpOyB9XG4vL1xuLy8gICAgICAgdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuLy8gICAgICAgICBib2R5T2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuLy8gICAgICAgICAkKCdbZGF0YS1tdXRhdGVdJykuYXR0cignZGF0YS1ldmVudHMnLFwibXV0YXRlXCIpO1xuLy8gICAgICAgfSwgZGVib3VuY2UgfHwgMTUwKTtcbi8vICAgICB9XG4vLyAgIH1cbi8vIH1cbiIsIndpbmRvdy53aGF0SW5wdXQgPSAoZnVuY3Rpb24oKSB7XG5cbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8qXG4gICAgLS0tLS0tLS0tLS0tLS0tXG4gICAgdmFyaWFibGVzXG4gICAgLS0tLS0tLS0tLS0tLS0tXG4gICovXG5cbiAgLy8gYXJyYXkgb2YgYWN0aXZlbHkgcHJlc3NlZCBrZXlzXG4gIHZhciBhY3RpdmVLZXlzID0gW107XG5cbiAgLy8gY2FjaGUgZG9jdW1lbnQuYm9keVxuICB2YXIgYm9keTtcblxuICAvLyBib29sZWFuOiB0cnVlIGlmIHRvdWNoIGJ1ZmZlciB0aW1lciBpcyBydW5uaW5nXG4gIHZhciBidWZmZXIgPSBmYWxzZTtcblxuICAvLyB0aGUgbGFzdCB1c2VkIGlucHV0IHR5cGVcbiAgdmFyIGN1cnJlbnRJbnB1dCA9IG51bGw7XG5cbiAgLy8gYGlucHV0YCB0eXBlcyB0aGF0IGRvbid0IGFjY2VwdCB0ZXh0XG4gIHZhciBub25UeXBpbmdJbnB1dHMgPSBbXG4gICAgJ2J1dHRvbicsXG4gICAgJ2NoZWNrYm94JyxcbiAgICAnZmlsZScsXG4gICAgJ2ltYWdlJyxcbiAgICAncmFkaW8nLFxuICAgICdyZXNldCcsXG4gICAgJ3N1Ym1pdCdcbiAgXTtcblxuICAvLyBkZXRlY3QgdmVyc2lvbiBvZiBtb3VzZSB3aGVlbCBldmVudCB0byB1c2VcbiAgLy8gdmlhIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0V2ZW50cy93aGVlbFxuICB2YXIgbW91c2VXaGVlbCA9IGRldGVjdFdoZWVsKCk7XG5cbiAgLy8gbGlzdCBvZiBtb2RpZmllciBrZXlzIGNvbW1vbmx5IHVzZWQgd2l0aCB0aGUgbW91c2UgYW5kXG4gIC8vIGNhbiBiZSBzYWZlbHkgaWdub3JlZCB0byBwcmV2ZW50IGZhbHNlIGtleWJvYXJkIGRldGVjdGlvblxuICB2YXIgaWdub3JlTWFwID0gW1xuICAgIDE2LCAvLyBzaGlmdFxuICAgIDE3LCAvLyBjb250cm9sXG4gICAgMTgsIC8vIGFsdFxuICAgIDkxLCAvLyBXaW5kb3dzIGtleSAvIGxlZnQgQXBwbGUgY21kXG4gICAgOTMgIC8vIFdpbmRvd3MgbWVudSAvIHJpZ2h0IEFwcGxlIGNtZFxuICBdO1xuXG4gIC8vIG1hcHBpbmcgb2YgZXZlbnRzIHRvIGlucHV0IHR5cGVzXG4gIHZhciBpbnB1dE1hcCA9IHtcbiAgICAna2V5ZG93bic6ICdrZXlib2FyZCcsXG4gICAgJ2tleXVwJzogJ2tleWJvYXJkJyxcbiAgICAnbW91c2Vkb3duJzogJ21vdXNlJyxcbiAgICAnbW91c2Vtb3ZlJzogJ21vdXNlJyxcbiAgICAnTVNQb2ludGVyRG93bic6ICdwb2ludGVyJyxcbiAgICAnTVNQb2ludGVyTW92ZSc6ICdwb2ludGVyJyxcbiAgICAncG9pbnRlcmRvd24nOiAncG9pbnRlcicsXG4gICAgJ3BvaW50ZXJtb3ZlJzogJ3BvaW50ZXInLFxuICAgICd0b3VjaHN0YXJ0JzogJ3RvdWNoJ1xuICB9O1xuXG4gIC8vIGFkZCBjb3JyZWN0IG1vdXNlIHdoZWVsIGV2ZW50IG1hcHBpbmcgdG8gYGlucHV0TWFwYFxuICBpbnB1dE1hcFtkZXRlY3RXaGVlbCgpXSA9ICdtb3VzZSc7XG5cbiAgLy8gYXJyYXkgb2YgYWxsIHVzZWQgaW5wdXQgdHlwZXNcbiAgdmFyIGlucHV0VHlwZXMgPSBbXTtcblxuICAvLyBtYXBwaW5nIG9mIGtleSBjb2RlcyB0byBhIGNvbW1vbiBuYW1lXG4gIHZhciBrZXlNYXAgPSB7XG4gICAgOTogJ3RhYicsXG4gICAgMTM6ICdlbnRlcicsXG4gICAgMTY6ICdzaGlmdCcsXG4gICAgMjc6ICdlc2MnLFxuICAgIDMyOiAnc3BhY2UnLFxuICAgIDM3OiAnbGVmdCcsXG4gICAgMzg6ICd1cCcsXG4gICAgMzk6ICdyaWdodCcsXG4gICAgNDA6ICdkb3duJ1xuICB9O1xuXG4gIC8vIG1hcCBvZiBJRSAxMCBwb2ludGVyIGV2ZW50c1xuICB2YXIgcG9pbnRlck1hcCA9IHtcbiAgICAyOiAndG91Y2gnLFxuICAgIDM6ICd0b3VjaCcsIC8vIHRyZWF0IHBlbiBsaWtlIHRvdWNoXG4gICAgNDogJ21vdXNlJ1xuICB9O1xuXG4gIC8vIHRvdWNoIGJ1ZmZlciB0aW1lclxuICB2YXIgdGltZXI7XG5cblxuICAvKlxuICAgIC0tLS0tLS0tLS0tLS0tLVxuICAgIGZ1bmN0aW9uc1xuICAgIC0tLS0tLS0tLS0tLS0tLVxuICAqL1xuXG4gIC8vIGFsbG93cyBldmVudHMgdGhhdCBhcmUgYWxzbyB0cmlnZ2VyZWQgdG8gYmUgZmlsdGVyZWQgb3V0IGZvciBgdG91Y2hzdGFydGBcbiAgZnVuY3Rpb24gZXZlbnRCdWZmZXIoKSB7XG4gICAgY2xlYXJUaW1lcigpO1xuICAgIHNldElucHV0KGV2ZW50KTtcblxuICAgIGJ1ZmZlciA9IHRydWU7XG4gICAgdGltZXIgPSB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgIGJ1ZmZlciA9IGZhbHNlO1xuICAgIH0sIDY1MCk7XG4gIH1cblxuICBmdW5jdGlvbiBidWZmZXJlZEV2ZW50KGV2ZW50KSB7XG4gICAgaWYgKCFidWZmZXIpIHNldElucHV0KGV2ZW50KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHVuQnVmZmVyZWRFdmVudChldmVudCkge1xuICAgIGNsZWFyVGltZXIoKTtcbiAgICBzZXRJbnB1dChldmVudCk7XG4gIH1cblxuICBmdW5jdGlvbiBjbGVhclRpbWVyKCkge1xuICAgIHdpbmRvdy5jbGVhclRpbWVvdXQodGltZXIpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2V0SW5wdXQoZXZlbnQpIHtcbiAgICB2YXIgZXZlbnRLZXkgPSBrZXkoZXZlbnQpO1xuICAgIHZhciB2YWx1ZSA9IGlucHV0TWFwW2V2ZW50LnR5cGVdO1xuICAgIGlmICh2YWx1ZSA9PT0gJ3BvaW50ZXInKSB2YWx1ZSA9IHBvaW50ZXJUeXBlKGV2ZW50KTtcblxuICAgIC8vIGRvbid0IGRvIGFueXRoaW5nIGlmIHRoZSB2YWx1ZSBtYXRjaGVzIHRoZSBpbnB1dCB0eXBlIGFscmVhZHkgc2V0XG4gICAgaWYgKGN1cnJlbnRJbnB1dCAhPT0gdmFsdWUpIHtcbiAgICAgIHZhciBldmVudFRhcmdldCA9IHRhcmdldChldmVudCk7XG4gICAgICB2YXIgZXZlbnRUYXJnZXROb2RlID0gZXZlbnRUYXJnZXQubm9kZU5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgIHZhciBldmVudFRhcmdldFR5cGUgPSAoZXZlbnRUYXJnZXROb2RlID09PSAnaW5wdXQnKSA/IGV2ZW50VGFyZ2V0LmdldEF0dHJpYnV0ZSgndHlwZScpIDogbnVsbDtcblxuICAgICAgaWYgKFxuICAgICAgICAoLy8gb25seSBpZiB0aGUgdXNlciBmbGFnIHRvIGFsbG93IHR5cGluZyBpbiBmb3JtIGZpZWxkcyBpc24ndCBzZXRcbiAgICAgICAgIWJvZHkuaGFzQXR0cmlidXRlKCdkYXRhLXdoYXRpbnB1dC1mb3JtdHlwaW5nJykgJiZcblxuICAgICAgICAvLyBvbmx5IGlmIGN1cnJlbnRJbnB1dCBoYXMgYSB2YWx1ZVxuICAgICAgICBjdXJyZW50SW5wdXQgJiZcblxuICAgICAgICAvLyBvbmx5IGlmIHRoZSBpbnB1dCBpcyBga2V5Ym9hcmRgXG4gICAgICAgIHZhbHVlID09PSAna2V5Ym9hcmQnICYmXG5cbiAgICAgICAgLy8gbm90IGlmIHRoZSBrZXkgaXMgYFRBQmBcbiAgICAgICAga2V5TWFwW2V2ZW50S2V5XSAhPT0gJ3RhYicgJiZcblxuICAgICAgICAvLyBvbmx5IGlmIHRoZSB0YXJnZXQgaXMgYSBmb3JtIGlucHV0IHRoYXQgYWNjZXB0cyB0ZXh0XG4gICAgICAgIChcbiAgICAgICAgICAgZXZlbnRUYXJnZXROb2RlID09PSAndGV4dGFyZWEnIHx8XG4gICAgICAgICAgIGV2ZW50VGFyZ2V0Tm9kZSA9PT0gJ3NlbGVjdCcgfHxcbiAgICAgICAgICAgKGV2ZW50VGFyZ2V0Tm9kZSA9PT0gJ2lucHV0JyAmJiBub25UeXBpbmdJbnB1dHMuaW5kZXhPZihldmVudFRhcmdldFR5cGUpIDwgMClcbiAgICAgICAgKSkgfHwgKFxuICAgICAgICAgIC8vIGlnbm9yZSBtb2RpZmllciBrZXlzXG4gICAgICAgICAgaWdub3JlTWFwLmluZGV4T2YoZXZlbnRLZXkpID4gLTFcbiAgICAgICAgKVxuICAgICAgKSB7XG4gICAgICAgIC8vIGlnbm9yZSBrZXlib2FyZCB0eXBpbmdcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN3aXRjaElucHV0KHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodmFsdWUgPT09ICdrZXlib2FyZCcpIGxvZ0tleXMoZXZlbnRLZXkpO1xuICB9XG5cbiAgZnVuY3Rpb24gc3dpdGNoSW5wdXQoc3RyaW5nKSB7XG4gICAgY3VycmVudElucHV0ID0gc3RyaW5nO1xuICAgIGJvZHkuc2V0QXR0cmlidXRlKCdkYXRhLXdoYXRpbnB1dCcsIGN1cnJlbnRJbnB1dCk7XG5cbiAgICBpZiAoaW5wdXRUeXBlcy5pbmRleE9mKGN1cnJlbnRJbnB1dCkgPT09IC0xKSBpbnB1dFR5cGVzLnB1c2goY3VycmVudElucHV0KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGtleShldmVudCkge1xuICAgIHJldHVybiAoZXZlbnQua2V5Q29kZSkgPyBldmVudC5rZXlDb2RlIDogZXZlbnQud2hpY2g7XG4gIH1cblxuICBmdW5jdGlvbiB0YXJnZXQoZXZlbnQpIHtcbiAgICByZXR1cm4gZXZlbnQudGFyZ2V0IHx8IGV2ZW50LnNyY0VsZW1lbnQ7XG4gIH1cblxuICBmdW5jdGlvbiBwb2ludGVyVHlwZShldmVudCkge1xuICAgIGlmICh0eXBlb2YgZXZlbnQucG9pbnRlclR5cGUgPT09ICdudW1iZXInKSB7XG4gICAgICByZXR1cm4gcG9pbnRlck1hcFtldmVudC5wb2ludGVyVHlwZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAoZXZlbnQucG9pbnRlclR5cGUgPT09ICdwZW4nKSA/ICd0b3VjaCcgOiBldmVudC5wb2ludGVyVHlwZTsgLy8gdHJlYXQgcGVuIGxpa2UgdG91Y2hcbiAgICB9XG4gIH1cblxuICAvLyBrZXlib2FyZCBsb2dnaW5nXG4gIGZ1bmN0aW9uIGxvZ0tleXMoZXZlbnRLZXkpIHtcbiAgICBpZiAoYWN0aXZlS2V5cy5pbmRleE9mKGtleU1hcFtldmVudEtleV0pID09PSAtMSAmJiBrZXlNYXBbZXZlbnRLZXldKSBhY3RpdmVLZXlzLnB1c2goa2V5TWFwW2V2ZW50S2V5XSk7XG4gIH1cblxuICBmdW5jdGlvbiB1bkxvZ0tleXMoZXZlbnQpIHtcbiAgICB2YXIgZXZlbnRLZXkgPSBrZXkoZXZlbnQpO1xuICAgIHZhciBhcnJheVBvcyA9IGFjdGl2ZUtleXMuaW5kZXhPZihrZXlNYXBbZXZlbnRLZXldKTtcblxuICAgIGlmIChhcnJheVBvcyAhPT0gLTEpIGFjdGl2ZUtleXMuc3BsaWNlKGFycmF5UG9zLCAxKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGJpbmRFdmVudHMoKSB7XG4gICAgYm9keSA9IGRvY3VtZW50LmJvZHk7XG5cbiAgICAvLyBwb2ludGVyIGV2ZW50cyAobW91c2UsIHBlbiwgdG91Y2gpXG4gICAgaWYgKHdpbmRvdy5Qb2ludGVyRXZlbnQpIHtcbiAgICAgIGJvZHkuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcmRvd24nLCBidWZmZXJlZEV2ZW50KTtcbiAgICAgIGJvZHkuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcm1vdmUnLCBidWZmZXJlZEV2ZW50KTtcbiAgICB9IGVsc2UgaWYgKHdpbmRvdy5NU1BvaW50ZXJFdmVudCkge1xuICAgICAgYm9keS5hZGRFdmVudExpc3RlbmVyKCdNU1BvaW50ZXJEb3duJywgYnVmZmVyZWRFdmVudCk7XG4gICAgICBib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ01TUG9pbnRlck1vdmUnLCBidWZmZXJlZEV2ZW50KTtcbiAgICB9IGVsc2Uge1xuXG4gICAgICAvLyBtb3VzZSBldmVudHNcbiAgICAgIGJvZHkuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgYnVmZmVyZWRFdmVudCk7XG4gICAgICBib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIGJ1ZmZlcmVkRXZlbnQpO1xuXG4gICAgICAvLyB0b3VjaCBldmVudHNcbiAgICAgIGlmICgnb250b3VjaHN0YXJ0JyBpbiB3aW5kb3cpIHtcbiAgICAgICAgYm9keS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgZXZlbnRCdWZmZXIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIG1vdXNlIHdoZWVsXG4gICAgYm9keS5hZGRFdmVudExpc3RlbmVyKG1vdXNlV2hlZWwsIGJ1ZmZlcmVkRXZlbnQpO1xuXG4gICAgLy8ga2V5Ym9hcmQgZXZlbnRzXG4gICAgYm9keS5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdW5CdWZmZXJlZEV2ZW50KTtcbiAgICBib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgdW5CdWZmZXJlZEV2ZW50KTtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIHVuTG9nS2V5cyk7XG4gIH1cblxuXG4gIC8qXG4gICAgLS0tLS0tLS0tLS0tLS0tXG4gICAgdXRpbGl0aWVzXG4gICAgLS0tLS0tLS0tLS0tLS0tXG4gICovXG5cbiAgLy8gZGV0ZWN0IHZlcnNpb24gb2YgbW91c2Ugd2hlZWwgZXZlbnQgdG8gdXNlXG4gIC8vIHZpYSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9FdmVudHMvd2hlZWxcbiAgZnVuY3Rpb24gZGV0ZWN0V2hlZWwoKSB7XG4gICAgcmV0dXJuIG1vdXNlV2hlZWwgPSAnb253aGVlbCcgaW4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JykgP1xuICAgICAgJ3doZWVsJyA6IC8vIE1vZGVybiBicm93c2VycyBzdXBwb3J0IFwid2hlZWxcIlxuXG4gICAgICBkb2N1bWVudC5vbm1vdXNld2hlZWwgIT09IHVuZGVmaW5lZCA/XG4gICAgICAgICdtb3VzZXdoZWVsJyA6IC8vIFdlYmtpdCBhbmQgSUUgc3VwcG9ydCBhdCBsZWFzdCBcIm1vdXNld2hlZWxcIlxuICAgICAgICAnRE9NTW91c2VTY3JvbGwnOyAvLyBsZXQncyBhc3N1bWUgdGhhdCByZW1haW5pbmcgYnJvd3NlcnMgYXJlIG9sZGVyIEZpcmVmb3hcbiAgfVxuXG5cbiAgLypcbiAgICAtLS0tLS0tLS0tLS0tLS1cbiAgICBpbml0XG5cbiAgICBkb24ndCBzdGFydCBzY3JpcHQgdW5sZXNzIGJyb3dzZXIgY3V0cyB0aGUgbXVzdGFyZCxcbiAgICBhbHNvIHBhc3NlcyBpZiBwb2x5ZmlsbHMgYXJlIHVzZWRcbiAgICAtLS0tLS0tLS0tLS0tLS1cbiAgKi9cblxuICBpZiAoXG4gICAgJ2FkZEV2ZW50TGlzdGVuZXInIGluIHdpbmRvdyAmJlxuICAgIEFycmF5LnByb3RvdHlwZS5pbmRleE9mXG4gICkge1xuXG4gICAgLy8gaWYgdGhlIGRvbSBpcyBhbHJlYWR5IHJlYWR5IGFscmVhZHkgKHNjcmlwdCB3YXMgcGxhY2VkIGF0IGJvdHRvbSBvZiA8Ym9keT4pXG4gICAgaWYgKGRvY3VtZW50LmJvZHkpIHtcbiAgICAgIGJpbmRFdmVudHMoKTtcblxuICAgIC8vIG90aGVyd2lzZSB3YWl0IGZvciB0aGUgZG9tIHRvIGxvYWQgKHNjcmlwdCB3YXMgcGxhY2VkIGluIHRoZSA8aGVhZD4pXG4gICAgfSBlbHNlIHtcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBiaW5kRXZlbnRzKTtcbiAgICB9XG4gIH1cblxuXG4gIC8qXG4gICAgLS0tLS0tLS0tLS0tLS0tXG4gICAgYXBpXG4gICAgLS0tLS0tLS0tLS0tLS0tXG4gICovXG5cbiAgcmV0dXJuIHtcblxuICAgIC8vIHJldHVybnMgc3RyaW5nOiB0aGUgY3VycmVudCBpbnB1dCB0eXBlXG4gICAgYXNrOiBmdW5jdGlvbigpIHsgcmV0dXJuIGN1cnJlbnRJbnB1dDsgfSxcblxuICAgIC8vIHJldHVybnMgYXJyYXk6IGN1cnJlbnRseSBwcmVzc2VkIGtleXNcbiAgICBrZXlzOiBmdW5jdGlvbigpIHsgcmV0dXJuIGFjdGl2ZUtleXM7IH0sXG5cbiAgICAvLyByZXR1cm5zIGFycmF5OiBhbGwgdGhlIGRldGVjdGVkIGlucHV0IHR5cGVzXG4gICAgdHlwZXM6IGZ1bmN0aW9uKCkgeyByZXR1cm4gaW5wdXRUeXBlczsgfSxcblxuICAgIC8vIGFjY2VwdHMgc3RyaW5nOiBtYW51YWxseSBzZXQgdGhlIGlucHV0IHR5cGVcbiAgICBzZXQ6IHN3aXRjaElucHV0XG4gIH07XG5cbn0oKSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbi8qKlxuICogQWNjb3JkaW9uIG1vZHVsZS5cbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5hY2NvcmRpb25cbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwua2V5Ym9hcmRcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubW90aW9uXG4gKi9cblxuY2xhc3MgQWNjb3JkaW9uIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgYW4gYWNjb3JkaW9uLlxuICAgKiBAY2xhc3NcbiAgICogQGZpcmVzIEFjY29yZGlvbiNpbml0XG4gICAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBtYWtlIGludG8gYW4gYWNjb3JkaW9uLlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIGEgcGxhaW4gb2JqZWN0IHdpdGggc2V0dGluZ3MgdG8gb3ZlcnJpZGUgdGhlIGRlZmF1bHQgb3B0aW9ucy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRlbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgQWNjb3JkaW9uLmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XG5cbiAgICB0aGlzLl9pbml0KCk7XG5cbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdBY2NvcmRpb24nKTtcbiAgICBGb3VuZGF0aW9uLktleWJvYXJkLnJlZ2lzdGVyKCdBY2NvcmRpb24nLCB7XG4gICAgICAnRU5URVInOiAndG9nZ2xlJyxcbiAgICAgICdTUEFDRSc6ICd0b2dnbGUnLFxuICAgICAgJ0FSUk9XX0RPV04nOiAnbmV4dCcsXG4gICAgICAnQVJST1dfVVAnOiAncHJldmlvdXMnXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIGFjY29yZGlvbiBieSBhbmltYXRpbmcgdGhlIHByZXNldCBhY3RpdmUgcGFuZShzKS5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9pbml0KCkge1xuICAgIHRoaXMuJGVsZW1lbnQuYXR0cigncm9sZScsICd0YWJsaXN0Jyk7XG4gICAgdGhpcy4kdGFicyA9IHRoaXMuJGVsZW1lbnQuY2hpbGRyZW4oJ2xpLCBbZGF0YS1hY2NvcmRpb24taXRlbV0nKTtcblxuICAgIHRoaXMuJHRhYnMuZWFjaChmdW5jdGlvbihpZHgsIGVsKSB7XG4gICAgICB2YXIgJGVsID0gJChlbCksXG4gICAgICAgICAgJGNvbnRlbnQgPSAkZWwuY2hpbGRyZW4oJ1tkYXRhLXRhYi1jb250ZW50XScpLFxuICAgICAgICAgIGlkID0gJGNvbnRlbnRbMF0uaWQgfHwgRm91bmRhdGlvbi5HZXRZb0RpZ2l0cyg2LCAnYWNjb3JkaW9uJyksXG4gICAgICAgICAgbGlua0lkID0gZWwuaWQgfHwgYCR7aWR9LWxhYmVsYDtcblxuICAgICAgJGVsLmZpbmQoJ2E6Zmlyc3QnKS5hdHRyKHtcbiAgICAgICAgJ2FyaWEtY29udHJvbHMnOiBpZCxcbiAgICAgICAgJ3JvbGUnOiAndGFiJyxcbiAgICAgICAgJ2lkJzogbGlua0lkLFxuICAgICAgICAnYXJpYS1leHBhbmRlZCc6IGZhbHNlLFxuICAgICAgICAnYXJpYS1zZWxlY3RlZCc6IGZhbHNlXG4gICAgICB9KTtcblxuICAgICAgJGNvbnRlbnQuYXR0cih7J3JvbGUnOiAndGFicGFuZWwnLCAnYXJpYS1sYWJlbGxlZGJ5JzogbGlua0lkLCAnYXJpYS1oaWRkZW4nOiB0cnVlLCAnaWQnOiBpZH0pO1xuICAgIH0pO1xuICAgIHZhciAkaW5pdEFjdGl2ZSA9IHRoaXMuJGVsZW1lbnQuZmluZCgnLmlzLWFjdGl2ZScpLmNoaWxkcmVuKCdbZGF0YS10YWItY29udGVudF0nKTtcbiAgICBpZigkaW5pdEFjdGl2ZS5sZW5ndGgpe1xuICAgICAgdGhpcy5kb3duKCRpbml0QWN0aXZlLCB0cnVlKTtcbiAgICB9XG4gICAgdGhpcy5fZXZlbnRzKCk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBldmVudCBoYW5kbGVycyBmb3IgaXRlbXMgd2l0aGluIHRoZSBhY2NvcmRpb24uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfZXZlbnRzKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICB0aGlzLiR0YWJzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgJGVsZW0gPSAkKHRoaXMpO1xuICAgICAgdmFyICR0YWJDb250ZW50ID0gJGVsZW0uY2hpbGRyZW4oJ1tkYXRhLXRhYi1jb250ZW50XScpO1xuICAgICAgaWYgKCR0YWJDb250ZW50Lmxlbmd0aCkge1xuICAgICAgICAkZWxlbS5jaGlsZHJlbignYScpLm9mZignY2xpY2suemYuYWNjb3JkaW9uIGtleWRvd24uemYuYWNjb3JkaW9uJylcbiAgICAgICAgICAgICAgIC5vbignY2xpY2suemYuYWNjb3JkaW9uJywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICBfdGhpcy50b2dnbGUoJHRhYkNvbnRlbnQpO1xuICAgICAgICB9KS5vbigna2V5ZG93bi56Zi5hY2NvcmRpb24nLCBmdW5jdGlvbihlKXtcbiAgICAgICAgICBGb3VuZGF0aW9uLktleWJvYXJkLmhhbmRsZUtleShlLCAnQWNjb3JkaW9uJywge1xuICAgICAgICAgICAgdG9nZ2xlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgX3RoaXMudG9nZ2xlKCR0YWJDb250ZW50KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBuZXh0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgdmFyICRhID0gJGVsZW0ubmV4dCgpLmZpbmQoJ2EnKS5mb2N1cygpO1xuICAgICAgICAgICAgICBpZiAoIV90aGlzLm9wdGlvbnMubXVsdGlFeHBhbmQpIHtcbiAgICAgICAgICAgICAgICAkYS50cmlnZ2VyKCdjbGljay56Zi5hY2NvcmRpb24nKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJldmlvdXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICB2YXIgJGEgPSAkZWxlbS5wcmV2KCkuZmluZCgnYScpLmZvY3VzKCk7XG4gICAgICAgICAgICAgIGlmICghX3RoaXMub3B0aW9ucy5tdWx0aUV4cGFuZCkge1xuICAgICAgICAgICAgICAgICRhLnRyaWdnZXIoJ2NsaWNrLnpmLmFjY29yZGlvbicpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBoYW5kbGVkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUb2dnbGVzIHRoZSBzZWxlY3RlZCBjb250ZW50IHBhbmUncyBvcGVuL2Nsb3NlIHN0YXRlLlxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJHRhcmdldCAtIGpRdWVyeSBvYmplY3Qgb2YgdGhlIHBhbmUgdG8gdG9nZ2xlIChgLmFjY29yZGlvbi1jb250ZW50YCkuXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgdG9nZ2xlKCR0YXJnZXQpIHtcbiAgICBpZigkdGFyZ2V0LnBhcmVudCgpLmhhc0NsYXNzKCdpcy1hY3RpdmUnKSkge1xuICAgICAgdGhpcy51cCgkdGFyZ2V0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5kb3duKCR0YXJnZXQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBPcGVucyB0aGUgYWNjb3JkaW9uIHRhYiBkZWZpbmVkIGJ5IGAkdGFyZ2V0YC5cbiAgICogQHBhcmFtIHtqUXVlcnl9ICR0YXJnZXQgLSBBY2NvcmRpb24gcGFuZSB0byBvcGVuIChgLmFjY29yZGlvbi1jb250ZW50YCkuXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gZmlyc3RUaW1lIC0gZmxhZyB0byBkZXRlcm1pbmUgaWYgcmVmbG93IHNob3VsZCBoYXBwZW4uXG4gICAqIEBmaXJlcyBBY2NvcmRpb24jZG93blxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIGRvd24oJHRhcmdldCwgZmlyc3RUaW1lKSB7XG4gICAgJHRhcmdldFxuICAgICAgLmF0dHIoJ2FyaWEtaGlkZGVuJywgZmFsc2UpXG4gICAgICAucGFyZW50KCdbZGF0YS10YWItY29udGVudF0nKVxuICAgICAgLmFkZEJhY2soKVxuICAgICAgLnBhcmVudCgpLmFkZENsYXNzKCdpcy1hY3RpdmUnKTtcblxuICAgIGlmICghdGhpcy5vcHRpb25zLm11bHRpRXhwYW5kICYmICFmaXJzdFRpbWUpIHtcbiAgICAgIHZhciAkY3VycmVudEFjdGl2ZSA9IHRoaXMuJGVsZW1lbnQuY2hpbGRyZW4oJy5pcy1hY3RpdmUnKS5jaGlsZHJlbignW2RhdGEtdGFiLWNvbnRlbnRdJyk7XG4gICAgICBpZiAoJGN1cnJlbnRBY3RpdmUubGVuZ3RoKSB7XG4gICAgICAgIHRoaXMudXAoJGN1cnJlbnRBY3RpdmUubm90KCR0YXJnZXQpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAkdGFyZ2V0LnNsaWRlRG93bih0aGlzLm9wdGlvbnMuc2xpZGVTcGVlZCwgKCkgPT4ge1xuICAgICAgLyoqXG4gICAgICAgKiBGaXJlcyB3aGVuIHRoZSB0YWIgaXMgZG9uZSBvcGVuaW5nLlxuICAgICAgICogQGV2ZW50IEFjY29yZGlvbiNkb3duXG4gICAgICAgKi9cbiAgICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignZG93bi56Zi5hY2NvcmRpb24nLCBbJHRhcmdldF0pO1xuICAgIH0pO1xuXG4gICAgJChgIyR7JHRhcmdldC5hdHRyKCdhcmlhLWxhYmVsbGVkYnknKX1gKS5hdHRyKHtcbiAgICAgICdhcmlhLWV4cGFuZGVkJzogdHJ1ZSxcbiAgICAgICdhcmlhLXNlbGVjdGVkJzogdHJ1ZVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENsb3NlcyB0aGUgdGFiIGRlZmluZWQgYnkgYCR0YXJnZXRgLlxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJHRhcmdldCAtIEFjY29yZGlvbiB0YWIgdG8gY2xvc2UgKGAuYWNjb3JkaW9uLWNvbnRlbnRgKS5cbiAgICogQGZpcmVzIEFjY29yZGlvbiN1cFxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIHVwKCR0YXJnZXQpIHtcbiAgICB2YXIgJGF1bnRzID0gJHRhcmdldC5wYXJlbnQoKS5zaWJsaW5ncygpLFxuICAgICAgICBfdGhpcyA9IHRoaXM7XG5cbiAgICBpZigoIXRoaXMub3B0aW9ucy5hbGxvd0FsbENsb3NlZCAmJiAhJGF1bnRzLmhhc0NsYXNzKCdpcy1hY3RpdmUnKSkgfHwgISR0YXJnZXQucGFyZW50KCkuaGFzQ2xhc3MoJ2lzLWFjdGl2ZScpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gRm91bmRhdGlvbi5Nb3ZlKHRoaXMub3B0aW9ucy5zbGlkZVNwZWVkLCAkdGFyZ2V0LCBmdW5jdGlvbigpe1xuICAgICAgJHRhcmdldC5zbGlkZVVwKF90aGlzLm9wdGlvbnMuc2xpZGVTcGVlZCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAvKipcbiAgICAgICAgICogRmlyZXMgd2hlbiB0aGUgdGFiIGlzIGRvbmUgY29sbGFwc2luZyB1cC5cbiAgICAgICAgICogQGV2ZW50IEFjY29yZGlvbiN1cFxuICAgICAgICAgKi9cbiAgICAgICAgX3RoaXMuJGVsZW1lbnQudHJpZ2dlcigndXAuemYuYWNjb3JkaW9uJywgWyR0YXJnZXRdKTtcbiAgICAgIH0pO1xuICAgIC8vIH0pO1xuXG4gICAgJHRhcmdldC5hdHRyKCdhcmlhLWhpZGRlbicsIHRydWUpXG4gICAgICAgICAgIC5wYXJlbnQoKS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XG5cbiAgICAkKGAjJHskdGFyZ2V0LmF0dHIoJ2FyaWEtbGFiZWxsZWRieScpfWApLmF0dHIoe1xuICAgICAnYXJpYS1leHBhbmRlZCc6IGZhbHNlLFxuICAgICAnYXJpYS1zZWxlY3RlZCc6IGZhbHNlXG4gICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXN0cm95cyBhbiBpbnN0YW5jZSBvZiBhbiBhY2NvcmRpb24uXG4gICAqIEBmaXJlcyBBY2NvcmRpb24jZGVzdHJveWVkXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLiRlbGVtZW50LmZpbmQoJ1tkYXRhLXRhYi1jb250ZW50XScpLnN0b3AodHJ1ZSkuc2xpZGVVcCgwKS5jc3MoJ2Rpc3BsYXknLCAnJyk7XG4gICAgdGhpcy4kZWxlbWVudC5maW5kKCdhJykub2ZmKCcuemYuYWNjb3JkaW9uJyk7XG5cbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XG4gIH1cbn1cblxuQWNjb3JkaW9uLmRlZmF1bHRzID0ge1xuICAvKipcbiAgICogQW1vdW50IG9mIHRpbWUgdG8gYW5pbWF0ZSB0aGUgb3BlbmluZyBvZiBhbiBhY2NvcmRpb24gcGFuZS5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAyNTBcbiAgICovXG4gIHNsaWRlU3BlZWQ6IDI1MCxcbiAgLyoqXG4gICAqIEFsbG93IHRoZSBhY2NvcmRpb24gdG8gaGF2ZSBtdWx0aXBsZSBvcGVuIHBhbmVzLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIGZhbHNlXG4gICAqL1xuICBtdWx0aUV4cGFuZDogZmFsc2UsXG4gIC8qKlxuICAgKiBBbGxvdyB0aGUgYWNjb3JkaW9uIHRvIGNsb3NlIGFsbCBwYW5lcy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBmYWxzZVxuICAgKi9cbiAgYWxsb3dBbGxDbG9zZWQ6IGZhbHNlXG59O1xuXG4vLyBXaW5kb3cgZXhwb3J0c1xuRm91bmRhdGlvbi5wbHVnaW4oQWNjb3JkaW9uLCAnQWNjb3JkaW9uJyk7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLyoqXG4gKiBBY2NvcmRpb25NZW51IG1vZHVsZS5cbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5hY2NvcmRpb25NZW51XG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmtleWJvYXJkXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm1vdGlvblxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5uZXN0XG4gKi9cblxuY2xhc3MgQWNjb3JkaW9uTWVudSB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIGFuIGFjY29yZGlvbiBtZW51LlxuICAgKiBAY2xhc3NcbiAgICogQGZpcmVzIEFjY29yZGlvbk1lbnUjaW5pdFxuICAgKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gbWFrZSBpbnRvIGFuIGFjY29yZGlvbiBtZW51LlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE92ZXJyaWRlcyB0byB0aGUgZGVmYXVsdCBwbHVnaW4gc2V0dGluZ3MuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIEFjY29yZGlvbk1lbnUuZGVmYXVsdHMsIHRoaXMuJGVsZW1lbnQuZGF0YSgpLCBvcHRpb25zKTtcblxuICAgIEZvdW5kYXRpb24uTmVzdC5GZWF0aGVyKHRoaXMuJGVsZW1lbnQsICdhY2NvcmRpb24nKTtcblxuICAgIHRoaXMuX2luaXQoKTtcblxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcywgJ0FjY29yZGlvbk1lbnUnKTtcbiAgICBGb3VuZGF0aW9uLktleWJvYXJkLnJlZ2lzdGVyKCdBY2NvcmRpb25NZW51Jywge1xuICAgICAgJ0VOVEVSJzogJ3RvZ2dsZScsXG4gICAgICAnU1BBQ0UnOiAndG9nZ2xlJyxcbiAgICAgICdBUlJPV19SSUdIVCc6ICdvcGVuJyxcbiAgICAgICdBUlJPV19VUCc6ICd1cCcsXG4gICAgICAnQVJST1dfRE9XTic6ICdkb3duJyxcbiAgICAgICdBUlJPV19MRUZUJzogJ2Nsb3NlJyxcbiAgICAgICdFU0NBUEUnOiAnY2xvc2VBbGwnXG4gICAgfSk7XG4gIH1cblxuXG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHRoZSBhY2NvcmRpb24gbWVudSBieSBoaWRpbmcgYWxsIG5lc3RlZCBtZW51cy5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9pbml0KCkge1xuICAgIHRoaXMuJGVsZW1lbnQuZmluZCgnW2RhdGEtc3VibWVudV0nKS5ub3QoJy5pcy1hY3RpdmUnKS5zbGlkZVVwKDApOy8vLmZpbmQoJ2EnKS5jc3MoJ3BhZGRpbmctbGVmdCcsICcxcmVtJyk7XG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKHtcbiAgICAgICdyb2xlJzogJ21lbnUnLFxuICAgICAgJ2FyaWEtbXVsdGlzZWxlY3RhYmxlJzogdGhpcy5vcHRpb25zLm11bHRpT3BlblxuICAgIH0pO1xuXG4gICAgdGhpcy4kbWVudUxpbmtzID0gdGhpcy4kZWxlbWVudC5maW5kKCcuaXMtYWNjb3JkaW9uLXN1Ym1lbnUtcGFyZW50Jyk7XG4gICAgdGhpcy4kbWVudUxpbmtzLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgIHZhciBsaW5rSWQgPSB0aGlzLmlkIHx8IEZvdW5kYXRpb24uR2V0WW9EaWdpdHMoNiwgJ2FjYy1tZW51LWxpbmsnKSxcbiAgICAgICAgICAkZWxlbSA9ICQodGhpcyksXG4gICAgICAgICAgJHN1YiA9ICRlbGVtLmNoaWxkcmVuKCdbZGF0YS1zdWJtZW51XScpLFxuICAgICAgICAgIHN1YklkID0gJHN1YlswXS5pZCB8fCBGb3VuZGF0aW9uLkdldFlvRGlnaXRzKDYsICdhY2MtbWVudScpLFxuICAgICAgICAgIGlzQWN0aXZlID0gJHN1Yi5oYXNDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAkZWxlbS5hdHRyKHtcbiAgICAgICAgJ2FyaWEtY29udHJvbHMnOiBzdWJJZCxcbiAgICAgICAgJ2FyaWEtZXhwYW5kZWQnOiBpc0FjdGl2ZSxcbiAgICAgICAgJ3JvbGUnOiAnbWVudWl0ZW0nLFxuICAgICAgICAnaWQnOiBsaW5rSWRcbiAgICAgIH0pO1xuICAgICAgJHN1Yi5hdHRyKHtcbiAgICAgICAgJ2FyaWEtbGFiZWxsZWRieSc6IGxpbmtJZCxcbiAgICAgICAgJ2FyaWEtaGlkZGVuJzogIWlzQWN0aXZlLFxuICAgICAgICAncm9sZSc6ICdtZW51JyxcbiAgICAgICAgJ2lkJzogc3ViSWRcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHZhciBpbml0UGFuZXMgPSB0aGlzLiRlbGVtZW50LmZpbmQoJy5pcy1hY3RpdmUnKTtcbiAgICBpZihpbml0UGFuZXMubGVuZ3RoKXtcbiAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICBpbml0UGFuZXMuZWFjaChmdW5jdGlvbigpe1xuICAgICAgICBfdGhpcy5kb3duKCQodGhpcykpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHRoaXMuX2V2ZW50cygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgZXZlbnQgaGFuZGxlcnMgZm9yIGl0ZW1zIHdpdGhpbiB0aGUgbWVudS5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9ldmVudHMoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIHRoaXMuJGVsZW1lbnQuZmluZCgnbGknKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgdmFyICRzdWJtZW51ID0gJCh0aGlzKS5jaGlsZHJlbignW2RhdGEtc3VibWVudV0nKTtcblxuICAgICAgaWYgKCRzdWJtZW51Lmxlbmd0aCkge1xuICAgICAgICAkKHRoaXMpLmNoaWxkcmVuKCdhJykub2ZmKCdjbGljay56Zi5hY2NvcmRpb25NZW51Jykub24oJ2NsaWNrLnpmLmFjY29yZGlvbk1lbnUnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgICAgX3RoaXMudG9nZ2xlKCRzdWJtZW51KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSkub24oJ2tleWRvd24uemYuYWNjb3JkaW9ubWVudScsIGZ1bmN0aW9uKGUpe1xuICAgICAgdmFyICRlbGVtZW50ID0gJCh0aGlzKSxcbiAgICAgICAgICAkZWxlbWVudHMgPSAkZWxlbWVudC5wYXJlbnQoJ3VsJykuY2hpbGRyZW4oJ2xpJyksXG4gICAgICAgICAgJHByZXZFbGVtZW50LFxuICAgICAgICAgICRuZXh0RWxlbWVudCxcbiAgICAgICAgICAkdGFyZ2V0ID0gJGVsZW1lbnQuY2hpbGRyZW4oJ1tkYXRhLXN1Ym1lbnVdJyk7XG5cbiAgICAgICRlbGVtZW50cy5lYWNoKGZ1bmN0aW9uKGkpIHtcbiAgICAgICAgaWYgKCQodGhpcykuaXMoJGVsZW1lbnQpKSB7XG4gICAgICAgICAgJHByZXZFbGVtZW50ID0gJGVsZW1lbnRzLmVxKE1hdGgubWF4KDAsIGktMSkpLmZpbmQoJ2EnKS5maXJzdCgpO1xuICAgICAgICAgICRuZXh0RWxlbWVudCA9ICRlbGVtZW50cy5lcShNYXRoLm1pbihpKzEsICRlbGVtZW50cy5sZW5ndGgtMSkpLmZpbmQoJ2EnKS5maXJzdCgpO1xuXG4gICAgICAgICAgaWYgKCQodGhpcykuY2hpbGRyZW4oJ1tkYXRhLXN1Ym1lbnVdOnZpc2libGUnKS5sZW5ndGgpIHsgLy8gaGFzIG9wZW4gc3ViIG1lbnVcbiAgICAgICAgICAgICRuZXh0RWxlbWVudCA9ICRlbGVtZW50LmZpbmQoJ2xpOmZpcnN0LWNoaWxkJykuZmluZCgnYScpLmZpcnN0KCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICgkKHRoaXMpLmlzKCc6Zmlyc3QtY2hpbGQnKSkgeyAvLyBpcyBmaXJzdCBlbGVtZW50IG9mIHN1YiBtZW51XG4gICAgICAgICAgICAkcHJldkVsZW1lbnQgPSAkZWxlbWVudC5wYXJlbnRzKCdsaScpLmZpcnN0KCkuZmluZCgnYScpLmZpcnN0KCk7XG4gICAgICAgICAgfSBlbHNlIGlmICgkcHJldkVsZW1lbnQucGFyZW50cygnbGknKS5maXJzdCgpLmNoaWxkcmVuKCdbZGF0YS1zdWJtZW51XTp2aXNpYmxlJykubGVuZ3RoKSB7IC8vIGlmIHByZXZpb3VzIGVsZW1lbnQgaGFzIG9wZW4gc3ViIG1lbnVcbiAgICAgICAgICAgICRwcmV2RWxlbWVudCA9ICRwcmV2RWxlbWVudC5wYXJlbnRzKCdsaScpLmZpbmQoJ2xpOmxhc3QtY2hpbGQnKS5maW5kKCdhJykuZmlyc3QoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCQodGhpcykuaXMoJzpsYXN0LWNoaWxkJykpIHsgLy8gaXMgbGFzdCBlbGVtZW50IG9mIHN1YiBtZW51XG4gICAgICAgICAgICAkbmV4dEVsZW1lbnQgPSAkZWxlbWVudC5wYXJlbnRzKCdsaScpLmZpcnN0KCkubmV4dCgnbGknKS5maW5kKCdhJykuZmlyc3QoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBGb3VuZGF0aW9uLktleWJvYXJkLmhhbmRsZUtleShlLCAnQWNjb3JkaW9uTWVudScsIHtcbiAgICAgICAgb3BlbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKCR0YXJnZXQuaXMoJzpoaWRkZW4nKSkge1xuICAgICAgICAgICAgX3RoaXMuZG93bigkdGFyZ2V0KTtcbiAgICAgICAgICAgICR0YXJnZXQuZmluZCgnbGknKS5maXJzdCgpLmZpbmQoJ2EnKS5maXJzdCgpLmZvY3VzKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBjbG9zZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKCR0YXJnZXQubGVuZ3RoICYmICEkdGFyZ2V0LmlzKCc6aGlkZGVuJykpIHsgLy8gY2xvc2UgYWN0aXZlIHN1YiBvZiB0aGlzIGl0ZW1cbiAgICAgICAgICAgIF90aGlzLnVwKCR0YXJnZXQpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoJGVsZW1lbnQucGFyZW50KCdbZGF0YS1zdWJtZW51XScpLmxlbmd0aCkgeyAvLyBjbG9zZSBjdXJyZW50bHkgb3BlbiBzdWJcbiAgICAgICAgICAgIF90aGlzLnVwKCRlbGVtZW50LnBhcmVudCgnW2RhdGEtc3VibWVudV0nKSk7XG4gICAgICAgICAgICAkZWxlbWVudC5wYXJlbnRzKCdsaScpLmZpcnN0KCkuZmluZCgnYScpLmZpcnN0KCkuZm9jdXMoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHVwOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAkcHJldkVsZW1lbnQuZm9jdXMoKTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZG93bjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgJG5leHRFbGVtZW50LmZvY3VzKCk7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sXG4gICAgICAgIHRvZ2dsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKCRlbGVtZW50LmNoaWxkcmVuKCdbZGF0YS1zdWJtZW51XScpLmxlbmd0aCkge1xuICAgICAgICAgICAgX3RoaXMudG9nZ2xlKCRlbGVtZW50LmNoaWxkcmVuKCdbZGF0YS1zdWJtZW51XScpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGNsb3NlQWxsOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBfdGhpcy5oaWRlQWxsKCk7XG4gICAgICAgIH0sXG4gICAgICAgIGhhbmRsZWQ6IGZ1bmN0aW9uKHByZXZlbnREZWZhdWx0KSB7XG4gICAgICAgICAgaWYgKHByZXZlbnREZWZhdWx0KSB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pOy8vLmF0dHIoJ3RhYmluZGV4JywgMCk7XG4gIH1cblxuICAvKipcbiAgICogQ2xvc2VzIGFsbCBwYW5lcyBvZiB0aGUgbWVudS5cbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICBoaWRlQWxsKCkge1xuICAgIHRoaXMuJGVsZW1lbnQuZmluZCgnW2RhdGEtc3VibWVudV0nKS5zbGlkZVVwKHRoaXMub3B0aW9ucy5zbGlkZVNwZWVkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUb2dnbGVzIHRoZSBvcGVuL2Nsb3NlIHN0YXRlIG9mIGEgc3VibWVudS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSAkdGFyZ2V0IC0gdGhlIHN1Ym1lbnUgdG8gdG9nZ2xlXG4gICAqL1xuICB0b2dnbGUoJHRhcmdldCl7XG4gICAgaWYoISR0YXJnZXQuaXMoJzphbmltYXRlZCcpKSB7XG4gICAgICBpZiAoISR0YXJnZXQuaXMoJzpoaWRkZW4nKSkge1xuICAgICAgICB0aGlzLnVwKCR0YXJnZXQpO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHRoaXMuZG93bigkdGFyZ2V0KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogT3BlbnMgdGhlIHN1Yi1tZW51IGRlZmluZWQgYnkgYCR0YXJnZXRgLlxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJHRhcmdldCAtIFN1Yi1tZW51IHRvIG9wZW4uXG4gICAqIEBmaXJlcyBBY2NvcmRpb25NZW51I2Rvd25cbiAgICovXG4gIGRvd24oJHRhcmdldCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICBpZighdGhpcy5vcHRpb25zLm11bHRpT3Blbikge1xuICAgICAgdGhpcy51cCh0aGlzLiRlbGVtZW50LmZpbmQoJy5pcy1hY3RpdmUnKS5ub3QoJHRhcmdldC5wYXJlbnRzVW50aWwodGhpcy4kZWxlbWVudCkuYWRkKCR0YXJnZXQpKSk7XG4gICAgfVxuXG4gICAgJHRhcmdldC5hZGRDbGFzcygnaXMtYWN0aXZlJykuYXR0cih7J2FyaWEtaGlkZGVuJzogZmFsc2V9KVxuICAgICAgLnBhcmVudCgnLmlzLWFjY29yZGlvbi1zdWJtZW51LXBhcmVudCcpLmF0dHIoeydhcmlhLWV4cGFuZGVkJzogdHJ1ZX0pO1xuXG4gICAgICAvL0ZvdW5kYXRpb24uTW92ZSh0aGlzLm9wdGlvbnMuc2xpZGVTcGVlZCwgJHRhcmdldCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICR0YXJnZXQuc2xpZGVEb3duKF90aGlzLm9wdGlvbnMuc2xpZGVTcGVlZCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIC8qKlxuICAgICAgICAgICAqIEZpcmVzIHdoZW4gdGhlIG1lbnUgaXMgZG9uZSBvcGVuaW5nLlxuICAgICAgICAgICAqIEBldmVudCBBY2NvcmRpb25NZW51I2Rvd25cbiAgICAgICAgICAgKi9cbiAgICAgICAgICBfdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdkb3duLnpmLmFjY29yZGlvbk1lbnUnLCBbJHRhcmdldF0pO1xuICAgICAgICB9KTtcbiAgICAgIC8vfSk7XG4gIH1cblxuICAvKipcbiAgICogQ2xvc2VzIHRoZSBzdWItbWVudSBkZWZpbmVkIGJ5IGAkdGFyZ2V0YC4gQWxsIHN1Yi1tZW51cyBpbnNpZGUgdGhlIHRhcmdldCB3aWxsIGJlIGNsb3NlZCBhcyB3ZWxsLlxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJHRhcmdldCAtIFN1Yi1tZW51IHRvIGNsb3NlLlxuICAgKiBAZmlyZXMgQWNjb3JkaW9uTWVudSN1cFxuICAgKi9cbiAgdXAoJHRhcmdldCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgLy9Gb3VuZGF0aW9uLk1vdmUodGhpcy5vcHRpb25zLnNsaWRlU3BlZWQsICR0YXJnZXQsIGZ1bmN0aW9uKCl7XG4gICAgICAkdGFyZ2V0LnNsaWRlVXAoX3RoaXMub3B0aW9ucy5zbGlkZVNwZWVkLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBGaXJlcyB3aGVuIHRoZSBtZW51IGlzIGRvbmUgY29sbGFwc2luZyB1cC5cbiAgICAgICAgICogQGV2ZW50IEFjY29yZGlvbk1lbnUjdXBcbiAgICAgICAgICovXG4gICAgICAgIF90aGlzLiRlbGVtZW50LnRyaWdnZXIoJ3VwLnpmLmFjY29yZGlvbk1lbnUnLCBbJHRhcmdldF0pO1xuICAgICAgfSk7XG4gICAgLy99KTtcblxuICAgIHZhciAkbWVudXMgPSAkdGFyZ2V0LmZpbmQoJ1tkYXRhLXN1Ym1lbnVdJykuc2xpZGVVcCgwKS5hZGRCYWNrKCkuYXR0cignYXJpYS1oaWRkZW4nLCB0cnVlKTtcblxuICAgICRtZW51cy5wYXJlbnQoJy5pcy1hY2NvcmRpb24tc3VibWVudS1wYXJlbnQnKS5hdHRyKCdhcmlhLWV4cGFuZGVkJywgZmFsc2UpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIGFuIGluc3RhbmNlIG9mIGFjY29yZGlvbiBtZW51LlxuICAgKiBAZmlyZXMgQWNjb3JkaW9uTWVudSNkZXN0cm95ZWRcbiAgICovXG4gIGRlc3Ryb3koKSB7XG4gICAgdGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS1zdWJtZW51XScpLnNsaWRlRG93bigwKS5jc3MoJ2Rpc3BsYXknLCAnJyk7XG4gICAgdGhpcy4kZWxlbWVudC5maW5kKCdhJykub2ZmKCdjbGljay56Zi5hY2NvcmRpb25NZW51Jyk7XG5cbiAgICBGb3VuZGF0aW9uLk5lc3QuQnVybih0aGlzLiRlbGVtZW50LCAnYWNjb3JkaW9uJyk7XG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xuICB9XG59XG5cbkFjY29yZGlvbk1lbnUuZGVmYXVsdHMgPSB7XG4gIC8qKlxuICAgKiBBbW91bnQgb2YgdGltZSB0byBhbmltYXRlIHRoZSBvcGVuaW5nIG9mIGEgc3VibWVudSBpbiBtcy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAyNTBcbiAgICovXG4gIHNsaWRlU3BlZWQ6IDI1MCxcbiAgLyoqXG4gICAqIEFsbG93IHRoZSBtZW51IHRvIGhhdmUgbXVsdGlwbGUgb3BlbiBwYW5lcy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSB0cnVlXG4gICAqL1xuICBtdWx0aU9wZW46IHRydWVcbn07XG5cbi8vIFdpbmRvdyBleHBvcnRzXG5Gb3VuZGF0aW9uLnBsdWdpbihBY2NvcmRpb25NZW51LCAnQWNjb3JkaW9uTWVudScpO1xuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbi8qKlxuICogRHJvcGRvd24gbW9kdWxlLlxuICogQG1vZHVsZSBmb3VuZGF0aW9uLmRyb3Bkb3duXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmtleWJvYXJkXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmJveFxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC50cmlnZ2Vyc1xuICovXG5cbmNsYXNzIERyb3Bkb3duIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgYSBkcm9wZG93bi5cbiAgICogQGNsYXNzXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBtYWtlIGludG8gYSBkcm9wZG93bi5cbiAgICogICAgICAgIE9iamVjdCBzaG91bGQgYmUgb2YgdGhlIGRyb3Bkb3duIHBhbmVsLCByYXRoZXIgdGhhbiBpdHMgYW5jaG9yLlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE92ZXJyaWRlcyB0byB0aGUgZGVmYXVsdCBwbHVnaW4gc2V0dGluZ3MuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIERyb3Bkb3duLmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XG4gICAgdGhpcy5faW5pdCgpO1xuXG4gICAgRm91bmRhdGlvbi5yZWdpc3RlclBsdWdpbih0aGlzLCAnRHJvcGRvd24nKTtcbiAgICBGb3VuZGF0aW9uLktleWJvYXJkLnJlZ2lzdGVyKCdEcm9wZG93bicsIHtcbiAgICAgICdFTlRFUic6ICdvcGVuJyxcbiAgICAgICdTUEFDRSc6ICdvcGVuJyxcbiAgICAgICdFU0NBUEUnOiAnY2xvc2UnLFxuICAgICAgJ1RBQic6ICd0YWJfZm9yd2FyZCcsXG4gICAgICAnU0hJRlRfVEFCJzogJ3RhYl9iYWNrd2FyZCdcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgcGx1Z2luIGJ5IHNldHRpbmcvY2hlY2tpbmcgb3B0aW9ucyBhbmQgYXR0cmlidXRlcywgYWRkaW5nIGhlbHBlciB2YXJpYWJsZXMsIGFuZCBzYXZpbmcgdGhlIGFuY2hvci5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaW5pdCgpIHtcbiAgICB2YXIgJGlkID0gdGhpcy4kZWxlbWVudC5hdHRyKCdpZCcpO1xuXG4gICAgdGhpcy4kYW5jaG9yID0gJChgW2RhdGEtdG9nZ2xlPVwiJHskaWR9XCJdYCkubGVuZ3RoID8gJChgW2RhdGEtdG9nZ2xlPVwiJHskaWR9XCJdYCkgOiAkKGBbZGF0YS1vcGVuPVwiJHskaWR9XCJdYCk7XG4gICAgdGhpcy4kYW5jaG9yLmF0dHIoe1xuICAgICAgJ2FyaWEtY29udHJvbHMnOiAkaWQsXG4gICAgICAnZGF0YS1pcy1mb2N1cyc6IGZhbHNlLFxuICAgICAgJ2RhdGEteWV0aS1ib3gnOiAkaWQsXG4gICAgICAnYXJpYS1oYXNwb3B1cCc6IHRydWUsXG4gICAgICAnYXJpYS1leHBhbmRlZCc6IGZhbHNlXG5cbiAgICB9KTtcblxuICAgIHRoaXMub3B0aW9ucy5wb3NpdGlvbkNsYXNzID0gdGhpcy5nZXRQb3NpdGlvbkNsYXNzKCk7XG4gICAgdGhpcy5jb3VudGVyID0gNDtcbiAgICB0aGlzLnVzZWRQb3NpdGlvbnMgPSBbXTtcbiAgICB0aGlzLiRlbGVtZW50LmF0dHIoe1xuICAgICAgJ2FyaWEtaGlkZGVuJzogJ3RydWUnLFxuICAgICAgJ2RhdGEteWV0aS1ib3gnOiAkaWQsXG4gICAgICAnZGF0YS1yZXNpemUnOiAkaWQsXG4gICAgICAnYXJpYS1sYWJlbGxlZGJ5JzogdGhpcy4kYW5jaG9yWzBdLmlkIHx8IEZvdW5kYXRpb24uR2V0WW9EaWdpdHMoNiwgJ2RkLWFuY2hvcicpXG4gICAgfSk7XG4gICAgdGhpcy5fZXZlbnRzKCk7XG4gIH1cblxuICAvKipcbiAgICogSGVscGVyIGZ1bmN0aW9uIHRvIGRldGVybWluZSBjdXJyZW50IG9yaWVudGF0aW9uIG9mIGRyb3Bkb3duIHBhbmUuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcmV0dXJucyB7U3RyaW5nfSBwb3NpdGlvbiAtIHN0cmluZyB2YWx1ZSBvZiBhIHBvc2l0aW9uIGNsYXNzLlxuICAgKi9cbiAgZ2V0UG9zaXRpb25DbGFzcygpIHtcbiAgICB2YXIgdmVydGljYWxQb3NpdGlvbiA9IHRoaXMuJGVsZW1lbnRbMF0uY2xhc3NOYW1lLm1hdGNoKC8odG9wfGxlZnR8cmlnaHR8Ym90dG9tKS9nKTtcbiAgICAgICAgdmVydGljYWxQb3NpdGlvbiA9IHZlcnRpY2FsUG9zaXRpb24gPyB2ZXJ0aWNhbFBvc2l0aW9uWzBdIDogJyc7XG4gICAgdmFyIGhvcml6b250YWxQb3NpdGlvbiA9IC9mbG9hdC0oXFxTKykvLmV4ZWModGhpcy4kYW5jaG9yWzBdLmNsYXNzTmFtZSk7XG4gICAgICAgIGhvcml6b250YWxQb3NpdGlvbiA9IGhvcml6b250YWxQb3NpdGlvbiA/IGhvcml6b250YWxQb3NpdGlvblsxXSA6ICcnO1xuICAgIHZhciBwb3NpdGlvbiA9IGhvcml6b250YWxQb3NpdGlvbiA/IGhvcml6b250YWxQb3NpdGlvbiArICcgJyArIHZlcnRpY2FsUG9zaXRpb24gOiB2ZXJ0aWNhbFBvc2l0aW9uO1xuXG4gICAgcmV0dXJuIHBvc2l0aW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkanVzdHMgdGhlIGRyb3Bkb3duIHBhbmVzIG9yaWVudGF0aW9uIGJ5IGFkZGluZy9yZW1vdmluZyBwb3NpdGlvbmluZyBjbGFzc2VzLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBvc2l0aW9uIC0gcG9zaXRpb24gY2xhc3MgdG8gcmVtb3ZlLlxuICAgKi9cbiAgX3JlcG9zaXRpb24ocG9zaXRpb24pIHtcbiAgICB0aGlzLnVzZWRQb3NpdGlvbnMucHVzaChwb3NpdGlvbiA/IHBvc2l0aW9uIDogJ2JvdHRvbScpO1xuICAgIC8vZGVmYXVsdCwgdHJ5IHN3aXRjaGluZyB0byBvcHBvc2l0ZSBzaWRlXG4gICAgaWYoIXBvc2l0aW9uICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZigndG9wJykgPCAwKSl7XG4gICAgICB0aGlzLiRlbGVtZW50LmFkZENsYXNzKCd0b3AnKTtcbiAgICB9ZWxzZSBpZihwb3NpdGlvbiA9PT0gJ3RvcCcgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdib3R0b20nKSA8IDApKXtcbiAgICAgIHRoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3MocG9zaXRpb24pO1xuICAgIH1lbHNlIGlmKHBvc2l0aW9uID09PSAnbGVmdCcgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdyaWdodCcpIDwgMCkpe1xuICAgICAgdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcyhwb3NpdGlvbilcbiAgICAgICAgICAuYWRkQ2xhc3MoJ3JpZ2h0Jyk7XG4gICAgfWVsc2UgaWYocG9zaXRpb24gPT09ICdyaWdodCcgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdsZWZ0JykgPCAwKSl7XG4gICAgICB0aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKHBvc2l0aW9uKVxuICAgICAgICAgIC5hZGRDbGFzcygnbGVmdCcpO1xuICAgIH1cblxuICAgIC8vaWYgZGVmYXVsdCBjaGFuZ2UgZGlkbid0IHdvcmssIHRyeSBib3R0b20gb3IgbGVmdCBmaXJzdFxuICAgIGVsc2UgaWYoIXBvc2l0aW9uICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZigndG9wJykgPiAtMSkgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdsZWZ0JykgPCAwKSl7XG4gICAgICB0aGlzLiRlbGVtZW50LmFkZENsYXNzKCdsZWZ0Jyk7XG4gICAgfWVsc2UgaWYocG9zaXRpb24gPT09ICd0b3AnICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZignYm90dG9tJykgPiAtMSkgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdsZWZ0JykgPCAwKSl7XG4gICAgICB0aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKHBvc2l0aW9uKVxuICAgICAgICAgIC5hZGRDbGFzcygnbGVmdCcpO1xuICAgIH1lbHNlIGlmKHBvc2l0aW9uID09PSAnbGVmdCcgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdyaWdodCcpID4gLTEpICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZignYm90dG9tJykgPCAwKSl7XG4gICAgICB0aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKHBvc2l0aW9uKTtcbiAgICB9ZWxzZSBpZihwb3NpdGlvbiA9PT0gJ3JpZ2h0JyAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ2xlZnQnKSA+IC0xKSAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ2JvdHRvbScpIDwgMCkpe1xuICAgICAgdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcyhwb3NpdGlvbik7XG4gICAgfVxuICAgIC8vaWYgbm90aGluZyBjbGVhcmVkLCBzZXQgdG8gYm90dG9tXG4gICAgZWxzZXtcbiAgICAgIHRoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3MocG9zaXRpb24pO1xuICAgIH1cbiAgICB0aGlzLmNsYXNzQ2hhbmdlZCA9IHRydWU7XG4gICAgdGhpcy5jb3VudGVyLS07XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgcG9zaXRpb24gYW5kIG9yaWVudGF0aW9uIG9mIHRoZSBkcm9wZG93biBwYW5lLCBjaGVja3MgZm9yIGNvbGxpc2lvbnMuXG4gICAqIFJlY3Vyc2l2ZWx5IGNhbGxzIGl0c2VsZiBpZiBhIGNvbGxpc2lvbiBpcyBkZXRlY3RlZCwgd2l0aCBhIG5ldyBwb3NpdGlvbiBjbGFzcy5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfc2V0UG9zaXRpb24oKSB7XG4gICAgaWYodGhpcy4kYW5jaG9yLmF0dHIoJ2FyaWEtZXhwYW5kZWQnKSA9PT0gJ2ZhbHNlJyl7IHJldHVybiBmYWxzZTsgfVxuICAgIHZhciBwb3NpdGlvbiA9IHRoaXMuZ2V0UG9zaXRpb25DbGFzcygpLFxuICAgICAgICAkZWxlRGltcyA9IEZvdW5kYXRpb24uQm94LkdldERpbWVuc2lvbnModGhpcy4kZWxlbWVudCksXG4gICAgICAgICRhbmNob3JEaW1zID0gRm91bmRhdGlvbi5Cb3guR2V0RGltZW5zaW9ucyh0aGlzLiRhbmNob3IpLFxuICAgICAgICBfdGhpcyA9IHRoaXMsXG4gICAgICAgIGRpcmVjdGlvbiA9IChwb3NpdGlvbiA9PT0gJ2xlZnQnID8gJ2xlZnQnIDogKChwb3NpdGlvbiA9PT0gJ3JpZ2h0JykgPyAnbGVmdCcgOiAndG9wJykpLFxuICAgICAgICBwYXJhbSA9IChkaXJlY3Rpb24gPT09ICd0b3AnKSA/ICdoZWlnaHQnIDogJ3dpZHRoJyxcbiAgICAgICAgb2Zmc2V0ID0gKHBhcmFtID09PSAnaGVpZ2h0JykgPyB0aGlzLm9wdGlvbnMudk9mZnNldCA6IHRoaXMub3B0aW9ucy5oT2Zmc2V0O1xuXG5cblxuICAgIGlmKCgkZWxlRGltcy53aWR0aCA+PSAkZWxlRGltcy53aW5kb3dEaW1zLndpZHRoKSB8fCAoIXRoaXMuY291bnRlciAmJiAhRm91bmRhdGlvbi5Cb3guSW1Ob3RUb3VjaGluZ1lvdSh0aGlzLiRlbGVtZW50KSkpe1xuICAgICAgdGhpcy4kZWxlbWVudC5vZmZzZXQoRm91bmRhdGlvbi5Cb3guR2V0T2Zmc2V0cyh0aGlzLiRlbGVtZW50LCB0aGlzLiRhbmNob3IsICdjZW50ZXIgYm90dG9tJywgdGhpcy5vcHRpb25zLnZPZmZzZXQsIHRoaXMub3B0aW9ucy5oT2Zmc2V0LCB0cnVlKSkuY3NzKHtcbiAgICAgICAgJ3dpZHRoJzogJGVsZURpbXMud2luZG93RGltcy53aWR0aCAtICh0aGlzLm9wdGlvbnMuaE9mZnNldCAqIDIpLFxuICAgICAgICAnaGVpZ2h0JzogJ2F1dG8nXG4gICAgICB9KTtcbiAgICAgIHRoaXMuY2xhc3NDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB0aGlzLiRlbGVtZW50Lm9mZnNldChGb3VuZGF0aW9uLkJveC5HZXRPZmZzZXRzKHRoaXMuJGVsZW1lbnQsIHRoaXMuJGFuY2hvciwgcG9zaXRpb24sIHRoaXMub3B0aW9ucy52T2Zmc2V0LCB0aGlzLm9wdGlvbnMuaE9mZnNldCkpO1xuXG4gICAgd2hpbGUoIUZvdW5kYXRpb24uQm94LkltTm90VG91Y2hpbmdZb3UodGhpcy4kZWxlbWVudCwgZmFsc2UsIHRydWUpICYmIHRoaXMuY291bnRlcil7XG4gICAgICB0aGlzLl9yZXBvc2l0aW9uKHBvc2l0aW9uKTtcbiAgICAgIHRoaXMuX3NldFBvc2l0aW9uKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgZXZlbnQgbGlzdGVuZXJzIHRvIHRoZSBlbGVtZW50IHV0aWxpemluZyB0aGUgdHJpZ2dlcnMgdXRpbGl0eSBsaWJyYXJ5LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9ldmVudHMoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICB0aGlzLiRlbGVtZW50Lm9uKHtcbiAgICAgICdvcGVuLnpmLnRyaWdnZXInOiB0aGlzLm9wZW4uYmluZCh0aGlzKSxcbiAgICAgICdjbG9zZS56Zi50cmlnZ2VyJzogdGhpcy5jbG9zZS5iaW5kKHRoaXMpLFxuICAgICAgJ3RvZ2dsZS56Zi50cmlnZ2VyJzogdGhpcy50b2dnbGUuYmluZCh0aGlzKSxcbiAgICAgICdyZXNpemVtZS56Zi50cmlnZ2VyJzogdGhpcy5fc2V0UG9zaXRpb24uYmluZCh0aGlzKVxuICAgIH0pO1xuXG4gICAgaWYodGhpcy5vcHRpb25zLmhvdmVyKXtcbiAgICAgIHRoaXMuJGFuY2hvci5vZmYoJ21vdXNlZW50ZXIuemYuZHJvcGRvd24gbW91c2VsZWF2ZS56Zi5kcm9wZG93bicpXG4gICAgICAub24oJ21vdXNlZW50ZXIuemYuZHJvcGRvd24nLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgaWYoJCgnYm9keVtkYXRhLXdoYXRpbnB1dD1cIm1vdXNlXCJdJykuaXMoJyonKSkge1xuICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoX3RoaXMudGltZW91dCk7XG4gICAgICAgICAgICAgIF90aGlzLnRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgX3RoaXMub3BlbigpO1xuICAgICAgICAgICAgICAgIF90aGlzLiRhbmNob3IuZGF0YSgnaG92ZXInLCB0cnVlKTtcbiAgICAgICAgICAgICAgfSwgX3RoaXMub3B0aW9ucy5ob3ZlckRlbGF5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KS5vbignbW91c2VsZWF2ZS56Zi5kcm9wZG93bicsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQoX3RoaXMudGltZW91dCk7XG4gICAgICAgICAgICBfdGhpcy50aW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICBfdGhpcy5jbG9zZSgpO1xuICAgICAgICAgICAgICBfdGhpcy4kYW5jaG9yLmRhdGEoJ2hvdmVyJywgZmFsc2UpO1xuICAgICAgICAgICAgfSwgX3RoaXMub3B0aW9ucy5ob3ZlckRlbGF5KTtcbiAgICAgICAgICB9KTtcbiAgICAgIGlmKHRoaXMub3B0aW9ucy5ob3ZlclBhbmUpe1xuICAgICAgICB0aGlzLiRlbGVtZW50Lm9mZignbW91c2VlbnRlci56Zi5kcm9wZG93biBtb3VzZWxlYXZlLnpmLmRyb3Bkb3duJylcbiAgICAgICAgICAgIC5vbignbW91c2VlbnRlci56Zi5kcm9wZG93bicsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgIGNsZWFyVGltZW91dChfdGhpcy50aW1lb3V0KTtcbiAgICAgICAgICAgIH0pLm9uKCdtb3VzZWxlYXZlLnpmLmRyb3Bkb3duJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KF90aGlzLnRpbWVvdXQpO1xuICAgICAgICAgICAgICBfdGhpcy50aW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIF90aGlzLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgX3RoaXMuJGFuY2hvci5kYXRhKCdob3ZlcicsIGZhbHNlKTtcbiAgICAgICAgICAgICAgfSwgX3RoaXMub3B0aW9ucy5ob3ZlckRlbGF5KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLiRhbmNob3IuYWRkKHRoaXMuJGVsZW1lbnQpLm9uKCdrZXlkb3duLnpmLmRyb3Bkb3duJywgZnVuY3Rpb24oZSkge1xuXG4gICAgICB2YXIgJHRhcmdldCA9ICQodGhpcyksXG4gICAgICAgIHZpc2libGVGb2N1c2FibGVFbGVtZW50cyA9IEZvdW5kYXRpb24uS2V5Ym9hcmQuZmluZEZvY3VzYWJsZShfdGhpcy4kZWxlbWVudCk7XG5cbiAgICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQuaGFuZGxlS2V5KGUsICdEcm9wZG93bicsIHtcbiAgICAgICAgdGFiX2ZvcndhcmQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmIChfdGhpcy4kZWxlbWVudC5maW5kKCc6Zm9jdXMnKS5pcyh2aXNpYmxlRm9jdXNhYmxlRWxlbWVudHMuZXEoLTEpKSkgeyAvLyBsZWZ0IG1vZGFsIGRvd253YXJkcywgc2V0dGluZyBmb2N1cyB0byBmaXJzdCBlbGVtZW50XG4gICAgICAgICAgICBpZiAoX3RoaXMub3B0aW9ucy50cmFwRm9jdXMpIHsgLy8gaWYgZm9jdXMgc2hhbGwgYmUgdHJhcHBlZFxuICAgICAgICAgICAgICB2aXNpYmxlRm9jdXNhYmxlRWxlbWVudHMuZXEoMCkuZm9jdXMoKTtcbiAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgfSBlbHNlIHsgLy8gaWYgZm9jdXMgaXMgbm90IHRyYXBwZWQsIGNsb3NlIGRyb3Bkb3duIG9uIGZvY3VzIG91dFxuICAgICAgICAgICAgICBfdGhpcy5jbG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgdGFiX2JhY2t3YXJkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoX3RoaXMuJGVsZW1lbnQuZmluZCgnOmZvY3VzJykuaXModmlzaWJsZUZvY3VzYWJsZUVsZW1lbnRzLmVxKDApKSB8fCBfdGhpcy4kZWxlbWVudC5pcygnOmZvY3VzJykpIHsgLy8gbGVmdCBtb2RhbCB1cHdhcmRzLCBzZXR0aW5nIGZvY3VzIHRvIGxhc3QgZWxlbWVudFxuICAgICAgICAgICAgaWYgKF90aGlzLm9wdGlvbnMudHJhcEZvY3VzKSB7IC8vIGlmIGZvY3VzIHNoYWxsIGJlIHRyYXBwZWRcbiAgICAgICAgICAgICAgdmlzaWJsZUZvY3VzYWJsZUVsZW1lbnRzLmVxKC0xKS5mb2N1cygpO1xuICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB9IGVsc2UgeyAvLyBpZiBmb2N1cyBpcyBub3QgdHJhcHBlZCwgY2xvc2UgZHJvcGRvd24gb24gZm9jdXMgb3V0XG4gICAgICAgICAgICAgIF90aGlzLmNsb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBvcGVuOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoJHRhcmdldC5pcyhfdGhpcy4kYW5jaG9yKSkge1xuICAgICAgICAgICAgX3RoaXMub3BlbigpO1xuICAgICAgICAgICAgX3RoaXMuJGVsZW1lbnQuYXR0cigndGFiaW5kZXgnLCAtMSkuZm9jdXMoKTtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGNsb3NlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBfdGhpcy5jbG9zZSgpO1xuICAgICAgICAgIF90aGlzLiRhbmNob3IuZm9jdXMoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhbiBldmVudCBoYW5kbGVyIHRvIHRoZSBib2R5IHRvIGNsb3NlIGFueSBkcm9wZG93bnMgb24gYSBjbGljay5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfYWRkQm9keUhhbmRsZXIoKSB7XG4gICAgIHZhciAkYm9keSA9ICQoZG9jdW1lbnQuYm9keSkubm90KHRoaXMuJGVsZW1lbnQpLFxuICAgICAgICAgX3RoaXMgPSB0aGlzO1xuICAgICAkYm9keS5vZmYoJ2NsaWNrLnpmLmRyb3Bkb3duJylcbiAgICAgICAgICAub24oJ2NsaWNrLnpmLmRyb3Bkb3duJywgZnVuY3Rpb24oZSl7XG4gICAgICAgICAgICBpZihfdGhpcy4kYW5jaG9yLmlzKGUudGFyZ2V0KSB8fCBfdGhpcy4kYW5jaG9yLmZpbmQoZS50YXJnZXQpLmxlbmd0aCkge1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihfdGhpcy4kZWxlbWVudC5maW5kKGUudGFyZ2V0KS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgX3RoaXMuY2xvc2UoKTtcbiAgICAgICAgICAgICRib2R5Lm9mZignY2xpY2suemYuZHJvcGRvd24nKTtcbiAgICAgICAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPcGVucyB0aGUgZHJvcGRvd24gcGFuZSwgYW5kIGZpcmVzIGEgYnViYmxpbmcgZXZlbnQgdG8gY2xvc2Ugb3RoZXIgZHJvcGRvd25zLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQGZpcmVzIERyb3Bkb3duI2Nsb3NlbWVcbiAgICogQGZpcmVzIERyb3Bkb3duI3Nob3dcbiAgICovXG4gIG9wZW4oKSB7XG4gICAgLy8gdmFyIF90aGlzID0gdGhpcztcbiAgICAvKipcbiAgICAgKiBGaXJlcyB0byBjbG9zZSBvdGhlciBvcGVuIGRyb3Bkb3duc1xuICAgICAqIEBldmVudCBEcm9wZG93biNjbG9zZW1lXG4gICAgICovXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdjbG9zZW1lLnpmLmRyb3Bkb3duJywgdGhpcy4kZWxlbWVudC5hdHRyKCdpZCcpKTtcbiAgICB0aGlzLiRhbmNob3IuYWRkQ2xhc3MoJ2hvdmVyJylcbiAgICAgICAgLmF0dHIoeydhcmlhLWV4cGFuZGVkJzogdHJ1ZX0pO1xuICAgIC8vIHRoaXMuJGVsZW1lbnQvKi5zaG93KCkqLztcbiAgICB0aGlzLl9zZXRQb3NpdGlvbigpO1xuICAgIHRoaXMuJGVsZW1lbnQuYWRkQ2xhc3MoJ2lzLW9wZW4nKVxuICAgICAgICAuYXR0cih7J2FyaWEtaGlkZGVuJzogZmFsc2V9KTtcblxuICAgIGlmKHRoaXMub3B0aW9ucy5hdXRvRm9jdXMpe1xuICAgICAgdmFyICRmb2N1c2FibGUgPSBGb3VuZGF0aW9uLktleWJvYXJkLmZpbmRGb2N1c2FibGUodGhpcy4kZWxlbWVudCk7XG4gICAgICBpZigkZm9jdXNhYmxlLmxlbmd0aCl7XG4gICAgICAgICRmb2N1c2FibGUuZXEoMCkuZm9jdXMoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZih0aGlzLm9wdGlvbnMuY2xvc2VPbkNsaWNrKXsgdGhpcy5fYWRkQm9keUhhbmRsZXIoKTsgfVxuXG4gICAgLyoqXG4gICAgICogRmlyZXMgb25jZSB0aGUgZHJvcGRvd24gaXMgdmlzaWJsZS5cbiAgICAgKiBAZXZlbnQgRHJvcGRvd24jc2hvd1xuICAgICAqL1xuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignc2hvdy56Zi5kcm9wZG93bicsIFt0aGlzLiRlbGVtZW50XSk7XG4gIH1cblxuICAvKipcbiAgICogQ2xvc2VzIHRoZSBvcGVuIGRyb3Bkb3duIHBhbmUuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAZmlyZXMgRHJvcGRvd24jaGlkZVxuICAgKi9cbiAgY2xvc2UoKSB7XG4gICAgaWYoIXRoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ2lzLW9wZW4nKSl7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHRoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2lzLW9wZW4nKVxuICAgICAgICAuYXR0cih7J2FyaWEtaGlkZGVuJzogdHJ1ZX0pO1xuXG4gICAgdGhpcy4kYW5jaG9yLnJlbW92ZUNsYXNzKCdob3ZlcicpXG4gICAgICAgIC5hdHRyKCdhcmlhLWV4cGFuZGVkJywgZmFsc2UpO1xuXG4gICAgaWYodGhpcy5jbGFzc0NoYW5nZWQpe1xuICAgICAgdmFyIGN1clBvc2l0aW9uQ2xhc3MgPSB0aGlzLmdldFBvc2l0aW9uQ2xhc3MoKTtcbiAgICAgIGlmKGN1clBvc2l0aW9uQ2xhc3Mpe1xuICAgICAgICB0aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKGN1clBvc2l0aW9uQ2xhc3MpO1xuICAgICAgfVxuICAgICAgdGhpcy4kZWxlbWVudC5hZGRDbGFzcyh0aGlzLm9wdGlvbnMucG9zaXRpb25DbGFzcylcbiAgICAgICAgICAvKi5oaWRlKCkqLy5jc3Moe2hlaWdodDogJycsIHdpZHRoOiAnJ30pO1xuICAgICAgdGhpcy5jbGFzc0NoYW5nZWQgPSBmYWxzZTtcbiAgICAgIHRoaXMuY291bnRlciA9IDQ7XG4gICAgICB0aGlzLnVzZWRQb3NpdGlvbnMubGVuZ3RoID0gMDtcbiAgICB9XG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdoaWRlLnpmLmRyb3Bkb3duJywgW3RoaXMuJGVsZW1lbnRdKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUb2dnbGVzIHRoZSBkcm9wZG93biBwYW5lJ3MgdmlzaWJpbGl0eS5cbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICB0b2dnbGUoKSB7XG4gICAgaWYodGhpcy4kZWxlbWVudC5oYXNDbGFzcygnaXMtb3BlbicpKXtcbiAgICAgIGlmKHRoaXMuJGFuY2hvci5kYXRhKCdob3ZlcicpKSByZXR1cm47XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgfWVsc2V7XG4gICAgICB0aGlzLm9wZW4oKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgdGhlIGRyb3Bkb3duLlxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIGRlc3Ryb3koKSB7XG4gICAgdGhpcy4kZWxlbWVudC5vZmYoJy56Zi50cmlnZ2VyJykuaGlkZSgpO1xuICAgIHRoaXMuJGFuY2hvci5vZmYoJy56Zi5kcm9wZG93bicpO1xuXG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xuICB9XG59XG5cbkRyb3Bkb3duLmRlZmF1bHRzID0ge1xuICAvKipcbiAgICogQW1vdW50IG9mIHRpbWUgdG8gZGVsYXkgb3BlbmluZyBhIHN1Ym1lbnUgb24gaG92ZXIgZXZlbnQuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgMjUwXG4gICAqL1xuICBob3ZlckRlbGF5OiAyNTAsXG4gIC8qKlxuICAgKiBBbGxvdyBzdWJtZW51cyB0byBvcGVuIG9uIGhvdmVyIGV2ZW50c1xuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIGZhbHNlXG4gICAqL1xuICBob3ZlcjogZmFsc2UsXG4gIC8qKlxuICAgKiBEb24ndCBjbG9zZSBkcm9wZG93biB3aGVuIGhvdmVyaW5nIG92ZXIgZHJvcGRvd24gcGFuZVxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIHRydWVcbiAgICovXG4gIGhvdmVyUGFuZTogZmFsc2UsXG4gIC8qKlxuICAgKiBOdW1iZXIgb2YgcGl4ZWxzIGJldHdlZW4gdGhlIGRyb3Bkb3duIHBhbmUgYW5kIHRoZSB0cmlnZ2VyaW5nIGVsZW1lbnQgb24gb3Blbi5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAxXG4gICAqL1xuICB2T2Zmc2V0OiAxLFxuICAvKipcbiAgICogTnVtYmVyIG9mIHBpeGVscyBiZXR3ZWVuIHRoZSBkcm9wZG93biBwYW5lIGFuZCB0aGUgdHJpZ2dlcmluZyBlbGVtZW50IG9uIG9wZW4uXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgMVxuICAgKi9cbiAgaE9mZnNldDogMSxcbiAgLyoqXG4gICAqIENsYXNzIGFwcGxpZWQgdG8gYWRqdXN0IG9wZW4gcG9zaXRpb24uIEpTIHdpbGwgdGVzdCBhbmQgZmlsbCB0aGlzIGluLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlICd0b3AnXG4gICAqL1xuICBwb3NpdGlvbkNsYXNzOiAnJyxcbiAgLyoqXG4gICAqIEFsbG93IHRoZSBwbHVnaW4gdG8gdHJhcCBmb2N1cyB0byB0aGUgZHJvcGRvd24gcGFuZSBpZiBvcGVuZWQgd2l0aCBrZXlib2FyZCBjb21tYW5kcy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBmYWxzZVxuICAgKi9cbiAgdHJhcEZvY3VzOiBmYWxzZSxcbiAgLyoqXG4gICAqIEFsbG93IHRoZSBwbHVnaW4gdG8gc2V0IGZvY3VzIHRvIHRoZSBmaXJzdCBmb2N1c2FibGUgZWxlbWVudCB3aXRoaW4gdGhlIHBhbmUsIHJlZ2FyZGxlc3Mgb2YgbWV0aG9kIG9mIG9wZW5pbmcuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgdHJ1ZVxuICAgKi9cbiAgYXV0b0ZvY3VzOiBmYWxzZSxcbiAgLyoqXG4gICAqIEFsbG93cyBhIGNsaWNrIG9uIHRoZSBib2R5IHRvIGNsb3NlIHRoZSBkcm9wZG93bi5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBmYWxzZVxuICAgKi9cbiAgY2xvc2VPbkNsaWNrOiBmYWxzZVxufVxuXG4vLyBXaW5kb3cgZXhwb3J0c1xuRm91bmRhdGlvbi5wbHVnaW4oRHJvcGRvd24sICdEcm9wZG93bicpO1xuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbi8qKlxuICogRHJvcGRvd25NZW51IG1vZHVsZS5cbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5kcm9wZG93bi1tZW51XG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmtleWJvYXJkXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmJveFxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5uZXN0XG4gKi9cblxuY2xhc3MgRHJvcGRvd25NZW51IHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgRHJvcGRvd25NZW51LlxuICAgKiBAY2xhc3NcbiAgICogQGZpcmVzIERyb3Bkb3duTWVudSNpbml0XG4gICAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBtYWtlIGludG8gYSBkcm9wZG93biBtZW51LlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE92ZXJyaWRlcyB0byB0aGUgZGVmYXVsdCBwbHVnaW4gc2V0dGluZ3MuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIERyb3Bkb3duTWVudS5kZWZhdWx0cywgdGhpcy4kZWxlbWVudC5kYXRhKCksIG9wdGlvbnMpO1xuXG4gICAgRm91bmRhdGlvbi5OZXN0LkZlYXRoZXIodGhpcy4kZWxlbWVudCwgJ2Ryb3Bkb3duJyk7XG4gICAgdGhpcy5faW5pdCgpO1xuXG4gICAgRm91bmRhdGlvbi5yZWdpc3RlclBsdWdpbih0aGlzLCAnRHJvcGRvd25NZW51Jyk7XG4gICAgRm91bmRhdGlvbi5LZXlib2FyZC5yZWdpc3RlcignRHJvcGRvd25NZW51Jywge1xuICAgICAgJ0VOVEVSJzogJ29wZW4nLFxuICAgICAgJ1NQQUNFJzogJ29wZW4nLFxuICAgICAgJ0FSUk9XX1JJR0hUJzogJ25leHQnLFxuICAgICAgJ0FSUk9XX1VQJzogJ3VwJyxcbiAgICAgICdBUlJPV19ET1dOJzogJ2Rvd24nLFxuICAgICAgJ0FSUk9XX0xFRlQnOiAncHJldmlvdXMnLFxuICAgICAgJ0VTQ0FQRSc6ICdjbG9zZSdcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgcGx1Z2luLCBhbmQgY2FsbHMgX3ByZXBhcmVNZW51XG4gICAqIEBwcml2YXRlXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgX2luaXQoKSB7XG4gICAgdmFyIHN1YnMgPSB0aGlzLiRlbGVtZW50LmZpbmQoJ2xpLmlzLWRyb3Bkb3duLXN1Ym1lbnUtcGFyZW50Jyk7XG4gICAgdGhpcy4kZWxlbWVudC5jaGlsZHJlbignLmlzLWRyb3Bkb3duLXN1Ym1lbnUtcGFyZW50JykuY2hpbGRyZW4oJy5pcy1kcm9wZG93bi1zdWJtZW51JykuYWRkQ2xhc3MoJ2ZpcnN0LXN1YicpO1xuXG4gICAgdGhpcy4kbWVudUl0ZW1zID0gdGhpcy4kZWxlbWVudC5maW5kKCdbcm9sZT1cIm1lbnVpdGVtXCJdJyk7XG4gICAgdGhpcy4kdGFicyA9IHRoaXMuJGVsZW1lbnQuY2hpbGRyZW4oJ1tyb2xlPVwibWVudWl0ZW1cIl0nKTtcbiAgICB0aGlzLiR0YWJzLmZpbmQoJ3VsLmlzLWRyb3Bkb3duLXN1Ym1lbnUnKS5hZGRDbGFzcyh0aGlzLm9wdGlvbnMudmVydGljYWxDbGFzcyk7XG5cbiAgICBpZiAodGhpcy4kZWxlbWVudC5oYXNDbGFzcyh0aGlzLm9wdGlvbnMucmlnaHRDbGFzcykgfHwgdGhpcy5vcHRpb25zLmFsaWdubWVudCA9PT0gJ3JpZ2h0JyB8fCBGb3VuZGF0aW9uLnJ0bCgpIHx8IHRoaXMuJGVsZW1lbnQucGFyZW50cygnLnRvcC1iYXItcmlnaHQnKS5pcygnKicpKSB7XG4gICAgICB0aGlzLm9wdGlvbnMuYWxpZ25tZW50ID0gJ3JpZ2h0JztcbiAgICAgIHN1YnMuYWRkQ2xhc3MoJ29wZW5zLWxlZnQnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3Vicy5hZGRDbGFzcygnb3BlbnMtcmlnaHQnKTtcbiAgICB9XG4gICAgdGhpcy5jaGFuZ2VkID0gZmFsc2U7XG4gICAgdGhpcy5fZXZlbnRzKCk7XG4gIH07XG5cbiAgX2lzVmVydGljYWwoKSB7XG4gICAgcmV0dXJuIHRoaXMuJHRhYnMuY3NzKCdkaXNwbGF5JykgPT09ICdibG9jayc7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBldmVudCBsaXN0ZW5lcnMgdG8gZWxlbWVudHMgd2l0aGluIHRoZSBtZW51XG4gICAqIEBwcml2YXRlXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgX2V2ZW50cygpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzLFxuICAgICAgICBoYXNUb3VjaCA9ICdvbnRvdWNoc3RhcnQnIGluIHdpbmRvdyB8fCAodHlwZW9mIHdpbmRvdy5vbnRvdWNoc3RhcnQgIT09ICd1bmRlZmluZWQnKSxcbiAgICAgICAgcGFyQ2xhc3MgPSAnaXMtZHJvcGRvd24tc3VibWVudS1wYXJlbnQnO1xuXG4gICAgLy8gdXNlZCBmb3Igb25DbGljayBhbmQgaW4gdGhlIGtleWJvYXJkIGhhbmRsZXJzXG4gICAgdmFyIGhhbmRsZUNsaWNrRm4gPSBmdW5jdGlvbihlKSB7XG4gICAgICB2YXIgJGVsZW0gPSAkKGUudGFyZ2V0KS5wYXJlbnRzVW50aWwoJ3VsJywgYC4ke3BhckNsYXNzfWApLFxuICAgICAgICAgIGhhc1N1YiA9ICRlbGVtLmhhc0NsYXNzKHBhckNsYXNzKSxcbiAgICAgICAgICBoYXNDbGlja2VkID0gJGVsZW0uYXR0cignZGF0YS1pcy1jbGljaycpID09PSAndHJ1ZScsXG4gICAgICAgICAgJHN1YiA9ICRlbGVtLmNoaWxkcmVuKCcuaXMtZHJvcGRvd24tc3VibWVudScpO1xuXG4gICAgICBpZiAoaGFzU3ViKSB7XG4gICAgICAgIGlmIChoYXNDbGlja2VkKSB7XG4gICAgICAgICAgaWYgKCFfdGhpcy5vcHRpb25zLmNsb3NlT25DbGljayB8fCAoIV90aGlzLm9wdGlvbnMuY2xpY2tPcGVuICYmICFoYXNUb3VjaCkgfHwgKF90aGlzLm9wdGlvbnMuZm9yY2VGb2xsb3cgJiYgaGFzVG91Y2gpKSB7IHJldHVybjsgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIF90aGlzLl9oaWRlKCRlbGVtKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgX3RoaXMuX3Nob3coJHN1Yik7XG4gICAgICAgICAgJGVsZW0uYWRkKCRlbGVtLnBhcmVudHNVbnRpbChfdGhpcy4kZWxlbWVudCwgYC4ke3BhckNsYXNzfWApKS5hdHRyKCdkYXRhLWlzLWNsaWNrJywgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmKF90aGlzLm9wdGlvbnMuY2xvc2VPbkNsaWNrSW5zaWRlKXtcbiAgICAgICAgICBfdGhpcy5faGlkZSgkZWxlbSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmNsaWNrT3BlbiB8fCBoYXNUb3VjaCkge1xuICAgICAgdGhpcy4kbWVudUl0ZW1zLm9uKCdjbGljay56Zi5kcm9wZG93bm1lbnUgdG91Y2hzdGFydC56Zi5kcm9wZG93bm1lbnUnLCBoYW5kbGVDbGlja0ZuKTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMub3B0aW9ucy5kaXNhYmxlSG92ZXIpIHtcbiAgICAgIHRoaXMuJG1lbnVJdGVtcy5vbignbW91c2VlbnRlci56Zi5kcm9wZG93bm1lbnUnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIHZhciAkZWxlbSA9ICQodGhpcyksXG4gICAgICAgICAgICBoYXNTdWIgPSAkZWxlbS5oYXNDbGFzcyhwYXJDbGFzcyk7XG5cbiAgICAgICAgaWYgKGhhc1N1Yikge1xuICAgICAgICAgIGNsZWFyVGltZW91dChfdGhpcy5kZWxheSk7XG4gICAgICAgICAgX3RoaXMuZGVsYXkgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgX3RoaXMuX3Nob3coJGVsZW0uY2hpbGRyZW4oJy5pcy1kcm9wZG93bi1zdWJtZW51JykpO1xuICAgICAgICAgIH0sIF90aGlzLm9wdGlvbnMuaG92ZXJEZWxheSk7XG4gICAgICAgIH1cbiAgICAgIH0pLm9uKCdtb3VzZWxlYXZlLnpmLmRyb3Bkb3dubWVudScsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdmFyICRlbGVtID0gJCh0aGlzKSxcbiAgICAgICAgICAgIGhhc1N1YiA9ICRlbGVtLmhhc0NsYXNzKHBhckNsYXNzKTtcbiAgICAgICAgaWYgKGhhc1N1YiAmJiBfdGhpcy5vcHRpb25zLmF1dG9jbG9zZSkge1xuICAgICAgICAgIGlmICgkZWxlbS5hdHRyKCdkYXRhLWlzLWNsaWNrJykgPT09ICd0cnVlJyAmJiBfdGhpcy5vcHRpb25zLmNsaWNrT3BlbikgeyByZXR1cm4gZmFsc2U7IH1cblxuICAgICAgICAgIGNsZWFyVGltZW91dChfdGhpcy5kZWxheSk7XG4gICAgICAgICAgX3RoaXMuZGVsYXkgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgX3RoaXMuX2hpZGUoJGVsZW0pO1xuICAgICAgICAgIH0sIF90aGlzLm9wdGlvbnMuY2xvc2luZ1RpbWUpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gICAgdGhpcy4kbWVudUl0ZW1zLm9uKCdrZXlkb3duLnpmLmRyb3Bkb3dubWVudScsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIHZhciAkZWxlbWVudCA9ICQoZS50YXJnZXQpLnBhcmVudHNVbnRpbCgndWwnLCAnW3JvbGU9XCJtZW51aXRlbVwiXScpLFxuICAgICAgICAgIGlzVGFiID0gX3RoaXMuJHRhYnMuaW5kZXgoJGVsZW1lbnQpID4gLTEsXG4gICAgICAgICAgJGVsZW1lbnRzID0gaXNUYWIgPyBfdGhpcy4kdGFicyA6ICRlbGVtZW50LnNpYmxpbmdzKCdsaScpLmFkZCgkZWxlbWVudCksXG4gICAgICAgICAgJHByZXZFbGVtZW50LFxuICAgICAgICAgICRuZXh0RWxlbWVudDtcblxuICAgICAgJGVsZW1lbnRzLmVhY2goZnVuY3Rpb24oaSkge1xuICAgICAgICBpZiAoJCh0aGlzKS5pcygkZWxlbWVudCkpIHtcbiAgICAgICAgICAkcHJldkVsZW1lbnQgPSAkZWxlbWVudHMuZXEoaS0xKTtcbiAgICAgICAgICAkbmV4dEVsZW1lbnQgPSAkZWxlbWVudHMuZXEoaSsxKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICB2YXIgbmV4dFNpYmxpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCEkZWxlbWVudC5pcygnOmxhc3QtY2hpbGQnKSkge1xuICAgICAgICAgICRuZXh0RWxlbWVudC5jaGlsZHJlbignYTpmaXJzdCcpLmZvY3VzKCk7XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9XG4gICAgICB9LCBwcmV2U2libGluZyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAkcHJldkVsZW1lbnQuY2hpbGRyZW4oJ2E6Zmlyc3QnKS5mb2N1cygpO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB9LCBvcGVuU3ViID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkc3ViID0gJGVsZW1lbnQuY2hpbGRyZW4oJ3VsLmlzLWRyb3Bkb3duLXN1Ym1lbnUnKTtcbiAgICAgICAgaWYgKCRzdWIubGVuZ3RoKSB7XG4gICAgICAgICAgX3RoaXMuX3Nob3coJHN1Yik7XG4gICAgICAgICAgJGVsZW1lbnQuZmluZCgnbGkgPiBhOmZpcnN0JykuZm9jdXMoKTtcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH0gZWxzZSB7IHJldHVybjsgfVxuICAgICAgfSwgY2xvc2VTdWIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgLy9pZiAoJGVsZW1lbnQuaXMoJzpmaXJzdC1jaGlsZCcpKSB7XG4gICAgICAgIHZhciBjbG9zZSA9ICRlbGVtZW50LnBhcmVudCgndWwnKS5wYXJlbnQoJ2xpJyk7XG4gICAgICAgIGNsb3NlLmNoaWxkcmVuKCdhOmZpcnN0JykuZm9jdXMoKTtcbiAgICAgICAgX3RoaXMuX2hpZGUoY2xvc2UpO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIC8vfVxuICAgICAgfTtcbiAgICAgIHZhciBmdW5jdGlvbnMgPSB7XG4gICAgICAgIG9wZW46IG9wZW5TdWIsXG4gICAgICAgIGNsb3NlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBfdGhpcy5faGlkZShfdGhpcy4kZWxlbWVudCk7XG4gICAgICAgICAgX3RoaXMuJG1lbnVJdGVtcy5maW5kKCdhOmZpcnN0JykuZm9jdXMoKTsgLy8gZm9jdXMgdG8gZmlyc3QgZWxlbWVudFxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfSxcbiAgICAgICAgaGFuZGxlZDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgaWYgKGlzVGFiKSB7XG4gICAgICAgIGlmIChfdGhpcy5faXNWZXJ0aWNhbCgpKSB7IC8vIHZlcnRpY2FsIG1lbnVcbiAgICAgICAgICBpZiAoRm91bmRhdGlvbi5ydGwoKSkgeyAvLyByaWdodCBhbGlnbmVkXG4gICAgICAgICAgICAkLmV4dGVuZChmdW5jdGlvbnMsIHtcbiAgICAgICAgICAgICAgZG93bjogbmV4dFNpYmxpbmcsXG4gICAgICAgICAgICAgIHVwOiBwcmV2U2libGluZyxcbiAgICAgICAgICAgICAgbmV4dDogY2xvc2VTdWIsXG4gICAgICAgICAgICAgIHByZXZpb3VzOiBvcGVuU3ViXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2UgeyAvLyBsZWZ0IGFsaWduZWRcbiAgICAgICAgICAgICQuZXh0ZW5kKGZ1bmN0aW9ucywge1xuICAgICAgICAgICAgICBkb3duOiBuZXh0U2libGluZyxcbiAgICAgICAgICAgICAgdXA6IHByZXZTaWJsaW5nLFxuICAgICAgICAgICAgICBuZXh0OiBvcGVuU3ViLFxuICAgICAgICAgICAgICBwcmV2aW91czogY2xvc2VTdWJcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHsgLy8gaG9yaXpvbnRhbCBtZW51XG4gICAgICAgICAgaWYgKEZvdW5kYXRpb24ucnRsKCkpIHsgLy8gcmlnaHQgYWxpZ25lZFxuICAgICAgICAgICAgJC5leHRlbmQoZnVuY3Rpb25zLCB7XG4gICAgICAgICAgICAgIG5leHQ6IHByZXZTaWJsaW5nLFxuICAgICAgICAgICAgICBwcmV2aW91czogbmV4dFNpYmxpbmcsXG4gICAgICAgICAgICAgIGRvd246IG9wZW5TdWIsXG4gICAgICAgICAgICAgIHVwOiBjbG9zZVN1YlxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHsgLy8gbGVmdCBhbGlnbmVkXG4gICAgICAgICAgICAkLmV4dGVuZChmdW5jdGlvbnMsIHtcbiAgICAgICAgICAgICAgbmV4dDogbmV4dFNpYmxpbmcsXG4gICAgICAgICAgICAgIHByZXZpb3VzOiBwcmV2U2libGluZyxcbiAgICAgICAgICAgICAgZG93bjogb3BlblN1YixcbiAgICAgICAgICAgICAgdXA6IGNsb3NlU3ViXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7IC8vIG5vdCB0YWJzIC0+IG9uZSBzdWJcbiAgICAgICAgaWYgKEZvdW5kYXRpb24ucnRsKCkpIHsgLy8gcmlnaHQgYWxpZ25lZFxuICAgICAgICAgICQuZXh0ZW5kKGZ1bmN0aW9ucywge1xuICAgICAgICAgICAgbmV4dDogY2xvc2VTdWIsXG4gICAgICAgICAgICBwcmV2aW91czogb3BlblN1YixcbiAgICAgICAgICAgIGRvd246IG5leHRTaWJsaW5nLFxuICAgICAgICAgICAgdXA6IHByZXZTaWJsaW5nXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7IC8vIGxlZnQgYWxpZ25lZFxuICAgICAgICAgICQuZXh0ZW5kKGZ1bmN0aW9ucywge1xuICAgICAgICAgICAgbmV4dDogb3BlblN1YixcbiAgICAgICAgICAgIHByZXZpb3VzOiBjbG9zZVN1YixcbiAgICAgICAgICAgIGRvd246IG5leHRTaWJsaW5nLFxuICAgICAgICAgICAgdXA6IHByZXZTaWJsaW5nXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQuaGFuZGxlS2V5KGUsICdEcm9wZG93bk1lbnUnLCBmdW5jdGlvbnMpO1xuXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhbiBldmVudCBoYW5kbGVyIHRvIHRoZSBib2R5IHRvIGNsb3NlIGFueSBkcm9wZG93bnMgb24gYSBjbGljay5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfYWRkQm9keUhhbmRsZXIoKSB7XG4gICAgdmFyICRib2R5ID0gJChkb2N1bWVudC5ib2R5KSxcbiAgICAgICAgX3RoaXMgPSB0aGlzO1xuICAgICRib2R5Lm9mZignbW91c2V1cC56Zi5kcm9wZG93bm1lbnUgdG91Y2hlbmQuemYuZHJvcGRvd25tZW51JylcbiAgICAgICAgIC5vbignbW91c2V1cC56Zi5kcm9wZG93bm1lbnUgdG91Y2hlbmQuemYuZHJvcGRvd25tZW51JywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICB2YXIgJGxpbmsgPSBfdGhpcy4kZWxlbWVudC5maW5kKGUudGFyZ2V0KTtcbiAgICAgICAgICAgaWYgKCRsaW5rLmxlbmd0aCkgeyByZXR1cm47IH1cblxuICAgICAgICAgICBfdGhpcy5faGlkZSgpO1xuICAgICAgICAgICAkYm9keS5vZmYoJ21vdXNldXAuemYuZHJvcGRvd25tZW51IHRvdWNoZW5kLnpmLmRyb3Bkb3dubWVudScpO1xuICAgICAgICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogT3BlbnMgYSBkcm9wZG93biBwYW5lLCBhbmQgY2hlY2tzIGZvciBjb2xsaXNpb25zIGZpcnN0LlxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJHN1YiAtIHVsIGVsZW1lbnQgdGhhdCBpcyBhIHN1Ym1lbnUgdG8gc2hvd1xuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICogQGZpcmVzIERyb3Bkb3duTWVudSNzaG93XG4gICAqL1xuICBfc2hvdygkc3ViKSB7XG4gICAgdmFyIGlkeCA9IHRoaXMuJHRhYnMuaW5kZXgodGhpcy4kdGFicy5maWx0ZXIoZnVuY3Rpb24oaSwgZWwpIHtcbiAgICAgIHJldHVybiAkKGVsKS5maW5kKCRzdWIpLmxlbmd0aCA+IDA7XG4gICAgfSkpO1xuICAgIHZhciAkc2licyA9ICRzdWIucGFyZW50KCdsaS5pcy1kcm9wZG93bi1zdWJtZW51LXBhcmVudCcpLnNpYmxpbmdzKCdsaS5pcy1kcm9wZG93bi1zdWJtZW51LXBhcmVudCcpO1xuICAgIHRoaXMuX2hpZGUoJHNpYnMsIGlkeCk7XG4gICAgJHN1Yi5jc3MoJ3Zpc2liaWxpdHknLCAnaGlkZGVuJykuYWRkQ2xhc3MoJ2pzLWRyb3Bkb3duLWFjdGl2ZScpLmF0dHIoeydhcmlhLWhpZGRlbic6IGZhbHNlfSlcbiAgICAgICAgLnBhcmVudCgnbGkuaXMtZHJvcGRvd24tc3VibWVudS1wYXJlbnQnKS5hZGRDbGFzcygnaXMtYWN0aXZlJylcbiAgICAgICAgLmF0dHIoeydhcmlhLWV4cGFuZGVkJzogdHJ1ZX0pO1xuICAgIHZhciBjbGVhciA9IEZvdW5kYXRpb24uQm94LkltTm90VG91Y2hpbmdZb3UoJHN1YiwgbnVsbCwgdHJ1ZSk7XG4gICAgaWYgKCFjbGVhcikge1xuICAgICAgdmFyIG9sZENsYXNzID0gdGhpcy5vcHRpb25zLmFsaWdubWVudCA9PT0gJ2xlZnQnID8gJy1yaWdodCcgOiAnLWxlZnQnLFxuICAgICAgICAgICRwYXJlbnRMaSA9ICRzdWIucGFyZW50KCcuaXMtZHJvcGRvd24tc3VibWVudS1wYXJlbnQnKTtcbiAgICAgICRwYXJlbnRMaS5yZW1vdmVDbGFzcyhgb3BlbnMke29sZENsYXNzfWApLmFkZENsYXNzKGBvcGVucy0ke3RoaXMub3B0aW9ucy5hbGlnbm1lbnR9YCk7XG4gICAgICBjbGVhciA9IEZvdW5kYXRpb24uQm94LkltTm90VG91Y2hpbmdZb3UoJHN1YiwgbnVsbCwgdHJ1ZSk7XG4gICAgICBpZiAoIWNsZWFyKSB7XG4gICAgICAgICRwYXJlbnRMaS5yZW1vdmVDbGFzcyhgb3BlbnMtJHt0aGlzLm9wdGlvbnMuYWxpZ25tZW50fWApLmFkZENsYXNzKCdvcGVucy1pbm5lcicpO1xuICAgICAgfVxuICAgICAgdGhpcy5jaGFuZ2VkID0gdHJ1ZTtcbiAgICB9XG4gICAgJHN1Yi5jc3MoJ3Zpc2liaWxpdHknLCAnJyk7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5jbG9zZU9uQ2xpY2spIHsgdGhpcy5fYWRkQm9keUhhbmRsZXIoKTsgfVxuICAgIC8qKlxuICAgICAqIEZpcmVzIHdoZW4gdGhlIG5ldyBkcm9wZG93biBwYW5lIGlzIHZpc2libGUuXG4gICAgICogQGV2ZW50IERyb3Bkb3duTWVudSNzaG93XG4gICAgICovXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdzaG93LnpmLmRyb3Bkb3dubWVudScsIFskc3ViXSk7XG4gIH1cblxuICAvKipcbiAgICogSGlkZXMgYSBzaW5nbGUsIGN1cnJlbnRseSBvcGVuIGRyb3Bkb3duIHBhbmUsIGlmIHBhc3NlZCBhIHBhcmFtZXRlciwgb3RoZXJ3aXNlLCBoaWRlcyBldmVyeXRoaW5nLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHBhcmFtIHtqUXVlcnl9ICRlbGVtIC0gZWxlbWVudCB3aXRoIGEgc3VibWVudSB0byBoaWRlXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBpZHggLSBpbmRleCBvZiB0aGUgJHRhYnMgY29sbGVjdGlvbiB0byBoaWRlXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaGlkZSgkZWxlbSwgaWR4KSB7XG4gICAgdmFyICR0b0Nsb3NlO1xuICAgIGlmICgkZWxlbSAmJiAkZWxlbS5sZW5ndGgpIHtcbiAgICAgICR0b0Nsb3NlID0gJGVsZW07XG4gICAgfSBlbHNlIGlmIChpZHggIT09IHVuZGVmaW5lZCkge1xuICAgICAgJHRvQ2xvc2UgPSB0aGlzLiR0YWJzLm5vdChmdW5jdGlvbihpLCBlbCkge1xuICAgICAgICByZXR1cm4gaSA9PT0gaWR4O1xuICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgJHRvQ2xvc2UgPSB0aGlzLiRlbGVtZW50O1xuICAgIH1cbiAgICB2YXIgc29tZXRoaW5nVG9DbG9zZSA9ICR0b0Nsb3NlLmhhc0NsYXNzKCdpcy1hY3RpdmUnKSB8fCAkdG9DbG9zZS5maW5kKCcuaXMtYWN0aXZlJykubGVuZ3RoID4gMDtcblxuICAgIGlmIChzb21ldGhpbmdUb0Nsb3NlKSB7XG4gICAgICAkdG9DbG9zZS5maW5kKCdsaS5pcy1hY3RpdmUnKS5hZGQoJHRvQ2xvc2UpLmF0dHIoe1xuICAgICAgICAnYXJpYS1leHBhbmRlZCc6IGZhbHNlLFxuICAgICAgICAnZGF0YS1pcy1jbGljayc6IGZhbHNlXG4gICAgICB9KS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XG5cbiAgICAgICR0b0Nsb3NlLmZpbmQoJ3VsLmpzLWRyb3Bkb3duLWFjdGl2ZScpLmF0dHIoe1xuICAgICAgICAnYXJpYS1oaWRkZW4nOiB0cnVlXG4gICAgICB9KS5yZW1vdmVDbGFzcygnanMtZHJvcGRvd24tYWN0aXZlJyk7XG5cbiAgICAgIGlmICh0aGlzLmNoYW5nZWQgfHwgJHRvQ2xvc2UuZmluZCgnb3BlbnMtaW5uZXInKS5sZW5ndGgpIHtcbiAgICAgICAgdmFyIG9sZENsYXNzID0gdGhpcy5vcHRpb25zLmFsaWdubWVudCA9PT0gJ2xlZnQnID8gJ3JpZ2h0JyA6ICdsZWZ0JztcbiAgICAgICAgJHRvQ2xvc2UuZmluZCgnbGkuaXMtZHJvcGRvd24tc3VibWVudS1wYXJlbnQnKS5hZGQoJHRvQ2xvc2UpXG4gICAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKGBvcGVucy1pbm5lciBvcGVucy0ke3RoaXMub3B0aW9ucy5hbGlnbm1lbnR9YClcbiAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoYG9wZW5zLSR7b2xkQ2xhc3N9YCk7XG4gICAgICAgIHRoaXMuY2hhbmdlZCA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgLyoqXG4gICAgICAgKiBGaXJlcyB3aGVuIHRoZSBvcGVuIG1lbnVzIGFyZSBjbG9zZWQuXG4gICAgICAgKiBAZXZlbnQgRHJvcGRvd25NZW51I2hpZGVcbiAgICAgICAqL1xuICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdoaWRlLnpmLmRyb3Bkb3dubWVudScsIFskdG9DbG9zZV0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBEZXN0cm95cyB0aGUgcGx1Z2luLlxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIGRlc3Ryb3koKSB7XG4gICAgdGhpcy4kbWVudUl0ZW1zLm9mZignLnpmLmRyb3Bkb3dubWVudScpLnJlbW92ZUF0dHIoJ2RhdGEtaXMtY2xpY2snKVxuICAgICAgICAucmVtb3ZlQ2xhc3MoJ2lzLXJpZ2h0LWFycm93IGlzLWxlZnQtYXJyb3cgaXMtZG93bi1hcnJvdyBvcGVucy1yaWdodCBvcGVucy1sZWZ0IG9wZW5zLWlubmVyJyk7XG4gICAgJChkb2N1bWVudC5ib2R5KS5vZmYoJy56Zi5kcm9wZG93bm1lbnUnKTtcbiAgICBGb3VuZGF0aW9uLk5lc3QuQnVybih0aGlzLiRlbGVtZW50LCAnZHJvcGRvd24nKTtcbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XG4gIH1cbn1cblxuLyoqXG4gKiBEZWZhdWx0IHNldHRpbmdzIGZvciBwbHVnaW5cbiAqL1xuRHJvcGRvd25NZW51LmRlZmF1bHRzID0ge1xuICAvKipcbiAgICogRGlzYWxsb3dzIGhvdmVyIGV2ZW50cyBmcm9tIG9wZW5pbmcgc3VibWVudXNcbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBmYWxzZVxuICAgKi9cbiAgZGlzYWJsZUhvdmVyOiBmYWxzZSxcbiAgLyoqXG4gICAqIEFsbG93IGEgc3VibWVudSB0byBhdXRvbWF0aWNhbGx5IGNsb3NlIG9uIGEgbW91c2VsZWF2ZSBldmVudCwgaWYgbm90IGNsaWNrZWQgb3Blbi5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSB0cnVlXG4gICAqL1xuICBhdXRvY2xvc2U6IHRydWUsXG4gIC8qKlxuICAgKiBBbW91bnQgb2YgdGltZSB0byBkZWxheSBvcGVuaW5nIGEgc3VibWVudSBvbiBob3ZlciBldmVudC5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSA1MFxuICAgKi9cbiAgaG92ZXJEZWxheTogNTAsXG4gIC8qKlxuICAgKiBBbGxvdyBhIHN1Ym1lbnUgdG8gb3Blbi9yZW1haW4gb3BlbiBvbiBwYXJlbnQgY2xpY2sgZXZlbnQuIEFsbG93cyBjdXJzb3IgdG8gbW92ZSBhd2F5IGZyb20gbWVudS5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSB0cnVlXG4gICAqL1xuICBjbGlja09wZW46IGZhbHNlLFxuICAvKipcbiAgICogQW1vdW50IG9mIHRpbWUgdG8gZGVsYXkgY2xvc2luZyBhIHN1Ym1lbnUgb24gYSBtb3VzZWxlYXZlIGV2ZW50LlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIDUwMFxuICAgKi9cblxuICBjbG9zaW5nVGltZTogNTAwLFxuICAvKipcbiAgICogUG9zaXRpb24gb2YgdGhlIG1lbnUgcmVsYXRpdmUgdG8gd2hhdCBkaXJlY3Rpb24gdGhlIHN1Ym1lbnVzIHNob3VsZCBvcGVuLiBIYW5kbGVkIGJ5IEpTLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlICdsZWZ0J1xuICAgKi9cbiAgYWxpZ25tZW50OiAnbGVmdCcsXG4gIC8qKlxuICAgKiBBbGxvdyBjbGlja3Mgb24gdGhlIGJvZHkgdG8gY2xvc2UgYW55IG9wZW4gc3VibWVudXMuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgdHJ1ZVxuICAgKi9cbiAgY2xvc2VPbkNsaWNrOiB0cnVlLFxuICAvKipcbiAgICogQWxsb3cgY2xpY2tzIG9uIGxlYWYgYW5jaG9yIGxpbmtzIHRvIGNsb3NlIGFueSBvcGVuIHN1Ym1lbnVzLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIHRydWVcbiAgICovXG4gIGNsb3NlT25DbGlja0luc2lkZTogdHJ1ZSxcbiAgLyoqXG4gICAqIENsYXNzIGFwcGxpZWQgdG8gdmVydGljYWwgb3JpZW50ZWQgbWVudXMsIEZvdW5kYXRpb24gZGVmYXVsdCBpcyBgdmVydGljYWxgLiBVcGRhdGUgdGhpcyBpZiB1c2luZyB5b3VyIG93biBjbGFzcy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAndmVydGljYWwnXG4gICAqL1xuICB2ZXJ0aWNhbENsYXNzOiAndmVydGljYWwnLFxuICAvKipcbiAgICogQ2xhc3MgYXBwbGllZCB0byByaWdodC1zaWRlIG9yaWVudGVkIG1lbnVzLCBGb3VuZGF0aW9uIGRlZmF1bHQgaXMgYGFsaWduLXJpZ2h0YC4gVXBkYXRlIHRoaXMgaWYgdXNpbmcgeW91ciBvd24gY2xhc3MuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgJ2FsaWduLXJpZ2h0J1xuICAgKi9cbiAgcmlnaHRDbGFzczogJ2FsaWduLXJpZ2h0JyxcbiAgLyoqXG4gICAqIEJvb2xlYW4gdG8gZm9yY2Ugb3ZlcmlkZSB0aGUgY2xpY2tpbmcgb2YgbGlua3MgdG8gcGVyZm9ybSBkZWZhdWx0IGFjdGlvbiwgb24gc2Vjb25kIHRvdWNoIGV2ZW50IGZvciBtb2JpbGUuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgZmFsc2VcbiAgICovXG4gIGZvcmNlRm9sbG93OiB0cnVlXG59O1xuXG4vLyBXaW5kb3cgZXhwb3J0c1xuRm91bmRhdGlvbi5wbHVnaW4oRHJvcGRvd25NZW51LCAnRHJvcGRvd25NZW51Jyk7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLyoqXG4gKiBFcXVhbGl6ZXIgbW9kdWxlLlxuICogQG1vZHVsZSBmb3VuZGF0aW9uLmVxdWFsaXplclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5tZWRpYVF1ZXJ5XG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLnRpbWVyQW5kSW1hZ2VMb2FkZXIgaWYgZXF1YWxpemVyIGNvbnRhaW5zIGltYWdlc1xuICovXG5cbmNsYXNzIEVxdWFsaXplciB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIEVxdWFsaXplci5cbiAgICogQGNsYXNzXG4gICAqIEBmaXJlcyBFcXVhbGl6ZXIjaW5pdFxuICAgKiBAcGFyYW0ge09iamVjdH0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gYWRkIHRoZSB0cmlnZ2VyIHRvLlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE92ZXJyaWRlcyB0byB0aGUgZGVmYXVsdCBwbHVnaW4gc2V0dGluZ3MuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKXtcbiAgICB0aGlzLiRlbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLm9wdGlvbnMgID0gJC5leHRlbmQoe30sIEVxdWFsaXplci5kZWZhdWx0cywgdGhpcy4kZWxlbWVudC5kYXRhKCksIG9wdGlvbnMpO1xuXG4gICAgdGhpcy5faW5pdCgpO1xuXG4gICAgRm91bmRhdGlvbi5yZWdpc3RlclBsdWdpbih0aGlzLCAnRXF1YWxpemVyJyk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIEVxdWFsaXplciBwbHVnaW4gYW5kIGNhbGxzIGZ1bmN0aW9ucyB0byBnZXQgZXF1YWxpemVyIGZ1bmN0aW9uaW5nIG9uIGxvYWQuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaW5pdCgpIHtcbiAgICB2YXIgZXFJZCA9IHRoaXMuJGVsZW1lbnQuYXR0cignZGF0YS1lcXVhbGl6ZXInKSB8fCAnJztcbiAgICB2YXIgJHdhdGNoZWQgPSB0aGlzLiRlbGVtZW50LmZpbmQoYFtkYXRhLWVxdWFsaXplci13YXRjaD1cIiR7ZXFJZH1cIl1gKTtcblxuICAgIHRoaXMuJHdhdGNoZWQgPSAkd2F0Y2hlZC5sZW5ndGggPyAkd2F0Y2hlZCA6IHRoaXMuJGVsZW1lbnQuZmluZCgnW2RhdGEtZXF1YWxpemVyLXdhdGNoXScpO1xuICAgIHRoaXMuJGVsZW1lbnQuYXR0cignZGF0YS1yZXNpemUnLCAoZXFJZCB8fCBGb3VuZGF0aW9uLkdldFlvRGlnaXRzKDYsICdlcScpKSk7XG5cbiAgICB0aGlzLmhhc05lc3RlZCA9IHRoaXMuJGVsZW1lbnQuZmluZCgnW2RhdGEtZXF1YWxpemVyXScpLmxlbmd0aCA+IDA7XG4gICAgdGhpcy5pc05lc3RlZCA9IHRoaXMuJGVsZW1lbnQucGFyZW50c1VudGlsKGRvY3VtZW50LmJvZHksICdbZGF0YS1lcXVhbGl6ZXJdJykubGVuZ3RoID4gMDtcbiAgICB0aGlzLmlzT24gPSBmYWxzZTtcbiAgICB0aGlzLl9iaW5kSGFuZGxlciA9IHtcbiAgICAgIG9uUmVzaXplTWVCb3VuZDogdGhpcy5fb25SZXNpemVNZS5iaW5kKHRoaXMpLFxuICAgICAgb25Qb3N0RXF1YWxpemVkQm91bmQ6IHRoaXMuX29uUG9zdEVxdWFsaXplZC5iaW5kKHRoaXMpXG4gICAgfTtcblxuICAgIHZhciBpbWdzID0gdGhpcy4kZWxlbWVudC5maW5kKCdpbWcnKTtcbiAgICB2YXIgdG9vU21hbGw7XG4gICAgaWYodGhpcy5vcHRpb25zLmVxdWFsaXplT24pe1xuICAgICAgdG9vU21hbGwgPSB0aGlzLl9jaGVja01RKCk7XG4gICAgICAkKHdpbmRvdykub24oJ2NoYW5nZWQuemYubWVkaWFxdWVyeScsIHRoaXMuX2NoZWNrTVEuYmluZCh0aGlzKSk7XG4gICAgfWVsc2V7XG4gICAgICB0aGlzLl9ldmVudHMoKTtcbiAgICB9XG4gICAgaWYoKHRvb1NtYWxsICE9PSB1bmRlZmluZWQgJiYgdG9vU21hbGwgPT09IGZhbHNlKSB8fCB0b29TbWFsbCA9PT0gdW5kZWZpbmVkKXtcbiAgICAgIGlmKGltZ3MubGVuZ3RoKXtcbiAgICAgICAgRm91bmRhdGlvbi5vbkltYWdlc0xvYWRlZChpbWdzLCB0aGlzLl9yZWZsb3cuYmluZCh0aGlzKSk7XG4gICAgICB9ZWxzZXtcbiAgICAgICAgdGhpcy5fcmVmbG93KCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgZXZlbnQgbGlzdGVuZXJzIGlmIHRoZSBicmVha3BvaW50IGlzIHRvbyBzbWFsbC5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9wYXVzZUV2ZW50cygpIHtcbiAgICB0aGlzLmlzT24gPSBmYWxzZTtcbiAgICB0aGlzLiRlbGVtZW50Lm9mZih7XG4gICAgICAnLnpmLmVxdWFsaXplcic6IHRoaXMuX2JpbmRIYW5kbGVyLm9uUG9zdEVxdWFsaXplZEJvdW5kLFxuICAgICAgJ3Jlc2l6ZW1lLnpmLnRyaWdnZXInOiB0aGlzLl9iaW5kSGFuZGxlci5vblJlc2l6ZU1lQm91bmRcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBmdW5jdGlvbiB0byBoYW5kbGUgJGVsZW1lbnRzIHJlc2l6ZW1lLnpmLnRyaWdnZXIsIHdpdGggYm91bmQgdGhpcyBvbiBfYmluZEhhbmRsZXIub25SZXNpemVNZUJvdW5kXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfb25SZXNpemVNZShlKSB7XG4gICAgdGhpcy5fcmVmbG93KCk7XG4gIH1cblxuICAvKipcbiAgICogZnVuY3Rpb24gdG8gaGFuZGxlICRlbGVtZW50cyBwb3N0ZXF1YWxpemVkLnpmLmVxdWFsaXplciwgd2l0aCBib3VuZCB0aGlzIG9uIF9iaW5kSGFuZGxlci5vblBvc3RFcXVhbGl6ZWRCb3VuZFxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX29uUG9zdEVxdWFsaXplZChlKSB7XG4gICAgaWYoZS50YXJnZXQgIT09IHRoaXMuJGVsZW1lbnRbMF0peyB0aGlzLl9yZWZsb3coKTsgfVxuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIGV2ZW50cyBmb3IgRXF1YWxpemVyLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2V2ZW50cygpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIHRoaXMuX3BhdXNlRXZlbnRzKCk7XG4gICAgaWYodGhpcy5oYXNOZXN0ZWQpe1xuICAgICAgdGhpcy4kZWxlbWVudC5vbigncG9zdGVxdWFsaXplZC56Zi5lcXVhbGl6ZXInLCB0aGlzLl9iaW5kSGFuZGxlci5vblBvc3RFcXVhbGl6ZWRCb3VuZCk7XG4gICAgfWVsc2V7XG4gICAgICB0aGlzLiRlbGVtZW50Lm9uKCdyZXNpemVtZS56Zi50cmlnZ2VyJywgdGhpcy5fYmluZEhhbmRsZXIub25SZXNpemVNZUJvdW5kKTtcbiAgICB9XG4gICAgdGhpcy5pc09uID0gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgdGhlIGN1cnJlbnQgYnJlYWtwb2ludCB0byB0aGUgbWluaW11bSByZXF1aXJlZCBzaXplLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2NoZWNrTVEoKSB7XG4gICAgdmFyIHRvb1NtYWxsID0gIUZvdW5kYXRpb24uTWVkaWFRdWVyeS5hdExlYXN0KHRoaXMub3B0aW9ucy5lcXVhbGl6ZU9uKTtcbiAgICBpZih0b29TbWFsbCl7XG4gICAgICBpZih0aGlzLmlzT24pe1xuICAgICAgICB0aGlzLl9wYXVzZUV2ZW50cygpO1xuICAgICAgICB0aGlzLiR3YXRjaGVkLmNzcygnaGVpZ2h0JywgJ2F1dG8nKTtcbiAgICAgIH1cbiAgICB9ZWxzZXtcbiAgICAgIGlmKCF0aGlzLmlzT24pe1xuICAgICAgICB0aGlzLl9ldmVudHMoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRvb1NtYWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgbm9vcCB2ZXJzaW9uIGZvciB0aGUgcGx1Z2luXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfa2lsbHN3aXRjaCgpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICAvKipcbiAgICogQ2FsbHMgbmVjZXNzYXJ5IGZ1bmN0aW9ucyB0byB1cGRhdGUgRXF1YWxpemVyIHVwb24gRE9NIGNoYW5nZVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3JlZmxvdygpIHtcbiAgICBpZighdGhpcy5vcHRpb25zLmVxdWFsaXplT25TdGFjayl7XG4gICAgICBpZih0aGlzLl9pc1N0YWNrZWQoKSl7XG4gICAgICAgIHRoaXMuJHdhdGNoZWQuY3NzKCdoZWlnaHQnLCAnYXV0bycpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0aGlzLm9wdGlvbnMuZXF1YWxpemVCeVJvdykge1xuICAgICAgdGhpcy5nZXRIZWlnaHRzQnlSb3codGhpcy5hcHBseUhlaWdodEJ5Um93LmJpbmQodGhpcykpO1xuICAgIH1lbHNle1xuICAgICAgdGhpcy5nZXRIZWlnaHRzKHRoaXMuYXBwbHlIZWlnaHQuYmluZCh0aGlzKSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIE1hbnVhbGx5IGRldGVybWluZXMgaWYgdGhlIGZpcnN0IDIgZWxlbWVudHMgYXJlICpOT1QqIHN0YWNrZWQuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaXNTdGFja2VkKCkge1xuICAgIHJldHVybiB0aGlzLiR3YXRjaGVkWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcCAhPT0gdGhpcy4kd2F0Y2hlZFsxXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3A7XG4gIH1cblxuICAvKipcbiAgICogRmluZHMgdGhlIG91dGVyIGhlaWdodHMgb2YgY2hpbGRyZW4gY29udGFpbmVkIHdpdGhpbiBhbiBFcXVhbGl6ZXIgcGFyZW50IGFuZCByZXR1cm5zIHRoZW0gaW4gYW4gYXJyYXlcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgLSBBIG5vbi1vcHRpb25hbCBjYWxsYmFjayB0byByZXR1cm4gdGhlIGhlaWdodHMgYXJyYXkgdG8uXG4gICAqIEByZXR1cm5zIHtBcnJheX0gaGVpZ2h0cyAtIEFuIGFycmF5IG9mIGhlaWdodHMgb2YgY2hpbGRyZW4gd2l0aGluIEVxdWFsaXplciBjb250YWluZXJcbiAgICovXG4gIGdldEhlaWdodHMoY2IpIHtcbiAgICB2YXIgaGVpZ2h0cyA9IFtdO1xuICAgIGZvcih2YXIgaSA9IDAsIGxlbiA9IHRoaXMuJHdhdGNoZWQubGVuZ3RoOyBpIDwgbGVuOyBpKyspe1xuICAgICAgdGhpcy4kd2F0Y2hlZFtpXS5zdHlsZS5oZWlnaHQgPSAnYXV0byc7XG4gICAgICBoZWlnaHRzLnB1c2godGhpcy4kd2F0Y2hlZFtpXS5vZmZzZXRIZWlnaHQpO1xuICAgIH1cbiAgICBjYihoZWlnaHRzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGaW5kcyB0aGUgb3V0ZXIgaGVpZ2h0cyBvZiBjaGlsZHJlbiBjb250YWluZWQgd2l0aGluIGFuIEVxdWFsaXplciBwYXJlbnQgYW5kIHJldHVybnMgdGhlbSBpbiBhbiBhcnJheVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYiAtIEEgbm9uLW9wdGlvbmFsIGNhbGxiYWNrIHRvIHJldHVybiB0aGUgaGVpZ2h0cyBhcnJheSB0by5cbiAgICogQHJldHVybnMge0FycmF5fSBncm91cHMgLSBBbiBhcnJheSBvZiBoZWlnaHRzIG9mIGNoaWxkcmVuIHdpdGhpbiBFcXVhbGl6ZXIgY29udGFpbmVyIGdyb3VwZWQgYnkgcm93IHdpdGggZWxlbWVudCxoZWlnaHQgYW5kIG1heCBhcyBsYXN0IGNoaWxkXG4gICAqL1xuICBnZXRIZWlnaHRzQnlSb3coY2IpIHtcbiAgICB2YXIgbGFzdEVsVG9wT2Zmc2V0ID0gKHRoaXMuJHdhdGNoZWQubGVuZ3RoID8gdGhpcy4kd2F0Y2hlZC5maXJzdCgpLm9mZnNldCgpLnRvcCA6IDApLFxuICAgICAgICBncm91cHMgPSBbXSxcbiAgICAgICAgZ3JvdXAgPSAwO1xuICAgIC8vZ3JvdXAgYnkgUm93XG4gICAgZ3JvdXBzW2dyb3VwXSA9IFtdO1xuICAgIGZvcih2YXIgaSA9IDAsIGxlbiA9IHRoaXMuJHdhdGNoZWQubGVuZ3RoOyBpIDwgbGVuOyBpKyspe1xuICAgICAgdGhpcy4kd2F0Y2hlZFtpXS5zdHlsZS5oZWlnaHQgPSAnYXV0byc7XG4gICAgICAvL21heWJlIGNvdWxkIHVzZSB0aGlzLiR3YXRjaGVkW2ldLm9mZnNldFRvcFxuICAgICAgdmFyIGVsT2Zmc2V0VG9wID0gJCh0aGlzLiR3YXRjaGVkW2ldKS5vZmZzZXQoKS50b3A7XG4gICAgICBpZiAoZWxPZmZzZXRUb3AhPWxhc3RFbFRvcE9mZnNldCkge1xuICAgICAgICBncm91cCsrO1xuICAgICAgICBncm91cHNbZ3JvdXBdID0gW107XG4gICAgICAgIGxhc3RFbFRvcE9mZnNldD1lbE9mZnNldFRvcDtcbiAgICAgIH1cbiAgICAgIGdyb3Vwc1tncm91cF0ucHVzaChbdGhpcy4kd2F0Y2hlZFtpXSx0aGlzLiR3YXRjaGVkW2ldLm9mZnNldEhlaWdodF0pO1xuICAgIH1cblxuICAgIGZvciAodmFyIGogPSAwLCBsbiA9IGdyb3Vwcy5sZW5ndGg7IGogPCBsbjsgaisrKSB7XG4gICAgICB2YXIgaGVpZ2h0cyA9ICQoZ3JvdXBzW2pdKS5tYXAoZnVuY3Rpb24oKXsgcmV0dXJuIHRoaXNbMV07IH0pLmdldCgpO1xuICAgICAgdmFyIG1heCAgICAgICAgID0gTWF0aC5tYXguYXBwbHkobnVsbCwgaGVpZ2h0cyk7XG4gICAgICBncm91cHNbal0ucHVzaChtYXgpO1xuICAgIH1cbiAgICBjYihncm91cHMpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoYW5nZXMgdGhlIENTUyBoZWlnaHQgcHJvcGVydHkgb2YgZWFjaCBjaGlsZCBpbiBhbiBFcXVhbGl6ZXIgcGFyZW50IHRvIG1hdGNoIHRoZSB0YWxsZXN0XG4gICAqIEBwYXJhbSB7YXJyYXl9IGhlaWdodHMgLSBBbiBhcnJheSBvZiBoZWlnaHRzIG9mIGNoaWxkcmVuIHdpdGhpbiBFcXVhbGl6ZXIgY29udGFpbmVyXG4gICAqIEBmaXJlcyBFcXVhbGl6ZXIjcHJlZXF1YWxpemVkXG4gICAqIEBmaXJlcyBFcXVhbGl6ZXIjcG9zdGVxdWFsaXplZFxuICAgKi9cbiAgYXBwbHlIZWlnaHQoaGVpZ2h0cykge1xuICAgIHZhciBtYXggPSBNYXRoLm1heC5hcHBseShudWxsLCBoZWlnaHRzKTtcbiAgICAvKipcbiAgICAgKiBGaXJlcyBiZWZvcmUgdGhlIGhlaWdodHMgYXJlIGFwcGxpZWRcbiAgICAgKiBAZXZlbnQgRXF1YWxpemVyI3ByZWVxdWFsaXplZFxuICAgICAqL1xuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcigncHJlZXF1YWxpemVkLnpmLmVxdWFsaXplcicpO1xuXG4gICAgdGhpcy4kd2F0Y2hlZC5jc3MoJ2hlaWdodCcsIG1heCk7XG5cbiAgICAvKipcbiAgICAgKiBGaXJlcyB3aGVuIHRoZSBoZWlnaHRzIGhhdmUgYmVlbiBhcHBsaWVkXG4gICAgICogQGV2ZW50IEVxdWFsaXplciNwb3N0ZXF1YWxpemVkXG4gICAgICovXG4gICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcigncG9zdGVxdWFsaXplZC56Zi5lcXVhbGl6ZXInKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGFuZ2VzIHRoZSBDU1MgaGVpZ2h0IHByb3BlcnR5IG9mIGVhY2ggY2hpbGQgaW4gYW4gRXF1YWxpemVyIHBhcmVudCB0byBtYXRjaCB0aGUgdGFsbGVzdCBieSByb3dcbiAgICogQHBhcmFtIHthcnJheX0gZ3JvdXBzIC0gQW4gYXJyYXkgb2YgaGVpZ2h0cyBvZiBjaGlsZHJlbiB3aXRoaW4gRXF1YWxpemVyIGNvbnRhaW5lciBncm91cGVkIGJ5IHJvdyB3aXRoIGVsZW1lbnQsaGVpZ2h0IGFuZCBtYXggYXMgbGFzdCBjaGlsZFxuICAgKiBAZmlyZXMgRXF1YWxpemVyI3ByZWVxdWFsaXplZFxuICAgKiBAZmlyZXMgRXF1YWxpemVyI3ByZWVxdWFsaXplZFJvd1xuICAgKiBAZmlyZXMgRXF1YWxpemVyI3Bvc3RlcXVhbGl6ZWRSb3dcbiAgICogQGZpcmVzIEVxdWFsaXplciNwb3N0ZXF1YWxpemVkXG4gICAqL1xuICBhcHBseUhlaWdodEJ5Um93KGdyb3Vwcykge1xuICAgIC8qKlxuICAgICAqIEZpcmVzIGJlZm9yZSB0aGUgaGVpZ2h0cyBhcmUgYXBwbGllZFxuICAgICAqL1xuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcigncHJlZXF1YWxpemVkLnpmLmVxdWFsaXplcicpO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBncm91cHMubGVuZ3RoOyBpIDwgbGVuIDsgaSsrKSB7XG4gICAgICB2YXIgZ3JvdXBzSUxlbmd0aCA9IGdyb3Vwc1tpXS5sZW5ndGgsXG4gICAgICAgICAgbWF4ID0gZ3JvdXBzW2ldW2dyb3Vwc0lMZW5ndGggLSAxXTtcbiAgICAgIGlmIChncm91cHNJTGVuZ3RoPD0yKSB7XG4gICAgICAgICQoZ3JvdXBzW2ldWzBdWzBdKS5jc3MoeydoZWlnaHQnOidhdXRvJ30pO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIC8qKlxuICAgICAgICAqIEZpcmVzIGJlZm9yZSB0aGUgaGVpZ2h0cyBwZXIgcm93IGFyZSBhcHBsaWVkXG4gICAgICAgICogQGV2ZW50IEVxdWFsaXplciNwcmVlcXVhbGl6ZWRSb3dcbiAgICAgICAgKi9cbiAgICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcigncHJlZXF1YWxpemVkcm93LnpmLmVxdWFsaXplcicpO1xuICAgICAgZm9yICh2YXIgaiA9IDAsIGxlbkogPSAoZ3JvdXBzSUxlbmd0aC0xKTsgaiA8IGxlbkogOyBqKyspIHtcbiAgICAgICAgJChncm91cHNbaV1bal1bMF0pLmNzcyh7J2hlaWdodCc6bWF4fSk7XG4gICAgICB9XG4gICAgICAvKipcbiAgICAgICAgKiBGaXJlcyB3aGVuIHRoZSBoZWlnaHRzIHBlciByb3cgaGF2ZSBiZWVuIGFwcGxpZWRcbiAgICAgICAgKiBAZXZlbnQgRXF1YWxpemVyI3Bvc3RlcXVhbGl6ZWRSb3dcbiAgICAgICAgKi9cbiAgICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcigncG9zdGVxdWFsaXplZHJvdy56Zi5lcXVhbGl6ZXInKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRmlyZXMgd2hlbiB0aGUgaGVpZ2h0cyBoYXZlIGJlZW4gYXBwbGllZFxuICAgICAqL1xuICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ3Bvc3RlcXVhbGl6ZWQuemYuZXF1YWxpemVyJyk7XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgYW4gaW5zdGFuY2Ugb2YgRXF1YWxpemVyLlxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIGRlc3Ryb3koKSB7XG4gICAgdGhpcy5fcGF1c2VFdmVudHMoKTtcbiAgICB0aGlzLiR3YXRjaGVkLmNzcygnaGVpZ2h0JywgJ2F1dG8nKTtcblxuICAgIEZvdW5kYXRpb24udW5yZWdpc3RlclBsdWdpbih0aGlzKTtcbiAgfVxufVxuXG4vKipcbiAqIERlZmF1bHQgc2V0dGluZ3MgZm9yIHBsdWdpblxuICovXG5FcXVhbGl6ZXIuZGVmYXVsdHMgPSB7XG4gIC8qKlxuICAgKiBFbmFibGUgaGVpZ2h0IGVxdWFsaXphdGlvbiB3aGVuIHN0YWNrZWQgb24gc21hbGxlciBzY3JlZW5zLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIHRydWVcbiAgICovXG4gIGVxdWFsaXplT25TdGFjazogZmFsc2UsXG4gIC8qKlxuICAgKiBFbmFibGUgaGVpZ2h0IGVxdWFsaXphdGlvbiByb3cgYnkgcm93LlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIGZhbHNlXG4gICAqL1xuICBlcXVhbGl6ZUJ5Um93OiBmYWxzZSxcbiAgLyoqXG4gICAqIFN0cmluZyByZXByZXNlbnRpbmcgdGhlIG1pbmltdW0gYnJlYWtwb2ludCBzaXplIHRoZSBwbHVnaW4gc2hvdWxkIGVxdWFsaXplIGhlaWdodHMgb24uXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgJ21lZGl1bSdcbiAgICovXG4gIGVxdWFsaXplT246ICcnXG59O1xuXG4vLyBXaW5kb3cgZXhwb3J0c1xuRm91bmRhdGlvbi5wbHVnaW4oRXF1YWxpemVyLCAnRXF1YWxpemVyJyk7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLyoqXG4gKiBJbnRlcmNoYW5nZSBtb2R1bGUuXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24uaW50ZXJjaGFuZ2VcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubWVkaWFRdWVyeVxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC50aW1lckFuZEltYWdlTG9hZGVyXG4gKi9cblxuY2xhc3MgSW50ZXJjaGFuZ2Uge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBJbnRlcmNoYW5nZS5cbiAgICogQGNsYXNzXG4gICAqIEBmaXJlcyBJbnRlcmNoYW5nZSNpbml0XG4gICAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBhZGQgdGhlIHRyaWdnZXIgdG8uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRlbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgSW50ZXJjaGFuZ2UuZGVmYXVsdHMsIG9wdGlvbnMpO1xuICAgIHRoaXMucnVsZXMgPSBbXTtcbiAgICB0aGlzLmN1cnJlbnRQYXRoID0gJyc7XG5cbiAgICB0aGlzLl9pbml0KCk7XG4gICAgdGhpcy5fZXZlbnRzKCk7XG5cbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdJbnRlcmNoYW5nZScpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHRoZSBJbnRlcmNoYW5nZSBwbHVnaW4gYW5kIGNhbGxzIGZ1bmN0aW9ucyB0byBnZXQgaW50ZXJjaGFuZ2UgZnVuY3Rpb25pbmcgb24gbG9hZC5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaW5pdCgpIHtcbiAgICB0aGlzLl9hZGRCcmVha3BvaW50cygpO1xuICAgIHRoaXMuX2dlbmVyYXRlUnVsZXMoKTtcbiAgICB0aGlzLl9yZWZsb3coKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyBldmVudHMgZm9yIEludGVyY2hhbmdlLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9ldmVudHMoKSB7XG4gICAgJCh3aW5kb3cpLm9uKCdyZXNpemUuemYuaW50ZXJjaGFuZ2UnLCBGb3VuZGF0aW9uLnV0aWwudGhyb3R0bGUodGhpcy5fcmVmbG93LmJpbmQodGhpcyksIDUwKSk7XG4gIH1cblxuICAvKipcbiAgICogQ2FsbHMgbmVjZXNzYXJ5IGZ1bmN0aW9ucyB0byB1cGRhdGUgSW50ZXJjaGFuZ2UgdXBvbiBET00gY2hhbmdlXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3JlZmxvdygpIHtcbiAgICB2YXIgbWF0Y2g7XG5cbiAgICAvLyBJdGVyYXRlIHRocm91Z2ggZWFjaCBydWxlLCBidXQgb25seSBzYXZlIHRoZSBsYXN0IG1hdGNoXG4gICAgZm9yICh2YXIgaSBpbiB0aGlzLnJ1bGVzKSB7XG4gICAgICBpZih0aGlzLnJ1bGVzLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgIHZhciBydWxlID0gdGhpcy5ydWxlc1tpXTtcblxuICAgICAgICBpZiAod2luZG93Lm1hdGNoTWVkaWEocnVsZS5xdWVyeSkubWF0Y2hlcykge1xuICAgICAgICAgIG1hdGNoID0gcnVsZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChtYXRjaCkge1xuICAgICAgdGhpcy5yZXBsYWNlKG1hdGNoLnBhdGgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBGb3VuZGF0aW9uIGJyZWFrcG9pbnRzIGFuZCBhZGRzIHRoZW0gdG8gdGhlIEludGVyY2hhbmdlLlNQRUNJQUxfUVVFUklFUyBvYmplY3QuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2FkZEJyZWFrcG9pbnRzKCkge1xuICAgIGZvciAodmFyIGkgaW4gRm91bmRhdGlvbi5NZWRpYVF1ZXJ5LnF1ZXJpZXMpIHtcbiAgICAgIGlmIChGb3VuZGF0aW9uLk1lZGlhUXVlcnkucXVlcmllcy5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICB2YXIgcXVlcnkgPSBGb3VuZGF0aW9uLk1lZGlhUXVlcnkucXVlcmllc1tpXTtcbiAgICAgICAgSW50ZXJjaGFuZ2UuU1BFQ0lBTF9RVUVSSUVTW3F1ZXJ5Lm5hbWVdID0gcXVlcnkudmFsdWU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB0aGUgSW50ZXJjaGFuZ2UgZWxlbWVudCBmb3IgdGhlIHByb3ZpZGVkIG1lZGlhIHF1ZXJ5ICsgY29udGVudCBwYWlyaW5nc1xuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRoYXQgaXMgYW4gSW50ZXJjaGFuZ2UgaW5zdGFuY2VcbiAgICogQHJldHVybnMge0FycmF5fSBzY2VuYXJpb3MgLSBBcnJheSBvZiBvYmplY3RzIHRoYXQgaGF2ZSAnbXEnIGFuZCAncGF0aCcga2V5cyB3aXRoIGNvcnJlc3BvbmRpbmcga2V5c1xuICAgKi9cbiAgX2dlbmVyYXRlUnVsZXMoZWxlbWVudCkge1xuICAgIHZhciBydWxlc0xpc3QgPSBbXTtcbiAgICB2YXIgcnVsZXM7XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLnJ1bGVzKSB7XG4gICAgICBydWxlcyA9IHRoaXMub3B0aW9ucy5ydWxlcztcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBydWxlcyA9IHRoaXMuJGVsZW1lbnQuZGF0YSgnaW50ZXJjaGFuZ2UnKS5tYXRjaCgvXFxbLio/XFxdL2cpO1xuICAgIH1cblxuICAgIGZvciAodmFyIGkgaW4gcnVsZXMpIHtcbiAgICAgIGlmKHJ1bGVzLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgIHZhciBydWxlID0gcnVsZXNbaV0uc2xpY2UoMSwgLTEpLnNwbGl0KCcsICcpO1xuICAgICAgICB2YXIgcGF0aCA9IHJ1bGUuc2xpY2UoMCwgLTEpLmpvaW4oJycpO1xuICAgICAgICB2YXIgcXVlcnkgPSBydWxlW3J1bGUubGVuZ3RoIC0gMV07XG5cbiAgICAgICAgaWYgKEludGVyY2hhbmdlLlNQRUNJQUxfUVVFUklFU1txdWVyeV0pIHtcbiAgICAgICAgICBxdWVyeSA9IEludGVyY2hhbmdlLlNQRUNJQUxfUVVFUklFU1txdWVyeV07XG4gICAgICAgIH1cblxuICAgICAgICBydWxlc0xpc3QucHVzaCh7XG4gICAgICAgICAgcGF0aDogcGF0aCxcbiAgICAgICAgICBxdWVyeTogcXVlcnlcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5ydWxlcyA9IHJ1bGVzTGlzdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIGBzcmNgIHByb3BlcnR5IG9mIGFuIGltYWdlLCBvciBjaGFuZ2UgdGhlIEhUTUwgb2YgYSBjb250YWluZXIsIHRvIHRoZSBzcGVjaWZpZWQgcGF0aC5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoIC0gUGF0aCB0byB0aGUgaW1hZ2Ugb3IgSFRNTCBwYXJ0aWFsLlxuICAgKiBAZmlyZXMgSW50ZXJjaGFuZ2UjcmVwbGFjZWRcbiAgICovXG4gIHJlcGxhY2UocGF0aCkge1xuICAgIGlmICh0aGlzLmN1cnJlbnRQYXRoID09PSBwYXRoKSByZXR1cm47XG5cbiAgICB2YXIgX3RoaXMgPSB0aGlzLFxuICAgICAgICB0cmlnZ2VyID0gJ3JlcGxhY2VkLnpmLmludGVyY2hhbmdlJztcblxuICAgIC8vIFJlcGxhY2luZyBpbWFnZXNcbiAgICBpZiAodGhpcy4kZWxlbWVudFswXS5ub2RlTmFtZSA9PT0gJ0lNRycpIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQuYXR0cignc3JjJywgcGF0aCkub24oJ2xvYWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgX3RoaXMuY3VycmVudFBhdGggPSBwYXRoO1xuICAgICAgfSlcbiAgICAgIC50cmlnZ2VyKHRyaWdnZXIpO1xuICAgIH1cbiAgICAvLyBSZXBsYWNpbmcgYmFja2dyb3VuZCBpbWFnZXNcbiAgICBlbHNlIGlmIChwYXRoLm1hdGNoKC9cXC4oZ2lmfGpwZ3xqcGVnfHBuZ3xzdmd8dGlmZikoWz8jXS4qKT8vaSkpIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQuY3NzKHsgJ2JhY2tncm91bmQtaW1hZ2UnOiAndXJsKCcrcGF0aCsnKScgfSlcbiAgICAgICAgICAudHJpZ2dlcih0cmlnZ2VyKTtcbiAgICB9XG4gICAgLy8gUmVwbGFjaW5nIEhUTUxcbiAgICBlbHNlIHtcbiAgICAgICQuZ2V0KHBhdGgsIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIF90aGlzLiRlbGVtZW50Lmh0bWwocmVzcG9uc2UpXG4gICAgICAgICAgICAgLnRyaWdnZXIodHJpZ2dlcik7XG4gICAgICAgICQocmVzcG9uc2UpLmZvdW5kYXRpb24oKTtcbiAgICAgICAgX3RoaXMuY3VycmVudFBhdGggPSBwYXRoO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmlyZXMgd2hlbiBjb250ZW50IGluIGFuIEludGVyY2hhbmdlIGVsZW1lbnQgaXMgZG9uZSBiZWluZyBsb2FkZWQuXG4gICAgICogQGV2ZW50IEludGVyY2hhbmdlI3JlcGxhY2VkXG4gICAgICovXG4gICAgLy8gdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdyZXBsYWNlZC56Zi5pbnRlcmNoYW5nZScpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIGFuIGluc3RhbmNlIG9mIGludGVyY2hhbmdlLlxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIGRlc3Ryb3koKSB7XG4gICAgLy9UT0RPIHRoaXMuXG4gIH1cbn1cblxuLyoqXG4gKiBEZWZhdWx0IHNldHRpbmdzIGZvciBwbHVnaW5cbiAqL1xuSW50ZXJjaGFuZ2UuZGVmYXVsdHMgPSB7XG4gIC8qKlxuICAgKiBSdWxlcyB0byBiZSBhcHBsaWVkIHRvIEludGVyY2hhbmdlIGVsZW1lbnRzLiBTZXQgd2l0aCB0aGUgYGRhdGEtaW50ZXJjaGFuZ2VgIGFycmF5IG5vdGF0aW9uLlxuICAgKiBAb3B0aW9uXG4gICAqL1xuICBydWxlczogbnVsbFxufTtcblxuSW50ZXJjaGFuZ2UuU1BFQ0lBTF9RVUVSSUVTID0ge1xuICAnbGFuZHNjYXBlJzogJ3NjcmVlbiBhbmQgKG9yaWVudGF0aW9uOiBsYW5kc2NhcGUpJyxcbiAgJ3BvcnRyYWl0JzogJ3NjcmVlbiBhbmQgKG9yaWVudGF0aW9uOiBwb3J0cmFpdCknLFxuICAncmV0aW5hJzogJ29ubHkgc2NyZWVuIGFuZCAoLXdlYmtpdC1taW4tZGV2aWNlLXBpeGVsLXJhdGlvOiAyKSwgb25seSBzY3JlZW4gYW5kIChtaW4tLW1vei1kZXZpY2UtcGl4ZWwtcmF0aW86IDIpLCBvbmx5IHNjcmVlbiBhbmQgKC1vLW1pbi1kZXZpY2UtcGl4ZWwtcmF0aW86IDIvMSksIG9ubHkgc2NyZWVuIGFuZCAobWluLWRldmljZS1waXhlbC1yYXRpbzogMiksIG9ubHkgc2NyZWVuIGFuZCAobWluLXJlc29sdXRpb246IDE5MmRwaSksIG9ubHkgc2NyZWVuIGFuZCAobWluLXJlc29sdXRpb246IDJkcHB4KSdcbn07XG5cbi8vIFdpbmRvdyBleHBvcnRzXG5Gb3VuZGF0aW9uLnBsdWdpbihJbnRlcmNoYW5nZSwgJ0ludGVyY2hhbmdlJyk7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLyoqXG4gKiBPZmZDYW52YXMgbW9kdWxlLlxuICogQG1vZHVsZSBmb3VuZGF0aW9uLm9mZmNhbnZhc1xuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5tZWRpYVF1ZXJ5XG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLnRyaWdnZXJzXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm1vdGlvblxuICovXG5cbmNsYXNzIE9mZkNhbnZhcyB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIGFuIG9mZi1jYW52YXMgd3JhcHBlci5cbiAgICogQGNsYXNzXG4gICAqIEBmaXJlcyBPZmZDYW52YXMjaW5pdFxuICAgKiBAcGFyYW0ge09iamVjdH0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gaW5pdGlhbGl6ZS5cbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPdmVycmlkZXMgdG8gdGhlIGRlZmF1bHQgcGx1Z2luIHNldHRpbmdzLlxuICAgKi9cbiAgY29uc3RydWN0b3IoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMuJGVsZW1lbnQgPSBlbGVtZW50O1xuICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBPZmZDYW52YXMuZGVmYXVsdHMsIHRoaXMuJGVsZW1lbnQuZGF0YSgpLCBvcHRpb25zKTtcbiAgICB0aGlzLiRsYXN0VHJpZ2dlciA9ICQoKTtcbiAgICB0aGlzLiR0cmlnZ2VycyA9ICQoKTtcblxuICAgIHRoaXMuX2luaXQoKTtcbiAgICB0aGlzLl9ldmVudHMoKTtcblxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcywgJ09mZkNhbnZhcycpXG4gICAgRm91bmRhdGlvbi5LZXlib2FyZC5yZWdpc3RlcignT2ZmQ2FudmFzJywge1xuICAgICAgJ0VTQ0FQRSc6ICdjbG9zZSdcbiAgICB9KTtcblxuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHRoZSBvZmYtY2FudmFzIHdyYXBwZXIgYnkgYWRkaW5nIHRoZSBleGl0IG92ZXJsYXkgKGlmIG5lZWRlZCkuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2luaXQoKSB7XG4gICAgdmFyIGlkID0gdGhpcy4kZWxlbWVudC5hdHRyKCdpZCcpO1xuXG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG5cbiAgICAvLyBGaW5kIHRyaWdnZXJzIHRoYXQgYWZmZWN0IHRoaXMgZWxlbWVudCBhbmQgYWRkIGFyaWEtZXhwYW5kZWQgdG8gdGhlbVxuICAgIHRoaXMuJHRyaWdnZXJzID0gJChkb2N1bWVudClcbiAgICAgIC5maW5kKCdbZGF0YS1vcGVuPVwiJytpZCsnXCJdLCBbZGF0YS1jbG9zZT1cIicraWQrJ1wiXSwgW2RhdGEtdG9nZ2xlPVwiJytpZCsnXCJdJylcbiAgICAgIC5hdHRyKCdhcmlhLWV4cGFuZGVkJywgJ2ZhbHNlJylcbiAgICAgIC5hdHRyKCdhcmlhLWNvbnRyb2xzJywgaWQpO1xuXG4gICAgLy8gQWRkIGEgY2xvc2UgdHJpZ2dlciBvdmVyIHRoZSBib2R5IGlmIG5lY2Vzc2FyeVxuICAgIGlmICh0aGlzLm9wdGlvbnMuY2xvc2VPbkNsaWNrKSB7XG4gICAgICBpZiAoJCgnLmpzLW9mZi1jYW52YXMtZXhpdCcpLmxlbmd0aCkge1xuICAgICAgICB0aGlzLiRleGl0ZXIgPSAkKCcuanMtb2ZmLWNhbnZhcy1leGl0Jyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgZXhpdGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGV4aXRlci5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ2pzLW9mZi1jYW52YXMtZXhpdCcpO1xuICAgICAgICAkKCdbZGF0YS1vZmYtY2FudmFzLWNvbnRlbnRdJykuYXBwZW5kKGV4aXRlcik7XG5cbiAgICAgICAgdGhpcy4kZXhpdGVyID0gJChleGl0ZXIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMub3B0aW9ucy5pc1JldmVhbGVkID0gdGhpcy5vcHRpb25zLmlzUmV2ZWFsZWQgfHwgbmV3IFJlZ0V4cCh0aGlzLm9wdGlvbnMucmV2ZWFsQ2xhc3MsICdnJykudGVzdCh0aGlzLiRlbGVtZW50WzBdLmNsYXNzTmFtZSk7XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmlzUmV2ZWFsZWQpIHtcbiAgICAgIHRoaXMub3B0aW9ucy5yZXZlYWxPbiA9IHRoaXMub3B0aW9ucy5yZXZlYWxPbiB8fCB0aGlzLiRlbGVtZW50WzBdLmNsYXNzTmFtZS5tYXRjaCgvKHJldmVhbC1mb3ItbWVkaXVtfHJldmVhbC1mb3ItbGFyZ2UpL2cpWzBdLnNwbGl0KCctJylbMl07XG4gICAgICB0aGlzLl9zZXRNUUNoZWNrZXIoKTtcbiAgICB9XG4gICAgaWYgKCF0aGlzLm9wdGlvbnMudHJhbnNpdGlvblRpbWUpIHtcbiAgICAgIHRoaXMub3B0aW9ucy50cmFuc2l0aW9uVGltZSA9IHBhcnNlRmxvYXQod2luZG93LmdldENvbXB1dGVkU3R5bGUoJCgnW2RhdGEtb2ZmLWNhbnZhcy13cmFwcGVyXScpWzBdKS50cmFuc2l0aW9uRHVyYXRpb24pICogMTAwMDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBldmVudCBoYW5kbGVycyB0byB0aGUgb2ZmLWNhbnZhcyB3cmFwcGVyIGFuZCB0aGUgZXhpdCBvdmVybGF5LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9ldmVudHMoKSB7XG4gICAgdGhpcy4kZWxlbWVudC5vZmYoJy56Zi50cmlnZ2VyIC56Zi5vZmZjYW52YXMnKS5vbih7XG4gICAgICAnb3Blbi56Zi50cmlnZ2VyJzogdGhpcy5vcGVuLmJpbmQodGhpcyksXG4gICAgICAnY2xvc2UuemYudHJpZ2dlcic6IHRoaXMuY2xvc2UuYmluZCh0aGlzKSxcbiAgICAgICd0b2dnbGUuemYudHJpZ2dlcic6IHRoaXMudG9nZ2xlLmJpbmQodGhpcyksXG4gICAgICAna2V5ZG93bi56Zi5vZmZjYW52YXMnOiB0aGlzLl9oYW5kbGVLZXlib2FyZC5iaW5kKHRoaXMpXG4gICAgfSk7XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmNsb3NlT25DbGljayAmJiB0aGlzLiRleGl0ZXIubGVuZ3RoKSB7XG4gICAgICB0aGlzLiRleGl0ZXIub24oeydjbGljay56Zi5vZmZjYW52YXMnOiB0aGlzLmNsb3NlLmJpbmQodGhpcyl9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQXBwbGllcyBldmVudCBsaXN0ZW5lciBmb3IgZWxlbWVudHMgdGhhdCB3aWxsIHJldmVhbCBhdCBjZXJ0YWluIGJyZWFrcG9pbnRzLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3NldE1RQ2hlY2tlcigpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgJCh3aW5kb3cpLm9uKCdjaGFuZ2VkLnpmLm1lZGlhcXVlcnknLCBmdW5jdGlvbigpIHtcbiAgICAgIGlmIChGb3VuZGF0aW9uLk1lZGlhUXVlcnkuYXRMZWFzdChfdGhpcy5vcHRpb25zLnJldmVhbE9uKSkge1xuICAgICAgICBfdGhpcy5yZXZlYWwodHJ1ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBfdGhpcy5yZXZlYWwoZmFsc2UpO1xuICAgICAgfVxuICAgIH0pLm9uZSgnbG9hZC56Zi5vZmZjYW52YXMnLCBmdW5jdGlvbigpIHtcbiAgICAgIGlmIChGb3VuZGF0aW9uLk1lZGlhUXVlcnkuYXRMZWFzdChfdGhpcy5vcHRpb25zLnJldmVhbE9uKSkge1xuICAgICAgICBfdGhpcy5yZXZlYWwodHJ1ZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlcyB0aGUgcmV2ZWFsaW5nL2hpZGluZyB0aGUgb2ZmLWNhbnZhcyBhdCBicmVha3BvaW50cywgbm90IHRoZSBzYW1lIGFzIG9wZW4uXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gaXNSZXZlYWxlZCAtIHRydWUgaWYgZWxlbWVudCBzaG91bGQgYmUgcmV2ZWFsZWQuXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgcmV2ZWFsKGlzUmV2ZWFsZWQpIHtcbiAgICB2YXIgJGNsb3NlciA9IHRoaXMuJGVsZW1lbnQuZmluZCgnW2RhdGEtY2xvc2VdJyk7XG4gICAgaWYgKGlzUmV2ZWFsZWQpIHtcbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgIHRoaXMuaXNSZXZlYWxlZCA9IHRydWU7XG4gICAgICAvLyBpZiAoIXRoaXMub3B0aW9ucy5mb3JjZVRvcCkge1xuICAgICAgLy8gICB2YXIgc2Nyb2xsUG9zID0gcGFyc2VJbnQod2luZG93LnBhZ2VZT2Zmc2V0KTtcbiAgICAgIC8vICAgdGhpcy4kZWxlbWVudFswXS5zdHlsZS50cmFuc2Zvcm0gPSAndHJhbnNsYXRlKDAsJyArIHNjcm9sbFBvcyArICdweCknO1xuICAgICAgLy8gfVxuICAgICAgLy8gaWYgKHRoaXMub3B0aW9ucy5pc1N0aWNreSkgeyB0aGlzLl9zdGljaygpOyB9XG4gICAgICB0aGlzLiRlbGVtZW50Lm9mZignb3Blbi56Zi50cmlnZ2VyIHRvZ2dsZS56Zi50cmlnZ2VyJyk7XG4gICAgICBpZiAoJGNsb3Nlci5sZW5ndGgpIHsgJGNsb3Nlci5oaWRlKCk7IH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5pc1JldmVhbGVkID0gZmFsc2U7XG4gICAgICAvLyBpZiAodGhpcy5vcHRpb25zLmlzU3RpY2t5IHx8ICF0aGlzLm9wdGlvbnMuZm9yY2VUb3ApIHtcbiAgICAgIC8vICAgdGhpcy4kZWxlbWVudFswXS5zdHlsZS50cmFuc2Zvcm0gPSAnJztcbiAgICAgIC8vICAgJCh3aW5kb3cpLm9mZignc2Nyb2xsLnpmLm9mZmNhbnZhcycpO1xuICAgICAgLy8gfVxuICAgICAgdGhpcy4kZWxlbWVudC5vbih7XG4gICAgICAgICdvcGVuLnpmLnRyaWdnZXInOiB0aGlzLm9wZW4uYmluZCh0aGlzKSxcbiAgICAgICAgJ3RvZ2dsZS56Zi50cmlnZ2VyJzogdGhpcy50b2dnbGUuYmluZCh0aGlzKVxuICAgICAgfSk7XG4gICAgICBpZiAoJGNsb3Nlci5sZW5ndGgpIHtcbiAgICAgICAgJGNsb3Nlci5zaG93KCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIE9wZW5zIHRoZSBvZmYtY2FudmFzIG1lbnUuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgLSBFdmVudCBvYmplY3QgcGFzc2VkIGZyb20gbGlzdGVuZXIuXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSB0cmlnZ2VyIC0gZWxlbWVudCB0aGF0IHRyaWdnZXJlZCB0aGUgb2ZmLWNhbnZhcyB0byBvcGVuLlxuICAgKiBAZmlyZXMgT2ZmQ2FudmFzI29wZW5lZFxuICAgKi9cbiAgb3BlbihldmVudCwgdHJpZ2dlcikge1xuICAgIGlmICh0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdpcy1vcGVuJykgfHwgdGhpcy5pc1JldmVhbGVkKSB7IHJldHVybjsgfVxuICAgIHZhciBfdGhpcyA9IHRoaXMsXG4gICAgICAgICRib2R5ID0gJChkb2N1bWVudC5ib2R5KTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMuZm9yY2VUb3ApIHtcbiAgICAgICQoJ2JvZHknKS5zY3JvbGxUb3AoMCk7XG4gICAgfVxuICAgIC8vIHdpbmRvdy5wYWdlWU9mZnNldCA9IDA7XG5cbiAgICAvLyBpZiAoIXRoaXMub3B0aW9ucy5mb3JjZVRvcCkge1xuICAgIC8vICAgdmFyIHNjcm9sbFBvcyA9IHBhcnNlSW50KHdpbmRvdy5wYWdlWU9mZnNldCk7XG4gICAgLy8gICB0aGlzLiRlbGVtZW50WzBdLnN0eWxlLnRyYW5zZm9ybSA9ICd0cmFuc2xhdGUoMCwnICsgc2Nyb2xsUG9zICsgJ3B4KSc7XG4gICAgLy8gICBpZiAodGhpcy4kZXhpdGVyLmxlbmd0aCkge1xuICAgIC8vICAgICB0aGlzLiRleGl0ZXJbMF0uc3R5bGUudHJhbnNmb3JtID0gJ3RyYW5zbGF0ZSgwLCcgKyBzY3JvbGxQb3MgKyAncHgpJztcbiAgICAvLyAgIH1cbiAgICAvLyB9XG4gICAgLyoqXG4gICAgICogRmlyZXMgd2hlbiB0aGUgb2ZmLWNhbnZhcyBtZW51IG9wZW5zLlxuICAgICAqIEBldmVudCBPZmZDYW52YXMjb3BlbmVkXG4gICAgICovXG5cbiAgICB2YXIgJHdyYXBwZXIgPSAkKCdbZGF0YS1vZmYtY2FudmFzLXdyYXBwZXJdJyk7XG4gICAgJHdyYXBwZXIuYWRkQ2xhc3MoJ2lzLW9mZi1jYW52YXMtb3BlbiBpcy1vcGVuLScrIF90aGlzLm9wdGlvbnMucG9zaXRpb24pO1xuXG4gICAgX3RoaXMuJGVsZW1lbnQuYWRkQ2xhc3MoJ2lzLW9wZW4nKVxuXG4gICAgICAvLyBpZiAoX3RoaXMub3B0aW9ucy5pc1N0aWNreSkge1xuICAgICAgLy8gICBfdGhpcy5fc3RpY2soKTtcbiAgICAgIC8vIH1cblxuICAgIHRoaXMuJHRyaWdnZXJzLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCAndHJ1ZScpO1xuICAgIHRoaXMuJGVsZW1lbnQuYXR0cignYXJpYS1oaWRkZW4nLCAnZmFsc2UnKVxuICAgICAgICAudHJpZ2dlcignb3BlbmVkLnpmLm9mZmNhbnZhcycpO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5jbG9zZU9uQ2xpY2spIHtcbiAgICAgIHRoaXMuJGV4aXRlci5hZGRDbGFzcygnaXMtdmlzaWJsZScpO1xuICAgIH1cblxuICAgIGlmICh0cmlnZ2VyKSB7XG4gICAgICB0aGlzLiRsYXN0VHJpZ2dlciA9IHRyaWdnZXI7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5hdXRvRm9jdXMpIHtcbiAgICAgICR3cmFwcGVyLm9uZShGb3VuZGF0aW9uLnRyYW5zaXRpb25lbmQoJHdyYXBwZXIpLCBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYoX3RoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ2lzLW9wZW4nKSkgeyAvLyBoYW5kbGUgZG91YmxlIGNsaWNrc1xuICAgICAgICAgIF90aGlzLiRlbGVtZW50LmF0dHIoJ3RhYmluZGV4JywgJy0xJyk7XG4gICAgICAgICAgX3RoaXMuJGVsZW1lbnQuZm9jdXMoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy50cmFwRm9jdXMpIHtcbiAgICAgICR3cmFwcGVyLm9uZShGb3VuZGF0aW9uLnRyYW5zaXRpb25lbmQoJHdyYXBwZXIpLCBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYoX3RoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ2lzLW9wZW4nKSkgeyAvLyBoYW5kbGUgZG91YmxlIGNsaWNrc1xuICAgICAgICAgIF90aGlzLiRlbGVtZW50LmF0dHIoJ3RhYmluZGV4JywgJy0xJyk7XG4gICAgICAgICAgX3RoaXMudHJhcEZvY3VzKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUcmFwcyBmb2N1cyB3aXRoaW4gdGhlIG9mZmNhbnZhcyBvbiBvcGVuLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3RyYXBGb2N1cygpIHtcbiAgICB2YXIgZm9jdXNhYmxlID0gRm91bmRhdGlvbi5LZXlib2FyZC5maW5kRm9jdXNhYmxlKHRoaXMuJGVsZW1lbnQpLFxuICAgICAgICBmaXJzdCA9IGZvY3VzYWJsZS5lcSgwKSxcbiAgICAgICAgbGFzdCA9IGZvY3VzYWJsZS5lcSgtMSk7XG5cbiAgICBmb2N1c2FibGUub2ZmKCcuemYub2ZmY2FudmFzJykub24oJ2tleWRvd24uemYub2ZmY2FudmFzJywgZnVuY3Rpb24oZSkge1xuICAgICAgdmFyIGtleSA9IEZvdW5kYXRpb24uS2V5Ym9hcmQucGFyc2VLZXkoZSk7XG4gICAgICBpZiAoa2V5ID09PSAnVEFCJyAmJiBlLnRhcmdldCA9PT0gbGFzdFswXSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGZpcnN0LmZvY3VzKCk7XG4gICAgICB9XG4gICAgICBpZiAoa2V5ID09PSAnU0hJRlRfVEFCJyAmJiBlLnRhcmdldCA9PT0gZmlyc3RbMF0pIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBsYXN0LmZvY3VzKCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQWxsb3dzIHRoZSBvZmZjYW52YXMgdG8gYXBwZWFyIHN0aWNreSB1dGlsaXppbmcgdHJhbnNsYXRlIHByb3BlcnRpZXMuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICAvLyBPZmZDYW52YXMucHJvdG90eXBlLl9zdGljayA9IGZ1bmN0aW9uKCkge1xuICAvLyAgIHZhciBlbFN0eWxlID0gdGhpcy4kZWxlbWVudFswXS5zdHlsZTtcbiAgLy9cbiAgLy8gICBpZiAodGhpcy5vcHRpb25zLmNsb3NlT25DbGljaykge1xuICAvLyAgICAgdmFyIGV4aXRTdHlsZSA9IHRoaXMuJGV4aXRlclswXS5zdHlsZTtcbiAgLy8gICB9XG4gIC8vXG4gIC8vICAgJCh3aW5kb3cpLm9uKCdzY3JvbGwuemYub2ZmY2FudmFzJywgZnVuY3Rpb24oZSkge1xuICAvLyAgICAgY29uc29sZS5sb2coZSk7XG4gIC8vICAgICB2YXIgcGFnZVkgPSB3aW5kb3cucGFnZVlPZmZzZXQ7XG4gIC8vICAgICBlbFN0eWxlLnRyYW5zZm9ybSA9ICd0cmFuc2xhdGUoMCwnICsgcGFnZVkgKyAncHgpJztcbiAgLy8gICAgIGlmIChleGl0U3R5bGUgIT09IHVuZGVmaW5lZCkgeyBleGl0U3R5bGUudHJhbnNmb3JtID0gJ3RyYW5zbGF0ZSgwLCcgKyBwYWdlWSArICdweCknOyB9XG4gIC8vICAgfSk7XG4gIC8vICAgLy8gdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdzdHVjay56Zi5vZmZjYW52YXMnKTtcbiAgLy8gfTtcbiAgLyoqXG4gICAqIENsb3NlcyB0aGUgb2ZmLWNhbnZhcyBtZW51LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgLSBvcHRpb25hbCBjYiB0byBmaXJlIGFmdGVyIGNsb3N1cmUuXG4gICAqIEBmaXJlcyBPZmZDYW52YXMjY2xvc2VkXG4gICAqL1xuICBjbG9zZShjYikge1xuICAgIGlmICghdGhpcy4kZWxlbWVudC5oYXNDbGFzcygnaXMtb3BlbicpIHx8IHRoaXMuaXNSZXZlYWxlZCkgeyByZXR1cm47IH1cblxuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAvLyAgRm91bmRhdGlvbi5Nb3ZlKHRoaXMub3B0aW9ucy50cmFuc2l0aW9uVGltZSwgdGhpcy4kZWxlbWVudCwgZnVuY3Rpb24oKSB7XG4gICAgJCgnW2RhdGEtb2ZmLWNhbnZhcy13cmFwcGVyXScpLnJlbW92ZUNsYXNzKGBpcy1vZmYtY2FudmFzLW9wZW4gaXMtb3Blbi0ke190aGlzLm9wdGlvbnMucG9zaXRpb259YCk7XG4gICAgX3RoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2lzLW9wZW4nKTtcbiAgICAgIC8vIEZvdW5kYXRpb24uX3JlZmxvdygpO1xuICAgIC8vIH0pO1xuICAgIHRoaXMuJGVsZW1lbnQuYXR0cignYXJpYS1oaWRkZW4nLCAndHJ1ZScpXG4gICAgICAvKipcbiAgICAgICAqIEZpcmVzIHdoZW4gdGhlIG9mZi1jYW52YXMgbWVudSBvcGVucy5cbiAgICAgICAqIEBldmVudCBPZmZDYW52YXMjY2xvc2VkXG4gICAgICAgKi9cbiAgICAgICAgLnRyaWdnZXIoJ2Nsb3NlZC56Zi5vZmZjYW52YXMnKTtcbiAgICAvLyBpZiAoX3RoaXMub3B0aW9ucy5pc1N0aWNreSB8fCAhX3RoaXMub3B0aW9ucy5mb3JjZVRvcCkge1xuICAgIC8vICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgX3RoaXMuJGVsZW1lbnRbMF0uc3R5bGUudHJhbnNmb3JtID0gJyc7XG4gICAgLy8gICAgICQod2luZG93KS5vZmYoJ3Njcm9sbC56Zi5vZmZjYW52YXMnKTtcbiAgICAvLyAgIH0sIHRoaXMub3B0aW9ucy50cmFuc2l0aW9uVGltZSk7XG4gICAgLy8gfVxuICAgIGlmICh0aGlzLm9wdGlvbnMuY2xvc2VPbkNsaWNrKSB7XG4gICAgICB0aGlzLiRleGl0ZXIucmVtb3ZlQ2xhc3MoJ2lzLXZpc2libGUnKTtcbiAgICB9XG5cbiAgICB0aGlzLiR0cmlnZ2Vycy5hdHRyKCdhcmlhLWV4cGFuZGVkJywgJ2ZhbHNlJyk7XG4gICAgaWYgKHRoaXMub3B0aW9ucy50cmFwRm9jdXMpIHtcbiAgICAgICQoJ1tkYXRhLW9mZi1jYW52YXMtY29udGVudF0nKS5yZW1vdmVBdHRyKCd0YWJpbmRleCcpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUb2dnbGVzIHRoZSBvZmYtY2FudmFzIG1lbnUgb3BlbiBvciBjbG9zZWQuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgLSBFdmVudCBvYmplY3QgcGFzc2VkIGZyb20gbGlzdGVuZXIuXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSB0cmlnZ2VyIC0gZWxlbWVudCB0aGF0IHRyaWdnZXJlZCB0aGUgb2ZmLWNhbnZhcyB0byBvcGVuLlxuICAgKi9cbiAgdG9nZ2xlKGV2ZW50LCB0cmlnZ2VyKSB7XG4gICAgaWYgKHRoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ2lzLW9wZW4nKSkge1xuICAgICAgdGhpcy5jbG9zZShldmVudCwgdHJpZ2dlcik7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhpcy5vcGVuKGV2ZW50LCB0cmlnZ2VyKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlcyBrZXlib2FyZCBpbnB1dCB3aGVuIGRldGVjdGVkLiBXaGVuIHRoZSBlc2NhcGUga2V5IGlzIHByZXNzZWQsIHRoZSBvZmYtY2FudmFzIG1lbnUgY2xvc2VzLCBhbmQgZm9jdXMgaXMgcmVzdG9yZWQgdG8gdGhlIGVsZW1lbnQgdGhhdCBvcGVuZWQgdGhlIG1lbnUuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2hhbmRsZUtleWJvYXJkKGUpIHtcbiAgICBGb3VuZGF0aW9uLktleWJvYXJkLmhhbmRsZUtleShlLCAnT2ZmQ2FudmFzJywge1xuICAgICAgY2xvc2U6ICgpID0+IHtcbiAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgICB0aGlzLiRsYXN0VHJpZ2dlci5mb2N1cygpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0sXG4gICAgICBoYW5kbGVkOiAoKSA9PiB7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXN0cm95cyB0aGUgb2ZmY2FudmFzIHBsdWdpbi5cbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICBkZXN0cm95KCkge1xuICAgIHRoaXMuY2xvc2UoKTtcbiAgICB0aGlzLiRlbGVtZW50Lm9mZignLnpmLnRyaWdnZXIgLnpmLm9mZmNhbnZhcycpO1xuICAgIHRoaXMuJGV4aXRlci5vZmYoJy56Zi5vZmZjYW52YXMnKTtcblxuICAgIEZvdW5kYXRpb24udW5yZWdpc3RlclBsdWdpbih0aGlzKTtcbiAgfVxufVxuXG5PZmZDYW52YXMuZGVmYXVsdHMgPSB7XG4gIC8qKlxuICAgKiBBbGxvdyB0aGUgdXNlciB0byBjbGljayBvdXRzaWRlIG9mIHRoZSBtZW51IHRvIGNsb3NlIGl0LlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIHRydWVcbiAgICovXG4gIGNsb3NlT25DbGljazogdHJ1ZSxcblxuICAvKipcbiAgICogQW1vdW50IG9mIHRpbWUgaW4gbXMgdGhlIG9wZW4gYW5kIGNsb3NlIHRyYW5zaXRpb24gcmVxdWlyZXMuIElmIG5vbmUgc2VsZWN0ZWQsIHB1bGxzIGZyb20gYm9keSBzdHlsZS5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSA1MDBcbiAgICovXG4gIHRyYW5zaXRpb25UaW1lOiAwLFxuXG4gIC8qKlxuICAgKiBEaXJlY3Rpb24gdGhlIG9mZmNhbnZhcyBvcGVucyBmcm9tLiBEZXRlcm1pbmVzIGNsYXNzIGFwcGxpZWQgdG8gYm9keS5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBsZWZ0XG4gICAqL1xuICBwb3NpdGlvbjogJ2xlZnQnLFxuXG4gIC8qKlxuICAgKiBGb3JjZSB0aGUgcGFnZSB0byBzY3JvbGwgdG8gdG9wIG9uIG9wZW4uXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgdHJ1ZVxuICAgKi9cbiAgZm9yY2VUb3A6IHRydWUsXG5cbiAgLyoqXG4gICAqIEFsbG93IHRoZSBvZmZjYW52YXMgdG8gcmVtYWluIG9wZW4gZm9yIGNlcnRhaW4gYnJlYWtwb2ludHMuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgZmFsc2VcbiAgICovXG4gIGlzUmV2ZWFsZWQ6IGZhbHNlLFxuXG4gIC8qKlxuICAgKiBCcmVha3BvaW50IGF0IHdoaWNoIHRvIHJldmVhbC4gSlMgd2lsbCB1c2UgYSBSZWdFeHAgdG8gdGFyZ2V0IHN0YW5kYXJkIGNsYXNzZXMsIGlmIGNoYW5naW5nIGNsYXNzbmFtZXMsIHBhc3MgeW91ciBjbGFzcyB3aXRoIHRoZSBgcmV2ZWFsQ2xhc3NgIG9wdGlvbi5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSByZXZlYWwtZm9yLWxhcmdlXG4gICAqL1xuICByZXZlYWxPbjogbnVsbCxcblxuICAvKipcbiAgICogRm9yY2UgZm9jdXMgdG8gdGhlIG9mZmNhbnZhcyBvbiBvcGVuLiBJZiB0cnVlLCB3aWxsIGZvY3VzIHRoZSBvcGVuaW5nIHRyaWdnZXIgb24gY2xvc2UuIFNldHMgdGFiaW5kZXggb2YgW2RhdGEtb2ZmLWNhbnZhcy1jb250ZW50XSB0byAtMSBmb3IgYWNjZXNzaWJpbGl0eSBwdXJwb3Nlcy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSB0cnVlXG4gICAqL1xuICBhdXRvRm9jdXM6IHRydWUsXG5cbiAgLyoqXG4gICAqIENsYXNzIHVzZWQgdG8gZm9yY2UgYW4gb2ZmY2FudmFzIHRvIHJlbWFpbiBvcGVuLiBGb3VuZGF0aW9uIGRlZmF1bHRzIGZvciB0aGlzIGFyZSBgcmV2ZWFsLWZvci1sYXJnZWAgJiBgcmV2ZWFsLWZvci1tZWRpdW1gLlxuICAgKiBAb3B0aW9uXG4gICAqIFRPRE8gaW1wcm92ZSB0aGUgcmVnZXggdGVzdGluZyBmb3IgdGhpcy5cbiAgICogQGV4YW1wbGUgcmV2ZWFsLWZvci1sYXJnZVxuICAgKi9cbiAgcmV2ZWFsQ2xhc3M6ICdyZXZlYWwtZm9yLScsXG5cbiAgLyoqXG4gICAqIFRyaWdnZXJzIG9wdGlvbmFsIGZvY3VzIHRyYXBwaW5nIHdoZW4gb3BlbmluZyBhbiBvZmZjYW52YXMuIFNldHMgdGFiaW5kZXggb2YgW2RhdGEtb2ZmLWNhbnZhcy1jb250ZW50XSB0byAtMSBmb3IgYWNjZXNzaWJpbGl0eSBwdXJwb3Nlcy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSB0cnVlXG4gICAqL1xuICB0cmFwRm9jdXM6IGZhbHNlXG59XG5cbi8vIFdpbmRvdyBleHBvcnRzXG5Gb3VuZGF0aW9uLnBsdWdpbihPZmZDYW52YXMsICdPZmZDYW52YXMnKTtcblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG4vKipcbiAqIFJlc3BvbnNpdmVNZW51IG1vZHVsZS5cbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5yZXNwb25zaXZlTWVudVxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC50cmlnZ2Vyc1xuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5tZWRpYVF1ZXJ5XG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmFjY29yZGlvbk1lbnVcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwuZHJpbGxkb3duXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmRyb3Bkb3duLW1lbnVcbiAqL1xuXG5jbGFzcyBSZXNwb25zaXZlTWVudSB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIGEgcmVzcG9uc2l2ZSBtZW51LlxuICAgKiBAY2xhc3NcbiAgICogQGZpcmVzIFJlc3BvbnNpdmVNZW51I2luaXRcbiAgICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIG1ha2UgaW50byBhIGRyb3Bkb3duIG1lbnUuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRlbGVtZW50ID0gJChlbGVtZW50KTtcbiAgICB0aGlzLnJ1bGVzID0gdGhpcy4kZWxlbWVudC5kYXRhKCdyZXNwb25zaXZlLW1lbnUnKTtcbiAgICB0aGlzLmN1cnJlbnRNcSA9IG51bGw7XG4gICAgdGhpcy5jdXJyZW50UGx1Z2luID0gbnVsbDtcblxuICAgIHRoaXMuX2luaXQoKTtcbiAgICB0aGlzLl9ldmVudHMoKTtcblxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcywgJ1Jlc3BvbnNpdmVNZW51Jyk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIE1lbnUgYnkgcGFyc2luZyB0aGUgY2xhc3NlcyBmcm9tIHRoZSAnZGF0YS1SZXNwb25zaXZlTWVudScgYXR0cmlidXRlIG9uIHRoZSBlbGVtZW50LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9pbml0KCkge1xuICAgIC8vIFRoZSBmaXJzdCB0aW1lIGFuIEludGVyY2hhbmdlIHBsdWdpbiBpcyBpbml0aWFsaXplZCwgdGhpcy5ydWxlcyBpcyBjb252ZXJ0ZWQgZnJvbSBhIHN0cmluZyBvZiBcImNsYXNzZXNcIiB0byBhbiBvYmplY3Qgb2YgcnVsZXNcbiAgICBpZiAodHlwZW9mIHRoaXMucnVsZXMgPT09ICdzdHJpbmcnKSB7XG4gICAgICBsZXQgcnVsZXNUcmVlID0ge307XG5cbiAgICAgIC8vIFBhcnNlIHJ1bGVzIGZyb20gXCJjbGFzc2VzXCIgcHVsbGVkIGZyb20gZGF0YSBhdHRyaWJ1dGVcbiAgICAgIGxldCBydWxlcyA9IHRoaXMucnVsZXMuc3BsaXQoJyAnKTtcblxuICAgICAgLy8gSXRlcmF0ZSB0aHJvdWdoIGV2ZXJ5IHJ1bGUgZm91bmRcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcnVsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbGV0IHJ1bGUgPSBydWxlc1tpXS5zcGxpdCgnLScpO1xuICAgICAgICBsZXQgcnVsZVNpemUgPSBydWxlLmxlbmd0aCA+IDEgPyBydWxlWzBdIDogJ3NtYWxsJztcbiAgICAgICAgbGV0IHJ1bGVQbHVnaW4gPSBydWxlLmxlbmd0aCA+IDEgPyBydWxlWzFdIDogcnVsZVswXTtcblxuICAgICAgICBpZiAoTWVudVBsdWdpbnNbcnVsZVBsdWdpbl0gIT09IG51bGwpIHtcbiAgICAgICAgICBydWxlc1RyZWVbcnVsZVNpemVdID0gTWVudVBsdWdpbnNbcnVsZVBsdWdpbl07XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdGhpcy5ydWxlcyA9IHJ1bGVzVHJlZTtcbiAgICB9XG5cbiAgICBpZiAoISQuaXNFbXB0eU9iamVjdCh0aGlzLnJ1bGVzKSkge1xuICAgICAgdGhpcy5fY2hlY2tNZWRpYVF1ZXJpZXMoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgZXZlbnRzIGZvciB0aGUgTWVudS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfZXZlbnRzKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAkKHdpbmRvdykub24oJ2NoYW5nZWQuemYubWVkaWFxdWVyeScsIGZ1bmN0aW9uKCkge1xuICAgICAgX3RoaXMuX2NoZWNrTWVkaWFRdWVyaWVzKCk7XG4gICAgfSk7XG4gICAgLy8gJCh3aW5kb3cpLm9uKCdyZXNpemUuemYuUmVzcG9uc2l2ZU1lbnUnLCBmdW5jdGlvbigpIHtcbiAgICAvLyAgIF90aGlzLl9jaGVja01lZGlhUXVlcmllcygpO1xuICAgIC8vIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB0aGUgY3VycmVudCBzY3JlZW4gd2lkdGggYWdhaW5zdCBhdmFpbGFibGUgbWVkaWEgcXVlcmllcy4gSWYgdGhlIG1lZGlhIHF1ZXJ5IGhhcyBjaGFuZ2VkLCBhbmQgdGhlIHBsdWdpbiBuZWVkZWQgaGFzIGNoYW5nZWQsIHRoZSBwbHVnaW5zIHdpbGwgc3dhcCBvdXQuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2NoZWNrTWVkaWFRdWVyaWVzKCkge1xuICAgIHZhciBtYXRjaGVkTXEsIF90aGlzID0gdGhpcztcbiAgICAvLyBJdGVyYXRlIHRocm91Z2ggZWFjaCBydWxlIGFuZCBmaW5kIHRoZSBsYXN0IG1hdGNoaW5nIHJ1bGVcbiAgICAkLmVhY2godGhpcy5ydWxlcywgZnVuY3Rpb24oa2V5KSB7XG4gICAgICBpZiAoRm91bmRhdGlvbi5NZWRpYVF1ZXJ5LmF0TGVhc3Qoa2V5KSkge1xuICAgICAgICBtYXRjaGVkTXEgPSBrZXk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBObyBtYXRjaD8gTm8gZGljZVxuICAgIGlmICghbWF0Y2hlZE1xKSByZXR1cm47XG5cbiAgICAvLyBQbHVnaW4gYWxyZWFkeSBpbml0aWFsaXplZD8gV2UgZ29vZFxuICAgIGlmICh0aGlzLmN1cnJlbnRQbHVnaW4gaW5zdGFuY2VvZiB0aGlzLnJ1bGVzW21hdGNoZWRNcV0ucGx1Z2luKSByZXR1cm47XG5cbiAgICAvLyBSZW1vdmUgZXhpc3RpbmcgcGx1Z2luLXNwZWNpZmljIENTUyBjbGFzc2VzXG4gICAgJC5lYWNoKE1lbnVQbHVnaW5zLCBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG4gICAgICBfdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcyh2YWx1ZS5jc3NDbGFzcyk7XG4gICAgfSk7XG5cbiAgICAvLyBBZGQgdGhlIENTUyBjbGFzcyBmb3IgdGhlIG5ldyBwbHVnaW5cbiAgICB0aGlzLiRlbGVtZW50LmFkZENsYXNzKHRoaXMucnVsZXNbbWF0Y2hlZE1xXS5jc3NDbGFzcyk7XG5cbiAgICAvLyBDcmVhdGUgYW4gaW5zdGFuY2Ugb2YgdGhlIG5ldyBwbHVnaW5cbiAgICBpZiAodGhpcy5jdXJyZW50UGx1Z2luKSB0aGlzLmN1cnJlbnRQbHVnaW4uZGVzdHJveSgpO1xuICAgIHRoaXMuY3VycmVudFBsdWdpbiA9IG5ldyB0aGlzLnJ1bGVzW21hdGNoZWRNcV0ucGx1Z2luKHRoaXMuJGVsZW1lbnQsIHt9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXN0cm95cyB0aGUgaW5zdGFuY2Ugb2YgdGhlIGN1cnJlbnQgcGx1Z2luIG9uIHRoaXMgZWxlbWVudCwgYXMgd2VsbCBhcyB0aGUgd2luZG93IHJlc2l6ZSBoYW5kbGVyIHRoYXQgc3dpdGNoZXMgdGhlIHBsdWdpbnMgb3V0LlxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIGRlc3Ryb3koKSB7XG4gICAgdGhpcy5jdXJyZW50UGx1Z2luLmRlc3Ryb3koKTtcbiAgICAkKHdpbmRvdykub2ZmKCcuemYuUmVzcG9uc2l2ZU1lbnUnKTtcbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XG4gIH1cbn1cblxuUmVzcG9uc2l2ZU1lbnUuZGVmYXVsdHMgPSB7fTtcblxuLy8gVGhlIHBsdWdpbiBtYXRjaGVzIHRoZSBwbHVnaW4gY2xhc3NlcyB3aXRoIHRoZXNlIHBsdWdpbiBpbnN0YW5jZXMuXG52YXIgTWVudVBsdWdpbnMgPSB7XG4gIGRyb3Bkb3duOiB7XG4gICAgY3NzQ2xhc3M6ICdkcm9wZG93bicsXG4gICAgcGx1Z2luOiBGb3VuZGF0aW9uLl9wbHVnaW5zWydkcm9wZG93bi1tZW51J10gfHwgbnVsbFxuICB9LFxuIGRyaWxsZG93bjoge1xuICAgIGNzc0NsYXNzOiAnZHJpbGxkb3duJyxcbiAgICBwbHVnaW46IEZvdW5kYXRpb24uX3BsdWdpbnNbJ2RyaWxsZG93biddIHx8IG51bGxcbiAgfSxcbiAgYWNjb3JkaW9uOiB7XG4gICAgY3NzQ2xhc3M6ICdhY2NvcmRpb24tbWVudScsXG4gICAgcGx1Z2luOiBGb3VuZGF0aW9uLl9wbHVnaW5zWydhY2NvcmRpb24tbWVudSddIHx8IG51bGxcbiAgfVxufTtcblxuLy8gV2luZG93IGV4cG9ydHNcbkZvdW5kYXRpb24ucGx1Z2luKFJlc3BvbnNpdmVNZW51LCAnUmVzcG9uc2l2ZU1lbnUnKTtcblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG4vKipcbiAqIFJlc3BvbnNpdmVUb2dnbGUgbW9kdWxlLlxuICogQG1vZHVsZSBmb3VuZGF0aW9uLnJlc3BvbnNpdmVUb2dnbGVcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubWVkaWFRdWVyeVxuICovXG5cbmNsYXNzIFJlc3BvbnNpdmVUb2dnbGUge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBUYWIgQmFyLlxuICAgKiBAY2xhc3NcbiAgICogQGZpcmVzIFJlc3BvbnNpdmVUb2dnbGUjaW5pdFxuICAgKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gYXR0YWNoIHRhYiBiYXIgZnVuY3Rpb25hbGl0eSB0by5cbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPdmVycmlkZXMgdG8gdGhlIGRlZmF1bHQgcGx1Z2luIHNldHRpbmdzLlxuICAgKi9cbiAgY29uc3RydWN0b3IoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMuJGVsZW1lbnQgPSAkKGVsZW1lbnQpO1xuICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBSZXNwb25zaXZlVG9nZ2xlLmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XG5cbiAgICB0aGlzLl9pbml0KCk7XG4gICAgdGhpcy5fZXZlbnRzKCk7XG5cbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdSZXNwb25zaXZlVG9nZ2xlJyk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIHRhYiBiYXIgYnkgZmluZGluZyB0aGUgdGFyZ2V0IGVsZW1lbnQsIHRvZ2dsaW5nIGVsZW1lbnQsIGFuZCBydW5uaW5nIHVwZGF0ZSgpLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9pbml0KCkge1xuICAgIHZhciB0YXJnZXRJRCA9IHRoaXMuJGVsZW1lbnQuZGF0YSgncmVzcG9uc2l2ZS10b2dnbGUnKTtcbiAgICBpZiAoIXRhcmdldElEKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdZb3VyIHRhYiBiYXIgbmVlZHMgYW4gSUQgb2YgYSBNZW51IGFzIHRoZSB2YWx1ZSBvZiBkYXRhLXRhYi1iYXIuJyk7XG4gICAgfVxuXG4gICAgdGhpcy4kdGFyZ2V0TWVudSA9ICQoYCMke3RhcmdldElEfWApO1xuICAgIHRoaXMuJHRvZ2dsZXIgPSB0aGlzLiRlbGVtZW50LmZpbmQoJ1tkYXRhLXRvZ2dsZV0nKTtcblxuICAgIHRoaXMuX3VwZGF0ZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgbmVjZXNzYXJ5IGV2ZW50IGhhbmRsZXJzIGZvciB0aGUgdGFiIGJhciB0byB3b3JrLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9ldmVudHMoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIHRoaXMuX3VwZGF0ZU1xSGFuZGxlciA9IHRoaXMuX3VwZGF0ZS5iaW5kKHRoaXMpO1xuICAgIFxuICAgICQod2luZG93KS5vbignY2hhbmdlZC56Zi5tZWRpYXF1ZXJ5JywgdGhpcy5fdXBkYXRlTXFIYW5kbGVyKTtcblxuICAgIHRoaXMuJHRvZ2dsZXIub24oJ2NsaWNrLnpmLnJlc3BvbnNpdmVUb2dnbGUnLCB0aGlzLnRvZ2dsZU1lbnUuYmluZCh0aGlzKSk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHRoZSBjdXJyZW50IG1lZGlhIHF1ZXJ5IHRvIGRldGVybWluZSBpZiB0aGUgdGFiIGJhciBzaG91bGQgYmUgdmlzaWJsZSBvciBoaWRkZW4uXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3VwZGF0ZSgpIHtcbiAgICAvLyBNb2JpbGVcbiAgICBpZiAoIUZvdW5kYXRpb24uTWVkaWFRdWVyeS5hdExlYXN0KHRoaXMub3B0aW9ucy5oaWRlRm9yKSkge1xuICAgICAgdGhpcy4kZWxlbWVudC5zaG93KCk7XG4gICAgICB0aGlzLiR0YXJnZXRNZW51LmhpZGUoKTtcbiAgICB9XG5cbiAgICAvLyBEZXNrdG9wXG4gICAgZWxzZSB7XG4gICAgICB0aGlzLiRlbGVtZW50LmhpZGUoKTtcbiAgICAgIHRoaXMuJHRhcmdldE1lbnUuc2hvdygpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUb2dnbGVzIHRoZSBlbGVtZW50IGF0dGFjaGVkIHRvIHRoZSB0YWIgYmFyLiBUaGUgdG9nZ2xlIG9ubHkgaGFwcGVucyBpZiB0aGUgc2NyZWVuIGlzIHNtYWxsIGVub3VnaCB0byBhbGxvdyBpdC5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBmaXJlcyBSZXNwb25zaXZlVG9nZ2xlI3RvZ2dsZWRcbiAgICovXG4gIHRvZ2dsZU1lbnUoKSB7ICAgXG4gICAgaWYgKCFGb3VuZGF0aW9uLk1lZGlhUXVlcnkuYXRMZWFzdCh0aGlzLm9wdGlvbnMuaGlkZUZvcikpIHtcbiAgICAgIHRoaXMuJHRhcmdldE1lbnUudG9nZ2xlKDApO1xuXG4gICAgICAvKipcbiAgICAgICAqIEZpcmVzIHdoZW4gdGhlIGVsZW1lbnQgYXR0YWNoZWQgdG8gdGhlIHRhYiBiYXIgdG9nZ2xlcy5cbiAgICAgICAqIEBldmVudCBSZXNwb25zaXZlVG9nZ2xlI3RvZ2dsZWRcbiAgICAgICAqL1xuICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCd0b2dnbGVkLnpmLnJlc3BvbnNpdmVUb2dnbGUnKTtcbiAgICB9XG4gIH07XG5cbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLiRlbGVtZW50Lm9mZignLnpmLnJlc3BvbnNpdmVUb2dnbGUnKTtcbiAgICB0aGlzLiR0b2dnbGVyLm9mZignLnpmLnJlc3BvbnNpdmVUb2dnbGUnKTtcbiAgICBcbiAgICAkKHdpbmRvdykub2ZmKCdjaGFuZ2VkLnpmLm1lZGlhcXVlcnknLCB0aGlzLl91cGRhdGVNcUhhbmRsZXIpO1xuICAgIFxuICAgIEZvdW5kYXRpb24udW5yZWdpc3RlclBsdWdpbih0aGlzKTtcbiAgfVxufVxuXG5SZXNwb25zaXZlVG9nZ2xlLmRlZmF1bHRzID0ge1xuICAvKipcbiAgICogVGhlIGJyZWFrcG9pbnQgYWZ0ZXIgd2hpY2ggdGhlIG1lbnUgaXMgYWx3YXlzIHNob3duLCBhbmQgdGhlIHRhYiBiYXIgaXMgaGlkZGVuLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlICdtZWRpdW0nXG4gICAqL1xuICBoaWRlRm9yOiAnbWVkaXVtJ1xufTtcblxuLy8gV2luZG93IGV4cG9ydHNcbkZvdW5kYXRpb24ucGx1Z2luKFJlc3BvbnNpdmVUb2dnbGUsICdSZXNwb25zaXZlVG9nZ2xlJyk7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLyoqXG4gKiBTdGlja3kgbW9kdWxlLlxuICogQG1vZHVsZSBmb3VuZGF0aW9uLnN0aWNreVxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC50cmlnZ2Vyc1xuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5tZWRpYVF1ZXJ5XG4gKi9cblxuY2xhc3MgU3RpY2t5IHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgYSBzdGlja3kgdGhpbmcuXG4gICAqIEBjbGFzc1xuICAgKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gbWFrZSBzdGlja3kuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gb3B0aW9ucyBvYmplY3QgcGFzc2VkIHdoZW4gY3JlYXRpbmcgdGhlIGVsZW1lbnQgcHJvZ3JhbW1hdGljYWxseS5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRlbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgU3RpY2t5LmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XG5cbiAgICB0aGlzLl9pbml0KCk7XG5cbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdTdGlja3knKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgc3RpY2t5IGVsZW1lbnQgYnkgYWRkaW5nIGNsYXNzZXMsIGdldHRpbmcvc2V0dGluZyBkaW1lbnNpb25zLCBicmVha3BvaW50cyBhbmQgYXR0cmlidXRlc1xuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9pbml0KCkge1xuICAgIHZhciAkcGFyZW50ID0gdGhpcy4kZWxlbWVudC5wYXJlbnQoJ1tkYXRhLXN0aWNreS1jb250YWluZXJdJyksXG4gICAgICAgIGlkID0gdGhpcy4kZWxlbWVudFswXS5pZCB8fCBGb3VuZGF0aW9uLkdldFlvRGlnaXRzKDYsICdzdGlja3knKSxcbiAgICAgICAgX3RoaXMgPSB0aGlzO1xuXG4gICAgaWYgKCEkcGFyZW50Lmxlbmd0aCkge1xuICAgICAgdGhpcy53YXNXcmFwcGVkID0gdHJ1ZTtcbiAgICB9XG4gICAgdGhpcy4kY29udGFpbmVyID0gJHBhcmVudC5sZW5ndGggPyAkcGFyZW50IDogJCh0aGlzLm9wdGlvbnMuY29udGFpbmVyKS53cmFwSW5uZXIodGhpcy4kZWxlbWVudCk7XG4gICAgdGhpcy4kY29udGFpbmVyLmFkZENsYXNzKHRoaXMub3B0aW9ucy5jb250YWluZXJDbGFzcyk7XG5cbiAgICB0aGlzLiRlbGVtZW50LmFkZENsYXNzKHRoaXMub3B0aW9ucy5zdGlja3lDbGFzcylcbiAgICAgICAgICAgICAgICAgLmF0dHIoeydkYXRhLXJlc2l6ZSc6IGlkfSk7XG5cbiAgICB0aGlzLnNjcm9sbENvdW50ID0gdGhpcy5vcHRpb25zLmNoZWNrRXZlcnk7XG4gICAgdGhpcy5pc1N0dWNrID0gZmFsc2U7XG4gICAgJCh3aW5kb3cpLm9uZSgnbG9hZC56Zi5zdGlja3knLCBmdW5jdGlvbigpe1xuICAgICAgLy9XZSBjYWxjdWxhdGUgdGhlIGNvbnRhaW5lciBoZWlnaHQgdG8gaGF2ZSBjb3JyZWN0IHZhbHVlcyBmb3IgYW5jaG9yIHBvaW50cyBvZmZzZXQgY2FsY3VsYXRpb24uXG4gICAgICBfdGhpcy5jb250YWluZXJIZWlnaHQgPSBfdGhpcy4kZWxlbWVudC5jc3MoXCJkaXNwbGF5XCIpID09IFwibm9uZVwiID8gMCA6IF90aGlzLiRlbGVtZW50WzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmhlaWdodDtcbiAgICAgIF90aGlzLiRjb250YWluZXIuY3NzKCdoZWlnaHQnLCBfdGhpcy5jb250YWluZXJIZWlnaHQpO1xuICAgICAgX3RoaXMuZWxlbUhlaWdodCA9IF90aGlzLmNvbnRhaW5lckhlaWdodDtcbiAgICAgIGlmKF90aGlzLm9wdGlvbnMuYW5jaG9yICE9PSAnJyl7XG4gICAgICAgIF90aGlzLiRhbmNob3IgPSAkKCcjJyArIF90aGlzLm9wdGlvbnMuYW5jaG9yKTtcbiAgICAgIH1lbHNle1xuICAgICAgICBfdGhpcy5fcGFyc2VQb2ludHMoKTtcbiAgICAgIH1cblxuICAgICAgX3RoaXMuX3NldFNpemVzKGZ1bmN0aW9uKCl7XG4gICAgICAgIF90aGlzLl9jYWxjKGZhbHNlKTtcbiAgICAgIH0pO1xuICAgICAgX3RoaXMuX2V2ZW50cyhpZC5zcGxpdCgnLScpLnJldmVyc2UoKS5qb2luKCctJykpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIElmIHVzaW5nIG11bHRpcGxlIGVsZW1lbnRzIGFzIGFuY2hvcnMsIGNhbGN1bGF0ZXMgdGhlIHRvcCBhbmQgYm90dG9tIHBpeGVsIHZhbHVlcyB0aGUgc3RpY2t5IHRoaW5nIHNob3VsZCBzdGljayBhbmQgdW5zdGljayBvbi5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfcGFyc2VQb2ludHMoKSB7XG4gICAgdmFyIHRvcCA9IHRoaXMub3B0aW9ucy50b3BBbmNob3IgPT0gXCJcIiA/IDEgOiB0aGlzLm9wdGlvbnMudG9wQW5jaG9yLFxuICAgICAgICBidG0gPSB0aGlzLm9wdGlvbnMuYnRtQW5jaG9yPT0gXCJcIiA/IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxIZWlnaHQgOiB0aGlzLm9wdGlvbnMuYnRtQW5jaG9yLFxuICAgICAgICBwdHMgPSBbdG9wLCBidG1dLFxuICAgICAgICBicmVha3MgPSB7fTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gcHRzLmxlbmd0aDsgaSA8IGxlbiAmJiBwdHNbaV07IGkrKykge1xuICAgICAgdmFyIHB0O1xuICAgICAgaWYgKHR5cGVvZiBwdHNbaV0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIHB0ID0gcHRzW2ldO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIHBsYWNlID0gcHRzW2ldLnNwbGl0KCc6JyksXG4gICAgICAgICAgICBhbmNob3IgPSAkKGAjJHtwbGFjZVswXX1gKTtcblxuICAgICAgICBwdCA9IGFuY2hvci5vZmZzZXQoKS50b3A7XG4gICAgICAgIGlmIChwbGFjZVsxXSAmJiBwbGFjZVsxXS50b0xvd2VyQ2FzZSgpID09PSAnYm90dG9tJykge1xuICAgICAgICAgIHB0ICs9IGFuY2hvclswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5oZWlnaHQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGJyZWFrc1tpXSA9IHB0O1xuICAgIH1cblxuXG4gICAgdGhpcy5wb2ludHMgPSBicmVha3M7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgZXZlbnQgaGFuZGxlcnMgZm9yIHRoZSBzY3JvbGxpbmcgZWxlbWVudC5cbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtTdHJpbmd9IGlkIC0gcHN1ZWRvLXJhbmRvbSBpZCBmb3IgdW5pcXVlIHNjcm9sbCBldmVudCBsaXN0ZW5lci5cbiAgICovXG4gIF9ldmVudHMoaWQpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzLFxuICAgICAgICBzY3JvbGxMaXN0ZW5lciA9IHRoaXMuc2Nyb2xsTGlzdGVuZXIgPSBgc2Nyb2xsLnpmLiR7aWR9YDtcbiAgICBpZiAodGhpcy5pc09uKSB7IHJldHVybjsgfVxuICAgIGlmICh0aGlzLmNhblN0aWNrKSB7XG4gICAgICB0aGlzLmlzT24gPSB0cnVlO1xuICAgICAgJCh3aW5kb3cpLm9mZihzY3JvbGxMaXN0ZW5lcilcbiAgICAgICAgICAgICAgIC5vbihzY3JvbGxMaXN0ZW5lciwgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgICBpZiAoX3RoaXMuc2Nyb2xsQ291bnQgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICBfdGhpcy5zY3JvbGxDb3VudCA9IF90aGlzLm9wdGlvbnMuY2hlY2tFdmVyeTtcbiAgICAgICAgICAgICAgICAgICBfdGhpcy5fc2V0U2l6ZXMoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICBfdGhpcy5fY2FsYyhmYWxzZSwgd2luZG93LnBhZ2VZT2Zmc2V0KTtcbiAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICBfdGhpcy5zY3JvbGxDb3VudC0tO1xuICAgICAgICAgICAgICAgICAgIF90aGlzLl9jYWxjKGZhbHNlLCB3aW5kb3cucGFnZVlPZmZzZXQpO1xuICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIHRoaXMuJGVsZW1lbnQub2ZmKCdyZXNpemVtZS56Zi50cmlnZ2VyJylcbiAgICAgICAgICAgICAgICAgLm9uKCdyZXNpemVtZS56Zi50cmlnZ2VyJywgZnVuY3Rpb24oZSwgZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgIF90aGlzLl9zZXRTaXplcyhmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuX2NhbGMoZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICAgICBpZiAoX3RoaXMuY2FuU3RpY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIV90aGlzLmlzT24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLl9ldmVudHMoaWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChfdGhpcy5pc09uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuX3BhdXNlTGlzdGVuZXJzKHNjcm9sbExpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyBldmVudCBoYW5kbGVycyBmb3Igc2Nyb2xsIGFuZCBjaGFuZ2UgZXZlbnRzIG9uIGFuY2hvci5cbiAgICogQGZpcmVzIFN0aWNreSNwYXVzZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gc2Nyb2xsTGlzdGVuZXIgLSB1bmlxdWUsIG5hbWVzcGFjZWQgc2Nyb2xsIGxpc3RlbmVyIGF0dGFjaGVkIHRvIGB3aW5kb3dgXG4gICAqL1xuICBfcGF1c2VMaXN0ZW5lcnMoc2Nyb2xsTGlzdGVuZXIpIHtcbiAgICB0aGlzLmlzT24gPSBmYWxzZTtcbiAgICAkKHdpbmRvdykub2ZmKHNjcm9sbExpc3RlbmVyKTtcblxuICAgIC8qKlxuICAgICAqIEZpcmVzIHdoZW4gdGhlIHBsdWdpbiBpcyBwYXVzZWQgZHVlIHRvIHJlc2l6ZSBldmVudCBzaHJpbmtpbmcgdGhlIHZpZXcuXG4gICAgICogQGV2ZW50IFN0aWNreSNwYXVzZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcigncGF1c2UuemYuc3RpY2t5Jyk7XG4gIH1cblxuICAvKipcbiAgICogQ2FsbGVkIG9uIGV2ZXJ5IGBzY3JvbGxgIGV2ZW50IGFuZCBvbiBgX2luaXRgXG4gICAqIGZpcmVzIGZ1bmN0aW9ucyBiYXNlZCBvbiBib29sZWFucyBhbmQgY2FjaGVkIHZhbHVlc1xuICAgKiBAcGFyYW0ge0Jvb2xlYW59IGNoZWNrU2l6ZXMgLSB0cnVlIGlmIHBsdWdpbiBzaG91bGQgcmVjYWxjdWxhdGUgc2l6ZXMgYW5kIGJyZWFrcG9pbnRzLlxuICAgKiBAcGFyYW0ge051bWJlcn0gc2Nyb2xsIC0gY3VycmVudCBzY3JvbGwgcG9zaXRpb24gcGFzc2VkIGZyb20gc2Nyb2xsIGV2ZW50IGNiIGZ1bmN0aW9uLiBJZiBub3QgcGFzc2VkLCBkZWZhdWx0cyB0byBgd2luZG93LnBhZ2VZT2Zmc2V0YC5cbiAgICovXG4gIF9jYWxjKGNoZWNrU2l6ZXMsIHNjcm9sbCkge1xuICAgIGlmIChjaGVja1NpemVzKSB7IHRoaXMuX3NldFNpemVzKCk7IH1cblxuICAgIGlmICghdGhpcy5jYW5TdGljaykge1xuICAgICAgaWYgKHRoaXMuaXNTdHVjaykge1xuICAgICAgICB0aGlzLl9yZW1vdmVTdGlja3kodHJ1ZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKCFzY3JvbGwpIHsgc2Nyb2xsID0gd2luZG93LnBhZ2VZT2Zmc2V0OyB9XG5cbiAgICBpZiAoc2Nyb2xsID49IHRoaXMudG9wUG9pbnQpIHtcbiAgICAgIGlmIChzY3JvbGwgPD0gdGhpcy5ib3R0b21Qb2ludCkge1xuICAgICAgICBpZiAoIXRoaXMuaXNTdHVjaykge1xuICAgICAgICAgIHRoaXMuX3NldFN0aWNreSgpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAodGhpcy5pc1N0dWNrKSB7XG4gICAgICAgICAgdGhpcy5fcmVtb3ZlU3RpY2t5KGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodGhpcy5pc1N0dWNrKSB7XG4gICAgICAgIHRoaXMuX3JlbW92ZVN0aWNreSh0cnVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2F1c2VzIHRoZSAkZWxlbWVudCB0byBiZWNvbWUgc3R1Y2suXG4gICAqIEFkZHMgYHBvc2l0aW9uOiBmaXhlZDtgLCBhbmQgaGVscGVyIGNsYXNzZXMuXG4gICAqIEBmaXJlcyBTdGlja3kjc3R1Y2t0b1xuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9zZXRTdGlja3koKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcyxcbiAgICAgICAgc3RpY2tUbyA9IHRoaXMub3B0aW9ucy5zdGlja1RvLFxuICAgICAgICBtcmduID0gc3RpY2tUbyA9PT0gJ3RvcCcgPyAnbWFyZ2luVG9wJyA6ICdtYXJnaW5Cb3R0b20nLFxuICAgICAgICBub3RTdHVja1RvID0gc3RpY2tUbyA9PT0gJ3RvcCcgPyAnYm90dG9tJyA6ICd0b3AnLFxuICAgICAgICBjc3MgPSB7fTtcblxuICAgIGNzc1ttcmduXSA9IGAke3RoaXMub3B0aW9uc1ttcmduXX1lbWA7XG4gICAgY3NzW3N0aWNrVG9dID0gMDtcbiAgICBjc3Nbbm90U3R1Y2tUb10gPSAnYXV0byc7XG4gICAgY3NzWydsZWZ0J10gPSB0aGlzLiRjb250YWluZXIub2Zmc2V0KCkubGVmdCArIHBhcnNlSW50KHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKHRoaXMuJGNvbnRhaW5lclswXSlbXCJwYWRkaW5nLWxlZnRcIl0sIDEwKTtcbiAgICB0aGlzLmlzU3R1Y2sgPSB0cnVlO1xuICAgIHRoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3MoYGlzLWFuY2hvcmVkIGlzLWF0LSR7bm90U3R1Y2tUb31gKVxuICAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoYGlzLXN0dWNrIGlzLWF0LSR7c3RpY2tUb31gKVxuICAgICAgICAgICAgICAgICAuY3NzKGNzcylcbiAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAqIEZpcmVzIHdoZW4gdGhlICRlbGVtZW50IGhhcyBiZWNvbWUgYHBvc2l0aW9uOiBmaXhlZDtgXG4gICAgICAgICAgICAgICAgICAqIE5hbWVzcGFjZWQgdG8gYHRvcGAgb3IgYGJvdHRvbWAsIGUuZy4gYHN0aWNreS56Zi5zdHVja3RvOnRvcGBcbiAgICAgICAgICAgICAgICAgICogQGV2ZW50IFN0aWNreSNzdHVja3RvXG4gICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAudHJpZ2dlcihgc3RpY2t5LnpmLnN0dWNrdG86JHtzdGlja1RvfWApO1xuICAgIHRoaXMuJGVsZW1lbnQub24oXCJ0cmFuc2l0aW9uZW5kIHdlYmtpdFRyYW5zaXRpb25FbmQgb1RyYW5zaXRpb25FbmQgb3RyYW5zaXRpb25lbmQgTVNUcmFuc2l0aW9uRW5kXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgX3RoaXMuX3NldFNpemVzKCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ2F1c2VzIHRoZSAkZWxlbWVudCB0byBiZWNvbWUgdW5zdHVjay5cbiAgICogUmVtb3ZlcyBgcG9zaXRpb246IGZpeGVkO2AsIGFuZCBoZWxwZXIgY2xhc3Nlcy5cbiAgICogQWRkcyBvdGhlciBoZWxwZXIgY2xhc3Nlcy5cbiAgICogQHBhcmFtIHtCb29sZWFufSBpc1RvcCAtIHRlbGxzIHRoZSBmdW5jdGlvbiBpZiB0aGUgJGVsZW1lbnQgc2hvdWxkIGFuY2hvciB0byB0aGUgdG9wIG9yIGJvdHRvbSBvZiBpdHMgJGFuY2hvciBlbGVtZW50LlxuICAgKiBAZmlyZXMgU3RpY2t5I3Vuc3R1Y2tmcm9tXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfcmVtb3ZlU3RpY2t5KGlzVG9wKSB7XG4gICAgdmFyIHN0aWNrVG8gPSB0aGlzLm9wdGlvbnMuc3RpY2tUbyxcbiAgICAgICAgc3RpY2tUb1RvcCA9IHN0aWNrVG8gPT09ICd0b3AnLFxuICAgICAgICBjc3MgPSB7fSxcbiAgICAgICAgYW5jaG9yUHQgPSAodGhpcy5wb2ludHMgPyB0aGlzLnBvaW50c1sxXSAtIHRoaXMucG9pbnRzWzBdIDogdGhpcy5hbmNob3JIZWlnaHQpIC0gdGhpcy5lbGVtSGVpZ2h0LFxuICAgICAgICBtcmduID0gc3RpY2tUb1RvcCA/ICdtYXJnaW5Ub3AnIDogJ21hcmdpbkJvdHRvbScsXG4gICAgICAgIG5vdFN0dWNrVG8gPSBzdGlja1RvVG9wID8gJ2JvdHRvbScgOiAndG9wJyxcbiAgICAgICAgdG9wT3JCb3R0b20gPSBpc1RvcCA/ICd0b3AnIDogJ2JvdHRvbSc7XG5cbiAgICBjc3NbbXJnbl0gPSAwO1xuXG4gICAgY3NzWydib3R0b20nXSA9ICdhdXRvJztcbiAgICBpZihpc1RvcCkge1xuICAgICAgY3NzWyd0b3AnXSA9IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNzc1sndG9wJ10gPSBhbmNob3JQdDtcbiAgICB9XG5cbiAgICBjc3NbJ2xlZnQnXSA9ICcnO1xuICAgIHRoaXMuaXNTdHVjayA9IGZhbHNlO1xuICAgIHRoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3MoYGlzLXN0dWNrIGlzLWF0LSR7c3RpY2tUb31gKVxuICAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoYGlzLWFuY2hvcmVkIGlzLWF0LSR7dG9wT3JCb3R0b219YClcbiAgICAgICAgICAgICAgICAgLmNzcyhjc3MpXG4gICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgKiBGaXJlcyB3aGVuIHRoZSAkZWxlbWVudCBoYXMgYmVjb21lIGFuY2hvcmVkLlxuICAgICAgICAgICAgICAgICAgKiBOYW1lc3BhY2VkIHRvIGB0b3BgIG9yIGBib3R0b21gLCBlLmcuIGBzdGlja3kuemYudW5zdHVja2Zyb206Ym90dG9tYFxuICAgICAgICAgICAgICAgICAgKiBAZXZlbnQgU3RpY2t5I3Vuc3R1Y2tmcm9tXG4gICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAudHJpZ2dlcihgc3RpY2t5LnpmLnVuc3R1Y2tmcm9tOiR7dG9wT3JCb3R0b219YCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgJGVsZW1lbnQgYW5kICRjb250YWluZXIgc2l6ZXMgZm9yIHBsdWdpbi5cbiAgICogQ2FsbHMgYF9zZXRCcmVha1BvaW50c2AuXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNiIC0gb3B0aW9uYWwgY2FsbGJhY2sgZnVuY3Rpb24gdG8gZmlyZSBvbiBjb21wbGV0aW9uIG9mIGBfc2V0QnJlYWtQb2ludHNgLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3NldFNpemVzKGNiKSB7XG4gICAgdGhpcy5jYW5TdGljayA9IEZvdW5kYXRpb24uTWVkaWFRdWVyeS5hdExlYXN0KHRoaXMub3B0aW9ucy5zdGlja3lPbik7XG4gICAgaWYgKCF0aGlzLmNhblN0aWNrKSB7XG4gICAgICBpZiAoY2IgJiYgdHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSB7IGNiKCk7IH1cbiAgICB9XG4gICAgdmFyIF90aGlzID0gdGhpcyxcbiAgICAgICAgbmV3RWxlbVdpZHRoID0gdGhpcy4kY29udGFpbmVyWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLndpZHRoLFxuICAgICAgICBjb21wID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUodGhpcy4kY29udGFpbmVyWzBdKSxcbiAgICAgICAgcGRuZyA9IHBhcnNlSW50KGNvbXBbJ3BhZGRpbmctcmlnaHQnXSwgMTApO1xuXG4gICAgaWYgKHRoaXMuJGFuY2hvciAmJiB0aGlzLiRhbmNob3IubGVuZ3RoKSB7XG4gICAgICB0aGlzLmFuY2hvckhlaWdodCA9IHRoaXMuJGFuY2hvclswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5oZWlnaHQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3BhcnNlUG9pbnRzKCk7XG4gICAgfVxuXG4gICAgdGhpcy4kZWxlbWVudC5jc3Moe1xuICAgICAgJ21heC13aWR0aCc6IGAke25ld0VsZW1XaWR0aCAtIHBkbmd9cHhgXG4gICAgfSk7XG5cbiAgICB2YXIgbmV3Q29udGFpbmVySGVpZ2h0ID0gdGhpcy4kZWxlbWVudFswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5oZWlnaHQgfHwgdGhpcy5jb250YWluZXJIZWlnaHQ7XG4gICAgaWYgKHRoaXMuJGVsZW1lbnQuY3NzKFwiZGlzcGxheVwiKSA9PSBcIm5vbmVcIikge1xuICAgICAgbmV3Q29udGFpbmVySGVpZ2h0ID0gMDtcbiAgICB9XG4gICAgdGhpcy5jb250YWluZXJIZWlnaHQgPSBuZXdDb250YWluZXJIZWlnaHQ7XG4gICAgdGhpcy4kY29udGFpbmVyLmNzcyh7XG4gICAgICBoZWlnaHQ6IG5ld0NvbnRhaW5lckhlaWdodFxuICAgIH0pO1xuICAgIHRoaXMuZWxlbUhlaWdodCA9IG5ld0NvbnRhaW5lckhlaWdodDtcblxuICAgIGlmICh0aGlzLmlzU3R1Y2spIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQuY3NzKHtcImxlZnRcIjp0aGlzLiRjb250YWluZXIub2Zmc2V0KCkubGVmdCArIHBhcnNlSW50KGNvbXBbJ3BhZGRpbmctbGVmdCddLCAxMCl9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHRoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ2lzLWF0LWJvdHRvbScpKSB7XG4gICAgICAgIHZhciBhbmNob3JQdCA9ICh0aGlzLnBvaW50cyA/IHRoaXMucG9pbnRzWzFdIC0gdGhpcy4kY29udGFpbmVyLm9mZnNldCgpLnRvcCA6IHRoaXMuYW5jaG9ySGVpZ2h0KSAtIHRoaXMuZWxlbUhlaWdodDtcbiAgICAgICAgdGhpcy4kZWxlbWVudC5jc3MoJ3RvcCcsIGFuY2hvclB0KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLl9zZXRCcmVha1BvaW50cyhuZXdDb250YWluZXJIZWlnaHQsIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKGNiICYmIHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJykgeyBjYigpOyB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgdXBwZXIgYW5kIGxvd2VyIGJyZWFrcG9pbnRzIGZvciB0aGUgZWxlbWVudCB0byBiZWNvbWUgc3RpY2t5L3Vuc3RpY2t5LlxuICAgKiBAcGFyYW0ge051bWJlcn0gZWxlbUhlaWdodCAtIHB4IHZhbHVlIGZvciBzdGlja3kuJGVsZW1lbnQgaGVpZ2h0LCBjYWxjdWxhdGVkIGJ5IGBfc2V0U2l6ZXNgLlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYiAtIG9wdGlvbmFsIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCBvbiBjb21wbGV0aW9uLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3NldEJyZWFrUG9pbnRzKGVsZW1IZWlnaHQsIGNiKSB7XG4gICAgaWYgKCF0aGlzLmNhblN0aWNrKSB7XG4gICAgICBpZiAoY2IgJiYgdHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSB7IGNiKCk7IH1cbiAgICAgIGVsc2UgeyByZXR1cm4gZmFsc2U7IH1cbiAgICB9XG4gICAgdmFyIG1Ub3AgPSBlbUNhbGModGhpcy5vcHRpb25zLm1hcmdpblRvcCksXG4gICAgICAgIG1CdG0gPSBlbUNhbGModGhpcy5vcHRpb25zLm1hcmdpbkJvdHRvbSksXG4gICAgICAgIHRvcFBvaW50ID0gdGhpcy5wb2ludHMgPyB0aGlzLnBvaW50c1swXSA6IHRoaXMuJGFuY2hvci5vZmZzZXQoKS50b3AsXG4gICAgICAgIGJvdHRvbVBvaW50ID0gdGhpcy5wb2ludHMgPyB0aGlzLnBvaW50c1sxXSA6IHRvcFBvaW50ICsgdGhpcy5hbmNob3JIZWlnaHQsXG4gICAgICAgIC8vIHRvcFBvaW50ID0gdGhpcy4kYW5jaG9yLm9mZnNldCgpLnRvcCB8fCB0aGlzLnBvaW50c1swXSxcbiAgICAgICAgLy8gYm90dG9tUG9pbnQgPSB0b3BQb2ludCArIHRoaXMuYW5jaG9ySGVpZ2h0IHx8IHRoaXMucG9pbnRzWzFdLFxuICAgICAgICB3aW5IZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLnN0aWNrVG8gPT09ICd0b3AnKSB7XG4gICAgICB0b3BQb2ludCAtPSBtVG9wO1xuICAgICAgYm90dG9tUG9pbnQgLT0gKGVsZW1IZWlnaHQgKyBtVG9wKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMub3B0aW9ucy5zdGlja1RvID09PSAnYm90dG9tJykge1xuICAgICAgdG9wUG9pbnQgLT0gKHdpbkhlaWdodCAtIChlbGVtSGVpZ2h0ICsgbUJ0bSkpO1xuICAgICAgYm90dG9tUG9pbnQgLT0gKHdpbkhlaWdodCAtIG1CdG0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAvL3RoaXMgd291bGQgYmUgdGhlIHN0aWNrVG86IGJvdGggb3B0aW9uLi4uIHRyaWNreVxuICAgIH1cblxuICAgIHRoaXMudG9wUG9pbnQgPSB0b3BQb2ludDtcbiAgICB0aGlzLmJvdHRvbVBvaW50ID0gYm90dG9tUG9pbnQ7XG5cbiAgICBpZiAoY2IgJiYgdHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSB7IGNiKCk7IH1cbiAgfVxuXG4gIC8qKlxuICAgKiBEZXN0cm95cyB0aGUgY3VycmVudCBzdGlja3kgZWxlbWVudC5cbiAgICogUmVzZXRzIHRoZSBlbGVtZW50IHRvIHRoZSB0b3AgcG9zaXRpb24gZmlyc3QuXG4gICAqIFJlbW92ZXMgZXZlbnQgbGlzdGVuZXJzLCBKUy1hZGRlZCBjc3MgcHJvcGVydGllcyBhbmQgY2xhc3NlcywgYW5kIHVud3JhcHMgdGhlICRlbGVtZW50IGlmIHRoZSBKUyBhZGRlZCB0aGUgJGNvbnRhaW5lci5cbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICBkZXN0cm95KCkge1xuICAgIHRoaXMuX3JlbW92ZVN0aWNreSh0cnVlKTtcblxuICAgIHRoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3MoYCR7dGhpcy5vcHRpb25zLnN0aWNreUNsYXNzfSBpcy1hbmNob3JlZCBpcy1hdC10b3BgKVxuICAgICAgICAgICAgICAgICAuY3NzKHtcbiAgICAgICAgICAgICAgICAgICBoZWlnaHQ6ICcnLFxuICAgICAgICAgICAgICAgICAgIHRvcDogJycsXG4gICAgICAgICAgICAgICAgICAgYm90dG9tOiAnJyxcbiAgICAgICAgICAgICAgICAgICAnbWF4LXdpZHRoJzogJydcbiAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgLm9mZigncmVzaXplbWUuemYudHJpZ2dlcicpO1xuICAgIGlmICh0aGlzLiRhbmNob3IgJiYgdGhpcy4kYW5jaG9yLmxlbmd0aCkge1xuICAgICAgdGhpcy4kYW5jaG9yLm9mZignY2hhbmdlLnpmLnN0aWNreScpO1xuICAgIH1cbiAgICAkKHdpbmRvdykub2ZmKHRoaXMuc2Nyb2xsTGlzdGVuZXIpO1xuXG4gICAgaWYgKHRoaXMud2FzV3JhcHBlZCkge1xuICAgICAgdGhpcy4kZWxlbWVudC51bndyYXAoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy4kY29udGFpbmVyLnJlbW92ZUNsYXNzKHRoaXMub3B0aW9ucy5jb250YWluZXJDbGFzcylcbiAgICAgICAgICAgICAgICAgICAgIC5jc3Moe1xuICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6ICcnXG4gICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICB9XG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xuICB9XG59XG5cblN0aWNreS5kZWZhdWx0cyA9IHtcbiAgLyoqXG4gICAqIEN1c3RvbWl6YWJsZSBjb250YWluZXIgdGVtcGxhdGUuIEFkZCB5b3VyIG93biBjbGFzc2VzIGZvciBzdHlsaW5nIGFuZCBzaXppbmcuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgJyZsdDtkaXYgZGF0YS1zdGlja3ktY29udGFpbmVyIGNsYXNzPVwic21hbGwtNiBjb2x1bW5zXCImZ3Q7Jmx0Oy9kaXYmZ3Q7J1xuICAgKi9cbiAgY29udGFpbmVyOiAnPGRpdiBkYXRhLXN0aWNreS1jb250YWluZXI+PC9kaXY+JyxcbiAgLyoqXG4gICAqIExvY2F0aW9uIGluIHRoZSB2aWV3IHRoZSBlbGVtZW50IHN0aWNrcyB0by5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAndG9wJ1xuICAgKi9cbiAgc3RpY2tUbzogJ3RvcCcsXG4gIC8qKlxuICAgKiBJZiBhbmNob3JlZCB0byBhIHNpbmdsZSBlbGVtZW50LCB0aGUgaWQgb2YgdGhhdCBlbGVtZW50LlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlICdleGFtcGxlSWQnXG4gICAqL1xuICBhbmNob3I6ICcnLFxuICAvKipcbiAgICogSWYgdXNpbmcgbW9yZSB0aGFuIG9uZSBlbGVtZW50IGFzIGFuY2hvciBwb2ludHMsIHRoZSBpZCBvZiB0aGUgdG9wIGFuY2hvci5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAnZXhhbXBsZUlkOnRvcCdcbiAgICovXG4gIHRvcEFuY2hvcjogJycsXG4gIC8qKlxuICAgKiBJZiB1c2luZyBtb3JlIHRoYW4gb25lIGVsZW1lbnQgYXMgYW5jaG9yIHBvaW50cywgdGhlIGlkIG9mIHRoZSBib3R0b20gYW5jaG9yLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlICdleGFtcGxlSWQ6Ym90dG9tJ1xuICAgKi9cbiAgYnRtQW5jaG9yOiAnJyxcbiAgLyoqXG4gICAqIE1hcmdpbiwgaW4gYGVtYCdzIHRvIGFwcGx5IHRvIHRoZSB0b3Agb2YgdGhlIGVsZW1lbnQgd2hlbiBpdCBiZWNvbWVzIHN0aWNreS5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAxXG4gICAqL1xuICBtYXJnaW5Ub3A6IDEsXG4gIC8qKlxuICAgKiBNYXJnaW4sIGluIGBlbWAncyB0byBhcHBseSB0byB0aGUgYm90dG9tIG9mIHRoZSBlbGVtZW50IHdoZW4gaXQgYmVjb21lcyBzdGlja3kuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgMVxuICAgKi9cbiAgbWFyZ2luQm90dG9tOiAxLFxuICAvKipcbiAgICogQnJlYWtwb2ludCBzdHJpbmcgdGhhdCBpcyB0aGUgbWluaW11bSBzY3JlZW4gc2l6ZSBhbiBlbGVtZW50IHNob3VsZCBiZWNvbWUgc3RpY2t5LlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlICdtZWRpdW0nXG4gICAqL1xuICBzdGlja3lPbjogJ21lZGl1bScsXG4gIC8qKlxuICAgKiBDbGFzcyBhcHBsaWVkIHRvIHN0aWNreSBlbGVtZW50LCBhbmQgcmVtb3ZlZCBvbiBkZXN0cnVjdGlvbi4gRm91bmRhdGlvbiBkZWZhdWx0cyB0byBgc3RpY2t5YC5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAnc3RpY2t5J1xuICAgKi9cbiAgc3RpY2t5Q2xhc3M6ICdzdGlja3knLFxuICAvKipcbiAgICogQ2xhc3MgYXBwbGllZCB0byBzdGlja3kgY29udGFpbmVyLiBGb3VuZGF0aW9uIGRlZmF1bHRzIHRvIGBzdGlja3ktY29udGFpbmVyYC5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAnc3RpY2t5LWNvbnRhaW5lcidcbiAgICovXG4gIGNvbnRhaW5lckNsYXNzOiAnc3RpY2t5LWNvbnRhaW5lcicsXG4gIC8qKlxuICAgKiBOdW1iZXIgb2Ygc2Nyb2xsIGV2ZW50cyBiZXR3ZWVuIHRoZSBwbHVnaW4ncyByZWNhbGN1bGF0aW5nIHN0aWNreSBwb2ludHMuIFNldHRpbmcgaXQgdG8gYDBgIHdpbGwgY2F1c2UgaXQgdG8gcmVjYWxjIGV2ZXJ5IHNjcm9sbCBldmVudCwgc2V0dGluZyBpdCB0byBgLTFgIHdpbGwgcHJldmVudCByZWNhbGMgb24gc2Nyb2xsLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIDUwXG4gICAqL1xuICBjaGVja0V2ZXJ5OiAtMVxufTtcblxuLyoqXG4gKiBIZWxwZXIgZnVuY3Rpb24gdG8gY2FsY3VsYXRlIGVtIHZhbHVlc1xuICogQHBhcmFtIE51bWJlciB7ZW19IC0gbnVtYmVyIG9mIGVtJ3MgdG8gY2FsY3VsYXRlIGludG8gcGl4ZWxzXG4gKi9cbmZ1bmN0aW9uIGVtQ2FsYyhlbSkge1xuICByZXR1cm4gcGFyc2VJbnQod2luZG93LmdldENvbXB1dGVkU3R5bGUoZG9jdW1lbnQuYm9keSwgbnVsbCkuZm9udFNpemUsIDEwKSAqIGVtO1xufVxuXG4vLyBXaW5kb3cgZXhwb3J0c1xuRm91bmRhdGlvbi5wbHVnaW4oU3RpY2t5LCAnU3RpY2t5Jyk7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLyoqXG4gKiBUb2dnbGVyIG1vZHVsZS5cbiAqIEBtb2R1bGUgZm91bmRhdGlvbi50b2dnbGVyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm1vdGlvblxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC50cmlnZ2Vyc1xuICovXG5cbmNsYXNzIFRvZ2dsZXIge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBUb2dnbGVyLlxuICAgKiBAY2xhc3NcbiAgICogQGZpcmVzIFRvZ2dsZXIjaW5pdFxuICAgKiBAcGFyYW0ge09iamVjdH0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gYWRkIHRoZSB0cmlnZ2VyIHRvLlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE92ZXJyaWRlcyB0byB0aGUgZGVmYXVsdCBwbHVnaW4gc2V0dGluZ3MuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIFRvZ2dsZXIuZGVmYXVsdHMsIGVsZW1lbnQuZGF0YSgpLCBvcHRpb25zKTtcbiAgICB0aGlzLmNsYXNzTmFtZSA9ICcnO1xuXG4gICAgdGhpcy5faW5pdCgpO1xuICAgIHRoaXMuX2V2ZW50cygpO1xuXG4gICAgRm91bmRhdGlvbi5yZWdpc3RlclBsdWdpbih0aGlzLCAnVG9nZ2xlcicpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHRoZSBUb2dnbGVyIHBsdWdpbiBieSBwYXJzaW5nIHRoZSB0b2dnbGUgY2xhc3MgZnJvbSBkYXRhLXRvZ2dsZXIsIG9yIGFuaW1hdGlvbiBjbGFzc2VzIGZyb20gZGF0YS1hbmltYXRlLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9pbml0KCkge1xuICAgIHZhciBpbnB1dDtcbiAgICAvLyBQYXJzZSBhbmltYXRpb24gY2xhc3NlcyBpZiB0aGV5IHdlcmUgc2V0XG4gICAgaWYgKHRoaXMub3B0aW9ucy5hbmltYXRlKSB7XG4gICAgICBpbnB1dCA9IHRoaXMub3B0aW9ucy5hbmltYXRlLnNwbGl0KCcgJyk7XG5cbiAgICAgIHRoaXMuYW5pbWF0aW9uSW4gPSBpbnB1dFswXTtcbiAgICAgIHRoaXMuYW5pbWF0aW9uT3V0ID0gaW5wdXRbMV0gfHwgbnVsbDtcbiAgICB9XG4gICAgLy8gT3RoZXJ3aXNlLCBwYXJzZSB0b2dnbGUgY2xhc3NcbiAgICBlbHNlIHtcbiAgICAgIGlucHV0ID0gdGhpcy4kZWxlbWVudC5kYXRhKCd0b2dnbGVyJyk7XG4gICAgICAvLyBBbGxvdyBmb3IgYSAuIGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIHN0cmluZ1xuICAgICAgdGhpcy5jbGFzc05hbWUgPSBpbnB1dFswXSA9PT0gJy4nID8gaW5wdXQuc2xpY2UoMSkgOiBpbnB1dDtcbiAgICB9XG5cbiAgICAvLyBBZGQgQVJJQSBhdHRyaWJ1dGVzIHRvIHRyaWdnZXJzXG4gICAgdmFyIGlkID0gdGhpcy4kZWxlbWVudFswXS5pZDtcbiAgICAkKGBbZGF0YS1vcGVuPVwiJHtpZH1cIl0sIFtkYXRhLWNsb3NlPVwiJHtpZH1cIl0sIFtkYXRhLXRvZ2dsZT1cIiR7aWR9XCJdYClcbiAgICAgIC5hdHRyKCdhcmlhLWNvbnRyb2xzJywgaWQpO1xuICAgIC8vIElmIHRoZSB0YXJnZXQgaXMgaGlkZGVuLCBhZGQgYXJpYS1oaWRkZW5cbiAgICB0aGlzLiRlbGVtZW50LmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCB0aGlzLiRlbGVtZW50LmlzKCc6aGlkZGVuJykgPyBmYWxzZSA6IHRydWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIGV2ZW50cyBmb3IgdGhlIHRvZ2dsZSB0cmlnZ2VyLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9ldmVudHMoKSB7XG4gICAgdGhpcy4kZWxlbWVudC5vZmYoJ3RvZ2dsZS56Zi50cmlnZ2VyJykub24oJ3RvZ2dsZS56Zi50cmlnZ2VyJywgdGhpcy50b2dnbGUuYmluZCh0aGlzKSk7XG4gIH1cblxuICAvKipcbiAgICogVG9nZ2xlcyB0aGUgdGFyZ2V0IGNsYXNzIG9uIHRoZSB0YXJnZXQgZWxlbWVudC4gQW4gZXZlbnQgaXMgZmlyZWQgZnJvbSB0aGUgb3JpZ2luYWwgdHJpZ2dlciBkZXBlbmRpbmcgb24gaWYgdGhlIHJlc3VsdGFudCBzdGF0ZSB3YXMgXCJvblwiIG9yIFwib2ZmXCIuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAZmlyZXMgVG9nZ2xlciNvblxuICAgKiBAZmlyZXMgVG9nZ2xlciNvZmZcbiAgICovXG4gIHRvZ2dsZSgpIHtcbiAgICB0aGlzWyB0aGlzLm9wdGlvbnMuYW5pbWF0ZSA/ICdfdG9nZ2xlQW5pbWF0ZScgOiAnX3RvZ2dsZUNsYXNzJ10oKTtcbiAgfVxuXG4gIF90b2dnbGVDbGFzcygpIHtcbiAgICB0aGlzLiRlbGVtZW50LnRvZ2dsZUNsYXNzKHRoaXMuY2xhc3NOYW1lKTtcblxuICAgIHZhciBpc09uID0gdGhpcy4kZWxlbWVudC5oYXNDbGFzcyh0aGlzLmNsYXNzTmFtZSk7XG4gICAgaWYgKGlzT24pIHtcbiAgICAgIC8qKlxuICAgICAgICogRmlyZXMgaWYgdGhlIHRhcmdldCBlbGVtZW50IGhhcyB0aGUgY2xhc3MgYWZ0ZXIgYSB0b2dnbGUuXG4gICAgICAgKiBAZXZlbnQgVG9nZ2xlciNvblxuICAgICAgICovXG4gICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ29uLnpmLnRvZ2dsZXInKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAvKipcbiAgICAgICAqIEZpcmVzIGlmIHRoZSB0YXJnZXQgZWxlbWVudCBkb2VzIG5vdCBoYXZlIHRoZSBjbGFzcyBhZnRlciBhIHRvZ2dsZS5cbiAgICAgICAqIEBldmVudCBUb2dnbGVyI29mZlxuICAgICAgICovXG4gICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ29mZi56Zi50b2dnbGVyJyk7XG4gICAgfVxuXG4gICAgdGhpcy5fdXBkYXRlQVJJQShpc09uKTtcbiAgfVxuXG4gIF90b2dnbGVBbmltYXRlKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICBpZiAodGhpcy4kZWxlbWVudC5pcygnOmhpZGRlbicpKSB7XG4gICAgICBGb3VuZGF0aW9uLk1vdGlvbi5hbmltYXRlSW4odGhpcy4kZWxlbWVudCwgdGhpcy5hbmltYXRpb25JbiwgZnVuY3Rpb24oKSB7XG4gICAgICAgIF90aGlzLl91cGRhdGVBUklBKHRydWUpO1xuICAgICAgICB0aGlzLnRyaWdnZXIoJ29uLnpmLnRvZ2dsZXInKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIEZvdW5kYXRpb24uTW90aW9uLmFuaW1hdGVPdXQodGhpcy4kZWxlbWVudCwgdGhpcy5hbmltYXRpb25PdXQsIGZ1bmN0aW9uKCkge1xuICAgICAgICBfdGhpcy5fdXBkYXRlQVJJQShmYWxzZSk7XG4gICAgICAgIHRoaXMudHJpZ2dlcignb2ZmLnpmLnRvZ2dsZXInKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIF91cGRhdGVBUklBKGlzT24pIHtcbiAgICB0aGlzLiRlbGVtZW50LmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCBpc09uID8gdHJ1ZSA6IGZhbHNlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXN0cm95cyB0aGUgaW5zdGFuY2Ugb2YgVG9nZ2xlciBvbiB0aGUgZWxlbWVudC5cbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICBkZXN0cm95KCkge1xuICAgIHRoaXMuJGVsZW1lbnQub2ZmKCcuemYudG9nZ2xlcicpO1xuICAgIEZvdW5kYXRpb24udW5yZWdpc3RlclBsdWdpbih0aGlzKTtcbiAgfVxufVxuXG5Ub2dnbGVyLmRlZmF1bHRzID0ge1xuICAvKipcbiAgICogVGVsbHMgdGhlIHBsdWdpbiBpZiB0aGUgZWxlbWVudCBzaG91bGQgYW5pbWF0ZWQgd2hlbiB0b2dnbGVkLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIGZhbHNlXG4gICAqL1xuICBhbmltYXRlOiBmYWxzZVxufTtcblxuLy8gV2luZG93IGV4cG9ydHNcbkZvdW5kYXRpb24ucGx1Z2luKFRvZ2dsZXIsICdUb2dnbGVyJyk7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLy8gUG9seWZpbGwgZm9yIHJlcXVlc3RBbmltYXRpb25GcmFtZVxuKGZ1bmN0aW9uKCkge1xuICBpZiAoIURhdGUubm93KVxuICAgIERhdGUubm93ID0gZnVuY3Rpb24oKSB7IHJldHVybiBuZXcgRGF0ZSgpLmdldFRpbWUoKTsgfTtcblxuICB2YXIgdmVuZG9ycyA9IFsnd2Via2l0JywgJ21veiddO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHZlbmRvcnMubGVuZ3RoICYmICF3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lOyArK2kpIHtcbiAgICAgIHZhciB2cCA9IHZlbmRvcnNbaV07XG4gICAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gd2luZG93W3ZwKydSZXF1ZXN0QW5pbWF0aW9uRnJhbWUnXTtcbiAgICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSA9ICh3aW5kb3dbdnArJ0NhbmNlbEFuaW1hdGlvbkZyYW1lJ11cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHx8IHdpbmRvd1t2cCsnQ2FuY2VsUmVxdWVzdEFuaW1hdGlvbkZyYW1lJ10pO1xuICB9XG4gIGlmICgvaVAoYWR8aG9uZXxvZCkuKk9TIDYvLnRlc3Qod2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQpXG4gICAgfHwgIXdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgIXdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSkge1xuICAgIHZhciBsYXN0VGltZSA9IDA7XG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBub3cgPSBEYXRlLm5vdygpO1xuICAgICAgICB2YXIgbmV4dFRpbWUgPSBNYXRoLm1heChsYXN0VGltZSArIDE2LCBub3cpO1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW5jdGlvbigpIHsgY2FsbGJhY2sobGFzdFRpbWUgPSBuZXh0VGltZSk7IH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG5leHRUaW1lIC0gbm93KTtcbiAgICB9O1xuICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSA9IGNsZWFyVGltZW91dDtcbiAgfVxufSkoKTtcblxudmFyIGluaXRDbGFzc2VzICAgPSBbJ211aS1lbnRlcicsICdtdWktbGVhdmUnXTtcbnZhciBhY3RpdmVDbGFzc2VzID0gWydtdWktZW50ZXItYWN0aXZlJywgJ211aS1sZWF2ZS1hY3RpdmUnXTtcblxuLy8gRmluZCB0aGUgcmlnaHQgXCJ0cmFuc2l0aW9uZW5kXCIgZXZlbnQgZm9yIHRoaXMgYnJvd3NlclxudmFyIGVuZEV2ZW50ID0gKGZ1bmN0aW9uKCkge1xuICB2YXIgdHJhbnNpdGlvbnMgPSB7XG4gICAgJ3RyYW5zaXRpb24nOiAndHJhbnNpdGlvbmVuZCcsXG4gICAgJ1dlYmtpdFRyYW5zaXRpb24nOiAnd2Via2l0VHJhbnNpdGlvbkVuZCcsXG4gICAgJ01velRyYW5zaXRpb24nOiAndHJhbnNpdGlvbmVuZCcsXG4gICAgJ09UcmFuc2l0aW9uJzogJ290cmFuc2l0aW9uZW5kJ1xuICB9XG4gIHZhciBlbGVtID0gd2luZG93LmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXG4gIGZvciAodmFyIHQgaW4gdHJhbnNpdGlvbnMpIHtcbiAgICBpZiAodHlwZW9mIGVsZW0uc3R5bGVbdF0gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXR1cm4gdHJhbnNpdGlvbnNbdF07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59KSgpO1xuXG5mdW5jdGlvbiBhbmltYXRlKGlzSW4sIGVsZW1lbnQsIGFuaW1hdGlvbiwgY2IpIHtcbiAgZWxlbWVudCA9ICQoZWxlbWVudCkuZXEoMCk7XG5cbiAgaWYgKCFlbGVtZW50Lmxlbmd0aCkgcmV0dXJuO1xuXG4gIGlmIChlbmRFdmVudCA9PT0gbnVsbCkge1xuICAgIGlzSW4gPyBlbGVtZW50LnNob3coKSA6IGVsZW1lbnQuaGlkZSgpO1xuICAgIGNiKCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIGluaXRDbGFzcyA9IGlzSW4gPyBpbml0Q2xhc3Nlc1swXSA6IGluaXRDbGFzc2VzWzFdO1xuICB2YXIgYWN0aXZlQ2xhc3MgPSBpc0luID8gYWN0aXZlQ2xhc3Nlc1swXSA6IGFjdGl2ZUNsYXNzZXNbMV07XG5cbiAgLy8gU2V0IHVwIHRoZSBhbmltYXRpb25cbiAgcmVzZXQoKTtcbiAgZWxlbWVudC5hZGRDbGFzcyhhbmltYXRpb24pO1xuICBlbGVtZW50LmNzcygndHJhbnNpdGlvbicsICdub25lJyk7XG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZShmdW5jdGlvbigpIHtcbiAgICBlbGVtZW50LmFkZENsYXNzKGluaXRDbGFzcyk7XG4gICAgaWYgKGlzSW4pIGVsZW1lbnQuc2hvdygpO1xuICB9KTtcblxuICAvLyBTdGFydCB0aGUgYW5pbWF0aW9uXG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZShmdW5jdGlvbigpIHtcbiAgICBlbGVtZW50WzBdLm9mZnNldFdpZHRoO1xuICAgIGVsZW1lbnQuY3NzKCd0cmFuc2l0aW9uJywgJycpO1xuICAgIGVsZW1lbnQuYWRkQ2xhc3MoYWN0aXZlQ2xhc3MpO1xuICB9KTtcblxuICAvLyBDbGVhbiB1cCB0aGUgYW5pbWF0aW9uIHdoZW4gaXQgZmluaXNoZXNcbiAgZWxlbWVudC5vbmUoJ3RyYW5zaXRpb25lbmQnLCBmaW5pc2gpO1xuXG4gIC8vIEhpZGVzIHRoZSBlbGVtZW50IChmb3Igb3V0IGFuaW1hdGlvbnMpLCByZXNldHMgdGhlIGVsZW1lbnQsIGFuZCBydW5zIGEgY2FsbGJhY2tcbiAgZnVuY3Rpb24gZmluaXNoKCkge1xuICAgIGlmICghaXNJbikgZWxlbWVudC5oaWRlKCk7XG4gICAgcmVzZXQoKTtcbiAgICBpZiAoY2IpIGNiLmFwcGx5KGVsZW1lbnQpO1xuICB9XG5cbiAgLy8gUmVzZXRzIHRyYW5zaXRpb25zIGFuZCByZW1vdmVzIG1vdGlvbi1zcGVjaWZpYyBjbGFzc2VzXG4gIGZ1bmN0aW9uIHJlc2V0KCkge1xuICAgIGVsZW1lbnRbMF0uc3R5bGUudHJhbnNpdGlvbkR1cmF0aW9uID0gMDtcbiAgICBlbGVtZW50LnJlbW92ZUNsYXNzKGluaXRDbGFzcyArICcgJyArIGFjdGl2ZUNsYXNzICsgJyAnICsgYW5pbWF0aW9uKTtcbiAgfVxufVxuXG52YXIgTW90aW9uVUkgPSB7XG4gIGFuaW1hdGVJbjogZnVuY3Rpb24oZWxlbWVudCwgYW5pbWF0aW9uLCBjYikge1xuICAgIGFuaW1hdGUodHJ1ZSwgZWxlbWVudCwgYW5pbWF0aW9uLCBjYik7XG4gIH0sXG5cbiAgYW5pbWF0ZU91dDogZnVuY3Rpb24oZWxlbWVudCwgYW5pbWF0aW9uLCBjYikge1xuICAgIGFuaW1hdGUoZmFsc2UsIGVsZW1lbnQsIGFuaW1hdGlvbiwgY2IpO1xuICB9XG59XG4iLCIvKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIGZvdW5kYXRpb24tZGF0ZXBpY2tlci5qc1xuICogQ29weXJpZ2h0IDIwMTUgUGV0ZXIgQmVubywgbmFqbGVwc2l3ZWJkZXNpZ25lckBnbWFpbC5jb20sIEBiZW5vcGV0ZXJcbiAqIHByb2plY3Qgd2Vic2l0ZSBodHRwOi8vZm91bmRhdGlvbi1kYXRlcGlja2VyLnBldGVyYmVuby5jb21cbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSAqL1xuISBmdW5jdGlvbigkKSB7XG5cbiAgICBmdW5jdGlvbiBVVENEYXRlKCkge1xuICAgICAgICByZXR1cm4gbmV3IERhdGUoRGF0ZS5VVEMuYXBwbHkoRGF0ZSwgYXJndW1lbnRzKSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gVVRDVG9kYXkoKSB7XG4gICAgICAgIHZhciB0b2RheSA9IG5ldyBEYXRlKCk7XG4gICAgICAgIHJldHVybiBVVENEYXRlKHRvZGF5LmdldFVUQ0Z1bGxZZWFyKCksIHRvZGF5LmdldFVUQ01vbnRoKCksIHRvZGF5LmdldFVUQ0RhdGUoKSk7XG4gICAgfVxuXG4gICAgdmFyIERhdGVwaWNrZXIgPSBmdW5jdGlvbihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgICAgICB0aGlzLmVsZW1lbnQgPSAkKGVsZW1lbnQpO1xuICAgICAgICB0aGlzLmF1dG9TaG93ID0gKG9wdGlvbnMuYXV0b1Nob3cgPT0gdW5kZWZpbmVkID8gdHJ1ZSA6IG9wdGlvbnMuYXV0b1Nob3cpO1xuICAgICAgICB0aGlzLmFwcGVuZFRvID0gb3B0aW9ucy5hcHBlbmRUbyB8fCAnYm9keSc7XG4gICAgICAgIHRoaXMuY2xvc2VCdXR0b24gPSBvcHRpb25zLmNsb3NlQnV0dG9uO1xuICAgICAgICB0aGlzLmxhbmd1YWdlID0gb3B0aW9ucy5sYW5ndWFnZSB8fCB0aGlzLmVsZW1lbnQuZGF0YSgnZGF0ZS1sYW5ndWFnZScpIHx8IFwiZW5cIjtcbiAgICAgICAgdGhpcy5sYW5ndWFnZSA9IHRoaXMubGFuZ3VhZ2UgaW4gZGF0ZXMgPyB0aGlzLmxhbmd1YWdlIDogdGhpcy5sYW5ndWFnZS5zcGxpdCgnLScpWzBdOyAvL0NoZWNrIGlmIFwiZGUtREVcIiBzdHlsZSBkYXRlIGlzIGF2YWlsYWJsZSwgaWYgbm90IGxhbmd1YWdlIHNob3VsZCBmYWxsYmFjayB0byAyIGxldHRlciBjb2RlIGVnIFwiZGVcIlxuICAgICAgICB0aGlzLmxhbmd1YWdlID0gdGhpcy5sYW5ndWFnZSBpbiBkYXRlcyA/IHRoaXMubGFuZ3VhZ2UgOiBcImVuXCI7XG4gICAgICAgIHRoaXMuaXNSVEwgPSBkYXRlc1t0aGlzLmxhbmd1YWdlXS5ydGwgfHwgZmFsc2U7XG4gICAgICAgIHRoaXMuZm9ybWF0ID0gRFBHbG9iYWwucGFyc2VGb3JtYXQob3B0aW9ucy5mb3JtYXQgfHwgdGhpcy5lbGVtZW50LmRhdGEoJ2RhdGUtZm9ybWF0JykgfHwgZGF0ZXNbdGhpcy5sYW5ndWFnZV0uZm9ybWF0IHx8ICdtbS9kZC95eXl5Jyk7XG4gICAgICAgIHRoaXMuZm9ybWF0VGV4dCA9IG9wdGlvbnMuZm9ybWF0IHx8IHRoaXMuZWxlbWVudC5kYXRhKCdkYXRlLWZvcm1hdCcpIHx8IGRhdGVzW3RoaXMubGFuZ3VhZ2VdLmZvcm1hdCB8fCAnbW0vZGQveXl5eSc7XG4gICAgICAgIHRoaXMuaXNJbmxpbmUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5pc0lucHV0ID0gdGhpcy5lbGVtZW50LmlzKCdpbnB1dCcpO1xuICAgICAgICB0aGlzLmNvbXBvbmVudCA9IHRoaXMuZWxlbWVudC5pcygnLmRhdGUnKSA/IHRoaXMuZWxlbWVudC5maW5kKCcucHJlZml4LCAucG9zdGZpeCcpIDogZmFsc2U7XG4gICAgICAgIHRoaXMuaGFzSW5wdXQgPSB0aGlzLmNvbXBvbmVudCAmJiB0aGlzLmVsZW1lbnQuZmluZCgnaW5wdXQnKS5sZW5ndGg7XG4gICAgICAgIHRoaXMuZGlzYWJsZURibENsaWNrU2VsZWN0aW9uID0gb3B0aW9ucy5kaXNhYmxlRGJsQ2xpY2tTZWxlY3Rpb247XG4gICAgICAgIHRoaXMub25SZW5kZXIgPSBvcHRpb25zLm9uUmVuZGVyIHx8IGZ1bmN0aW9uKCkge307XG4gICAgICAgIGlmICh0aGlzLmNvbXBvbmVudCAmJiB0aGlzLmNvbXBvbmVudC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHRoaXMuY29tcG9uZW50ID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5saW5rRmllbGQgPSBvcHRpb25zLmxpbmtGaWVsZCB8fCB0aGlzLmVsZW1lbnQuZGF0YSgnbGluay1maWVsZCcpIHx8IGZhbHNlO1xuICAgICAgICB0aGlzLmxpbmtGb3JtYXQgPSBEUEdsb2JhbC5wYXJzZUZvcm1hdChvcHRpb25zLmxpbmtGb3JtYXQgfHwgdGhpcy5lbGVtZW50LmRhdGEoJ2xpbmstZm9ybWF0JykgfHwgJ3l5eXktbW0tZGQgaGg6aWk6c3MnKTtcbiAgICAgICAgdGhpcy5taW51dGVTdGVwID0gb3B0aW9ucy5taW51dGVTdGVwIHx8IHRoaXMuZWxlbWVudC5kYXRhKCdtaW51dGUtc3RlcCcpIHx8IDU7XG4gICAgICAgIHRoaXMucGlja2VyUG9zaXRpb24gPSBvcHRpb25zLnBpY2tlclBvc2l0aW9uIHx8IHRoaXMuZWxlbWVudC5kYXRhKCdwaWNrZXItcG9zaXRpb24nKSB8fCAnYm90dG9tLXJpZ2h0JztcbiAgICAgICAgdGhpcy5pbml0aWFsRGF0ZSA9IG9wdGlvbnMuaW5pdGlhbERhdGUgfHwgbnVsbDtcbiAgICAgICAgdGhpcy5mYUNTU3ByZWZpeCA9IG9wdGlvbnMuZmFDU1NwcmVmaXggfHwgJ2ZhJztcbiAgICAgICAgdGhpcy5sZWZ0QXJyb3cgPSBvcHRpb25zLmxlZnRBcnJvdyB8fCAnPGkgY2xhc3M9XCInICsgdGhpcy5mYUNTU3ByZWZpeCArICcgJyArIHRoaXMuZmFDU1NwcmVmaXggKyAnLWNoZXZyb24tbGVmdCBmaS1hcnJvdy1sZWZ0XCIvPic7XG4gICAgICAgIHRoaXMucmlnaHRBcnJvdyA9IG9wdGlvbnMucmlnaHRBcnJvdyB8fCAnPGkgY2xhc3M9XCInICsgdGhpcy5mYUNTU3ByZWZpeCArICcgJyArIHRoaXMuZmFDU1NwcmVmaXggKyAnLWNoZXZyb24tcmlnaHQgZmktYXJyb3ctcmlnaHRcIi8+JztcbiAgICAgICAgdGhpcy5jbG9zZUljb24gPSBvcHRpb25zLmNsb3NlSWNvbiB8fCAnPGkgY2xhc3M9XCInICsgdGhpcy5mYUNTU3ByZWZpeCArICcgJyArIHRoaXMuZmFDU1NwcmVmaXggKyAnLXJlbW92ZSAnICsgdGhpcy5mYUNTU3ByZWZpeCArICctdGltZXMgZmkteFwiPjwvaT4nO1xuXG4gICAgICAgIFxuXG4gICAgICAgIHRoaXMubWluVmlldyA9IDA7XG4gICAgICAgIGlmICgnbWluVmlldycgaW4gb3B0aW9ucykge1xuICAgICAgICAgICAgdGhpcy5taW5WaWV3ID0gb3B0aW9ucy5taW5WaWV3O1xuICAgICAgICB9IGVsc2UgaWYgKCdtaW5WaWV3JyBpbiB0aGlzLmVsZW1lbnQuZGF0YSgpKSB7XG4gICAgICAgICAgICB0aGlzLm1pblZpZXcgPSB0aGlzLmVsZW1lbnQuZGF0YSgnbWluLXZpZXcnKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm1pblZpZXcgPSBEUEdsb2JhbC5jb252ZXJ0Vmlld01vZGUodGhpcy5taW5WaWV3KTtcblxuICAgICAgICB0aGlzLm1heFZpZXcgPSBEUEdsb2JhbC5tb2Rlcy5sZW5ndGggLSAxO1xuICAgICAgICBpZiAoJ21heFZpZXcnIGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHRoaXMubWF4VmlldyA9IG9wdGlvbnMubWF4VmlldztcbiAgICAgICAgfSBlbHNlIGlmICgnbWF4VmlldycgaW4gdGhpcy5lbGVtZW50LmRhdGEoKSkge1xuICAgICAgICAgICAgdGhpcy5tYXhWaWV3ID0gdGhpcy5lbGVtZW50LmRhdGEoJ21heC12aWV3Jyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5tYXhWaWV3ID0gRFBHbG9iYWwuY29udmVydFZpZXdNb2RlKHRoaXMubWF4Vmlldyk7XG5cbiAgICAgICAgdGhpcy5zdGFydFZpZXdNb2RlID0gJ21vbnRoJztcbiAgICAgICAgaWYgKCdzdGFydFZpZXcnIGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHRoaXMuc3RhcnRWaWV3TW9kZSA9IG9wdGlvbnMuc3RhcnRWaWV3O1xuICAgICAgICB9IGVsc2UgaWYgKCdzdGFydFZpZXcnIGluIHRoaXMuZWxlbWVudC5kYXRhKCkpIHtcbiAgICAgICAgICAgIHRoaXMuc3RhcnRWaWV3TW9kZSA9IHRoaXMuZWxlbWVudC5kYXRhKCdzdGFydC12aWV3Jyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zdGFydFZpZXdNb2RlID0gRFBHbG9iYWwuY29udmVydFZpZXdNb2RlKHRoaXMuc3RhcnRWaWV3TW9kZSk7XG4gICAgICAgIHRoaXMudmlld01vZGUgPSB0aGlzLnN0YXJ0Vmlld01vZGU7XG5cbiAgICAgICAgaWYgKCEoJ21pblZpZXcnIGluIG9wdGlvbnMpICYmICEoJ21heFZpZXcnIGluIG9wdGlvbnMpICYmICEodGhpcy5lbGVtZW50LmRhdGEoJ21pbi12aWV3JykpICYmICEodGhpcy5lbGVtZW50LmRhdGEoJ21heC12aWV3JykpKSB7XG4gICAgICAgICAgICB0aGlzLnBpY2tUaW1lID0gZmFsc2U7XG4gICAgICAgICAgICBpZiAoJ3BpY2tUaW1lJyBpbiBvcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5waWNrVGltZSA9IG9wdGlvbnMucGlja1RpbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5waWNrVGltZSA9PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5taW5WaWV3ID0gMDtcbiAgICAgICAgICAgICAgICB0aGlzLm1heFZpZXcgPSA0O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLm1pblZpZXcgPSAyO1xuICAgICAgICAgICAgICAgIHRoaXMubWF4VmlldyA9IDQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmZvcmNlUGFyc2UgPSB0cnVlO1xuICAgICAgICBpZiAoJ2ZvcmNlUGFyc2UnIGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHRoaXMuZm9yY2VQYXJzZSA9IG9wdGlvbnMuZm9yY2VQYXJzZTtcbiAgICAgICAgfSBlbHNlIGlmICgnZGF0ZUZvcmNlUGFyc2UnIGluIHRoaXMuZWxlbWVudC5kYXRhKCkpIHtcbiAgICAgICAgICAgIHRoaXMuZm9yY2VQYXJzZSA9IHRoaXMuZWxlbWVudC5kYXRhKCdkYXRlLWZvcmNlLXBhcnNlJyk7XG4gICAgICAgIH1cblxuXG4gICAgICAgIHRoaXMucGlja2VyID0gJChEUEdsb2JhbC50ZW1wbGF0ZSh0aGlzLmxlZnRBcnJvdywgdGhpcy5yaWdodEFycm93LCB0aGlzLmNsb3NlSWNvbikpXG4gICAgICAgICAgICAuYXBwZW5kVG8odGhpcy5pc0lubGluZSA/IHRoaXMuZWxlbWVudCA6IHRoaXMuYXBwZW5kVG8pXG4gICAgICAgICAgICAub24oe1xuICAgICAgICAgICAgICAgIGNsaWNrOiAkLnByb3h5KHRoaXMuY2xpY2ssIHRoaXMpLFxuICAgICAgICAgICAgICAgIG1vdXNlZG93bjogJC5wcm94eSh0aGlzLm1vdXNlZG93biwgdGhpcylcbiAgICAgICAgICAgIH0pO1xuICAgICAgICBpZiAodGhpcy5jbG9zZUJ1dHRvbikge1xuICAgICAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnYS5kYXRlcGlja2VyLWNsb3NlJykuc2hvdygpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnYS5kYXRlcGlja2VyLWNsb3NlJykuaGlkZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuaXNJbmxpbmUpIHtcbiAgICAgICAgICAgIHRoaXMucGlja2VyLmFkZENsYXNzKCdkYXRlcGlja2VyLWlubGluZScpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5waWNrZXIuYWRkQ2xhc3MoJ2RhdGVwaWNrZXItZHJvcGRvd24gZHJvcGRvd24tbWVudScpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmlzUlRMKSB7XG4gICAgICAgICAgICB0aGlzLnBpY2tlci5hZGRDbGFzcygnZGF0ZXBpY2tlci1ydGwnKTtcblxuICAgICAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnLmRhdGUtc3dpdGNoJykuZWFjaChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAkKHRoaXMpLnBhcmVudCgpLnByZXBlbmQoJCh0aGlzKS5zaWJsaW5ncygnLm5leHQnKSk7XG4gICAgICAgICAgICAgICQodGhpcykucGFyZW50KCkuYXBwZW5kKCQodGhpcykuc2libGluZ3MoJy5wcmV2JykpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIHRoaXMucGlja2VyLmZpbmQoJy5wcmV2LCAubmV4dCcpLnRvZ2dsZUNsYXNzKCdwcmV2IG5leHQnKTtcblxuICAgICAgICB9XG4gICAgICAgICQoZG9jdW1lbnQpLm9uKCdtb3VzZWRvd24nLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICBpZiAodGhhdC5pc0lucHV0ICYmIGUudGFyZ2V0ID09PSB0aGF0LmVsZW1lbnRbMF0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIENsaWNrZWQgb3V0c2lkZSB0aGUgZGF0ZXBpY2tlciwgaGlkZSBpdFxuICAgICAgICAgICAgaWYgKCQoZS50YXJnZXQpLmNsb3Nlc3QoJy5kYXRlcGlja2VyLmRhdGVwaWNrZXItaW5saW5lLCAuZGF0ZXBpY2tlci5kYXRlcGlja2VyLWRyb3Bkb3duJykubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgdGhhdC5oaWRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuYXV0b2Nsb3NlID0gdHJ1ZTtcbiAgICAgICAgaWYgKCdhdXRvY2xvc2UnIGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHRoaXMuYXV0b2Nsb3NlID0gb3B0aW9ucy5hdXRvY2xvc2U7XG4gICAgICAgIH0gZWxzZSBpZiAoJ2RhdGVBdXRvY2xvc2UnIGluIHRoaXMuZWxlbWVudC5kYXRhKCkpIHtcbiAgICAgICAgICAgIHRoaXMuYXV0b2Nsb3NlID0gdGhpcy5lbGVtZW50LmRhdGEoJ2RhdGUtYXV0b2Nsb3NlJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmtleWJvYXJkTmF2aWdhdGlvbiA9IHRydWU7XG4gICAgICAgIGlmICgna2V5Ym9hcmROYXZpZ2F0aW9uJyBpbiBvcHRpb25zKSB7XG4gICAgICAgICAgICB0aGlzLmtleWJvYXJkTmF2aWdhdGlvbiA9IG9wdGlvbnMua2V5Ym9hcmROYXZpZ2F0aW9uO1xuICAgICAgICB9IGVsc2UgaWYgKCdkYXRlS2V5Ym9hcmROYXZpZ2F0aW9uJyBpbiB0aGlzLmVsZW1lbnQuZGF0YSgpKSB7XG4gICAgICAgICAgICB0aGlzLmtleWJvYXJkTmF2aWdhdGlvbiA9IHRoaXMuZWxlbWVudC5kYXRhKCdkYXRlLWtleWJvYXJkLW5hdmlnYXRpb24nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudG9kYXlCdG4gPSAob3B0aW9ucy50b2RheUJ0biB8fCB0aGlzLmVsZW1lbnQuZGF0YSgnZGF0ZS10b2RheS1idG4nKSB8fCBmYWxzZSk7XG4gICAgICAgIHRoaXMudG9kYXlIaWdobGlnaHQgPSAob3B0aW9ucy50b2RheUhpZ2hsaWdodCB8fCB0aGlzLmVsZW1lbnQuZGF0YSgnZGF0ZS10b2RheS1oaWdobGlnaHQnKSB8fCBmYWxzZSk7XG5cbiAgICAgICAgdGhpcy5jYWxlbmRhcldlZWtzID0gZmFsc2U7XG4gICAgICAgIGlmICgnY2FsZW5kYXJXZWVrcycgaW4gb3B0aW9ucykge1xuICAgICAgICAgICAgdGhpcy5jYWxlbmRhcldlZWtzID0gb3B0aW9ucy5jYWxlbmRhcldlZWtzO1xuICAgICAgICB9IGVsc2UgaWYgKCdkYXRlQ2FsZW5kYXJXZWVrcycgaW4gdGhpcy5lbGVtZW50LmRhdGEoKSkge1xuICAgICAgICAgICAgdGhpcy5jYWxlbmRhcldlZWtzID0gdGhpcy5lbGVtZW50LmRhdGEoJ2RhdGUtY2FsZW5kYXItd2Vla3MnKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5jYWxlbmRhcldlZWtzKVxuICAgICAgICAgICAgdGhpcy5waWNrZXIuZmluZCgndGZvb3QgdGgudG9kYXknKVxuICAgICAgICAgICAgLmF0dHIoJ2NvbHNwYW4nLCBmdW5jdGlvbihpLCB2YWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VJbnQodmFsKSArIDE7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLndlZWtTdGFydCA9ICgob3B0aW9ucy53ZWVrU3RhcnQgfHwgdGhpcy5lbGVtZW50LmRhdGEoJ2RhdGUtd2Vla3N0YXJ0JykgfHwgZGF0ZXNbdGhpcy5sYW5ndWFnZV0ud2Vla1N0YXJ0IHx8IDApICUgNyk7XG4gICAgICAgIHRoaXMud2Vla0VuZCA9ICgodGhpcy53ZWVrU3RhcnQgKyA2KSAlIDcpO1xuICAgICAgICB0aGlzLnN0YXJ0RGF0ZSA9IC1JbmZpbml0eTtcbiAgICAgICAgdGhpcy5lbmREYXRlID0gSW5maW5pdHk7XG4gICAgICAgIHRoaXMuZGF5c09mV2Vla0Rpc2FibGVkID0gW107XG4gICAgICAgIHRoaXMuZGF0ZXNEaXNhYmxlZCA9IFtdO1xuICAgICAgICB0aGlzLnNldFN0YXJ0RGF0ZShvcHRpb25zLnN0YXJ0RGF0ZSB8fCB0aGlzLmVsZW1lbnQuZGF0YSgnZGF0ZS1zdGFydGRhdGUnKSk7XG4gICAgICAgIHRoaXMuc2V0RW5kRGF0ZShvcHRpb25zLmVuZERhdGUgfHwgdGhpcy5lbGVtZW50LmRhdGEoJ2RhdGUtZW5kZGF0ZScpKTtcbiAgICAgICAgdGhpcy5zZXREYXlzT2ZXZWVrRGlzYWJsZWQob3B0aW9ucy5kYXlzT2ZXZWVrRGlzYWJsZWQgfHwgdGhpcy5lbGVtZW50LmRhdGEoJ2RhdGUtZGF5cy1vZi13ZWVrLWRpc2FibGVkJykpO1xuICAgICAgICB0aGlzLnNldERhdGVzRGlzYWJsZWQob3B0aW9ucy5kYXRlc0Rpc2FibGVkIHx8IHRoaXMuZWxlbWVudC5kYXRhKCdkYXRlcy1kaXNhYmxlZCcpKTtcblxuICAgICAgICB0aGlzLmZpbGxEb3coKTtcbiAgICAgICAgdGhpcy5maWxsTW9udGhzKCk7XG4gICAgICAgIHRoaXMudXBkYXRlKCk7XG5cbiAgICAgICAgdGhpcy5zaG93TW9kZSgpO1xuXG4gICAgICAgIGlmICh0aGlzLmlzSW5saW5lKSB7XG4gICAgICAgICAgICB0aGlzLnNob3coKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2F0dGFjaEV2ZW50cygpO1xuICAgIH07XG5cbiAgICBEYXRlcGlja2VyLnByb3RvdHlwZSA9IHtcbiAgICAgICAgY29uc3RydWN0b3I6IERhdGVwaWNrZXIsXG5cbiAgICAgICAgX2V2ZW50czogW10sXG4gICAgICAgIF9hdHRhY2hFdmVudHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5fZGV0YWNoRXZlbnRzKCk7XG4gICAgICAgICAgICBpZiAodGhpcy5pc0lucHV0KSB7IC8vIHNpbmdsZSBpbnB1dFxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5rZXlib2FyZE5hdmlnYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzID0gW1xuICAgICAgICAgICAgICAgICAgICAgICAgW3RoaXMuZWxlbWVudCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvY3VzOiAodGhpcy5hdXRvU2hvdykgPyAkLnByb3h5KHRoaXMuc2hvdywgdGhpcykgOiBmdW5jdGlvbigpIHt9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XVxuICAgICAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50cyA9IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIFt0aGlzLmVsZW1lbnQsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb2N1czogKHRoaXMuYXV0b1Nob3cpID8gJC5wcm94eSh0aGlzLnNob3csIHRoaXMpIDogZnVuY3Rpb24oKSB7fSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXl1cDogJC5wcm94eSh0aGlzLnVwZGF0ZSwgdGhpcyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5ZG93bjogJC5wcm94eSh0aGlzLmtleWRvd24sIHRoaXMpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsaWNrOiAodGhpcy5lbGVtZW50LmF0dHIoJ3JlYWRvbmx5JykpID8gJC5wcm94eSh0aGlzLnNob3csIHRoaXMpIDogZnVuY3Rpb24oKSB7fVxuICAgICAgICAgICAgICAgICAgICAgICAgfV1cbiAgICAgICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgICB9IFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodGhpcy5jb21wb25lbnQgJiYgdGhpcy5oYXNJbnB1dCkgeyAvLyBjb21wb25lbnQ6IGlucHV0ICsgYnV0dG9uXG4gICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzID0gW1xuICAgICAgICAgICAgICAgICAgICAvLyBGb3IgY29tcG9uZW50cyB0aGF0IGFyZSBub3QgcmVhZG9ubHksIGFsbG93IGtleWJvYXJkIG5hdlxuICAgICAgICAgICAgICAgICAgICBbdGhpcy5lbGVtZW50LmZpbmQoJ2lucHV0JyksIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvY3VzOiAodGhpcy5hdXRvU2hvdykgPyAkLnByb3h5KHRoaXMuc2hvdywgdGhpcykgOiBmdW5jdGlvbigpIHt9LFxuICAgICAgICAgICAgICAgICAgICAgICAga2V5dXA6ICQucHJveHkodGhpcy51cGRhdGUsIHRoaXMpLFxuICAgICAgICAgICAgICAgICAgICAgICAga2V5ZG93bjogJC5wcm94eSh0aGlzLmtleWRvd24sIHRoaXMpXG4gICAgICAgICAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgICAgICAgICBbdGhpcy5jb21wb25lbnQsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsaWNrOiAkLnByb3h5KHRoaXMuc2hvdywgdGhpcylcbiAgICAgICAgICAgICAgICAgICAgfV1cbiAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLmVsZW1lbnQuaXMoJ2RpdicpKSB7IC8vIGlubGluZSBkYXRlcGlja2VyXG4gICAgICAgICAgICAgICAgdGhpcy5pc0lubGluZSA9IHRydWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50cyA9IFtcbiAgICAgICAgICAgICAgICAgICAgW3RoaXMuZWxlbWVudCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xpY2s6ICQucHJveHkodGhpcy5zaG93LCB0aGlzKVxuICAgICAgICAgICAgICAgICAgICB9XVxuICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmRpc2FibGVEYmxDbGlja1NlbGVjdGlvbikge1xuICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50c1t0aGlzLl9ldmVudHMubGVuZ3RoXSA9IFtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYmxjbGljazogZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykuYmx1cigpXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgZWwsIGV2OyBpIDwgdGhpcy5fZXZlbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgZWwgPSB0aGlzLl9ldmVudHNbaV1bMF07XG4gICAgICAgICAgICAgICAgZXYgPSB0aGlzLl9ldmVudHNbaV1bMV07XG4gICAgICAgICAgICAgICAgZWwub24oZXYpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBfZGV0YWNoRXZlbnRzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBlbCwgZXY7IGkgPCB0aGlzLl9ldmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBlbCA9IHRoaXMuX2V2ZW50c1tpXVswXTtcbiAgICAgICAgICAgICAgICBldiA9IHRoaXMuX2V2ZW50c1tpXVsxXTtcbiAgICAgICAgICAgICAgICBlbC5vZmYoZXYpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fZXZlbnRzID0gW107XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2hvdzogZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgdGhpcy5waWNrZXIuc2hvdygpO1xuICAgICAgICAgICAgdGhpcy5oZWlnaHQgPSB0aGlzLmNvbXBvbmVudCA/IHRoaXMuY29tcG9uZW50Lm91dGVySGVpZ2h0KCkgOiB0aGlzLmVsZW1lbnQub3V0ZXJIZWlnaHQoKTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlKCk7XG4gICAgICAgICAgICB0aGlzLnBsYWNlKCk7XG4gICAgICAgICAgICAkKHdpbmRvdykub24oJ3Jlc2l6ZScsICQucHJveHkodGhpcy5wbGFjZSwgdGhpcykpO1xuICAgICAgICAgICAgaWYgKGUpIHtcbiAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC50cmlnZ2VyKHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnc2hvdycsXG4gICAgICAgICAgICAgICAgZGF0ZTogdGhpcy5kYXRlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBoaWRlOiBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5pc0lubGluZSkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCF0aGlzLnBpY2tlci5pcygnOnZpc2libGUnKSkgcmV0dXJuO1xuICAgICAgICAgICAgdGhpcy5waWNrZXIuaGlkZSgpO1xuICAgICAgICAgICAgJCh3aW5kb3cpLm9mZigncmVzaXplJywgdGhpcy5wbGFjZSk7XG4gICAgICAgICAgICB0aGlzLnZpZXdNb2RlID0gdGhpcy5zdGFydFZpZXdNb2RlO1xuICAgICAgICAgICAgdGhpcy5zaG93TW9kZSgpO1xuICAgICAgICAgICAgaWYgKCF0aGlzLmlzSW5wdXQpIHtcbiAgICAgICAgICAgICAgICAkKGRvY3VtZW50KS5vZmYoJ21vdXNlZG93bicsIHRoaXMuaGlkZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICB0aGlzLmZvcmNlUGFyc2UgJiZcbiAgICAgICAgICAgICAgICAoXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaXNJbnB1dCAmJiB0aGlzLmVsZW1lbnQudmFsKCkgfHxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oYXNJbnB1dCAmJiB0aGlzLmVsZW1lbnQuZmluZCgnaW5wdXQnKS52YWwoKVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICB0aGlzLnNldFZhbHVlKCk7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQudHJpZ2dlcih7XG4gICAgICAgICAgICAgICAgdHlwZTogJ2hpZGUnLFxuICAgICAgICAgICAgICAgIGRhdGU6IHRoaXMuZGF0ZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcmVtb3ZlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMuX2RldGFjaEV2ZW50cygpO1xuICAgICAgICAgICAgdGhpcy5waWNrZXIucmVtb3ZlKCk7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5lbGVtZW50LmRhdGEoKS5kYXRlcGlja2VyO1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldERhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGQgPSB0aGlzLmdldFVUQ0RhdGUoKTtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRGF0ZShkLmdldFRpbWUoKSArIChkLmdldFRpbWV6b25lT2Zmc2V0KCkgKiA2MDAwMCkpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldFVUQ0RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGF0ZTtcbiAgICAgICAgfSxcblxuICAgICAgICBzZXREYXRlOiBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICB0aGlzLnNldFVUQ0RhdGUobmV3IERhdGUoZC5nZXRUaW1lKCkgLSAoZC5nZXRUaW1lem9uZU9mZnNldCgpICogNjAwMDApKSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2V0VVRDRGF0ZTogZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgdGhpcy5kYXRlID0gZDtcbiAgICAgICAgICAgIHRoaXMuc2V0VmFsdWUoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBzZXRWYWx1ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgZm9ybWF0dGVkID0gdGhpcy5nZXRGb3JtYXR0ZWREYXRlKCk7XG4gICAgICAgICAgICBpZiAoIXRoaXMuaXNJbnB1dCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNvbXBvbmVudCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQuZmluZCgnaW5wdXQnKS52YWwoZm9ybWF0dGVkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LmRhdGEoJ2RhdGUnLCBmb3JtYXR0ZWQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQudmFsKGZvcm1hdHRlZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0Rm9ybWF0dGVkRGF0ZTogZnVuY3Rpb24oZm9ybWF0KSB7XG4gICAgICAgICAgICBpZiAoZm9ybWF0ID09PSB1bmRlZmluZWQpXG4gICAgICAgICAgICAgICAgZm9ybWF0ID0gdGhpcy5mb3JtYXQ7XG4gICAgICAgICAgICByZXR1cm4gRFBHbG9iYWwuZm9ybWF0RGF0ZSh0aGlzLmRhdGUsIGZvcm1hdCwgdGhpcy5sYW5ndWFnZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2V0U3RhcnREYXRlOiBmdW5jdGlvbihzdGFydERhdGUpIHtcbiAgICAgICAgICAgIHRoaXMuc3RhcnREYXRlID0gc3RhcnREYXRlIHx8IC1JbmZpbml0eTtcbiAgICAgICAgICAgIGlmICh0aGlzLnN0YXJ0RGF0ZSAhPT0gLUluZmluaXR5KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGFydERhdGUgPSBEUEdsb2JhbC5wYXJzZURhdGUodGhpcy5zdGFydERhdGUsIHRoaXMuZm9ybWF0LCB0aGlzLmxhbmd1YWdlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMudXBkYXRlKCk7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZU5hdkFycm93cygpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHNldEVuZERhdGU6IGZ1bmN0aW9uKGVuZERhdGUpIHtcbiAgICAgICAgICAgIHRoaXMuZW5kRGF0ZSA9IGVuZERhdGUgfHwgSW5maW5pdHk7XG4gICAgICAgICAgICBpZiAodGhpcy5lbmREYXRlICE9PSBJbmZpbml0eSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZW5kRGF0ZSA9IERQR2xvYmFsLnBhcnNlRGF0ZSh0aGlzLmVuZERhdGUsIHRoaXMuZm9ybWF0LCB0aGlzLmxhbmd1YWdlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMudXBkYXRlKCk7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZU5hdkFycm93cygpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHNldERheXNPZldlZWtEaXNhYmxlZDogZnVuY3Rpb24oZGF5c09mV2Vla0Rpc2FibGVkKSB7XG4gICAgICAgICAgICB0aGlzLmRheXNPZldlZWtEaXNhYmxlZCA9IGRheXNPZldlZWtEaXNhYmxlZCB8fCBbXTtcbiAgICAgICAgICAgIGlmICghJC5pc0FycmF5KHRoaXMuZGF5c09mV2Vla0Rpc2FibGVkKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGF5c09mV2Vla0Rpc2FibGVkID0gdGhpcy5kYXlzT2ZXZWVrRGlzYWJsZWQuc3BsaXQoLyxcXHMqLyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmRheXNPZldlZWtEaXNhYmxlZCA9ICQubWFwKHRoaXMuZGF5c09mV2Vla0Rpc2FibGVkLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlSW50KGQsIDEwKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy51cGRhdGUoKTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlTmF2QXJyb3dzKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2V0RGF0ZXNEaXNhYmxlZDogZnVuY3Rpb24oZGF0ZXNEaXNhYmxlZCkge1xuICAgICAgICAgICAgdGhpcy5kYXRlc0Rpc2FibGVkID0gZGF0ZXNEaXNhYmxlZCB8fCBbXTtcbiAgICAgICAgICAgIGlmICghJC5pc0FycmF5KHRoaXMuZGF0ZXNEaXNhYmxlZCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGVzRGlzYWJsZWQgPSB0aGlzLmRhdGVzRGlzYWJsZWQuc3BsaXQoLyxcXHMqLyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmRhdGVzRGlzYWJsZWQgPSAkLm1hcCh0aGlzLmRhdGVzRGlzYWJsZWQsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gRFBHbG9iYWwucGFyc2VEYXRlKGQsIHRoaXMuZm9ybWF0LCB0aGlzLmxhbmd1YWdlKS52YWx1ZU9mKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlKCk7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZU5hdkFycm93cygpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHBsYWNlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzSW5saW5lKSByZXR1cm47XG4gICAgICAgICAgICB2YXIgekluZGV4ID0gcGFyc2VJbnQodGhpcy5lbGVtZW50LnBhcmVudHMoKS5maWx0ZXIoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICQodGhpcykuY3NzKCd6LWluZGV4JykgIT0gJ2F1dG8nO1xuICAgICAgICAgICAgfSkuZmlyc3QoKS5jc3MoJ3otaW5kZXgnKSkgKyAxMDtcbiAgICAgICAgICAgIHZhciB0ZXh0Ym94ID0gdGhpcy5jb21wb25lbnQgPyB0aGlzLmNvbXBvbmVudCA6IHRoaXMuZWxlbWVudDtcbiAgICAgICAgICAgIHZhciBvZmZzZXQgPSB0ZXh0Ym94Lm9mZnNldCgpO1xuICAgICAgICAgICAgdmFyIGhlaWdodCA9IHRleHRib3gub3V0ZXJIZWlnaHQoKSArIHBhcnNlSW50KHRleHRib3guY3NzKCdtYXJnaW4tdG9wJykpO1xuICAgICAgICAgICAgdmFyIHdpZHRoID0gdGV4dGJveC5vdXRlcldpZHRoKCkgKyBwYXJzZUludCh0ZXh0Ym94LmNzcygnbWFyZ2luLWxlZnQnKSk7XG4gICAgICAgICAgICB2YXIgZnVsbE9mZnNldFRvcCA9IG9mZnNldC50b3AgKyBoZWlnaHQ7XG4gICAgICAgICAgICB2YXIgb2Zmc2V0TGVmdCA9IG9mZnNldC5sZWZ0O1xuICAgICAgICAgICAgdGhpcy5waWNrZXIucmVtb3ZlQ2xhc3MoJ2RhdGVwaWNrZXItdG9wIGRhdGVwaWNrZXItYm90dG9tJyk7XG4gICAgICAgICAgICAvLyBpZiB0aGUgZGF0ZXBpY2tlciBpcyBnb2luZyB0byBiZSBiZWxvdyB0aGUgd2luZG93LCBzaG93IGl0IG9uIHRvcCBvZiB0aGUgaW5wdXRcbiAgICAgICAgICAgIGlmICgoZnVsbE9mZnNldFRvcCArIHRoaXMucGlja2VyLm91dGVySGVpZ2h0KCkpID49ICQod2luZG93KS5zY3JvbGxUb3AoKSArICQod2luZG93KS5oZWlnaHQoKSkge1xuICAgICAgICAgICAgICAgIGZ1bGxPZmZzZXRUb3AgPSBvZmZzZXQudG9wIC0gdGhpcy5waWNrZXIub3V0ZXJIZWlnaHQoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnBpY2tlci5hZGRDbGFzcygnZGF0ZXBpY2tlci10b3AnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMucGlja2VyLmFkZENsYXNzKCdkYXRlcGlja2VyLWJvdHRvbScpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBpZiB0aGUgZGF0ZXBpY2tlciBpcyBnb2luZyB0byBnbyBwYXN0IHRoZSByaWdodCBzaWRlIG9mIHRoZSB3aW5kb3csIHdlIHdhbnRcbiAgICAgICAgICAgIC8vIHRvIHNldCB0aGUgcmlnaHQgcG9zaXRpb24gc28gdGhlIGRhdGVwaWNrZXIgbGluZXMgdXAgd2l0aCB0aGUgdGV4dGJveFxuICAgICAgICAgICAgaWYgKG9mZnNldC5sZWZ0ICsgdGhpcy5waWNrZXIud2lkdGgoKSA+PSAkKHdpbmRvdykud2lkdGgoKSkge1xuICAgICAgICAgICAgICAgIG9mZnNldExlZnQgPSAob2Zmc2V0LmxlZnQgKyB3aWR0aCkgLSB0aGlzLnBpY2tlci53aWR0aCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5waWNrZXIuY3NzKHtcbiAgICAgICAgICAgICAgICB0b3A6IGZ1bGxPZmZzZXRUb3AsXG4gICAgICAgICAgICAgICAgbGVmdDogb2Zmc2V0TGVmdCxcbiAgICAgICAgICAgICAgICB6SW5kZXg6IHpJbmRleFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdXBkYXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBkYXRlLCBmcm9tQXJncyA9IGZhbHNlO1xuICAgICAgICAgICAgdmFyIGN1cnJlbnRWYWwgPSB0aGlzLmlzSW5wdXQgPyB0aGlzLmVsZW1lbnQudmFsKCkgOiB0aGlzLmVsZW1lbnQuZGF0YSgnZGF0ZScpIHx8IHRoaXMuZWxlbWVudC5maW5kKCdpbnB1dCcpLnZhbCgpO1xuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cyAmJiBhcmd1bWVudHMubGVuZ3RoICYmICh0eXBlb2YgYXJndW1lbnRzWzBdID09PSAnc3RyaW5nJyB8fCBhcmd1bWVudHNbMF0gaW5zdGFuY2VvZiBEYXRlKSkge1xuICAgICAgICAgICAgICAgIGRhdGUgPSBhcmd1bWVudHNbMF07XG4gICAgICAgICAgICAgICAgZnJvbUFyZ3MgPSB0cnVlO1xuICAgICAgICAgICAgfSBcbiAgICAgICAgICAgIGVsc2UgaWYgKCFjdXJyZW50VmFsICYmIHRoaXMuaW5pdGlhbERhdGUgIT0gbnVsbCkgeyAvLyBJZiB2YWx1ZSBpcyBub3Qgc2V0LCBzZXQgaXQgdG8gdGhlIGluaXRpYWxEYXRlIFxuICAgICAgICAgICAgICAgIGRhdGUgPSB0aGlzLmluaXRpYWxEYXRlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBkYXRlID0gdGhpcy5pc0lucHV0ID8gdGhpcy5lbGVtZW50LnZhbCgpIDogdGhpcy5lbGVtZW50LmRhdGEoJ2RhdGUnKSB8fCB0aGlzLmVsZW1lbnQuZmluZCgnaW5wdXQnKS52YWwoKTtcbiAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgIGlmIChkYXRlICYmIGRhdGUubGVuZ3RoID4gdGhpcy5mb3JtYXRUZXh0Lmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAkKHRoaXMucGlja2VyKS5hZGRDbGFzcygnaXMtaW52YWxpZCcpXG4gICAgICAgICAgICAgICAgICAgICQodGhpcy5lbGVtZW50KS5hZGRDbGFzcygnaXMtaW52YWxpZC1pbnB1dCcpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJCh0aGlzLnBpY2tlcikucmVtb3ZlQ2xhc3MoJ2lzLWludmFsaWQnKVxuICAgICAgICAgICAgICAgICQodGhpcy5lbGVtZW50KS5yZW1vdmVDbGFzcygnaXMtaW52YWxpZC1pbnB1dCcpXG4gICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgICAgICB0aGlzLmRhdGUgPSBEUEdsb2JhbC5wYXJzZURhdGUoZGF0ZSwgdGhpcy5mb3JtYXQsIHRoaXMubGFuZ3VhZ2UpOyAgXG5cbiAgICAgICAgICAgIGlmIChmcm9tQXJncyB8fCB0aGlzLmluaXRpYWxEYXRlICE9IG51bGwpIHRoaXMuc2V0VmFsdWUoKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuZGF0ZSA8IHRoaXMuc3RhcnREYXRlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy52aWV3RGF0ZSA9IG5ldyBEYXRlKHRoaXMuc3RhcnREYXRlLnZhbHVlT2YoKSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuZGF0ZSA+IHRoaXMuZW5kRGF0ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMudmlld0RhdGUgPSBuZXcgRGF0ZSh0aGlzLmVuZERhdGUudmFsdWVPZigpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy52aWV3RGF0ZSA9IG5ldyBEYXRlKHRoaXMuZGF0ZS52YWx1ZU9mKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5maWxsKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZmlsbERvdzogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgZG93Q250ID0gdGhpcy53ZWVrU3RhcnQsXG4gICAgICAgICAgICAgICAgaHRtbCA9ICc8dHI+JztcbiAgICAgICAgICAgIGlmICh0aGlzLmNhbGVuZGFyV2Vla3MpIHtcbiAgICAgICAgICAgICAgICB2YXIgY2VsbCA9ICc8dGggY2xhc3M9XCJjd1wiPiZuYnNwOzwvdGg+JztcbiAgICAgICAgICAgICAgICBodG1sICs9IGNlbGw7XG4gICAgICAgICAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnLmRhdGVwaWNrZXItZGF5cyB0aGVhZCB0cjpmaXJzdC1jaGlsZCcpLnByZXBlbmQoY2VsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB3aGlsZSAoZG93Q250IDwgdGhpcy53ZWVrU3RhcnQgKyA3KSB7XG4gICAgICAgICAgICAgICAgaHRtbCArPSAnPHRoIGNsYXNzPVwiZG93XCI+JyArIGRhdGVzW3RoaXMubGFuZ3VhZ2VdLmRheXNNaW5bKGRvd0NudCsrKSAlIDddICsgJzwvdGg+JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGh0bWwgKz0gJzwvdHI+JztcbiAgICAgICAgICAgIHRoaXMucGlja2VyLmZpbmQoJy5kYXRlcGlja2VyLWRheXMgdGhlYWQnKS5hcHBlbmQoaHRtbCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZmlsbE1vbnRoczogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgaHRtbCA9ICcnLFxuICAgICAgICAgICAgICAgIGkgPSAwO1xuICAgICAgICAgICAgd2hpbGUgKGkgPCAxMikge1xuICAgICAgICAgICAgICAgIGh0bWwgKz0gJzxzcGFuIGNsYXNzPVwibW9udGhcIj4nICsgZGF0ZXNbdGhpcy5sYW5ndWFnZV0ubW9udGhzU2hvcnRbaSsrXSArICc8L3NwYW4+JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMucGlja2VyLmZpbmQoJy5kYXRlcGlja2VyLW1vbnRocyB0ZCcpLmh0bWwoaHRtbCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZmlsbDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5kYXRlID09IG51bGwgfHwgdGhpcy52aWV3RGF0ZSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgZCA9IG5ldyBEYXRlKHRoaXMudmlld0RhdGUudmFsdWVPZigpKSxcbiAgICAgICAgICAgICAgICB5ZWFyID0gZC5nZXRVVENGdWxsWWVhcigpLFxuICAgICAgICAgICAgICAgIG1vbnRoID0gZC5nZXRVVENNb250aCgpLFxuICAgICAgICAgICAgICAgIGRheU1vbnRoID0gZC5nZXRVVENEYXRlKCksXG4gICAgICAgICAgICAgICAgaG91cnMgPSBkLmdldFVUQ0hvdXJzKCksXG4gICAgICAgICAgICAgICAgbWludXRlcyA9IGQuZ2V0VVRDTWludXRlcygpLFxuICAgICAgICAgICAgICAgIHN0YXJ0WWVhciA9IHRoaXMuc3RhcnREYXRlICE9PSAtSW5maW5pdHkgPyB0aGlzLnN0YXJ0RGF0ZS5nZXRVVENGdWxsWWVhcigpIDogLUluZmluaXR5LFxuICAgICAgICAgICAgICAgIHN0YXJ0TW9udGggPSB0aGlzLnN0YXJ0RGF0ZSAhPT0gLUluZmluaXR5ID8gdGhpcy5zdGFydERhdGUuZ2V0VVRDTW9udGgoKSA6IC1JbmZpbml0eSxcbiAgICAgICAgICAgICAgICBlbmRZZWFyID0gdGhpcy5lbmREYXRlICE9PSBJbmZpbml0eSA/IHRoaXMuZW5kRGF0ZS5nZXRVVENGdWxsWWVhcigpIDogSW5maW5pdHksXG4gICAgICAgICAgICAgICAgZW5kTW9udGggPSB0aGlzLmVuZERhdGUgIT09IEluZmluaXR5ID8gdGhpcy5lbmREYXRlLmdldFVUQ01vbnRoKCkgOiBJbmZpbml0eSxcbiAgICAgICAgICAgICAgICBjdXJyZW50RGF0ZSA9IHRoaXMuZGF0ZSAmJiBVVENEYXRlKHRoaXMuZGF0ZS5nZXRVVENGdWxsWWVhcigpLCB0aGlzLmRhdGUuZ2V0VVRDTW9udGgoKSwgdGhpcy5kYXRlLmdldFVUQ0RhdGUoKSkudmFsdWVPZigpLFxuICAgICAgICAgICAgICAgIHRvZGF5ID0gbmV3IERhdGUoKSxcbiAgICAgICAgICAgICAgICB0aXRsZUZvcm1hdCA9IGRhdGVzW3RoaXMubGFuZ3VhZ2VdLnRpdGxlRm9ybWF0IHx8IGRhdGVzWydlbiddLnRpdGxlRm9ybWF0O1xuICAgICAgICAgICAgLy8gdGhpcy5waWNrZXIuZmluZCgnLmRhdGVwaWNrZXItZGF5cyB0aGVhZCB0aC5kYXRlLXN3aXRjaCcpXG4gICAgICAgICAgICAvLyBcdFx0XHQudGV4dChEUEdsb2JhbC5mb3JtYXREYXRlKG5ldyBVVENEYXRlKHllYXIsIG1vbnRoKSwgdGl0bGVGb3JtYXQsIHRoaXMubGFuZ3VhZ2UpKTtcblxuICAgICAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnLmRhdGVwaWNrZXItZGF5cyB0aGVhZCB0aDplcSgxKScpXG4gICAgICAgICAgICAgICAgLnRleHQoZGF0ZXNbdGhpcy5sYW5ndWFnZV0ubW9udGhzW21vbnRoXSArICcgJyArIHllYXIpO1xuICAgICAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnLmRhdGVwaWNrZXItaG91cnMgdGhlYWQgdGg6ZXEoMSknKVxuICAgICAgICAgICAgICAgIC50ZXh0KGRheU1vbnRoICsgJyAnICsgZGF0ZXNbdGhpcy5sYW5ndWFnZV0ubW9udGhzW21vbnRoXSArICcgJyArIHllYXIpO1xuICAgICAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnLmRhdGVwaWNrZXItbWludXRlcyB0aGVhZCB0aDplcSgxKScpXG4gICAgICAgICAgICAgICAgLnRleHQoZGF5TW9udGggKyAnICcgKyBkYXRlc1t0aGlzLmxhbmd1YWdlXS5tb250aHNbbW9udGhdICsgJyAnICsgeWVhcik7XG5cblxuICAgICAgICAgICAgdGhpcy5waWNrZXIuZmluZCgndGZvb3QgdGgudG9kYXknKVxuICAgICAgICAgICAgICAgIC50ZXh0KGRhdGVzW3RoaXMubGFuZ3VhZ2VdLnRvZGF5KVxuICAgICAgICAgICAgICAgIC50b2dnbGUodGhpcy50b2RheUJ0biAhPT0gZmFsc2UpO1xuICAgICAgICAgICAgdGhpcy51cGRhdGVOYXZBcnJvd3MoKTtcbiAgICAgICAgICAgIHRoaXMuZmlsbE1vbnRocygpO1xuICAgICAgICAgICAgdmFyIHByZXZNb250aCA9IFVUQ0RhdGUoeWVhciwgbW9udGggLSAxLCAyOCwgMCwgMCwgMCwgMCksXG4gICAgICAgICAgICAgICAgZGF5ID0gRFBHbG9iYWwuZ2V0RGF5c0luTW9udGgocHJldk1vbnRoLmdldFVUQ0Z1bGxZZWFyKCksIHByZXZNb250aC5nZXRVVENNb250aCgpKTtcbiAgICAgICAgICAgIHByZXZNb250aC5zZXRVVENEYXRlKGRheSk7XG4gICAgICAgICAgICBwcmV2TW9udGguc2V0VVRDRGF0ZShkYXkgLSAocHJldk1vbnRoLmdldFVUQ0RheSgpIC0gdGhpcy53ZWVrU3RhcnQgKyA3KSAlIDcpO1xuICAgICAgICAgICAgdmFyIG5leHRNb250aCA9IG5ldyBEYXRlKHByZXZNb250aC52YWx1ZU9mKCkpO1xuICAgICAgICAgICAgbmV4dE1vbnRoLnNldFVUQ0RhdGUobmV4dE1vbnRoLmdldFVUQ0RhdGUoKSArIDQyKTtcbiAgICAgICAgICAgIG5leHRNb250aCA9IG5leHRNb250aC52YWx1ZU9mKCk7XG4gICAgICAgICAgICB2YXIgaHRtbCA9IFtdO1xuICAgICAgICAgICAgdmFyIGNsc05hbWU7XG4gICAgICAgICAgICB3aGlsZSAocHJldk1vbnRoLnZhbHVlT2YoKSA8IG5leHRNb250aCkge1xuICAgICAgICAgICAgICAgIGlmIChwcmV2TW9udGguZ2V0VVRDRGF5KCkgPT0gdGhpcy53ZWVrU3RhcnQpIHtcbiAgICAgICAgICAgICAgICAgICAgaHRtbC5wdXNoKCc8dHI+Jyk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmNhbGVuZGFyV2Vla3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFkYXB0ZWQgZnJvbSBodHRwczovL2dpdGh1Yi5jb20vdGltcndvb2QvbW9tZW50L2Jsb2IvbWFzdGVyL21vbWVudC5qcyNMMTI4XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYSA9IG5ldyBEYXRlKHByZXZNb250aC5nZXRVVENGdWxsWWVhcigpLCBwcmV2TW9udGguZ2V0VVRDTW9udGgoKSwgcHJldk1vbnRoLmdldFVUQ0RhdGUoKSAtIHByZXZNb250aC5nZXREYXkoKSArIDEwIC0gKHRoaXMud2Vla1N0YXJ0ICYmIHRoaXMud2Vla1N0YXJ0ICUgNyA8IDUgJiYgNykpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGIgPSBuZXcgRGF0ZShhLmdldEZ1bGxZZWFyKCksIDAsIDQpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbFdlZWsgPSB+figoYSAtIGIpIC8gODY0ZTUgLyA3ICsgMS41KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGh0bWwucHVzaCgnPHRkIGNsYXNzPVwiY3dcIj4nICsgY2FsV2VlayArICc8L3RkPicpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNsc05hbWUgPSAnICcgKyB0aGlzLm9uUmVuZGVyKHByZXZNb250aCkgKyAnICc7XG4gICAgICAgICAgICAgICAgaWYgKHByZXZNb250aC5nZXRVVENGdWxsWWVhcigpIDwgeWVhciB8fCAocHJldk1vbnRoLmdldFVUQ0Z1bGxZZWFyKCkgPT0geWVhciAmJiBwcmV2TW9udGguZ2V0VVRDTW9udGgoKSA8IG1vbnRoKSkge1xuICAgICAgICAgICAgICAgICAgICBjbHNOYW1lICs9ICcgb2xkJztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHByZXZNb250aC5nZXRVVENGdWxsWWVhcigpID4geWVhciB8fCAocHJldk1vbnRoLmdldFVUQ0Z1bGxZZWFyKCkgPT0geWVhciAmJiBwcmV2TW9udGguZ2V0VVRDTW9udGgoKSA+IG1vbnRoKSkge1xuICAgICAgICAgICAgICAgICAgICBjbHNOYW1lICs9ICcgbmV3JztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gQ29tcGFyZSBpbnRlcm5hbCBVVEMgZGF0ZSB3aXRoIGxvY2FsIHRvZGF5LCBub3QgVVRDIHRvZGF5XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudG9kYXlIaWdobGlnaHQgJiZcbiAgICAgICAgICAgICAgICAgICAgcHJldk1vbnRoLmdldFVUQ0Z1bGxZZWFyKCkgPT0gdG9kYXkuZ2V0RnVsbFllYXIoKSAmJlxuICAgICAgICAgICAgICAgICAgICBwcmV2TW9udGguZ2V0VVRDTW9udGgoKSA9PSB0b2RheS5nZXRNb250aCgpICYmXG4gICAgICAgICAgICAgICAgICAgIHByZXZNb250aC5nZXRVVENEYXRlKCkgPT0gdG9kYXkuZ2V0RGF0ZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNsc05hbWUgKz0gJyB0b2RheSc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50RGF0ZSAmJiBwcmV2TW9udGgudmFsdWVPZigpID09IGN1cnJlbnREYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNsc05hbWUgKz0gJyBhY3RpdmUnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocHJldk1vbnRoLnZhbHVlT2YoKSA8IHRoaXMuc3RhcnREYXRlIHx8IHByZXZNb250aC52YWx1ZU9mKCkgPiB0aGlzLmVuZERhdGUgfHxcbiAgICAgICAgICAgICAgICAgICAgJC5pbkFycmF5KHByZXZNb250aC5nZXRVVENEYXkoKSwgdGhpcy5kYXlzT2ZXZWVrRGlzYWJsZWQpICE9PSAtMSB8fFxuICAgICAgICAgICAgICAgICAgICAkLmluQXJyYXkocHJldk1vbnRoLnZhbHVlT2YoKSwgdGhpcy5kYXRlc0Rpc2FibGVkKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xzTmFtZSArPSAnIGRpc2FibGVkJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaHRtbC5wdXNoKCc8dGQgY2xhc3M9XCJkYXknICsgY2xzTmFtZSArICdcIj4nICsgcHJldk1vbnRoLmdldFVUQ0RhdGUoKSArICc8L3RkPicpO1xuICAgICAgICAgICAgICAgIGlmIChwcmV2TW9udGguZ2V0VVRDRGF5KCkgPT0gdGhpcy53ZWVrRW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIGh0bWwucHVzaCgnPC90cj4nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcHJldk1vbnRoLnNldFVUQ0RhdGUocHJldk1vbnRoLmdldFVUQ0RhdGUoKSArIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnLmRhdGVwaWNrZXItZGF5cyB0Ym9keScpLmVtcHR5KCkuYXBwZW5kKGh0bWwuam9pbignJykpO1xuXG4gICAgICAgICAgICBodG1sID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDI0OyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgYWN0dWFsID0gVVRDRGF0ZSh5ZWFyLCBtb250aCwgZGF5TW9udGgsIGkpO1xuICAgICAgICAgICAgICAgIGNsc05hbWUgPSAnJztcbiAgICAgICAgICAgICAgICAvLyBXZSB3YW50IHRoZSBwcmV2aW91cyBob3VyIGZvciB0aGUgc3RhcnREYXRlXG4gICAgICAgICAgICAgICAgaWYgKChhY3R1YWwudmFsdWVPZigpICsgMzYwMDAwMCkgPCB0aGlzLnN0YXJ0RGF0ZSB8fCBhY3R1YWwudmFsdWVPZigpID4gdGhpcy5lbmREYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNsc05hbWUgKz0gJyBkaXNhYmxlZCc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChob3VycyA9PSBpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNsc05hbWUgKz0gJyBhY3RpdmUnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBodG1sLnB1c2goJzxzcGFuIGNsYXNzPVwiaG91cicgKyBjbHNOYW1lICsgJ1wiPicgKyBpICsgJzowMDwvc3Bhbj4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMucGlja2VyLmZpbmQoJy5kYXRlcGlja2VyLWhvdXJzIHRkJykuaHRtbChodG1sLmpvaW4oJycpKTtcblxuICAgICAgICAgICAgaHRtbCA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCA2MDsgaSArPSB0aGlzLm1pbnV0ZVN0ZXApIHtcbiAgICAgICAgICAgICAgICB2YXIgYWN0dWFsID0gVVRDRGF0ZSh5ZWFyLCBtb250aCwgZGF5TW9udGgsIGhvdXJzLCBpKTtcbiAgICAgICAgICAgICAgICBjbHNOYW1lID0gJyc7XG4gICAgICAgICAgICAgICAgaWYgKGFjdHVhbC52YWx1ZU9mKCkgPCB0aGlzLnN0YXJ0RGF0ZSB8fCBhY3R1YWwudmFsdWVPZigpID4gdGhpcy5lbmREYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNsc05hbWUgKz0gJyBkaXNhYmxlZCc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChNYXRoLmZsb29yKG1pbnV0ZXMgLyB0aGlzLm1pbnV0ZVN0ZXApID09IE1hdGguZmxvb3IoaSAvIHRoaXMubWludXRlU3RlcCkpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xzTmFtZSArPSAnIGFjdGl2ZSc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGh0bWwucHVzaCgnPHNwYW4gY2xhc3M9XCJtaW51dGUnICsgY2xzTmFtZSArICdcIj4nICsgaG91cnMgKyAnOicgKyAoaSA8IDEwID8gJzAnICsgaSA6IGkpICsgJzwvc3Bhbj4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMucGlja2VyLmZpbmQoJy5kYXRlcGlja2VyLW1pbnV0ZXMgdGQnKS5odG1sKGh0bWwuam9pbignJykpO1xuXG5cbiAgICAgICAgICAgIHZhciBjdXJyZW50WWVhciA9IHRoaXMuZGF0ZSAmJiB0aGlzLmRhdGUuZ2V0VVRDRnVsbFllYXIoKTtcbiAgICAgICAgICAgIHZhciBtb250aHMgPSB0aGlzLnBpY2tlci5maW5kKCcuZGF0ZXBpY2tlci1tb250aHMnKVxuICAgICAgICAgICAgICAgIC5maW5kKCd0aDplcSgxKScpXG4gICAgICAgICAgICAgICAgLnRleHQoeWVhcilcbiAgICAgICAgICAgICAgICAuZW5kKClcbiAgICAgICAgICAgICAgICAuZmluZCgnc3BhbicpLnJlbW92ZUNsYXNzKCdhY3RpdmUnKTtcbiAgICAgICAgICAgIGlmIChjdXJyZW50WWVhciAmJiBjdXJyZW50WWVhciA9PSB5ZWFyKSB7XG4gICAgICAgICAgICAgICAgbW9udGhzLmVxKHRoaXMuZGF0ZS5nZXRVVENNb250aCgpKS5hZGRDbGFzcygnYWN0aXZlJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoeWVhciA8IHN0YXJ0WWVhciB8fCB5ZWFyID4gZW5kWWVhcikge1xuICAgICAgICAgICAgICAgIG1vbnRocy5hZGRDbGFzcygnZGlzYWJsZWQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh5ZWFyID09IHN0YXJ0WWVhcikge1xuICAgICAgICAgICAgICAgIG1vbnRocy5zbGljZSgwLCBzdGFydE1vbnRoKS5hZGRDbGFzcygnZGlzYWJsZWQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh5ZWFyID09IGVuZFllYXIpIHtcbiAgICAgICAgICAgICAgICBtb250aHMuc2xpY2UoZW5kTW9udGggKyAxKS5hZGRDbGFzcygnZGlzYWJsZWQnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaHRtbCA9ICcnO1xuICAgICAgICAgICAgeWVhciA9IHBhcnNlSW50KHllYXIgLyAxMCwgMTApICogMTA7XG4gICAgICAgICAgICB2YXIgeWVhckNvbnQgPSB0aGlzLnBpY2tlci5maW5kKCcuZGF0ZXBpY2tlci15ZWFycycpXG4gICAgICAgICAgICAgICAgLmZpbmQoJ3RoOmVxKDEpJylcbiAgICAgICAgICAgICAgICAudGV4dCh5ZWFyICsgJy0nICsgKHllYXIgKyA5KSlcbiAgICAgICAgICAgICAgICAuZW5kKClcbiAgICAgICAgICAgICAgICAuZmluZCgndGQnKTtcbiAgICAgICAgICAgIHllYXIgLT0gMTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAtMTsgaSA8IDExOyBpKyspIHtcbiAgICAgICAgICAgICAgICBodG1sICs9ICc8c3BhbiBjbGFzcz1cInllYXInICsgKGkgPT0gLTEgfHwgaSA9PSAxMCA/ICcgb2xkJyA6ICcnKSArIChjdXJyZW50WWVhciA9PSB5ZWFyID8gJyBhY3RpdmUnIDogJycpICsgKHllYXIgPCBzdGFydFllYXIgfHwgeWVhciA+IGVuZFllYXIgPyAnIGRpc2FibGVkJyA6ICcnKSArICdcIj4nICsgeWVhciArICc8L3NwYW4+JztcbiAgICAgICAgICAgICAgICB5ZWFyICs9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB5ZWFyQ29udC5odG1sKGh0bWwpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHVwZGF0ZU5hdkFycm93czogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgZCA9IG5ldyBEYXRlKHRoaXMudmlld0RhdGUpLFxuICAgICAgICAgICAgICAgIHllYXIgPSBkLmdldFVUQ0Z1bGxZZWFyKCksXG4gICAgICAgICAgICAgICAgbW9udGggPSBkLmdldFVUQ01vbnRoKCksXG4gICAgICAgICAgICAgICAgZGF5ID0gZC5nZXRVVENEYXRlKCksXG4gICAgICAgICAgICAgICAgaG91ciA9IGQuZ2V0VVRDSG91cnMoKTtcbiAgICAgICAgICAgIHN3aXRjaCAodGhpcy52aWV3TW9kZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuc3RhcnREYXRlICE9PSAtSW5maW5pdHkgJiYgeWVhciA8PSB0aGlzLnN0YXJ0RGF0ZS5nZXRVVENGdWxsWWVhcigpICYmIG1vbnRoIDw9IHRoaXMuc3RhcnREYXRlLmdldFVUQ01vbnRoKCkgJiYgZGF5IDw9IHRoaXMuc3RhcnREYXRlLmdldFVUQ0RhdGUoKSAmJiBob3VyIDw9IHRoaXMuc3RhcnREYXRlLmdldFVUQ0hvdXJzKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGlja2VyLmZpbmQoJy5wcmV2JykuY3NzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aXNpYmlsaXR5OiAnaGlkZGVuJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBpY2tlci5maW5kKCcucHJldicpLmNzcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlzaWJpbGl0eTogJ3Zpc2libGUnXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5lbmREYXRlICE9PSBJbmZpbml0eSAmJiB5ZWFyID49IHRoaXMuZW5kRGF0ZS5nZXRVVENGdWxsWWVhcigpICYmIG1vbnRoID49IHRoaXMuZW5kRGF0ZS5nZXRVVENNb250aCgpICYmIGRheSA+PSB0aGlzLmVuZERhdGUuZ2V0VVRDRGF0ZSgpICYmIGhvdXIgPj0gdGhpcy5lbmREYXRlLmdldFVUQ0hvdXJzKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGlja2VyLmZpbmQoJy5uZXh0JykuY3NzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aXNpYmlsaXR5OiAnaGlkZGVuJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBpY2tlci5maW5kKCcubmV4dCcpLmNzcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlzaWJpbGl0eTogJ3Zpc2libGUnXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnN0YXJ0RGF0ZSAhPT0gLUluZmluaXR5ICYmIHllYXIgPD0gdGhpcy5zdGFydERhdGUuZ2V0VVRDRnVsbFllYXIoKSAmJiBtb250aCA8PSB0aGlzLnN0YXJ0RGF0ZS5nZXRVVENNb250aCgpICYmIGRheSA8PSB0aGlzLnN0YXJ0RGF0ZS5nZXRVVENEYXRlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGlja2VyLmZpbmQoJy5wcmV2JykuY3NzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aXNpYmlsaXR5OiAnaGlkZGVuJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBpY2tlci5maW5kKCcucHJldicpLmNzcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlzaWJpbGl0eTogJ3Zpc2libGUnXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5lbmREYXRlICE9PSBJbmZpbml0eSAmJiB5ZWFyID49IHRoaXMuZW5kRGF0ZS5nZXRVVENGdWxsWWVhcigpICYmIG1vbnRoID49IHRoaXMuZW5kRGF0ZS5nZXRVVENNb250aCgpICYmIGRheSA+PSB0aGlzLmVuZERhdGUuZ2V0VVRDRGF0ZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBpY2tlci5maW5kKCcubmV4dCcpLmNzcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlzaWJpbGl0eTogJ2hpZGRlbidcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnLm5leHQnKS5jc3Moe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpc2liaWxpdHk6ICd2aXNpYmxlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5zdGFydERhdGUgIT09IC1JbmZpbml0eSAmJiB5ZWFyIDw9IHRoaXMuc3RhcnREYXRlLmdldFVUQ0Z1bGxZZWFyKCkgJiYgbW9udGggPD0gdGhpcy5zdGFydERhdGUuZ2V0VVRDTW9udGgoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnLnByZXYnKS5jc3Moe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpc2liaWxpdHk6ICdoaWRkZW4nXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGlja2VyLmZpbmQoJy5wcmV2JykuY3NzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aXNpYmlsaXR5OiAndmlzaWJsZSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmVuZERhdGUgIT09IEluZmluaXR5ICYmIHllYXIgPj0gdGhpcy5lbmREYXRlLmdldFVUQ0Z1bGxZZWFyKCkgJiYgbW9udGggPj0gdGhpcy5lbmREYXRlLmdldFVUQ01vbnRoKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGlja2VyLmZpbmQoJy5uZXh0JykuY3NzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aXNpYmlsaXR5OiAnaGlkZGVuJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBpY2tlci5maW5kKCcubmV4dCcpLmNzcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlzaWJpbGl0eTogJ3Zpc2libGUnXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICAgICAgY2FzZSA0OlxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5zdGFydERhdGUgIT09IC1JbmZpbml0eSAmJiB5ZWFyIDw9IHRoaXMuc3RhcnREYXRlLmdldFVUQ0Z1bGxZZWFyKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGlja2VyLmZpbmQoJy5wcmV2JykuY3NzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aXNpYmlsaXR5OiAnaGlkZGVuJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBpY2tlci5maW5kKCcucHJldicpLmNzcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlzaWJpbGl0eTogJ3Zpc2libGUnXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5lbmREYXRlICE9PSBJbmZpbml0eSAmJiB5ZWFyID49IHRoaXMuZW5kRGF0ZS5nZXRVVENGdWxsWWVhcigpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBpY2tlci5maW5kKCcubmV4dCcpLmNzcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlzaWJpbGl0eTogJ2hpZGRlbidcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5waWNrZXIuZmluZCgnLm5leHQnKS5jc3Moe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpc2liaWxpdHk6ICd2aXNpYmxlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgY2xpY2s6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgICAgIGlmICgkKGUudGFyZ2V0KS5oYXNDbGFzcygnZGF0ZXBpY2tlci1jbG9zZScpIHx8ICQoZS50YXJnZXQpLnBhcmVudCgpLmhhc0NsYXNzKCdkYXRlcGlja2VyLWNsb3NlJykpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmhpZGUoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHRhcmdldCA9ICQoZS50YXJnZXQpLmNsb3Nlc3QoJ3NwYW4sIHRkLCB0aCcpO1xuICAgICAgICAgICAgaWYgKHRhcmdldC5sZW5ndGggPT0gMSkge1xuICAgICAgICAgICAgICAgIGlmICh0YXJnZXQuaXMoJy5kaXNhYmxlZCcpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudC50cmlnZ2VyKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvdXRPZlJhbmdlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGU6IHRoaXMudmlld0RhdGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydERhdGU6IHRoaXMuc3RhcnREYXRlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZW5kRGF0ZTogdGhpcy5lbmREYXRlXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgc3dpdGNoICh0YXJnZXRbMF0ubm9kZU5hbWUudG9Mb3dlckNhc2UoKSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlICd0aCc6XG4gICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHRhcmdldFswXS5jbGFzc05hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdkYXRlLXN3aXRjaCc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2hvd01vZGUoMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3ByZXYnOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ25leHQnOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZGlyID0gRFBHbG9iYWwubW9kZXNbdGhpcy52aWV3TW9kZV0ubmF2U3RlcCAqICh0YXJnZXRbMF0uY2xhc3NOYW1lID09ICdwcmV2JyA/IC0xIDogMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaCAodGhpcy52aWV3TW9kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAwOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudmlld0RhdGUgPSB0aGlzLm1vdmVIb3VyKHRoaXMudmlld0RhdGUsIGRpcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy52aWV3RGF0ZSA9IHRoaXMubW92ZURhdGUodGhpcy52aWV3RGF0ZSwgZGlyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXdEYXRlID0gdGhpcy5tb3ZlTW9udGgodGhpcy52aWV3RGF0ZSwgZGlyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgNDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXdEYXRlID0gdGhpcy5tb3ZlWWVhcih0aGlzLnZpZXdEYXRlLCBkaXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZmlsbCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlICd0b2RheSc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkYXRlID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZSA9IFVUQ0RhdGUoZGF0ZS5nZXRGdWxsWWVhcigpLCBkYXRlLmdldE1vbnRoKCksIGRhdGUuZ2V0RGF0ZSgpLCBkYXRlLmdldEhvdXJzKCksIGRhdGUuZ2V0TWludXRlcygpLCBkYXRlLmdldFNlY29uZHMoKSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy52aWV3TW9kZSA9IHRoaXMuc3RhcnRWaWV3TW9kZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zaG93TW9kZSgwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2V0RGF0ZShkYXRlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnc3Bhbic6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRhcmdldC5pcygnLmRpc2FibGVkJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGFyZ2V0LmlzKCcubW9udGgnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMubWluVmlldyA9PT0gMykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbW9udGggPSB0YXJnZXQucGFyZW50KCkuZmluZCgnc3BhbicpLmluZGV4KHRhcmdldCkgfHwgMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHllYXIgPSB0aGlzLnZpZXdEYXRlLmdldFVUQ0Z1bGxZZWFyKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXkgPSAxLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaG91cnMgPSB0aGlzLnZpZXdEYXRlLmdldFVUQ0hvdXJzKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaW51dGVzID0gdGhpcy52aWV3RGF0ZS5nZXRVVENNaW51dGVzKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWNvbmRzID0gdGhpcy52aWV3RGF0ZS5nZXRVVENTZWNvbmRzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3NldERhdGUoVVRDRGF0ZSh5ZWFyLCBtb250aCwgZGF5LCBob3VycywgbWludXRlcywgc2Vjb25kcywgMCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy52aWV3RGF0ZS5zZXRVVENEYXRlKDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbW9udGggPSB0YXJnZXQucGFyZW50KCkuZmluZCgnc3BhbicpLmluZGV4KHRhcmdldCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudmlld0RhdGUuc2V0VVRDTW9udGgobW9udGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQudHJpZ2dlcih7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnY2hhbmdlTW9udGgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZTogdGhpcy52aWV3RGF0ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRhcmdldC5pcygnLnllYXInKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMubWluVmlldyA9PT0gNCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgeWVhciA9IHBhcnNlSW50KHRhcmdldC50ZXh0KCksIDEwKSB8fCAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbW9udGggPSAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF5ID0gMSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhvdXJzID0gdGhpcy52aWV3RGF0ZS5nZXRVVENIb3VycygpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWludXRlcyA9IHRoaXMudmlld0RhdGUuZ2V0VVRDTWludXRlcygpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2Vjb25kcyA9IHRoaXMudmlld0RhdGUuZ2V0VVRDU2Vjb25kcygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9zZXREYXRlKFVUQ0RhdGUoeWVhciwgbW9udGgsIGRheSwgaG91cnMsIG1pbnV0ZXMsIHNlY29uZHMsIDApKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudmlld0RhdGUuc2V0VVRDRGF0ZSgxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHllYXIgPSBwYXJzZUludCh0YXJnZXQudGV4dCgpLCAxMCkgfHwgMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy52aWV3RGF0ZS5zZXRVVENGdWxsWWVhcih5ZWFyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LnRyaWdnZXIoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2NoYW5nZVllYXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZTogdGhpcy52aWV3RGF0ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRhcmdldC5pcygnLmhvdXInKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgaG91cnMgPSBwYXJzZUludCh0YXJnZXQudGV4dCgpLCAxMCkgfHwgMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHllYXIgPSB0aGlzLnZpZXdEYXRlLmdldFVUQ0Z1bGxZZWFyKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb250aCA9IHRoaXMudmlld0RhdGUuZ2V0VVRDTW9udGgoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRheSA9IHRoaXMudmlld0RhdGUuZ2V0VVRDRGF0ZSgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWludXRlcyA9IHRoaXMudmlld0RhdGUuZ2V0VVRDTWludXRlcygpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2Vjb25kcyA9IHRoaXMudmlld0RhdGUuZ2V0VVRDU2Vjb25kcygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9zZXREYXRlKFVUQ0RhdGUoeWVhciwgbW9udGgsIGRheSwgaG91cnMsIG1pbnV0ZXMsIHNlY29uZHMsIDApKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRhcmdldC5pcygnLm1pbnV0ZScpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtaW51dGVzID0gcGFyc2VJbnQodGFyZ2V0LnRleHQoKS5zdWJzdHIodGFyZ2V0LnRleHQoKS5pbmRleE9mKCc6JykgKyAxKSwgMTApIHx8IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB5ZWFyID0gdGhpcy52aWV3RGF0ZS5nZXRVVENGdWxsWWVhcigpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9udGggPSB0aGlzLnZpZXdEYXRlLmdldFVUQ01vbnRoKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXkgPSB0aGlzLnZpZXdEYXRlLmdldFVUQ0RhdGUoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhvdXJzID0gdGhpcy52aWV3RGF0ZS5nZXRVVENIb3VycygpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2Vjb25kcyA9IHRoaXMudmlld0RhdGUuZ2V0VVRDU2Vjb25kcygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9zZXREYXRlKFVUQ0RhdGUoeWVhciwgbW9udGgsIGRheSwgaG91cnMsIG1pbnV0ZXMsIHNlY29uZHMsIDApKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudmlld01vZGUgIT0gMCkge1xuXG5cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgb2xkVmlld01vZGUgPSB0aGlzLnZpZXdNb2RlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNob3dNb2RlKC0xKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5maWxsKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvbGRWaWV3TW9kZSA9PSB0aGlzLnZpZXdNb2RlICYmIHRoaXMuYXV0b2Nsb3NlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmhpZGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZmlsbCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5hdXRvY2xvc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaGlkZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3RkJzpcblxuXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0YXJnZXQuaXMoJy5kYXknKSAmJiAhdGFyZ2V0LmlzKCcuZGlzYWJsZWQnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkYXkgPSBwYXJzZUludCh0YXJnZXQudGV4dCgpLCAxMCkgfHwgMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgeWVhciA9IHRoaXMudmlld0RhdGUuZ2V0VVRDRnVsbFllYXIoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9udGggPSB0aGlzLnZpZXdEYXRlLmdldFVUQ01vbnRoKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhvdXJzID0gdGhpcy52aWV3RGF0ZS5nZXRVVENIb3VycygpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaW51dGVzID0gdGhpcy52aWV3RGF0ZS5nZXRVVENNaW51dGVzKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlY29uZHMgPSB0aGlzLnZpZXdEYXRlLmdldFVUQ1NlY29uZHMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGFyZ2V0LmlzKCcub2xkJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1vbnRoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb250aCA9IDExO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeWVhciAtPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9udGggLT0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGFyZ2V0LmlzKCcubmV3JykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1vbnRoID09IDExKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb250aCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5ZWFyICs9IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb250aCArPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3NldERhdGUoVVRDRGF0ZSh5ZWFyLCBtb250aCwgZGF5LCBob3VycywgbWludXRlcywgc2Vjb25kcywgMCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cblxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG9sZFZpZXdNb2RlID0gdGhpcy52aWV3TW9kZTtcblxuXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNob3dNb2RlKC0xKTtcblxuXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZpbGwoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvbGRWaWV3TW9kZSA9PSB0aGlzLnZpZXdNb2RlICYmIHRoaXMuYXV0b2Nsb3NlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5oaWRlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgX3NldERhdGU6IGZ1bmN0aW9uKGRhdGUsIHdoaWNoKSB7XG5cbiAgICAgICAgICAgIGlmICghd2hpY2ggfHwgd2hpY2ggPT0gJ2RhdGUnKVxuICAgICAgICAgICAgICAgIHRoaXMuZGF0ZSA9IGRhdGU7XG4gICAgICAgICAgICBpZiAoIXdoaWNoIHx8IHdoaWNoID09ICd2aWV3JylcbiAgICAgICAgICAgICAgICB0aGlzLnZpZXdEYXRlID0gZGF0ZTtcbiAgICAgICAgICAgIHRoaXMuZmlsbCgpO1xuICAgICAgICAgICAgdGhpcy5zZXRWYWx1ZSgpO1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnRyaWdnZXIoe1xuICAgICAgICAgICAgICAgIHR5cGU6ICdjaGFuZ2VEYXRlJyxcbiAgICAgICAgICAgICAgICBkYXRlOiB0aGlzLmRhdGVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdmFyIGVsZW1lbnQ7XG4gICAgICAgICAgICBpZiAodGhpcy5pc0lucHV0KSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudCA9IHRoaXMuZWxlbWVudDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5jb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50ID0gdGhpcy5lbGVtZW50LmZpbmQoJ2lucHV0Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZWxlbWVudCkge1xuICAgICAgICAgICAgICAgIGVsZW1lbnQuY2hhbmdlKCk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuYXV0b2Nsb3NlICYmICghd2hpY2ggfHwgd2hpY2ggPT0gJ2RhdGUnKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyB0aGlzLmhpZGUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgbW92ZUhvdXI6IGZ1bmN0aW9uKGRhdGUsIGRpcikge1xuICAgICAgICAgICAgaWYgKCFkaXIpIHJldHVybiBkYXRlO1xuICAgICAgICAgICAgdmFyIG5ld19kYXRlID0gbmV3IERhdGUoZGF0ZS52YWx1ZU9mKCkpO1xuICAgICAgICAgICAgZGlyID0gZGlyID4gMCA/IDEgOiAtMTtcbiAgICAgICAgICAgIG5ld19kYXRlLnNldFVUQ0hvdXJzKG5ld19kYXRlLmdldFVUQ0hvdXJzKCkgKyBkaXIpO1xuICAgICAgICAgICAgcmV0dXJuIG5ld19kYXRlO1xuICAgICAgICB9LFxuXG4gICAgICAgIG1vdmVEYXRlOiBmdW5jdGlvbihkYXRlLCBkaXIpIHtcbiAgICAgICAgICAgIGlmICghZGlyKSByZXR1cm4gZGF0ZTtcbiAgICAgICAgICAgIHZhciBuZXdfZGF0ZSA9IG5ldyBEYXRlKGRhdGUudmFsdWVPZigpKTtcbiAgICAgICAgICAgIGRpciA9IGRpciA+IDAgPyAxIDogLTE7XG4gICAgICAgICAgICBuZXdfZGF0ZS5zZXRVVENEYXRlKG5ld19kYXRlLmdldFVUQ0RhdGUoKSArIGRpcik7XG4gICAgICAgICAgICByZXR1cm4gbmV3X2RhdGU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgbW92ZU1vbnRoOiBmdW5jdGlvbihkYXRlLCBkaXIpIHtcbiAgICAgICAgICAgIGlmICghZGlyKSByZXR1cm4gZGF0ZTtcbiAgICAgICAgICAgIHZhciBuZXdfZGF0ZSA9IG5ldyBEYXRlKGRhdGUudmFsdWVPZigpKSxcbiAgICAgICAgICAgICAgICBkYXkgPSBuZXdfZGF0ZS5nZXRVVENEYXRlKCksXG4gICAgICAgICAgICAgICAgbW9udGggPSBuZXdfZGF0ZS5nZXRVVENNb250aCgpLFxuICAgICAgICAgICAgICAgIG1hZyA9IE1hdGguYWJzKGRpciksXG4gICAgICAgICAgICAgICAgbmV3X21vbnRoLCB0ZXN0O1xuICAgICAgICAgICAgZGlyID0gZGlyID4gMCA/IDEgOiAtMTtcbiAgICAgICAgICAgIGlmIChtYWcgPT0gMSkge1xuICAgICAgICAgICAgICAgIHRlc3QgPSBkaXIgPT0gLTFcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgZ29pbmcgYmFjayBvbmUgbW9udGgsIG1ha2Ugc3VyZSBtb250aCBpcyBub3QgY3VycmVudCBtb250aFxuICAgICAgICAgICAgICAgICAgICAvLyAoZWcsIE1hciAzMSAtPiBGZWIgMzEgPT0gRmViIDI4LCBub3QgTWFyIDAyKVxuICAgICAgICAgICAgICAgICAgICA/IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ld19kYXRlLmdldFVUQ01vbnRoKCkgPT0gbW9udGg7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgZ29pbmcgZm9yd2FyZCBvbmUgbW9udGgsIG1ha2Ugc3VyZSBtb250aCBpcyBhcyBleHBlY3RlZFxuICAgICAgICAgICAgICAgICAgICAvLyAoZWcsIEphbiAzMSAtPiBGZWIgMzEgPT0gRmViIDI4LCBub3QgTWFyIDAyKVxuICAgICAgICAgICAgICAgICAgICA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ld19kYXRlLmdldFVUQ01vbnRoKCkgIT0gbmV3X21vbnRoO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIG5ld19tb250aCA9IG1vbnRoICsgZGlyO1xuICAgICAgICAgICAgICAgIG5ld19kYXRlLnNldFVUQ01vbnRoKG5ld19tb250aCk7XG4gICAgICAgICAgICAgICAgLy8gRGVjIC0+IEphbiAoMTIpIG9yIEphbiAtPiBEZWMgKC0xKSAtLSBsaW1pdCBleHBlY3RlZCBkYXRlIHRvIDAtMTFcbiAgICAgICAgICAgICAgICBpZiAobmV3X21vbnRoIDwgMCB8fCBuZXdfbW9udGggPiAxMSlcbiAgICAgICAgICAgICAgICAgICAgbmV3X21vbnRoID0gKG5ld19tb250aCArIDEyKSAlIDEyO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBGb3IgbWFnbml0dWRlcyA+MSwgbW92ZSBvbmUgbW9udGggYXQgYSB0aW1lLi4uXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtYWc7IGkrKylcbiAgICAgICAgICAgICAgICAvLyAuLi53aGljaCBtaWdodCBkZWNyZWFzZSB0aGUgZGF5IChlZywgSmFuIDMxIHRvIEZlYiAyOCwgZXRjKS4uLlxuICAgICAgICAgICAgICAgICAgICBuZXdfZGF0ZSA9IHRoaXMubW92ZU1vbnRoKG5ld19kYXRlLCBkaXIpO1xuICAgICAgICAgICAgICAgIC8vIC4uLnRoZW4gcmVzZXQgdGhlIGRheSwga2VlcGluZyBpdCBpbiB0aGUgbmV3IG1vbnRoXG4gICAgICAgICAgICAgICAgbmV3X21vbnRoID0gbmV3X2RhdGUuZ2V0VVRDTW9udGgoKTtcbiAgICAgICAgICAgICAgICBuZXdfZGF0ZS5zZXRVVENEYXRlKGRheSk7XG4gICAgICAgICAgICAgICAgdGVzdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3X21vbnRoICE9IG5ld19kYXRlLmdldFVUQ01vbnRoKCk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIENvbW1vbiBkYXRlLXJlc2V0dGluZyBsb29wIC0tIGlmIGRhdGUgaXMgYmV5b25kIGVuZCBvZiBtb250aCwgbWFrZSBpdFxuICAgICAgICAgICAgLy8gZW5kIG9mIG1vbnRoXG4gICAgICAgICAgICB3aGlsZSAodGVzdCgpKSB7XG4gICAgICAgICAgICAgICAgbmV3X2RhdGUuc2V0VVRDRGF0ZSgtLWRheSk7XG4gICAgICAgICAgICAgICAgbmV3X2RhdGUuc2V0VVRDTW9udGgobmV3X21vbnRoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBuZXdfZGF0ZTtcbiAgICAgICAgfSxcblxuICAgICAgICBtb3ZlWWVhcjogZnVuY3Rpb24oZGF0ZSwgZGlyKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5tb3ZlTW9udGgoZGF0ZSwgZGlyICogMTIpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRhdGVXaXRoaW5SYW5nZTogZnVuY3Rpb24oZGF0ZSkge1xuICAgICAgICAgICAgcmV0dXJuIGRhdGUgPj0gdGhpcy5zdGFydERhdGUgJiYgZGF0ZSA8PSB0aGlzLmVuZERhdGU7XG4gICAgICAgIH0sXG5cbiAgICAgICAga2V5ZG93bjogZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmtleWJvYXJkTmF2aWdhdGlvbikge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMucGlja2VyLmlzKCc6bm90KDp2aXNpYmxlKScpKSB7XG4gICAgICAgICAgICAgICAgaWYgKGUua2V5Q29kZSA9PSAyNykgLy8gYWxsb3cgZXNjYXBlIHRvIGhpZGUgYW5kIHJlLXNob3cgcGlja2VyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2hvdygpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBkYXRlQ2hhbmdlZCA9IGZhbHNlLFxuICAgICAgICAgICAgICAgIGRpciwgZGF5LCBtb250aCxcbiAgICAgICAgICAgICAgICBuZXdEYXRlLCBuZXdWaWV3RGF0ZTtcbiAgICAgICAgICAgIHN3aXRjaCAoZS5rZXlDb2RlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAyNzogLy8gZXNjYXBlXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaGlkZSgpO1xuICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgMzc6IC8vIGxlZnRcbiAgICAgICAgICAgICAgICBjYXNlIDM5OiAvLyByaWdodFxuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMua2V5Ym9hcmROYXZpZ2F0aW9uKSBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgZGlyID0gZS5rZXlDb2RlID09IDM3ID8gLTEgOiAxO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZS5jdHJsS2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdEYXRlID0gdGhpcy5tb3ZlWWVhcih0aGlzLmRhdGUsIGRpcik7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdWaWV3RGF0ZSA9IHRoaXMubW92ZVllYXIodGhpcy52aWV3RGF0ZSwgZGlyKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChlLnNoaWZ0S2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdEYXRlID0gdGhpcy5tb3ZlTW9udGgodGhpcy5kYXRlLCBkaXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3Vmlld0RhdGUgPSB0aGlzLm1vdmVNb250aCh0aGlzLnZpZXdEYXRlLCBkaXIpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3RGF0ZSA9IG5ldyBEYXRlKHRoaXMuZGF0ZS52YWx1ZU9mKCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3RGF0ZS5zZXRVVENEYXRlKHRoaXMuZGF0ZS5nZXRVVENEYXRlKCkgKyBkaXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3Vmlld0RhdGUgPSBuZXcgRGF0ZSh0aGlzLnZpZXdEYXRlLnZhbHVlT2YoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdWaWV3RGF0ZS5zZXRVVENEYXRlKHRoaXMudmlld0RhdGUuZ2V0VVRDRGF0ZSgpICsgZGlyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5kYXRlV2l0aGluUmFuZ2UobmV3RGF0ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGF0ZSA9IG5ld0RhdGU7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZpZXdEYXRlID0gbmV3Vmlld0RhdGU7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFZhbHVlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZUNoYW5nZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgMzg6IC8vIHVwXG4gICAgICAgICAgICAgICAgY2FzZSA0MDogLy8gZG93blxuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMua2V5Ym9hcmROYXZpZ2F0aW9uKSBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgZGlyID0gZS5rZXlDb2RlID09IDM4ID8gLTEgOiAxO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZS5jdHJsS2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdEYXRlID0gdGhpcy5tb3ZlWWVhcih0aGlzLmRhdGUsIGRpcik7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdWaWV3RGF0ZSA9IHRoaXMubW92ZVllYXIodGhpcy52aWV3RGF0ZSwgZGlyKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChlLnNoaWZ0S2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdEYXRlID0gdGhpcy5tb3ZlTW9udGgodGhpcy5kYXRlLCBkaXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3Vmlld0RhdGUgPSB0aGlzLm1vdmVNb250aCh0aGlzLnZpZXdEYXRlLCBkaXIpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3RGF0ZSA9IG5ldyBEYXRlKHRoaXMuZGF0ZS52YWx1ZU9mKCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3RGF0ZS5zZXRVVENEYXRlKHRoaXMuZGF0ZS5nZXRVVENEYXRlKCkgKyBkaXIgKiA3KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld1ZpZXdEYXRlID0gbmV3IERhdGUodGhpcy52aWV3RGF0ZS52YWx1ZU9mKCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3Vmlld0RhdGUuc2V0VVRDRGF0ZSh0aGlzLnZpZXdEYXRlLmdldFVUQ0RhdGUoKSArIGRpciAqIDcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmRhdGVXaXRoaW5SYW5nZShuZXdEYXRlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kYXRlID0gbmV3RGF0ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudmlld0RhdGUgPSBuZXdWaWV3RGF0ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0VmFsdWUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRlQ2hhbmdlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAxMzogLy8gZW50ZXJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oaWRlKCk7XG4gICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSA5OiAvLyB0YWJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oaWRlKCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGRhdGVDaGFuZ2VkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LnRyaWdnZXIoe1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnY2hhbmdlRGF0ZScsXG4gICAgICAgICAgICAgICAgICAgIGRhdGU6IHRoaXMuZGF0ZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHZhciBlbGVtZW50O1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmlzSW5wdXQpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudCA9IHRoaXMuZWxlbWVudDtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuY29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQgPSB0aGlzLmVsZW1lbnQuZmluZCgnaW5wdXQnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5jaGFuZ2UoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2hvd01vZGU6IGZ1bmN0aW9uKGRpcikge1xuXG4gICAgICAgICAgICBpZiAoZGlyKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5ld1ZpZXdNb2RlID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oRFBHbG9iYWwubW9kZXMubGVuZ3RoIC0gMSwgdGhpcy52aWV3TW9kZSArIGRpcikpO1xuICAgICAgICAgICAgICAgIGlmIChuZXdWaWV3TW9kZSA+PSB0aGlzLm1pblZpZXcgJiYgbmV3Vmlld01vZGUgPD0gdGhpcy5tYXhWaWV3KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmlld01vZGUgPSBuZXdWaWV3TW9kZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvKlxuICAgICAgICAgICAgXHR2aXRhbGV0czogZml4aW5nIGJ1ZyBvZiB2ZXJ5IHNwZWNpYWwgY29uZGl0aW9uczpcbiAgICAgICAgICAgIFx0anF1ZXJ5IDEuNy4xICsgd2Via2l0ICsgc2hvdyBpbmxpbmUgZGF0ZXBpY2tlciBpbiBib290c3RyYXAgcG9wb3Zlci5cbiAgICAgICAgICAgIFx0TWV0aG9kIHNob3coKSBkb2VzIG5vdCBzZXQgZGlzcGxheSBjc3MgY29ycmVjdGx5IGFuZCBkYXRlcGlja2VyIGlzIG5vdCBzaG93bi5cbiAgICAgICAgICAgIFx0Q2hhbmdlZCB0byAuY3NzKCdkaXNwbGF5JywgJ2Jsb2NrJykgc29sdmUgdGhlIHByb2JsZW0uXG4gICAgICAgICAgICBcdFNlZSBodHRwczovL2dpdGh1Yi5jb20vdml0YWxldHMveC1lZGl0YWJsZS9pc3N1ZXMvMzdcblxuICAgICAgICAgICAgXHRJbiBqcXVlcnkgMS43LjIrIGV2ZXJ5dGhpbmcgd29ya3MgZmluZS5cbiAgICAgICAgICAgICovXG4gICAgICAgICAgICAvL3RoaXMucGlja2VyLmZpbmQoJz5kaXYnKS5oaWRlKCkuZmlsdGVyKCcuZGF0ZXBpY2tlci0nK0RQR2xvYmFsLm1vZGVzW3RoaXMudmlld01vZGVdLmNsc05hbWUpLnNob3coKTtcbiAgICAgICAgICAgIHRoaXMucGlja2VyLmZpbmQoJz5kaXYnKS5oaWRlKCkuZmlsdGVyKCcuZGF0ZXBpY2tlci0nICsgRFBHbG9iYWwubW9kZXNbdGhpcy52aWV3TW9kZV0uY2xzTmFtZSkuY3NzKCdkaXNwbGF5JywgJ2Jsb2NrJyk7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZU5hdkFycm93cygpO1xuICAgICAgICB9LFxuICAgICAgICByZXNldDogZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgdGhpcy5fc2V0RGF0ZShudWxsLCAnZGF0ZScpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgICQuZm4uZmRhdGVwaWNrZXIgPSBmdW5jdGlvbihvcHRpb24pIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgICAgICBhcmdzLnNoaWZ0KCk7XG4gICAgICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpLFxuICAgICAgICAgICAgICAgIGRhdGEgPSAkdGhpcy5kYXRhKCdkYXRlcGlja2VyJyksXG4gICAgICAgICAgICAgICAgb3B0aW9ucyA9IHR5cGVvZiBvcHRpb24gPT0gJ29iamVjdCcgJiYgb3B0aW9uO1xuICAgICAgICAgICAgaWYgKCFkYXRhKSB7XG4gICAgICAgICAgICAgICAgJHRoaXMuZGF0YSgnZGF0ZXBpY2tlcicsIChkYXRhID0gbmV3IERhdGVwaWNrZXIodGhpcywgJC5leHRlbmQoe30sICQuZm4uZmRhdGVwaWNrZXIuZGVmYXVsdHMsIG9wdGlvbnMpKSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBvcHRpb24gPT0gJ3N0cmluZycgJiYgdHlwZW9mIGRhdGFbb3B0aW9uXSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgZGF0YVtvcHRpb25dLmFwcGx5KGRhdGEsIGFyZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgJC5mbi5mZGF0ZXBpY2tlci5kZWZhdWx0cyA9IHtcbiAgICAgICAgb25SZW5kZXI6IGZ1bmN0aW9uKGRhdGUpIHtcbiAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfVxuICAgIH07XG4gICAgJC5mbi5mZGF0ZXBpY2tlci5Db25zdHJ1Y3RvciA9IERhdGVwaWNrZXI7XG4gICAgdmFyIGRhdGVzID0gJC5mbi5mZGF0ZXBpY2tlci5kYXRlcyA9IHtcbiAgICAgICAgJ2VuJzoge1xuICAgICAgICAgICAgZGF5czogW1wiU3VuZGF5XCIsIFwiTW9uZGF5XCIsIFwiVHVlc2RheVwiLCBcIldlZG5lc2RheVwiLCBcIlRodXJzZGF5XCIsIFwiRnJpZGF5XCIsIFwiU2F0dXJkYXlcIiwgXCJTdW5kYXlcIl0sXG4gICAgICAgICAgICBkYXlzU2hvcnQ6IFtcIlN1blwiLCBcIk1vblwiLCBcIlR1ZVwiLCBcIldlZFwiLCBcIlRodVwiLCBcIkZyaVwiLCBcIlNhdFwiLCBcIlN1blwiXSxcbiAgICAgICAgICAgIGRheXNNaW46IFtcIlN1XCIsIFwiTW9cIiwgXCJUdVwiLCBcIldlXCIsIFwiVGhcIiwgXCJGclwiLCBcIlNhXCIsIFwiU3VcIl0sXG4gICAgICAgICAgICBtb250aHM6IFtcIkphbnVhcnlcIiwgXCJGZWJydWFyeVwiLCBcIk1hcmNoXCIsIFwiQXByaWxcIiwgXCJNYXlcIiwgXCJKdW5lXCIsIFwiSnVseVwiLCBcIkF1Z3VzdFwiLCBcIlNlcHRlbWJlclwiLCBcIk9jdG9iZXJcIiwgXCJOb3ZlbWJlclwiLCBcIkRlY2VtYmVyXCJdLFxuICAgICAgICAgICAgbW9udGhzU2hvcnQ6IFtcIkphblwiLCBcIkZlYlwiLCBcIk1hclwiLCBcIkFwclwiLCBcIk1heVwiLCBcIkp1blwiLCBcIkp1bFwiLCBcIkF1Z1wiLCBcIlNlcFwiLCBcIk9jdFwiLCBcIk5vdlwiLCBcIkRlY1wiXSxcbiAgICAgICAgICAgIHRvZGF5OiBcIlRvZGF5XCIsXG4gICAgICAgICAgICB0aXRsZUZvcm1hdDogXCJNTSB5eXl5XCJcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgRFBHbG9iYWwgPSB7XG4gICAgICAgIG1vZGVzOiBbe1xuICAgICAgICAgICAgY2xzTmFtZTogJ21pbnV0ZXMnLFxuICAgICAgICAgICAgbmF2Rm5jOiAnSG91cnMnLFxuICAgICAgICAgICAgbmF2U3RlcDogMVxuICAgICAgICB9LCB7XG4gICAgICAgICAgICBjbHNOYW1lOiAnaG91cnMnLFxuICAgICAgICAgICAgbmF2Rm5jOiAnRGF0ZScsXG4gICAgICAgICAgICBuYXZTdGVwOiAxXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIGNsc05hbWU6ICdkYXlzJyxcbiAgICAgICAgICAgIG5hdkZuYzogJ01vbnRoJyxcbiAgICAgICAgICAgIG5hdlN0ZXA6IDFcbiAgICAgICAgfSwge1xuICAgICAgICAgICAgY2xzTmFtZTogJ21vbnRocycsXG4gICAgICAgICAgICBuYXZGbmM6ICdGdWxsWWVhcicsXG4gICAgICAgICAgICBuYXZTdGVwOiAxXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIGNsc05hbWU6ICd5ZWFycycsXG4gICAgICAgICAgICBuYXZGbmM6ICdGdWxsWWVhcicsXG4gICAgICAgICAgICBuYXZTdGVwOiAxMFxuICAgICAgICB9XSxcbiAgICAgICAgaXNMZWFwWWVhcjogZnVuY3Rpb24oeWVhcikge1xuICAgICAgICAgICAgcmV0dXJuICgoKHllYXIgJSA0ID09PSAwKSAmJiAoeWVhciAlIDEwMCAhPT0gMCkpIHx8ICh5ZWFyICUgNDAwID09PSAwKSk7XG4gICAgICAgIH0sXG4gICAgICAgIGdldERheXNJbk1vbnRoOiBmdW5jdGlvbih5ZWFyLCBtb250aCkge1xuICAgICAgICAgICAgcmV0dXJuIFszMSwgKERQR2xvYmFsLmlzTGVhcFllYXIoeWVhcikgPyAyOSA6IDI4KSwgMzEsIDMwLCAzMSwgMzAsIDMxLCAzMSwgMzAsIDMxLCAzMCwgMzFdW21vbnRoXTtcbiAgICAgICAgfSxcbiAgICAgICAgdmFsaWRQYXJ0czogL2hoP3xpaT98c3M/fGRkP3xtbT98TU0/fHl5KD86eXkpPy9nLFxuICAgICAgICBub25wdW5jdHVhdGlvbjogL1teIC1cXC86LUBcXFtcXHUzNDAwLVxcdTlmZmYtYHstflxcdFxcblxccl0rL2csXG4gICAgICAgIHBhcnNlRm9ybWF0OiBmdW5jdGlvbihmb3JtYXQpIHtcbiAgICAgICAgICAgIC8vIElFIHRyZWF0cyBcXDAgYXMgYSBzdHJpbmcgZW5kIGluIGlucHV0cyAodHJ1bmNhdGluZyB0aGUgdmFsdWUpLFxuICAgICAgICAgICAgLy8gc28gaXQncyBhIGJhZCBmb3JtYXQgZGVsaW1pdGVyLCBhbnl3YXlcbiAgICAgICAgICAgIHZhciBzZXBhcmF0b3JzID0gZm9ybWF0LnJlcGxhY2UodGhpcy52YWxpZFBhcnRzLCAnXFwwJykuc3BsaXQoJ1xcMCcpLFxuICAgICAgICAgICAgICAgIHBhcnRzID0gZm9ybWF0Lm1hdGNoKHRoaXMudmFsaWRQYXJ0cyk7XG4gICAgICAgICAgICBpZiAoIXNlcGFyYXRvcnMgfHwgIXNlcGFyYXRvcnMubGVuZ3RoIHx8ICFwYXJ0cyB8fCBwYXJ0cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIGRhdGUgZm9ybWF0LlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZm9ybWF0VGV4dCA9IGZvcm1hdDtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc2VwYXJhdG9yczogc2VwYXJhdG9ycyxcbiAgICAgICAgICAgICAgICBwYXJ0czogcGFydHNcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICAgIHBhcnNlRGF0ZTogZnVuY3Rpb24oZGF0ZSwgZm9ybWF0LCBsYW5ndWFnZSkge1xuICAgICAgICAgICAgaWYgKGRhdGUgaW5zdGFuY2VvZiBEYXRlKSByZXR1cm4gbmV3IERhdGUoZGF0ZS52YWx1ZU9mKCkgLSBkYXRlLmdldFRpbWV6b25lT2Zmc2V0KCkgKiA2MDAwMCk7XG4gICAgICAgICAgICBpZiAoL15cXGR7NH1cXC1cXGR7MSwyfVxcLVxcZHsxLDJ9JC8udGVzdChkYXRlKSkge1xuICAgICAgICAgICAgICAgIGZvcm1hdCA9IHRoaXMucGFyc2VGb3JtYXQoJ3l5eXktbW0tZGQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICgvXlxcZHs0fVxcLVxcZHsxLDJ9XFwtXFxkezEsMn1bVCBdXFxkezEsMn1cXDpcXGR7MSwyfSQvLnRlc3QoZGF0ZSkpIHtcbiAgICAgICAgICAgICAgICBmb3JtYXQgPSB0aGlzLnBhcnNlRm9ybWF0KCd5eXl5LW1tLWRkIGhoOmlpJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoL15cXGR7NH1cXC1cXGR7MSwyfVxcLVxcZHsxLDJ9W1QgXVxcZHsxLDJ9XFw6XFxkezEsMn1cXDpcXGR7MSwyfVtaXXswLDF9JC8udGVzdChkYXRlKSkge1xuICAgICAgICAgICAgICAgIGZvcm1hdCA9IHRoaXMucGFyc2VGb3JtYXQoJ3l5eXktbW0tZGQgaGg6aWk6c3MnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICgvXlstK11cXGQrW2Rtd3ldKFtcXHMsXStbLStdXFxkK1tkbXd5XSkqJC8udGVzdChkYXRlKSkge1xuICAgICAgICAgICAgICAgIHZhciBwYXJ0X3JlID0gLyhbLStdXFxkKykoW2Rtd3ldKS8sXG4gICAgICAgICAgICAgICAgICAgIHBhcnRzID0gZGF0ZS5tYXRjaCgvKFstK11cXGQrKShbZG13eV0pL2cpLFxuICAgICAgICAgICAgICAgICAgICBwYXJ0LCBkaXI7XG4gICAgICAgICAgICAgICAgZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXJ0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBwYXJ0ID0gcGFydF9yZS5leGVjKHBhcnRzW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgZGlyID0gcGFyc2VJbnQocGFydFsxXSk7XG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAocGFydFsyXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnZCc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZS5zZXRVVENEYXRlKGRhdGUuZ2V0VVRDRGF0ZSgpICsgZGlyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ20nOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGUgPSBEYXRldGltZXBpY2tlci5wcm90b3R5cGUubW92ZU1vbnRoLmNhbGwoRGF0ZXRpbWVwaWNrZXIucHJvdG90eXBlLCBkYXRlLCBkaXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAndyc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZS5zZXRVVENEYXRlKGRhdGUuZ2V0VVRDRGF0ZSgpICsgZGlyICogNyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICd5JzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRlID0gRGF0ZXRpbWVwaWNrZXIucHJvdG90eXBlLm1vdmVZZWFyLmNhbGwoRGF0ZXRpbWVwaWNrZXIucHJvdG90eXBlLCBkYXRlLCBkaXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBVVENEYXRlKGRhdGUuZ2V0VVRDRnVsbFllYXIoKSwgZGF0ZS5nZXRVVENNb250aCgpLCBkYXRlLmdldFVUQ0RhdGUoKSwgZGF0ZS5nZXRVVENIb3VycygpLCBkYXRlLmdldFVUQ01pbnV0ZXMoKSwgZGF0ZS5nZXRVVENTZWNvbmRzKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHBhcnRzID0gZGF0ZSAmJiBkYXRlLm1hdGNoKHRoaXMubm9ucHVuY3R1YXRpb24pIHx8IFtdLFxuICAgICAgICAgICAgICAgIGRhdGUgPSBuZXcgRGF0ZSgpLFxuICAgICAgICAgICAgICAgIHBhcnNlZCA9IHt9LFxuICAgICAgICAgICAgICAgIHNldHRlcnNfb3JkZXIgPSBbJ2hoJywgJ2gnLCAnaWknLCAnaScsICdzcycsICdzJywgJ3l5eXknLCAneXknLCAnTScsICdNTScsICdtJywgJ21tJywgJ2QnLCAnZGQnXSxcbiAgICAgICAgICAgICAgICBzZXR0ZXJzX21hcCA9IHtcbiAgICAgICAgICAgICAgICAgICAgaGg6IGZ1bmN0aW9uKGQsIHYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkLnNldFVUQ0hvdXJzKHYpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBoOiBmdW5jdGlvbihkLCB2KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZC5zZXRVVENIb3Vycyh2KTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgaWk6IGZ1bmN0aW9uKGQsIHYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkLnNldFVUQ01pbnV0ZXModik7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGk6IGZ1bmN0aW9uKGQsIHYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkLnNldFVUQ01pbnV0ZXModik7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHNzOiBmdW5jdGlvbihkLCB2KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZC5zZXRVVENTZWNvbmRzKHYpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBzOiBmdW5jdGlvbihkLCB2KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZC5zZXRVVENTZWNvbmRzKHYpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB5eXl5OiBmdW5jdGlvbihkLCB2KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZC5zZXRVVENGdWxsWWVhcih2KTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgeXk6IGZ1bmN0aW9uKGQsIHYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkLnNldFVUQ0Z1bGxZZWFyKDIwMDAgKyB2KTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgbTogZnVuY3Rpb24oZCwgdikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdiAtPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKHYgPCAwKSB2ICs9IDEyO1xuICAgICAgICAgICAgICAgICAgICAgICAgdiAlPSAxMjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGQuc2V0VVRDTW9udGgodik7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoZC5nZXRVVENNb250aCgpICE9IHYpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZC5zZXRVVENEYXRlKGQuZ2V0VVRDRGF0ZSgpIC0gMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZDtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgZDogZnVuY3Rpb24oZCwgdikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGQuc2V0VVRDRGF0ZSh2KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgdmFsLCBmaWx0ZXJlZCwgcGFydDtcbiAgICAgICAgICAgIHNldHRlcnNfbWFwWydNJ10gPSBzZXR0ZXJzX21hcFsnTU0nXSA9IHNldHRlcnNfbWFwWydtbSddID0gc2V0dGVyc19tYXBbJ20nXTtcbiAgICAgICAgICAgIHNldHRlcnNfbWFwWydkZCddID0gc2V0dGVyc19tYXBbJ2QnXTtcbiAgICAgICAgICAgIGRhdGUgPSBVVENEYXRlKGRhdGUuZ2V0RnVsbFllYXIoKSwgZGF0ZS5nZXRNb250aCgpLCBkYXRlLmdldERhdGUoKSwgMCwgMCwgMCk7IC8vZGF0ZS5nZXRIb3VycygpLCBkYXRlLmdldE1pbnV0ZXMoKSwgZGF0ZS5nZXRTZWNvbmRzKCkpO1xuICAgICAgICAgICAgaWYgKHBhcnRzLmxlbmd0aCA9PSBmb3JtYXQucGFydHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGNudCA9IGZvcm1hdC5wYXJ0cy5sZW5ndGg7IGkgPCBjbnQ7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YWwgPSBwYXJzZUludChwYXJ0c1tpXSwgMTApO1xuICAgICAgICAgICAgICAgICAgICBwYXJ0ID0gZm9ybWF0LnBhcnRzW2ldO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNOYU4odmFsKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChwYXJ0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnTU0nOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWx0ZXJlZCA9ICQoZGF0ZXNbbGFuZ3VhZ2VdLm1vbnRocykuZmlsdGVyKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG0gPSB0aGlzLnNsaWNlKDAsIHBhcnRzW2ldLmxlbmd0aCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcCA9IHBhcnRzW2ldLnNsaWNlKDAsIG0ubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBtID09IHA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWwgPSAkLmluQXJyYXkoZmlsdGVyZWRbMF0sIGRhdGVzW2xhbmd1YWdlXS5tb250aHMpICsgMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnTSc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbHRlcmVkID0gJChkYXRlc1tsYW5ndWFnZV0ubW9udGhzU2hvcnQpLmZpbHRlcihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtID0gdGhpcy5zbGljZSgwLCBwYXJ0c1tpXS5sZW5ndGgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHAgPSBwYXJ0c1tpXS5zbGljZSgwLCBtLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbSA9PSBwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsID0gJC5pbkFycmF5KGZpbHRlcmVkWzBdLCBkYXRlc1tsYW5ndWFnZV0ubW9udGhzU2hvcnQpICsgMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcGFyc2VkW3BhcnRdID0gdmFsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgczsgaSA8IHNldHRlcnNfb3JkZXIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgcyA9IHNldHRlcnNfb3JkZXJbaV07XG4gICAgICAgICAgICAgICAgICAgIGlmIChzIGluIHBhcnNlZCAmJiAhaXNOYU4ocGFyc2VkW3NdKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldHRlcnNfbWFwW3NdKGRhdGUsIHBhcnNlZFtzXSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZGF0ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZm9ybWF0RGF0ZTogZnVuY3Rpb24oZGF0ZSwgZm9ybWF0LCBsYW5ndWFnZSkge1xuICAgICAgICAgICAgaWYgKGRhdGUgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB2YWwgPSB7XG4gICAgICAgICAgICAgICAgaDogZGF0ZS5nZXRVVENIb3VycygpLFxuICAgICAgICAgICAgICAgIGk6IGRhdGUuZ2V0VVRDTWludXRlcygpLFxuICAgICAgICAgICAgICAgIHM6IGRhdGUuZ2V0VVRDU2Vjb25kcygpLFxuICAgICAgICAgICAgICAgIGQ6IGRhdGUuZ2V0VVRDRGF0ZSgpLFxuICAgICAgICAgICAgICAgIG06IGRhdGUuZ2V0VVRDTW9udGgoKSArIDEsXG4gICAgICAgICAgICAgICAgTTogZGF0ZXNbbGFuZ3VhZ2VdLm1vbnRoc1Nob3J0W2RhdGUuZ2V0VVRDTW9udGgoKV0sXG4gICAgICAgICAgICAgICAgTU06IGRhdGVzW2xhbmd1YWdlXS5tb250aHNbZGF0ZS5nZXRVVENNb250aCgpXSxcbiAgICAgICAgICAgICAgICB5eTogZGF0ZS5nZXRVVENGdWxsWWVhcigpLnRvU3RyaW5nKCkuc3Vic3RyaW5nKDIpLFxuICAgICAgICAgICAgICAgIHl5eXk6IGRhdGUuZ2V0VVRDRnVsbFllYXIoKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHZhbC5oaCA9ICh2YWwuaCA8IDEwID8gJzAnIDogJycpICsgdmFsLmg7XG4gICAgICAgICAgICB2YWwuaWkgPSAodmFsLmkgPCAxMCA/ICcwJyA6ICcnKSArIHZhbC5pO1xuICAgICAgICAgICAgdmFsLnNzID0gKHZhbC5zIDwgMTAgPyAnMCcgOiAnJykgKyB2YWwucztcbiAgICAgICAgICAgIHZhbC5kZCA9ICh2YWwuZCA8IDEwID8gJzAnIDogJycpICsgdmFsLmQ7XG4gICAgICAgICAgICB2YWwubW0gPSAodmFsLm0gPCAxMCA/ICcwJyA6ICcnKSArIHZhbC5tO1xuICAgICAgICAgICAgdmFyIGRhdGUgPSBbXSxcbiAgICAgICAgICAgICAgICBzZXBzID0gJC5leHRlbmQoW10sIGZvcm1hdC5zZXBhcmF0b3JzKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBjbnQgPSBmb3JtYXQucGFydHMubGVuZ3RoOyBpIDwgY250OyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoc2Vwcy5sZW5ndGgpXG4gICAgICAgICAgICAgICAgICAgIGRhdGUucHVzaChzZXBzLnNoaWZ0KCkpXG4gICAgICAgICAgICAgICAgZGF0ZS5wdXNoKHZhbFtmb3JtYXQucGFydHNbaV1dKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBkYXRlLmpvaW4oJycpO1xuICAgICAgICB9LFxuICAgICAgICBjb252ZXJ0Vmlld01vZGU6IGZ1bmN0aW9uKHZpZXdNb2RlKSB7XG4gICAgICAgICAgICBzd2l0Y2ggKHZpZXdNb2RlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSA0OlxuICAgICAgICAgICAgICAgIGNhc2UgJ2RlY2FkZSc6XG4gICAgICAgICAgICAgICAgICAgIHZpZXdNb2RlID0gNDtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgICAgIGNhc2UgJ3llYXInOlxuICAgICAgICAgICAgICAgICAgICB2aWV3TW9kZSA9IDM7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgICAgICBjYXNlICdtb250aCc6XG4gICAgICAgICAgICAgICAgICAgIHZpZXdNb2RlID0gMjtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgICAgIGNhc2UgJ2RheSc6XG4gICAgICAgICAgICAgICAgICAgIHZpZXdNb2RlID0gMTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAwOlxuICAgICAgICAgICAgICAgIGNhc2UgJ2hvdXInOlxuICAgICAgICAgICAgICAgICAgICB2aWV3TW9kZSA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdmlld01vZGU7XG4gICAgICAgIH0sXG4gICAgICAgIGhlYWRUZW1wbGF0ZTogZnVuY3Rpb24obGVmdEFycm93LCByaWdodEFycm93KSB7cmV0dXJuKCc8dGhlYWQ+JyArXG4gICAgICAgICAgICAnPHRyPicgK1xuICAgICAgICAgICAgJzx0aCBjbGFzcz1cInByZXZcIj4nICsgbGVmdEFycm93ICsgJzwvdGg+JyArXG4gICAgICAgICAgICAnPHRoIGNvbHNwYW49XCI1XCIgY2xhc3M9XCJkYXRlLXN3aXRjaFwiPjwvdGg+JyArXG4gICAgICAgICAgICAnPHRoIGNsYXNzPVwibmV4dFwiPicgKyByaWdodEFycm93ICsgJzwvdGg+JyArXG4gICAgICAgICAgICAnPC90cj4nICtcbiAgICAgICAgICAgICc8L3RoZWFkPicpfSxcbiAgICAgICAgY29udFRlbXBsYXRlOiAnPHRib2R5Pjx0cj48dGQgY29sc3Bhbj1cIjdcIj48L3RkPjwvdHI+PC90Ym9keT4nLFxuICAgICAgICBmb290VGVtcGxhdGU6ICc8dGZvb3Q+PHRyPjx0aCBjb2xzcGFuPVwiN1wiIGNsYXNzPVwidG9kYXlcIj48L3RoPjwvdHI+PC90Zm9vdD4nXG4gICAgfTtcbiAgICBEUEdsb2JhbC50ZW1wbGF0ZSA9IGZ1bmN0aW9uKGxlZnRBcnJvdywgcmlnaHRBcnJvdywgY2xvc2VJY29uKSB7cmV0dXJuKCAnPGRpdiBjbGFzcz1cImRhdGVwaWNrZXJcIj4nICtcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJkYXRlcGlja2VyLW1pbnV0ZXNcIj4nICtcbiAgICAgICAgJzx0YWJsZSBjbGFzcz1cIiB0YWJsZS1jb25kZW5zZWRcIj4nICtcbiAgICAgICAgRFBHbG9iYWwuaGVhZFRlbXBsYXRlKGxlZnRBcnJvdywgcmlnaHRBcnJvdykgK1xuICAgICAgICBEUEdsb2JhbC5jb250VGVtcGxhdGUgK1xuICAgICAgICBEUEdsb2JhbC5mb290VGVtcGxhdGUgK1xuICAgICAgICAnPC90YWJsZT4nICtcbiAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAnPGRpdiBjbGFzcz1cImRhdGVwaWNrZXItaG91cnNcIj4nICtcbiAgICAgICAgJzx0YWJsZSBjbGFzcz1cIiB0YWJsZS1jb25kZW5zZWRcIj4nICtcbiAgICAgICAgRFBHbG9iYWwuaGVhZFRlbXBsYXRlKGxlZnRBcnJvdywgcmlnaHRBcnJvdykgK1xuICAgICAgICBEUEdsb2JhbC5jb250VGVtcGxhdGUgK1xuICAgICAgICBEUEdsb2JhbC5mb290VGVtcGxhdGUgK1xuICAgICAgICAnPC90YWJsZT4nICtcbiAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAnPGRpdiBjbGFzcz1cImRhdGVwaWNrZXItZGF5c1wiPicgK1xuICAgICAgICAnPHRhYmxlIGNsYXNzPVwiIHRhYmxlLWNvbmRlbnNlZFwiPicgK1xuICAgICAgICBEUEdsb2JhbC5oZWFkVGVtcGxhdGUobGVmdEFycm93LCByaWdodEFycm93KSArXG4gICAgICAgICc8dGJvZHk+PC90Ym9keT4nICtcbiAgICAgICAgRFBHbG9iYWwuZm9vdFRlbXBsYXRlICtcbiAgICAgICAgJzwvdGFibGU+JyArXG4gICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJkYXRlcGlja2VyLW1vbnRoc1wiPicgK1xuICAgICAgICAnPHRhYmxlIGNsYXNzPVwidGFibGUtY29uZGVuc2VkXCI+JyArXG4gICAgICAgIERQR2xvYmFsLmhlYWRUZW1wbGF0ZShsZWZ0QXJyb3csIHJpZ2h0QXJyb3cpICtcbiAgICAgICAgRFBHbG9iYWwuY29udFRlbXBsYXRlICtcbiAgICAgICAgRFBHbG9iYWwuZm9vdFRlbXBsYXRlICtcbiAgICAgICAgJzwvdGFibGU+JyArXG4gICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJkYXRlcGlja2VyLXllYXJzXCI+JyArXG4gICAgICAgICc8dGFibGUgY2xhc3M9XCJ0YWJsZS1jb25kZW5zZWRcIj4nICtcbiAgICAgICAgRFBHbG9iYWwuaGVhZFRlbXBsYXRlKGxlZnRBcnJvdywgcmlnaHRBcnJvdykgK1xuICAgICAgICBEUEdsb2JhbC5jb250VGVtcGxhdGUgK1xuICAgICAgICBEUEdsb2JhbC5mb290VGVtcGxhdGUgK1xuICAgICAgICAnPC90YWJsZT4nICtcbiAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAnPGEgY2xhc3M9XCJidXR0b24gZGF0ZXBpY2tlci1jbG9zZSB0aW55IGFsZXJ0IHJpZ2h0XCIgc3R5bGU9XCJ3aWR0aDphdXRvO1wiPicgKyBjbG9zZUljb24gKyAnPC9hPicgK1xuICAgICAgICAnPC9kaXY+Jyl9O1xuXG4gICAgJC5mbi5mZGF0ZXBpY2tlci5EUEdsb2JhbCA9IERQR2xvYmFsO1xuXG59KHdpbmRvdy5qUXVlcnkpO1xuIl19
