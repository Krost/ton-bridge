namespace(
    'app.component.Provider',

    use(
        'app.system.Callback',
        'app.system.Watcher',
    ),

    (Callback, Watcher) => {
        let provider = {
            connecting: false,
            connected:  false,
            ethereum:   null,
            tonweb:     null,
            web3:       null,
            contract:   null,
            oracles:    9,    // Default value if network not ready
            confirms:   12,
            chain_id:   null,
            account:    null,
            block:      0,
            gasprice:   0,
            balance:    { eth: 0, toncoin: 0 },

            async init() {
                provider.ethereum = window.ethereum || null;
                if (!provider.ethereum) { return; }

                provider.web3 = new Web3(provider.ethereum);

                provider.ethereum.on('chainChanged', provider.updateNetwork);
                provider.ethereum.on('accountsChanged', provider.updateAccounts);
                provider.web3.eth.subscribe('newBlockHeaders').on('data', provider.updateBlock);

                provider.updateNetwork(await provider.ethereum.request({ method: 'eth_chainId' }));
                provider.updateAccounts(await provider.ethereum.request({ method: 'eth_accounts' }));
            },

            updateNetwork(chain_id) {
                chain_id = parseInt(chain_id, 16);
                if (provider.chain_id !== chain_id) {
                    provider.chain_id = chain_id;
                    provider.$emit(':update:chain', chain_id);
                    provider.updateBalance();
                    provider.updateGasPrice();
                }
            },

            updateBlock(block) {
                provider.block = block.number;
                provider.$emit(':update:block', block.number);
                provider.updateGasPrice();
                provider.updateBalance();
                provider.updateBalanceContract();
            },

            updateAccounts(accounts) {
                provider.connected = accounts.length > 0 && accounts[0] === provider.ethereum.selectedAddress;
                provider.account = accounts[0];
                provider.$emit(':update:account', provider.account);
                provider.updateBalance();
                provider.updateBalanceContract();
            },

            async updateContract(abi, address) {
                provider.contract = provider.contract !== null ? null : null;
                provider.contract = new provider.web3.eth.Contract(abi, address);
                provider.oracles  = (await provider.contract.methods.getFullOracleSet().call()).length;
                provider.updateBalanceContract();
            },

            updateGasPrice() {
                provider.web3.eth.getGasPrice().then((result) => {
                    provider.gasprice = result;
                    provider.$emit(':update:gasprice', provider.gasprice);
                }).catch((error) => {});
            },

            updateBalance() {
                if (!provider.account) {
                    provider.balance.eth = 0;
                } else {
                    provider.web3.eth.getBalance(provider.account).then((result) => {
                        provider.balance.eth = balanceNum(provider.web3.utils.fromWei(result, 'ether'), 6);
                        provider.$emit(':update:balance', provider.balance.eth);
                    }).catch((error) => {});
                }
            },

            updateBalanceContract() {
                if (!provider.contract || !provider.account) {
                    provider.balance.toncoin = 0;
                } else {
                    provider.contract.methods.balanceOf(provider.account).call().then((result) => {
                        provider.balance.toncoin = balanceNum(provider.web3.utils.fromWei(result, 'nano'), 6);
                        provider.$emit(':update:balance', provider.balance.toncoin);
                    }).catch((error) => {});
                }
            },

            async updateTonWeb(ton_center_url, ton_bridge_address) {
                provider.tonweb = provider.tonweb !== null ? null : null;
                provider.tonweb = new TonWeb(new TonWeb.HttpProvider(ton_center_url));

                provider.$emit(':update:bridge', { ready: false, fee: null });
                const bridgeData = (await provider.tonweb.provider.call(ton_bridge_address, 'get_bridge_data', [])).stack || {};
                if (bridgeData.length !== 8) throw new Error('Invalid bridge data');
                const feeFlat    = new BN(getNumber(bridgeData[4]));
                const feeNetwork = new BN(getNumber(bridgeData[5]));
                const feeFactor  = new BN(getNumber(bridgeData[6]));
                const feeBase    = new BN(getNumber(bridgeData[7]));
                provider.$emit(':update:bridge', { ready: true, fee: { flat: feeFlat, network: feeNetwork, factor: feeFactor, base: feeBase }});
            },

            cleanContract() {
                provider.contract = null;
                return provider;
            },

            cleanTonWeb() {
                provider.tonweb = null;
                return provider;
            },

            connect() {
                provider.connecting = true;
                provider.ethereum.request({ method: 'eth_requestAccounts' }).then((accounts) => {
                    provider.updateAccounts(accounts);
                    provider.connecting = false;
                }).catch(() => { provider.connecting = false; });
            },

            getGasPrice(gas) {
                if (provider.gasprice <= 0) { return 0; }
                let BN    = provider.web3.utils.BN;
                let price = new BN(provider.gasprice).mul(new BN(gas));
                return balanceNum(provider.web3.utils.fromWei(price, 'ether'), 6);
            },

            isValidETHAddress(address) {
                return Web3.utils.isAddress(address);
            },

            isValidTONAddress(address) {
                return TonWeb.utils.Address.isValid(address);
            },
        };

        return Object.assign(provider, {
            $callback: new Callback(provider),
            $watcher:  new Watcher(provider),
        });
    }
);