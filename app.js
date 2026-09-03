/**
 * ==========================================================================
 * Assignment: DOM-based Notes Manager
 * Demonstrating required JavaScript DOM methods:
 * - document.createElement()
 * - parentElement.appendChild()
 * - element.remove()
 * - element.textContent
 * - element.addEventListener()
 * ==========================================================================
 */

// Key for LocalStorage
const STORAGE_KEY = "dom_notes_manager_clean_v1";
const THEME_KEY = "dom_notes_manager_theme_clean_v1";

// Cache Core DOM Elements
const noteInput = document.getElementById("noteInput");
const addNoteBtn = document.getElementById("addNoteBtn");
const importantCheckbox = document.getElementById("importantCheckbox");
const notesContainer = document.getElementById("notesContainer");
const totalCountElement = document.getElementById("totalCount");
const importantCountElement = document.getElementById("importantCount");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const filterBtns = document.querySelectorAll(".filter-btn");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const charCounter = document.getElementById("charCounter");

// Current active filter: 'all' or 'important'
let currentFilter = "all";

/**
 * Update the dynamic note counter badges using DOM methods.
 * Counts note cards currently in the DOM and sets textContent.
 */
function updateNoteCount() {
    // Select all note card elements
    const allNoteCards = document.querySelectorAll(".note-card");
    const importantCards = document.querySelectorAll(".note-card.is-important");

    // Update the counter elements using textContent
    totalCountElement.textContent = allNoteCards.length;
    importantCountElement.textContent = importantCards.length;

    // Toggle empty state visibility
    if (allNoteCards.length === 0) {
        emptyState.classList.add("active");
    } else {
        emptyState.classList.remove("active");
    }

    // Save notes snapshot to localStorage
    saveNotesToStorage();
}

/**
 * Build and attach a new note card into the DOM using createElement and appendChild.
 *
 * @param {string} text - Content of the note
 * @param {boolean} isImportant - Whether the note is marked important
 * @param {string} dateString - Creation timestamp
 * @param {boolean} animate - Whether to apply entry animation
 */
