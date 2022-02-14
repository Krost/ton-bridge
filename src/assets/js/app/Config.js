namespace('app.Config', {
    // Mainnet
    1: {
        name:              'Ethereum Mainnet',
        network:           'eth',
        is_testnet:        false,
        wton_address:      '0x582d872a1b094fc48f5de31d3b73f2d9be47def1',
        bridge_address:    'Ef_dJMSh8riPi3BTUTtcxsWjG8RLKnLctNjAM4rw8NN-xWdr',
        collector_address: 'EQCuzvIOXLjH2tv35gY4tzhIvXCqZWDuK9kUhFGXKLImgxT5',
        multisig_address:  'kf87m7_QrVM4uXAPCDM4DuF9Rj5Rwa5nHubwiQG96JmyAo-S',
        toncenter_url:     'https://wallet.toncenter.com/api/v2/jsonRPC',
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
        multisig_address:  'kf9rkj49lXch15cbC7q-_b04HFF0L0XRyoKo-fEQU6sfL7I5',
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
        multisig_address:  'kf8OvX_5ynDgbp4iqJIvWudSEanWo0qAlOjhWHtga9u2Yo7j',
        toncenter_url:     'https://wallet.toncenter.com/api/v2/jsonRPC',
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
        multisig_address:  'Ef8_p_O8fAYRU8pYkiKMh4ndQzw30SEnegy0m7vYN2unnR-W',
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
    tokenType() {
        return this.isEthNetwork() ? 'ERC20' : 'BEP-20';
    },

    isConfigAddress(address) {
        address = address.toLowerCase();
        return (address === this.get().wton_address.toLowerCase())      ||
            (address === this.get().bridge_address.toLowerCase())    ||
            (address === this.get().collector_address.toLowerCase()) ||
            (address === this.get().multisig_address.toLowerCase());
    }
});