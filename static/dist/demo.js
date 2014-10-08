/*global move*/
/*!
 * async
 * https://github.com/caolan/async
 *
 * Copyright 2010-2014 Caolan McMahon
 * Released under the MIT license
 */
/*jshint onevar: false, indent:4 */
/*global setImmediate: false, setTimeout: false, console: false */
(function () {

    var async = {};

    // global on the server, window in the browser
    var root, previous_async;

    root = this;
    if (root != null) {
      previous_async = root.async;
    }

    async.noConflict = function () {
        root.async = previous_async;
        return async;
    };

    function only_once(fn) {
        var called = false;
        return function() {
            if (called) throw new Error("Callback was already called.");
            called = true;
            fn.apply(root, arguments);
        }
    }

    //// cross-browser compatiblity functions ////

    var _toString = Object.prototype.toString;

    var _isArray = Array.isArray || function (obj) {
        return _toString.call(obj) === '[object Array]';
    };

    var _each = function (arr, iterator) {
        if (arr.forEach) {
            return arr.forEach(iterator);
        }
        for (var i = 0; i < arr.length; i += 1) {
            iterator(arr[i], i, arr);
        }
    };

    var _map = function (arr, iterator) {
        if (arr.map) {
            return arr.map(iterator);
        }
        var results = [];
        _each(arr, function (x, i, a) {
            results.push(iterator(x, i, a));
        });
        return results;
    };

    var _reduce = function (arr, iterator, memo) {
        if (arr.reduce) {
            return arr.reduce(iterator, memo);
        }
        _each(arr, function (x, i, a) {
            memo = iterator(memo, x, i, a);
        });
        return memo;
    };

    var _keys = function (obj) {
        if (Object.keys) {
            return Object.keys(obj);
        }
        var keys = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys;
    };

    //// exported async module functions ////

    //// nextTick implementation with browser-compatible fallback ////
    if (typeof process === 'undefined' || !(process.nextTick)) {
        if (typeof setImmediate === 'function') {
            async.nextTick = function (fn) {
                // not a direct alias for IE10 compatibility
                setImmediate(fn);
            };
            async.setImmediate = async.nextTick;
        }
        else {
            async.nextTick = function (fn) {
                setTimeout(fn, 0);
            };
            async.setImmediate = async.nextTick;
        }
    }
    else {
        async.nextTick = process.nextTick;
        if (typeof setImmediate !== 'undefined') {
            async.setImmediate = function (fn) {
              // not a direct alias for IE10 compatibility
              setImmediate(fn);
            };
        }
        else {
            async.setImmediate = async.nextTick;
        }
    }

    async.each = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        _each(arr, function (x) {
            iterator(x, only_once(done) );
        });
        function done(err) {
          if (err) {
              callback(err);
              callback = function () {};
          }
          else {
              completed += 1;
              if (completed >= arr.length) {
                  callback();
              }
          }
        }
    };
    async.forEach = async.each;

    async.eachSeries = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        var iterate = function () {
            iterator(arr[completed], function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed >= arr.length) {
                        callback();
                    }
                    else {
                        iterate();
                    }
                }
            });
        };
        iterate();
    };
    async.forEachSeries = async.eachSeries;

    async.eachLimit = function (arr, limit, iterator, callback) {
        var fn = _eachLimit(limit);
        fn.apply(null, [arr, iterator, callback]);
    };
    async.forEachLimit = async.eachLimit;

    var _eachLimit = function (limit) {

        return function (arr, iterator, callback) {
            callback = callback || function () {};
            if (!arr.length || limit <= 0) {
                return callback();
            }
            var completed = 0;
            var started = 0;
            var running = 0;

            (function replenish () {
                if (completed >= arr.length) {
                    return callback();
                }

                while (running < limit && started < arr.length) {
                    started += 1;
                    running += 1;
                    iterator(arr[started - 1], function (err) {
                        if (err) {
                            callback(err);
                            callback = function () {};
                        }
                        else {
                            completed += 1;
                            running -= 1;
                            if (completed >= arr.length) {
                                callback();
                            }
                            else {
                                replenish();
                            }
                        }
                    });
                }
            })();
        };
    };


    var doParallel = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.each].concat(args));
        };
    };
    var doParallelLimit = function(limit, fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [_eachLimit(limit)].concat(args));
        };
    };
    var doSeries = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.eachSeries].concat(args));
        };
    };


    var _asyncMap = function (eachfn, arr, iterator, callback) {
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        if (!callback) {
            eachfn(arr, function (x, callback) {
                iterator(x.value, function (err) {
                    callback(err);
                });
            });
        } else {
            var results = [];
            eachfn(arr, function (x, callback) {
                iterator(x.value, function (err, v) {
                    results[x.index] = v;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };
    async.map = doParallel(_asyncMap);
    async.mapSeries = doSeries(_asyncMap);
    async.mapLimit = function (arr, limit, iterator, callback) {
        return _mapLimit(limit)(arr, iterator, callback);
    };

    var _mapLimit = function(limit) {
        return doParallelLimit(limit, _asyncMap);
    };

    // reduce only has a series version, as doing reduce in parallel won't
    // work in many situations.
    async.reduce = function (arr, memo, iterator, callback) {
        async.eachSeries(arr, function (x, callback) {
            iterator(memo, x, function (err, v) {
                memo = v;
                callback(err);
            });
        }, function (err) {
            callback(err, memo);
        });
    };
    // inject alias
    async.inject = async.reduce;
    // foldl alias
    async.foldl = async.reduce;

    async.reduceRight = function (arr, memo, iterator, callback) {
        var reversed = _map(arr, function (x) {
            return x;
        }).reverse();
        async.reduce(reversed, memo, iterator, callback);
    };
    // foldr alias
    async.foldr = async.reduceRight;

    var _filter = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.filter = doParallel(_filter);
    async.filterSeries = doSeries(_filter);
    // select alias
    async.select = async.filter;
    async.selectSeries = async.filterSeries;

    var _reject = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (!v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.reject = doParallel(_reject);
    async.rejectSeries = doSeries(_reject);

    var _detect = function (eachfn, arr, iterator, main_callback) {
        eachfn(arr, function (x, callback) {
            iterator(x, function (result) {
                if (result) {
                    main_callback(x);
                    main_callback = function () {};
                }
                else {
                    callback();
                }
            });
        }, function (err) {
            main_callback();
        });
    };
    async.detect = doParallel(_detect);
    async.detectSeries = doSeries(_detect);

    async.some = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (v) {
                    main_callback(true);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(false);
        });
    };
    // any alias
    async.any = async.some;

    async.every = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (!v) {
                    main_callback(false);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(true);
        });
    };
    // all alias
    async.all = async.every;

    async.sortBy = function (arr, iterator, callback) {
        async.map(arr, function (x, callback) {
            iterator(x, function (err, criteria) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, {value: x, criteria: criteria});
                }
            });
        }, function (err, results) {
            if (err) {
                return callback(err);
            }
            else {
                var fn = function (left, right) {
                    var a = left.criteria, b = right.criteria;
                    return a < b ? -1 : a > b ? 1 : 0;
                };
                callback(null, _map(results.sort(fn), function (x) {
                    return x.value;
                }));
            }
        });
    };

    async.auto = function (tasks, callback) {
        callback = callback || function () {};
        var keys = _keys(tasks);
        var remainingTasks = keys.length
        if (!remainingTasks) {
            return callback();
        }

        var results = {};

        var listeners = [];
        var addListener = function (fn) {
            listeners.unshift(fn);
        };
        var removeListener = function (fn) {
            for (var i = 0; i < listeners.length; i += 1) {
                if (listeners[i] === fn) {
                    listeners.splice(i, 1);
                    return;
                }
            }
        };
        var taskComplete = function () {
            remainingTasks--
            _each(listeners.slice(0), function (fn) {
                fn();
            });
        };

        addListener(function () {
            if (!remainingTasks) {
                var theCallback = callback;
                // prevent final callback from calling itself if it errors
                callback = function () {};

                theCallback(null, results);
            }
        });

        _each(keys, function (k) {
            var task = _isArray(tasks[k]) ? tasks[k]: [tasks[k]];
            var taskCallback = function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (args.length <= 1) {
                    args = args[0];
                }
                if (err) {
                    var safeResults = {};
                    _each(_keys(results), function(rkey) {
                        safeResults[rkey] = results[rkey];
                    });
                    safeResults[k] = args;
                    callback(err, safeResults);
                    // stop subsequent errors hitting callback multiple times
                    callback = function () {};
                }
                else {
                    results[k] = args;
                    async.setImmediate(taskComplete);
                }
            };
            var requires = task.slice(0, Math.abs(task.length - 1)) || [];
            var ready = function () {
                return _reduce(requires, function (a, x) {
                    return (a && results.hasOwnProperty(x));
                }, true) && !results.hasOwnProperty(k);
            };
            if (ready()) {
                task[task.length - 1](taskCallback, results);
            }
            else {
                var listener = function () {
                    if (ready()) {
                        removeListener(listener);
                        task[task.length - 1](taskCallback, results);
                    }
                };
                addListener(listener);
            }
        });
    };

    async.retry = function(times, task, callback) {
        var DEFAULT_TIMES = 5;
        var attempts = [];
        // Use defaults if times not passed
        if (typeof times === 'function') {
            callback = task;
            task = times;
            times = DEFAULT_TIMES;
        }
        // Make sure times is a number
        times = parseInt(times, 10) || DEFAULT_TIMES;
        var wrappedTask = function(wrappedCallback, wrappedResults) {
            var retryAttempt = function(task, finalAttempt) {
                return function(seriesCallback) {
                    task(function(err, result){
                        seriesCallback(!err || finalAttempt, {err: err, result: result});
                    }, wrappedResults);
                };
            };
            while (times) {
                attempts.push(retryAttempt(task, !(times-=1)));
            }
            async.series(attempts, function(done, data){
                data = data[data.length - 1];
                (wrappedCallback || callback)(data.err, data.result);
            });
        }
        // If a callback is passed, run this as a controll flow
        return callback ? wrappedTask() : wrappedTask
    };

    async.waterfall = function (tasks, callback) {
        callback = callback || function () {};
        if (!_isArray(tasks)) {
          var err = new Error('First argument to waterfall must be an array of functions');
          return callback(err);
        }
        if (!tasks.length) {
            return callback();
        }
        var wrapIterator = function (iterator) {
            return function (err) {
                if (err) {
                    callback.apply(null, arguments);
                    callback = function () {};
                }
                else {
                    var args = Array.prototype.slice.call(arguments, 1);
                    var next = iterator.next();
                    if (next) {
                        args.push(wrapIterator(next));
                    }
                    else {
                        args.push(callback);
                    }
                    async.setImmediate(function () {
                        iterator.apply(null, args);
                    });
                }
            };
        };
        wrapIterator(async.iterator(tasks))();
    };

    var _parallel = function(eachfn, tasks, callback) {
        callback = callback || function () {};
        if (_isArray(tasks)) {
            eachfn.map(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            eachfn.each(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.parallel = function (tasks, callback) {
        _parallel({ map: async.map, each: async.each }, tasks, callback);
    };

    async.parallelLimit = function(tasks, limit, callback) {
        _parallel({ map: _mapLimit(limit), each: _eachLimit(limit) }, tasks, callback);
    };

    async.series = function (tasks, callback) {
        callback = callback || function () {};
        if (_isArray(tasks)) {
            async.mapSeries(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            async.eachSeries(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.iterator = function (tasks) {
        var makeCallback = function (index) {
            var fn = function () {
                if (tasks.length) {
                    tasks[index].apply(null, arguments);
                }
                return fn.next();
            };
            fn.next = function () {
                return (index < tasks.length - 1) ? makeCallback(index + 1): null;
            };
            return fn;
        };
        return makeCallback(0);
    };

    async.apply = function (fn) {
        var args = Array.prototype.slice.call(arguments, 1);
        return function () {
            return fn.apply(
                null, args.concat(Array.prototype.slice.call(arguments))
            );
        };
    };

    var _concat = function (eachfn, arr, fn, callback) {
        var r = [];
        eachfn(arr, function (x, cb) {
            fn(x, function (err, y) {
                r = r.concat(y || []);
                cb(err);
            });
        }, function (err) {
            callback(err, r);
        });
    };
    async.concat = doParallel(_concat);
    async.concatSeries = doSeries(_concat);

    async.whilst = function (test, iterator, callback) {
        if (test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.whilst(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.doWhilst = function (iterator, test, callback) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            var args = Array.prototype.slice.call(arguments, 1);
            if (test.apply(null, args)) {
                async.doWhilst(iterator, test, callback);
            }
            else {
                callback();
            }
        });
    };

    async.until = function (test, iterator, callback) {
        if (!test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.until(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.doUntil = function (iterator, test, callback) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            var args = Array.prototype.slice.call(arguments, 1);
            if (!test.apply(null, args)) {
                async.doUntil(iterator, test, callback);
            }
            else {
                callback();
            }
        });
    };

    async.queue = function (worker, concurrency) {
        if (concurrency === undefined) {
            concurrency = 1;
        }
        function _insert(q, data, pos, callback) {
          if (!q.started){
            q.started = true;
          }
          if (!_isArray(data)) {
              data = [data];
          }
          if(data.length == 0) {
             // call drain immediately if there are no tasks
             return async.setImmediate(function() {
                 if (q.drain) {
                     q.drain();
                 }
             });
          }
          _each(data, function(task) {
              var item = {
                  data: task,
                  callback: typeof callback === 'function' ? callback : null
              };

              if (pos) {
                q.tasks.unshift(item);
              } else {
                q.tasks.push(item);
              }

              if (q.saturated && q.tasks.length === q.concurrency) {
                  q.saturated();
              }
              async.setImmediate(q.process);
          });
        }

        var workers = 0;
        var q = {
            tasks: [],
            concurrency: concurrency,
            saturated: null,
            empty: null,
            drain: null,
            started: false,
            paused: false,
            push: function (data, callback) {
              _insert(q, data, false, callback);
            },
            kill: function () {
              q.drain = null;
              q.tasks = [];
            },
            unshift: function (data, callback) {
              _insert(q, data, true, callback);
            },
            process: function () {
                if (!q.paused && workers < q.concurrency && q.tasks.length) {
                    var task = q.tasks.shift();
                    if (q.empty && q.tasks.length === 0) {
                        q.empty();
                    }
                    workers += 1;
                    var next = function () {
                        workers -= 1;
                        if (task.callback) {
                            task.callback.apply(task, arguments);
                        }
                        if (q.drain && q.tasks.length + workers === 0) {
                            q.drain();
                        }
                        q.process();
                    };
                    var cb = only_once(next);
                    worker(task.data, cb);
                }
            },
            length: function () {
                return q.tasks.length;
            },
            running: function () {
                return workers;
            },
            idle: function() {
                return q.tasks.length + workers === 0;
            },
            pause: function () {
                if (q.paused === true) { return; }
                q.paused = true;
            },
            resume: function () {
                if (q.paused === false) { return; }
                q.paused = false;
                // Need to call q.process once per concurrent
                // worker to preserve full concurrency after pause
                for (var w = 1; w <= q.concurrency; w++) {
                    async.setImmediate(q.process);
                }
            }
        };
        return q;
    };

    async.priorityQueue = function (worker, concurrency) {

        function _compareTasks(a, b){
          return a.priority - b.priority;
        };

        function _binarySearch(sequence, item, compare) {
          var beg = -1,
              end = sequence.length - 1;
          while (beg < end) {
            var mid = beg + ((end - beg + 1) >>> 1);
            if (compare(item, sequence[mid]) >= 0) {
              beg = mid;
            } else {
              end = mid - 1;
            }
          }
          return beg;
        }

        function _insert(q, data, priority, callback) {
          if (!q.started){
            q.started = true;
          }
          if (!_isArray(data)) {
              data = [data];
          }
          if(data.length == 0) {
             // call drain immediately if there are no tasks
             return async.setImmediate(function() {
                 if (q.drain) {
                     q.drain();
                 }
             });
          }
          _each(data, function(task) {
              var item = {
                  data: task,
                  priority: priority,
                  callback: typeof callback === 'function' ? callback : null
              };

              q.tasks.splice(_binarySearch(q.tasks, item, _compareTasks) + 1, 0, item);

              if (q.saturated && q.tasks.length === q.concurrency) {
                  q.saturated();
              }
              async.setImmediate(q.process);
          });
        }

        // Start with a normal queue
        var q = async.queue(worker, concurrency);

        // Override push to accept second parameter representing priority
        q.push = function (data, priority, callback) {
          _insert(q, data, priority, callback);
        };

        // Remove unshift function
        delete q.unshift;

        return q;
    };

    async.cargo = function (worker, payload) {
        var working     = false,
            tasks       = [];

        var cargo = {
            tasks: tasks,
            payload: payload,
            saturated: null,
            empty: null,
            drain: null,
            drained: true,
            push: function (data, callback) {
                if (!_isArray(data)) {
                    data = [data];
                }
                _each(data, function(task) {
                    tasks.push({
                        data: task,
                        callback: typeof callback === 'function' ? callback : null
                    });
                    cargo.drained = false;
                    if (cargo.saturated && tasks.length === payload) {
                        cargo.saturated();
                    }
                });
                async.setImmediate(cargo.process);
            },
            process: function process() {
                if (working) return;
                if (tasks.length === 0) {
                    if(cargo.drain && !cargo.drained) cargo.drain();
                    cargo.drained = true;
                    return;
                }

                var ts = typeof payload === 'number'
                            ? tasks.splice(0, payload)
                            : tasks.splice(0, tasks.length);

                var ds = _map(ts, function (task) {
                    return task.data;
                });

                if(cargo.empty) cargo.empty();
                working = true;
                worker(ds, function () {
                    working = false;

                    var args = arguments;
                    _each(ts, function (data) {
                        if (data.callback) {
                            data.callback.apply(null, args);
                        }
                    });

                    process();
                });
            },
            length: function () {
                return tasks.length;
            },
            running: function () {
                return working;
            }
        };
        return cargo;
    };

    var _console_fn = function (name) {
        return function (fn) {
            var args = Array.prototype.slice.call(arguments, 1);
            fn.apply(null, args.concat([function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (typeof console !== 'undefined') {
                    if (err) {
                        if (console.error) {
                            console.error(err);
                        }
                    }
                    else if (console[name]) {
                        _each(args, function (x) {
                            console[name](x);
                        });
                    }
                }
            }]));
        };
    };
    async.log = _console_fn('log');
    async.dir = _console_fn('dir');
    /*async.info = _console_fn('info');
    async.warn = _console_fn('warn');
    async.error = _console_fn('error');*/

    async.memoize = function (fn, hasher) {
        var memo = {};
        var queues = {};
        hasher = hasher || function (x) {
            return x;
        };
        var memoized = function () {
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            var key = hasher.apply(null, args);
            if (key in memo) {
                async.nextTick(function () {
                    callback.apply(null, memo[key]);
                });
            }
            else if (key in queues) {
                queues[key].push(callback);
            }
            else {
                queues[key] = [callback];
                fn.apply(null, args.concat([function () {
                    memo[key] = arguments;
                    var q = queues[key];
                    delete queues[key];
                    for (var i = 0, l = q.length; i < l; i++) {
                      q[i].apply(null, arguments);
                    }
                }]));
            }
        };
        memoized.memo = memo;
        memoized.unmemoized = fn;
        return memoized;
    };

    async.unmemoize = function (fn) {
      return function () {
        return (fn.unmemoized || fn).apply(null, arguments);
      };
    };

    async.times = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.map(counter, iterator, callback);
    };

    async.timesSeries = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.mapSeries(counter, iterator, callback);
    };

    async.seq = function (/* functions... */) {
        var fns = arguments;
        return function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            async.reduce(fns, args, function (newargs, fn, cb) {
                fn.apply(that, newargs.concat([function () {
                    var err = arguments[0];
                    var nextargs = Array.prototype.slice.call(arguments, 1);
                    cb(err, nextargs);
                }]))
            },
            function (err, results) {
                callback.apply(that, [err].concat(results));
            });
        };
    };

    async.compose = function (/* functions... */) {
      return async.seq.apply(null, Array.prototype.reverse.call(arguments));
    };

    var _applyEach = function (eachfn, fns /*args...*/) {
        var go = function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            return eachfn(fns, function (fn, cb) {
                fn.apply(that, args.concat([cb]));
            },
            callback);
        };
        if (arguments.length > 2) {
            var args = Array.prototype.slice.call(arguments, 2);
            return go.apply(this, args);
        }
        else {
            return go;
        }
    };
    async.applyEach = doParallel(_applyEach);
    async.applyEachSeries = doSeries(_applyEach);

    async.forever = function (fn, callback) {
        function next(err) {
            if (err) {
                if (callback) {
                    return callback(err);
                }
                throw err;
            }
            fn(next);
        }
        next();
    };

    // Node.js
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = async;
    }
    // AMD / RequireJS
    else if (typeof define !== 'undefined' && define.amd) {
        define([], function () {
            return async;
        });
    }
    // included directly via <script> tag
    else {
        root.async = async;
    }

}());
(function() {
    function require(path, parent, orig) {
        var resolved = require.resolve(path);
        if (null == resolved) {
            orig = orig || path;
            parent = parent || "root";
            var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
            err.path = orig;
            err.parent = parent;
            err.require = true;
            throw err
        }
        var module = require.modules[resolved];
        if (!module._resolving && !module.exports) {
            var mod = {};
            mod.exports = {};
            mod.client = mod.component = true;
            module._resolving = true;
            module.call(this, mod.exports, require.relative(resolved), mod);
            delete module._resolving;
            module.exports = mod.exports
        }
        return module.exports
    }
    require.modules = {};
    require.aliases = {};
    require.resolve = function(path) {
        if (path.charAt(0) === "/") path = path.slice(1);
        var paths = [path, path + ".js", path + ".json", path + "/index.js", path + "/index.json"];
        for (var i = 0; i < paths.length; i++) {
            var path = paths[i];
            if (require.modules.hasOwnProperty(path)) return path;
            if (require.aliases.hasOwnProperty(path)) return require.aliases[path]
        }
    };
    require.normalize = function(curr, path) {
        var segs = [];
        if ("." != path.charAt(0)) return path;
        curr = curr.split("/");
        path = path.split("/");
        for (var i = 0; i < path.length; ++i) {
            if (".." == path[i]) {
                curr.pop()
            } else if ("." != path[i] && "" != path[i]) {
                segs.push(path[i])
            }
        }
        return curr.concat(segs).join("/")
    };
    require.register = function(path, definition) {
        require.modules[path] = definition
    };
    require.alias = function(from, to) {
        if (!require.modules.hasOwnProperty(from)) {
            throw new Error('Failed to alias "' + from + '", it does not exist')
        }
        require.aliases[to] = from
    };
    require.relative = function(parent) {
        var p = require.normalize(parent, "..");

        function lastIndexOf(arr, obj) {
            var i = arr.length;
            while (i--) {
                if (arr[i] === obj) return i
            }
            return -1
        }

        function localRequire(path) {
            var resolved = localRequire.resolve(path);
            return require(resolved, parent, path)
        }
        localRequire.resolve = function(path) {
            var c = path.charAt(0);
            if ("/" == c) return path.slice(1);
            if ("." == c) return require.normalize(p, path);
            var segs = parent.split("/");
            var i = lastIndexOf(segs, "deps") + 1;
            if (!i) i = 0;
            path = segs.slice(0, i + 1).join("/") + "/deps/" + path;
            return path
        };
        localRequire.exists = function(path) {
            return require.modules.hasOwnProperty(localRequire.resolve(path))
        };
        return localRequire
    };
    require.register("component-transform-property/index.js", function(exports, require, module) {
        var styles = ["webkitTransform", "MozTransform", "msTransform", "OTransform", "transform"];
        var el = document.createElement("p");
        var style;
        for (var i = 0; i < styles.length; i++) {
            style = styles[i];
            if (null != el.style[style]) {
                module.exports = style;
                break
            }
        }
    });
    require.register("component-has-translate3d/index.js", function(exports, require, module) {
        var prop = require("transform-property");
        if (!prop || !window.getComputedStyle) return module.exports = false;
        var map = {
            webkitTransform: "-webkit-transform",
            OTransform: "-o-transform",
            msTransform: "-ms-transform",
            MozTransform: "-moz-transform",
            transform: "transform"
        };
        var el = document.createElement("div");
        el.style[prop] = "translate3d(1px,1px,1px)";
        document.body.insertBefore(el, null);
        var val = getComputedStyle(el).getPropertyValue(map[prop]);
        document.body.removeChild(el);
        module.exports = null != val && val.length && "none" != val
    });
    require.register("yields-has-transitions/index.js", function(exports, require, module) {
        exports = module.exports = function(el) {
            switch (arguments.length) {
                case 0:
                    return bool;
                case 1:
                    return bool ? transitions(el) : bool
            }
        };

        function transitions(el, styl) {
            if (el.transition) return true;
            styl = window.getComputedStyle(el);
            return !!parseFloat(styl.transitionDuration, 10)
        }
        var styl = document.body.style;
        var bool = "transition" in styl || "webkitTransition" in styl || "MozTransition" in styl || "msTransition" in styl
    });
    require.register("component-event/index.js", function(exports, require, module) {
        exports.bind = function(el, type, fn, capture) {
            if (el.addEventListener) {
                el.addEventListener(type, fn, capture || false)
            } else {
                el.attachEvent("on" + type, fn)
            }
            return fn
        };
        exports.unbind = function(el, type, fn, capture) {
            if (el.removeEventListener) {
                el.removeEventListener(type, fn, capture || false)
            } else {
                el.detachEvent("on" + type, fn)
            }
            return fn
        }
    });
    require.register("ecarter-css-emitter/index.js", function(exports, require, module) {
        var events = require("event");
        var watch = ["transitionend", "webkitTransitionEnd", "oTransitionEnd", "MSTransitionEnd", "animationend", "webkitAnimationEnd", "oAnimationEnd", "MSAnimationEnd"];
        module.exports = CssEmitter;

        function CssEmitter(element) {
            if (!(this instanceof CssEmitter)) return new CssEmitter(element);
            this.el = element
        }
        CssEmitter.prototype.bind = function(fn) {
            for (var i = 0; i < watch.length; i++) {
                events.bind(this.el, watch[i], fn)
            }
        };
        CssEmitter.prototype.unbind = function(fn) {
            for (var i = 0; i < watch.length; i++) {
                events.unbind(this.el, watch[i], fn)
            }
        }
    });
    require.register("component-once/index.js", function(exports, require, module) {
        var n = 0;
        var global = function() {
            return this
        }();
        module.exports = function(fn) {
            var id = n++;
            var called;

            function once() {
                if (this == global) {
                    if (called) return;
                    called = true;
                    return fn.apply(this, arguments)
                }
                var key = "__called_" + id + "__";
                if (this[key]) return;
                this[key] = true;
                return fn.apply(this, arguments)
            }
            return once
        }
    });
    require.register("yields-after-transition/index.js", function(exports, require, module) {
        var has = require("has-transitions"),
            emitter = require("css-emitter"),
            once = require("once");
        var supported = has();
        module.exports = after;

        function after(el, fn) {
            if (!supported || !has(el)) return fn();
            emitter(el).bind(fn);
            return fn
        }
        after.once = function(el, fn) {
            var callback = once(fn);
            after(el, fn = function() {
                emitter(el).unbind(fn);
                callback()
            })
        }
    });
    require.register("component-indexof/index.js", function(exports, require, module) {
        module.exports = function(arr, obj) {
            if (arr.indexOf) return arr.indexOf(obj);
            for (var i = 0; i < arr.length; ++i) {
                if (arr[i] === obj) return i
            }
            return -1
        }
    });
    require.register("component-emitter/index.js", function(exports, require, module) {
        var index = require("indexof");
        module.exports = Emitter;

        function Emitter(obj) {
            if (obj) return mixin(obj)
        }

        function mixin(obj) {
            for (var key in Emitter.prototype) {
                obj[key] = Emitter.prototype[key]
            }
            return obj
        }
        Emitter.prototype.on = Emitter.prototype.addEventListener = function(event, fn) {
            this._callbacks = this._callbacks || {};
            (this._callbacks[event] = this._callbacks[event] || []).push(fn);
            return this
        };
        Emitter.prototype.once = function(event, fn) {
            var self = this;
            this._callbacks = this._callbacks || {};

            function on() {
                self.off(event, on);
                fn.apply(this, arguments)
            }
            fn._off = on;
            this.on(event, on);
            return this
        };
        Emitter.prototype.off = Emitter.prototype.removeListener = Emitter.prototype.removeAllListeners = Emitter.prototype.removeEventListener = function(event, fn) {
            this._callbacks = this._callbacks || {};
            if (0 == arguments.length) {
                this._callbacks = {};
                return this
            }
            var callbacks = this._callbacks[event];
            if (!callbacks) return this;
            if (1 == arguments.length) {
                delete this._callbacks[event];
                return this
            }
            var i = index(callbacks, fn._off || fn);
            if (~i) callbacks.splice(i, 1);
            return this
        };
        Emitter.prototype.emit = function(event) {
            this._callbacks = this._callbacks || {};
            var args = [].slice.call(arguments, 1),
                callbacks = this._callbacks[event];
            if (callbacks) {
                callbacks = callbacks.slice(0);
                for (var i = 0, len = callbacks.length; i < len; ++i) {
                    callbacks[i].apply(this, args)
                }
            }
            return this
        };
        Emitter.prototype.listeners = function(event) {
            this._callbacks = this._callbacks || {};
            return this._callbacks[event] || []
        };
        Emitter.prototype.hasListeners = function(event) {
            return !!this.listeners(event).length
        }
    });
    require.register("yields-css-ease/index.js", function(exports, require, module) {
        module.exports = {
            "in": "ease-in",
            out: "ease-out",
            "in-out": "ease-in-out",
            snap: "cubic-bezier(0,1,.5,1)",
            linear: "cubic-bezier(0.250, 0.250, 0.750, 0.750)",
            "ease-in-quad": "cubic-bezier(0.550, 0.085, 0.680, 0.530)",
            "ease-in-cubic": "cubic-bezier(0.550, 0.055, 0.675, 0.190)",
            "ease-in-quart": "cubic-bezier(0.895, 0.030, 0.685, 0.220)",
            "ease-in-quint": "cubic-bezier(0.755, 0.050, 0.855, 0.060)",
            "ease-in-sine": "cubic-bezier(0.470, 0.000, 0.745, 0.715)",
            "ease-in-expo": "cubic-bezier(0.950, 0.050, 0.795, 0.035)",
            "ease-in-circ": "cubic-bezier(0.600, 0.040, 0.980, 0.335)",
            "ease-in-back": "cubic-bezier(0.600, -0.280, 0.735, 0.045)",
            "ease-out-quad": "cubic-bezier(0.250, 0.460, 0.450, 0.940)",
            "ease-out-cubic": "cubic-bezier(0.215, 0.610, 0.355, 1.000)",
            "ease-out-quart": "cubic-bezier(0.165, 0.840, 0.440, 1.000)",
            "ease-out-quint": "cubic-bezier(0.230, 1.000, 0.320, 1.000)",
            "ease-out-sine": "cubic-bezier(0.390, 0.575, 0.565, 1.000)",
            "ease-out-expo": "cubic-bezier(0.190, 1.000, 0.220, 1.000)",
            "ease-out-circ": "cubic-bezier(0.075, 0.820, 0.165, 1.000)",
            "ease-out-back": "cubic-bezier(0.175, 0.885, 0.320, 1.275)",
            "ease-out-quad": "cubic-bezier(0.455, 0.030, 0.515, 0.955)",
            "ease-out-cubic": "cubic-bezier(0.645, 0.045, 0.355, 1.000)",
            "ease-in-out-quart": "cubic-bezier(0.770, 0.000, 0.175, 1.000)",
            "ease-in-out-quint": "cubic-bezier(0.860, 0.000, 0.070, 1.000)",
            "ease-in-out-sine": "cubic-bezier(0.445, 0.050, 0.550, 0.950)",
            "ease-in-out-expo": "cubic-bezier(1.000, 0.000, 0.000, 1.000)",
            "ease-in-out-circ": "cubic-bezier(0.785, 0.135, 0.150, 0.860)",
            "ease-in-out-back": "cubic-bezier(0.680, -0.550, 0.265, 1.550)"
        }
    });
    require.register("component-query/index.js", function(exports, require, module) {
        function one(selector, el) {
            return el.querySelector(selector)
        }
        exports = module.exports = function(selector, el) {
            el = el || document;
            return one(selector, el)
        };
        exports.all = function(selector, el) {
            el = el || document;
            return el.querySelectorAll(selector)
        };
        exports.engine = function(obj) {
            if (!obj.one) throw new Error(".one callback required");
            if (!obj.all) throw new Error(".all callback required");
            one = obj.one;
            exports.all = obj.all;
            return exports
        }
    });
    require.register("move/index.js", function(exports, require, module) {
        var after = require("after-transition");
        var has3d = require("has-translate3d");
        var Emitter = require("emitter");
        var ease = require("css-ease");
        var query = require("query");
        var translate = has3d ? ["translate3d(", ", 0)"] : ["translate(", ")"];
        module.exports = Move;
        var style = window.getComputedStyle || window.currentStyle;
        Move.version = "0.3.2";
        Move.ease = ease;
        Move.defaults = {
            duration: 500
        };
        Move.select = function(selector) {
            if ("string" != typeof selector) return selector;
            return query(selector)
        };

        function Move(el) {
            if (!(this instanceof Move)) return new Move(el);
            if ("string" == typeof el) el = query(el);
            if (!el) throw new TypeError("Move must be initialized with element or selector");
            this.el = el;
            this._props = {};
            this._rotate = 0;
            this._transitionProps = [];
            this._transforms = [];
            this.duration(Move.defaults.duration)
        }
        Emitter(Move.prototype);
        Move.prototype.transform = function(transform) {
            this._transforms.push(transform);
            return this
        };
        Move.prototype.skew = function(x, y) {
            return this.transform("skew(" + x + "deg, " + (y || 0) + "deg)")
        };
        Move.prototype.skewX = function(n) {
            return this.transform("skewX(" + n + "deg)")
        };
        Move.prototype.skewY = function(n) {
            return this.transform("skewY(" + n + "deg)")
        };
        Move.prototype.translate = Move.prototype.to = function(x, y) {
            return this.transform(translate.join("" + x + "px, " + (y || 0) + "px"))
        };
        Move.prototype.translateX = Move.prototype.x = function(n) {
            return this.transform("translateX(" + n + "px)")
        };
        Move.prototype.translateY = Move.prototype.y = function(n) {
            return this.transform("translateY(" + n + "px)")
        };
        Move.prototype.scale = function(x, y) {
            return this.transform("scale(" + x + ", " + (y || x) + ")")
        };
        Move.prototype.scaleX = function(n) {
            return this.transform("scaleX(" + n + ")")
        };
        Move.prototype.scaleY = function(n) {
            return this.transform("scaleY(" + n + ")")
        };
        Move.prototype.rotate = function(n) {
            return this.transform("rotate(" + n + "deg)")
        };
        Move.prototype.ease = function(fn) {
            fn = ease[fn] || fn || "ease";
            return this.setVendorProperty("transition-timing-function", fn)
        };
        Move.prototype.animate = function(name, props) {
            for (var i in props) {
                if (props.hasOwnProperty(i)) {
                    this.setVendorProperty("animation-" + i, props[i])
                }
            }
            return this.setVendorProperty("animation-name", name)
        };
        Move.prototype.duration = function(n) {
            n = this._duration = "string" == typeof n ? parseFloat(n) * 1e3 : n;
            return this.setVendorProperty("transition-duration", n + "ms")
        };
        Move.prototype.delay = function(n) {
            n = "string" == typeof n ? parseFloat(n) * 1e3 : n;
            return this.setVendorProperty("transition-delay", n + "ms")
        };
        Move.prototype.setProperty = function(prop, val) {
            this._props[prop] = val;
            return this
        };
        Move.prototype.setVendorProperty = function(prop, val) {
            this.setProperty("-webkit-" + prop, val);
            this.setProperty("-moz-" + prop, val);
            this.setProperty("-ms-" + prop, val);
            this.setProperty("-o-" + prop, val);
            return this
        };
        Move.prototype.set = function(prop, val) {
            this.transition(prop);
            this._props[prop] = val;
            return this
        };
        Move.prototype.add = function(prop, val) {
            if (!style) return;
            var self = this;
            return this.on("start", function() {
                var curr = parseInt(self.current(prop), 10);
                self.set(prop, curr + val + "px")
            })
        };
        Move.prototype.sub = function(prop, val) {
            if (!style) return;
            var self = this;
            return this.on("start", function() {
                var curr = parseInt(self.current(prop), 10);
                self.set(prop, curr - val + "px")
            })
        };
        Move.prototype.current = function(prop) {
            return style(this.el).getPropertyValue(prop)
        };
        Move.prototype.transition = function(prop) {
            if (!this._transitionProps.indexOf(prop)) return this;
            this._transitionProps.push(prop);
            return this
        };
        Move.prototype.applyProperties = function() {
            for (var prop in this._props) {
                this.el.style.setProperty(prop, this._props[prop])
            }
            return this
        };
        Move.prototype.move = Move.prototype.select = function(selector) {
            this.el = Move.select(selector);
            return this
        };
        Move.prototype.then = function(fn) {
            if (fn instanceof Move) {
                this.on("end", function() {
                    fn.end()
                })
            } else if ("function" == typeof fn) {
                this.on("end", fn)
            } else {
                var clone = new Move(this.el);
                clone._transforms = this._transforms.slice(0);
                this.then(clone);
                clone.parent = this;
                return clone
            }
            return this
        };
        Move.prototype.pop = function() {
            return this.parent
        };
        Move.prototype.reset = function() {
            this.el.style.webkitTransitionDuration = this.el.style.mozTransitionDuration = this.el.style.msTransitionDuration = this.el.style.oTransitionDuration = 0;
            return this
        };
        Move.prototype.end = function(fn) {
            var self = this;
            this.emit("start");
            if (this._transforms.length) {
                this.setVendorProperty("transform", this._transforms.join(" "))
            }
            this.setVendorProperty("transition-properties", this._transitionProps.join(", "));
            this.applyProperties();
            if (fn) this.then(function () {
              fn(this);
            });
            after.once(this.el, function() {
                self.reset();
                self.emit("end")
            });
            return this
        }
    });
    require.alias("component-has-translate3d/index.js", "move/deps/has-translate3d/index.js");
    require.alias("component-has-translate3d/index.js", "has-translate3d/index.js");
    require.alias("component-transform-property/index.js", "component-has-translate3d/deps/transform-property/index.js");
    require.alias("yields-after-transition/index.js", "move/deps/after-transition/index.js");
    require.alias("yields-after-transition/index.js", "move/deps/after-transition/index.js");
    require.alias("yields-after-transition/index.js", "after-transition/index.js");
    require.alias("yields-has-transitions/index.js", "yields-after-transition/deps/has-transitions/index.js");
    require.alias("yields-has-transitions/index.js", "yields-after-transition/deps/has-transitions/index.js");
    require.alias("yields-has-transitions/index.js", "yields-has-transitions/index.js");
    require.alias("ecarter-css-emitter/index.js", "yields-after-transition/deps/css-emitter/index.js");
    require.alias("component-emitter/index.js", "ecarter-css-emitter/deps/emitter/index.js");
    require.alias("component-indexof/index.js", "component-emitter/deps/indexof/index.js");
    require.alias("component-event/index.js", "ecarter-css-emitter/deps/event/index.js");
    require.alias("component-once/index.js", "yields-after-transition/deps/once/index.js");
    require.alias("yields-after-transition/index.js", "yields-after-transition/index.js");
    require.alias("component-emitter/index.js", "move/deps/emitter/index.js");
    require.alias("component-emitter/index.js", "emitter/index.js");
    require.alias("component-indexof/index.js", "component-emitter/deps/indexof/index.js");
    require.alias("yields-css-ease/index.js", "move/deps/css-ease/index.js");
    require.alias("yields-css-ease/index.js", "move/deps/css-ease/index.js");
    require.alias("yields-css-ease/index.js", "css-ease/index.js");
    require.alias("yields-css-ease/index.js", "yields-css-ease/index.js");
    require.alias("component-query/index.js", "move/deps/query/index.js");
    require.alias("component-query/index.js", "query/index.js");
    if (typeof exports == "object") {
        module.exports = require("move")
    } else if (typeof define == "function" && define.amd) {
        define(function() {
            return require("move")
        })
    } else {
        this["move"] = require("move")
    }
})();


