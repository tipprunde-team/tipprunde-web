/*
 * join-group.js: Tippgruppe per Einladungscode beitreten (US-09, UC-02)
 * Vorschau über GET /api/invites/{code} auch ohne Login,
 * Beitritt über POST /api/groups/join nur mit Login (Rücksprung inkl. Code).
 */
(function ($) {
    'use strict';

    var CODE_PATTERN = /^[A-Za-z0-9_-]{4,64}$/;

    var JOIN_ERRORS = {
        INVITE_INVALID: 'Dieser Einladungscode ist ungültig. Prüf den Code oder frag den Admin nach einem neuen Link.',
        GROUP_FULL: 'Diese Tippgruppe ist voll. Eine Gruppe hat höchstens 200 Mitglieder.'
    };

    function fetchPreview(code) {
        return apiRequest('GET', '/invites/' + encodeURIComponent(code));
    }

    function joinGroup(code) {
        return apiRequest('POST', '/groups/join', { inviteCode: code });
    }

    // ---------- Hilfsfunktionen ----------

    function errorText(err) {
        return JOIN_ERRORS[err.code] || err.message;
    }

    function showProblem(message) {
        $('#page-alert').prop('hidden', false);
        showError('#page-alert', { message: message });
    }

    function hideProblem() {
        $('#page-alert').hide().text('');
    }

    function membersText(count) {
        return count === 1 ? '1 Mitglied' : count + ' Mitglieder';
    }

    function readCodeFromUrl() {
        return (new URLSearchParams(window.location.search).get('code') || '').trim();
    }

    // Code in die URL schreiben, damit der Rücksprung nach dem Login ihn wieder hat
    function writeCodeToUrl(code) {
        var params = new URLSearchParams(window.location.search);
        params.set('code', code);
        window.history.replaceState(null, '', window.location.pathname + '?' + params.toString());
    }

    // Akzeptiert auch einen ganzen Einladungslink
    function extractCode(value) {
        var text = value.trim();
        var match = text.match(/[?&]code=([^&#\s]+)/);
        if (!match) {
            return text;
        }
        try {
            return decodeURIComponent(match[1]);
        } catch (e) {
            return match[1];
        }
    }

    function goToGroup(groupId) {
        window.location.href = getSiteRoot() + 'html/matchday/Matchday.html?groupId=' + encodeURIComponent(groupId);
    }

    // ---------- Ablauf ----------

    function join(code, preview, $button) {
        // Beitreten nur mit Login, danach zurück auf diese URL inkl. Code
        if (!isLoggedIn()) {
            redirectToLogin();
            return;
        }
        hideProblem();
        $button.prop('disabled', true);

        joinGroup(code)
            .then(function () {
                goToGroup(preview.groupId);
            })
            .catch(function (err) {
                // Schon Mitglied: einfach zur Gruppe
                if (err.code === 'ALREADY_MEMBER') {
                    goToGroup(preview.groupId);
                    return;
                }
                showProblem(errorText(err));
                $button.prop('disabled', false);
            });
    }

    function renderPreview(code, preview) {
        var loggedIn = isLoggedIn();
        var $join = $('<button type="button" class="btn btn-primary btn-block">')
            .text(loggedIn ? 'Beitreten' : 'Anmelden und beitreten');
        $join.on('click', function () {
            join(code, preview, $join);
        });

        var $card = $('#join-preview').empty()
            .append($('<p class="text-muted">').text('Einladung in die Tippgruppe'))
            .append($('<h2 class="join-preview__name">').text(preview.groupName))
            .append($('<p class="join-preview__meta">').text(membersText(preview.memberCount)))
            .append($join);
        if (!loggedIn) {
            $card.append($('<p class="form-hint">').text('Nach der Anmeldung kommst du hierher zurück.'));
        }
        $card.prop('hidden', false);
    }

    function checkCode(code) {
        hideProblem();
        $('#join-preview').prop('hidden', true).empty();

        if (code === '') {
            showProblem('Bitte gib einen Einladungscode ein.');
            return;
        }
        if (!CODE_PATTERN.test(code)) {
            showProblem(JOIN_ERRORS.INVITE_INVALID);
            return;
        }

        writeCodeToUrl(code);
        var $button = $('#check-button').prop('disabled', true);

        fetchPreview(code)
            .then(function (preview) {
                renderPreview(code, preview);
            })
            .catch(function (err) {
                showProblem(errorText(err));
            })
            .then(function () {
                $button.prop('disabled', false);
            });
    }

    $(function () {
        $('#join-form').on('submit', function (event) {
            event.preventDefault();
            var code = extractCode($('#invite-code').val());
            $('#invite-code').val(code);
            checkCode(code);
        });

        // Code aus dem Einladungslink direkt prüfen
        var code = readCodeFromUrl();
        if (code !== '') {
            $('#invite-code').val(code);
            checkCode(code);
        }
    });
})(jQuery);