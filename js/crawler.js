/**
 * Trích xuất ID bài viết từ URL Dân trí
 */
function extractPostId(url) {
  const match = url.match(/-(\d+)\.htm/);
  return match ? `dtri-${match[1]}` : `dtri-${Date.now()}`;
}

/**
 * Trích xuất Slug từ URL
 */
function extractSlug(url) {
  const parts = url.split('/');
  const fileName = parts[parts.length - 1];
  return fileName.replace(/-\d+\.htm$/, '');
}

/**
 * Hàm Crawler bóc tách dữ liệu từ URL bài viết Dân trí
 * @param {string} articleUrl 
 * @returns {Promise<Object>} Object bài viết đã chuẩn hóa
 */
async function crawlDantriArticle(articleUrl) {
  try {
    // Sử dụng CORS Proxy để vượt qua rào cản Cross-Origin của trình duyệt
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(articleUrl)}`;
    const response = await fetch(proxyUrl);
    
    if (!response.ok) throw new Error('Không thể tải trang web.');
    
    const data = await response.json();
    const parser = new DOMParser();
    const doc = parser.parseFromString(data.contents, 'text/html');

    // Trích xuất các trường thông tin theo cấu trúc HTML của Dân trí
    const title = doc.querySelector('.title-page, .detail-title, h1.title')?.innerText.trim() || '';
    const excerpt = doc.querySelector('.singular-sapo, .detail-sapo, h2.sapo')?.innerText.trim() || '';
    
    // Lấy nội dung văn bản chính
    const contentBody = doc.querySelector('.singular-content, .detail-content');
    let content = '';
    let image = '';

    if (contentBody) {
      // Loại bỏ các thành phần quảng cáo/bài liên quan
      contentBody.querySelectorAll('.related-news, .ads, script').forEach(el => el.remove());
      content = Array.from(contentBody.querySelectorAll('p'))
                     .map(p => p.innerText.trim())
                     .filter(text => text.length > 0)
                     .join('\n\n');
      
      const imgEl = contentBody.querySelector('img');
      if (imgEl) image = imgEl.getAttribute('src') || imgEl.getAttribute('data-src') || '';
    }

    const author = doc.querySelector('.author-name, .author-info, .author')?.innerText.trim() || 'Tổng hợp';
    const publishedAt = doc.querySelector('.author-time, .detail-time, .time')?.innerText.trim() || new Date().toISOString();
    const category = doc.querySelector('.breadcrumbs li:nth-child(2) a, .cate-name')?.innerText.trim() || 'Tin tức';

    const postData = {
      id: extractPostId(articleUrl),
      title: title,
      slug: extractSlug(articleUrl),
      excerpt: excerpt,
      content: content,
      image: image,
      author: author,
      category: category,
      publishedAt: publishedAt,
      source: 'dantri.com.vn',
      url: articleUrl
    };

    return postData;
  } catch (error) {
    console.error('Lỗi khi cào dữ liệu:', error);
    throw error;
  }
}
