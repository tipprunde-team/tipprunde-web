/*
 * matchday.js: matchday page of a group (US-17, US-20, US-21)
 * Loads GET /api/groups/{groupId}/matches[?matchday=n] and saves tips via
 * PUT /api/groups/{groupId}/matches/{matchId}/tip.
 * The lock state comes only from the API field "locked" (server time), never from the device clock.
 * Bei offener Seite: Serverzeit aus serverTime plus vergangener Zeit schätzen und Karten ab Anstoß
 * sperren (US-21). Beim Speichern entscheidet weiterhin der Server.
 */
(function ($) {
    'use strict';

    var TZ = 'Europe/Berlin';
    var MIN_GOALS = 0;
    var MAX_GOALS = 20;
    var FIRST_MATCHDAY = 1;
    var LAST_MATCHDAY = 34;

    // Error texts at the card, by API error code
    var TIP_ERRORS = {
        INVALID_SCORE: 'Bitte für beide Teams eine ganze Zahl von 0 bis 20 eingeben.',
        TIP_LOCKED: 'Das Spiel hat begonnen, Tipps sind jetzt gesperrt.',
        MATCH_BEFORE_JOIN: 'Für Spiele, die vor deinem Beitritt begonnen haben, kannst du nicht tippen.',
        NOT_A_MEMBER: 'Du bist kein Mitglied dieser Tippgruppe.',
        MATCH_NOT_FOUND: 'Dieses Spiel gibt es nicht mehr. Bitte lade die Seite neu.'
    };

    var LOCK_CHECK_MS = 30000;

    var groupId = null;
    var currentMatchday = null;
    var serverTime = null;
    var serverOffsetMs = 0;
    var isLoading = false;

    // ---------- Helpers ----------

    function formatTime(iso) {
        return new Date(iso).toLocaleString('de-DE', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
    }

    function formatDay(iso) {
        return new Date(iso).toLocaleString('de-DE', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' });
    }

    // Calendar day in German time, so matches after midnight UTC are grouped correctly
    function dayKey(iso) {
        return new Date(iso).toLocaleDateString('de-DE', { timeZone: TZ });
    }

    function teamAbbr(team) {
        return (team.shortName || team.name || '?').replace(/[^A-Za-zÄÖÜäöü]/g, '').slice(0, 3).toUpperCase();
    }

    function scoreText(score) {
        return score ? score.home + ' : ' + score.away : '– : –';
    }

    // Geschätzte Serverzeit: letzte serverTime der API plus seitdem vergangene Zeit.
    // Geräteuhr misst nur die Dauer, eine falsch gestellte Uhr spielt keine Rolle.
    function serverNowIso() {
        return new Date(Date.now() + serverOffsetMs).toISOString();
    }

    // Time left until kickoff, measured against server time (display only)
    function countdown(kickoff, now) {
        var mins = Math.floor((Date.parse(kickoff) - Date.parse(now)) / 60000);
        if (mins <= 0 || mins >= 24 * 60) {
            return '';
        }
        var h = Math.floor(mins / 60);
        var m = mins % 60;
        return 'noch ' + (h > 0 ? h + ' Std ' : '') + m + ' Min';
    }

    // Card state from the API fields; lock only via "locked" and status
    function stateOf(match) {
        if (match.status === 'CANCELLED') { return 'cancelled'; }
        if (match.status === 'POSTPONED') { return 'postponed'; }
        if (match.status === 'FINISHED') { return 'finished'; }
        if (match.locked || match.status === 'LIVE') { return 'locked'; }
        return match.myTip ? 'tipped' : 'open';
    }

    function badge(cls, text) {
        return $('<span class="badge">').addClass(cls).text(text);
    }

    function statusBadge(state, match) {
        var left = countdown(match.kickoff, serverTime);
        switch (state) {
            case 'open': return badge('badge-warning', left ? 'Offen · ' + left : 'Offen');
            case 'tipped': return badge('badge-success', left ? 'Getippt · ' + left : 'Getippt');
            case 'locked': return badge('badge-locked', 'Gesperrt');
            case 'postponed': return badge('badge-locked', 'Verschoben');
            case 'cancelled': return badge('badge-locked', 'Abgesagt');
            default:
                // finished: points, neutral at 0
                if (match.myPoints > 0) { return badge('badge-success', '+' + match.myPoints + ' Punkte'); }
                if (match.myPoints === null && match.myTip) { return badge('badge-neutral', 'Wertung folgt'); }
                return badge('badge-neutral', match.myTip ? '0 Punkte' : 'Kein Tipp');
        }
    }

    // Crest as image; if missing or broken, the abbreviation is shown in the circle
    function crest(team) {
        var $badge = $('<span class="team-badge">');
        var abbr = teamAbbr(team);
        if (!team.crest) {
            return $badge.text(abbr);
        }
        $('<img class="team-crest" width="24" height="24" loading="lazy">')
            .on('error', function () { $badge.empty().text(abbr); })
            .attr({ src: team.crest, alt: 'Wappen ' + team.name })
            .appendTo($badge);
        return $badge;
    }

    function teamEl(team, away) {
        var $team = $('<div class="team">').toggleClass('team--away', away).attr('title', team.name);
        var $name = $('<span class="team-name">').text(team.shortName || team.name);
        return away ? $team.append($name, crest(team)) : $team.append(crest(team), $name);
    }

    function hint($target, text, isError) {
        $target.text(text).toggleClass('is-error', !!isError).prop('hidden', false);
    }

    // Whole number from 0 to 20 (convenience only, the server validates again)
    function validGoals(value) {
        if (!/^\d{1,2}$/.test(value)) { return false; }
        var n = parseInt(value, 10);
        return n >= MIN_GOALS && n <= MAX_GOALS;
    }

    function goalInput(match, side, team) {
        var id = 'tip-' + match.id + '-' + side;
        var $label = $('<label class="sr-only">').attr('for', id).text('Tore ' + (team.shortName || team.name));
        var $input = $('<input class="input tip-input" type="number" inputmode="numeric">')
            .attr({ id: id, name: side, min: MIN_GOALS, max: MAX_GOALS, step: 1 });
        if (match.myTip) {
            $input.val(match.myTip[side]);
        }
        return [$label, $input];
    }

    // ---------- Save tip ----------

    function tipErrorText(err) {
        return TIP_ERRORS[err.code] || err.message;
    }

    // Replace a card in place and optionally show a message on the new card
    function replaceCard($oldCard, match, message, isError) {
        var $newCard = matchCard(match);
        $oldCard.replaceWith($newCard);
        if (message) {
            hint($newCard.find('.tip-feedback'), message, isError);
        }
        return $newCard;
    }

    function saveTip(match, $card, $form) {
        var home = $.trim($form.find('[name="home"]').val());
        var away = $.trim($form.find('[name="away"]').val());
        var $feedback = $form.find('.tip-feedback');
        var $fields = $form.find('input, button');

        if (!validGoals(home) || !validGoals(away)) {
            hint($feedback, TIP_ERRORS.INVALID_SCORE, true);
            return;
        }

        // No double submit while the request is running
        $fields.prop('disabled', true);
        $feedback.prop('hidden', true);

        var path = '/groups/' + encodeURIComponent(groupId) +
            '/matches/' + encodeURIComponent(match.id) + '/tip';
        apiRequest('PUT', path, { home: parseInt(home, 10), away: parseInt(away, 10) })
            .then(function (saved) {
                match.myTip = { home: saved.home, away: saved.away };
                replaceCard($card, match, 'Tipp gespeichert', false);
            })
            .catch(function (err) {
                if (err.code === 'TIP_LOCKED' || err.code === 'MATCH_BEFORE_JOIN') {
                    // Server says no more tips: lock the card, keep the message
                    match.locked = true;
                    replaceCard($card, match, tipErrorText(err), true);
                    return;
                }
                $fields.prop('disabled', false);
                hint($feedback, tipErrorText(err), true);
            });
    }

    function tipForm(match, $card) {
        var $form = $('<form class="tip-form" novalidate>');
        var $fields = $('<div class="tip-fields">')
            .append(goalInput(match, 'home', match.homeTeam))
            .append($('<span class="tip-sep" aria-hidden="true">').text(':'))
            .append(goalInput(match, 'away', match.awayTeam));
        var $button = $('<button type="submit" class="btn btn-primary btn-block">')
            .text(match.myTip ? 'Tipp ändern' : 'Tipp speichern');
        var $feedback = $('<p class="tip-feedback" role="status" hidden>');

        $form.append($fields, $button, $feedback);
        $form.on('submit', function (e) {
            e.preventDefault();
            saveTip(match, $card, $form);
        });
        return $form;
    }

    // ---------- Rendering ----------

    function tipInfoText(state, match) {
        switch (state) {
            case 'cancelled': return 'Spiel wird nicht gewertet';
            case 'postponed': return 'Neuer Termin folgt';
            case 'finished':
            case 'locked':
                return match.myTip ? 'Dein Tipp: ' + scoreText(match.myTip) : 'Kein Tipp abgegeben';
            default: return 'Dein Tipp';
        }
    }

    function matchCard(match) {
        var state = stateOf(match);
        var $card = $('<article class="match-card">').addClass('match-card--' + state)
            .attr('aria-label', match.homeTeam.name + ' gegen ' + match.awayTeam.name)
            .data('match', match);

        $('<div class="match-card__top">')
            .append($('<span class="match-time">').text(formatTime(match.kickoff)))
            .append(statusBadge(state, match))
            .appendTo($card);

        var showScore = state === 'finished' || (state === 'locked' && match.result);
        $('<div class="match-card__teams">')
            .append(teamEl(match.homeTeam, false))
            .append($('<div class="match-card__score">').text(showScore ? scoreText(match.result) : '– : –'))
            .append(teamEl(match.awayTeam, true))
            .appendTo($card);

        $card.append($('<p class="match-card__tip">').text(tipInfoText(state, match)));

        if (state === 'open' || state === 'tipped') {
            $card.append(tipForm(match, $card));
        } else {
            // Locked cards have no input, only a slot for messages
            $card.append($('<p class="tip-feedback" role="status" hidden>'));
        }
        return $card;
    }

    function renderMatchday(data) {
        var $list = $('#matchday-list').empty();
        $('#md-title').text(data.matchday + '. Spieltag');

        var matches = (data.matches || []).slice().sort(function (a, b) {
            return Date.parse(a.kickoff) - Date.parse(b.kickoff);
        });
        if (!matches.length) {
            $list.append($('<p class="matchday-empty">').text('Für diesen Spieltag sind noch keine Spiele angesetzt.'));
            return;
        }

        var currentKey = null;
        var $group = null;
        matches.forEach(function (match) {
            var key = dayKey(match.kickoff);
            if (key !== currentKey) {
                currentKey = key;
                $group = $('<div class="matchday-day__list">');
                $('<section class="matchday-day">')
                    .append($('<h3 class="matchday-day__title">').text(formatDay(match.kickoff)))
                    .append($group)
                    .appendTo($list);
            }
            $group.append(matchCard(match));
        });
    }

    // ---------- Sperre ab Anstoß bei offener Seite (US-21) ----------

    // Alle 30 s: Countdown aktualisieren, offene Karten nach Anstoß sperren.
    // Karten mit laufendem Speichern überspringen, dort entscheidet die Serverantwort.
    function checkKickoffs() {
        if (serverTime === null) {
            return;
        }
        serverTime = serverNowIso();
        var now = Date.parse(serverTime);
        $('#matchday-list .match-card').each(function () {
            var $card = $(this);
            var match = $card.data('match');
            var state = match ? stateOf(match) : null;
            if (state !== 'open' && state !== 'tipped') {
                return;
            }
            if ($card.find('button[type="submit"]').prop('disabled')) {
                return;
            }
            if (Date.parse(match.kickoff) <= now) {
                match.locked = true;
                replaceCard($card, match, TIP_ERRORS.TIP_LOCKED, true);
            } else {
                $card.find('.match-card__top .badge').replaceWith(statusBadge(state, match));
            }
        });
    }

    // ---------- Loading and navigation ----------

    // Matchday from ?matchday= (1 to 34), otherwise null = current matchday
    function readMatchdayFromUrl() {
        var raw = new URLSearchParams(window.location.search).get('matchday');
        if (raw === null || !/^\d{1,2}$/.test(raw)) {
            return null;
        }
        var n = parseInt(raw, 10);
        return n >= FIRST_MATCHDAY && n <= LAST_MATCHDAY ? n : null;
    }

    // Keep groupId and matchday in the URL, so reloading shows the same matchday
    function writeMatchdayToUrl(matchday) {
        var params = new URLSearchParams(window.location.search);
        params.set('groupId', groupId);
        params.set('matchday', matchday);
        window.history.replaceState(null, '', window.location.pathname + '?' + params.toString());
    }

    function updateNav() {
        $('#md-prev').prop('disabled', isLoading || currentMatchday === null || currentMatchday <= FIRST_MATCHDAY);
        $('#md-next').prop('disabled', isLoading || currentMatchday === null || currentMatchday >= LAST_MATCHDAY);
    }

    function loadMatchday(matchday) {
        var path = '/groups/' + encodeURIComponent(groupId) + '/matches';
        if (matchday !== null) {
            path += '?matchday=' + encodeURIComponent(matchday);
        }

        isLoading = true;
        updateNav();
        $('#page-alert').hide().text('');

        apiRequest('GET', path)
            .then(function (data) {
                currentMatchday = data.matchday;
                serverTime = data.serverTime;
                serverOffsetMs = Date.parse(data.serverTime) - Date.now();
                renderMatchday(data);
                writeMatchdayToUrl(data.matchday);
            })
            .catch(function (err) {
                $('#page-alert').prop('hidden', false);
                showError('#page-alert', err);
            })
            .then(function () {
                isLoading = false;
                updateNav();
            });
    }

    window.renderMatchday = renderMatchday;

    $(function () {
        // Protected page: without a session redirect to login with return path
        if (!requireLogin()) {
            return;
        }
        // group-nav.js already redirected if the groupId is missing
        groupId = getGroupId();
        if (groupId === null) {
            return;
        }

        $('#md-prev').on('click', function () {
            if (currentMatchday > FIRST_MATCHDAY) { loadMatchday(currentMatchday - 1); }
        });
        $('#md-next').on('click', function () {
            if (currentMatchday < LAST_MATCHDAY) { loadMatchday(currentMatchday + 1); }
        });

        loadMatchday(readMatchdayFromUrl());
        window.setInterval(checkKickoffs, LOCK_CHECK_MS);
    });
})(jQuery);
