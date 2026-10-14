
async function loadJSON(path) {
  const response = await fetch(path + "?v=" + Date.now());

  if (!response.ok) {
    throw new Error("Không tải được " + path);
  }

  return response.json();
}

let allPosts = [];

function getSavedPosts() {
  try {
    const posts = JSON.parse(
      localStorage.getItem("newsWebsitePosts") || "[]"
    );

    return Array.isArray(posts) ? posts : [];
  } catch {
    return [];
  }
}

function mergePosts(jsonPosts, savedPosts) {
  const map = new Map();

  [...jsonPosts, ...savedPosts].forEach((post, index) => {
    if (!post || !post.title) return;

    const normalized = {
      ...post,
      id: String(post.id || "post-" + index)
    };

    const key = normalized.url || normalized.id;
    map.set(key, normalized);
  });

  return [...map.values()];
}

function sortPosts(posts) {
  return [...posts].sort((a, b) => {
    const dateA = Date.parse(a.publishedAt || "") || 0;
    const dateB = Date.parse(b.publishedAt || "") || 0;
    return dateB - dateA;
  });
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
      const childMenu = document.createElement("ul");
      childMenu.className = "submenu";
      createMenu(item.children, childMenu);
      li.appendChild(childMenu);
    }

    parent.appendChild(li);
  });
}

function createPostCard(post) {
  const card = document.createElement("article");
  card.className = "post-card";

  const heading = document.createElement("h3");
  const link = document.createElement("a");

  link.textContent = post.title || "Chưa có tiêu đề";
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

  let posts = sortPosts(allPosts);

  if (category) {
    posts = posts.filter((post) =>
      (post.category || "").trim().toLowerCase() ===
      category.trim().toLowerCase()
    );
  }

  featured.replaceChildren();
  list.replaceChildren();

  const featuredTitle =
    featured.closest("section")?.querySelector("h2");
  const listTitle =
    list.closest("section")?.querySelector("h2");

  if (featuredTitle) {
    featuredTitle.textContent = category
      ? "Tin tức: " + category
      : "3 bài viết mới nhất";
  }

  if (listTitle) {
    listTitle.textContent = category
      ? "Các bài viết khác: " + category
      : "Tất cả bài viết";
  }

  if (posts.length === 0) {
    featured.textContent = category
      ? 'Chưa có bài viết thuộc chuyên mục "' + category + '".'
      : "Chưa có bài viết trong dữ liệu.";
    return;
  }

  posts.slice(0, 3).forEach((post) => {
    featured.appendChild(createPostCard(post));
  });

  const remaining = posts.slice(3);

  if (remaining.length) {
    remaining.forEach((post) => {
      list.appendChild(createPostCard(post));
    });
  } else {
    list.textContent = "Không còn bài viết khác.";
  }
}

async function initWebsite() {
  try {
    const [menuData, postData] = await Promise.all([
      loadJSON("data/menu.json"),
      loadJSON("data/posts.json")
    ]);

    const jsonPosts = Array.isArray(postData.posts)
      ? postData.posts
      : [];

    allPosts = mergePosts(jsonPosts, getSavedPosts());

    const menu = document.getElementById("categoryMenu");

    if (menu) {
      menu.replaceChildren();
      createMenu(menuData.menu || [], menu);
    }

    renderPosts();

    console.log("Số bài từ JSON:", jsonPosts.length);
    console.log("Số bài đã lưu trên trình duyệt:", getSavedPosts().length);
    console.log("Tổng số bài hiển thị:", allPosts.length);
  } catch (error) {
    console.error(error);

    const featured = document.getElementById("featuredPosts");
    if (featured) {
      featured.textContent =
        "Lỗi tải dữ liệu. Kiểm tra data/menu.json và data/posts.json.";
    }
  }
}

initWebsite();

