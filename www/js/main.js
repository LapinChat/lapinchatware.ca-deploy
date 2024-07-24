const headerModalMenuOpen_button = document.getElementById('header__button--menu-open');
const sidebarModalMenuOpen_button = document.getElementById('sidebar__more-info__button');
const headerModalMenuClose_button = document.getElementById('header__button--menu-close');
const headerModalMenu_dialog = document.getElementById('header__menu-modal');

headerModalMenuOpen_button.addEventListener('click', () => {
    headerModalMenu_dialog.showModal();
});

if(sidebarModalMenuOpen_button) {
    sidebarModalMenuOpen_button.addEventListener('click', () => {
        headerModalMenu_dialog.showModal();
    });
}

headerModalMenuClose_button.addEventListener('click', () => {
    headerModalMenu_dialog.close();
});