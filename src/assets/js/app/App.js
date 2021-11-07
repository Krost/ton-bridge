namespace(
    'app.App',

    use(
        'app.Menu',
        'app.Routes',
        'app.Mixin',
        'app.Config',
        'app.Debug',
        'app.State',
        'app.view.Template',
        'app.ton.Bridge',
        'app.ton.Contract',
        'app.component.Provider'
    ),

    (Menu, Routes, Mixin, Config, Debug, State, Template, Bridge, TonContract, Provider) => {
        Vue.mixin(Mixin);
        const router = new VueRouter({ routes: Routes, mode: 'history' });
        return {
            router,
            data:       {
                menu:     Menu,
                provider: Provider,
                config:   Config,
                state:    State,
                bridge:   Bridge,
                ready:    false,
            },

            computed: {
                pageTitle() { return this.$route.meta.title; },
                isTestNet() { return Config.isTestNet(); }
            },

            async mounted() {
                this.$emit('mounted');

                // Listen provider events
                Provider.$on(':update:chain', (chain_id) => {
                    if (Config.setActive(chain_id).isSupported()) {
                        Provider.updateContract(TonContract, Config.get().wton_address);
                        Provider.updateTonWeb(Config.get().toncenter_url, Config.get().bridge_address);
                    } else {
                        Provider.cleanContract().cleanTonWeb();
                    }
                    State.load(chain_id);
                }).$on(':update:bridge', ({ ready, fee }) => {
                    Bridge.setReady(ready).updateFee(fee);
                }).$on(':*', (data, name) => {
                    Debug.log('[ Provider::$emit ]', name, data);
                }).$on(':bridge:minted', () => {
                    State.data.minted = true;
                }).$on(':bridge:burned', () => {
                    State.data.burned = true;
                });

                Debug.init();
                await Provider.init();
                this.ready = true;
            },

            watch: {
                $route: {
                    immediate: true,
                    handler(to, from) {
                        document.title = 'TON Bridge // ' +  to.meta.title;
                        let checkbox   = document.getElementById('menuState');
                        if (checkbox) { checkbox.checked = false; }
                    }
                },
            },

            template: Template.$get('#app'),
        }
    }
);