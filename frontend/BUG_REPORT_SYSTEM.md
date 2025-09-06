# Bug Report System

## Overview

The Bug Report System is a comprehensive solution that allows users to report bugs and issues directly from the website. It includes a floating bug button, screenshot capture functionality, and a complete admin management interface.

## Features

### User Features
- **Floating Bug Button**: Red bug icon in the bottom-right corner of all pages
- **Screenshot Capture**: Automatic screenshot capture when reporting bugs
- **Bug Report Form**: Comprehensive form with title, description, category, and priority
- **Real-time Feedback**: Toast notifications for successful submissions

### Admin Features
- **Bug Report Management**: View, filter, and manage all bug reports
- **Status Management**: Update bug status (Open, In Progress, Resolved, Closed, Archived)
- **Assignment System**: Assign bugs to specific team members
- **Comment System**: Add internal comments and notes
- **Filtering & Search**: Advanced filtering by status, priority, category, and text search
- **Archive System**: Archive resolved bugs for future reference

## Database Schema

### Tables

#### `bug_reports`
- `id`: Unique identifier (CUID)
- `title`: Bug title (required)
- `description`: Detailed description (required)
- `screenshot`: Base64 encoded screenshot (optional)
- `status`: Bug status enum (OPEN, IN_PROGRESS, RESOLVED, CLOSED, ARCHIVED)
- `priority`: Priority level enum (LOW, MEDIUM, HIGH, CRITICAL)
- `category`: Bug category (UI/UX, Functionality, Performance, Payment, Booking, Other)
- `reporter_id`: Reference to user who reported the bug
- `assigned_to`: Reference to assigned team member
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp
- `resolved_at`: Resolution timestamp
- `archived_at`: Archive timestamp

#### `bug_comments`
- `id`: Unique identifier (CUID)
- `content`: Comment text
- `author_id`: Reference to comment author
- `bug_report_id`: Reference to bug report
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

## API Endpoints

### Public Endpoints

#### `POST /api/bug-reports`
Submit a new bug report
```json
{
  "title": "Bug Title",
  "description": "Bug description",
  "screenshot": "base64_image_data",
  "category": "UI/UX",
  "priority": "MEDIUM"
}
```

### Admin Endpoints

#### `GET /api/admin/bug-reports`
Fetch bug reports with optional filters
- Query params: `status`, `priority`, `category`, `search`

#### `PATCH /api/admin/bug-reports/[id]/status`
Update bug report status
```json
{
  "status": "IN_PROGRESS"
}
```

#### `PATCH /api/admin/bug-reports/[id]/assign`
Assign bug to team member
```json
{
  "assigneeId": "user_id"
}
```

#### `POST /api/admin/bug-reports/[id]/comments`
Add comment to bug report
```json
{
  "content": "Internal comment"
}
```

#### `PATCH /api/admin/bug-reports/[id]/archive`
Archive bug report

## Components

### `BugReportButton`
- Floating bug button component
- Screenshot capture functionality
- Bug report form modal
- Form validation and submission

### `BugReportManagement`
- Admin interface for managing bug reports
- Status updates and assignment
- Comment system
- Advanced filtering and search
- Archive functionality

## Installation & Setup

### 1. Database Migration
Run the migration to create the required tables:
```bash
# Apply the migration
supabase db push
```

### 2. Component Integration
The bug report button is automatically included in:
- Main app layout (floating button)
- Account page (information section)

### 3. Admin Access
Bug report management is available in the admin dashboard under the "Bug Reports" tab.

## Usage

### For Users
1. Click the red bug icon in the bottom-right corner
2. Fill out the bug report form
3. Optionally capture a screenshot
4. Submit the report

### For Admins
1. Access the admin dashboard
2. Navigate to "Bug Reports" tab
3. View, filter, and manage bug reports
4. Update status, assign bugs, and add comments
5. Archive resolved bugs

## Security Features

- **Row Level Security (RLS)**: Users can only see their own bug reports
- **Admin Access Control**: Only admin users can manage all bug reports
- **Input Validation**: Server-side validation for all inputs
- **Authentication Required**: All endpoints require valid authentication

## Customization

### Adding New Categories
Update the category options in:
- `BugReportButton.tsx` (user form)
- `BugReportManagement.tsx` (admin filters)
- Database migration

### Modifying Priorities
Update the priority enum in:
- Database schema
- Component interfaces
- API validation

### Styling
The system uses the existing design system and can be customized through:
- Tailwind CSS classes
- Design system tokens
- Component variants

## Troubleshooting

### Common Issues

1. **Screenshot not capturing**: Check browser permissions and console for errors
2. **Form not submitting**: Verify user authentication and API endpoint availability
3. **Admin access denied**: Ensure user has admin role in profiles table
4. **Database errors**: Check migration status and table creation

### Debug Mode
Enable console logging for debugging:
- Check browser console for API errors
- Verify database connections
- Test API endpoints independently

## Future Enhancements

- **Email Notifications**: Automatic notifications for new bugs and status changes
- **File Attachments**: Support for multiple file types beyond screenshots
- **Bug Templates**: Predefined bug report templates for common issues
- **Integration**: Connect with external issue tracking systems
- **Analytics**: Bug report analytics and trend analysis
- **Mobile App**: Native mobile app for bug reporting

## Support

For technical support or questions about the bug report system, please contact the development team or refer to the project documentation.
