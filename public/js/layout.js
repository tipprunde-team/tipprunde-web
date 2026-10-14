/*
 * layout.js: gemeinsamer Header und Footer fuer alle Seiten
 * Nutzung auf jeder Seite:
 *   <body data-root="../../" data-nav="groups">   (data-root = Weg zurueck zu public/)
 *   <header id="site-header"></header> ... <footer id="site-footer"></footer>
 * Reihenfolge Skripte: jQuery, api.js, auth.js, layout.js, auth-nav.js, Seitenskript
 */
(function ($) {
    'use strict';

    // Hauptnavigation: key = Wert von data-nav am <body>
    var NAV_ITEMS = [
        { key: 'home', label: 'Startseite', path: 'Homepage.html' },
        { key: 'groups', label: 'Tippgruppen', path: 'html/groups/Groups.html' }
    ];

    var FOOTER_LINKS = [
        { label: 'Impressum', path: 'html/legal/Impressum.html' },
        { label: 'Datenschutz', path: 'html/legal/Datenschutz.html' }
    ];

    var DATA_NOTICE = 'Spieldaten und Wappen: football-data.org. ' +
        'Die Rechte an den Wappen liegen bei den jeweiligen Vereinen.';

    // Ab dieser Breite ist die Navigation immer sichtbar (wie in style.css)
    var DESKTOP_QUERY = '(min-width: 768px)';

    // Pfad zu public/ aus data-root, Standard: gleiche Ebene
    function getRoot() {
        var root = $('body').attr('data-root') || './';
        return root.endsWith('/') ? root : root + '/';
    }

    function link(root, item, activeKey) {
        var $a = $('<a>').attr('href', root + item.path).text(item.label);
        if (item.key && item.key === activeKey) {
            $a.addClass('active').attr('aria-current', 'page');
        }
        return $a;
    }

    function renderHeader(root, activeKey) {
        var $header = $('#site-header');
        if (!$header.length) {
            return;
        }
        var $container = $('<div class="container">');

        // Logo (Datei enthaelt Ball-Icon und Schriftzug)
        $('<a class="logo">')
            .attr('href', root + 'Homepage.html')
            .append($('<img>').attr({ src: root + 'img/logo.svg', alt: 'Tipprunde Startseite' }))
            .appendTo($container);

        var $nav = $('<nav class="main-nav" id="main-nav" aria-label="Hauptnavigation">');
        NAV_ITEMS.forEach(function (item) {
            $nav.append(link(root, item, activeKey));
        });
        $container.append($nav);

        // Platzhalter: fuellt Niklas mit auth-nav.js (Benutzername, Abmelden)
        $container.append('<div id="nav-user"></div>');

        // Menue-Button fuer kleine Bildschirme, steht hinter #nav-user
        var $toggle = $('<button type="button" class="nav-toggle">')
            .attr({ 'aria-controls': 'main-nav', 'aria-expanded': 'false' })
            .append('<span class="nav-toggle__icon" aria-hidden="true"></span>')
            .append($('<span class="nav-toggle__label">').text('Menü'));
        $container.append($toggle);

        $header.addClass('site-header').empty().append($container);
    }

    // Menue auf- und zuklappen
    function setMenuOpen(open) {
        $('#main-nav').toggleClass('is-open', open);
        $('.nav-toggle').attr('aria-expanded', open ? 'true' : 'false');
    }

    function bindMenuToggle() {
        var $toggle = $('.nav-toggle');
        if (!$toggle.length) {
            return;
        }
        $toggle.on('click', function () {
            setMenuOpen($toggle.attr('aria-expanded') !== 'true');
        });

        // Escape schliesst das Menue, Fokus zurueck auf den Button
        $(document).on('keydown', function (e) {
            if (e.key === 'Escape' && $toggle.attr('aria-expanded') === 'true') {
                setMenuOpen(false);
                $toggle.trigger('focus');
            }
        });

        // Wechsel auf Desktop-Breite: Zustand zuruecksetzen
        if (window.matchMedia) {
            var mq = window.matchMedia(DESKTOP_QUERY);
            var onChange = function (ev) {
                if (ev.matches) {
                    setMenuOpen(false);
                }
            };
            if (mq.addEventListener) {
                mq.addEventListener('change', onChange);
            } else if (mq.addListener) {
                mq.addListener(onChange);
            }
        }
    }

    function renderFooter(root) {
        var $footer = $('#site-footer');
        if (!$footer.length) {
            return;
        }
        var $container = $('<div class="container">');
        var $links = $('<nav class="footer-links" aria-label="Rechtliches">');
        FOOTER_LINKS.forEach(function (item) {
            $links.append(link(root, item, null));
        });
        $container.append($links);
        $container.append($('<p class="footer-note">').text(DATA_NOTICE));

        $footer.addClass('site-footer').empty().append($container);
    }

    // Link "Zum Inhalt springen" fuer Tastaturnutzer
    function renderSkipLink() {
        if ($('#main').length && !$('.skip-link').length) {
            $('body').prepend('<a class="skip-link" href="#main">Zum Inhalt springen</a>');
        }
    }

    $(function () {
        var root = getRoot();
        var activeKey = $('body').attr('data-nav') || '';
        renderSkipLink();
        renderHeader(root, activeKey);
        bindMenuToggle();
        renderFooter(root);

        // Signal fuer auth-nav.js und Seitenskripte
        window.LAYOUT_READY = true;
        $(document).trigger('layout:ready');
    });
})(jQuery);