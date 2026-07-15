# Admin Portal - API Integration Status

## Overview
Current status of API integration for admin portal pages. Backend endpoints exist and are ready.

---

## ✅ COMPLETED

### 1. Authentication
- ✅ Admin login (`/admin/auth/login`)
- ✅ MFA verification (`/admin/auth/verify-mfa`)
- ✅ Token refresh (`/admin/auth/refresh`)
- ✅ Logout (`/admin/auth/logout`)
- ✅ Get profile (`/admin/auth/me`)

### 2. Users Page (`/users`)
- ✅ Fetches users from `/admin/users` API
- ✅ Uses `useUsers` hook with real API
- ✅ Role filtering works
- ✅ Status filtering works
- ✅ Change role mutation connected
- **Status**: Fully integrated ✅

### 3. Organisations Page (`/organisations`)
- ✅ Fetches organisations from `/organisations` API
- ✅ Uses `useOrganisations` hook with real API
- ✅ Create organisation modal exists
- **Status**: Fully integrated ✅

### 4. Datasets Page (`/datasets`)
- ✅ Fetches datasets from `/datasets` API
- ✅ Uses `useDatasets` hook with real API
- ✅ Status filtering works (submitted, under_review, etc.)
- ✅ Search functionality works
- ✅ Data transformation via adapter
- **Status**: Fully integrated ✅

---

## ⚠️ NEEDS API INTEGRATION

### 1. Dashboard Page (`/` - admin home)
**Current Status**: Using mock data
**Backend Endpoint Available**: ✅ `GET /admin/dashboard/stats`

**What needs to be done**:
- Replace `getPlatformKPIs()` with API call to `/admin/dashboard/stats`
- Replace `getReviewQueue()` with API call to `/admin/review-queue`
- Replace `getActivityFeed()` with API call to audit logs or activity endpoint
- Replace `getSystemHealth()` with real health check endpoint

**Mock functions to replace**:
```typescript
// Current:
getPlatformKPIs()     // Mock data
getReviewQueue()      // Mock data
getActivityFeed()     // Mock data
getSystemHealth()     // Mock data

// Should use:
adminApi.getDashboardStats()      // GET /admin/dashboard/stats
adminApi.getReviewQueue()         // GET /admin/review-queue
adminApi.getAuditLogs()          // GET /admin/audit-logs
// System health - TBD (may need new endpoint)
```

**Files to update**:
- `app/(admin)/page.tsx`
- Create `lib/hooks/useDashboard.ts` (optional)

---

### 2. Audit Logs Page (`/audit-logs`)
**Current Status**: Using mock data
**Backend Endpoints Available**: 
- ✅ `GET /admin/audit-logs` (with filters)
- ✅ `GET /admin/audit-logs/export` (CSV export)

**What needs to be done**:
- Replace `getAuditLog()` with API call to `/admin/audit-logs`
- Wire up CSV export button to `/admin/audit-logs/export`
- Add filters: userId, action, entityType, dateRange
- Pagination already works with `Pagination` component

**Mock functions to replace**:
```typescript
// Current:
getAuditLog({ action, query, page, pageSize })  // Mock data

// Should use:
adminApi.getAuditLogs({ action, search, userId, page, limit })
adminApi.exportAuditLogs({ filters })
```

**Files to update**:
- `app/(admin)/audit-logs/page.tsx`
- `lib/api/admin.ts` - add audit log methods if missing
- Create `lib/hooks/useAuditLogs.ts` (optional)

---

### 3. Analytics Page (`/analytics`)
**Current Status**: Using mock data
**Backend Endpoint**: ⚠️ **NEEDS TO BE BUILT**

**What's missing in backend**:
- No `/admin/analytics` endpoint exists yet
- Dashboard stats endpoint has some data but not enough for full analytics

**What needs to be built (Backend)**:
```typescript
GET /admin/analytics
Response: {
  kpis: {
    totalUsers: number;
    totalDatasets: number;
    downloadsThisMonth: number;
    pendingReview: number;
  },
  uploadsOverTime: Array<{ date: string; count: number }>,
  newUsersOverTime: Array<{ date: string; count: number }>,
  downloadsByDataset: Array<{ dataset: string; downloads: number }>,
  // Optional:
  downloadsByMonth: Array<{ month: string; count: number }>,
  usersByOrganisation: Array<{ org: string; users: number }>,
}
```

**What needs to be done (Frontend)**:
- Wait for backend endpoint
- Replace `getAdminAnalytics()` with real API call
- Wire up date range filter
- Wire up CSV export

