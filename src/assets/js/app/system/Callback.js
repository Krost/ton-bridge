namespace('app.system.Callback', function(item) {
    var self  = this;
    var $item = item;
    var $data = {};

    /**
     * Private methods
     */
    function $doEmit(group, data, name) {
        name = name || '';
        ($data[group] || []).map(function(callback) {
            callback.call($item, data, name, group);
        });
        return self;
    }

    /**
     * Public methods
     */
    function $on(group, callback, prepend) {
        prepend  = prepend || false;
        var func = prepend ? 'unshift' : 'push';
        group.split('|').map(function(_group) {
            $data[_group] = $data[_group] || [];
            $data[_group][func](callback);
        });
        return $item;
    }

    function $emit(group, data) {
        group.split('|').map(function(_group) {
            _group     = _group.split(':');
            var name   = [];
            var ngroup = false;
            do {
                if (ngroup) name.unshift(ngroup);
                $doEmit(_group.join(':') + (ngroup ? ':*' : ''), data, name.join(':'));
            } while(ngroup = _group.pop());
        });
        return $item;
    }

    // Push methods to item
    Object.assign($item, {
        $on:   $on,
        $emit: $emit
    });
});