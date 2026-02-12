/**
 * User ID Guard - Bảo vệ dữ liệu giữa các users
 * Tự động phát hiện khi user đổi và xóa sync data của user cũ
 */

let lastKnownUserId = null;
let checkInterval = null;

/**
 * Get current userId from localStorage
 */
function getCurrentUserId() {
  if (typeof window === "undefined") return null;
  try {
    const savedUser = localStorage.getItem('auth_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      return user?.id ?? user?.userId ?? null;
    }
  } catch (error) {
    console.error('[UserIdGuard] Error getting userId:', error);
  }
  return null;
}

/**
 * Clear all sync data for a specific user
 */
function clearUserSyncData(userId) {
  if (typeof window === "undefined") return;
  
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('_sync_user_') || 
        key.includes('finmaster_last_sync_user_') ||
        (userId && key.includes(`_user_${userId}`))
      )) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`[UserIdGuard] Cleared ${keysToRemove.length} sync keys for user ${userId || 'unknown'}`);
  } catch (error) {
    console.error('[UserIdGuard] Error clearing sync data:', error);
  }
}

/**
 * Check if userId has changed
 */
function checkUserIdChange() {
  const currentUserId = getCurrentUserId();
  
  // Nếu không có user (logged out), clear lastKnownUserId
  if (!currentUserId) {
    if (lastKnownUserId) {
      console.log('[UserIdGuard] User logged out, clearing sync data');
      clearUserSyncData(lastKnownUserId);
      lastKnownUserId = null;
    }
    return;
  }
  
  // Nếu userId thay đổi (switch user)
  if (lastKnownUserId && lastKnownUserId !== currentUserId) {
    console.warn('[UserIdGuard] ⚠️ DETECTED USER CHANGE!', {
      old: lastKnownUserId,
      new: currentUserId
    });
    
    // CRITICAL: Clear sync data của user cũ
    clearUserSyncData(lastKnownUserId);
    
    // Reload page để reset tất cả state
    console.log('[UserIdGuard] Reloading page to clear all state...');
    window.location.reload();
  }
  
  // Update lastKnownUserId
  lastKnownUserId = currentUserId;
}

/**
 * Start monitoring userId changes
 */
export function startUserIdGuard() {
  if (typeof window === "undefined") return;
  
  // Initialize with current userId
  lastKnownUserId = getCurrentUserId();
  console.log('[UserIdGuard] Started monitoring userId:', lastKnownUserId);
  
  // Check every 1 second
  if (checkInterval) {
    clearInterval(checkInterval);
  }
  
  checkInterval = setInterval(checkUserIdChange, 1000);
  
  // Also listen to storage events (for other tabs)
  window.addEventListener('storage', (e) => {
    if (e.key === 'auth_user' || e.key === 'auth_token') {
      console.log('[UserIdGuard] Storage change detected:', e.key);
      checkUserIdChange();
    }
  });
}

/**
 * Stop monitoring userId changes
 */
export function stopUserIdGuard() {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
  console.log('[UserIdGuard] Stopped monitoring');
}

/**
 * Validate current operation belongs to current user
 */
export function validateCurrentUser(operationName = 'operation') {
  const currentUserId = getCurrentUserId();
  
  if (!currentUserId) {
    console.warn(`[UserIdGuard] ${operationName} - No userId, rejecting`);
    return false;
  }
  
  if (lastKnownUserId && lastKnownUserId !== currentUserId) {
    console.error(`[UserIdGuard] ${operationName} - userId mismatch!`, {
      lastKnown: lastKnownUserId,
      current: currentUserId
    });
    return false;
  }
  
  return true;
}

/**
 * Force clear all sync data (emergency use)
 */
export function forceClearAllSyncData() {
  if (typeof window === "undefined") return;
  
  const currentUserId = getCurrentUserId();
  console.warn('[UserIdGuard] Force clearing ALL sync data for user:', currentUserId);
  clearUserSyncData(currentUserId);
  
  // Also clear timestamp keys
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('_sync_') || key.includes('finmaster_last_sync'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log('[UserIdGuard] Force cleared', keysToRemove.length, 'total sync keys');
  } catch (error) {
    console.error('[UserIdGuard] Error force clearing:', error);
  }
}
