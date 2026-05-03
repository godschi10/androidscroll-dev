// Desktop vs mobile layout
var desktopNav = document.querySelector('.desktop-nav');
var menuToggle = document.getElementById('menu-toggle');
var mobileMenu = document.getElementById('mobile-menu');

function applyLayout() {
  if (window.innerWidth >= 768) {
    desktopNav.style.display = 'flex';
    menuToggle.style.display = 'none';
    mobileMenu.style.display = 'none';
  } else {
    desktopNav.style.display = 'none';
    menuToggle.style.display = 'flex';
  }
}
applyLayout();
window.addEventListener('resize', applyLayout);

// Hamburger toggle
menuToggle.addEventListener('click', function() {
  mobileMenu.style.display = mobileMenu.style.display === 'flex' ? 'none' : 'flex';
});

// Dropdown
var button = document.getElementById('dd-button');
var menu = document.getElementById('dd-menu');

if (button && menu) {
  button.addEventListener('click', function(event) {
    event.stopPropagation();
    var isOpen = menu.style.display === 'grid';
    menu.style.display = isOpen ? 'none' : 'grid';
    button.setAttribute('aria-expanded', String(!isOpen));
  });

  document.addEventListener('click', function(event) {
    if (menu.style.display === 'grid' && !menu.contains(event.target) && !button.contains(event.target)) {
      menu.style.display = 'none';
      button.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && menu.style.display === 'grid') {
      menu.style.display = 'none';
      button.setAttribute('aria-expanded', 'false');
      button.focus();
    }
  });
}

// Mobile category accordion
document.querySelectorAll('.mobile-cat-toggle').forEach(function(toggle) {
  toggle.addEventListener('click', function(e) {
    if (e.target.tagName === 'A') return;
    var slug = toggle.dataset.cat;
    var children = document.getElementById('mob-' + slug);
    var arrow = toggle.querySelector('.cat-arrow');
    if (children) {
      children.classList.toggle('open');
      if (arrow) arrow.style.transform = children.classList.contains('open') ? 'rotate(180deg)' : '';
    }
  });
});
