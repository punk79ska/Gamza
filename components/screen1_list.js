/**
 * ============================================================================
 * Gamza Market - Screen 1: Product List Logic (screen1_list.js)
 * Module: window.GamzaScreen1
 * ============================================================================
 */

(function (window) {
  'use strict';

  // Internal State
  const state = {
    products: [],           // All original/managed products
    filteredProducts: [],   // Currently filtered & sorted products
    activeCategory: '전체',
    searchQuery: '',
    onlyAvailable: false,   // '거래 가능한 보기' 토글 상태
    sortBy: 'latest',       // latest | popular | price-asc | price-desc
    userLikes: new Set(),   // Track liked product IDs by current user
    initialized: false
  };

  /**
   * Safe event dispatcher helper
   */
  function emitGamzaEvent(eventName, data) {
    if (window.GamzaEvents && typeof window.GamzaEvents[eventName] === 'function') {
      window.GamzaEvents[eventName](data);
    } else {
      console.log(`[GamzaEvents.${eventName}] triggered:`, data);
      if (eventName === 'openWrite') {
        showToast('✏️ 글쓰기 화면으로 이동합니다! (window.GamzaEvents.openWrite)');
      } else if (eventName === 'openDetail') {
        showToast(`📄 '${data.title}' 상세 페이지로 이동합니다!`);
      }
    }
  }

  /**
   * Format price with comma separation and Korean '원'
   */
  function formatPrice(price) {
    if (price === 0 || price === '0') return '나눔 🧡';
    return Number(price).toLocaleString('ko-KR') + '원';
  }

  /**
   * Get CSS class for status badge
   */
  function getStatusClass(status) {
    switch (status) {
      case '판매중':
        return 'status-sale';
      case '예약중':
        return 'status-reserved';
      case '거래 완료':
      case '거래완료':
        return 'status-sold';
      default:
        return 'status-sale';
    }
  }

  /**
   * SVG Icon Helpers
   */
  const ICONS = {
    heart: `<svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,
    chat: `<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>`
  };

  /**
   * Category icons mapping
   */
  const CATEGORY_ICONS = {
    '전체': '🥔',
    '디지털기기': '💻',
    '가구/인테리어': '🛋️',
    '의류': '👕',
    '생활가전': '☕',
    '도서/티켓': '📚',
    '기타': '📦'
  };

  /**
   * Build single product card HTML
   */
  function createProductCardHTML(product) {
    const isLiked = state.userLikes.has(product.id);
    const statusClass = getStatusClass(product.status);
    const isSold = (product.status === '거래 완료' || product.status === '거래완료') ? 'is-sold' : '';
    const potatoTemp = product.seller && product.seller.potatoTemp ? product.seller.potatoTemp : '36.5℃';
    const sellerName = (product.seller && (product.seller.name || product.seller.nickname)) || '감자 이웃';

    return `
      <article class="product-card ${isSold}" data-id="${product.id}" tabindex="0" role="button" aria-label="${escapeHtml(product.title)}">
        <div class="card-image-wrap">
          <img 
            src="${product.imageUrl}" 
            alt="${escapeHtml(product.title)}" 
            class="card-image" 
            loading="lazy" 
            onerror="this.src='https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80'"
          />
          <span class="card-status-badge ${statusClass}">${product.status}</span>
          <button 
            type="button" 
            class="card-like-btn ${isLiked ? 'liked' : ''}" 
            data-like-id="${product.id}" 
            aria-label="관심 상품 추가"
            title="관심 상품 추가"
          >
            ${ICONS.heart}
          </button>
        </div>

        <div class="card-body">
          <h3 class="card-title" title="${escapeHtml(product.title)}">${escapeHtml(product.title)}</h3>
          
          <div class="card-meta">
            <span class="card-seller-name" title="작성자: ${escapeHtml(sellerName)}">
              <svg class="author-icon-svg" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              ${escapeHtml(sellerName)}
            </span>
            <span class="card-meta-dot">·</span>
            <span>${escapeHtml(product.location)}</span>
            <span class="card-meta-dot">·</span>
            <span>${escapeHtml(product.timeAgo)}</span>
          </div>

          <div class="card-price-row">
            <div class="card-price">${formatPrice(product.price)}</div>
            
            <div class="card-counts">
              <span class="card-seller-pill" title="감자 온도">🥔 ${potatoTemp}</span>
              <span class="count-item" title="관심 ${product.likes}">
                ${ICONS.heart}
                <span class="like-num" id="like-num-${product.id}">${product.likes}</span>
              </span>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  /**
   * Render the product grid with current filtered items
   */
  function renderProductList(productsToRender) {
    const listContainer = document.getElementById('product-grid');
    const emptyState = document.getElementById('empty-state');
    const countDisplay = document.getElementById('product-count-number');
    const filterTagContainer = document.getElementById('active-filter-tags');

    if (!listContainer) return;

    const list = productsToRender || state.filteredProducts;

    // Update count display
    if (countDisplay) {
      countDisplay.textContent = list.length;
    }

    // Update active filter badge indicators
    if (filterTagContainer) {
      const tags = [];
      if (state.activeCategory !== '전체') {
        tags.push(`
          <span class="active-filter-tag">
            카테고리: ${state.activeCategory}
            <button type="button" class="btn-remove-tag" data-reset-type="category" aria-label="카테고리 필터 취소">×</button>
          </span>
        `);
      }
      if (state.searchQuery.trim()) {
        tags.push(`
          <span class="active-filter-tag">
            검색어: "${escapeHtml(state.searchQuery.trim())}"
            <button type="button" class="btn-remove-tag" data-reset-type="search" aria-label="검색 필터 취소">×</button>
          </span>
        `);
      }
      if (state.onlyAvailable) {
        tags.push(`
          <span class="active-filter-tag">
            거래 가능만 보기
            <button type="button" class="btn-remove-tag" data-reset-type="toggle" aria-label="거래 가능만 필터 취소">×</button>
          </span>
        `);
      }
      filterTagContainer.innerHTML = tags.join('');
    }

    // Handle Empty State
    if (!list || list.length === 0) {
      listContainer.innerHTML = '';
      if (emptyState) {
        emptyState.style.display = 'flex';
      }
      return;
    }

    if (emptyState) {
      emptyState.style.display = 'none';
    }

    // Render cards
    const cardsHTML = list.map(createProductCardHTML).join('');
    listContainer.innerHTML = cardsHTML;
  }

  /**
   * Filter and Sort Products
   */
  function filterProducts() {
    let result = [...state.products];

    // 1. Category Filter
    if (state.activeCategory && state.activeCategory !== '전체') {
      result = result.filter(item => item.category === state.activeCategory);
    }

    // 2. Search Query Filter (Matches title and description)
    if (state.searchQuery && state.searchQuery.trim() !== '') {
      const query = state.searchQuery.trim().toLowerCase();
      result = result.filter(item => {
        const titleMatch = item.title && item.title.toLowerCase().includes(query);
        const descMatch = item.description && item.description.toLowerCase().includes(query);
        const locationMatch = item.location && item.location.toLowerCase().includes(query);
        const categoryMatch = item.category && item.category.toLowerCase().includes(query);
        return titleMatch || descMatch || locationMatch || categoryMatch;
      });
    }

    // 3. '거래 가능만 보기' (Only Available) Toggle Filter (거래 완료 상품 제외)
    if (state.onlyAvailable) {
      result = result.filter(item => item.status !== '거래 완료' && item.status !== '거래완료');
    }

    // 4. Sort
    switch (state.sortBy) {
      case 'popular':
        result.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        break;
      case 'price-asc':
        result.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-desc':
        result.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'latest':
      default:
        // Keep original mock ID / order as latest
        result.sort((a, b) => (b.id || 0) - (a.id || 0));
        break;
    }

    state.filteredProducts = result;
    renderProductList(result);
  }

  /**
   * Toggle Like for a Product
   */
  function toggleProductLike(productId, likeBtnElement) {
    const id = Number(productId);
    const product = state.products.find(p => p.id === id);
    if (!product) return;

    const isLiked = state.userLikes.has(id);

    if (isLiked) {
      state.userLikes.delete(id);
      product.likes = Math.max(0, (product.likes || 1) - 1);
      if (likeBtnElement) {
        likeBtnElement.classList.remove('liked');
      }
      showToast('🤍 관심 목록에서 제외했습니다.');
    } else {
      state.userLikes.add(id);
      product.likes = (product.likes || 0) + 1;
      if (likeBtnElement) {
        likeBtnElement.classList.add('liked');
      }
      showToast('🧡 관심 목록에 추가했습니다!');
    }

    // Update count in UI if present
    const likeNumSpan = document.getElementById(`like-num-${id}`);
    if (likeNumSpan) {
      likeNumSpan.textContent = product.likes;
    }

    // Supabase 및 타 컴포넌트 동기화 이벤트 발행
    window.dispatchEvent(new CustomEvent('gamza:like-changed', {
      detail: {
        productId: id,
        likesCount: product.likes,
        isLiked: state.userLikes.has(id)
      }
    }));
  }

  /**
   * Reset all filters
   */
  function resetFilters() {
    state.activeCategory = '전체';
    state.searchQuery = '';
    state.onlyAvailable = false;
    state.sortBy = 'latest';

    // Update Category Pills UI
    document.querySelectorAll('.category-pill').forEach(pill => {
      const cat = pill.getAttribute('data-category');
      pill.classList.toggle('active', cat === '전체');
    });

    // Update Search Input UI
    const searchInput = document.getElementById('search-input');
    const searchClearBtn = document.getElementById('search-clear-btn');
    if (searchInput) searchInput.value = '';
    if (searchClearBtn) searchClearBtn.classList.remove('visible');

    // Update Toggle Switch UI
    const toggleAvailable = document.getElementById('toggle-available');
    if (toggleAvailable) toggleAvailable.checked = false;

    // Update Sort Select UI
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) sortSelect.value = 'latest';

    filterProducts();
    showToast('🥔 모든 필터를 초기화했습니다.');
  }

  /**
   * Show Toast Notification
   */
  function showToast(message) {
    let container = document.getElementById('gamza-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'gamza-toast-container';
      container.className = 'gamza-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'gamza-toast';
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);

    // Trigger enter animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Auto remove after 2.5s
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 2500);
  }

  /**
   * Helper: Escape HTML string
   */
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Bind all DOM Event Listeners for Screen 1
   */
  function bindEvents() {
    const root = document.getElementById('screen1-root') || document;

    // 1. Category Tab clicks
    const categoryScroll = root.querySelector('.category-scroll-container');
    if (categoryScroll) {
      categoryScroll.addEventListener('click', (e) => {
        const btn = e.target.closest('.category-pill');
        if (!btn) return;

        const category = btn.getAttribute('data-category');
        if (!category) return;

        root.querySelectorAll('.category-pill').forEach(el => el.classList.remove('active'));
        btn.classList.add('active');

        state.activeCategory = category;
        filterProducts();

        // Scroll pill into view smoothly
        btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      });
    }

    // 2. Search Input & Clear
    const searchInput = root.querySelector('#search-input');
    const searchClearBtn = root.querySelector('#search-clear-btn');

    if (searchInput) {
      let debounceTimer = null;

      searchInput.addEventListener('input', (e) => {
        const val = e.target.value;
        if (searchClearBtn) {
          searchClearBtn.classList.toggle('visible', val.length > 0);
        }

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          state.searchQuery = val;
          filterProducts();
        }, 200);
      });

      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          clearTimeout(debounceTimer);
          state.searchQuery = searchInput.value;
          filterProducts();
        }
      });
    }

    if (searchClearBtn && searchInput) {
      searchClearBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchClearBtn.classList.remove('visible');
        state.searchQuery = '';
        searchInput.focus();
        filterProducts();
      });
    }

    // 3. '거래 가능한 보기' Toggle Switch
    const toggleAvailable = root.querySelector('#toggle-available');
    if (toggleAvailable) {
      toggleAvailable.addEventListener('change', (e) => {
        state.onlyAvailable = e.target.checked;
        filterProducts();
      });
    }

    // 4. Sort Dropdown
    const sortSelect = root.querySelector('#sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        state.sortBy = e.target.value;
        filterProducts();
      });
    }

    // 5. Header Action Buttons
    const btnWrite = root.querySelector('#btn-write');
    if (btnWrite) {
      btnWrite.addEventListener('click', (e) => {
        e.preventDefault();
        emitGamzaEvent('openWrite', null);
      });
    }

    const btnLogin = root.querySelector('#btn-login');
    if (btnLogin) {
      btnLogin.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.GamzaAuth && typeof window.GamzaAuth.openLoginModal === 'function') {
          window.GamzaAuth.openLoginModal();
        }
      });
    }

    // Logo Click (Reset to home)
    const brandLogo = root.querySelector('#brand-logo');
    if (brandLogo) {
      brandLogo.addEventListener('click', (e) => {
        e.preventDefault();
        resetFilters();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // 6. Reset Filters button in Empty State & Filter Tags
    root.addEventListener('click', (e) => {
      // Empty state reset button
      if (e.target.closest('#btn-reset-empty')) {
        resetFilters();
        return;
      }

      // Filter tag close button
      const tagBtn = e.target.closest('.btn-remove-tag');
      if (tagBtn) {
        const resetType = tagBtn.getAttribute('data-reset-type');
        if (resetType === 'category') {
          state.activeCategory = '전체';
          root.querySelectorAll('.category-pill').forEach(pill => {
            pill.classList.toggle('active', pill.getAttribute('data-category') === '전체');
          });
        } else if (resetType === 'search') {
          state.searchQuery = '';
          if (searchInput) searchInput.value = '';
          if (searchClearBtn) searchClearBtn.classList.remove('visible');
        } else if (resetType === 'toggle') {
          state.onlyAvailable = false;
          if (toggleAvailable) toggleAvailable.checked = false;
        }
        filterProducts();
        return;
      }

      // Like Button Click (prevent card open)
      const likeBtn = e.target.closest('.card-like-btn');
      if (likeBtn) {
        e.preventDefault();
        e.stopPropagation();
        const productId = likeBtn.getAttribute('data-like-id');
        toggleProductLike(productId, likeBtn);
        return;
      }

      // Product Card Click -> Open Detail
      const card = e.target.closest('.product-card');
      if (card) {
        const productId = Number(card.getAttribute('data-id'));
        const product = state.products.find(p => p.id === productId);
        if (product) {
          emitGamzaEvent('openDetail', product);
        }
      }
    });

    // Keyboard navigation (Enter on card)
    root.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const card = e.target.closest('.product-card');
        if (card && !e.target.closest('.card-like-btn')) {
          const productId = Number(card.getAttribute('data-id'));
          const product = state.products.find(p => p.id === productId);
          if (product) {
            emitGamzaEvent('openDetail', product);
          }
        }
      }
    });
  }

  /**
   * Set or update full product array
   */
  function setProducts(newProducts) {
    if (Array.isArray(newProducts)) {
      state.products = [...newProducts];
    } else {
      state.products = [];
    }
    filterProducts();
  }

  /**
   * Get current products array
   */
  function getProducts() {
    return state.products;
  }

  /**
   * Initialize Screen 1
   */
  function initScreen1(options = {}) {
    // 1. Load initial products
    if (options.products && Array.isArray(options.products)) {
      state.products = [...options.products];
    } else if (typeof INITIAL_PRODUCTS !== 'undefined' && Array.isArray(INITIAL_PRODUCTS)) {
      state.products = [...INITIAL_PRODUCTS];
    } else if (window.INITIAL_PRODUCTS && Array.isArray(window.INITIAL_PRODUCTS)) {
      state.products = [...window.INITIAL_PRODUCTS];
    } else {
      console.warn('[GamzaScreen1] No INITIAL_PRODUCTS found.');
      state.products = [];
    }

    // 2. Bind event listeners
    if (!state.initialized) {
      bindEvents();
      state.initialized = true;
    }

    // 3. Render initial product list
    filterProducts();

    console.log('[GamzaScreen1] Initialized successfully with', state.products.length, 'products');
  }

  // Public Namespace Export
  window.GamzaScreen1 = {
    init: initScreen1,
    initScreen1: initScreen1,
    renderProductList: renderProductList,
    filterProducts: filterProducts,
    setProducts: setProducts,
    getProducts: getProducts,
    resetFilters: resetFilters,
    showToast: showToast
  };

  // Auto-init on DOMContentLoaded if running directly in a standalone page
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.getElementById('screen1-root')) {
        initScreen1();
      }
    });
  } else {
    if (document.getElementById('screen1-root')) {
      initScreen1();
    }
  }

})(window);
