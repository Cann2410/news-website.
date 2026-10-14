
async function showArticle() {
  const container = document.getElementById("articleDetail");

  try {
    const response = await fetch("data/posts.json");

    if (!response.ok) {
      throw new Error("Không tải được dữ liệu bài viết.");
    }

    const data = await response.json();
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    const post = (data.posts || []).find(
      (item) => String(item.id) === String(id)
    );

    if (!post) {
      container.textContent = "Không tìm thấy bài viết.";
      return;
    }

    document.title = `${post.title} | TIN TỨC`;
    container.innerHTML = "";

    const category = document.createElement("p");
    category.textContent = `Chuyên mục: ${post.category || "Chưa phân loại"}`;

    const title = document.createElement("h1");
    title.textContent = post.title || "Chưa có tiêu đề";

    const info = document.createElement("p");
    info.className = "post-date";
    info.textContent =
      `Tác giả: ${post.author || "Chưa cập nhật"} | ` +
      `Ngày đăng: ${post.publishedAt || "Chưa cập nhật"}`;

    const content = document.createElement("div");
    content.className = "article-content";
    content.textContent = post.content || post.excerpt || "Chưa có nội dung.";

    container.append(category, title, info, content);
  } catch (error) {
    console.error(error);
    container.textContent = "Có lỗi khi tải bài viết.";
  }
}

showArticle();
