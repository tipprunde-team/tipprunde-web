/*
 * mockups.js: statische Mockups für Gruppenübersicht, Gruppe erstellen, Beitreten und Rangliste
 * Welche Seite gerendert wird, steht in <body data-mockup="...">.
 * Die render-Funktionen erwarten Daten im Format der API (Projektplan Anhang 5)
 * und sollen später unverändert mit echten Antworten laufen.
 */
(function ($) {
    'use strict';

    // ---------- Beispieldaten im Format der API ----------

    // GET /api/groups
    var SAMPLE_GROUPS = [
        { id: 3, name: 'WG Mosbach', role: 'ADMIN', memberCount: 5, myRank: 1, myPoints: 35 },
        { id: 5, name: 'Kurs WI25A', role: 'MEMBER', memberCount: 18, myRank: 4, myPoints: 27 },
        { id: 8, name: 'Vereinskollegen', role: 'MEMBER', memberCount: 9, myRank: 2, myPoints: 31 }
    ];

    // Antwort von POST /api/groups (Name kommt aus dem Formular)
    var SAMPLE_CREATED = { id: 3, inviteCode: 'K7FQ2XZ9', role: 'ADMIN' };

    // GET /api/invites/{inviteCode}
    var SAMPLE_INVITES = {
        K7FQ2XZ9: { groupName: 'WG Mosbach', memberCount: 5 }
    };

    // GET /api/groups/{groupId}/ranking bzw. ...?matchday=7
    var SAMPLE_RANKING = {
        total: {
            groupId: 3, matchday: null,
            ranking: [
                { rank: 1, userId: 12, username: 'maximilian', points: 35, exactTips: 4 },
                { rank: 2, userId: 7, username: 'niklas', points: 31, exactTips: 3 },
                { rank: 2, userId: 21, username: 'max', points: 31, exactTips: 2 },
                { rank: 4, userId: 30, username: 'arlind', points: 27, exactTips: 2 },
                { rank: 5, userId: 44, username: 'lena', points: 22, exactTips: 1 }
            ]
        },
        matchday: {
            groupId: 3, matchday: 7,
            ranking: [
                { rank: 1, userId: 7, username: 'niklas', points: 9, exactTips: 1 },
                { rank: 2, userId: 12, username: 'maximilian', points: 7, exactTips: 1 },
                { rank: 2, userId: 30, username: 'arlind', points: 7, exactTips: 0 },
                { rank: 4, userId: 21, username: 'max', points: 4, exactTips: 0 },
                { rank: 5, userId: 44, username: 'lena', points: 2, exactTips: 0 }
            ]
        }
    };

    var MAX_NAME_LENGTH = 50;

    // ---------- Hilfsfunktionen ----------

    function getRoot() {
        var root = $('body').attr('data-root') || './';
        return root.endsWith('/') ? root : root + '/';
    }

    function matchdayUrl(groupId) {
        return getRoot() + 'html/matchday/Matchday.html?groupId=' + encodeURIComponent(groupId);
    }

    // Eingeloggter Nutzer, im Mockup ohne Login: Maximilian (id 12)
    function currentUserId() {
        var id = (typeof getUserId === 'function') ? getUserId() : null;
        return id || 12;
    }

    function setAlert($el, text, kind) {
        $el.removeClass('alert-error alert-success')
            .addClass(kind ? 'alert-' + kind : '')
            .text(text)
            .prop('hidden', false);
    }

    function clearAlert($el) {
        $el.text('').prop('hidden', true);
    }

    function memberText(count) {
        return count === 1 ? '1 Mitglied' : count + ' Mitglieder';
    }

    // In die Zwischenablage kopieren, mit kurzer Rückmeldung am Button
    function copyText(text, $button) {
        var label = $button.text();
        var done = function () {
            $button.text('Kopiert');
            setTimeout(function () { $button.text(label); }, 2000);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done, function () { $button.text('Bitte manuell kopieren'); });
        } else {
            $button.text('Bitte manuell kopieren');
        }
    }

    function actionLink(href, text, cls) {
        return $('<a class="btn">').addClass(cls).attr('href', href).text(text);
    }

    // ---------- Gruppenübersicht ----------

    function renderGroups(groups) {
        var $list = $('#group-list').empty();

        if (!groups || !groups.length) {
            var $empty = $('<div class="card empty-state">')
                .append($('<h2>').text('Noch keine Tippgruppe'))
                .append($('<p>').text('Erstelle eine eigene Gruppe oder tritt mit einem Einladungscode einer bestehenden bei.'))
                .append($('<div class="page-head__actions">')
                    .append(actionLink('CreateGroupMockup.html', 'Gruppe erstellen', 'btn-primary'))
                    .append(actionLink('JoinGroupMockup.html', 'Gruppe beitreten', 'btn-secondary')));
            $list.removeClass('group-list').append($empty);
            return;
        }

        $list.addClass('group-list');
        groups.forEach(function (group) {
            var isAdmin = group.role === 'ADMIN';
            var $meta = $('<div class="group-card__meta">')
                .append($('<span class="badge">').addClass(isAdmin ? 'badge-admin' : 'badge-locked').text(isAdmin ? 'Admin' : 'Mitglied'))
                .append($('<span>').text(memberText(group.memberCount)));

            var $stats = $('<div class="group-card__stats">')
                .append($('<div class="stat">')
                    .append($('<span class="stat__value">').text(group.myRank + '.'))
                    .append($('<span class="stat__label">').text('Platz')))
                .append($('<div class="stat">')
                    .append($('<span class="stat__value">').text(group.myPoints))
                    .append($('<span class="stat__label">').text('Punkte')));

            $('<a class="card group-card">')
                .attr('href', matchdayUrl(group.id))
                .attr('aria-label', group.name + ', ' + (isAdmin ? 'Admin' : 'Mitglied') + ', Platz ' + group.myRank + ', ' + group.myPoints + ' Punkte')
                .append($('<div>')
                    .append($('<h2 class="group-card__name">').text(group.name))
                    .append($meta))
                .append($stats)
                .appendTo($list);
        });
    }

    function initGroups() {
        var showEmpty = false;
        renderGroups(SAMPLE_GROUPS);
        $('#toggle-empty').on('click', function () {
            showEmpty = !showEmpty;
            renderGroups(showEmpty ? [] : SAMPLE_GROUPS);
            $(this).text(showEmpty ? 'Beispielgruppen zeigen' : 'Leerzustand zeigen');
        });
    }

    // ---------- Gruppe erstellen ----------

    function inviteUrl(code) {
        var path = getRoot() + 'html/groups/JoinGroup.html?code=' + encodeURIComponent(code);
        return new URL(path, window.location.href).href;
    }

    function renderCreatedGroup(group) {
        $('#create-card').prop('hidden', true);
        var $card = $('#created-card').empty().prop('hidden', false);
        var link = inviteUrl(group.inviteCode);

        var $copyCode = $('<button type="button" class="btn btn-secondary">').text('Code kopieren');
        $copyCode.on('click', function () { copyText(group.inviteCode, $copyCode); });

        var $linkInput = $('<input class="input" type="text" id="invite-link" readonly>').val(link);
        var $copyLink = $('<button type="button" class="btn btn-secondary">').text('Link kopieren');
        $copyLink.on('click', function () { copyText(link, $copyLink); });

        $card
            .append($('<h2>').text('Gruppe angelegt'))
            .append($('<p>').text('„' + group.name + '“ ist angelegt, du bist Admin. Teile den Code oder den Link mit deinen Mitspielern.'))
            .append($('<p class="label">').text('Einladungscode'))
            .append($('<div class="invite-code">')
                .append($('<span class="invite-code__value">').text(group.inviteCode))
                .append($copyCode))
            .append($('<label class="label" for="invite-link">').text('Einladungslink'))
            .append($('<div class="invite-link">').append($linkInput, $copyLink))
            .append($('<div class="actions">')
                .append(actionLink(matchdayUrl(group.id), 'Zur Gruppe', 'btn-primary'))
                .append(actionLink('GroupsMockup.html', 'Zur Übersicht', 'btn-secondary')));

        $card.find('h2').attr('tabindex', '-1').trigger('focus');
    }

    function initCreate() {
        var $input = $('#group-name');
        var $count = $('#name-count');
        var $alert = $('#page-alert');

        $input.on('input', function () {
            $count.text($input.val().length + ' / ' + MAX_NAME_LENGTH);
        });

        $('#create-form').on('submit', function (e) {
            e.preventDefault();
            var name = $.trim($input.val());
            if (!name || name.length > MAX_NAME_LENGTH) {
                $input.addClass('is-invalid');
                setAlert($alert, 'Bitte einen Gruppennamen mit 1 bis 50 Zeichen eingeben.', 'error');
                return;
            }
            $input.removeClass('is-invalid');
            clearAlert($alert);
            // Später: apiRequest('POST', '/groups', { name: name }).then(renderCreatedGroup)
            renderCreatedGroup($.extend({}, SAMPLE_CREATED, { name: name }));
        });
    }

    // ---------- Gruppe beitreten ----------

    function renderInvitePreview(code, preview) {
        var $card = $('#join-preview').empty().prop('hidden', false);
        var $join = $('<button type="button" class="btn btn-primary btn-block">').text('Beitreten');

        $card
            .append($('<p class="label">').text('Einladung in die Tippgruppe'))
            .append($('<h2 class="join-preview__name">').text(preview.groupName))
            .append($('<p class="join-preview__meta">').text(memberText(preview.memberCount)))
            .append($join);

        $join.on('click', function () {
            // Später: apiRequest('POST', '/groups/join', { inviteCode: code })
            $card.empty()
                .append($('<h2>').text('Willkommen!'))
                .append($('<p>').text('Du bist jetzt Mitglied von „' + preview.groupName + '“.'))
                .append($('<div class="actions">')
                    .append(actionLink(matchdayUrl(SAMPLE_CREATED.id), 'Zum Spieltag', 'btn-primary'))
                    .append(actionLink('GroupsMockup.html', 'Zur Übersicht', 'btn-secondary')));
        });
    }

    function checkCode(code) {
        var $alert = $('#page-alert');
        var $input = $('#invite-code');
        $('#join-preview').prop('hidden', true);

        if (!code) {
            $input.addClass('is-invalid');
            setAlert($alert, 'Bitte gib den Einladungscode ein.', 'error');
            return;
        }
        // Später: apiRequest('GET', '/invites/' + encodeURIComponent(code))
        var preview = SAMPLE_INVITES[code];
        if (!preview) {
            $input.addClass('is-invalid');
            setAlert($alert, 'Dieser Code ist ungültig oder wurde erneuert. Frag den Admin der Gruppe nach dem aktuellen Code.', 'error');
            return;
        }
        $input.removeClass('is-invalid');
        clearAlert($alert);
        renderInvitePreview(code, preview);
    }

    function initJoin() {
        var $input = $('#invite-code');
        $('#join-form').on('submit', function (e) {
            e.preventDefault();
            checkCode($.trim($input.val()));
        });

        // Einladungslink: Code steht in der URL (?code=...)
        var fromUrl = new URLSearchParams(window.location.search).get('code');
        if (fromUrl) {
            $input.val(fromUrl);
            checkCode($.trim(fromUrl));
        }
    }

    // ---------- Rangliste ----------

    function renderRanking(data, userId) {
        var $body = $('#ranking-body').empty();
        var isMatchday = data.matchday !== null && data.matchday !== undefined;

        $('#ranking-caption').text(isMatchday
            ? 'Rangliste ' + data.matchday + '. Spieltag'
            : 'Gesamtrangliste');
        $('#ranking-note')
            .text(isMatchday ? 'Vorläufig, solange noch Spiele dieses Spieltags offen sind.' : '')
            .prop('hidden', !isMatchday);

        if (!data.ranking || !data.ranking.length) {
            $body.append($('<tr>').append($('<td colspan="4">').text('Noch keine Punkte vergeben.')));
            return;
        }

        data.ranking.forEach(function (entry) {
            var isMe = entry.userId === userId;
            var $name = $('<td>').text(entry.username);
            if (isMe) {
                $name.append($('<span class="you">').text('(Du)'));
            }
            $('<tr>')
                .toggleClass('is-me', isMe)
                .attr('aria-current', isMe ? 'true' : null)
                .append($('<td class="rank">').text(entry.rank + '.'))
                .append($name)
                .append($('<td class="num">').text(entry.points))
                .append($('<td class="num">').text(entry.exactTips))
                .appendTo($body);
        });
    }

    function initRanking() {
        var me = currentUserId();
        renderRanking(SAMPLE_RANKING.total, me);

        $('.segmented button').on('click', function () {
            var mode = $(this).attr('data-mode');
            $('.segmented button').attr('aria-pressed', 'false');
            $(this).attr('aria-pressed', 'true');
            // Später: apiRequest('GET', '/groups/' + groupId + '/ranking' + (mode === 'matchday' ? '?matchday=' + n : ''))
            renderRanking(SAMPLE_RANKING[mode], me);
        });

        $('.tabs [data-soon]').on('click', function (e) {
            e.preventDefault();
            setAlert($('#page-alert'), 'Die Ansicht „' + $(this).attr('data-soon') + '“ folgt in der nächsten Phase.');
        });
    }

    window.renderGroups = renderGroups;
    window.renderCreatedGroup = renderCreatedGroup;
    window.renderInvitePreview = renderInvitePreview;
    window.renderRanking = renderRanking;

    $(function () {
        var page = $('body').attr('data-mockup');
        if (page === 'groups') { initGroups(); }
        if (page === 'create') { initCreate(); }
        if (page === 'join') { initJoin(); }
        if (page === 'ranking') { initRanking(); }
    });
})(jQuery);