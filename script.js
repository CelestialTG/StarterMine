document.addEventListener('DOMContentLoaded', () => {
    // --- 1. ЭФФЕКТ СВЕЧЕНИЯ И НАВИГАЦИЯ SPA ---
    const glow = document.querySelector('.cursor-glow');
    document.addEventListener('mousemove', (e) => {
        requestAnimationFrame(() => {
            glow.style.left = `${e.clientX}px`; glow.style.top = `${e.clientY}px`;
        });
    });

    const navLinks = document.querySelectorAll('.nav-links li');
    const sections = document.querySelectorAll('.view-section');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            sections.forEach(sec => {
                if(sec.id === link.dataset.target) { sec.classList.remove('hidden'); sec.classList.add('active'); } 
                else { sec.classList.add('hidden'); sec.classList.remove('active'); }
            });
        });
    });

    // --- 2. НАСТРОЙКИ (Сохранение цвета и шума) ---
    const colorBtns = document.querySelectorAll('.color-btn');
    const noiseToggle = document.getElementById('toggle-noise');
    const savedColor = localStorage.getItem('nexus_color') || '#ff007f';
    const savedNoise = localStorage.getItem('nexus_noise') !== 'false';
    
    document.documentElement.style.setProperty('--accent', savedColor);
    if(!savedNoise) document.body.classList.add('no-noise');
    noiseToggle.checked = savedNoise;

    colorBtns.forEach(btn => {
        if(btn.dataset.color === savedColor) btn.classList.add('active');
        btn.addEventListener('click', () => {
            colorBtns.forEach(b => b.classList.remove('active')); btn.classList.add('active');
            document.documentElement.style.setProperty('--accent', btn.dataset.color);
            localStorage.setItem('nexus_color', btn.dataset.color);
        });
    });
    noiseToggle.addEventListener('change', (e) => {
        e.target.checked ? document.body.classList.remove('no-noise') : document.body.classList.add('no-noise');
        localStorage.setItem('nexus_noise', e.target.checked);
    });

    // --- 3. РАДАР И СКИНЫ ---
    document.getElementById('radar-btn').addEventListener('click', async () => {
        const ip = document.getElementById('radar-input').value.trim();
        const resBox = document.getElementById('radar-result');
        if(!ip) return;
        resBox.classList.remove('hidden'); resBox.innerHTML = 'Связь...';
        try {
            const data = await (await fetch(`https://api.mcsrvstat.us/3/${ip}`)).json();
            if(data.online) {
                const motd = data.motd?.html?.join('<br>') || 'Без описания';
                resBox.innerHTML = `<img src="${data.icon || ''}" class="radar-icon"><div class="radar-details"><span class="radar-status">ONLINE // ${data.players.online}/${data.players.max}</span><h3>${ip}</h3><p>Версия: ${data.version}</p><div style="background:var(--bg-elevated);padding:10px;border-radius:8px;">${motd}</div></div>`;
            } else resBox.innerHTML = `<div class="radar-details"><span class="radar-status offline">OFFLINE</span><h3>${ip}</h3><p>Недоступен</p></div>`;
        } catch(e) { resBox.innerHTML = 'Ошибка сонара'; }
    });

    const skinBtn = document.getElementById('skin-search-btn');
    skinBtn.addEventListener('click', () => {
        const user = document.getElementById('skin-search-input').value.trim();
        if(!user) return;
        skinBtn.innerText = 'Рендер...';
        document.getElementById('skin-result').classList.remove('hidden');
        document.getElementById('skin-username').innerText = user.toUpperCase();
        document.getElementById('btn-download-raw').href = `https://minotar.net/skin/${user}`;
        document.getElementById('btn-download-avatar').href = `https://minotar.net/helm/${user}/256.png`;
        const img = document.getElementById('skin-3d-render');
        img.src = `https://starlightskins.lunareclipse.studio/render/ultimate/${user}/full?height=400`;
        img.onload = () => skinBtn.innerText = 'Сканировать';
        img.onerror = () => { document.getElementById('skin-username').innerText = 'ОШИБКА'; skinBtn.innerText = 'Сканировать'; };
    });

    // --- 4. ПОЛНАЯ БАЗА МОДОВ (СКАЧИВАНИЕ, КОРЗИНА, ВИКИ, ПАГИНАЦИЯ) ---
    let currentPage = 1, limit = 24, currentCategory = "", selectedMods = [], loadedModsData = [];
    
    const versionSel = document.getElementById('version-select');
    const loaderSel = document.getElementById('loader-select');
    const typeSel = document.getElementById('type-select');
    const searchInput = document.getElementById('search-input');
    const resultsCont = document.getElementById('results');
    const prevBtn = document.getElementById('prev-btn'), nextBtn = document.getElementById('next-btn'), pageInd = document.getElementById('page-indicator');
    
    const cartPanel = document.getElementById('cart-panel'), cartCount = document.getElementById('cart-count'), cartItems = document.getElementById('cart-items');
    const projectModal = document.getElementById('project-modal');

    document.getElementById('search-btn').addEventListener('click', () => { currentPage = 1; fetchMods(); });
    searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { currentPage = 1; fetchMods(); } });
    versionSel.addEventListener('change', () => { currentPage = 1; fetchMods(); });
    loaderSel.addEventListener('change', () => { currentPage = 1; fetchMods(); });
    
    typeSel.addEventListener('change', () => {
        currentPage = 1;
        if (typeSel.value === 'shader' || typeSel.value === 'resourcepack') { loaderSel.disabled = true; loaderSel.style.opacity = '0.3'; } 
        else { loaderSel.disabled = false; loaderSel.style.opacity = '1'; }
        fetchMods();
    });

    document.querySelectorAll('.tag-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
            if (currentCategory === e.target.dataset.tag) currentCategory = "";
            else { e.target.classList.add('active'); currentCategory = e.target.dataset.tag; }
            currentPage = 1; fetchMods();
        });
    });

    prevBtn.addEventListener('click', () => { if (currentPage > 1) { currentPage--; fetchMods(); } });
    nextBtn.addEventListener('click', () => { currentPage++; fetchMods(); });
    document.getElementById('clear-cart-btn').addEventListener('click', clearCart);
    document.getElementById('download-all-btn').addEventListener('click', downloadAllCart);
    document.getElementById('close-modal-btn').addEventListener('click', () => projectModal.classList.remove('active'));
    projectModal.addEventListener('click', (e) => { if(e.target === projectModal) projectModal.classList.remove('active'); });

    fetchMods();

    async function fetchMods() {
        const query = searchInput.value, offset = (currentPage - 1) * limit;
        resultsCont.innerHTML = '<div style="grid-column: 1/-1; text-align: center;">Синхронизация...</div>';
        pageInd.innerText = `Страница ${currentPage}`;
        prevBtn.disabled = currentPage === 1;

        try {
            const facets = [[`versions:${versionSel.value}`], [`project_type:${typeSel.value}`]];
            if (['mod', 'modpack', 'plugin'].includes(typeSel.value)) facets.push([`categories:${loaderSel.value}`]);
            if (currentCategory) facets.push([`categories:${currentCategory}`]);

            const url = new URL('https://api.modrinth.com/v2/search');
            url.searchParams.append('query', query); url.searchParams.append('facets', JSON.stringify(facets));
            url.searchParams.append('limit', limit); url.searchParams.append('offset', offset);

            const res = await fetch(url);
            loadedModsData = (await res.json()).hits;
            nextBtn.disabled = loadedModsData.length < limit;
            displayResults(loadedModsData);
        } catch (err) { resultsCont.innerHTML = `Ошибка: ${err.message}`; }
    }

    function displayResults(mods) {
        resultsCont.innerHTML = '';
        if(mods.length === 0) { resultsCont.innerHTML = '<div style="grid-column: 1/-1; text-align:center;">Пусто. Измените параметры.</div>'; return; }

        mods.forEach(mod => {
            const isSel = selectedMods.some(m => m.id === mod.project_id);
            const card = document.createElement('div');
            card.className = `card ${isSel ? 'selected' : ''}`;
            card.dataset.id = mod.project_id;
            
            let shortDesc = mod.description.length > 80 ? mod.description.substring(0,80) + '...' : mod.description;

            card.innerHTML = `
                <div class="card-header">
                    <img src="${mod.icon_url || 'https://docs.modrinth.com/img/logo.svg'}">
                    <h3>${mod.title} <button class="translate-btn" title="Перевести">🌐</button></h3>
                </div>
                <p class="mod-desc">${shortDesc}</p>
                <div class="card-actions">
                    <button class="min-btn outline select-btn">${isSel ? 'Убрать' : '+ В сборку'}</button>
                    <button class="min-btn download-btn">Скачать</button>
                </div>
            `;
            
            card.addEventListener('click', (e) => { if(!e.target.closest('button')) openProjectDetails(mod.project_id, mod.icon_url || 'https://docs.modrinth.com/img/logo.svg'); });
            card.querySelector('.download-btn').addEventListener('click', (e) => directDownloadSingle(mod.project_id, e.target));
            card.querySelector('.select-btn').addEventListener('click', () => toggleModSelection(mod, card));
            card.querySelector('.translate-btn').addEventListener('click', (e) => translateDesc(e, card.querySelector('.mod-desc'), mod.description));
            resultsCont.appendChild(card);
        });
    }

    // ЛОГИКА СКАЧИВАНИЯ (Прямое)
    async function directDownloadSingle(projectId, btn) {
        const orig = btn.innerText; btn.innerText = 'Поиск...'; btn.disabled = true;
        try {
            const url = await getDownloadUrl(projectId);
            if(!url) throw new Error("Нет файла");
            const a = document.createElement('a'); a.href = url; document.body.appendChild(a); a.click(); document.body.removeChild(a);
            btn.innerText = '✓ Готово'; btn.style.background = '#fff'; btn.style.color = '#000';
        } catch(e) { btn.innerText = 'Ошибка'; }
        setTimeout(() => { btn.innerText = orig; btn.disabled = false; btn.style = ''; }, 3000);
    }

    async function getDownloadUrl(projectId) {
        let qParams = { game_versions: JSON.stringify([versionSel.value]) };
        if (['mod', 'modpack', 'plugin'].includes(typeSel.value)) qParams.loaders = JSON.stringify([loaderSel.value]);
        
        const res = await fetch(`https://api.modrinth.com/v2/project/${projectId}/version?${new URLSearchParams(qParams)}`);
        if(!res.ok) return null;
        const data = await res.json();
        if(data.length === 0) return null;
        return (data[0].files.find(f => f.primary) || data[0].files[0]).url;
    }

    // КОРЗИНА И СБОРКА
    function toggleModSelection(mod, card) {
        const id = mod.project_id || mod.id, index = selectedMods.findIndex(m => m.id === id);
        if(index === -1) { selectedMods.push({id, title: mod.title}); card.classList.add('selected'); card.querySelector('.select-btn').innerText = 'Убрать'; }
        else { selectedMods.splice(index, 1); card.classList.remove('selected'); card.querySelector('.select-btn').innerText = '+ В сборку'; }
        updateCartUI();
    }
    function updateCartUI() {
        cartCount.innerText = selectedMods.length;
        selectedMods.length > 0 ? cartPanel.classList.add('visible') : cartPanel.classList.remove('visible');
        cartItems.innerHTML = '';
        selectedMods.forEach(mod => {
            const d = document.createElement('div'); d.className = 'cart-item'; d.innerHTML = `<span>${mod.title}</span><button>X</button>`;
            d.querySelector('button').addEventListener('click', () => {
                selectedMods = selectedMods.filter(m => m.id !== mod.id); updateCartUI();
                const c = document.querySelector(`.card[data-id="${mod.id}"]`); if(c) { c.classList.remove('selected'); c.querySelector('.select-btn').innerText = '+ В сборку'; }
            });
            cartItems.appendChild(d);
        });
    }
    function clearCart() { selectedMods = []; updateCartUI(); document.querySelectorAll('.card.selected').forEach(c => { c.classList.remove('selected'); c.querySelector('.select-btn').innerText = '+ В сборку'; }); }

    async function downloadAllCart() {
        if(!selectedMods.length) return;
        const btn = document.getElementById('download-all-btn'), orig = btn.innerText;
        btn.innerText = 'Подготовка...'; btn.disabled = true;
        let success = 0;
        for(let i=0; i<selectedMods.length; i++) {
            btn.innerText = `Качаем: ${i+1}/${selectedMods.length}`;
            try {
                const url = await getDownloadUrl(selectedMods[i].id);
                if(url) { const a = document.createElement('a'); a.href = url; document.body.appendChild(a); a.click(); document.body.removeChild(a); success++; }
                await new Promise(r => setTimeout(r, 1000));
            } catch(e) {}
        }
        btn.innerText = `Успех: ${success}!`;
        setTimeout(() => { btn.innerText = orig; btn.disabled = false; if(success === selectedMods.length) clearCart(); }, 3000);
    }

    // ПЕРЕВОДЧИК И ГЛОБАЛКА
    async function translateDesc(e, el, text) {
        if(e.target.dataset.t === "1") return; e.target.innerText = "⏳";
        try {
            const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=ru&dt=t&q=${encodeURIComponent(text)}`);
            const data = await res.json();
            el.innerText = data[0].map(i => i[0]).join('').substring(0,80) + '...';
            e.target.innerText = "🇷🇺"; e.target.dataset.t = "1"; e.target.style.filter = "none";
        } catch(err) { e.target.innerText = "❌"; }
    }

    async function openProjectDetails(id, icon) {
        projectModal.classList.add('active');
        document.getElementById('modal-body').innerHTML = 'Сбор данных...';
        try {
            const data = await (await fetch(`https://api.modrinth.com/v2/project/${id}`)).json();
            const isSel = selectedMods.some(m => m.id === id);
            let gal = data.gallery?.length ? `<div class="modal-gallery">${data.gallery.map(i => `<img src="${i.url}">`).join('')}</div>` : '';
            let body = data.body.replace(/^### (.*$)/gim, '<h3>$1</h3>').replace(/^## (.*$)/gim, '<h2>$1</h2>').replace(/^# (.*$)/gim, '<h1>$1</h1>').replace(/!\[(.*?)\]\((.*?)\)/gim, '<img src="$2">').replace(/\n/gim, '<br>');

            document.getElementById('modal-body').innerHTML = `
                <div>${gal}<div class="modal-body-text">${body}</div></div>
                <div class="modal-sidebar">
                    <div class="modal-header-info"><img src="${icon}"><div><h2>${data.title}</h2><p style="color:var(--accent)">${data.project_type.toUpperCase()}</p></div></div>
                    <div class="stat-item"><span>Скачиваний:</span> <span>${data.downloads}</span></div>
                    <div class="stat-item"><span>Лицензия:</span> <span>${data.license?.name || 'Неизвестно'}</span></div>
                    <br><button class="min-btn outline mod-sel-btn">${isSel ? 'Убрать из сборки' : 'Добавить в сборку'}</button>
                    <button class="min-btn mod-dl-btn" style="margin-top:10px">Скачать</button>
                </div>
            `;
            document.querySelector('.mod-dl-btn').addEventListener('click', (e) => directDownloadSingle(id, e.target));
            document.querySelector('.mod-sel-btn').addEventListener('click', (e) => {
                toggleModSelection(data, document.querySelector(`.card[data-id="${id}"]`) || document.createElement('div'));
                e.target.innerText = selectedMods.some(m => m.id === id) ? 'Убрать из сборки' : 'Добавить в сборку';
            });
        } catch(e) {}
    }
});
