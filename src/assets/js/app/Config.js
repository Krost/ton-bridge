namespace('app.Config', {
    // Mainnet
    1: {
        name:              'Ethereum Mainnet',
        network:           'eth',
        is_testnet:        false,
        wton_address:      '0x582d872a1b094fc48f5de31d3b73f2d9be47def1',
        bridge_address:    'Ef_dJMSh8riPi3BTUTtcxsWjG8RLKnLctNjAM4rw8NN-xWdr',
        collector_address: 'EQCuzvIOXLjH2tv35gY4tzhIvXCqZWDuK9kUhFGXKLImgxT5',
        multisig_address:  'kf8rV4RD7BD-j_C-Xsu8FBO9BOOOwISjNPbBC8tcq688Gcmk',
        toncenter_url:     'https://toncenter.com/api/v2/jsonRPC',
        explorer:          'https://etherscan.io/token/',
    },

    // Ropsten
    3: {
        name:              'Ethereum Ropsten',
        network:           'eth',
        is_testnet:        true,
        wton_address:      '0x10922606e41e5b7Fcca21e773B00f0436D4F941F',
        bridge_address:    'Ef_dJMSh8riPi3BTUTtcxsWjG8RLKnLctNjAM4rw8NN-xWdr',
        collector_address: 'UQCuzvIOXLjH2tv35gY4tzhIvXCqZWDuK9kUhFGXKLImg0k8',
        multisig_address:  'kf8seQ2TAIJJHhKRm8c5vyV6oDxUtZgwlhRRgZSlWnJaS37k',
        toncenter_url:     'https://testnet.toncenter.com/api/v2/jsonRPC',
        explorer:          'https://ropsten.etherscan.io/token/',
    },

    // Smart Chain - Mainnet
    56: {
        name:              'Binance Smart Chain Mainnet',
        network:           'bsc',
        is_testnet:        false,
        wton_address:      '0x76A797A59Ba2C17726896976B7B3747BfD1d220f',
        bridge_address:    'Ef9NXAIQs12t2qIZ-sRZ26D977H65Ol6DQeXc5_gUNaUys5r',
        collector_address: 'EQAHI1vGuw7d4WG-CtfDrWqEPNtmUuKjKFEFeJmZaqqfWTvW',
        multisig_address:  'kf8_gV8rpqtPl1vmYDrMzwxlGQDJ63SIKO8vDhNZHT5wwVhd',
        toncenter_url:     'https://toncenter.com/api/v2/jsonRPC',
        explorer:          'https://bscscan.com/token/',
    },

    // Smart Chain - Testnet
    97: {
        name:              'Binance Smart Chain Testnet',
        network:           'bsc',
        is_testnet:        true,
        wton_address:      '0xA345a7C8d88279165214f6dA6e857041902955C5',
        bridge_address:    'Ef9NXAIQs12t2qIZ-sRZ26D977H65Ol6DQeXc5_gUNaUys5r',
        collector_address: 'EQAHI1vGuw7d4WG-CtfDrWqEPNtmUuKjKFEFeJmZaqqfWTvW',
        multisig_address:  'kf-WJS6zJq8t02yQAGhHpdokmHTuKBjU44z4BV3hXANNifC2',
        toncenter_url:     'https://testnet.toncenter.com/api/v2/jsonRPC',
        explorer:          'https://testnet.bscscan.com/token/',
    },

    active: null,
    setActive(chain_id) {
        this.active = chain_id;
        Debug.log('[ Config::setActive ]', chain_id, this.get());
        return this;
    },
    get() {
        return this[this.active || 0] || null;
    },
    isEthNetwork() {
        return (this.get() || {}).network === 'eth';
    },
    isTestNet() {
        return (this.get() || {}).is_testnet === true;
    },
    isSupported() {
        return !!this.get();
    },
    contractAddr() {
        if (!this.isSupported()) { return ''; }
        return this.get().wton_address;
    },
    contractLink() {
        if (!this.isSupported()) { return ''; }
        return this.get().explorer + this.get().wton_address;
    },
    network() {
        return (this.get() || {}).network || null;
    },

    isConfigAddress(address) {
        address = address.toLowerCase();
        return (address === this.get().wton_address.toLowerCase())      ||
            (address === this.get().bridge_address.toLowerCase())    ||
            (address === this.get().collector_address.toLowerCase()) ||
            (address === this.get().multisig_address.toLowerCase());
    }
});