const apiUrl = "/api/timestamps";
const fortyHoursInMilliseconds = 40 * 60 * 60 * 1000;
const oneHourInMilliseconds = 60 * 60 * 1000;

const recordButton = document.querySelector("#record-button");
const refreshButton = document.querySelector("#refresh-button");
const message = document.querySelector("#message");
const timestampList = document.querySelector("#timestamp-list");
const emptyMessage = document.querySelector("#empty-message");
const statusCard = document.querySelector("#status-card");

recordButton.addEventListener("click", recordLaundry);
refreshButton.addEventListener("click", loadTimestamps);

async function recordLaundry() {
    setBusy(true);
    showMessage("Recording&hellip;");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            signal: controller.signal,
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(result.message || "The server could not record the laundry.");
        }

        const serverMessage = result.message || "Laundry recorded successfully.";
        const recordedAt = result.timestamp ? ` Recorded at ${formatTimestamp(result.timestamp)}.` : "";
        showMessage(`${serverMessage}${recordedAt}`, "success");
        await loadTimestamps(false);
    } catch (error) {
        const errorMessage = error.name === "AbortError"
            ? "Recording took longer than 10 seconds. Refresh the history before trying again."
            : error.message || "Something went wrong. Please try again.";
        showMessage(errorMessage, "error");
    } finally {
        clearTimeout(timeout);
        setBusy(false);
    }
}

async function loadTimestamps(showLoadingMessage = true) {
    refreshButton.disabled = true;
    if (showLoadingMessage) {
        showMessage("Loading history&hellip;");
    }

    try {
        const response = await fetch(apiUrl, { cache: "no-store" });
        if (!response.ok) {
            throw new Error("The server could not load the laundry history.");
        }

        const result = await response.json();
        const records = Array.isArray(result.records)
            ? result.records
            : (result.timestamps || []).map((timestamp) => ({ id: timestamp, timestamp }));
        renderTimestamps(records);
        renderStatus(records[0]?.timestamp);
        if (showLoadingMessage) showMessage("");
    } catch (error) {
        showMessage(error.message || "Something went wrong. Please try again.", "error");
        statusCard.className = "status-card empty";
        statusCard.textContent = "Status unavailable.";
    } finally {
        refreshButton.disabled = false;
    }
}

function renderTimestamps(records) {
    timestampList.replaceChildren();
    emptyMessage.hidden = records.length !== 0;

    records.forEach((record) => {
        const timestamp = record.timestamp;
        const date = new Date(timestamp);
        const item = document.createElement("li");
        const content = document.createElement("div");
        const time = document.createElement("time");
        const relative = document.createElement("small");

        time.dateTime = timestamp;
        time.textContent = formatTimestamp(timestamp);
        relative.textContent = formatRelative(date);
        content.append(time, relative);

        item.append(content);
        if (Date.now() - date.getTime() < oneHourInMilliseconds) {
            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "w3-button w3-small w3-light-grey w3-round delete-button";
            deleteButton.textContent = "Delete";
            deleteButton.setAttribute("aria-label", `Delete laundry record from ${formatTimestamp(timestamp)}`);
            deleteButton.addEventListener("click", () => deleteRecord(record, deleteButton));
            item.append(deleteButton);
        }
        timestampList.append(item);
    });
}

async function deleteRecord(record, button) {
    const confirmed = window.confirm(
        `Delete the laundry record from ${formatTimestamp(record.timestamp)}? This cannot be undone.`,
    );
    if (!confirmed) return;

    button.disabled = true;
    button.textContent = "Deleting…";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
        const response = await fetch(apiUrl, {
            method: "DELETE",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ id: record.id }),
            signal: controller.signal,
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(result.message || "The server could not delete the laundry record.");
        }

        showMessage(result.message || "Laundry record deleted successfully.", "success");
        await loadTimestamps(false);
    } catch (error) {
        const errorMessage = error.name === "AbortError"
            ? "Deletion took longer than 10 seconds. Refresh the history before trying again."
            : error.message || "Something went wrong. Please try again.";
        showMessage(errorMessage, "error");
        button.disabled = false;
        button.textContent = "Delete";
    } finally {
        clearTimeout(timeout);
    }
}

function renderStatus(latestTimestamp) {
    if (!latestTimestamp) {
        statusCard.className = "status-card empty";
        statusCard.textContent = "No laundry has been recorded yet.";
        return;
    }

    const latest = new Date(latestTimestamp);
    const deadline = new Date(latest.getTime() + fortyHoursInMilliseconds);
    const remaining = deadline.getTime() - Date.now();
    const title = document.createElement("strong");
    const detail = document.createElement("span");

    statusCard.replaceChildren();
    if (remaining >= 0) {
        statusCard.className = "status-card good";
        title.textContent = `On track — ${formatDuration(remaining)} remaining`;
        detail.textContent = `Next laundry should be recorded by ${formatTimestamp(deadline.toISOString())}.`;
    } else {
        statusCard.className = "status-card overdue";
        title.textContent = `Overdue by ${formatDuration(Math.abs(remaining))}`;
        detail.textContent = `The last laundry was recorded ${formatTimestamp(latestTimestamp)}.`;
    }
    statusCard.append(title, detail);
}

function formatTimestamp(timestamp) {
    return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
    }).format(new Date(timestamp));
}

function formatRelative(date) {
    const difference = date.getTime() - Date.now();
    const absoluteMinutes = Math.round(Math.abs(difference) / 60000);
    if (absoluteMinutes < 1) return "just now";
    if (absoluteMinutes < 60) return `${absoluteMinutes} minute${absoluteMinutes === 1 ? "" : "s"} ago`;
    const hours = Math.round(absoluteMinutes / 60);
    if (hours < 48) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    const days = Math.round(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
}

function formatDuration(milliseconds) {
    const totalMinutes = Math.max(0, Math.ceil(milliseconds / 60000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return `${minutes}m`;
    return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

function setBusy(busy) {
    recordButton.disabled = busy;
    recordButton.textContent = busy ? "Recording…" : "I did the laundry";
}

function showMessage(text, type = "") {
    message.innerHTML = text;
    message.className = `message ${type}`.trim();
}

loadTimestamps();
setInterval(() => loadTimestamps(false), 60000);