**Mock functions to replace**:
```typescript
// Current:
getAdminAnalytics()  // Mock data

// Should use:
adminApi.getAnalytics({ range: '6m' })
```

**Files to update**:
- `app/(admin)/analytics/page.tsx`
- `lib/api/admin.ts` - add analytics methods
- Backend: Create analytics service and controller

---

## 📊 Summary

| Page | API Integration | Notes |
|------|----------------|-------|
| Login | ✅ Complete | Using `/admin/auth/*` |
| Users | ✅ Complete | Using `/admin/users` |
| Organisations | ✅ Complete | Using `/organisations` |
| Datasets | ✅ Complete | Using `/datasets` + `/admin/review-queue` |
| Dashboard | ⚠️ Partial | Needs `/admin/dashboard/stats` integration |
| Audit Logs | ❌ Mock Data | Backend ready, needs frontend integration |
| Analytics | ❌ Mock Data | Backend endpoint doesn't exist yet |

---

## 🎯 Priority Order

### High Priority (Core Admin Functions)
1. **Audit Logs** - Backend ready, just needs wiring
2. **Dashboard Stats** - Backend ready, just needs wiring

### Medium Priority (Nice to Have)
3. **Analytics** - Requires new backend endpoint

---

## 📝 Implementation Plan

### Phase 1: Audit Logs Integration (1-2 hours)
1. Create `lib/api/admin.ts` methods:
   - `getAuditLogs(params)`
   - `exportAuditLogs(params)`
2. Create `lib/hooks/useAuditLogs.ts`
3. Update `app/(admin)/audit-logs/page.tsx`
4. Test filters and pagination
5. Test CSV export

### Phase 2: Dashboard Integration (1-2 hours)
1. Create `lib/api/admin.ts` methods:
   - `getDashboardStats()`
   - `getReviewQueue(params)`
2. Create `lib/hooks/useDashboard.ts`
3. Update `app/(admin)/page.tsx`
4. Test KPIs display
5. Test review queue preview

### Phase 3: Analytics Backend (3-4 hours - Backend work)
1. Create `AdminAnalyticsService` in backend
2. Implement analytics queries:
   - Uploads over time
   - New users over time
   - Downloads by dataset
   - Monthly aggregations
3. Create `/admin/analytics` endpoint
4. Add CSV export for analytics

### Phase 4: Analytics Frontend (1 hour)
1. Create `lib/api/admin.ts` analytics methods
2. Create `lib/hooks/useAnalytics.ts`
3. Update `app/(admin)/analytics/page.tsx`
4. Test charts and export

---

## 🔧 Backend Endpoints Reference

### Available:
```
POST   /admin/auth/login
POST   /admin/auth/verify-mfa
POST   /admin/auth/refresh
POST   /admin/auth/logout
GET    /admin/auth/me

GET    /admin/users
GET    /admin/users/stats
GET    /admin/users/:id
PATCH  /admin/users/:id/role
PATCH  /admin/users/:id/status

GET    /admin/review-queue
POST   /admin/datasets/:id/approve
POST   /admin/datasets/:id/reject
POST   /admin/datasets/:id/revise

GET    /admin/audit-logs
GET    /admin/audit-logs/export

GET    /admin/dashboard/stats
```

### Missing (needs to be built):
```
GET    /admin/analytics
GET    /admin/analytics/export
GET    /health  (system health check)
```

---

## 📂 Files That Need Updates

### Frontend Files:
1. `lib/api/admin.ts` - Add missing API methods
2. `lib/hooks/useDashboard.ts` - New file
3. `lib/hooks/useAuditLogs.ts` - New file
4. `app/(admin)/page.tsx` - Replace mock data
5. `app/(admin)/audit-logs/page.tsx` - Replace mock data
6. `app/(admin)/analytics/page.tsx` - Replace mock data (after backend ready)

### Backend Files (for Analytics):
1. `src/modules/admin/admin-analytics.service.ts` - New file
2. `src/modules/admin/admin.controller.ts` - Add analytics endpoint
3. `src/modules/admin/dto/analytics.dto.ts` - New file

---

## ✅ Next Steps

**Ready to implement now:**
1. Audit Logs integration (backend ready)
2. Dashboard integration (backend ready)

**Needs backend work first:**
3. Analytics endpoint (then frontend integration)

Would you like me to start with Phase 1 (Audit Logs) or Phase 2 (Dashboard)?
