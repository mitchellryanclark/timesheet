const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxNB-c_Zm9M8Y4VY4ik5y4WEazBugZVUZH2grDrjzoKBVQqiFxOYTudbM7z3km0FRxQ/exec";

let currentViewDate = new Date();

// --- PUSH NOTIFICATIONS & OFFLINE ---
let pushEnabled = false;
function requestNotifications() {
    if ("Notification" in window) {
        Notification.requestPermission().then(perm => {
            pushEnabled = (perm === "granted");
        });
    }
}
function sendPushNotification(title, body) {
    if (pushEnabled && "Notification" in window && Notification.permission === "granted") {
        new Notification(title, { body, icon: "https://cdn-icons-png.flaticon.com/512/2091/2091665.png" });
    }
}
document.body.addEventListener('click', requestNotifications, { once: true });

function checkMissingDays() {
    let history = JSON.parse(localStorage.getItem('rushTimesheet')) || {};
    let today = new Date();
    let dayOfWeek = today.getDay(); // 1 = Mon ... 5 = Fri

    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        let yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        let dateStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

        if (!history[dateStr]) {
            setTimeout(() => {
                sendPushNotification("🕒 Missing Timesheet Entry", "You haven't logged your hours for yesterday. Please update them to ensure accurate pay.");
            }, 5000);
        }
    }
}
// Try immediately if permission was already given
setTimeout(checkMissingDays, 2000);

const notification = (msg, color = "#28a745") => {
    const bar = document.getElementById('notification-bar');
    bar.style.backgroundColor = color;
    bar.innerText = msg;
    bar.style.top = "0";
    setTimeout(() => bar.style.top = "-100px", 4000);
};

function format12h(t) {
    if (!t) return "";
    let [h, m] = t.split(':');
    let ampm = h >= 12 ? 'PM' : 'AM';
    return (h % 12 || 12) + ":" + m + " " + ampm;
}

function updateLiveCalc() {
    const s = document.getElementById('start-time').value;
    const e = document.getElementById('end-time').value;
    const l = parseFloat(document.getElementById('lunch-break').value) || 0;

    if (s && e) {
        let start = s.split(':'), end = e.split(':');
        let startMins = (parseInt(start[0]) * 60) + parseInt(start[1]);
        let endMins = (parseInt(end[0]) * 60) + parseInt(end[1]);

        let diff = endMins - startMins;
        if (diff < 0) diff += 1440; // Over-midnight handler

        // Round total minutes to nearest 5 minutes for absolute safety (diff is total shift minutes)
        diff = Math.round(diff / 5) * 5;

        let total = (diff / 60) - l;
        if (total < 0) total = 0;

        const formattedTotal = total.toFixed(2);
        document.getElementById('auto-calc-display').innerHTML = `Total: <strong>${formattedTotal}</strong> hours`;
        return formattedTotal;
    }
    document.getElementById('auto-calc-display').innerHTML = `Total: 0.00 hours`;
    return "0.00";
}

function snapTo5Mins(inputElem) {
    if (!inputElem.value) return;
    let [h, m] = inputElem.value.split(':').map(Number);
    m = Math.round(m / 5) * 5;
    if (m === 60) { m = 0; h += 1; }
    if (h === 24) { h = 0; }
    inputElem.value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    updateLiveCalc();
}

document.querySelectorAll('.time-input').forEach(i => {
    i.oninput = updateLiveCalc;
    i.onchange = () => snapTo5Mins(i);
});
document.getElementById('lunch-break').oninput = updateLiveCalc;

