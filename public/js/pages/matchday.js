/*
 * matchday.js: Spieltagsseite
 * Vorerst mit Beispieldaten im Format von GET /api/groups/{groupId}/matches (API-Design 5.6).
 * Spaeter: renderMatchday(antwortDerApi) unveraendert aufrufen.
 */
(function ($) {
    'use strict';

    var TZ = 'Europe/Berlin';
    var MIN_GOALS = 0;
    var MAX_GOALS = 20;

    // Beispieldaten: alle Zustaende eines Spieltags, Zeiten in UTC, passend zu serverTime
    var SAMPLE_MATCHDAY = {
        matchday: 7,
        serverTime: '2026-10-18T14:00:00Z',
        matches: [
            {
                id: 201, kickoff: '2026-10-16T18:30:00Z', status: 'FINISHED', locked: true,
                homeTeam: { name: 'FC Bayern München', shortName: 'Bayern', crest: 'https://crests.football-data.org/5.png' },
                awayTeam: { name: 'Borussia Dortmund', shortName: 'Dortmund', crest: 'https://crests.football-data.org/4.png' },
                result: { home: 3, away: 1 }, myTip: { home: 3, away: 1 }, myPoints: 4
            },
            {
                id: 202, kickoff: '2026-10-17T13:30:00Z', status: 'FINISHED', locked: true,
                homeTeam: { name: 'SC Freiburg', shortName: 'Freiburg', crest: 'https://crests.football-data.org/17.png' },
                awayTeam: { name: 'VfB Stuttgart', shortName: 'Stuttgart', crest: 'https://crests.football-data.org/10.png' },
                result: { home: 0, away: 2 }, myTip: { home: 1, away: 3 }, myPoints: 3
            },
            {
                id: 203, kickoff: '2026-10-17T13:30:00Z', status: 'FINISHED', locked: true,
                homeTeam: { name: 'RB Leipzig', shortName: 'Leipzig', crest: 'https://crests.football-data.org/721.png' },
                awayTeam: { name: 'Bayer 04 Leverkusen', shortName: 'Leverkusen', crest: 'https://crests.football-data.org/3.png' },
                result: { home: 2, away: 0 }, myTip: { home: 3, away: 0 }, myPoints: 2
            },
            {
                id: 204, kickoff: '2026-10-17T13:30:00Z', status: 'FINISHED', locked: true,
                homeTeam: { name: 'VfL Wolfsburg', shortName: 'Wolfsburg', crest: 'https://crests.football-data.org/11.png' },
                awayTeam: { name: '1. FSV Mainz 05', shortName: 'Mainz', crest: 'https://crests.football-data.org/15.png' },
                result: { home: 1, away: 1 }, myTip: { home: 2, away: 0 }, myPoints: 0
            },
            {
                id: 205, kickoff: '2026-10-17T13:30:00Z', status: 'CANCELLED', locked: true,
                homeTeam: { name: '1. FC Köln', shortName: 'Köln', crest: 'https://crests.football-data.org/1.png' },
                awayTeam: { name: 'Hamburger SV', shortName: 'HSV', crest: 'https://crests.football-data.org/7.png' },
                result: null, myTip: null, myPoints: null
            },
            {
                id: 206, kickoff: '2026-10-17T16:30:00Z', status: 'POSTPONED', locked: true,
                homeTeam: { name: 'Borussia Mönchengladbach', shortName: 'Mönchengladbach', crest: 'https://crests.football-data.org/18.png' },
                awayTeam: { name: '1. FC Union Berlin', shortName: 'Union Berlin', crest: 'https://crests.football-data.org/28.png' },
                result: null, myTip: { home: 1, away: 0 }, myPoints: null
            },
            {
                id: 207, kickoff: '2026-10-18T13:30:00Z', status: 'LIVE', locked: true,
                homeTeam: { name: 'Eintracht Frankfurt', shortName: 'Frankfurt', crest: 'https://crests.football-data.org/19.png' },
                awayTeam: { name: 'SV Werder Bremen', shortName: 'Bremen', crest: 'https://crests.football-data.org/12.png' },
                result: null, myTip: { home: 2, away: 2 }, myPoints: null
            },
            {
                id: 208, kickoff: '2026-10-18T15:30:00Z', status: 'UPCOMING', locked: false,
                homeTeam: { name: 'TSG Hoffenheim', shortName: 'Hoffenheim', crest: 'https://crests.football-data.org/2.png' },
                awayTeam: { name: 'FC Augsburg', shortName: 'Augsburg', crest: 'https://crests.football-data.org/16.png' },
                result: null, myTip: null, myPoints: null
            },
            {
                id: 209, kickoff: '2026-10-18T17:30:00Z', status: 'UPCOMING', locked: false,
                homeTeam: { name: '1. FC Heidenheim 1846', shortName: 'Heidenheim', crest: 'https://crests.football-data.org/44.png' },
                awayTeam: { name: 'FC St. Pauli', shortName: 'St. Pauli', crest: 'https://crests.football-data.org/20.png' },
                result: null, myTip: { home: 2, away: 1 }, myPoints: null
            }
        ]
    };

    // ---------- Hilfsfunktionen ----------

    function formatTime(iso) {
        return new Date(iso).toLocaleString('de-DE', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
    }

    function formatDay(iso) {
        return new Date(iso).toLocaleString('de-DE', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' });
    }

    // Kalendertag in deutscher Zeit, damit Spiele nach Mitternacht UTC richtig gruppiert werden
    function dayKey(iso) {
        return new Date(iso).toLocaleDateString('de-DE', { timeZone: TZ });
    }

    function teamAbbr(team) {
        return (team.shortName || team.name || '?').replace(/[^A-Za-zÄÖÜäöü]/g, '').slice(0, 3).toUpperCase();
    }

    function scoreText(score) {
        return score ? score.home + ' : ' + score.away : '– : –';
    }

    // Restzeit bis Anstoss, gemessen an der Serverzeit (nicht an der Geräteuhr)
    function countdown(kickoff, serverTime) {
        var mins = Math.floor((Date.parse(kickoff) - Date.parse(serverTime)) / 60000);
        if (mins <= 0 || mins >= 24 * 60) {
            return '';
        }
        var h = Math.floor(mins / 60);
        var m = mins % 60;
        return 'noch ' + (h > 0 ? h + ' Std ' : '') + m + ' Min';
    }

    // Zustand der Karte aus den API-Feldern ableiten
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

    function statusBadge(state, match, serverTime) {
        var left = countdown(match.kickoff, serverTime);
        switch (state) {
            case 'open': return badge('badge-warning', left ? 'Offen · ' + left : 'Offen');
            case 'tipped': return badge('badge-success', left ? 'Getippt · ' + left : 'Getippt');
            case 'locked': return badge('badge-locked', 'Gesperrt · läuft');
            case 'postponed': return badge('badge-locked', 'Verschoben');
            case 'cancelled': return badge('badge-locked', 'Abgesagt');
            default:
                // beendet: Punkte, bei 0 neutral
                if (match.myPoints > 0) { return badge('badge-success', '+' + match.myPoints + ' Punkte'); }
                return badge('badge-neutral', match.myTip ? '0 Punkte' : 'Kein Tipp');
        }
    }

    // Wappen als Bild; fehlt es oder lädt es nicht, steht das Kürzel im Kreis
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

    // Eingabe prüfen: ganze Zahl von 0 bis 20
    function validGoals(value) {
        if (!/^\d{1,2}$/.test(value)) { return false; }
        var n = parseInt(value, 10);
        return n >= MIN_GOALS && n <= MAX_GOALS;
    }

    function goalInput(match, side, team, disabled) {
        var id = 'tip-' + match.id + '-' + side;
        var $label = $('<label class="sr-only">').attr('for', id).text('Tore ' + (team.shortName || team.name));
        var $input = $('<input class="input tip-input" type="number" inputmode="numeric">')
            .attr({ id: id, name: side, min: MIN_GOALS, max: MAX_GOALS, step: 1 })
            .prop('disabled', disabled);
        if (match.myTip) {
            $input.val(match.myTip[side]);
        }
        return [$label, $input];
    }

    function tipForm(match, disabled) {
        var $form = $('<form class="tip-form" novalidate>');
        var $fields = $('<div class="tip-fields">')
            .append(goalInput(match, 'home', match.homeTeam, disabled))
            .append($('<span class="tip-sep" aria-hidden="true">').text(':'))
            .append(goalInput(match, 'away', match.awayTeam, disabled));
        $form.append($fields);

        if (!disabled) {
            var $feedback = $('<p class="tip-feedback" role="status" hidden>');
            $form.append($('<button type="submit" class="btn btn-primary btn-block">').text('Tipp speichern'), $feedback);
            $form.on('submit', function (e) {
                e.preventDefault();
                var home = $.trim($form.find('[name="home"]').val());
                var away = $.trim($form.find('[name="away"]').val());
                if (!validGoals(home) || !validGoals(away)) {
                    hint($feedback, 'Bitte für beide Teams eine ganze Zahl von 0 bis 20 eingeben.', true);
                    return;
                }
                // Speichern folgt mit PUT /api/groups/{groupId}/matches/{matchId}/tip
                hint($feedback, 'Vorschau: Tipp ' + home + ' : ' + away + ' ist gültig. Speichern folgt mit der API.', false);
            });
        }
        return $form;
    }

    function matchCard(match, serverTime) {
        var state = stateOf(match);
        var $card = $('<article class="match-card">').addClass('match-card--' + state)
            .attr('aria-label', match.homeTeam.name + ' gegen ' + match.awayTeam.name);

        $('<div class="match-card__top">')
            .append($('<span class="match-time">').text(formatTime(match.kickoff)))
            .append(statusBadge(state, match, serverTime))
            .appendTo($card);

        var showScore = state === 'finished' || (state === 'locked' && match.result);
        $('<div class="match-card__teams">')
            .append(teamEl(match.homeTeam, false))
            .append($('<div class="match-card__score">').text(showScore ? scoreText(match.result) : '– : –'))
            .append(teamEl(match.awayTeam, true))
            .appendTo($card);

        var $info = $('<p class="match-card__tip">');
        if (state === 'cancelled') {
            $info.text('Spiel wird nicht gewertet');
        } else if (state === 'postponed') {
            $info.text('Neuer Termin folgt');
        } else if (state === 'finished') {
            $info.text(match.myTip ? 'Dein Tipp: ' + scoreText(match.myTip) : 'Kein Tipp abgegeben');
        } else if (state === 'locked') {
            $info.text(match.result ? 'Zwischenstand · Ergebnis folgt' : 'Läuft · Ergebnis folgt');
        } else {
            $info.text('Dein Tipp');
        }
        $card.append($info);

        if (state === 'open' || state === 'tipped') {
            $card.append(tipForm(match, false));
        } else if (state === 'locked' || state === 'postponed') {
            $card.append(tipForm(match, true));
        }
        return $card;
    }

    // ---------- Rendern ----------

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
            $group.append(matchCard(match, data.serverTime));
        });
    }

    window.renderMatchday = renderMatchday;

    $(function () {
        renderMatchday(SAMPLE_MATCHDAY);

        var $alert = $('#page-alert');
        // Platzhalter, bis Rangliste, Gruppe und weitere Spieltage angebunden sind
        $('#md-prev, #md-next').on('click', function () {
            hint($alert, 'Andere Spieltage folgen, sobald die API angebunden ist.');
        });
        $('.tabs [data-soon]').on('click', function (e) {
            e.preventDefault();
            hint($alert, 'Die Ansicht „' + $(this).attr('data-soon') + '“ folgt in der nächsten Phase.');
        });
    });
})(jQuery);