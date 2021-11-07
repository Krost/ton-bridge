namespace('app.view.Template', {
    $get(query) {
        return window.htmlTemplate.querySelector(query);
    }
});