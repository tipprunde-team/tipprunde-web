/*
 * ranking.js: Gesamtrangliste einer Tippgruppe (US-25), Handy-Ansicht nach US-28
 * Lädt GET /api/groups/{groupId}/ranking.
 * Rang und Reihenfolge kommen vom Server (gleicher Rang bei Punktgleichheit, FA-47);
 * das Frontend sortiert und rechnet nicht selbst.
 * Mitgliedschaft prüft der Server (403 NOT_A_MEMBER), die Nutzer-ID dient nur zum Hervorheben.
 * Hinweis „vorläufig“ aus dem aktuellen Spieltag (GET /api/groups/{groupId}/matches), solange
 * dort Spiele begonnen haben, aber noch nicht alle beendet sind.
 */
(function ($) {
    'use strict';

    // Fehlertexte nach API-Code; sonst Meldung des Servers
    var ERRORS = {
        NOT_A_MEMBER: 'Du bist kein Mitglied dieser Tippgruppe.',
        GROUP_NOT_FOUND: 'Diese Tippgruppe gibt es nicht.'
    };

    function messageFor(err) {
        return { message: (err && ERRORS[err.code]) || (err && err.message) };
    }

    // Eine Zeile je Mitglied; Werte nur als Text einsetzen, nie als HTML
    function renderRow(entry, myUserId) {
        var isMe = myUserId !== null && entry.userId === myUserId;
        var $name = $('<td class="ranking-name">').text(entry.username);
        if (isMe) {
            $name.append($('<span class="you">').text('(Du)'));
        }
        return $('<tr>')
            .toggleClass('is-me', isMe)
            .attr('aria-current', isMe ? 'true' : null)
            .append($('<td class="rank">').text(entry.rank + '.'))
            .append($name)
            .append($('<td class="num col-wide">').text(entry.exactTips))
            .append($('<td class="num">').text(entry.points));
    }

    function renderRanking(data) {
        var $body = $('#ranking-body').empty();
        var rows = (data && data.ranking) || [];

        // Noch kein Spiel gewertet
        if (!rows.length) {
            $body.append($('<tr>').append(
                $('<td class="ranking-empty" colspan="4">').text('Noch keine Punkte vergeben.')));
            return;
        }

        var myUserId = getUserId();
        rows.forEach(function (entry) {
            $body.append(renderRow(entry, myUserId));
        });
    }

    // Vorläufig, wenn der aktuelle Spieltag begonnen hat und noch nicht alle Spiele beendet sind
    function renderNote(data) {
        var serverNow = Date.parse(data.serverTime);
        var counted = (data.matches || []).filter(function (match) {
            return match.status !== 'CANCELLED' && match.status !== 'POSTPONED';
        });
        var started = counted.filter(function (match) {
            return match.status === 'LIVE' || match.status === 'FINISHED' || Date.parse(match.kickoff) <= serverNow;
        });
        var finished = counted.filter(function (match) { return match.status === 'FINISHED'; });
        if (!started.length || finished.length === counted.length) {
            return;
        }
        $('#ranking-note')
            .text('Vorläufig: ' + finished.length + ' von ' + counted.length + ' Spielen des ' +
                data.matchday + '. Spieltags beendet.')
            .prop('hidden', false);
    }

    // Hinweis ist Zusatz: schlägt die Abfrage fehl, bleibt die Rangliste ohne Hinweis
    function loadNote(groupId) {
        apiRequest('GET', '/groups/' + encodeURIComponent(groupId) + '/matches')
            .then(renderNote)
            .catch(function () { /* kein Hinweis */ });
    }

    window.renderRanking = renderRanking;

    $(function () {
        // Geschützte Seite: ohne Sitzung zum Login, mit Rücksprung hierher
        if (!requireLogin()) {
            return;
        }
        $('#main').show();

        // group-nav.js hat ohne gültige groupId bereits umgeleitet
        var groupId = getGroupId();
        if (groupId === null) {
            return;
        }

        apiRequest('GET', '/groups/' + encodeURIComponent(groupId) + '/ranking')
            .then(function (data) {
                renderRanking(data);
                loadNote(groupId);
            })
            .catch(function (err) {
                // 403 NOT_A_MEMBER, 404 GROUP_NOT_FOUND oder Netzwerkfehler
                $('#ranking-card').prop('hidden', true);
                $('#page-alert').prop('hidden', false);
                showError('#page-alert', messageFor(err));
            });
    });
})(jQuery);