function $ (selector, el) {
  if (!el) { el = document; }
  return el.querySelector(selector);
}

function $_ (selector, el) {
  if (!el) { el = document; }
  return Array.prototype.slice.call(el.querySelectorAll(selector));
}

function getRandomRange(min, max) {
    return Math.random() * (max - min) + min;
}

// { element, content, speed, variance }
function type (opts, callback) {
  var char = opts.content.pop();
  var naturalSpeed = (char === ' ') ?
    getRandomRange(opts.speed - opts.variance, opts.speed + opts.variance) * 3 :
    getRandomRange(opts.speed - opts.variance, opts.speed + opts.variance);
  opts.element.value = opts.element.value + char;
  console.log(opts.element, opts.content, opts.speed, opts.variance);
  if (opts.content.length) {
    setTimeout(function () {
      type(opts, callback);
    }, naturalSpeed);
  } else {
    if (callback) { return callback(); }
  }
}

// move('.Demo-cursor--wand')
//   .duration('1s')
//   .x(20)
//   .then()
//     .duration('0s')
//     .set('opacity', 0)
//   .pop()
// .end();

// move('.Demo-cursor--wand-active')
//   .duration('1s')
//   .x(20)
//   .then()
//     .duration('0s')
//     .set('opacity', 1)
//   .pop()
// .end();

