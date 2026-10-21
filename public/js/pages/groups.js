/*
 * groups.js: Übersicht der eigenen Tippgruppen (US-10)
 * Lädt GET /api/groups und zeigt pro Gruppe eine Karte, ohne Gruppen den Leerzustand.
 */
(function ($) {
    'use strict';

    var ROLE_LABELS = { ADMIN: 'Admin', MEMBER: 'Mitglied' };

    function matchdayUrl(groupId) {
        return getSiteRoot() + 'html/matchday/Matchday.html?groupId=' + encodeURIComponent(groupId);
    }

    function membersText(count) {
        return count === 1 ? '1 Mitglied' : count + ' Mitglieder';
    }

    function stat(value, label) {
        return $('<div class="stat">')
            .append($('<span class="stat__value">').text(value))
            .append($('<span class="stat__label">').text(label));
    }

    // Eine Karte pro Gruppe, Klick führt zum Spieltag der Gruppe
    function groupCard(group) {
        var isAdmin = group.role === 'ADMIN';
        var rank = group.myRank != null ? group.myRank + '.' : '–';
        var points = group.myPoints != null ? group.myPoints : 0;

        var $meta = $('<div class="group-card__meta">')
            .append($('<span class="badge">')
                .addClass(isAdmin ? 'badge-admin' : 'badge-locked')
                .text(ROLE_LABELS[group.role] || group.role))
            .append($('<span>').text(membersText(group.memberCount)));

        return $('<a class="card group-card">')
            .attr('href', matchdayUrl(group.id))
            .append($('<div>')
                .append($('<h2 class="group-card__name">').text(group.name))
                .append($meta))
            .append($('<div class="group-card__stats">')
                .append(stat(rank, 'Platz'))
                .append(stat(points, 'Punkte')));
    }

    function emptyState() {
        return $('<div class="card empty-state">')
            .append($('<h2>').text('Noch keine Tippgruppe'))
            .append($('<p>').text('Erstelle eine eigene Gruppe oder tritt mit einem Einladungscode einer Gruppe bei.'))
            .append($('<div class="page-head__actions">')
                .append($('<a class="btn btn-primary" href="CreateGroup.html">').text('Gruppe erstellen'))
                .append($('<a class="btn btn-secondary" href="JoinGroup.html">').text('Gruppe beitreten')));
    }

    function renderGroups(groups) {
        var $list = $('#group-list').empty();
        var $empty = $('#group-empty').empty().hide();

        if (!groups || !groups.length) {
            $('#head-actions').hide();
            $empty.append(emptyState()).show();
            return;
        }

        $('#head-actions').show();
        groups.forEach(function (group) {
            $list.append(groupCard(group));
        });
    }

    $(function () {
        // Geschützte Seite: ohne Sitzung zum Login, mit Rücksprung hierher
        if (!requireLogin()) {
            return;
        }
        $('#main').show();

        apiRequest('GET', '/groups')
            .then(renderGroups)
            .catch(function (err) {
                // 401 leitet api.js schon zum Login weiter
                $('#page-alert').prop('hidden', false);
                showError('#page-alert', err);
            });
    });
})(jQuery);