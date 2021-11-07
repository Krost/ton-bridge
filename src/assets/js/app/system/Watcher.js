namespace('app.system.Watcher', function(item) {
    var self      = this;
    var $item     = item;
    var $interval = 0;
    var $props    = {};

    // Main loop
    function $loop() {
        for (var name in $props) {
            var oldvalue = $props[name].value;
            if (oldvalue !== JSON.stringify($item[name])) {
                $props[name].value = JSON.stringify($item[name]);
                $props[name].callback.map(function(callback) {
                    callback.call($item, item[name], oldvalue, name);
                });
            }
        }
    }

    // Add methods to item
    Object.assign($item, {
        $watch: function(name, callback) {
            name.split('|').map(function(_name) {
                if ($props[_name] !== undefined) {
                    $props[_name].callback.push(callback);
                } else {
                    $props[_name] = {
                        value:    JSON.stringify($item[_name] || false),
                        callback: [callback],
                    }
                }
            });
            return $item;
        },

        $unwatch: function(name) {
            if ($props[name] !== undefined) {
                delete $props[name];
            }
            return $item;
        }
    });

    // Add methods to this object
    Object.assign(this, {
        $start: function() {
            $interval = $interval ? $interval : setInterval($loop, 1);
            return self;
        },

        $stop: function() {
            if ($interval) {
                clearInterval($interval);
                $interval = 0;
            }
            return self;
        }
    }).$start.call(this);
});