document.addEventListener('DOMContentLoaded', () => {
    let currentPage = 1;
    const limit = 24;
    let currentCategory = ""; 
    let selectedMods = []; 
    let loadedModsData = []; 

    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');
    const versionSelect = document.getElementById('version-select');
    const loaderSelect = document.getElementById('loader-select');
    const typeSelect = document.getElementById('type-select');
    const resultsContainer = document.getElementById('results');
    
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const pageIndicator = document.getElementById('page-indicator');
    
    const cartPanel = document.getElementById('cart-panel');
    const cartCount = document.getElementById('cart-count');
    const cartItems = document.getElementById('cart-items');
    const clearCartBtn = document.getElementById('clear-cart-btn');
    const downloadAllBtn = document.getElementById('download-all-btn');

    // Модальное окно (Глобал Инфо)
    const projectModal = document.getElementById('project-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const modalBody = document.getElementById('modal-body');

    searchBtn.addEventListener('click', () => { currentPage = 1; fetchMods(); });
    searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { currentPage = 1; fetchMods(); } });
    versionSelect.addEventListener('change', () => { currentPage = 1; fetchMods(); });
    loaderSelect.addEventListener('change', () => { currentPage = 1; fetchMods(); });

    typeSelect.addEventListener('change', () => {
        currentPage = 1;
        if (typeSelect.value === 'shader' || typeSelect.value === 'resourcepack') {
            loaderSelect.disabled = true; loaderSelect.style.opacity = '0.3'; loaderSelect.style.cursor = 'not-allowed';
        } else {
            loaderSelect.disabled = false; loaderSelect.style.opacity = '1'; loaderSelect.style.cursor = 'pointer';
        }
        fetchMods();
    });

    document.querySelectorAll('.tag-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
            if (currentCategory === e.target.dataset.tag) {
                currentCategory = "";
            } else {
                e.target.classList.add('active'); currentCategory = e.target.dataset.tag;
            }
            currentPage = 1; fetchMods();
        });
    });

    prevBtn.addEventListener('click', () => { if (currentPage > 1) { currentPage--; fetchMods(); } });
    nextBtn.addEventListener('click', () => { currentPage++; fetchMods(); });
    clearCartBtn.addEventListener('click', clearCart);
    downloadAllBtn.addEventListener('click', downloadAllCart);

    // Закрытие модального окна
    closeModalBtn.addEventListener('click', () => projectModal.classList.remove('active'));
    projectModal.addEventListener('click', (e) => { if(e.target === projectModal) projectModal.classList.remove('active'); });

    fetchMods();

    async function fetchMods() {
        const version = versionSelect.value;
        const loader = loaderSelect.value;
        const contentType = typeSelect.value;
        const query = searchInput.value;
        const offset = (currentPage - 1) * limit;

        resultsContainer.innerHTML = '<div class="status-message">ПОДКЛЮЧЕНИЕ К БАЗЕ...</div>';
        pageIndicator.innerText = `СТРАНИЦА ${currentPage}`;
        prevBtn.disabled = currentPage === 1;

        try {
            const facets = [[`versions:${version}`], [`project_type:${contentType}`]];
            if (contentType === 'mod' || contentType === 'modpack' || contentType === 'plugin') facets.push([`categories:${loader}`]);
            if (currentCategory) facets.push([`categories:${currentCategory}`]);

            const url = new URL('https://api.modrinth.com/v2/search');
            url.searchParams.append('query', query);
            url.searchParams.append('facets', JSON.stringify(facets));
            url.searchParams.append('limit', limit);
            url.searchParams.append('offset', offset);

            const response = await fetch(url);
            if (!response.ok) throw new Error('ОШИБКА СЕРВЕРА API');

            const data = await response.json();
            loadedModsData = data.hits;
            nextBtn.disabled = data.hits.length < limit;

            displayResults(loadedModsData);
        } catch (error) {
            resultsContainer.innerHTML = `<div class="status-message" style="color: #ff007f;">${error.message}</div>`;
        }
    }

    function displayResults(mods) {
        resultsContainer.innerHTML = '';
        if (mods.length === 0) { resultsContainer.innerHTML = '<div class="status-message">ПУСТО. ИЗМЕНИТЕ ЗАПРОС ИЛИ ВЕРСИЮ.</div>'; return; }

        mods.forEach(mod => {
            const isSelected = selectedMods.some(m => m.id === mod.project_id);
            const card = document.createElement('div');
            card.className = `mod-card ${isSelected ? 'selected' : ''}`;
            card.dataset.id = mod.project_id;

            const iconUrl = mod.icon_url || 'https://docs.modrinth.com/img/logo.svg';
            let shortDesc = mod.description;
            if (shortDesc.length > 90) shortDesc = shortDesc.substring(0, 90) + '...';

            card.innerHTML = `
                <div class="mod-card-header">
                    <img src="${iconUrl}" alt="Иконка">
                    <h3>${mod.title} <button class="translate-btn" title="Перевести">🌐</button></h3>
                </div>
                <p class="mod-desc" data-orig="${shortDesc}">${shortDesc}</p>
                <div class="card-actions">
                    <button class="select-btn">${isSelected ? 'УБРАТЬ' : 'В СБОРКУ'}</button>
                    <button class="download-btn">СКАЧАТЬ</button>
                </div>
            `;

            // Обработка клика по самой карточке (открыть модалку)
            card.addEventListener('click', (e) => {
                // Если кликнули по кнопке внутри, игнорируем открытие модалки
                if (e.target.closest('button')) return;
                openProjectDetails(mod.project_id, iconUrl);
            });

            resultsContainer.appendChild(card);
            applyVanillaTilt(card);

            card.querySelector('.download-btn').addEventListener('click', (e) => directDownloadSingle(mod.project_id, e.target));
            card.querySelector('.select-btn').addEventListener('click', () => toggleModSelection(mod, card));
            card.querySelector('.translate-btn').addEventListener('click', (e) => translateDescription(e, card.querySelector('.mod-desc'), mod.description));
        });
    }

    // ==========================================
    // НОВОЕ: ГЛОБАЛЬНАЯ ИНФОРМАЦИЯ О ПРОЕКТЕ
    // ==========================================
    async function openProjectDetails(projectId, iconUrl) {
        // Открываем модалку, ставим загрузку
        projectModal.classList.add('active');
        modalBody.innerHTML = '<div class="status-message" style="grid-column: 1/-1;">ЗАГРУЗКА ДАННЫХ ИЗ СЕТИ...</div>';

        try {
            const response = await fetch(`https://api.modrinth.com/v2/project/${projectId}`);
            if (!response.ok) throw new Error("Не удалось загрузить данные");
            const project = await response.json();

            // Форматируем числа (напр. 1500000 -> 1.5M)
            const formatNum = num => num >= 1e6 ? (num / 1e6).toFixed(1) + 'M' : num >= 1e3 ? (num / 1e3).toFixed(1) + 'K' : num;
            
            // Генерируем галерею
            let galleryHtml = '';
            if (project.gallery && project.gallery.length > 0) {
                galleryHtml = `<div class="modal-gallery">` + 
                    project.gallery.map(img => `<img src="${img.url}" alt="Скриншот">`).join('') + 
                `</div>`;
            }

            // Парсим Markdown в HTML для красивого описания
            let bodyHtml = parseMarkdown(project.body || project.description);

            // Проверяем, есть ли мод уже в сборке
            const isSelected = selectedMods.some(m => m.id === project.id);

            // Собираем HTML для модального окна
            modalBody.innerHTML = `
                <div class="modal-left">
                    ${galleryHtml}
                    <div class="modal-body-text">${bodyHtml}</div>
                </div>
                
                <div class="modal-sidebar">
                    <div class="modal-header-info">
                        <img src="${iconUrl}" alt="Лого">
                        <div>
                            <h2>${project.title}</h2>
                            <p>${project.project_type.toUpperCase()}</p>
                        </div>
                    </div>
                    
                    <div class="stat-item"><span>Скачиваний:</span> <span>${formatNum(project.downloads)}</span></div>
                    <div class="stat-item"><span>Подписчиков:</span> <span>${formatNum(project.followers)}</span></div>
                    <div class="stat-item"><span>Лицензия:</span> <span>${project.license ? project.license.name : 'Неизвестно'}</span></div>
                    <div class="stat-item"><span>Клиент:</span> <span style="color:${project.client_side === 'required' ? 'var(--neon-green)' : '#ccc'}">${project.client_side}</span></div>
                    <div class="stat-item"><span>Сервер:</span> <span style="color:${project.server_side === 'required' ? 'var(--neon-green)' : '#ccc'}">${project.server_side}</span></div>
                    <div class="stat-item"><span>Обновлен:</span> <span>${new Date(project.updated).toLocaleDateString()}</span></div>

                    <div class="modal-actions">
                        <button class="neon-btn modal-select-btn" style="background: transparent; border: 2px solid var(--neon-green); color: var(--neon-green);">
                            ${isSelected ? 'УБРАТЬ ИЗ СБОРКИ' : 'ДОБАВИТЬ В СБОРКУ'}
                        </button>
                        <button class="neon-btn modal-download-btn">СКАЧАТЬ СЕЙЧАС</button>
                    </div>
                </div>
            `;

            // Вешаем логику на кнопки внутри окна
            const modalSelectBtn = modalBody.querySelector('.modal-select-btn');
            modalSelectBtn.addEventListener('click', () => {
                // Имитируем клик по карточке снаружи
                const extCard = document.querySelector(`.mod-card[data-id="${project.id}"]`);
                if(extCard) {
                    toggleModSelection(project, extCard);
                } else {
                    // Если карточки нет (например на другой странице), добавляем вручную
                    toggleModSelection(project, document.createElement('div')); 
                }
                modalSelectBtn.innerText = selectedMods.some(m => m.id === project.id) ? 'УБРАТЬ ИЗ СБОРКИ' : 'ДОБАВИТЬ В СБОРКУ';
            });

            modalBody.querySelector('.modal-download-btn').addEventListener('click', (e) => directDownloadSingle(project.id, e.target));

        } catch (err) {
            modalBody.innerHTML = `<div class="status-message" style="color: #ff007f;">ОШИБКА: ${err.message}</div>`;
        }
    }

    // Простой парсер текста (Markdown -> HTML)
    function parseMarkdown(text) {
        if (!text) return "Описание отсутствует.";
        return text
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/gim, '<em>$1</em>')
            .replace(/!\[(.*?)\]\((.*?)\)/gim, '<img src="$2" alt="$1">') // Картинки
            .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank">$1</a>') // Ссылки
            .replace(/\n/gim, '<br>'); // Переносы строк
    }
    // ==========================================

    async function translateDescription(event, descElement, fullText) {
        const btn = event.target;
        if (btn.dataset.translated === "true") return;
        btn.innerText = "⏳";
        try {
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=ru&dt=t&q=${encodeURIComponent(fullText)}`;
            const res = await fetch(url);
            const data = await res.json();
            let translatedText = "";
            data[0].forEach(item => translatedText += item[0]);
            if (translatedText.length > 90) translatedText = translatedText.substring(0, 90) + '...';
            descElement.innerText = translatedText;
            btn.innerText = "🇷🇺"; btn.dataset.translated = "true"; btn.style.filter = "none";
        } catch (error) {
            btn.innerText = "❌"; setTimeout(() => { btn.innerText = "🌐"; }, 2000);
        }
    }

    function toggleModSelection(mod, cardElement) {
        const index = selectedMods.findIndex(m => m.id === (mod.project_id || mod.id));
        const selectBtn = cardElement.querySelector('.select-btn');

        if (index === -1) {
            selectedMods.push({ id: (mod.project_id || mod.id), title: mod.title });
            cardElement.classList.add('selected');
            if(selectBtn) selectBtn.innerText = 'УБРАТЬ';
        } else {
            selectedMods.splice(index, 1);
            cardElement.classList.remove('selected');
            if(selectBtn) selectBtn.innerText = 'В СБОРКУ';
        }
        updateCartUI();
    }

    function removeModFromCart(id) {
        selectedMods = selectedMods.filter(m => m.id !== id);
        updateCartUI();
        const card = document.querySelector(`.mod-card[data-id="${id}"]`);
        if (card) { card.classList.remove('selected'); card.querySelector('.select-btn').innerText = 'В СБОРКУ'; }
    }

    function clearCart() {
        selectedMods = []; updateCartUI();
        document.querySelectorAll('.mod-card.selected').forEach(card => {
            card.classList.remove('selected'); card.querySelector('.select-btn').innerText = 'В СБОРКУ';
        });
    }

    function updateCartUI() {
        cartCount.innerText = selectedMods.length;
        if (selectedMods.length > 0) cartPanel.classList.add('visible'); else cartPanel.classList.remove('visible');
        cartItems.innerHTML = '';
        selectedMods.forEach(mod => {
            const div = document.createElement('div'); div.className = 'cart-item';
            div.innerHTML = `<span>${mod.title}</span><button title="Удалить">X</button>`;
            div.querySelector('button').addEventListener('click', () => removeModFromCart(mod.id));
            cartItems.appendChild(div);
        });
    }

    async function downloadAllCart() {
        if (selectedMods.length === 0) return;
        const originalText = downloadAllBtn.innerText;
        downloadAllBtn.innerText = 'ПОДГОТОВКА...'; downloadAllBtn.disabled = true;
        let successCount = 0;

        for (let i = 0; i < selectedMods.length; i++) {
            const mod = selectedMods[i];
            downloadAllBtn.innerText = `КАЧАЕМ: ${i+1}/${selectedMods.length}`;
            try {
                const url = await getDownloadUrl(mod.id);
                if (url) {
                    const a = document.createElement('a'); a.href = url; a.download = ''; 
                    document.body.appendChild(a); a.click(); document.body.removeChild(a); successCount++;
                }
                await new Promise(r => setTimeout(r, 1000));
            } catch (e) { console.error("Ошибка при загрузке", mod.title); }
        }
        downloadAllBtn.innerText = `УСПЕХ: ${successCount}!`; downloadAllBtn.style.background = '#fff';
        setTimeout(() => {
            downloadAllBtn.innerText = originalText; downloadAllBtn.disabled = false; downloadAllBtn.style.background = 'var(--neon-green)';
            if(successCount === selectedMods.length) clearCart(); 
        }, 3000);
    }

    async function directDownloadSingle(projectId, btnElement) {
        const originalText = btnElement.innerText;
        btnElement.innerText = 'ПОИСК...'; btnElement.disabled = true;
        try {
            const url = await getDownloadUrl(projectId);
            if (!url) throw new Error("Нет файла");
            const a = document.createElement('a'); a.href = url; document.body.appendChild(a); a.click(); document.body.removeChild(a);
            btnElement.innerText = '✓ ГОТОВО'; btnElement.style.background = '#fff'; 
        } catch (error) { btnElement.innerText = '❌ ОШИБКА'; btnElement.style.background = '#ff0040'; }
        setTimeout(() => {
            btnElement.innerText = originalText; btnElement.disabled = false; btnElement.style.background = 'var(--neon-blue)';
        }, 3000);
    }

    async function getDownloadUrl(projectId) {
        const version = versionSelect.value;
        const loader = loaderSelect.value;
        const contentType = typeSelect.value;
        let queryParamsObj = { game_versions: JSON.stringify([version]) };
        
        if (contentType === 'mod' || contentType === 'modpack' || contentType === 'plugin') {
            queryParamsObj.loaders = JSON.stringify([loader]);
        }
        const queryParams = new URLSearchParams(queryParamsObj);
        const response = await fetch(`https://api.modrinth.com/v2/project/${projectId}/version?${queryParams.toString()}`);
        if (!response.ok) return null;
        const versionsData = await response.json();
        if (versionsData.length === 0) return null;

        const latestVersion = versionsData[0];
        const primaryFile = latestVersion.files.find(f => f.primary) || latestVersion.files[0];
        return primaryFile.url;
    }

    function applyVanillaTilt(element) {
        element.addEventListener('mousemove', (e) => {
            const rect = element.getBoundingClientRect();
            const x = e.clientX - rect.left; const y = e.clientY - rect.top;
            const centerX = rect.width / 2; const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -10; const rotateY = ((x - centerX) / centerX) * 10;
            element.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });
        element.addEventListener('mouseleave', () => {
            element.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
            element.style.transition = 'transform 0.5s ease';
        });
        element.addEventListener('mouseenter', () => { element.style.transition = 'none'; });
    }
});
