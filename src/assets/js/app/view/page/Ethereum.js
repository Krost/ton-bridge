namespace(
    'app.view.page.Ethereum',

    use(
        'app.Config',
        'app.State',
        'app.view.Template',
        'app.component.Provider',
        'app.ton.Bridge',
    ),

    (Config, State, Template, Provider, Bridge) => {
        return (type) => {
            return {
                data() {
                    return {
                        type:      type,
                        direction: 1,
                        fee:       {
                            fixed:   5,
                            percent: 0.25,
                            result:  0,
                        },
                        form:      {
                            valid:   false,
                            error:   '',
                            from:    '',
                            to:      '',
                            address: '',
                        },
                        minting: false,
                    }
                },

                computed: {
                    metamask()     { return Provider.ethereum !== null;                  },
                    connected()    { return Provider.connected;                          },
                    connecting()   { return Provider.connecting;                         },
                    account()      { return Provider.account;                            },
                    balance()      { return Provider.balance;                            },
                    supported()    { return Config.network() === this.type;              },
                    networkName()  { return Config.get().name;                           },
                    isTestNet()    { return Config.isTestNet();                          },
                    contractAddr() { return Config.contractAddr();                       },
                    contractLink() { return Config.contractLink();                       },
                    feeString()    { return this.getFeeString(this.fee.result);          },
                    feeGas()       { return Bridge.getFeeGas(this.type, this.direction); },
                    isTypeEth()    { return this.type === 'eth';                         },
                    typeName()     { return this.type.toUpperCase();                     },
                    state()        { return State.data;                                  },
                    fromLabel() {
                        return this.direction > 0 ? 'TON (native)' : this.isTypeEth ? 'TON (ERC20)' : 'TON (BEP-20)';
                    },
                    toLabel() {
                        return this.direction < 0 ? 'TON (native)' : this.isTypeEth ? 'TON (ERC20)' : 'TON (BEP-20)';
                    },
                    receiverNetwork() {
                        return this.direction < 0 ? 'TON' : (this.isTypeEth ? 'Ethereum' : 'BSC');
                    },
                    rules() {
                        return [
                            [
                                'Amount must be at least 10 TON',
                                this.form.from >= 10,
                            ],
                            [
                                'Please enter YOUR address to receive',
                                !Config.isConfigAddress(this.form.address),
                            ],
                            [
                                'Invalid receiver address',
                                (this.isTonToEth() && Provider.isValidETHAddress(this.form.address)) ||
                                (this.isEthToTon() && Provider.isValidTONAddress(this.form.address)),
                            ],
                            [
                                'Not enough TONCOIN',
                                this.isTonToEth() || (this.isEthToTon() && this.form.from <= Provider.balance.toncoin),
                            ],
                            [
                                'Not enough funds for transaction gas',
                                Provider.balance.eth > 0,
                            ],
                            [
                                'TON Bridge unavailable',
                                Bridge.ready,
                            ],
                        ];
                    },

                    transferLink() {
                        return 'ton://transfer/' + this.transferAddress + '?amount=' + toUnit(this.transferAmount) + '&text=' + this.transferComment;
                    },
                    transferAddress() { return Config.get().bridge_address;                    },
                    transferAmount()  { return this.state.amount;                              },
                    transferComment() { return 'swapTo%23' + this.state.address                },
                    swapOraclesNeed() { return Provider.oracles;                               },
                    swapOraclesNow()  { return this.state.votes ? this.state.votes.length : 0; },
                    swapOraclesProgress() {
                        let percent = (this.swapOraclesNow / (this.swapOraclesNeed * 2 / 3) * 100).toFixed(2);
                        return percent > 100 ? 100 : percent;
                    },
                    swapOraclesText() {
                        return 'Collected ' + this.swapOraclesNow + '/' + this.swapOraclesNeed + ' confirmations of oracles';
                    },
                    swapConfirmations() {
                        let confirmations = Provider.block - this.state.block;
                        return confirmations >= 0 ? confirmations : 0;
                    },
                    swapConfirmationsText() {
                        return 'Collected ' + this.swapConfirmations + '/' + Provider.confirms + ' transaction confirmations';
                    },
                    swapConfirmationsProgress() {
                        let percent = (this.swapConfirmations / Provider.confirms * 100).toFixed(2);
                        return percent > 100 ? 100 : percent;
                    },
                    swapProgressText() {
                        if (this.state.direction > 0) return this.swapOraclesText;
                        return this.swapConfirmations >= 12 ? this.swapOraclesText : this.swapConfirmationsText;
                    },
                    swapProgressValue() {
                        if (this.state.direction > 0) return this.swapOraclesProgress;
                        return this.swapConfirmations >= 12 ? this.swapOraclesProgress : this.swapConfirmationsProgress;
                    },
                    coinName() {
                        return this.state.direction > 0 ? 'TONCOIN' : 'TON';
                    },
                },

                methods: {
                    changeDirection() {
                        if (this.state.step > 0) { return; }
                        this.direction *= -1;
                    },

                    isTonToEth() {
                        return this.direction > 0;
                    },

                    isEthToTon() {
                        return this.direction < 0;
                    },

                    stateStepClass(step) {
                        return this.state.step > step ? 'complete' : (this.state.step === step ? 'active' : '');
                    },

                    decodeURI(value) {
                        return decodeURIComponent(value);
                    },

                    connect() {
                        Provider.connect();
                    },

                    setMaxValue() {
                        this.form.from = Provider.balance.toncoin;
                        this.updateFee('from');
                    },

                    calcFee(value) {
                        return (this.fee.fixed + (value - this.fee.fixed) * (this.fee.percent / 100)).toFixed(6);
                    },
                    calcFeeRev(value) {
                        return ((value * 100) / (100 - this.fee.percent) + this.fee.fixed - value).toFixed(6);
                    },
                    getFeeString(fee) {
                        fee = Math.abs(fee);
                        return fee > 0 ? fee + ' TON' : (this.fee.fixed + ' TON + ' + this.fee.percent + '% of amount');
                    },

                    updateFee(input) {
                        let value = -(-this.form[input]), result = '';
                        if (value < 10) { this.fee.result = 0; result = ''; } else {
                            this.fee.result = -(-(input === 'from' ? this.calcFee(value) : this.calcFeeRev(value) * -1));
                            result          = value - this.fee.result - (this.isEthToTon() ? 0.01 : 0); // Network comission??
                        }
                        result           = result.toString();
                        this.form[input] = value > 0 ? value : '';
                        this.form[input === 'from' ? 'to' : 'from'] = result.length > 0 ? balanceNum(result, 6) : result;
                    },

                    updateFromState() {
                        this.direction    = this.state.direction || 1;
                        this.form.from    = this.state.amount    || '';
                        this.form.address = this.state.address   || '';
                        this.updateFee('from');
                    },

                    setValid(status, text) {
                        this.form.valid = status;
                        this.form.error = status ? '' : text;
                        return this;
                    },

                    submit() {
                        for (let i = 0; i < this.rules.length; i++) {
                            let [ text, valid ] = this.rules[i];
                            if (!valid) { return this.setValid(false, text); }
                        }
                        this.setValid(true).send();
                    },

                    cancel() {
                        State.clean().save();
                    },

                    async send() {
                        this.state.step       = 1;
                        this.state.direction  = this.direction;
                        this.state.amount     = this.form.from;
                        this.state.address    = this.form.address;
                        this.state.createTime = Date.now();
                        if (this.isTonToEth()) {
                            State.save();
                        } else {
                            await this.burn();
                        }
                    },

                    async mint() {
                        this.minting = true;
                        if (await Bridge.mint(this.state.swapData, this.state.votes)) {
                            this.state.step = 4;
                            State.save();
                        }
                        this.minting = false;
                    },

                    async burn() {
                        let result = await Bridge.burn(this.form.from, this.form.address);
                        if (result) {
                            this.state.step    = 2;
                            this.state.block   = result.block;
                            this.state.swapId  = result.swapId;
                            this.state.queryId = result.queryId;
                            State.save();
                        } else {
                            this.state.step = 0;
                        }
                    },

                    done() {
                        State.clean().save();
                    },
                },

                mounted() {
                    this.updateFromState();
                },

                watch: {
                    state: {
                        handler() {
                            this.updateFromState();
                        },
                        deep: true,
                    }
                },

                template: Template.$get('#eth'),
            }
        }
    }
);