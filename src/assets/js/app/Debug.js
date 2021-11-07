namespace('app.Debug:Debug', {
    status: false,
    phrase: 'unepic',
    init() {
        let self           = this;
        let word           = '';
        let timeout        = null;
        const cleanRestart = () => {
            if (timeout) { clearTimeout(timeout); }
            timeout = setTimeout(() => { word = ''; }, 300);
        };

        // Load from lolcaStorage
        self.status = (localStorage.getItem('debug') || 'false') !== 'false';

        // Listen document press key for debug phrase build
        window.document.addEventListener('keyup', (e) => {
            cleanRestart();
            word += e.key;
            if (word === self.phrase) {
                self.status = !self.status;
                console.debug('Debug status updated: ', self.status);
                localStorage.setItem('debug', self.status);
            }
        });
    },
    disable() { this.status = false; },
    enable()  { this.stats = true;   },
    log()     {
        if (!this.status) return;
        console.debug.apply(null, arguments);
    },
});