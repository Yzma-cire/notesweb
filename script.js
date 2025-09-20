"use strict";

(() => {
  // text sanitazer to keep it clear ;-;
  function sanitizeText(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // THEME TOGGLE LOGIC
  const themeToggleBtn = document.querySelector("#theme-toggle");

  function applyTheme(theme) {
    if (theme === "dark") {
      document.body.classList.add("dark-theme");
      themeToggleBtn.setAttribute("aria-pressed", "true");
    } else {
      document.body.classList.remove("dark-theme");
      themeToggleBtn.setAttribute("aria-pressed", "false");
    }
  }

  function loadTheme() {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      applyTheme("dark");
    } else {
      applyTheme("light");
    }
  }

  function toggleTheme() {
    const isDark = document.body.classList.contains("dark-theme");
    if (isDark) {
      applyTheme("light");
      localStorage.setItem("theme", "light");
    } else {
      applyTheme("dark");
      localStorage.setItem("theme", "dark");
    }
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", toggleTheme);
  }

  loadTheme();

  // PAGE-SPECIFIC LOGIC

  // NOTES PAGE LOGIC
  if (document.body.contains(document.querySelector("#note-form"))) {
    const noteForm = document.querySelector("#note-form");
    const notesContainer = document.querySelector("#notes-container");

    // Load notes from localStorage
    function loadNotes() {
      const notesJSON = localStorage.getItem("notes");
      if (!notesJSON) return [];
      try {
        return JSON.parse(notesJSON);
      } catch {
        return [];
      }
    }

    // Save notes to localStorage
    function saveNotes(notes) {
      localStorage.setItem("notes", JSON.stringify(notes));
    }

    // Validate media URL: image or YouTube/Facebook video URL
    function isValidMediaUrl(url) {
      if (!url) return false;
      try {
        const parsed = new URL(url);
        // Check image extensions
        if (/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(parsed.pathname)) {
          return "image";
        }
        // Check YouTube or Facebook video URLs
        if (
          parsed.hostname.match(/(youtube\.com|youtu\.be|facebook\.com)$/i)
        ) {
          return "video";
        }
        return false;
      } catch {
        return false;
      }
    }

    // Extract YouTube embed URL from various formats
    function getYouTubeEmbedUrl(url) {
      try {
        const parsed = new URL(url);
        if (
          parsed.hostname === "youtu.be" &&
          parsed.pathname.length > 1
        ) {
          // Short URL: youtu.be/VIDEOID
          const videoId = parsed.pathname.slice(1);
          return `https://www.youtube.com/embed/${videoId}`;
        }
        if (
          parsed.hostname === "www.youtube.com" ||
          parsed.hostname === "youtube.com"
        ) {
          if (parsed.searchParams.has("v")) {
            const videoId = parsed.searchParams.get("v");
            return `https://www.youtube.com/embed/${videoId}`;
          }
          // Could be a playlist or other, fallback to original url
          return url;
        }
        return url;
      } catch {
        return url;
      }
    }

    // Extract Facebook embed URL from video URL
    // Facebook embed URL format:
    // https://www.facebook.com/plugins/video.php?href=ENCODED_VIDEO_URL&show_text=0&width=560
    function getFacebookEmbedUrl(url) {
      try {
        const parsed = new URL(url);
        if (
          parsed.hostname === "www.facebook.com" ||
          parsed.hostname === "facebook.com"
        ) {
          // Encode the original URL for embedding
          const encodedUrl = encodeURIComponent(url);
          return `https://www.facebook.com/plugins/video.php?href=${encodedUrl}&show_text=0&width=560`;
        }
        return url;
      } catch {
        return url;
      }
    }

    // Render notes list
    function renderNotes() {
      const notes = loadNotes();
      notesContainer.innerHTML = "";
      if (notes.length === 0) {
        notesContainer.innerHTML =
          '<p role="alert" class="no-content-msg">No notes saved yet.</p>';
        return;
      }
      notes.forEach((note, idx) => {
        const noteCard = document.createElement("article");
        noteCard.className = "note-card";
        noteCard.setAttribute("tabindex", "0");
        noteCard.setAttribute("aria-label", `Note titled ${note.title}`);

        const titleEl = document.createElement("h3");
        titleEl.innerHTML = sanitizeText(note.title);

        const contentEl = document.createElement("p");
        contentEl.className = "note-content";
        contentEl.innerHTML = sanitizeText(note.content);

        noteCard.appendChild(titleEl);
        noteCard.appendChild(contentEl);

        if (note.media) {
          const mediaType = isValidMediaUrl(note.media);
          if (mediaType === "image") {
            const img = document.createElement("img");
            img.src = note.media;
            img.alt = `Image for note titled ${note.title}`;
            img.className = "note-media";
            noteCard.appendChild(img);
          } else if (mediaType === "video") {
            const iframe = document.createElement("iframe");
            iframe.className = "note-media";
            iframe.setAttribute("frameborder", "0");
            iframe.setAttribute("allowfullscreen", "");
            if (note.media.includes("youtube") || note.media.includes("youtu.be")) {
              iframe.src = getYouTubeEmbedUrl(note.media);
            } else if (note.media.includes("facebook.com")) {
              iframe.src = getFacebookEmbedUrl(note.media);
            } else {
              iframe.src = note.media;
            }
            noteCard.appendChild(iframe);
          }
        }

        // Add delete button
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "note-delete-btn";
        deleteBtn.setAttribute("aria-label", `Delete note titled ${note.title}`);
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", () => {
          deleteNote(idx);
        });
        noteCard.appendChild(deleteBtn);

        notesContainer.appendChild(noteCard);
      });
    }

    // Delete note by index
    function deleteNote(index) {
      const notes = loadNotes();
      if (index >= 0 && index < notes.length) {
        notes.splice(index, 1);
        saveNotes(notes);
        renderNotes();
      }
    }

    // Handle form submission to add new note
    noteForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const titleInput = noteForm.querySelector("#note-title");
      const contentInput = noteForm.querySelector("#note-content");
      const mediaInput = noteForm.querySelector("#note-media");

      const title = titleInput.value.trim();
      const content = contentInput.value.trim();
      const media = mediaInput.value.trim();

      if (!title) {
        alert("Please enter a title for the note.");
        titleInput.focus();
        return;
      }

      if (media && !isValidMediaUrl(media)) {
        alert("Please enter a valid image or video URL.");
        mediaInput.focus();
        return;
      }

      const notes = loadNotes();
      notes.push({ title, content, media });
      saveNotes(notes);
      renderNotes();

      // Reset form
      noteForm.reset();
    });

    // Initial render
    renderNotes();
  }
})();
