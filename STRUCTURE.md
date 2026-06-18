content-moderation-platform/
│
├── backend/
│   ├── .env.example                        # Copy to .env and fill in values
│   ├── package.json
│   ├── uploads/                            # Auto-created at runtime — stores uploaded images
│   │
│   └── src/
│       ├── app.js                          # Express entry point — middleware, routes, server start
│       │
│       ├── config/
│       │   └── db.js                       # Mongoose connection
│       │
│       ├── middleware/
│       │   ├── auth.js                     # Reads JWT from HttpOnly cookie, attaches req.user
│       │   ├── requireRole.js              # requireRole('admin') — gates admin routes
│       │   └── upload.js                   # Multer config — memory storage, type/size validation
│       │
│       ├── models/
│       │   ├── User.js                     # email, passwordHash (bcrypt), role
│       │   ├── Policy.js                   # Per-category: enabled, threshold, enforcementBehavior
│       │   ├── PolicySnapshot.js           # Immutable copy of all 6 policies at submission time
│       │   ├── Submission.js               # Grouping envelope for one upload request
│       │   ├── Image.js                    # Core verdict entity — outcome, categoryResults, appeal state
│       │   └── Appeal.js                   # User appeal — justification, status, admin response
│       │
│       ├── routes/
│       │   ├── auth.routes.js              # POST /register  POST /login  POST /logout  GET /me
│       │   ├── submissions.routes.js       # POST /submissions  GET /submissions  GET /submissions/:id
│       │   ├── images.routes.js            # GET /images/:id
│       │   ├── appeals.routes.js           # POST /appeals  GET /appeals/my  GET /appeals/:id
│       │   │
│       │   └── admin/
│       │       ├── appeals.routes.js       # GET /admin/appeals  GET /admin/appeals/:id  PATCH /admin/appeals/:id
│       │       ├── policies.routes.js      # GET /admin/policies  PATCH /admin/policies/:category
│       │       ├── images.routes.js        # GET /admin/images  PATCH /admin/images/:id/verdict
│       │       └── analytics.routes.js     # GET /admin/analytics/overview|volume|categories|appeals|users
│       │
│       ├── services/
│       │   ├── gemini.service.js           # Calls Gemini 2.5 Flash with image + prompt, parses JSON
│       │   └── moderation.service.js       # Applies threshold rules, determines APPROVED/FLAGGED/BLOCKED
│       │
│       └── utils/
│           └── seed.js                     # Seeds 6 default policy documents on startup (idempotent)
│
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js                      # Dev server on :3000, proxy /api and /uploads → :5000
    ├── tailwind.config.js                  # Custom palette: bark, gold, fog, silver, cream
    ├── postcss.config.js
    │
    └── src/
        ├── main.jsx                        # React root mount
        ├── App.jsx                         # BrowserRouter + all route declarations
        ├── index.css                       # Tailwind directives + component classes (btn, card, badge, etc.)
        ├── App.css                         # Empty — intentionally cleared
        │
        ├── api/
        │   └── client.js                   # Axios instance — baseURL /api, withCredentials, 401 interceptor
        │
        ├── context/
        │   └── AuthContext.jsx             # user state, login(), register(), logout(), isAdmin
        │
        ├── components/
        │   ├── ProtectedRoute.jsx          # Auth guard + role guard, shows spinner during load
        │   ├── Layout.jsx                  # Sidebar + main content wrapper
        │   ├── Navbar.jsx                  # Fixed left sidebar — role-aware links, user info, logout
        │   ├── OutcomeBadge.jsx            # Color-coded pill: APPROVED / FLAGGED / BLOCKED / PENDING
        │   ├── CategoryResults.jsx         # Per-category confidence bars + reasoning text
        │   └── Pagination.jsx              # Page controls with ellipsis compression
        │
        └── pages/
            ├── Login.jsx                   # /login
            ├── Register.jsx                # /register
            │
            ├── user/
            │   ├── Dashboard.jsx           # /dashboard        — stat cards + recent images
            │   ├── Submit.jsx              # /submit           — drag-and-drop multi-image upload
            │   ├── SubmissionList.jsx      # /submissions      — paginated history + filters
            │   ├── SubmissionDetail.jsx    # /submissions/:id  — per-image verdict breakdown
            │   └── AppealForm.jsx          # /appeal/:imageId  — justification form
            │
            └── admin/
                ├── AppealQueue.jsx         # /admin/appeals         — tabbed queue (pending/accepted/rejected)
                ├── AppealReview.jsx        # /admin/appeals/:id     — full review + accept/reject
                ├── PolicyConfig.jsx        # /admin/policies        — toggle, slider, enforcement per category
                └── Analytics.jsx          # /admin/analytics       — charts, stats, top users
