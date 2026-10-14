// Khởi tạo bài viết mặc định nếu LocalStorage rỗng
const defaultArticles = [
  {
    id: "dtri-20260928122246655",
    title: "Hà Nội tính cơ chế bồi thường đất đặc biệt cho 7 dự án đường sắt",
    slug: "ha-noi-tinh-co-che-boi-thuong-dat-dac-biet-cho-7-du-an-duong-sat",
    excerpt: "Hà Nội đang xem xét cơ chế bồi thường, hỗ trợ và tái định cư đặc biệt để triển khai 7 dự án đường sắt quan trọng.",
    content: "Hà Nội đang nghiên cứu và đề xuất cơ chế bồi thường, hỗ trợ và tái định cư đặc biệt nhằm tháo gỡ khó khăn trong công tác giải phóng mặt bằng cho 7 dự án đường sắt trọng điểm. Đây là nhóm dự án hạ tầng giao thông có vai trò quan trọng trong việc phát triển mạng lưới vận tải công cộng.",
    image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600",
    author: "Văn Hưng",
    category: "Bất động sản",
    publishedAt: "2026-09-28 12:22",
    source: "dantri.com.vn",
    url: "https://dantri.com.vn/bat-dong-san/ha-noi-tinh-co-che-boi-thuong-dat-dac-biet-cho-7-du-an-duong-sat-20260928122246655.htm"
  }
];

document.addEventListener('DOMContentLoaded', async () => {
  initLocalStorage();
  await loadCategories();
  renderArticles();
});

function initLocalStorage() {
  if (!localStorage.getItem('articles')) {
    localStorage.setItem('articles', JSON.stringify(defaultArticles));
  }
}

function getArticles() {
  return JSON.parse(localStorage.getItem('articles')) || [];
}

async function loadCategories() {
  try {
    const res = await fetch('js/categories.json');
    const data = await res.json();
    renderNavbar(data.menu);
    renderFooterCategories(data.menu);
  } catch (e) {
    console.error('Không thể tải categories.json:', e);
  }
}

function renderNavbar(menu) {
  const navbar = document.getElementById('navbar');
  navbar.innerHTML = '';

  menu.forEach(item => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#';
    a.innerText = item.title;
    a.onclick = (e) => {
      e.preventDefault();
      filterCategory(item.title);
    };

    if (item.children && item.children.length > 0) {
      const ul = document.createElement('ul');
      ul.className = 'dropdown';
      item.children.forEach(child => {
        const childLi = document.createElement('li');
        const childA = document.createElement('a');
        childA.href = '#';
        childA.innerText = child.title;
        childA.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          filterCategory(child.title);
        };
        childLi.appendChild(childA);
        ul.appendChild(childLi);
      });
      li.appendChild(ul);
    }

    li.appendChild(a);
    navbar.appendChild(li);
  });
}

function renderFooterCategories(menu) {
  const footerCate = document.getElementById('footer-categories');
  if (!footerCate) return;
  footerCate.innerHTML = menu.slice(0, 5).map(m => `<li><a href="#">${m.title}</a></li>`).join('');
}

function filterCategory(categoryName) {
  document.getElementById('detail-view').style.display = 'none';
  document.getElementById('news-view').style.display = 'block';

  const articles = getArticles();
  if (categoryName === 'Trang chủ' || categoryName === 'Mới nhất') {
    renderArticles(articles);
  } else {
    const filtered = articles.filter(a => a.category.toLowerCase().includes(categoryName.toLowerCase()));
    renderArticles(filtered);
  }
}

function renderArticles(list = getArticles()) {
  // Sắp xếp bài viết theo ngày giảm dần (Mới -> Cũ)
  const sorted = [...list].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  const topSection = document.getElementById('top-section');
  const remainingList = document.getElementById('remaining-posts');

  topSection.innerHTML = '';
  remainingList.innerHTML = '';

  if (sorted.length === 0) {
    remainingList.innerHTML = '<p>Chưa có bài viết nào trong chuyên mục này.</p>';
    return;
  }

  // Top section: 1 bài lớn bên trái, 2 bài nhỏ bên phải
  const top3 = sorted.slice(0, 3);
  const remaining = sorted.slice(3);

  if (top3[0]) {
    const featured = document.createElement('div');
    featured.className = 'featured-post';
    featured.onclick = () => showDetail(top3[0].id);
    featured.innerHTML = `
      <img src="${top3[0].image || 'https://via.placeholder.com/600x300'}" alt="${top3[0].title}">
      <div class="info">
        <h2>${top3[0].title}</h2>
        <p>${top3[0].excerpt}</p>
        <span class="post-meta">${top3[0].publishedAt} | ${top3[0].category}</span>
      </div>
    `;
    topSection.appendChild(featured);
  }

  if (top3.length > 1) {
    const sideBox = document.createElement('div');
    sideBox.className = 'side-posts';
    top3.slice(1, 3).forEach(item => {
      const card = document.createElement('div');
      card.className = 'side-post-card';
      card.onclick = () => showDetail(item.id);
      card.innerHTML = `
        <img src="${item.image || 'https://via.placeholder.com/100x75'}" alt="${item.title}">
        <div>
          <h3>${item.title}</h3>
          <span class="post-meta">${item.publishedAt}</span>
        </div>
      `;
      sideBox.appendChild(card);
    });
    topSection.appendChild(sideBox);
  }

  // Render danh sách dọc bài viết còn lại
  remaining.forEach(item => {
    const postEl = document.createElement('div');
    postEl.className = 'post-item';
    postEl.onclick = () => showDetail(item.id);
    postEl.innerHTML = `
      <img src="${item.image || 'https://via.placeholder.com/180x120'}" alt="${item.title}">
      <div class="post-item-content">
        <h3>${item.title}</h3>
        <p>${item.excerpt}</p>
        <div class="post-meta">Tác giả: ${item.author} | ${item.publishedAt} | Chuyên mục: ${item.category}</div>
      </div>
    `;
    remainingList.appendChild(postEl);
  });
}

function showDetail(id) {
  const articles = getArticles();
  const post = articles.find(a => a.id === id);
  if (!post) return;

  document.getElementById('news-view').style.display = 'none';
  const detailView = document.getElementById('detail-view');
  detailView.style.display = 'block';

  detailView.innerHTML = `
    <button onclick="backToHome()" style="margin-bottom:15px; padding: 8px 15px; cursor:pointer;">← Quay lại</button>
    <div class="article-detail">
      <h1>${post.title}</h1>
      <div class="meta-info">
        <span>Chuyên mục: <strong>${post.category}</strong></span> | 
        <span>Đăng ngày: ${post.publishedAt}</span> | 
        <span>Tác giả: <strong>${post.author}</strong></span>
      </div>
      <p class="sapo">${post.excerpt}</p>
      ${post.image ? `<img src="${post.image}" alt="${post.title}">` : ''}
      <div class="content">${post.content}</div>
    </div>
  `;
}

function backToHome() {
  document.getElementById('detail-view').style.display = 'none';
  document.getElementById('news-view').style.display = 'block';
}
