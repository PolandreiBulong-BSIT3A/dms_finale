# ISPSC Tagudin Campus Document Management System (DMS)
## Simplified System Flowchart

```mermaid
flowchart TD
    Start([User Accesses System]) --> Login{Login Page}
    
    Login --> AuthMethod{Authentication Method}
    AuthMethod -->|Email/Password| EmailAuth[Email & Password Login]
    AuthMethod -->|Google OAuth| GoogleAuth[Google OAuth Login]
    AuthMethod -->|Forgot Password| ForgotPass[Password Recovery Flow]
    
    EmailAuth --> ValidateAuth{Validate Credentials}
    GoogleAuth --> ValidateAuth
    ForgotPass --> ValidateAuth
    
    ValidateAuth -->|Invalid| Login
    ValidateAuth -->|Valid| CheckMaintenance{System Maintenance?}
    
    CheckMaintenance -->|Yes| MaintenancePage[Show Maintenance Page]
    CheckMaintenance -->|No| CheckProfile{Profile Complete?}
    
    CheckProfile -->|No| ProfileBanner[Show Profile Completion Banner]
    CheckProfile -->|Yes| Dashboard[Dashboard]
    ProfileBanner --> Dashboard
    
    Dashboard --> RoleCheck{User Role?}
    
    RoleCheck -->|Admin| AdminMenu[Admin Menu Access]
    RoleCheck -->|Dean| DeanMenu[Dean Menu Access]
    RoleCheck -->|Faculty| FacultyMenu[Faculty Menu Access]
    
    %% Admin & Dean Features
    AdminMenu --> AdminFeatures[Upload Documents<br/>Manage Users<br/>Admin Panel<br/>Reports<br/>All Documents<br/>Requests<br/>Favorites]
    DeanMenu --> DeanFeatures[Upload Documents<br/>Manage Users<br/>Admin Panel<br/>All Documents<br/>Requests<br/>Favorites]
    
    %% Faculty Features
    FacultyMenu --> FacultyFeatures[View Documents<br/>View Users<br/>Requests<br/>Favorites<br/>Profile]
    
    %% Document Management Flow
    AdminFeatures --> DocMgmt[Document Management]
    DeanFeatures --> DocMgmt
    FacultyFeatures --> DocView[Document Viewing]
    
    DocMgmt --> DocActions{Document Action}
    DocActions -->|Upload| UploadDoc[Upload Document<br/>- Set Visibility<br/>- Assign Departments<br/>- Add Actions Required]
    DocActions -->|Update| UpdateDoc[Update Document]
    DocActions -->|Delete| DeleteDoc[Move to Trashcan]
    DocActions -->|View| ViewDoc[View Document Details]
    
    UploadDoc --> NotifyUsers[Create Notifications<br/>via Socket.io]
    UpdateDoc --> NotifyUsers
    DeleteDoc --> NotifyUsers
    
    ViewDoc --> DocDetails[Document Viewer<br/>- Content<br/>- Metadata<br/>- Actions]
    DocView --> DocDetails
    
    DocDetails --> DocActionBtn{Action Button}
    DocActionBtn -->|View in Documents| SwitchTab[Switch to Documents Tab]
    DocActionBtn -->|Download| DownloadFile[Download File]
    DocActionBtn -->|Close| DocDetails
    
    %% Request Management Flow
    AdminFeatures --> RequestMgmt[Request Management]
    DeanFeatures --> RequestMgmt
    FacultyFeatures --> RequestView[View Assigned Requests]
    
    RequestMgmt --> RequestActions{Request Action}
    RequestActions -->|Create Request| CreateRequest[Create Document with Actions]
    RequestActions -->|Reply| ReplyRequest[Reply to Request]
    RequestActions -->|Complete| CompleteRequest[Mark as Completed]
    RequestActions -->|View| ViewRequest[View Request Details]
    
    CreateRequest --> AssignActions[Assign Actions to Users/Roles/Departments]
    AssignActions --> NotifyUsers
    
    %% User Management Flow
    AdminFeatures --> UserMgmt[User Management]
    DeanFeatures --> UserMgmt
    
    UserMgmt --> UserActions{User Action}
    UserActions -->|Create| CreateUser[Create New User]
    UserActions -->|Update| UpdateUser[Update User Info]
    UserActions -->|Delete| DeleteUser[Move to Trashcan]
    UserActions -->|View| ViewUser[View User Profile]
    
    %% Announcements Flow
    Dashboard --> Announcements[Announcements Tab]
    Announcements --> AnnounceActions{Action}
    AnnounceActions -->|View| ViewAnnounce[View Announcements]
    AnnounceActions -->|Create| CreateAnnounce[Create Announcement<br/>Admin/Dean Only]
    
    %% Notifications Flow
    NotifyUsers --> SocketIO[Socket.io Real-time]
    SocketIO --> NotificationDisplay[Display Notification<br/>in Navbar]
    NotificationDisplay --> NotificationClick{User Clicks}
    NotificationClick -->|View| NavigateToDoc[Navigate to Related Document]
    NotificationClick -->|Dismiss| DismissNotif[Dismiss Notification]
    
    %% Favorites Flow
    AdminFeatures --> Favorites[Favorites]
    DeanFeatures --> Favorites
    FacultyFeatures --> Favorites
    
    Favorites --> FavActions{Action}
    FavActions -->|Add| AddFavorite[Add Document to Favorites]
    FavActions -->|Remove| RemoveFavorite[Remove from Favorites]
    FavActions -->|View| ViewFavorites[View Favorite Documents]
    
    %% Reports & Analytics Flow
    AdminFeatures --> Reports[Reports & Analytics]
    Reports --> GenerateReport[Generate Reports<br/>- Document Statistics<br/>- User Activity<br/>- Department Analytics]
    GenerateReport --> StreamlitApp[External Streamlit Analytics App]
    
    %% Profile Management
    AdminMenu --> Profile[Profile Management]
    DeanMenu --> Profile
    FacultyMenu --> Profile
    
    Profile --> ProfileActions{Action}
    ProfileActions -->|View| ViewProfile[View Profile]
    ProfileActions -->|Update| UpdateProfile[Update Profile Info<br/>- Department<br/>- Contact Number<br/>- Profile Picture]
    
    %% Trashcan Flow
    DeleteDoc --> Trashcan[Document Trashcan]
    DeleteUser --> UserTrash[User Trashcan]
    
    Trashcan --> TrashActions{Action}
    TrashActions -->|Restore| RestoreDoc[Restore Document]
    TrashActions -->|Permanent Delete| PermDeleteDoc[Permanently Delete]
    
    UserTrash --> UserTrashActions{Action}
    UserTrashActions -->|Restore| RestoreUser[Restore User]
    UserTrashActions -->|Permanent Delete| PermDeleteUser[Permanently Delete]
    
    %% API Backend Flow
    UploadDoc --> BackendAPI[Backend API<br/>DocumentsAPI.js]
    UpdateDoc --> BackendAPI
    ViewDoc --> BackendAPI
    CreateRequest --> BackendAPI
    
    BackendAPI --> AuthMiddleware[Authentication Middleware]
    AuthMiddleware -->|Valid| Database[(MySQL Database)]
    AuthMiddleware -->|Invalid| Unauthorized[401 Unauthorized]
    
    Database --> Response[API Response]
    Response --> Frontend[Frontend Updates UI]
    
    %% Logout Flow
    Dashboard --> Logout{User Logout?}
    Logout -->|Yes| ClearSession[Clear Session & Cookies]
    ClearSession --> Login
    Logout -->|No| Dashboard
    
    style Start fill:#e1f5ff
    style Login fill:#fff4e1
    style Dashboard fill:#e8f5e9
    style AdminMenu fill:#f3e5f5
    style DeanMenu fill:#e3f2fd
    style FacultyMenu fill:#fff9c4
    style Database fill:#ffebee
    style SocketIO fill:#e0f2f1
    style NotifyUsers fill:#e0f2f1
```

