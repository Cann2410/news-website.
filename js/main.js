
async function loadJSON(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Không thể tải dữ liệu: ${path}`);
  }

  return response.json();
}

let allPosts = [];

function createMenu(items, container) {
  items.forEach((item) => {
    const li = document.createElement("li");
    const link = document.createElement("a");

    link.textContent = item.title;

    if (item.type === "home") {
      link.href = "index.html";
    } else {
      link.href = "#";
      link.addEventListener("click", (event) => {
        event.preventDefault();

        if (item.type === "category") {
          renderPosts(item.title);
        } else if (item.title.toLowerCase().includes("mới nhất")) {
          renderPosts("");
        } else {
          window.open(
            item.url,
            "_blank",
            "noopener,noreferrer"
          );
        }
      });
    }

    li.appendChild(link);

    if (Array.isArray(item.children) && item.children.length) {
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
  titleLink.href = post.url && post.url !== "#" ? post.url : "#";

  if (titleLink.href !== "#" && post.url) {
    titleLink.target = "_blank";
    titleLink.rel = "noopener noreferrer";
  }

  title.appendChild(titleLink);
  article.appendChild(title);

  if (post.publishedAt) {
    const date = document.createElement("p");
    date.className = "post-date";
    date.textContent = `Ngày đăng: ${post.publishedAt}`;
    article.appendChild(date);
  }

  if (post.category) {
    const category = document.createElement("p");
    category.textContent = `Chuyên mục: ${post.category}`;
    article.appendChild(category);
  }

  if (post.excerpt) {
    const excerpt = document.createElement("p");
    excerpt.textContent = post.excerpt;
    article.appendChild(excerpt);
  }

  return article;
}

function renderPosts(category = "") {
  const featured = document.getElementById("featuredPosts");
  const postList = document.getElementById("postList");
  const heading = document.querySelector("main section h2");

  let posts = [...allPosts];

  if (category) {
    posts = posts.filter((post) =>
      (post.category || "").toLowerCase() === category.toLowerCase()
    );
  }

  posts.sort((a, b) =>
    new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0)
  );

  if (heading) {
    heading.textContent = category
      ? `Tin tức: ${category}`
      : "3 bài viết mới nhất";
  }

  featured.innerHTML = "";
  postList.innerHTML = "";

  if (posts.length === 0) {
    featured.textContent = "Chưa có bài viết trong chuyên mục này.";
    return;
  }

  posts.slice(0, 3).forEach((post) => {
    featured.appendChild(createPostCard(post));
  });

  if (posts.length > 3) {
    posts.slice(3).forEach((post) => {
      postList.appendChild(createPostCard(post));
    });
  } else {
    postList.textContent = "Không còn bài viết khác.";
  }
}

async function initWebsite() {
  try {
    const [menuData, postData] = await Promise.all([
      loadJSON("data/menu.json"),
      loadJSON("data/posts.json")
    ]);

    allPosts = postData.posts || [];

    const menu = document.getElementById("categoryMenu");

    if (menu) {
      menu.innerHTML = "";
      createMenu(menuData.menu || [], menu);
    }

    renderPosts();
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

