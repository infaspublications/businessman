(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.businessman = global.businessman || {})));
}(this, (function (exports) { 'use strict';

var observable = function(el) {

  /**
   * Extend the original object or create a new empty one
   * @type { Object }
   */

  el = el || {};

  /**
   * Private variables
   */
  var callbacks = {},
    slice = Array.prototype.slice;

  /**
   * Public Api
   */

  // extend the el object adding the observable methods
  Object.defineProperties(el, {
    /**
     * Listen to the given `event` ands
     * execute the `callback` each time an event is triggered.
     * @param  { String } event - event id
     * @param  { Function } fn - callback function
     * @returns { Object } el
     */
    on: {
      value: function(event, fn) {
        if (typeof fn == 'function')
          { (callbacks[event] = callbacks[event] || []).push(fn); }
        return el
      },
      enumerable: false,
      writable: false,
      configurable: false
    },

    /**
     * Removes the given `event` listeners
     * @param   { String } event - event id
     * @param   { Function } fn - callback function
     * @returns { Object } el
     */
    off: {
      value: function(event, fn) {
        if (event == '*' && !fn) { callbacks = {}; }
        else {
          if (fn) {
            var arr = callbacks[event];
            for (var i = 0, cb; cb = arr && arr[i]; ++i) {
              if (cb == fn) { arr.splice(i--, 1); }
            }
          } else { delete callbacks[event]; }
        }
        return el
      },
      enumerable: false,
      writable: false,
      configurable: false
    },

    /**
     * Listen to the given `event` and
     * execute the `callback` at most once
     * @param   { String } event - event id
     * @param   { Function } fn - callback function
     * @returns { Object } el
     */
    one: {
      value: function(event, fn) {
        function on() {
          el.off(event, on);
          fn.apply(el, arguments);
        }
        return el.on(event, on)
      },
      enumerable: false,
      writable: false,
      configurable: false
    },

    /**
     * Execute all callback functions that listen to
     * the given `event`
     * @param   { String } event - event id
     * @returns { Object } el
     */
    trigger: {
      value: function(event) {
        var arguments$1 = arguments;


        // getting the arguments
        var arglen = arguments.length - 1,
          args = new Array(arglen),
          fns,
          fn,
          i;

        for (i = 0; i < arglen; i++) {
          args[i] = arguments$1[i + 1]; // skip first argument
        }

        fns = slice.call(callbacks[event] || [], 0);

        for (i = 0; fn = fns[i]; ++i) {
          fn.apply(el, args);
        }

        if (callbacks['*'] && event != '*')
          { el.trigger.apply(el, ['*', event].concat(args)); }

        return el
      },
      enumerable: false,
      writable: false,
      configurable: false
    }
  });

  return el

};

var o = new function () {
    observable( this );
};

var trigger = function ( data ) {
    try {
        o.trigger( data.type, data.payload );
    } catch ( e ) {
        console.error( 'Error in trigger', e );
    }
};

var on = function ( type, cb ) {
    try {
        o.on( type, cb );
    } catch ( e ) {
        console.error( 'Error in on', e );
    }
};

var off = function ( type, cb ) {
    try {
        if ( cb ) { o.off( type, cb ); }
        else { o.off( type ); }
    } catch ( e ) {
        console.error( 'Error in off', e );
    }
};

var pack = function ( type, payload ) {
    return { type: type, payload: payload }
};

var Store = function Store ( opt ) {
    var state = opt.state;
    var type = opt.type;
    var mutations = opt.mutations;
    var actions = opt.actions;
    var store = this;
    var ref = this;
    var dispatch = ref.dispatch;
    var commit = ref.commit;

    Object.defineProperties( this, {
        type: {
            value: type,
            enumerable: false,
            writable: false,
            configurable: false
        },
        state: {
            get: function () { return state; },
            set: function (newState) {
                state = newState;
                postMessage( pack( type, state ) );
            }
        },
        mutations: {
            value: mutations,
            configurable: false,
            writable: false
        },
        actions: {
            value: actions,
            configurable: false,
            writable: false
        },
        dispatch: {
            value: function ( type, payload ) { return dispatch.call( store, type, payload ); },
            configurable: false,
            writable: false
        },
        commit: {
            value: function ( type, payload ) { return commit.call( store, type, payload ); },
            configurable: false,
            writable: false
        }
    } );
};

Store.prototype.commit = function commit ( type, payload ) {
    this.mutations[ type ]( this, payload );
};

Store.prototype.dispatch = function dispatch ( type, payload ) {
    this.actions[ type ]( this, payload );
};

var INIT = 'INIT';
var CREATE_CLIENT_STORE = 'CREATE_CLIENT_STORE';

var stores = {};
var forFront = [];

var worker = {
    start: function () {
        onmessage = function (e) {
            var storeType = e.data[ 0 ],
                actionType = e.data[ 1 ],
                payload = e.data[ 2 ];
            stores[ storeType ].dispatch( actionType, payload );
        };
        postMessage( pack( INIT, { stores: forFront } ) );
    },
    registerStore: function (config) {
        var store = new Store( config ),
            type = store.type;
        if ( ! ( type in stores ) ) {
            stores[ type ] = store;
            forFront.push( {
                type: type,
                actions: Object.keys( store.actions )
            } );
        }
    }
};

var worker$1 = Object.freeze( worker );

var _install = function ( path, worker ) {
    try {
        worker = new Worker( path );
        worker.onmessage = function ( message ) { return trigger( message.data ); };
        return worker
    } catch ( e ) {
        console.error( 'Error in install', e );
    }
};

var _dispatch = function ( storeType, actionType, payload, worker ) {
    try {
        worker.postMessage( [ storeType, actionType, payload ] );
    } catch ( e ) {
        console.error( 'Error in dispatch', e );
    }
};

var _subscribe = function ( type, cb ) {
    try {
        on( type, cb );
    } catch ( e ) {
        console.error( 'Error in subscribe', e );
    }
};

var _unsubscribe = function ( type, cb ) {
    try {
        off( type, cb );
    } catch ( e ) {
        console.error( 'Error in unsubscribe', e );
    }
};

var businessmanWoker = null;

var install = function ( path ) {
        businessmanWoker = _install( path, businessmanWoker );
    };
var dispatch$1 = function ( storeType, actionType, payload ) { return _dispatch( storeType, actionType, payload, businessmanWoker ); };
var subscribe = function ( type, cb ) { return _subscribe( type, cb ); };
var unsubscribe = function ( type, cb ) { return _unsubscribe( type, cb ); };

subscribe( INIT, function ( data ) {
    var stores = {};
    try {
        data.stores.map( function ( store ) {
            stores[ store.type ] = {
                dispatch: function ( actionType, payload ) {
                    dispatch$1( store.type, actionType, payload );
                },
                subscribe: function ( cb ) {
                    subscribe( store.type, cb );
                },
                unsubscribe: function ( cb ) {
                    unsubscribe( store.type, cb );
                }
            };
        } );
        trigger( pack( CREATE_CLIENT_STORE, stores ) );
    } catch ( e ) {
        console.error( 'Error in creating client store', e );
    }
} );

exports.install = install;
exports.dispatch = dispatch$1;
exports.subscribe = subscribe;
exports.unsubscribe = unsubscribe;
exports.worker = worker$1;

Object.defineProperty(exports, '__esModule', { value: true });

})));
