listen('template.ready');
autoload({ app: '/assets/js/app' });
fetch('/assets/view.html').then((response) => { return response.text(); }).then((html) => {
    window.htmlTemplate = (new DOMParser()).parseFromString(html, 'text/html');
    window.document.dispatchEvent(new Event('template.ready'));
    use(
        'app.App',
        function(app) {
            new Vue(app).$on('mounted', () => {
                document.getElementById('loader').style.display = 'none';
                document.getElementById('app').style.display    = 'block';
            }).$mount('#app');
        }
    );
});