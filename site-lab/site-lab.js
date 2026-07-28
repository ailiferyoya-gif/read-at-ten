(() => {
  'use strict';

  const dialog = document.querySelector('.plain-dialog');
  const show = message => {
    if (!dialog) return;
    dialog.replaceChildren();
    const text = document.createElement('p');
    text.textContent = message;
    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = '閉じる';
    close.addEventListener('click', () => dialog.close(), { once: true });
    dialog.append(text, close);
    dialog.showModal();
  };

  document.querySelectorAll('[data-notice]').forEach(button => {
    button.addEventListener('click', () => show(button.dataset.notice));
  });

  document.querySelectorAll('[data-date]').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-date]').forEach(item => item.classList.toggle('active', item === button));
      const target = document.querySelector('#schedule-date');
      if (target) target.textContent = `${button.dataset.date}（${button.textContent.trim().slice(-1)}）`;
    });
  });

  document.querySelectorAll('[data-seat]').forEach(button => {
    button.addEventListener('click', () => show(`${button.dataset.seat} の回を選択しました。これは閲覧用サンプルのため、購入処理は行いません。`));
  });

  const search = document.querySelector('[data-board-search]');
  if (search) {
    search.addEventListener('submit', event => {
      event.preventDefault();
      const query = String(new FormData(search).get('q') || '').trim();
      show(query ? `「${query}」の検索結果は、この閲覧用サンプルにはありません。` : '検索したい言葉を入力してください。');
    });
  }

  const postForm = document.querySelector('[data-board-post]');
  if (postForm) {
    postForm.addEventListener('submit', event => {
      event.preventDefault();
      const body = String(new FormData(postForm).get('body') || '').trim();
      if (!body) {
        show('本文を入力してください。');
        return;
      }
      const posts = document.querySelector('#board-posts');
      if (!posts) return;
      const item = document.createElement('li');
      const author = document.createElement('b');
      author.textContent = '投稿者：匿名';
      const time = document.createElement('time');
      time.textContent = 'この端末で追加';
      const text = document.createElement('p');
      text.textContent = body;
      item.append(author, time, text);
      posts.append(item);
      postForm.reset();
      const count = document.querySelector('#post-count');
      if (count) count.textContent = `${posts.children.length + 14}件`;
      show('投稿をこの画面に追加しました。外部へは送信していません。');
    });
  }

  document.querySelectorAll('[data-sort]').forEach(button => {
    button.addEventListener('click', () => {
      const posts = document.querySelector('#board-posts');
      if (!posts) return;
      const items = [...posts.children];
      if (button.dataset.sort === 'new') items.reverse();
      items.forEach(item => posts.append(item));
    });
  });

  const scenes = [...document.querySelectorAll('[data-aqua-scene]')];
  const sceneButtons = [...document.querySelectorAll('[data-aqua-slide]')];
  if (scenes.length > 1 && sceneButtons.length === scenes.length) {
    let activeScene = 0;
    const chooseScene = index => {
      activeScene = (index + scenes.length) % scenes.length;
      scenes.forEach((scene, itemIndex) => scene.classList.toggle('is-current', itemIndex === activeScene));
      sceneButtons.forEach((button, itemIndex) => {
        const current = itemIndex === activeScene;
        button.classList.toggle('is-current', current);
        button.setAttribute('aria-pressed', String(current));
      });
    };
    sceneButtons.forEach((button, index) => button.addEventListener('click', () => chooseScene(index)));
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.setInterval(() => chooseScene(activeScene + 1), 8500);
    }
  }

  const revealItems = document.querySelectorAll('[data-reveal]');
  if (revealItems.length) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      revealItems.forEach(item => item.classList.add('is-visible'));
    } else {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.14 });
      revealItems.forEach(item => observer.observe(item));
    }
  }
})();
