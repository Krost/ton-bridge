namespace(
    'app.ton.Bridge',

    use(
        'app.Config',
        'app.component.Provider'
    ),

    (Config, Provider) => {
        let bridge = {
            ready: false,
            fee:  {
                flat:    null,
                network: null,
                factor:  null,
                base:    null,
            },
            gas: {
                eth: { 1: 220000, '-1': 60000 },
                bsc: { 1: 200000, '-1': 60000 },
            },

            setReady(status) {
                bridge.ready = status;
                return bridge;
            },

            updateFee(feeData) {
                if (!!feeData) {
                    bridge.fee      = feeData;
                    bridge.fee.flat = bridge.fee.flat.add(bridge.fee.network);
                } else {
                    bridge.fee.flat    = null;
                    bridge.fee.network = null;
                    bridge.fee.factor  = null;
                    bridge.fee.base    = null;
                }
                return bridge;
            },

            getFeeAmount(amount) {
                const rest    = new BN(amount).sub(bridge.fee.flat);
                const percent = rest.mul(bridge.fee.factor).div(bridge.fee.base);
                return bridge.fee.flat.add(percent);
            },

            getFeeGas(type, direction) {
                return Provider.getGasPrice(bridge.gas[type][direction]);
            },

            getSwapTonToEthId(d) {
                let types = ['int', 'address', 'uint256', 'int8', 'bytes32', 'bytes32', 'uint64'];
                let data  = [0xDA7A, d.receiver, d.amount, d.tx.address_.workchain, d.tx.address_.address_hash, d.tx.tx_hash, d.tx.lt];
                if (!Config.isEthNetwork()) {
                    types.splice(1, 0, 'address');
                    data.splice(1, 0,  Config.get().wton_address);
                }
                return Web3.utils.sha3(Provider.web3.eth.abi.encodeParameters(types, data));
            },

            getOracles() {
                return Provider.oracles;
            },

            getConfirms() {
                return Provider.confirms;
            },

            async getSwap(myAmount, myToAddress, myCreateTime) {
                if (Provider.tonweb === null) { return null; }
                const transactions  = await Provider.tonweb.provider.getTransactions(Config.get().bridge_address, 40);
                Debug.log('[ Bridge::getSwap ]', transactions.length);
                const findLogOutMsg = (outMessages) => {
                    if (!outMessages) return null;
                    for (let outMsg of outMessages) {
                        if (outMsg.destination === '') return outMsg;
                    }
                    return null;
                };

                for (let tx of transactions) {
                    const logMsg = findLogOutMsg(tx.out_msgs);
                    if (logMsg) {
                        if (tx.utime * 1000 < myCreateTime) continue;

                        const message = logMsg.message.trim();
                        const bytes   = TonWeb.utils.base64ToBytes(message);
                        if (bytes.length !== 28) continue;

                        const amount             = new BN(TonWeb.utils.bytesToHex(bytes.slice(20, 28)), 16);
                        const destinationAddress = makeAddress('0x' + TonWeb.utils.bytesToHex(bytes.slice(0, 20)));
                        const senderAddress      = new TonWeb.utils.Address(tx.in_msg.source);
                        const swap               = {
                            type:     'SwapTonToEth',
                            receiver: destinationAddress,
                            amount:   amount.toString(),
                            tx:       {
                                address_: {
                                    workchain:    senderAddress.wc,
                                    address_hash: '0x' + TonWeb.utils.bytesToHex(senderAddress.hashPart),
                                },
                                tx_hash: '0x' + TonWeb.utils.bytesToHex(TonWeb.utils.base64ToBytes(tx.transaction_id.hash)),
                                lt:      tx.transaction_id.lt,
                            }
                        };

                        const myAmountNano   = new BN(myAmount * 1e9);
                        const amountAfterFee = myAmountNano.sub(bridge.getFeeAmount(myAmountNano));
                        if (amount.eq(amountAfterFee) && swap.receiver.toLowerCase() === myToAddress.toLowerCase()) {
                            return swap;
                        }
                    }
                }
                return null;
            },

            async getEthVote(voteId) {
                if (Provider.tonweb === null) { return null; }
                const result = await Provider.tonweb.provider.call(Config.get().collector_address, 'get_external_voting_data', [['num', voteId]]);
                Debug.log('[ Bridge::getEthVote ]', result);
                if (result.exit_code === 309) return null;
                const list = result.stack[0][1].elements;
                return list.map(parseEthSignature);
            },

            async getTonVote(queryId) {
                if (Provider.tonweb === null) { return null; }
                const result = await Provider.tonweb.provider.call(Config.get().multisig_address, 'get_query_state', [['num', queryId]]);
                Debug.log('[ Bridge::getToneVote ]', result);
                const a      = getNumber(result.stack[0]);
                const b      = getNumber(result.stack[1]);
                const arr    = [];
                const count  = a === -1 ? Provider.oracles : b.toString(2).split('0').join('').length;
                for (let i = 0; i < count; i++) { arr.push(1); }
                return arr;
            },

            async mint(swap, votes) {
                let receipt = null;
                try {
                    let signatures = votes.map(v => {
                        return {
                            signer:    v.publicKey,
                            signature: joinSignature({r: v.r, s: v.s, v: v.v})
                        }
                    });

                    signatures = signatures.sort((a, b) => {
                        return new BN(a.signer.substr(2), 16).cmp(new BN(b.signer.substr(2), 16));
                    });

                    Debug.log('voteForMinting', JSON.stringify(swap), JSON.stringify(signatures));
                    receipt = await Provider.contract.methods.voteForMinting(swap, signatures).send({
                        from: Provider.account
                    }).on('transactionHash', hash => {
                        Provider.$emit(':bridge:minted');
                    });
                } catch(e) {
                    console.error(e);
                    return false;
                }
                return !!receipt.status;
            },

            async burn(amount, toAddress) {
                const fromAddress = Provider.account;
                const addressTon  = new TonWeb.utils.Address(toAddress);
                const workchain   = addressTon.wc;
                const hashPart    = TonWeb.utils.bytesToHex(addressTon.hashPart);
                const amountUnit  = toUnit(amount);
                let receipt;
                try {
                    receipt = await Provider.contract.methods.burn(amountUnit, {
                        workchain:    workchain,
                        address_hash: '0x' + hashPart,
                    }).send({ from: fromAddress }).on('transactionHash', hash => {
                        Provider.$emit(':bridge:burned');
                    });
                } catch(e) {
                    console.error(e);
                    return null;
                }

                if (receipt.status) {
                    Debug.log('receipt', receipt);
                    const blockNumber = receipt.blockNumber;
                    const logIndex    = receipt.events.SwapEthToTon.logIndex;
                    const block       = await Provider.web3.eth.getBlock(blockNumber);
                    const swap        = {
                        transactionHash: receipt.transactionHash,
                        logIndex:        logIndex,
                        blockNumber:     blockNumber,
                        blockTime:       Number(block.timestamp),
                        blockHash:       block.hash,
                        from:            fromAddress,
                        to:              {
                            workchain:    workchain,
                            address_hash: hashPart
                        },
                        value:           amountUnit
                    }
                    return {
                        swapId:  sha256(serializeEthToTon(swap)),
                        queryId: getQueryId(swap).toString(),
                        block:   blockNumber
                    };
                }
                return null;
            }
        };
        return bridge;
    }
);