// --- ENHANCED VOICE LOGIC INTEGRATION ---
function parseVoiceTime(text, isRange = false) {
    const numMap = { "one": "1", "two": "2", "three": "3", "four": "4", "five": "5", "six": "6", "seven": "7", "eight": "8", "nine": "9", "ten": "10", "eleven": "11", "twelve": "12" };
    for (let w in numMap) text = text.replace(new RegExp('\\b' + w + '\\b', 'g'), numMap[w]);

    // Added relative time support
    text = text.replace(/quarter to (\d{1,2})/, (m, h) => {
        let hr = parseInt(h) - 1;
        if (hr <= 0) hr += 12;
        return hr + ":45";
    });
    text = text.replace(/quarter past (\d{1,2})/, (m, h) => h + ":15");
    text = text.replace(/half past (\d{1,2})/, (m, h) => h + ":30");

    if (/\bnoon\b/.test(text)) return "12:00";
    if (/\bmidnight\b/.test(text)) return "00:00";
    let isAM = /am|a\.m\.|morning/.test(text);
    let isPM = /pm|p\.m\.|evening|night|tonight|afternoon/.test(text);
    let cleanText = text.replace(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/g, '').replace(/\b\d{1,2}(st|nd|rd|th)\b/g, '').replace(/on the \d{1,2}/g, '').replace(/yesterday|today/g, '').replace(/(last\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/g, '');
    const match = cleanText.match(/(\d{1,2})[:\s]?(\d{2})?/);
    if (!match) return null;
    let h = parseInt(match[1]);
    let m = match[2] ? parseInt(match[2]) : 0;
    if (isAM) { if (h === 12) h = 0; }
    else if (isPM) { if (h < 12) h += 12; }
    else {
        if (isRange) {
            if (h >= 1 && h <= 5) h += 12;
        } else {
            if (new Date().getHours() >= 12 && h < 12) h += 12;
        }
    }
    return h.toString().padStart(2, '0') + ":" + m.toString().padStart(2, '0');
}

function optimizeShift(anchorTime, newTime, isSettingStart) {
    let [ah, am] = anchorTime.split(':').map(Number);
    let [nh, nm] = newTime.split(':').map(Number);
    let anchorMins = ah * 60 + am;
    let opt1Mins = nh * 60 + nm;
    let opt2Mins = (nh < 12 ? nh + 12 : nh - 12) * 60 + nm;
    let dur1 = isSettingStart ? anchorMins - opt1Mins : opt1Mins - anchorMins;
    if (dur1 < 0) dur1 += 1440;
    let dur2 = isSettingStart ? anchorMins - opt2Mins : opt2Mins - anchorMins;
    if (dur2 < 0) dur2 += 1440;
    return (dur2 < 840 && dur2 < dur1) ? (Math.floor(opt2Mins / 60).toString().padStart(2, '0') + ":" + nm.toString().padStart(2, '0')) : newTime;
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    const monthMap = { "january": 0, "february": 1, "march": 2, "april": 3, "may": 4, "june": 5, "july": 6, "august": 7, "september": 8, "october": 9, "november": 10, "december": 11 };
    const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

    document.getElementById('mic-btn').onclick = () => { recognition.start(); notification("🎤 Listening...", "#28a745"); };

    recognition.onresult = (event) => {
        const rawSpeech = event.results[0][0].transcript.toLowerCase();
        let speech = rawSpeech;
        const numMap = { "one": "1", "two": "2", "three": "3", "four": "4", "five": "5", "six": "6", "seven": "7", "eight": "8", "nine": "9", "ten": "10", "eleven": "11", "twelve": "12", "thirty": "30", "forty-five": "45", "fifteen": "15" };
        for (let w in numMap) speech = speech.replace(new RegExp('\\b' + w + '\\b', 'g'), numMap[w]);

        const dateField = document.getElementById('date');
        const isJust = speech.includes("just") || speech.includes("now");
        const hasExplicitAMPM = /am|a\.m\.|pm|p\.m\.|morning|night|evening|afternoon/.test(speech);

        // A. Parse Date & Explicit Months & Weekdays
        let targetDate = new Date();
        let dateFound = false;

        if (speech.includes("yesterday")) {
            targetDate.setDate(targetDate.getDate() - 1);
            dateFound = true;
        } else if (speech.includes("today") || isJust) {
            dateFound = true;
        } else {
            const monthMatch = speech.match(/(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})/);
            const dayMatch = speech.match(/(?:on )?(?:the )?(\d{1,2})(?:st|nd|rd|th)/) || speech.match(/on the (\d{1,2})/);
            const weekdayMatch = speech.match(/(last\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/);

            if (monthMatch) {
                targetDate.setMonth(monthMap[monthMatch[1]]);
                targetDate.setDate(parseInt(monthMatch[2]));
                dateFound = true;
            } else if (weekdayMatch) {
                let isLast = !!weekdayMatch[1];
                let spokenDay = daysOfWeek.indexOf(weekdayMatch[2]);
                let todayDay = targetDate.getDay();

                let daysAgo = todayDay - spokenDay;
                if (daysAgo <= 0) daysAgo += 7; // Get the most recent occurrence

                // If "Last" is spoken, only add 7 days if the most recent occurrence was THIS calendar week
                if (isLast && daysAgo < todayDay) {
                    daysAgo += 7;
                }

                targetDate.setDate(targetDate.getDate() - daysAgo);
                dateFound = true;
            } else if (dayMatch) {
                targetDate.setDate(parseInt(dayMatch[1]));
                dateFound = true;
            }
        }

        if (dateFound || !dateField.value) {
            const dateStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
            // Preserve current voice inputs if we are switching dates via voice
            const oldStart = document.getElementById('start-time').value;
            const oldEnd = document.getElementById('end-time').value;

            selectCalendarDate(dateStr);

            if (oldStart && !document.getElementById('start-time').value) document.getElementById('start-time').value = oldStart;
            if (oldEnd && !document.getElementById('end-time').value) document.getElementById('end-time').value = oldEnd;
        }

        // B. Parse Range or Single Time
        let handledAsRange = false;

        if (!speech.includes("change")) {
            const rangeMatch = speech.match(/(?:from\s+)?(.*?)\s+(?:to|until|till|through)\s+(.*)/);
            if (rangeMatch) {
                const startT = parseVoiceTime(rangeMatch[1], true);
                const endT = parseVoiceTime(rangeMatch[2], true);
                if (startT && endT) {
                    document.getElementById('start-time').value = startT;
                    document.getElementById('end-time').value = endT;
                    notification("✅ Range Set");
                    handledAsRange = true;
                }
            }
        }

        if (!handledAsRange) {
            const isStart = /started|start|clock in|got to work/.test(speech) || (speech.includes("change") && speech.includes("start"));
            const isEnd = /left|end|finished|clock out/.test(speech) || (speech.includes("change") && speech.includes("end"));
            let time = parseVoiceTime(speech, false);

            // Fallback to current time if "just" is used but no time was spoken (rounded to 5 mins)
            if (!time && isJust) {
                const now = new Date();
                let min = Math.round(now.getMinutes() / 5) * 5;
                let hr = now.getHours();
                if (min === 60) { min = 0; hr++; }
                time = hr.toString().padStart(2, '0') + ":" + min.toString().padStart(2, '0');
            }

            if (isStart && time) {
                let currentEnd = document.getElementById('end-time').value;
                let finalTime = (currentEnd && !hasExplicitAMPM) ? optimizeShift(currentEnd, time, true) : time;
                document.getElementById('start-time').value = finalTime;
                notification("✅ Start: " + format12h(finalTime));
            } else if (isEnd && time) {
                let currentStart = document.getElementById('start-time').value;
                let finalTime = (currentStart && !hasExplicitAMPM) ? optimizeShift(currentStart, time, false) : time;
                document.getElementById('end-time').value = finalTime;
                notification("✅ End: " + format12h(finalTime));
            }
        }

        // C. Parse Lunch Break (Highly Forgiving)
        const minPattern1 = /(?:lunch|break)(?:\s+[a-z]+){0,5}\s+(\d+)\s*(?:min|minute|minutes|mins)/;
        const minPattern2 = /(\d+)\s*(?:min|minute|minutes|mins)(?:\s+[a-z]+){0,5}\s+(?:lunch|break)/;
        const hourPattern1 = /(?:lunch|break)(?:\s+[a-z]+){0,5}\s+(\d+(?:\.\d+)?)\s*(?:hour|hours|hr|hrs)/;
        const hourPattern2 = /(\d+(?:\.\d+)?)\s*(?:hour|hours|hr|hrs)(?:\s+[a-z]+){0,5}\s+(?:lunch|break)/;
        const halfPattern1 = /(?:lunch|break)(?:\s+[a-z]+){0,5}\s+(half\s*hour)/;
        const halfPattern2 = /(half\s*hour)(?:\s+[a-z]+){0,5}\s+(?:lunch|break)/;
        const noPattern1 = /(?:no|zero|skip|skipped|without)(?:\s+[a-z]+){0,3}\s+(?:lunch|break)/;
        const noPattern2 = /(?:lunch|break)(?:\s+[a-z]+){0,3}\s+(?:none|zero|skipped)/;

        const minLunchMatch = speech.match(minPattern1) || speech.match(minPattern2);
        const hourLunchMatch = speech.match(hourPattern1) || speech.match(hourPattern2);
        const halfHourMatch = speech.match(halfPattern1) || speech.match(halfPattern2);
        const noLunchMatch = speech.match(noPattern1) || speech.match(noPattern2);

        if (minLunchMatch) {
            const mins = parseInt(minLunchMatch[1]);
            const hrs = (mins / 60).toFixed(2);
            document.getElementById('lunch-break').value = hrs;
            notification(`🍴 Lunch: ${mins} min (${hrs}h)`);
        } else if (hourLunchMatch) {
            const hrs = parseFloat(hourLunchMatch[1]);
            document.getElementById('lunch-break').value = hrs;
            notification(`🍴 Lunch: ${hrs} hour(s)`);
        } else if (halfHourMatch) {
            document.getElementById('lunch-break').value = "0.5";
            notification("🍴 Lunch: 30 min (0.5h)");
        } else if (noLunchMatch) {
            document.getElementById('lunch-break').value = "0";
            notification("🍴 No Lunch");
        }
        updateLiveCalc();
    };
}

// --- CALENDAR & APP HANDLERS ---
document.getElementById('date').onchange = function () { loadDateData(this.value); renderCalendar(); };

function loadDateData(dateStr) {
    let history = JSON.parse(localStorage.getItem('rushTimesheet')) || {};
    let entry = history[dateStr];
    document.getElementById('start-time').value = entry ? entry.start : "";
    document.getElementById('end-time').value = entry ? entry.end : "";
    document.getElementById('lunch-break').value = entry ? (entry.lunch || "0") : "0";
    document.getElementById('pay-type').value = entry ? entry.type : "Regular";
    updateLiveCalc();
}

document.getElementById('clear-btn').onclick = () => {
    document.getElementById('start-time').value = "";
    document.getElementById('end-time').value = "";
    document.getElementById('lunch-break').value = "0";
    document.getElementById('date').value = "";
    document.getElementById('pay-type').value = "Regular";
    updateLiveCalc();
    renderCalendar();
};

document.getElementById("add-btn").onclick = async () => {
    const d = document.getElementById("date").value;
    const s = document.getElementById("start-time").value;
    const e = document.getElementById("end-time").value;
    const l = document.getElementById("lunch-break").value;
    const pt = document.getElementById("pay-type").value;
    const tot = updateLiveCalc();

    if (!d) return alert("Please select a Date.");

    let history = JSON.parse(localStorage.getItem('rushTimesheet')) || {};

    // SAFEGUARD: Check if changing existing data
    let isCorrection = false;
    if (history[d]) {
        // If data exists, check if any of the new data is different
        let old = history[d];
        if (old.start !== s || old.end !== e || old.lunch !== l || old.type !== pt) {
            if (!confirm(`Warning: You are about to overwrite your existing logged hours for ${d}. Are you sure you want to make this correction?`)) {
                return; // Cancel out
            }
            isCorrection = true;
        }
    }

    history[d] = { start: s, end: e, lunch: l, type: pt, total: tot };
    localStorage.setItem('rushTimesheet', JSON.stringify(history));

    renderCalendar();
    notification("☁️ Syncing...", "#007bff");

    // Send to Google Script
    await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ action: "save", date: d, start: s, end: e, lunch: l, type: pt, total: tot })
    });

    if (isCorrection) {
        notification("✅ Correction Saved!");
        sendPushNotification("✅ Correction Applied", `Successfully updated your hours for ${d}.`);
    } else {
        notification("✅ Time Logged!");
        sendPushNotification("✅ Hours Logged", `Successfully logged ${tot} hours for ${d}.`);
    }

    // Checking if period is complete
    const [yyyy, mm, dd] = d.split('-');
    const lastDayOfMonth = new Date(parseInt(yyyy), parseInt(mm), 0).getDate();
    if (parseInt(dd) === 15 || parseInt(dd) === lastDayOfMonth) {
        setTimeout(() => {
            sendPushNotification("📅 Pay Period Complete", "You have logged the final day of the current pay period. Review your timesheet and authorize.");
        }, 3000);
    }
};

