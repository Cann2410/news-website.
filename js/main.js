
async function loadJSON(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Không thể tải dữ liệu: ${path}`);
  }

  return response.json();
}

let allPosts = [];

function getSavedPosts() {
  try {
    const data = JSON.parse(
      localStorage.getItem("newsWebsitePosts") || "[]"
    );

    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Không đọc được LocalStorage:", error);
    return [];
  }
}

function mergePosts(jsonPosts, savedPosts) {
  const postsMap = new Map();

  [...jsonPosts, ...savedPosts].forEach((post) => {
    if (!post || !post.id || !post.title) return;

    const key = post.url || String(post.id);
    postsMap.set(key, post);
  });

  return Array.from(postsMap.values());
}

function sortPosts(posts) {
  return [...posts].sort((a, b) => {
    const dateA = Date.parse(a.publishedAt || "") || 0;
    const dateB = Date.parse(b.publishedAt || "") || 0;

    return dateB - dateA;
  });
}

function createMenu(items, container) {
  items.forEach((item) => {
    const li = document.createElement("li");
    const link = document.createElement("a");

    link.textContent = item.title || "Chưa đặt tên";

    if (item.type === "home") {
      link.href = "index.html";
    } else if (item.type === "external") {
      link.href = item.url || "#";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    } else {
      link.href = "#";

      link.addEventListener("click", (event) => {
        event.preventDefault();
        renderPosts(item.title || "");
      });
    }

    li.appendChild(link);

    if (Array.isArray(item.children) && item.children.length > 0) {
      const submenu = document.createElement("ul");
      submenu.className = "submenu";

      createMenu(item.children, submenu);
      li.appendChild(submenu);
    }

    container.appendChild(li);
  });
}

function createPostCard(post) {
  const article = document.createElement("article");
  article.className = "post-card";

  const title = document.createElement("h3");
  const titleLink = document.createElement("a");

  titleLink.textContent = post.title || "Chưa có tiêu đề";
  titleLink.href =
    "detail.html?id=" + encodeURIComponent(String(post.id));

  title.appendChild(titleLink);
  article.appendChild(title);

  if (post.publishedAt) {
    const date = document.createElement("p");
    date.className = "post-date";
    date.textContent = "Ngày đăng: " + post.publishedAt;
    article.appendChild(date);
  }

  if (post.category) {
    const category = document.createElement("p");
    category.className = "post-category";
    category.textContent = "Chuyên mục: " + post.category;
    article.appendChild(category);
  }

  if (post.excerpt) {
    const excerpt = document.createElement("p");
    excerpt.className = "post-excerpt";
    excerpt.textContent = post.excerpt;
    article.appendChild(excerpt);
  }

  return article;
}

function renderPosts(category = "") {
  const featured = document.getElementById("featuredPosts");
  const postList = document.getElementById("postList");

  if (!featured || !postList) return;

  let posts = sortPosts(allPosts);

  if (category) {
    posts = posts.filter((post) => {
      return (
        (post.category || "").trim().toLowerCase() ===
        category.trim().toLowerCase()
      );
    });
  }

  featured.replaceChildren();
  postList.replaceChildren();

  const featuredSection = featured.closest("section");
  const listSection = postList.closest("section");

  const featuredHeading = featuredSection?.querySelector("h2");
  const listHeading = listSection?.querySelector("h2");

  if (featuredHeading) {
    featuredHeading.textContent = category
      ? `Tin tức: ${category}`
      : "3 bài viết mới nhất";
  }

  if (listHeading) {
    listHeading.textContent = category
      ? `Các bài viết khác: ${category}`
      : "Tất cả bài viết";
  }

  if (posts.length === 0) {
    featured.textContent = category
      ? `Chưa có bài viết thuộc chuyên mục "${category}".`
      : "Chưa có bài viết. Hãy bổ sung dữ liệu bài báo.";

    postList.textContent = "";
    return;
  }

  const featuredPosts = posts.slice(0, 3);
  const remainingPosts = posts.slice(3);

  featuredPosts.forEach((post) => {
    featured.appendChild(createPostCard(post));
  });

  if (remainingPosts.length > 0) {
    remainingPosts.forEach((post) => {
      postList.appendChild(createPostCard(post));
    });
  } else {
    postList.textContent = "Không còn bài viết khác.";
  }
}

async function initWebsite() {
  const featured = document.getElementById("featuredPosts");

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
  } catch (error) {
    console.error("Lỗi khởi tạo website:", error);

    if (featured) {
      featured.textContent =
        "Không tải được dữ liệu. Hãy kiểm tra data/menu.json và data/posts.json.";
    }
  }
}

initWebsite();
