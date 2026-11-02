/**
 * ============================================================================
 * 감자 (Gamza) 마켓 - 통합 애플리케이션 메인 컨트롤러 (app.js)
 * Lead Agent Orchestrator with Supabase Database Integration
 * ============================================================================
 */

(function () {
  'use strict';

  console.log('🥔 [Gamza Market] Starting application initialization with Supabase...');

  // 1. 메모리 기반 데이터 상태 관리 (초기값은 mock_data 폴백)
  let products = [];
  if (typeof INITIAL_PRODUCTS !== 'undefined' && Array.isArray(INITIAL_PRODUCTS)) {
    products = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
  }

  /**
   * 2. 서브에이전트 컴포넌트 간 브릿지 이벤트 인터페이스 (GamzaEvents)
   */
  window.GamzaEvents = {
    /**
     * [화면 1 -> 화면 2] 상품 카드 클릭 시 상세 모달 오픈
     */
    openDetail: function (productOrId) {
      let targetProduct = productOrId;

      if (typeof productOrId === 'number' || typeof productOrId === 'string') {
        targetProduct = products.find(p => String(p.id) === String(productOrId));
      }

      if (window.GamzaScreen2 && typeof window.GamzaScreen2.openDetailModal === 'function') {
        window.GamzaScreen2.openDetailModal(targetProduct);
      } else {
        console.warn('[GamzaEvents] GamzaScreen2 not loaded yet.');
      }
    },

    /**
     * [화면 1 -> 화면 3] 글쓰기 버튼 클릭 시 글쓰기 모달 오픈
     * (Req 3: 비로그인 상태 시 로그인 모달 먼저 호출 후 성공 시 자동 연결)
     */
    openWrite: function () {
      console.log('🥔 [GamzaEvents.openWrite] Checking auth state before opening write modal...');

      // 1) 로그인 여부 확인
      if (window.GamzaAuth && typeof window.GamzaAuth.isLoggedIn === 'function' && !window.GamzaAuth.isLoggedIn()) {
        console.log('🥔 [GamzaEvents.openWrite] User not logged in, queuing write modal after login.');
        window.GamzaAuth.setPendingAction(() => {
          if (window.GamzaScreen3 && typeof window.GamzaScreen3.openWriteModal === 'function') {
            window.GamzaScreen3.openWriteModal();
          }
        });
        window.GamzaAuth.openLoginModal('✏️ 물건을 등록하시려면 먼저 로그인해주세요! 🥔');
        return;
      }

      // 2) 로그인된 상태이면 바로 글쓰기 창 열기
      if (window.GamzaScreen3 && typeof window.GamzaScreen3.openWriteModal === 'function') {
        window.GamzaScreen3.openWriteModal();
      } else {
        console.warn('[GamzaEvents] GamzaScreen3 not loaded yet.');
      }
    },

    /**
     * [화면 3 -> DB -> 화면 1] 새 상품 등록 완료 시 Supabase DB 저장 및 화면 반영
     */
    addProduct: async function (newProduct) {
      console.log('🥔 [GamzaEvents.addProduct] Registering new product:', newProduct);

      let savedProduct = newProduct;

      // 1) Supabase Cloud DB 저장 시도
      if (window.GamzaSupabase && typeof window.GamzaSupabase.createProduct === 'function') {
        try {
          savedProduct = await window.GamzaSupabase.createProduct(newProduct);
          console.log('🥔 [GamzaApp] Successfully saved to Supabase DB:', savedProduct);
        } catch (dbErr) {
          console.warn('[GamzaApp] Supabase save error, persisting to local state instead:', dbErr);
        }
      }

      // 2) 배열 맨 앞에 새 상품 추가
      // 이미 같은 ID가 있으면 대체, 없으면 unshift
      const existingIdx = products.findIndex(p => String(p.id) === String(savedProduct.id));
      if (existingIdx >= 0) {
        products[existingIdx] = savedProduct;
      } else {
        products.unshift(savedProduct);
      }

      // 3) 화면 1 목록 갱신
      if (window.GamzaScreen1 && typeof window.GamzaScreen1.setProducts === 'function') {
        window.GamzaScreen1.setProducts(products);
      }

      // 4) 토스트 피드백 표시
      const toastMsg = `🥔 '${savedProduct.title}' 상품이 감자마켓에 안전하게 등록되었습니다!`;
      if (window.GamzaScreen1 && typeof window.GamzaScreen1.showToast === 'function') {
        window.GamzaScreen1.showToast(toastMsg);
      } else if (window.GamzaScreen2 && typeof window.GamzaScreen2.showToast === 'function') {
        window.GamzaScreen2.showToast(toastMsg);
      }
    },

    /**
     * [화면 2 -> DB -> 화면 1] 상품 상태 변경 (판매중 / 예약중 / 거래 완료)
     */
    updateProductStatus: async function (productId, newStatus) {
      console.log(`🥔 [GamzaEvents.updateProductStatus] Updating product #${productId} to '${newStatus}'`);

      // 1) Supabase Cloud DB 저장 시도
      if (window.GamzaSupabase && typeof window.GamzaSupabase.updateProductStatus === 'function') {
        try {
          await window.GamzaSupabase.updateProductStatus(productId, newStatus);
        } catch (dbErr) {
          console.warn('[GamzaApp] Supabase update status error:', dbErr);
        }
      }

      // 2) 로컬 메모리 상태 갱신
      const target = products.find(p => String(p.id) === String(productId));
      if (target) {
        target.status = newStatus;
      }

      // 3) 화면 1 목록 갱신
      if (window.GamzaScreen1 && typeof window.GamzaScreen1.setProducts === 'function') {
        window.GamzaScreen1.setProducts(products);
      }

      // 4) 토스트 알림
      const toastMsg = `🥔 판매 상태가 '${newStatus}'(으)로 변경되었습니다.`;
      if (window.GamzaScreen2 && typeof window.GamzaScreen2.showToast === 'function') {
        window.GamzaScreen2.showToast(toastMsg, '🥔');
      } else if (window.GamzaScreen1 && typeof window.GamzaScreen1.showToast === 'function') {
        window.GamzaScreen1.showToast(toastMsg);
      }
    },

    /**
     * [화면 2 -> 화면 3] 상품 수정 모달 열기
     */
    openEdit: function (productOrId) {
      let targetProduct = productOrId;
      if (typeof productOrId === 'number' || typeof productOrId === 'string') {
        targetProduct = products.find(p => String(p.id) === String(productOrId));
      }
      if (!targetProduct) return;

      console.log('🥔 [GamzaEvents.openEdit] Opening edit modal for product:', targetProduct.id);

      if (window.GamzaScreen2 && typeof window.GamzaScreen2.closeDetailModal === 'function') {
        window.GamzaScreen2.closeDetailModal();
      }

      if (window.GamzaScreen3 && typeof window.GamzaScreen3.openEditModal === 'function') {
        window.GamzaScreen3.openEditModal(targetProduct);
      } else if (window.GamzaScreen3 && typeof window.GamzaScreen3.openWriteModal === 'function') {
        window.GamzaScreen3.openWriteModal(targetProduct);
      }
    },

    /**
     * [화면 3(수정모드) -> DB -> 화면 1] 상품 수정 완료 시 DB 저장 및 화면 반영
     */
    updateProduct: async function (productId, updatedData) {
      console.log(`🥔 [GamzaEvents.updateProduct] Updating product #${productId}:`, updatedData);

      let updatedProduct = updatedData;

      // 1) Supabase Cloud DB 저장 시도
      if (window.GamzaSupabase && typeof window.GamzaSupabase.updateProduct === 'function') {
        try {
          const res = await window.GamzaSupabase.updateProduct(productId, updatedData);
          if (res) updatedProduct = res;
        } catch (dbErr) {
          console.warn('[GamzaApp] Supabase update error, applying locally:', dbErr);
        }
      }

      // 2) 로컬 메모리 상태 반영
      const idx = products.findIndex(p => String(p.id) === String(productId));
      if (idx >= 0) {
        products[idx] = { ...products[idx], ...updatedProduct };
      }

      // 3) 화면 1 목록 갱신
      if (window.GamzaScreen1 && typeof window.GamzaScreen1.setProducts === 'function') {
        window.GamzaScreen1.setProducts(products);
      }

      // 4) 토스트 알림
      const toastMsg = `✏️ '${updatedProduct.title || '게시글'}' 상품이 수정되었습니다!`;
      if (window.GamzaScreen1 && typeof window.GamzaScreen1.showToast === 'function') {
        window.GamzaScreen1.showToast(toastMsg);
      }
    },

    /**
     * [화면 2 -> DB -> 화면 1] 상품 삭제
     */
    deleteProduct: async function (productId) {
      console.log(`🥔 [GamzaEvents.deleteProduct] Deleting product #${productId}`);

      // 1) Supabase Cloud DB 삭제
      if (window.GamzaSupabase && typeof window.GamzaSupabase.deleteProduct === 'function') {
        try {
          await window.GamzaSupabase.deleteProduct(productId);
        } catch (dbErr) {
          console.warn('[GamzaApp] Supabase delete error:', dbErr);
        }
      }

      // 2) 로컬 메모리 상태 제거
      products = products.filter(p => String(p.id) !== String(productId));

      // 3) 화면 1 목록 갱신
      if (window.GamzaScreen1 && typeof window.GamzaScreen1.setProducts === 'function') {
        window.GamzaScreen1.setProducts(products);
      }

      // 4) 화면 2 상세 모달 닫기
      if (window.GamzaScreen2 && typeof window.GamzaScreen2.closeDetailModal === 'function') {
        window.GamzaScreen2.closeDetailModal();
      }

      // 5) 토스트 알림
      const toastMsg = '🗑️ 게시글이 성공적으로 삭제되었습니다.';
      if (window.GamzaScreen1 && typeof window.GamzaScreen1.showToast === 'function') {
        window.GamzaScreen1.showToast(toastMsg);
      }
    },

    /**
     * [화면 2 -> 화면 4] 상품에 대한 1:1 채팅창 열기
     */
    openChat: function (productOrId) {
      let targetProduct = productOrId;
      if (typeof productOrId === 'number' || typeof productOrId === 'string') {
        targetProduct = products.find(p => String(p.id) === String(productOrId));
      }

      if (!targetProduct) return;
      console.log('🥔 [GamzaEvents.openChat] Opening chat for product:', targetProduct.id);

      if (window.GamzaChat && typeof window.GamzaChat.openChatWithProduct === 'function') {
        window.GamzaChat.openChatWithProduct(targetProduct);
      } else {
        console.warn('[GamzaEvents] GamzaChat not loaded yet.');
      }
    },

    /**
     * [헤더 / FAB -> 화면 4] 내 채팅 목록 열기
     */
    openChatList: function () {
      console.log('🥔 [GamzaEvents.openChatList] Opening chat list modal');
      if (window.GamzaChat && typeof window.GamzaChat.openChatListModal === 'function') {
        window.GamzaChat.openChatListModal();
      } else {
        console.warn('[GamzaEvents] GamzaChat not loaded yet.');
      }
    }
  };

  /**
   * 3. 커스텀 이벤트 버스 리스너 연동
   */
  // 화면 3에서 발행되는 상품 등록 이벤트 수신
  window.addEventListener('gamza:product-added', function (e) {
    if (e.detail) {
      window.GamzaEvents.addProduct(e.detail);
    }
  });

  // 상태 변경 이벤트 수신
  window.addEventListener('gamza:status-changed', function (e) {
    if (e.detail && e.detail.productId && e.detail.status) {
      window.GamzaEvents.updateProductStatus(e.detail.productId, e.detail.status);
    }
  });

  // 상품 수정 이벤트 수신
  window.addEventListener('gamza:product-updated', function (e) {
    if (e.detail && e.detail.productId && e.detail.product) {
      window.GamzaEvents.updateProduct(e.detail.productId, e.detail.product);
    }
  });

  // 상품 삭제 이벤트 수신
  window.addEventListener('gamza:product-deleted', function (e) {
    if (e.detail && e.detail.productId) {
      window.GamzaEvents.deleteProduct(e.detail.productId);
    }
  });

  // 화면 1 및 화면 2에서 발행되는 관심(하트) 토글 이벤트 수신 -> DB 및 목록 동기화
  window.addEventListener('gamza:like-changed', function (e) {
    const detail = e.detail;
    if (!detail) return;
    const likesCount = detail.likesCount !== undefined ? detail.likesCount : detail.totalLikes;
    const target = products.find(p => String(p.id) === String(detail.productId));
    if (target && likesCount !== undefined) {
      target.likes = likesCount;
      if (window.GamzaScreen1 && typeof window.GamzaScreen1.setProducts === 'function') {
        window.GamzaScreen1.setProducts(products);
      }
    }

    // Supabase DB에 관심 수 비동기 동기화
    if (window.GamzaSupabase && typeof window.GamzaSupabase.updateLikesCount === 'function' && likesCount !== undefined) {
      window.GamzaSupabase.updateLikesCount(detail.productId, likesCount);
    }
  });

  // 채팅 시작 이벤트 수신 (화면 2 상세 모달에서 발행)
  window.addEventListener('gamza:chat-clicked', function (e) {
    if (e.detail && e.detail.product) {
      window.GamzaEvents.openChat(e.detail.product);
    }
  });

  window.addEventListener('gamza:open-chat', function (e) {
    if (e.detail && e.detail.product) {
      window.GamzaEvents.openChat(e.detail.product);
    }
  });

  /**
   * 4. 상단 글로벌 헤더 액션 바인딩
   */
  function bindGlobalHeaderActions() {
    // [채팅] 버튼
    const chatBtn = document.getElementById('btn-header-chat');
    if (chatBtn) {
      chatBtn.addEventListener('click', function (e) {
        e.preventDefault();
        window.GamzaEvents.openChatList();
      });
    }

    // 플로팅 채팅 버튼 (FAB)
    const fabChatBtn = document.getElementById('gamza-fab-chat');
    if (fabChatBtn) {
      fabChatBtn.addEventListener('click', function (e) {
        e.preventDefault();
        window.GamzaEvents.openChatList();
      });
    }

    // [글쓰기] 버튼
    const writeBtn = document.getElementById('btn-write');
    if (writeBtn) {
      writeBtn.addEventListener('click', function (e) {
        e.preventDefault();
        window.GamzaEvents.openWrite();
      });
    }

    // [로그인] 버튼 클릭 시 Supabase Auth 모달 열기
    const loginBtn = document.getElementById('btn-login');
    if (loginBtn) {
      loginBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (window.GamzaAuth && typeof window.GamzaAuth.openLoginModal === 'function') {
          window.GamzaAuth.openLoginModal();
        }
      });
    }

    // [로그아웃] 버튼 클릭 시 Supabase Auth 로그아웃
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (window.GamzaAuth && typeof window.GamzaAuth.signOut === 'function') {
          window.GamzaAuth.signOut();
        }
      });
    }

    // 로고 클릭 시 필터 초기화 & 스크롤 업
    const logoBtn = document.getElementById('brand-logo');
    if (logoBtn) {
      logoBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (window.GamzaScreen1 && typeof window.GamzaScreen1.resetFilters === 'function') {
          window.GamzaScreen1.resetFilters();
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  /**
   * 5. Supabase에서 실시간 상품 데이터 로드
   */
  async function loadProductsFromSupabase() {
    if (window.GamzaSupabase && typeof window.GamzaSupabase.fetchProducts === 'function') {
      try {
        console.log('🥔 [GamzaApp] Fetching live products from Supabase...');
        const remoteProducts = await window.GamzaSupabase.fetchProducts();
        if (Array.isArray(remoteProducts) && remoteProducts.length > 0) {
          products = remoteProducts;
          console.log(`🥔 [GamzaApp] Loaded ${products.length} products from Supabase DB.`);
        } else {
          console.log('🥔 [GamzaApp] Remote products empty or null, using initial fallback.');
        }
      } catch (err) {
        console.warn('[GamzaApp] Failed to fetch remote products, fallback to mock data:', err);
      }
    }

    // 화면 1 데이터 갱신
    if (window.GamzaScreen1 && typeof window.GamzaScreen1.setProducts === 'function') {
      window.GamzaScreen1.setProducts(products);
    }
  }

  /**
   * 6. 앱 초기화 (DOM 준비 시 실행)
   */
  async function initApp() {
    console.log('🥔 [Gamza Market] DOM Ready, orchestrating screens...');

    // 1) 화면 1 초기화 (초기 목데이터 우선 주입 후 빠른 렌더링)
    if (window.GamzaScreen1 && typeof window.GamzaScreen1.init === 'function') {
      window.GamzaScreen1.init({ products: products });
    }

    // 2) 화면 2 초기화
    if (window.GamzaScreen2 && typeof window.GamzaScreen2.initScreen2 === 'function') {
      window.GamzaScreen2.initScreen2();
    }

    // 3) 화면 3 초기화
    if (window.GamzaScreen3 && typeof window.GamzaScreen3.initScreen3 === 'function') {
      window.GamzaScreen3.initScreen3();
    }

    // 4) 화면 4 (실시간 감자 채팅) 초기화
    if (window.GamzaChat && typeof window.GamzaChat.init === 'function') {
      window.GamzaChat.init();
    }

    // 5) 글로벌 헤더 인터랙션 연결
    bindGlobalHeaderActions();

    // 6) Supabase 클라우드 실시간 데이터 비동기 동기화
    await loadProductsFromSupabase();

    console.log('🥔 [Gamza Market] All components connected to Supabase and ready!');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();