function createNoteElement(text, isImportant = false, dateString = null, animate = true) {
    // 1. Create the main card element (createElement)
    const noteCard = document.createElement("div");
    noteCard.classList.add("note-card");
    if (animate) {
        noteCard.classList.add("card-enter");
    }
    if (isImportant) {
        noteCard.classList.add("is-important");
    }

    // 2. Create Header section (timestamp and important badge)
    const cardHeader = document.createElement("div");
    cardHeader.classList.add("note-card-header");

    const noteDate = document.createElement("span");
    noteDate.classList.add("note-date");
    noteDate.textContent = dateString || new Date().toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });

    const importantBadge = document.createElement("span");
    importantBadge.classList.add("important-badge");
    importantBadge.textContent = "★ Important";

    cardHeader.appendChild(noteDate);
    cardHeader.appendChild(importantBadge);

    // 3. Create Note Content element (textContent)
    const noteContent = document.createElement("p");
    noteContent.classList.add("note-content");
    noteContent.textContent = text;

    // 4. Create Card Actions Footer
    const cardActions = document.createElement("div");
    cardActions.classList.add("note-card-actions");

    // Important Toggle Button
    const importantBtn = document.createElement("button");
    importantBtn.classList.add("card-btn", "important-btn");
    importantBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
        <span class="btn-text">${isImportant ? "Unmark" : "Important"}</span>
    `;

    // Right-side actions group
    const actionsRight = document.createElement("div");
    actionsRight.classList.add("action-buttons-group");

    // Edit Button
    const editBtn = document.createElement("button");
    editBtn.classList.add("card-btn", "edit-btn");
    editBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
        <span class="edit-text">Edit</span>
    `;

    // Delete Button
    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("card-btn", "delete-btn");
    deleteBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
        </svg>
        <span>Delete</span>
    `;

    actionsRight.appendChild(editBtn);
    actionsRight.appendChild(deleteBtn);

    cardActions.appendChild(importantBtn);
    cardActions.appendChild(actionsRight);

    // 5. Append all child elements to noteCard (appendChild)
    noteCard.appendChild(cardHeader);
    noteCard.appendChild(noteContent);
    noteCard.appendChild(cardActions);

    // =========================================================================
    // Attach Event Listeners using addEventListener
    // =========================================================================

    // Mark / Unmark Note as Important
    importantBtn.addEventListener("click", function () {
        noteCard.classList.toggle("is-important");
        const isNowImportant = noteCard.classList.contains("is-important");
        
        // Update button text
        const btnTextSpan = importantBtn.querySelector(".btn-text");
        btnTextSpan.textContent = isNowImportant ? "Unmark" : "Important";

        // Re-filter if in 'important' view
        applyFilters();

        // Update counts
        updateNoteCount();
    });

    // Edit Existing Note
    let isEditing = false;
    let editTextArea = null;

    editBtn.addEventListener("click", function () {
        const editTextSpan = editBtn.querySelector(".edit-text");

        if (!isEditing) {
            // Switch to Editing Mode
            isEditing = true;
            editBtn.classList.add("is-saving");
            editTextSpan.textContent = "Save";

            // Create inline textarea (createElement)
            editTextArea = document.createElement("textarea");
            editTextArea.classList.add("note-edit-area");
            editTextArea.value = noteContent.textContent;

            // Replace noteContent with textarea
            noteCard.replaceChild(editTextArea, noteContent);
            editTextArea.focus();

            // Allow Ctrl+Enter to save
            editTextArea.addEventListener("keydown", function (e) {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    editBtn.click();
                }
            });
        } else {
            // Save Changes Mode
            const updatedText = editTextArea.value.trim();
            if (updatedText === "") {
                editTextArea.classList.add("shake-animation");
                setTimeout(() => editTextArea.classList.remove("shake-animation"), 400);
                return;
            }

            // Update textContent with new note text
            noteContent.textContent = updatedText;

            // Restore noteContent paragraph
            noteCard.replaceChild(noteContent, editTextArea);

            isEditing = false;
            editBtn.classList.remove("is-saving");
            editTextSpan.textContent = "Edit";

            // Save to localStorage
            saveNotesToStorage();
        }
    });

    // Delete Note dynamically (element.remove)
    deleteBtn.addEventListener("click", function () {
        // Smooth exit animation before DOM removal
        noteCard.classList.add("card-exit");
        
        setTimeout(() => {
            // Remove element from the DOM (remove)
            noteCard.remove();
            
            // Update live note count
            updateNoteCount();
        }, 220);
    });

    // 6. Prepend note to the container so latest notes appear first
    if (notesContainer.firstChild) {
        notesContainer.insertBefore(noteCard, notesContainer.firstChild);
    } else {
        notesContainer.appendChild(noteCard);
    }

    // 7. Update live note count
    updateNoteCount();
}

/**
 * Handle Add Note button click or Enter keypress
 */
function handleAddNote() {
    const text = noteInput.value.trim();

    // Validate empty input
    if (text === "") {
        noteInput.classList.add("shake-animation");
        noteInput.focus();
        setTimeout(() => {
            noteInput.classList.remove("shake-animation");
        }, 400);
        return;
    }

    const isImportant = importantCheckbox.checked;

    // Dynamically create note
    createNoteElement(text, isImportant);

    // Reset input fields
    noteInput.value = "";
    importantCheckbox.checked = false;
    charCounter.textContent = "0 / 500";
    noteInput.focus();

    // Reapply current search/filter
    applyFilters();
}

/**
 * Add Note button event listener (addEventListener)
 */
addNoteBtn.addEventListener("click", handleAddNote);

/**
 * Keyboard shortcut: Ctrl+Enter in textarea adds the note
 */
noteInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleAddNote();
    }
});

/**
 * Character counter updater
 */
noteInput.addEventListener("input", function () {
    const length = noteInput.value.length;
    charCounter.textContent = `${length} / 500`;
});

/**
 * Filter buttons (All Notes vs Important Only)
 */
filterBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
        filterBtns.forEach((b) => b.classList.remove("active"));
        this.classList.add("active");
        currentFilter = this.getAttribute("data-filter");
        applyFilters();
    });
});

/**
 * Search input event listener
 */
searchInput.addEventListener("input", applyFilters);

/**
 * Filter and search controller for notes in the DOM
 */
function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const noteCards = document.querySelectorAll(".note-card");

    noteCards.forEach((card) => {
        const text = card.querySelector(".note-content") 
            ? card.querySelector(".note-content").textContent.toLowerCase() 
            : "";
        const isImportant = card.classList.contains("is-important");

        const matchesFilter = currentFilter === "all" || (currentFilter === "important" && isImportant);
        const matchesSearch = text.includes(searchTerm);

        if (matchesFilter && matchesSearch) {
            card.style.display = "flex";
        } else {
            card.style.display = "none";
        }
    });
}

/**
 * Save current DOM notes to LocalStorage
 */
function saveNotesToStorage() {
    const noteCards = document.querySelectorAll(".note-card");
    const notesData = [];

    noteCards.forEach((card) => {
        const text = card.querySelector(".note-content") ? card.querySelector(".note-content").textContent : "";
        const date = card.querySelector(".note-date") ? card.querySelector(".note-date").textContent : "";
        const isImportant = card.classList.contains("is-important");

        notesData.unshift({ text, date, isImportant }); // keep original order
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(notesData));
}

/**
 * Load saved notes from LocalStorage on initial load
 */
function loadNotesFromStorage() {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (!rawData) {
        // Initial state: Start completely empty
        updateNoteCount();
        return;
    }

    try {
        const notes = JSON.parse(rawData);
        if (Array.isArray(notes) && notes.length > 0) {
            notes.forEach((item) => {
                createNoteElement(item.text, item.isImportant, item.date, false);
            });
        }
    } catch (e) {
        console.error("Failed to parse stored notes", e);
    }

    updateNoteCount();
}

/**
 * Theme Toggle Handler (Light / Dark Mode)
 * Defaults to bright (light) mode
 */
function initTheme() {
    // Default strictly to "light" (bright theme)
    const savedTheme = localStorage.getItem(THEME_KEY) || "light";
    
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeIcon(savedTheme);

    themeToggleBtn.addEventListener("click", function () {
        const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
        const newTheme = currentTheme === "dark" ? "light" : "dark";

        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem(THEME_KEY, newTheme);
        updateThemeIcon(newTheme);
    });
}

function updateThemeIcon(theme) {
    if (theme === "dark") {
        themeToggleBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
        `;
        themeToggleBtn.title = "Switch to Light Mode";
    } else {
        themeToggleBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
        `;
        themeToggleBtn.title = "Switch to Dark Mode";
    }
}

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    loadNotesFromStorage();
});
