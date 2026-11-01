/**
 * ============================================================================
 * Gamza Market - Supabase Client Bridge (shared/supabase_client.js)
 * Privacy-Preserving Cloud Database Integration
 * ============================================================================
 */

(function (window) {
  'use strict';

  // Supabase Project Credentials (Anon Public Key)
  const SUPABASE_URL = 'https://hgxwwflcvwowowrsqnah.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhneHd3Zmxjdndvd293cnNxbmFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM0NzMzNjksImV4cCI6MjEwOTA0OTM2OX0.QQe94qdEvo9t-ChO_RwpEBNCS4qBTYm6rAsv_L-ngjo';

  // Initialize Supabase Client instance
  let client = null;
  if (window.supabase && typeof window.supabase.createClient === 'function') {
    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } else {
    console.warn('[GamzaSupabase] Supabase JS SDK not detected on window. Fallback to mock data.');
  }

  // Local Anonymous User Profile ID in browser localStorage
  const LOCAL_USER_KEY = 'gamza_local_user_profile';

  /**
   * Relative time formatting helper (e.g. "방금 전", "10분 전", "2시간 전", "어제")
   */
  function formatTimeAgo(isoString) {
    if (!isoString) return '방금 전';
    try {
      const past = new Date(isoString).getTime();
      const now = Date.now();
      const diffSec = Math.max(0, Math.floor((now - past) / 1000));
      if (diffSec < 60) return '방금 전';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}분 전`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return `${diffHour}시간 전`;
      const diffDay = Math.floor(diffHour / 24);
      if (diffDay === 1) return '어제';
      if (diffDay < 30) return `${diffDay}일 전`;
      const diffMonth = Math.floor(diffDay / 30);
      return `${diffMonth}달 전`;
    } catch {
      return '방금 전';
    }
  }

  /**
   * Get or automatically create an anonymous profile for current client
   */
  async function getOrCreateLocalUserProfile() {
    if (!client) return null;

    try {
      let savedProfile = null;
      const raw = localStorage.getItem(LOCAL_USER_KEY);
      if (raw) {
        try {
          savedProfile = JSON.parse(raw);
        } catch {
          savedProfile = null;
        }
      }

      if (savedProfile && savedProfile.id) {
        // Verify existence in DB
        const { data, error } = await client
          .from('user_profiles')
          .select('*')
          .eq('id', savedProfile.id)
          .maybeSingle();

        if (data && !error) {
          return data;
        }
      }

      // Generate friendly anonymous potato nickname
      const adjectives = ['포슬포슬한', '따끈따끈한', '말랑말랑한', '달콤바삭한', '행복한', '용감한', '골든'];
      const nouns = ['감자', '알감자', '왕감자', '구황작물', '감자튀김', '찐감자', '감자칩'];
      const randomNick = `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}_${Math.floor(100 + Math.random() * 900)}`;

      const newProfile = {
        nickname: randomNick,
        profile_img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        activity_location: '역삼1동',
        potato_temp: 36.5
      };

      const { data: inserted, error: insertError } = await client
        .from('user_profiles')
        .insert(newProfile)
        .select()
        .single();

      if (insertError) {
        console.warn('[GamzaSupabase] Profile creation failed, using default fallback profile:', insertError);
        // Fallback to first existing seed user
        const { data: seedUser } = await client.from('user_profiles').select('*').limit(1).single();
        return seedUser;
      }

      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(inserted));
      return inserted;
    } catch (err) {
      console.error('[GamzaSupabase] getOrCreateLocalUserProfile error:', err);
      return null;
    }
  }

  /**
   * Map Supabase record to Frontend Product View Model
   */
  function mapToProductViewModel(record) {
    const profile = record.user_profiles || {};
    return {
      id: record.id,
      title: record.title,
      category: record.category,
      price: Number(record.price) || 0,
      location: record.location,
      timeAgo: formatTimeAgo(record.created_at),
      status: record.status,
      imageUrl: record.image_url,
      description: record.description,
      seller: {
        id: record.seller_id,
        name: profile.nickname || '익명 이웃',
        profileImg: profile.profile_img || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        location: profile.activity_location || record.location || '역삼동',
        potatoTemp: profile.potato_temp ? `${Number(profile.potato_temp).toFixed(1)}℃` : '36.5℃'
      },
      likes: Number(record.likes_count) || 0,
      createdAt: record.created_at,
      rawRecord: record
    };
  }

  /**
   * Fetch all products from Supabase
   */
  async function fetchProducts() {
    if (!client) {
      console.warn('[GamzaSupabase] No client, returning null');
      return null;
    }

    try {
      const { data, error } = await client
        .from('products')
        .select(`
          id,
          seller_id,
          title,
          category,
          price,
          location,
          status,
          image_url,
          description,
          likes_count,
          created_at,
          user_profiles (
            id,
            nickname,
            profile_img,
            activity_location,
            potato_temp
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[GamzaSupabase] fetchProducts error:', error);
        return null;
      }

      return data.map(mapToProductViewModel);
    } catch (err) {
      console.error('[GamzaSupabase] fetchProducts unexpected error:', err);
      return null;
    }
  }

  /**
   * Insert a new product into Supabase
   */
  async function createProduct(inputData) {
    if (!client) {
      console.warn('[GamzaSupabase] No client, simulating local product');
      return {
        ...inputData,
        id: Date.now(),
        timeAgo: '방금 전'
      };
    }

    try {
      let sellerId = null;
      let userProfile = null;

      // 1) 로그인된 회원 프로필 우선 조회 (window.GamzaAuth)
      if (window.GamzaAuth && typeof window.GamzaAuth.getCurrentUserProfile === 'function') {
        userProfile = window.GamzaAuth.getCurrentUserProfile();
        if (userProfile && userProfile.id) {
          sellerId = userProfile.id;
        }
      }

      // 2) 세션에서 직접 유저 조회
      if (!sellerId) {
        try {
          const { data: authData } = await client.auth.getUser();
          if (authData && authData.user) {
            sellerId = authData.user.id;
            const { data: p } = await client.from('user_profiles').select('*').eq('id', sellerId).maybeSingle();
            if (p) userProfile = p;
          }
        } catch (e) {
          console.warn('[GamzaSupabase] auth.getUser error:', e);
        }
      }

      // 3) 비로그인 게스트인 경우 로컬 익명 프로필 폴백
      if (!sellerId) {
        userProfile = await getOrCreateLocalUserProfile();
        sellerId = userProfile ? userProfile.id : 'a1111111-1111-1111-1111-111111111111';
      }

      // 데이터베이스 외래키 정합성 보장을 위해 user_profiles 등록 확인
      if (sellerId && userProfile) {
        try {
          await client.from('user_profiles').upsert({
            id: sellerId,
            nickname: userProfile.nickname || '익명 감자',
            activity_location: userProfile.activity_location || inputData.location || '역삼1동',
            potato_temp: userProfile.potato_temp || 36.5,
            profile_img: userProfile.profile_img || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
          }, { onConflict: 'id' });
        } catch (upsertErr) {
          console.warn('[GamzaSupabase] user_profiles upsert note:', upsertErr);
        }
      }

      const rowToInsert = {
        seller_id: sellerId,
        title: inputData.title,
        category: inputData.category,
        price: Number(inputData.price) || 0,
        location: inputData.location || (userProfile && userProfile.activity_location) || '강남구 역삼1동',
        status: inputData.status || '판매중',
        image_url: inputData.imageUrl || inputData.image_url,
        description: inputData.description || '',
        likes_count: 0
      };

      const { data, error } = await client
        .from('products')
        .insert(rowToInsert)
        .select(`
          id,
          seller_id,
          title,
          category,
          price,
          location,
          status,
          image_url,
          description,
          likes_count,
          created_at,
          user_profiles (
            id,
            nickname,
            profile_img,
            activity_location,
            potato_temp
          )
        `)
        .single();

      if (error) {
        console.error('[GamzaSupabase] createProduct error:', error);
        throw error;
      }

      console.log('🥔 [GamzaSupabase] Product saved in Supabase with author:', data.user_profiles?.nickname, data);
      return mapToProductViewModel(data);
    } catch (err) {
      console.error('[GamzaSupabase] createProduct failed:', err);
      throw err;
    }
  }

  /**
   * Increment or decrement likes count for a product
   */
  async function updateLikesCount(productId, newCount) {
    if (!client || !productId) return;

    try {
      const { error } = await client
        .from('products')
        .update({ likes_count: Math.max(0, newCount) })
        .eq('id', productId);

      if (error) {
        console.error('[GamzaSupabase] updateLikesCount error:', error);
      }
    } catch (err) {
      console.error('[GamzaSupabase] updateLikesCount unexpected error:', err);
    }
  }

  /**
   * Update status of a product (판매중, 예약중, 거래 완료)
   */
  async function updateProductStatus(productId, newStatus) {
    if (!client || !productId) return false;

    try {
      console.log(`🥔 [GamzaSupabase] Updating product #${productId} status to:`, newStatus);
      const { data, error } = await client
        .from('products')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)
        .select()
        .single();

      if (error) {
        console.error('[GamzaSupabase] updateProductStatus error:', error);
        return false;
      }

      console.log(`🥔 [GamzaSupabase] Status successfully updated to '${newStatus}' for product #${productId}`);
      return true;
    } catch (err) {
      console.error('[GamzaSupabase] updateProductStatus unexpected error:', err);
      return false;
    }
  }

  /**
   * Update existing product details in Supabase
   */
  async function updateProduct(productId, updates) {
    if (!client || !productId) return null;

    try {
      console.log(`🥔 [GamzaSupabase] Updating product #${productId}:`, updates);
      const rowToUpdate = {
        title: updates.title,
        category: updates.category,
        price: Number(updates.price) || 0,
        location: updates.location,
        status: updates.status,
        image_url: updates.imageUrl || updates.image_url,
        description: updates.description,
        updated_at: new Date().toISOString()
      };

      // Remove undefined fields
      Object.keys(rowToUpdate).forEach(key => {
        if (rowToUpdate[key] === undefined) delete rowToUpdate[key];
      });

      const { data, error } = await client
        .from('products')
        .update(rowToUpdate)
        .eq('id', productId)
        .select(`
          id,
          seller_id,
          title,
          category,
          price,
          location,
          status,
          image_url,
          description,
          likes_count,
          created_at,
          user_profiles (
            id,
            nickname,
            profile_img,
            activity_location,
            potato_temp
          )
        `)
        .single();

      if (error) {
        console.error('[GamzaSupabase] updateProduct error:', error);
        throw error;
      }

      return mapToProductViewModel(data);
    } catch (err) {
      console.error('[GamzaSupabase] updateProduct failed:', err);
      throw err;
    }
  }

  /**
   * Delete product from Supabase
   */
  async function deleteProduct(productId) {
    if (!client || !productId) return false;

    try {
      console.log(`🥔 [GamzaSupabase] Deleting product #${productId}...`);
      const { error } = await client
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        console.error('[GamzaSupabase] deleteProduct error:', error);
        throw error;
      }

      console.log(`🥔 [GamzaSupabase] Product #${productId} deleted successfully.`);
      return true;
    } catch (err) {
      console.error('[GamzaSupabase] deleteProduct unexpected error:', err);
      throw err;
    }
  }

  // Export public API to window
  window.GamzaSupabase = {
    client,
    formatTimeAgo,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    updateProductStatus,
    updateLikesCount,
    getOrCreateLocalUserProfile
  };

  console.log('🥔 [GamzaSupabase] Supabase Bridge Initialized with project:', SUPABASE_URL);

})(window);
