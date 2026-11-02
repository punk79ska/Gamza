/**
 * ============================================================================
 * 감자 (Gamza) 마켓 - 실시간 1:1 감자 채팅 컨트롤러 (components/screen4_chat.js)
 * Module: window.GamzaChat
 * ============================================================================
 */

(function (window, document) {
  'use strict';

  console.log('🥔 [GamzaChat] Initializing Gamza Chat module...');

  // Module Internal State
  const state = {
    isOpen: false,
    currentView: 'list', // 'list' | 'detail'
    currentRoom: null,
    currentProduct: null,
    partner: null,
    messages: [],
    realtimeSub: null,
    typingTimer: null
  };

  // DOM Elements Cache
  const el = {};

  /**
   * Helper: Global Toast Notification
   */
  function showToast(message, icon = '🥔') {
    if (window.GamzaScreen2 && typeof window.GamzaScreen2.showToast === 'function') {
      window.GamzaScreen2.showToast(message, icon);
    } else if (window.GamzaScreen1 && typeof window.GamzaScreen1.showToast === 'function') {
      window.GamzaScreen1.showToast(message);
    } else {
      console.log('🥔 [GamzaChat Toast]', message);
    }
  }

  /**
   * Helper: Format Date for Message Dividers (e.g. "2026년 11월 3일 화요일")
   */
  function formatDateHeader(dateStr) {
    try {
      const d = dateStr ? new Date(dateStr) : new Date();
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const date = d.getDate();
      const days = ['일', '월', '화', '수', '목', '금', '토'];
      const day = days[d.getDay()];
      return `${year}년 ${month}월 ${date}일 (${day})`;
    } catch {
      return '오늘';
    }
  }

  /**
   * Helper: Format Time for Message Bubbles (e.g. "오후 2:30")
   */
  function formatMessageTime(isoString) {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      let hours = d.getHours();
      const minutes = d.getMinutes();
      const ampm = hours >= 12 ? '오후' : '오전';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const formattedMin = minutes < 10 ? '0' + minutes : minutes;
      return `${ampm} ${hours}:${formattedMin}`;
    } catch {
      return '';
    }
  }

  /**
   * Format Price with Commas
   */
  function formatPrice(num) {
    if (num === 0) return '무료 나눔 🥔';
    return Number(num).toLocaleString('ko-KR') + '원';
  }

  /**
   * Bind DOM Elements
   */
  function bindElements() {
    el.overlay = document.getElementById('gamza-chat-modal');
    el.backdrop = document.getElementById('gamza-chat-backdrop');
    el.closeBtn = document.getElementById('btn-close-chat-modal');
    el.navBackBtn = document.getElementById('btn-chat-nav-back');

    el.headerTitle = document.getElementById('chat-header-title');
    el.headerSub = document.getElementById('chat-header-sub');
    el.headerTemp = document.getElementById('chat-header-temp');

    // Views
    el.viewRooms = document.getElementById('view-chat-rooms');
    el.viewDetail = document.getElementById('view-chat-detail');

    // Rooms list
    el.roomsList = document.getElementById('chat-rooms-list');
    el.emptyState = document.getElementById('chat-rooms-empty');

    // Detail Room
    el.productBar = document.getElementById('chat-product-bar');
    el.prodThumb = document.getElementById('chat-prod-thumb');
    el.prodTitle = document.getElementById('chat-prod-title');
    el.prodPrice = document.getElementById('chat-prod-price');
    el.prodStatus = document.getElementById('chat-prod-status');

    el.messagesContainer = document.getElementById('chat-messages-container');
    el.typingIndicator = document.getElementById('chat-typing-indicator');

    el.inputBox = document.getElementById('chat-input-field');
    el.sendBtn = document.getElementById('btn-chat-send');
    el.quickRepliesBar = document.getElementById('chat-quick-replies');

    // Header & Floating Buttons
    el.headerChatBtn = document.getElementById('btn-header-chat');
    el.fabChatBtn = document.getElementById('gamza-fab-chat');
    el.unreadBadge = document.getElementById('chat-unread-badge');
  }

  /**
   * Open Chat Modal
   */
  function openModal() {
    if (!el.overlay) bindElements();
    if (!el.overlay) return;

    el.overlay.classList.add('is-active');
    el.overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    state.isOpen = true;
  }

  /**
   * Close Chat Modal
   */
  function closeModal() {
    if (!el.overlay) return;

    el.overlay.classList.remove('is-active');
    el.overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    state.isOpen = false;

    // Unsubscribe realtime
    if (state.realtimeSub && typeof state.realtimeSub.unsubscribe === 'function') {
      state.realtimeSub.unsubscribe();
      state.realtimeSub = null;
    }
  }

  /**
   * Get Current Active User Profile (Logged In or Guest)
   */
  async function getCurrentUser() {
    // 1. Logged in member
    if (window.GamzaAuth && typeof window.GamzaAuth.getCurrentUserProfile === 'function') {
      const user = window.GamzaAuth.getCurrentUserProfile();
      if (user && user.id) return user;
    }

    // 2. Local anonymous profile
    if (window.GamzaSupabase && typeof window.GamzaSupabase.getOrCreateLocalUserProfile === 'function') {
      const anonUser = await window.GamzaSupabase.getOrCreateLocalUserProfile();
      if (anonUser) return anonUser;
    }

    return {
      id: 'a1111111-1111-1111-1111-111111111111',
      nickname: '포슬포슬감자',
      profile_img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      potato_temp: 36.5
    };
  }

  /**
   * Switch View between 'list' and 'detail'
   */
  function setView(viewMode) {
    state.currentView = viewMode;

    if (viewMode === 'list') {
      el.viewRooms.classList.remove('hidden');
      el.viewDetail.classList.add('hidden');
      el.navBackBtn.style.display = 'none';

      el.headerTitle.textContent = '🥔 감자톡';
      el.headerSub.textContent = '따뜻한 이웃과의 대화 목록';
      el.headerTemp.style.display = 'none';

      // Load room list
      loadChatRoomsList();
    } else {
      el.viewRooms.classList.add('hidden');
      el.viewDetail.classList.remove('hidden');
      el.navBackBtn.style.display = 'flex';

      const partnerName = state.partner?.nickname || state.partner?.name || '판매자';
      el.headerTitle.textContent = partnerName;
      el.headerSub.textContent = state.partner?.location || state.partner?.activity_location || '동네 이웃';
      
      const temp = state.partner?.potatoTemp || state.partner?.potato_temp || 36.5;
      el.headerTemp.textContent = `🥔 ${typeof temp === 'number' ? temp.toFixed(1) : temp}℃`;
      el.headerTemp.style.display = 'inline-flex';

      setTimeout(() => {
        if (el.inputBox) el.inputBox.focus();
      }, 100);
    }
  }

  /**
   * Load Chat Rooms List
   */
  async function loadChatRoomsList() {
    if (!el.roomsList) return;

    el.roomsList.innerHTML = '<li style="padding: 24px; text-align: center; color: var(--text-muted);">대화방 목록을 불러오는 중... 🥔</li>';
    el.emptyState.style.display = 'none';

    const currentUser = await getCurrentUser();
    let rooms = [];

    if (window.GamzaSupabase && typeof window.GamzaSupabase.fetchChatRooms === 'function') {
      try {
        rooms = await window.GamzaSupabase.fetchChatRooms(currentUser.id);
      } catch (err) {
        console.warn('[GamzaChat] fetchChatRooms error:', err);
      }
    }

    if (!rooms || rooms.length === 0) {
      el.roomsList.innerHTML = '';
      el.emptyState.style.display = 'flex';
      return;
    }

    el.emptyState.style.display = 'none';
    el.roomsList.innerHTML = '';

    rooms.forEach(room => {
      // Determine partner
      const isBuyer = String(room.buyer_id) === String(currentUser.id);
      const partner = isBuyer ? (room.seller || {}) : (room.buyer || {});
      const partnerName = partner.nickname || (isBuyer ? '판매자' : '구매자');
      const partnerImg = partner.profile_img || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';
      const prod = room.products || {};
      const prodTitle = prod.title || '감자 물품';
      const prodThumb = prod.image_url || 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=200&q=80';

      const li = document.createElement('li');
      li.className = 'chat-room-item';
      li.innerHTML = `
        <div class="chat-room-avatar-wrap">
          <img class="chat-room-avatar" src="${partnerImg}" alt="${partnerName}" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'" />
          <span class="chat-room-avatar-potato">🥔</span>
        </div>
        <div class="chat-room-content">
          <div class="chat-room-row-top">
            <span class="chat-room-partner-name">${partnerName}</span>
            <span class="chat-room-time">${room.lastMessageTime || '방금 전'}</span>
          </div>
          <div class="chat-room-row-bottom">
            <span class="chat-room-last-msg">${room.lastMessage || '대화를 시작해보세요!'}</span>
          </div>
        </div>
        <div class="chat-room-prod-thumb-wrap" title="${prodTitle}">
          <img class="chat-room-prod-thumb" src="${prodThumb}" alt="${prodTitle}" />
        </div>
      `;

      li.addEventListener('click', () => {
        openChatRoom(room, prod, partner);
      });

      el.roomsList.appendChild(li);
    });
  }

  /**
   * Open Specific Chat Room
   */
  async function openChatRoom(room, product, partner) {
    state.currentRoom = room;
    state.currentProduct = product;
    state.partner = partner;

    // Render Product Bar
    if (product) {
      el.prodThumb.src = product.imageUrl || product.image_url || 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=200&q=80';
      el.prodTitle.textContent = product.title || '감자 물품';
      el.prodPrice.textContent = formatPrice(product.price);
      
      const statusText = product.status || '판매중';
      el.prodStatus.textContent = statusText;
      el.prodStatus.className = 'chat-prod-status-tag';
      if (statusText === '판매중') el.prodStatus.classList.add('status-sale');
      else if (statusText === '예약중') el.prodStatus.classList.add('status-reserved');
      else el.prodStatus.classList.add('status-sold');

      el.productBar.style.display = 'flex';
      el.productBar.onclick = () => {
        if (window.GamzaEvents && typeof window.GamzaEvents.openDetail === 'function') {
          window.GamzaEvents.openDetail(product);
        }
      };
    } else {
      el.productBar.style.display = 'none';
    }

    // Switch view to detail
    setView('detail');

    // Load messages
    await loadMessages(room.id);

    // Subscribe to realtime messages
    if (window.GamzaSupabase && typeof window.GamzaSupabase.subscribeToRoomMessages === 'function') {
      if (state.realtimeSub) state.realtimeSub.unsubscribe();
      state.realtimeSub = window.GamzaSupabase.subscribeToRoomMessages(room.id, (newMsg) => {
        // If message is from partner, append it
        if (String(newMsg.sender_id) !== String(state.currentUser?.id)) {
          appendMessageUI(newMsg, false);
          scrollToBottom();
        }
      });
    }
  }

  /**
   * Load Messages from DB
   */
  async function loadMessages(roomId) {
    el.messagesContainer.innerHTML = `
      <div class="chat-date-divider">
        <span class="chat-date-text">${formatDateHeader(new Date().toISOString())}</span>
      </div>
      <div class="chat-safe-notice">
        <span class="chat-safe-notice-icon">🥔</span>
        <span><strong>감자 안심 직거래 가이드:</strong> 서로를 배려하는 따뜻한 언어를 사용해주세요. 직거래 시 현금 또는 계좌이체를 권장합니다.</span>
      </div>
    `;

    state.messages = [];
    const currentUser = await getCurrentUser();
    state.currentUser = currentUser;

    if (window.GamzaSupabase && typeof window.GamzaSupabase.fetchChatMessages === 'function') {
      try {
        state.messages = await window.GamzaSupabase.fetchChatMessages(roomId);
      } catch (err) {
        console.warn('[GamzaChat] fetchChatMessages error:', err);
      }
    }

    if (state.messages && state.messages.length > 0) {
      state.messages.forEach(msg => {
        const isMe = String(msg.sender_id) === String(currentUser.id);
        appendMessageUI(msg, isMe);
      });
    } else {
      // Empty conversation prompt
      const intro = document.createElement('div');
      intro.style.cssText = 'text-align: center; color: var(--text-muted); font-size: 13px; margin: 16px 0;';
      intro.innerHTML = '🥔 판매자님과 첫 대화를 시작해보세요!';
      el.messagesContainer.appendChild(intro);
    }

    scrollToBottom();
  }

  /**
   * Append Single Message to UI
   */
  function appendMessageUI(msg, isMe) {
    const row = document.createElement('div');
    row.className = `chat-message-row ${isMe ? 'is-me' : 'is-other'}`;

    const timeStr = formatMessageTime(msg.created_at);
    const text = escapeHtml(msg.content || '');

    if (isMe) {
      row.innerHTML = `
        <div class="chat-bubble">${text}</div>
        <span class="chat-msg-time">${timeStr}</span>
      `;
    } else {
      const partnerImg = state.partner?.profile_img || state.partner?.profileImg || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';
      const partnerName = state.partner?.nickname || state.partner?.name || '판매자';

      row.innerHTML = `
        <img class="chat-msg-avatar" src="${partnerImg}" alt="${partnerName}" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'" />
        <div class="chat-msg-body-group">
          <span class="chat-msg-sender-name">${partnerName}</span>
          <div class="chat-bubble">${text}</div>
        </div>
        <span class="chat-msg-time">${timeStr}</span>
      `;
    }

    el.messagesContainer.appendChild(row);
  }

  /**
   * Scroll Messages Container to Bottom
   */
  function scrollToBottom() {
    if (!el.messagesContainer) return;
    setTimeout(() => {
      el.messagesContainer.scrollTop = el.messagesContainer.scrollHeight;
    }, 50);
  }

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML.replace(/\n/g, '<br>');
  }

  /**
   * Send Message Action
   */
  async function sendMessage(text) {
    const content = (text || (el.inputBox ? el.inputBox.value : '')).trim();
    if (!content || !state.currentRoom) return;

    if (el.inputBox) {
      el.inputBox.value = '';
      el.inputBox.focus();
    }

    const currentUser = await getCurrentUser();
    const nowIso = new Date().toISOString();

    // 1. Optimistic UI Append
    const tempMsg = {
      room_id: state.currentRoom.id,
      sender_id: currentUser.id,
      content: content,
      created_at: nowIso
    };
    appendMessageUI(tempMsg, true);
    scrollToBottom();

    // 2. Persist to DB or Local
    let savedMsg = null;
    if (window.GamzaSupabase && typeof window.GamzaSupabase.sendChatMessage === 'function') {
      try {
        savedMsg = await window.GamzaSupabase.sendChatMessage(
          state.currentRoom.id,
          currentUser.id,
          content,
          currentUser
        );
      } catch (err) {
        console.warn('[GamzaChat] Send message failed:', err);
      }
    }

    // 3. Simulated Seller Reply (따뜻한 감자마켓 인터랙션)
    // 실제 다른 유저가 아닌 경우에도 친절하게 자동 답장
    triggerSellerAutoReply(content);
  }

  /**
   * Trigger Simulated Seller Auto-Reply for Interactive Experience
   */
  function triggerSellerAutoReply(userMessage) {
    const sellerId = state.currentRoom?.seller_id;
    const currentUser = state.currentUser;

    // 내가 판매자인 경우에는 답장 트리거 안 함
    if (currentUser && String(currentUser.id) === String(sellerId)) return;

    // 이미 타이머가 있으면 초기화
    if (state.typingTimer) clearTimeout(state.typingTimer);

    // 1.2초 뒤 타이핑 인디케이터 표시
    state.typingTimer = setTimeout(() => {
      showTypingIndicator(true);

      // 2.2초 뒤 답장 메시지 전송
      setTimeout(async () => {
        showTypingIndicator(false);

        const sellerResponses = [
          '안녕하세요! 🥔 네, 아직 판매 중입니다.',
          '직거래는 역삼역 부근이나 인근 편하신 장소에서 가능합니다! 언제 시간 괜찮으세요? 😊',
          '포슬포슬 감자마켓에서 따뜻한 거래 환영해요~ 🥔',
          '네! 상태 아주 양호하고 깨끗하게 보관 중입니다.',
          '감자 온도 36.5도의 훈훈한 매너거래 약속드립니다!'
        ];

        let replyText = sellerResponses[Math.floor(Math.random() * sellerResponses.length)];
        if (userMessage.includes('구매') || userMessage.includes('가능')) {
          replyText = '안녕하세요! 🥔 네, 구매 가능합니다. 오늘 저녁이나 내일 중 언제 편하신가요?';
        } else if (userMessage.includes('네고') || userMessage.includes('할인') || userMessage.includes('깎')) {
          replyText = '아주 애지중지 아끼던 물건이라 많이는 어렵지만, 쿨거래 해주시면 따뜻한 덤도 챙겨드릴게요! 🥔';
        } else if (userMessage.includes('어디') || userMessage.includes('장소') || userMessage.includes('역')) {
          const loc = state.currentProduct?.location || '역삼1동';
          replyText = `주로 ${loc} 근처에서 직거래하고 있어요! 시간 맞추어 찾아뵐 수 있습니다. 😊`;
        }

        const replyMsg = {
          room_id: state.currentRoom.id,
          sender_id: sellerId || 'a2222222-2222-2222-2222-222222222222',
          content: replyText,
          created_at: new Date().toISOString()
        };

        // DB에 저장
        if (window.GamzaSupabase && typeof window.GamzaSupabase.sendChatMessage === 'function') {
          try {
            await window.GamzaSupabase.sendChatMessage(
              state.currentRoom.id,
              replyMsg.sender_id,
              replyText,
              state.partner
            );
          } catch (e) {
            console.warn('[GamzaChat] reply save note:', e);
          }
        }

        appendMessageUI(replyMsg, false);
        scrollToBottom();
      }, 1000);

    }, 800);
  }

  /**
   * Show/Hide Typing Indicator
   */
  function showTypingIndicator(show) {
    if (!el.typingIndicator) return;
    el.typingIndicator.style.display = show ? 'flex' : 'none';
    if (show) scrollToBottom();
  }

  /**
   * Open Chat with a Specific Product (CTA 클릭 시)
   */
  async function openChatWithProduct(product) {
    console.log('🥔 [GamzaChat] openChatWithProduct:', product);
    if (!product) return;

    // 1. 현재 사용자 조회
    const currentUser = await getCurrentUser();
    state.currentUser = currentUser;

    // 2. 본인 물품인지 확인
    const sellerId = product.seller?.id || product.seller_id;
    if (currentUser && sellerId && String(currentUser.id) === String(sellerId)) {
      showToast('🥔 내가 등록한 상품에는 채팅을 걸 수 없어요!', '🥔');
      return;
    }

    // 3. 모달 오픈
    openModal();

    // 4. 대화방 생성 또는 기존 방 조회
    const buyerId = currentUser.id;
    const targetSellerId = sellerId || 'a1111111-1111-1111-1111-111111111111';

    let room = null;
    if (window.GamzaSupabase && typeof window.GamzaSupabase.getOrCreateChatRoom === 'function') {
      try {
        room = await window.GamzaSupabase.getOrCreateChatRoom(product.id, buyerId, targetSellerId);
      } catch (err) {
        console.warn('[GamzaChat] getOrCreateChatRoom error:', err);
      }
    }

    if (!room) {
      room = {
        id: 'local-room-' + Date.now(),
        product_id: product.id,
        buyer_id: buyerId,
        seller_id: targetSellerId,
        created_at: new Date().toISOString()
      };
    }

    // 5. 방 열기
    await openChatRoom(room, product, product.seller || {
      id: targetSellerId,
      name: '판매자',
      location: product.location || '역삼1동',
      potatoTemp: '36.5℃'
    });
  }

  /**
   * Open Chat List Directly (상단 헤더 또는 FAB 클릭 시)
   */
  async function openChatListModal() {
    console.log('🥔 [GamzaChat] openChatListModal');
    openModal();
    setView('list');
  }

  /**
   * Event Listeners Setup
   */
  function setupEvents() {
    bindElements();

    // Backdrop click
    if (el.backdrop) {
      el.backdrop.addEventListener('click', closeModal);
    }

    // Close button (X)
    if (el.closeBtn) {
      el.closeBtn.addEventListener('click', closeModal);
    }

    // Back to room list button (<)
    if (el.navBackBtn) {
      el.navBackBtn.addEventListener('click', () => {
        setView('list');
      });
    }

    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if ((e.key === 'Escape' || e.key === 'Esc') && state.isOpen) {
        closeModal();
      }
    });

    // Send button
    if (el.sendBtn) {
      el.sendBtn.addEventListener('click', (e) => {
        e.preventDefault();
        sendMessage();
      });
    }

    // Input Enter key to send
    if (el.inputBox) {
      el.inputBox.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
    }

    // Quick replies chips
    if (el.quickRepliesBar) {
      el.quickRepliesBar.addEventListener('click', (e) => {
        const chip = e.target.closest('.quick-reply-chip');
        if (chip) {
          const text = chip.dataset.text || chip.textContent;
          sendMessage(text);
        }
      });
    }

    // Header Chat button click
    if (el.headerChatBtn) {
      el.headerChatBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openChatListModal();
      });
    }

    // FAB Chat button click
    if (el.fabChatBtn) {
      el.fabChatBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openChatListModal();
      });
    }
  }

  /**
   * Initialize on DOM Ready
   */
  function init() {
    setupEvents();
    console.log('🥔 [GamzaChat] Gamza Chat Module Ready.');
  }

  // Export to window
  window.GamzaChat = {
    init,
    openChatWithProduct,
    openChatListModal,
    openChatRoom,
    sendMessage,
    closeModal
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window, document);
