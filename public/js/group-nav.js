/*
 * group-nav.js: tabs for all group pages (Matchday, Ranking, Group)
 * Usage on a page:
 *   <body data-root="../../" data-nav="groups" data-group-tab="matchday|ranking|group">
 *   <nav id="group-tabs" class="tabs" aria-label="Bereiche der Tippgruppe"></nav>
 * The groupId comes from the URL (?groupId=3). Without a valid groupId the page
 * redirects to html/groups/Groups.html.
 * Script order: jQuery, api.js, auth.js, layout.js, auth-nav.js, group-nav.js, page script
 */
(function ($) {
    'use strict';

    var GROUPS_PAGE = 'html/groups/Groups.html';

    // key = value of data-group-tab on <body>; soon = shown but not clickable yet
    var TABS = [
        { key: 'matchday', label: 'Spieltag', path: 'html/matchday/Matchday.html' },
        { key: 'ranking', label: 'Rangliste', path: null, soon: 'ab Sprint 3' },
        { key: 'group', label: 'Gruppe', path: 'html/groups/GroupInfo.html' }
    ];

    // Positive whole number from ?groupId=, otherwise null
    function readGroupId() {
        var raw = new URLSearchParams(window.location.search).get('groupId');
        if (raw === null || !/^[1-9]\d{0,17}$/.test(raw)) {
            return null;
        }
        return Number(raw);
    }

    var groupId = readGroupId();

    // Global for page scripts, e.g. apiRequest('GET', '/groups/' + getGroupId())
    window.getGroupId = function () {
        return groupId;
    };

    // No or invalid groupId: back to the group overview, no history entry
    if (groupId === null) {
        window.location.replace(getSiteRoot() + GROUPS_PAGE);
        return;
    }

    function tabHref(tab) {
        return getSiteRoot() + tab.path + '?groupId=' + encodeURIComponent(groupId);
    }

    function renderTab(tab, activeKey) {
        if (tab.soon) {
            // Disabled tab: not a link, hint for screen readers and on hover
            return $('<span class="tab tab-disabled" aria-disabled="true">')
                .attr('title', tab.label + ' ' + tab.soon)
                .append(document.createTextNode(tab.label))
                .append($('<span class="tab__hint">').text(tab.soon));
        }
        var $tab = $('<a class="tab">').attr('href', tabHref(tab)).text(tab.label);
        if (tab.key === activeKey) {
            $tab.addClass('tab-active').attr('aria-current', 'page');
        }
        return $tab;
    }

    function renderGroupTabs() {
        var activeKey = $('body').attr('data-group-tab') || '';
        var $nav = $('#group-tabs');

        // Fallback: placeholder missing, insert tabs at the top of <main>
        if (!$nav.length) {
            $nav = $('<nav id="group-tabs" class="tabs" aria-label="Bereiche der Tippgruppe">');
            $('#main').prepend($nav);
        }

        $nav.addClass('tabs').empty();
        TABS.forEach(function (tab) {
            $nav.append(renderTab(tab, activeKey));
        });
    }

    $(renderGroupTabs);
})(jQuery);
