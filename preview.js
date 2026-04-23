(function () {
    var previewhash = "Special:Preview";
    var storagekey = "yourplaygroundarticle";
    var panel; var textarea; var submittab; var prismcode; var togglebutton;
    var ispreviewmode = false; var rendertimer = 0;

    function normalizehash() {
        var raw = window.location.hash ? window.location.hash.slice(1) : "Main_Page";
        return decodeURIComponent(raw || "Main_Page");
    }
    function ispreviewhash() {
        return normalizehash().replace(/\s+/g, "_") === previewhash.replace(/\s+/g, "_");
    }
    function getdraft() {
        return localStorage.getItem(storagekey) || "# New Article\n\nStart writing here...";
    }
    function setdraft(value) {
        localStorage.setItem(storagekey, value);
    }
    function getsuggestedfilename(markdown) {
        var match = String(markdown || "yourplaygroundarticle").match(/^\s*#\s+(.+)$/m);
        var title = match ? match[1].trim() : "New_Article";
        return title.replace(/[<>:"/\\|?*]+/g, "").replace(/\s+/g, "_") || "New_Article";
    }
    function updatesubmithref() {
        if (!submittab || !textarea) return;
        var text = textarea.value || "";
        var filename = getsuggestedfilename(text) + ".md";
        submittab.href =
            "https://github.com/CtRHome/wiki/new/main/articles?filename=" +
            encodeURIComponent(filename) +
            "&value=" +
            encodeURIComponent(text);
    }
    function renderpreviewnow() {
        if (!window.WikiMarkdown || !textarea) return;
        window.WikiMarkdown.renderarticle("Special:Preview", textarea.value || "");
        updatesubmithref();
    }
    function rendereditorhighlight() {
        if (!prismcode || !textarea) return;
        var content = textarea.value || "";
        prismcode.textContent = content + "\n";
        if (window.Prism && typeof window.Prism.highlightElement === "function") {
            window.Prism.highlightElement(prismcode);
        }
    }
    function schedulerender() {
        if (rendertimer) window.clearTimeout(rendertimer);
        rendertimer = window.setTimeout(renderpreviewnow, 500);
    }
    function ensuresubmittab() {
        var tabs = document.querySelector(".tabs");
        if (!tabs) return;
        submittab = document.querySelector("a.submittab");
        if (!submittab) {
            var li = document.createElement("li");
            submittab = document.createElement("a");
            submittab.className = "tab submittab";
            submittab.textContent = "Submit";
            submittab.target = "_blank";
            submittab.rel = "noopener noreferrer";
            li.appendChild(submittab);
            tabs.appendChild(li);
        }
    }
    function settoolbarmode(previewenabled) {
        var discussion = document.querySelector("a.discussion");
        var edit = document.querySelector("a.edit");
        var history = document.querySelector("a.viewhistory");
        var search = document.querySelector(".toolbar .search");
        var pagetab = document.querySelector("a.pagetab");
        ensuresubmittab();

        [discussion, edit, history, search].forEach(function (el) {
            if (!el) return;
            var host = el.tagName === "INPUT" ? el : (el.closest("li") || el);
            host.style.display = previewenabled ? "none" : "";
        });
        if (submittab) {
            var submithost = submittab.closest("li") || submittab;
            submithost.style.display = previewenabled ? "" : "none";
        }
        if (pagetab) pagetab.textContent = "Page";
    }
    function createpanel() {
        if (panel) return panel;

        panel = document.createElement("section");
        panel.className = "playgroundpanel";
        panel.innerHTML =
            '<button class="playgrounddraghandle" title="Drag panel"></button>' +
            '<button class="playgroundresizehandle" title="Resize panel"></button>' +
            '<div class="playgroundeditor">' +
            '<pre class="playgroundsyntax language-markdown"><code class="language-markdown"></code></pre>' +
            '<textarea class="playgroundinput" spellcheck="false" placeholder="Write markdown here..."></textarea>' +
            "</div>";
        document.body.appendChild(panel);
        togglebutton = document.createElement("button");
        togglebutton.className = "playgroundtoggle";
        togglebutton.title = "Hide or show editor";
        togglebutton.innerHTML = '<img src="/assets/images/icons/down.png" alt="">';
        document.body.appendChild(togglebutton);

        prismcode = panel.querySelector(".playgroundsyntax code");
        textarea = panel.querySelector(".playgroundinput");
        textarea.value = getdraft();
        textarea.addEventListener("input", function () {
            setdraft(textarea.value || "");
            rendereditorhighlight();
            schedulerender();
        });
        textarea.addEventListener("scroll", function () {
            var pre = panel.querySelector(".playgroundsyntax");
            pre.scrollTop = textarea.scrollTop;
            pre.scrollLeft = textarea.scrollLeft;
        });

        togglebutton.addEventListener("click", function () {
            var hidden = panel.classList.toggle("hidden");
            togglebutton.querySelector("img").src = hidden ? "/assets/images/icons/up.png" : "/assets/images/icons/down.png";
            if (!hidden) textarea.focus();
        });

        rendereditorhighlight();
        makemovable(panel.querySelector(".playgrounddraghandle"));
        makeresizable(panel.querySelector(".playgroundresizehandle"));
        return panel;
    }
    function makemovable(handle) {
        if (!handle || !panel) return;
        var dragging = false;
        var startx = 0;
        var starty = 0;
        var panelx = 0;
        var panely = 0;
        handle.addEventListener("mousedown", function (e) {
            dragging = true;
            startx = e.clientX;
            starty = e.clientY;
            var rect = panel.getBoundingClientRect();
            panelx = rect.left;
            panely = rect.top;
            panel.style.left = panelx + "px";
            panel.style.top = panely + "px";
            panel.style.right = "auto";
            panel.style.bottom = "auto";
            e.preventDefault();
        });
        document.addEventListener("mousemove", function (e) {
            if (!dragging) return;
            panel.style.left = (panelx + (e.clientX - startx)) + "px";
            panel.style.top = (panely + (e.clientY - starty)) + "px";
        });
        document.addEventListener("mouseup", function () {
            dragging = false;
        });
    }
    function makeresizable(handle) {
        if (!handle || !panel) return;
        var resizing = false; var starty = 0;
        var starth = 0; var starttop = 0;
        handle.addEventListener("mousedown", function (e) {
            resizing = true;
            starty = e.clientY;
            var rect = panel.getBoundingClientRect();
            starth = rect.height;
            starttop = rect.top;
            panel.style.left = rect.left + "px";
            panel.style.top = rect.top + "px";
            panel.style.right = "auto";
            panel.style.bottom = "auto";
            e.preventDefault();
        });
        document.addEventListener("mousemove", function (e) {
            if (!resizing) return;
            var deltay = e.clientY - starty;
            var next = starth - deltay;
            var minh = 160;
            var maxh = Math.max(window.innerHeight * 0.95, minh);
            var clamped = Math.max(minh, Math.min(maxh, next));
            panel.style.height = clamped + "px";
            panel.style.top = (starttop + (starth - clamped)) + "px";
        });
        document.addEventListener("mouseup", function () {
            resizing = false;
        });
    }
    function enterpreviewmode() {
        createpanel();
        panel.style.display = "";
        settoolbarmode(true);
        renderpreviewnow();
    }
    function leavepreviewmode() {
        if (panel) panel.style.display = "none";
        if (togglebutton) togglebutton.style.display = "none";
        settoolbarmode(false);
    }
    function syncpreviewmode() {
        var nextmode = ispreviewhash();
        if (nextmode === ispreviewmode) return;
        ispreviewmode = nextmode;
        if (ispreviewmode) {
            enterpreviewmode();
            if (togglebutton) togglebutton.style.display = "";
        }
        else leavepreviewmode();
    }

    window.addEventListener("hashchange", function () {
        syncpreviewmode();
        if (ispreviewmode) window.setTimeout(renderpreviewnow, 0);
    });
    document.addEventListener("DOMContentLoaded", function () {
        syncpreviewmode();
        if (ispreviewmode) renderpreviewnow();
    });
})();
