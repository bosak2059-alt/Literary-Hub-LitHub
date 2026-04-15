// script.js - Полная имитация работы без сервера
const DB = {
  get(key) { try { return JSON.parse(localStorage.getItem(`lithub_${key}`)); } catch { return null; } },
  set(key, val) { localStorage.setItem(`lithub_${key}`, JSON.stringify(val)); }
};

// Инициализация данных по умолчанию
function initDB() {
  if (!DB.get('user')) DB.set('user', { name: 'Саргис Петросян', clubs: ['Филологи & Ко', 'Тихий Читатель'], booksRead: 47, reviews: 12 });
  if (!DB.get('chat')) DB.set('chat', [
    { user: 'Мария', text: 'Сцена с балом у Сатаны просто шедевр. Как думаете, почему Булгаков сделал Маргариту такой решительной?', time: 'Вчера, 14:30', self: false },
    { user: 'Вы', text: 'Мне кажется, это её способ вернуть контроль над хаосом.', time: 'Вчера, 15:12', self: true }
  ]);
  if (!DB.get('votes')) DB.set('votes', { crime: 52, orwell: 31, kiz: 17, votedBy: [] });
  if (!DB.get('clubs')) DB.set('clubs', [
    { id: 'c1', name: 'Филологи & Ко', genre: 'Классика', members: 142, format: 'Онлайн', desc: 'Глубокий анализ литературы.' },
    { id: 'c2', name: 'Тихий Читатель', genre: 'Без давления', members: 215, format: 'Асинхронный', desc: 'Режим "тихого участника".' }
  ]);
}

// Утилиты
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const path = window.location.pathname;

// Навигация
function initNav() {
  const toggle = $('.nav-toggle');
  const links = $('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
    // Закрыть при клике вне
    document.addEventListener('click', (e) => {
      if (!links.contains(e.target) && !toggle.contains(e.target)) links.classList.remove('open');
    });
  }
  // Активная ссылка
  $$('nav a').forEach(a => {
    if (a.getAttribute('href') === path || (path === '/' && a.href.includes('index'))) a.classList.add('active');
  });
}

// Чат
function initChat() {
  const box = $('.chat-box');
  const input = $('.chat-input input');
  const btn = $('.chat-input .btn');
  if (!box || !input || !btn) return;

  const renderChat = (msgs) => {
    box.innerHTML = '';
    msgs.forEach(m => {
      box.innerHTML += `
        <div class="msg ${m.self ? 'self' : 'other'}">
          <span class="msg-meta">${m.user} • ${m.time}</span>
          <p>${m.text}</p>
        </div>`;
    });
    box.scrollTop = box.scrollHeight;
  };

  renderChat(DB.get('chat'));
  btn.onclick = () => {
    const txt = input.value.trim();
    if (!txt) return;
    const newMsg = { user: 'Вы', text: txt, time: new Date().toLocaleTimeString('ru-RU', {hour:'2-digit', minute:'2-digit'}), self: true };
    const msgs = [...DB.get('chat'), newMsg];
    DB.set('chat', msgs);
    renderChat(msgs);
    input.value = '';
    input.focus();
  };
  input.addEventListener('keypress', (e) => { if (e.key === 'Enter') btn.click(); });
}

// Голосование
function initVotes() {
  const opts = $$('.vote-option');
  if (!opts.length) return;
  const votes = DB.get('votes');
  const total = Object.values(votes).filter(v => typeof v === 'number').reduce((a,b)=>a+b, 0);
  
  opts.forEach((opt, i) => {
    const key = ['crime', 'orwell', 'kiz'][i];
    const pct = total ? Math.round((votes[key] / total) * 100) : 0;
    opt.querySelector('.vote-fill').style.width = `${pct}%`;
    opt.querySelector('.vote-header span:last-child').textContent = `${pct}%`;
    
    const btn = opt.querySelector('.btn');
    if (votes.votedBy.includes('current_user')) {
      btn.textContent = '✓ Вы голосовали';
      btn.disabled = true;
    } else {
      btn.onclick = () => {
        votes[key]++;
        votes.votedBy.push('current_user');
        DB.set('votes', votes);
        // Обновить все
        $$('.vote-option').forEach((o, idx) => {
          const k = ['crime', 'orwell', 'kiz'][idx];
          const p = total ? Math.round((votes[k] / (total+1)) * 100) : 0;
          o.querySelector('.vote-fill').style.width = `${p}%`;
          o.querySelector('.vote-header span:last-child').textContent = `${p}%`;
        });
        btn.textContent = '✓ Голос принят';
        btn.disabled = true;
      };
    }
  });
}

// Клубы (Каталог)
function renderClubs() {
  const container = $('[id="clubs-list"]') || $('.grid-3');
  if (!container) return;
  const clubs = DB.get('clubs');
  container.innerHTML = clubs.map(c => `
    <div class="card club-card">
      <h3>${c.name}</h3>
      <div class="club-meta">
        <span>${c.genre}</span>
        <span>${c.members} участника</span>
        <span>📅 ${c.format}</span>
      </div>
      <p>${c.desc}</p>
      <a href="/ClubPage.html?id=${c.id}" class="btn btn-sm" style="margin-top: 1rem;">Открыть</a>
    </div>
  `).join('');
}

// Создание клуба
function initCreateClub() {
  const form = $('#createClubForm');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const newClub = {
      id: 'c' + Date.now(),
      name: form.querySelector('input[type="text"]').value,
      genre: form.querySelectorAll('select')[0].value,
      members: 1,
      format: form.querySelectorAll('select')[1].value,
      desc: form.querySelector('textarea').value
    };
    const clubs = DB.get('clubs');
    DB.set('clubs', [...clubs, newClub]);
    alert('🎉 Клуб успешно создан!');
    window.location.href = '/ClubDirectory.html';
  });
}

// Профиль
function initProfile() {
  const user = DB.get('user');
  if (!user) return;
  // Обновить статистику динамически (например, после создания клуба)
  const clubs = DB.get('clubs').filter(c => c.members > 0).length;
  $('.profile-stats .stat-item:nth-child(2) .stat-num').textContent = `${clubs + user.clubs.length}`;
  $('.profile-hero .avatar').textContent = user.name.split(' ').map(w=>w[0]).join('');
  $('.profile-hero h1').textContent = user.name;
}

// Календарь
function initCalendar() {
  $$('.day-cell .btn').forEach(btn => {
    btn.addEventListener('click', function() {
      if (this.textContent.includes('Подтвердить')) {
        this.textContent = '✅ Участие подтверждено';
        this.classList.add('btn-outline');
        this.style.borderColor = 'var(--success)';
        this.style.color = 'var(--success)';
      }
    });
  });
}

// Вкладки
function initTabs() {
  $$('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const tabId = this.dataset.tab || this.getAttribute('onclick').match(/'([^']+)'/)[1];
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      $(tabId).classList.add('active');
    });
  });
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
  initDB();
  initNav();
  initTabs();
  
  if (path.includes('ClubDirectory') || path === '/') renderClubs();
  if (path.includes('ClubPage')) { initChat(); initVotes(); }
  if (path.includes('profile')) initProfile();
  if (path.includes('create-club')) initCreateClub();
  if (path.includes('MeetingCalendar')) initCalendar();
});