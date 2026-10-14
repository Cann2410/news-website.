
async function loadJSON(path) {
  const response = await fetch(path + "?v=" + Date.now());
  if (!response.ok) throw new Error("Không tải được " + path);
  return response.json();
}

let allPosts = [];

function getSavedPosts() {
  try {
    const data = JSON.parse(localStorage.getItem("newsWebsitePosts") || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function preparePosts(jsonPosts, savedPosts) {
  const result = [];
  const seenUrls = new Set();

  [...jsonPosts, ...savedPosts].forEach((post, index) => {
    if (!post || !post.title) return;

    // Chỉ loại bài trùng URL, không loại chỉ vì trùng ID.
    const url = (post.url || "").trim();

    if (url && seenUrls.has(url)) return;
    if (url) seenUrls.add(url);

    result.push({
      ...post,
      id: String(post.id || "post-" + index)
    });
  });

  // Bảo đảm mỗi bài có ID riêng để mở đúng trang chi tiết.
  const usedIds = new Set();

  result.forEach((post, index) => {
    if (usedIds.has(post.id)) {
      post.id = post.id + "-" + index;
    }
    usedIds.add(post.id);
  });

  return result;
}

function createMenu(items, parent) {
  items.forEach((item) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.textContent = item.title || "Chuyên mục";

    if (item.type === "home") {
      a.href = "index.html";
    } else if (item.type === "external") {
      a.href = item.url || "#";
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    } else {
      a.href = "#";
      a.addEventListener("click", (event) => {
        event.preventDefault();
        renderPosts(item.title || "");
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

function createPostCard(post) {
  const card = document.createElement("article");
  card.className = "post-card";

  const heading = document.createElement("h3");
  const link = document.createElement("a");
  link.textContent = post.title;
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
    category.textContent = "Chuyên mục: " + post.category;
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
    posts = posts.filter((post) =>
      (post.category || "").trim().toLowerCase() ===
      category.trim().toLowerCase()
    );
  }

  posts.sort((a, b) =>
    (Date.parse(b.publishedAt || "") || 0) -
    (Date.parse(a.publishedAt || "") || 0)
  );

  featured.replaceChildren();
  list.replaceChildren();

  const h1 = featured.closest("section")?.querySelector("h2");
  const h2 = list.closest("section")?.querySelector("h2");

  if (h1) h1.textContent = category
    ? "Tin tức: " + category
    : "3 bài viết mới nhất";

  if (h2) h2.textContent = category
    ? "Các bài viết khác: " + category
    : "Tất cả bài viết";

  if (!posts.length) {
    featured.textContent = "Chưa có bài viết phù hợp.";
    return;
  }

  posts.slice(0, 3).forEach((post) => {
    featured.appendChild(createPostCard(post));
  });

  const remaining = posts.slice(3);

  if (remaining.length) {
    remaining.forEach((post) => list.appendChild(createPostCard(post)));
  } else {
    list.textContent = "Không còn bài viết khác.";
  }

  console.log("Tổng số bài:", allPosts.length);
  console.table(allPosts.map((post) => ({
    id: post.id,
    title: post.title,
    date: post.publishedAt
  })));
}

async function initWebsite() {
  try {
    const [menuData, postData] = await Promise.all([
      loadJSON("data/menu.json"),
      loadJSON("data/posts.json")
    ]);

    const jsonPosts = Array.isArray(postData.posts) ? postData.posts : [];
    allPosts = preparePosts(jsonPosts, getSavedPosts());

    const menu = document.getElementById("categoryMenu");
    if (menu) {
      menu.replaceChildren();
      createMenu(menuData.menu || [], menu);
    }

    renderPosts();
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