document.getElementById("auth-btn").onclick = async () => {
    const dateVal = document.getElementById("date").value;
    if (!dateVal) return alert("Select a date on the calendar first.");

    const [yy, mm, dd] = dateVal.split('-');
    const monthNum = parseInt(mm), yearNum = parseInt(yy);
    const isFirstPeriod = parseInt(dd) <= 15;
    const periodString = isFirstPeriod ? "1st - 15th" : "16th - End";
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthName = monthNames[monthNum - 1];

    let payMonthNum = monthNum + 1;
    let payYearNum = yearNum;
    if (payMonthNum > 12) { payMonthNum = 1; payYearNum++; }

    let payDayNum = isFirstPeriod ? 5 : 20;
    let payDateString = `${String(payMonthNum).padStart(2, '0')}/${String(payDayNum).padStart(2, '0')}/${payYearNum}`;

    let startD = `${String(monthNum).padStart(2, '0')}/${isFirstPeriod ? '01' : '16'}/${yearNum}`;
    let endDDay = isFirstPeriod ? '15' : new Date(yearNum, monthNum, 0).getDate();
    let endD = `${String(monthNum).padStart(2, '0')}/${endDDay}/${yearNum}`;

    if (!confirm(`Finalize ${monthName} ${periodString}?\nPay Date will be: ${payDateString}`)) return;

    notification("⚙️ Generating Summary...", "#8e44ad");
    await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
            action: "authorize",
            monthNum, yearNum, periodString, monthName,
            payDate: payDateString,
            startDate: startD,
            endDate: endD,
            reviewEmail: "mellobluedevil@gmail.com",
            employerEmail: "contact@rushprocessservice.com"
        })
    });

    setTimeout(() => {
        notification("✅ Email Sent for Review!");
        sendPushNotification("📧 Review Your Timesheet", "Your pay period summary has been emailed to you for review before sending to your employer.");
    }, 2000);
};

