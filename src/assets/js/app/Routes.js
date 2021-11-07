namespace(
    'app.Routes',

    use(
        'app.view.page.Ethereum',
        'app.view.page.About',
        'app.view.page.Donate',
    ),

    (Ethereum, About, Donate) => {
        return [
            { path: '*', redirect: '/eth' },
            { path: '/eth',    component: Ethereum('eth'), meta: { title: 'Ethereum' } },
            { path: '/bsc',    component: Ethereum('bsc'), meta: { title: 'Binance Smart Chain' } },
            { path: '/about',  component: About,           meta: { title: 'About' } },
            { path: '/donate', component: Donate,          meta: { title: 'Donate' } },
        ];
    }
);