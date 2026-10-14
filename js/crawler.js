
const form = document.getElementById("crawlerForm");
const preview = document.getElementById("jsonPreview");
const statusBox = document.getElementById("crawlerStatus");

let currentArticle = null;

function makeSlug(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const url = document.getElementById("articleUrl").value.trim();

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.protocol !== "https:" &&
        parsedUrl.protocol !== "http:") {
      throw new Error("URL không hợp lệ.");
    }
  } catch {
    statusBox.textContent = "Vui lòng nhập URL bài báo hợp lệ.";
    return;
  }

  const title = document.getElementById("articleTitle").value.trim();

  currentArticle = {
    id: `post-${Date.now()}`,
    title,
    slug: makeSlug(title),
    excerpt: document.getElementById("articleExcerpt").value.trim(),
    content: document.getElementById("articleContent").value.trim(),
    author: document.getElementById("articleAuthor").value.trim(),
    category: document.getElementById("articleCategory").value.trim(),
    publishedAt: document.getElementById("articleDate").value,
    source: new URL(url).hostname,
    url
  };

  preview.value = JSON.stringify(currentArticle, null, 2);
  statusBox.textContent =
    "Đã tạo JSON từ thông tin mày nhập. Dữ liệu chưa được tự động cào từ URL.";
});

document.getElementById("saveArticle").addEventListener("click", () => {
  if (!currentArticle) {
    statusBox.textContent = "Hãy tạo dữ liệu JSON trước.";
    return;
  }

  const key = "newsWebsitePosts";
  const saved = JSON.parse(localStorage.getItem(key) || "[]");

  const exists = saved.some((post) => post.url === currentArticle.url);

  if (exists) {
    statusBox.textContent = "Bài viết này đã được lưu trong trình duyệt.";
    return;
  }

  saved.push(currentArticle);
  localStorage.setItem(key, JSON.stringify(saved));

  statusBox.textContent =
    "Đã lưu bài viết trong LocalStorage của trình duyệt hiện tại.";
});

document.getElementById("downloadJson").addEventListener("click", () => {
  if (!currentArticle) {
    statusBox.textContent = "Hãy tạo dữ liệu JSON trước khi tải.";
    return;
  }

  const blob = new Blob(
    [JSON.stringify(currentArticle, null, 2)],
    { type: "application/json;charset=utf-8" }
  );

  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = downloadUrl;
  link.download = `${currentArticle.slug || "article"}.json`;
  link.click();

  URL.revokeObjectURL(downloadUrl);
});
