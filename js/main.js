
async function loadJSON(path) {
  const response = await fetch(path + "?v=" + Date.now());

  if (!response.ok) {
    throw new Error("Không tải được " + path);
  }

  return response.json();
}

let allPosts = [];
let allMenu = [];

const STORAGE_KEY = "newsWebsitePosts";

function getSavedPosts() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFC")
    .trim()
    .toLocaleLowerCase("vi");
}

function slugify(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function preparePosts(jsonPosts, savedPosts) {
  const result = [];
  const seen = new Set();

  [...jsonPosts, ...savedPosts].forEach((post, index) => {
    if (!post || !post.title) return;

    const url = String(post.url || "").trim();
    const id = String(post.id || "post-" + index);

    const key = url && url !== "#"
      ? "url:" + url
      : "id:" + id;

    if (seen.has(key)) return;
    seen.add(key);

    result.push({
      ...post,
      id,
      slug: post.slug || slugify(post.title),
      category: post.category || "",
      publishedAt: post.publishedAt || "",
      excerpt: post.excerpt || "",
      content: post.content || "",
      author: post.author || "",
      source: post.source || "",
      url: url || "#"
    });
  });

  return result;
}

/* Tìm chuyên mục trong menu, bao gồm cả menu con */
function findCategory(items, slug) {
  if (!slug) return "";

  const wanted = normalizeText(slug);

  for (const item of items || []) {
    const title = item.title || item.label || "";
    const itemId = String(item.id || "");

    if (
      normalizeText(title) === wanted ||
      slugify(title) === slugify(slug) ||
      normalizeText(itemId) === wanted
    ) {
      return title;
    }

    if (Array.isArray(item.children)) {
      const found = findCategory(item.children, slug);

      if (found) return found;
    }
  }

  return "";
}

/* Chuẩn hóa tên chuyên mục trong bài viết */
function getPostCategories(post) {
  const value = post.category;

  if (Array.isArray(value)) {
    return value.map((item) => normalizeText(item));
  }

  return String(value || "")
    .split(/[;,|]/)
    .map((item) => normalizeText(item))
    .filter(Boolean);
}

/* Kiểm tra bài viết có thuộc chuyên mục được chọn không */
function matchesCategory(post, category) {
  if (!category) return true;

  const wantedName = normalizeText(category);
  const wantedSlug = slugify(category);
  const categories = getPostCategories(post);

  return categories.some((name) => {
    return name === wantedName || slugify(name) === wantedSlug;
  });
}

/* Cập nhật URL khi chọn chuyên mục */
function showCategory(category) {
  const url = new URL(window.location.href);

  if (category) {
    url.searchParams.set("category", slugify(category));
  } else {
    url.searchParams.delete("category");
  }

  history.pushState({ category }, "", url);
  renderPosts(category);
}

/* Tạo menu và menu con */
function createMenu(items, parent) {
  (items || []).forEach((item) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    const title = item.title || item.label || "Chuyên mục";

    a.textContent = title;

    if (item.type === "home" || item.id === "home") {
      a.href = "index.html";

      a.addEventListener("click", (event) => {
        event.preventDefault();
        showCategory("");
      });
    } else if (item.type === "external") {
      /* Mục external tiếp tục mở website bên ngoài */
      a.href = item.url || "#";
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    } else {
      /* Các mục còn lại lọc bài trên website này */
      a.href = "index.html?category=" + encodeURIComponent(slugify(title));

      a.addEventListener("click", (event) => {
        event.preventDefault();
        showCategory(title);
      });
    }

    li.appendChild(a);

    if (Array.isArray(item.children) && item.children.length > 0) {
      const submenu = document.createElement("ul");
      submenu.className = "submenu";
      createMenu(item.children, submenu);
      li.appendChild(submenu);
    }

    parent.appendChild(li);
  });
}

