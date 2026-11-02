/**
 * Gamza (감자) - Screen 2: Detail Popup Modal Component Script
 * File: components/screen2_detail.js
 * 
 * Provides:
 * - window.GamzaScreen2.openDetailModal(productOrId)
 * - window.GamzaScreen2.closeDetailModal()
 * - window.GamzaScreen2.initScreen2()
 * - window.GamzaScreen2.toggleLike(productId)
 * - window.GamzaScreen2.showToast(message, icon)
 */

(function () {
  'use strict';

  // State store for liked products (stores product IDs)
  const likedProductsState = new Set();
  
  // Currently displayed product data
  let currentProduct = null;

  // Cached DOM elements
  let elements = {
    modal: null,
    dialog: null,
    closeBtn: null,
    image: null,
    badgeStatus: null,
    badgeCategory: null,
    title: null,
    metaLocation: null,
    metaTime: null,
    price: null,
    description: null,
    sellerAvatar: null,
    sellerName: null,
    sellerLocation: null,
    potatoDegree: null,
    potatoGaugeFill: null,
    potatoRemark: null,
    btnLike: null,
    btnLikeCount: null,
    btnChatCta: null,
    toastContainer: null,
    ownerStatusBox: null,
    ownerStatusBtns: [],
    buyerActionGroup: null,
    ownerActionGroup: null,
    btnEditPost: null,
    btnDeletePost: null
  };

  /**
   * Helper: Format number to Korean Won currency string (e.g. 1,050,000원)
   */
  function formatKoreanPrice(price) {
    if (price === 0 || price === "0") {
      return "무료 나눔 🎁";
    }
    const num = Number(price);
    if (isNaN(num)) return price || "가격 미정";
    return num.toLocaleString('ko-KR') + '원';
  }

  /**
   * Helper: Parse potato temperature string to float (e.g. "42.5℃" -> 42.5)
   */
  function parseTemperature(tempStr) {
    if (!tempStr) return 36.5;
    const match = String(tempStr).match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 36.5;
  }

  /**
   * Helper: Calculate gauge fill width (percentage) and friendly remark
   */
  function getPotatoTempInfo(tempValue) {
    // Baseline 30℃ to 70℃ mapped to 15% - 100%
    const minTemp = 25;
    const maxTemp = 70;
    const percentage = Math.min(Math.max(((tempValue - minTemp) / (maxTemp - minTemp)) * 100, 12), 100);

    let remark = "훈훈하고 따뜻한 감자";
    if (tempValue >= 60) {
      remark = "갓 쪄낸 포슬포슬 최상급 황금감자! ♨️";
    } else if (tempValue >= 45) {
      remark = "믿음직하고 매우 따뜻한 감자! 🥔";
    } else if (tempValue >= 36.5) {
      remark = "친절하고 훈훈한 기본 감자 🌱";
    } else {
      remark = "조금 서늘하지만 맛있는 감자 ❄️";
    }

    return {
      percentage: `${Math.round(percentage)}%`,
      remark
    };
  }

  /**
   * Helper: Generate Fallback SVG Image Data URI
   */
  function getFallbackImage(text = "감자 마켓") {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
        <rect width="600" height="400" fill="#ede0d4"/>
        <text x="50%" y="46%" font-size="48" text-anchor="middle" dominant-baseline="central" fill="#9c6644">🥔</text>
        <text x="50%" y="60%" font-size="18" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="600" text-anchor="middle" dominant-baseline="central" fill="#7f5539">${text}</text>
      </svg>
    `;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  /**
   * Inject default Modal Markup into DOM if not already present
   */
  function ensureModalInDOM() {
    let modal = document.getElementById('gamza-detail-modal');
    if (!modal) {
      const modalWrapper = document.createElement('div');
      modalWrapper.innerHTML = `
        <div id="gamza-detail-modal" class="gamza-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="gamza-modal-title">
          <div class="gamza-modal-dialog">
            <div class="gamza-modal-sheet-handle" aria-hidden="true"></div>
            
            <!-- Close Button (X) -->
            <button type="button" class="gamza-modal-close-btn" id="gamza-modal-close-btn" aria-label="상세 팝업 닫기" title="닫기 (ESC)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <!-- Scrollable Content Body -->
            <div class="gamza-modal-scrollable">
              <!-- Top: Product Large Image Box -->
              <div class="gamza-detail-image-box">
                <img id="gamza-detail-img" src="" alt="상품 이미지" loading="eager" />
                <div class="gamza-detail-image-overlay"></div>
              </div>

              <!-- Main Detail Content (Strict Order) -->
              <div class="gamza-detail-info-wrap">
                <!-- 1) Status Badge & 2) Category Tag -->
                <div class="gamza-detail-tag-row">
                  <span id="gamza-badge-status" class="gamza-badge-status status-selling">판매중</span>
                  <span id="gamza-badge-category" class="gamza-badge-category">디지털기기</span>
                </div>

                <!-- 3) Product Title -->
                <h2 id="gamza-modal-title" class="gamza-detail-title">상품 제목</h2>

                <!-- 4) Location and Upload Time -->
                <div class="gamza-detail-meta">
                  <span id="gamza-meta-location" class="gamza-detail-meta-location">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span id="gamza-meta-location-text">위치 정보</span>
                  </span>
                  <span class="gamza-detail-meta-dot">·</span>
                  <span id="gamza-meta-time">시간 정보</span>
                </div>

                <!-- 5) Price -->
                <div class="gamza-detail-price-box">
                  <span id="gamza-detail-price" class="gamza-detail-price">0원</span>
                </div>

                <!-- 작성자 전용 판매 상태 선택 바 (요구사항 1) -->
                <div id="gamza-owner-status-box" class="gamza-owner-status-box hidden">
                  <div class="owner-status-header">
                    <span class="owner-status-label">🥔 내 게시글 판매 상태 설정</span>
                    <span class="owner-status-guide">클릭 시 즉시 상태가 저장됩니다</span>
                  </div>
                  <div class="owner-status-btn-group" role="group" aria-label="판매 상태 선택">
                    <button type="button" class="btn-owner-status" data-status="판매중">
                      <span class="status-dot dot-sale"></span> 판매중
                    </button>
                    <button type="button" class="btn-owner-status" data-status="예약중">
                      <span class="status-dot dot-reserved"></span> 예약중
                    </button>
                    <button type="button" class="btn-owner-status" data-status="거래 완료">
                      <span class="status-dot dot-sold"></span> 거래 완료
                    </button>
                  </div>
                </div>

                <div class="gamza-detail-divider" aria-hidden="true"></div>

                <!-- 6) Product Description -->
                <div id="gamza-detail-description" class="gamza-detail-description">
                  상품 설명 텍스트
                </div>

                <!-- 4. Seller Information & Potato Temperature Card -->
                <div class="gamza-seller-card">
                  <div class="gamza-seller-header">
                    <div class="gamza-seller-profile-group">
                      <div class="gamza-seller-avatar-wrap">
                        <img id="gamza-seller-avatar" src="" alt="판매자 프로필" />
                      </div>
                      <div class="gamza-seller-info-text">
                        <span id="gamza-seller-name" class="gamza-seller-name">판매자명</span>
                        <span id="gamza-seller-location" class="gamza-seller-location">동네 정보</span>
                      </div>
                    </div>

                    <!-- Gamza Potato Temp Gauge -->
                    <div class="gamza-potato-temp-box">
                      <div class="gamza-temp-value-row">
                        <span class="gamza-temp-label">포슬 지수</span>
                        <span id="gamza-potato-degree" class="gamza-temp-degree">36.5℃</span>
                        <span class="gamza-temp-potato-icon" aria-hidden="true">🥔</span>
                      </div>
                      <div class="gamza-temp-gauge-track" title="감자 온도 게이지">
                        <div id="gamza-potato-gauge-fill" class="gamza-temp-gauge-fill"></div>
                      </div>
                      <div id="gamza-potato-remark" class="gamza-temp-remark">훈훈하고 따뜻한 감자</div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <!-- 5. Fixed Bottom Action Bar -->
            <div class="gamza-modal-action-bar">
              <!-- 1) 일반 방문자용 그룹 -->
              <div id="gamza-buyer-action-group" class="gamza-buyer-action-group">
                <!-- Interest / Like Button -->
                <button type="button" id="gamza-btn-like" class="gamza-btn-like" aria-label="관심 상품에 추가">
                  <svg class="gamza-btn-like-icon" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                  <span id="gamza-btn-like-count" class="gamza-btn-like-count">0</span>
                </button>

                <!-- Chat CTA Button -->
                <button type="button" id="gamza-btn-chat-cta" class="gamza-btn-chat-cta">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  <span>채팅 시작하기</span>
                </button>
              </div>

              <!-- 2) 작성자 전용 수정 / 삭제 그룹 (요구사항 1) -->
              <div id="gamza-owner-action-group" class="gamza-owner-action-group hidden">
                <button type="button" id="gamza-btn-delete-post" class="gamza-btn-owner-delete" title="게시글 삭제">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                  <span>삭제</span>
                </button>
                <button type="button" id="gamza-btn-edit-post" class="gamza-btn-owner-edit" title="게시글 수정">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  <span>수정하기</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      `;
      document.body.appendChild(modalWrapper.firstElementChild);
    }

    // Ensure Toast Container
    let toastContainer = document.getElementById('gamza-toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'gamza-toast-container';
      toastContainer.className = 'gamza-toast-container';
      document.body.appendChild(toastContainer);
    }
  }

  /**
   * Cache elements to avoid repetitive querySelector calls
   */
  function bindElements() {
    elements.modal = document.getElementById('gamza-detail-modal');
    if (!elements.modal) return false;

    elements.dialog = elements.modal.querySelector('.gamza-modal-dialog');
    elements.closeBtn = document.getElementById('gamza-modal-close-btn');
    elements.image = document.getElementById('gamza-detail-img');
    elements.badgeStatus = document.getElementById('gamza-badge-status');
    elements.badgeCategory = document.getElementById('gamza-badge-category');
    elements.title = document.getElementById('gamza-modal-title');
    elements.metaLocation = document.getElementById('gamza-meta-location-text');
    elements.metaTime = document.getElementById('gamza-meta-time');
    elements.price = document.getElementById('gamza-detail-price');
    elements.description = document.getElementById('gamza-detail-description');
    elements.sellerAvatar = document.getElementById('gamza-seller-avatar');
    elements.sellerName = document.getElementById('gamza-seller-name');
    elements.sellerLocation = document.getElementById('gamza-seller-location');
    elements.potatoDegree = document.getElementById('gamza-potato-degree');
    elements.potatoGaugeFill = document.getElementById('gamza-potato-gauge-fill');
    elements.potatoRemark = document.getElementById('gamza-potato-remark');
    elements.btnLike = document.getElementById('gamza-btn-like');
    elements.btnLikeCount = document.getElementById('gamza-btn-like-count');
    elements.btnChatCta = document.getElementById('gamza-btn-chat-cta');
    elements.toastContainer = document.getElementById('gamza-toast-container');

    // 작성자 전용 요소 바인딩
    elements.ownerStatusBox = document.getElementById('gamza-owner-status-box');
    elements.ownerStatusBtns = document.querySelectorAll('.btn-owner-status');
    elements.buyerActionGroup = document.getElementById('gamza-buyer-action-group');
    elements.ownerActionGroup = document.getElementById('gamza-owner-action-group');
    elements.btnEditPost = document.getElementById('gamza-btn-edit-post');
    elements.btnDeletePost = document.getElementById('gamza-btn-delete-post');

    return true;
  }

  /**
   * Display floating toast alert
   */
  function showToast(message, icon = "🥔") {
    if (!elements.toastContainer) {
      elements.toastContainer = document.getElementById('gamza-toast-container');
    }
    if (!elements.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = 'gamza-toast';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => {
        if (toast.parentElement) toast.parentElement.removeChild(toast);
      }, 300);
    }, 2500);
  }

  /**
   * Toggle Like status for the current product
   */
  function toggleLike(productId) {
    if (!currentProduct) return;
    const pid = productId || currentProduct.id;
    const isLiked = likedProductsState.has(pid);

    if (isLiked) {
      likedProductsState.delete(pid);
      if (elements.btnLike) elements.btnLike.classList.remove('is-liked');
      if (elements.btnLikeCount) {
        const count = Math.max(0, (currentProduct.likes || 0));
        elements.btnLikeCount.textContent = count;
      }
      showToast("관심 상품에서 제외되었습니다.", "🤍");
    } else {
      likedProductsState.add(pid);
      if (elements.btnLike) elements.btnLike.classList.add('is-liked');
      if (elements.btnLikeCount) {
        const count = (currentProduct.likes || 0) + 1;
        elements.btnLikeCount.textContent = count;
      }
      showToast("관심 상품에 등록되었습니다!", "❤️");
    }

    // Dispatch custom event for external sync
    const finalLikes = (currentProduct.likes || 0) + (likedProductsState.has(pid) ? 1 : 0);
    window.dispatchEvent(new CustomEvent('gamza:like-changed', {
      detail: {
        productId: pid,
        isLiked: likedProductsState.has(pid),
        totalLikes: finalLikes,
        likesCount: finalLikes
      }
    }));
  }

  /**
   * Set status badge class and text
   */
  function updateStatusBadge(status) {
    if (!elements.badgeStatus) return;
    elements.badgeStatus.className = 'gamza-badge-status';

    const normalizedStatus = status ? status.trim() : '판매중';
    elements.badgeStatus.textContent = normalizedStatus;

    if (normalizedStatus === '예약중') {
      elements.badgeStatus.classList.add('status-reserved');
    } else if (normalizedStatus === '거래 완료' || normalizedStatus === '거래완료') {
      elements.badgeStatus.classList.add('status-sold');
    } else {
      elements.badgeStatus.classList.add('status-selling');
    }
  }

  /**
   * Helper: Check if current logged-in user is the author/owner of the product
   */
  function isCurrentProductOwner(product) {
    if (!product) return false;
    let currentUser = null;
    if (window.GamzaAuth && typeof window.GamzaAuth.getCurrentUserProfile === 'function') {
      currentUser = window.GamzaAuth.getCurrentUserProfile();
    }
    if (!currentUser || !currentUser.id) return false;

    // 1) sellerId 비교 (UUID)
    const sellerId = product.seller?.id || product.seller_id || product.rawRecord?.seller_id;
    if (sellerId && String(sellerId) === String(currentUser.id)) {
      return true;
    }

    // 2) 닉네임 비교
    const sellerNick = product.seller?.name || product.seller?.nickname || (product.user_profiles && product.user_profiles.nickname);
    if (sellerNick && currentUser.nickname && String(sellerNick).trim() === String(currentUser.nickname).trim()) {
      return true;
    }

    return false;
  }

  /**
   * Helper: Update active class on owner status selector buttons
   */
  function updateOwnerStatusButtons(status) {
    const btns = document.querySelectorAll('.btn-owner-status');
    if (!btns || btns.length === 0) return;
    const normalized = (status || '판매중').trim();
    btns.forEach(btn => {
      const btnStatus = btn.dataset.status;
      if (btnStatus === normalized || (btnStatus === '거래 완료' && normalized === '거래완료')) {
        btn.classList.add('is-active');
      } else {
        btn.classList.remove('is-active');
      }
    });
  }

  /**
   * Open the Detail Modal with specified product object or ID
   */
  function openDetailModal(productOrId) {
    ensureModalInDOM();
    bindElements();

    let product = productOrId;

    // If only an ID was provided, lookup in window.INITIAL_PRODUCTS or window.products
    if (typeof productOrId === 'number' || typeof productOrId === 'string') {
      const idNum = Number(productOrId);
      const list = window.INITIAL_PRODUCTS || window.gamzaProducts || [];
      const found = list.find(item => item.id === idNum);
      if (found) {
        product = found;
      } else {
        console.warn(`[GamzaScreen2] Product ID ${productOrId} not found in mock data.`);
      }
    }

    if (!product || typeof product !== 'object') {
      console.error('[GamzaScreen2] Invalid product data supplied to openDetailModal:', productOrId);
      return;
    }

    currentProduct = product;

    // 1. Image handling with fallback
    if (elements.image) {
      elements.image.onerror = function () {
        this.onerror = null;
        this.src = getFallbackImage(product.title || "감자 상품");
      };
      elements.image.src = product.imageUrl || getFallbackImage(product.title || "감자 상품");
      elements.image.alt = product.title || "상품 사진";
    }

    // 2. Status Badge (판매중 / 예약중 / 거래 완료)
    updateStatusBadge(product.status);

    // 3. Category Tag
    if (elements.badgeCategory) {
      elements.badgeCategory.textContent = product.category || "일반";
    }

    // 4. Product Title
    if (elements.title) {
      elements.title.textContent = product.title || "제목 없음";
    }

    // 5. Location and Time
    if (elements.metaLocation) {
      elements.metaLocation.textContent = product.location || (product.seller && product.seller.location) || "전국";
    }
    if (elements.metaTime) {
      elements.metaTime.textContent = product.timeAgo || "방금 전";
    }

    // 6. Price
    if (elements.price) {
      elements.price.textContent = formatKoreanPrice(product.price);
    }

    // 7. Description (white-space: pre-line)
    if (elements.description) {
      elements.description.textContent = product.description || "등록된 상세 설명이 없습니다.";
    }

    // 8. Seller Information
    const seller = product.seller || {};
    if (elements.sellerName) {
      elements.sellerName.textContent = seller.name || seller.nickname || "감자 이웃";
    }
    if (elements.sellerLocation) {
      elements.sellerLocation.textContent = seller.location || product.location || "감자마을";
    }
    if (elements.sellerAvatar) {
      elements.sellerAvatar.onerror = function () {
        this.onerror = null;
        this.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80";
      };
      elements.sellerAvatar.src = seller.profileImg || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80";
    }

    // 9. Potato Temperature / 포슬 지수
    const rawTemp = seller.potatoTemp || "36.5℃";
    const tempNum = parseTemperature(rawTemp);
    const tempInfo = getPotatoTempInfo(tempNum);

    if (elements.potatoDegree) {
      elements.potatoDegree.textContent = `${tempNum.toFixed(1)}℃`;
    }
    if (elements.potatoGaugeFill) {
      // Small delay for smooth animated gauge expansion
      elements.potatoGaugeFill.style.width = '0%';
      setTimeout(() => {
        if (elements.potatoGaugeFill) {
          elements.potatoGaugeFill.style.width = tempInfo.percentage;
        }
      }, 50);
    }
    if (elements.potatoRemark) {
      elements.potatoRemark.textContent = tempInfo.remark;
    }

    // 10. Like Button & Count State
    const isLiked = likedProductsState.has(product.id);
    const baseLikes = product.likes || 0;
    if (elements.btnLike) {
      elements.btnLike.classList.toggle('is-liked', isLiked);
    }
    if (elements.btnLikeCount) {
      elements.btnLikeCount.textContent = isLiked ? baseLikes + 1 : baseLikes;
    }

    // 11. Owner Controls (요구사항 1: 자신이 쓴 게시글일 때 상태 변경 바 & 수정/삭제 버튼 노출)
    const isOwner = isCurrentProductOwner(product);
    console.log(`🥔 [GamzaScreen2] Product #${product.id} opened. isOwner:`, isOwner);

    if (elements.ownerStatusBox) {
      elements.ownerStatusBox.classList.toggle('hidden', !isOwner);
    }
    if (elements.ownerActionGroup) {
      elements.ownerActionGroup.classList.toggle('hidden', !isOwner);
    }
    if (elements.buyerActionGroup) {
      elements.buyerActionGroup.classList.toggle('hidden', isOwner);
    }

    if (isOwner) {
      updateOwnerStatusButtons(product.status);
    }

    // Reset scroll of modal body
    const scrollContainer = elements.modal.querySelector('.gamza-modal-scrollable');
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    }

    // Show modal
    elements.modal.classList.add('is-active');
    document.body.classList.add('gamza-modal-open');

    // Notify listeners
    window.dispatchEvent(new CustomEvent('gamza:modal-opened', { detail: { product } }));
  }

  /**
   * Close the Detail Modal
   */
  function closeDetailModal() {
    if (!elements.modal) {
      elements.modal = document.getElementById('gamza-detail-modal');
    }
    if (elements.modal) {
      elements.modal.classList.remove('is-active');
    }
    document.body.classList.remove('gamza-modal-open');

    window.dispatchEvent(new CustomEvent('gamza:modal-closed', { detail: { product: currentProduct } }));
  }

  /**
   * Initialize Screen 2 Modal and bind events
   */
  function initScreen2(options = {}) {
    ensureModalInDOM();
    bindElements();

    // 1. Close Button click
    if (elements.closeBtn) {
      elements.closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        closeDetailModal();
      });
    }

    // 2. Backdrop click to close (only if clicked directly on backdrop)
    if (elements.modal) {
      elements.modal.addEventListener('click', (e) => {
        if (e.target === elements.modal) {
          closeDetailModal();
        }
      });
    }

    // 3. ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        if (elements.modal && elements.modal.classList.contains('is-active')) {
          closeDetailModal();
        }
      }
    });

    // 4. Like button toggle
    if (elements.btnLike) {
      elements.btnLike.addEventListener('click', (e) => {
        e.preventDefault();
        toggleLike();
      });
    }

    // 5. Chat CTA button click (채팅 기능 활성화)
    if (elements.btnChatCta) {
      elements.btnChatCta.addEventListener('click', (e) => {
        e.preventDefault();
        if (!currentProduct) return;

        // 본인 물품인지 확인
        const currentUser = window.GamzaAuth && typeof window.GamzaAuth.getCurrentUserProfile === 'function'
          ? window.GamzaAuth.getCurrentUserProfile()
          : null;
        
        if (currentUser && currentProduct.seller && String(currentUser.id) === String(currentProduct.seller.id)) {
          showToast('🥔 내가 등록한 상품에는 채팅을 걸 수 없어요!', '🥔');
          return;
        }

        console.log('🥔 [GamzaScreen2] Chat CTA clicked for product:', currentProduct.id);

        if (window.GamzaEvents && typeof window.GamzaEvents.openChat === 'function') {
          window.GamzaEvents.openChat(currentProduct);
        } else if (window.GamzaChat && typeof window.GamzaChat.openChatWithProduct === 'function') {
          window.GamzaChat.openChatWithProduct(currentProduct);
        } else {
          window.dispatchEvent(new CustomEvent('gamza:chat-clicked', {
            detail: {
              product: currentProduct,
              seller: currentProduct ? currentProduct.seller : null
            }
          }));
        }
      });
    }

    // 6. 작성자 전용 컨트롤 이벤트 (상태 변경 / 수정 / 삭제) (요구사항 1 & 2)
    if (elements.modal) {
      elements.modal.addEventListener('click', (e) => {
        // 1) 판매 상태 선택 버튼 클릭
        const statusBtn = e.target.closest('.btn-owner-status');
        if (statusBtn && currentProduct) {
          e.preventDefault();
          const newStatus = statusBtn.dataset.status;
          if (currentProduct.status === newStatus) return;

          console.log(`🥔 [GamzaScreen2] Status change requested: ${currentProduct.status} -> ${newStatus}`);
          currentProduct.status = newStatus;
          updateStatusBadge(newStatus);
          updateOwnerStatusButtons(newStatus);

          // Supabase DB 및 상위 오케스트레이터로 전파
          if (window.GamzaEvents && typeof window.GamzaEvents.updateProductStatus === 'function') {
            window.GamzaEvents.updateProductStatus(currentProduct.id, newStatus);
          } else if (window.GamzaSupabase && typeof window.GamzaSupabase.updateProductStatus === 'function') {
            window.GamzaSupabase.updateProductStatus(currentProduct.id, newStatus);
          }

          window.dispatchEvent(new CustomEvent('gamza:status-changed', {
            detail: { productId: currentProduct.id, status: newStatus }
          }));
          return;
        }

        // 2) 수정하기 버튼 클릭
        const editBtn = e.target.closest('#gamza-btn-edit-post');
        if (editBtn && currentProduct) {
          e.preventDefault();
          const prodToEdit = currentProduct;
          closeDetailModal();

          if (window.GamzaEvents && typeof window.GamzaEvents.openEdit === 'function') {
            window.GamzaEvents.openEdit(prodToEdit);
          } else if (window.GamzaScreen3 && typeof window.GamzaScreen3.openEditModal === 'function') {
            window.GamzaScreen3.openEditModal(prodToEdit);
          } else if (window.GamzaScreen3 && typeof window.GamzaScreen3.openWriteModal === 'function') {
            window.GamzaScreen3.openWriteModal(prodToEdit);
          }
          return;
        }

        // 3) 삭제하기 버튼 클릭
        const deleteBtn = e.target.closest('#gamza-btn-delete-post');
        if (deleteBtn && currentProduct) {
          e.preventDefault();
          const title = currentProduct.title || '게시글';
          const ok = confirm(`'${title}' 상품을 정말로 삭제하시겠습니까?\n삭제된 상품은 복구할 수 없습니다.`);
          if (!ok) return;

          const prodId = currentProduct.id;
          closeDetailModal();

          if (window.GamzaEvents && typeof window.GamzaEvents.deleteProduct === 'function') {
            window.GamzaEvents.deleteProduct(prodId);
          } else if (window.GamzaSupabase && typeof window.GamzaSupabase.deleteProduct === 'function') {
            window.GamzaSupabase.deleteProduct(prodId);
          }

          window.dispatchEvent(new CustomEvent('gamza:product-deleted', {
            detail: { productId: prodId }
          }));
          return;
        }
      });
    }

    console.log('[GamzaScreen2] Component initialized successfully.');
  }

  // Expose to window.GamzaScreen2 namespace
  window.GamzaScreen2 = {
    openDetailModal,
    closeDetailModal,
    initScreen2,
    toggleLike,
    showToast,
    getLikedProducts: () => Array.from(likedProductsState),
    getCurrentProduct: () => currentProduct
  };

  // Auto initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initScreen2());
  } else {
    initScreen2();
  }

})();
