namespace('app.Mixin', 'app.Version#version', (version) => {
    return {
        data() {
            return {
                appVersion: version,
            }
        },

        methods: {
            clipboardThis(e) {
                let link = e.currentTarget;
                let text = link.outerText.trim();
                this.$copyText(text).then(() => {
                    link.classList.toggle('cb-copied', true);
                    setTimeout(() => {
                        link.classList.toggle('cb-copied', false);
                    }, 200);
                });
            },
        },
    }
});