/* Định dạng ngày đăng */
function formatDate(value) {
  if (!value) return "Chưa có ngày đăng";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

/* Tạo thẻ bài viết */
function createPostCard(post, featured = false) {
  const card = document.createElement("article");

  card.className = featured
    ? "post-card featured-card"
    : "post-card";

  const heading = document.createElement("h3");
  const link = document.createElement("a");

  link.textContent = post.title || "Bài viết chưa có tiêu đề";
  link.href = "detail.html?id=" + encodeURIComponent(post.id);

  heading.appendChild(link);
  card.appendChild(heading);

  const date = document.createElement("p");
  date.className = "post-date";
  date.textContent = "Ngày đăng: " + formatDate(post.publishedAt);
  card.appendChild(date);

  const category = document.createElement("p");
  category.className = "post-category";

  const categoryText = Array.isArray(post.category)
    ? post.category.join(", ")
    : (post.category || "Chưa phân loại");

  category.textContent = "Chuyên mục: " + categoryText;
  card.appendChild(category);

  if (post.excerpt) {
    const excerpt = document.createElement("p");
    excerpt.className = "post-excerpt";
    excerpt.textContent = post.excerpt;
    card.appendChild(excerpt);
  }

  return card;
}

/* Cập nhật tiêu đề của hai khu vực bài viết */
function updateSectionHeadings(category) {
  const featured = document.getElementById("featuredPosts");
  const list = document.getElementById("postList");

  const featuredHeading =
    featured?.closest("section")?.querySelector("h2");

  const listHeading =
    list?.closest("section")?.querySelector("h2");

  if (featuredHeading) {
    featuredHeading.textContent = category
      ? "Tin tức: " + category
      : "3 bài viết mới nhất";
  }

  if (listHeading) {
    listHeading.textContent = category
      ? "Các bài viết khác: " + category
      : "Tất cả bài viết";
  }
}

/* Hiển thị danh sách bài viết */
function renderPosts(category = "") {
  const featured = document.getElementById("featuredPosts");
  const list = document.getElementById("postList");

  if (!featured || !list) return;

  const posts = allPosts
    .filter((post) => matchesCategory(post, category))
    .sort((a, b) => {
      const dateA = Date.parse(a.publishedAt || "") || 0;
      const dateB = Date.parse(b.publishedAt || "") || 0;
      return dateB - dateA;
    });

  featured.replaceChildren();
  list.replaceChildren();

  updateSectionHeadings(category);

  const listSection = list.closest("section");

  if (posts.length === 0) {
    featured.appendChild(
      Object.assign(document.createElement("p"), {
        className: "empty-message",
        textContent: category
          ? 'Chưa có bài viết thuộc chuyên mục "' + category +
            '". Hãy bổ sung bài viết có trường category tương ứng trong data/posts.json.'
          : "Chưa có bài viết. Hãy kiểm tra dữ liệu trong data/posts.json."
      })
    );

    if (listSection) listSection.hidden = true;
    return;
  }

  if (listSection) listSection.hidden = false;

  /* Ba bài mới nhất: 1 bài lớn bên trái, 2 bài nhỏ bên phải */
  posts.slice(0, 3).forEach((post, index) => {
    featured.appendChild(createPostCard(post, index === 0));
  });

  const remainingPosts = posts.slice(3);

  if (remainingPosts.length > 0) {
    remainingPosts.forEach((post) => {
      list.appendChild(createPostCard(post));
    });
  } else {
    const message = document.createElement("p");
    message.className = "empty-message";
    message.textContent = "Không còn bài viết khác.";
    list.appendChild(message);
  }
}

/* Khởi động website */
async function initWebsite() {
  try {
    const [menuData, postData] = await Promise.all([
      loadJSON("data/menu.json"),
      loadJSON("data/posts.json")
    ]);

    allMenu = Array.isArray(menuData.menu) ? menuData.menu : [];

    const jsonPosts = Array.isArray(postData.posts)
      ? postData.posts
      : [];

    allPosts = preparePosts(jsonPosts, getSavedPosts());

    const menu = document.getElementById("categoryMenu");

    if (menu) {
      menu.replaceChildren();
      createMenu(allMenu, menu);
    }

    const params = new URLSearchParams(window.location.search);
    const categorySlug = params.get("category") || "";

    const category = categorySlug
      ? findCategory(allMenu, categorySlug) || categorySlug
      : "";

    renderPosts(category);

    console.log("Tổng số bài viết:", allPosts.length);

  } catch (error) {
    console.error("Lỗi tải dữ liệu website:", error);

    const featured = document.getElementById("featuredPosts");

    if (featured) {
      featured.textContent =
        "Không tải được dữ liệu. Hãy kiểm tra data/posts.json và data/menu.json.";
    }
  }
}

/* Hỗ trợ nút Back/Forward của trình duyệt */
window.addEventListener("popstate", () => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("category") || "";
  const category = slug ? findCategory(allMenu, slug) || slug : "";

  renderPosts(category);
});

initWebsite();
