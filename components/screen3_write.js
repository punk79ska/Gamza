/**
 * ==========================================================================
 * 감자마켓(Gamza) - 화면 3: 내 물건 팔기 (글쓰기 모달 컴포넌트)
 * 파일명: screen3_write.js
 * ==========================================================================
 */

(function (window, document) {
  'use strict';

  // 1. 기본 감자 캐릭터 SVG Data URL (포슬포슬 귀여운 햇감자 일러스트)
  const DEFAULT_POTATO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
    <defs>
      <radialGradient id="potatoGrad" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stop-color="#fce3b8"/>
        <stop offset="55%" stop-color="#e0a35e"/>
        <stop offset="100%" stop-color="#b46328"/>
      </radialGradient>
      <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#7f5539" flood-opacity="0.2"/>
      </filter>
    </defs>
    <rect width="240" height="240" rx="36" fill="#fdfbf7"/>
    <!-- 감자 몸체 -->
    <path d="M120 48 C175 44 200 75 196 122 C192 170 160 196 115 196 C68 196 46 160 48 118 C50 72 78 52 120 48 Z" fill="url(#potatoGrad)" filter="url(#softGlow)"/>
    <!-- 감자 새싹 -->
    <path d="M120 47 C118 30 132 20 142 24 C147 36 132 45 120 47 Z" fill="#588157"/>
    <path d="M122 46 C127 34 140 38 136 46 Z" fill="#a3b18a"/>
    <!-- 감자 주근깨 -->
    <circle cx="82" cy="90" r="2.5" fill="#8c4e20" opacity="0.35"/>
    <circle cx="160" cy="98" r="3" fill="#8c4e20" opacity="0.35"/>
    <circle cx="78" cy="145" r="2.5" fill="#8c4e20" opacity="0.35"/>
    <circle cx="152" cy="155" r="2" fill="#8c4e20" opacity="0.35"/>
    <circle cx="115" cy="178" r="2.5" fill="#8c4e20" opacity="0.25"/>
    <!-- 볼터치 -->
    <ellipse cx="86" cy="126" rx="8" ry="4.5" fill="#ff758f" opacity="0.55"/>
    <ellipse cx="154" cy="126" rx="8" ry="4.5" fill="#ff758f" opacity="0.55"/>
    <!-- 눈 -->
    <circle cx="98" cy="116" r="5.5" fill="#2c2523"/>
    <circle cx="142" cy="116" r="5.5" fill="#2c2523"/>
    <circle cx="96" cy="114" r="2" fill="#ffffff"/>
    <circle cx="140" cy="114" r="2" fill="#ffffff"/>
    <!-- 미소 입 -->
    <path d="M112 126 Q120 135 128 126" fill="none" stroke="#2c2523" stroke-width="2.8" stroke-linecap="round"/>
  </svg>`;

  const DEFAULT_POTATO_DATA_URL = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(DEFAULT_POTATO_SVG);

  // 카테고리 목록 정의
  const WRITE_CATEGORIES = [
    "디지털기기",
    "가구/인테리어",
    "의류",
    "생활가전",
    "도서/티켓",
    "기타"
  ];

  // 내부 상태 관리 변수
  let currentImageUrl = '';
  let toastTimer = null;
  let isInitialized = false;
  let editingProduct = null; // 수정 모드 시 타겟 상품 객체 (요구사항 1)

  // DOM 요소 캐시
  const elements = {};

  /**
   * DOM 요소 참조 바인딩
   */
  function bindElements() {
    elements.modal = document.getElementById('gamza-write-modal');
    elements.modalTitle = document.getElementById('gamza-write-modal-title');
    elements.submitBtnText = document.querySelector('#btn-submit-write .btn-text');
    elements.form = document.getElementById('gamza-write-form');
    elements.closeButtons = document.querySelectorAll('[data-close-modal]');
    elements.toast = document.getElementById('gamza-write-toast');

    // 이미지 관련
    elements.previewBox = document.getElementById('image-preview-box');
    elements.previewImg = document.getElementById('image-preview-img');
    elements.placeholder = document.getElementById('image-placeholder');
    elements.fileInput = document.getElementById('write-image-file');
    elements.btnTriggerFile = document.getElementById('btn-trigger-file');
    elements.btnUsePotato = document.getElementById('btn-use-default-potato');
    elements.urlInput = document.getElementById('write-image-url');
    elements.btnApplyUrl = document.getElementById('btn-apply-url');
    elements.btnRemoveImg = document.getElementById('btn-remove-image');
    elements.statusMsg = document.querySelector('.image-current-status .status-msg');

    // 필드 관련
    elements.titleInput = document.getElementById('write-title');
    elements.titleCounter = document.getElementById('title-counter');
    elements.categoryChips = document.getElementById('category-chips');
    elements.categoryHidden = document.getElementById('write-category');
    elements.priceInput = document.getElementById('write-price');
    elements.priceFormatted = document.getElementById('price-formatted');
    elements.freeCheckbox = document.getElementById('write-free-sharing');
    elements.locationInput = document.getElementById('write-location');
    elements.quickTags = document.querySelectorAll('.quick-tag');
    elements.descInput = document.getElementById('write-description');
    elements.descCounter = document.getElementById('desc-counter');
    elements.statusRadios = document.querySelectorAll('input[name="write-status"]');
  }

  /**
   * 카테고리 칩 버튼 렌더링
   */
  function renderCategoryChips() {
    if (!elements.categoryChips) return;
    elements.categoryChips.innerHTML = '';

    const icons = {
      "디지털기기": "📱",
      "가구/인테리어": "🛋️",
      "의류": "👕",
      "생활가전": "☕",
      "도서/티켓": "🎟️",
      "기타": "🥔"
    };

    WRITE_CATEGORIES.forEach((cat) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'category-chip-btn';
      chip.dataset.category = cat;
      chip.innerHTML = `<span>${icons[cat] || '✨'}</span><span>${cat}</span>`;
      chip.addEventListener('click', () => selectCategory(cat));
      elements.categoryChips.appendChild(chip);
    });
  }

  /**
   * 카테고리 선택 처리
   */
  function selectCategory(categoryName) {
    if (elements.categoryHidden) {
      elements.categoryHidden.value = categoryName;
    }
    const chips = elements.categoryChips.querySelectorAll('.category-chip-btn');
    chips.forEach((c) => {
      if (c.dataset.category === categoryName) {
        c.classList.add('active');
      } else {
        c.classList.remove('active');
      }
    });
    clearError('category');
  }

  /**
   * 이미지 미리보기 상태 업데이트
   */
  function updateImagePreview(src, isDefault = false) {
    currentImageUrl = src;
    if (src) {
      elements.previewImg.src = src;
      elements.previewImg.classList.remove('hidden');
      elements.placeholder.classList.add('hidden');
      elements.btnRemoveImg.classList.remove('hidden');

      if (isDefault) {
        elements.statusMsg.textContent = '🥔 귀여운 기본 감자 일러스트가 적용되었습니다.';
      } else {
        elements.statusMsg.textContent = '✅ 상품 이미지가 성공적으로 등록되었습니다.';
      }
    } else {
      elements.previewImg.src = '';
      elements.previewImg.classList.add('hidden');
      elements.placeholder.classList.remove('hidden');
      elements.btnRemoveImg.classList.add('hidden');
      elements.statusMsg.textContent = '등록된 이미지가 없습니다. (미등록 시 감자 기본 적용)';
    }
    clearError('imageUrl');
  }

  /**
   * 파일 업로드 처리
   */
  function handleFileSelect(file) {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일(jpg, png, gif, webp 등)만 업로드할 수 있습니다.');
      return;
    }

    // 파일 용량 검사 (10MB 제한)
    if (file.size > 10 * 1024 * 1024) {
      alert('이미지 파일 크기는 최대 10MB까지 가능합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      updateImagePreview(e.target.result, false);
      if (elements.urlInput) elements.urlInput.value = '';
    };
    reader.onerror = function () {
      alert('이미지를 읽는 중 오류가 발생했습니다.');
    };
    reader.readAsDataURL(file);
  }

  /**
   * 이미지 드래그 앤 드롭 설정
   */
  function setupDragAndDrop() {
    if (!elements.previewBox) return;

    ['dragenter', 'dragover'].forEach((eventName) => {
      elements.previewBox.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        elements.previewBox.classList.add('drag-over');
      });
    });

    ['dragleave', 'drop'].forEach((eventName) => {
      elements.previewBox.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        elements.previewBox.classList.remove('drag-over');
      });
    });

    elements.previewBox.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      if (dt && dt.files && dt.files.length > 0) {
        handleFileSelect(dt.files[0]);
      }
    });

    elements.previewBox.addEventListener('click', () => {
      if (elements.fileInput) elements.fileInput.click();
    });
  }

  /**
   * 에러 메시지 표시
   */
  function showError(fieldKey, message) {
    const errorEl = document.getElementById(`error-${fieldKey}`);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('visible');
    }

    const inputEl = document.getElementById(`write-${fieldKey}`);
    if (inputEl) {
      inputEl.classList.add('input-error');
      inputEl.focus();
    }
  }

  /**
   * 에러 메시지 제거
   */
  function clearError(fieldKey) {
    const errorEl = document.getElementById(`error-${fieldKey}`);
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.remove('visible');
    }

    const inputEl = document.getElementById(`write-${fieldKey}`);
    if (inputEl) {
      inputEl.classList.remove('input-error');
    }
  }

  /**
   * 모든 에러 메시지 초기화
   */
  function clearAllErrors() {
    const errorEls = document.querySelectorAll('.field-error-msg');
    errorEls.forEach((el) => {
      el.textContent = '';
      el.classList.remove('visible');
    });

    const errorInputs = document.querySelectorAll('.input-error');
    errorInputs.forEach((el) => el.classList.remove('input-error'));
  }

  /**
   * 가격 포맷팅 헬퍼 (세 자리 콤마)
   */
  function formatPriceDisplay(value) {
    if (!elements.priceFormatted) return;
    if (value === '' || isNaN(value)) {
      elements.priceFormatted.textContent = '';
      return;
    }
    const num = Number(value);
    if (num === 0) {
      elements.priceFormatted.textContent = '무료 나눔 🥔';
    } else {
      elements.priceFormatted.textContent = `${num.toLocaleString('ko-KR')}원`;
    }
  }

  /**
   * 상태 라디오 칩 스타일 동기화
   */
  function updateStatusChipsStyle() {
    elements.statusRadios.forEach((radio) => {
      const parentLabel = radio.closest('.status-chip');
      if (!parentLabel) return;

      parentLabel.classList.remove('is-active-sale', 'is-active-reserved', 'is-active-sold');

      if (radio.checked) {
        if (radio.value === '판매중') parentLabel.classList.add('is-active-sale');
        if (radio.value === '예약중') parentLabel.classList.add('is-active-reserved');
        if (radio.value === '거래 완료') parentLabel.classList.add('is-active-sold');
      }
    });
  }

  /**
   * 감자 토스트 팝업 표시
   */
  function showToast(message, duration = 3000) {
    if (!elements.toast) return;
    elements.toast.innerHTML = `<span>🥔</span><span>${message}</span>`;
    elements.toast.classList.add('show');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      elements.toast.classList.remove('show');
    }, duration);
  }

  /**
   * 폼 작성 여부 체크 (닫기 전 컨펌용)
   */
  function hasUserEnteredContent() {
    if (!elements.form) return false;
    const title = elements.titleInput ? elements.titleInput.value.trim() : '';
    const desc = elements.descInput ? elements.descInput.value.trim() : '';
    const price = elements.priceInput ? elements.priceInput.value.trim() : '';
    const hasCustomImg = currentImageUrl && currentImageUrl !== DEFAULT_POTATO_DATA_URL;

    return Boolean(title || desc || (price && price !== '0') || hasCustomImg);
  }

  /**
   * 폼 데이터 초기화
   */
  function resetForm() {
    if (!elements.form) return;
    elements.form.reset();

    // 이미지 초기화 (기본 감자 적용)
    updateImagePreview(DEFAULT_POTATO_DATA_URL, true);

    // 카테고리 칩 선택 해제
    if (elements.categoryChips) {
      const chips = elements.categoryChips.querySelectorAll('.category-chip-btn');
      chips.forEach((c) => c.classList.remove('active'));
    }
    if (elements.categoryHidden) elements.categoryHidden.value = '';

    // 글자 수 카운터 초기화
    if (elements.titleCounter) elements.titleCounter.textContent = '0/60';
    if (elements.descCounter) elements.descCounter.textContent = '0/500';
    if (elements.priceFormatted) elements.priceFormatted.textContent = '';

    // 가격 인풋 활성화
    if (elements.priceInput) {
      elements.priceInput.disabled = false;
    }

    // 기본 동네 값 설정
    if (elements.locationInput) {
      elements.locationInput.value = '강남구 역삼1동';
    }

    // 기본 판매 상태 설정
    const defaultRadio = document.querySelector('input[name="write-status"][value="판매중"]');
    if (defaultRadio) {
      defaultRadio.checked = true;
      updateStatusChipsStyle();
    }

    clearAllErrors();
  }

  /**
   * 모달 열기 (신규 등록 모드)
   */
  function openWriteModal() {
    if (!elements.modal) bindElements();
    if (!elements.modal) return;

    editingProduct = null;
    if (elements.modalTitle) {
      elements.modalTitle.textContent = '내 물건 팔기';
    }
    if (elements.submitBtnText) {
      elements.submitBtnText.textContent = '작성 완료';
    }

    resetForm();

    elements.modal.classList.add('is-open');
    elements.modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // 모달 열릴 때 현재 로그인 유저의 활동 동네가 있으면 자동 반영
    if (window.GamzaAuth && typeof window.GamzaAuth.getCurrentUserProfile === 'function') {
      const user = window.GamzaAuth.getCurrentUserProfile();
      if (user && user.activity_location && elements.locationInput && (!elements.locationInput.value || elements.locationInput.value === '강남구 역삼1동')) {
        elements.locationInput.value = user.activity_location;
      }
    }

    // 기본 감자 일러스트가 없으면 적용
    if (!currentImageUrl) {
      updateImagePreview(DEFAULT_POTATO_DATA_URL, true);
    }

    // 첫 번째 인풋으로 부드럽게 포커스 이동
    setTimeout(() => {
      if (elements.titleInput) {
        elements.titleInput.focus();
      }
    }, 150);
  }

  /**
   * 모달 열기 (게시글 수정 모드 - 요구사항 1)
   */
  function openEditModal(productToEdit) {
    if (!productToEdit) return;
    if (!elements.modal) bindElements();
    if (!elements.modal) return;

    editingProduct = productToEdit;
    console.log('🥔 [GamzaScreen3] Opening in edit mode for product:', productToEdit.id);

    // 1) 헤더 타이틀 및 제출 버튼 텍스트 변경
    if (elements.modalTitle) {
      elements.modalTitle.textContent = '게시글 수정';
    }
    if (elements.submitBtnText) {
      elements.submitBtnText.textContent = '수정 완료';
    }

    // 2) 기존 상품 데이터 폼에 채우기
    setFormData({
      title: productToEdit.title || '',
      category: productToEdit.category || '',
      price: productToEdit.price !== undefined ? productToEdit.price : '',
      location: productToEdit.location || '',
      status: productToEdit.status || '판매중',
      imageUrl: productToEdit.imageUrl || '',
      description: productToEdit.description || ''
    });

    // 3) 모달 활성화
    elements.modal.classList.add('is-open');
    elements.modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
      if (elements.titleInput) {
        elements.titleInput.focus();
      }
    }, 150);
  }

  /**
   * 모달 닫기
   * @param {boolean} force - 사용자 확인 없이 강제 닫기 여부
   */
  function closeWriteModal(force = false) {
    if (!elements.modal) return;

    if (!force && hasUserEnteredContent() && !editingProduct) {
      const leave = confirm('작성 중인 내용이 사라집니다. 글쓰기를 종료하시겠습니까?');
      if (!leave) return;
    }

    elements.modal.classList.remove('is-open');
    elements.modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    clearAllErrors();
    editingProduct = null;
  }

  /**
   * 폼 유효성 검사 및 데이터 수집
   */
  function validateAndGetProduct() {
    clearAllErrors();
    let isValid = true;
    let firstErrorField = null;

    // 1. 상품명 검사
    const title = elements.titleInput ? elements.titleInput.value.trim() : '';
    if (!title || title.length < 2) {
      showError('title', '상품명을 최소 2글자 이상 입력해주세요.');
      if (!firstErrorField) firstErrorField = 'title';
      isValid = false;
    }

    // 2. 카테고리 검사
    const category = elements.categoryHidden ? elements.categoryHidden.value : '';
    if (!category) {
      showError('category', '카테고리를 1개 선택해주세요.');
      if (!firstErrorField) firstErrorField = 'category';
      isValid = false;
    }

    // 3. 가격 검사
    const isFree = elements.freeCheckbox ? elements.freeCheckbox.checked : false;
    const priceRaw = elements.priceInput ? elements.priceInput.value : '';
    let priceNum = 0;

    if (!isFree) {
      if (priceRaw === '' || isNaN(priceRaw) || Number(priceRaw) < 0) {
        showError('price', '가격을 올바른 숫자로 입력해주세요. (0원 나눔은 나눔하기 체크)');
        if (!firstErrorField) firstErrorField = 'price';
        isValid = false;
      } else {
        priceNum = Number(priceRaw);
      }
    }

    // 4. 거래 동네 검사
    const location = elements.locationInput ? elements.locationInput.value.trim() : '';
    if (!location || location.length < 2) {
      showError('location', '거래 희망 동네를 입력해주세요 (예: 역삼동).');
      if (!firstErrorField) firstErrorField = 'location';
      isValid = false;
    }

    // 5. 판매 상태 검사
    let status = '판매중';
    const checkedStatus = document.querySelector('input[name="write-status"]:checked');
    if (checkedStatus) {
      status = checkedStatus.value;
    }

    // 6. 자세한 설명 검사
    const description = elements.descInput ? elements.descInput.value.trim() : '';
    if (!description || description.length < 5) {
      showError('description', '설명을 최소 5자 이상 적어주세요.');
      if (!firstErrorField) firstErrorField = 'description';
      isValid = false;
    } else if (description.length > 500) {
      showError('description', '설명은 최대 500자까지 작성할 수 있습니다.');
      if (!firstErrorField) firstErrorField = 'description';
      isValid = false;
    }

    if (!isValid) {
      return null;
    }

    // 현재 로그인된 유저 프로필 조회 (Req 4: 글 등록 시 작성자가 데이터베이스에 함께 저장)
    const currentUser = (window.GamzaAuth && typeof window.GamzaAuth.getCurrentUserProfile === 'function')
      ? window.GamzaAuth.getCurrentUserProfile()
      : null;

    const sellerName = currentUser ? currentUser.nickname : "포슬포슬감자";
    const sellerLoc = location || (currentUser ? currentUser.activity_location : "강남구 역삼1동");
    const sellerTemp = currentUser && currentUser.potato_temp ? `${Number(currentUser.potato_temp).toFixed(1)}℃` : "36.5℃";
    const sellerImg = (currentUser && currentUser.profile_img) || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80";

    // 신규 상품 객체 생성
    const newProduct = {
      id: Date.now(),
      title: title,
      category: category,
      price: priceNum,
      location: location,
      timeAgo: "방금 전",
      status: status,
      imageUrl: currentImageUrl || DEFAULT_POTATO_DATA_URL,
      description: description,
      seller: {
        id: currentUser ? currentUser.id : undefined,
        name: sellerName,
        profileImg: sellerImg,
        location: sellerLoc,
        potatoTemp: sellerTemp
      },
      likes: 0
    };

    return newProduct;
  }

  /**
   * 폼 전송 이벤트 핸들러
   */
  function handleFormSubmit(e) {
    if (e) e.preventDefault();

    const productData = validateAndGetProduct();
    if (!productData) return;

    // 1) 수정 모드인 경우 (요구사항 1)
    if (editingProduct) {
      console.log('🥔 [GamzaScreen3] Submitting updated product:', editingProduct.id, productData);
      const updatedProduct = {
        ...editingProduct,
        title: productData.title,
        category: productData.category,
        price: productData.price,
        location: productData.location,
        status: productData.status,
        imageUrl: productData.imageUrl,
        description: productData.description
      };

      // 전역 이벤트 브릿지 호출
      if (window.GamzaEvents && typeof window.GamzaEvents.updateProduct === 'function') {
        try {
          window.GamzaEvents.updateProduct(editingProduct.id, updatedProduct);
        } catch (err) {
          console.error('GamzaEvents.updateProduct 실행 에러:', err);
        }
      }

      // 커스텀 이벤트 발행
      try {
        const customEvt = new CustomEvent('gamza:product-updated', {
          detail: { productId: editingProduct.id, product: updatedProduct },
          bubbles: true
        });
        window.dispatchEvent(customEvt);
      } catch (err) {
        console.warn('CustomEvent dispatch error:', err);
      }

      // 토스트 알림 및 정리
      showToast(`"${updatedProduct.title}" 상품이 성공적으로 수정되었습니다! 🥔`);
      closeWriteModal(true);
      resetForm();
      editingProduct = null;
      return;
    }

    // 2) 신규 등록 모드인 경우
    const newProduct = productData;

    // 1) 전역 이벤트 콜백 호출
    if (window.GamzaEvents && typeof window.GamzaEvents.addProduct === 'function') {
      try {
        window.GamzaEvents.addProduct(newProduct);
      } catch (err) {
        console.error('GamzaEvents.addProduct 실행 에러:', err);
      }
    }

    // 2) CustomEvent 발행 (다른 모듈들과의 유연한 연동)
    try {
      const customEvt = new CustomEvent('gamza:product-added', {
        detail: newProduct,
        bubbles: true
      });
      window.dispatchEvent(customEvt);
    } catch (err) {
      console.warn('CustomEvent dispatch error:', err);
    }

    // 3) 토스트 알림 표시
    showToast(`"${newProduct.title}" 상품이 감자마켓에 등록되었습니다! 🥔`);

    // 4) 모달 닫기 및 폼 초기화
    closeWriteModal(true);
    resetForm();
  }

  /**
   * 이벤트 리스너 등록
   */
  function setupEventListeners() {
    // 닫기 버튼들 (X버튼, 취소 버튼, 백드롭 클릭)
    elements.closeButtons.forEach((btn) => {
      btn.addEventListener('click', () => closeWriteModal(false));
    });

    // ESC 키 입력 시 닫기
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && elements.modal && elements.modal.classList.contains('is-open')) {
        closeWriteModal(false);
      }
    });

    // 이미지 파일 선택
    if (elements.btnTriggerFile && elements.fileInput) {
      elements.btnTriggerFile.addEventListener('click', () => elements.fileInput.click());
      elements.fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          handleFileSelect(e.target.files[0]);
        }
      });
    }

    // 귀여운 기본 감자 일러스트 적용 버튼
    if (elements.btnUsePotato) {
      elements.btnUsePotato.addEventListener('click', () => {
        updateImagePreview(DEFAULT_POTATO_DATA_URL, true);
        if (elements.urlInput) elements.urlInput.value = '';
        if (elements.fileInput) elements.fileInput.value = '';
      });
    }

    // 웹 이미지 URL 직접 적용
    if (elements.btnApplyUrl && elements.urlInput) {
      elements.btnApplyUrl.addEventListener('click', () => {
        const url = elements.urlInput.value.trim();
        if (!url) {
          alert('웹 이미지 링크(URL)를 입력해주세요.');
          return;
        }
        if (!/^https?:\/\//i.test(url)) {
          alert('http:// 또는 https:// 로 시작하는 올바른 URL을 입력해주세요.');
          return;
        }

        // 이미지 로드 검증
        const testImg = new Image();
        testImg.onload = function () {
          updateImagePreview(url, false);
        };
        testImg.onerror = function () {
          alert('이미지를 불러올 수 없는 URL입니다. 주소를 다시 확인해주세요.');
        };
        testImg.src = url;
      });
    }

    // 이미지 제거 버튼
    if (elements.btnRemoveImg) {
      elements.btnRemoveImg.addEventListener('click', () => {
        updateImagePreview('', false);
        if (elements.urlInput) elements.urlInput.value = '';
        if (elements.fileInput) elements.fileInput.value = '';
      });
    }

    // 제목 글자 수 카운터 & 에러 해제
    if (elements.titleInput) {
      elements.titleInput.addEventListener('input', () => {
        const len = elements.titleInput.value.length;
        if (elements.titleCounter) elements.titleCounter.textContent = `${len}/60`;
        if (len >= 2) clearError('title');
      });
    }

    // 설명 글자 수 카운터 & 에러 해제
    if (elements.descInput) {
      elements.descInput.addEventListener('input', () => {
        if (elements.descInput.value.length > 500) {
          elements.descInput.value = elements.descInput.value.slice(0, 500);
        }
        const len = elements.descInput.value.length;
        if (elements.descCounter) elements.descCounter.textContent = `${len}/500`;
        if (len >= 5) clearError('description');
      });
    }

    // 가격 인풋 및 포맷팅
    if (elements.priceInput) {
      elements.priceInput.addEventListener('input', () => {
        formatPriceDisplay(elements.priceInput.value);
        if (elements.priceInput.value !== '') clearError('price');
      });
    }

    // 무료 나눔 체크박스
    if (elements.freeCheckbox && elements.priceInput) {
      elements.freeCheckbox.addEventListener('change', () => {
        if (elements.freeCheckbox.checked) {
          elements.priceInput.value = '0';
          elements.priceInput.disabled = true;
          formatPriceDisplay('0');
          clearError('price');
        } else {
          elements.priceInput.disabled = false;
          elements.priceInput.value = '';
          formatPriceDisplay('');
        }
      });
    }

    // 거래 동네 빠른 선택 태그
    elements.quickTags.forEach((tag) => {
      tag.addEventListener('click', () => {
        const loc = tag.dataset.loc || tag.textContent;
        if (elements.locationInput) {
          elements.locationInput.value = loc;
          clearError('location');
        }
      });
    });

    if (elements.locationInput) {
      elements.locationInput.addEventListener('input', () => {
        if (elements.locationInput.value.trim().length >= 2) clearError('location');
      });
    }

    // 판매 상태 라디오 변경
    elements.statusRadios.forEach((radio) => {
      radio.addEventListener('change', updateStatusChipsStyle);
    });

    // 폼 제출
    if (elements.form) {
      elements.form.addEventListener('submit', handleFormSubmit);
    }
  }

  /**
   * Screen3 글쓰기 컴포넌트 초기화
   */
  function initScreen3() {
    if (isInitialized) return;
    bindElements();
    if (!elements.modal) return;

    renderCategoryChips();
    setupDragAndDrop();
    setupEventListeners();
    updateStatusChipsStyle();
    updateImagePreview(DEFAULT_POTATO_DATA_URL, true);

    isInitialized = true;
  }

  /**
   * 외부 조작을 위한 게터/세터 API
   */
  function getFormData() {
    return {
      title: elements.titleInput ? elements.titleInput.value : '',
      category: elements.categoryHidden ? elements.categoryHidden.value : '',
      price: elements.priceInput ? elements.priceInput.value : '',
      isFree: elements.freeCheckbox ? elements.freeCheckbox.checked : false,
      location: elements.locationInput ? elements.locationInput.value : '',
      status: (document.querySelector('input[name="write-status"]:checked') || {}).value || '판매중',
      imageUrl: currentImageUrl,
      description: elements.descInput ? elements.descInput.value : ''
    };
  }

  function setFormData(data = {}) {
    if (data.title && elements.titleInput) elements.titleInput.value = data.title;
    if (data.category) selectCategory(data.category);
    if (data.price !== undefined && elements.priceInput) {
      elements.priceInput.value = data.price;
      formatPriceDisplay(data.price);
    }
    if (data.location && elements.locationInput) elements.locationInput.value = data.location;
    if (data.description && elements.descInput) {
      elements.descInput.value = data.description.slice(0, 500);
      if (elements.descCounter) {
        elements.descCounter.textContent = `${elements.descInput.value.length}/500`;
      }
    }
    if (data.imageUrl) updateImagePreview(data.imageUrl, false);
    if (data.status) {
      const targetRadio = document.querySelector(`input[name="write-status"][value="${data.status}"]`);
      if (targetRadio) {
        targetRadio.checked = true;
        updateStatusChipsStyle();
      }
    }
  }

  // 글로벌 네임스페이스 공개
  window.GamzaScreen3 = {
    initScreen3,
    openWriteModal,
    openEditModal,
    closeWriteModal,
    resetForm,
    getFormData,
    setFormData,
    showToast,
    selectCategory,
    updateImagePreview,
    DEFAULT_POTATO_DATA_URL,
    CATEGORIES: WRITE_CATEGORIES
  };

  // DOMContentLoaded 시 자동 초기화 시도
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScreen3);
  } else {
    initScreen3();
  }

})(window, document);
