/*
 * create-group.js: Tippgruppe erstellen (US-08)
 * POST /api/groups, danach Erfolgsansicht mit Einladungscode, Link und Kopieren-Button.
 */
(function ($) {
    'use strict';

    var NAME_MAX = 50;

    // Nur Komfort, der Server prüft den Namen nochmal
    function validateName(name) {
        if (name === '') {
            return 'Bitte gib einen Namen für die Tippgruppe ein.';
        }
        if (name.length > NAME_MAX) {
            return 'Der Name darf höchstens 50 Zeichen lang sein.';
        }
        return null;
    }

    function updateCount() {
        $('#name-count').text($('#group-name').val().length + ' / ' + NAME_MAX);
    }

    function matchdayUrl(groupId) {
        return getSiteRoot() + 'html/matchday/Matchday.html?groupId=' + encodeURIComponent(groupId);
    }

    // Absolute URL aus window.location, damit der Link lokal und auf GitHub Pages stimmt
    function inviteUrl(code) {
        var path = getSiteRoot() + 'html/groups/JoinGroup.html?code=' + encodeURIComponent(code);
        return new URL(path, window.location.href).href;
    }

    function setStatus($status, text, isError) {
        $status.text(text).toggleClass('is-error', !!isError).prop('hidden', false);
    }

    // In die Zwischenablage kopieren, sonst Feld markieren für Strg+C
    function copyLink(link, $input, $button, $status) {
        var label = $button.text();
        var onSuccess = function () {
            $button.text('Kopiert');
            setStatus($status, 'Einladungslink in die Zwischenablage kopiert.', false);
            setTimeout(function () { $button.text(label); }, 2000);
        };
        var onFailure = function () {
            $input.trigger('focus').trigger('select');
            setStatus($status, 'Kopieren nicht möglich. Link ist markiert, bitte mit Strg+C kopieren.', true);
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(link).then(onSuccess, onFailure);
        } else {
            onFailure();
        }
    }

    function showProblem(message) {
        $('#page-alert').prop('hidden', false);
        showError('#page-alert', { message: message });
    }

    // Erfolgsansicht nach 201 Created
    function renderCreated(group) {
        var link = inviteUrl(group.inviteCode);
        var $input = $('<input class="input" type="text" id="invite-link" readonly>').val(link);
        var $copy = $('<button type="button" class="btn btn-primary">').text('Link kopieren');
        var $status = $('<p class="invite-status" role="status" hidden>');

        $copy.on('click', function () {
            copyLink(link, $input, $copy, $status);
        });
        $input.on('focus', function () { $(this).trigger('select'); });

        $('#created-card').empty()
            .append($('<h2 class="card-title">').text('Gruppe „' + group.name + '“ erstellt'))
            .append($('<p class="text-muted">').text('Schick deinen Mitspielern den Link oder den Code, damit sie beitreten können.'))
            .append($('<span class="label">').text('Einladungscode'))
            .append($('<div class="invite-code">')
                .append($('<span class="invite-code__value">').text(group.inviteCode)))
            .append($('<label class="label" for="invite-link">').text('Einladungslink'))
            .append($('<div class="invite-link">').append($input, $copy))
            .append($status)
            .append($('<div class="actions">')
                .append($('<a class="btn btn-secondary">').attr('href', matchdayUrl(group.id)).text('Zur Gruppe'))
                .append($('<a class="btn btn-secondary" href="Groups.html">').text('Alle Tippgruppen')))
            .prop('hidden', false);

        $('#create-card').prop('hidden', true);
        $('#create-lead').hide();
    }

    $(function () {
        // Geschützte Seite: ohne Sitzung zum Login, mit Rücksprung hierher
        if (!requireLogin()) {
            return;
        }
        $('#main').show();

        $('#group-name').on('input', updateCount);

        $('#create-form').on('submit', function (event) {
            event.preventDefault();

            var $name = $('#group-name');
            var name = $name.val().trim();
            var problem = validateName(name);
            if (problem !== null) {
                $name.addClass('is-invalid').trigger('focus');
                showProblem(problem);
                return;
            }

            $name.removeClass('is-invalid');
            $('#page-alert').hide();
            // Kein doppeltes Absenden während der Anfrage
            var $button = $('#create-button').prop('disabled', true);

            apiRequest('POST', '/groups', { name: name })
                .then(renderCreated)
                .catch(function (err) {
                    // z. B. 400 VALIDATION_ERROR vom Server
                    $('#page-alert').prop('hidden', false);
                    showError('#page-alert', err);
                    $button.prop('disabled', false);
                });
        });
    });
})(jQuery);