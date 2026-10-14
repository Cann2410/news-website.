
async function loadJSON(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Không thể tải dữ liệu: ${path}`);
  }

  return response.json();
}

function createMenu(items, container) {
  items.forEach((item) => {
    const li = document.createElement("li");
    const link = document.createElement("a");

    link.textContent = item.title;
    link.href = item.type === "home" ? "index.html" : item.url;

    if (item.type === "external" || item.type === "category") {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }

    li.appendChild(link);

    if (Array.isArray(item.children) && item.children.length > 0) {
      const childList = document.createElement("ul");
      childList.className = "submenu";
      createMenu(item.children, childList);
      li.appendChild(childList);
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
  titleLink.href = post.url || "#";
  title.appendChild(titleLink);
  article.appendChild(title);

  if (post.publishedAt) {
    const date = document.createElement("p");
    date.className = "post-date";
    date.textContent = post.publishedAt;
    article.appendChild(date);
  }

  if (post.excerpt) {
    const excerpt = document.createElement("p");
    excerpt.textContent = post.excerpt;
    article.appendChild(excerpt);
  }

  return article;
}

async function initWebsite() {
  try {
    const [menuData, postData] = await Promise.all([
      loadJSON("data/menu.json"),
      loadJSON("data/posts.json")
    ]);

    const menu = document.getElementById("categoryMenu");
    const featured = document.getElementById("featuredPosts");
    const postList = document.getElementById("postList");

    if (menu) {
      menu.innerHTML = "";
      createMenu(menuData.menu || [], menu);
    }

    const posts = [...(postData.posts || [])].sort((a, b) => {
      return new Date(b.publishedAt || 0) -
             new Date(a.publishedAt || 0);
    });

    if (featured) {
      featured.innerHTML = "";
      posts.slice(0, 3).forEach((post) => {
        featured.appendChild(createPostCard(post));
      });

      if (posts.length === 0) {
        featured.textContent = "Chưa có bài viết. Hãy bổ sung dữ liệu.";
      }
    }

    if (postList) {
      postList.innerHTML = "";
      posts.slice(3).forEach((post) => {
        postList.appendChild(createPostCard(post));
      });

      if (posts.length <= 3) {
        postList.textContent = "Chưa có thêm bài viết.";
      }
    }
  } catch (error) {
    console.error(error);

    const featured = document.getElementById("featuredPosts");
    if (featured) {
      featured.textContent =
        "Không tải được dữ liệu. Hãy kiểm tra các file JSON.";
    }
  }
}

initWebsite();
