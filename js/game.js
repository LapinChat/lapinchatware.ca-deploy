(function () {
    let delay = 4000;
    let images = document.querySelectorAll('.sidebar > .screenshots li');
    let pos = 0;
    let lastPos = 0;

    // Init
    images[pos].classList.add('visible');
    images[pos].classList.add('top');

    // Bail if we only have a single BG.
    if (images.length === 1)
        return;

    window.setInterval(function () {
        lastPos = pos;
        pos++;
        if (pos >= images.length)
            pos = 0;

        // Swap top images.
        images[lastPos].classList.remove('top');
        images[pos].classList.add('visible');
        images[pos].classList.add('top');

        // Hide last image after a short delay.
        window.setTimeout(function () {
            images[lastPos].classList.remove('visible');
        }, delay / 2);

    }, delay);

})();