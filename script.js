document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.getElementById('search-btn');
    const versionSelect = document.getElementById('version-select');
    const loaderSelect = document.getElementById('loader-select');
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('results');

    // Автоматическая загрузка популярных модов при открытии сайта
    fetchMods();

    // Авто-обновление списка при смене версии или загрузчика
    versionSelect.addEventListener('change', fetchMods);
    loaderSelect.addEventListener('change', fetchMods);

    // Поиск по кнопке и по Enter
    searchBtn.addEventListener('click', fetchMods);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') fetchMods();
    });

    async function fetchMods() {
        const version = versionSelect.value;
        const loader = loaderSelect.value;
        const query = searchInput.value;

        resultsContainer.innerHTML = '<div class="status-message">ИЩЕМ ДАННЫЕ В СЕТИ...</div>';

        try {
            const facets = [
                [`versions:${version}`],
                [`categories:${loader}`],
                ["project_type:mod", "project_type:plugin"]
            ];

            const url = new URL('https://api.modrinth.com/v2/search');
            url.searchParams.append('query', query); // Если пустое, выдаст самые популярные
            url.searchParams.append('facets', JSON.stringify(facets));
            url.searchParams.append('limit', 24);

            const response = await fetch(url);
            if (!response.ok) throw new Error('СБОЙ СВЯЗИ С ЯДРОМ API');

            const data = await response.json();
            displayResults(data.hits);

        } catch (error) {
            resultsContainer.innerHTML = `<div class="status-message" style="color: #ff007f;">ОШИБКА: ${error.message}</div>`;
        }
    }

    function displayResults(mods) {
        resultsContainer.innerHTML = '';

        if (mods.length === 0) {
            resultsContainer.innerHTML = '<div class="status-message">МОДОВ ПОД ЭТУ ВЕРСИЮ НЕ НАЙДЕНО.</div>';
            return;
        }

        mods.forEach(mod => {
            const card = document.createElement('div');
            card.className = 'mod-card';

            const iconUrl = mod.icon_url || 'https://docs.modrinth.com/img/logo.svg';
            const modTitle = mod.title;
            const modDesc = mod.description.length > 80 ? mod.description.substring(0, 80) + '...' : mod.description;
            const projectId = mod.project_id; // Уникальный ID мода для скачивания файла

            card.innerHTML = `
                <div class="mod-card-header">
                    <img src="${iconUrl}" alt="Иконка">
                    <h3>${modTitle}</h3>
                </div>
                <p>${modDesc}</p>
                <!-- Обрати внимание: теперь это кнопка, которая запускает нашу функцию -->
                <button class="download-btn" data-id="${projectId}">ЗАГРУЗИТЬ</button>
            `;

            resultsContainer.appendChild(card);
            applyVanillaTilt(card);
        });

        // Вешаем события на все новые кнопки "Загрузить"
        document.querySelectorAll('.download-btn').forEach(btn => {
            btn.addEventListener('click', (e) => directDownload(e.target));
        });
    }

    // --- ФУНКЦИЯ ПРЯМОГО СКАЧИВАНИЯ ФАЙЛА ---
    async function directDownload(btnElement) {
        const projectId = btnElement.getAttribute('data-id');
        const version = versionSelect.value;
        const loader = loaderSelect.value;
        const originalText = btnElement.innerText;

        // Меняем вид кнопки пока ищем файл
        btnElement.innerText = 'ИЩЕМ ФАЙЛ...';
        btnElement.disabled = true;

        try {
            // Формируем запрос на конкретный файл для выбранной версии игры и загрузчика
            const queryParams = new URLSearchParams({
                loaders: JSON.stringify([loader]),
                game_versions: JSON.stringify([version])
            });

            // Запрашиваем конкретный релиз мода
            const response = await fetch(`https://api.modrinth.com/v2/project/${projectId}/version?${queryParams.toString()}`);
            if (!response.ok) throw new Error('API Error');

            const versionsData = await response.json();

            // Если модринф не выдал файлов под эту версию/загрузчик
            if (versionsData.length === 0) {
                btnElement.innerText = 'НЕТ ФАЙЛА';
                btnElement.style.background = '#ff0040'; // Красный цвет
                btnElement.style.color = '#fff';
                setTimeout(() => resetBtn(btnElement, originalText), 3000);
                return;
            }

            // Берем самый свежий подходящий файл
            const latestVersion = versionsData[0];
            // Ищем primary файл (обычно это сам .jar)
            const primaryFile = latestVersion.files.find(f => f.primary) || latestVersion.files[0];
            
            // Начинаем загрузку (создаем невидимую ссылку и кликаем по ней)
            const downloadUrl = primaryFile.url;
            const a = document.createElement('a');
            a.href = downloadUrl;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            // Показываем успешный статус
            btnElement.innerText = 'СКАЧАНО!';
            btnElement.style.background = '#fff'; 
            setTimeout(() => resetBtn(btnElement, originalText), 3000);

        } catch (error) {
            console.error(error);
            btnElement.innerText = 'ОШИБКА';
            btnElement.style.background = '#ff0040';
            setTimeout(() => resetBtn(btnElement, originalText), 3000);
        }
    }

    // Возвращает кнопку в исходное состояние
    function resetBtn(btn, text) {
        btn.innerText = text;
        btn.disabled = false;
        btn.style.background = 'var(--neon-green)';
        btn.style.color = 'var(--bg-dark)';
    }

    // Уникальный 3D эффект наклона
    function applyVanillaTilt(element) {
        element.addEventListener('mousemove', (e) => {
            const rect = element.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -10;
            const rotateY = ((x - centerX) / centerX) * 10;
            element.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });

        element.addEventListener('mouseleave', () => {
            element.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
            element.style.transition = 'transform 0.5s ease';
        });

        element.addEventListener('mouseenter', () => { element.style.transition = 'none'; });
    }
});