moveWandToTip();


function moveWandToTip () {
  move('.Demo-cursor--wand')
    .duration('1s')
    .x(20)
    .end(function (that) {
      that.el.classList.add('Demo-cursor--wand-active');
      move('.Media-username.kabosu')
        .delay('0s')
        .duration('0s')
        .set('color', 'purple')
        .end(showTipModal);
    });
}


function clickInput () {
  move('.btn-primary .Demo-cursor--normal')
    .duration('1s')
    .x(0)
    .y(20)
    .end(function (that) {
      that.el.classList.add('Demo-cursor--normal-active');
      move('.Media-username.kabosu')
        .delay('0s')
        .duration('0s')
        .set('color', 'purple')
        .end(showTipModal);
    });
}


function showTipModal () {
  async.parallel(
    [
      function (cb) {
        move('.Demo-modal-backdrop')
          .delay('1.2s')
          .duration('0.2s')
          .set('opacity', 0.5)
          .end(cb);
      },
      function (cb) {
        move('.Demo-tip-modal')
          .delay('1.2s')
          .duration('0.2s')
          .set('opacity', 1)
          .end(cb);
      }
    ],

    typeAmount
  );
}


function typeAmount () {
  $('.Demo-tip-modal input').classList.add('focus');
  type({
    element: $('.Demo-tip-modal input'),
    content: '3000'.split('').reverse(),
    speed: 160,
    variance: 30
  }, hideTipModal);
}


