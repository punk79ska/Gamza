/**
 * ============================================================================
 * Gamza Market - Supabase Authentication & User Profile Manager (shared/auth.js)
 * Module: window.GamzaAuth
 * ============================================================================
 */

(function (window, document) {
  'use strict';

  // Internal Auth State
  let currentUser = null;        // Cached profile { id, email, nickname, activity_location, potato_temp, profile_img }
  let currentMode = 'signin';    // 'signin' | 'signup'
  let pendingAction = null;      // Callback to execute after successful login
  let isInitialized = false;

  // Cached DOM Elements
  const el = {};

  /**
   * Helper: Global Toast Notification
   */
  function showToast(message) {
    if (window.GamzaScreen1 && typeof window.GamzaScreen1.showToast === 'function') {
      window.GamzaScreen1.showToast(message);
    } else if (window.GamzaScreen2 && typeof window.GamzaScreen2.showToast === 'function') {
      window.GamzaScreen2.showToast(message);
    } else {
      console.log('🥔 [GamzaAuth Toast]', message);
      // Fallback simple toast
      const toastContainer = document.getElementById('gamza-toast-container') || document.body;
      const toast = document.createElement('div');
      toast.className = 'gamza-toast';
      toast.innerHTML = `<span>🥔</span><span>${message}</span>`;
      toastContainer.appendChild(toast);
      setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
      }, 2800);
    }
  }

  /**
   * Get Supabase Client Instance
   */
  function getSupabase() {
    if (window.GamzaSupabase && window.GamzaSupabase.client) {
      return window.GamzaSupabase.client;
    }
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      const SUPABASE_URL = 'https://hgxwwflcvwowowrsqnah.supabase.co';
      const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhneHd3Zmxjdndvd293cnNxbmFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM0NzMzNjksImV4cCI6MjEwOTA0OTM2OX0.QQe94qdEvo9t-ChO_RwpEBNCS4qBTYm6rAsv_L-ngjo';
      return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    console.error('[GamzaAuth] Supabase SDK not available.');
    return null;
  }

  /**
   * Generate Cute Potato Nickname (for 추천 button or default)
   */
  function generateRandomPotatoNickname() {
    const adjectives = [
      '포슬포슬한', '따끈따끈한', '말랑말랑한', '달콤바삭한', '노릇노릇한',
      '행복한', '용감한', '보슬보슬', '든든한', '황금빛', '귀여운', '갓찐'
    ];
    const nouns = [
      '감자', '알감자', '왕감자', '구황작물', '햇감자', '감자전', '찐감자', '감자튀김', '감자버터구이'
    ];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(100 + Math.random() * 900);
    return `${adj}${noun}_${num}`;
  }

  /**
   * Bind DOM Elements
   */
  function bindElements() {
    el.modal = document.getElementById('gamza-auth-modal');
    el.backdrop = document.getElementById('auth-modal-backdrop');
    el.closeBtn = document.getElementById('btn-close-auth-modal');
    el.title = document.getElementById('auth-modal-title');
    el.subDesc = document.getElementById('auth-sub-desc');

    el.tabSignIn = document.getElementById('tab-btn-signin');
    el.tabSignUp = document.getElementById('tab-btn-signup');

    el.form = document.getElementById('gamza-auth-form');
    el.alertBox = document.getElementById('auth-alert-box');

    el.fieldNickname = document.getElementById('field-group-nickname');
    el.inputNickname = document.getElementById('auth-nickname');
    el.btnRandomNick = document.getElementById('btn-random-nickname');

    el.fieldLocation = document.getElementById('field-group-location');
    el.inputLocation = document.getElementById('auth-location');

    el.inputEmail = document.getElementById('auth-email');
    el.inputPassword = document.getElementById('auth-password');
    el.btnTogglePassword = document.getElementById('btn-toggle-password');

    el.btnSubmit = document.getElementById('btn-auth-submit');
    el.submitText = el.btnSubmit ? el.btnSubmit.querySelector('.btn-text') : null;

    el.switchText = document.getElementById('auth-switch-text');
    el.btnSwitchMode = document.getElementById('btn-switch-auth-mode');

    // Header elements
    el.headerLoggedOut = document.getElementById('auth-logged-out');
    el.headerLoggedIn = document.getElementById('auth-logged-in');
    el.headerUserNickname = document.getElementById('header-user-nickname');
    el.headerUserTemp = document.getElementById('header-user-temp');
    el.btnLogin = document.getElementById('btn-login');
    el.btnLogout = document.getElementById('btn-logout');
  }

  /**
   * Alert Box Helper
   */
  function showAlert(msg, type = 'error') {
    if (!el.alertBox) return;
    el.alertBox.className = `auth-alert-box alert-${type}`;
    const icon = type === 'error' ? '⚠️' : (type === 'success' ? '✅' : 'ℹ️');
    el.alertBox.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
    el.alertBox.classList.remove('hidden');
  }

  function clearAlert() {
    if (!el.alertBox) return;
    el.alertBox.className = 'auth-alert-box hidden';
    el.alertBox.innerHTML = '';
  }

  /**
   * Switch between 'signin' and 'signup' modes
   */
  function setAuthMode(mode) {
    currentMode = mode;
    clearAlert();

    if (mode === 'signin') {
      if (el.tabSignIn) el.tabSignIn.classList.add('active');
      if (el.tabSignUp) el.tabSignUp.classList.remove('active');
      if (el.title) el.title.textContent = '감자마켓 로그인';
      if (el.subDesc) el.subDesc.textContent = '포슬포슬 따뜻한 이웃과의 거래를 시작해보세요!';

      if (el.fieldNickname) el.fieldNickname.classList.add('hidden');
      if (el.fieldLocation) el.fieldLocation.classList.add('hidden');

      if (el.submitText) el.submitText.textContent = '로그인하기';
      if (el.switchText) el.switchText.textContent = '아직 감자 계정이 없으신가요?';
      if (el.btnSwitchMode) el.btnSwitchMode.textContent = '회원가입하기';
    } else {
      if (el.tabSignIn) el.tabSignIn.classList.remove('active');
      if (el.tabSignUp) el.tabSignUp.classList.add('active');
      if (el.title) el.title.textContent = '감자마켓 회원가입';
      if (el.subDesc) el.subDesc.textContent = '간단한 가입으로 따뜻한 우리 동네 이웃이 되어보세요!';

      if (el.fieldNickname) el.fieldNickname.classList.remove('hidden');
      if (el.fieldLocation) el.fieldLocation.classList.remove('hidden');

      // Autofill random nickname if empty
      if (el.inputNickname && !el.inputNickname.value.trim()) {
        el.inputNickname.value = generateRandomPotatoNickname();
      }

      if (el.submitText) el.submitText.textContent = '감자마켓 가입 완료';
      if (el.switchText) el.switchText.textContent = '이미 계정이 있으신가요?';
      if (el.btnSwitchMode) el.btnSwitchMode.textContent = '로그인하기';
    }
  }

  /**
   * Update Header Actions Based on Auth State (Req 2)
   * - 로그인 전: [로그인] 버튼만 표시
   * - 로그인 후: [로그인] 버튼 숨김 처리, [닉네임]과 [로그아웃] 버튼만 표시
   */
  function updateHeaderUI(user) {
    if (!el.headerLoggedOut || !el.headerLoggedIn) {
      bindElements();
    }

    if (user && user.id) {
      // Logged IN: hide [로그인], show [닉네임] & [로그아웃]
      if (el.headerLoggedOut) el.headerLoggedOut.classList.add('hidden');
      if (el.headerLoggedIn) el.headerLoggedIn.classList.remove('hidden');

      const nick = user.nickname || '감자이웃';
      const temp = user.potato_temp ? `${Number(user.potato_temp).toFixed(1)}℃` : '36.5℃';

      if (el.headerUserNickname) {
        el.headerUserNickname.textContent = nick;
        el.headerUserNickname.title = `${nick}님의 프로필`;
      }
      if (el.headerUserTemp) {
        el.headerUserTemp.textContent = temp;
      }
    } else {
      // Logged OUT: show [로그인] only, hide [닉네임] & [로그아웃]
      if (el.headerLoggedOut) el.headerLoggedOut.classList.remove('hidden');
      if (el.headerLoggedIn) el.headerLoggedIn.classList.add('hidden');
    }
  }

  /**
   * Fetch or sync user profile from public.user_profiles
   */
  async function syncUserProfile(authUser, fallbackNickname = null, fallbackLocation = null) {
    const client = getSupabase();
    if (!client || !authUser) return null;

    try {
      // 1. Check existing record in user_profiles
      const { data: existing, error } = await client
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (existing && !error) {
        currentUser = {
          id: existing.id,
          email: authUser.email,
          nickname: existing.nickname,
          activity_location: existing.activity_location || '역삼1동',
          potato_temp: existing.potato_temp || 36.5,
          profile_img: existing.profile_img || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
        };
        updateHeaderUI(currentUser);
        return currentUser;
      }

      // 2. If not found in user_profiles, create one
      const nick = fallbackNickname || authUser.user_metadata?.nickname || generateRandomPotatoNickname();
      const loc = fallbackLocation || authUser.user_metadata?.location || '강남구 역삼1동';

      const newRecord = {
        id: authUser.id,
        nickname: nick,
        activity_location: loc,
        potato_temp: 36.5,
        profile_img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
      };

      const { data: inserted, error: insertErr } = await client
        .from('user_profiles')
        .upsert(newRecord)
        .select()
        .single();

      if (insertErr) {
        console.warn('[GamzaAuth] user_profiles insert fallback warning:', insertErr);
      }

      currentUser = {
        id: authUser.id,
        email: authUser.email,
        nickname: inserted ? inserted.nickname : nick,
        activity_location: inserted ? inserted.activity_location : loc,
        potato_temp: inserted ? inserted.potato_temp : 36.5,
        profile_img: inserted ? inserted.profile_img : newRecord.profile_img
      };

      updateHeaderUI(currentUser);
      return currentUser;
    } catch (err) {
      console.error('[GamzaAuth] syncUserProfile failed:', err);
      currentUser = {
        id: authUser.id,
        email: authUser.email,
        nickname: fallbackNickname || '감자이웃',
        activity_location: '역삼1동',
        potato_temp: 36.5,
        profile_img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
      };
      updateHeaderUI(currentUser);
      return currentUser;
    }
  }

  /**
   * Open Auth Modal
   */
  function openAuthModal(mode = 'signin', noticeMessage = null) {
    bindElements();
    if (!el.modal) return;

    setAuthMode(mode);

    if (noticeMessage) {
      showAlert(noticeMessage, 'info');
    }

    el.modal.classList.add('is-open');
    el.modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('gamza-modal-open');

    // Autofocus appropriate input
    setTimeout(() => {
      if (mode === 'signup' && el.inputNickname) {
        el.inputNickname.focus();
      } else if (el.inputEmail) {
        el.inputEmail.focus();
      }
    }, 100);
  }

  /**
   * Close Auth Modal
   */
  function closeAuthModal() {
    if (!el.modal) return;
    el.modal.classList.remove('is-open');
    el.modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('gamza-modal-open');
    clearAlert();
  }

  /**
   * Execute Pending Action after Auth (Req 3: 로그인 성공 시 글쓰기 창 열기)
   */
  function executePendingAction() {
    if (typeof pendingAction === 'function') {
      const action = pendingAction;
      pendingAction = null; // Clear first to prevent double-firing
      console.log('🥔 [GamzaAuth] Executing pending action after login...');
      setTimeout(() => {
        try {
          action();
        } catch (err) {
          console.error('[GamzaAuth] Error executing pending action:', err);
        }
      }, 150);
    }
  }

  /**
   * Form Submit Handler: Sign In or Sign Up
   */
  async function handleAuthSubmit(e) {
    if (e) e.preventDefault();
    clearAlert();

    const client = getSupabase();
    if (!client) {
      showAlert('Supabase 클라이언트가 연결되지 않았습니다.', 'error');
      return;
    }

    const email = el.inputEmail ? el.inputEmail.value.trim() : '';
    const password = el.inputPassword ? el.inputPassword.value : '';

    if (!email) {
      showAlert('이메일 주소를 입력해주세요.', 'error');
      if (el.inputEmail) el.inputEmail.focus();
      return;
    }
    if (!password) {
      showAlert('비밀번호를 입력해주세요.', 'error');
      if (el.inputPassword) el.inputPassword.focus();
      return;
    }
    if (password.length < 6) {
      showAlert('비밀번호는 최소 6자리 이상이어야 합니다.', 'error');
      if (el.inputPassword) el.inputPassword.focus();
      return;
    }

    // Set Loading UI
    if (el.btnSubmit) el.btnSubmit.disabled = true;
    const originalText = el.submitText ? el.submitText.textContent : '';
    if (el.submitText) el.submitText.textContent = '처리 중... 🥔';

    try {
      if (currentMode === 'signin') {
        // ====================================================================
        // [1] 로그인 (Sign In)
        // ====================================================================
        const { data, error } = await client.auth.signInWithPassword({
          email: email,
          password: password
        });

        if (error) {
          console.warn('[GamzaAuth] Sign in failed:', error);
          if (error.message.includes('Invalid login credentials')) {
            showAlert('이메일 또는 비밀번호가 올바르지 않습니다.', 'error');
          } else if (error.message.includes('Email not confirmed')) {
            showAlert('이메일 인증이 필요합니다. 메일함을 확인해주세요.', 'error');
          } else {
            showAlert(`로그인 실패: ${error.message}`, 'error');
          }
          return;
        }

        if (data && data.user) {
          const profile = await syncUserProfile(data.user);
          const welcomeNick = profile ? profile.nickname : '이웃';
          showToast(`🥔 '${welcomeNick}'님, 반가워요! 로그인되었습니다.`);
          closeAuthModal();
          executePendingAction();
        }

      } else {
        // ====================================================================
        // [2] 회원가입 (Sign Up) - 닉네임 필수 검증 포함
        // ====================================================================
        const nickname = el.inputNickname ? el.inputNickname.value.trim() : '';
        const location = el.inputLocation ? el.inputLocation.value.trim() : '강남구 역삼1동';

        if (!nickname) {
          showAlert('감자마켓에서 사용할 닉네임을 꼭 입력해주세요!', 'error');
          if (el.inputNickname) el.inputNickname.focus();
          return;
        }

        if (nickname.length < 2 || nickname.length > 20) {
          showAlert('닉네임은 2자 이상 20자 이하로 입력해주세요.', 'error');
          if (el.inputNickname) el.inputNickname.focus();
          return;
        }

        // 닉네임 중복 사전 확인
        const { data: existingNick } = await client
          .from('user_profiles')
          .select('id')
          .eq('nickname', nickname)
          .maybeSingle();

        if (existingNick) {
          showAlert(`'${nickname}'은(는) 이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요.`, 'error');
          if (el.inputNickname) el.inputNickname.focus();
          return;
        }

        // Supabase Auth 회원가입 호출
        const { data, error } = await client.auth.signUp({
          email: email,
          password: password,
          options: {
            data: {
              nickname: nickname,
              location: location
            }
          }
        });

        if (error) {
          console.warn('[GamzaAuth] Sign up failed:', error);
          if (error.message.includes('User already registered')) {
            showAlert('이미 가입된 이메일 주소입니다. 로그인 탭으로 전환해주세요.', 'error');
          } else if (error.message.includes('Password should be at least')) {
            showAlert('비밀번호는 최소 6자 이상이어야 합니다.', 'error');
          } else {
            showAlert(`회원가입 실패: ${error.message}`, 'error');
          }
          return;
        }

        if (data && data.user) {
          // user_profiles에 닉네임 즉시 저장
          const profile = await syncUserProfile(data.user, nickname, location);
          showToast(`🥔 '${profile ? profile.nickname : nickname}'님, 감자마켓 가입을 환영합니다!`);
          closeAuthModal();
          executePendingAction();
        } else {
          showAlert('가입 인증 메일이 발송되었습니다. 메일함의 링크를 확인해주세요!', 'info');
        }
      }

    } catch (err) {
      console.error('[GamzaAuth] Unexpected auth error:', err);
      showAlert(`오류가 발생했습니다: ${err.message || '다시 시도해주세요.'}`, 'error');
    } finally {
      if (el.btnSubmit) el.btnSubmit.disabled = false;
      if (el.submitText) el.submitText.textContent = originalText;
    }
  }

  /**
   * Sign Out
   */
  async function signOut() {
    const client = getSupabase();
    if (client) {
      try {
        await client.auth.signOut();
      } catch (err) {
        console.warn('[GamzaAuth] signOut error:', err);
      }
    }

    currentUser = null;
    pendingAction = null;
    updateHeaderUI(null);
    showToast('🥔 안전하게 로그아웃되었습니다.');
  }

  /**
   * Setup Event Listeners
   */
  function setupEventListeners() {
    // 탭 전환 버튼
    if (el.tabSignIn) {
      el.tabSignIn.addEventListener('click', () => setAuthMode('signin'));
    }
    if (el.tabSignUp) {
      el.tabSignUp.addEventListener('click', () => setAuthMode('signup'));
    }

    // 하단 텍스트 링크 전환
    if (el.btnSwitchMode) {
      el.btnSwitchMode.addEventListener('click', () => {
        setAuthMode(currentMode === 'signin' ? 'signup' : 'signin');
      });
    }

    // 닉네임 추천 버튼
    if (el.btnRandomNick && el.inputNickname) {
      el.btnRandomNick.addEventListener('click', () => {
        el.inputNickname.value = generateRandomPotatoNickname();
        el.inputNickname.focus();
      });
    }

    // 비밀번호 보이기/숨기기 토글
    if (el.btnTogglePassword && el.inputPassword) {
      el.btnTogglePassword.addEventListener('click', () => {
        const isPwd = el.inputPassword.type === 'password';
        el.inputPassword.type = isPwd ? 'text' : 'password';
        el.btnTogglePassword.textContent = isPwd ? '🙈' : '👁️';
      });
    }

    // 닫기 버튼 및 백드롭 클릭
    if (el.closeBtn) {
      el.closeBtn.addEventListener('click', closeAuthModal);
    }
    if (el.backdrop) {
      el.backdrop.addEventListener('click', closeAuthModal);
    }

    // ESC 키로 닫기
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && el.modal && el.modal.classList.contains('is-open')) {
        closeAuthModal();
      }
    });

    // 폼 제출
    if (el.form) {
      el.form.addEventListener('submit', handleAuthSubmit);
    }

    // [로그인] 버튼 클릭
    if (el.btnLogin) {
      el.btnLogin.addEventListener('click', (e) => {
        e.preventDefault();
        openAuthModal('signin');
      });
    }

    // [로그아웃] 버튼 클릭
    if (el.btnLogout) {
      el.btnLogout.addEventListener('click', (e) => {
        e.preventDefault();
        signOut();
      });
    }
  }

  /**
   * Initialize Gamza Auth System
   */
  async function initAuth() {
    if (isInitialized) return;
    bindElements();
    setupEventListeners();

    const client = getSupabase();
    if (!client) {
      console.warn('[GamzaAuth] Client not available during init.');
      updateHeaderUI(null);
      isInitialized = true;
      return;
    }

    // 1. Initial Session Restore
    try {
      const { data: { session }, error } = await client.auth.getSession();
      if (!error && session && session.user) {
        console.log('🥔 [GamzaAuth] Restoring session for user:', session.user.email);
        await syncUserProfile(session.user);
      } else {
        updateHeaderUI(null);
      }
    } catch (sessionErr) {
      console.warn('[GamzaAuth] Session restore error:', sessionErr);
      updateHeaderUI(null);
    }

    // 2. Auth State Change Listener
    client.auth.onAuthStateChange(async (event, session) => {
      console.log('🥔 [GamzaAuth] Auth state change event:', event);
      if (event === 'SIGNED_IN' && session?.user) {
        await syncUserProfile(session.user);
      } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        updateHeaderUI(null);
      }
    });

    isInitialized = true;
    console.log('🥔 [GamzaAuth] Auth module initialized successfully.');
  }

  // Export Public API
  window.GamzaAuth = {
    initAuth,
    openLoginModal: (msg) => openAuthModal('signin', msg),
    openSignupModal: (msg) => openAuthModal('signup', msg),
    closeAuthModal,
    signOut,
    isLoggedIn: () => Boolean(currentUser && currentUser.id),
    getCurrentUserProfile: () => currentUser,
    setPendingAction: (fn) => { pendingAction = fn; },
    executePendingAction,
    generateRandomPotatoNickname
  };

  // Auto-init on DOMContentLoaded if ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
  } else {
    initAuth();
  }

})(window, document);
