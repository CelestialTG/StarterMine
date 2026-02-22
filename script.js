document.addEventListener('DOMContentLoaded', () => {

    // --- 1. СВЕТ МАЯКА (СЛЕД ЗА МЫШЬЮ) ---
    const glow = document.querySelector('.cursor-glow');
    document.addEventListener('mousemove', (e) => {
        // Плавное следование за курсором
        requestAnimationFrame(() => {
            glow.style.left = `${e.clientX}px`;
            glow.style.top = `${e.clientY}px`;
        });
    });

    // --- 2. НАВИГАЦИЯ ПО РАЗДЕЛАМ (SPA Logic) ---
    const navLinks = document.querySelectorAll('.nav-links li');
    const sections = document.querySelectorAll('.view-section');

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            // Переключаем активную кнопку
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Переключаем секцию
            const targetId = link.getAttribute('data-target');
            sections.forEach(sec => {
                if(sec.id === targetId) {
                    sec.classList.remove('hidden');
                    sec.classList.add('active');
                } else {
                    sec.classList.add('hidden');
                    sec.classList.remove('active');
                }
            });
        });
    });

    // --- 3. НАСТРОЙКИ ДЗЕНА (Сохраняем в localStorage) ---
    const colorBtns = document.querySelectorAll('.color-btn');
    const noiseToggle = document.getElementById('toggle-noise');
    
    // Загрузка сохраненных настроек
    const savedColor = localStorage.getItem('nexus_color') || '#ff007f';
    const savedNoise = localStorage.getItem('nexus_noise') !== 'false';
    
    document.documentElement.style.setProperty('--accent', savedColor);
    if(!savedNoise) document.body.classList.add('no-noise');
    noiseToggle.checked = savedNoise;

    // Логика кнопок цвета
    colorBtns.forEach(btn => {
        if(btn.dataset.color === savedColor) btn.classList.add('active');
        btn.addEventListener('click', () => {
            colorBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const newColor = btn.dataset.color;
            document.documentElement.style.setProperty('--accent', newColor);
            localStorage.setItem('nexus_color', newColor);
        });
    });

    // Логика шума
    noiseToggle.addEventListener('change', (e) => {
        if(e.target.checked) {
            document.body.classList.remove('no-noise');
            localStorage.setItem('nexus_noise', 'true');
        } else {
            document.body.classList.add('no-noise');
            localStorage.setItem('nexus_noise', 'false');
        }
    });


    // --- 4. РАДАР СЕРВЕРОВ (Умный сонар) ---
    const radarBtn = document.getElementById('radar-btn');
    const radarInput = document.getElementById('radar-input');
    const radarResult = document.getElementById('radar-result');

    radarBtn.addEventListener('click', async () => {
        const ip = radarInput.value.trim();
        if(!ip) return;

        radarBtn.innerText = 'Сканирую...';
        radarResult.classList.remove('hidden');
        radarResult.innerHTML = '<div style="color: var(--text-muted)">Устанавливаем связь...</div>';

        try {
            const res = await fetch(`https://api.mcsrvstat.us/3/${ip}`);
            const data = await res.json();

            if(data.online) {
                // Сервер включен
                const icon = data.icon || 'https://images.placeholders.dev/?width=100&height=100&text=?&bgColor=%23151620&textColor=%2384879c';
                const motdHtml = data.motd && data.motd.html ? data.motd.html.join('<br>') : 'Без описания';
                
                radarResult.innerHTML = `
                    <img src="${icon}" alt="Icon" class="radar-icon">
                    <div class="radar-details">
                        <span class="radar-status">ONLINE // ${data.players.online} из ${data.players.max}</span>
                        <h3>${ip}</h3>
                        <p style="color: var(--text-muted); margin-bottom: 15px;">Версия: ${data.version}</p>
                        <div class="radar-motd">${motdHtml}</div>
                    </div>
                `;
            } else {
                // Сервер выключен
                radarResult.innerHTML = `
                    <div class="radar-details">
                        <span class="radar-status offline">OFFLINE // НЕТ СВЯЗИ</span>
                        <h3>${ip}</h3>
                        <p style="color: var(--text-muted)">Узел недоступен или скрыт фаерволом.</p>
                    </div>
                `;
            }
        } catch(e) {
            radarResult.innerHTML = `<div style="color: #ff0040">Ошибка сонара: ${e.message}</div>`;
        }
        radarBtn.innerText = 'Сканаровать';
    });


    // --- 5. СТУДИЯ СКИНОВ (3D Модели) ---
    const skinBtn = document.getElementById('skin-search-btn');
    const skinInput = document.getElementById('skin-search-input');
    const skinResult = document.getElementById('skin-result');
    
    // Элементы вывода
    const skin3dRender = document.getElementById('skin-3d-render');
    const skinUsername = document.getElementById('skin-username');
    const btnRaw = document.getElementById('btn-download-raw');
    const btnAvatar = document.getElementById('btn-download-avatar');

    skinBtn.addEventListener('click', () => {
        const username = skinInput.value.trim();
        if(!username) return;

        skinBtn.innerText = 'Поиск...';
        skinResult.classList.remove('hidden');
        
        // Используем классное API starlightskins для рендера полного тела
        const renderUrl = `https://starlightskins.lunareclipse.studio/render/ultimate/${username}/full?height=400`;
        const rawSkinUrl = `https://minotar.net/skin/${username}`;
        const avatarUrl = `https://minotar.net/helm/${username}/256.png`;

        // Обновляем картинку и ссылки
        skin3dRender.src = renderUrl;
        skinUsername.innerText = username.toUpperCase();
        
        btnRaw.href = rawSkinUrl;
        btnAvatar.href = avatarUrl;

        // Когда картинка 3d загрузилась
        skin3dRender.onload = () => { skinBtn.innerText = 'Найти облик'; };
        skin3dRender.onerror = () => { 
            skinUsername.innerText = 'ОШИБКА: Игрок не найден'; 
            skinBtn.innerText = 'Найти облик'; 
            skin3dRender.src = '';
        };
    });


    // --- 6. ХРАНИЛИЩЕ КОНТЕНТА (Моды, Шейдеры - старая база в новом стиле) ---
    const searchBtn = document.getElementById('search-btn');
    const typeSelect = document.getElementById('type-select');
    const resultsContainer = document.getElementById('results');

    // Модалка
    const projectModal = document.getElementById('project-modal');
    const modalBody = document.getElementById('modal-body');
    document.getElementById('close-modal-btn').addEventListener('click', () => projectModal.classList.add('hidden'));

    searchBtn.addEventListener('click', fetchContent);
    document.getElementById('search-input').addEventListener('keypress', (e) => { if(e.key === 'Enter') fetchContent(); });

    async function fetchContent() {
        searchBtn.innerText = '...';
        const type = typeSelect.value;
        const version = document.getElementById('version-select').value;
        const query = document.getElementById('search-input').value;

        resultsContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">Синхронизация с архивом...</div>';

        try {
            const facets = [[`versions:${version}`], [`project_type:${type}`]];
            const url = new URL('https://api.modrinth.com/v2/search');
            url.searchParams.append('query', query);
            url.searchParams.append('facets', JSON.stringify(facets));
            url.searchParams.append('limit', 16);

            const response = await fetch(url);
            const data = await response.json();

            resultsContainer.innerHTML = '';
            if(data.hits.length === 0) {
                resultsContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center;">В этом секторе пусто.</div>';
                return;
            }

            data.hits.forEach(item => {
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <div class="card-header">
                        <img src="${item.icon_url || 'https://docs.modrinth.com/img/logo.svg'}">
                        <h3>${item.title}</h3>
                    </div>
                    <p>${item.description.substring(0, 80)}...</p>
                    <button class="min-btn outline">Смотреть данные</button>
                `;
                card.querySelector('button').addEventListener('click', () => openDetails(item.project_id));
                resultsContainer.appendChild(card);
            });
        } catch (e) {
            resultsContainer.innerHTML = `<div style="grid-column: 1/-1; color: var(--accent);">Ошибка: ${e.message}</div>`;
        }
        searchBtn.innerText = 'Найти';
    }

    async function openDetails(id) {
        projectModal.classList.remove('hidden');
        modalBody.innerHTML = 'Запрос данных...';
        
        const res = await fetch(`https://api.modrinth.com/v2/project/${id}`);
        const data = await res.json();

        modalBody.innerHTML = `
            <h2 style="font-family: 'Cormorant Garamond'; font-size: 2.5rem; margin-bottom: 10px;">${data.title}</h2>
            <p style="color: var(--text-muted); margin-bottom: 20px;">Скачиваний: ${data.downloads}</p>
            <div style="background: var(--bg-elevated); padding: 20px; border-radius: 8px; line-height: 1.6;">
                ${data.description}
            </div>
            <a href="https://modrinth.com/${data.project_type}/${data.slug}" target="_blank" class="min-btn" style="display: inline-block; margin-top: 20px; text-decoration: none;">
                Перейти к источнику для скачивания
            </a>
        `;
    }

    // Запускаем поиск при старте
    fetchContent();
});
