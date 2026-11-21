(function () {
    'use strict';

   
    var CONFIG = {
        whatsapp: '48000000000',     
        email: 'kontakt@example.com',
        timeZone: 'Europe/Warsaw',
        
        hours: {
            0: [9, 18], 1: [8, 19], 2: [8, 19], 3: [8, 19],
            4: [8, 19], 5: [8, 19], 6: [9, 18]
        }
    };

    var isPL = document.documentElement.lang === 'pl';
    var T = isPL ? {
        open: 'Otwarte teraz · do ',
        soon: 'Zamykamy wkrótce · do ',
        today: 'Zamknięte · otwieramy dziś o ',
        tomorrow: 'Zamknięte · otwieramy jutro o ',
        outside: 'Wybrana godzina jest poza godzinami otwarcia: ',
        subject: 'Rezerwacja stolika',
        greet: 'Dzień dobry! Mam pytanie.'
    } : {
        open: 'Open now · until ',
        soon: 'Closing soon · until ',
        today: 'Closed · opens today at ',
        tomorrow: 'Closed · opens tomorrow at ',
        outside: 'The selected time is outside opening hours: ',
        subject: 'Table booking',
        greet: 'Hello! I have a question.'
    };

    function pad(n) { return (n < 10 ? '0' : '') + n; }

    
    function localNow() {
        var parts = new Intl.DateTimeFormat('en-US', {
            timeZone: CONFIG.timeZone,
            weekday: 'short',
            hour: 'numeric',
            minute: 'numeric',
            hourCycle: 'h23'
        }).formatToParts(new Date());
        var map = {};
        parts.forEach(function (p) { map[p.type] = p.value; });
        var days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
        return {
            day: days[map.weekday],
            minutes: (parseInt(map.hour, 10) % 24) * 60 + parseInt(map.minute, 10)
        };
    }

    function updateStatus() {
        var el = document.getElementById('status');
        if (!el) return;
        try {
            var now = localNow();
            var today = CONFIG.hours[now.day];
            var tomorrow = CONFIG.hours[(now.day + 1) % 7];
            var open = today[0] * 60;
            var close = today[1] * 60;
            var state, text;

            if (now.minutes >= open && now.minutes < close) {
                var soon = close - now.minutes <= 60;
                state = soon ? 'soon' : 'open';
                text = (soon ? T.soon : T.open) + today[1] + ':00';
            } else if (now.minutes < open) {
                state = 'closed';
                text = T.today + today[0] + ':00';
            } else {
                state = 'closed';
                text = T.tomorrow + tomorrow[0] + ':00';
            }
            el.className = 'status ' + state;
            el.textContent = text;
        } catch (e) {
            el.textContent = '';
        }
    }
    updateStatus();
    setInterval(updateStatus, 60000);

    
    var wa = document.querySelector('.wa-float');
    if (wa) {
        wa.href = 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(T.greet);
    }

    
    var form = document.getElementById('book-form');
    if (!form) return;
    var note = document.getElementById('book-note');

    var d = new Date();
    form.elements.date.min = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        note.textContent = '';

        var guest = form.elements.guest.value.trim();
        var date = form.elements.date.value;
        var time = form.elements.time.value;
        var guests = form.elements.guests.value;
        if (!guest || !date || !time) return;

        var hrs = CONFIG.hours[new Date(date + 'T12:00:00').getDay()];
        var t = time.split(':');
        var mins = parseInt(t[0], 10) * 60 + parseInt(t[1], 10);
        if (mins < hrs[0] * 60 || mins >= hrs[1] * 60) {
            note.textContent = T.outside + hrs[0] + ':00–' + hrs[1] + ':00.';
            return;
        }

        var prettyDate = date.split('-').reverse().join('.');
        var msg = isPL
            ? 'Dzień dobry! Proszę o rezerwację stolika. Data: ' + prettyDate +
              ', godzina: ' + time + ', liczba osób: ' + guests + '. Imię: ' + guest + '.'
            : 'Hello! I would like to book a table. Date: ' + prettyDate +
              ', time: ' + time + ', guests: ' + guests + '. Name: ' + guest + '.';

        var channel = (e.submitter && e.submitter.getAttribute('data-channel')) || 'whatsapp';
        if (channel === 'email') {
            window.location.href = 'mailto:' + CONFIG.email +
                '?subject=' + encodeURIComponent(T.subject) +
                '&body=' + encodeURIComponent(msg);
        } else {
            window.open('https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
        }
    });
})();
