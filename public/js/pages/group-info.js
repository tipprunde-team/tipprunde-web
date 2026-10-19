/*
 * group-info.js: group page with members and invite link (US-11, part of US-08)
 * For now uses sample data in the exact format of GET /api/groups/{groupId} (see API design).
 * Later: replace SAMPLE_GROUP with
 *   apiRequest('GET', '/groups/' + getGroupId()).then(renderGroup).catch(...)
 * renderGroup(data) stays unchanged.
 */
(function ($) {
    'use strict';

    var TZ = 'Europe/Berlin';

    // Sample response of GET /api/groups/{groupId}; inviteCode is only sent to admins
    var SAMPLE_GROUP = {
        id: 3,
        name: 'WG Lohrtalweg',
        currentMatchday: 6,
        inviteCode: 'k7Qp2xZ9',
        members: [
            { userId: 7, username: 'niklas', role: 'ADMIN', joinedAt: '2026-10-01T18:00:00Z' },
            { userId: 12, username: 'maximilian', role: 'MEMBER', joinedAt: '2026-10-01T18:05:00Z' },
            { userId: 15, username: 'arlind', role: 'MEMBER', joinedAt: '2026-10-02T07:40:00Z' },
            { userId: 21, username: 'max', role: 'MEMBER', joinedAt: '2026-10-03T19:12:00Z' }
        ]
    };

    var ROLE_LABELS = { ADMIN: 'Admin', MEMBER: 'Mitglied' };

    // ---------- Helpers ----------

    // Date in German format and German time, e.g. 01.10.2026
    function formatDate(iso) {
        var date = new Date(iso);
        if (isNaN(date.getTime())) {
            return '';
        }
        return date.toLocaleDateString('de-DE', {
            timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric'
        });
    }

    function initials(username) {
        return (username || '?').replace(/[^A-Za-zÄÖÜäöü0-9]/g, '').slice(0, 2).toUpperCase() || '?';
    }

    // Admins first, then by join date
    function sortMembers(members) {
        return members.slice().sort(function (a, b) {
            if (a.role !== b.role) {
                return a.role === 'ADMIN' ? -1 : 1;
            }
            return Date.parse(a.joinedAt) - Date.parse(b.joinedAt);
        });
    }

    // Absolute URL from window.location, so it is correct locally and on GitHub Pages
    function inviteUrl(code) {
        var path = getSiteRoot() + 'html/groups/JoinGroup.html?code=' + encodeURIComponent(code);
        return new URL(path, window.location.href).href;
    }

    function setStatus($status, text, isError) {
        $status.text(text).toggleClass('is-error', !!isError).prop('hidden', false);
    }

    // Copy to clipboard with confirmation; fallback: select the field for Ctrl+C
    function copyInviteLink(link, $input, $button, $status) {
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

    // ---------- Rendering ----------

    function renderInvite(group) {
        var $card = $('#invite-card').empty();
        if (!group.inviteCode) {
            // Member view: no invite link
            $card.prop('hidden', true);
            return;
        }

        var link = inviteUrl(group.inviteCode);
        var $input = $('<input class="input" type="text" id="invite-link" readonly>').val(link);
        var $button = $('<button type="button" class="btn btn-primary" id="copy-invite">').text('Link kopieren');
        var $status = $('<p class="invite-status" role="status" hidden>');

        $button.on('click', function () {
            copyInviteLink(link, $input, $button, $status);
        });
        // Click into the field selects the whole link
        $input.on('focus', function () { $(this).trigger('select'); });

        $card
            .append($('<h2 class="card-title" id="invite-title">').text('Mitglieder einladen'))
            .append($('<p class="text-muted">').text('Teile den Link, damit andere deiner Tippgruppe beitreten können.'))
            .append($('<label class="label" for="invite-link">').text('Einladungslink'))
            .append($('<div class="invite-link">').append($input, $button))
            .append($('<p class="invite-code-line">')
                .append(document.createTextNode('Einladungscode: '))
                .append($('<code class="invite-code-inline">').text(group.inviteCode)))
            .append($status)
            .prop('hidden', false);
    }

    function renderMember(member, myUserId) {
        var isMe = myUserId !== null && member.userId === myUserId;
        var isAdmin = member.role === 'ADMIN';
        var joined = formatDate(member.joinedAt);

        var $name = $('<span class="member__name">').text(member.username);
        if (isMe) {
            $name.append($('<span class="you">').text('(Du)'));
        }

        return $('<li class="member">').toggleClass('is-me', isMe)
            .append($('<span class="member__avatar" aria-hidden="true">').text(initials(member.username)))
            .append($('<div class="member__body">')
                .append($name)
                .append($('<span class="member__meta">').text(joined ? 'Dabei seit ' + joined : '')))
            .append($('<span class="badge">')
                .addClass(isAdmin ? 'badge-admin' : 'badge-locked')
                .text(ROLE_LABELS[member.role] || member.role));
    }

    function renderMembers(group) {
        var members = sortMembers(group.members || []);
        var myUserId = getUserId();
        var $card = $('#members-card').empty();

        $card.append($('<h2 class="card-title" id="members-title">')
            .text('Mitglieder (' + members.length + ')'));

        if (!members.length) {
            $card.append($('<p class="text-muted">').text('Noch keine Mitglieder.'));
            return;
        }

        var $list = $('<ul class="member-list">');
        members.forEach(function (member) {
            $list.append(renderMember(member, myUserId));
        });
        $card.append($list);
    }

    // Entry point, later called unchanged with the API response
    function renderGroup(data) {
        $('#group-name').text(data.name);
        document.title = data.name + ' – Tipprunde';
        renderInvite(data);
        renderMembers(data);
    }

    window.renderGroup = renderGroup;

    $(function () {
        // Protected page: without a session redirect to login with return path
        if (!requireLogin()) {
            return;
        }
        $('#main').show();
        renderGroup(SAMPLE_GROUP);
    });
})(jQuery);
