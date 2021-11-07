namespace(
    'app.State',

    use(
        'app.ton.Bridge'
    ),

    (Bridge) => {
        let state = {
            chain_id: null,
            interval: null,
            data:     {},

            init() {
                return {
                    step:       0,
                    direction:  1,
                    amount:     0,
                    block:      0,
                    address:    null,
                    createTime: null,
                    swapId:     null,
                    swapData:   null,
                    queryId:    null,
                    votes:      [],
                    minted:     false, // toCurrencySent
                    burned:     false, // fromCurrencySent
                };
            },

            clean() {
                state.updateStop().data = state.init();
                return state;
            },

            save() {
                Debug.log('[ State::save ]', state.chain_id);
                localStorage.setItem('state_' + state.chain_id, JSON.stringify(state.data));
                return state.updateStart();
            },

            load(chain_id) {
                Debug.log('[ State::load ]', chain_id);
                state.chain_id = chain_id;
                const raw = localStorage.getItem('state_' + chain_id) || null;
                state.data = raw ? JSON.parse(raw) : state.init();
                return state.updateRestart().update();
            },

            isStep(step) {
                return -(-step) === -(-state.data.step);
            },

            isTonToEth() {
                return state.data.direction > 0;
            },

            isEthToTon() {
                return state.data.direction < 0;
            },

            updateStart() {
                if (state.interval !== null) { return; }
                state.interval = setInterval(state.update, 5000);
                return state;
            },

            updateStop() {
                if (state.interval === null) { return state; }
                clearInterval(state.interval);
                state.interval = null;
                return state;
            },

            updateRestart() {
                return state.updateStop().updateStart();
            },

            async update() {
                Debug.log('[ State::update ]', state.data);
                if (state.isStep(1) && state.isTonToEth()) {
                    const swap = await Bridge.getSwap(state.data.amount, state.data.address, state.data.createTime);
                    Debug.log('[ State::update::swap ]', swap);
                    if (swap) {
                        state.data.swapId   = Bridge.getSwapTonToEthId(swap);
                        state.data.swapData = swap;
                        state.data.step     = 2;
                        state.save();
                    }
                }
                if (state.isStep(2)) {
                    state.data.votes = state.isTonToEth() ? await Bridge.getEthVote(state.data.swapId) : await Bridge.getTonVote(state.data.queryId);
                    Debug.log('[ State::update::votes ]', state.data.votes);
                    const votesLength = state.data.votes ? state.data.votes.length : 0;
                    if (votesLength >= Bridge.getOracles() * 2 / 3) {
                        state.data.step = state.isTonToEth() ? 3 : 4;
                        state.save();
                    }
                }
            }
        };
        return state;
    }
);