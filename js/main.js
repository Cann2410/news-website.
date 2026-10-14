
async function loadJSON(path) {
  const response = await fetch(path + "?v=" + Date.now());
  if (!response.ok) throw new Error("Không tải được " + path);
  return response.json();
}

let allPosts = [];
let allMenu = [];

function getSavedPosts() {
  try {
    const data = JSON.parse(
      localStorage.getItem("newsWebsitePosts") || "[]"
    );
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function preparePosts(jsonPosts, savedPosts) {
  const result = [];
  const seen = new Set();

  [...jsonPosts, ...savedPosts].forEach((post, index) => {
    if (!post || !post.title) return;

    const url = (post.url || "").trim();
    const id = String(post.id || "post-" + index);
    const key = url && url !== "#"
      ? "url:" + url
      : "id:" + id;

    if (seen.has(key)) return;
    seen.add(key);

    result.push({ ...post, id });
  });

  return result;
}

function slugify(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function findCategory(items, slug) {
  for (const item of items) {
    if (slugify(item.title) === slug || item.id === slug) {
      return item.title;
    }

    if (Array.isArray(item.children)) {
      const found = findCategory(item.children, slug);
      if (found) return found;
    }
  }

  return "";
}

function showCategory(category) {
  const url = new URL(window.location.href);

  if (category) {
    url.searchParams.set("category", slugify(category));
  } else {
    url.searchParams.delete("category");
  }

  history.pushState({}, "", url);
  renderPosts(category);
}

function createMenu(items, parent) {
  items.forEach((item) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.textContent = item.title || "Chuyên mục";

    if (item.type === "home" || item.id === "home") {
      a.href = "index.html";
      a.addEventListener("click", (event) => {
        event.preventDefault();
        showCategory("");
      });
    } else {
      // Mặc định các mục menu đều lọc bài trên website nội bộ.
      a.href = "index.html?category=" + encodeURIComponent(
        slugify(item.title || "")
      );

      a.addEventListener("click", (event) => {
        event.preventDefault();
        showCategory(item.title || "");
      });
    }

    li.appendChild(a);

    if (Array.isArray(item.children) && item.children.length) {
      const submenu = document.createElement("ul");
      submenu.className = "submenu";
      createMenu(item.children, submenu);
      li.appendChild(submenu);
    }

    parent.appendChild(li);
  });
}

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

  if (post.publishedAt) {
    const date = document.createElement("p");
    date.className = "post-date";
    date.textContent = "Ngày đăng: " + post.publishedAt;
    card.appendChild(date);
  }

  if (post.category) {
    const category = document.createElement("p");
    category.className = "post-category";
    category.textContent = "Chuyên mục: " + (
      Array.isArray(post.category)
        ? post.category.join(", ")
        : post.category
    );
    card.appendChild(category);
  }

  if (post.excerpt) {
    const excerpt = document.createElement("p");
    excerpt.className = "post-excerpt";
    excerpt.textContent = post.excerpt;
    card.appendChild(excerpt);
  }

  return card;
}

function renderPosts(category = "") {
  const featured = document.getElementById("featuredPosts");
  const list = document.getElementById("postList");

  if (!featured || !list) return;

  let posts = [...allPosts];

  if (category) {
    posts = posts.filter((post) => {
      const categories = Array.isArray(post.category)
        ? post.category
        : [post.category || ""];

      return categories.some(
        (name) => name.trim().toLowerCase() ===
          category.trim().toLowerCase()
      );
    });
  }

  posts.sort((a, b) =>
    (Date.parse(b.publishedAt || "") || 0) -
    (Date.parse(a.publishedAt || "") || 0)
  );

  featured.replaceChildren();
  list.replaceChildren();

  const featuredHeading =
    featured.closest("section")?.querySelector("h2");
  const listHeading =
    list.closest("section")?.querySelector("h2");

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

  if (!posts.length) {
    featured.textContent = "Chưa có bài viết thuộc chuyên mục này.";
    list.textContent = "";
    return;
  }

  const topThree = posts.slice(0, 3);

  topThree.forEach((post, index) => {
    featured.appendChild(createPostCard(post, index === 0));
  });

  posts.slice(3).forEach((post) => {
    list.appendChild(createPostCard(post));
  });

  if (posts.length <= 3) {
    list.textContent = "Không còn bài viết khác.";
  }
}

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

    window.addEventListener("popstate", () => {
      const currentSlug =
        new URLSearchParams(window.location.search).get("category") || "";

      const currentCategory = currentSlug
        ? findCategory(allMenu, currentSlug) || currentSlug
        : "";

      renderPosts(currentCategory);
    });

    console.log("Tổng số bài viết:", allPosts.length);
  } catch (error) {
    console.error(error);

    const featured = document.getElementById("featuredPosts");

    if (featured) {
      featured.textContent =
        "Không tải được dữ liệu. Kiểm tra data/posts.json và data/menu.json.";
    }
  }
}

initWebsite();
