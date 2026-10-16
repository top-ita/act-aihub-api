'use strict';

const article = document.querySelector('#document');
const toc = document.querySelector('#toc');
const search = document.querySelector('#search');
const sidebar = document.querySelector('.sidebar');
const menu = document.querySelector('#menu-toggle');
let sections = [];
let toastTimer;

function slug(text) {
  return text.toLowerCase().replace(/[^\p{L}\p{M}\p{N}_\s-]/gu, '').replace(/\s/g, '-');
}

function notify(message) {
  document.querySelector('#toast').textContent = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { document.querySelector('#toast').textContent = ''; }, 2500);
}

function scrollToHash() {
  try {
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target) target.scrollIntoView();
  } catch { /* Ignore malformed URL fragments. */ }
}

async function loadManual() {
  try {
    let markdown;
    if (location.protocol === 'file:') {
      markdown = window.API_MANUAL_MARKDOWN;
      if (typeof markdown !== 'string') throw new Error('ไม่พบ manual-data.js กรุณารัน python3 sync-manual.py');
    } else {
      const response = await fetch('API_MANUAL.md', { cache: 'no-cache' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      markdown = await response.text();
    }
    article.innerHTML = DOMPurify.sanitize(marked.parse(markdown, { gfm: true }));
    const ids = new Map();
    article.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(heading => {
      const base = slug(heading.textContent);
      const count = ids.get(base) || 0;
      ids.set(base, count + 1);
      heading.id = count ? `${base}-${count}` : base;
    });

    // Retain the complete document, grouping top-level topics for search.
    let section = document.createElement('section');
    for (const node of Array.from(article.childNodes)) {
      if (node.nodeName === 'H2' && section.hasChildNodes()) {
        article.append(section);
        section = document.createElement('section');
      }
      section.append(node);
    }
    if (section.hasChildNodes()) article.append(section);
    sections = Array.from(article.children);

    const headings = Array.from(article.querySelectorAll('h2'));
    headings.forEach(heading => {
      const link = document.createElement('a');
      link.href = `#${heading.id}`;
      const endpoint = heading.querySelector('code');
      if (endpoint && endpoint.textContent.startsWith('GET ')) {
        const method = document.createElement('span');
        method.className = 'toc-method';
        method.textContent = 'GET';
        link.append(method, document.createTextNode(endpoint.textContent.slice(4)));
      } else link.textContent = heading.textContent;
      link.dataset.target = heading.id;
      toc.append(link);
    });

    article.querySelectorAll('table').forEach(table => {
      const wrapper = document.createElement('div');
      wrapper.className = 'table-wrap';
      wrapper.tabIndex = 0;
      wrapper.setAttribute('role', 'region');
      wrapper.setAttribute('aria-label', 'ตารางข้อมูล API เลื่อนแนวนอนได้');
      table.before(wrapper);
      wrapper.append(table);
    });

    article.querySelectorAll('pre').forEach(pre => {
      const code = pre.querySelector('code');
      const wrapper = document.createElement('div');
      wrapper.className = 'code-block';
      const header = document.createElement('div');
      header.className = 'code-header';
      const language = document.createElement('span');
      language.textContent = (code?.className.match(/language-([\w-]+)/)?.[1] || 'code').toUpperCase();
      const button = document.createElement('button');
      button.className = 'copy-button';
      button.type = 'button';
      button.textContent = 'คัดลอก';
      button.setAttribute('aria-label', `คัดลอกตัวอย่าง ${language.textContent}`);
      button.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(code?.textContent || pre.textContent);
          notify('คัดลอกโค้ดแล้ว');
        } catch { notify('คัดลอกไม่สำเร็จ กรุณาเลือกข้อความในกล่องโค้ดแล้วคัดลอก'); }
      });
      header.append(language, button);
      pre.before(wrapper);
      wrapper.append(header, pre);
    });

    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting);
      if (!visible.length) return;
      const id = visible[0].target.id;
      toc.querySelectorAll('a').forEach(link => {
        const active = link.dataset.target === id;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-15% 0px -65% 0px' });
    headings.forEach(heading => observer.observe(heading));
    document.querySelector('#load-status').textContent = '';
    scrollToHash();
  } catch (error) {
    document.querySelector('#load-status').textContent = `โหลดคู่มือไม่สำเร็จ (${error.message}) — กรุณาตรวจสอบว่าไฟล์คู่มือและไฟล์ JavaScript อยู่ครบในโฟลเดอร์เดียวกับ index.html`;
  }
}

search.addEventListener('input', () => {
  const query = search.value.trim().toLocaleLowerCase();
  let count = 0;
  sections.forEach(section => {
    const matches = !query || section.textContent.toLocaleLowerCase().includes(query);
    section.hidden = !matches;
    if (matches) count++;
    const heading = section.querySelector('h2');
    if (heading) {
      const link = Array.from(toc.children).find(item => item.dataset.target === heading.id);
      if (link) link.hidden = !matches;
    }
  });
  document.querySelector('#search-status').textContent = query ? (count ? `พบ ${count} หมวดที่เกี่ยวข้อง` : 'ไม่พบเนื้อหาที่ค้นหา') : '';
});

menu.addEventListener('click', () => {
  menu.setAttribute('aria-expanded', String(sidebar.classList.toggle('open')));
});
toc.addEventListener('click', event => {
  if (!event.target.closest('a')) return;
  sidebar.classList.remove('open');
  menu.setAttribute('aria-expanded', 'false');
});
document.addEventListener('keydown', event => {
  if (event.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && !document.activeElement.isContentEditable) {
    event.preventDefault();
    sidebar.classList.add('open');
    menu.setAttribute('aria-expanded', 'true');
    search.focus();
  }
  if (event.key === 'Escape' && document.activeElement === search) {
    search.value = '';
    search.dispatchEvent(new Event('input'));
    search.blur();
  }
});
window.addEventListener('hashchange', scrollToHash);
loadManual();