document.getElementById("send-employer-btn").onclick = async () => {
    const dateVal = document.getElementById("date").value;
    if (!dateVal) return alert("Select a date on the calendar first.");

    const [yy, mm, dd] = dateVal.split('-');
    const monthNum = parseInt(mm), yearNum = parseInt(yy);
    const isFirstPeriod = parseInt(dd) <= 15;

    // SAFEGUARD: Check if the final day of the period is logged
    let history = JSON.parse(localStorage.getItem('rushTimesheet')) || {};
    let requiredFinalDay = isFirstPeriod ? 15 : new Date(yearNum, monthNum, 0).getDate();
    let requiredDateString = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(requiredFinalDay).padStart(2, '0')}`;

    if (!history[requiredDateString] || !history[requiredDateString].start) {
        alert(`Hold up! You haven't logged any hours for the final day of this pay period (${requiredDateString}) yet. Please finish your timesheet before sending it to your employer.`);
        return;
    }

    if (!confirm(`Are you sure you want to send the finalized invoice to your employer (contact@rushprocessservice.com)?`)) return;

    const periodString = isFirstPeriod ? "1st - 15th" : "16th - End";
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthName = monthNames[monthNum - 1];

    let payMonthNum = monthNum + 1;
    let payYearNum = yearNum;
    if (payMonthNum > 12) { payMonthNum = 1; payYearNum++; }
    let payDayNum = isFirstPeriod ? 5 : 20;

    let payDateString = `${String(payMonthNum).padStart(2, '0')}/${String(payDayNum).padStart(2, '0')}/${payYearNum}`;
    let startD = `${String(monthNum).padStart(2, '0')}/${isFirstPeriod ? '01' : '16'}/${yearNum}`;
    let endDDay = isFirstPeriod ? '15' : new Date(yearNum, monthNum, 0).getDate();
    let endD = `${String(monthNum).padStart(2, '0')}/${endDDay}/${yearNum}`;

    notification("🚀 Sending to Employer...", "#3498db");
    await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
            action: "send_employer",
            monthNum, yearNum, periodString, monthName,
            payDate: payDateString,
            startDate: startD,
            endDate: endD,
            employerEmail: "contact@rushprocessservice.com"
        })
    });

    setTimeout(() => {
        notification("✅ Sent to Employer!");
        sendPushNotification("📤 Invoice Submitted", "Your invoice has been successfully emailed to your employer.");
    }, 2000);
};

function renderCalendar() {
    const grid = document.getElementById('calendar-grid'), monthLabel = document.getElementById('current-month');
    const history = JSON.parse(localStorage.getItem('rushTimesheet')) || {}, selectedDate = document.getElementById('date').value;

    grid.innerHTML = "";
    const year = currentViewDate.getFullYear(), month = currentViewDate.getMonth();

    monthLabel.innerText = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentViewDate);

    ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(day => grid.innerHTML += `<div class="day-header">${day}</div>`);

    const firstDay = new Date(year, month, 1).getDay(), daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) grid.innerHTML += '<div></div>';

    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        grid.innerHTML += `<div class="calendar-day ${dateKey === selectedDate ? 'selected-day' : ''} ${history[dateKey] ? 'has-data' : ''}" onclick="selectCalendarDate('${dateKey}')">${day}</div>`;
    }
}

function selectCalendarDate(dateStr) {
    document.getElementById('date').value = dateStr;
    loadDateData(dateStr);
    renderCalendar();
}

function changeMonth(dir) {
    currentViewDate.setMonth(currentViewDate.getMonth() + dir);
    renderCalendar();
}

// Initial render
renderCalendar();