## System Components Overview

### 1. **Authentication Layer**
- Email/Password Login
- Google OAuth Integration
- Password Recovery (OTP-based)
- Session Management
- JWT Token Authentication

### 2. **User Roles & Permissions**
- **Admin**: Full system access (Upload, Manage Users, Admin Panel, Reports)
- **Dean**: Department-level access (Upload, Manage Users, Admin Panel, No Reports)
- **Faculty**: Limited access (View Documents, View Users, Requests, Favorites)

### 3. **Core Modules**

#### **Document Management**
- Upload documents with metadata
- Set visibility (Public, Department-specific, Role-specific, User-specific)
- Multi-folder support
- Document types categorization
- Update/Delete documents
- Soft delete (Trashcan)
- Document viewing with real-time tracking

#### **Request Management**
- Create documents with action requirements
- Assign actions to users/roles/departments
- Reply to requests
- Track request status (Pending, Completed)
- Department-scoped view for Deans/Faculty

#### **User Management**
- Create/Update/Delete users
- Department assignment
- Role management
- Profile management
- User trashcan

#### **Notifications System**
- Real-time notifications via Socket.io
- Scoped notifications (Department, Role, User, Public)
- Notification types: Added, Updated, Requested, Deleted
- In-app notification display

#### **Announcements**
- Create/view announcements
- Visibility scoping
- Real-time updates

#### **Favorites**
- Bookmark documents
- Quick access to favorite documents

#### **Reports & Analytics**
- Document statistics
- User activity tracking
- Department analytics
- External Streamlit integration

### 4. **Technical Stack**

#### **Frontend**
- React.js with React Router
- React Bootstrap
- Context API (User, Document, Notification)
- Socket.io Client for real-time updates
- Protected Routes

#### **Backend**
- Node.js with Express
- MySQL Database
- Socket.io Server
- RESTful API Architecture
- Authentication Middleware
- Maintenance Mode Support

#### **Database Tables**
- `dms_user` - User accounts
- `dms_documents` - Document records
- `document_departments` - Document-department associations
- `document_folders` - Multi-folder support
- `document_views` - View tracking
- `document_actions` - Action assignments
- `notifications` - Notification records
- `departments` - Department data
- `document_types` - Document categories
- `folders` - Folder structure

### 5. **Data Flow**

1. **User Request** → Frontend Component
2. **API Call** → Backend API Endpoint
3. **Authentication Check** → Middleware validates user
4. **Database Query** → MySQL Database
5. **Response** → JSON data returned
6. **UI Update** → React state update
7. **Real-time Notification** → Socket.io broadcast (if applicable)

### 6. **Security Features**
- Protected routes with role-based access
- Authentication middleware
- Session management
- CORS configuration
- Helmet security headers
- Input validation
- SQL injection prevention

### 7. **Special Features**
- Maintenance mode support
- Profile completion reminders
- Responsive design (Mobile/Desktop)
- Document visibility matrix
- Real-time collaboration
- Soft delete with restore capability
- Multi-folder document organization

