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
;!function ($) {

    $(document).ready(function () {

        //
        // date picker
        //
        $('#datepicker').fdatepicker({
            format: 'yyyymmdd'
        }).on('changeDate', function (ev) {
            var new_date = $('#datepicker').data('date');
            // assign to hidden input
            $('#date').val(new_date);
            // show in select drop down
            var dateAr = new_date.split('-');
            $('#date_display').text(new_date.substring(6, 8) + '/' + new_date.substring(4, 6) + '/' + new_date.substring(2, 4));
            $('#date_type').val('date');
        });

        //
        // speceifc day click
        //
        $('#date_type').change(function () {
            // show datepicker
            if ($(this).val() == 'date') {
                $('#datepicker').click();
            }
        });

        // submit events form
        $('#events-form').on('submit', function (e) {

            e.preventDefault();

            $('#events-results-spinner').show();
            $('#load-more-events').hide();
            $('#no-events-found').hide();

            // reset page number
            $('input[name="page_number"]').val(1);

            var data = $("#events-form").serializeArray();

            var ajax_data = {
                'action': 'events_ajax_get_events',
                'data': data
            };

            jQuery.post(js_vars.ajaxurl + window.location.search, ajax_data, function (response) {

                // replace events list
                $('#events-results-spinner').hide();
                $('#events-results').html(response);

                if (response.indexOf("accordion") >= 0) {
                    // has results

                    // count how many rows and if 20 or more then show load more
                    var number_of_rows = $($.parseHTML(response)).find('li').length;
                    if (number_of_rows == $('input[name="per_page"]').val()) {
                        $('#load-more-events').show();
                    } else {
                        $('#load-more-events').hide();
                    }

                    //  page number
                    $('input[name="page_number"]').val(2);

                    // recalc accordians
                    $(document).foundation();
                } else {
                    //no results
                    $('#no-events-found').show();
                }
            });
        });

        // load more
        $('#load-more-events').on('click', function (e) {

            $('#load-more-events').prop("disabled", true);
            $('#load-more-events-spinner').show();

            var data = $("#events-form").serializeArray();

            var ajax_data = {
                'action': 'events_ajax_get_events',
                'data': data
            };

            jQuery.post(js_vars.ajaxurl + window.location.search, ajax_data, function (response) {

                $('#load-more-events').prop("disabled", false);
                $('#load-more-events-spinner').hide();

                // replace events list
                $('#events-results').append(response);

                if (response.indexOf("accordion") >= 0) {
                    // has results

                    // count how many rows and if 20 or more then show load more
                    var number_of_rows = $($.parseHTML(response)).find('li').length;
                    if (number_of_rows == $('input[name="per_page"]').val()) {
                        $('#load-more-events').show();
                    } else {
                        $('#load-more-events').hide();
                    }

                    // increase page number
                    page_number = parseInt($('input[name="page_number"]').val());
                    $('input[name="page_number"]').val(page_number + 1);

                    // recalc accordians
                    $(document).foundation();
                } else {
                    //no results
                    $('#load-more-events').hide();
                }
            });
        });
    });
}(window.jQuery);
;jQuery(document).foundation();
;// Joyride demo
$('#start-jr').on('click', function () {
  $(document).foundation('joyride', 'start');
});
;
;/*! PhotoSwipe Default UI - 4.1.1 - 2015-12-24
* http://photoswipe.com
* Copyright (c) 2015 Dmitry Semenov; */
/**
*
* UI on top of main sliding area (caption, arrows, close button, etc.).
* Built just using public methods/properties of PhotoSwipe.
* 
*/
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define(factory);
	} else if (typeof exports === 'object') {
		module.exports = factory();
	} else {
		root.PhotoSwipeUI_Default = factory();
	}
})(this, function () {

	'use strict';

	var PhotoSwipeUI_Default = function (pswp, framework) {

		var ui = this;
		var _overlayUIUpdated = false,
		    _controlsVisible = true,
		    _fullscrenAPI,
		    _controls,
		    _captionContainer,
		    _fakeCaptionContainer,
		    _indexIndicator,
		    _shareButton,
		    _shareModal,
		    _shareModalHidden = true,
		    _initalCloseOnScrollValue,
		    _isIdle,
		    _listen,
		    _loadingIndicator,
		    _loadingIndicatorHidden,
		    _loadingIndicatorTimeout,
		    _galleryHasOneSlide,
		    _options,
		    _defaultUIOptions = {
			barsSize: { top: 44, bottom: 'auto' },
			closeElClasses: ['item', 'caption', 'zoom-wrap', 'ui', 'top-bar'],
			timeToIdle: 4000,
			timeToIdleOutside: 1000,
			loadingIndicatorDelay: 1000, // 2s

			addCaptionHTMLFn: function (item, captionEl /*, isFake */) {
				if (!item.title) {
					captionEl.children[0].innerHTML = '';
					return false;
				}
				captionEl.children[0].innerHTML = item.title;
				return true;
			},

			closeEl: true,
			captionEl: true,
			fullscreenEl: true,
			zoomEl: true,
			shareEl: true,
			counterEl: true,
			arrowEl: true,
			preloaderEl: true,

			tapToClose: false,
			tapToToggleControls: true,

			clickToCloseNonZoomable: true,

			shareButtons: [{ id: 'facebook', label: 'Share on Facebook', url: 'https://www.facebook.com/sharer/sharer.php?u={{url}}' }, { id: 'twitter', label: 'Tweet', url: 'https://twitter.com/intent/tweet?text={{text}}&url={{url}}' }, { id: 'pinterest', label: 'Pin it', url: 'http://www.pinterest.com/pin/create/button/' + '?url={{url}}&media={{image_url}}&description={{text}}' }, { id: 'download', label: 'Download image', url: '{{raw_image_url}}', download: true }],
			getImageURLForShare: function () /* shareButtonData */{
				return pswp.currItem.src || '';
			},
			getPageURLForShare: function () /* shareButtonData */{
				return window.location.href;
			},
			getTextForShare: function () /* shareButtonData */{
				return pswp.currItem.title || '';
			},

			indexIndicatorSep: ' / ',
			fitControlsWidth: 1200

		},
		    _blockControlsTap,
		    _blockControlsTapTimeout;

		var _onControlsTap = function (e) {
			if (_blockControlsTap) {
				return true;
			}

			e = e || window.event;

			if (_options.timeToIdle && _options.mouseUsed && !_isIdle) {
				// reset idle timer
				_onIdleMouseMove();
			}

			var target = e.target || e.srcElement,
			    uiElement,
			    clickedClass = target.getAttribute('class') || '',
			    found;

			for (var i = 0; i < _uiElements.length; i++) {
				uiElement = _uiElements[i];
				if (uiElement.onTap && clickedClass.indexOf('pswp__' + uiElement.name) > -1) {
					uiElement.onTap();
					found = true;
				}
			}

			if (found) {
				if (e.stopPropagation) {
					e.stopPropagation();
				}
				_blockControlsTap = true;

				// Some versions of Android don't prevent ghost click event 
				// when preventDefault() was called on touchstart and/or touchend.
				// 
				// This happens on v4.3, 4.2, 4.1, 
				// older versions strangely work correctly, 
				// but just in case we add delay on all of them)	
				var tapDelay = framework.features.isOldAndroid ? 600 : 30;
				_blockControlsTapTimeout = setTimeout(function () {
					_blockControlsTap = false;
				}, tapDelay);
			}
		},
		    _fitControlsInViewport = function () {
			return !pswp.likelyTouchDevice || _options.mouseUsed || screen.width > _options.fitControlsWidth;
		},
		    _togglePswpClass = function (el, cName, add) {
			framework[(add ? 'add' : 'remove') + 'Class'](el, 'pswp__' + cName);
		},


		// add class when there is just one item in the gallery
		// (by default it hides left/right arrows and 1ofX counter)
		_countNumItems = function () {
			var hasOneSlide = _options.getNumItemsFn() === 1;

			if (hasOneSlide !== _galleryHasOneSlide) {
				_togglePswpClass(_controls, 'ui--one-slide', hasOneSlide);
				_galleryHasOneSlide = hasOneSlide;
			}
		},
		    _toggleShareModalClass = function () {
			_togglePswpClass(_shareModal, 'share-modal--hidden', _shareModalHidden);
		},
		    _toggleShareModal = function () {

			_shareModalHidden = !_shareModalHidden;

			if (!_shareModalHidden) {
				_toggleShareModalClass();
				setTimeout(function () {
					if (!_shareModalHidden) {
						framework.addClass(_shareModal, 'pswp__share-modal--fade-in');
					}
				}, 30);
			} else {
				framework.removeClass(_shareModal, 'pswp__share-modal--fade-in');
				setTimeout(function () {
					if (_shareModalHidden) {
						_toggleShareModalClass();
					}
				}, 300);
			}

			if (!_shareModalHidden) {
				_updateShareURLs();
			}
			return false;
		},
		    _openWindowPopup = function (e) {
			e = e || window.event;
			var target = e.target || e.srcElement;

			pswp.shout('shareLinkClick', e, target);

			if (!target.href) {
				return false;
			}

			if (target.hasAttribute('download')) {
				return true;
			}

			window.open(target.href, 'pswp_share', 'scrollbars=yes,resizable=yes,toolbar=no,' + 'location=yes,width=550,height=420,top=100,left=' + (window.screen ? Math.round(screen.width / 2 - 275) : 100));

			if (!_shareModalHidden) {
				_toggleShareModal();
			}

			return false;
		},
		    _updateShareURLs = function () {
			var shareButtonOut = '',
			    shareButtonData,
			    shareURL,
			    image_url,
			    page_url,
			    share_text;

			for (var i = 0; i < _options.shareButtons.length; i++) {
				shareButtonData = _options.shareButtons[i];

				image_url = _options.getImageURLForShare(shareButtonData);
				page_url = _options.getPageURLForShare(shareButtonData);
				share_text = _options.getTextForShare(shareButtonData);

				shareURL = shareButtonData.url.replace('{{url}}', encodeURIComponent(page_url)).replace('{{image_url}}', encodeURIComponent(image_url)).replace('{{raw_image_url}}', image_url).replace('{{text}}', encodeURIComponent(share_text));

				shareButtonOut += '<a href="' + shareURL + '" target="_blank" ' + 'class="pswp__share--' + shareButtonData.id + '"' + (shareButtonData.download ? 'download' : '') + '>' + shareButtonData.label + '</a>';

				if (_options.parseShareButtonOut) {
					shareButtonOut = _options.parseShareButtonOut(shareButtonData, shareButtonOut);
				}
			}
			_shareModal.children[0].innerHTML = shareButtonOut;
			_shareModal.children[0].onclick = _openWindowPopup;
		},
		    _hasCloseClass = function (target) {
			for (var i = 0; i < _options.closeElClasses.length; i++) {
				if (framework.hasClass(target, 'pswp__' + _options.closeElClasses[i])) {
					return true;
				}
			}
		},
		    _idleInterval,
		    _idleTimer,
		    _idleIncrement = 0,
		    _onIdleMouseMove = function () {
			clearTimeout(_idleTimer);
			_idleIncrement = 0;
			if (_isIdle) {
				ui.setIdle(false);
			}
		},
		    _onMouseLeaveWindow = function (e) {
			e = e ? e : window.event;
			var from = e.relatedTarget || e.toElement;
			if (!from || from.nodeName === 'HTML') {
				clearTimeout(_idleTimer);
				_idleTimer = setTimeout(function () {
					ui.setIdle(true);
				}, _options.timeToIdleOutside);
			}
		},
		    _setupFullscreenAPI = function () {
			if (_options.fullscreenEl && !framework.features.isOldAndroid) {
				if (!_fullscrenAPI) {
					_fullscrenAPI = ui.getFullscreenAPI();
				}
				if (_fullscrenAPI) {
					framework.bind(document, _fullscrenAPI.eventK, ui.updateFullscreen);
					ui.updateFullscreen();
					framework.addClass(pswp.template, 'pswp--supports-fs');
				} else {
					framework.removeClass(pswp.template, 'pswp--supports-fs');
				}
			}
		},
		    _setupLoadingIndicator = function () {
			// Setup loading indicator
			if (_options.preloaderEl) {

				_toggleLoadingIndicator(true);

				_listen('beforeChange', function () {

					clearTimeout(_loadingIndicatorTimeout);

					// display loading indicator with delay
					_loadingIndicatorTimeout = setTimeout(function () {

						if (pswp.currItem && pswp.currItem.loading) {

							if (!pswp.allowProgressiveImg() || pswp.currItem.img && !pswp.currItem.img.naturalWidth) {
								// show preloader if progressive loading is not enabled, 
								// or image width is not defined yet (because of slow connection)
								_toggleLoadingIndicator(false);
								// items-controller.js function allowProgressiveImg
							}
						} else {
							_toggleLoadingIndicator(true); // hide preloader
						}
					}, _options.loadingIndicatorDelay);
				});
				_listen('imageLoadComplete', function (index, item) {
					if (pswp.currItem === item) {
						_toggleLoadingIndicator(true);
					}
				});
			}
		},
		    _toggleLoadingIndicator = function (hide) {
			if (_loadingIndicatorHidden !== hide) {
				_togglePswpClass(_loadingIndicator, 'preloader--active', !hide);
				_loadingIndicatorHidden = hide;
			}
		},
		    _applyNavBarGaps = function (item) {
			var gap = item.vGap;

			if (_fitControlsInViewport()) {

				var bars = _options.barsSize;
				if (_options.captionEl && bars.bottom === 'auto') {
					if (!_fakeCaptionContainer) {
						_fakeCaptionContainer = framework.createEl('pswp__caption pswp__caption--fake');
						_fakeCaptionContainer.appendChild(framework.createEl('pswp__caption__center'));
						_controls.insertBefore(_fakeCaptionContainer, _captionContainer);
						framework.addClass(_controls, 'pswp__ui--fit');
					}
					if (_options.addCaptionHTMLFn(item, _fakeCaptionContainer, true)) {

						var captionSize = _fakeCaptionContainer.clientHeight;
						gap.bottom = parseInt(captionSize, 10) || 44;
					} else {
						gap.bottom = bars.top; // if no caption, set size of bottom gap to size of top
					}
				} else {
					gap.bottom = bars.bottom === 'auto' ? 0 : bars.bottom;
				}

				// height of top bar is static, no need to calculate it
				gap.top = bars.top;
			} else {
				gap.top = gap.bottom = 0;
			}
		},
		    _setupIdle = function () {
			// Hide controls when mouse is used
			if (_options.timeToIdle) {
				_listen('mouseUsed', function () {

					framework.bind(document, 'mousemove', _onIdleMouseMove);
					framework.bind(document, 'mouseout', _onMouseLeaveWindow);

					_idleInterval = setInterval(function () {
						_idleIncrement++;
						if (_idleIncrement === 2) {
							ui.setIdle(true);
						}
					}, _options.timeToIdle / 2);
				});
			}
		},
		    _setupHidingControlsDuringGestures = function () {

			// Hide controls on vertical drag
			_listen('onVerticalDrag', function (now) {
				if (_controlsVisible && now < 0.95) {
					ui.hideControls();
				} else if (!_controlsVisible && now >= 0.95) {
					ui.showControls();
				}
			});

			// Hide controls when pinching to close
			var pinchControlsHidden;
			_listen('onPinchClose', function (now) {
				if (_controlsVisible && now < 0.9) {
					ui.hideControls();
					pinchControlsHidden = true;
				} else if (pinchControlsHidden && !_controlsVisible && now > 0.9) {
					ui.showControls();
				}
			});

			_listen('zoomGestureEnded', function () {
				pinchControlsHidden = false;
				if (pinchControlsHidden && !_controlsVisible) {
					ui.showControls();
				}
			});
		};

		var _uiElements = [{
			name: 'caption',
			option: 'captionEl',
			onInit: function (el) {
				_captionContainer = el;
			}
		}, {
			name: 'share-modal',
			option: 'shareEl',
			onInit: function (el) {
				_shareModal = el;
			},
			onTap: function () {
				_toggleShareModal();
			}
		}, {
			name: 'button--share',
			option: 'shareEl',
			onInit: function (el) {
				_shareButton = el;
			},
			onTap: function () {
				_toggleShareModal();
			}
		}, {
			name: 'button--zoom',
			option: 'zoomEl',
			onTap: pswp.toggleDesktopZoom
		}, {
			name: 'counter',
			option: 'counterEl',
			onInit: function (el) {
				_indexIndicator = el;
			}
		}, {
			name: 'button--close',
			option: 'closeEl',
			onTap: pswp.close
		}, {
			name: 'button--arrow--left',
			option: 'arrowEl',
			onTap: pswp.prev
		}, {
			name: 'button--arrow--right',
			option: 'arrowEl',
			onTap: pswp.next
		}, {
			name: 'button--fs',
			option: 'fullscreenEl',
			onTap: function () {
				if (_fullscrenAPI.isFullscreen()) {
					_fullscrenAPI.exit();
				} else {
					_fullscrenAPI.enter();
				}
			}
		}, {
			name: 'preloader',
			option: 'preloaderEl',
			onInit: function (el) {
				_loadingIndicator = el;
			}
		}];

		var _setupUIElements = function () {
			var item, classAttr, uiElement;

			var loopThroughChildElements = function (sChildren) {
				if (!sChildren) {
					return;
				}

				var l = sChildren.length;
				for (var i = 0; i < l; i++) {
					item = sChildren[i];
					classAttr = item.className;

					for (var a = 0; a < _uiElements.length; a++) {
						uiElement = _uiElements[a];

						if (classAttr.indexOf('pswp__' + uiElement.name) > -1) {

							if (_options[uiElement.option]) {
								// if element is not disabled from options

								framework.removeClass(item, 'pswp__element--disabled');
								if (uiElement.onInit) {
									uiElement.onInit(item);
								}

								//item.style.display = 'block';
							} else {
								framework.addClass(item, 'pswp__element--disabled');
								//item.style.display = 'none';
							}
						}
					}
				}
			};
			loopThroughChildElements(_controls.children);

			var topBar = framework.getChildByClass(_controls, 'pswp__top-bar');
			if (topBar) {
				loopThroughChildElements(topBar.children);
			}
		};

		ui.init = function () {

			// extend options
			framework.extend(pswp.options, _defaultUIOptions, true);

			// create local link for fast access
			_options = pswp.options;

			// find pswp__ui element
			_controls = framework.getChildByClass(pswp.scrollWrap, 'pswp__ui');

			// create local link
			_listen = pswp.listen;

			_setupHidingControlsDuringGestures();

			// update controls when slides change
			_listen('beforeChange', ui.update);

			// toggle zoom on double-tap
			_listen('doubleTap', function (point) {
				var initialZoomLevel = pswp.currItem.initialZoomLevel;
				if (pswp.getZoomLevel() !== initialZoomLevel) {
					pswp.zoomTo(initialZoomLevel, point, 333);
				} else {
					pswp.zoomTo(_options.getDoubleTapZoom(false, pswp.currItem), point, 333);
				}
			});

			// Allow text selection in caption
			_listen('preventDragEvent', function (e, isDown, preventObj) {
				var t = e.target || e.srcElement;
				if (t && t.getAttribute('class') && e.type.indexOf('mouse') > -1 && (t.getAttribute('class').indexOf('__caption') > 0 || /(SMALL|STRONG|EM)/i.test(t.tagName))) {
					preventObj.prevent = false;
				}
			});

			// bind events for UI
			_listen('bindEvents', function () {
				framework.bind(_controls, 'pswpTap click', _onControlsTap);
				framework.bind(pswp.scrollWrap, 'pswpTap', ui.onGlobalTap);

				if (!pswp.likelyTouchDevice) {
					framework.bind(pswp.scrollWrap, 'mouseover', ui.onMouseOver);
				}
			});

			// unbind events for UI
			_listen('unbindEvents', function () {
				if (!_shareModalHidden) {
					_toggleShareModal();
				}

				if (_idleInterval) {
					clearInterval(_idleInterval);
				}
				framework.unbind(document, 'mouseout', _onMouseLeaveWindow);
				framework.unbind(document, 'mousemove', _onIdleMouseMove);
				framework.unbind(_controls, 'pswpTap click', _onControlsTap);
				framework.unbind(pswp.scrollWrap, 'pswpTap', ui.onGlobalTap);
				framework.unbind(pswp.scrollWrap, 'mouseover', ui.onMouseOver);

				if (_fullscrenAPI) {
					framework.unbind(document, _fullscrenAPI.eventK, ui.updateFullscreen);
					if (_fullscrenAPI.isFullscreen()) {
						_options.hideAnimationDuration = 0;
						_fullscrenAPI.exit();
					}
					_fullscrenAPI = null;
				}
			});

			// clean up things when gallery is destroyed
			_listen('destroy', function () {
				if (_options.captionEl) {
					if (_fakeCaptionContainer) {
						_controls.removeChild(_fakeCaptionContainer);
					}
					framework.removeClass(_captionContainer, 'pswp__caption--empty');
				}

				if (_shareModal) {
					_shareModal.children[0].onclick = null;
				}
				framework.removeClass(_controls, 'pswp__ui--over-close');
				framework.addClass(_controls, 'pswp__ui--hidden');
				ui.setIdle(false);
			});

			if (!_options.showAnimationDuration) {
				framework.removeClass(_controls, 'pswp__ui--hidden');
			}
			_listen('initialZoomIn', function () {
				if (_options.showAnimationDuration) {
					framework.removeClass(_controls, 'pswp__ui--hidden');
				}
			});
			_listen('initialZoomOut', function () {
				framework.addClass(_controls, 'pswp__ui--hidden');
			});

			_listen('parseVerticalMargin', _applyNavBarGaps);

			_setupUIElements();

			if (_options.shareEl && _shareButton && _shareModal) {
				_shareModalHidden = true;
			}

			_countNumItems();

			_setupIdle();

			_setupFullscreenAPI();

			_setupLoadingIndicator();
		};

		ui.setIdle = function (isIdle) {
			_isIdle = isIdle;
			_togglePswpClass(_controls, 'ui--idle', isIdle);
		};

		ui.update = function () {
			// Don't update UI if it's hidden
			if (_controlsVisible && pswp.currItem) {

				ui.updateIndexIndicator();

				if (_options.captionEl) {
					_options.addCaptionHTMLFn(pswp.currItem, _captionContainer);

					_togglePswpClass(_captionContainer, 'caption--empty', !pswp.currItem.title);
				}

				_overlayUIUpdated = true;
			} else {
				_overlayUIUpdated = false;
			}

			if (!_shareModalHidden) {
				_toggleShareModal();
			}

			_countNumItems();
		};

		ui.updateFullscreen = function (e) {

			if (e) {
				// some browsers change window scroll position during the fullscreen
				// so PhotoSwipe updates it just in case
				setTimeout(function () {
					pswp.setScrollOffset(0, framework.getScrollY());
				}, 50);
			}

			// toogle pswp--fs class on root element
			framework[(_fullscrenAPI.isFullscreen() ? 'add' : 'remove') + 'Class'](pswp.template, 'pswp--fs');
		};

		ui.updateIndexIndicator = function () {
			if (_options.counterEl) {
				_indexIndicator.innerHTML = pswp.getCurrentIndex() + 1 + _options.indexIndicatorSep + _options.getNumItemsFn();
			}
		};

		ui.onGlobalTap = function (e) {
			e = e || window.event;
			var target = e.target || e.srcElement;

			if (_blockControlsTap) {
				return;
			}

			if (e.detail && e.detail.pointerType === 'mouse') {

				// close gallery if clicked outside of the image
				if (_hasCloseClass(target)) {
					pswp.close();
					return;
				}

				if (framework.hasClass(target, 'pswp__img')) {
					if (pswp.getZoomLevel() === 1 && pswp.getZoomLevel() <= pswp.currItem.fitRatio) {
						if (_options.clickToCloseNonZoomable) {
							pswp.close();
						}
					} else {
						pswp.toggleDesktopZoom(e.detail.releasePoint);
					}
				}
			} else {

				// tap anywhere (except buttons) to toggle visibility of controls
				if (_options.tapToToggleControls) {
					if (_controlsVisible) {
						ui.hideControls();
					} else {
						ui.showControls();
					}
				}

				// tap to close gallery
				if (_options.tapToClose && (framework.hasClass(target, 'pswp__img') || _hasCloseClass(target))) {
					pswp.close();
					return;
				}
			}
		};
		ui.onMouseOver = function (e) {
			e = e || window.event;
			var target = e.target || e.srcElement;

			// add class when mouse is over an element that should close the gallery
			_togglePswpClass(_controls, 'ui--over-close', _hasCloseClass(target));
		};

		ui.hideControls = function () {
			framework.addClass(_controls, 'pswp__ui--hidden');
			_controlsVisible = false;
		};

		ui.showControls = function () {
			_controlsVisible = true;
			if (!_overlayUIUpdated) {
				ui.update();
			}
			framework.removeClass(_controls, 'pswp__ui--hidden');
		};

		ui.supportsFullscreen = function () {
			var d = document;
			return !!(d.exitFullscreen || d.mozCancelFullScreen || d.webkitExitFullscreen || d.msExitFullscreen);
		};

		ui.getFullscreenAPI = function () {
			var dE = document.documentElement,
			    api,
			    tF = 'fullscreenchange';

			if (dE.requestFullscreen) {
				api = {
					enterK: 'requestFullscreen',
					exitK: 'exitFullscreen',
					elementK: 'fullscreenElement',
					eventK: tF
				};
			} else if (dE.mozRequestFullScreen) {
				api = {
					enterK: 'mozRequestFullScreen',
					exitK: 'mozCancelFullScreen',
					elementK: 'mozFullScreenElement',
					eventK: 'moz' + tF
				};
			} else if (dE.webkitRequestFullscreen) {
				api = {
					enterK: 'webkitRequestFullscreen',
					exitK: 'webkitExitFullscreen',
					elementK: 'webkitFullscreenElement',
					eventK: 'webkit' + tF
				};
			} else if (dE.msRequestFullscreen) {
				api = {
					enterK: 'msRequestFullscreen',
					exitK: 'msExitFullscreen',
					elementK: 'msFullscreenElement',
					eventK: 'MSFullscreenChange'
				};
			}

			if (api) {
				api.enter = function () {
					// disable close-on-scroll in fullscreen
					_initalCloseOnScrollValue = _options.closeOnScroll;
					_options.closeOnScroll = false;

					if (this.enterK === 'webkitRequestFullscreen') {
						pswp.template[this.enterK](Element.ALLOW_KEYBOARD_INPUT);
					} else {
						return pswp.template[this.enterK]();
					}
				};
				api.exit = function () {
					_options.closeOnScroll = _initalCloseOnScrollValue;

					return document[this.exitK]();
				};
				api.isFullscreen = function () {
					return document[this.elementK];
				};
			}

			return api;
		};
	};
	return PhotoSwipeUI_Default;
});
;/*! PhotoSwipe - v4.1.1 - 2015-12-24
* http://photoswipe.com
* Copyright (c) 2015 Dmitry Semenov; */
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define(factory);
	} else if (typeof exports === 'object') {
		module.exports = factory();
	} else {
		root.PhotoSwipe = factory();
	}
})(this, function () {

	'use strict';

	var PhotoSwipe = function (template, UiClass, items, options) {

		/*>>framework-bridge*/
		/**
   *
   * Set of generic functions used by gallery.
   * 
   * You're free to modify anything here as long as functionality is kept.
   * 
   */
		var framework = {
			features: null,
			bind: function (target, type, listener, unbind) {
				var methodName = (unbind ? 'remove' : 'add') + 'EventListener';
				type = type.split(' ');
				for (var i = 0; i < type.length; i++) {
					if (type[i]) {
						target[methodName](type[i], listener, false);
					}
				}
			},
			isArray: function (obj) {
				return obj instanceof Array;
			},
			createEl: function (classes, tag) {
				var el = document.createElement(tag || 'div');
				if (classes) {
					el.className = classes;
				}
				return el;
			},
			getScrollY: function () {
				var yOffset = window.pageYOffset;
				return yOffset !== undefined ? yOffset : document.documentElement.scrollTop;
			},
			unbind: function (target, type, listener) {
				framework.bind(target, type, listener, true);
			},
			removeClass: function (el, className) {
				var reg = new RegExp('(\\s|^)' + className + '(\\s|$)');
				el.className = el.className.replace(reg, ' ').replace(/^\s\s*/, '').replace(/\s\s*$/, '');
			},
			addClass: function (el, className) {
				if (!framework.hasClass(el, className)) {
					el.className += (el.className ? ' ' : '') + className;
				}
			},
			hasClass: function (el, className) {
				return el.className && new RegExp('(^|\\s)' + className + '(\\s|$)').test(el.className);
			},
			getChildByClass: function (parentEl, childClassName) {
				var node = parentEl.firstChild;
				while (node) {
					if (framework.hasClass(node, childClassName)) {
						return node;
					}
					node = node.nextSibling;
				}
			},
			arraySearch: function (array, value, key) {
				var i = array.length;
				while (i--) {
					if (array[i][key] === value) {
						return i;
					}
				}
				return -1;
			},
			extend: function (o1, o2, preventOverwrite) {
				for (var prop in o2) {
					if (o2.hasOwnProperty(prop)) {
						if (preventOverwrite && o1.hasOwnProperty(prop)) {
							continue;
						}
						o1[prop] = o2[prop];
					}
				}
			},
			easing: {
				sine: {
					out: function (k) {
						return Math.sin(k * (Math.PI / 2));
					},
					inOut: function (k) {
						return -(Math.cos(Math.PI * k) - 1) / 2;
					}
				},
				cubic: {
					out: function (k) {
						return --k * k * k + 1;
					}
				}
				/*
    	elastic: {
    		out: function ( k ) {
    				var s, a = 0.1, p = 0.4;
    			if ( k === 0 ) return 0;
    			if ( k === 1 ) return 1;
    			if ( !a || a < 1 ) { a = 1; s = p / 4; }
    			else s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
    			return ( a * Math.pow( 2, - 10 * k) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) + 1 );
    			},
    	},
    	back: {
    		out: function ( k ) {
    			var s = 1.70158;
    			return --k * k * ( ( s + 1 ) * k + s ) + 1;
    		}
    	}
    */
			},

			/**
    * 
    * @return {object}
    * 
    * {
    *  raf : request animation frame function
    *  caf : cancel animation frame function
    *  transfrom : transform property key (with vendor), or null if not supported
    *  oldIE : IE8 or below
    * }
    * 
    */
			detectFeatures: function () {
				if (framework.features) {
					return framework.features;
				}
				var helperEl = framework.createEl(),
				    helperStyle = helperEl.style,
				    vendor = '',
				    features = {};

				// IE8 and below
				features.oldIE = document.all && !document.addEventListener;

				features.touch = 'ontouchstart' in window;

				if (window.requestAnimationFrame) {
					features.raf = window.requestAnimationFrame;
					features.caf = window.cancelAnimationFrame;
				}

				features.pointerEvent = navigator.pointerEnabled || navigator.msPointerEnabled;

				// fix false-positive detection of old Android in new IE
				// (IE11 ua string contains "Android 4.0")

				if (!features.pointerEvent) {

					var ua = navigator.userAgent;

					// Detect if device is iPhone or iPod and if it's older than iOS 8
					// http://stackoverflow.com/a/14223920
					// 
					// This detection is made because of buggy top/bottom toolbars
					// that don't trigger window.resize event.
					// For more info refer to _isFixedPosition variable in core.js

					if (/iP(hone|od)/.test(navigator.platform)) {
						var v = navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/);
						if (v && v.length > 0) {
							v = parseInt(v[1], 10);
							if (v >= 1 && v < 8) {
								features.isOldIOSPhone = true;
							}
						}
					}

					// Detect old Android (before KitKat)
					// due to bugs related to position:fixed
					// http://stackoverflow.com/questions/7184573/pick-up-the-android-version-in-the-browser-by-javascript

					var match = ua.match(/Android\s([0-9\.]*)/);
					var androidversion = match ? match[1] : 0;
					androidversion = parseFloat(androidversion);
					if (androidversion >= 1) {
						if (androidversion < 4.4) {
							features.isOldAndroid = true; // for fixed position bug & performance
						}
						features.androidVersion = androidversion; // for touchend bug
					}
					features.isMobileOpera = /opera mini|opera mobi/i.test(ua);

					// p.s. yes, yes, UA sniffing is bad, propose your solution for above bugs.
				}

				var styleChecks = ['transform', 'perspective', 'animationName'],
				    vendors = ['', 'webkit', 'Moz', 'ms', 'O'],
				    styleCheckItem,
				    styleName;

				for (var i = 0; i < 4; i++) {
					vendor = vendors[i];

					for (var a = 0; a < 3; a++) {
						styleCheckItem = styleChecks[a];

						// uppercase first letter of property name, if vendor is present
						styleName = vendor + (vendor ? styleCheckItem.charAt(0).toUpperCase() + styleCheckItem.slice(1) : styleCheckItem);

						if (!features[styleCheckItem] && styleName in helperStyle) {
							features[styleCheckItem] = styleName;
						}
					}

					if (vendor && !features.raf) {
						vendor = vendor.toLowerCase();
						features.raf = window[vendor + 'RequestAnimationFrame'];
						if (features.raf) {
							features.caf = window[vendor + 'CancelAnimationFrame'] || window[vendor + 'CancelRequestAnimationFrame'];
						}
					}
				}

				if (!features.raf) {
					var lastTime = 0;
					features.raf = function (fn) {
						var currTime = new Date().getTime();
						var timeToCall = Math.max(0, 16 - (currTime - lastTime));
						var id = window.setTimeout(function () {
							fn(currTime + timeToCall);
						}, timeToCall);
						lastTime = currTime + timeToCall;
						return id;
					};
					features.caf = function (id) {
						clearTimeout(id);
					};
				}

				// Detect SVG support
				features.svg = !!document.createElementNS && !!document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect;

				framework.features = features;

				return features;
			}
		};

		framework.detectFeatures();

		// Override addEventListener for old versions of IE
		if (framework.features.oldIE) {

			framework.bind = function (target, type, listener, unbind) {

				type = type.split(' ');

				var methodName = (unbind ? 'detach' : 'attach') + 'Event',
				    evName,
				    _handleEv = function () {
					listener.handleEvent.call(listener);
				};

				for (var i = 0; i < type.length; i++) {
					evName = type[i];
					if (evName) {

						if (typeof listener === 'object' && listener.handleEvent) {
							if (!unbind) {
								listener['oldIE' + evName] = _handleEv;
							} else {
								if (!listener['oldIE' + evName]) {
									return false;
								}
							}

							target[methodName]('on' + evName, listener['oldIE' + evName]);
						} else {
							target[methodName]('on' + evName, listener);
						}
					}
				}
			};
		}

		/*>>framework-bridge*/

		/*>>core*/
		//function(template, UiClass, items, options)

		var self = this;

		/**
   * Static vars, don't change unless you know what you're doing.
   */
		var DOUBLE_TAP_RADIUS = 25,
		    NUM_HOLDERS = 3;

		/**
   * Options
   */
		var _options = {
			allowPanToNext: true,
			spacing: 0.12,
			bgOpacity: 1,
			mouseUsed: false,
			loop: true,
			pinchToClose: true,
			closeOnScroll: true,
			closeOnVerticalDrag: true,
			verticalDragRange: 0.75,
			hideAnimationDuration: 333,
			showAnimationDuration: 333,
			showHideOpacity: false,
			focus: true,
			escKey: true,
			arrowKeys: true,
			mainScrollEndFriction: 0.35,
			panEndFriction: 0.35,
			isClickableElement: function (el) {
				return el.tagName === 'A';
			},
			getDoubleTapZoom: function (isMouseClick, item) {
				if (isMouseClick) {
					return 1;
				} else {
					return item.initialZoomLevel < 0.7 ? 1 : 1.33;
				}
			},
			maxSpreadZoom: 1.33,
			modal: true,

			// not fully implemented yet
			scaleMode: 'fit' // TODO
		};
		framework.extend(_options, options);

		/**
   * Private helper variables & functions
   */

		var _getEmptyPoint = function () {
			return { x: 0, y: 0 };
		};

		var _isOpen,
		    _isDestroying,
		    _closedByScroll,
		    _currentItemIndex,
		    _containerStyle,
		    _containerShiftIndex,
		    _currPanDist = _getEmptyPoint(),
		    _startPanOffset = _getEmptyPoint(),
		    _panOffset = _getEmptyPoint(),
		    _upMoveEvents,
		    // drag move, drag end & drag cancel events array
		_downEvents,
		    // drag start events array
		_globalEventHandlers,
		    _viewportSize = {},
		    _currZoomLevel,
		    _startZoomLevel,
		    _translatePrefix,
		    _translateSufix,
		    _updateSizeInterval,
		    _itemsNeedUpdate,
		    _currPositionIndex = 0,
		    _offset = {},
		    _slideSize = _getEmptyPoint(),
		    // size of slide area, including spacing
		_itemHolders,
		    _prevItemIndex,
		    _indexDiff = 0,
		    // difference of indexes since last content update
		_dragStartEvent,
		    _dragMoveEvent,
		    _dragEndEvent,
		    _dragCancelEvent,
		    _transformKey,
		    _pointerEventEnabled,
		    _isFixedPosition = true,
		    _likelyTouchDevice,
		    _modules = [],
		    _requestAF,
		    _cancelAF,
		    _initalClassName,
		    _initalWindowScrollY,
		    _oldIE,
		    _currentWindowScrollY,
		    _features,
		    _windowVisibleSize = {},
		    _renderMaxResolution = false,


		// Registers PhotoSWipe module (History, Controller ...)
		_registerModule = function (name, module) {
			framework.extend(self, module.publicMethods);
			_modules.push(name);
		},
		    _getLoopedId = function (index) {
			var numSlides = _getNumItems();
			if (index > numSlides - 1) {
				return index - numSlides;
			} else if (index < 0) {
				return numSlides + index;
			}
			return index;
		},


		// Micro bind/trigger
		_listeners = {},
		    _listen = function (name, fn) {
			if (!_listeners[name]) {
				_listeners[name] = [];
			}
			return _listeners[name].push(fn);
		},
		    _shout = function (name) {
			var listeners = _listeners[name];

			if (listeners) {
				var args = Array.prototype.slice.call(arguments);
				args.shift();

				for (var i = 0; i < listeners.length; i++) {
					listeners[i].apply(self, args);
				}
			}
		},
		    _getCurrentTime = function () {
			return new Date().getTime();
		},
		    _applyBgOpacity = function (opacity) {
			_bgOpacity = opacity;
			self.bg.style.opacity = opacity * _options.bgOpacity;
		},
		    _applyZoomTransform = function (styleObj, x, y, zoom, item) {
			if (!_renderMaxResolution || item && item !== self.currItem) {
				zoom = zoom / (item ? item.fitRatio : self.currItem.fitRatio);
			}

			styleObj[_transformKey] = _translatePrefix + x + 'px, ' + y + 'px' + _translateSufix + ' scale(' + zoom + ')';
		},
		    _applyCurrentZoomPan = function (allowRenderResolution) {
			if (_currZoomElementStyle) {

				if (allowRenderResolution) {
					if (_currZoomLevel > self.currItem.fitRatio) {
						if (!_renderMaxResolution) {
							_setImageSize(self.currItem, false, true);
							_renderMaxResolution = true;
						}
					} else {
						if (_renderMaxResolution) {
							_setImageSize(self.currItem);
							_renderMaxResolution = false;
						}
					}
				}

				_applyZoomTransform(_currZoomElementStyle, _panOffset.x, _panOffset.y, _currZoomLevel);
			}
		},
		    _applyZoomPanToItem = function (item) {
			if (item.container) {

				_applyZoomTransform(item.container.style, item.initialPosition.x, item.initialPosition.y, item.initialZoomLevel, item);
			}
		},
		    _setTranslateX = function (x, elStyle) {
			elStyle[_transformKey] = _translatePrefix + x + 'px, 0px' + _translateSufix;
		},
		    _moveMainScroll = function (x, dragging) {

			if (!_options.loop && dragging) {
				var newSlideIndexOffset = _currentItemIndex + (_slideSize.x * _currPositionIndex - x) / _slideSize.x,
				    delta = Math.round(x - _mainScrollPos.x);

				if (newSlideIndexOffset < 0 && delta > 0 || newSlideIndexOffset >= _getNumItems() - 1 && delta < 0) {
					x = _mainScrollPos.x + delta * _options.mainScrollEndFriction;
				}
			}

			_mainScrollPos.x = x;
			_setTranslateX(x, _containerStyle);
		},
		    _calculatePanOffset = function (axis, zoomLevel) {
			var m = _midZoomPoint[axis] - _offset[axis];
			return _startPanOffset[axis] + _currPanDist[axis] + m - m * (zoomLevel / _startZoomLevel);
		},
		    _equalizePoints = function (p1, p2) {
			p1.x = p2.x;
			p1.y = p2.y;
			if (p2.id) {
				p1.id = p2.id;
			}
		},
		    _roundPoint = function (p) {
			p.x = Math.round(p.x);
			p.y = Math.round(p.y);
		},
		    _mouseMoveTimeout = null,
		    _onFirstMouseMove = function () {
			// Wait until mouse move event is fired at least twice during 100ms
			// We do this, because some mobile browsers trigger it on touchstart
			if (_mouseMoveTimeout) {
				framework.unbind(document, 'mousemove', _onFirstMouseMove);
				framework.addClass(template, 'pswp--has_mouse');
				_options.mouseUsed = true;
				_shout('mouseUsed');
			}
			_mouseMoveTimeout = setTimeout(function () {
				_mouseMoveTimeout = null;
			}, 100);
		},
		    _bindEvents = function () {
			framework.bind(document, 'keydown', self);

			if (_features.transform) {
				// don't bind click event in browsers that don't support transform (mostly IE8)
				framework.bind(self.scrollWrap, 'click', self);
			}

			if (!_options.mouseUsed) {
				framework.bind(document, 'mousemove', _onFirstMouseMove);
			}

			framework.bind(window, 'resize scroll', self);

			_shout('bindEvents');
		},
		    _unbindEvents = function () {
			framework.unbind(window, 'resize', self);
			framework.unbind(window, 'scroll', _globalEventHandlers.scroll);
			framework.unbind(document, 'keydown', self);
			framework.unbind(document, 'mousemove', _onFirstMouseMove);

			if (_features.transform) {
				framework.unbind(self.scrollWrap, 'click', self);
			}

			if (_isDragging) {
				framework.unbind(window, _upMoveEvents, self);
			}

			_shout('unbindEvents');
		},
		    _calculatePanBounds = function (zoomLevel, update) {
			var bounds = _calculateItemSize(self.currItem, _viewportSize, zoomLevel);
			if (update) {
				_currPanBounds = bounds;
			}
			return bounds;
		},
		    _getMinZoomLevel = function (item) {
			if (!item) {
				item = self.currItem;
			}
			return item.initialZoomLevel;
		},
		    _getMaxZoomLevel = function (item) {
			if (!item) {
				item = self.currItem;
			}
			return item.w > 0 ? _options.maxSpreadZoom : 1;
		},


		// Return true if offset is out of the bounds
		_modifyDestPanOffset = function (axis, destPanBounds, destPanOffset, destZoomLevel) {
			if (destZoomLevel === self.currItem.initialZoomLevel) {
				destPanOffset[axis] = self.currItem.initialPosition[axis];
				return true;
			} else {
				destPanOffset[axis] = _calculatePanOffset(axis, destZoomLevel);

				if (destPanOffset[axis] > destPanBounds.min[axis]) {
					destPanOffset[axis] = destPanBounds.min[axis];
					return true;
				} else if (destPanOffset[axis] < destPanBounds.max[axis]) {
					destPanOffset[axis] = destPanBounds.max[axis];
					return true;
				}
			}
			return false;
		},
		    _setupTransforms = function () {

			if (_transformKey) {
				// setup 3d transforms
				var allow3dTransform = _features.perspective && !_likelyTouchDevice;
				_translatePrefix = 'translate' + (allow3dTransform ? '3d(' : '(');
				_translateSufix = _features.perspective ? ', 0px)' : ')';
				return;
			}

			// Override zoom/pan/move functions in case old browser is used (most likely IE)
			// (so they use left/top/width/height, instead of CSS transform)

			_transformKey = 'left';
			framework.addClass(template, 'pswp--ie');

			_setTranslateX = function (x, elStyle) {
				elStyle.left = x + 'px';
			};
			_applyZoomPanToItem = function (item) {

				var zoomRatio = item.fitRatio > 1 ? 1 : item.fitRatio,
				    s = item.container.style,
				    w = zoomRatio * item.w,
				    h = zoomRatio * item.h;

				s.width = w + 'px';
				s.height = h + 'px';
				s.left = item.initialPosition.x + 'px';
				s.top = item.initialPosition.y + 'px';
			};
			_applyCurrentZoomPan = function () {
				if (_currZoomElementStyle) {

					var s = _currZoomElementStyle,
					    item = self.currItem,
					    zoomRatio = item.fitRatio > 1 ? 1 : item.fitRatio,
					    w = zoomRatio * item.w,
					    h = zoomRatio * item.h;

					s.width = w + 'px';
					s.height = h + 'px';

					s.left = _panOffset.x + 'px';
					s.top = _panOffset.y + 'px';
				}
			};
		},
		    _onKeyDown = function (e) {
			var keydownAction = '';
			if (_options.escKey && e.keyCode === 27) {
				keydownAction = 'close';
			} else if (_options.arrowKeys) {
				if (e.keyCode === 37) {
					keydownAction = 'prev';
				} else if (e.keyCode === 39) {
					keydownAction = 'next';
				}
			}

			if (keydownAction) {
				// don't do anything if special key pressed to prevent from overriding default browser actions
				// e.g. in Chrome on Mac cmd+arrow-left returns to previous page
				if (!e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey) {
					if (e.preventDefault) {
						e.preventDefault();
					} else {
						e.returnValue = false;
					}
					self[keydownAction]();
				}
			}
		},
		    _onGlobalClick = function (e) {
			if (!e) {
				return;
			}

			// don't allow click event to pass through when triggering after drag or some other gesture
			if (_moved || _zoomStarted || _mainScrollAnimating || _verticalDragInitiated) {
				e.preventDefault();
				e.stopPropagation();
			}
		},
		    _updatePageScrollOffset = function () {
			self.setScrollOffset(0, framework.getScrollY());
		};

		// Micro animation engine
		var _animations = {},
		    _numAnimations = 0,
		    _stopAnimation = function (name) {
			if (_animations[name]) {
				if (_animations[name].raf) {
					_cancelAF(_animations[name].raf);
				}
				_numAnimations--;
				delete _animations[name];
			}
		},
		    _registerStartAnimation = function (name) {
			if (_animations[name]) {
				_stopAnimation(name);
			}
			if (!_animations[name]) {
				_numAnimations++;
				_animations[name] = {};
			}
		},
		    _stopAllAnimations = function () {
			for (var prop in _animations) {

				if (_animations.hasOwnProperty(prop)) {
					_stopAnimation(prop);
				}
			}
		},
		    _animateProp = function (name, b, endProp, d, easingFn, onUpdate, onComplete) {
			var startAnimTime = _getCurrentTime(),
			    t;
			_registerStartAnimation(name);

			var animloop = function () {
				if (_animations[name]) {

					t = _getCurrentTime() - startAnimTime; // time diff
					//b - beginning (start prop)
					//d - anim duration

					if (t >= d) {
						_stopAnimation(name);
						onUpdate(endProp);
						if (onComplete) {
							onComplete();
						}
						return;
					}
					onUpdate((endProp - b) * easingFn(t / d) + b);

					_animations[name].raf = _requestAF(animloop);
				}
			};
			animloop();
		};

		var publicMethods = {

			// make a few local variables and functions public
			shout: _shout,
			listen: _listen,
			viewportSize: _viewportSize,
			options: _options,

			isMainScrollAnimating: function () {
				return _mainScrollAnimating;
			},
			getZoomLevel: function () {
				return _currZoomLevel;
			},
			getCurrentIndex: function () {
				return _currentItemIndex;
			},
			isDragging: function () {
				return _isDragging;
			},
			isZooming: function () {
				return _isZooming;
			},
			setScrollOffset: function (x, y) {
				_offset.x = x;
				_currentWindowScrollY = _offset.y = y;
				_shout('updateScrollOffset', _offset);
			},
			applyZoomPan: function (zoomLevel, panX, panY, allowRenderResolution) {
				_panOffset.x = panX;
				_panOffset.y = panY;
				_currZoomLevel = zoomLevel;
				_applyCurrentZoomPan(allowRenderResolution);
			},

			init: function () {

				if (_isOpen || _isDestroying) {
					return;
				}

				var i;

				self.framework = framework; // basic functionality
				self.template = template; // root DOM element of PhotoSwipe
				self.bg = framework.getChildByClass(template, 'pswp__bg');

				_initalClassName = template.className;
				_isOpen = true;

				_features = framework.detectFeatures();
				_requestAF = _features.raf;
				_cancelAF = _features.caf;
				_transformKey = _features.transform;
				_oldIE = _features.oldIE;

				self.scrollWrap = framework.getChildByClass(template, 'pswp__scroll-wrap');
				self.container = framework.getChildByClass(self.scrollWrap, 'pswp__container');

				_containerStyle = self.container.style; // for fast access

				// Objects that hold slides (there are only 3 in DOM)
				self.itemHolders = _itemHolders = [{ el: self.container.children[0], wrap: 0, index: -1 }, { el: self.container.children[1], wrap: 0, index: -1 }, { el: self.container.children[2], wrap: 0, index: -1 }];

				// hide nearby item holders until initial zoom animation finishes (to avoid extra Paints)
				_itemHolders[0].el.style.display = _itemHolders[2].el.style.display = 'none';

				_setupTransforms();

				// Setup global events
				_globalEventHandlers = {
					resize: self.updateSize,
					scroll: _updatePageScrollOffset,
					keydown: _onKeyDown,
					click: _onGlobalClick
				};

				// disable show/hide effects on old browsers that don't support CSS animations or transforms, 
				// old IOS, Android and Opera mobile. Blackberry seems to work fine, even older models.
				var oldPhone = _features.isOldIOSPhone || _features.isOldAndroid || _features.isMobileOpera;
				if (!_features.animationName || !_features.transform || oldPhone) {
					_options.showAnimationDuration = _options.hideAnimationDuration = 0;
				}

				// init modules
				for (i = 0; i < _modules.length; i++) {
					self['init' + _modules[i]]();
				}

				// init
				if (UiClass) {
					var ui = self.ui = new UiClass(self, framework);
					ui.init();
				}

				_shout('firstUpdate');
				_currentItemIndex = _currentItemIndex || _options.index || 0;
				// validate index
				if (isNaN(_currentItemIndex) || _currentItemIndex < 0 || _currentItemIndex >= _getNumItems()) {
					_currentItemIndex = 0;
				}
				self.currItem = _getItemAt(_currentItemIndex);

				if (_features.isOldIOSPhone || _features.isOldAndroid) {
					_isFixedPosition = false;
				}

				template.setAttribute('aria-hidden', 'false');
				if (_options.modal) {
					if (!_isFixedPosition) {
						template.style.position = 'absolute';
						template.style.top = framework.getScrollY() + 'px';
					} else {
						template.style.position = 'fixed';
					}
				}

				if (_currentWindowScrollY === undefined) {
					_shout('initialLayout');
					_currentWindowScrollY = _initalWindowScrollY = framework.getScrollY();
				}

				// add classes to root element of PhotoSwipe
				var rootClasses = 'pswp--open ';
				if (_options.mainClass) {
					rootClasses += _options.mainClass + ' ';
				}
				if (_options.showHideOpacity) {
					rootClasses += 'pswp--animate_opacity ';
				}
				rootClasses += _likelyTouchDevice ? 'pswp--touch' : 'pswp--notouch';
				rootClasses += _features.animationName ? ' pswp--css_animation' : '';
				rootClasses += _features.svg ? ' pswp--svg' : '';
				framework.addClass(template, rootClasses);

				self.updateSize();

				// initial update
				_containerShiftIndex = -1;
				_indexDiff = null;
				for (i = 0; i < NUM_HOLDERS; i++) {
					_setTranslateX((i + _containerShiftIndex) * _slideSize.x, _itemHolders[i].el.style);
				}

				if (!_oldIE) {
					framework.bind(self.scrollWrap, _downEvents, self); // no dragging for old IE
				}

				_listen('initialZoomInEnd', function () {
					self.setContent(_itemHolders[0], _currentItemIndex - 1);
					self.setContent(_itemHolders[2], _currentItemIndex + 1);

					_itemHolders[0].el.style.display = _itemHolders[2].el.style.display = 'block';

					if (_options.focus) {
						// focus causes layout, 
						// which causes lag during the animation, 
						// that's why we delay it untill the initial zoom transition ends
						template.focus();
					}

					_bindEvents();
				});

				// set content for center slide (first time)
				self.setContent(_itemHolders[1], _currentItemIndex);

				self.updateCurrItem();

				_shout('afterInit');

				if (!_isFixedPosition) {

					// On all versions of iOS lower than 8.0, we check size of viewport every second.
					// 
					// This is done to detect when Safari top & bottom bars appear, 
					// as this action doesn't trigger any events (like resize). 
					// 
					// On iOS8 they fixed this.
					// 
					// 10 Nov 2014: iOS 7 usage ~40%. iOS 8 usage 56%.

					_updateSizeInterval = setInterval(function () {
						if (!_numAnimations && !_isDragging && !_isZooming && _currZoomLevel === self.currItem.initialZoomLevel) {
							self.updateSize();
						}
					}, 1000);
				}

				framework.addClass(template, 'pswp--visible');
			},

			// Close the gallery, then destroy it
			close: function () {
				if (!_isOpen) {
					return;
				}

				_isOpen = false;
				_isDestroying = true;
				_shout('close');
				_unbindEvents();

				_showOrHide(self.currItem, null, true, self.destroy);
			},

			// destroys the gallery (unbinds events, cleans up intervals and timeouts to avoid memory leaks)
			destroy: function () {
				_shout('destroy');

				if (_showOrHideTimeout) {
					clearTimeout(_showOrHideTimeout);
				}

				template.setAttribute('aria-hidden', 'true');
				template.className = _initalClassName;

				if (_updateSizeInterval) {
					clearInterval(_updateSizeInterval);
				}

				framework.unbind(self.scrollWrap, _downEvents, self);

				// we unbind scroll event at the end, as closing animation may depend on it
				framework.unbind(window, 'scroll', self);

				_stopDragUpdateLoop();

				_stopAllAnimations();

				_listeners = null;
			},

			/**
    * Pan image to position
    * @param {Number} x     
    * @param {Number} y     
    * @param {Boolean} force Will ignore bounds if set to true.
    */
			panTo: function (x, y, force) {
				if (!force) {
					if (x > _currPanBounds.min.x) {
						x = _currPanBounds.min.x;
					} else if (x < _currPanBounds.max.x) {
						x = _currPanBounds.max.x;
					}

					if (y > _currPanBounds.min.y) {
						y = _currPanBounds.min.y;
					} else if (y < _currPanBounds.max.y) {
						y = _currPanBounds.max.y;
					}
				}

				_panOffset.x = x;
				_panOffset.y = y;
				_applyCurrentZoomPan();
			},

			handleEvent: function (e) {
				e = e || window.event;
				if (_globalEventHandlers[e.type]) {
					_globalEventHandlers[e.type](e);
				}
			},

			goTo: function (index) {

				index = _getLoopedId(index);

				var diff = index - _currentItemIndex;
				_indexDiff = diff;

				_currentItemIndex = index;
				self.currItem = _getItemAt(_currentItemIndex);
				_currPositionIndex -= diff;

				_moveMainScroll(_slideSize.x * _currPositionIndex);

				_stopAllAnimations();
				_mainScrollAnimating = false;

				self.updateCurrItem();
			},
			next: function () {
				self.goTo(_currentItemIndex + 1);
			},
			prev: function () {
				self.goTo(_currentItemIndex - 1);
			},

			// update current zoom/pan objects
			updateCurrZoomItem: function (emulateSetContent) {
				if (emulateSetContent) {
					_shout('beforeChange', 0);
				}

				// itemHolder[1] is middle (current) item
				if (_itemHolders[1].el.children.length) {
					var zoomElement = _itemHolders[1].el.children[0];
					if (framework.hasClass(zoomElement, 'pswp__zoom-wrap')) {
						_currZoomElementStyle = zoomElement.style;
					} else {
						_currZoomElementStyle = null;
					}
				} else {
					_currZoomElementStyle = null;
				}

				_currPanBounds = self.currItem.bounds;
				_startZoomLevel = _currZoomLevel = self.currItem.initialZoomLevel;

				_panOffset.x = _currPanBounds.center.x;
				_panOffset.y = _currPanBounds.center.y;

				if (emulateSetContent) {
					_shout('afterChange');
				}
			},

			invalidateCurrItems: function () {
				_itemsNeedUpdate = true;
				for (var i = 0; i < NUM_HOLDERS; i++) {
					if (_itemHolders[i].item) {
						_itemHolders[i].item.needsUpdate = true;
					}
				}
			},

			updateCurrItem: function (beforeAnimation) {

				if (_indexDiff === 0) {
					return;
				}

				var diffAbs = Math.abs(_indexDiff),
				    tempHolder;

				if (beforeAnimation && diffAbs < 2) {
					return;
				}

				self.currItem = _getItemAt(_currentItemIndex);
				_renderMaxResolution = false;

				_shout('beforeChange', _indexDiff);

				if (diffAbs >= NUM_HOLDERS) {
					_containerShiftIndex += _indexDiff + (_indexDiff > 0 ? -NUM_HOLDERS : NUM_HOLDERS);
					diffAbs = NUM_HOLDERS;
				}
				for (var i = 0; i < diffAbs; i++) {
					if (_indexDiff > 0) {
						tempHolder = _itemHolders.shift();
						_itemHolders[NUM_HOLDERS - 1] = tempHolder; // move first to last

						_containerShiftIndex++;
						_setTranslateX((_containerShiftIndex + 2) * _slideSize.x, tempHolder.el.style);
						self.setContent(tempHolder, _currentItemIndex - diffAbs + i + 1 + 1);
					} else {
						tempHolder = _itemHolders.pop();
						_itemHolders.unshift(tempHolder); // move last to first

						_containerShiftIndex--;
						_setTranslateX(_containerShiftIndex * _slideSize.x, tempHolder.el.style);
						self.setContent(tempHolder, _currentItemIndex + diffAbs - i - 1 - 1);
					}
				}

				// reset zoom/pan on previous item
				if (_currZoomElementStyle && Math.abs(_indexDiff) === 1) {

					var prevItem = _getItemAt(_prevItemIndex);
					if (prevItem.initialZoomLevel !== _currZoomLevel) {
						_calculateItemSize(prevItem, _viewportSize);
						_setImageSize(prevItem);
						_applyZoomPanToItem(prevItem);
					}
				}

				// reset diff after update
				_indexDiff = 0;

				self.updateCurrZoomItem();

				_prevItemIndex = _currentItemIndex;

				_shout('afterChange');
			},

			updateSize: function (force) {

				if (!_isFixedPosition && _options.modal) {
					var windowScrollY = framework.getScrollY();
					if (_currentWindowScrollY !== windowScrollY) {
						template.style.top = windowScrollY + 'px';
						_currentWindowScrollY = windowScrollY;
					}
					if (!force && _windowVisibleSize.x === window.innerWidth && _windowVisibleSize.y === window.innerHeight) {
						return;
					}
					_windowVisibleSize.x = window.innerWidth;
					_windowVisibleSize.y = window.innerHeight;

					//template.style.width = _windowVisibleSize.x + 'px';
					template.style.height = _windowVisibleSize.y + 'px';
				}

				_viewportSize.x = self.scrollWrap.clientWidth;
				_viewportSize.y = self.scrollWrap.clientHeight;

				_updatePageScrollOffset();

				_slideSize.x = _viewportSize.x + Math.round(_viewportSize.x * _options.spacing);
				_slideSize.y = _viewportSize.y;

				_moveMainScroll(_slideSize.x * _currPositionIndex);

				_shout('beforeResize'); // even may be used for example to switch image sources


				// don't re-calculate size on inital size update
				if (_containerShiftIndex !== undefined) {

					var holder, item, hIndex;

					for (var i = 0; i < NUM_HOLDERS; i++) {
						holder = _itemHolders[i];
						_setTranslateX((i + _containerShiftIndex) * _slideSize.x, holder.el.style);

						hIndex = _currentItemIndex + i - 1;

						if (_options.loop && _getNumItems() > 2) {
							hIndex = _getLoopedId(hIndex);
						}

						// update zoom level on items and refresh source (if needsUpdate)
						item = _getItemAt(hIndex);

						// re-render gallery item if `needsUpdate`,
						// or doesn't have `bounds` (entirely new slide object)
						if (item && (_itemsNeedUpdate || item.needsUpdate || !item.bounds)) {

							self.cleanSlide(item);

							self.setContent(holder, hIndex);

							// if "center" slide
							if (i === 1) {
								self.currItem = item;
								self.updateCurrZoomItem(true);
							}

							item.needsUpdate = false;
						} else if (holder.index === -1 && hIndex >= 0) {
							// add content first time
							self.setContent(holder, hIndex);
						}
						if (item && item.container) {
							_calculateItemSize(item, _viewportSize);
							_setImageSize(item);
							_applyZoomPanToItem(item);
						}
					}
					_itemsNeedUpdate = false;
				}

				_startZoomLevel = _currZoomLevel = self.currItem.initialZoomLevel;
				_currPanBounds = self.currItem.bounds;

				if (_currPanBounds) {
					_panOffset.x = _currPanBounds.center.x;
					_panOffset.y = _currPanBounds.center.y;
					_applyCurrentZoomPan(true);
				}

				_shout('resize');
			},

			// Zoom current item to
			zoomTo: function (destZoomLevel, centerPoint, speed, easingFn, updateFn) {
				/*
    	if(destZoomLevel === 'fit') {
    		destZoomLevel = self.currItem.fitRatio;
    	} else if(destZoomLevel === 'fill') {
    		destZoomLevel = self.currItem.fillRatio;
    	}
    */

				if (centerPoint) {
					_startZoomLevel = _currZoomLevel;
					_midZoomPoint.x = Math.abs(centerPoint.x) - _panOffset.x;
					_midZoomPoint.y = Math.abs(centerPoint.y) - _panOffset.y;
					_equalizePoints(_startPanOffset, _panOffset);
				}

				var destPanBounds = _calculatePanBounds(destZoomLevel, false),
				    destPanOffset = {};

				_modifyDestPanOffset('x', destPanBounds, destPanOffset, destZoomLevel);
				_modifyDestPanOffset('y', destPanBounds, destPanOffset, destZoomLevel);

				var initialZoomLevel = _currZoomLevel;
				var initialPanOffset = {
					x: _panOffset.x,
					y: _panOffset.y
				};

				_roundPoint(destPanOffset);

				var onUpdate = function (now) {
					if (now === 1) {
						_currZoomLevel = destZoomLevel;
						_panOffset.x = destPanOffset.x;
						_panOffset.y = destPanOffset.y;
					} else {
						_currZoomLevel = (destZoomLevel - initialZoomLevel) * now + initialZoomLevel;
						_panOffset.x = (destPanOffset.x - initialPanOffset.x) * now + initialPanOffset.x;
						_panOffset.y = (destPanOffset.y - initialPanOffset.y) * now + initialPanOffset.y;
					}

					if (updateFn) {
						updateFn(now);
					}

					_applyCurrentZoomPan(now === 1);
				};

				if (speed) {
					_animateProp('customZoomTo', 0, 1, speed, easingFn || framework.easing.sine.inOut, onUpdate);
				} else {
					onUpdate(1);
				}
			}

		};

		/*>>core*/

		/*>>gestures*/
		/**
   * Mouse/touch/pointer event handlers.
   * 
   * separated from @core.js for readability
   */

		var MIN_SWIPE_DISTANCE = 30,
		    DIRECTION_CHECK_OFFSET = 10; // amount of pixels to drag to determine direction of swipe

		var _gestureStartTime,
		    _gestureCheckSpeedTime,


		// pool of objects that are used during dragging of zooming
		p = {},
		    // first point
		p2 = {},
		    // second point (for zoom gesture)
		delta = {},
		    _currPoint = {},
		    _startPoint = {},
		    _currPointers = [],
		    _startMainScrollPos = {},
		    _releaseAnimData,
		    _posPoints = [],
		    // array of points during dragging, used to determine type of gesture
		_tempPoint = {},
		    _isZoomingIn,
		    _verticalDragInitiated,
		    _oldAndroidTouchEndTimeout,
		    _currZoomedItemIndex = 0,
		    _centerPoint = _getEmptyPoint(),
		    _lastReleaseTime = 0,
		    _isDragging,
		    // at least one pointer is down
		_isMultitouch,
		    // at least two _pointers are down
		_zoomStarted,
		    // zoom level changed during zoom gesture
		_moved,
		    _dragAnimFrame,
		    _mainScrollShifted,
		    _currentPoints,
		    // array of current touch points
		_isZooming,
		    _currPointsDistance,
		    _startPointsDistance,
		    _currPanBounds,
		    _mainScrollPos = _getEmptyPoint(),
		    _currZoomElementStyle,
		    _mainScrollAnimating,
		    // true, if animation after swipe gesture is running
		_midZoomPoint = _getEmptyPoint(),
		    _currCenterPoint = _getEmptyPoint(),
		    _direction,
		    _isFirstMove,
		    _opacityChanged,
		    _bgOpacity,
		    _wasOverInitialZoom,
		    _isEqualPoints = function (p1, p2) {
			return p1.x === p2.x && p1.y === p2.y;
		},
		    _isNearbyPoints = function (touch0, touch1) {
			return Math.abs(touch0.x - touch1.x) < DOUBLE_TAP_RADIUS && Math.abs(touch0.y - touch1.y) < DOUBLE_TAP_RADIUS;
		},
		    _calculatePointsDistance = function (p1, p2) {
			_tempPoint.x = Math.abs(p1.x - p2.x);
			_tempPoint.y = Math.abs(p1.y - p2.y);
			return Math.sqrt(_tempPoint.x * _tempPoint.x + _tempPoint.y * _tempPoint.y);
		},
		    _stopDragUpdateLoop = function () {
			if (_dragAnimFrame) {
				_cancelAF(_dragAnimFrame);
				_dragAnimFrame = null;
			}
		},
		    _dragUpdateLoop = function () {
			if (_isDragging) {
				_dragAnimFrame = _requestAF(_dragUpdateLoop);
				_renderMovement();
			}
		},
		    _canPan = function () {
			return !(_options.scaleMode === 'fit' && _currZoomLevel === self.currItem.initialZoomLevel);
		},


		// find the closest parent DOM element
		_closestElement = function (el, fn) {
			if (!el || el === document) {
				return false;
			}

			// don't search elements above pswp__scroll-wrap
			if (el.getAttribute('class') && el.getAttribute('class').indexOf('pswp__scroll-wrap') > -1) {
				return false;
			}

			if (fn(el)) {
				return el;
			}

			return _closestElement(el.parentNode, fn);
		},
		    _preventObj = {},
		    _preventDefaultEventBehaviour = function (e, isDown) {
			_preventObj.prevent = !_closestElement(e.target, _options.isClickableElement);

			_shout('preventDragEvent', e, isDown, _preventObj);
			return _preventObj.prevent;
		},
		    _convertTouchToPoint = function (touch, p) {
			p.x = touch.pageX;
			p.y = touch.pageY;
			p.id = touch.identifier;
			return p;
		},
		    _findCenterOfPoints = function (p1, p2, pCenter) {
			pCenter.x = (p1.x + p2.x) * 0.5;
			pCenter.y = (p1.y + p2.y) * 0.5;
		},
		    _pushPosPoint = function (time, x, y) {
			if (time - _gestureCheckSpeedTime > 50) {
				var o = _posPoints.length > 2 ? _posPoints.shift() : {};
				o.x = x;
				o.y = y;
				_posPoints.push(o);
				_gestureCheckSpeedTime = time;
			}
		},
		    _calculateVerticalDragOpacityRatio = function () {
			var yOffset = _panOffset.y - self.currItem.initialPosition.y; // difference between initial and current position
			return 1 - Math.abs(yOffset / (_viewportSize.y / 2));
		},


		// points pool, reused during touch events
		_ePoint1 = {},
		    _ePoint2 = {},
		    _tempPointsArr = [],
		    _tempCounter,
		    _getTouchPoints = function (e) {
			// clean up previous points, without recreating array
			while (_tempPointsArr.length > 0) {
				_tempPointsArr.pop();
			}

			if (!_pointerEventEnabled) {
				if (e.type.indexOf('touch') > -1) {

					if (e.touches && e.touches.length > 0) {
						_tempPointsArr[0] = _convertTouchToPoint(e.touches[0], _ePoint1);
						if (e.touches.length > 1) {
							_tempPointsArr[1] = _convertTouchToPoint(e.touches[1], _ePoint2);
						}
					}
				} else {
					_ePoint1.x = e.pageX;
					_ePoint1.y = e.pageY;
					_ePoint1.id = '';
					_tempPointsArr[0] = _ePoint1; //_ePoint1;
				}
			} else {
				_tempCounter = 0;
				// we can use forEach, as pointer events are supported only in modern browsers
				_currPointers.forEach(function (p) {
					if (_tempCounter === 0) {
						_tempPointsArr[0] = p;
					} else if (_tempCounter === 1) {
						_tempPointsArr[1] = p;
					}
					_tempCounter++;
				});
			}
			return _tempPointsArr;
		},
		    _panOrMoveMainScroll = function (axis, delta) {

			var panFriction,
			    overDiff = 0,
			    newOffset = _panOffset[axis] + delta[axis],
			    startOverDiff,
			    dir = delta[axis] > 0,
			    newMainScrollPosition = _mainScrollPos.x + delta.x,
			    mainScrollDiff = _mainScrollPos.x - _startMainScrollPos.x,
			    newPanPos,
			    newMainScrollPos;

			// calculate fdistance over the bounds and friction
			if (newOffset > _currPanBounds.min[axis] || newOffset < _currPanBounds.max[axis]) {
				panFriction = _options.panEndFriction;
				// Linear increasing of friction, so at 1/4 of viewport it's at max value. 
				// Looks not as nice as was expected. Left for history.
				// panFriction = (1 - (_panOffset[axis] + delta[axis] + panBounds.min[axis]) / (_viewportSize[axis] / 4) );
			} else {
				panFriction = 1;
			}

			newOffset = _panOffset[axis] + delta[axis] * panFriction;

			// move main scroll or start panning
			if (_options.allowPanToNext || _currZoomLevel === self.currItem.initialZoomLevel) {

				if (!_currZoomElementStyle) {

					newMainScrollPos = newMainScrollPosition;
				} else if (_direction === 'h' && axis === 'x' && !_zoomStarted) {

					if (dir) {
						if (newOffset > _currPanBounds.min[axis]) {
							panFriction = _options.panEndFriction;
							overDiff = _currPanBounds.min[axis] - newOffset;
							startOverDiff = _currPanBounds.min[axis] - _startPanOffset[axis];
						}

						// drag right
						if ((startOverDiff <= 0 || mainScrollDiff < 0) && _getNumItems() > 1) {
							newMainScrollPos = newMainScrollPosition;
							if (mainScrollDiff < 0 && newMainScrollPosition > _startMainScrollPos.x) {
								newMainScrollPos = _startMainScrollPos.x;
							}
						} else {
							if (_currPanBounds.min.x !== _currPanBounds.max.x) {
								newPanPos = newOffset;
							}
						}
					} else {

						if (newOffset < _currPanBounds.max[axis]) {
							panFriction = _options.panEndFriction;
							overDiff = newOffset - _currPanBounds.max[axis];
							startOverDiff = _startPanOffset[axis] - _currPanBounds.max[axis];
						}

						if ((startOverDiff <= 0 || mainScrollDiff > 0) && _getNumItems() > 1) {
							newMainScrollPos = newMainScrollPosition;

							if (mainScrollDiff > 0 && newMainScrollPosition < _startMainScrollPos.x) {
								newMainScrollPos = _startMainScrollPos.x;
							}
						} else {
							if (_currPanBounds.min.x !== _currPanBounds.max.x) {
								newPanPos = newOffset;
							}
						}
					}

					//
				}

				if (axis === 'x') {

					if (newMainScrollPos !== undefined) {
						_moveMainScroll(newMainScrollPos, true);
						if (newMainScrollPos === _startMainScrollPos.x) {
							_mainScrollShifted = false;
						} else {
							_mainScrollShifted = true;
						}
					}

					if (_currPanBounds.min.x !== _currPanBounds.max.x) {
						if (newPanPos !== undefined) {
							_panOffset.x = newPanPos;
						} else if (!_mainScrollShifted) {
							_panOffset.x += delta.x * panFriction;
						}
					}

					return newMainScrollPos !== undefined;
				}
			}

			if (!_mainScrollAnimating) {

				if (!_mainScrollShifted) {
					if (_currZoomLevel > self.currItem.fitRatio) {
						_panOffset[axis] += delta[axis] * panFriction;
					}
				}
			}
		},


		// Pointerdown/touchstart/mousedown handler
		_onDragStart = function (e) {

			// Allow dragging only via left mouse button.
			// As this handler is not added in IE8 - we ignore e.which
			// 
			// http://www.quirksmode.org/js/events_properties.html
			// https://developer.mozilla.org/en-US/docs/Web/API/event.button
			if (e.type === 'mousedown' && e.button > 0) {
				return;
			}

			if (_initialZoomRunning) {
				e.preventDefault();
				return;
			}

			if (_oldAndroidTouchEndTimeout && e.type === 'mousedown') {
				return;
			}

			if (_preventDefaultEventBehaviour(e, true)) {
				e.preventDefault();
			}

			_shout('pointerDown');

			if (_pointerEventEnabled) {
				var pointerIndex = framework.arraySearch(_currPointers, e.pointerId, 'id');
				if (pointerIndex < 0) {
					pointerIndex = _currPointers.length;
				}
				_currPointers[pointerIndex] = { x: e.pageX, y: e.pageY, id: e.pointerId };
			}

			var startPointsList = _getTouchPoints(e),
			    numPoints = startPointsList.length;

			_currentPoints = null;

			_stopAllAnimations();

			// init drag
			if (!_isDragging || numPoints === 1) {

				_isDragging = _isFirstMove = true;
				framework.bind(window, _upMoveEvents, self);

				_isZoomingIn = _wasOverInitialZoom = _opacityChanged = _verticalDragInitiated = _mainScrollShifted = _moved = _isMultitouch = _zoomStarted = false;

				_direction = null;

				_shout('firstTouchStart', startPointsList);

				_equalizePoints(_startPanOffset, _panOffset);

				_currPanDist.x = _currPanDist.y = 0;
				_equalizePoints(_currPoint, startPointsList[0]);
				_equalizePoints(_startPoint, _currPoint);

				//_equalizePoints(_startMainScrollPos, _mainScrollPos);
				_startMainScrollPos.x = _slideSize.x * _currPositionIndex;

				_posPoints = [{
					x: _currPoint.x,
					y: _currPoint.y
				}];

				_gestureCheckSpeedTime = _gestureStartTime = _getCurrentTime();

				//_mainScrollAnimationEnd(true);
				_calculatePanBounds(_currZoomLevel, true);

				// Start rendering
				_stopDragUpdateLoop();
				_dragUpdateLoop();
			}

			// init zoom
			if (!_isZooming && numPoints > 1 && !_mainScrollAnimating && !_mainScrollShifted) {
				_startZoomLevel = _currZoomLevel;
				_zoomStarted = false; // true if zoom changed at least once

				_isZooming = _isMultitouch = true;
				_currPanDist.y = _currPanDist.x = 0;

				_equalizePoints(_startPanOffset, _panOffset);

				_equalizePoints(p, startPointsList[0]);
				_equalizePoints(p2, startPointsList[1]);

				_findCenterOfPoints(p, p2, _currCenterPoint);

				_midZoomPoint.x = Math.abs(_currCenterPoint.x) - _panOffset.x;
				_midZoomPoint.y = Math.abs(_currCenterPoint.y) - _panOffset.y;
				_currPointsDistance = _startPointsDistance = _calculatePointsDistance(p, p2);
			}
		},


		// Pointermove/touchmove/mousemove handler
		_onDragMove = function (e) {

			e.preventDefault();

			if (_pointerEventEnabled) {
				var pointerIndex = framework.arraySearch(_currPointers, e.pointerId, 'id');
				if (pointerIndex > -1) {
					var p = _currPointers[pointerIndex];
					p.x = e.pageX;
					p.y = e.pageY;
				}
			}

			if (_isDragging) {
				var touchesList = _getTouchPoints(e);
				if (!_direction && !_moved && !_isZooming) {

					if (_mainScrollPos.x !== _slideSize.x * _currPositionIndex) {
						// if main scroll position is shifted – direction is always horizontal
						_direction = 'h';
					} else {
						var diff = Math.abs(touchesList[0].x - _currPoint.x) - Math.abs(touchesList[0].y - _currPoint.y);
						// check the direction of movement
						if (Math.abs(diff) >= DIRECTION_CHECK_OFFSET) {
							_direction = diff > 0 ? 'h' : 'v';
							_currentPoints = touchesList;
						}
					}
				} else {
					_currentPoints = touchesList;
				}
			}
		},

		// 
		_renderMovement = function () {

			if (!_currentPoints) {
				return;
			}

			var numPoints = _currentPoints.length;

			if (numPoints === 0) {
				return;
			}

			_equalizePoints(p, _currentPoints[0]);

			delta.x = p.x - _currPoint.x;
			delta.y = p.y - _currPoint.y;

			if (_isZooming && numPoints > 1) {
				// Handle behaviour for more than 1 point

				_currPoint.x = p.x;
				_currPoint.y = p.y;

				// check if one of two points changed
				if (!delta.x && !delta.y && _isEqualPoints(_currentPoints[1], p2)) {
					return;
				}

				_equalizePoints(p2, _currentPoints[1]);

				if (!_zoomStarted) {
					_zoomStarted = true;
					_shout('zoomGestureStarted');
				}

				// Distance between two points
				var pointsDistance = _calculatePointsDistance(p, p2);

				var zoomLevel = _calculateZoomLevel(pointsDistance);

				// slightly over the of initial zoom level
				if (zoomLevel > self.currItem.initialZoomLevel + self.currItem.initialZoomLevel / 15) {
					_wasOverInitialZoom = true;
				}

				// Apply the friction if zoom level is out of the bounds
				var zoomFriction = 1,
				    minZoomLevel = _getMinZoomLevel(),
				    maxZoomLevel = _getMaxZoomLevel();

				if (zoomLevel < minZoomLevel) {

					if (_options.pinchToClose && !_wasOverInitialZoom && _startZoomLevel <= self.currItem.initialZoomLevel) {
						// fade out background if zooming out
						var minusDiff = minZoomLevel - zoomLevel;
						var percent = 1 - minusDiff / (minZoomLevel / 1.2);

						_applyBgOpacity(percent);
						_shout('onPinchClose', percent);
						_opacityChanged = true;
					} else {
						zoomFriction = (minZoomLevel - zoomLevel) / minZoomLevel;
						if (zoomFriction > 1) {
							zoomFriction = 1;
						}
						zoomLevel = minZoomLevel - zoomFriction * (minZoomLevel / 3);
					}
				} else if (zoomLevel > maxZoomLevel) {
					// 1.5 - extra zoom level above the max. E.g. if max is x6, real max 6 + 1.5 = 7.5
					zoomFriction = (zoomLevel - maxZoomLevel) / (minZoomLevel * 6);
					if (zoomFriction > 1) {
						zoomFriction = 1;
					}
					zoomLevel = maxZoomLevel + zoomFriction * minZoomLevel;
				}

				if (zoomFriction < 0) {
					zoomFriction = 0;
				}

				// distance between touch points after friction is applied
				_currPointsDistance = pointsDistance;

				// _centerPoint - The point in the middle of two pointers
				_findCenterOfPoints(p, p2, _centerPoint);

				// paning with two pointers pressed
				_currPanDist.x += _centerPoint.x - _currCenterPoint.x;
				_currPanDist.y += _centerPoint.y - _currCenterPoint.y;
				_equalizePoints(_currCenterPoint, _centerPoint);

				_panOffset.x = _calculatePanOffset('x', zoomLevel);
				_panOffset.y = _calculatePanOffset('y', zoomLevel);

				_isZoomingIn = zoomLevel > _currZoomLevel;
				_currZoomLevel = zoomLevel;
				_applyCurrentZoomPan();
			} else {

				// handle behaviour for one point (dragging or panning)

				if (!_direction) {
					return;
				}

				if (_isFirstMove) {
					_isFirstMove = false;

					// subtract drag distance that was used during the detection direction  

					if (Math.abs(delta.x) >= DIRECTION_CHECK_OFFSET) {
						delta.x -= _currentPoints[0].x - _startPoint.x;
					}

					if (Math.abs(delta.y) >= DIRECTION_CHECK_OFFSET) {
						delta.y -= _currentPoints[0].y - _startPoint.y;
					}
				}

				_currPoint.x = p.x;
				_currPoint.y = p.y;

				// do nothing if pointers position hasn't changed
				if (delta.x === 0 && delta.y === 0) {
					return;
				}

				if (_direction === 'v' && _options.closeOnVerticalDrag) {
					if (!_canPan()) {
						_currPanDist.y += delta.y;
						_panOffset.y += delta.y;

						var opacityRatio = _calculateVerticalDragOpacityRatio();

						_verticalDragInitiated = true;
						_shout('onVerticalDrag', opacityRatio);

						_applyBgOpacity(opacityRatio);
						_applyCurrentZoomPan();
						return;
					}
				}

				_pushPosPoint(_getCurrentTime(), p.x, p.y);

				_moved = true;
				_currPanBounds = self.currItem.bounds;

				var mainScrollChanged = _panOrMoveMainScroll('x', delta);
				if (!mainScrollChanged) {
					_panOrMoveMainScroll('y', delta);

					_roundPoint(_panOffset);
					_applyCurrentZoomPan();
				}
			}
		},


		// Pointerup/pointercancel/touchend/touchcancel/mouseup event handler
		_onDragRelease = function (e) {

			if (_features.isOldAndroid) {

				if (_oldAndroidTouchEndTimeout && e.type === 'mouseup') {
					return;
				}

				// on Android (v4.1, 4.2, 4.3 & possibly older) 
				// ghost mousedown/up event isn't preventable via e.preventDefault,
				// which causes fake mousedown event
				// so we block mousedown/up for 600ms
				if (e.type.indexOf('touch') > -1) {
					clearTimeout(_oldAndroidTouchEndTimeout);
					_oldAndroidTouchEndTimeout = setTimeout(function () {
						_oldAndroidTouchEndTimeout = 0;
					}, 600);
				}
			}

			_shout('pointerUp');

			if (_preventDefaultEventBehaviour(e, false)) {
				e.preventDefault();
			}

			var releasePoint;

			if (_pointerEventEnabled) {
				var pointerIndex = framework.arraySearch(_currPointers, e.pointerId, 'id');

				if (pointerIndex > -1) {
					releasePoint = _currPointers.splice(pointerIndex, 1)[0];

					if (navigator.pointerEnabled) {
						releasePoint.type = e.pointerType || 'mouse';
					} else {
						var MSPOINTER_TYPES = {
							4: 'mouse', // event.MSPOINTER_TYPE_MOUSE
							2: 'touch', // event.MSPOINTER_TYPE_TOUCH 
							3: 'pen' // event.MSPOINTER_TYPE_PEN
						};
						releasePoint.type = MSPOINTER_TYPES[e.pointerType];

						if (!releasePoint.type) {
							releasePoint.type = e.pointerType || 'mouse';
						}
					}
				}
			}

			var touchList = _getTouchPoints(e),
			    gestureType,
			    numPoints = touchList.length;

			if (e.type === 'mouseup') {
				numPoints = 0;
			}

			// Do nothing if there were 3 touch points or more
			if (numPoints === 2) {
				_currentPoints = null;
				return true;
			}

			// if second pointer released
			if (numPoints === 1) {
				_equalizePoints(_startPoint, touchList[0]);
			}

			// pointer hasn't moved, send "tap release" point
			if (numPoints === 0 && !_direction && !_mainScrollAnimating) {
				if (!releasePoint) {
					if (e.type === 'mouseup') {
						releasePoint = { x: e.pageX, y: e.pageY, type: 'mouse' };
					} else if (e.changedTouches && e.changedTouches[0]) {
						releasePoint = { x: e.changedTouches[0].pageX, y: e.changedTouches[0].pageY, type: 'touch' };
					}
				}

				_shout('touchRelease', e, releasePoint);
			}

			// Difference in time between releasing of two last touch points (zoom gesture)
			var releaseTimeDiff = -1;

			// Gesture completed, no pointers left
			if (numPoints === 0) {
				_isDragging = false;
				framework.unbind(window, _upMoveEvents, self);

				_stopDragUpdateLoop();

				if (_isZooming) {
					// Two points released at the same time
					releaseTimeDiff = 0;
				} else if (_lastReleaseTime !== -1) {
					releaseTimeDiff = _getCurrentTime() - _lastReleaseTime;
				}
			}
			_lastReleaseTime = numPoints === 1 ? _getCurrentTime() : -1;

			if (releaseTimeDiff !== -1 && releaseTimeDiff < 150) {
				gestureType = 'zoom';
			} else {
				gestureType = 'swipe';
			}

			if (_isZooming && numPoints < 2) {
				_isZooming = false;

				// Only second point released
				if (numPoints === 1) {
					gestureType = 'zoomPointerUp';
				}
				_shout('zoomGestureEnded');
			}

			_currentPoints = null;
			if (!_moved && !_zoomStarted && !_mainScrollAnimating && !_verticalDragInitiated) {
				// nothing to animate
				return;
			}

			_stopAllAnimations();

			if (!_releaseAnimData) {
				_releaseAnimData = _initDragReleaseAnimationData();
			}

			_releaseAnimData.calculateSwipeSpeed('x');

			if (_verticalDragInitiated) {

				var opacityRatio = _calculateVerticalDragOpacityRatio();

				if (opacityRatio < _options.verticalDragRange) {
					self.close();
				} else {
					var initalPanY = _panOffset.y,
					    initialBgOpacity = _bgOpacity;

					_animateProp('verticalDrag', 0, 1, 300, framework.easing.cubic.out, function (now) {

						_panOffset.y = (self.currItem.initialPosition.y - initalPanY) * now + initalPanY;

						_applyBgOpacity((1 - initialBgOpacity) * now + initialBgOpacity);
						_applyCurrentZoomPan();
					});

					_shout('onVerticalDrag', 1);
				}

				return;
			}

			// main scroll 
			if ((_mainScrollShifted || _mainScrollAnimating) && numPoints === 0) {
				var itemChanged = _finishSwipeMainScrollGesture(gestureType, _releaseAnimData);
				if (itemChanged) {
					return;
				}
				gestureType = 'zoomPointerUp';
			}

			// prevent zoom/pan animation when main scroll animation runs
			if (_mainScrollAnimating) {
				return;
			}

			// Complete simple zoom gesture (reset zoom level if it's out of the bounds)  
			if (gestureType !== 'swipe') {
				_completeZoomGesture();
				return;
			}

			// Complete pan gesture if main scroll is not shifted, and it's possible to pan current image
			if (!_mainScrollShifted && _currZoomLevel > self.currItem.fitRatio) {
				_completePanGesture(_releaseAnimData);
			}
		},


		// Returns object with data about gesture
		// It's created only once and then reused
		_initDragReleaseAnimationData = function () {
			// temp local vars
			var lastFlickDuration, tempReleasePos;

			// s = this
			var s = {
				lastFlickOffset: {},
				lastFlickDist: {},
				lastFlickSpeed: {},
				slowDownRatio: {},
				slowDownRatioReverse: {},
				speedDecelerationRatio: {},
				speedDecelerationRatioAbs: {},
				distanceOffset: {},
				backAnimDestination: {},
				backAnimStarted: {},
				calculateSwipeSpeed: function (axis) {

					if (_posPoints.length > 1) {
						lastFlickDuration = _getCurrentTime() - _gestureCheckSpeedTime + 50;
						tempReleasePos = _posPoints[_posPoints.length - 2][axis];
					} else {
						lastFlickDuration = _getCurrentTime() - _gestureStartTime; // total gesture duration
						tempReleasePos = _startPoint[axis];
					}
					s.lastFlickOffset[axis] = _currPoint[axis] - tempReleasePos;
					s.lastFlickDist[axis] = Math.abs(s.lastFlickOffset[axis]);
					if (s.lastFlickDist[axis] > 20) {
						s.lastFlickSpeed[axis] = s.lastFlickOffset[axis] / lastFlickDuration;
					} else {
						s.lastFlickSpeed[axis] = 0;
					}
					if (Math.abs(s.lastFlickSpeed[axis]) < 0.1) {
						s.lastFlickSpeed[axis] = 0;
					}

					s.slowDownRatio[axis] = 0.95;
					s.slowDownRatioReverse[axis] = 1 - s.slowDownRatio[axis];
					s.speedDecelerationRatio[axis] = 1;
				},

				calculateOverBoundsAnimOffset: function (axis, speed) {
					if (!s.backAnimStarted[axis]) {

						if (_panOffset[axis] > _currPanBounds.min[axis]) {
							s.backAnimDestination[axis] = _currPanBounds.min[axis];
						} else if (_panOffset[axis] < _currPanBounds.max[axis]) {
							s.backAnimDestination[axis] = _currPanBounds.max[axis];
						}

						if (s.backAnimDestination[axis] !== undefined) {
							s.slowDownRatio[axis] = 0.7;
							s.slowDownRatioReverse[axis] = 1 - s.slowDownRatio[axis];
							if (s.speedDecelerationRatioAbs[axis] < 0.05) {

								s.lastFlickSpeed[axis] = 0;
								s.backAnimStarted[axis] = true;

								_animateProp('bounceZoomPan' + axis, _panOffset[axis], s.backAnimDestination[axis], speed || 300, framework.easing.sine.out, function (pos) {
									_panOffset[axis] = pos;
									_applyCurrentZoomPan();
								});
							}
						}
					}
				},

				// Reduces the speed by slowDownRatio (per 10ms)
				calculateAnimOffset: function (axis) {
					if (!s.backAnimStarted[axis]) {
						s.speedDecelerationRatio[axis] = s.speedDecelerationRatio[axis] * (s.slowDownRatio[axis] + s.slowDownRatioReverse[axis] - s.slowDownRatioReverse[axis] * s.timeDiff / 10);

						s.speedDecelerationRatioAbs[axis] = Math.abs(s.lastFlickSpeed[axis] * s.speedDecelerationRatio[axis]);
						s.distanceOffset[axis] = s.lastFlickSpeed[axis] * s.speedDecelerationRatio[axis] * s.timeDiff;
						_panOffset[axis] += s.distanceOffset[axis];
					}
				},

				panAnimLoop: function () {
					if (_animations.zoomPan) {
						_animations.zoomPan.raf = _requestAF(s.panAnimLoop);

						s.now = _getCurrentTime();
						s.timeDiff = s.now - s.lastNow;
						s.lastNow = s.now;

						s.calculateAnimOffset('x');
						s.calculateAnimOffset('y');

						_applyCurrentZoomPan();

						s.calculateOverBoundsAnimOffset('x');
						s.calculateOverBoundsAnimOffset('y');

						if (s.speedDecelerationRatioAbs.x < 0.05 && s.speedDecelerationRatioAbs.y < 0.05) {

							// round pan position
							_panOffset.x = Math.round(_panOffset.x);
							_panOffset.y = Math.round(_panOffset.y);
							_applyCurrentZoomPan();

							_stopAnimation('zoomPan');
							return;
						}
					}
				}
			};
			return s;
		},
		    _completePanGesture = function (animData) {
			// calculate swipe speed for Y axis (paanning)
			animData.calculateSwipeSpeed('y');

			_currPanBounds = self.currItem.bounds;

			animData.backAnimDestination = {};
			animData.backAnimStarted = {};

			// Avoid acceleration animation if speed is too low
			if (Math.abs(animData.lastFlickSpeed.x) <= 0.05 && Math.abs(animData.lastFlickSpeed.y) <= 0.05) {
				animData.speedDecelerationRatioAbs.x = animData.speedDecelerationRatioAbs.y = 0;

				// Run pan drag release animation. E.g. if you drag image and release finger without momentum.
				animData.calculateOverBoundsAnimOffset('x');
				animData.calculateOverBoundsAnimOffset('y');
				return true;
			}

			// Animation loop that controls the acceleration after pan gesture ends
			_registerStartAnimation('zoomPan');
			animData.lastNow = _getCurrentTime();
			animData.panAnimLoop();
		},
		    _finishSwipeMainScrollGesture = function (gestureType, _releaseAnimData) {
			var itemChanged;
			if (!_mainScrollAnimating) {
				_currZoomedItemIndex = _currentItemIndex;
			}

			var itemsDiff;

			if (gestureType === 'swipe') {
				var totalShiftDist = _currPoint.x - _startPoint.x,
				    isFastLastFlick = _releaseAnimData.lastFlickDist.x < 10;

				// if container is shifted for more than MIN_SWIPE_DISTANCE, 
				// and last flick gesture was in right direction
				if (totalShiftDist > MIN_SWIPE_DISTANCE && (isFastLastFlick || _releaseAnimData.lastFlickOffset.x > 20)) {
					// go to prev item
					itemsDiff = -1;
				} else if (totalShiftDist < -MIN_SWIPE_DISTANCE && (isFastLastFlick || _releaseAnimData.lastFlickOffset.x < -20)) {
					// go to next item
					itemsDiff = 1;
				}
			}

			var nextCircle;

			if (itemsDiff) {

				_currentItemIndex += itemsDiff;

				if (_currentItemIndex < 0) {
					_currentItemIndex = _options.loop ? _getNumItems() - 1 : 0;
					nextCircle = true;
				} else if (_currentItemIndex >= _getNumItems()) {
					_currentItemIndex = _options.loop ? 0 : _getNumItems() - 1;
					nextCircle = true;
				}

				if (!nextCircle || _options.loop) {
					_indexDiff += itemsDiff;
					_currPositionIndex -= itemsDiff;
					itemChanged = true;
				}
			}

			var animateToX = _slideSize.x * _currPositionIndex;
			var animateToDist = Math.abs(animateToX - _mainScrollPos.x);
			var finishAnimDuration;

			if (!itemChanged && animateToX > _mainScrollPos.x !== _releaseAnimData.lastFlickSpeed.x > 0) {
				// "return to current" duration, e.g. when dragging from slide 0 to -1
				finishAnimDuration = 333;
			} else {
				finishAnimDuration = Math.abs(_releaseAnimData.lastFlickSpeed.x) > 0 ? animateToDist / Math.abs(_releaseAnimData.lastFlickSpeed.x) : 333;

				finishAnimDuration = Math.min(finishAnimDuration, 400);
				finishAnimDuration = Math.max(finishAnimDuration, 250);
			}

			if (_currZoomedItemIndex === _currentItemIndex) {
				itemChanged = false;
			}

			_mainScrollAnimating = true;

			_shout('mainScrollAnimStart');

			_animateProp('mainScroll', _mainScrollPos.x, animateToX, finishAnimDuration, framework.easing.cubic.out, _moveMainScroll, function () {
				_stopAllAnimations();
				_mainScrollAnimating = false;
				_currZoomedItemIndex = -1;

				if (itemChanged || _currZoomedItemIndex !== _currentItemIndex) {
					self.updateCurrItem();
				}

				_shout('mainScrollAnimComplete');
			});

			if (itemChanged) {
				self.updateCurrItem(true);
			}

			return itemChanged;
		},
		    _calculateZoomLevel = function (touchesDistance) {
			return 1 / _startPointsDistance * touchesDistance * _startZoomLevel;
		},


		// Resets zoom if it's out of bounds
		_completeZoomGesture = function () {
			var destZoomLevel = _currZoomLevel,
			    minZoomLevel = _getMinZoomLevel(),
			    maxZoomLevel = _getMaxZoomLevel();

			if (_currZoomLevel < minZoomLevel) {
				destZoomLevel = minZoomLevel;
			} else if (_currZoomLevel > maxZoomLevel) {
				destZoomLevel = maxZoomLevel;
			}

			var destOpacity = 1,
			    onUpdate,
			    initialOpacity = _bgOpacity;

			if (_opacityChanged && !_isZoomingIn && !_wasOverInitialZoom && _currZoomLevel < minZoomLevel) {
				//_closedByScroll = true;
				self.close();
				return true;
			}

			if (_opacityChanged) {
				onUpdate = function (now) {
					_applyBgOpacity((destOpacity - initialOpacity) * now + initialOpacity);
				};
			}

			self.zoomTo(destZoomLevel, 0, 200, framework.easing.cubic.out, onUpdate);
			return true;
		};

		_registerModule('Gestures', {
			publicMethods: {

				initGestures: function () {

					// helper function that builds touch/pointer/mouse events
					var addEventNames = function (pref, down, move, up, cancel) {
						_dragStartEvent = pref + down;
						_dragMoveEvent = pref + move;
						_dragEndEvent = pref + up;
						if (cancel) {
							_dragCancelEvent = pref + cancel;
						} else {
							_dragCancelEvent = '';
						}
					};

					_pointerEventEnabled = _features.pointerEvent;
					if (_pointerEventEnabled && _features.touch) {
						// we don't need touch events, if browser supports pointer events
						_features.touch = false;
					}

					if (_pointerEventEnabled) {
						if (navigator.pointerEnabled) {
							addEventNames('pointer', 'down', 'move', 'up', 'cancel');
						} else {
							// IE10 pointer events are case-sensitive
							addEventNames('MSPointer', 'Down', 'Move', 'Up', 'Cancel');
						}
					} else if (_features.touch) {
						addEventNames('touch', 'start', 'move', 'end', 'cancel');
						_likelyTouchDevice = true;
					} else {
						addEventNames('mouse', 'down', 'move', 'up');
					}

					_upMoveEvents = _dragMoveEvent + ' ' + _dragEndEvent + ' ' + _dragCancelEvent;
					_downEvents = _dragStartEvent;

					if (_pointerEventEnabled && !_likelyTouchDevice) {
						_likelyTouchDevice = navigator.maxTouchPoints > 1 || navigator.msMaxTouchPoints > 1;
					}
					// make variable public
					self.likelyTouchDevice = _likelyTouchDevice;

					_globalEventHandlers[_dragStartEvent] = _onDragStart;
					_globalEventHandlers[_dragMoveEvent] = _onDragMove;
					_globalEventHandlers[_dragEndEvent] = _onDragRelease; // the Kraken

					if (_dragCancelEvent) {
						_globalEventHandlers[_dragCancelEvent] = _globalEventHandlers[_dragEndEvent];
					}

					// Bind mouse events on device with detected hardware touch support, in case it supports multiple types of input.
					if (_features.touch) {
						_downEvents += ' mousedown';
						_upMoveEvents += ' mousemove mouseup';
						_globalEventHandlers.mousedown = _globalEventHandlers[_dragStartEvent];
						_globalEventHandlers.mousemove = _globalEventHandlers[_dragMoveEvent];
						_globalEventHandlers.mouseup = _globalEventHandlers[_dragEndEvent];
					}

					if (!_likelyTouchDevice) {
						// don't allow pan to next slide from zoomed state on Desktop
						_options.allowPanToNext = false;
					}
				}

			}
		});

		/*>>gestures*/

		/*>>show-hide-transition*/
		/**
   * show-hide-transition.js:
   *
   * Manages initial opening or closing transition.
   *
   * If you're not planning to use transition for gallery at all,
   * you may set options hideAnimationDuration and showAnimationDuration to 0,
   * and just delete startAnimation function.
   * 
   */

		var _showOrHideTimeout,
		    _showOrHide = function (item, img, out, completeFn) {

			if (_showOrHideTimeout) {
				clearTimeout(_showOrHideTimeout);
			}

			_initialZoomRunning = true;
			_initialContentSet = true;

			// dimensions of small thumbnail {x:,y:,w:}.
			// Height is optional, as calculated based on large image.
			var thumbBounds;
			if (item.initialLayout) {
				thumbBounds = item.initialLayout;
				item.initialLayout = null;
			} else {
				thumbBounds = _options.getThumbBoundsFn && _options.getThumbBoundsFn(_currentItemIndex);
			}

			var duration = out ? _options.hideAnimationDuration : _options.showAnimationDuration;

			var onComplete = function () {
				_stopAnimation('initialZoom');
				if (!out) {
					_applyBgOpacity(1);
					if (img) {
						img.style.display = 'block';
					}
					framework.addClass(template, 'pswp--animated-in');
					_shout('initialZoom' + (out ? 'OutEnd' : 'InEnd'));
				} else {
					self.template.removeAttribute('style');
					self.bg.removeAttribute('style');
				}

				if (completeFn) {
					completeFn();
				}
				_initialZoomRunning = false;
			};

			// if bounds aren't provided, just open gallery without animation
			if (!duration || !thumbBounds || thumbBounds.x === undefined) {

				_shout('initialZoom' + (out ? 'Out' : 'In'));

				_currZoomLevel = item.initialZoomLevel;
				_equalizePoints(_panOffset, item.initialPosition);
				_applyCurrentZoomPan();

				template.style.opacity = out ? 0 : 1;
				_applyBgOpacity(1);

				if (duration) {
					setTimeout(function () {
						onComplete();
					}, duration);
				} else {
					onComplete();
				}

				return;
			}

			var startAnimation = function () {
				var closeWithRaf = _closedByScroll,
				    fadeEverything = !self.currItem.src || self.currItem.loadError || _options.showHideOpacity;

				// apply hw-acceleration to image
				if (item.miniImg) {
					item.miniImg.style.webkitBackfaceVisibility = 'hidden';
				}

				if (!out) {
					_currZoomLevel = thumbBounds.w / item.w;
					_panOffset.x = thumbBounds.x;
					_panOffset.y = thumbBounds.y - _initalWindowScrollY;

					self[fadeEverything ? 'template' : 'bg'].style.opacity = 0.001;
					_applyCurrentZoomPan();
				}

				_registerStartAnimation('initialZoom');

				if (out && !closeWithRaf) {
					framework.removeClass(template, 'pswp--animated-in');
				}

				if (fadeEverything) {
					if (out) {
						framework[(closeWithRaf ? 'remove' : 'add') + 'Class'](template, 'pswp--animate_opacity');
					} else {
						setTimeout(function () {
							framework.addClass(template, 'pswp--animate_opacity');
						}, 30);
					}
				}

				_showOrHideTimeout = setTimeout(function () {

					_shout('initialZoom' + (out ? 'Out' : 'In'));

					if (!out) {

						// "in" animation always uses CSS transitions (instead of rAF).
						// CSS transition work faster here, 
						// as developer may also want to animate other things, 
						// like ui on top of sliding area, which can be animated just via CSS

						_currZoomLevel = item.initialZoomLevel;
						_equalizePoints(_panOffset, item.initialPosition);
						_applyCurrentZoomPan();
						_applyBgOpacity(1);

						if (fadeEverything) {
							template.style.opacity = 1;
						} else {
							_applyBgOpacity(1);
						}

						_showOrHideTimeout = setTimeout(onComplete, duration + 20);
					} else {

						// "out" animation uses rAF only when PhotoSwipe is closed by browser scroll, to recalculate position
						var destZoomLevel = thumbBounds.w / item.w,
						    initialPanOffset = {
							x: _panOffset.x,
							y: _panOffset.y
						},
						    initialZoomLevel = _currZoomLevel,
						    initalBgOpacity = _bgOpacity,
						    onUpdate = function (now) {

							if (now === 1) {
								_currZoomLevel = destZoomLevel;
								_panOffset.x = thumbBounds.x;
								_panOffset.y = thumbBounds.y - _currentWindowScrollY;
							} else {
								_currZoomLevel = (destZoomLevel - initialZoomLevel) * now + initialZoomLevel;
								_panOffset.x = (thumbBounds.x - initialPanOffset.x) * now + initialPanOffset.x;
								_panOffset.y = (thumbBounds.y - _currentWindowScrollY - initialPanOffset.y) * now + initialPanOffset.y;
							}

							_applyCurrentZoomPan();
							if (fadeEverything) {
								template.style.opacity = 1 - now;
							} else {
								_applyBgOpacity(initalBgOpacity - now * initalBgOpacity);
							}
						};

						if (closeWithRaf) {
							_animateProp('initialZoom', 0, 1, duration, framework.easing.cubic.out, onUpdate, onComplete);
						} else {
							onUpdate(1);
							_showOrHideTimeout = setTimeout(onComplete, duration + 20);
						}
					}
				}, out ? 25 : 90); // Main purpose of this delay is to give browser time to paint and
				// create composite layers of PhotoSwipe UI parts (background, controls, caption, arrows).
				// Which avoids lag at the beginning of scale transition.
			};
			startAnimation();
		};

		/*>>show-hide-transition*/

		/*>>items-controller*/
		/**
  *
  * Controller manages gallery items, their dimensions, and their content.
  * 
  */

		var _items,
		    _tempPanAreaSize = {},
		    _imagesToAppendPool = [],
		    _initialContentSet,
		    _initialZoomRunning,
		    _controllerDefaultOptions = {
			index: 0,
			errorMsg: '<div class="pswp__error-msg"><a href="%url%" target="_blank">The image</a> could not be loaded.</div>',
			forceProgressiveLoading: false, // TODO
			preload: [1, 1],
			getNumItemsFn: function () {
				return _items.length;
			}
		};

		var _getItemAt,
		    _getNumItems,
		    _initialIsLoop,
		    _getZeroBounds = function () {
			return {
				center: { x: 0, y: 0 },
				max: { x: 0, y: 0 },
				min: { x: 0, y: 0 }
			};
		},
		    _calculateSingleItemPanBounds = function (item, realPanElementW, realPanElementH) {
			var bounds = item.bounds;

			// position of element when it's centered
			bounds.center.x = Math.round((_tempPanAreaSize.x - realPanElementW) / 2);
			bounds.center.y = Math.round((_tempPanAreaSize.y - realPanElementH) / 2) + item.vGap.top;

			// maximum pan position
			bounds.max.x = realPanElementW > _tempPanAreaSize.x ? Math.round(_tempPanAreaSize.x - realPanElementW) : bounds.center.x;

			bounds.max.y = realPanElementH > _tempPanAreaSize.y ? Math.round(_tempPanAreaSize.y - realPanElementH) + item.vGap.top : bounds.center.y;

			// minimum pan position
			bounds.min.x = realPanElementW > _tempPanAreaSize.x ? 0 : bounds.center.x;
			bounds.min.y = realPanElementH > _tempPanAreaSize.y ? item.vGap.top : bounds.center.y;
		},
		    _calculateItemSize = function (item, viewportSize, zoomLevel) {

			if (item.src && !item.loadError) {
				var isInitial = !zoomLevel;

				if (isInitial) {
					if (!item.vGap) {
						item.vGap = { top: 0, bottom: 0 };
					}
					// allows overriding vertical margin for individual items
					_shout('parseVerticalMargin', item);
				}

				_tempPanAreaSize.x = viewportSize.x;
				_tempPanAreaSize.y = viewportSize.y - item.vGap.top - item.vGap.bottom;

				if (isInitial) {
					var hRatio = _tempPanAreaSize.x / item.w;
					var vRatio = _tempPanAreaSize.y / item.h;

					item.fitRatio = hRatio < vRatio ? hRatio : vRatio;
					//item.fillRatio = hRatio > vRatio ? hRatio : vRatio;

					var scaleMode = _options.scaleMode;

					if (scaleMode === 'orig') {
						zoomLevel = 1;
					} else if (scaleMode === 'fit') {
						zoomLevel = item.fitRatio;
					}

					if (zoomLevel > 1) {
						zoomLevel = 1;
					}

					item.initialZoomLevel = zoomLevel;

					if (!item.bounds) {
						// reuse bounds object
						item.bounds = _getZeroBounds();
					}
				}

				if (!zoomLevel) {
					return;
				}

				_calculateSingleItemPanBounds(item, item.w * zoomLevel, item.h * zoomLevel);

				if (isInitial && zoomLevel === item.initialZoomLevel) {
					item.initialPosition = item.bounds.center;
				}

				return item.bounds;
			} else {
				item.w = item.h = 0;
				item.initialZoomLevel = item.fitRatio = 1;
				item.bounds = _getZeroBounds();
				item.initialPosition = item.bounds.center;

				// if it's not image, we return zero bounds (content is not zoomable)
				return item.bounds;
			}
		},
		    _appendImage = function (index, item, baseDiv, img, preventAnimation, keepPlaceholder) {

			if (item.loadError) {
				return;
			}

			if (img) {

				item.imageAppended = true;
				_setImageSize(item, img, item === self.currItem && _renderMaxResolution);

				baseDiv.appendChild(img);

				if (keepPlaceholder) {
					setTimeout(function () {
						if (item && item.loaded && item.placeholder) {
							item.placeholder.style.display = 'none';
							item.placeholder = null;
						}
					}, 500);
				}
			}
		},
		    _preloadImage = function (item) {
			item.loading = true;
			item.loaded = false;
			var img = item.img = framework.createEl('pswp__img', 'img');
			var onComplete = function () {
				item.loading = false;
				item.loaded = true;

				if (item.loadComplete) {
					item.loadComplete(item);
				} else {
					item.img = null; // no need to store image object
				}
				img.onload = img.onerror = null;
				img = null;
			};
			img.onload = onComplete;
			img.onerror = function () {
				item.loadError = true;
				onComplete();
			};

			img.src = item.src; // + '?a=' + Math.random();

			return img;
		},
		    _checkForError = function (item, cleanUp) {
			if (item.src && item.loadError && item.container) {

				if (cleanUp) {
					item.container.innerHTML = '';
				}

				item.container.innerHTML = _options.errorMsg.replace('%url%', item.src);
				return true;
			}
		},
		    _setImageSize = function (item, img, maxRes) {
			if (!item.src) {
				return;
			}

			if (!img) {
				img = item.container.lastChild;
			}

			var w = maxRes ? item.w : Math.round(item.w * item.fitRatio),
			    h = maxRes ? item.h : Math.round(item.h * item.fitRatio);

			if (item.placeholder && !item.loaded) {
				item.placeholder.style.width = w + 'px';
				item.placeholder.style.height = h + 'px';
			}

			img.style.width = w + 'px';
			img.style.height = h + 'px';
		},
		    _appendImagesPool = function () {

			if (_imagesToAppendPool.length) {
				var poolItem;

				for (var i = 0; i < _imagesToAppendPool.length; i++) {
					poolItem = _imagesToAppendPool[i];
					if (poolItem.holder.index === poolItem.index) {
						_appendImage(poolItem.index, poolItem.item, poolItem.baseDiv, poolItem.img, false, poolItem.clearPlaceholder);
					}
				}
				_imagesToAppendPool = [];
			}
		};

		_registerModule('Controller', {

			publicMethods: {

				lazyLoadItem: function (index) {
					index = _getLoopedId(index);
					var item = _getItemAt(index);

					if (!item || (item.loaded || item.loading) && !_itemsNeedUpdate) {
						return;
					}

					_shout('gettingData', index, item);

					if (!item.src) {
						return;
					}

					_preloadImage(item);
				},
				initController: function () {
					framework.extend(_options, _controllerDefaultOptions, true);
					self.items = _items = items;
					_getItemAt = self.getItemAt;
					_getNumItems = _options.getNumItemsFn; //self.getNumItems;


					_initialIsLoop = _options.loop;
					if (_getNumItems() < 3) {
						_options.loop = false; // disable loop if less then 3 items
					}

					_listen('beforeChange', function (diff) {

						var p = _options.preload,
						    isNext = diff === null ? true : diff >= 0,
						    preloadBefore = Math.min(p[0], _getNumItems()),
						    preloadAfter = Math.min(p[1], _getNumItems()),
						    i;

						for (i = 1; i <= (isNext ? preloadAfter : preloadBefore); i++) {
							self.lazyLoadItem(_currentItemIndex + i);
						}
						for (i = 1; i <= (isNext ? preloadBefore : preloadAfter); i++) {
							self.lazyLoadItem(_currentItemIndex - i);
						}
					});

					_listen('initialLayout', function () {
						self.currItem.initialLayout = _options.getThumbBoundsFn && _options.getThumbBoundsFn(_currentItemIndex);
					});

					_listen('mainScrollAnimComplete', _appendImagesPool);
					_listen('initialZoomInEnd', _appendImagesPool);

					_listen('destroy', function () {
						var item;
						for (var i = 0; i < _items.length; i++) {
							item = _items[i];
							// remove reference to DOM elements, for GC
							if (item.container) {
								item.container = null;
							}
							if (item.placeholder) {
								item.placeholder = null;
							}
							if (item.img) {
								item.img = null;
							}
							if (item.preloader) {
								item.preloader = null;
							}
							if (item.loadError) {
								item.loaded = item.loadError = false;
							}
						}
						_imagesToAppendPool = null;
					});
				},

				getItemAt: function (index) {
					if (index >= 0) {
						return _items[index] !== undefined ? _items[index] : false;
					}
					return false;
				},

				allowProgressiveImg: function () {
					// 1. Progressive image loading isn't working on webkit/blink 
					//    when hw-acceleration (e.g. translateZ) is applied to IMG element.
					//    That's why in PhotoSwipe parent element gets zoom transform, not image itself.
					//    
					// 2. Progressive image loading sometimes blinks in webkit/blink when applying animation to parent element.
					//    That's why it's disabled on touch devices (mainly because of swipe transition)
					//    
					// 3. Progressive image loading sometimes doesn't work in IE (up to 11).

					// Don't allow progressive loading on non-large touch devices
					return _options.forceProgressiveLoading || !_likelyTouchDevice || _options.mouseUsed || screen.width > 1200;
					// 1200 - to eliminate touch devices with large screen (like Chromebook Pixel)
				},

				setContent: function (holder, index) {

					if (_options.loop) {
						index = _getLoopedId(index);
					}

					var prevItem = self.getItemAt(holder.index);
					if (prevItem) {
						prevItem.container = null;
					}

					var item = self.getItemAt(index),
					    img;

					if (!item) {
						holder.el.innerHTML = '';
						return;
					}

					// allow to override data
					_shout('gettingData', index, item);

					holder.index = index;
					holder.item = item;

					// base container DIV is created only once for each of 3 holders
					var baseDiv = item.container = framework.createEl('pswp__zoom-wrap');

					if (!item.src && item.html) {
						if (item.html.tagName) {
							baseDiv.appendChild(item.html);
						} else {
							baseDiv.innerHTML = item.html;
						}
					}

					_checkForError(item);

					_calculateItemSize(item, _viewportSize);

					if (item.src && !item.loadError && !item.loaded) {

						item.loadComplete = function (item) {

							// gallery closed before image finished loading
							if (!_isOpen) {
								return;
							}

							// check if holder hasn't changed while image was loading
							if (holder && holder.index === index) {
								if (_checkForError(item, true)) {
									item.loadComplete = item.img = null;
									_calculateItemSize(item, _viewportSize);
									_applyZoomPanToItem(item);

									if (holder.index === _currentItemIndex) {
										// recalculate dimensions
										self.updateCurrZoomItem();
									}
									return;
								}
								if (!item.imageAppended) {
									if (_features.transform && (_mainScrollAnimating || _initialZoomRunning)) {
										_imagesToAppendPool.push({
											item: item,
											baseDiv: baseDiv,
											img: item.img,
											index: index,
											holder: holder,
											clearPlaceholder: true
										});
									} else {
										_appendImage(index, item, baseDiv, item.img, _mainScrollAnimating || _initialZoomRunning, true);
									}
								} else {
									// remove preloader & mini-img
									if (!_initialZoomRunning && item.placeholder) {
										item.placeholder.style.display = 'none';
										item.placeholder = null;
									}
								}
							}

							item.loadComplete = null;
							item.img = null; // no need to store image element after it's added

							_shout('imageLoadComplete', index, item);
						};

						if (framework.features.transform) {

							var placeholderClassName = 'pswp__img pswp__img--placeholder';
							placeholderClassName += item.msrc ? '' : ' pswp__img--placeholder--blank';

							var placeholder = framework.createEl(placeholderClassName, item.msrc ? 'img' : '');
							if (item.msrc) {
								placeholder.src = item.msrc;
							}

							_setImageSize(item, placeholder);

							baseDiv.appendChild(placeholder);
							item.placeholder = placeholder;
						}

						if (!item.loading) {
							_preloadImage(item);
						}

						if (self.allowProgressiveImg()) {
							// just append image
							if (!_initialContentSet && _features.transform) {
								_imagesToAppendPool.push({
									item: item,
									baseDiv: baseDiv,
									img: item.img,
									index: index,
									holder: holder
								});
							} else {
								_appendImage(index, item, baseDiv, item.img, true, true);
							}
						}
					} else if (item.src && !item.loadError) {
						// image object is created every time, due to bugs of image loading & delay when switching images
						img = framework.createEl('pswp__img', 'img');
						img.style.opacity = 1;
						img.src = item.src;
						_setImageSize(item, img);
						_appendImage(index, item, baseDiv, img, true);
					}

					if (!_initialContentSet && index === _currentItemIndex) {
						_currZoomElementStyle = baseDiv.style;
						_showOrHide(item, img || item.img);
					} else {
						_applyZoomPanToItem(item);
					}

					holder.el.innerHTML = '';
					holder.el.appendChild(baseDiv);
				},

				cleanSlide: function (item) {
					if (item.img) {
						item.img.onload = item.img.onerror = null;
					}
					item.loaded = item.loading = item.img = item.imageAppended = false;
				}

			}
		});

		/*>>items-controller*/

		/*>>tap*/
		/**
   * tap.js:
   *
   * Displatches tap and double-tap events.
   * 
   */

		var tapTimer,
		    tapReleasePoint = {},
		    _dispatchTapEvent = function (origEvent, releasePoint, pointerType) {
			var e = document.createEvent('CustomEvent'),
			    eDetail = {
				origEvent: origEvent,
				target: origEvent.target,
				releasePoint: releasePoint,
				pointerType: pointerType || 'touch'
			};

			e.initCustomEvent('pswpTap', true, true, eDetail);
			origEvent.target.dispatchEvent(e);
		};

		_registerModule('Tap', {
			publicMethods: {
				initTap: function () {
					_listen('firstTouchStart', self.onTapStart);
					_listen('touchRelease', self.onTapRelease);
					_listen('destroy', function () {
						tapReleasePoint = {};
						tapTimer = null;
					});
				},
				onTapStart: function (touchList) {
					if (touchList.length > 1) {
						clearTimeout(tapTimer);
						tapTimer = null;
					}
				},
				onTapRelease: function (e, releasePoint) {
					if (!releasePoint) {
						return;
					}

					if (!_moved && !_isMultitouch && !_numAnimations) {
						var p0 = releasePoint;
						if (tapTimer) {
							clearTimeout(tapTimer);
							tapTimer = null;

							// Check if taped on the same place
							if (_isNearbyPoints(p0, tapReleasePoint)) {
								_shout('doubleTap', p0);
								return;
							}
						}

						if (releasePoint.type === 'mouse') {
							_dispatchTapEvent(e, releasePoint, 'mouse');
							return;
						}

						var clickedTagName = e.target.tagName.toUpperCase();
						// avoid double tap delay on buttons and elements that have class pswp__single-tap
						if (clickedTagName === 'BUTTON' || framework.hasClass(e.target, 'pswp__single-tap')) {
							_dispatchTapEvent(e, releasePoint);
							return;
						}

						_equalizePoints(tapReleasePoint, p0);

						tapTimer = setTimeout(function () {
							_dispatchTapEvent(e, releasePoint);
							tapTimer = null;
						}, 300);
					}
				}
			}
		});

		/*>>tap*/

		/*>>desktop-zoom*/
		/**
   *
   * desktop-zoom.js:
   *
   * - Binds mousewheel event for paning zoomed image.
   * - Manages "dragging", "zoomed-in", "zoom-out" classes.
   *   (which are used for cursors and zoom icon)
   * - Adds toggleDesktopZoom function.
   * 
   */

		var _wheelDelta;

		_registerModule('DesktopZoom', {

			publicMethods: {

				initDesktopZoom: function () {

					if (_oldIE) {
						// no zoom for old IE (<=8)
						return;
					}

					if (_likelyTouchDevice) {
						// if detected hardware touch support, we wait until mouse is used,
						// and only then apply desktop-zoom features
						_listen('mouseUsed', function () {
							self.setupDesktopZoom();
						});
					} else {
						self.setupDesktopZoom(true);
					}
				},

				setupDesktopZoom: function (onInit) {

					_wheelDelta = {};

					var events = 'wheel mousewheel DOMMouseScroll';

					_listen('bindEvents', function () {
						framework.bind(template, events, self.handleMouseWheel);
					});

					_listen('unbindEvents', function () {
						if (_wheelDelta) {
							framework.unbind(template, events, self.handleMouseWheel);
						}
					});

					self.mouseZoomedIn = false;

					var hasDraggingClass,
					    updateZoomable = function () {
						if (self.mouseZoomedIn) {
							framework.removeClass(template, 'pswp--zoomed-in');
							self.mouseZoomedIn = false;
						}
						if (_currZoomLevel < 1) {
							framework.addClass(template, 'pswp--zoom-allowed');
						} else {
							framework.removeClass(template, 'pswp--zoom-allowed');
						}
						removeDraggingClass();
					},
					    removeDraggingClass = function () {
						if (hasDraggingClass) {
							framework.removeClass(template, 'pswp--dragging');
							hasDraggingClass = false;
						}
					};

					_listen('resize', updateZoomable);
					_listen('afterChange', updateZoomable);
					_listen('pointerDown', function () {
						if (self.mouseZoomedIn) {
							hasDraggingClass = true;
							framework.addClass(template, 'pswp--dragging');
						}
					});
					_listen('pointerUp', removeDraggingClass);

					if (!onInit) {
						updateZoomable();
					}
				},

				handleMouseWheel: function (e) {

					if (_currZoomLevel <= self.currItem.fitRatio) {
						if (_options.modal) {

							if (!_options.closeOnScroll || _numAnimations || _isDragging) {
								e.preventDefault();
							} else if (_transformKey && Math.abs(e.deltaY) > 2) {
								// close PhotoSwipe
								// if browser supports transforms & scroll changed enough
								_closedByScroll = true;
								self.close();
							}
						}
						return true;
					}

					// allow just one event to fire
					e.stopPropagation();

					// https://developer.mozilla.org/en-US/docs/Web/Events/wheel
					_wheelDelta.x = 0;

					if ('deltaX' in e) {
						if (e.deltaMode === 1 /* DOM_DELTA_LINE */) {
								// 18 - average line height
								_wheelDelta.x = e.deltaX * 18;
								_wheelDelta.y = e.deltaY * 18;
							} else {
							_wheelDelta.x = e.deltaX;
							_wheelDelta.y = e.deltaY;
						}
					} else if ('wheelDelta' in e) {
						if (e.wheelDeltaX) {
							_wheelDelta.x = -0.16 * e.wheelDeltaX;
						}
						if (e.wheelDeltaY) {
							_wheelDelta.y = -0.16 * e.wheelDeltaY;
						} else {
							_wheelDelta.y = -0.16 * e.wheelDelta;
						}
					} else if ('detail' in e) {
						_wheelDelta.y = e.detail;
					} else {
						return;
					}

					_calculatePanBounds(_currZoomLevel, true);

					var newPanX = _panOffset.x - _wheelDelta.x,
					    newPanY = _panOffset.y - _wheelDelta.y;

					// only prevent scrolling in nonmodal mode when not at edges
					if (_options.modal || newPanX <= _currPanBounds.min.x && newPanX >= _currPanBounds.max.x && newPanY <= _currPanBounds.min.y && newPanY >= _currPanBounds.max.y) {
						e.preventDefault();
					}

					// TODO: use rAF instead of mousewheel?
					self.panTo(newPanX, newPanY);
				},

				toggleDesktopZoom: function (centerPoint) {
					centerPoint = centerPoint || { x: _viewportSize.x / 2 + _offset.x, y: _viewportSize.y / 2 + _offset.y };

					var doubleTapZoomLevel = _options.getDoubleTapZoom(true, self.currItem);
					var zoomOut = _currZoomLevel === doubleTapZoomLevel;

					self.mouseZoomedIn = !zoomOut;

					self.zoomTo(zoomOut ? self.currItem.initialZoomLevel : doubleTapZoomLevel, centerPoint, 333);
					framework[(!zoomOut ? 'add' : 'remove') + 'Class'](template, 'pswp--zoomed-in');
				}

			}
		});

		/*>>desktop-zoom*/

		/*>>history*/
		/**
   *
   * history.js:
   *
   * - Back button to close gallery.
   * 
   * - Unique URL for each slide: example.com/&pid=1&gid=3
   *   (where PID is picture index, and GID and gallery index)
   *   
   * - Switch URL when slides change.
   * 
   */

		var _historyDefaultOptions = {
			history: true,
			galleryUID: 1
		};

		var _historyUpdateTimeout,
		    _hashChangeTimeout,
		    _hashAnimCheckTimeout,
		    _hashChangedByScript,
		    _hashChangedByHistory,
		    _hashReseted,
		    _initialHash,
		    _historyChanged,
		    _closedFromURL,
		    _urlChangedOnce,
		    _windowLoc,
		    _supportsPushState,
		    _getHash = function () {
			return _windowLoc.hash.substring(1);
		},
		    _cleanHistoryTimeouts = function () {

			if (_historyUpdateTimeout) {
				clearTimeout(_historyUpdateTimeout);
			}

			if (_hashAnimCheckTimeout) {
				clearTimeout(_hashAnimCheckTimeout);
			}
		},


		// pid - Picture index
		// gid - Gallery index
		_parseItemIndexFromURL = function () {
			var hash = _getHash(),
			    params = {};

			if (hash.length < 5) {
				// pid=1
				return params;
			}

			var i,
			    vars = hash.split('&');
			for (i = 0; i < vars.length; i++) {
				if (!vars[i]) {
					continue;
				}
				var pair = vars[i].split('=');
				if (pair.length < 2) {
					continue;
				}
				params[pair[0]] = pair[1];
			}
			if (_options.galleryPIDs) {
				// detect custom pid in hash and search for it among the items collection
				var searchfor = params.pid;
				params.pid = 0; // if custom pid cannot be found, fallback to the first item
				for (i = 0; i < _items.length; i++) {
					if (_items[i].pid === searchfor) {
						params.pid = i;
						break;
					}
				}
			} else {
				params.pid = parseInt(params.pid, 10) - 1;
			}
			if (params.pid < 0) {
				params.pid = 0;
			}
			return params;
		},
		    _updateHash = function () {

			if (_hashAnimCheckTimeout) {
				clearTimeout(_hashAnimCheckTimeout);
			}

			if (_numAnimations || _isDragging) {
				// changing browser URL forces layout/paint in some browsers, which causes noticable lag during animation
				// that's why we update hash only when no animations running
				_hashAnimCheckTimeout = setTimeout(_updateHash, 500);
				return;
			}

			if (_hashChangedByScript) {
				clearTimeout(_hashChangeTimeout);
			} else {
				_hashChangedByScript = true;
			}

			var pid = _currentItemIndex + 1;
			var item = _getItemAt(_currentItemIndex);
			if (item.hasOwnProperty('pid')) {
				// carry forward any custom pid assigned to the item
				pid = item.pid;
			}
			var newHash = _initialHash + '&' + 'gid=' + _options.galleryUID + '&' + 'pid=' + pid;

			if (!_historyChanged) {
				if (_windowLoc.hash.indexOf(newHash) === -1) {
					_urlChangedOnce = true;
				}
				// first time - add new hisory record, then just replace
			}

			var newURL = _windowLoc.href.split('#')[0] + '#' + newHash;

			if (_supportsPushState) {

				if ('#' + newHash !== window.location.hash) {
					history[_historyChanged ? 'replaceState' : 'pushState']('', document.title, newURL);
				}
			} else {
				if (_historyChanged) {
					_windowLoc.replace(newURL);
				} else {
					_windowLoc.hash = newHash;
				}
			}

			_historyChanged = true;
			_hashChangeTimeout = setTimeout(function () {
				_hashChangedByScript = false;
			}, 60);
		};

		_registerModule('History', {

			publicMethods: {
				initHistory: function () {

					framework.extend(_options, _historyDefaultOptions, true);

					if (!_options.history) {
						return;
					}

					_windowLoc = window.location;
					_urlChangedOnce = false;
					_closedFromURL = false;
					_historyChanged = false;
					_initialHash = _getHash();
					_supportsPushState = 'pushState' in history;

					if (_initialHash.indexOf('gid=') > -1) {
						_initialHash = _initialHash.split('&gid=')[0];
						_initialHash = _initialHash.split('?gid=')[0];
					}

					_listen('afterChange', self.updateURL);
					_listen('unbindEvents', function () {
						framework.unbind(window, 'hashchange', self.onHashChange);
					});

					var returnToOriginal = function () {
						_hashReseted = true;
						if (!_closedFromURL) {

							if (_urlChangedOnce) {
								history.back();
							} else {

								if (_initialHash) {
									_windowLoc.hash = _initialHash;
								} else {
									if (_supportsPushState) {

										// remove hash from url without refreshing it or scrolling to top
										history.pushState('', document.title, _windowLoc.pathname + _windowLoc.search);
									} else {
										_windowLoc.hash = '';
									}
								}
							}
						}

						_cleanHistoryTimeouts();
					};

					_listen('unbindEvents', function () {
						if (_closedByScroll) {
							// if PhotoSwipe is closed by scroll, we go "back" before the closing animation starts
							// this is done to keep the scroll position
							returnToOriginal();
						}
					});
					_listen('destroy', function () {
						if (!_hashReseted) {
							returnToOriginal();
						}
					});
					_listen('firstUpdate', function () {
						_currentItemIndex = _parseItemIndexFromURL().pid;
					});

					var index = _initialHash.indexOf('pid=');
					if (index > -1) {
						_initialHash = _initialHash.substring(0, index);
						if (_initialHash.slice(-1) === '&') {
							_initialHash = _initialHash.slice(0, -1);
						}
					}

					setTimeout(function () {
						if (_isOpen) {
							// hasn't destroyed yet
							framework.bind(window, 'hashchange', self.onHashChange);
						}
					}, 40);
				},
				onHashChange: function () {

					if (_getHash() === _initialHash) {

						_closedFromURL = true;
						self.close();
						return;
					}
					if (!_hashChangedByScript) {

						_hashChangedByHistory = true;
						self.goTo(_parseItemIndexFromURL().pid);
						_hashChangedByHistory = false;
					}
				},
				updateURL: function () {

					// Delay the update of URL, to avoid lag during transition, 
					// and to not to trigger actions like "refresh page sound" or "blinking favicon" to often

					_cleanHistoryTimeouts();

					if (_hashChangedByHistory) {
						return;
					}

					if (!_historyChanged) {
						_updateHash(); // first time
					} else {
						_historyUpdateTimeout = setTimeout(_updateHash, 800);
					}
				}

			}
		});

		/*>>history*/
		framework.extend(self, publicMethods);
	};
	return PhotoSwipe;
});
;
$(window).bind(' load resize orientationChange ', function () {
  var footer = $("#footer-container");
  var pos = footer.position();
  var height = $(window).height();
  height = height - pos.top;
  height = height - footer.height() - 1;

  function stickyFooter() {
    footer.css({
      'margin-top': height + 'px'
    });
  }

  if (height > 0) {
    stickyFooter();
  }
});