function hideTipModal () {
  move('.Demo-tip-modal')
    .delay('2s')
    .duration('0.001s')
    .set('opacity', 0)
    .end(showConfModal);
}


function showConfModal () {
  $('.Demo-conf-modal textarea').focus();
  move('.Demo-conf-modal')
    .delay('0s')
    .duration('0.001s')
    .set('opacity', 1)
    .then()
      .delay('3s')
      .duration('0s')
      .set('opacity', 1)
      .pop()
    .end(typeMessage);
}

// function hideConfModal () {
//   move('.Demo-conf-modal')
//     .delay('3s')
//     .duration('0.001s')
//     .set('opacity', 1)
//     .end(typeMessage);
// }

function typeMessage () {
  type({
    element: $('.Media-body textarea'),
    content: 'Wow. Such beautiful. So cry right now. Have coin:'.split('').reverse(),
    speed: 160,
    variance: 30
  }, pasteLink);
}

// move('.Media-username.kabosu')
//   .delay('1s')
//   .duration('0s')
//   .set('color', 'purple')
// .end();

// move('.Demo-tip-modal')
//   .delay('1.2s')
//   .duration('0s')
//   .set('opacity', 1)
// .end();

// move('.Demo-modal-backdrop')
//   .delay('1.2s')
//   .duration('0.2s')
//   .set('opacity', 0.5)
// .end(function () {
  // $('.Demo-tip-modal input').classList.add('focus');
  // type({
  //   element: $('.Demo-tip-modal input'),
  //   content: '3000'.split('').reverse(),
  //   speed: 160,
  //   variance: 30
  // }, clickModalBtn);
// });

// function clickModalBtn () {
//   move('.Demo-cursor--normal')
//     .duration('1s')
//     .x(100)
//     .end(function (that) {
//       that.el.classList.add('Demo-cursor--normal-active');
//       that.el.classList.remove('Demo-cursor--normal');
//       move('.Demo-tip-modal-button')
//         .delay('1.2s')
//         .end(function (that) {
//           console.log(that)
//           that.el.classList.add('active');
//         });
//     });
// }







// move('#example-13 .box2')
//   .set('background-color', 'red')
//   .x(50)
//   .rotate(60)
//     .then()
//       .rotate(30)
//       .scale(1.5)
//       .then()
//         .set('opacity', 0)
//       .pop()
//     .pop()
// .end();